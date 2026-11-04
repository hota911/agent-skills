# Agent Skills

A collection of custom Agent Skills. See each skill for its environment requirements.
Session Retrospective supports agents that can read the current conversation and local files,
using the user's configured guidance and memory workflow.

## Install

For Claude Code, register the marketplace, then install plugins:

```bash
/plugin marketplace add hota911/agent-skills
/plugin install stacked-prs@hota911-agent-skills
```

For other agents, install the desired directory under `skills/` using that agent's
skill installer. Session Retrospective preserves configured storage and existing
Codex (`~/.codex/retrospectives/`) or Claude Code (`~/.claude/retrospectives/`)
history. New setups without existing history default to
`~/.local/share/session-retrospective/`. It normally proposes new durable rules
around the third occurrence, with exceptions for material risks or explicit requests.

For Codex, install Open in Editor with GitHub CLI's skill command:

```bash
gh skill install hota911/agent-skills skills/open-in-editor --agent codex --scope user
```

## Available Skills

| Skill | Description |
|-------|-------------|
| [delegated-work](skills/delegated-work/) | Take ownership of substantial assignments: ask early, check resources while answers are pending, execute independently, and verify delivery. Works with Claude Code and Codex; adapts to available tools. |
| [open-in-editor](skills/open-in-editor/) | Open a file from the current Git worktree in the user's chosen editor: VS Code (`code`) or Cursor (`cursor`). |
| [stacked-prs](skills/stacked-prs/) | Manage stacked PR branches - split large changes into small, reviewable PRs, update branches after base merge, and cascade changes downstream. |
| [session-retrospective](skills/session-retrospective/) | Run a structured Keep/Problem/Try retrospective at session end, cross-reference past retrospectives for recurring patterns, and propose memory entries, doc updates, and skill candidates. |
| [session-cleanup](skills/session-cleanup/) | Survey Claude Code desktop sessions, archive past scheduled runs and sessions that confirm they are done, and report the rest. Never archives on a merged PR alone. Works only in Claude Code desktop (session-management tools). |
| [shared-doc-writing](skills/shared-doc-writing/) | 他人に読ませて反応を得るための共有文書（検討案、設計案、提案、調査結果、PR 説明、Notion / Google Docs、README、仕様、参照資料）を書く・直すときの考え方。言語に依らない。節は、書き始める前に決めること／冒頭に置くもの／指摘が返る形にする／確かさの書き分け／一覧にするか続いた文にするか／自分の作業経緯は書かない／読み直して削る／出すまでが書く仕事。固定の文書構成や記入欄は持たない（点検の項目は持つ）。場面ごとに references/logic.md（構成と論証の点検、段落と節の組み立て）、references/japanese-prose.md（日本語の文と語、記法）、references/updating.md（既にあるものから書く）、references/pull-request.md（PR の説明）、references/sources.md（出典）を読む。単体で入れても壊れる参照は無い。文と段落と論証の層は k16shikano 氏の gist に由来する（used with permission）。 |
| [eval-review](skills/eval-review/) | Turn local CSV, JSON, or JSONL files into one self-contained offline HTML page for reviewing evaluation results, with the data embedded or picked from the file each time it opens: compare a current model with candidates (regressions first), decide which candidates to release against stated criteria with a review and a written report, share an experiment's result against a hypothesis with a written report, label fact-check items with keyboard shortcuts and export CSV, or triage feedback by category and status. Python 3 stdlib build; bundles PapaParse and Tabulator (MIT). |

## Design Documents

Design documents for a skill live in that skill's `docs/` directory, not in a repository-level
`docs/`. Example: [eval-review release decision](skills/eval-review/docs/release-design.md).

## License

[MIT](LICENSE)

## Delegated Work

Use `delegated-work` when handing over a substantial assignment, for example:

> 顧客向けの導入比較資料を作って。必要なことは早めに質問し、回答待ちの間も
> 資料と権限の確認を進めてください。方針が揃ったら完成まで任せます。
> 外部への送信は確認してからにしてください。

Install for Claude Code through the marketplace:

```text
/plugin install delegated-work@hota911-agent-skills
```

Or select your agent with the Skills CLI:

```bash
npx skills add https://github.com/hota911/agent-skills --skill delegated-work --agent codex
npx skills add https://github.com/hota911/agent-skills --skill delegated-work --agent claude-code
```

The same Markdown instructions work in both hosts. Nonblocking input, background
execution, subagents, and scheduling depend on actual host capabilities; none are
required or enabled by installation. In turn-based chat, preparation and questions
are interleaved. In plan mode, the skill respects the host's read-only restrictions.
See [interaction patterns](skills/delegated-work/references/interaction-patterns.md),
[attribution](skills/delegated-work/THIRD_PARTY_NOTICES.md), and
[evaluation scenarios](skills/delegated-work/evals/evals.json).
