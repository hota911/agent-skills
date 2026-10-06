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
| [japanese-tech-writing](skills/japanese-tech-writing/) | 日本語の技術文書・書籍原稿の文章規範（整形・パラグラフライティング・論証の厳密さ・冗長の排除など）。日本語で技術書や記事を書く/推敲するときに使用。Derived from k16shikano's gist (used with permission). |

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
