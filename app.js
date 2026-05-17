(function () {
  const page = document.body.dataset.page;

  const statusLabels = {
    stable: "Stable",
    beta: "Beta",
    preview: "Preview",
    deprecated: "Deprecated",
    unknown: "Unknown",
  };

  const levelLabels = {
    yes: "〇",
    partial: "△",
    no: "×",
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
    top.append(el("span", "source", item.source || "Unknown"));
    const time = el("time", "", item.date || "");
    if (item.date) time.dateTime = item.date;
    top.append(time);

    const titleRow = el("div", "title-row");
    titleRow.append(el("h2", "", item.title || "Untitled"));
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

    article.append(top, titleRow, body, dl, link(item.url, "公式ソース"));
    return article;
  }

  async function renderNews() {
    const list = document.getElementById("news-list");
    try {
      const data = await loadJson("data/news.json");
      document.getElementById("news-updated").textContent = data.lastUpdated || "-";
      document.getElementById("news-count").textContent =
        `${data.items.length}件 / 公式ソースのみ`;
      list.replaceChildren(...data.items.map(renderNewsCard));
    } catch (_) {
      renderError(list, "ニュースを読み込めませんでした。GitHub Pages上で再確認してください。");
    }
  }

  function renderInboxItem(item) {
    const article = el("article", "inbox-item");
    const meta = el("div", "card-topline");
    meta.append(el("span", "source", item.source || "Unknown"));
    const time = el("time", "", item.date || "");
    if (item.date) time.dateTime = item.date;
    meta.append(time);

    const titleRow = el("div", "title-row");
    titleRow.append(el("h2", "", item.title || "Untitled"));
    titleRow.append(badge(item.statusHint || "unknown"));

    const discovered = el(
      "p",
      "small-note",
      item.discoveredAt ? `検出: ${item.discoveredAt}` : "GitHub Actionsで検出",
    );
    article.append(meta, titleRow, discovered, link(item.url, "公式ソースを確認"));
    return article;
  }

  async function renderInbox() {
    const list = document.getElementById("inbox-list");
    try {
      const data = await loadJson("data/inbox.json");
      const items = data.items || [];
      document.getElementById("inbox-count").textContent = `${items.length}件`;
      document.getElementById("inbox-updated").textContent =
        data.lastUpdated ? `最終巡回 ${data.lastUpdated}` : "未巡回";
      if (items.length === 0) {
        renderError(list, "未要約の更新通知はありません。");
        return;
      }
      list.replaceChildren(...items.map(renderInboxItem));
    } catch (_) {
      renderError(list, "通知を読み込めませんでした。GitHub Pages上で再確認してください。");
    }
  }

  function renderCatalogCard(item) {
    const article = el("article", "feature-card");
    article.append(el("h3", "", item.name || "Untitled"));
    article.append(el("p", "", item.description || ""));
    const note = el("p", "small-note", item.watchPoint ? `確認: ${item.watchPoint}` : "");
    article.append(note);
    return article;
  }

  function renderCapabilityCell(value) {
    const level = value?.level || "no";
    const td = el("td", `capability-cell capability-${level}`);
    td.append(el("span", "capability-mark", levelLabels[level] || "?"));
    if (value?.note) {
      td.append(el("span", "capability-note", value.note));
    }
    return td;
  }

  function renderProviderRow(provider, capabilities) {
    const tr = document.createElement("tr");
    const name = el("td", "provider-cell");
    name.append(el("strong", "", provider.provider || "Unknown"));
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
  if (page === "inbox") renderInbox();
  if (page === "compare") renderFeatures();
})();
