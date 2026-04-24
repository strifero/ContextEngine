# ContextEngine

**Stop re-explaining your codebase to AI. Every. Single. Session.**

```bash
npx @strifero/contextengine
```

[![npm](https://img.shields.io/npm/v/@strifero/contextengine)](https://www.npmjs.com/package/@strifero/contextengine)
[![npm downloads](https://img.shields.io/npm/dw/@strifero/contextengine)](https://www.npmjs.com/package/@strifero/contextengine)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Free. Open source. Runs entirely on your machine. No account required.

---

## See It In Action

[![ContextEngine Demo](https://asciinema.org/a/SGP4Expm3PIsYHC9.svg)](https://asciinema.org/a/SGP4Expm3PIsYHC9)

---

## The Problem

Every AI coding session starts blank. You ask Claude Code to add an endpoint — it suggests `pages/api/` because it doesn't know you're on the App Router. You ask Cursor to write a query — it ignores your Prisma setup. You spend 10 minutes re-establishing context before doing any real work.

`CLAUDE.md`, `.cursorrules`, and `copilot-instructions.md` fix this — your AI tool reads them automatically and starts with full context. But writing a good one is tedious.

**ContextEngine generates them automatically from your actual codebase.**

---

## Before / After

**Before** (any agent, empty repo context):
```
You: Where should I add a new API endpoint?
Agent: Create pages/api/users.ts and export a default handler...
```
Wrong. This is an App Router project.

**After.** Run ContextEngine once. It reads your `package.json`,
`tsconfig.json`, `prisma/schema.prisma`, and friends, and writes a real
`AGENTS.md` at the project root. On a minimal Next.js 14 (App Router) +
Prisma + Tailwind repo, this is the actual file:

```markdown
# nextjs-app

> AGENTS.md: instructions for AI coding agents working on this project.
> Human contributors: see README.md.

## Stack

- TypeScript 5.5.0
- Next.js (App Router) 14.2.0
- React 18.3.0
- Node.js
- Tailwind CSS 3.4.0
- Prisma 5.15.0
- Prettier
- Playwright

## Commands

- `npm run dev`: `next dev`
- `npm run build`: `next build`
- `npm run start`: `next start`
- `npm run lint`: `next lint`
- `npm run test`: `vitest`
- `npm run db:migrate`: `prisma migrate dev`

## Conventions

- App Router by default. Server Components unless the file declares `"use client"`.
- Database access lives in Server Components, Route Handlers, or Server Actions, never client code.
- Route Handlers at `app/<path>/route.ts` export named methods (GET, POST, etc.).
- Single PrismaClient instance at `lib/prisma.ts`. Import that, never `new PrismaClient()` in request paths.
- Schema changes go through `prisma migrate dev` locally and `prisma migrate deploy` in CI.
- Run with `strict: true` in tsconfig. Prefer `interface` for object shapes and `type` for unions.
- Role-based selectors (`getByRole`, `getByLabel`) before `getByTestId`. Avoid CSS selectors.
- Prettier is the source of truth for formatting. Run `prettier --write` or wire it into the editor.

## What to avoid

- `getServerSideProps` and `getStaticProps`. The App Router replaced them.
- Importing server-only modules from client components.
- `$executeRawUnsafe` with user input. Use `$executeRaw` tagged templates.
- `page.waitForTimeout`. Assert visibility or wait on a network response.
```

(Trimmed for brevity: the full file has a few more TypeScript and React
bullets. Nothing is hand-written; every section above is derived from
files in the repo.)

For Claude Code, `--tool claude` also writes `.claude/CLAUDE.md` plus a
skill library under `.claude/skills/` (e.g. `nextjs-app/SKILL.md`,
`prisma/SKILL.md`) so Claude lazy-loads per-topic guidance on demand.

---

## What It Does

ContextEngine scans your project root, reads your actual config files and dependencies, and generates:

| Tool | Output | Auto-loaded? |
|------|--------|-------------|
| **Claude Code** | `.claude/CLAUDE.md` + skill files | ✅ Yes |
| **Cursor** | `.cursor/rules/*.mdc` | ✅ Yes |
| **GitHub Copilot** | `.github/copilot-instructions.md` | ✅ Yes |
| **Codex CLI** | `AGENTS.md` ¹ | ✅ Yes |
| **OpenCode** | `.opencode/AGENTS.md` ¹ | ✅ Yes |
| **Windsurf** | `.windsurfrules` | ✅ Yes |
| **Aider** | `CONVENTIONS.md` | ✅ Yes |
| **Gemini CLI** | `GEMINI.md` | ✅ Yes |
| **Cline** | `.clinerules` | ✅ Yes |
| **Roo Code** | `.roo/rules.md` | ✅ Yes |
| **JetBrains (Junie)** | `.junie/guidelines.md` | ✅ Yes |
| **Amazon Q** | `.amazonq/rules/project.md` | ✅ Yes |
| **Zed** | `.rules` | ✅ Yes |

¹ `AGENTS.md` at the repo root is the emerging cross-tool standard ([agents.md](https://agents.md)). Generate it with `--tool agents`. The other rows above are the tool-specific paths for agents that do not yet read `AGENTS.md` natively.

One tool:
```bash
npx @strifero/contextengine
```

All tools at once:
```bash
npx @strifero/contextengine --tool all
```

---

## Usage

```bash
# Detect stack and generate context files
npx @strifero/contextengine

# Target a specific tool
npx @strifero/contextengine --tool cursor
npx @strifero/contextengine --tool copilot
npx @strifero/contextengine --tool all

# Re-sync after your stack changes (preserves your edits)
npx @strifero/contextengine --update

# Specific directory
npx @strifero/contextengine --dir /path/to/project
```

---

## Commit It

```bash
git add .claude/ .cursor/ .github/copilot-instructions.md
git commit -m "add AI context files via contextengine"
```

Every contributor who clones the repo gets full AI context from day one. When the stack changes, re-run with `--update`.

---

## Detected Stacks

TypeScript · Node.js + Express · Next.js · React · Vite · Vue · Tailwind CSS ·
Swift / SwiftUI · Stripe · Prisma · PostgreSQL · MongoDB · Azure · Docker ·
Go · Python · Django · Rust · PHP · C# · Bun

Don't see yours? [Open an issue](https://github.com/strifero/ContextEngine/issues) or submit a PR — skills are plain markdown.

---

## Requirements

- Node.js 18+
- Any project directory (any language or framework)

---

## See Real Examples

Generated output files for common stacks:
👉 [contextengine-examples](https://github.com/strifero/contextengine-examples)

---

## Contributing

Skills are plain markdown files in `src/skills/`. To add a stack:

1. Create `src/skills/<n>.ts`
2. Add detection to `src/detect.ts`
3. Wire up in `src/registry.ts`
4. Open a PR

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## License

MIT — by [Strife Technologies](https://strifetech.com)
