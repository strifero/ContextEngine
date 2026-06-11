# Contributing to ContextEngine

Thanks for your interest! ContextEngine is MIT licensed and welcomes contributions.

## Adding a New Stack

Skills are plain markdown files wrapped in a TypeScript export.

### 1. Add the skill content to `src/skills.ts`

```typescript
export const SKILL_MYSTACK: SkillFile = {
  path: 'skills/mystack/SKILL.md',
  content: `---
name: mystack
description: When to use this skill — be specific.
---

# MyStack Conventions

...
`,
};
```

### 2. Add detection logic to `src/detect.ts`

```typescript
// MyStack
if (hasFile(dir, 'mystack.config.js') || hasDep(pkg, 'mystack')) {
  detected.add('mystack');
}
```

Add `'mystack'` to the `DetectedTech` union type at the top of the file.

### 3. Wire it up in `src/registry.ts`

```typescript
import { ..., SKILL_MYSTACK } from './skills.js';

// In SKILL_REGISTRY:
{ triggers: ['mystack'], files: [SKILL_MYSTACK] },
```

### 4. Add Cursor output support in `src/generate.ts`

The Cursor generator uses the same skill content automatically — no changes needed unless you want custom frontmatter.

### 5. Add a snapshot fixture

Create a minimal project under `tests/fixtures/mystack/` (just the files your
detection logic looks for), then run `npm run test:update` to generate the
snapshots under `tests/snapshots/mystack/` and commit them. CI fails on any
fixture without committed snapshots.

### 6. Open a PR

- One stack per PR
- Include a brief description of what the skill covers
- Sanity-check by hand: `npm run build && node dist/index.js --dir /path/to/project-using-mystack`
- Make sure `npm test` is green (snapshot + unit tests)

## Improving Existing Skills

Skills live in `src/skills.ts`. Each one is a markdown string — edit directly and open a PR.

Good skill content:
- Concrete code examples, not vague advice
- Opinionated defaults that work for most projects
- Actionable rules ("never use X", "always Y")
- Short — under 80 lines

## Development

```bash
npm install
npm run dev           # watch mode
npm run build         # compile to dist/
npm test              # build + snapshot tests + unit tests
npm run test:update   # rewrite snapshots after an intentional output change
node dist/index.js --dir /path/to/test-project
```

## License

MIT — by [Strife Technologies](https://strifetech.com)
