# Experiment report

An experiment report is a Markdown file that shares the result of an experiment with
people who did not see the data: what was tested, how, what came out, how to read it,
and what the experimenter concluded. It is shown in the page's `report` tab, next
to the experiment tab that holds the numbers, and "Markdown を書き出す" / "Export
Markdown" downloads it for pasting into Google Docs or Notion. Write it only after a
human has reviewed the regressed items and exported the record from the experiment tab.

## Flow

1. Build the page with the `experiment` tab, have a human review the regressed
   items, and export the record as JSON ("記録を書き出す (JSON)").
2. Read the record (and the data when an item needs explaining) and draft the report.
   Cite every number from the record; do not recompute it from the data.
3. Set `experiment.record` to the JSON and `experiment.report` to the Markdown, add
   `report` to `tabs`, and build again. The build fails if the frontmatter verdicts
   differ from the record.

`examples/experiment_record.json`, `examples/experiment_report.md`, and
`examples/experiment_report.config.json` are a complete example.

## Who decides what

The page computes each condition's verdict from the criteria in the config. The
95% interval of each metric's difference is shown as a guide only and never changes a
verdict. A human interprets the intervals and writes the conclusion. Draft the 考察
and 結論 sections from what the experimenter said, mark anything they have not
confirmed, and do not present the verdict alone as the conclusion. When the verdict
and the human's reading disagree (for example every criterion passed but the
interval of the main metric contains 0), say so in the report.

## Frontmatter

The file starts with a frontmatter block that states each condition's verdict, by
condition label, with the codes `pass`, `review`, or `fail` (never the words from
`verdict_labels`):

```markdown
---
verdicts:
  条件A: pass
  条件B: fail
  条件C: review
---
```

The rules are those of the release report: `verdicts:` is the only key, every
candidate in `data.candidates` appears exactly once, a label may be quoted, and any
mismatch with the verdict recomputed from the data and the record's reviews exits 1.
The numbers in the body are not checked. The frontmatter is not part of the rendered
report or of the Markdown download.

## Structure

Use these five headings in this order, in the language of the page:

| Heading | Content |
|---------|---------|
| 背景と仮説 / Background and hypothesis | What was changed and why it was expected to help. Quote `hypothesis`. |
| 方法 / Method | The data (number of items, file names), the baseline and the conditions, the metrics, and the criteria as written in the config. |
| 結果 / Results | Each condition's verdict (in the words of `verdict_labels`), and each metric's value, difference, and 95% interval, copied from the record. |
| 考察 / Discussion | The review of regressed items (labels and notes), metrics whose interval contains 0 or not, categories with few items, and how the experimenter reads them. State that the interval did not decide any verdict. |
| 結論と次にやること / Conclusion and next steps | Whether the hypothesis is adopted, as the experimenter decided, and the next experiment or task. |

Write in plain sentences for readers who did not see the data. Use the condition
labels and the metric labels from the config, not new names.

## Markdown and staleness

The report tab renders the same Markdown subset as for the release report (headings,
paragraphs, one-level lists, tables, bold and italic, HTML shown as text), and shows
the same warning when the viewer's reviews change a verdict from the record. See
[release-report.md](release-report.md#markdown-that-the-report-tab-renders).
