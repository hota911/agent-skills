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

## License

[MIT](LICENSE)
