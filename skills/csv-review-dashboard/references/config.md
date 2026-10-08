# Config reference

The config is one JSON object. Unknown keys anywhere are a build error, so a typo
fails loudly instead of being ignored. CSV paths are resolved relative to the config
file.

## Top level

| Key | Required | Type | Meaning |
|-----|----------|------|---------|
| `title` | yes | string | Page title and heading. Also part of the review storage key. |
| `lang` | no (default `"ja"`) | `"ja"` \| `"en"` | Language of all UI text. |
| `tabs` | yes | list | Non-empty, no repeats, from `overview`, `compare`, `review`, `table`. The first entry is the tab shown on open. |
| `data` | yes | object | Which CSV files to use and whether to embed them. See below. |
| `columns` | yes | object | Roles of CSV columns. See below. |
| `order` | no | object | `{ "<column>": ["value", ...] }` - display order for category / status / verdict values. |
| `histogram` | no | string | A metric column with `aggregate` `mean` or `sum` to plot as a histogram in the overview. Defaults to the first such metric. |
| `review` | only with the `review` tab | object | `{ "labels": [...] }`. See below. |

## `data`

| Key | Required | Meaning |
|-----|----------|---------|
| `csv` | yes | The main CSV (side A when comparing). |
| `csv_b` | required by `compare` | The second CSV (side B). |
| `label_a`, `label_b` | no (default `A`, `B`) | Short names shown everywhere, for example `"現行"` and `"新"`. |
| `mode` | no (default `"embed"`) | `"embed"` inlines the rows into the HTML. `"load"` writes no rows; the page reads the CSV each time it opens. `--mode` on the command line overrides it. |

In both modes the build reads the CSVs and runs every check below. The config in the
HTML keeps only the file names (`golden_model_a.csv`), never the paths.

### Default CSV location in load mode

A load-mode HTML also stores each CSV's path relative to the output HTML's folder,
with `/` separators (`golden_model_a.csv` when the HTML is written beside it,
`../data/golden_model_a.csv` when it is not). Absolute paths are never stored: when the
CSV and the HTML share no folder below the filesystem root, the build stores just the
file name and prints a warning.

When the page is opened:

- over `http:` or `https:`, it fetches each default path (`cache: 'no-store'`) and
  checks the file like a picked one. "読み込み直す" / Reload fetches it again.
- from `file:`, or when the fetch fails (404, network, Content-Security-Policy, parse
  or column error), it shows the picker with a one-line reason. In Chromium browsers a
  file picked earlier is offered as "前回のファイルを読み込む".

The file picker and drop work in every case. A file loaded in the browser is checked
against the same rules as the build; a file that fails stays unloaded and the error is
shown.

### Review storage key in load mode

Embed mode keys review labels by the title plus the full data, so a different snapshot
starts with no labels. Load mode exists so the same CSV can be reloaded after it
changes, so it keys labels by the title plus the sorted set of ids instead: labels
survive a reload as long as the ids are the same, even when the text or metrics
changed. Adding or removing an id gives a new key and an empty review; export the
labels before changing the id set.

CSV requirements, checked at build time and again when a file is loaded in the browser:

- UTF-8 (a BOM is fine), a header row, no duplicate header names, and the same number
  of fields in every row. Quoted fields may contain commas, quotes, and newlines.
- Every column named in `columns` must exist in the header.
- The id column must be non-empty and unique in each file.
- With the `review` tab, `human_label` and `human_note` must not already be columns.

## `columns`

| Key | Required | Meaning |
|-----|----------|---------|
| `id` | yes | Unique key per row. Compare pairs A and B rows by it; review stores labels by it. |
| `text` | no | List of long-text columns in reading order (question, answer, evidence...). Shown in full in review and compare details; truncated with an expand button in the table. The first one is the preview in the compare list. |
| `category` | no | Grouping dimension: filter drop-down, bars in the overview, table grouping. |
| `status` | no | Workflow state (for example 未対応 / 対応中 / 対応済). Stacks the category bars and gets colors. |
| `verdict` | no | A model's judgment (for example supported / contradicted). Same role as `status`; if both are set, `status` stacks the bars. |
| `metrics` | required by `compare` | List of metric objects. |

