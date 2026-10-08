---
name: csv-review-dashboard
description: Turn local CSV files into one self-contained offline HTML dashboard for reviewing LLM or evaluation results - compare model A vs B on a golden dataset (regressions first), let a human label fact-check items with keyboard shortcuts and export the labels as CSV, or triage feedback by category and status. Use when the user has CSV results and asks to visualize, compare, review, label, or triage them, or says CSV を可視化, A/B 比較, レビュー画面, ファクトチェックの確認. Not for live databases, BI dashboards, or charts meant for slides.
---

# CSV Review Dashboard

Build a single HTML file from one or two CSV files plus a small JSON config. The file
opens from disk with no server and no network: Tabulator, PapaParse, the app code, and
the data are all inlined (or, in load mode, the data is picked when the page opens).
The user can then sort, filter, read long text, compare A/B,
record review labels, and export CSV.

Three jobs, selected by `tabs` in the config:

| Job | Tabs | What the reader gets |
|-----|------|----------------------|
| Model A vs B on a golden set | `compare`, `overview`, `table` | Counts of regressed / improved / unchanged items, metric deltas, a regressions-first list, and a side-by-side A/B detail view |
| Fact-check human review | `review`, `overview`, `table` | One item at a time, keys 1-9 to label, N for a note, autosave in the browser, CSV export with `human_label` and `human_note` |
| Feedback triage | `overview`, `table` | Category x status stacked bars, filters, and a full table with header filters and CSV download |

## Workflow

1. **Inspect the CSV headers and a few rows** before writing anything. Note the id
   column, long-text columns, the category / status / verdict columns, and numeric or
   boolean metric columns. Do not guess column names.
2. **Ask the user which data mode they want**, with these tradeoffs, before building:
   - `embed` (default): a fixed snapshot in one shareable file. The file contains
     every row of the CSV, so anyone it is shared with can read the data.
   - `load`: the HTML contains no data rows and asks for the CSV each time it opens,
     so a data update only needs "読み込み直す" / Reload. Safe to share; each viewer
     needs the CSV themselves.

   Set it as `data.mode` in the config or pass `--mode embed|load`.
3. **Write the config** next to the CSVs (paths in it resolve relative to the config
   file). Read [references/config.md](references/config.md) for every key and one
   example per job. Keep it minimal; unknown keys are an error by design.
4. **Build:**

   ```bash
   python3 <skill-dir>/scripts/build_dashboard.py --config review.config.json --out review.html [--mode load]
   ```

   Python 3 standard library only; nothing to install. `--csv` / `--csv-b`
   override the CSV paths for a one-off run (resolved from the current directory).
   Load mode still reads the CSVs at build time to check columns and ids.
5. **Read the build output.** It prints `wrote <path> (<bytes> bytes)` on success, or
   `error: ...` and exits 1. A warning such as `ids only in A (1): [...]` is not
   fatal; the same notice appears as a banner in the dashboard. Fix errors by
   correcting the config or telling the user what is wrong with the CSV; never edit
   the user's CSV silently.
6. **Verify before handing over.** If a browser tool is available, open the file and
   check each tab: no console errors, charts sized to their cards, numbers that match
   a quick count from the CSV (for example the number of rows and of `true` values).
   In load mode, load the CSV first (drop it on the page). If no browser is
   available, say so instead of claiming it renders.
7. **Hand the HTML file to the user** with a one-paragraph summary of what is in it
   and how to use it (which tab answers their question, keyboard keys for review,
   where the export button is). Mention any build warning. In load mode, name the
   CSV file(s) the page will ask for.

## Choosing the config for a request

- "Did the new model get worse anywhere?" -> `compare` first. Declare each metric with
  `aggregate` and `better`. Boolean pass/fail metrics use `aggregate: "rate"`; a
  true->false flip of a `better: "higher"` rate is a regression. For numeric metrics
  set `regression_threshold` in the metric's unit (for example 300 for latency in ms);
  a numeric metric without a threshold is shown but does not classify items.
- "I need to check the LLM's fact-check verdicts" -> `review` first, with the verdict
  column as `columns.verdict` and the labels the user wants (`["正しい","誤り","保留"]`).
  Put the claim, the evidence, and the rationale in `columns.text` in reading order.
