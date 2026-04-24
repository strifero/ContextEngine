// detect.ts: Scan a project directory and identify its tech stack

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve as resolvePath } from 'node:path';
import { createRequire } from 'node:module';

export type DetectedTech =
  | 'typescript' | 'nodejs' | 'express'
  | 'nextjs-app' | 'nextjs-pages'
  | 'react'
  | 'vite' | 'vue' | 'tailwind' | 'swiftui' | 'stripe'
  | 'prisma' | 'postgresql' | 'mongodb' | 'azure' | 'docker'
  | 'go' | 'python' | 'django' | 'rust' | 'bun' | 'php' | 'csharp'
  | 'vitest' | 'jest' | 'playwright' | 'cypress'
  | 'eslint' | 'eslint-flat' | 'biome' | 'prettier'
  | 'astro' | 'sveltekit' | 'remix' | 'nuxt' | 'nestjs' | 'fastapi'
  | 'rails' | 'laravel' | 'flutter' | 'angular';

// Widened in phase 4 to cover non-Node ecosystems. The prefix logic in
// generate.ts only produces script prefixes for the Node-family tools
// (npm/pnpm/yarn/bun); non-Node values are informational.
export type PackageManager =
  | 'npm' | 'pnpm' | 'yarn' | 'bun'
  | 'bundler' | 'composer' | 'pub'
  | 'unknown';

export type PythonTool = 'poetry' | 'uv' | 'pip' | null;

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
  pythonTool:     PythonTool;
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

function hasDepWithPrefix(pkg: PackageJson | null, prefix: string): boolean {
  if (!pkg) return false;
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  return Object.keys(all).some(k => k.startsWith(prefix));
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
  if (hasFile(dir, 'Gemfile.lock', 'Gemfile'))        return 'bundler';
  if (hasFile(dir, 'composer.lock', 'composer.json')) return 'composer';
  if (hasFile(dir, 'pubspec.lock', 'pubspec.yaml'))   return 'pub';
  return 'unknown';
}

