#!/usr/bin/env node
// Snapshot runner for ContextEngine.
// Iterates tests/fixtures/*, runs detectStack + generateFiles for each tool
// into a temp dir, then serializes the output and diffs it against
// tests/snapshots/<fixture>/<tool>.snap.
//
// Run: `npm test`         — diff mode (fails on mismatch)
//      `npm run test:update` — write new snapshots

import {
  readdirSync, readFileSync, writeFileSync,
  mkdirSync, existsSync, rmSync,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

import { detectStack } from '../dist/detect.js';
import { generateFiles } from '../dist/generate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR  = join(__dirname, 'fixtures');
const SNAPSHOTS_DIR = join(__dirname, 'snapshots');

const UPDATE = process.argv.includes('--update');
const TOOLS  = ['claude', 'cursor', 'copilot', 'all'];

function walk(dir, base = dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, base));
    else out.push(relative(base, full).split('\\').join('/'));
  }
  return out.sort();
}

function normalize(text) {
  return text.replace(/\r\n/g, '\n');
}

function serialize(outputDir, detected) {
  const files = existsSync(outputDir) ? walk(outputDir) : [];
  const parts = [
    '# Snapshot',
    '',
    '## Detected',
    detected.length ? detected.join(', ') : '(none)',
    '',
    `## Files (${files.length})`,
    ...files.map(f => `- ${f}`),
    '',
  ];
  for (const rel of files) {
    const content = normalize(readFileSync(join(outputDir, rel), 'utf-8'));
    parts.push('---', `FILE: ${rel}`, '---', content.replace(/\n+$/, ''), '');
  }
  return parts.join('\n');
}

function diff(expected, actual) {
  const e = expected.split('\n');
  const a = actual.split('\n');
  const max = Math.max(e.length, a.length);
  const out = [];
  let shown = 0;
  for (let i = 0; i < max; i++) {
    if (e[i] !== a[i]) {
      out.push(`  line ${i + 1}:`);
      out.push(`    - ${e[i] ?? '(eof)'}`);
      out.push(`    + ${a[i] ?? '(eof)'}`);
      shown++;
      if (shown >= 20) { out.push('  ... (more diffs suppressed)'); break; }
    }
  }
  return out.join('\n');
}

const fixtures = readdirSync(FIXTURES_DIR, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => e.name)
  .sort();

let total   = 0;
let passed  = 0;
let written = 0;
let failed  = 0;
const failures = [];

for (const fixture of fixtures) {
  const fixtureDir = join(FIXTURES_DIR, fixture);
  const detected = await detectStack(fixtureDir);

  for (const tool of TOOLS) {
    total++;
    const tempDir = join(tmpdir(), `ctxeng-${fixture}-${tool}-${process.pid}-${Date.now()}`);
    if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
    mkdirSync(tempDir, { recursive: true });

    try {
      await generateFiles({
        projectDir: tempDir,
        detected,
        tool,
        includeAgents: true,
      });

      const actual = serialize(tempDir, detected);
      const snapFile = join(SNAPSHOTS_DIR, fixture, `${tool}.snap`);

      if (!existsSync(snapFile) || UPDATE) {
        mkdirSync(dirname(snapFile), { recursive: true });
        writeFileSync(snapFile, actual, 'utf-8');
        written++;
        console.log(`  ${UPDATE ? 'updated' : 'wrote'}  ${fixture}/${tool}`);
      } else {
        const expected = normalize(readFileSync(snapFile, 'utf-8'));
        if (actual === expected) {
          passed++;
          console.log(`  pass     ${fixture}/${tool}`);
        } else {
          failed++;
          failures.push({ fixture, tool, expected, actual });
          console.log(`  FAIL     ${fixture}/${tool}`);
        }
      }
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

console.log('');
console.log(`total: ${total}  passed: ${passed}  written: ${written}  failed: ${failed}`);

if (failed > 0) {
  console.log('');
  for (const f of failures) {
    console.log(`--- ${f.fixture}/${f.tool} ---`);
    console.log(diff(f.expected, f.actual));
    console.log('');
  }
  console.log('Run `npm run test:update` to accept the new output.');
  process.exit(1);
}
