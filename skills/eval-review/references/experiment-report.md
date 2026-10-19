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
2. Read the record, the config's `experiment.description`, and the data (to say what
   each condition is and to explain items) and draft the report.
   Cite every number from the record; do not recompute it from the data.
3. Set `experiment.record` to the JSON and `experiment.report` to the Markdown, add
   `report` to `tabs`, and build again. The build fails if the frontmatter verdicts
   differ from the record.

`examples/experiment_record.json`, `examples/experiment_report.md`, and
`examples/experiment_report.config.json` are a complete example.

## Who decides what

The page computes each condition's verdict from the criteria in the config. The
95% interval of each metric's difference is shown as a guide only and never changes a
verdict. A human interprets the intervals and writes the conclusion. Draft the 結論,
考察, and 次にやること sections from what the experimenter said, mark anything they have not
confirmed, and do not present the verdict alone as the conclusion. When the verdict
and the human's reading disagree (for example every criterion passed but the
interval of the main metric contains 0), say so in the report.

A pre-written criterion such as "no regressed item, unless a person looks at it and
accepts it" becomes `{"type": "regressions", "max": 0, "count": "unaccepted"}`. With
`"max": 0` alone, one regressed item fixes the verdict at `fail` whatever the review
says. Leaving `regressions` out lets the review decide as well, but then the criterion
does not appear in the page, the record, or the report's criteria. See
[config.md](config.md#release) for how `count` works; the record marks a
criterion awaiting review with `"pending": true`.

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

Use these six headings in this order, in the language of the page, and put nothing
before the first one. A reader who stops after 結論 should know the outcome.

| Heading | Content |
|---------|---------|
| 結論 / Conclusion | The point the reader acts on, not a summary of the whole report. Open with one sentence that says what the reader is asked to decide (for example 「現行プロンプトに検算の指示を加えるかどうかを決めるための報告である」). Then one sentence that says what was changed, what was measured, and what came out, in the form "changing X made Y do Z" (for example 「回答の前に検算させる指示を加えると、正答率は上がったが、その差はこのデータでは偶然のばらつきと区別できなかった」). Then each condition's verdict (in the words of `verdict_labels`) and the recommendation for each condition, chosen from 採用する / 直して再度試す / 採用しない, with who decided it (a role such as 実験者, never a person's name; the record holds no reviewer names). When two options are close, say what each one gains and loses. When the experimenter has not decided, write 未決 (undecided). |
| 背景 / Background | The problem the experiment addresses, why it matters to the readers, and the hypothesis, quoted from `hypothesis`. |
| 方法 / Method | What each compared thing is, in plain words: the baseline, and for each condition what was done differently from the baseline. The data: what the items are, how many, and where they come from, and whether they represent what the decision is about (period, kinds of items, users). How each metric was measured, and what the 95% interval means (see "Writing for the reader"). Who reviewed the regressed items, and what each review label means. The criteria as written in the config. When the criteria were written before the experiment, state which config criterion each of them became (for example "悪化する項目は 0 個。ただし人が見て受け入れたものは除く" → `{"type": "regressions", "max": 0, "count": "unaccepted"}`), and say so when one has no config criterion. |
| 結果 / Results | Each condition's verdict (in the words of `verdict_labels`), and each metric's value, difference, and 95% interval, copied from the record. Report every metric, including those that got worse and those whose interval contains 0, not only those that support the hypothesis. |
| 考察 / Discussion | The review of regressed items (labels and notes), metrics whose interval contains 0 or not, categories with few items, and how the experimenter reads them. Say how far the result carries: that it holds in this sample, and whether it is expected to hold for every kind of item or only some. State that the interval did not decide any verdict. |
| 次にやること / Next steps | The next experiment or task, as the experimenter decided. |

結論 follows the "bottom line up front" rule of writing the point the reader acts on
first ([Matt Strom, Bottom Line Up Front](https://mattstromawn.com/writing/bluf), citing
US Army Regulation 25-50). How to report intervals, unfavourable results, and how far a
result carries follows [Statsig, How to report test results](https://statsig.com/blog/how-to-report-test-results)
and Kohavi, Tang and Xu, *Trustworthy Online Controlled Experiments* (2020).

- Cite every number from the record. Numbers that did not decide anything and are not
  in the record (cost or time from another source, another evaluation) may go in 考察
  with their source, for example "（出典：runs.jsonl の合計）". Never put them in 結果
  or mix them into the criteria.
- When the experimenter has not decided whether to adopt the hypothesis, write 未決
  (undecided) in 結論; when they have not decided what to do next, write 未決 under
  次にやること. Add no proposals of your own in either place.
- A criterion that the record marks `"added_after_results": true` (the page says
  「（結果を見た後に追加）」) was added after the results were seen, so it does not
  test the hypothesis as written before. In 方法, list it apart from the criteria
  written before and say when and why it was added; in 結論, 結果 and 考察, keep its
  outcome apart too.

## Writing for the reader

The readers did not see the data or the page. Write so that the report alone is enough.

- Use the readers' vocabulary. Words that the page or this skill uses (for example
  ペア, 突き合わせ, レビュー待ち, 許容 / 不可 as review labels, pt, 95% 区間, 悪化した項目)
  are either replaced by plain words or explained where they first appear.
- Every sentence states its subject: who did it (the experimenter, a reviewer, the
  model) or what it is about.
- Keep the condition labels and the metric labels of the config, so that the report
  matches the page, but explain each the first time it appears (what the condition is,
  what the metric counts). Do not invent other names for them. When neither the config
  nor the data says what a condition is, ask the experimenter instead of guessing from
  the label.
- Write 背景, 考察 and 結論 in connected sentences that carry the reasoning, not as
  bullet fragments. Lists and tables are fine for data, criteria and next steps
  (see [Amazon's six-page narrative memos](https://www.anecdote.com/2018/05/amazons-six-page-narrative-structure/),
  after Jeff Bezos's 2017 shareholder letter).
- Describe the 95% interval as a property of how it is computed: an interval computed
  this way contains the true difference in 95% of repeated experiments. Never write
  that the true value lies in this interval with 95% probability.
- A difference whose interval contains 0 is "not distinguishable from noise with this
  data" (このデータでは偶然のばらつきと区別できない), never "no effect" (効果がない).
- Say that results hold "in this sample" (この 20 問では) rather than in general.
- Before finishing, reread the report as a reader who saw neither the data nor the
  page, and rewrite any sentence that needs the page to be understood.

## Markdown and staleness

The report tab renders the same Markdown subset as for the release report (headings,
paragraphs, one-level lists, tables, bold and italic, HTML shown as text), colours ▲ / ▼
differences from the 改善 / 悪化 written next to them (see
[release-report.md](release-report.md#writing-differences)), and shows
the same warning when the viewer's reviews change a verdict from the record. See
[release-report.md](release-report.md#markdown-that-the-report-tab-renders).
