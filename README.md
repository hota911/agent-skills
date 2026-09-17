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

## Available Skills

| Skill | Description |
|-------|-------------|
| [stacked-prs](skills/stacked-prs/) | Manage stacked PR branches - split large changes into small, reviewable PRs, update branches after base merge, and cascade changes downstream. |
| [session-retrospective](skills/session-retrospective/) | Run a structured Keep/Problem/Try retrospective at session end, cross-reference past retrospectives for recurring patterns, and propose memory entries, doc updates, and skill candidates. |
| [japanese-tech-writing](skills/japanese-tech-writing/) | 日本語の技術文書・書籍原稿の文章規範（整形・パラグラフライティング・論証の厳密さ・冗長の排除など）。日本語で技術書や記事を書く/推敲するときに使用。Derived from k16shikano's gist (used with permission). |

## License

[MIT](LICENSE)