- "Show me where the feedback stands" -> `overview` + `table` with `category` and
  `status`. Use `order` to put workflow states in their natural order instead of
  first-seen order.
- Set `lang` to `ja` or `en` to match the user. All UI text follows it.
- Add `table` almost always; it is the escape hatch for anything the charts omit.

## What the dashboard does (so you can explain it)

- **Overview:** stat tiles per metric (rate as % and k/n, mean with p50/p95, sum with
  per-item), horizontal bars of items per category stacked by status or verdict, and
  a histogram of one numeric metric. Every chart has hover tooltips and a "show as
  table" view. With two CSVs a toggle switches the overview between A and B.
- **Compare:** items are paired by id. Ids present on only one side are excluded and
  listed in a banner. Regressions sort flips first, then by size relative to the
  threshold. Selecting a row shows metrics side by side, text that is identical once,
  and text that differs as two columns.
- **Review:** applies to the first CSV (A). Labels and notes are stored in the
  browser's localStorage, keyed by the title and the data (in load mode, the title and
  the set of ids, so labels survive a data refresh), so reopening the same file
  resumes. Picking a label moves to the next item. Keys: left/right arrows move, 1-9
  pick a label, N focuses the note, Esc leaves the note. "Unreviewed only" filters the
  queue. Export writes the original columns plus `human_label` and `human_note`
  (UTF-8 with BOM so Excel opens it correctly).
- **Table:** Tabulator with sort, header filters (drop-downs for category / status /
  verdict), long text truncated with an expand button, optional grouping by category,
  and download of the currently filtered rows.
- **Loading other data:** the "load CSV" buttons and drag-and-drop replace the
  embedded data in the browser only (a dropped file replaces A). The same column
  checks as the build script run; a mismatch shows an error and keeps the old data.
- **Load mode:** the page opens on "CSV を選択 / ドロップ" with the expected file
  names and required columns. Dropped files go to the side whose expected name
  matches. The header shows each file's name, row count, and load time. In Chromium
  browsers a picked file is remembered, so after reopening the page one click on
  "前回のファイルを読み込む" (plus the browser's permission prompt) re-reads it, and
  "読み込み直す" re-reads the same files directly; elsewhere it returns to the picker.

## Security and privacy notes

- The HTML is self-contained: a Content-Security-Policy forbids network requests,
  external scripts, and remote images. Nothing is uploaded anywhere.
- **In embed mode the CSV data is in the HTML.** Anyone who receives the file can read
  every row, including columns the dashboard does not show. Tell the user this before
  they share it; drop sensitive columns from the CSV first, or use load mode. A
  load-mode file holds only the config (title, column names, labels, `order` values)
  and the CSV file names, never paths or rows.
- CSV values are inserted as text, never as HTML, so markup in the data is displayed
  literally.
- Review labels live only in that browser's localStorage. Clearing site data, another
  browser, or another machine starts empty. Export to keep them.

## Gotchas

- Duplicate or empty ids are build errors in every mode, because compare and review
  key on the id. If the CSV has no id column, ask the user which column is unique, or
  add one in a copy of the CSV and say so.
- Rate metrics accept `true/false`, `1/0`, `yes/no`, `y/n`, `t/f` (any case). An
  empty cell means "no value" and is excluded from n; any other value is an error.
- A CSV with `human_label` or `human_note` columns cannot be used with `review` (those
  names are reserved for the export). Rename them in a copy first.
- More than 8 status / verdict values fold the tail into "Other" for color; the table
  still shows the real values.
- Large files: in embed mode the data is inlined as JSON, so the HTML is roughly the
  CSV size plus about 570 KB of libraries and app code (load mode: just the 570 KB). Tens of thousands of rows work; for far more, filter the
  CSV first.

## Files

- `scripts/build_dashboard.py` - validates the config and CSVs, inlines everything.
- `assets/template.html`, `assets/app.js`, `assets/app.css` - the dashboard itself.
- `assets/vendor/` - PapaParse 5.4.1 and Tabulator 6.3.1 (MIT); see
  [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- `examples/` - synthetic CSVs and a config for each job. Build one to see the result:
  `python3 scripts/build_dashboard.py --config examples/golden.config.json --out /tmp/golden.html`.
