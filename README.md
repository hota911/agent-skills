# Agent Skills

A collection of custom Agent Skills for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

## Install

### As a Marketplace

Register the marketplace, then install individual plugins:

```bash
/plugin marketplace add hota911/agent-skills
/plugin install stacked-prs@hota911-agent-skills
```

### Individual Skill

Install a single skill directly:

```bash
claude install-skill hota911/agent-skills/<skill-name>
```

## Available Skills

| Skill | Description |
|-------|-------------|
| [stacked-prs](skills/stacked-prs/) | Manage stacked PR branches - split large changes into small, reviewable PRs, update branches after base merge, and cascade changes downstream. |

## License

[MIT](LICENSE)
