#!/usr/bin/env python3
"""Collect official AI update candidates without using paid AI APIs."""

from __future__ import annotations

import argparse
import email.utils
import html
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SOURCES_PATH = DATA / "sources.json"
NEWS_PATH = DATA / "news.json"
INBOX_PATH = DATA / "inbox.json"

TRACKING_PARAMS = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
}

GENERIC_TITLES = {
    "skip to main content",
    "research",
    "business",
    "developers",
    "solutions",
    "customers",
    "contact sales",
    "try studio",
    "about",
    "careers",
    "pricing",
    "docs",
    "documentation",
    "blog",
    "news",
}


@dataclass
class Candidate:
    source: str
    date: str
    title: str
    url: str
    status_hint: str


def today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def load_json(path: Path, fallback: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_url(value: str) -> str:
    parsed = urlparse(value.strip())
    query = [
        (key, val)
        for key, val in parse_qsl(parsed.query, keep_blank_values=True)
        if key.lower() not in TRACKING_PARAMS
    ]
    path = parsed.path.rstrip("/") or "/"
    return urlunparse(
        (
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            path,
            "",
            urlencode(query, doseq=True),
            "",
        )
    )


def is_allowed(url: str, hosts: list[str]) -> bool:
    parsed = urlparse(url)
    if parsed.scheme != "https":
        return False
    host = parsed.netloc.lower()
    return any(host == allowed or host.endswith(f".{allowed}") for allowed in hosts)


def fetch_text(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "AI-Signal-Board/1.0 (+https://github.com/)",
            "Accept": "application/rss+xml, application/atom+xml, text/xml, text/html;q=0.8",
        },
    )
    with urlopen(request, timeout=25) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def parse_date(value: str | None) -> str:
    if not value:
        return today()
    text = value.strip()
    try:
        return email.utils.parsedate_to_datetime(text).date().isoformat()
    except (TypeError, ValueError):
        pass
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S%z"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return today()


def date_from_text(value: str) -> str:
    match = re.search(
        r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4}\b",
        value,
        re.IGNORECASE,
    )
    if not match:
        return today()
    return parse_date(match.group(0))


def tag_name(node: ElementTree.Element) -> str:
    return node.tag.rsplit("}", 1)[-1].lower()


def first_text(node: ElementTree.Element, names: set[str]) -> str:
    for child in node.iter():
        if tag_name(child) in names and child.text:
            return html.unescape(child.text.strip())
    return ""


def first_link(node: ElementTree.Element) -> str:
    for child in node.iter():
        if tag_name(child) != "link":
            continue
        href = child.attrib.get("href")
        if href:
            return href.strip()
        if child.text:
            return child.text.strip()
    return ""


def status_hint(title: str) -> str:
    lowered = title.lower()
    if "deprecated" in lowered or "retire" in lowered or "sunset" in lowered:
        return "deprecated"
    if "beta" in lowered:
        return "beta"
    if "preview" in lowered or "technical preview" in lowered or "limited preview" in lowered:
        return "preview"
    return "stable"


def clean_title(value: str) -> str:
    title = " ".join(value.split())
    leading_meta = re.compile(
        r"^(Product|Announcements|Research|Engineering|Safety|Company|Developers?) "
        r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4} ",
        re.IGNORECASE,
    )
    title = leading_meta.sub("", title)
    marker = re.search(
        r" (Product|Announcements|Research|Engineering|Safety|Company|Developers?) "
        r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4}\b",
        title,
        re.IGNORECASE,
    )
    if marker and marker.start() >= 12:
        title = title[: marker.start()]
    for phrase in (" Today, ", " We’re ", " We're ", " Our latest ", " Introducing "):
        index = title.find(phrase)
        if index > 20:
            title = title[:index]
    if len(title) > 140:
        title = title[:137].rstrip() + "..."
    return title


def matches_keywords(title: str, keywords: list[str] | None) -> bool:
    if not keywords:
        return True
    lowered = title.lower()
    return any(keyword.lower() in lowered for keyword in keywords)


def matches_path(url: str, prefixes: list[str] | None) -> bool:
    if not prefixes:
        return True
    path = urlparse(url).path
    return any(path.startswith(prefix) for prefix in prefixes)


