# Agent Skills

A collection of custom Agent Skills for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

## Install

Register the marketplace, then install plugins:

```bash
/plugin marketplace add hota911/agent-skills
/plugin install stacked-prs@hota911-agent-skills
```

## Available Skills

| Skill | Description |
|-------|-------------|
| [stacked-prs](skills/stacked-prs/) | Manage stacked PR branches - split large changes into small, reviewable PRs, update branches after base merge, and cascade changes downstream. |
| [session-retrospective](skills/session-retrospective/) | Run a structured Keep/Problem/Try retrospective at session end, cross-reference past retrospectives for recurring patterns, and propose memory entries, doc updates, and skill candidates. |
| [japanese-tech-writing](skills/japanese-tech-writing/) | 日本語の技術文書・書籍原稿の文章規範（整形・パラグラフライティング・論証の厳密さ・冗長の排除など）。日本語で技術書や記事を書く/推敲するときに使用。Derived from k16shikano's gist (used with permission). |

## License

[MIT](LICENSE)
