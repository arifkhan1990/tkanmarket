# TkanMarket – Cursor AI Rules
# .cursorrules

## ============================================================
## PROJECT IDENTITY
## ============================================================
This is TkanMarket – a B2B fabric discovery and sourcing marketplace.
Stack: Next.js 16 (App Router), TypeScript 5 (strict), Tailwind CSS, Shadcn/UI,
TanStack Query 5, Drizzle ORM, PostgreSQL 16, BullMQ, Redis 7, Playwright, OpenAI API.

## ============================================================
## CORE PRINCIPLES (NEVER VIOLATE)
## ============================================================

### Database: Integer Primary Keys
- ALL tables use INTEGER with GENERATED ALWAYS AS IDENTITY as the primary key.
- NEVER use UUID as a primary key. NEVER use BIGSERIAL unless explicitly instructed.
- Foreign keys ALWAYS reference the integer PK of the parent table.
- Every table has: created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() and updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW().
- Every user-facing table has: deleted_at TIMESTAMPTZ DEFAULT NULL (soft delete pattern).

### TypeScript: Strict Mode Always
- All code must compile with TypeScript strict mode (no implicit any, no non-null assertions without comment).
- All function parameters and return types must be explicitly typed.
- Use `type` for union/intersection types, `interface` for object shapes.
- No `any`. If you truly must, use `unknown` and narrow it.

### No Magic Numbers / Strings
- All constants go in /src/constants/ with descriptive names.
- All enums go in /src/types/enums.ts.
- Never inline status strings like "approved" – use the LeadStatus or FabricStatus enum.

## ============================================================
## FILE & FOLDER STRUCTURE RULES
## ============================================================

```
/src
  /app                        ← Next.js App Router pages
    /(public)                 ← Public marketplace routes
      /page.tsx               ← Homepage
      /fabrics/page.tsx       ← Catalog listing
      /fabrics/[slug]/page.tsx← Fabric detail
      /suppliers/[slug]/page.tsx
      /contact/page.tsx
    /(admin)                  ← Admin dashboard routes (auth-protected)
      /layout.tsx             ← Admin layout with sidebar
      /dashboard/page.tsx
      /fabrics/page.tsx
      /fabrics/[id]/page.tsx
      /leads/page.tsx
      /leads/[id]/page.tsx
      /social/page.tsx
      /suppliers/page.tsx
      /crawler/page.tsx
    /api                      ← Next.js API routes
      /v1/fabrics/route.ts
      /v1/fabrics/[id]/route.ts
      /v1/leads/route.ts
      /v1/admin/...
  /components
    /ui                       ← Shadcn/UI primitives (do not edit)
    /common                   ← Shared app components (header, footer, breadcrumb)
    /marketplace              ← Marketplace-specific components
    /admin                    ← Admin-specific components
    /forms                    ← All form components
  /lib
    /db                       ← Database connection + Drizzle instance
    /queue                    ← BullMQ queue definitions
    /redis                    ← Redis client
    /openai                   ← OpenAI client + prompt templates
    /storage                  ← CDN/image upload utilities
    /auth                     ← NextAuth.js config
    /validations              ← Zod schemas (one file per domain)
    /utils                    ← Pure utility functions
  /services
    /fabric.service.ts
    /supplier.service.ts
    /lead.service.ts
    /ai.service.ts
    /crawler.service.ts
    /social.service.ts
    /image.service.ts
  /workers
    /crawler.worker.ts
    /ai.worker.ts
    /image.worker.ts
    /social.worker.ts
  /types
    /enums.ts
    /index.ts                 ← barrel exports
    /api.types.ts
    /db.types.ts
  /constants
    /index.ts
  /hooks                      ← Custom React hooks
  /db
    /schema                   ← Drizzle schema files (one file per domain)
      /fabrics.schema.ts
      /suppliers.schema.ts
      /leads.schema.ts
      /social.schema.ts
      /users.schema.ts
      /crawler.schema.ts
    /migrations               ← Drizzle migration files (auto-generated)
    /seed.ts                  ← Database seed script
```

## ============================================================
## COMPONENT RULES
## ============================================================

### Naming
- Page components: PascalCase, named exactly like the file: FabricsPage, FabricDetailPage
- UI components: PascalCase: FabricCard, FilterSidebar, LeadStatusBadge
- Hooks: camelCase prefixed with `use`: useFabrics, useLeadForm
- Server components: default (no 'use client')
- Client components: top of file must have `'use client'`

### Component Structure (follow this order)
```typescript
'use client' // if client component

// 1. External imports
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal imports
import { FabricCard } from '@/components/marketplace/FabricCard'
import { FABRIC_STATUS } from '@/constants'

// 3. Types
interface Props {
  fabricId: number
  onSuccess?: () => void
}

// 4. Component
export function ComponentName({ fabricId, onSuccess }: Props) {
  // 5. Hooks
  // 6. Derived state
  // 7. Event handlers (prefixed with handle: handleSubmit, handleClick)
  // 8. Return JSX
}
```

### Props
- All component props must have explicit TypeScript interfaces.
- Prefer named exports over default exports for components (except page.tsx files).
- Never pass raw database objects to client components – create DTO/view types.

## ============================================================
## API ROUTE RULES
## ============================================================

### Route Handler Structure
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { FabricService } from '@/services/fabric.service'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { requireAdminAuth } from '@/lib/auth/guards'

// Define Zod schema at top
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(24),
})

