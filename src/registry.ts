// registry.ts — Maps detected technologies to skill and agent files

import type { DetectedTech } from './detect.js';
import type { SkillFile } from './skills.js';
import {
  SKILL_TYPESCRIPT, SKILL_NODEJS, SKILL_EXPRESS, SKILL_NEXTJS, SKILL_REACT,
  SKILL_VITE, SKILL_VUE, SKILL_TAILWIND, SKILL_SWIFTUI, SKILL_STRIPE,
  SKILL_PRISMA, SKILL_POSTGRESQL, SKILL_MONGODB, SKILL_AZURE, SKILL_DOCKER,
  SKILL_GO, SKILL_PYTHON, SKILL_DJANGO, SKILL_RUST, SKILL_BUN,
  SKILL_PHP, SKILL_CSHARP,
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
  { triggers: ['nextjs'],                   files: [SKILL_NEXTJS, SKILL_REACT] },
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
];

const AGENT_REGISTRY: SkillEntry[] = [
  {
    triggers: ['nodejs', 'express', 'nextjs', 'typescript', 'prisma', 'postgresql', 'mongodb', 'go', 'python', 'django', 'rust', 'bun', 'php'],
    files: [AGENT_BACKEND],
  },
  {
    triggers: ['nextjs', 'react', 'vue', 'vite', 'tailwind'],
    files: [AGENT_FRONTEND],
  },
  {
    triggers: ['swiftui'],
    files: [AGENT_IOS],
  },
  {
    triggers: ['azure', 'docker'],
    files: [AGENT_DEVOPS],
  },
];

const ALWAYS: SkillFile[] = [AGENT_REVIEWER];

export function selectFiles(
  detected: DetectedTech[],
  includeAgents: boolean,
): SkillFile[] {
  const detectedSet = new Set(detected);
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

  return Array.from(selected.values());
}
