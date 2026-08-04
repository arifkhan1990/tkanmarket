# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TkanMarket — a B2B fabric sourcing marketplace connecting Chinese textile suppliers with Russian/CIS buyers. Stack is **locked**: Next.js 16 (App Router), TypeScript strict, Tailwind + Shadcn/UI, TanStack Query v5, Drizzle ORM on Postgres 16, BullMQ + Redis 7, NextAuth v5, Zod, OpenAI. Never propose alternatives.

## Commands

```bash
npm run dev              # Next dev on :3000
npm run build            # Production build (Turbopack)
npm run build:webpack    # Build with webpack instead
npm run start            # Production server on :3000
npm run lint             # ESLint
npm run typecheck        # Strict tsc for the Next app (clears .next/types + tsbuildinfo first)
npm run typecheck:workers# Strict tsc for BullMQ workers (tsconfig.workers.json)
npm run typecheck:all    # Both of the above

# Database (Drizzle Kit, loads .env via node --env-file)
npm run db:generate      # Generate migration from schema
npm run db:migrate       # Apply migrations
npm run db:studio        # Drizzle Studio
npm run db:seed          # Compile workers tsconfig then run dist-workers/src/db/seed.js

# Workers (must build first)
npm run build:workers    # Compiles to dist-workers/ via tsconfig.workers.json
npm run worker:ai        # ai.worker
npm run worker:image     # image.worker
npm run worker:social    # social.worker
npm run worker:crawler   # crawler.worker
npm run worker:all       # All workers via dist-workers/src/workers/index.js
```

There is no test runner configured in this repo.

## Architecture

### Two TypeScript build graphs
- **App** (`tsconfig.json`): Next.js + React, `noEmit`, path alias `@/* → src/*`, `noUncheckedIndexedAccess` on.
- **Workers** (`tsconfig.workers.json`): CommonJS output to `dist-workers/`, only compiles `src/workers`, `src/services/workers`, `src/lib`, `src/db`, `src/types`, `src/constants`. Workers cannot import from `src/app` or React-only code — keep that boundary intact when adding files that workers need.

### Layered request flow
`API route (src/app/api/v1/**)` → `Service (src/services/*.service.ts)` → `Drizzle (src/db)`. SSR pages bypass HTTP and call Drizzle/services directly. Client components use TanStack Query.

- **API routes** only handle HTTP concerns: parse, Zod-validate, check session/role, call a service, shape the response. Response shape: `{ data: T }` on success, `{ error: string, details?: ZodError }` on failure. Status codes: 200/201/400/401/403/404/500.
- **Services** own all business logic. They are the only place that should construct DB queries beyond trivial reads. There is one service per feature; admin services are prefixed `admin-*.service.ts`.
- **Workers** (`src/workers/*.worker.ts`) only call services — never write Drizzle queries directly. They consume BullMQ queues backed by Redis (`src/lib/queue`, `src/lib/redis`).

### Database conventions (hard rules — see `.cursorrules`)
- PKs are always `integer('id').generatedAlwaysAsIdentity().primaryKey()`. **Never UUID.**
- Every table has `created_at` and `updated_at` (timestamptz, default `now()`).
- User-facing tables have `deleted_at timestamptz` and use **soft delete**. Never hard-delete catalog records, leads, or suppliers.
- Every FK column has an index. Default to `ON DELETE RESTRICT`; use `CASCADE` only when the child has no meaning without the parent.
- One schema file per domain in `src/db/schema/*.schema.ts`, re-exported from `src/db/schema/index.ts` (which is also the `drizzle.config.ts` schema entry). Migrations live in `src/db/migrations/`.
- No raw SQL — always Drizzle ORM.

### Folder layout that matters
```
src/
  app/
    (public)/        public marketplace pages
    (admin)/         admin dashboard pages (protected)
    (conversion)/    conversion-funnel pages
    api/v1/          all API routes (admin/, auth/, fabrics/, leads/, public/, suppliers/, wishlist/)
  components/{ui,shared,public,admin}/
  db/{schema,migrations}/
  services/          business logic; admin-prefixed for admin domains
  workers/           BullMQ workers (ai/image/social/crawler) + index.ts entrypoint
  lib/               logger, queue, redis, rbac, validations, http, openai, etc.
  auth/              NextAuth v5 setup (auth.ts, auth-options.ts)
```

