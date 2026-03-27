# ContextEngine

**One command. Every AI agent understands your codebase.**

Stop re-explaining your stack every session. ContextEngine scans your project, detects your frameworks, and generates everything Claude Code, Cursor, Copilot, and Codex need to understand your code from day one.

Free. Open source. No account required.

```bash
npx contextengine
```

---

## What It Generates

**Claude Code** (default):
```
.claude/
├── CLAUDE.md           # Project overview, conventions, architecture
├── skills/             # Tech-specific knowledge files
│   ├── typescript/SKILL.md
│   ├── react/SKILL.md
│   └── ...
└── agents/             # Specialized subagents
    ├── backend-engineer.md
    └── code-reviewer.md
```

**Cursor** (`--tool cursor`):
```
.cursor/rules/
├── typescript.mdc
├── react.mdc
└── ...
```

**GitHub Copilot** (`--tool copilot`):
```
.github/
└── copilot-instructions.md
```

**All tools at once** (`--tool all`):
Generates all of the above in a single run.

---

## Usage

```bash
# First run — detect stack and generate context files
npx contextengine

# Target a specific AI tool
npx contextengine --tool cursor
npx contextengine --tool copilot
npx contextengine --tool all

# Stack changed? Re-sync without losing your edits
npx contextengine --update

# Specify a directory
npx contextengine --dir /path/to/project

# Overwrite existing context files
npx contextengine --force

# Skip agent generation (Claude Code only)
npx contextengine --no-agents
```

---

## Detected Stacks

| Technology | Detected By |
|---|---|
| TypeScript | `tsconfig.json`, `.ts` files |
| Node.js + Express | `package.json` dependencies |
| Next.js | `next.config.*` |
| React | `package.json` dependencies |
| Vite | `vite.config.*` |
| Vue | `package.json` dependencies |
| Tailwind CSS | `tailwind.config.*` |
| Swift / SwiftUI | `.xcodeproj`, `.swift` files |
| Stripe | `package.json` dependencies |
| Prisma | `prisma/schema.prisma` |
| PostgreSQL | `package.json` dependencies |
| MongoDB | `package.json` dependencies |
| Azure | `azure.yaml`, `.bicep`, ARM files |
| Docker | `Dockerfile`, `docker-compose.yml` |
| Go | `go.mod` |
| Python | `pyproject.toml`, `requirements.txt` |
| Django | `manage.py` |
| Rust | `Cargo.toml` |
| PHP | `composer.json`, `.php` files |
| C# | `.csproj`, `.sln`, `.cs` files |
| Bun | `bun.lockb` |

Don't see yours? [Open an issue](https://github.com/strifero/ContextEngine/issues) or submit a PR.

---

## How It Works

1. **Scans** your project root for config files, `package.json` deps, and file extensions
2. **Detects** your tech stack automatically
3. **Selects** the relevant skills from a curated library
4. **Generates** context files for your chosen AI tool

With `--update`, ContextEngine re-runs detection and syncs non-destructively — new skills are added, stale ones removed, and everything you've written by hand is preserved.

Each skill file follows the [Agent Skills open standard](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) — compatible with Claude Code, Cursor, Codex CLI, and any other agent that supports `SKILL.md`.

---

## Requirements

- Node.js 18+
- A project directory (any language or framework)

---

## Contributing

Skills are plain markdown files. To add a new stack:

1. Create `src/skills/<name>.ts` with the skill content
2. Add detection logic to `src/detect.ts`
3. Wire it up in `src/registry.ts`
4. Open a PR

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## License

MIT — by [Strife Technologies](https://strifetech.com)
