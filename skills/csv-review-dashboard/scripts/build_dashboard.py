#!/usr/bin/env python3
"""Build a single self-contained HTML dashboard from local CSV, JSON, or JSONL files.

Usage:
    python3 build_dashboard.py --config cfg.json --out out.html [--csv a.csv] [--csv-b b.csv]
        [--mode embed|load]

Data paths in the config are resolved relative to the config file; --csv / --csv-b
override them (resolved relative to the current directory). The format follows the
extension (.csv, .json, .jsonl); nested JSON objects become dot-separated columns. In
"load" mode the files are still read and validated, but no rows are written to the HTML:
it stores each file's path relative to the output HTML, fetches it on open when served
over http(s), and otherwise asks for the file. Python 3 stdlib only.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import os
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
MODES = ("embed", "load")

TOP_KEYS = {"title", "lang", "tabs", "data", "columns", "order", "histogram", "review"}
DATA_KEYS = {"csv", "csv_b", "label_a", "label_b", "mode", "records_path"}
COLUMN_KEYS = {"id", "text", "category", "status", "verdict", "metrics"}
METRIC_KEYS = {"column", "label", "unit", "aggregate", "better", "regression_threshold"}
REVIEW_KEYS = {"labels"}

# Boolean spellings accepted for aggregate "rate". Must match parseBool() in app.js.
TRUE_VALUES = {"true", "1", "yes", "y", "t"}
FALSE_VALUES = {"false", "0", "no", "n", "f"}

# Input formats by file extension. Must match formatOf() in app.js.
FORMATS = (".csv", ".json", ".jsonl")

# Larger numbers lose precision in the browser (JavaScript doubles), so ids beyond this
# would silently change or collide there. Must match MAX_SAFE_ID in app.js.
MAX_SAFE_INTEGER = 2**53 - 1

# Added to exported review CSVs; a source file must not already use them.
REVIEW_EXPORT_COLUMNS = ("human_label", "human_note")

# Embed mode makes no requests at all. Load mode may fetch its default data file(s) from the
# same origin when the page is served over http(s); nothing else is allowed.
CSP_EMBED = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:"
CSP_LOAD = CSP_EMBED + "; connect-src 'self'"


class BuildError(Exception):
    """A user-facing error: bad config, missing file, or invalid CSV / JSON content."""


@dataclass(frozen=True)
class Table:
    path: Path
    headers: list[str]
    # CSV cells are strings. JSON cells keep their JSON value: str, int, float, bool, None,
    # or a list / dict that flattening left in place.
    rows: list[dict[str, object]]
    # Where each row came from, for error messages ("row 3", "line 3", "record 3").
    locations: list[str]


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
    for key in ("csv_b", "label_a", "label_b", "records_path"):
        optional_str(data, key, "config.data")
    mode = data.setdefault("mode", "embed")
    if mode not in MODES:
        fail(f"config.data.mode must be one of {list(MODES)}, got {mode!r}")
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


def read_table(path: Path, role: str, records_path: str | None) -> Table:
    if not path.is_file():
        fail(f"{role} file not found: {path}")
    suffix = path.suffix.lower()
    if suffix not in FORMATS:
        fail(f"{role} file {path}: unknown extension {path.suffix!r}; use one of {list(FORMATS)}")
    if records_path and suffix != ".json":
        fail(f"{role} file {path}: config.data.records_path only applies to .json files")
    if suffix == ".csv":
        return read_csv(path, role)
    return read_json(path, role, records_path)


def read_csv(path: Path, role: str) -> Table:
    try:
        with path.open(encoding="utf-8-sig", newline="") as f:
            reader = csv.reader(f)
            headers = next(reader, None)
            if not headers:
                fail(f"{role} CSV is empty: {path}")
            if len(set(headers)) != len(headers):
                dupes = sorted({h for h in headers if headers.count(h) > 1})
                fail(f"{role} CSV has duplicate header(s) {dupes}: {path}")
            rows, locations = [], []
            for line_no, values in enumerate(reader, start=2):
                if not any(v.strip() for v in values):
                    continue
                if len(values) != len(headers):
                    fail(f"{role} CSV {path}, row {line_no}: expected {len(headers)} "
                         f"fields, got {len(values)}")
                rows.append(dict(zip(headers, values)))
                locations.append(f"row {line_no}")
    except UnicodeDecodeError as e:
        fail(f"{role} CSV is not UTF-8 ({e.reason} at byte {e.start}): {path}")
    except csv.Error as e:
        fail(f"{role} CSV could not be parsed ({e}): {path}")
    return Table(path=path, headers=headers, rows=rows, locations=locations)


def reject_constant(name: str) -> None:
    # json.loads accepts NaN / Infinity, which are not JSON and which JSON.parse rejects.
    raise ValueError(f"{name} is not valid JSON")


def read_json(path: Path, role: str, records_path: str | None) -> Table:
    """Read a .json array (or the array at records_path) or .jsonl, one object per record."""
    try:
        text = path.read_text(encoding="utf-8-sig")
    except UnicodeDecodeError as e:
        fail(f"{role} file is not UTF-8 ({e.reason} at byte {e.start}): {path}")

    def parse(source: str, where: str) -> object:
        try:
            return json.loads(source, parse_constant=reject_constant)
        except ValueError as e:  # JSONDecodeError is a ValueError
            fail(f"{role} file {path}, {where}: invalid JSON ({e})")

    records: list[tuple[str, object]] = []
    if path.suffix.lower() == ".jsonl":
        # split("\n"), not splitlines(): JSON strings may contain U+2028 and friends.
        for line_no, line in enumerate(text.split("\n"), start=1):
            if line.strip():
                records.append((f"line {line_no}", parse(line, f"line {line_no}")))
    else:
        node = parse(text, "document")
        if records_path:
            walked = []
            for key in records_path.split("."):
                walked.append(key)
                if not isinstance(node, dict) or key not in node:
                    fail(f"{role} file {path}: records_path {records_path!r} not found "
                         f"(no key {'.'.join(walked)!r})")
                node = node[key]
        if not isinstance(node, list):
            hint = "" if records_path else (
                "; if the records are under a key, set config.data.records_path"
                + (f" (top-level keys: {sorted(node)})" if isinstance(node, dict) else ""))
            fail(f"{role} file {path}: expected an array of records, got "
                 f"{type(node).__name__}{hint}")
        records = [(f"record {i}", rec) for i, rec in enumerate(node, start=1)]

    headers: dict[str, None] = {}
    flat_rows = []
    for where, rec in records:
        if not isinstance(rec, dict):
            fail(f"{role} file {path}, {where}: a record must be a JSON object, "
                 f"got {type(rec).__name__}")
        flat: dict[str, object] = {}
        flatten(rec, "", flat, f"{role} file {path}, {where}")
        headers.update(dict.fromkeys(flat))
        flat_rows.append(flat)
    if not records:
        fail(f"{role} file has no records: {path}")
    names = list(headers)
    # A key missing from a record is an empty cell, as in a CSV.
    rows = [{h: flat.get(h, "") for h in names} for flat in flat_rows]
    return Table(path=path, headers=names, rows=rows, locations=[w for w, _ in records])


def flatten(obj: dict, prefix: str, out: dict[str, object], where: str) -> None:
    """Nested non-empty objects become "parent.child" columns; other values stay as is."""
    for key, value in obj.items():
        name = prefix + key
        if isinstance(value, dict) and value:
            flatten(value, name + ".", out, where)
        elif name in out:
            fail(f"{where}: column {name!r} appears twice after flattening nested objects")
        else:
            out[name] = value


def cell_text(value: object) -> str:
    """A scalar cell as the CSV text it stands for. Must match toCell() in app.js."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return repr(value)
    return value