### Stitch prototypes
The `stitch/` directory contains 130+ HTML UI prototypes that drive the backend roadmap. `STITCH-FEATURE-REGISTRY.md` maps each prototype to its planned domain and DB entities, `STITCH-ROLL-OUT-ORDER.md` is the incremental rollout order, and `DB-GAP-ANALYSIS-STITCH.md` tracks which schemas already exist vs. still need to be added. When implementing a stitch module, follow that mapping rather than inventing new tables.

## Code rules (from `.cursorrules` — enforce, don't relitigate)

- TypeScript strict; **no `any`** — use `unknown` and narrow.
- **No `console.log`** — use the logger from `@/lib/logger`.
- All async functions must have try/catch.
- All API routes Zod-validate the body **before** any DB call. Admin routes also check session role.
- Never use Pages Router. Mark `'use client'` only when necessary.
- Use `next/image` (never `<img>`) and `next/link` for internal navigation (never `<a>`).
- Use native `fetch`, never axios. Don't install new packages without being asked.
- Never change the folder structure described above.

## Naming
- Files: **kebab-case** (`fabric-card.tsx`, `fabric.service.ts`)
- Components / Types / Interfaces: **PascalCase**
- Functions / variables: **camelCase**
- DB columns: **snake_case**
- Enum values: **SCREAMING_SNAKE_CASE** (e.g. `'CLOSED_WON'`, `'RAW_SCRAPED'`)

## Existing core schemas (reference, don't recreate)
`users`, `suppliers`, `fabrics`, `fabric_categories`, `fabric_activity_log`, `leads`, `lead_notes`, `lead_activity_log`, `social_posts`, `crawler_runs`, `raw_products`, `admin_settings`, plus already-added foundations: `roles`/`permissions`/`role_permissions`/`user_roles` (RBAC), `audit_log`, `auth_security_events`, `notifications`/`notification_settings`, `api_keys`. Key enums: `user_role`, `fabric_status`, `fabric_type`, `lead_status`, `lead_source`, `social_platform`, `social_post_status`, `social_content_type`, `crawler_job_status`.
# TkanMarket – Claude Code Project Memory

## Project Overview
B2B fabric marketplace connecting Chinese textile suppliers with Russian/CIS buyers.
Stack: Next.js 16 (App Router), TypeScript 5 strict, Tailwind CSS, Shadcn/UI, TanStack Query 5,
Drizzle ORM, PostgreSQL 16, BullMQ, Redis 7, Playwright, OpenAI API.

## ⚠️ ABSOLUTE RULES – NEVER VIOLATE

### 1. Database Primary Keys
- EVERY table uses: `id: integer('id').generatedAlwaysAsIdentity().primaryKey()`
- NEVER use UUID as primary key
- NEVER use BIGSERIAL unless table will exceed 2 billion rows
- ALL foreign keys end with `_id` suffix

### 2. TypeScript
- Always strict mode – no implicit `any`, no non-null assertions without comment
- All function parameters and return types explicitly typed
- No `any` type – use `unknown` and narrow it

### 3. Every Table Must Have
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at TIMESTAMPTZ DEFAULT NULL  -- soft delete, never hard delete
```

### 4. API Routes
- Business logic NEVER goes in route handlers – always call a service
- All inputs validated with Zod before processing
- Always return typed responses via `apiSuccess()` / `apiError()` helpers
- Admin routes always call `requireAdminAuth()` guard

### 5. No Magic Strings
- Status values come from enums in `/src/types/enums.ts`
- Queue names come from `/src/constants/index.ts`
- Never inline strings like `status === 'approved'`

---

## Project Structure
```
/src
  /app
    /(public)          ← Public marketplace (SSR/ISR)
    /(admin)           ← Admin dashboard (auth-protected)
    /api/v1            ← API routes
  /components
    /ui                ← Shadcn/UI primitives (never edit)
    /common            ← Shared: Header, Footer, Breadcrumb
    /marketplace       ← Public-facing components
    /admin             ← Admin-only components
    /forms             ← All form components
  /lib
    /db                ← Drizzle connection
    /queue             ← BullMQ queue definitions
    /redis             ← Redis client singleton
    /openai            ← OpenAI client + prompts
    /auth              ← NextAuth config + guards
    /validations       ← Zod schemas (one file per domain)
    /utils             ← Pure utility functions
    /errors            ← Custom error classes
  /services            ← ALL business logic lives here
  /workers             ← Background job processors
  /db
    /schema            ← Drizzle schema (one file per domain)
    /migrations        ← Auto-generated by drizzle-kit
  /types               ← TypeScript types + enums
  /constants           ← App-wide constants
  /hooks               ← Custom React hooks