export async function GET(request: NextRequest) {
  try {
    const params = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    const result = await FabricService.list(params)
    return apiSuccess(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', error.message, 400)
    }
    return apiError('INTERNAL_ERROR', 'Something went wrong', 500)
  }
}
```

### Never
- Never put business logic in API route handlers – always call a service.
- Never return raw database rows – always map to response DTOs.
- Never skip error handling.

## ============================================================
## SERVICE LAYER RULES
## ============================================================

- Services are plain TypeScript classes or module-level functions in /src/services/.
- Services contain ALL business logic.
- Services call the database via Drizzle ORM – never raw SQL except for complex queries.
- Services call external APIs (OpenAI, social platforms) via dedicated lib/ clients.
- Services dispatch to queues via /lib/queue/ helpers.
- Never import from /app/ inside a service.
- Services return typed objects, never raw DB rows.

## ============================================================
## DATABASE / DRIZZLE RULES
## ============================================================

- Schema defined in /src/db/schema/ – one file per domain.
- ALWAYS use `integer('id').generatedAlwaysAsIdentity().primaryKey()` for every table.
- ALL foreign key columns end with `_id` (e.g., `supplier_id`, `assigned_to_id`).
- Use snake_case for all DB column names.
- Use camelCase for Drizzle schema field names in TypeScript.
- Timestamps use `timestamptz` (with timezone).
- Enums: define in PostgreSQL as pgEnum and reference in schema.
- NEVER write raw SQL for simple CRUD – use Drizzle query builder.
- Complex queries (full-text search, aggregations) may use `sql` tagged template with parameterization.

### Schema Example
```typescript
import { pgTable, integer, text, timestamptz, pgEnum } from 'drizzle-orm/pg-core'

export const fabricStatusEnum = pgEnum('fabric_status', [
  'raw_scraped', 'ai_processed', 'approved', 'rejected'
])

export const fabrics = pgTable('fabrics', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  supplierId: integer('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'restrict' }),
  slug: text('slug').notNull().unique(),
  titleRu: text('title_ru').notNull(),
  titleEn: text('title_en'),
  status: fabricStatusEnum('status').notNull().default('raw_scraped'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  deletedAt: timestamptz('deleted_at'),
})
```

## ============================================================
## QUEUE / WORKER RULES
## ============================================================

- Queue names are constants from /src/constants/queues.ts.
- Every job payload must include: jobId (uuid), entityId (integer), entityType (string), createdAt (ISO string).
- Workers must handle errors gracefully and log failures.
- Workers must update job progress using `job.updateProgress()`.
- Failed jobs must update the corresponding DB record with error details.
- Never await long operations sequentially – use Promise.all for parallelizable tasks.

## ============================================================
## STYLING RULES
## ============================================================

- Tailwind CSS ONLY for styling. No CSS modules. No styled-components.
- Use Shadcn/UI components for all UI primitives (Button, Input, Dialog, etc.).
- Custom styles go in /src/app/globals.css as Tailwind `@layer components` or `@layer utilities`.
- Design tokens defined in tailwind.config.ts under `theme.extend`.
- Mobile-first: always start with base styles, add `md:` and `lg:` breakpoints.
- Never use inline `style={{}}` except for dynamic values that cannot be expressed with Tailwind.

## ============================================================
## ERROR HANDLING RULES
## ============================================================

- All async functions must be wrapped in try/catch.
- API routes must never expose internal error details to clients.
- Service layer logs errors with structured logging (include entityId, operation, error message).
- Use custom error classes in /src/lib/errors/: AppError, NotFoundError, ValidationError, AuthError.
- Client components use error boundaries for unexpected failures.
- TanStack Query handles server state errors – display toast notifications via Sonner.

## ============================================================
## PERFORMANCE RULES
## ============================================================

- All public marketplace pages use generateStaticParams + ISR (revalidate: 3600) where possible.
- Dynamic pages (search results, admin) use SSR.
- Images ALWAYS use next/image with explicit width and height.
- Never import entire libraries – use named imports.
- TanStack Query: set staleTime appropriately (catalog: 5min, admin: 30s).
- Avoid layout shift: always provide skeleton loaders for async content.
- Database: NEVER do N+1 queries. Use JOINs or batch fetching.

## ============================================================
## SECURITY RULES
## ============================================================

- All admin routes wrapped in requireAdminAuth() guard.
- All user inputs validated with Zod before processing.
- Environment variables: NEVER hardcode secrets. Access via process.env.VARIABLE_NAME.
- All API routes that mutate data require method check (only POST/PATCH/DELETE).
- Rate limiting applied to all public endpoints.
- Never log sensitive data (emails, phone numbers, API keys).

## ============================================================
## TESTING CONVENTIONS
## ============================================================

- Unit tests for all service functions in /src/services/__tests__/.
- Use Vitest as the test runner.
- Mock external dependencies (OpenAI, social APIs) in tests.
- Integration tests for API routes in /src/app/api/__tests__/.
- Test file naming: component.test.ts or component.spec.ts.

## ============================================================
## CODE QUALITY
## ============================================================

- ESLint + Prettier enforced. No warnings allowed in production code.
- No commented-out code in main branch.
- No console.log in production code – use structured logger from /lib/logger.ts.
- All TODO comments must have a ticket reference: // TODO(TKAN-123): description
- Prefer early returns to reduce nesting.
- Max function length: 50 lines. If longer, extract helper functions.
- Max file length: 300 lines. If longer, split by responsibility.
