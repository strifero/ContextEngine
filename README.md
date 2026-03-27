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

## Subagents (Claude Code)

Claude Code supports invoking specialized subagents — separate agent definitions that Claude can spin up and delegate tasks to during a session. Each subagent is defined by a markdown file in `.claude/agents/` and carries its own focused context: the tools it should use, the conventions it should follow, and the part of the codebase it owns.

ContextEngine generates two subagents by default:

- **`backend-engineer.md`** — scoped to server-side work: API routes, database queries, service logic, and backend conventions detected in your project. When Claude delegates a backend task, this agent picks it up with the right context already loaded.
- **`code-reviewer.md`** — focused on review heuristics: consistency with your detected stack's conventions, common anti-patterns for your frameworks, and the rules expressed in your skill files.

You can edit these files freely — they are plain markdown. Use `--no-agents` to skip generating them if you prefer to write your own from scratch.

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

### Monorepos and nested app directories

If your repository root is not the application directory — for example, a monorepo where apps live under `packages/`, `apps/`, or `services/` — point ContextEngine at the specific directory you want scanned:

```bash
npx @strifero/contextengine --dir ./apps/web
npx @strifero/contextengine --dir ./packages/api
```

Detection runs relative to the directory you specify, so the generated `CLAUDE.md` and skill files will reflect that app's stack rather than whatever happens to be at the repository root. If you have multiple apps in a monorepo, run the command once per app directory. Each invocation deposits its output inside the target directory — for Claude Code, that means `.claude/` will sit alongside the app's own config files rather than at the repo root.

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

Each skill file follows the [Agent Skills open standard](https://platform.google.com/docs/en/agents-and-tools/agent-skills/overview) — compatible with Claude Code, Cursor, Codex CLI, and any other agent that supports `SKILL.md`.

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