// Strip // line and /* */ block comments so tsconfig (JSON-with-comments) parses.
// Not string-aware, but tsconfig values rarely contain // or /* literally.
function stripJsonComments(raw: string): string {
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function fileContainsCI(path: string, needle: string): boolean {
  if (!existsSync(path)) return false;
  try { return readFileSync(path, 'utf-8').toLowerCase().includes(needle.toLowerCase()); }
  catch { return false; }
}

function detectPythonTool(dir: string): PythonTool {
  const pyproject = join(dir, 'pyproject.toml');
  if (hasFile(dir, 'poetry.lock') || fileContainsCI(pyproject, '[tool.poetry]')) return 'poetry';
  if (hasFile(dir, 'uv.lock')      || fileContainsCI(pyproject, '[tool.uv]'))     return 'uv';
  if (hasFile(dir, 'requirements.txt') || existsSync(pyproject))                  return 'pip';
  return null;
}

function detectMonorepo(dir: string): Monorepo {
  if (hasFile(dir, 'turbo.json'))           return 'turbo';
  if (hasFile(dir, 'nx.json'))              return 'nx';
  if (hasFile(dir, 'pnpm-workspace.yaml'))  return 'pnpm-workspaces';
  if (hasFile(dir, 'lerna.json'))           return 'lerna';
  if (hasFile(dir, 'rush.json'))            return 'rush';
  return null;
}

interface TsconfigShape {
  extends?:        string | string[];
  compilerOptions?: Record<string, unknown>;
}

// Resolve a tsconfig `extends` value to an absolute path on disk.
// Supports two forms:
//   - relative ("./base.json", "../tsconfig.base"): resolved against fromTsconfig dir
//   - bare specifier ("next/tsconfig.json", "@tsconfig/node20"): resolved via
//     createRequire against node_modules. If no .json extension is given,
//     /tsconfig.json is appended (matches tsc behavior).
// Returns null if resolution fails for any reason (missing module, invalid path, etc.).
function resolveExtends(extendsValue: string, fromTsconfig: string): string | null {
  const fromDir = dirname(fromTsconfig);

  if (extendsValue.startsWith('./') || extendsValue.startsWith('../')) {
    let candidate = resolvePath(fromDir, extendsValue);
    if (!candidate.endsWith('.json')) candidate = candidate + '.json';
    return existsSync(candidate) ? candidate : null;
  }

  try {
    const req = createRequire(fromTsconfig);
    const target = extendsValue.endsWith('.json') ? extendsValue : extendsValue + '/tsconfig.json';
    const resolved = req.resolve(target);
    return existsSync(resolved) ? resolved : null;
  } catch {
    return null;
  }
}

// Walk an `extends` chain and compute the effective tsconfig flags.
// Parent values form the base; each `extends` layer overrides, and the
// current file's compilerOptions overrides last (per tsc merge semantics).
function readTsconfigFlags(tsconfigPath: string, seen: Set<string>, depth: number): TsconfigFlags | null {
  if (depth > 10) return null;          // circular / pathological chain guard
  if (seen.has(tsconfigPath)) return null;
  seen.add(tsconfigPath);
  if (!existsSync(tsconfigPath)) return null;

  let parsed: TsconfigShape;
  try {
    parsed = JSON.parse(stripJsonComments(readFileSync(tsconfigPath, 'utf-8'))) as TsconfigShape;
  } catch {
    return null;
  }

  let flags: TsconfigFlags = { strict: false, noUncheckedIndexedAccess: false };

  const extendsList = parsed.extends
    ? (Array.isArray(parsed.extends) ? parsed.extends : [parsed.extends])
    : [];

  for (const ext of extendsList) {
    const parentPath = resolveExtends(ext, tsconfigPath);
    if (!parentPath) continue;
    const parentFlags = readTsconfigFlags(parentPath, seen, depth + 1);
    if (parentFlags) flags = { ...flags, ...parentFlags };
  }

  const co = parsed.compilerOptions ?? {};
  if (co.strict === true || co.strict === false) flags.strict = co.strict;
  if (co.noUncheckedIndexedAccess === true || co.noUncheckedIndexedAccess === false) {
    flags.noUncheckedIndexedAccess = co.noUncheckedIndexedAccess;
  }

  return flags;
}

function readTsconfig(dir: string): TsconfigFlags | null {
  const path = join(dir, 'tsconfig.json');
  if (!existsSync(path)) return null;
  return readTsconfigFlags(path, new Set(), 0);
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

  if (hasFile(dir, 'astro.config.js', 'astro.config.mjs', 'astro.config.ts') || hasDep(pkg, 'astro'))
    detected.add('astro');

  if (hasDep(pkg, '@sveltejs/kit'))
    detected.add('sveltekit');

  if (hasDepWithPrefix(pkg, '@remix-run/'))
    detected.add('remix');

  if (hasFile(dir, 'nuxt.config.ts', 'nuxt.config.js', 'nuxt.config.mjs') || hasDep(pkg, 'nuxt'))
    detected.add('nuxt');

  if (hasFile(dir, 'nest-cli.json') || hasDep(pkg, '@nestjs/core'))
    detected.add('nestjs');

  if (fileContainsCI(join(dir, 'requirements.txt'), 'fastapi') ||
      fileContainsCI(join(dir, 'pyproject.toml'),    'fastapi'))
    detected.add('fastapi');

  if (fileContainsCI(join(dir, 'Gemfile'), 'rails') || existsSync(join(dir, 'config', 'application.rb')))
    detected.add('rails');

  if (fileContainsCI(join(dir, 'composer.json'), 'laravel/framework') || existsSync(join(dir, 'artisan')))
    detected.add('laravel');

  if (fileContainsCI(join(dir, 'pubspec.yaml'), 'flutter'))
    detected.add('flutter');

  if (hasFile(dir, 'angular.json') || hasDep(pkg, '@angular/core'))
    detected.add('angular');

  // Linters and formatters. eslint-flat wins over eslint if both are present.
  if (hasFile(dir, 'eslint.config.js', 'eslint.config.mjs', 'eslint.config.ts', 'eslint.config.cjs')) {
    detected.add('eslint-flat');
  } else if (hasFile(dir, '.eslintrc', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yaml', '.eslintrc.yml')) {
    detected.add('eslint');
  }

  if (hasFile(dir, 'biome.json', 'biome.jsonc') || hasDep(pkg, '@biomejs/biome'))
    detected.add('biome');

  if (hasFile(dir, '.prettierrc', '.prettierrc.json', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.yaml', '.prettierrc.yml', 'prettier.config.js', 'prettier.config.cjs') ||
      hasDep(pkg, 'prettier'))
    detected.add('prettier');

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
    pythonTool:     detectPythonTool(dir),
  };
}
