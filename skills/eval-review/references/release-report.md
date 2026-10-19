# Release report

A release report is a Markdown file that explains the release decision to people who
did not do the review. It is shown in the page's `report` tab, next to the release
tab that holds the numbers; "Markdown を書き出す" / "Export Markdown" there downloads the
report body (without the frontmatter). Write it only after a human has reviewed the
regressed items and exported the record from the release tab. For an experiment that
tests a hypothesis, see [experiment-report.md](experiment-report.md) instead.

## Flow

1. Build the page with the `release` tab, have a human review the regressed items,
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

Use these four headings in this order, in the language of the page:

| Heading | Content |
|---------|---------|
| 結論 / Conclusion | Open with one sentence that says what is being released compared to what, and the outcome (for example 「現行モデルを置き換える候補 3 つのうち、候補B は出してよい」). Then each candidate's verdict in one or two sentences. A table of candidate, verdict, and the main reason works well with several candidates. |
| 理由 / Reasons | First, in a short paragraph, what the current model and each candidate are (what changed from the current model), the data the decision used (what the items are and how many), and who reviewed the regressed items and what the review labels mean. Leave out what every reader already knows, but never leave a candidate unexplained. Then per candidate: the criteria it failed (with the record's `criteria[].value` against the threshold), and the regressed items labelled with the rejecting label, with the reviewer's note. For a passing candidate, the values that matter. |
| 注意点 / Caveats | Metric differences whose `ci95` contains 0 (not distinguishable from noise), categories with few items, unreviewed items, and anything else that limits the decision. State that the 95% interval did not decide any verdict. |
| 次にやること / Next steps | Concrete actions: review the remaining items, re-export, fix and compare again. |

The 結論 section is the summary, so put nothing before it.

- Numbers that did not decide anything and are not in the record (cost or time from
  another source, another evaluation) may go in 注意点 with their source. Never put
  them in 理由 or mix them into the criteria.
- When the human has not decided the next steps, write 未決 (undecided) under
  次にやること and add no proposals of your own.
- A criterion that the record marks `"added_after_results": true` (the page says
  「（結果を見た後に追加）」) was added after the results were seen. In 理由, write it
  after the other criteria and say that it was added after the results, for example
  "結果を見た後に追加した基準：…". Never present it as a criterion written before.

## Writing for the reader

The readers did not do the review and did not see the page. Write so that the report
alone is enough.

- Use the readers' vocabulary. Words that the page or this skill uses (for example
  ペア, 突き合わせ, 回帰, レビュー待ち, 許容 / 不可 as review labels, pt, 95% 区間, フィルタ)
  are either replaced by plain words or explained where they first appear.
- Every sentence states its subject: who did it (a reviewer, the model) or what it is
  about.
- Keep the candidate labels and the metric labels of the config, so that the report
  matches the page, but explain each the first time it appears (what the candidate is,
  what the metric counts). Do not invent other names for them. When neither the config
  nor the data says what a candidate is, ask the person who asked for the decision
  instead of guessing from the label.
- Before finishing, reread the report as a reader who saw neither the data nor the
  page, and rewrite any sentence that needs the page to be understood.

## Markdown that the report tab renders

The report tab renders a small subset and inserts every character as text, so HTML in
the file is shown literally, never executed.

- Headings: `#` to `######` (all shown one level below the page title).
- Paragraphs: consecutive lines, separated by a blank line.
- Lists: `- ` / `* ` bullets and `1. ` / `1) ` numbered items, one level only
  (indented items are shown at the same level).
- Tables: a header row, a `| --- |` separator row, then data rows.
- Emphasis: `**bold**` and `*italic*`.
- Differences: ▲ / ▼ followed by the change, as described below.

Anything else (links, images, inline code, code blocks, nested lists, `_italic_`) is
shown as plain text. Write file names and ids without backticks.

## Writing differences

Write a difference the way the page does: ▲ when the number went up and ▼ when it went
down, then the signed change, then 改善 or 悪化 (better / worse in English) for a metric
with a direction, for example "▼ −2pt 悪化" for accuracy or "▲ +75.6 ms 悪化" for
latency. The arrow alone never says whether the change is good; the word does. The
report tab colours the difference from that word: in a table cell that starts with ▲ / ▼
the whole cell, elsewhere the text from the arrow to the next 、。,; or closing
parenthesis. A difference without either word (for a metric with `better: "none"`, or
one the reader should not judge) stays uncoloured.

## When the report goes stale

The reviews in the record seed the viewer's release review. If the viewer changes a
review so that a verdict differs from the record, the report tab shows a warning
naming each changed candidate (record verdict -> current verdict). Export the record
again, update the report, and rebuild.
