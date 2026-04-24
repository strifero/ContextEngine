// detect.ts — Scan a project directory and identify its tech stack

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type DetectedTech =
  | 'typescript' | 'nodejs' | 'express'
  | 'nextjs-app' | 'nextjs-pages'
  | 'react'
  | 'vite' | 'vue' | 'tailwind' | 'swiftui' | 'stripe'
  | 'prisma' | 'postgresql' | 'mongodb' | 'azure' | 'docker'
  | 'go' | 'python' | 'django' | 'rust' | 'bun' | 'php' | 'csharp'
  | 'vitest' | 'jest' | 'playwright' | 'cypress';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown';

export interface TsconfigFlags {
  strict:                   boolean;
  noUncheckedIndexedAccess: boolean;
}

export type Monorepo = 'turbo' | 'nx' | 'pnpm-workspaces' | 'lerna' | 'rush' | null;

export interface DetectionResult {
  techs:          DetectedTech[];
  packageManager: PackageManager;
  scripts:        Record<string, string>;
  tsconfig:       TsconfigFlags | null;
  monorepo:       Monorepo;
}

interface PackageJson {
  scripts?:         Record<string, string>;
  dependencies?:    Record<string, string>;
  devDependencies?: Record<string, string>;
}

function readJson<T>(path: string): T | null {
  try { return JSON.parse(readFileSync(path, 'utf-8')) as T; }
  catch { return null; }
}

function hasDep(pkg: PackageJson | null, ...names: string[]): boolean {
  if (!pkg) return false;
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  return names.some(n => n in all);
}

function hasFile(dir: string, ...names: string[]): boolean {
  return names.some(n => existsSync(join(dir, n)));
}

function hasExtension(dir: string, ext: string, maxDepth = 2): boolean {
  try { return scanExtension(dir, ext, maxDepth); }
  catch { return false; }
}

function scanExtension(dir: string, ext: string, depth: number): boolean {
  if (depth < 0) return false;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    if (entry.isFile() && entry.name.endsWith(ext)) return true;
    if (entry.isDirectory() && scanExtension(join(dir, entry.name), ext, depth - 1)) return true;
  }
  return false;
}

function detectPackageManager(dir: string): PackageManager {
  if (hasFile(dir, 'bun.lockb', 'bun.lock')) return 'bun';
  if (hasFile(dir, 'pnpm-lock.yaml'))        return 'pnpm';
  if (hasFile(dir, 'yarn.lock'))             return 'yarn';
  if (hasFile(dir, 'package-lock.json'))     return 'npm';
  return 'unknown';
}

// Strip // line and /* */ block comments so tsconfig (JSON-with-comments) parses.
// Not string-aware, but tsconfig values rarely contain // or /* literally.
function stripJsonComments(raw: string): string {
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function detectMonorepo(dir: string): Monorepo {
  if (hasFile(dir, 'turbo.json'))           return 'turbo';
  if (hasFile(dir, 'nx.json'))              return 'nx';
  if (hasFile(dir, 'pnpm-workspace.yaml'))  return 'pnpm-workspaces';
  if (hasFile(dir, 'lerna.json'))           return 'lerna';
  if (hasFile(dir, 'rush.json'))            return 'rush';
  return null;
}

function readTsconfig(dir: string): TsconfigFlags | null {
  const path = join(dir, 'tsconfig.json');
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf-8');
    const parsed = JSON.parse(stripJsonComments(raw)) as { compilerOptions?: Record<string, unknown> };
    const co = parsed.compilerOptions ?? {};
    return {
      strict:                   co.strict === true,
      noUncheckedIndexedAccess: co.noUncheckedIndexedAccess === true,
    };
  } catch {
    return null;
  }
}