```

---

## Drizzle Schema Pattern (use this exact pattern)
```typescript
import { pgTable, integer, text, timestamptz, pgEnum } from 'drizzle-orm/pg-core'

export const myTable = pgTable('my_table', {
  id:        integer('id').generatedAlwaysAsIdentity().primaryKey(),
  parentId:  integer('parent_id').notNull().references(() => parentTable.id, { onDelete: 'restrict' }),
  name:      text('name').notNull(),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  deletedAt: timestamptz('deleted_at'),
})
```

---

## API Response Pattern (always use these helpers)
```typescript
// src/lib/utils/api-response.ts
return apiSuccess(data)           // 200
return apiSuccess(data, meta)     // 200 with pagination
return apiError('NOT_FOUND', 'Fabric not found', 404)

```

---

## Service Layer Pattern
```typescript
// Services are the ONLY place for business logic
// Services call DB via Drizzle – never raw SQL for simple CRUD
// Services return typed DTOs, never raw DB rows
export class FabricService {
  static async list(params: FabricListParams): Promise<PaginatedResult<FabricSummary>> {
    // implementation
  }
}
```

---

## Component Rules
- Server components by default (no 'use client')
- Add 'use client' only when needed (hooks, event handlers, browser APIs)
- Named exports everywhere EXCEPT page.tsx files
- Props always have explicit TypeScript interfaces
- Event handlers prefixed with `handle`: handleSubmit, handleClick

---

## Styling Rules
- Tailwind CSS ONLY – no CSS modules, no inline style except dynamic values
- Mobile-first: base styles first, then `md:` and `lg:` breakpoints
- Shadcn/UI for all primitives (Button, Input, Dialog, etc.)

---

## Performance Rules
- Public pages: SSR or ISR (revalidate: 3600)
- Images: ALWAYS next/image with explicit width + height
- NO N+1 queries – use JOINs or batch fetching
- TanStack Query staleTime: 5min for catalog, 30s for admin

---

## Security Rules
- Admin routes: always `requireAdminAuth()` guard
- Public lead form: rate limited (5 req/hour/IP via Redis)
- Secrets: only in `.env.local`, never committed
- Never log emails, phones, passwords, API keys

---

## Current Progress Tracker
Update this section after each session:

- [ ] Phase 1: Project bootstrap + folder structure
- [ ] Phase 2: Database schema (all tables)
- [ ] Phase 3: API utilities + constants + error classes
- [ ] Phase 4: Fabric service + public API routes
- [ ] Phase 5: Lead service + Lead API
- [ ] Phase 6: Auth (NextAuth) + middleware
- [ ] Phase 7: Public layout (Header, Footer, shared components)
- [ ] Phase 8: Homepage
- [ ] Phase 9: Fabric catalog page
- [ ] Phase 10: Fabric detail page
- [ ] Phase 11: Admin layout + sidebar
- [ ] Phase 12: Admin dashboard
- [ ] Phase 13: Admin fabric management
- [ ] Phase 14: Admin Lead CRM
- [ ] Phase 15: Queue infrastructure
- [ ] Phase 16: AI processing worker
- [ ] Phase 17: Crawler worker
- [ ] Phase 18: Social media worker
- [ ] Phase 19: SEO + sitemap
- [ ] Phase 20: Error handling + production config

---

## Compact Instructions
When using /compact, focus on:
- Code changes made in this session
- Current errors or blockers
- Which phase was completed
- Any important decisions made about architecture