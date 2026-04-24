// registry.ts — Maps detected technologies to skill and agent files

import type { DetectedTech, DetectionResult, TsconfigFlags } from './detect.js';
import type { SkillFile } from './skills.js';
import {
  SKILL_TYPESCRIPT, SKILL_NODEJS, SKILL_EXPRESS,
  SKILL_NEXTJS_APP, SKILL_NEXTJS_PAGES,
  SKILL_REACT,
  SKILL_VITE, SKILL_VUE, SKILL_TAILWIND, SKILL_SWIFTUI, SKILL_STRIPE,
  SKILL_PRISMA, SKILL_POSTGRESQL, SKILL_MONGODB, SKILL_AZURE, SKILL_DOCKER,
  SKILL_GO, SKILL_PYTHON, SKILL_DJANGO, SKILL_RUST, SKILL_BUN,
  SKILL_PHP, SKILL_CSHARP,
  SKILL_VITEST, SKILL_JEST, SKILL_PLAYWRIGHT, SKILL_CYPRESS,
  SKILL_ASTRO, SKILL_SVELTEKIT, SKILL_REMIX, SKILL_NUXT, SKILL_NESTJS,
  SKILL_FASTAPI, SKILL_RAILS, SKILL_LARAVEL, SKILL_FLUTTER,
  SKILL_ANGULAR,
  AGENT_BACKEND, AGENT_FRONTEND, AGENT_IOS, AGENT_REVIEWER, AGENT_DEVOPS,
} from './skills.js';

interface SkillEntry {
  triggers: DetectedTech[];
  files: SkillFile[];
}

const SKILL_REGISTRY: SkillEntry[] = [
  { triggers: ['typescript'],               files: [SKILL_TYPESCRIPT] },
  { triggers: ['nodejs'],                   files: [SKILL_NODEJS] },
  { triggers: ['express'],                  files: [SKILL_EXPRESS] },
  { triggers: ['nextjs-app'],               files: [SKILL_NEXTJS_APP, SKILL_REACT] },
  { triggers: ['nextjs-pages'],             files: [SKILL_NEXTJS_PAGES, SKILL_REACT] },
  { triggers: ['react'],                    files: [SKILL_REACT] },
  { triggers: ['vite'],                     files: [SKILL_VITE] },
  { triggers: ['vue'],                      files: [SKILL_VUE] },
  { triggers: ['tailwind'],                 files: [SKILL_TAILWIND] },
  { triggers: ['swiftui'],                  files: [SKILL_SWIFTUI] },
  { triggers: ['stripe'],                   files: [SKILL_STRIPE] },
  { triggers: ['prisma'],                   files: [SKILL_PRISMA] },
  { triggers: ['postgresql'],               files: [SKILL_POSTGRESQL] },
  { triggers: ['mongodb'],                  files: [SKILL_MONGODB] },
  { triggers: ['azure'],                    files: [SKILL_AZURE] },
  { triggers: ['docker'],                   files: [SKILL_DOCKER] },
  { triggers: ['go'],                       files: [SKILL_GO] },
  { triggers: ['python'],                   files: [SKILL_PYTHON] },
  { triggers: ['django'],                   files: [SKILL_DJANGO] },
  { triggers: ['rust'],                     files: [SKILL_RUST] },
  { triggers: ['bun'],                      files: [SKILL_BUN] },
  { triggers: ['php'],                      files: [SKILL_PHP] },
  { triggers: ['csharp'],                   files: [SKILL_CSHARP] },
  { triggers: ['astro'],                    files: [SKILL_ASTRO] },
  { triggers: ['sveltekit'],                files: [SKILL_SVELTEKIT] },
  { triggers: ['remix'],                    files: [SKILL_REMIX] },
  { triggers: ['nuxt'],                     files: [SKILL_NUXT] },
  { triggers: ['nestjs'],                   files: [SKILL_NESTJS] },
  { triggers: ['fastapi'],                  files: [SKILL_FASTAPI] },
  { triggers: ['rails'],                    files: [SKILL_RAILS] },
  { triggers: ['laravel'],                  files: [SKILL_LARAVEL] },
  { triggers: ['flutter'],                  files: [SKILL_FLUTTER] },
  { triggers: ['angular'],                  files: [SKILL_ANGULAR] },
  { triggers: ['vitest'],                   files: [SKILL_VITEST] },
  { triggers: ['jest'],                     files: [SKILL_JEST] },
  { triggers: ['playwright'],               files: [SKILL_PLAYWRIGHT] },
  { triggers: ['cypress'],                  files: [SKILL_CYPRESS] },
];

const AGENT_REGISTRY: SkillEntry[] = [
  {
    triggers: ['nodejs', 'express', 'nextjs-app', 'nextjs-pages', 'nestjs', 'fastapi', 'rails', 'laravel', 'typescript', 'prisma', 'postgresql', 'mongodb', 'go', 'python', 'django', 'rust', 'bun', 'php'],
    files: [AGENT_BACKEND],
  },
  {
    triggers: ['nextjs-app', 'nextjs-pages', 'react', 'vue', 'vite', 'tailwind', 'astro', 'sveltekit', 'remix', 'nuxt', 'angular'],
    files: [AGENT_FRONTEND],
  },
  {
    triggers: ['swiftui', 'flutter'],
    files: [AGENT_IOS],
  },
  {
    triggers: ['azure', 'docker'],
    files: [AGENT_DEVOPS],
  },
];

const ALWAYS: SkillFile[] = [AGENT_REVIEWER];

export function selectFiles(
  detection: DetectionResult,
  includeAgents: boolean,
): SkillFile[] {
  const detectedSet = new Set(detection.techs);
  const selected = new Map<string, SkillFile>();

  for (const f of ALWAYS) selected.set(f.path, f);

  for (const entry of SKILL_REGISTRY) {
    if (entry.triggers.some(t => detectedSet.has(t))) {
      for (const f of entry.files) selected.set(f.path, f);
    }
  }

  if (includeAgents) {
    for (const entry of AGENT_REGISTRY) {
      if (entry.triggers.some(t => detectedSet.has(t))) {
        for (const f of entry.files) selected.set(f.path, f);
      }
    }
  }

  return Array.from(selected.values()).map(f => adaptSkill(f, detection));
}

// Hook detected project state into otherwise-static skill content.
// Today: inject a one-line tsconfig state callout into the TypeScript skill
// so it reflects the project's real `strict` / `noUncheckedIndexedAccess`
// settings instead of unconditionally prescribing them.
function adaptSkill(file: SkillFile, detection: DetectionResult): SkillFile {
  if (file.path === SKILL_TYPESCRIPT.path && detection.tsconfig) {
    return { ...file, content: injectTypescriptState(file.content, detection.tsconfig) };
  }
  return file;
}

function injectTypescriptState(content: string, ts: TsconfigFlags): string {
  const strictLine = ts.strict
    ? 'Detected in tsconfig: `strict: true`.'
    : 'Detected in tsconfig: `strict` is NOT enabled. Consider turning it on.';
  const nuLine = ts.noUncheckedIndexedAccess
    ? 'Detected in tsconfig: `noUncheckedIndexedAccess: true`.'
    : 'Detected in tsconfig: `noUncheckedIndexedAccess` is NOT enabled. Consider turning it on.';

  const lines = content.split('\n');
  let dashes = 0;
  let insertAt = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '---') {
      dashes++;
      if (dashes === 2) { insertAt = i + 1; break; }
    }
  }
  if (insertAt === -1) return content;
  lines.splice(insertAt, 0, '', `> ${strictLine}`, `> ${nuLine}`);
  return lines.join('\n');
}