def configured_columns(cfg: dict) -> list[str]:
    cols = cfg["columns"]
    names = [cols["id"], *cols["text"], *(m["column"] for m in cols["metrics"])]
    names += [cols[k] for k in ("category", "status", "verdict") if cols.get(k)]
    return list(dict.fromkeys(names))


def validate_table(table: Table, cfg: dict, role: str) -> None:
    where = f"{role} file {table.path}"
    missing = [c for c in configured_columns(cfg) if c not in table.headers]
    if missing:
        fail(f"{where}: configured column(s) {missing} not in header {table.headers}")
    if "review" in cfg["tabs"]:
        clash = [c for c in REVIEW_EXPORT_COLUMNS if c in table.headers]
        if clash:
            fail(f"{where}: column(s) {clash} are reserved for review export")

    # Only text columns may hold JSON arrays / objects; the others are compared and counted.
    cols = cfg["columns"]
    scalar_cols = set(configured_columns(cfg)) - set(cols["text"])
    for loc, row in zip(table.locations, table.rows):
        for col in scalar_cols:
            if isinstance(row[col], (list, dict)):
                fail(f"{where}, {loc}: column {col!r} holds a JSON array or object; only "
                     "columns.text columns may")

    id_col = cols["id"]
    seen: dict[str, str] = {}
    for loc, row in zip(table.locations, table.rows):
        value = row[id_col]
        if isinstance(value, (int, float)) and not isinstance(value, bool) \
                and abs(value) > MAX_SAFE_INTEGER:
            fail(f"{where}, {loc}: id {value!r} is beyond 2^53-1 and would change in the "
                 "browser; store ids as strings")
        rid = cell_text(value).strip()
        if not rid:
            fail(f"{where}, {loc}: empty id in column {id_col!r}")
        if rid in seen:
            fail(f"{where}: duplicate id {rid!r} ({seen[rid]} and {loc})")
        seen[rid] = loc

    for m in cols["metrics"]:
        col = m["column"]
        for loc, row in zip(table.locations, table.rows):
            raw = cell_text(row[col]).strip()
            if not raw:
                continue  # empty means "no value"; excluded from n
            if m["aggregate"] == "rate":
                if raw.lower() not in TRUE_VALUES | FALSE_VALUES:
                    fail(f"{where}, {loc}: {col}={raw!r} is not a boolean "
                         f"(use one of {sorted(TRUE_VALUES | FALSE_VALUES)})")
            else:
                try:
                    value = float(raw)
                except ValueError:
                    value = math.nan
                if not math.isfinite(value):
                    fail(f"{where}, {loc}: {col}={raw!r} is not a number")


