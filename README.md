# ContextEngine

**One command. Every AI agent understands your codebase.**

Stop re-explaining your stack every session. ContextEngine scans your project, detects your frameworks, and generates everything Claude Code, Cursor, Copilot, and Codex need to understand your code from day one.

Free. Open source. No account required.

```bash
npx @strifero/contextengine
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

## Example Output

Here's a representative excerpt from a generated `CLAUDE.md` for a Next.js + Prisma + TypeScript project:

```markdown
# Project Context

## Stack
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Prisma ORM → PostgreSQL
- Tailwind CSS

## Conventions
- All new routes go under `app/` using the App Router file convention
- Server Components by default; add `"use client"` only when necessary
- Database access only in Server Components or Route Handlers — never in Client Components
- Prisma client is a singleton at `lib/prisma.ts`
- Prefer `zod` for all runtime validation at API boundaries

## Architecture Notes
- `app/` — Next.js routes and layouts
- `components/` — shared UI, always client-safe unless explicitly noted
- `lib/` — server-side utilities and service clients
- `prisma/` — schema and migrations

## What to avoid
- Do not use `getServerSideProps` or `getStaticProps` — this project uses the App Router exclusively
- Do not import server-only modules into `components/`
```

The actual output reflects the conventions and structure found in your specific project — file layout, detected dependencies, and config file patterns all shape what gets written.

---

## Skill File Quality

Skill files are not generic boilerplate. Each one is authored with opinionated, framework-specific guidance drawn from current best practices for that technology. For example:

- The **React** skill covers component patterns, hook rules, and when to split client and server responsibilities
- The **Prisma** skill covers query patterns, relation loading, and migration workflow
- The **TypeScript** skill covers compiler options, type narrowing patterns, and what to avoid in strict mode

Skills are plain markdown, stored in `src/skills/` in the repository. You can read any of them before running the tool, and edit the generated output freely — `--update` will never overwrite your changes.

---

## Keeping Skills Up to Date

Best practices evolve. When the guidance in a bundled skill file changes — because a framework releases a major version, community conventions shift, or better patterns emerge — the skill is updated in the repository and that change ships as part of a normal package release.

Because ContextEngine runs via `npx`, you always pull the latest published version by default. If you have a pinned version in a script or workflow, bump it periodically to get updated skill content.

When a bundled skill is updated, running `--update` in your project will sync the new content for any skills you have not edited. Skills you have modified by hand are never overwritten — `--update` only touches files that match the original generated content. If you want to pull in upstream skill improvements while keeping your own additions, open the relevant skill file alongside the current version in `src/skills/` in the repository and merge the changes manually.

If you believe a skill's guidance is outdated or incorrect, the skills are plain markdown and contributions are straightforward — see the Contributing section below.

---

## Tool Compatibility

ContextEngine generates different output formats depending on the target tool:

| Tool | Format generated | Native consumption |
|---|---|---|
| Claude Code | `SKILL.md` per technology, `CLAUDE.md` project file | Yes — Claude Code reads both natively |
| Cursor | `.mdc` rule files in `.cursor/rules/` | Yes — Cursor loads `.mdc` files natively |
| GitHub Copilot | `copilot-instructions.md` in `.github/` | Yes — Copilot reads this file natively |
| Codex CLI | `SKILL.md` files | Yes — follows the Agent Skills open standard |

Cursor and Copilot do not read `SKILL.md` files directly. When you target those tools, ContextEngine converts the same underlying skill content into the format each tool expects — `.mdc` rule files for Cursor, a single consolidated markdown file for Copilot. The `--tool all` flag runs all conversions in one pass.

Skill files in `.claude/skills/` follow the [Agent Skills open standard](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview), which defines a common markdown format for tool-consumable knowledge files. Any agent that adopts this standard can read them directly without adaptation.

---

## Usage

```bash
# First run — detect stack and generate context files
npx @strifero/contextengine

# Target a specific AI tool
npx @strifero/contextengine --tool cursor
npx @strifero/contextengine --tool copilot
npx @strifero/contextengine --tool all

# Stack changed? Re-sync without losing your edits
npx @strifero/contextengine --update

# Specify a directory
npx @strifero/contextengine --dir /path/to/project

# Overwrite existing context files
npx @strifero/contextengine --force

# Skip agent generation (Claude Code only)
npx @strifero/contextengine --no-agents
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

1. Create `src/skills/<n>.ts` with the skill content
2. Add detection logic to `src/detect.ts`
3. Wire it up in `src/registry.ts`
4. Open a PR

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## License

MIT — by [Strife Technologies](https://strifetech.com)