A metric object:

| Key | Required | Meaning |
|-----|----------|---------|
| `column` | yes | CSV column. |
| `label` | no (default: the column name) | Display name. |
| `unit` | no | Suffix such as `ms` or `USD`. |
| `aggregate` | yes | `rate`: boolean column, shown as the share of true values. `mean`: average, with p50 and p95. `sum`: total, with the per-item average. |
| `better` | yes | `higher` or `lower`. Decides the direction of deltas and of regressions. |
| `regression_threshold` | no, numeric metrics only | Smallest change, in the metric's unit, that counts as a regression or an improvement. Not allowed on `rate`. |

Values: an empty cell means "no value" and is left out of n. A `rate` cell must be one
of `true/false`, `1/0`, `yes/no`, `y/n`, `t/f` (any case). A `mean` / `sum` cell must
be a finite number.

### How compare classifies a pair

For each metric where both A and B have a value:

- `rate`: if A has the good value (true for `better: "higher"`) and B does not, the
  item **regressed** (a flip). The reverse flip is an **improvement**.
- `mean` / `sum` with `regression_threshold` T: if B is worse than A by more than T,
  the item regressed; better by more than T, it improved. Severity is the change
  divided by T (by A's value when T is 0).
- `mean` / `sum` without a threshold: shown in the detail view but never classifies.

An item that regressed on any metric is "regressed" even if it improved on others.
The regressions list sorts flips first, then by severity. The metric tiles compare
the aggregates of paired items only, so A and B are measured on the same ids.

## `order`

Values listed in `order` come first in that order; values not listed follow in
first-seen order, and listed values absent from the data are skipped. Colors for
status / verdict values are assigned once, from the whole dataset, in this order, so
a value keeps its color when filters hide others. Up to 8 values get distinct colors;
beyond that, values from the 8th on share the "Other" color.

## `review`

| Key | Meaning |
|-----|---------|
| `labels` | 1 to 9 distinct non-empty strings. Key `1` picks the first label, and so on. |

Review always works on side A. Export adds `human_label` and `human_note` to the
original columns, in the original row order, as UTF-8 with BOM.

## Examples

All three are in `examples/` with synthetic CSVs.

### Model A vs B on a golden dataset

```json
{
  "title": "ゴールデンデータセット: 現行モデル vs 新モデル",
  "lang": "ja",
  "tabs": ["compare", "overview", "table"],
  "data": {
    "csv": "golden_model_a.csv",
    "csv_b": "golden_model_b.csv",
    "label_a": "現行",
    "label_b": "新"
  },
  "columns": {
    "id": "id",
    "text": ["question", "expected_answer", "answer"],
    "category": "category",
    "metrics": [
      {"column": "correct", "label": "正答率", "aggregate": "rate", "better": "higher"},
      {"column": "latency_ms", "label": "レイテンシ", "unit": "ms", "aggregate": "mean", "better": "lower", "regression_threshold": 300},
      {"column": "cost_usd", "label": "コスト", "unit": "USD", "aggregate": "sum", "better": "lower", "regression_threshold": 0.001}
    ]
  },
  "histogram": "latency_ms"
}
```

### Fact-check human review

```json
{
  "title": "ファクトチェックのレビュー",
  "lang": "ja",
  "tabs": ["review", "overview", "table"],
  "data": {"csv": "factcheck.csv"},
  "columns": {
    "id": "id",
    "text": ["claim", "source_excerpt", "llm_rationale"],
    "category": "category",
    "verdict": "llm_verdict"
  },
  "order": {"llm_verdict": ["supported", "contradicted", "unverifiable"]},
  "review": {"labels": ["正しい", "誤り", "保留"]}
}
```

### Feedback triage

```json
{
  "title": "フィードバックの対応状況",
  "lang": "ja",
  "tabs": ["overview", "table"],
  "data": {"csv": "feedback.csv"},
  "columns": {
    "id": "id",
    "text": ["feedback_text"],
    "category": "category",
    "status": "status"
  },
  "order": {"status": ["未対応", "対応中", "対応済"]}
}
```
