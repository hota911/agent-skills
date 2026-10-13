# Config reference

The config is one JSON object. Unknown keys anywhere are a build error, so a typo
fails loudly instead of being ignored. CSV paths are resolved relative to the config
file.

## Top level

| Key | Required | Type | Meaning |
|-----|----------|------|---------|
| `title` | yes | string | Page title and heading. Also part of the review storage key. |
| `lang` | no (default `"ja"`) | `"ja"` \| `"en"` | Language of all UI text. |
| `item_label` | no | string | What one row is, for example `"質問"` or (English, plural) `"questions"`. Every count on the page uses it instead of 件 / items: 「表示 60 / 60 質問」, 「比較した質問の数」, 「悪化した質問」. Without it the page keeps the generic wording. English always uses the plural ("1 questions"). No leading or trailing spaces, no braces. |
| `tabs` | yes | list | Non-empty, no repeats, from `overview`, `compare`, `review`, `table`, `release`, `experiment`, `report`. The first entry is the tab shown on open. `release` and `experiment` cannot both appear; build a separate page for each. |
| `data` | yes | object | Which CSV files to use and whether to embed them. See below. |
| `columns` | yes | object | Roles of CSV columns. See below. |
| `order` | no | object | `{ "<column>": ["value", ...] }` - display order for category / status / verdict values. |
| `histogram` | no | string | A metric column with `aggregate` `mean` or `sum` to plot as a histogram in the overview. Defaults to the first such metric. |
| `review` | only with the `review` tab | object | `{ "labels": [...] }`. See below. |
| `release` | only with the `release` tab | object | Release criteria, review labels, and the optional record and report. See below. |
| `experiment` | only with the `experiment` tab | object | The hypothesis, criteria, verdict labels, review labels, and the optional record and report. See below. |
| `extra_tabs` | no | list | `[{"id": "...", "title": "...", "script": "tab.js"}]` - tabs written for this page when the built-in ones do not cover the request. They follow the `tabs` entries. `script` is a `.js` file resolved relative to the config file. Ids are unique and must not be a built-in tab name. See [extra-tabs.md](extra-tabs.md). |

## `data`

| Key | Required | Meaning |
|-----|----------|---------|
| `csv` | yes | The main data file (side A, the current model, when comparing): `.csv`, `.json`, or `.jsonl`, chosen by extension. |
| `candidates` | required by `compare`, `release`, and `experiment` | List of `{"file": "...", "label": "..."}`, one per model compared against `csv`, same formats. The compare view has a picker for them. Labels must be unique and differ from `label_a`. |
| `records_path` | no | Only for `.json` files whose top level is an object: the dotted path to the record array, for example `"data.items"`. Applies to every file. An error with a `.csv` or `.jsonl` file. |
| `label_a` | no (default `A`) | Short name of `csv` shown everywhere, for example `"現行"`. |

`csv_b` and `label_b` were replaced by `candidates`; a config that still uses them
fails with the rewrite to use (`{"candidates": [{"file": "<csv_b>", "label": "<label_b>"}]}`).
The `--csv-b` command-line option was removed with them.
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

Data requirements, checked at build time and again when a file is loaded in the browser.
For CSV:

- UTF-8 (a BOM is fine), a header row, no duplicate header names, and the same number
  of fields in every row. Quoted fields may contain commas, quotes, and newlines.
- Every column named in `columns` must exist in the header.
- The id column must be non-empty and unique in each file.
- With the `review` tab, `human_label` and `human_note` must not already be columns.

### JSON and JSONL

The same checks apply after the records are turned into rows:

- UTF-8 (a BOM is fine). `.jsonl`: one JSON object per line; blank lines are skipped.
  `.json`: an array of objects, or an object holding it at `records_path`. Invalid
  JSON (including `NaN` / `Infinity`), a record that is not an object, or a missing
  `records_path` key is an error that names the line or record.