export async function detectStack(dir: string): Promise<DetectionResult> {
  const detected = new Set<DetectedTech>();
  const pkg = readJson<PackageJson>(join(dir, 'package.json'));

  if (hasFile(dir, 'tsconfig.json') || hasExtension(dir, '.ts') || hasExtension(dir, '.tsx'))
    detected.add('typescript');

  const hasNext = hasFile(dir, 'next.config.js', 'next.config.ts', 'next.config.mjs') || hasDep(pkg, 'next');
  if (hasNext) {
    // Plan task 3.3:
    //   app/ present (or both)          -> nextjs-app
    //   pages/ present and no app/      -> nextjs-pages
    //   neither present                 -> nextjs-app (new-project default)
    const hasAppDir   = existsSync(join(dir, 'app'))   || existsSync(join(dir, 'src', 'app'));
    const hasPagesDir = existsSync(join(dir, 'pages')) || existsSync(join(dir, 'src', 'pages'));
    if (hasPagesDir && !hasAppDir) detected.add('nextjs-pages');
    else                            detected.add('nextjs-app');
    detected.add('react');
    detected.add('nodejs');
  }

  if (hasDep(pkg, 'react', 'react-dom')) detected.add('react');

  if (hasFile(dir, 'vite.config.js', 'vite.config.ts', 'vite.config.mjs') || hasDep(pkg, 'vite'))
    detected.add('vite');

  if (hasDep(pkg, 'vue', '@vue/core', 'nuxt')) detected.add('vue');

  if (pkg && !hasNext) detected.add('nodejs');

  if (hasFile(dir, 'bun.lockb', 'bun.lock')) detected.add('bun');

  if (hasDep(pkg, 'express')) detected.add('express');

  if (hasFile(dir, 'tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs') || hasDep(pkg, 'tailwindcss'))
    detected.add('tailwind');

  if (hasDep(pkg, 'stripe')) detected.add('stripe');

  if (hasFile(dir, 'prisma/schema.prisma') || hasDep(pkg, '@prisma/client', 'prisma'))
    detected.add('prisma');

  if (hasDep(pkg, 'pg', 'postgres', 'node-postgres', '@vercel/postgres', 'drizzle-orm'))
    detected.add('postgresql');

  if (hasDep(pkg, 'mongoose', 'mongodb', '@typegoose/typegoose')) detected.add('mongodb');

  if (hasFile(dir, 'azure.yaml', '.azure') || hasExtension(dir, '.bicep') ||
      hasDep(pkg, '@azure/cosmos', '@azure/identity', '@azure/storage-blob'))
    detected.add('azure');

  if (hasFile(dir, 'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml')) detected.add('docker');

  if (hasExtension(dir, '.swift') || hasFile(dir, 'Package.swift')) detected.add('swiftui');

  if (hasFile(dir, 'go.mod', 'go.sum')) detected.add('go');

  if (hasFile(dir, 'pyproject.toml', 'requirements.txt', 'setup.py', 'Pipfile')) {
    detected.add('python');
    if (hasFile(dir, 'manage.py')) detected.add('django');
  }

  if (hasFile(dir, 'Cargo.toml')) detected.add('rust');

  if (hasFile(dir, 'composer.json', 'composer.lock', 'artisan', 'wp-config.php') ||
      hasExtension(dir, '.php'))
    detected.add('php');

  if (hasFile(dir, 'global.json') || hasExtension(dir, '.csproj') ||
      hasExtension(dir, '.sln') || hasExtension(dir, '.cs'))
    detected.add('csharp');

  if (hasFile(dir, 'vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs') || hasDep(pkg, 'vitest'))
    detected.add('vitest');

  if (hasFile(dir, 'jest.config.ts', 'jest.config.js', 'jest.config.mjs', 'jest.config.json') ||
      hasDep(pkg, 'jest'))
    detected.add('jest');

  if (hasFile(dir, 'playwright.config.ts', 'playwright.config.js') || hasDep(pkg, '@playwright/test'))
    detected.add('playwright');

  if (hasFile(dir, 'cypress.config.ts', 'cypress.config.js') || hasDep(pkg, 'cypress'))
    detected.add('cypress');

  return {
    techs:          Array.from(detected),
    packageManager: detectPackageManager(dir),
    scripts:        pkg?.scripts ?? {},
    tsconfig:       readTsconfig(dir),
    monorepo:       detectMonorepo(dir),
  };
}