def id_mismatch(a: Table, b: Table, id_col: str) -> dict[str, list[str]]:
    ids_a = [cell_text(r[id_col]).strip() for r in a.rows]
    ids_b = [cell_text(r[id_col]).strip() for r in b.rows]
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
        "CSP": CSP_LOAD if cfg["data"]["mode"] == "load" else CSP_EMBED,
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


def relative_to_html(csv_path: Path, out_path: Path) -> str | None:
    """The data file's path relative to the HTML's folder, in posix form.

    None when the two share no folder below the filesystem root: such a path climbs to
    the root and spells out the absolute location, which the HTML must not carry.
    """
    csv_abs, out_dir = csv_path.resolve(), out_path.resolve().parent
    try:
        common = Path(os.path.commonpath([csv_abs, out_dir]))
    except ValueError:  # different drives on Windows
        return None
    if common == Path(common.anchor):
        return None
    return Path(os.path.relpath(csv_abs, out_dir)).as_posix()


def html_escape(text: str) -> str:
    return (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;"))


def build(config_path: Path, out_path: Path, csv_override: Path | None,
          csv_b_override: Path | None, mode_override: str | None) -> list[str]:
    if not config_path.is_file():
        fail(f"config not found: {config_path}")
    try:
        raw_cfg = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        fail(f"config is not valid JSON ({e}): {config_path}")
    cfg = validate_config(raw_cfg)
    data = cfg["data"]
    if mode_override:
        data["mode"] = mode_override
    base = config_path.resolve().parent

    records_path = data.get("records_path")
    path_a = csv_override.resolve() if csv_override else base / data["csv"]
    table_a = read_table(path_a, "A" if data.get("csv_b") else "data", records_path)
    validate_table(table_a, cfg, "A" if data.get("csv_b") else "data")

    table_b = None
    if csv_b_override and not data.get("csv_b"):
        fail("--csv-b was given but config.data.csv_b is not set")
    if data.get("csv_b"):
        path_b = csv_b_override.resolve() if csv_b_override else base / data["csv_b"]
        table_b = read_table(path_b, "B", records_path)
        validate_table(table_b, cfg, "B")

    warnings: list[str] = []
    mismatch = {"only_a": [], "only_b": []}
    if table_b is not None:
        mismatch = id_mismatch(table_a, table_b, cfg["columns"]["id"])
        banner = "(also shown as a banner in the dashboard)"
        if mismatch["only_a"]:
            warnings.append(f"ids only in A ({len(mismatch['only_a'])}): {mismatch['only_a']} {banner}")
        if mismatch["only_b"]:
            warnings.append(f"ids only in B ({len(mismatch['only_b'])}): {mismatch['only_b']} {banner}")

    # The HTML may be shared, so it never carries the build machine's absolute paths. The
    # config keeps file names, which load mode shows as the files to pick.
    data["csv"] = table_a.path.name
    if table_b is not None:
        data["csv_b"] = table_b.path.name
    if data["mode"] == "load":
        # Relative to the HTML, so a page served over http fetches the file beside it.
        defaults = {}
        for side, table in (("a", table_a), ("b", table_b)):
            if table is None:
                continue
            rel = relative_to_html(table.path, out_path)
            if rel is None:
                rel = table.path.name
                warnings.append(f"{table.path} shares no folder with {out_path}, so the default "
                                f"path is just {rel!r}; put the HTML next to the data file to auto-load it")
            defaults[side] = rel
        payload = {"config": cfg, "a": None, "b": None, "default_paths": defaults}
    else:
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
    parser.add_argument("--csv", type=Path, help="override config.data.csv (.csv, .json or .jsonl)")
    parser.add_argument("--csv-b", type=Path, help="override config.data.csv_b")
    parser.add_argument("--mode", choices=MODES, help="override config.data.mode")
    args = parser.parse_args()
    try:
        warnings = build(args.config, args.out, args.csv, args.csv_b, args.mode)
    except BuildError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    for w in warnings:
        print(f"warning: {w}", file=sys.stderr)
    print(f"wrote {args.out} ({args.out.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