- Nested objects are flattened into dot-separated column names: `{"llm": {"verdict":
  "supported"}}` becomes the column `llm.verdict`. Use these names in `columns`,
  `order`, and `histogram`. Two keys that flatten to the same name (a literal
  `"llm.verdict"` key next to a nested one) are an error.
- Columns are the union of keys in first-seen order. A key missing from a record is an
  empty cell; `null` is also an empty cell.
- Numbers and booleans become the text a CSV would hold (`0.92`, `true`), so `rate`,
  `mean`, and `sum` metrics read them as usual. A numeric id larger in magnitude than 2^53 - 1
  is an error, because a browser cannot represent it exactly; store such ids as strings.
- A value that is still an array or object (for example `citations: [...]`) may only be
  in a `columns.text` column. Review and compare details show it as pretty-printed
  JSON; the table, search, and exports use compact JSON. It is an error in any other
  configured column.
- Exports are CSV regardless of the input format.

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
| `better` | yes | `higher` or `lower`: decides the direction of deltas and of regressions. `none`: a metric without a direction (for example the answer length), shown for reference only. Its differences are plain signed numbers without ▲▼, better/worse, or colour; it never classifies an item (a `rate` flip included); and the compare tab says it is not used to call a change better or worse. |
| `regression_threshold` | no, numeric metrics only | Smallest change, in the metric's unit, that counts as a regression or an improvement. Not allowed on `rate` or with `better: "none"`. |
| `format` | no | `"percent"`: a `mean` of values between 0 and 1 (for example the average score of 3 runs) is shown as % (66.7%), and its differences, threshold, and 95% interval as pt (+14pt), as a `rate` is. Only the display changes: the data, the record JSON, and the CSV exports keep 0.667, and `regression_threshold` and the criteria's bounds are written as fractions (0.2 means 20pt, `"min": 0.75` means 75%). Allowed only with `aggregate: "mean"` and without `unit`. The build does not check that the values lie between 0 and 1 (1.2 is shown as 120%). |

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
- `better: "none"`: skipped; shown for reference only.

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

## `release`

Needs at least one entry in `data.candidates` and in `columns.metrics`.

| Key | Required | Meaning |
|-----|----------|---------|
| `criteria` | yes | Non-empty list of criteria, all of which a candidate must meet. |
| `review_labels` | no (default `["許容","不可"]`, English `["acceptable","unacceptable"]`) | 2 to 9 distinct non-empty strings for reviewing regressed items. The last one rejects the item. Keys 1-9 pick them. |
| `record` | needed by `report` | A `.json` record exported from the release tab. Checked against the config and the data at build time. |
| `report` | only with the `report` tab | A `.md` report whose frontmatter verdicts are checked against the record. See [release-report.md](release-report.md). |

The `report` tab and `release.report` require each other.

A criterion object, by `type`:

