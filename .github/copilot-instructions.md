# Copilot Instructions for jrs-retro

## Architecture Overview

**TanStack Start** full-stack React 19 app with SSR, file-based routing, and Nitro server runtime.

| Layer | Technology | Key File(s) |
|-------|------------|-------------|
| Routing | TanStack Router (file-based) | `src/routes/`, `src/routeTree.gen.ts` (generated) |
| Data Fetching | Route loaders + Server Functions | `loader` in routes, `createServerFn` |
| Server State | TanStack Query (mutations) | `src/integrations/tanstack-query/` |
| Client State | TanStack Store | `src/lib/demo-store.ts` |
| Database | Drizzle ORM + SQLite | `src/db/` (schema + client) |
| Auth | Better Auth (email/password) | `src/lib/auth.ts`, `src/lib/auth-client.ts` |
| Server Runtime | Nitro | Configured in `vite.config.ts` |
| Compiler | React Compiler | `babel-plugin-react-compiler` in Vite |

## Commands

```bash
pnpm dev          # Dev server on port 3000
pnpm build        # Production build
pnpm test         # Vitest tests
pnpm check        # Biome lint + format
npx drizzle-kit push   # Push schema changes to SQLite
npx drizzle-kit generate  # Generate migrations
npx @better-auth/cli generate  # Generate Better Auth schema for Drizzle
```

## Data Flow Patterns

### 1. Route Loaders (Reading Data)
Use `loader` for fetching data — runs on server, cached with SWR:
```tsx
export const Route = createFileRoute('/posts')({
  loader: async () => await getPosts(),  // Server function
  component: PostsPage,
})

function PostsPage() {
  const posts = Route.useLoaderData()
  return <PostList posts={posts} />
}
```

### 2. Server Functions (All API/DB Interactions)
Use `createServerFn` for **all** server-side logic (DB queries, mutations):
```tsx
// Reading data
const getPosts = createServerFn({ method: 'GET' })
  .handler(async () => {
    return db.select().from(posts)
  })

// Writing data (with validation)
const createPost = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ title: z.string(), content: z.string() }))
  .handler(async ({ data }) => {
    return db.insert(posts).values(data).returning()
  })
```

### 3. TanStack Query (Mutations Only)
Use Query's `useMutation` for client-side mutation state management:
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreatePostForm() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data) => createPost({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  })
  // ...
}
```

### 4. TanStack Store (Client State)
Use for ephemeral UI state that doesn't need server persistence:
```tsx
import { Store, Derived } from '@tanstack/store'
export const uiStore = new Store({ sidebarOpen: false })
```

## Database (Drizzle + SQLite)

### Schema Definition
```tsx
// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
```

### Database Client
```tsx
// src/db/index.ts
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

export const db = drizzle({
  connection: { url: process.env.DATABASE_URL || 'file:local.db' },
  schema,
})
```

## Authentication (Better Auth)

### Core Tables Required
Better Auth requires these tables (generate with `npx @better-auth/cli generate`):
- `user` — id, name, email, emailVerified, image, createdAt, updatedAt
- `session` — id, userId, token, expiresAt, ipAddress, userAgent, createdAt, updatedAt
- `account` — id, userId, accountId, providerId, accessToken, refreshToken, password, etc.
- `verification` — id, identifier, value, expiresAt, createdAt, updatedAt

### Server Config
```tsx
// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
})
```

### Client Usage
```tsx
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'
export const authClient = createAuthClient()

// In components
const { data: session, isPending } = authClient.useSession()
await authClient.signIn.email({ email, password })
await authClient.signUp.email({ email, password, name })
await authClient.signOut()
```

### API Route
```tsx
// src/routes/api/auth/$.ts
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
})
```

## Conventions

| Area | Convention |
|------|------------|
| Imports | Use `@/` alias for `src/` (e.g., `import { db } from '@/db'`) |
| Formatting | Biome: **tabs**, **double quotes** |
| Styling | Tailwind CSS v4, Shadcn UI (new-york style, no RSC) |
| Components | Add via `pnpm dlx shadcn@latest add <component>` |
| Env vars | Server: no prefix; Client: `VITE_` prefix (see `src/env.ts`) |
| Validation | Use Zod for server function input validation |

## File Organization

```
src/
├── components/           # Shared React components
├── db/                   # Drizzle schema and client
│   ├── index.ts          # Database client export
│   └── schema.ts         # Table definitions
├── integrations/         # Third-party wrappers (auth UI, query provider)
├── lib/                  # Utils, stores, auth config
│   ├── auth.ts           # Better Auth server config
│   └── auth-client.ts    # Better Auth client hooks
├── routes/               # File-based routes (auto-generates routeTree.gen.ts)
│   ├── api/              # API endpoints
│   └── demo/             # Reference implementations
└── styles.css            # Tailwind entry point
```

## Integration Points

- **Router + Query SSR:** `setupRouterSsrQueryIntegration` in `src/router.tsx`
- **DevTools:** Unified panel configured in `src/routes/__root.tsx`
- **Query Client:** Created in `src/integrations/tanstack-query/root-provider.tsx`, passed via router context
