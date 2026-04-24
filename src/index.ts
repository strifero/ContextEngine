#!/usr/bin/env node
// ContextEngine — CLI entry point

import { parseArgs } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import { detectStack } from './detect.js';
import { generateFiles } from './generate.js';
import { updateProject } from './update.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Fix #10: safe version read with fallback
let VERSION = '0.0.0';
try {
  const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8')) as { version?: string };
  VERSION = pkg.version ?? VERSION;
} catch {
  // package.json missing or malformed — continue with fallback
}

export type TargetTool =
  | 'claude' | 'cursor' | 'copilot' | 'agents'
  | 'windsurf' | 'aider' | 'gemini' | 'cline' | 'roo' | 'junie' | 'amazon-q' | 'opencode' | 'zed'
  | 'all';

const { values: flags } = parseArgs({
  options: {
    dir:         { type: 'string',  short: 'd', default: process.cwd() },
    force:       { type: 'boolean', short: 'f', default: false },
    update:      { type: 'boolean', short: 'u', default: false },
    tool:        { type: 'string',  short: 't', default: 'claude' },
    'no-agents': { type: 'boolean', default: false },
    version:     { type: 'boolean', short: 'v', default: false },
    help:        { type: 'boolean', short: 'h', default: false },
  },
  strict: false,
});

if (flags.version) {
  console.log(`contextengine v${VERSION}`);
  process.exit(0);
}

if (flags.help) {
  console.log(`
${pc.bold('contextengine')} — Give any AI agent your entire codebase in one command.

${pc.bold('Usage:')}
  npx contextengine [options]

${pc.bold('Options:')}
  -d, --dir <path>              Project directory to analyze (default: current directory)
  -t, --tool <name>             AI tool to generate context for (default: claude)
                                Named targets:
                                  claude, cursor, copilot, agents,
                                  windsurf, aider, gemini, cline, roo,
                                  junie, amazon-q, opencode, zed, all
                                'agents' writes AGENTS.md at the project root.
                                Windsurf, Aider, Gemini, Cline, Roo, Junie,
                                Amazon Q, OpenCode, and Zed write the same
                                body at their tool-specific paths.
                                'all' writes every target in one pass.
  -f, --force                   Overwrite existing context files
  -u, --update                  Re-sync skills and agents, preserving your edits
  --no-agents                   Skip agent generation (Claude Code only)
  -v, --version                 Print version
  -h, --help                    Show this help

${pc.bold('Examples:')}
  npx contextengine                         # Claude Code — generate everything
  npx contextengine --tool cursor           # Cursor rules
  npx contextengine --tool copilot          # GitHub Copilot instructions
  npx contextengine --tool agents           # AGENTS.md (Codex, OpenCode, etc.)
  npx contextengine --tool all              # All tools in one pass
  npx contextengine --update                # Stack changed — sync without losing edits
  npx contextengine --force                 # Nuke and regenerate from scratch
  npx contextengine --dir ./app             # Target a specific directory

${pc.dim('by Strife Technologies — https://strifetech.com')}
`);
  process.exit(0);
}

// ── Validate ─────────────────────────────────────────────────────

const projectDir = resolve(flags.dir as string);
const tool = (flags.tool ?? 'claude') as TargetTool;

const validTools: TargetTool[] = [
  'claude', 'cursor', 'copilot', 'agents',
  'windsurf', 'aider', 'gemini', 'cline', 'roo', 'junie', 'amazon-q', 'opencode', 'zed',
  'all',
];
if (!validTools.includes(tool)) {
  console.error(pc.red(`\n  Unknown tool: "${tool}". Valid options: ${validTools.join(', ')}\n`));
  process.exit(1);
}

if (!existsSync(projectDir)) {
  console.error(pc.red(`Directory not found: ${projectDir}`));
  process.exit(1);
}

if (flags.force && flags.update) {
  console.error(pc.red('\n  Cannot use --force and --update together.\n'));
  process.exit(1);
}

// For non-claude tools, --update is not yet supported
if (flags.update && tool !== 'claude') {
  console.error(pc.red('\n  --update is currently only supported for --tool claude.\n'));
  process.exit(1);
}

const claudeDir = resolve(projectDir, '.claude');
const claudeExists = existsSync(claudeDir);

if (flags.update && !claudeExists) {
  console.error(pc.red('\n  Nothing to update — .claude/ does not exist. Run contextengine first.\n'));
  process.exit(1);
}

if (tool === 'claude' && claudeExists && !flags.force && !flags.update) {
  console.log(pc.yellow(`\n  .claude/ already exists.`));
  console.log(`  Use ${pc.bold('--update')} to sync skills (preserves your edits)`);
  console.log(`  Use ${pc.bold('--force')} to overwrite everything\n`);
  process.exit(0);
}

// ── Detect ───────────────────────────────────────────────────────

console.log(`\n${pc.bold('ContextEngine')} ${pc.dim(`v${VERSION}`)}\n`);
console.log(`  Analyzing ${pc.cyan(projectDir)}\n`);

const detection = await detectStack(projectDir);
const detected = detection.techs;

if (detected.length === 0) {
  console.log(pc.yellow('  No recognized tech stack detected.\n'));
} else {
  console.log(`  ${pc.green('✓')} Detected: ${detected.map(d => pc.bold(d)).join(', ')}\n`);
}
if (detection.packageManager !== 'unknown') {
  console.log(`  ${pc.dim(`Package manager: ${detection.packageManager}`)}\n`);
}

if (tool !== 'claude') {
  console.log(`  ${pc.dim(`Generating for: ${tool}`)}\n`);
}

// ── Execute ──────────────────────────────────────────────────────

// Fix #4: wrap execution in try/catch for clean error output
try {
  if (flags.update) {
    const result = await updateProject({
      projectDir,
      detection,
      includeAgents: !flags['no-agents'],
    });

    if (result.added.length > 0) {
      console.log(`  ${pc.green('+')} Added:`);
      for (const f of result.added) console.log(`    ${pc.green('+')} ${f}`);
    }
    if (result.removed.length > 0) {
      console.log(`  ${pc.red('−')} Removed:`);
      for (const f of result.removed) console.log(`    ${pc.red('−')} ${f}`);
    }
    if (result.kept.length > 0) {
      console.log(`  ${pc.dim('=')} Unchanged: ${result.kept.length} files`);
    }
    if (result.claudeMdUpdated) {
      console.log(`  ${pc.green('✓')} CLAUDE.md updated (your edits preserved)`);
    }

    const total = result.added.length + result.removed.length;
    if (total === 0 && result.claudeMdUpdated) {
      console.log(`\n  ${pc.bold('Up to date.')} Stack line and skill lists refreshed.\n`);
    } else if (total === 0) {
      console.log(`\n  ${pc.bold('Already up to date.')} Nothing changed.\n`);
    } else {
      console.log(`\n  ${pc.bold('Done.')} ${result.added.length} added, ${result.removed.length} removed.\n`);
    }
  } else {
    const result = await generateFiles({
      projectDir,
      detection,
      tool,
      includeAgents: !flags['no-agents'],
    });

    console.log(`\n  ${pc.green('✓')} Generated ${result.fileCount} files\n`);
    for (const file of result.files) {
      console.log(`    ${pc.dim('+')} ${file}`);
    }
    console.log(`\n  ${pc.bold('Done.')} Your AI agent is ready.\n`);
  }
} catch (err) {
  console.error(pc.red(`\n  Error: ${(err as Error).message}\n`));
  process.exit(1);
}

console.log(`  ${pc.dim('by Strife Technologies — https://strifetech.com')}\n`);
