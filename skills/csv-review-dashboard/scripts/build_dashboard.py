#!/usr/bin/env python3
"""Build a single self-contained HTML dashboard from local CSV files.

Usage:
    python3 build_dashboard.py --config cfg.json --out out.html [--csv a.csv] [--csv-b b.csv]

CSV paths in the config are resolved relative to the config file; --csv / --csv-b
override them (resolved relative to the current directory). Python 3 stdlib only.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
import sys
from dataclasses import dataclass
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
ASSETS = SKILL_DIR / "assets"

TABS = ("overview", "compare", "review", "table")
AGGREGATES = ("mean", "sum", "rate")
BETTER = ("higher", "lower")
LANGS = ("ja", "en")

TOP_KEYS = {"title", "lang", "tabs", "data", "columns", "order", "histogram", "review"}
DATA_KEYS = {"csv", "csv_b", "label_a", "label_b"}
COLUMN_KEYS = {"id", "text", "category", "status", "verdict", "metrics"}
METRIC_KEYS = {"column", "label", "unit", "aggregate", "better", "regression_threshold"}
REVIEW_KEYS = {"labels"}

# Boolean spellings accepted for aggregate "rate". Must match parseBool() in app.js.
TRUE_VALUES = {"true", "1", "yes", "y", "t"}
FALSE_VALUES = {"false", "0", "no", "n", "f"}

# Added to exported review CSVs; a source CSV must not already use them.
REVIEW_EXPORT_COLUMNS = ("human_label", "human_note")


class BuildError(Exception):
    """A user-facing error: bad config, missing file, or invalid CSV content."""


@dataclass(frozen=True)
class Table:
    path: Path
    headers: list[str]
    rows: list[dict[str, str]]


def fail(message: str) -> None:
    raise BuildError(message)


def check_keys(obj: object, allowed: set[str], where: str) -> dict:
    if not isinstance(obj, dict):
        fail(f"{where} must be a JSON object")
    unknown = sorted(set(obj) - allowed)
    if unknown:
        fail(f"{where}: unknown key(s) {unknown}; allowed: {sorted(allowed)}")
    return obj


def require_str(obj: dict, key: str, where: str) -> str:
    value = obj.get(key)
    if not isinstance(value, str) or not value:
        fail(f"{where}.{key} must be a non-empty string")
    return value


def optional_str(obj: dict, key: str, where: str) -> str | None:
    if key not in obj or obj[key] is None:
        return None
    return require_str(obj, key, where)


def validate_config(cfg: object) -> dict:
    cfg = check_keys(cfg, TOP_KEYS, "config")
    require_str(cfg, "title", "config")
    lang = cfg.setdefault("lang", "ja")
    if lang not in LANGS:
        fail(f"config.lang must be one of {list(LANGS)}, got {lang!r}")

    tabs = cfg.get("tabs")
    if not isinstance(tabs, list) or not tabs:
        fail(f"config.tabs must be a non-empty list drawn from {list(TABS)}")
    bad = [t for t in tabs if t not in TABS]
    if bad or len(set(tabs)) != len(tabs):
        fail(f"config.tabs has unknown or repeated entries {tabs}; allowed: {list(TABS)}")

    data = check_keys(cfg.get("data"), DATA_KEYS, "config.data")
    require_str(data, "csv", "config.data")
    for key in ("csv_b", "label_a", "label_b"):
        optional_str(data, key, "config.data")
    if "compare" in tabs and not data.get("csv_b"):
        fail('config.tabs includes "compare" but config.data.csv_b is not set')

    cols = check_keys(cfg.get("columns"), COLUMN_KEYS, "config.columns")
    require_str(cols, "id", "config.columns")
    for key in ("category", "status", "verdict"):
        optional_str(cols, key, "config.columns")
    text = cols.setdefault("text", [])
    if not isinstance(text, list) or not all(isinstance(t, str) and t for t in text):
        fail("config.columns.text must be a list of column names")

    metrics = cols.setdefault("metrics", [])
    if not isinstance(metrics, list):
        fail("config.columns.metrics must be a list")
    for i, m in enumerate(metrics):
        where = f"config.columns.metrics[{i}]"
        check_keys(m, METRIC_KEYS, where)
        require_str(m, "column", where)
        m.setdefault("label", m["column"])
        m.setdefault("unit", "")
        if m.get("aggregate") not in AGGREGATES:
            fail(f"{where}.aggregate must be one of {list(AGGREGATES)}")
        if m.get("better") not in BETTER:
            fail(f"{where}.better must be one of {list(BETTER)}")
        threshold = m.get("regression_threshold")
        if threshold is not None:
            if m["aggregate"] == "rate":
                fail(f"{where}: regression_threshold is not used with aggregate 'rate' "
                     "(a true->false flip is the regression); remove it")
            if not isinstance(threshold, (int, float)) or threshold < 0:
                fail(f"{where}.regression_threshold must be a number >= 0")
    if "compare" in tabs and not metrics:
        fail('config.tabs includes "compare" but config.columns.metrics is empty')

    order = cfg.setdefault("order", {})
    if not isinstance(order, dict) or not all(
        isinstance(v, list) and all(isinstance(x, str) for x in v) for v in order.values()
    ):
        fail("config.order must map a column name to a list of values")

    histogram = cfg.get("histogram")
    if histogram is not None:
        numeric = [m["column"] for m in metrics if m["aggregate"] != "rate"]
        if histogram not in numeric:
            fail(f"config.histogram {histogram!r} must be a metric column with aggregate "
                 f"mean or sum; candidates: {numeric}")

    if "review" in tabs:
        review = check_keys(cfg.get("review"), REVIEW_KEYS, "config.review")
        labels = review.get("labels")
        if (not isinstance(labels, list) or not 1 <= len(labels) <= 9
                or not all(isinstance(x, str) and x for x in labels)
                or len(set(labels)) != len(labels)):
            fail("config.review.labels must be 1-9 distinct non-empty strings "
                 "(number keys 1-9 select them)")
    elif "review" in cfg:
        fail('config.review is set but "review" is not in config.tabs')
    return cfg


def read_csv(path: Path, role: str) -> Table:
    if not path.is_file():
        fail(f"{role} CSV not found: {path}")
    try:
        with path.open(encoding="utf-8-sig", newline="") as f:
            reader = csv.reader(f)
            headers = next(reader, None)
            if not headers:
                fail(f"{role} CSV is empty: {path}")
            if len(set(headers)) != len(headers):
                dupes = sorted({h for h in headers if headers.count(h) > 1})
                fail(f"{role} CSV has duplicate header(s) {dupes}: {path}")
            rows = []
            for line_no, values in enumerate(reader, start=2):
                if not any(v.strip() for v in values):
                    continue
                if len(values) != len(headers):
                    fail(f"{role} CSV {path}, row {line_no}: expected {len(headers)} "
                         f"fields, got {len(values)}")
                rows.append(dict(zip(headers, values)))
    except UnicodeDecodeError as e:
        fail(f"{role} CSV is not UTF-8 ({e.reason} at byte {e.start}): {path}")
    except csv.Error as e:
        fail(f"{role} CSV could not be parsed ({e}): {path}")
    return Table(path=path, headers=headers, rows=rows)


def configured_columns(cfg: dict) -> list[str]:
    cols = cfg["columns"]
    names = [cols["id"], *cols["text"], *(m["column"] for m in cols["metrics"])]
    names += [cols[k] for k in ("category", "status", "verdict") if cols.get(k)]
    return list(dict.fromkeys(names))


def validate_table(table: Table, cfg: dict, role: str) -> None:
    missing = [c for c in configured_columns(cfg) if c not in table.headers]
    if missing:
        fail(f"{role} CSV {table.path}: configured column(s) {missing} not in header "
             f"{table.headers}")
    if "review" in cfg["tabs"]:
        clash = [c for c in REVIEW_EXPORT_COLUMNS if c in table.headers]
        if clash:
            fail(f"{role} CSV {table.path}: column(s) {clash} are reserved for review export")

    id_col = cfg["columns"]["id"]
    seen: dict[str, int] = {}
    for line_no, row in enumerate(table.rows, start=2):
        rid = row[id_col].strip()
        if not rid:
            fail(f"{role} CSV {table.path}, row {line_no}: empty id in column {id_col!r}")
        if rid in seen:
            fail(f"{role} CSV {table.path}: duplicate id {rid!r} (rows {seen[rid]} and {line_no})")
        seen[rid] = line_no

    for m in cfg["columns"]["metrics"]:
        col = m["column"]
        for line_no, row in enumerate(table.rows, start=2):
            raw = row[col].strip()
            if not raw:
                continue  # empty means "no value"; excluded from n
            if m["aggregate"] == "rate":
                if raw.lower() not in TRUE_VALUES | FALSE_VALUES:
                    fail(f"{role} CSV {table.path}, row {line_no}: {col}={raw!r} is not a "
                         f"boolean (use one of {sorted(TRUE_VALUES | FALSE_VALUES)})")
            else:
                try:
                    value = float(raw)
                except ValueError:
                    value = math.nan
                if not math.isfinite(value):
                    fail(f"{role} CSV {table.path}, row {line_no}: {col}={raw!r} is not a number")


def id_mismatch(a: Table, b: Table, id_col: str) -> dict[str, list[str]]:
    ids_a = [r[id_col].strip() for r in a.rows]
    ids_b = [r[id_col].strip() for r in b.rows]
    set_a, set_b = set(ids_a), set(ids_b)
    return {
        "only_a": [i for i in ids_a if i not in set_b],
        "only_b": [i for i in ids_b if i not in set_a],
    }


def read_asset(name: str) -> str:
    path = ASSETS / name
    if not path.is_file():
        fail(f"skill asset missing: {path}")
    return path.read_text(encoding="utf-8")


def inline_script(code: str, name: str) -> str:
    # A literal "</script" would terminate the inline <script> element early.
    if re.search(r"</script", code, re.IGNORECASE):
        fail(f"asset {name} contains '</script' and cannot be inlined safely")
    return code


def inline_style(code: str, name: str) -> str:
    if re.search(r"</style", code, re.IGNORECASE):
        fail(f"asset {name} contains '</style' and cannot be inlined safely")
    return code


def notices_comment() -> str:
    # The vendored MIT licenses require their notices in every copy, and every
    # dashboard is a copy, so the notices file is embedded as an HTML comment.
    path = SKILL_DIR / "THIRD_PARTY_NOTICES.md"
    if not path.is_file():
        fail(f"skill file missing: {path}")
    text = path.read_text(encoding="utf-8")
    if any(token in text for token in ("-->", "<!--", "--!>")):
        fail(f"{path.name} contains a sequence that would end an HTML comment")
    return text


def json_for_script(payload: dict) -> str:
    # Escaping every "<" makes "</script" and "<!--" impossible inside the JSON block.
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    return text.replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def render(cfg: dict, payload: dict) -> str:
    template = read_asset("template.html")
    parts = {
        "TITLE": html_escape(cfg["title"]),
        "LANG": cfg["lang"],
        "NOTICES": notices_comment(),
        "VENDOR_CSS": inline_style(read_asset("vendor/tabulator.min.css"), "tabulator.min.css"),
        "APP_CSS": inline_style(read_asset("app.css"), "app.css"),
        "VENDOR_PAPAPARSE": inline_script(read_asset("vendor/papaparse.min.js"), "papaparse.min.js"),
        "VENDOR_TABULATOR": inline_script(read_asset("vendor/tabulator.min.js"), "tabulator.min.js"),
        "APP_JS": inline_script(read_asset("app.js"), "app.js"),
        "DATA_JSON": json_for_script(payload),
    }
    found = set(re.findall(r"\{\{([A-Z_]+)\}\}", template))
    if found != set(parts):
        fail(f"template placeholders {sorted(found)} do not match {sorted(parts)}")
    # Single pass so inserted content is never re-scanned for placeholders.
    return re.sub(r"\{\{([A-Z_]+)\}\}", lambda m: parts[m.group(1)], template)


def html_escape(text: str) -> str:
    return (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;"))


def build(config_path: Path, out_path: Path, csv_override: Path | None,
          csv_b_override: Path | None) -> list[str]:
    if not config_path.is_file():
        fail(f"config not found: {config_path}")
    try:
        raw_cfg = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        fail(f"config is not valid JSON ({e}): {config_path}")
    cfg = validate_config(raw_cfg)
    data = cfg["data"]
    base = config_path.resolve().parent

    path_a = csv_override.resolve() if csv_override else base / data["csv"]
    table_a = read_csv(path_a, "A" if data.get("csv_b") else "data")
    validate_table(table_a, cfg, "A" if data.get("csv_b") else "data")

    table_b = None
    if csv_b_override and not data.get("csv_b"):
        fail("--csv-b was given but config.data.csv_b is not set")
    if data.get("csv_b"):
        path_b = csv_b_override.resolve() if csv_b_override else base / data["csv_b"]
        table_b = read_csv(path_b, "B")
        validate_table(table_b, cfg, "B")

    warnings: list[str] = []
    mismatch = {"only_a": [], "only_b": []}
    if table_b is not None:
        mismatch = id_mismatch(table_a, table_b, cfg["columns"]["id"])
        if mismatch["only_a"]:
            warnings.append(f"ids only in A ({len(mismatch['only_a'])}): {mismatch['only_a']}")
        if mismatch["only_b"]:
            warnings.append(f"ids only in B ({len(mismatch['only_b'])}): {mismatch['only_b']}")

    payload = {
        "config": cfg,
        "a": {"name": table_a.path.name, "headers": table_a.headers, "rows": table_a.rows},
        "b": None if table_b is None else {
            "name": table_b.path.name, "headers": table_b.headers, "rows": table_b.rows},
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(render(cfg, payload), encoding="utf-8")
    return warnings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--config", required=True, type=Path, help="config JSON file")
    parser.add_argument("--out", required=True, type=Path, help="output HTML file")
    parser.add_argument("--csv", type=Path, help="override config.data.csv")
    parser.add_argument("--csv-b", type=Path, help="override config.data.csv_b")
    args = parser.parse_args()
    try:
        warnings = build(args.config, args.out, args.csv, args.csv_b)
    except BuildError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    for w in warnings:
        print(f"warning: {w} (also shown as a banner in the dashboard)", file=sys.stderr)
    print(f"wrote {args.out} ({args.out.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
