# ContextEngine

**One command. Every AI agent understands your codebase.**

Stop re-explaining your stack every session. ContextEngine scans your project, detects your frameworks, and generates everything Claude Code, Cursor, Copilot, and Codex need to understand your code from day one.

Free. Open source. No account required.

```bash
npx @strifero/contextengine
```

---

## What Gets Generated (Real Example)

Running ContextEngine on a Next.js + TypeScript + Prisma + Tailwind project produces output like this:

**`.claude/CLAUDE.md`** (excerpt):
```markdown
# Project Context

## Stack
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Prisma ORM → PostgreSQL
- Tailwind CSS

## Conventions
- Components live in `src/components/`, colocated with their styles
- Server actions in `src/actions/`, named `[resource]Actions.ts`
- Database access only through Prisma client in `src/lib/db.ts` — never raw SQL
- All API routes validated with Zod before touching the database

## Architecture Notes
- App Router layouts handle auth via middleware
- `src/lib/` holds shared utilities; nothing in here should import from `src/components/`
```

**`.claude/skills/next.js/SKILL.md`** (excerpt):
```markdown
# Next.js — Agent Skill

## Routing
- This project uses the App Router (`app/` directory), not Pages Router
- Dynamic segments follow `[param]` convention; catch-all routes use `[...param]`
- Layouts at `app/layout.tsx` wrap all child routes — mutations should invalidate
  via `revalidatePath()` or `revalidateTag()`, not full page reloads

## Data Fetching
- Prefer React Server Components for data fetching; avoid `useEffect` for initial loads
- Server Actions are the pattern here — see `src/actions/` for existing examples
- `fetch()` calls in Server Components are automatically deduped; no need for a
  separate caching layer for read-only requests

## Common Pitfalls
- `"use client"` should be pushed as far down the tree as possible
- Don't import Server Components into Client Components
```

This is what a real skill file looks like — not a generic framework summary, but guidance written against how agents actually work with code.

---

## Framework-Specific Output

Detection goes beyond "React is present." ContextEngine distinguishes between meaningfully different configurations and adjusts generated content accordingly.

**Next.js vs. plain React:**
A Next.js project gets a dedicated `next.js/SKILL.md` covering App Router vs. Pages Router routing conventions, Server Components, Server Actions, and `next.config.*` patterns. A plain React + Vite project gets a `react/SKILL.md` focused on component patterns and a `vite/SKILL.md` covering build config — without any Next.js-specific guidance that would be irrelevant or misleading.

**TypeScript with strict mode:**
`tsconfig.json` is read to understand compiler options. A project running `"strict": true` gets skill content that reflects stricter type patterns. A project without TypeScript at all gets none of the TypeScript skill files.

**Co-detected stacks compound:**
When Prisma and PostgreSQL are both detected, the generated context notes the ORM layer and discourages raw SQL — rather than treating each technology in isolation.

The goal is that an AI agent reading your generated files has accurate, project-relevant guidance — not a generic tutorial it could have retrieved from documentation.

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