| `type` | Keys | Passes when |
|--------|------|-------------|
| `absolute` | `metric` (not one with `better: "none"`; the same applies to `relative`), `min` and/or `max` | The candidate's aggregate of the metric is within the bounds. For a `rate` metric or one with `format: "percent"` the bounds are fractions (0.85 means 85%). |
| `relative` | `metric`, exactly one of `max_worse` / `max_worse_pct` | The candidate is worse than the current model by at most `max_worse` (in the metric's unit; a fraction for `rate` and `format: "percent"`, so 0.02 means 2pt) or `max_worse_pct` percent of the current value. Getting better always passes. |
| `regressions` | `max` (integer >= 0), optional `count` | The number of regressed items is at most `max`. With `count: "all"` (the default) every regressed item counts, and review never changes the result. With `count: "unaccepted"` items reviewed with any label but the last one (accepted) are not counted; unreviewed items and items with the last label are. While the count exceeds `max` only because unreviewed items are counted, the criterion is "△ awaiting review" (レビュー待ち) instead of not met, and the verdict is the middle one. Its name becomes 受け入れていない悪化した項目の数 (Regressed items not accepted). |
| `critical_categories` | `categories` (needs `columns.category`) | No regressed item is in one of these categories. Each value must occur in the current model's data. |

`metric` is a column in `columns.metrics`. Aggregates use paired items only (ids
present on both sides with a value on both), the same as the compare view. An
`absolute` or `relative` criterion with no paired values fails.

Verdicts, per candidate, over all paired items regardless of the filter bar:

1. 出さない (`no-go`): a criterion fails, or a regressed item is labelled with the last
   review label.
2. 要レビュー (`review`): otherwise, a regressed item has no label yet. A criterion
   awaiting review (`count: "unaccepted"`) always leaves an item unreviewed, so it lands
   here.
3. 出してよい (`go`): otherwise.

`{"type": "regressions", "max": 0, "count": "unaccepted"}` and leaving out `regressions`
both let review decide the regressed items, and a single item labelled with the last
label gives the worst verdict either way. The difference is what the page and the record
show: with the criterion, the pre-written condition ("no regressed item, unless a person
accepts it after looking") appears as a criterion row, as "△ awaiting review" while items
are unreviewed, and in the record JSON as `"pending": true` on that criterion (its
`value` is the number of counted items). Write it when the user's criteria say regressions
must be accepted by review; leave `regressions` out only when they say nothing about the
number of regressed items.

The release tab also shows each metric's n and the 95% interval of the paired
difference (mean of the per-item differences ± 1.96 standard errors, times n for `sum`
metrics; shown when n >= 2). The interval is for reference only and never changes a
verdict.

### Review of regressed items

Each candidate has its own review of its regressed items, stored in the browser's
localStorage. The key is the title, the candidate label, and the current and candidate
data (in load mode, their sorted ids), plus the embedded record's reviews when there
is one. Reviews in `release.record` are the starting values, so a teammate opening the
built HTML sees the reviews that the record was exported with.

### Record

"記録を書き出す (JSON)" and "(Markdown)" on the release tab download
`release_record_YYYYMMDD-HHMM.json` / `.md`. Neither holds reviewer names or review
times. The JSON holds `kind` (`"eval-review/release-record"`), `version` (1),
`title`, `exported_at`, `files.current` (label and file name), `criteria`,
`review_labels`, and per candidate: `label`, `file`, `verdict`, the counts `paired`,
`regressed`, `unreviewed`, `rejected`, each criterion's `value` and `pass` (plus
`"pending": true` for a criterion awaiting review), each
metric's n, aggregates, difference and `ci95`, and `reviews` for every regressed item
(label `""` when unreviewed).

When `release.record` is set, the build fails unless the record's criteria,
review labels, current file, and candidate labels and files equal the config; every
review is for a regressed item and uses a review label; and each verdict equals the one
recomputed from the data and the record's reviews. A changed config or data file
therefore means exporting the record again.

## `experiment`

For sharing the result of an experiment (a new feature, a model change, a new method)
that tests a hypothesis against a baseline. Put the baseline in `data.csv` and each
condition in `data.candidates`. The aggregation, criteria, verdicts, review of
regressed items, record, and report check are the same as for `release`; only the
words differ. Write the hypothesis and the criteria before looking at the results, so
that a later change shows in the config's history.

| Key | Required | Meaning |
|-----|----------|---------|
| `hypothesis` | yes | Non-empty string. Shown on top of the experiment tab and in the record. |
| `criteria` | yes | Same as `release.criteria`. |
| `verdict_labels` | yes | `{"pass": "...", "review": "...", "fail": "..."}` - 3 distinct non-empty strings shown for the verdicts, chosen for the experiment, for example `{"pass": "改善した", "review": "要レビュー", "fail": "改善しなかった"}` or `{"pass": "仮説を支持", "review": "要レビュー", "fail": "支持しない"}`. |
| `review_labels` | no | Same as `release.review_labels`. |
| `record` | needed by `report` | A `.json` record exported from the experiment tab. Checked like `release.record`. |
| `report` | only with the `report` tab | A `.md` report. See [experiment-report.md](experiment-report.md). |

Verdict codes follow the same three steps as release: `fail` (a criterion fails, or a
regressed item has the last review label), `review` (a regressed item has no label
yet), `pass` (otherwise). The screen shows them with `verdict_labels`.

Each metric row also says how to read its 95% interval: "区間が0を含まない：差は誤差の
範囲を超えている可能性が高い" or "区間が0を含む：差は誤差の範囲かもしれない" (in English,
"Interval excludes 0: the difference is likely beyond noise" / "Interval includes 0:
the difference may be within noise"). As in release, the interval never changes a
verdict; a human interprets it in the report.

The record is the release record with `kind` `"eval-review/experiment-record"`,
plus `hypothesis` and `verdict_labels`; the files are named
`experiment_record_YYYYMMDD-HHMM.json` / `.md`. When `experiment.record` is set, the
build also fails unless the record's `hypothesis` and `verdict_labels` equal the config.

## Examples

`examples/` has synthetic CSVs for each job; the feedback example there also has
an extra tab (`feedback_weekly.js`, counts per week). `examples/factcheck_jsonl.config.json`
is the fact-check review on `factcheck.jsonl`, using flattened names
(`llm.verdict`, `llm.confidence`) and an array column (`citations`) in `text`.

### Model A vs B on a golden dataset

```json
{
  "title": "ゴールデンデータセット: 現行モデル vs 新モデル",
  "lang": "ja",
  "tabs": ["compare", "overview", "table"],
  "data": {
    "csv": "golden_model_a.csv",
    "label_a": "現行",
    "candidates": [{"file": "golden_model_b.csv", "label": "新"}]
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

### Release decision over several candidates

`examples/release.config.json`; `examples/release_report.config.json` adds the
`report` tab with `"record": "release_record.json"` and `"report": "release_report.md"`.

```json
{
  "title": "リリース判定: 現行モデルと候補3つ",
  "lang": "ja",
  "tabs": ["release", "compare", "overview", "table"],
  "data": {
    "csv": "release_current.csv",
    "label_a": "現行",
    "candidates": [
      {"file": "release_cand_b.csv", "label": "候補B"},
      {"file": "release_cand_c.csv", "label": "候補C"},
      {"file": "release_cand_d.csv", "label": "候補D"}
    ]
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
  "order": {"category": ["計算", "知識", "安全"]},
  "release": {
    "criteria": [
      {"type": "absolute", "metric": "correct", "min": 0.85},
      {"type": "relative", "metric": "latency_ms", "max_worse_pct": 10},
      {"type": "relative", "metric": "cost_usd", "max_worse": 0.005},
      {"type": "regressions", "max": 3},
      {"type": "critical_categories", "categories": ["安全"]}
    ]
  }
}
```

### Experiment against a baseline

`examples/experiment.config.json` (the baseline and three conditions, with the same
`data` and `columns` as above apart from the file names and labels);
`examples/experiment_report.config.json` adds the `report` tab with
`"record": "experiment_record.json"` and `"report": "experiment_report.md"`. The
experiment part:

```json
{
  "tabs": ["experiment", "compare", "overview", "table"],
  "experiment": {
    "hypothesis": "回答の前に検算させる指示を加えると、正答率が 95% 以上に上がり、レイテンシの悪化は 15% 以内に収まる。安全カテゴリの回答は悪化しない。",
    "criteria": [
      {"type": "absolute", "metric": "correct", "min": 0.95},
      {"type": "relative", "metric": "latency_ms", "max_worse_pct": 15},
      {"type": "regressions", "max": 2},
      {"type": "critical_categories", "categories": ["安全"]}
    ],
    "verdict_labels": {"pass": "仮説を支持", "review": "要レビュー", "fail": "支持しない"}
  }
}
```
