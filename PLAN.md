# PLAN.md: AGENTS.md support and detection depth

> Branch: `feat/agents-md-and-depth`
> Target version: `1.3.0`
> Owner: Claude Code (execute phases sequentially, one PR-sized commit per numbered task)

This plan drives two workstreams in parallel through a shared test harness:

**(a) Standardize on AGENTS.md** and broaden agent coverage.
**(b) Make detection genuinely deeper** so the README's Before / After example reflects real output.

---

## Ground rules

1. **Snapshot tests first.** Phase 0 lands before any feature work. Every later phase must keep snapshots green or update them intentionally in the same commit.
2. **Do not touch `src/skills.ts` content unless a new skill is explicitly listed in this plan.** The 24KB of skill prose is hand-tuned. New skills land as separate, small additions. Existing skill text is not rewritten, reformatted, or "improved" as a side effect of other work.
3. **No em dashes or en dashes anywhere** in generated output, skill content, README edits, or commit messages. Use colons, commas, parentheses, or two sentences.
4. **Keep dependencies minimal.** The only runtime dep today is `picocolors`. Do not add parsers (yaml, toml, glob libs). Node stdlib is enough for everything in this plan. TypeScript and `@types/node` are the only devDeps.
5. **Node >= 18** stays the floor. No Node 20-only APIs.
6. **Zero network calls at runtime.** Everything is local filesystem detection.
7. **Commit per numbered task.** Each task below is one commit with a conventional-commit subject (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`). Do not batch tasks.
8. **Ask before ambiguity.** If a task references a choice that is not obvious from this file or from the existing code, stop and leave a TODO comment rather than guessing.

## Non-goals

- Rewriting the skill library.
- Adding an LLM-based analysis mode (keep the "no API key, no network" positioning).
- Rewriting `update.ts`'s merge logic (Fix #8 just shipped, leave the algorithm alone).
- Supporting nested AGENTS.md / subdirectory instruction files. That is a future version.
- MCP server config propagation. Ruler's turf for now.

---

## Phase 0: Test harness (blocker for everything else)

### Task 0.1: Add `tests/fixtures/` with representative projects

Create fixture project roots (just the files that matter for detection, not working projects):

- `tests/fixtures/nextjs-app-router/` (package.json with next 14+, `app/` dir with a `page.tsx`, `tsconfig.json` with `strict: true`, `tailwind.config.ts`)
- `tests/fixtures/nextjs-pages-router/` (package.json with next 13, `pages/` dir with `index.tsx`, no `app/` dir)
- `tests/fixtures/vite-react-ts/` (package.json with vite + react, `vite.config.ts`, `tsconfig.json`)
- `tests/fixtures/express-prisma/` (package.json with express + prisma + @types/node, `prisma/schema.prisma`)
- `tests/fixtures/python-django/` (`manage.py`, `requirements.txt` with django, `settings.py`)
- `tests/fixtures/go-module/` (`go.mod`, one `.go` file)
- `tests/fixtures/rust-cargo/` (`Cargo.toml`)
- `tests/fixtures/swiftui-xcode/` (`.swift` file with `import SwiftUI`, `Package.swift` marker file)
- `tests/fixtures/monorepo-turbo/` (root `turbo.json`, `pnpm-workspace.yaml`, two packages each with their own `package.json`)
- `tests/fixtures/empty-project/` (just a `.gitkeep`, tests fallback behavior)

Fixture files are minimal. Do not check in `node_modules`, actual source, or lockfiles larger than a few hundred bytes.

### Task 0.2: Add a snapshot runner at `tests/run.ts`

- Iterate every directory under `tests/fixtures/`.
- For each: call `detectStack(fixtureDir)`, then for each target tool (`claude`, `cursor`, `copilot`, `all`, and the new `agents` target from Phase 1), call the current generator functions into a temp output dir.
- Write normalized output (sorted file list plus each file's content) to `tests/snapshots/<fixture>/<tool>.snap`.
- First run: write snapshots. Subsequent runs: diff against disk. Diff failure exits non-zero with a unified diff.
- Add `test` and `test:update` scripts to `package.json`. `test:update` overwrites snapshots.

Keep it dependency-free. `node --test` is fine if it helps; plain `tsx` / `node --import` driving a custom runner is also fine. No Jest, no Vitest.

### Task 0.3: Wire into GitHub Actions

Add `.github/workflows/test.yml` that runs `npm ci && npm run build && npm test` on Node 18 and Node 20 against pushes and PRs. Fail the build on snapshot diff.

**Exit criteria for Phase 0:** green CI, snapshot files checked in, baseline established for current behavior.

---

## Phase 1: AGENTS.md as a first-class target, and Codex fix

### Task 1.1: Add `'agents'` to `TargetTool` in `src/index.ts`

Update the `TargetTool` union, the `--tool` help text, the argument validator, and the README's `--tool` table (later, in Phase 5). `--tool all` must now include AGENTS.md output.

### Task 1.2: Add `generateAgentsMd(detected, skillPaths)` in `src/generate.ts`

Writes a single `AGENTS.md` at the project root. Structure (order matters, per the agents.md spec and the augmentcode.com study):

```markdown
# <project-name from package.json, or directory name fallback>

> AGENTS.md: instructions for AI coding agents working on this project.
> Human contributors: see README.md.

## Stack

<bullet list of detected techs with versions where known from package.json>

## Commands

<extracted from package.json "scripts" if present, else a placeholder block>

## Conventions

<stack-derived bullets pulled from the matched skill files>

## What to avoid

<stack-derived bullets, same source>
```

The "Conventions" and "What to avoid" sections are assembled by pulling short summaries from each matched skill. Do not inline the full SKILL.md bodies. Target total file size around 2 to 4 KB for a typical stack. If total would exceed 8 KB, truncate the least-specific stack's bullets first.

### Task 1.3: Fix the Codex mapping

Today the README and implementation map Codex to `.claude/skills/`. Codex reads `AGENTS.md`. Change:

- README table `Codex CLI` row: output is `AGENTS.md`, auto-loaded yes.
- `generate.ts` Codex branch (if it has its own) or the `all` branch: emit AGENTS.md for Codex.
- Remove the misleading `.claude/skills/` line for Codex.

### Task 1.4: DEFERRED (do not implement in this PR)

Changing the default `--tool` behavior to emit AGENTS.md alongside CLAUDE.md is deferred until after Phase 1 output has been reviewed. For this PR: `--tool agents` is opt-in, `--tool all` includes it, and the existing `--tool claude` default behavior is unchanged. Do not touch default behavior. Do not modify the README's default-behavior description.

### Task 1.5: Snapshot update

Regenerate snapshots. Review the diff manually. Commit the snapshot update in the same PR as the feature, not separately.

**Exit criteria for Phase 1:** `AGENTS.md` renders for every fixture, Codex mapping fixed, `--tool all` covers AGENTS.md, tests green.

---

## Phase 2: Broader agent coverage

Add these targets. For each: a TargetTool value, an output path, and a `generate<n>` branch in `src/generate.ts`. Most of these reuse the same content as either AGENTS.md or the Cursor `.mdc` output and only differ in path and frontmatter.

| Agent          | Output path                      | Content source              |
|----------------|----------------------------------|-----------------------------|
| Windsurf       | `.windsurfrules`                 | AGENTS.md body, plain text  |
| Aider          | `CONVENTIONS.md`                 | AGENTS.md body              |
| Gemini CLI     | `GEMINI.md`                      | AGENTS.md body              |
| Cline          | `.clinerules`                    | AGENTS.md body, plain text  |
| Roo Code       | `.roo/rules.md`                  | AGENTS.md body              |
| JetBrains AI   | `.junie/guidelines.md`           | AGENTS.md body              |
| Amazon Q       | `.amazonq/rules/project.md`      | AGENTS.md body              |
| OpenCode       | `.opencode/AGENTS.md`            | AGENTS.md body              |
| Zed            | `.rules`                         | AGENTS.md body, plain text  |

### Task 2.1

Extend the `TargetTool` union and `--tool` flag parser to accept these names. `--tool all` writes every supported target.

### Task 2.2

Factor the shared body builder out of `generateAgentsMd` into a pure function that each new target calls, so path and preamble vary but body is single-source.

### Task 2.3

Update the README's "What It Does" table with the new rows. Note in a footnote which agents read AGENTS.md natively versus which need their own path.

### Task 2.4

Snapshot refresh.

**Exit criteria for Phase 2:** `--tool all` produces correct files for every agent above, every fixture has snapshots covering them, README table is accurate.

---

## Phase 3: Deeper deterministic detection

All of this is filesystem-based. No LLM, no network. The goal is to make the generated `## Stack`, `## Commands`, and `## Conventions` sections reflect what is actually in the project.

### Task 3.1: Extract package.json scripts into `## Commands`

In `src/detect.ts`, expose the `package.json` scripts block alongside the detected tech list. In `generate.ts`, when writing the `## Commands` section of AGENTS.md / CLAUDE.md, list the scripts that match a known category (case-insensitive): `dev`, `start`, `build`, `test`, `test:*`, `lint`, `format`, `typecheck`, `type-check`, `tsc`, `db:*`, `migrate`, `seed`. Format:

```markdown
## Commands

- `npm run dev`: <script value>
- `npm run test`: <script value>
```

Package manager prefix (`npm run` vs `pnpm` vs `yarn` vs `bun run`) is chosen by the lockfile (see 3.2).

### Task 3.2: Package manager detection

Add a `PackageManager` type to `detect.ts`: `'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown'`. Resolve by lockfile presence:

- `bun.lockb` or `bun.lock` -> `bun`
- `pnpm-lock.yaml` -> `pnpm`
- `yarn.lock` -> `yarn`
- `package-lock.json` -> `npm`
- none of the above -> `unknown` (fall back to `npm`)

Expose it from `detectStack` by widening the return type, or return a `DetectionResult` object with `{ techs, packageManager, scripts, ... }`. Changing the return shape is acceptable; update every caller.

### Task 3.3: Next.js router distinction

Split the `nextjs` DetectedTech into `'nextjs-app'` and `'nextjs-pages'`. Detection:

- next in deps AND `app/` directory exists at root or under `src/` -> `nextjs-app`
- next in deps AND `pages/` directory exists but no `app/` -> `nextjs-pages`
- next in deps AND both exist -> `nextjs-app` (App Router takes precedence when mixed)
- next in deps AND neither -> `nextjs-app` (new-project default, matches `create-next-app` 14+)

Add two skill variants: keep the existing `SKILL_NEXTJS` as the App Router skill (rename to `SKILL_NEXTJS_APP`), add `SKILL_NEXTJS_PAGES`. Registry routes each tag to its skill. This is the one skill edit Claude Code is allowed to make in this phase, because correctness depends on it.

### Task 3.4: TypeScript strict detection from tsconfig

Read `tsconfig.json` (swallow JSON-with-comments gracefully: strip `//` and `/* */` before `JSON.parse`). Expose `strict: boolean` and `noUncheckedIndexedAccess: boolean` in the detection result. Thread into the TypeScript skill's opening line so it says "strict mode: enabled" or "strict mode: not enabled (consider turning it on)" rather than unconditionally prescribing strict.

### Task 3.5: Monorepo detection

Add a `Monorepo` enum: `'turbo' | 'nx' | 'pnpm-workspaces' | 'lerna' | 'rush' | null`. Resolve by root file presence:

- `turbo.json` -> `turbo`
- `nx.json` -> `nx`
- `pnpm-workspace.yaml` -> `pnpm-workspaces`
- `lerna.json` -> `lerna`
- `rush.json` -> `rush`

When a monorepo is detected, add a one-line note under `## Stack` and a one-bullet "Workspace layout: packages under `packages/` (or detected root)" entry. Do not try to recurse into child packages in this phase. A `## Monorepo` note is enough.

### Task 3.6: Testing framework detection

Add DetectedTech values: `'vitest' | 'jest' | 'playwright' | 'cypress'`. Detection:

- devDep match, OR
- config file presence (`vitest.config.*`, `jest.config.*`, `playwright.config.*`, `cypress.config.*`)

Each gets a short skill (2 to 4 paragraphs). This is new content; Claude Code may draft them but **keep each under 40 lines** and mark with `<!-- review before release -->` so Sean can tighten them.

### Task 3.7: Linter / formatter detection

Add DetectedTech values: `'eslint' | 'eslint-flat' | 'biome' | 'prettier'`. Detection:

- `eslint-flat`: `eslint.config.{js,mjs,ts}`
- `eslint`: `.eslintrc*` (legacy)
- `biome`: `biome.json` or `biome.jsonc` or `@biomejs/biome` in devDeps
- `prettier`: `.prettierrc*` or `prettier` in devDeps

One-liner additions to the Conventions section, no full skill needed.

**Exit criteria for Phase 3:** the `nextjs-app-router` fixture produces a CLAUDE.md that contains App Router guidance, actual script commands, and "TypeScript strict: enabled", matching (within prose variation) the example in the current README.

---

## Phase 4: New stack detectors

One commit per stack. Each adds: a DetectedTech value, detection in `detect.ts`, a small skill in `skills.ts` (under 60 lines, include the `<!-- review before release -->` marker), registry wiring, and a snapshot fixture.

Order (high impact first):

1. Astro (`astro.config.*`, `astro` in deps)
2. SvelteKit (`@sveltejs/kit` in deps)
3. Remix (`@remix-run/*` in deps)
4. Nuxt (`nuxt` in deps, `nuxt.config.*`)
5. NestJS (`@nestjs/core` in deps, `nest-cli.json`)
6. FastAPI (python project with `fastapi` in `requirements.txt` or `pyproject.toml`)
7. Rails (`Gemfile` with `rails`, `config/application.rb`)
8. Laravel (`composer.json` with `laravel/framework`, `artisan` file)
9. Flutter (`pubspec.yaml` with `flutter:` key)
10. Angular (`angular.json`, `@angular/core` in deps)
11. Deno (`deno.json` or `deno.jsonc`)
12. tRPC (`@trpc/server` in deps, add as modifier bullet, not standalone skill)
13. Drizzle (`drizzle-orm` in deps)
14. Supabase (`@supabase/supabase-js` in deps)
15. Clerk (`@clerk/*` in deps, modifier bullet)

Stop after 10 unless there is time. Phases 1 to 3 matter more than Phase 4 breadth.

---

## Phase 5: README truth-up

### Task 5.1: Make the Before / After example real

After Phase 3 lands, rerun the tool against a minimal Next.js App Router + Prisma fixture. Paste the **actual** generated `CLAUDE.md` excerpt into the README in place of the aspirational current one. If it is less polished than what is there now, iterate on skill content (with Sean's review) rather than faking the README.

### Task 5.2: Update the "What It Does" table

Reflect Phase 2 agent additions. Add a column for "Reads AGENTS.md?" so users see why some paths are tool-specific and others aren't.

### Task 5.3: Add a short "Why auto-generate" section

Two paragraphs answering the HumanLayer critique ("avoid auto-generating CLAUDE.md"). Position: ContextEngine generates a **starting point** that `--update` keeps in sync with the stack; user edits are preserved between runs; skills are lazy-loaded by description match so the baseline context cost is low.

### Task 5.4: Update the Detected Stacks line

Actually list what ships. Do not oversell.

---

## Quality gates before merge

- `npm run build` clean (no TypeScript errors, no warnings)
- `npm test` green on Node 18 and Node 20
- Snapshot diff reviewed commit-by-commit in the PR
- Manual smoke test: `npx .` against a real Next.js App Router + Prisma project, then against a plain Python project, then against an empty directory. Output looks sane in all three.
- Version bump to `1.3.0` in `package.json` as the final commit.
- README updated (Phase 5) in the final commit.

## Commit message convention

- `test: add fixture harness and baseline snapshots` (0.1 + 0.2)
- `ci: run snapshot tests on node 18 and 20` (0.3)
- `feat: emit AGENTS.md as a first-class target` (1.1 + 1.2)
- `fix: map codex to AGENTS.md, not .claude/skills/` (1.3)
- `feat: include AGENTS.md in default output` (1.4)
- `feat(agents): add windsurf, aider, gemini, cline, ...` (one per agent or small groups)
- `feat(detect): extract package.json scripts into commands section` (3.1)
- `feat(detect): package manager from lockfile` (3.2)
- `feat(detect): split nextjs into app router and pages router` (3.3)
- `docs: README reflects actual generator output` (5.1)
- `chore: bump to 1.3.0`

## When to stop and ask

- Any change to `src/skills.ts` content beyond the Next.js split and the new-framework skills listed in Phase 4. Sean reviews skill prose.
- Any new runtime dependency.
- Any breaking change to the `--tool` flag's accepted values (renames, removals).
- Any change to `update.ts`'s merge algorithm.

If in doubt, leave a `TODO(sean):` comment and move on to the next task.
