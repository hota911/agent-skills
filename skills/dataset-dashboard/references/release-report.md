# Release report

A release report is a Markdown file that explains the release decision to people who
did not do the review. It is shown in the dashboard's `report` tab, next to the release
tab that holds the numbers; "Markdown を書き出す" / "Export Markdown" there downloads the
report body (without the frontmatter). Write it only after a human has reviewed the
regressed items and exported the record from the release tab. For an experiment that
tests a hypothesis, see [experiment-report.md](experiment-report.md) instead.

## Flow

1. Build the dashboard with the `release` tab, have a human review the regressed items,
   and export the record as JSON ("記録を書き出す (JSON)").
2. Read the record (and the data when an item needs explaining) and write the report.
   Cite every number from the record; do not recompute it from the data.
3. Set `release.record` to the JSON and `release.report` to the Markdown, add `report`
   to `tabs`, and build again. The build fails if the frontmatter verdicts differ from
   the record. The HTML then carries the reviews too, so one file shows the same
   verdicts to everyone.

`examples/release_record.json`, `examples/release_report.md`, and
`examples/release_report.config.json` are a complete example.

## Frontmatter

The file starts with a frontmatter block that states each candidate's verdict, by
candidate label, with the codes `go` (出してよい), `review` (要レビュー), or `no-go`
(出さない):

```markdown
---
verdicts:
  候補B: go
  候補C: no-go
  候補D: review
---
```

`verdicts:` is the only key. Every candidate in `data.candidates` appears exactly once,
and no other label does. A label may be quoted (`"候補 B": go`). At build time each
verdict is compared with the one recomputed from the data and the record's reviews; any
mismatch, missing, or extra candidate exits 1 and names it. The numbers in the body are
not checked, which is why they must be copied from the record.

## Structure

Use these four headings in this order, in the language of the dashboard:

| Heading | Content |
|---------|---------|
| 結論 / Conclusion | Each candidate's verdict in one or two sentences. A table of candidate, verdict, and the main reason works well with several candidates. |
| 理由 / Reasons | Per candidate: the criteria it failed (with the record's `criteria[].value` against the threshold), and the regressed items labelled with the rejecting label, with the reviewer's note. For a passing candidate, the values that matter. |
| 注意点 / Caveats | Metric differences whose `ci95` contains 0 (not distinguishable from noise), categories with few items, unreviewed items, and anything else that limits the decision. State that the 95% interval did not decide any verdict. |
| 次にやること / Next steps | Concrete actions: review the remaining items, re-export, fix and compare again. |

Write in plain sentences for readers who did not see the data. Use the candidate labels
and the metric labels from the config, not new names.

## Markdown that the report tab renders

The report tab renders a small subset and inserts every character as text, so HTML in
the file is shown literally, never executed.

- Headings: `#` to `######` (all shown one level below the page title).
- Paragraphs: consecutive lines, separated by a blank line.
- Lists: `- ` / `* ` bullets and `1. ` / `1) ` numbered items, one level only
  (indented items are shown at the same level).
- Tables: a header row, a `| --- |` separator row, then data rows.
- Emphasis: `**bold**` and `*italic*`.

Anything else (links, images, inline code, code blocks, nested lists, `_italic_`) is
shown as plain text. Write file names and ids without backticks.

## When the report goes stale

The reviews in the record seed the viewer's release review. If the viewer changes a
review so that a verdict differs from the record, the report tab shows a warning
naming each changed candidate (record verdict -> current verdict). Export the record
again, update the report, and rebuild.
