# TkanMarket — Complete System Analysis Report

> Generated: July 2026
> Codebase: Next.js 16, TypeScript Strict, Drizzle ORM, PostgreSQL 16, BullMQ + Redis 7, Google Vertex AI

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Directory Structure & Code Organization](#3-directory-structure--code-organization)
4. [Database Layer](#4-database-layer)
5. [API Layer](#5-api-layer)
6. [Service Layer](#6-service-layer)
7. [Worker Layer (BullMQ Background Jobs)](#7-worker-layer-bullmq-background-jobs)
8. [AI Pipeline](#8-ai-pipeline)
9. [Crawler Subsystem](#9-crawler-subsystem)
10. [Social Media Pipeline](#10-social-media-pipeline)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Authentication & Authorization](#12-authentication--authorization)
13. [Feature Flag System](#13-feature-flag-system)
14. [Internationalization (i18n)](#14-internationalization-i18n)
15. [Queue & Redis Infrastructure](#15-queue--redis-infrastructure)
16. [Error Handling](#16-error-handling)
17. [Data Flow Diagrams](#17-data-flow-diagrams)
18. [Configuration & Environment](#18-configuration--environment)
19. [Key Design Decisions & Conventions](#19-key-design-decisions--conventions)
20. [Current Status & Roadmap](#20-current-status--roadmap)

---

## 1. Project Overview

**TkanMarket** is a B2B fabric sourcing marketplace connecting Chinese textile suppliers with buyers from Russia/CIS countries. The platform enables:

- **Chinese suppliers** to list fabrics (via admin input, Excel bulk import, or automated web crawling)
- **AI enrichment** of raw fabric data using Google Vertex AI (Gemini 3.5 Flash)
- **Multi-platform social media publishing** (Instagram, TikTok, Pinterest, Facebook, YouTube)
- **AI image & video generation** (Gemini 3.1 Flash Image, Veo 3.1 Lite)
- **Buyer lead management** with full CRM pipeline
- **Multi-language support** (English, Russian, Chinese)

### Stack (Locked — no alternatives permitted)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | Tailwind CSS 3 + Shadcn/UI + Radix Primitives |
| State (Client) | TanStack Query v5 |
| Table UI | TanStack Table v8 |
| Database ORM | Drizzle ORM 0.45 |
| Database | PostgreSQL 16 |
| Queue | BullMQ 5.x |
| Cache/Queue Backend | Redis 7 |
| Auth | NextAuth v5 (beta.30) |
| Validation | Zod 3.23 |
| AI | Google Vertex AI (Gemini, Veo) |
| Storage | Cloudflare R2 (AWS S3 SDK) |
| Crawler | Playwright 1.59 |
| Charts | Recharts |
| Forms | react-hook-form |

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLOUD INFRASTRUCTURE                         │
│                                                                     │
│   ┌──────────────────────┐      ┌──────────────────────────────┐   │
│   │   VERCEL (Frontend)  │      │   RAILWAY (Backend Workers)  │   │
│   │                      │      │                              │   │
│   │  Next.js 16 App      │      │  ┌────────────────────────┐  │   │
│   │  - Public Pages SSR  │      │  │  ai.worker.ts          │  │   │
│   │  - Admin Pages SSR   │      │  │  (Gemini Text)         │  │   │
│   │  - API Routes        │──────┼──┤                        │  │   │
│   │  - ISR (re: 3600)    │      │  │  image.worker.ts       │  │   │
│   └──────────┬───────────┘      │  │  image-generation.worker│  │   │
│              │                  │  │  video-generation.worker│  │   │
│              │                  │  │  social.worker.ts       │  │   │
│              │                  │  │  crawler.worker.ts      │  │   │
│              │                  │  └────────────────────────┘  │   │
│              │                  └──────────────────────────────┘   │
│              │                         │                           │
│              ▼                         ▼                           │
│   ┌──────────────────┐    ┌──────────────────────┐                │
│   │   PostgreSQL 16   │    │     Redis 7          │                │
│   │   (Neon)          │    │  - BullMQ Queues     │                │
│   │   - Drizzle ORM   │    │  - Rate Limiting     │                │
│   │   - 33 Schemas    │    │  - AI Budget Tracking│                │
│   └──────────────────┘    │  - Social Quotas      │                │
│                           └──────────────────────┘                │
│                                      │                             │
│                                      ▼                             │
│                           ┌──────────────────────┐                │
│                           │   Google Vertex AI   │                │
│                           │  - Gemini 3.5 Flash  │                │
│                           │  - Gemini 3.1 Image  │                │
│                           │  - Veo 3.1 Video     │                │
│                           └──────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

### Two TypeScript Build Graphs

The project maintains **two separate TypeScript compilation targets**:

| Build | Config | Output | Purpose |
|-------|--------|--------|---------|
| **App** | `tsconfig.json` | `noEmit` (bundler) | Next.js/React frontend + API routes |
| **Workers** | `tsconfig.workers.json` | `dist-workers/` (CommonJS) | BullMQ background workers |

**Critical rule**: Workers cannot import from `src/app` or React-only code. Workers can only use `src/workers`, `src/services`, `src/lib`, `src/db`, `src/types`, `src/constants`.

### Layered Request Flow

```
Client Request
    │
    ▼
API Route (src/app/api/v1/**)
    │  • Parse HTTP request
    │  • Zod-validate input
    │  • Check session/role (admin routes)
    │  • Call service
    │  • Shape response
    │
    ▼
Service (src/services/*.service.ts)
    │  • ALL business logic
    │  • Drizzle ORM queries
    │  • Transaction management
    │  • Queue job enqueueing
    │
    ▼
Drizzle ORM → PostgreSQL 16
```

**For SSR pages**: Bypass HTTP entirely — call services directly via `getLocale()` + service calls.

**For client components**: Use TanStack Query to call API routes.

---

## 3. Directory Structure & Code Organization

```
src/
├── app/                          # Next.js 16 App Router
│   ├── (public)/                 # Public marketplace (SSR/ISR)
│   │   ├── page.tsx              # Homepage
│   │   ├── fabrics/              # Fabric catalog + detail
│   │   ├── suppliers/            # Supplier listing + detail
│   │   ├── blog/                 # Blog listing + detail
│   │   ├── about/                # About page
│   │   ├── contact/              # Contact page
│   │   ├── wishlist/             # Buyer wishlist
│   │   ├── lead-success/         # Lead funnel success
│   │   ├── bulk-inquiry/         # Bulk inquiry portal
│   │   ├── sample-request/       # Sample request form
│   │   ├── order-tracking/       # Order tracking
│   │   └── partner/              # Partner portal
│   │
│   ├── (admin)/                  # Admin routes
│   │   ├── layout.tsx            # Admin root layout
│   │   ├── login/                # Admin login
│   │   └── fabrics/[id]/         # Admin fabric detail
│   │
│   ├── (admin)/(authenticated)/  # Protected admin dashboard
│   │   ├── admin/                # 80+ admin pages
│   │   │   ├── page.tsx          # Dashboard home
│   │   │   ├── fabrics/          # Fabric CRUD (list, new, bulk-create)
│   │   │   ├── leads/            # Lead CRM
│   │   │   ├── social/           # Social media queue
│   │   │   ├── suppliers/        # Supplier management
│   │   │   ├── crawler/          # Crawler control
│   │   │   ├── settings/         # System settings
│   │   │   ├── users/            # User management
│   │   │   └── ... (70+ more)
│   │   └── leads/                # Leads (legacy redirect)
│   │
│   ├── (conversion)/             # Conversion funnel
│   │   └── lead-success/
│   │
│   └── api/v1/                   # API routes
│       ├── auth/                 # NextAuth, forgot/reset password
│       ├── admin/                # 40+ admin endpoint groups
│       ├── fabrics/              # Public fabric endpoints
│       ├── leads/                # Lead submission
│       ├── public/               # Blog, search, stats, suppliers
│       ├── suppliers/            # Public supplier endpoints
│       ├── webhooks/             # Social + Vertex AI webhooks
│       └── wishlist/             # Buyer wishlist CRUD
│
├── auth/                         # NextAuth v5 setup
│   ├── auth.ts                   # NextAuth singleton
│   └── auth-options.ts           # Re-exports from lib/auth/config
│
├── components/
│   ├── ui/                       # Shadcn/UI primitives (21 files)
│   ├── common/                   # Header, Footer, Breadcrumb, etc.
│   ├── shared/                   # Shared utility components
│   ├── marketplace/              # 60+ public-facing components
│   ├── forms/                    # Modal forms (lead, inquiry, sample request)
│   ├── public/                   # Page-specific public components
│   └── admin/                    # 100+ admin components
│
├── config/                       # Feature flags
│   ├── features.ts               # Feature engine
│   ├── features.registry.json    # 34 feature definitions
│   ├── features.state.json       # On/off/purged state
│   └── admin-sidebar-nav.ts      # Sidebar nav config
│
├── constants/                    # App-wide constants
│   └── index.ts                  # Enums, pagination, queue names, quotas
│
├── db/                           # Database layer
│   ├── index.ts                  # Drizzle connection singleton
│   ├── seed.ts                   # Seed data
│   ├── migrations/               # 26 auto-generated SQL migrations
│   └── schema/                   # 33 schema files (one per domain)
│
├── hooks/                        # Custom React hooks
│   ├── useFabrics.tsx            # TanStack Query hooks
│   ├── useFabric.tsx
│   └── admin/                    # 75+ admin-specific hooks
│
├── lib/                          # Core libraries
│   ├── auth/                     # Auth config, guards, TOTP, recovery codes
│   ├── crawler/                  # Playwright browser, proxy, extractors
│   ├── errors/                   # AppError, NotFoundError, etc.
│   ├── google/                   # Vertex AI client + prompts
│   ├── queue/                    # BullMQ queue definitions + helpers
│   ├── redis/                    # Redis client singleton
│   ├── social/platforms/         # Per-platform publishers (FB, IG, TT, Pin, YT)
│   ├── storage/                  # Cloudflare R2
│   ├── validations/              # Zod schemas per domain
│   ├── utils/                    # api-response, seo, rate-limit
│   ├── i18n/                     # Locale detection, interpolation
│   └── logger.ts                 # Structured logger
│
├── messages/                     # i18n translations
│   ├── en.ts                     # English (4780 lines)
│   ├── ru.ts                     # Russian
│   └── zh.ts                     # Chinese
│
├── services/                     # ALL business logic
│   ├── fabric.service.ts         # Public fabric queries
│   ├── lead.service.ts           # Lead creation + management
│   ├── crawler.service.ts        # Web scraping orchestration
│   ├── ai.service.ts             # AI enrichment pipeline
│   ├── social.service.ts         # Social media content
│   ├── admin/                    # Admin-prefixed services (12 files)
│   ├── workers/                  # Worker-only services (3 files)
│   └── supplier-discovery/       # Supplier discovery sub-system
│
├── types/                        # 101 TypeScript type files
│   ├── fabric.ts                 # Fabric types
│   ├── lead.types.ts             # Lead types
│   ├── marketplace.types.ts      # Marketplace DTOs
│   └── ... (98 more)
│
└── workers/                      # BullMQ workers
    ├── index.ts                  # Worker entrypoint
    ├── ai.worker.ts              # AI enrichment worker
    ├── image.worker.ts           # Image processing
    ├── image-generation.worker.ts # AI image generation
    ├── video-generation.worker.ts # AI video generation
    ├── crawler.worker.ts         # Web crawler
    └── social.worker.ts          # Social media workers (4 in one file)
```

### File Count Statistics

| Category | Count |
|----------|-------|
| TypeScript files | ~490+ |
| DB schemas | 33 |
| DB migrations | 26 |
| API route files | ~180+ |
| Page files | ~80+ |
| React components | ~220+ |
| Service files | ~100+ |
| React hooks | ~100+ |
| Type definition files | 101 |
| Worker files | 8 |
| i18n locales | 3 |
| Feature flags registered | 34 |

---

## 4. Database Layer

### Connection Management (`src/db/index.ts`)

Singleton pattern using `postgres` driver + Drizzle ORM:

```typescript
// Concept (not exact):
let db: DbInstance | null = null
let client: PostgresClient | null = null

function getDb(): DbInstance {
  if (!db) {
    client = postgres(DATABASE_URL, { max: 10 })
    db = drizzle(client, { schema })
  }
  return db
}
```

### Schema Design Principles

**Hard rules enforced via `.cursorrules`:**
1. **PKs**: Always `integer('id').generatedAlwaysAsIdentity().primaryKey()` — never UUID
2. **Timestamps**: Every table has `created_at`, `updated_at` (both `timestamptz`, default `now()`)
3. **Soft delete**: User-facing tables have `deleted_at timestamptz` — never hard delete
4. **FK indexes**: Every foreign key column has an index
5. **Cascade**: Default `ON DELETE RESTRICT`; cascade only when child has no meaning without parent
6. **Naming**: `snake_case` for columns, kebab-case for files
7. **No raw SQL**: Always use Drizzle ORM

### Complete Schema Inventory (33 tables)

| Schema File | Table | Purpose |
|-------------|-------|---------|
| `users.schema.ts` | `users` | Admin/Sales/Viewer accounts, password hash, TOTP |
| `suppliers.schema.ts` | `suppliers` | Chinese textile suppliers |
| `fabrics.schema.ts` | `fabrics` | Core product: titles, descriptions, specs, images, status |
| `fabrics.schema.ts` | `fabric_categories` | Many-to-many fabric ↔ category links |
| `fabric-category-terms.schema.ts` | `fabric_category_terms` | Category taxonomy tree |
| `fabric-activity-log.schema.ts` | `fabric_activity_log` | Audit trail for each fabric |
| `leads.schema.ts` | `leads` | Buyer inquiries with full CRM pipeline |
| `leads.schema.ts` | `lead_notes` | Internal notes on leads |
| `leads.schema.ts` | `lead_activity_log` | Lead status change history |
| `social.schema.ts` | `social_posts` | Social media content drafts |
| `social.schema.ts` | `social_campaigns` | Campaign grouping |
| `social.schema.ts` | `social_analytics` | Post performance data |
| `social.schema.ts` | `social_credentials` | OAuth tokens per platform |
| `crawler.schema.ts` | `crawler_runs` | Crawl job tracking |
| `crawler.schema.ts` | `raw_products` | Raw scraped data before processing |
| `rbac.schema.ts` | `roles` | Role definitions (admin, sales, viewer) |
| `rbac.schema.ts` | `permissions` | Individual permissions |
| `rbac.schema.ts` | `role_permissions` | Role ↔ Permission mapping |
| `rbac.schema.ts` | `user_roles` | User ↔ Role assignment |
| `audit.schema.ts` | `audit_log` | System-wide audit trail |
| `notifications.schema.ts` | `notifications` | In-app notifications |
| `notifications.schema.ts` | `notification_settings` | Per-user notification prefs |
| `api-keys.schema.ts` | `api_keys` | External API keys |
| `auth-flow.schema.ts` | `auth_security_events` | Login attempts, security events |
| `teams.schema.ts` | `teams` | Team groupings |
| `blog.schema.ts` | `blog_posts` | Blog content |
| `logistics.schema.ts` | `logistics_carriers` | Shipping carriers |
| `logistics.schema.ts` | `logistics_shipments` | Shipment tracking |
| `bulk-orders.schema.ts` | `bulk_orders` | Bulk order management |
| `buyer-wishlist.schema.ts` | `buyer_wishlist` | Buyer saved fabrics |
| `commission-rules.schema.ts` | `commission_rules` | Commission structure |
| `support.schema.ts` | `support_tickets` | Help desk tickets |
| `admin-settings.schema.ts` | `admin_settings` | Key-value settings store |
| `admin-announcements.schema.ts` | `admin_announcements` | System announcements |
| `admin-totp-recovery-codes.schema.ts` | `admin_totp_recovery_codes` | TOTP backup codes |
| `cookie-consents.schema.ts` | `cookie_consents` | GDPR consent records |
| `catalog-export.schema.ts` | `catalog_exports` | Export job tracking |
| `generated-media.schema.ts` | `generated_media` | AI-generated images/videos |
| `newsletter-subscribers.schema.ts` | `newsletter_subscribers` | Email subscribers |
| `supplier-discovery.schema.ts` | `supplier_discovery_runs` | Supplier discovery tracking |
| `supplier-ops.schema.ts` | `supplier_onboarding` | Supplier onboarding workflow |
| `system-console.schema.ts` | `system_config` | System configuration |
| `wholesale-pricing-profiles.schema.ts` | `wholesale_pricing_profiles` | Pricing tiers |
| `bulk-import-jobs.schema.ts` | `bulk_import_jobs` | Excel/CSV import tracking |

### Fabric Status Lifecycle

```
raw_scraped  →  ai_processing  →  ai_processed  →  approved  (live)
                                                    →  rejected  (hidden)
```

### Lead Status Lifecycle

```
NEW → CONTACTED → QUALIFIED → PROPOSAL_SENT → NEGOTIATING → CLOSED_WON
                                                           → CLOSED_LOST
```

### Lead Sources

```
MARKETPLACE_INQUIRY | SAMPLE_REQUEST | SOCIAL_CAMPAIGN | DIRECT_CONTACT | MANUAL_ENTRY
```

### User Roles

```
ADMIN | SALES | VIEWER
```

### Enums Pattern

Enums are defined in **two places** (deliberate redundancy):
1. **Drizzle `pgEnum()`** in schema files (source of truth for DB)
2. **`const` arrays** in `src/constants/index.ts` (for application code)

---

## 5. API Layer

### Route Structure

All API routes live under `src/app/api/v1/` organized by domain:

| Route Group | Files | Auth Required | Purpose |
|-------------|-------|---------------|---------|
| `auth/[...nextauth]/` | 1 | No | NextAuth catch-all |
| `auth/forgot-password/` | 1 | No | Password reset flow |
| `auth/reset-password/` | 1 | No | Password reset |
| `auth/invite/accept/` | 1 | Yes (invite) | Accept invitation |
| `admin/*` | 40+ groups | Admin session | All admin CRUD |
| `fabrics/` | 6 | No | Public catalog, detail, compare |
| `leads/` | 1 | No (rate-limited) | Lead submission |
| `public/*` | 6 | No | Blog, search, stats, newsletter |
| `suppliers/` | 2 | No | Supplier listing/detail |
| `webhooks/` | 4 | Webhook secret | Social + AI webhooks |
| `wishlist/` | 4 | Session | Buyer wishlist |

### API Response Envelope

All API responses follow a strict pattern:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 24,
    "total": 150,
    "totalPages": 7,
    "supplierCount": 12
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Fabric not found",
    "statusCode": 404
  }
}
```

### Helpers

- `apiSuccess(data, meta?, statusCode?)` → 200/201 with success envelope
- `apiError(code, message, statusCode)` → Error response with appropriate status
- `withPagination(items, total, page, limit)` → Build pagination meta

### API Route Pattern (Typical)

```typescript
// src/app/api/v1/fabrics/route.ts
export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 120, windowSeconds: 3600 })
    const params = FabricQuerySchema.parse(parseSearchParams(req.url))
    const result = await FabricService.list(params)
    return apiSuccess(result.items, withPagination(...).meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
```

### Admin API Guard Pattern

```typescript
// Admin routes always:
await requireAdminSession()  // throws if not authenticated as admin
// Then proceed with business logic
```

### Rate Limiting

- **Public fabric list**: 120 requests/hour
- **Lead submission**: 5 requests/hour per IP
- Uses Redis-based sliding window via `enforceRateLimit()`

---

## 6. Service Layer

### Architecture

Services are the **ONLY place** where business logic lives. API routes never contain business logic.

### Service Pattern

```typescript
export class FabricService {
  static async list(params: FabricQueryParams): Promise<PaginatedResult<FabricSummary>> {
    const db = getDb()
    // ... Drizzle queries, joins, filters ...
    return { items, total, supplierCount }
  }

  static async getBySlug(slug: string): Promise<FabricDetail | null> {
    const db = getDb()
    // ... joining fabrics + suppliers ...
  }
}
```

### Service Inventory (100+ files)

| Category | Count | Examples |
|----------|-------|---------|
| Core domain services | 12 | `fabric.service.ts`, `lead.service.ts`, `supplier.service.ts` |
| AI services | 2 | `ai.service.ts`, `image-generation.service.ts` |
| Social services | 5 | `social.service.ts`, `social-publisher.service.ts`, `social-campaign.service.ts` |
| Admin services | 40+ | `admin-fabric.service.ts`, `admin-lead-admin.service.ts` |
| Worker services | 3 | `fabric-ai-job.service.ts`, `fabric-image-job.service.ts`, `fabric-social-job.service.ts` |
| Supplier services | 8 | `supplier-discovery.service.ts`, `supplier-verification.service.ts` |
| System services | 15+ | `audit-log-admin.service.ts`, `settings.service.ts`, `rbac-admin.service.ts` |

### Key Service Responsibilities

| Service | Key Methods | Queue Jobs Enqueued |
|---------|------------|-------------------|
| `FabricService` | `list()`, `getBySlug()`, `getTopViewedSlugs()` | None (read-only) |
| `AdminFabricService` | `list()`, `create()`, `update()`, `approve()`, `reject()` | AI queue (on create) |
| `LeadService` | `create()`, `list()`, `getById()`, `updateStatus()` | None |
| `CrawlerService` | `scrapeProducts()`, `abortRunDisabled()`, `markRunFatalFailure()` | None (called by worker) |
| `AIService` | `processFabric()`, `generateSocialContent()`, `generateBlogPost()` | Image, ImageGen, Social queues |
| `SocialService` | `createContentJob()`, `schedulePost()`, `publishPost()` | Social publish queue |

---

## 7. Worker Layer (BullMQ Background Jobs)

### Worker Architecture

```
                    ┌──────────────────────┐
                    │   workers/index.ts    │
                    │   (Entrypoint)        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                 │
              ▼                ▼                 ▼
       ┌──────────────┐ ┌────────────┐  ┌──────────────┐
       │ ai.worker    │ │ crawler    │  │ social       │
       │              │ │ .worker    │  │ .worker      │
       │ Queue: AI    │ │            │  │              │
       │ Concurrency:5│ │ Queue:Craw │  │ S publishes  │
       │              │ │ ler(3 conc)│  │ + analytics  │
       └──────┬───────┘ └────────────┘  │ + token ref  │
              │                          └──────────────┘
              │
     ┌────────┼────────┐
     ▼        ▼        ▼
┌────────┐┌────────┐┌──────────────┐
│Image   ││Image   ││Social        │
│Worker  ││Gen     ││Content Gen   │
│(process││Worker  ││(via Gemini)  │
│ raw    ││(Vertex │└──────────────┘
│ images)││ AI)    │
└────────┘└────────┘
```

### Worker Inventory

| Worker | Queue Name | Concurrency | Calls | Description |
|--------|-----------|-------------|-------|-------------|
| `ai.worker.ts` | `ai_processing_jobs` | 5 | `AIService.processFabric()` | Gemini text enrichment |
| `image.worker.ts` | `image_processing_jobs` | 3 | — | Raw image processing |
| `image-generation.worker.ts` | `image_generation_jobs` | 2 | — | Gemini 3.1 Flash Image |
| `video-generation.worker.ts` | `video_generation_jobs` | 1 | — | Veo 3.1 Lite |
| `crawler.worker.ts` | `crawler_jobs` | 3 | `CrawlerService.scrapeProducts()` | Playwright scraper |
| `social.worker.ts` | `social_media_jobs` | 3 | `SocialService` | Multi-platform publisher |
| `social.worker.ts` | `social_publish_jobs` | 3 | `SocialService` | Scheduled publishing |
| `social.worker.ts` | `social_analytics_jobs` | 2 | — | Performance metrics sync |
| `social.worker.ts` | `social_token_refresh_jobs` | 1 | — | OAuth token refresh |

### Worker Entrypoint (`workers/index.ts`)

- Feature-gated: each worker starts only if enabled in `features.state.json`
- Calls `scheduleSocialRepeatables()` for cron-based social jobs
- Installs graceful shutdown handlers

### AI Worker Pipeline (Complete Flow)

```
1. Job received from AI queue
2. AIService.processFabric(fabricId):
   a. Fetch raw fabric data from DB
   b. Update status to 'ai_processing'
   c. Call Gemini 3.5 Flash with enrichment prompt
   d. Parse JSON response via Zod
   e. Calculate confidence score
   f. Update fabric with AI-generated fields
   g. Log to fabric_activity_log
   h. Return processed result
3. Enqueue image processing job (if images exist)
4. Enqueue image generation job (Gemini 3.1 Flash Image)
5. Enqueue social content generation job
6. On failure: reset status to 'raw_scraped', log error
```

### Crawler Worker Details

- Supports Alibaba, 1688, and Made-in-China as sources
- Uses Playwright with headless Chromium
- Proxy support via IPRoyal (configurable)
- Site-specific cookies (1688 session auth)
- Anti-detection: user agent rotation, viewport randomization, request blocking
- Page hardening to avoid bot detection
- Semaphore limiting concurrent pages (default 3)
- Job timeout: 45 minutes (configurable)
- Stalled job detection with DB status update

---

## 8. AI Pipeline

### AI Services Used

| Service | Model | Purpose | Cost |
|---------|-------|---------|------|
| **Vertex AI Gemini** | `gemini-3.5-flash` | Text enrichment, social content, blog posts | $0.075/1K chars |
| **Vertex AI Gemini** | `gemini-3-pro-image-preview` | Product image generation | $0.07/image |
| **Vertex AI Veo** | `veo-3.1-generate-001` | Fabric video generation | $0.12/second |

### Text Enrichment Pipeline

```
Raw Data (from admin/crawler):
  • title_ru (required)
  • raw_title (from source)
  • raw_description (from source)
  • source_url
  • composition (if available)
           │
           ▼
  Gemini 3.5 Flash (JSON mode, temp=0.2)
           │
           ▼
  AI-Generated Fields:
  • title_en (English translation)
  • description_en (English description)
  • meta_title_ru (SEO title)
  • meta_description_ru (SEO description)
  • fabric_type (woven/knit/nonwoven/lace/lining/technical/other)
  • gsm (fabric weight)
  • width_cm (fabric width)
  • moq (minimum order quantity)
  • price_usd (estimated price)
  • composition (structured: [{material, percentage}])
  • tags (relevant keywords)
  • image_urls (relevant product images)
           │
           ▼
  Zod Validation → Completeness Score (0-1)
           │
           ▼
  If score < 0.6 → flagged for mandatory review
  Else → ready for admin approval
```

### AI Prompt Engineering

Prompts are in `src/lib/google/prompts/fabric-enrichment.ts` (previously `src/lib/openai/prompts/` before migration from OpenAI to Vertex AI).

The system uses a structured prompt that instructs Gemini to:
1. Translate fabric title to English
2. Generate SEO metadata in Russian
3. Identify fabric technical specifications
4. Suggest pricing (in USD)
5. Generate structured composition data
6. Output valid JSON matching a Zod schema

### AI Budget Tracking

- Daily/monthly spend tracked via Redis
- Configurable budget limits in admin settings
- Cost constants defined in `src/constants/index.ts`

---

## 9. Crawler Subsystem

### Sources

| Platform | Extractor | Auth Required |
|----------|-----------|---------------|
| Alibaba (alibaba.com) | `alibaba.extractor.ts` | No |
| 1688 (1688.com) | `1688.extractor.ts` | Cookies (session) |
| Made-in-China | `made-in-china.extractor.ts` | No |

### Crawler Libraries (`src/lib/crawler/`)

| File | Purpose |
|------|---------|
| `browser.ts` | Playwright browser singleton, page pool, semaphore |
| `proxy-rotation.ts` | IPRoyal proxy config, rotation logic |
| `site-cookies.ts` | Site-specific session cookie injection |
| `page-hardening.ts` | Anti-detection: user agent, viewport, webdriver flags |
| `request-blocker.ts` | Block unnecessary resources (images, fonts, etc.) |
| `data-cleaner.ts` | Clean and normalize scraped product data |
| `deduplicator.ts` | Batch duplicate detection before insert |
| `url-normalize.ts` | Normalize product URLs |
| `source-registry.ts` | Source URL registry |

### Crawler Flow

```
Admin triggers crawl (via UI or API)
           │
           ▼
Create crawler_run record (status: PENDING)
           │
           ▼
Enqueue BullMQ job → crawler.worker.ts
           │
           ▼
Worker acquires semaphore slot
           │
           ▼
Launch Playwright browser (headless Chromium)
  → Configure proxy (if enabled)
  → Inject site cookies (if 1688)
  → Harden page (anti-detection)
  → Block unnecessary requests
           │
           ▼
For each keyword:
  1. Navigate to search page
  2. Wait for results to load
  3. Extract product URLs
  4. For each product URL (up to maxProducts):
     a. Navigate to detail page
     b. Extract: title, description, price, images, specs
     c. Clean data
     d. Check duplicate (by source URL)
     e. Insert raw_product record
     f. Create/get supplier
     g. Create fabric with status 'raw_scraped'
     h. Enqueue AI job for each new fabric
           │
           ▼
Update crawler_run: COMPLETED (or PARTIAL/FAILED)
```

---

## 10. Social Media Pipeline

### Supported Platforms

| Platform | Publisher | Content Types | Daily Quota |
|----------|-----------|---------------|-------------|
| Instagram | `instagram.ts` | REEL_15, REEL_20, REEL_30, CAROUSEL, IMAGE_POST | 50 |
| TikTok | `tiktok.ts` | REEL_15, REEL_20, REEL_30 | 10 |
| Pinterest | `pinterest.ts` | PIN, IMAGE_POST | 100 |
| Facebook | `facebook.ts` | IMAGE_POST, CAROUSEL | 50 |
| YouTube | `youtube.ts` | Video (via Veo AI) | 20 |

### Publisher Architecture (`src/lib/social/platforms/`)

Uses a **factory pattern**:

```typescript
// src/lib/social/platforms/index.ts
const publishers = { INSTAGRAM, TIKTOK, PINTEREST, FACEBOOK, YOUTUBE }
export function getPublisher(platform: SocialPlatform): Publisher {
  return publishers[platform]
}
```

Each platform publisher implements a common `Publisher` interface with:
- `publish(post)`: Send content to platform API
- `schedule(post)`: Schedule for later
- `getAnalytics(postId)`: Fetch performance metrics

### Social Content Generation Flow

```
AI Worker completes enrichment
           │
           ▼
SocialService.createContentJob(fabricId):
  → For each enabled platform:
    → Call Gemini to generate platform-specific content
      • Instagram: caption + hashtags + reel script
      • TikTok: short script + hashtags
      • Pinterest: pin description
      • Facebook: post text
      • YouTube: video description
    → Create social_post record (status: DRAFT)
           │
           ▼
Admin reviews in Social Queue
  → Edit caption if needed
  → Approve → Schedule → Auto-publish via BullMQ
```

### Social Queue Workers

| Worker | Purpose | Schedule |
|--------|---------|----------|
| `socialPublishWorker` | Publish approved/scheduled posts | On-demand + polling |
| `socialAnalyticsWorker` | Sync performance metrics | Every 60 min |
| `socialTokenRefreshWorker` | Refresh OAuth tokens | Every 15 min |

---

## 11. Frontend Architecture

### Server Components by Default

- All pages are **React Server Components** (RSC) by default
- `'use client'` only when needed: event handlers, browser APIs, hooks
- **ISR** for public pages: `revalidate: 3600` on homepage

### Public Pages (SSR/ISR)

| Route | Component | Data Fetching |
|-------|-----------|---------------|
| `/` | Homepage | SSR + ISR (3600s) |
| `/fabrics` | Catalog | SSR with search params |
| `/fabrics/[slug]` | Detail | SSR by slug |
| `/suppliers` | Supplier list | SSR |
| `/suppliers/[slug]` | Supplier detail | SSR |
| `/blog` | Blog listing | SSR |
| `/blog/[slug]` | Blog detail | SSR |
| `/wishlist` | Buyer wishlist | Client (TanStack Query) |

### Admin Pages (SSR + Client Hydration)

- Use `admin-page-guard.tsx` for role-based access
- Admin pages are SSR but heavily interactive with TanStack Query
- Admin sidebar nav from `src/config/admin-sidebar-nav.ts`
- 80+ admin pages across 15+ domains

### Component Architecture

```
components/
├── ui/          # Shadcn/UI primitives (21 files, never edit)
├── common/      # Header, Footer, Breadcrumb, EmptyState, StatusBadge
├── marketplace/ # 60+ public components (HeroSection, FabricCard, FilterSidebar)
├── forms/       # Modal forms (BulkInquiryModal, HomeLeadForm, SampleRequestModal)
├── public/      # Page-specific public components (blog, auth, about, etc.)
└── admin/       # 100+ admin components in subdirectories by domain
```

### Data Fetching Strategy

| Scenario | Method |
|----------|--------|
| Public SSR pages | Direct service call (no HTTP) |
| Public client interactions | TanStack Query → API routes |
| Admin list pages | TanStack Query → Admin API routes |
| Admin mutations | TanStack Query `useMutation` |
| Static/I SR pages | `revalidate` or `generateStaticParams` |

### TanStack Query Configuration

- **staleTime**: 5 min for catalog, 30s for admin
- Query keys structured by domain (e.g., `['fabrics', { filters }]`)
- Optimistic updates for mutations (wishlist, status changes)

---

## 12. Authentication & Authorization

### Auth Stack

- NextAuth v5 (beta.30) with credentials provider
- Admin login: email + password (bcrypt hashed)
- Optional TOTP 2FA (Google Authenticator)
- Session strategy: JWT (stored in cookies)

### Auth Flow

```
1. User visits /admin/login
2. Submits email + password
3. NextAuth validates against users table (password_hash)
4. If TOTP enabled → prompt for TOTP code
5. Session created (JWT with role + userId)
6. Middleware redirects to /admin on success
```

### Guards

| Guard | Used In | What it does |
|-------|---------|-------------|
| `requireAdminSession()` | API routes | Throws if not authenticated or not admin role |
| `requireSession()` | API routes | Throws if not authenticated (any role) |
| `adminPageGuard()` | Admin pages | Shows "Access Denied" or redirects |
| `enforceRateLimit()` | Public API | Redis-based rate limiting |

### RBAC System

```
users → user_roles → roles → role_permissions → permissions
```

- **Roles**: admin, sales, viewer (defined in `users.schema.ts` enum)
- **Permissions**: fine-grained (e.g., `catalog.view`, `leads.edit`)
- **Module matrix**: `src/lib/rbac/module-matrix.ts` defines module-permission mapping

### Security Features

- TOTP 2FA with recovery codes
- Session timeout configuration
- Rate limiting on auth endpoints
- Login attempt tracking (`auth_security_events`)
- Password hashing with bcrypt
- Audit logging for sensitive operations
- Content Security Policy headers

---

## 13. Feature Flag System

### Architecture (`src/config/`)

```
features.ts              # Engine: getAllFeatures, isFeatureEnabled, etc.
features.registry.json   # 34 feature definitions with routes, APIs, schemas, files
features.state.json      # Runtime state: enabled/disabled/purged
```

### Feature Registry Entry Schema

```json
{
  "id": "fabric-catalog",
  "label": "Fabric Catalog",
  "description": "...",
  "routes": ["/fabrics", "/fabrics/(.*)"],
  "apiPaths": ["/api/v1/fabrics", "/api/v1/admin/fabrics"],
  "adminPaths": ["/admin/fabrics"],
  "navKeys": ["fabrics"],
  "adminNavHrefs": ["/admin/fabrics"],
  "workers": [],
  "schemas": ["fabrics", "fabric_categories"],
  "files": ["src/services/fabric.service.ts", "..."]
}
```

### Feature States

| State | Behavior |
|-------|----------|
| `enabled` | Routes render, APIs respond, workers start |
| `disabled` | Routes 404, APIs return 404, workers skip |
| `purged` | Same as disabled + DB schemas may not exist |

### Current Features (34 registered)

Includes: blog, newsletter, wishlist, cookie-consent, message-center, help-support, api-sandbox, access-insights, notification-center, system-health, teams, roles-permissions, activity-timeline, audit-log, alerts-hub, advanced-analytics, bulk-data, bulk-inquiries, bulk-orders, bulk-seo, catalog-export, commission-rules, crawler (with sub-features), data-migration, fabric-catalog, fabric-categories, fabric-taxonomy, global-search, inventory-suite, lead-scoring, logistics, marketplace-analytics, media-library, network-performance, pricing-analysis, product-attributes, product-review-queue, promotion-manager, reports, sales-performance, sample-inventory, sample-lifecycle, security, social (with sub-features), supplier-discovery, supplier-onboarding, supplier-ops, supplier-payouts, supplier-performance, supplier-reviews, supplier-verification, system-console, technical-diagnostics, user-activity-logs, user-management, wholesale-pricing.

### Worker Feature Gating

```typescript
// workers/index.ts
if (isFeatureEnabled('ai')) {
  startWorker(aiWorker)
}
if (isFeatureEnabled('social-publish')) {
  startWorker(socialPublishWorker)
}
```

---

## 14. Internationalization (i18n)

### Supported Locales

| Code | Language | File Size |
|------|----------|-----------|
| `en` | English | ~4780 lines |
| `ru` | Russian | Full translation |
| `zh` | Chinese | Full translation |

### Architecture (`src/lib/i18n/`)

```
get-locale.ts           # Server-side locale detection (cookie, Accept-Language)
get-messages.ts         # Load translation messages for locale
fill-message.ts         # Template interpolation (e.g., "Hello {name}")
interpolate.ts          # String interpolation utility
locale-path.ts          # Locale-aware URL path generation
locale-preference-context.tsx  # Client-side locale context
localized-fabric.ts     # Locale-aware fabric field resolution
set-locale-cookie.ts    # Persist locale preference
```

### Usage Pattern

```typescript
// In server components:
const locale = await getServerLocale()
const m = getMessages(locale)
// Access: m.fabrics.title, m.common.brand, etc.

// In client components:
const { locale, messages } = useLocale()
// Access: messages.fabrics.title
```

### Locale Detection

1. Check `NEXT_LOCALE` cookie
2. Fall back to `Accept-Language` header
3. Fall back to `en` (default)

### Locale-Aware Fabric Fields

The fabric schema stores data in both languages:
- `titleRu` / `titleEn`
- `descriptionRu` / `descriptionEn`
- `metaTitleRu` / `metaTitleEn`
- `metaDescriptionRu` / `metaDescriptionEn`
- `tags` / `tagsEn`

The `localized-fabric.ts` utility resolves the correct field based on the current locale.

---

## 15. Queue & Redis Infrastructure

### Redis Usage

| Purpose | Key Pattern | Data |
|---------|-------------|------|
| BullMQ Queue | `bull:queue_name:*` | Job data, state |
| Rate Limiting | `ratelimit:{route}:{ip}` | Token bucket |
| AI Budget | `ai:budget:*` | Daily/monthly counters |
| Social Quota | `social:quota:{platform}:{date}` | Daily publish quota |
| Social OAuth State | `social:oauth:state:{state}` | Temporary OAuth state |

### Queue Configuration

```typescript
const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 500
}
```

### Queue Definitions (`src/lib/queue/definitions.ts`)

Lazy singleton pattern per queue:

```typescript
function getOrCreateQueue(name: string): Queue {
  // Build-time guard
  if (isBuildTime()) throw new Error('Queue access during build is not allowed')
  return new Queue(name, { connection: getConnection(), defaultJobOptions })
}
```

### Queue Helpers (`src/lib/queue/helpers.ts`)

Exports:
- `addAIJob(entityId)` — Enqueue AI enrichment job
- `addImageJob(entityId, urls)` — Enqueue image processing
- `addImageGenerationJob(entityId, prompt)` — Enqueue image gen
- `addVideoGenerationJob(fabricId, duration, platform)` — Enqueue video gen
- `addSocialJob(entityId)` — Enqueue social content gen
- `scheduleSocialRepeatables()` — Register cron schedules

---

## 16. Error Handling

### Custom Error Classes (`src/lib/errors/index.ts`)

```typescript
AppError (base)       → { code, statusCode }
├── NotFoundError     → 404
├── ValidationError   → 400
├── AuthError         → 401
└── ForbiddenError    → 403
```

### Error Handling Pattern

```typescript
// API Route:
try {
  // ...
} catch (err) {
  return toApiErrorResponse(err)
}

// toApiErrorResponse handles:
//   - ZodError → 400 with details
//   - AppError → appropriate status code
//   - Unknown  → 500 Internal Server Error
```

### Logger (`src/lib/logger.ts`)

- Structured JSON logging in production
- Color-coded console output in development
- Auto-redaction of passwords, tokens, secrets, emails
- Controlled by `LOG_LEVEL` env var (default: info)
- No `console.log` anywhere in the codebase (enforced rule)

### Worker Error Handling

- BullMQ auto-retry (3 attempts, exponential backoff)
- Failed jobs logged with full context
- DB status rollback on AI worker failure
- Stalled job detection for crawler worker
- Graceful shutdown handling

---

## 17. Data Flow Diagrams

### Complete Product Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRODUCT LIFECYCLE                                 │
│                                                                          │
│  INPUT PHASE                   PROCESSING PHASE          OUTPUT PHASE   │
│                                                                          │
│  ┌───────────┐               ┌──────────────────┐      ┌─────────────┐  │
│  │ Admin     │──────────────▶│  AI Worker        │─────▶│ Marketplace │  │
│  │ Form/     │  status:      │                   │      │ (Approved)  │  │
│  │ Excel     │  raw_scraped  │  Gemini 3.5 Flash │      │             │  │
│  └───────────┘               │  Text Enrichment  │      │ Public SSR  │  │
│                              └────────┬─────────┘      │ Pages       │  │
│  ┌───────────┐                        │                └─────────────┘  │
│  │ Crawler   │──────────────▶         │                                  │
│  │ (Scrape)  │  raw_product           │                ┌─────────────┐  │
│  └───────────┘  + fabric              ▼                │ Admin       │  │
│                               ┌──────────────────┐     │ Dashboard   │  │
│                               │  Image Gen       │     │ Review/     │  │
│                               │  (Gemini 3.1)    │────▶│ Approve     │  │
│                               └────────┬─────────┘     └─────────────┘  │
│                                        │                                │
│                                        ▼                                │
│                               ┌──────────────────┐     ┌─────────────┐  │
│                               │  Social Content   │────▶│ Social      │  │
│                               │  (Gemini 3.5)    │     │ Queue       │  │
│                               └──────────────────┘     │ (Admin Pub) │  │
│                                                        └─────────────┘  │
│                                        ┌──────────────────┐             │
│                               Optional │  Video Gen       │             │
│                               ────────▶│  (Veo 3.1)      │             │
│                               Admin     └──────────────────┘             │
│                               Click                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Buyer Inquiry Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Buyer on    │────▶│  Lead Form   │────▶│  Rate        │────▶│  Lead        │
│  Marketplace │     │  (Zod Valid) │     │  Limit Check │     │  Created     │
│              │     │              │     │  (Redis)     │     │  status: NEW │
│  Fabric page │     │  /api/v1/    │     │  5/hr/IP     │     │              │
│  / Contact   │     │  leads       │     │              │     │  + Activity  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
                                                                      ▼
                                                             ┌──────────────┐
                                                             │  Admin Lead  │
                                                             │  CRM         │
                                                             │              │
                                                             │  NEW →       │
                                                             │  CONTACTED → │
                                                             │  QUALIFIED → │
                                                             │  CLOSED_WON  │
                                                             └──────────────┘
```

### Admin Dashboard Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD                                   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Dashboard Stats                                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │Fabrics:  │ │AI Proc:  │ │Pending   │ │Queue     │           │   │
│  │  │30 total  │ │11 done   │ │Review:19 │ │Health: 0 │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐ │
│  │  Fabric Management │  │  Social Queue      │  │  Lead CRM          │ │
│  │                    │  │                    │  │                    │ │
│  │  - List            │  │  - Auto-generated  │  │  - Status pipeline │ │
│  │  - Bulk Import     │  │  - AI captions     │  │  - Notes           │ │
│  │  - AI Process      │  │  - Approve/Schedule│  │  - Lead scoring    │ │
│  │  - Approve/Reject  │  │  - Publish         │  │  - Assignment      │ │
│  │  - Generate Video  │  │  - Analytics       │  │  - Activity log    │ │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 18. Configuration & Environment

### Environment Files

| File | Purpose |
|------|---------|
| `.env` | Local development (Postgres, Redis, Auth secrets) |
| `.env.example` | Template with all required/optional vars |
| `.env.production` | Production (Neon Postgres, Railway Redis) |

### Key Environment Variables

```
# Database
DATABASE_URL=postgresql://...
# Redis
REDIS_URL=redis://...
# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
# Admin Bootstrap
ADMIN_EMAIL=admin@tkanmarket.com
ADMIN_PASSWORD=...
# Social Platforms (5 platforms × clientId/clientSecret)
INSTAGRAM_CLIENT_ID=...
FACEBOOK_CLIENT_ID=...
TIKTOK_CLIENT_ID=...
PINTEREST_CLIENT_ID=...
YOUTUBE_CLIENT_ID=...
# Crawler
CRAWLER_PROXY_HOST=geo.iproyal.com
CRAWLER_PROXY_PORT=12321
CRAWLER_PROXY_USERNAME=...
CRAWLER_PROXY_PASSWORD=...
1688_COOKIE=...
CRAWLER_REQUEST_DELAY_MIN=1500
CRAWLER_REQUEST_DELAY_MAX=4000
CRAWLER_WORKER_CONCURRENCY=3
# Google Vertex AI
GOOGLE_VERTEX_AI_PROJECT_ID=...
GOOGLE_VERTEX_AI_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=...
# AI Budget
AI_MONTHLY_BUDGET_USD=100
# Storage
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=tkanmarket
R2_PUBLIC_URL=...
```

### Build Commands (npm scripts)

| Command | What it does |
|---------|-------------|
| `npm run dev` | Next.js dev server on port 3000 |
| `npm run build` | Production build (Turbopack) |
| `npm run build:webpack` | Build with webpack |
| `npm run start` | Production server on port 3000 |
| `npm run lint` | ESLint |
| `npm run typecheck` | Strict tsc for Next app |
| `npm run typecheck:workers` | Strict tsc for workers |
| `npm run typecheck:all` | Both typechecks |
| `npm run db:generate` | Drizzle Kit migration generation |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio GUI |
| `npm run db:seed` | Seed database |
| `npm run build:workers` | Compile workers to dist-workers/ |
| `npm run worker:ai` | Start AI worker |
| `npm run worker:image` | Start image worker |
| `npm run worker:social` | Start social worker |
| `npm run worker:crawler` | Start crawler worker |
| `npm run worker:all` | Start all workers |

---

## 19. Key Design Decisions & Conventions

### Hard Rules (Never Violate)

| Rule | Rationale |
|------|-----------|
| Integer PKs only (no UUID) | Performance, simpler indexing, predictable ordering |
| Every table has created_at/updated_at/deleted_at | Audit trail, soft delete enforcement |
| Soft delete on all user-facing tables | Data recovery, referential integrity |
| snake_case for DB columns | PostgreSQL convention |
| kebab-case for files | Next.js convention |
| PascalCase for components/types | React/TypeScript convention |
| camelCase for functions/variables | JavaScript convention |
| No `any` type — use `unknown` + narrow | Type safety |
| No `console.log` — use logger | Production hygiene, auto-redaction |
| No raw SQL — always Drizzle ORM | Type safety, migration tracking |
| No axios — use native `fetch` | Bundle size, no external dependency |
| No Pages Router — App Router only | Next.js 16 default |
| try/catch on all async functions | Error handling guarantee |
| Zod validate before any DB call | Input validation first |
| Business logic never in API routes | Separation of concerns |
| i18n messages never inline | Maintainability |

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `fabric-card.tsx`, `fabric.service.ts` |
| Components | PascalCase | `FabricCard`, `AdminSidebar` |
| Types/Interfaces | PascalCase | `FabricDetail`, `ApiResponse<T>` |
| Functions | camelCase | `getDb()`, `isFeatureEnabled()` |
| Variables | camelCase | `fabricCount`, `activeFilters` |
| DB columns | snake_case | `created_at`, `supplier_id` |
| Enum values | SCREAMING_SNAKE_CASE | `CLOSED_WON`, `RAW_SCRAPED` |
| API route files | kebab-case | `route.ts` (Next.js convention) |

### Route Design

- **Public pages**: SSR with optional ISR (revalidate: 3600)
- **Admin pages**: SSR with client hydration + TanStack Query
- **API routes**: Thin handlers → service calls
- **Response shape**: `{ success: true, data: T }` or `{ success: false, error: {...} }`

### Code Organization Principles

- **One service per feature** — domain boundaries are clear
- **Admin services prefixed** `admin-*.service.ts` — separate from public services
- **Worker services** in `services/workers/` — not imported by app code
- **33 schema files** — one per domain, exported via barrel
- **101 type files** — no barrel export (explicit imports)
- **Feature flags** drive worker activation, route availability, API access

---

## 20. Current Status & Roadmap

### Implementation Progress by Phase

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Project bootstrap + folder structure | ✅ Completed |
| Phase 2 | Database schema (all 33 tables) | ✅ Completed |
| Phase 3 | API utilities + constants + error classes | ✅ Completed |
| Phase 4 | Fabric service + public API routes | ✅ Completed |
| Phase 5 | Lead service + Lead API | ✅ Completed |
| Phase 6 | Auth (NextAuth) + middleware | ✅ Completed |
| Phase 7 | Public layout (Header, Footer) | ✅ Completed |
| Phase 8 | Homepage | ✅ Completed |
| Phase 9 | Fabric catalog page | ✅ Completed |
| Phase 10 | Fabric detail page | ✅ Completed |
| Phase 11 | Admin layout + sidebar | ✅ Completed |
| Phase 12 | Admin dashboard | ✅ Completed |
| Phase 13 | Admin fabric management | ✅ Completed |
| Phase 14 | Admin Lead CRM | ✅ Completed |
| Phase 15 | Queue infrastructure | ✅ Completed |
| Phase 16 | AI processing worker | ✅ Completed |
| Phase 17 | Crawler worker | ✅ Completed |
| Phase 18 | Social media worker | ✅ Completed |
| Phase 19 | SEO + sitemap | ✅ Completed |
| Phase 20 | Error handling + production config | ✅ Completed |

### Architecture Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Migrated from OpenAI to Google Vertex AI | Cost ($77-95/mo realistic), Gemini quality | AI prompts rewritten, new client library |
| Two TS build graphs | Workers need CommonJS for Node.js, app uses bundler | Clear import boundary enforced |
| Feature flags system | Gradual rollout, disable problematic features | 34 features registrable |
| Soft delete everywhere | Data recovery after accidental deletion | All queries filter `deleted_at IS NULL` |
| Integer PKs | Simpler than UUID, better index performance | FK references use integers |
| No test framework | Not in scope | Manual QA process |
| Cloudflare R2 for storage | S3-compatible, cheaper than AWS S3 | All media uploads go through R2 SDK |
| i18n with static message files | Simple, no external service dependency | 3 locales, ~5000 lines each |

---

*End of System Report*
