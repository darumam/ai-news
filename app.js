(function () {
  const page = document.body.dataset.page;

  const statusLabels = {
    stable: "正式",
    beta: "ベータ",
    preview: "プレビュー",
    deprecated: "終了予定",
    unknown: "未確認",
  };

  const levelLabels = {
    yes: "〇",
    partial: "△",
    no: "×",
  };

  const groupLabels = {
    text: "テキスト・対話",
    media: "画像・動画",
    dev: "開発・API",
    business: "ビジネス",
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.toString() : "";
    } catch (_) {
      return "";
    }
  }

  async function loadJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${path} returned ${response.status}`);
    }
    return response.json();
  }

  function badge(status) {
    const key = status || "unknown";
    return el("span", `status-badge status-${key}`, statusLabels[key] || key);
  }

  function link(url, label) {
    const href = safeUrl(url);
    const anchor = el("a", "", label);
    if (!href) {
      anchor.removeAttribute("href");
      anchor.textContent = "URL未確認";
      return anchor;
    }
    anchor.href = href;
    anchor.rel = "noopener noreferrer";
    return anchor;
  }

  function renderError(target, message) {
    target.replaceChildren(el("p", "empty-state", message));
  }

  function renderNewsCard(item) {
    const article = el("article", `signal-card priority-${item.priority || "medium"}`);
    const top = el("div", "card-topline");
    top.append(el("span", "source", item.source || "未確認"));
    const time = el("time", "", item.date || "");
    if (item.date) time.dateTime = item.date;
    top.append(time);

    const titleRow = el("div", "title-row");
    titleRow.append(el("h2", "", item.title || "無題"));
    titleRow.append(badge(item.status || "stable"));

    const body = el("p", "", item.summary || "");
    const dl = el("dl", "impact-list");
    const category = el("div", "");
    category.append(el("dt", "", "分類"));
    category.append(el("dd", "", item.category || "未分類"));
    const memo = el("div", "");
    memo.append(el("dt", "", "開発者メモ"));
    memo.append(el("dd", "", item.developerNote || "確認事項なし"));
    dl.append(category, memo);

    if (Array.isArray(item.terms) && item.terms.length > 0) {
      const terms = el("div", "");
      terms.append(el("dt", "", "用語解説"));
      terms.append(
        el(
          "dd",
          "",
          item.terms.map((term) => `${term.term}: ${term.meaning}`).join(" / "),
        ),
      );
      dl.append(terms);
    }

    article.append(top, titleRow, body, dl, link(item.url, "公式ソース"));
    return article;
  }

  function renderMustReadItem(item, index) {
    const article = el("article", `must-read-card priority-${item.priority || "medium"}`);
    const number = el("span", "must-read-number", String(index + 1));
    const body = el("div", "");
    const meta = el(
      "p",
      "small-note",
      `${item.date || "-"} / ${item.source || "未確認"} / ${groupLabels[item.group] || item.category || "未分類"}`,
    );
    body.append(meta);
    body.append(el("h3", "", item.title || "無題"));
    body.append(el("p", "", item.summary || ""));
    body.append(link(item.url, "公式"));
    article.append(number, body);
    return article;
  }

  function renderCompactNewsItem(item) {
    const article = el("article", "compact-news-item");
    const top = el("div", "card-topline");
    top.append(el("span", "source", item.source || "未確認"));
    const time = el("time", "", item.date || "");
    if (item.date) time.dateTime = item.date;
    top.append(time);
    article.append(top);
    article.append(el("h3", "", item.title || "無題"));
    article.append(el("p", "", item.summary || ""));
    article.append(link(item.url, "公式"));
    return article;
  }

  function renderHistoryRow(item) {
    const tr = document.createElement("tr");
    const status = el("td", "");
    status.append(badge(item.status || "unknown"));
    [item.date, item.source, item.category].forEach((text) => tr.append(el("td", "", text || "-")));
    tr.append(status);
    tr.append(el("td", "", item.title || "無題"));
    const source = el("td", "");
    source.append(link(item.url, "公式"));
    tr.append(source);
    return tr;
  }

  async function renderNews() {
    const mustRead = document.getElementById("must-read-list");
    const groupList = document.getElementById("group-news-list");
    const history = document.getElementById("news-history");
    try {
      const data = await loadJson("data/news.json");
      const items = [...(data.items || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      document.getElementById("news-updated").textContent = data.lastUpdated || "-";
      document.getElementById("news-count").textContent =
        `${items.length}件 / 公式ソースのみ`;
      const picked = items.filter((item) => item.mustRead).slice(0, 5);
      mustRead.replaceChildren(...picked.map(renderMustReadItem));

      function showGroup(group) {
        const groupItems = items.filter((item) => item.group === group).slice(0, 8);
        if (groupItems.length === 0) {
          renderError(groupList, "この分類のニュースはありません。");
          return;
        }
        groupList.replaceChildren(...groupItems.map(renderCompactNewsItem));
      }

      document.querySelectorAll(".tab-button").forEach((button) => {
        button.addEventListener("click", () => {
          document.querySelectorAll(".tab-button").forEach((node) => node.classList.remove("active"));
          button.classList.add("active");
          showGroup(button.dataset.group);
        });
      });
      showGroup("text");

      if (history) {
        history.replaceChildren(...items.map(renderHistoryRow));
      }
    } catch (_) {
      renderError(mustRead, "ニュースを読み込めませんでした。GitHub Pages上で再確認してください。");
    }
  }

  async function renderFeatureNews() {
    const list = document.getElementById("feature-news-list");
    try {
      const data = await loadJson("data/news.json");
      const items = [...(data.items || [])]
        .filter((item) => item.type === "feature")
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      document.getElementById("feature-news-updated").textContent = data.lastUpdated || "-";
      document.getElementById("feature-news-count").textContent = `${items.length}件`;
      if (items.length === 0) {
        renderError(list, "機能追加ニュースはありません。");
        return;
      }
      list.replaceChildren(...items.map(renderNewsCard));
    } catch (_) {
      renderError(list, "機能追加ニュースを読み込めませんでした。");
    }
  }

  function renderCatalogCard(item) {
    const article = el("article", "feature-card");
    article.append(el("h3", "", item.name || "無題"));
    return article;
  }

  function renderCapabilityCell(value) {
    const level = value?.level || "no";
    const td = el("td", `capability-cell capability-${level}`);
    td.append(el("span", "capability-mark", levelLabels[level] || "?"));
    return td;
  }

  function renderProviderRow(provider, capabilities) {
    const tr = document.createElement("tr");
    const name = el("td", "provider-cell");
    name.append(el("strong", "", provider.provider || "未確認"));
    name.append(badge(provider.status || "unknown"));
    name.append(link(provider.sourceUrl, "公式"));
    tr.append(name);
    capabilities.forEach((capability) => {
      tr.append(renderCapabilityCell(provider.values?.[capability]));
    });
    return tr;
  }

  async function renderFeatures() {
    const catalog = document.getElementById("feature-catalog");
    const head = document.getElementById("feature-matrix-head");
    const body = document.getElementById("feature-matrix-body");
    try {
      const data = await loadJson("data/features.json");
      const catalogItems = data.catalog || [];
      const capabilities = data.matrix?.capabilities || [];
      const providers = data.matrix?.providers || [];
      document.getElementById("features-updated").textContent = data.lastUpdated || "-";
      document.getElementById("features-count").textContent =
        `${catalogItems.length}機能 / ${providers.length}提供元`;
      catalog.replaceChildren(...catalogItems.map(renderCatalogCard));

      head.replaceChildren(el("th", "", "提供元"));
      capabilities.forEach((capability) => head.append(el("th", "", capability)));
      body.replaceChildren(...providers.map((provider) => renderProviderRow(provider, capabilities)));
    } catch (_) {
      renderError(catalog, "機能一覧を読み込めませんでした。");
      const row = document.createElement("tr");
      const cell = el("td", "", "比較データを読み込めませんでした。");
      cell.colSpan = 8;
      row.append(cell);
      body.replaceChildren(row);
    }
  }

  if (page === "news") renderNews();
  if (page === "feature-news") renderFeatureNews();
  if (page === "compare") renderFeatures();
})();
