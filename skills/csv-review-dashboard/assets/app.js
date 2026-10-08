/* csv-review-dashboard runtime. CSV text is only ever inserted with textContent. */
(function () {
  "use strict";

  const STRINGS = {
    ja: {
      tabs: { overview: "概要", compare: "比較", review: "レビュー", table: "表" },
      all: "すべて", search: "検索", searchPh: "id・本文を検索", shown: "表示 {n} / {total} 件",
      dataSide: "表示するデータ", mean: "平均", sum: "合計", perItem: "1件あたり",
      items: "件", other: "その他", rows: "{n} 行", embedded: "ビルド時に埋め込み", loaded: "ブラウザで読み込み",
      countsTitle: "{cat} × {stack} の件数", countsTitleSingle: "{cat} 別の件数", histTitle: "{label} の分布",
      tableView: "表で見る", total: "合計", range: "範囲", count: "件数",
      onlyA: "{label} にだけある id（{n} 件、比較から除外）: {ids}",
      onlyB: "{label} にだけある id（{n} 件、比較から除外）: {ids}",
      paired: "比較した件数", regressed: "悪化", improved: "改善", unchanged: "変化なし",
      flipBad: "正→誤", flipGood: "誤→正", better: "改善", worse: "悪化", flat: "変化なし",
      regressedTitle: "悪化したケース", improvedTitle: "改善したケース",
      regressedSort: "正→誤の反転を先頭に、閾値に対する悪化の大きさ順。行を選ぶと A/B を並べて表示します。",
      improvedSort: "誤→正の反転を先頭に、閾値に対する改善の大きさ順。行を選ぶと A/B を並べて表示します。",
      reason: "理由", metric: "指標", delta: "差 (B−A)", shared: "A・B 共通",
      noRegressions: "条件に合う悪化ケースはありません", noImprovements: "条件に合う改善ケースはありません",
      thresholdNote: "閾値", noThreshold: "閾値なし（判定に使わない）",
      reviewed: "レビュー済み {n} / {total}", unreviewedOnly: "未レビューのみ", exportCsv: "CSV を書き出す",
      prev: "← 前へ", next: "次へ →", note: "メモ", humanLabel: "あなたの判定",
      keys: "← → 移動 · 1–{n} 判定 · N メモ · Esc メモから戻る",
      storageOk: "このブラウザに自動保存しています", storageNo: "このブラウザには保存できません。閉じる前に CSV を書き出してください",
      noItems: "条件に合う項目はありません", groupBy: "カテゴリでまとめる", download: "表示中の行を CSV でダウンロード",
      loadA: "CSV を読み込む", loadSide: "{label} の CSV を読み込む", dropHint: "ドロップした CSV で {label} のデータを置き換えます",
      loadErr: "{name} を読み込めませんでした", missingCols: "設定した列 {cols} がヘッダーにありません",
      dupId: "id {id} が重複しています（データ {r1} 行目と {r2} 行目）", emptyId: "データ {r} 行目の id が空です",
      badValue: "データ {r} 行目: {col}={v} は{kind}ではありません", number: "数値", boolean: "真偽値 (true/false)",
      parseErr: "データ {r} 行目: {msg}", reserved: "列 {cols} はレビューの書き出し用に予約されています",
      noData: "データがありません",
      loadTitle: "CSV を選択 / ドロップ",
      loadIntro: "この HTML にはデータが入っていません。http で配信していれば既定の場所の CSV を開いたときに自動で読み込みます。それ以外は CSV を選ぶかページにドロップしてください。データを更新したら「読み込み直す」で反映できます。",
      expectedFile: "想定するファイル: {name}", requiredCols: "必須の列: {cols}", defaultPath: "既定の場所（HTML からの相対パス）: {path}",
      chooseFile: "ファイルを選ぶ", notLoaded: "未読み込み", reload: "読み込み直す",
      lastFile: "前回のファイルを読み込む ({name})", loadedAt: "{time} に読み込み",
      dropHintLoad: "ドロップした CSV を読み込みます",
      autoLoading: "{path} を読み込んでいます…",
      autoFile: "file:// で開いているため自動では読み込みません。ブラウザは隣にあるファイルの読み取りを禁止しています。フォルダを http で配信すると（例: python3 -m http.server）開いたときに自動で読み込みます。",
      autoFail: "{path} を自動で読み込めませんでした（{msg}）。ファイルを選ぶかドロップしてください。"
    },
    en: {
      tabs: { overview: "Overview", compare: "Compare", review: "Review", table: "Table" },
      all: "All", search: "Search", searchPh: "Search id and text", shown: "Showing {n} of {total}",
      dataSide: "Dataset", mean: "mean", sum: "sum", perItem: "per item",
      items: "items", other: "Other", rows: "{n} rows", embedded: "embedded at build", loaded: "loaded in browser",
      countsTitle: "Count by {cat} × {stack}", countsTitleSingle: "Count by {cat}", histTitle: "Distribution of {label}",
      tableView: "Show as table", total: "Total", range: "Range", count: "Count",
      onlyA: "ids only in {label} ({n}, excluded from comparison): {ids}",
      onlyB: "ids only in {label} ({n}, excluded from comparison): {ids}",
      paired: "Compared cases", regressed: "Regressed", improved: "Improved", unchanged: "Unchanged",
      flipBad: "correct→incorrect", flipGood: "incorrect→correct", better: "better", worse: "worse", flat: "no change",
      regressedTitle: "Regressed cases", improvedTitle: "Improved cases",
      regressedSort: "Correct→incorrect flips first, then by worsening relative to the threshold. Select a row to see A and B side by side.",
      improvedSort: "Incorrect→correct flips first, then by improvement relative to the threshold. Select a row to see A and B side by side.",
      reason: "Reason", metric: "Metric", delta: "Δ (B−A)", shared: "Same in A and B",
      noRegressions: "No regressed cases match the filters", noImprovements: "No improved cases match the filters",
      thresholdNote: "threshold", noThreshold: "no threshold (not used for regressions)",
      reviewed: "Reviewed {n} / {total}", unreviewedOnly: "Unreviewed only", exportCsv: "Export CSV",
      prev: "← Prev", next: "Next →", note: "Note", humanLabel: "Your judgment",
      keys: "← → move · 1–{n} judgment · N note · Esc leave note",
      storageOk: "Auto-saved in this browser", storageNo: "Cannot save in this browser. Export the CSV before closing.",
      noItems: "No items match the filters", groupBy: "Group by category", download: "Download shown rows as CSV",
      loadA: "Load CSV", loadSide: "Load {label} CSV", dropHint: "Dropped CSV replaces the {label} data",
      loadErr: "Could not load {name}", missingCols: "configured column(s) {cols} not in header",
      dupId: "duplicate id {id} (data rows {r1} and {r2})", emptyId: "data row {r}: empty id",
      badValue: "data row {r}: {col}={v} is not a {kind}", number: "number", boolean: "boolean (true/false)",
      parseErr: "data row {r}: {msg}", reserved: "column(s) {cols} are reserved for review export",
      noData: "No data",
      loadTitle: "Choose or drop CSV",
      loadIntro: "This HTML contains no data. Served over http, it loads the CSV from its default location when it opens. Otherwise choose a CSV or drop it on the page. When the data changes, use Reload to pick it up.",
      expectedFile: "Expected file: {name}", requiredCols: "Required columns: {cols}", defaultPath: "Default location (relative to the HTML): {path}",
      chooseFile: "Choose file", notLoaded: "Not loaded", reload: "Reload",
      lastFile: "Load previous file ({name})", loadedAt: "loaded {time}",
      dropHintLoad: "Drop to load the CSV",
      autoLoading: "Loading {path}…",
      autoFile: "Opened from file://, so nothing is loaded automatically: browsers block reading neighbouring files. Serve the folder over http (for example python3 -m http.server) to load it on open.",
      autoFail: "Could not load {path} automatically ({msg}). Choose the file or drop it."
    }
  };

  // Must match TRUE_VALUES / FALSE_VALUES in build_dashboard.py.
  const TRUE_VALUES = new Set(["true", "1", "yes", "y", "t"]);
  const FALSE_VALUES = new Set(["false", "0", "no", "n", "f"]);
  const REVIEW_EXPORT_COLUMNS = ["human_label", "human_note"];
  const SERIES_SLOTS = 8;
  const STORAGE_PREFIX = "csv-review-dashboard:v1:";

  const payload = JSON.parse(document.getElementById("dashboard-data").textContent);
  const cfg = payload.config;
  const T = STRINGS[cfg.lang] || STRINGS.ja;
  const cols = cfg.columns;
  const metrics = cols.metrics;
  const hasB = Boolean(cfg.data.csv_b);
  const SIDES = hasB ? ["a", "b"] : ["a"];
  // "load" mode: the HTML carries no rows. Served over http(s) it fetches the CSV(s) from
  // the default paths (relative to the HTML); otherwise the user picks them on open.
  const loadMode = cfg.data.mode === "load";
  const expectedName = { a: cfg.data.csv, b: cfg.data.csv_b };
  const defaultPath = payload.default_paths || {};
  const canFetch = location.protocol === "http:" || location.protocol === "https:";
  const sideLabel = { a: cfg.data.label_a || "A", b: cfg.data.label_b || "B" };
  const stackCol = cols.status || cols.verdict || null;
  const numFmtCache = {};
  const canPick = typeof window.showOpenFilePicker === "function";

  const state = {
    data: { a: payload.a ? withOrigin(payload.a, "embedded") : null, b: payload.b ? withOrigin(payload.b, "embedded") : null },
    // File handles from showOpenFilePicker: `handles` were picked or granted in this page
    // session, `saved` were restored from IndexedDB and still need a permission prompt.
    handles: { a: null, b: null },
    saved: { a: null, b: null },
    // Sides whose current data came from fetching the default path; Reload re-fetches them.
    fetched: { a: false, b: false },
    autoLoading: false,
    // Why the default CSV was not loaded on open, shown in the load panel.
    autoNotes: [],
    tab: cfg.tabs[0],
    side: "a",
    filters: { category: "", status: "", verdict: "", q: "" },
    compareView: "regressed",
    selectedId: null,
    review: {},
    storageKey: null,
    storageOk: false,
    reviewCursor: null,
    unreviewedOnly: false,
    groupBy: false,
    colorIndex: new Map(),
    errors: [],
    table: null
  };

  // ---------- small helpers ----------

  function withOrigin(table, origin) {
    return { name: table.name, headers: table.headers, rows: table.rows, origin: origin, loadedAt: null };
  }

  // True while load mode still waits for a CSV on some side.
  function needsLoad() {
    return loadMode && SIDES.some((s) => !state.data[s]);
  }

  function fmt(template, vars) {
    return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    setAttrs(node, attrs);
    appendChildren(node, children);
    return node;
  }

  const SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, children) {
    const node = document.createElementNS(SVG_NS, tag);
    setAttrs(node, attrs);
    appendChildren(node, children);
    return node;
  }

  function setAttrs(node, attrs) {
    if (!attrs) return;
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "text") node.textContent = String(v);
      else if (k === "class") node.setAttribute("class", v);
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : String(v));
    }
  }

  function appendChildren(node, children) {
    if (children === null || children === undefined) return;
    for (const c of [].concat(children)) {
      if (c === null || c === undefined || c === false) continue;
      node.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    }
  }

  function parseBool(raw) {
    const v = String(raw ?? "").trim().toLowerCase();
    if (TRUE_VALUES.has(v)) return true;
    if (FALSE_VALUES.has(v)) return false;
    return null;
  }

  function parseNum(raw) {
    const v = String(raw ?? "").trim();
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function metricValue(row, m) {
    if (!row) return null;
    if (m.aggregate === "rate") {
      const b = parseBool(row[m.column]);
      return b === null ? null : (b ? 1 : 0);
    }
    return parseNum(row[m.column]);
  }

  function numberFormat(maxFrac, sig) {
    const key = maxFrac + ":" + sig;
    if (!numFmtCache[key]) {
      numFmtCache[key] = new Intl.NumberFormat(cfg.lang, sig ? { maximumSignificantDigits: sig } : { maximumFractionDigits: maxFrac });
    }
    return numFmtCache[key];
  }

  function fmtNum(v) {
    if (v === null || !Number.isFinite(v)) return "–";
    const a = Math.abs(v);
    if (a >= 100) return numberFormat(0).format(v);
    if (a >= 10) return numberFormat(1).format(v);
    if (a >= 1) return numberFormat(2).format(v);
    return numberFormat(0, 3).format(v);
  }

  function fmtMetric(v, m) {
    if (v === null || !Number.isFinite(v)) return "–";
    if (m.aggregate === "rate") return numberFormat(1).format(v * 100) + "%";
    return fmtNum(v) + (m.unit ? " " + m.unit : "");
  }

  function fmtDelta(d, m) {
    const sign = d > 0 ? "+" : d < 0 ? "−" : "±";
    if (m.aggregate === "rate") return sign + numberFormat(1).format(Math.abs(d) * 100) + "pt";
    return sign + fmtNum(Math.abs(d)) + (m.unit ? " " + m.unit : "");
  }

  function mean(xs) { return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null; }
  function sum(xs) { return xs.reduce((s, x) => s + x, 0); }
  function quantile(xs, q) {
    if (!xs.length) return null;
    const s = xs.slice().sort((x, y) => x - y);
    const pos = (s.length - 1) * q;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  }

  function aggregate(values, m) {
    if (!values.length) return null;
    return m.aggregate === "sum" ? sum(values) : mean(values);
  }

  function niceStep(span, count) {
    if (span <= 0) return 1;
    const raw = span / count;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const err = raw / pow;
    return pow * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1);
  }

  // Rough text width for layout decisions (CJK glyphs are about 1em wide).
  function textWidth(s, px) {
    let w = 0;
    for (const ch of String(s)) w += ch.codePointAt(0) > 0x2e80 ? px : px * 0.6;
    return w;
  }

  function truncateToWidth(s, maxW, px) {
    if (textWidth(s, px) <= maxW) return s;
    let out = "";
    for (const ch of String(s)) {
      if (textWidth(out + ch + "…", px) > maxW) break;
      out += ch;
    }
    return out + "…";
  }

  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  }

  function cssToken(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Ink or white for a label set inside a filled mark, by the fill's luminance.
  function inkFor(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return "#ffffff";
    const n = parseInt(m[1], 16);
    const lin = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
    return lum > 0.3 ? "#0b0b0b" : "#ffffff";
  }

  // ---------- data model ----------

  function rowsOf(side) { return state.data[side] ? state.data[side].rows : []; }

  function orderedValues(column) {
    const preferred = (cfg.order && cfg.order[column]) || [];
    const seen = new Set();
    const out = [];
    const present = new Set();
    for (const side of ["a", "b"]) for (const r of rowsOf(side)) present.add(r[column]);
    for (const v of preferred) if (present.has(v) && !seen.has(v)) { seen.add(v); out.push(v); }
    for (const side of ["a", "b"]) {
      for (const r of rowsOf(side)) {
        const v = r[column];
        if (v !== undefined && v !== "" && !seen.has(v)) { seen.add(v); out.push(v); }
      }
    }
    return out;
  }

  // Color follows the entity: slots are fixed from the full dataset, never from the filtered slice.
  function computeColors() {
    state.colorIndex = new Map();
    if (!stackCol) return;
    const values = orderedValues(stackCol);
    const overflow = values.length > SERIES_SLOTS;
    values.forEach((v, i) => state.colorIndex.set(v, overflow && i >= SERIES_SLOTS - 1 ? "other" : i));
  }

  function seriesKey(v) {
    const idx = state.colorIndex.get(v);
    return idx === "other" ? T.other : v;
  }

  function seriesVar(v) {
    const idx = state.colorIndex.get(v);
    return idx === undefined || idx === "other" ? "--series-other" : "--series-" + (idx + 1);
  }

  function hayOf(row) {
    if (!row) return "";
    const parts = [row[cols.id]];
    for (const c of cols.text) parts.push(row[c]);
    for (const k of ["category", "status", "verdict"]) if (cols[k]) parts.push(row[cols[k]]);
    return parts.join("\n").toLowerCase();
  }

  function dimsMatch(row) {
    const f = state.filters;
    for (const k of ["category", "status", "verdict"]) {
      if (cols[k] && f[k] && row[cols[k]] !== f[k]) return false;
    }
    return true;
  }

  function queryMatch(row) {
    const q = state.filters.q.trim().toLowerCase();
    return !q || hayOf(row).includes(q);
  }

  function filteredRows(side) {
    return rowsOf(side).filter((r) => dimsMatch(r) && queryMatch(r));
  }

  function idMismatch() {
    if (!hasB || !state.data.b) return { onlyA: [], onlyB: [] };
    const idsA = rowsOf("a").map((r) => r[cols.id]);
    const idsB = rowsOf("b").map((r) => r[cols.id]);
    const setA = new Set(idsA), setB = new Set(idsB);
    return { onlyA: idsA.filter((i) => !setB.has(i)), onlyB: idsB.filter((i) => !setA.has(i)) };
  }

  function pairs() {
    const byId = new Map(rowsOf("b").map((r) => [r[cols.id], r]));
    const out = [];
    for (const a of rowsOf("a")) {
      const b = byId.get(a[cols.id]);
      if (b) out.push({ id: a[cols.id], a: a, b: b });
    }
    return out;
  }

  function filteredPairs() {
    return pairs().filter((p) => dimsMatch(p.a) && (queryMatch(p.a) || queryMatch(p.b)));
  }

  // Per metric: positive "worse" means B is worse than A in the metric's own direction.
  function classifyPair(p) {
    const changes = [];
    for (const m of metrics) {
      const va = metricValue(p.a, m), vb = metricValue(p.b, m);
      if (va === null || vb === null) continue;
      if (m.aggregate === "rate") {
        const good = m.better === "higher" ? 1 : 0;
        if (va === good && vb !== good) changes.push({ m: m, kind: "regressed", flip: true, score: Infinity, va: va, vb: vb });
        else if (va !== good && vb === good) changes.push({ m: m, kind: "improved", flip: true, score: Infinity, va: va, vb: vb });
        continue;
      }
      if (m.regression_threshold === undefined || m.regression_threshold === null) continue;
      const worse = m.better === "lower" ? vb - va : va - vb;
      const scale = m.regression_threshold || Math.abs(va) || 1;
      if (worse > m.regression_threshold) changes.push({ m: m, kind: "regressed", flip: false, score: worse / scale, va: va, vb: vb });
      else if (-worse > m.regression_threshold) changes.push({ m: m, kind: "improved", flip: false, score: -worse / scale, va: va, vb: vb });
    }
    const reg = changes.filter((c) => c.kind === "regressed");
    const imp = changes.filter((c) => c.kind === "improved");
    const kind = reg.length ? "regressed" : imp.length ? "improved" : "unchanged";
    const relevant = kind === "regressed" ? reg : imp;
    return {
      kind: kind,
      changes: relevant,
      flip: relevant.some((c) => c.flip),
      score: Math.max(0, ...relevant.filter((c) => !c.flip).map((c) => c.score))
    };
  }

  // Must match configured_columns() in build_dashboard.py.
  function requiredColumns() {
    const needed = [cols.id, ...cols.text, ...metrics.map((m) => m.column)];
    for (const k of ["category", "status", "verdict"]) if (cols[k]) needed.push(cols[k]);
    return [...new Set(needed)];
  }

  function validateTable(headers, rows) {
    const errors = [];
    const missing = requiredColumns().filter((c) => !headers.includes(c));
    if (missing.length) errors.push(fmt(T.missingCols, { cols: JSON.stringify(missing) }));
    if (cfg.tabs.includes("review")) {
      const clash = REVIEW_EXPORT_COLUMNS.filter((c) => headers.includes(c));
      if (clash.length) errors.push(fmt(T.reserved, { cols: JSON.stringify(clash) }));
    }
    if (errors.length) return errors;
    const seen = new Map();
    rows.forEach((r, i) => {
      const id = String(r[cols.id] ?? "").trim();
      if (!id) errors.push(fmt(T.emptyId, { r: i + 1 }));
      else if (seen.has(id)) errors.push(fmt(T.dupId, { id: id, r1: seen.get(id), r2: i + 1 }));
      else seen.set(id, i + 1);
      for (const m of metrics) {
        const raw = String(r[m.column] ?? "").trim();
        if (!raw) continue;
        const ok = m.aggregate === "rate" ? parseBool(raw) !== null : parseNum(raw) !== null;
        if (!ok) errors.push(fmt(T.badValue, { r: i + 1, col: m.column, v: raw, kind: m.aggregate === "rate" ? T.boolean : T.number }));
      }
    });
    return errors;
  }

  // ---------- review storage ----------

  function initReview() {
    state.review = {};
    state.reviewCursor = null;
    const a = state.data.a;
    if (!a) { state.storageKey = null; state.storageOk = false; return; }
    // Embed mode keys by the full data, so a different snapshot starts empty. Load mode
    // keys by title + id set, so labels survive reloading updated data with the same ids.
    state.storageKey = loadMode
      ? STORAGE_PREFIX + "ids:" + fnv1a(JSON.stringify([cfg.title, a.rows.map((r) => r[cols.id]).sort()]))
      : STORAGE_PREFIX + fnv1a(JSON.stringify([cfg.title, a.headers, a.rows]));
    try {
      const raw = window.localStorage.getItem(state.storageKey);
      if (raw) state.review = JSON.parse(raw) || {};
      state.storageOk = true;
    } catch (e) {
      state.storageOk = false;
    }
  }

  function saveReview() {
    if (!state.storageOk) return;
    try {
      window.localStorage.setItem(state.storageKey, JSON.stringify(state.review));
    } catch (e) {
      state.storageOk = false;
      renderContent();
    }
  }

  function reviewOf(id) { return state.review[id] || { label: "", note: "" }; }

  function setReview(id, patch) {
    const next = Object.assign({}, reviewOf(id), patch);
    if (!next.label && !next.note) delete state.review[id];
    else state.review[id] = next;
    saveReview();
  }

  // ---------- tooltip ----------

  const tip = document.getElementById("tooltip");

  function showTip(nodes, x, y) {
    tip.replaceChildren(...nodes);
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let left = x + 12, top = y + 12;
    if (left + r.width > window.innerWidth - 8) left = Math.max(8, x - r.width - 12);
    if (top + r.height > window.innerHeight - 8) top = Math.max(8, y - r.height - 12);
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }

  function hideTip() { tip.hidden = true; }

  function bindTip(node, build) {
    node.addEventListener("pointermove", (e) => showTip(build(), e.clientX, e.clientY));
    node.addEventListener("pointerleave", hideTip);
    node.addEventListener("focus", () => {
      const r = node.getBoundingClientRect();
      showTip(build(), r.left + r.width / 2, r.top + r.height / 2);
    });
    node.addEventListener("blur", hideTip);
  }

  function tipContent(value, rows) {
    const out = [el("div", { class: "tt-value", text: value })];
    for (const row of rows) {
      out.push(el("div", { class: "tt-row" }, [
        row.color ? el("span", { class: "tt-key", style: "background:var(" + row.color + ")" }) : null,
        el("span", { class: "tt-name", text: row.text })
      ]));
    }
    return out;
  }

  // ---------- charts ----------

  function legend(values) {
    return el("ul", { class: "legend" }, values.map((v) =>
      el("li", null, [el("span", { class: "swatch", style: "background:var(" + seriesVar(v) + ")" }), v])));
  }

  // Path for a horizontal bar segment: square at the left, 4px rounded right end when `roundEnd`.
  function hBarPath(x, y, w, h, roundEnd) {
    const r = roundEnd ? Math.min(4, w / 2, h / 2) : 0;
    return "M" + x + "," + y + "H" + (x + w - r) + (r ? "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) : "") +
      "V" + (y + h - r) + (r ? "Q" + (x + w) + "," + (y + h) + " " + (x + w - r) + "," + (y + h) : "") + "H" + x + "Z";
  }

  // Path for a vertical column: square at the baseline, 4px rounded top.
  function vBarPath(x, y, w, h) {
    const r = Math.min(4, w / 2, h);
    return "M" + x + "," + (y + h) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y +
      "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) + "V" + (y + h) + "Z";
  }

  // Horizontal bars per category. With `single`, segValues is ["_"] and slot 1 colors every bar.
  function stackedBars(container, categories, segValues, counts, single) {
    const width = Math.max(280, container.clientWidth || 600);
    const longest = Math.max(...categories.map((c) => textWidth(c, 12)), 40);
    const labelW = Math.min(longest + 8, width * 0.32);
    const x0 = labelW + 8, x1 = width - 44;
    const rowH = 30, barH = 18, top = 20;
    const height = top + categories.length * rowH + 4;
    const totals = categories.map((c) => segValues.reduce((s, v) => s + (counts.get(c + "\u0000" + v) || 0), 0));
    const maxTotal = Math.max(1, ...totals);
    const step = niceStep(maxTotal, Math.max(2, Math.floor((x1 - x0) / 70)));
    const axisMax = Math.ceil(maxTotal / step) * step;
    const sx = (v) => x0 + (v / axisMax) * (x1 - x0);
    const svg = svgEl("svg", { class: "chart", viewBox: "0 0 " + width + " " + height, width: width, height: height, role: "img" });
    for (let t = 0; t <= axisMax + 1e-9; t += step) {
      svg.appendChild(svgEl("line", { class: t === 0 ? "baseline" : "gridline", x1: sx(t), x2: sx(t), y1: top - 4, y2: height - 4 }));
      svg.appendChild(svgEl("text", { x: sx(t), y: top - 8, "text-anchor": "middle", text: fmtNum(t) }));
    }
    const hexCache = {};
    categories.forEach((cat, i) => {
      const y = top + i * rowH + (rowH - barH) / 2;
      svg.appendChild(svgEl("text", { x: labelW, y: y + barH / 2 + 4, "text-anchor": "end", text: truncateToWidth(cat, labelW, 12), style: "font-size:12px" },
        [svgEl("title", { text: cat })]));
      let acc = 0;
      const present = segValues.filter((v) => counts.get(cat + "\u0000" + v));
      present.forEach((v, j) => {
        const n = counts.get(cat + "\u0000" + v);
        const isLast = j === present.length - 1;
        const xa = sx(acc), full = sx(acc + n) - xa;
        const w = Math.max(1, isLast ? full : full - 2);
        acc += n;
        const varName = single ? "--series-1" : seriesVar(v);
        const g = svgEl("g", { class: "hov", tabindex: 0, "aria-label": cat + (single ? "" : " · " + v) + ": " + n });
        g.appendChild(svgEl("rect", { class: "hit", x: xa, y: top + i * rowH, width: Math.max(full, 6), height: rowH }));
        g.appendChild(svgEl("path", { class: "mark", d: hBarPath(xa, y, w, barH, isLast), style: "fill:var(" + varName + ")" }));
        const label = String(n);
        if (!single && w >= textWidth(label, 11) + 12) {
          hexCache[varName] = hexCache[varName] || cssToken(varName);
          g.appendChild(svgEl("text", { class: "in-label", x: xa + w / 2, y: y + barH / 2 + 4, "text-anchor": "middle", text: label, style: "fill:" + inkFor(hexCache[varName]) }));
        }
        bindTip(g, () => single
          ? tipContent(n + " " + T.items, [{ text: cat }])
          : tipContent(n + " " + T.items + " (" + Math.round((n / totals[i]) * 100) + "%)", [{ text: cat }, { text: v, color: varName }]));
        svg.appendChild(g);
      });
      svg.appendChild(svgEl("text", { class: "value-label", x: sx(totals[i]) + 6, y: y + barH / 2 + 4, text: String(totals[i]) }));
    });
    return svg;
  }

  function singleBars(container, categories, counts) {
    const keyed = new Map(categories.map((c) => [c + "\u0000_", counts.get(c) || 0]));
    return stackedBars(container, categories, ["_"], keyed, true);
  }

  function histogram(container, values, m) {
    const width = Math.max(280, container.clientWidth || 600);
    const height = 220, left = 44, right = 12, top = 16, bottom = 34;
    const lo = Math.min(...values), hi = Math.max(...values);
    const step = niceStep(hi - lo || Math.abs(hi) || 1, 12);
    const start = Math.floor(lo / step) * step;
    const nBins = Math.floor((hi - start) / step) + 1;
    const bins = Array.from({ length: nBins }, (_, i) => ({ lo: start + i * step, hi: start + (i + 1) * step, n: 0 }));
    for (const v of values) bins[Math.min(nBins - 1, Math.floor((v - start) / step))].n++;
    const maxN = Math.max(1, ...bins.map((b) => b.n));
    const yStep = niceStep(maxN, 4);
    const yMax = Math.ceil(maxN / yStep) * yStep;
    const plotW = width - left - right, plotH = height - top - bottom;
    const slot = plotW / nBins;
    const barW = Math.max(2, Math.min(24, slot - 2));
    const sy = (n) => top + plotH - (n / yMax) * plotH;
    const svg = svgEl("svg", { class: "chart", viewBox: "0 0 " + width + " " + height, width: width, height: height, role: "img" });
    for (let t = 0; t <= yMax + 1e-9; t += yStep) {
      svg.appendChild(svgEl("line", { class: t === 0 ? "baseline" : "gridline", x1: left, x2: width - right, y1: sy(t), y2: sy(t) }));
      svg.appendChild(svgEl("text", { x: left - 6, y: sy(t) + 4, "text-anchor": "end", text: fmtNum(t) }));
    }
    const edgeLabelW = Math.max(...bins.map((b) => textWidth(fmtNum(b.lo), 11))) + 10;
    const every = Math.max(1, Math.ceil(edgeLabelW / slot));
    for (let i = 0; i <= nBins; i += every) {
      svg.appendChild(svgEl("text", { x: left + i * slot, y: height - bottom + 16, "text-anchor": "middle", text: fmtNum(start + i * step) }));
    }
    if (m.unit) svg.appendChild(svgEl("text", { x: width - right, y: height - 4, "text-anchor": "end", text: m.unit }));
    const tallest = bins.reduce((best, b) => (b.n > best.n ? b : best), bins[0]);
    bins.forEach((b, i) => {
      const x = left + i * slot + (slot - barW) / 2;
      const g = svgEl("g", { class: "hov", tabindex: 0, "aria-label": fmtNum(b.lo) + "–" + fmtNum(b.hi) + ": " + b.n });
      g.appendChild(svgEl("rect", { class: "hit", x: left + i * slot, y: top, width: slot, height: plotH }));
      if (b.n > 0) g.appendChild(svgEl("path", { class: "mark", d: vBarPath(x, sy(b.n), barW, sy(0) - sy(b.n)), style: "fill:var(--series-1)" }));
      bindTip(g, () => tipContent(b.n + " " + T.items, [{ text: T.range + ": " + fmtMetric(b.lo, m) + " – " + fmtMetric(b.hi, m) }]));
      svg.appendChild(g);
      if (b === tallest && b.n > 0) svg.appendChild(svgEl("text", { class: "value-label", x: x + barW / 2, y: sy(b.n) - 4, "text-anchor": "middle", text: String(b.n) }));
    });
    return { svg: svg, bins: bins };
  }

  function dataTable(headers, rows) {
    return el("div", { class: "scroll-x" }, el("table", { class: "list" }, [
      el("thead", null, el("tr", null, headers.map((h, i) => el("th", { text: h, style: i ? "text-align:right" : null })))),
      el("tbody", null, rows.map((r) => el("tr", { style: "cursor:default" }, r.map((v, i) => el("td", { class: i ? "num" : null, text: v })))))
    ]));
  }

  // ---------- chrome: header, tabs, filters, banner ----------

  function renderHeader() {
    document.getElementById("page-title").textContent = cfg.title;
    const parts = [];
    for (const side of SIDES) {
      const d = state.data[side];
      if (!d) continue;
      parts.push((hasB ? sideLabel[side] + ": " : "") + sourceText(d));
    }
    document.getElementById("source-line").textContent = parts.join(" · ");
    const loader = document.getElementById("loader");
    loader.replaceChildren();
    if (loadMode) {
      if (SIDES.some((s) => state.data[s])) loader.appendChild(el("button", { class: "btn", type: "button", text: T.reload, onclick: reload }));
      return;
    }
    for (const side of SIDES) {
      const input = el("input", { type: "file", accept: ".csv,text/csv", onchange: (e) => { if (e.target.files[0]) loadFile(e.target.files[0], side); e.target.value = ""; } });
      loader.appendChild(el("label", null, [hasB ? fmt(T.loadSide, { label: sideLabel[side] }) : T.loadA, input]));
    }
  }

  function sourceText(d) {
    const when = d.origin === "embedded" ? T.embedded
      : loadMode ? fmt(T.loadedAt, { time: d.loadedAt.toLocaleString(cfg.lang) }) : T.loaded;
    return (d.path || d.name) + " (" + fmt(T.rows, { n: d.rows.length }) + ", " + when + ")";
  }

  function renderTabs() {
    const nav = document.getElementById("tabs");
    nav.replaceChildren(...cfg.tabs.map((t) => el("button", {
      role: "tab", "aria-selected": String(state.tab === t), text: T.tabs[t],
      onclick: () => { state.tab = t; renderTabs(); renderContent(); }
    })));
  }

  let searchTimer = null;
  function renderFilters() {
    const box = document.getElementById("filters");
    box.replaceChildren();
    for (const k of ["category", "status", "verdict"]) {
      const col = cols[k];
      if (!col) continue;
      const values = orderedValues(col);
      if (state.filters[k] && !values.includes(state.filters[k])) state.filters[k] = "";
      const select = el("select", { onchange: (e) => { state.filters[k] = e.target.value; state.selectedId = null; renderContent(); } },
        [el("option", { value: "", text: T.all })].concat(values.map((v) => el("option", { value: v, text: v, selected: state.filters[k] === v }))));
      box.appendChild(el("label", null, [col, select]));
    }
    const search = el("input", { type: "search", placeholder: T.searchPh, value: state.filters.q,
      oninput: (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => { state.filters.q = e.target.value; state.selectedId = null; renderContent(); }, 150);
      } });
    box.appendChild(el("label", null, [T.search, search]));
    box.appendChild(el("span", { class: "count", id: "filter-count" }));
  }

  function updateCount() {
    const side = state.tab === "review" ? "a" : state.side;
    const node = document.getElementById("filter-count");
    if (node) node.textContent = fmt(T.shown, { n: filteredRows(side).length, total: rowsOf(side).length });
  }

  function renderBanner() {
    const banner = document.getElementById("banner");
    const lines = [];
    for (const e of state.errors) lines.push(e);
    const mm = idMismatch();
    const warn = [];
    if (mm.onlyA.length) warn.push(fmt(T.onlyA, { label: sideLabel.a, n: mm.onlyA.length, ids: mm.onlyA.join(", ") }));
    if (mm.onlyB.length) warn.push(fmt(T.onlyB, { label: sideLabel.b, n: mm.onlyB.length, ids: mm.onlyB.join(", ") }));
    if (!lines.length && !warn.length) { banner.hidden = true; return; }
    banner.hidden = false;
    banner.className = "banner" + (lines.length ? " error" : "");
    banner.replaceChildren(...lines.map((l) => el("p", { text: "✕ " + l })), ...warn.map((w) => el("p", { text: "⚠ " + w })));
  }

  // Only meaningful when a second CSV is loaded; single-CSV dashboards get nothing.
  function appendSideToggle(root) {
    if (!hasB) return;
    root.appendChild(el("div", { class: "segmented", role: "group", "aria-label": T.dataSide }, ["a", "b"].map((s) =>
      el("button", { "aria-pressed": String(state.side === s), text: sideLabel[s], onclick: () => { state.side = s; renderContent(); } }))));
  }

  // ---------- overview ----------

  function statTile(m, rows) {
    const values = rows.map((r) => metricValue(r, m)).filter((v) => v !== null);
    let value, sub;
    if (m.aggregate === "rate") {
      value = fmtMetric(mean(values), m);
      sub = sum(values) + " / " + values.length + " (n=" + values.length + ")";
    } else if (m.aggregate === "sum") {
      value = fmtMetric(values.length ? sum(values) : null, m);
      sub = "n=" + values.length + " · " + T.perItem + " " + fmtMetric(mean(values), m);
    } else {
      value = fmtMetric(mean(values), m);
      sub = "n=" + values.length + " · p50 " + fmtMetric(quantile(values, 0.5), m) + " · p95 " + fmtMetric(quantile(values, 0.95), m);
    }
    const label = m.label + (m.aggregate === "mean" ? " (" + T.mean + ")" : m.aggregate === "sum" ? " (" + T.sum + ")" : "");
    return el("div", { class: "tile" }, [el("div", { class: "label", text: label }), el("div", { class: "value", text: value }), el("div", { class: "sub", text: sub })]);
  }

  function renderOverview(root) {
    const side = state.side;
    appendSideToggle(root);
    const rows = filteredRows(side);
    if (metrics.length) root.appendChild(el("div", { class: "grid" }, metrics.map((m) => statTile(m, rows))));

    const charts = el("div", { class: "two-col" });
    root.appendChild(charts);
    // Charts measure their holder, so draw only after every card is in the grid.
    const draws = [];
    if (cols.category || stackCol) {
      const card = el("div", { class: "card" });
      charts.appendChild(card);
      const catCol = cols.category || stackCol;
      const allCats = orderedValues(catCol);
      const present = new Set(rows.map((r) => r[catCol]));
      const cats = allCats.filter((c) => present.has(c));
      if (cols.category && stackCol) {
        const segs = orderedValues(stackCol);
        const counts = new Map();
        for (const r of rows) {
          const k = r[catCol] + "\u0000" + r[stackCol];
          counts.set(k, (counts.get(k) || 0) + 1);
        }
        card.appendChild(el("h2", { text: fmt(T.countsTitle, { cat: catCol, stack: stackCol }) }));
        const legendValues = [...new Set(segs.map(seriesKey))];
        card.appendChild(legend(legendValues.map((v) => v)));
        const holder = el("div");
        card.appendChild(holder);
        if (!cats.length) holder.appendChild(el("div", { class: "empty", text: T.noItems }));
        else {
          draws.push(() => holder.appendChild(stackedBars(holder, cats, segs, counts)));
          card.appendChild(el("details", null, [el("summary", { class: "small muted", text: T.tableView }),
            dataTable([catCol, ...segs, T.total], cats.map((c) => {
              const ns = segs.map((s) => counts.get(c + "\u0000" + s) || 0);
              return [c, ...ns.map(String), String(sum(ns))];
            }))]));
        }
      } else {
        const counts = new Map();
        for (const r of rows) counts.set(r[catCol], (counts.get(r[catCol]) || 0) + 1);
        card.appendChild(el("h2", { text: fmt(T.countsTitleSingle, { cat: catCol }) }));
        const holder = el("div");
        card.appendChild(holder);
        if (!cats.length) holder.appendChild(el("div", { class: "empty", text: T.noItems }));
        else {
          draws.push(() => holder.appendChild(singleBars(holder, cats, counts)));
          card.appendChild(el("details", null, [el("summary", { class: "small muted", text: T.tableView }),
            dataTable([catCol, T.count], cats.map((c) => [c, String(counts.get(c) || 0)]))]));
        }
      }
    }

    const histCol = cfg.histogram || (metrics.find((m) => m.aggregate !== "rate") || {}).column;
    if (histCol) {
      const m = metrics.find((x) => x.column === histCol);
      const values = rows.map((r) => metricValue(r, m)).filter((v) => v !== null);
      const card = el("div", { class: "card" });
      charts.appendChild(card);
      card.appendChild(el("h2", { text: fmt(T.histTitle, { label: m.label }) }));
      card.appendChild(el("div", { class: "small muted", text: "n=" + values.length + " · " + T.mean + " " + fmtMetric(mean(values), m) }));
      const holder = el("div");
      card.appendChild(holder);
      if (!values.length) holder.appendChild(el("div", { class: "empty", text: T.noItems }));
      else {
        draws.push(() => {
          const h = histogram(holder, values, m);
          holder.appendChild(h.svg);
          card.appendChild(el("details", null, [el("summary", { class: "small muted", text: T.tableView }),
            dataTable([T.range, T.count], h.bins.map((b) => [fmtMetric(b.lo, m) + " – " + fmtMetric(b.hi, m), String(b.n)]))]));
        });
      }
    }
    for (const draw of draws) draw();
  }

  // ---------- compare ----------

  function deltaNode(d, m) {
    if (d === null) return el("span", { class: "delta flat", text: "–" });
    if (Math.abs(d) < 1e-12) {
      return el("span", { class: "delta flat", text: "= " + fmtDelta(0, m) + " " + T.flat });
    }
    const good = (d > 0) === (m.better === "higher");
    return el("span", { class: "delta " + (good ? "good" : "bad"), text: (d > 0 ? "▲ " : "▼ ") + fmtDelta(d, m) + " " + (good ? T.better : T.worse) });
  }

  function deltaTile(m, ps) {
    const both = ps.map((p) => [metricValue(p.a, m), metricValue(p.b, m)]).filter(([x, y]) => x !== null && y !== null);
    const va = aggregate(both.map((x) => x[0]), m), vb = aggregate(both.map((x) => x[1]), m);
    const d = va === null || vb === null ? null : vb - va;
    const label = m.label + (m.aggregate === "mean" ? " (" + T.mean + ")" : m.aggregate === "sum" ? " (" + T.sum + ")" : "");
    const threshold = m.aggregate === "rate" ? "" : m.regression_threshold === undefined || m.regression_threshold === null
      ? " · " + T.noThreshold : " · " + T.thresholdNote + " " + fmtMetric(m.regression_threshold, m);
    return el("div", { class: "tile" }, [
      el("div", { class: "label", text: label }),
      el("div", { class: "ab" }, [el("span", { text: sideLabel.a }), el("span", { text: fmtMetric(va, m) }), el("span", { text: sideLabel.b }), el("span", { text: fmtMetric(vb, m) })]),
      el("div", { class: "value", style: "font-size:18px" }, deltaNode(d, m)),
      el("div", { class: "sub", text: "n=" + both.length + threshold })
    ]);
  }

  function countTile(label, n, total, icon) {
    return el("div", { class: "tile" }, [el("div", { class: "label", text: label }), el("div", { class: "value", text: (icon ? icon + " " : "") + n }),
      el("div", { class: "sub", text: total ? Math.round((n / total) * 100) + "% / " + total : "" })]);
  }

  function reasonNodes(c) {
    return c.changes.map((ch) => {
      const m = ch.m;
      let text;
      if (ch.flip) text = (ch.kind === "regressed" ? "✕ " : "✓ ") + m.label + " " + (ch.kind === "regressed" ? T.flipBad : T.flipGood);
      else text = (ch.vb > ch.va ? "▲ " : "▼ ") + m.label + " " + fmtDelta(ch.vb - ch.va, m);
      return el("span", { class: "badge reason", text: text });
    });
  }

  function textBlock(title, value) {
    return el("div", { class: "text-block" }, [el("h3", { text: title }), el("pre", { class: "longtext", text: value ?? "" })]);
  }

  function renderPairDetail(p) {
    const card = el("div", { class: "card", id: "pair-detail" });
    card.appendChild(el("h2", { text: cols.id + ": " + p.id }));
    const metricRows = metrics.map((m) => {
      const va = metricValue(p.a, m), vb = metricValue(p.b, m);
      const d = va === null || vb === null ? null : vb - va;
      const show = (v) => (m.aggregate === "rate" ? (v === null ? "–" : v ? "true" : "false") : fmtMetric(v, m));
      return el("tr", { style: "cursor:default" }, [el("td", { text: m.label, style: "white-space:nowrap" }), el("td", { class: "num", text: show(va) }), el("td", { class: "num", text: show(vb) }),
        el("td", { class: "num" }, m.aggregate === "rate" ? (d ? deltaFlip(d, m) : el("span", { class: "delta flat", text: "= " + T.flat })) : deltaNode(d, m))]);
    });
    card.appendChild(el("div", { class: "scroll-x" }, el("table", { class: "list", style: "margin-bottom:12px" }, [
      el("thead", null, el("tr", null, [el("th", { text: T.metric }), el("th", { text: sideLabel.a }), el("th", { text: sideLabel.b }), el("th", { text: T.delta })])),
      el("tbody", null, metricRows)])));
    const shared = [], differing = [];
    for (const c of cols.text) ((p.a[c] ?? "") === (p.b[c] ?? "") ? shared : differing).push(c);
    for (const c of shared) card.appendChild(textBlock(c + " (" + T.shared + ")", p.a[c]));
    for (const c of differing) {
      card.appendChild(el("div", { class: "side-by-side" }, [textBlock(c + " — " + sideLabel.a, p.a[c]), textBlock(c + " — " + sideLabel.b, p.b[c])]));
    }
    return card;
  }

  function deltaFlip(d, m) {
    const good = (d > 0) === (m.better === "higher");
    return el("span", { class: "delta " + (good ? "good" : "bad"), text: (good ? "✓ " + T.flipGood : "✕ " + T.flipBad) });
  }

  function renderCompare(root) {
    const ps = filteredPairs();
    const classified = ps.map((p) => ({ p: p, c: classifyPair(p) }));
    const reg = classified.filter((x) => x.c.kind === "regressed");
    const imp = classified.filter((x) => x.c.kind === "improved");
    const bySeverity = (x, y) => (y.c.flip - x.c.flip) || (y.c.score - x.c.score) || x.p.id.localeCompare(y.p.id);
    reg.sort(bySeverity);
    imp.sort(bySeverity);

    root.appendChild(el("div", { class: "grid" }, [
      countTile(T.paired, ps.length, 0, ""),
      countTile(T.regressed, reg.length, ps.length, "▼"),
      countTile(T.improved, imp.length, ps.length, "▲"),
      countTile(T.unchanged, ps.length - reg.length - imp.length, ps.length, "=")
    ]));
    root.appendChild(el("div", { class: "grid" }, metrics.map((m) => deltaTile(m, ps))));

    const view = state.compareView;
    const list = view === "regressed" ? reg : imp;
    const card = el("div", { class: "card" });
    root.appendChild(card);
    card.appendChild(el("div", { class: "segmented", role: "group" }, [["regressed", T.regressedTitle + " (" + reg.length + ")"], ["improved", T.improvedTitle + " (" + imp.length + ")"]].map(([k, label]) =>
      el("button", { "aria-pressed": String(view === k), text: label, onclick: () => { state.compareView = k; state.selectedId = null; renderContent(); } }))));
    card.appendChild(el("p", { class: "small muted", text: view === "regressed" ? T.regressedSort : T.improvedSort }));
    if (!list.length) {
      card.appendChild(el("div", { class: "empty", text: view === "regressed" ? T.noRegressions : T.noImprovements }));
    } else {
      const preview = cols.text[0];
      const tbody = el("tbody", null, list.map((x) => el("tr", {
        tabindex: 0, "aria-selected": String(state.selectedId === x.p.id),
        onclick: () => selectPair(x.p.id),
        onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPair(x.p.id); } }
      }, [
        el("td", { text: x.p.id, style: "white-space:nowrap" }),
        cols.category ? el("td", { text: x.p.a[cols.category] }) : null,
        el("td", null, el("div", { style: "display:flex;flex-wrap:wrap;gap:4px" }, reasonNodes(x.c))),
        preview ? el("td", { class: "muted preview-col", text: truncateToWidth((x.p.a[preview] || "").replace(/\s+/g, " "), 260, 13) }) : null
      ])));
      card.appendChild(el("div", { class: "scroll-x" }, el("table", { class: "list" }, [
        el("thead", null, el("tr", null, [el("th", { text: cols.id }), cols.category ? el("th", { text: cols.category }) : null, el("th", { text: T.reason }), preview ? el("th", { class: "preview-col", text: preview }) : null])),
        tbody])));
    }
    const selected = list.find((x) => x.p.id === state.selectedId);
    if (selected) root.appendChild(renderPairDetail(selected.p));
  }

  function selectPair(id) {
    state.selectedId = id;
    renderContent();
    const detail = document.getElementById("pair-detail");
    if (detail) detail.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- review ----------

  function reviewItems() {
    return filteredRows("a").filter((r) => !state.unreviewedOnly || !reviewOf(r[cols.id]).label);
  }

  function moveCursor(delta) {
    const items = reviewItems();
    if (!items.length) return;
    let idx = items.findIndex((r) => r[cols.id] === state.reviewCursor);
    idx = idx < 0 ? 0 : Math.min(items.length - 1, Math.max(0, idx + delta));
    state.reviewCursor = items[idx][cols.id];
    renderContent();
  }

  function applyLabel(id, label) {
    const items = reviewItems();
    const idx = items.findIndex((r) => r[cols.id] === id);
    const current = reviewOf(id).label;
    setReview(id, { label: current === label ? "" : label });
    // Advance to the next item after a judgment; toggling a label off stays put.
    if (current !== label && idx >= 0 && idx + 1 < items.length) state.reviewCursor = items[idx + 1][cols.id];
    renderContent();
  }

  function exportReview() {
    const a = state.data.a;
    const fields = a.headers.concat(REVIEW_EXPORT_COLUMNS);
    const data = a.rows.map((r) => {
      const rv = reviewOf(r[cols.id]);
      return a.headers.map((h) => r[h] ?? "").concat([rv.label, rv.note]);
    });
    const csvText = "\uFEFF" + Papa.unparse({ fields: fields, data: data });
    download(csvText, a.name.replace(/\.csv$/i, "") + "_reviewed.csv");
  }

  function download(text, filename) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    const link = el("a", { href: url, download: filename });
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderReview(root) {
    const labels = cfg.review.labels;
    const filtered = filteredRows("a");
    const items = reviewItems();
    const reviewedCount = filtered.filter((r) => reviewOf(r[cols.id]).label).length;
    let idx = items.findIndex((r) => r[cols.id] === state.reviewCursor);
    if (idx < 0 && items.length) { idx = 0; state.reviewCursor = items[0][cols.id]; }

    const bar = el("div", { class: "review-bar" }, [
      el("span", { class: "progress", text: items.length ? (idx + 1) + " / " + items.length : "0 / 0" }),
      el("span", { class: "progress-track", title: fmt(T.reviewed, { n: reviewedCount, total: filtered.length }) },
        el("span", { style: "width:" + (filtered.length ? (reviewedCount / filtered.length) * 100 : 0) + "%" })),
      el("span", { class: "small muted", text: fmt(T.reviewed, { n: reviewedCount, total: filtered.length }) }),
      el("label", { class: "check" }, [el("input", { type: "checkbox", checked: state.unreviewedOnly, onchange: (e) => { state.unreviewedOnly = e.target.checked; renderContent(); } }), T.unreviewedOnly]),
      el("button", { class: "btn", text: T.exportCsv, onclick: exportReview })
    ]);
    root.appendChild(bar);
    root.appendChild(el("p", { class: "small muted", text: (state.storageOk ? "✓ " + T.storageOk : "⚠ " + T.storageNo) + " · " + fmt(T.keys, { n: labels.length }) }));

    if (!items.length) { root.appendChild(el("div", { class: "card empty", text: T.noItems })); return; }
    const row = items[idx];
    const id = row[cols.id];
    const rv = reviewOf(id);
    const card = el("div", { class: "card" });
    root.appendChild(card);
    const meta = el("div", { class: "review-meta" }, [el("strong", { text: cols.id + ": " + id })]);
    for (const k of ["category", "status", "verdict"]) {
      const c = cols[k];
      if (!c) continue;
      const v = row[c];
      meta.appendChild(el("span", { class: "badge" }, [c === stackCol ? el("span", { class: "swatch", style: "background:var(" + seriesVar(v) + ")" }) : null, c + ": " + v]));
    }
    card.appendChild(meta);
    for (const c of cols.text) card.appendChild(textBlock(c, row[c]));

    card.appendChild(el("h3", { text: T.humanLabel }));
    card.appendChild(el("div", { class: "label-buttons" }, labels.map((l, i) =>
      el("button", { "aria-pressed": String(rv.label === l), onclick: () => applyLabel(id, l) }, [el("kbd", { text: String(i + 1) }), l]))));
    card.appendChild(el("h3", { text: T.note }));
    card.appendChild(el("textarea", { class: "note", id: "review-note", text: rv.note, oninput: (e) => setReview(id, { note: e.target.value }) }));
    card.appendChild(el("div", { class: "review-nav" }, [
      el("button", { class: "btn", text: T.prev, disabled: idx === 0, onclick: () => moveCursor(-1) }),
      el("button", { class: "btn", text: T.next, disabled: idx === items.length - 1, onclick: () => moveCursor(1) })
    ]));
  }

  document.addEventListener("keydown", (e) => {
    if (state.tab !== "review" || !cfg.review || e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target;
    const typing = target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.tagName === "SELECT");
    if (typing) {
      if (e.key === "Escape") target.blur();
      return;
    }
    if (e.key === "ArrowLeft") { e.preventDefault(); moveCursor(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); moveCursor(1); }
    else if (e.key === "n" || e.key === "N") {
      const note = document.getElementById("review-note");
      if (note) { e.preventDefault(); note.focus(); }
    } else if (/^[1-9]$/.test(e.key)) {
      const label = cfg.review.labels[Number(e.key) - 1];
      if (label && state.reviewCursor !== null && reviewItems().length) { e.preventDefault(); applyLabel(state.reviewCursor, label); }
    }
  });

  // ---------- table ----------

  const TRUNCATE_AT = 140;

  function textFormatter(cell) {
    const value = String(cell.getValue() ?? "");
    const span = el("span", { class: "cell-text" });
    if (value.length <= TRUNCATE_AT) { span.textContent = value; return span; }
    let expanded = false;
    const body = document.createTextNode("");
    const more = el("button", { class: "cell-more", type: "button" });
    const paint = () => {
      body.textContent = expanded ? value : value.slice(0, TRUNCATE_AT) + "…";
      more.textContent = expanded ? "▲" : "▼";
      more.setAttribute("aria-label", expanded ? "collapse" : "expand");
    };
    more.addEventListener("click", (e) => {
      e.stopPropagation();
      expanded = !expanded;
      paint();
      cell.getRow().normalizeHeight();
    });
    paint();
    span.append(body, more);
    return span;
  }

  function plainFormatter(cell) {
    return el("span", { text: String(cell.getValue() ?? "") });
  }

  function renderTable(root) {
    const side = state.side;
    appendSideToggle(root);
    const d = state.data[side];
    const rows = filteredRows(side);
    const withReview = side === "a" && cfg.tabs.includes("review");
    const headers = d.headers.concat(withReview ? REVIEW_EXPORT_COLUMNS : []);
    // Fields are positional so header names containing "." are not read as nested paths.
    const field = (i) => "f" + i;
    const data = rows.map((r) => {
      const obj = {};
      const rv = withReview ? reviewOf(r[cols.id]) : null;
      headers.forEach((h, i) => {
        obj[field(i)] = i < d.headers.length ? (r[h] ?? "") : (h === "human_label" ? rv.label : rv.note);
      });
      return obj;
    });
    const dims = new Set(["category", "status", "verdict"].map((k) => cols[k]).filter(Boolean).concat(withReview ? ["human_label"] : []));
    const numeric = new Set(metrics.filter((m) => m.aggregate !== "rate").map((m) => m.column));
    const longText = new Set(cols.text.concat(withReview ? ["human_note"] : []));
    const columns = headers.map((h, i) => {
      const c = { title: h, field: field(i), headerFilter: "input", formatter: plainFormatter };
      if (dims.has(h)) Object.assign(c, { headerFilter: "list", headerFilterParams: { valuesLookup: true, clearable: true }, headerFilterFunc: "=" });
      if (numeric.has(h)) Object.assign(c, { sorter: "number", hozAlign: "right" });
      if (longText.has(h)) Object.assign(c, { formatter: textFormatter, width: 320, variableHeight: true, cssClass: "wrap" });
      if (h === cols.id) c.frozen = window.innerWidth > 600;
      return c;
    });

    const groupField = cols.category ? field(headers.indexOf(cols.category)) : null;
    const toolbar = el("div", { class: "table-toolbar" }, [
      groupField ? el("label", { class: "check" }, [el("input", { type: "checkbox", checked: state.groupBy, onchange: (e) => { state.groupBy = e.target.checked; renderContent(); } }), T.groupBy]) : null,
      el("button", { class: "btn", text: T.download, onclick: () => state.table && state.table.download("csv", d.name.replace(/\.csv$/i, "") + "_filtered.csv", { bom: true }, "active") })
    ]);
    root.appendChild(toolbar);
    const holder = el("div");
    root.appendChild(holder);
    state.table = new Tabulator(holder, {
      data: data,
      columns: columns,
      layout: "fitDataFill",
      height: "70vh",
      placeholder: T.noItems,
      groupBy: state.groupBy && groupField ? groupField : false,
      columnDefaults: { maxWidth: 420, headerSortTristate: true }
    });
  }

  // ---------- main render ----------

  function renderContent() {
    hideTip();
    if (state.table) { state.table.destroy(); state.table = null; }
    const root = document.getElementById("content");
    root.replaceChildren();
    renderBanner();
    document.getElementById("filters").hidden = needsLoad();
    if (needsLoad()) renderLoadPanel(root);
    else if (!rowsOf("a").length) root.appendChild(el("div", { class: "card empty", text: T.noData }));
    else if (state.tab === "overview") renderOverview(root);
    else if (state.tab === "compare") renderCompare(root);
    else if (state.tab === "review") renderReview(root);
    else if (state.tab === "table") renderTable(root);
    updateCount();
  }

  function renderAll() {
    computeColors();
    renderHeader();
    renderTabs();
    renderFilters();
    renderContent();
  }

  // ---------- loading CSV in the browser ----------

  function errorText(err) { return String(err && err.message ? err.message : err); }

  // Parse a File or CSV text and run the same checks as the build script. Resolves to
  // { headers, rows }; rejects with an Error whose `details` lists every problem found.
  function parseCsv(input) {
    return new Promise((resolve, reject) => {
      Papa.parse(input, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (h) => h.replace(/^\uFEFF/, ""),
        complete: (res) => {
          const headers = res.meta.fields || [];
          const errors = res.errors.slice(0, 5).map((e) => fmt(T.parseErr, { r: (e.row ?? 0) + 1, msg: e.message }));
          if (!errors.length) errors.push(...validateTable(headers, res.data).slice(0, 10));
          if (errors.length) {
            const err = new Error(errors.join("; "));
            err.details = errors;
            reject(err);
            return;
          }
          const rows = res.data.map((r) => {
            const o = {};
            for (const h of headers) o[h] = r[h] ?? "";
            return o;
          });
          resolve({ headers: headers, rows: rows });
        },
        error: reject
      });
    });
  }

  function setSide(side, table, name, path) {
    state.errors = [];
    state.data[side] = { name: name, path: path || null, headers: table.headers, rows: table.rows, origin: "loaded", loadedAt: new Date() };
    state.selectedId = null;
    if (side === "a") initReview();
    renderAll();
  }

  function showLoadError(name, err) {
    state.errors = [fmt(T.loadErr, { name: name })].concat(err && err.details ? err.details : [errorText(err)]);
    renderContent();
  }

  // `handle` is the FileSystemFileHandle the file came from, if any; it enables Reload.
  async function loadFile(file, side, handle) {
    let table;
    try {
      table = await parseCsv(file);
    } catch (err) {
      showLoadError(file.name, err);
      return;
    }
    state.handles[side] = handle || null;
    state.fetched[side] = false;
    if (handle) {
      state.saved[side] = handle;
      rememberHandle(side, handle);
    }
    setSide(side, table, file.name);
  }

  // ---------- load mode: fetching the default CSV over http(s) ----------

  async function fetchDefault(side) {
    const path = defaultPath[side];
    const url = new URL(path.split("/").map(encodeURIComponent).join("/"), location.href);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return parseCsv(await res.text());
  }

  // On open, a failure only adds a note and leaves the side to the picker; on Reload it
  // is an error and the previously loaded data stays.
  async function loadDefault(side, onOpen) {
    const path = defaultPath[side];
    let table;
    try {
      table = await fetchDefault(side);
    } catch (err) {
      if (onOpen) state.autoNotes.push(fmt(T.autoFail, { path: path, msg: errorText(err) }));
      else showLoadError(path, err);
      return;
    }
    state.handles[side] = null;
    state.fetched[side] = true;
    setSide(side, table, path.split("/").pop(), path);
  }

  async function autoLoad() {
    if (!loadMode) return;
    if (!canFetch) {
      state.autoNotes.push(T.autoFile);
    } else {
      state.autoLoading = true;
      renderContent();
      for (const side of SIDES) await loadDefault(side, true);
      state.autoLoading = false;
    }
    if (needsLoad()) renderContent();
  }

  // ---------- load mode: empty state, picker, remembered files ----------

  function renderLoadPanel(root) {
    const card = el("div", { class: "card load-panel" }, [
      el("h2", { text: T.loadTitle }),
      el("p", { class: "muted", text: T.loadIntro }),
      ...state.autoNotes.map((n) => el("p", { class: "small", text: "ⓘ " + n })),
      el("p", { class: "small", text: fmt(T.requiredCols, { cols: requiredColumns().join(", ") }) })
    ]);
    for (const side of SIDES) {
      const d = state.data[side];
      const saved = state.saved[side];
      const status = d ? "✓ " + sourceText(d)
        : state.autoLoading ? fmt(T.autoLoading, { path: defaultPath[side] }) : T.notLoaded;
      card.appendChild(el("div", { class: "load-side" }, [
        el("h3", { text: (hasB ? sideLabel[side] + " — " : "") + fmt(T.expectedFile, { name: expectedName[side] }) }),
        defaultPath[side] ? el("p", { class: "small muted", text: fmt(T.defaultPath, { path: defaultPath[side] }) }) : null,
        el("p", { class: "small" + (d ? "" : " muted"), text: status }),
        el("div", { class: "load-actions" }, [
          canPick
            ? el("button", { class: "btn", type: "button", text: T.chooseFile, onclick: () => pickFile(side) })
            : el("label", { class: "btn" }, [T.chooseFile, el("input", { type: "file", accept: ".csv,text/csv",
                onchange: (e) => { if (e.target.files[0]) loadFile(e.target.files[0], side); e.target.value = ""; } })]),
          saved && !d ? el("button", { class: "btn", type: "button", text: fmt(T.lastFile, { name: saved.name }), onclick: () => readHandle(side, saved) }) : null
        ])
      ]));
    }
    root.appendChild(card);
  }

  async function pickFile(side) {
    let picked;
    try {
      picked = await window.showOpenFilePicker({ types: [{ description: "CSV", accept: { "text/csv": [".csv"] } }] });
    } catch (e) {
      if (e.name !== "AbortError") showLoadError(expectedName[side], e);
      return;
    }
    await readHandle(side, picked[0]);
  }

  // Must run from a click: requestPermission needs a user gesture.
  async function readHandle(side, handle) {
    try {
      const opts = { mode: "read" };
      if ((await handle.queryPermission(opts)) !== "granted" && (await handle.requestPermission(opts)) !== "granted") return;
      loadFile(await handle.getFile(), side, handle);
    } catch (e) {
      showLoadError(handle.name, e);
    }
  }

  // Re-read every side from where it came from (a fetched default path or a picked file);
  // if any side was dropped or chosen without a handle, go back to the empty state so the
  // user can pick or drop the updated CSV.
  function reload() {
    if (SIDES.every((s) => state.fetched[s] || state.handles[s])) {
      (async () => {
        for (const s of SIDES) {
          if (state.fetched[s]) await loadDefault(s, false);
          else await readHandle(s, state.handles[s]);
        }
      })();
      return;
    }
    state.data = { a: null, b: null };
    state.errors = [];
    state.selectedId = null;
    initReview();
    renderAll();
  }

  // Remembered handles are a convenience only: IndexedDB can be missing or blocked
  // (private windows, file:// in some browsers), so every failure is ignored on purpose.
  const IDB_NAME = "csv-review-dashboard", IDB_STORE = "handles";

  function idbRequest(mode, makeRequest) {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open(IDB_NAME, 1);
      open.onupgradeneeded = () => open.result.createObjectStore(IDB_STORE);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction(IDB_STORE, mode);
        const req = makeRequest(tx.objectStore(IDB_STORE));
        tx.oncomplete = () => { db.close(); resolve(req.result); };
        tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
      };
    });
  }

  function handleKey(side) { return STORAGE_PREFIX + cfg.title + "\u0000" + side; }

  async function rememberHandle(side, handle) {
    try { await idbRequest("readwrite", (store) => store.put(handle, handleKey(side))); } catch (e) { /* optional */ }
  }

  async function recallHandles() {
    if (!loadMode || !canPick) return;
    let found = false;
    for (const side of SIDES) {
      try {
        const handle = await idbRequest("readonly", (store) => store.get(handleKey(side)));
        if (handle && !state.saved[side]) { state.saved[side] = handle; found = true; }
      } catch (e) { /* optional */ }
    }
    if (found && needsLoad()) renderContent();
  }

  // A drop in load mode fills the side whose expected file name matches, then any side
  // still empty; in embed mode it replaces A, as before.
  function dropFiles(files) {
    if (!loadMode) { if (files[0]) loadFile(files[0], "a"); return; }
    const free = SIDES.slice();
    for (const file of files.slice(0, SIDES.length)) {
      const side = free.find((s) => expectedName[s] === file.name) || free.find((s) => !state.data[s]) || free[0];
      free.splice(free.indexOf(side), 1);
      loadFile(file, side);
    }
  }

  const overlay = document.getElementById("drop-overlay");
  overlay.textContent = loadMode ? T.dropHintLoad : fmt(T.dropHint, { label: sideLabel.a });
  let dragDepth = 0;
  document.addEventListener("dragenter", (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes("Files")) { dragDepth++; overlay.hidden = false; } });
  document.addEventListener("dragleave", () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) overlay.hidden = true; });
  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDepth = 0;
    overlay.hidden = true;
    if (e.dataTransfer) dropFiles([...e.dataTransfer.files]);
  });

  let resizeTimer = null;
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth || state.tab !== "overview") return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderContent, 150);
  });

  initReview();
  renderAll();
  recallHandles();
  autoLoad();
})();
