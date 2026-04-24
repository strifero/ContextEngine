// skills.ts: Skill and agent file content library
// Each entry is a self-contained SKILL.md following the Agent Skills open standard.
// https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview

export interface SkillFile {
  path: string;     // relative path inside .claude/
  content: string;
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export const SKILL_TYPESCRIPT: SkillFile = {
  path: 'skills/typescript/SKILL.md',
  content: `---
name: typescript
description: TypeScript patterns, type definitions, async conventions, and module structure. Use whenever writing, editing, or reviewing TypeScript code, defining types or interfaces, handling async logic, or structuring modules. Also trigger for strict mode errors, generics, or type inference questions.
---

# TypeScript Conventions

## Compiler Settings
- \`"strict": true\`. Non-negotiable.
- \`noUncheckedIndexedAccess: true\`. Always guard array/object access.
- \`exactOptionalPropertyTypes: true\`
- Target \`ES2022\` or later

## Type Definitions
- Prefer \`interface\` for object shapes; \`type\` for unions, intersections, and primitives
- Never use \`any\`: use \`unknown\` and narrow with type guards
- Avoid type assertions (\`as X\`) unless you control both sides
- Export types from a dedicated \`types.ts\` per module

## Async Patterns
- Always \`async/await\`: never raw \`.then()\` chains in application code
- Wrap external calls in try/catch; rethrow with context
- Use \`Promise.all()\` for independent parallel operations

## Error Handling
- API boundaries: return \`{ error: string }\` with the appropriate HTTP status
- Never swallow errors silently: always log at minimum

## Naming
- Files: \`kebab-case.ts\`
- Classes/Interfaces/Types: \`PascalCase\`
- Functions/variables: \`camelCase\`
- Constants: \`SCREAMING_SNAKE_CASE\`
- Booleans: prefix with \`is\`, \`has\`, \`can\`, \`should\`

## Imports
- Use path aliases (\`@/lib/...\`): no deep relative paths
- Group: external → internal → types → relative
`,
};

export const SKILL_NODEJS: SkillFile = {
  path: 'skills/nodejs/SKILL.md',
  content: `---
name: nodejs
description: Node.js runtime conventions, environment configuration, process management, and server bootstrap patterns. Use whenever writing server entry points, handling env vars, setting up process signals, or debugging Node.js runtime issues.
---

# Node.js Conventions

## Runtime
- Node.js 20+ LTS: use native \`fetch\`, \`crypto\`
- Always specify \`"engines": { "node": ">=20" }\` in package.json

## Environment Variables
- Validate all required env vars at startup: fail fast
\`\`\`typescript
const required = ['DATABASE_URL', 'API_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(\`Missing env var: \${key}\`);
}
\`\`\`
- Never read \`process.env\` deep in business logic: read at startup, pass down

## Process Management
- Handle \`SIGTERM\` and \`SIGINT\` for graceful shutdown
- Register \`process.on('unhandledRejection', ...)\` at startup: log + exit(1)

## Logging
- Structured JSON logging (pino or similar) in production
- Log level via \`LOG_LEVEL\` env var
- Always include: timestamp, level, message, module

## Package Conventions
- Commit \`package-lock.json\`
- Pin exact versions for infrastructure packages
- Scripts: always define \`start\`, \`build\`, \`dev\`, \`typecheck\`, \`lint\`
`,
};

export const SKILL_EXPRESS: SkillFile = {
  path: 'skills/express/SKILL.md',
  content: `---
name: express
description: Express.js route structure, middleware patterns, error handling, and API response conventions. Use whenever creating routes, middleware, request validation, or error handlers. Also trigger for REST API design, auth middleware, or CORS questions.
---

# Express.js Conventions

## Router Structure
- One router per domain (\`routes/users.ts\`, \`routes/orders.ts\`)
- Routers are thin: all logic lives in \`lib/\`
- Mount routers in \`app.ts\`, not \`server.ts\`

\`\`\`typescript
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await getItem(req.params.id);
    if (!item) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
\`\`\`

## Response Conventions
- Error: \`{ error: string }\`. Always the \`error\` key.
- 400: validation failure | 401: no auth | 403: forbidden
- 404: not found | 409: conflict | 500: server error

## Middleware Order
1. \`express.json()\`  2. CORS  3. Logging  4. Routes  5. 404 handler  6. Error handler
`,
};

export const SKILL_NEXTJS_APP: SkillFile = {
  path: 'skills/nextjs-app/SKILL.md',
  content: `---
name: nextjs-app
description: Next.js App Router conventions: Server Components, Client Components, API routes, data fetching, and project structure. Use whenever building or editing Next.js pages, layouts, API routes, or server actions. Also trigger for routing, metadata, or image optimization questions.
---

# Next.js App Router Conventions

## Structure
\`\`\`
app/
├── layout.tsx
├── page.tsx
├── (marketing)/
├── dashboard/
│   ├── layout.tsx
│   └── page.tsx
└── api/
    └── route.ts
\`\`\`

## Server vs Client Components
- Default: Server Component (no \`'use client'\`)
- Add \`'use client'\` only for: hooks, browser APIs, event listeners
- Keep Client Components as leaf nodes

## Data Fetching
\`\`\`typescript
export default async function Page() {
  const data = await fetchData();
  return <UI data={data} />;
}
\`\`\`

## API Routes
\`\`\`typescript
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  return NextResponse.json(await getData(id));
}
\`\`\`

## Environment Variables
- Server-only: \`SOME_KEY\`
- Client-exposed: \`NEXT_PUBLIC_SOME_KEY\`
`,
};

export const SKILL_NEXTJS_PAGES: SkillFile = {
  path: 'skills/nextjs-pages/SKILL.md',
  content: `---
name: nextjs-pages
description: Next.js Pages Router conventions: file-based routing under pages/, getServerSideProps, getStaticProps, API routes at pages/api, and _app / _document customization. Use whenever building or editing a Pages Router project, or the Pages half of a mixed App plus Pages codebase.
---

# Next.js Pages Router Conventions

## Structure
\`\`\`
pages/
├── _app.tsx
├── _document.tsx
├── index.tsx
├── about.tsx
├── dashboard/
│   └── index.tsx
└── api/
    └── users.ts
\`\`\`

## Data Fetching
- \`getServerSideProps\` for per-request data
- \`getStaticProps\` (with \`getStaticPaths\` for dynamic routes) for build-time data
- Client-side fetching only for user-specific or highly interactive data

\`\`\`typescript
export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const data = await fetchData(ctx.query.id as string);
  return { props: { data } };
}
\`\`\`

## API Routes
\`\`\`typescript
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  res.json({ ok: true });
}
\`\`\`

## Migration Notes
- New Next.js features (Server Actions, streaming, new metadata API) land on App Router first.
- Pages Router stays supported. Mixed projects are legal: Pages Router and App Router can coexist during migration.

## Environment Variables
- Server-only: \`SOME_KEY\`
- Client-exposed: \`NEXT_PUBLIC_SOME_KEY\`
`,
};

export const SKILL_REACT: SkillFile = {
  path: 'skills/react/SKILL.md',
  content: `---
name: react
description: React component patterns, hooks, state management, and accessibility conventions. Use whenever building React components, managing state, handling forms, writing custom hooks, or composing UI.
---

# React Conventions

## Component Structure
\`\`\`typescript
interface Props { id: string; onDone?: () => void; }

export function MyComponent({ id, onDone }: Props) {
  // 1. Hooks  2. Derived state  3. Handlers  4. Effects  5. Render
}
\`\`\`
- Named exports (except Next.js pages)

## State Management
- Local: \`useState\` / \`useReducer\`
- Server state: React Query / SWR. Never \`useEffect\` + \`fetch\`.
- Global: Zustand
- URL state: \`useSearchParams\`

## Performance
- \`memo()\` only after measuring
- Key prop: stable IDs, never array index

## Accessibility
- Keyboard navigable interactive elements
- Descriptive \`alt\` on all images
- \`<label>\` associated with every form field
- Semantic HTML: \`<button>\`, \`<nav>\`, \`<main>\`
`,
};

export const SKILL_VITE: SkillFile = {
  path: 'skills/vite/SKILL.md',
  content: `---
name: vite
description: Vite project conventions: config structure, environment variables, build optimization, and plugin setup.
---

# Vite Conventions

## Config
\`\`\`typescript
export default defineConfig({
  plugins: [],
  resolve: { alias: { '@': '/src' } },
  build: { target: 'es2022', sourcemap: false },
});
\`\`\`

## Environment Variables
- Prefix with \`VITE_\` to expose to client
- Access via \`import.meta.env.VITE_API_URL\`
- \`.env.local\` for local overrides: never commit

## Build
- Dynamic \`import()\` for route-level code splitting
- \`vite-bundle-visualizer\` to diagnose large bundles
`,
};

export const SKILL_VUE: SkillFile = {
  path: 'skills/vue/SKILL.md',
  content: `---
name: vue
description: Vue 3 Composition API patterns, component structure, reactivity, and routing.
---

# Vue 3 Conventions

## Always \`<script setup>\`
\`\`\`vue
<script setup lang="ts">
interface Props { id: string; }
const props = defineProps<Props>();
const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>
\`\`\`

## Composables
\`\`\`typescript
export function useUser(id: string) {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  return { user, isLoading };
}
\`\`\`

## State: Pinia (Composition API style only)
\`\`\`typescript
export const useCartStore = defineStore('cart', () => {
  const items = ref<Item[]>([]);
  function add(item: Item) { items.value.push(item); }
  return { items, add };
});
\`\`\`
`,
};

export const SKILL_TAILWIND: SkillFile = {
  path: 'skills/tailwind/SKILL.md',
  content: `---
name: tailwind
description: Tailwind CSS utility class patterns, responsive design, and component composition.
---

# Tailwind CSS Conventions

## Core
- Utility-first: compose in JSX, extract when reused 3+ times
- Use \`cn()\` (clsx + tailwind-merge) for conditional classes

## Responsive (mobile-first)
\`\`\`
className="flex flex-col md:flex-row gap-4"
\`\`\`

## Common Patterns
\`\`\`
Card:   rounded-xl border bg-card p-6 shadow-sm
Button: inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium
Input:  flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm
\`\`\`

## Colors
- Define brand colors in \`tailwind.config.ts\` under \`theme.extend.colors\`
- Semantic names: \`primary\`, \`secondary\`, \`destructive\`, \`muted\`
- Dark mode via \`class\` strategy
`,
};

export const SKILL_SWIFTUI: SkillFile = {
  path: 'skills/swiftui/SKILL.md',
  content: `---
name: swiftui
description: Swift and SwiftUI patterns: view composition, @Observable state, async/await, navigation, and iOS architecture.
---

# SwiftUI / Swift Conventions

## State: @Observable
\`\`\`swift
@Observable
final class ViewModel {
  var items: [Item] = []
  var isLoading = false

  func load() async {
    isLoading = true
    defer { isLoading = false }
    do { items = try await service.fetchAll() }
    catch { self.error = error.localizedDescription }
  }
}
\`\`\`

## Async
- \`.task { }\` for lifecycle-tied work
- \`@MainActor\` on UI-updating classes
- No \`DispatchQueue.main.async\`

## Quality Bar
- No force unwraps (\`!\`) in production
- Every async op has loading + error state
`,
};

export const SKILL_STRIPE: SkillFile = {
  path: 'skills/stripe/SKILL.md',
  content: `---
name: stripe
description: Stripe integration: payments, subscriptions, webhooks, and the customer portal.
---

# Stripe Conventions

## Webhook: Verify Signature Every Time
\`\`\`typescript
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    res.status(400).json({ error: 'Invalid signature' }); return;
  }
  switch (event.type) {
    case 'customer.subscription.updated': await handleUpdate(event.data.object); break;
    case 'invoice.payment_failed':        await handleFailed(event.data.object);  break;
  }
  res.json({ received: true });
});
\`\`\`

## Active Status
\`\`\`typescript
const isActive = ['active', 'trialing'].includes(subscription.status);
\`\`\`

## Testing
- Card: \`4242 4242 4242 4242\`
- Local webhooks: \`stripe listen --forward-to localhost:3000/webhooks/stripe\`
`,
};

export const SKILL_PRISMA: SkillFile = {
  path: 'skills/prisma/SKILL.md',
  content: `---
name: prisma
description: Prisma ORM patterns: schema design, migrations, typed queries, and connection pooling.
---

# Prisma Conventions

## Client Singleton
\`\`\`typescript
import { PrismaClient } from '@prisma/client';
const g = globalThis as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
\`\`\`

## Schema
\`\`\`prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
\`\`\`

## Migrations
\`\`\`bash
npx prisma migrate dev --name describe_change
npx prisma migrate deploy   # production
\`\`\`
`,
};

export const SKILL_POSTGRESQL: SkillFile = {
  path: 'skills/postgresql/SKILL.md',
  content: `---
name: postgresql
description: PostgreSQL patterns: schema design, indexes, parameterized queries, and connection pooling.
---

# PostgreSQL Conventions

## Always Parameterized
\`\`\`typescript
const { rows } = await pool.query<User>(
  'SELECT id, email FROM users WHERE id = $1 AND deleted_at IS NULL',
  [userId]
);
\`\`\`

## Schema
- Primary keys: \`gen_random_uuid()\`
- Always \`TIMESTAMPTZ\` not \`TIMESTAMP\`
- Soft deletes: \`deleted_at TIMESTAMPTZ\`

## Indexes
\`\`\`sql
CREATE INDEX CONCURRENTLY idx_orders_user ON orders(user_id);
CREATE INDEX CONCURRENTLY idx_active ON users(email) WHERE deleted_at IS NULL;
\`\`\`
`,
};

export const SKILL_MONGODB: SkillFile = {
  path: 'skills/mongodb/SKILL.md',
  content: `---
name: mongodb
description: MongoDB and Mongoose conventions: schema design, queries, indexes, and connection management.
---

# MongoDB / Mongoose Conventions

## Schema
\`\`\`typescript
const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
}, { timestamps: true });
\`\`\`

## Queries
\`\`\`typescript
const user = await User.findById(id).lean();
const users = await User.find({ active: true }).select('email name').lean();
\`\`\`

## Indexes
\`\`\`typescript
userSchema.index({ email: 1 });
userSchema.index({ userId: 1, createdAt: -1 });
\`\`\`
`,
};

export const SKILL_AZURE: SkillFile = {
  path: 'skills/azure/SKILL.md',
  content: `---
name: azure
description: Azure infrastructure conventions: Container Apps, Key Vault, Azure CLI, and deployment patterns.
---

# Azure Conventions

## Resource Naming
\`\`\`
Container App:  ca-<appname>-<env>
Cosmos:         cosmos-<appname>-<env>
Key Vault:      kv-<appname>-<env>
Container Reg:  cr<appname><env>
\`\`\`

## Container Apps
- Scale to zero (min 0) for cost efficiency
- Liveness probe on \`/health\`
- Secrets from Key Vault: never hardcode
- Start: \`0.5 vCPU / 1Gi\`

## Deploy
1. Build + push image to ACR
2. \`az containerapp update --image <new-image>\`
3. Verify \`/health\`
`,
};

export const SKILL_DOCKER: SkillFile = {
  path: 'skills/docker/SKILL.md',
  content: `---
name: docker
description: Docker and container conventions: multi-stage builds, health checks, and docker-compose patterns.
---

# Docker Conventions

## Multi-Stage Build
\`\`\`dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
\`\`\`

## Best Practices
- Pin base image tags: never \`latest\`
- Non-root user in production
- \`.dockerignore\` excludes \`node_modules\`, \`.env\`, \`.git\`
`,
};

export const SKILL_GO: SkillFile = {
  path: 'skills/go/SKILL.md',
  content: `---
name: go
description: Go conventions: project structure, error handling, HTTP handlers, and concurrency patterns.
---

# Go Conventions

## Error Handling
\`\`\`go
if err != nil {
    return fmt.Errorf("getUserByID %s: %w", id, err)
}
var ErrNotFound = errors.New("not found")
\`\`\`

## HTTP Handler
\`\`\`go
func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    user, err := h.svc.GetUser(r.Context(), id)
    if errors.Is(err, ErrNotFound) {
        http.Error(w, "not found", http.StatusNotFound); return
    }
    json.NewEncoder(w).Encode(user)
}
\`\`\`

## Concurrency
- \`context.Context\` for cancellation: always first parameter
- Channels for communication, mutexes for shared state
`,
};

export const SKILL_PYTHON: SkillFile = {
  path: 'skills/python/SKILL.md',
  content: `---
name: python
description: Python conventions: project structure, type hints, async patterns, and error handling.
---

# Python Conventions

## Type Hints: Always
\`\`\`python
def get_user(user_id: str) -> Optional[User]:
    ...
\`\`\`

## Async (FastAPI)
\`\`\`python
@app.get("/users/{user_id}")
async def get_user(user_id: str) -> User:
    user = await db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    return user
\`\`\`

## Tooling
- \`uv\` or \`pip\` with \`pyproject.toml\`
- \`ruff\` for linting and formatting
- \`mypy\` for type checking in CI
`,
};

export const SKILL_DJANGO: SkillFile = {
  path: 'skills/django/SKILL.md',
  content: `---
name: django
description: Django conventions: settings, models, migrations, and REST Framework patterns.
---

# Django Conventions

## Settings
- Split: \`settings/base.py\`, \`settings/dev.py\`, \`settings/prod.py\`
- Secrets via \`django-environ\`: never committed

## Models
\`\`\`python
class Article(models.Model):
    title      = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
\`\`\`

## Query Optimization
- \`select_related()\` for FK, \`prefetch_related()\` for M2M
- Django Debug Toolbar in dev to catch N+1
`,
};

export const SKILL_RUST: SkillFile = {
  path: 'skills/rust/SKILL.md',
  content: `---
name: rust
description: Rust conventions: error handling with Result/Option, async with Tokio, and project structure.
---

# Rust Conventions

## Error Handling
\`\`\`rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("not found: {0}")]
    NotFound(String),
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
}
\`\`\`
- Never \`unwrap()\` in production: use \`?\`

## Async: Tokio
\`\`\`rust
#[tokio::main]
async fn main() -> anyhow::Result<()> { ... }
\`\`\`

## Ownership
- Prefer borrowing (\`&T\`) over cloning
- \`Arc<T>\` for shared state across threads
`,
};

export const SKILL_BUN: SkillFile = {
  path: 'skills/bun/SKILL.md',
  content: `---
name: bun
description: Bun runtime conventions: server, file I/O, built-in test runner, and package management.
---

# Bun Conventions

## HTTP Server
\`\`\`typescript
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/health') return new Response('ok');
    return new Response('Not found', { status: 404 });
  },
});
\`\`\`

## File I/O
\`\`\`typescript
const text = await Bun.file('data.txt').text();
await Bun.write('output.txt', 'hello');
\`\`\`

## Tests
\`\`\`typescript
import { describe, it, expect } from 'bun:test';
describe('math', () => {
  it('adds', () => expect(1 + 1).toBe(2));
});
\`\`\`
- Auto-loads \`.env\`: no dotenv needed
`,
};

export const SKILL_PHP: SkillFile = {
  path: 'skills/php/SKILL.md',
  content: `---
name: php
description: PHP conventions: modern PHP patterns, Composer, and WordPress plugin development.
---

# PHP Conventions

## Modern PHP (8.1+)
- \`declare(strict_types=1);\` at top of every file
- Constructor promotion:
\`\`\`php
public function __construct(
    private readonly UserRepository $repo,
) {}
\`\`\`

## WordPress Plugins
- Prefix all functions, classes, hooks, option keys with plugin slug
- Never access superglobals directly: use \`sanitize_*()\`, \`esc_*()\`, \`wp_verify_nonce()\`
- Database writes via \`$wpdb->prepare()\`
- Enqueue scripts via \`wp_enqueue_scripts\` hook
`,
};

export const SKILL_CSHARP: SkillFile = {
  path: 'skills/csharp/SKILL.md',
  content: `---
name: csharp
description: C# and .NET conventions: async/await, LINQ, and .NET MAUI cross-platform development.
---

# C# / .NET Conventions

## Async/Await
- All I/O is async: never \`.Result\` or \`.Wait()\`
- \`CancellationToken\` as last parameter on every async method
\`\`\`csharp
public async Task<User?> GetUserAsync(string id, CancellationToken ct = default)
{
    return await _repo.FindByIdAsync(id, ct).ConfigureAwait(false);
}
\`\`\`

## .NET MAUI
- MVVM: \`[ObservableProperty]\` and \`[RelayCommand]\` source generators
- \`Shell\` for navigation
- DI in \`MauiProgram.cs\`: no static service locators
`,
};

// ---------------------------------------------------------------------------
// Frameworks added in phase 4 (review before release)
// ---------------------------------------------------------------------------

export const SKILL_ANGULAR: SkillFile = {
  path: 'skills/angular/SKILL.md',
  content: `---
name: angular
description: Angular conventions: standalone components, signals, dependency injection, RxJS patterns, routing, and the Angular CLI. Use when building or editing an Angular app, components, services, or route configs.
---

<!-- review before release -->

# Angular Conventions

## Structure
\`\`\`
src/
├── app/
│   ├── app.config.ts          (bootstrap config, providers, router)
│   ├── app.routes.ts
│   ├── app.component.ts
│   └── features/
│       └── <feature>/
│           ├── <feature>.component.ts
│           ├── <feature>.service.ts
│           └── <feature>.routes.ts
└── main.ts
\`\`\`

## Components
- Standalone components (\`standalone: true\` or the new default in 17+). Avoid NgModules in new code.
- Use OnPush change detection where data flow allows.
- Template files (\`*.component.html\`) for non-trivial markup; inline templates for small components.

## Signals and State
- Angular signals for reactive state: \`signal(...)\`, \`computed(...)\`, \`effect(...)\`.
- RxJS for streams and cross-cutting async (HTTP, forms). Don't mix signals and observables carelessly in one component.

## Services and DI
- \`@Injectable({ providedIn: 'root' })\` for singletons.
- Prefer constructor injection. Use \`inject()\` in functional contexts (guards, interceptors).

## Routing
- Lazy-load feature routes: \`loadComponent: () => import(...)\`.
- Functional guards and resolvers in v17+.

## Forms
- Reactive forms for anything non-trivial. Typed FormGroups via \`new FormGroup<...>({...})\`.

## Angular CLI
- \`ng serve\`, \`ng build\`, \`ng test\`, \`ng lint\`. Use \`ng generate\` for scaffolded artifacts so project structure stays conventional.
`,
};

export const SKILL_FLUTTER: SkillFile = {
  path: 'skills/flutter/SKILL.md',
  content: `---
name: flutter
description: Flutter conventions: widget structure, state management, routing, async patterns, and pub dependencies. Use when building or editing a Flutter app, widgets, or Dart packages.
---

<!-- review before release -->

# Flutter Conventions

## Structure
\`\`\`
lib/
├── main.dart               (runApp entry)
├── src/
│   ├── app.dart            (MaterialApp / Router)
│   ├── features/
│   │   └── <feature>/
│   │       ├── view.dart
│   │       ├── controller.dart
│   │       └── model.dart
│   └── common/             (shared widgets, theme, util)
test/
\`\`\`

## Widgets
- Split long \`build\` methods into smaller widgets rather than helper methods.
- Stateless where possible. Reach for StatefulWidget only when local state is genuinely needed.
- const constructors and const instances whenever inputs are compile-time constant.

## State Management
- Pick one approach per app (Provider, Riverpod, Bloc, signals) and stay consistent.
- Keep view code pure: side effects live in controllers, repositories, or services.

## Async and I/O
- \`Future\` + async/await for one-shot work; \`Stream\` for sequences.
- Use \`FutureBuilder\` / \`StreamBuilder\` sparingly; prefer explicit state management.

## Routing
- \`go_router\` or \`Navigator 2.0\` declarative routing for anything beyond trivial apps.
- Deep links and platform back-button handling come with declarative routers.

## Packages
- \`flutter pub get\` / \`flutter pub upgrade\` to manage dependencies.
- Use \`flutter pub outdated\` before major version bumps.

## Testing
- \`flutter test\` for unit and widget tests. \`flutter test integration_test/\` for full-app integration runs.
`,
};

export const SKILL_LARAVEL: SkillFile = {
  path: 'skills/laravel/SKILL.md',
  content: `---
name: laravel
description: Laravel conventions: routing, controllers, Eloquent ORM, migrations, Artisan commands, queued jobs, and validation. Use when building or editing a Laravel app, controllers, models, or migrations.
---

<!-- review before release -->

# Laravel Conventions

## Structure
\`\`\`
app/
├── Http/
│   ├── Controllers/
│   ├── Middleware/
│   └── Requests/           (Form Request classes for validation)
├── Models/                 (Eloquent)
├── Jobs/                   (queued work)
├── Services/               (business logic, when extracted)
└── Providers/
routes/
  ├── web.php
  └── api.php
database/
  ├── migrations/
  └── seeders/
config/
\`\`\`

## Routing and Controllers
- Routes in \`routes/web.php\` (sessions, CSRF) and \`routes/api.php\` (stateless).
- Resource controllers for CRUD: \`Route::resource('posts', PostController::class)\`.
- Validate requests with Form Request classes, not inline in the controller.

## Eloquent
- Models in \`app/Models/\`. Define relationships, casts, and scopes on the model.
- Avoid N+1: eager-load with \`with(['author'])\` when iterating collections.

## Migrations
- One change per migration. \`php artisan make:migration <name>\`.
- Run with \`php artisan migrate\`. Roll back with \`migrate:rollback\`.

## Artisan
- \`php artisan <command>\` is the task runner: migrations, make:*, tinker, queue:work.
- Custom commands live in \`app/Console/Commands/\` and self-register.

## Queues and Jobs
- Dispatch jobs with \`Job::dispatch(...)\`. Run workers with \`php artisan queue:work\`.
- Choose a queue driver (database, redis, sqs) via \`QUEUE_CONNECTION\` in \`.env\`.

## Testing
- Feature tests hit the HTTP layer; unit tests stay pure. Use \`RefreshDatabase\` for per-test isolation.
`,
};

export const SKILL_RAILS: SkillFile = {
  path: 'skills/rails/SKILL.md',
  content: `---
name: rails
description: Ruby on Rails conventions: MVC, ActiveRecord, strong params, background jobs via ActiveJob, and rake / rails CLI tasks. Use when building or editing a Rails app, controllers, models, or migrations.
---

<!-- review before release -->

# Rails Conventions

## Structure
\`\`\`
app/
├── controllers/            (one per resource)
├── models/                 (ActiveRecord)
├── views/                  (ERB / view templates)
├── helpers/
├── jobs/                   (ActiveJob)
├── mailers/                (ActionMailer)
└── services/               (POROs for business logic, if used)
config/
db/
  └── migrate/              (timestamped migrations)
lib/
spec/ or test/              (RSpec or Minitest)
\`\`\`

## Controllers
- Skinny controllers: delegate to models or services. Strong params at the top.
- RESTful actions (index, show, new, create, edit, update, destroy).
- Return appropriate status codes. Validate before side effects.

## Models
- ActiveRecord validations and associations at the top, scopes next, methods last.
- Callbacks sparingly; prefer explicit service calls for side effects.
- Use \`has_many :through\` for many-to-many relationships, not \`has_and_belongs_to_many\`.

## Migrations
- One change per migration. Run with \`bin/rails db:migrate\`.
- Reversible when possible; write \`up\` / \`down\` when not.

## Tasks and Console
- \`bin/rails <task>\` for rake tasks (\`db:migrate\`, \`assets:precompile\`, custom).
- \`bin/rails console\` for a REPL against the app's environment.

## Testing
- RSpec or Minitest. Keep fast unit tests for models and services; use system/request tests for end-to-end flows.
- Fixtures via factories (FactoryBot) rather than YAML for non-trivial setups.
`,
};

export const SKILL_FASTAPI: SkillFile = {
  path: 'skills/fastapi/SKILL.md',
  content: `---
name: fastapi
description: FastAPI conventions: path operations, Pydantic models, dependency injection, async I/O, routers, and ASGI deployment. Use when building or editing FastAPI services, endpoints, or schemas.
---

<!-- review before release -->

# FastAPI Conventions

## Structure
\`\`\`
app/
├── main.py                 (FastAPI() instance, router mounts)
├── api/
│   ├── routes/
│   │   └── users.py        (APIRouter per resource)
│   └── deps.py             (Depends() providers)
├── schemas/                (Pydantic models for request/response)
├── services/               (business logic)
└── db/                     (session, models)
\`\`\`

## Path Operations
- Decorators: \`@router.get("/users/{id}")\`, \`@router.post("/users")\`.
- Request body: typed Pydantic model as a function parameter.
- Return type annotated for auto-generated OpenAPI schema.

\`\`\`python
@router.post("/users", response_model=UserRead, status_code=201)
async def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    return await user_service.create(db, payload)
\`\`\`

## Dependency Injection
- \`Depends(...)\` for DB sessions, auth, request-scoped resources.
- Overridable in tests via \`app.dependency_overrides[fn] = stub\`.

## Validation
- Pydantic v2 for request/response shape. Constrain fields with \`Field(..., min_length=...)\`.
- Validation errors return 422 with the failing field path automatically.

## Async Patterns
- Prefer \`async def\` for endpoints and DB calls backed by async drivers.
- Never block the event loop: move CPU work to a thread pool via \`run_in_threadpool\`.

## Deployment
- ASGI server: uvicorn (\`uvicorn app.main:app --reload\` in dev, \`gunicorn -k uvicorn.workers.UvicornWorker\` in prod).
`,
};

export const SKILL_NESTJS: SkillFile = {
  path: 'skills/nestjs/SKILL.md',
  content: `---
name: nestjs
description: NestJS conventions: modules, controllers, providers, dependency injection, pipes, guards, and interceptors. Use when building or editing NestJS services, controllers, or feature modules.
---

<!-- review before release -->

# NestJS Conventions

## Structure
\`\`\`
src/
├── app.module.ts              (root module)
├── main.ts                    (bootstrap)
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── dto/
│   │   └── create-user.dto.ts
│   └── entities/
│       └── user.entity.ts
└── common/                    (shared filters, guards, decorators)
\`\`\`

## Modules
- One feature per module. Import it from \`AppModule\`.
- \`imports\` for other modules, \`providers\` for services, \`controllers\` for HTTP, \`exports\` for what the module publishes.

## Controllers
- Route decorators: \`@Controller('users')\`, \`@Get()\`, \`@Post()\`, etc.
- Validate request bodies with \`class-validator\` DTOs and a global \`ValidationPipe\`.

## Providers and DI
- Register with \`@Injectable()\`. Inject via constructor.
- Prefer interface tokens for swappable implementations.

## Cross-cutting Concerns
- \`@UseGuards()\` for auth, \`@UseInterceptors()\` for response shaping, \`@UsePipes()\` for transform/validation.
- Global versions via \`app.useGlobalPipes()\`, \`app.useGlobalGuards()\` in \`main.ts\`.

## Testing
- \`Test.createTestingModule({ ... })\` gives a sandboxed DI container.
- Mock providers with \`{ provide: Foo, useValue: ... }\` in \`providers\`.

## Env and Config
- \`@nestjs/config\` for typed config. Keep \`.env\` out of \`src/\`.
`,
};

export const SKILL_NUXT: SkillFile = {
  path: 'skills/nuxt/SKILL.md',
  content: `---
name: nuxt
description: Nuxt conventions: pages, components auto-import, server routes, composables, and Nitro runtime. Use when building or editing a Nuxt 3+ app, pages, API routes, or composables.
---

<!-- review before release -->

# Nuxt Conventions

## Structure
\`\`\`
├── pages/                  (file-based routes)
│   ├── index.vue
│   └── users/[id].vue
├── components/             (auto-imported)
├── composables/            (auto-imported, prefixed use*)
├── server/
│   ├── api/                (HTTP endpoints)
│   └── routes/             (non-API server routes)
├── layouts/
└── nuxt.config.ts
\`\`\`

## Data Fetching
- \`useFetch('/api/users')\` in components: isomorphic, dedupes on SSR.
- \`useAsyncData('key', () => $fetch(...))\` for custom data shapes.
- Avoid calling APIs in mounted lifecycle hooks; compose data on the server.

## Server Routes
- \`server/api/hello.ts\` exports a default handler: \`export default defineEventHandler((event) => ...)\`.
- Route params via \`getRouterParam(event, 'id')\`. Body via \`readBody(event)\`.

## Auto-imports
- Components from \`components/\` imported automatically.
- Composables (\`useX\`) auto-imported from \`composables/\`.
- Vue and Nuxt APIs are globally available; no explicit imports needed.

## Runtime Config
- Declare in \`nuxt.config.ts\` under \`runtimeConfig\`. Public keys under \`public\`.
- Access via \`useRuntimeConfig()\` on server, \`useRuntimeConfig().public\` on client.

## Modules
- Extend Nuxt via modules (\`@nuxt/image\`, \`@nuxtjs/tailwindcss\`, etc.). Configure in \`nuxt.config.ts\`.
`,
};

export const SKILL_REMIX: SkillFile = {
  path: 'skills/remix/SKILL.md',
  content: `---
name: remix
description: Remix conventions: nested routing, loaders, actions, resource routes, and progressive enhancement. Use when building or editing a Remix app, routes, or API endpoints.
---

<!-- review before release -->

# Remix Conventions

## Structure
\`\`\`
app/
├── root.tsx                    (outer layout)
├── routes/
│   ├── _index.tsx              (home route)
│   ├── about.tsx               (/about)
│   ├── users.$id.tsx           (/users/:id)
│   └── api.health.ts           (resource route)
└── entry.server.tsx
\`\`\`

## Loaders and Actions
- \`loader(args)\`: server-side data fetching. Returns JSON, a Response, or a redirect.
- \`action(args)\`: form handling. Non-GET submissions route here.
- Both run only on the server. Safe to read env, DB, secrets.

\`\`\`typescript
export async function loader({ params }: LoaderFunctionArgs) {
  const user = await db.user.find(params.id);
  if (!user) throw new Response('Not found', { status: 404 });
  return json({ user });
}
\`\`\`

## Form Progressive Enhancement
- Use \`<Form method="post">\` from @remix-run/react. Works without JS; upgrades when hydrated.
- Validation errors: return \`json({ errors }, { status: 400 })\` from action.

## Resource Routes
- Routes that export only loader/action (no component) become API endpoints.
- Return \`Response\` directly for non-JSON payloads.

## Nested Routing
- Parent routes render an \`<Outlet />\`; children compose into it.
- Each route's loader runs in parallel on navigation.

## Environment
- No public prefix. Everything read in server code (loaders/actions) stays server-side.
- Expose values to the client only via loader return.
`,
};

export const SKILL_SVELTEKIT: SkillFile = {
  path: 'skills/sveltekit/SKILL.md',
  content: `---
name: sveltekit
description: SvelteKit conventions: file-based routing, load functions, form actions, adapters, and runes. Use when building or editing a SvelteKit app, routes, or API endpoints.
---

<!-- review before release -->

# SvelteKit Conventions

## Structure
\`\`\`
src/
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   ├── +page.server.ts         (server-only load, actions)
│   ├── +page.ts                (universal load)
│   └── api/
│       └── +server.ts          (HTTP endpoint)
├── lib/                        (importable as $lib)
└── app.html
\`\`\`

## Load Functions
- \`+page.server.ts\` \`load()\` runs on the server only. Safe for secrets and DB access.
- \`+page.ts\` \`load()\` runs on both server (first request) and client (navigation).
- Return serializable data. Throw \`redirect()\` or \`error()\` from sveltekit for control flow.

## Form Actions
- \`+page.server.ts\` \`actions\` for progressively-enhanced forms.
- Use \`enhance\` in \`<form use:enhance>\` for the SPA-style upgrade.

## Endpoints
- \`+server.ts\` exports \`GET\`, \`POST\`, etc. Return \`Response\` or use \`json()\`.

## Runes (Svelte 5)
- \`$state\`, \`$derived\`, \`$effect\` replace stores for component state.
- Props: \`let { foo, bar } = $props()\`.

## Adapters
- Pick one in \`svelte.config.js\` (\`@sveltejs/adapter-auto\`, \`-node\`, \`-vercel\`, etc.).
- Adapter determines deployment target; match it to the host.

## Environment
- Public vars: \`PUBLIC_\`-prefixed, accessed via \`$env/static/public\` or \`$env/dynamic/public\`.
- Private vars: \`$env/static/private\` only inside server code.
`,
};

export const SKILL_ASTRO: SkillFile = {
  path: 'skills/astro/SKILL.md',
  content: `---
name: astro
description: Astro conventions: component structure, islands architecture, content collections, and server-first rendering. Use when building or editing Astro sites, pages, layouts, or content collections.
---

<!-- review before release -->

# Astro Conventions

## Structure
\`\`\`
src/
├── pages/
│   ├── index.astro
│   └── blog/[slug].astro
├── layouts/
│   └── BaseLayout.astro
├── components/
└── content/
    └── blog/
\`\`\`

## Components
- \`.astro\` files: frontmatter (\`---\`) at top for data, markup below.
- Framework components (React, Vue, Svelte) are islands: \`<Counter client:load />\`.
- Default rendering is server-side. Add \`client:*\` only to components that need hydration.

## Client Directives
- \`client:load\`: hydrate immediately
- \`client:idle\`: hydrate when the browser is idle
- \`client:visible\`: hydrate when scrolled into view
- \`client:media="(min-width: 768px)"\`: media-query gated
- \`client:only="react"\`: skip SSR entirely for that island

## Data
- \`Astro.props\` for component props.
- Content collections: define schemas in \`src/content/config.ts\`, load with \`getCollection()\`.
- \`fetch()\` and \`Astro.glob()\` in frontmatter run at build time by default.

## Routing
- File-based under \`src/pages/\`. \`[slug].astro\` for dynamic segments.
- API endpoints: \`src/pages/api/<name>.ts\` exporting HTTP method functions.

## Environment
- Public vars prefixed \`PUBLIC_\`: \`import.meta.env.PUBLIC_FOO\` in components.
- Private vars only available in server context (frontmatter, endpoints).
`,
};

// ---------------------------------------------------------------------------
// Testing frameworks (added phase 3.6, review before release)
// ---------------------------------------------------------------------------

export const SKILL_VITEST: SkillFile = {
  path: 'skills/vitest/SKILL.md',
  content: `---
name: vitest
description: Vitest test patterns, configuration, and assertions. Use when writing, running, or debugging unit or integration tests in a Vitest project.
---

<!-- review before release -->

# Vitest Conventions

## File Layout
- Co-locate \`<file>.test.ts\` or \`<file>.spec.ts\` next to the module under test.
- Pure test-only modules live in \`tests/\` or \`__tests__/\`.

## Running
- \`vitest\` for watch mode, \`vitest run\` for one shot (use this in CI).
- Filter by pattern: \`vitest run path/to/file\`.

## Assertions
- \`expect(...).toEqual(...)\` for deep equality, \`toBe\` for primitives and identity.
- \`expect.soft\` to collect multiple failures in one test before throwing.

## Mocking
- \`vi.mock('module-path', ...)\` at the top level of the test file.
- Fake timers: \`vi.useFakeTimers()\`, with a matching \`vi.useRealTimers()\` in an \`afterEach\`.

## TypeScript
- Vitest reuses the project's tsconfig. No separate config required.
`,
};

export const SKILL_JEST: SkillFile = {
  path: 'skills/jest/SKILL.md',
  content: `---
name: jest
description: Jest test patterns, configuration, and assertions. Use when writing, running, or debugging unit tests in a Jest project.
---

<!-- review before release -->

# Jest Conventions

## File Layout
- Co-locate tests: \`<file>.test.ts\` or \`<file>.spec.ts\`.
- Shared test utilities under \`__mocks__/\` or \`__tests__/__helpers__/\`.

## Running
- \`jest\` runs everything; pass a path or pattern to scope.
- Watch mode: \`jest --watch\`. Filter in the interactive menu.

## Assertions
- \`expect(x).toEqual(...)\` for deep equality, \`toBe\` for identity or primitives.
- Async: \`await expect(promise).resolves.toEqual(...)\`.

## Mocking
- \`jest.mock('module')\` hoists. Keep it at the top of the file.
- Reset between tests with \`afterEach(() => jest.resetAllMocks())\`, or set \`resetMocks: true\` in config.

## TypeScript
- ts-jest or @swc/jest for compilation. Make sure the config's transform covers \`.ts\`.
`,
};

export const SKILL_PLAYWRIGHT: SkillFile = {
  path: 'skills/playwright/SKILL.md',
  content: `---
name: playwright
description: Playwright end-to-end test patterns, fixtures, selectors, and reliability. Use when writing or debugging Playwright browser tests or investigating flaky behavior.
---

<!-- review before release -->

# Playwright Conventions

## Structure
- Tests under \`tests/\` (or \`e2e/\`). One flow per file.
- Shared setup via fixtures: \`test.extend({ authedPage: ... })\`.

## Selectors
- Role-based first: \`page.getByRole('button', { name: 'Save' })\`.
- \`getByTestId\` for elements without accessible labels.
- Avoid CSS selectors: they couple tests to markup rather than behavior.

## Waits
- Never \`page.waitForTimeout(ms)\`. Use \`expect(locator).toBeVisible()\` or explicit network waits.
- Playwright auto-waits for actionability. Trust it first; reach for explicit waits only while debugging.

## Reliability
- Reset state between tests: seed DB, mock API, or create a fresh user per test.
- \`trace: 'retain-on-failure'\` in \`playwright.config\` so failures are debuggable from CI artifacts.
`,
};

export const SKILL_CYPRESS: SkillFile = {
  path: 'skills/cypress/SKILL.md',
  content: `---
name: cypress
description: Cypress end-to-end test patterns, custom commands, and network stubbing. Use when writing or debugging Cypress tests or investigating flaky behavior.
---

<!-- review before release -->

# Cypress Conventions

## Structure
- Tests under \`cypress/e2e/\`. One feature per file.
- Support code: \`cypress/support/commands.ts\` (custom commands), \`cypress/support/e2e.ts\` (per-test hooks).

## Selectors
- \`data-cy\` attributes: \`cy.get('[data-cy=save]')\`.
- Avoid selectors tied to styling (\`.btn-primary\`) or generated class names.

## Waits
- Never \`cy.wait(<ms>)\`. Use \`cy.intercept\` with \`cy.wait('@alias')\` for network, or command retry for DOM.
- Cypress retries commands automatically until the assertion passes or the default timeout expires.

## Network
- Stub with \`cy.intercept('GET', '/api/users', { fixture: 'users.json' })\`.
- Baseline realistic network behavior first, override for edge cases per test.
`,
};

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export const AGENT_BACKEND: SkillFile = {
  path: 'agents/backend-engineer.md',
  content: `---
name: backend-engineer
description: Specialized agent for API development, database design, and server-side logic. Invoke for building REST endpoints, designing data models, writing business logic, or reviewing backend code.
---

# Backend Engineer Agent

You are a senior backend engineer. Focus on correctness, performance, and maintainability.

## Responsibilities
- Design and implement REST API endpoints
- Design data models and database schemas
- Write business logic in service/lib modules (not in route handlers)
- Handle authentication and authorization middleware
- Ensure all external calls have timeouts and error handling

## Quality Bar
- Every route handler has try/catch
- Every DB call is typed
- Auth checked before data access
- No secrets in code or logs
- Input validated before any DB operation
`,
};

export const AGENT_FRONTEND: SkillFile = {
  path: 'agents/frontend-engineer.md',
  content: `---
name: frontend-engineer
description: Specialized agent for UI development: React components, styling, and client-side state. Invoke for building screens, fixing UI bugs, implementing responsive layouts, or improving UX.
---

# Frontend Engineer Agent

You are a senior frontend engineer. Focus on user experience, accessibility, and performance.

## Quality Bar
- TypeScript props interface on every component
- Loading, error, empty states handled
- Responsive across breakpoints
- Keyboard navigable
`,
};

export const AGENT_IOS: SkillFile = {
  path: 'agents/ios-engineer.md',
  content: `---
name: ios-engineer
description: Specialized agent for SwiftUI and iOS development. Invoke for building iOS screens, implementing Swift concurrency, integrating APIs, or debugging Xcode issues.
---

# iOS Engineer Agent

You are a senior iOS engineer specializing in Swift and SwiftUI.

## Quality Bar
- Use @Observable: not ObservableObject/Combine
- Every async operation has loading and error state
- No force unwraps (\`!\`) in production code
`,
};

export const AGENT_REVIEWER: SkillFile = {
  path: 'agents/code-reviewer.md',
  content: `---
name: code-reviewer
description: Specialized agent for code review: correctness, security, performance, and maintainability. Invoke when reviewing a PR, auditing a module, or checking code before shipping.
---

# Code Reviewer Agent

You are a staff engineer doing a thorough code review.

## Review Checklist

### Correctness
- [ ] Edge cases handled (empty, null, zero, negative)
- [ ] Error paths covered, not just happy path

### Security
- [ ] No injection vulnerabilities
- [ ] No secrets in code or logs
- [ ] Input validated before use
- [ ] Auth checked before data access

### Performance
- [ ] No N+1 queries
- [ ] Pagination on list endpoints

## Output Format
Group by severity: **Critical** → **Major** → **Minor** → **Suggestion**
`,
};

export const AGENT_DEVOPS: SkillFile = {
  path: 'agents/devops-engineer.md',
  content: `---
name: devops-engineer
description: Specialized agent for infrastructure, deployment, CI/CD, and monitoring. Invoke for Docker, cloud provisioning, GitHub Actions workflows, or incident debugging.
---

# DevOps Engineer Agent

You are a senior DevOps engineer.

## Quality Bar
- Infrastructure as code: no click-ops in production
- Every service has \`/health\`
- Secrets in vault, not plain env vars
- CI: lint → test → build → deploy → health check
- Rollback plan before every deploy
`,
};