def parse_feed(source: dict[str, Any], text: str) -> list[Candidate]:
    root = ElementTree.fromstring(text)
    entries = [node for node in root.iter() if tag_name(node) in {"item", "entry"}]
    candidates: list[Candidate] = []
    for entry in entries:
        title = clean_title(first_text(entry, {"title"}))
        raw_url = first_link(entry) or first_text(entry, {"guid", "id"})
        if not title or not raw_url:
            continue
        url = normalize_url(raw_url)
        if not is_allowed(url, source["allowedHosts"]):
            continue
        if not matches_path(url, source.get("includePathPrefixes")):
            continue
        if not matches_keywords(title, source.get("includeKeywords")):
            continue
        date = parse_date(first_text(entry, {"pubdate", "published", "updated", "date"}))
        candidates.append(
            Candidate(
                source=source["source"],
                date=date,
                title=title,
                url=url,
                status_hint=status_hint(title),
            )
        )
    return candidates[: int(source.get("limit", 5))]


def parse_html(source: dict[str, Any], text: str) -> list[Candidate]:
    title_link = re.compile(
        r"<a\b[^>]*href=[\"'](?P<href>[^\"']+)[\"'][^>]*>(?P<body>.*?)</a>",
        re.IGNORECASE | re.DOTALL,
    )
    strip_tags = re.compile(r"<[^>]+>")
    seen: set[str] = set()
    candidates: list[Candidate] = []
    for match in title_link.finditer(text):
        raw_title = strip_tags.sub(" ", match.group("body"))
        unescaped = html.unescape(raw_title)
        title = clean_title(unescaped)
        if len(title) < 8 or title.lower() in GENERIC_TITLES:
            continue
        url = normalize_url(urljoin(source["url"], match.group("href")))
        if url in seen or not is_allowed(url, source["allowedHosts"]):
            continue
        if not matches_path(url, source.get("includePathPrefixes")):
            continue
        if not matches_keywords(title, source.get("includeKeywords")):
            continue
        seen.add(url)
        candidates.append(
            Candidate(
                source=source["source"],
                date=date_from_text(unescaped),
                title=title,
                url=url,
                status_hint=status_hint(title),
            )
        )
        if len(candidates) >= int(source.get("limit", 5)):
            break
    return candidates


def collect_candidates(sources: list[dict[str, Any]]) -> list[Candidate]:
    collected: list[Candidate] = []
    for source in sources:
        try:
            text = fetch_text(source["url"])
            if source["kind"] == "feed":
                collected.extend(parse_feed(source, text))
            elif source["kind"] == "html":
                collected.extend(parse_html(source, text))
        except Exception as exc:  # noqa: BLE001 - crawler should continue across sources.
            print(f"warning: skipped {source.get('name', source.get('url'))}: {exc}", file=sys.stderr)
    return collected


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    sources_data = load_json(SOURCES_PATH, {"sources": []})
    news_data = load_json(NEWS_PATH, {"items": []})
    inbox_data = load_json(
        INBOX_PATH,
        {"lastUpdated": today(), "policy": "official-sources-only-unreviewed", "items": []},
    )

    summarized_urls = {
        normalize_url(item["url"]) for item in news_data.get("items", []) if item.get("url")
    }
    inbox_items = inbox_data.get("items", [])
    existing_inbox_urls = {
        normalize_url(item["url"]) for item in inbox_items if item.get("url")
    }

    unresolved = [
        item for item in inbox_items if normalize_url(item.get("url", "")) not in summarized_urls
    ]
    unresolved_urls = {normalize_url(item["url"]) for item in unresolved if item.get("url")}

    added = 0
    for candidate in collect_candidates(sources_data.get("sources", [])):
        normalized = normalize_url(candidate.url)
        if normalized in summarized_urls or normalized in existing_inbox_urls or normalized in unresolved_urls:
            continue
        unresolved.append(
            {
                "source": candidate.source,
                "date": candidate.date,
                "title": candidate.title,
                "url": normalized,
                "statusHint": candidate.status_hint,
                "discoveredAt": today(),
            }
        )
        unresolved_urls.add(normalized)
        added += 1

    unresolved.sort(key=lambda item: (item.get("date", ""), item.get("discoveredAt", "")), reverse=True)
    output = {
        "lastUpdated": today(),
        "policy": "official-sources-only-unreviewed",
        "items": unresolved,
    }

    if args.dry_run:
        print(json.dumps({"added": added, "items": output["items"][:10]}, ensure_ascii=False, indent=2))
        return 0

    previous = json.dumps(inbox_data, ensure_ascii=False, sort_keys=True)
    current = json.dumps(output, ensure_ascii=False, sort_keys=True)
    if previous != current:
        INBOX_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"updated inbox: {added} new candidate(s), {len(output['items'])} unresolved")
    else:
        print("inbox unchanged")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
