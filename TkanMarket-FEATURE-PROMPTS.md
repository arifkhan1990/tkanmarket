# TkanMarket – Step-by-Step Feature Build Prompts for Cursor AI
# Use each section as a separate Cursor AI prompt in order

---

## HOW TO USE THIS FILE

Copy each numbered prompt block into Cursor AI (Cmd+K or chat).
Complete each step fully before moving to the next.
Each prompt builds on the previous one.

---

## ═══════════════════════════════════════════
## PHASE 1: PROJECT FOUNDATION
## ═══════════════════════════════════════════

---

### PROMPT 01 – Project Bootstrap

```
Create a new Next.js 16 project called "tkanmarket" with the following configuration:

1. Use App Router (not Pages Router)
2. TypeScript with strict mode enabled
3. Tailwind CSS configured
4. Install these dependencies:
   - @tanstack/react-query@5
   - drizzle-orm
   - drizzle-kit
   - postgres (pg driver)
   - @auth/nextjs (NextAuth v5)
   - bullmq
   - ioredis
   - zod
   - sonner (toast notifications)
   - lucide-react
   - recharts
   - @radix-ui/react-* (shadcn dependencies)
   - class-variance-authority
   - clsx
   - tailwind-merge
   - openai

5. Initialize Shadcn/UI with the following components: button, input, select, checkbox, dialog, alert-dialog, badge, card, table, tabs, dropdown-menu, avatar, sheet, skeleton, separator, tooltip, popover, calendar, date-picker

6. Configure tsconfig.json with path aliases:
   - @/* → ./src/*

7. Create the full folder structure as defined in cursor-rules.md

8. Create tailwind.config.ts with the brand color palette:
   brand: { 50: '#f0f4ff', 100: '#e0e9ff', 500: '#3b5bdb', 600: '#3451c7', 700: '#2b42a8', 900: '#1a2b6d' }
   neutral: { 50-900 standard scale }
   Font family: Inter (sans), Manrope (heading), JetBrains Mono (mono)

9. Create /src/lib/utils.ts with cn() helper using clsx + tailwind-merge

10. Create /src/lib/logger.ts with structured logger (levels: info, warn, error) that outputs JSON in production and formatted in development.

11. Create .env.example with all required environment variables:
    DATABASE_URL, REDIS_URL, OPENAI_API_KEY, NEXTAUTH_SECRET, NEXTAUTH_URL, CLOUDFLARE_R2_*, INSTAGRAM_*, TIKTOK_*, PINTEREST_*

Do NOT create any placeholder page content yet. Only the project structure and configuration.
```

---

### PROMPT 02 – Database Schema

```
Create the complete Drizzle ORM schema for TkanMarket. All files in /src/db/schema/.

CRITICAL RULE: Every table uses integer('id').generatedAlwaysAsIdentity().primaryKey() — NO exceptions, NO UUIDs as primary keys.

Create these schema files:

FILE: /src/db/schema/users.schema.ts
Table: users
Columns:
- id: integer, PK, auto-increment
- email: text, unique, not null
- name: text, not null
- role: pgEnum('user_role', ['ADMIN', 'SALES', 'VIEWER']), not null, default 'VIEWER'
- avatar_url: text, nullable
- created_at: timestamptz, not null, default now()
- updated_at: timestamptz, not null, default now()
- deleted_at: timestamptz, nullable

---

FILE: /src/db/schema/suppliers.schema.ts
Table: suppliers
Columns:
- id: integer, PK, auto-increment
- name: text, not null
- slug: text, unique, not null
- country: text, not null, default 'China'
- city: text, nullable
- province: text, nullable
- description: text, nullable
- logo_url: text, nullable
- website_url: text, nullable
- verified: boolean, not null, default false
- established_year: integer, nullable
- source_url: text, nullable (original marketplace URL)
- created_at: timestamptz, not null, default now()
- updated_at: timestamptz, not null, default now()
- deleted_at: timestamptz, nullable

---

FILE: /src/db/schema/fabrics.schema.ts
Enum: fabric_status → ['raw_scraped', 'ai_processing', 'ai_processed', 'approved', 'rejected']
Enum: fabric_type → ['woven', 'knit', 'nonwoven', 'lace', 'lining', 'technical', 'other']

Table: fabrics
Columns:
- id: integer, PK, auto-increment
- supplier_id: integer, FK → suppliers.id, not null, ON DELETE RESTRICT
- slug: text, unique, not null
- sku: text, nullable (e.g., TKN-00042)
- status: fabric_status enum, not null, default 'raw_scraped'
- title_ru: text, not null
- title_en: text, nullable
- description_ru: text, nullable
- description_en: text, nullable
- meta_title_ru: text, nullable
- meta_description_ru: text, nullable
- fabric_type: fabric_type enum, nullable
- gsm: integer, nullable (grams per square meter)
- width_cm: integer, nullable
- price_usd: numeric(10,2), nullable (per meter)
- moq: integer, nullable (minimum order quantity in meters)
- composition: jsonb, nullable (array of {material: string, percentage: number})
- tags: text[], nullable
- images: text[], nullable (array of CDN URLs)
- source_url: text, nullable
- raw_title: text, nullable (original from supplier)
- raw_description: text, nullable
- ai_confidence_score: numeric(3,2), nullable (0.00–1.00)
- ai_processed_at: timestamptz, nullable
- is_featured: boolean, not null, default false
- social_score: integer, nullable (0–100)
- views_count: integer, not null, default 0
- created_at: timestamptz, not null, default now()
- updated_at: timestamptz, not null, default now()
- deleted_at: timestamptz, nullable

Table: fabric_categories (many-to-many)
- id: integer, PK
- fabric_id: integer, FK → fabrics.id, ON DELETE CASCADE
- category_slug: text, not null
- created_at: timestamptz

---

FILE: /src/db/schema/leads.schema.ts
Enum: lead_status → ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST']
Enum: lead_source → ['MARKETPLACE_INQUIRY', 'SAMPLE_REQUEST', 'SOCIAL_CAMPAIGN', 'DIRECT_CONTACT', 'MANUAL_ENTRY']

Table: leads
Columns:
- id: integer, PK, auto-increment
- source: lead_source enum, not null
- status: lead_status enum, not null, default 'NEW'
- company_name: text, not null
- contact_name: text, not null
- email: text, not null
- phone: text, nullable
- country: text, not null
- city: text, nullable
- fabric_id: integer, FK → fabrics.id, nullable, ON DELETE SET NULL
- inquiry_text: text, not null
- assigned_to_id: integer, FK → users.id, nullable, ON DELETE SET NULL
- utm_source: text, nullable
- utm_campaign: text, nullable
- utm_medium: text, nullable
- created_at: timestamptz, not null, default now()
- updated_at: timestamptz, not null, default now()
- deleted_at: timestamptz, nullable

Table: lead_notes
Columns:
- id: integer, PK, auto-increment
- lead_id: integer, FK → leads.id, not null, ON DELETE CASCADE
- author_id: integer, FK → users.id, not null, ON DELETE RESTRICT
- content: text, not null
- created_at: timestamptz, not null, default now()

Table: lead_activity_log
Columns:
- id: integer, PK, auto-increment
- lead_id: integer, FK → leads.id, not null, ON DELETE CASCADE
- actor_id: integer, FK → users.id, nullable
- event_type: text, not null (e.g., 'status_changed', 'note_added', 'assigned')
- payload: jsonb, nullable
- created_at: timestamptz, not null, default now()

---

FILE: /src/db/schema/social.schema.ts
Enum: social_platform → ['INSTAGRAM', 'TIKTOK', 'PINTEREST', 'FACEBOOK', 'YOUTUBE']
Enum: social_post_status → ['DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED']
Enum: social_content_type → ['REEL_15', 'REEL_20', 'REEL_30', 'CAROUSEL', 'IMAGE_POST', 'PIN']

Table: social_posts
Columns:
- id: integer, PK, auto-increment
- fabric_id: integer, FK → fabrics.id, not null, ON DELETE CASCADE
- platform: social_platform enum, not null
- content_type: social_content_type enum, not null
- status: social_post_status enum, not null, default 'DRAFT'
- caption_text: text, nullable
- hashtags: text[], nullable
- script_text: text, nullable
- media_urls: text[], nullable
- scheduled_at: timestamptz, nullable
- published_at: timestamptz, nullable
- platform_post_id: text, nullable (ID from platform API after publish)
- reach: integer, nullable
- likes: integer, nullable
- shares: integer, nullable
- link_clicks: integer, nullable
- error_message: text, nullable
- created_at: timestamptz, not null, default now()
- updated_at: timestamptz, not null, default now()

---

FILE: /src/db/schema/crawler.schema.ts
Enum: crawler_job_status → ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL']

Table: crawler_runs
Columns:
- id: integer, PK, auto-increment
- status: crawler_job_status enum, not null, default 'PENDING'
- source: text, not null (e.g., '1688', 'alibaba')
- keywords: text[], not null
- products_found: integer, not null, default 0
- products_saved: integer, not null, default 0
- errors_count: integer, not null, default 0
- triggered_by_id: integer, FK → users.id, nullable
- started_at: timestamptz, nullable
- completed_at: timestamptz, nullable
- error_log: text, nullable
- created_at: timestamptz, not null, default now()

---

Also create:
- /src/db/index.ts: Drizzle connection using 'postgres' driver
- /src/db/schema/index.ts: barrel export of all schemas

Add all necessary indexes:
- fabrics: index on (status, deleted_at), index on (supplier_id), index on (slug), GIN index on (tags), index on (social_score DESC)
- leads: index on (status), index on (assigned_to_id), index on (created_at DESC)
- social_posts: index on (status, scheduled_at), index on (fabric_id)
```

---

### PROMPT 03 – API Response Utilities

```
Create the API utility layer for TkanMarket.

FILE: /src/lib/utils/api-response.ts
Create typed helper functions:
- apiSuccess<T>(data: T, meta?: PaginationMeta): NextResponse
- apiError(code: string, message: string, statusCode: number): NextResponse
- withPagination<T>(items: T[], total: number, page: number, limit: number): PaginatedResponse<T>

Type definitions:
- PaginationMeta: { page, limit, total, totalPages }
- ApiResponse<T>: { success: true, data: T, meta?: PaginationMeta }
- ApiErrorResponse: { success: false, error: { code, message, statusCode } }

FILE: /src/lib/utils/query-params.ts
- parsePaginationParams(searchParams: URLSearchParams): { page: number, limit: number }
  - defaults: page=1, limit=24, max limit=100

FILE: /src/lib/errors/index.ts
Create custom error classes:
- AppError extends Error: { message, code, statusCode }
- NotFoundError extends AppError: statusCode=404, code='NOT_FOUND'
- ValidationError extends AppError: statusCode=400, code='VALIDATION_ERROR'
- AuthError extends AppError: statusCode=401, code='UNAUTHORIZED'
- ForbiddenError extends AppError: statusCode=403, code='FORBIDDEN'

FILE: /src/lib/validations/fabric.validation.ts
Zod schemas:
- FabricQuerySchema: page, limit, sort, material[], gsm_min, gsm_max, width, moq_max, supplier_id, q (search)
- CreateLeadSchema: company_name, contact_name, email, phone?, country, city?, fabric_id?, inquiry_text, source, utm_source?, utm_campaign?

FILE: /src/lib/validations/lead.validation.ts
Zod schema for creating and updating leads.

FILE: /src/constants/index.ts
Export:
- PAGINATION: { DEFAULT_PAGE_SIZE: 24, MAX_PAGE_SIZE: 100 }
- FABRIC_STATUS: enum values as const
- LEAD_STATUS: enum values as const
- LEAD_SOURCE: enum values as const
- SOCIAL_PLATFORM: enum values as const
- CIS_COUNTRIES: string[] list of CIS/Russia country names
- FABRIC_MATERIALS: string[] list (Хлопок, Лён, Полиэстер, etc.)
- QUEUE_NAMES: { CRAWLER: 'crawler_jobs', AI: 'ai_processing_jobs', IMAGE: 'image_processing_jobs', SOCIAL: 'social_media_jobs' }
```

---

## ═══════════════════════════════════════════
## PHASE 2: CORE API ROUTES
## ═══════════════════════════════════════════

---

### PROMPT 04 – Fabric Service & API

```
Create the Fabric service layer and public API routes.

FILE: /src/services/fabric.service.ts
Class or module with functions:

1. list(params: FabricListParams): Promise<PaginatedResult<FabricSummary>>
   - Filter by: status='approved', material (from tags/composition), gsm range, width, moq, supplier_id, search query (full-text on title_ru + description_ru)
   - Sort options: created_at, gsm, price_usd
   - Soft delete filter: deleted_at IS NULL
   - Return FabricSummary DTO (not raw DB row): id, slug, title_ru, fabric_type, gsm, width_cm, price_usd, moq, supplier_name, images[0], tags

2. getBySlug(slug: string): Promise<FabricDetail | null>
   - JOIN with suppliers table
   - Return FabricDetail DTO with all fields + supplier info

3. getRelated(fabricId: number, limit: number = 8): Promise<FabricSummary[]>
   - Same fabric_type OR overlapping tags, exclude self

4. getFeatured(limit: number = 8): Promise<FabricSummary[]>
   - WHERE is_featured = true AND status = 'approved'

5. getCategoryCounts(): Promise<{ category: string; count: number }[]>
   - Group by tags, count approved fabrics per tag

FILE: /src/app/api/v1/fabrics/route.ts
GET handler:
- Parse and validate query params with FabricQuerySchema
- Call FabricService.list()
- Return paginated response

FILE: /src/app/api/v1/fabrics/[id]/route.ts
GET handler:
- Accept either numeric id or slug (check if param is numeric)
- Call FabricService.getBySlug() or getById()
- Return 404 if not found
- Increment views_count in background (non-blocking)

FILE: /src/app/api/v1/fabrics/[id]/related/route.ts
GET handler: return related fabrics

All API routes must:
- Use try/catch with AppError handling
- Validate inputs with Zod
- Return typed responses using apiSuccess/apiError helpers
- Never expose raw database errors
```

---

### PROMPT 05 – Lead API

```
Create the Lead API and service.

FILE: /src/services/lead.service.ts
Functions:
1. create(data: CreateLeadInput): Promise<Lead>
   - Validate email format
   - Create lead record
   - Create first activity log entry (event_type: 'created')
   - Return created lead

2. list(filters: LeadListFilters, pagination): Promise<PaginatedResult<LeadSummary>>
   - Admin only
   - Filter by status, assigned_to_id, source, country, date range
   - Sort by created_at DESC default

3. getById(id: number): Promise<LeadDetail | null>
   - Include lead_notes (ordered by created_at ASC)
   - Include activity log
   - Include assigned user info
   - Include fabric summary if fabric_id set

4. updateStatus(id: number, status: LeadStatus, actorId: number): Promise<Lead>
   - Update status
   - Create activity log entry (event_type: 'status_changed', payload: { from, to })

5. addNote(leadId: number, authorId: number, content: string): Promise<LeadNote>
   - Create note
   - Create activity log entry (event_type: 'note_added')

6. assign(leadId: number, userId: number, actorId: number): Promise<Lead>
   - Update assigned_to_id
   - Create activity log entry (event_type: 'assigned', payload: { to_user_id })

FILE: /src/app/api/v1/leads/route.ts
POST handler (public – no auth required):
- Validate with CreateLeadSchema
- Rate limit: 5 requests per IP per hour (check Redis counter)
- Call LeadService.create()
- Return 201 with lead id

FILE: /src/app/api/v1/admin/leads/route.ts
GET handler (admin auth required):
- Parse filters from query params
- Call LeadService.list()
- Return paginated leads

FILE: /src/app/api/v1/admin/leads/[id]/route.ts
GET: LeadService.getById()
PATCH: Handle different actions based on body:
  - { action: 'update_status', status } → updateStatus()
  - { action: 'add_note', content } → addNote()
  - { action: 'assign', user_id } → assign()
```

---

### PROMPT 06 – Auth Setup

```
Set up NextAuth.js v5 for TkanMarket admin authentication.

FILE: /src/lib/auth/config.ts
Configure NextAuth with:
- Credentials provider (email + password)
- Session strategy: JWT
- User roles from database
- Custom session with user id, role, name

FILE: /src/lib/auth/guards.ts
Create middleware helpers:
- requireAuth(handler): checks session exists
- requireAdmin(handler): checks role is ADMIN or SALES
- requireRole(roles[])(handler): checks specific roles

FILE: /src/app/api/auth/[...nextauth]/route.ts
NextAuth handler

FILE: /src/app/(admin)/layout.tsx
Admin layout that:
- Checks auth on server side (redirect to /login if not authenticated)
- Renders AdminSidebar + AdminTopBar
- Wraps content in main element

FILE: /src/app/(admin)/login/page.tsx
Login page with:
- Email + password form
- Error display
- Redirect to /admin/dashboard on success
- TkanMarket branding

FILE: /src/middleware.ts
Next.js middleware:
- Protect all /admin/* routes (redirect to /admin/login if not authed)
- Apply rate limiting headers to /api/v1/* routes
- Add security headers (X-Frame-Options, X-Content-Type-Options, etc.)
```

---

## ═══════════════════════════════════════════
## PHASE 3: PUBLIC MARKETPLACE UI
## ═══════════════════════════════════════════

---

### PROMPT 07 – Public Layout & Shared Components

```
Build the public marketplace layout and shared components.

FILE: /src/app/(public)/layout.tsx
Public layout wrapping all marketplace pages.
Include: Header, optional TopBanner, Footer

FILE: /src/components/common/Header.tsx
Header component with:
- Logo (text-based with brand styling, links to /)
- Desktop navigation: Каталог | Поставщики | О нас | Контакты
- WhatsApp contact button (icon + phone number)
- Mobile: hamburger → Sheet drawer with nav links
- Sticky on scroll with subtle shadow
- Active link highlighting (usePathname)

FILE: /src/components/common/Footer.tsx
Footer with 4-column grid (collapses on mobile):
- Column 1: Logo, tagline, social icons (Instagram, TikTok, Pinterest) as icon links
- Column 2: Каталог navigation links
- Column 3: Компания links
- Column 4: Контакты (email, telegram, whatsapp)
- Bottom bar: © 2025 TkanMarket | Privacy Policy | Terms

FILE: /src/components/common/Breadcrumb.tsx
- Props: items: { label: string; href?: string }[]
- Renders with "/" separator
- Uses Next.js Link for linked items
- Last item is not a link
- Schema.org BreadcrumbList JSON-LD output

FILE: /src/components/common/StatusBadge.tsx
- Maps FabricStatus and LeadStatus to colored Shadcn Badge
- raw_scraped: gray | ai_processed: blue | approved: green | rejected: red
- NEW: yellow | CONTACTED: blue | QUALIFIED: purple | CLOSED_WON: green | CLOSED_LOST: red

FILE: /src/components/marketplace/FabricCard.tsx
Fabric card component as specified in FRONTEND-PRD.md:
- Image with next/image, aspect-ratio 4/3
- Fabric type badge (top-left of image)
- Title (2 lines max, ellipsis)
- Supplier name with icon
- Spec chips: GSM, width, composition summary
- Price + MOQ
- "Подробнее" button + sample request icon button
- Links to /fabrics/[slug] on click
- Loading skeleton variant: FabricCardSkeleton

FILE: /src/hooks/useFabricQuery.ts
TanStack Query hook:
- useFabrics(filters: FabricFilters) → paginated catalog
- useFabric(slug: string) → single fabric detail
- useRelatedFabrics(fabricId: number)
- useFeaturedFabrics()
- staleTime: 5 minutes for catalog, 1 hour for detail
```

---

### PROMPT 08 – Homepage

```
Build the TkanMarket homepage at /src/app/(public)/page.tsx

This is a SERVER COMPONENT (async function). Fetch featured fabrics and category counts on the server.

Build these sections in order:

1. HeroSection component (/src/components/marketplace/HeroSection.tsx)
   - Full-width, min-height: 500px
   - Headline H1: "Найдите идеальную ткань для вашего производства" 
   - Subheadline about sourcing from China to Russia/CIS
   - Two CTA buttons: "Смотреть каталог" and "Запросить образец"
   - Trust indicators: 3 checkmarks with stats
   - Background: gradient from brand-50 to white with subtle textile pattern SVG overlay

2. HomeSearchBar component (/src/components/marketplace/HomeSearchBar.tsx)
   - CLIENT COMPONENT
   - Large search input with icon
   - On submit: navigate to /fabrics?q=[value]
   - Quick filter chips below: Хлопок, Лён, Полиэстер, Шёлк, Шерсть, Трикотаж
   - Each chip navigates to /fabrics?material=[value]

3. CategoryGrid component (/src/components/marketplace/CategoryGrid.tsx)
   - 6 category cards in responsive grid (3 col desktop, 2 tablet, 1 mobile)
   - Categories: Хлопковые, Льняные, Синтетические, Шёлковые, Шерстяные, Трикотаж
   - Each card has: colored background, icon, name, count badge
   - Show count from server-fetched getCategoryCounts()
   - Links to /fabrics?material=[value]

4. FeaturedFabricsSection component (/src/components/marketplace/FeaturedFabricsSection.tsx)
   - Section heading + "Смотреть все" link
   - 8 featured fabrics from server fetch
   - 4 column grid → FabricCard components
   - Loading handled by Suspense with FabricCardSkeleton

5. HowItWorksSection component (/src/components/marketplace/HowItWorksSection.tsx)
   - 4 steps with icons, titles, descriptions
   - Steps: Найдите → Запросите образец → Оцените качество → Оформите заказ
   - Desktop: horizontal flow with connecting lines
   - Mobile: vertical list

6. TrustStatsSection component
   - Dark brand-500 background
   - 4 stats: 10,000+ тканей, 500+ поставщиков, 1,000+ покупателей, 50+ стран
   - CTA button

7. HomeLeadForm component (/src/components/forms/HomeLeadForm.tsx)
   - CLIENT COMPONENT
   - 2-column form grid (stacks on mobile)
   - Fields: company, name, email, phone, country (select), message
   - Submits to POST /api/v1/leads with source: 'DIRECT_CONTACT'
   - Shows success message on submit (no page reload)
   - Uses react-hook-form + Zod validation

Page meta (generateMetadata):
- title: "TkanMarket – Каталог тканей от китайских поставщиков"
- description: "Найдите ткани для производства: хлопок, лён, полиэстер и другие материалы. Прямые поставки из Китая в Россию и СНГ."
- OpenGraph image placeholder
```

---

### PROMPT 09 – Fabric Catalog Page

```
Build the fabric catalog page at /src/app/(public)/fabrics/page.tsx

This is a SERVER COMPONENT. Filters come from searchParams.

1. Parse searchParams into FabricFilters using FabricQuerySchema
2. Fetch fabrics from FabricService.list() on server with filters
3. Fetch category counts for filter sidebar

PAGE LAYOUT:
- Breadcrumb: Главная / Каталог тканей
- 2-column layout: FilterSidebar (280px, hidden on mobile) + main content area
- Mobile: FilterDrawer accessible via floating filter button

BUILD THESE COMPONENTS:

FILE: /src/components/marketplace/FilterSidebar.tsx
CLIENT COMPONENT (uses useState for accordion open/close)
Props: currentFilters: FabricFilters, categoryCounts: CategoryCount[]

Filter groups (each is a collapsible accordion section):
1. Материал – checkboxes for each material from FABRIC_MATERIALS constant
2. Тип ткани – checkboxes: Трикотаж, Тканая, Нетканая, Кружево, Подкладочная
3. Плотность (GSM) – two number inputs: "от" / "до"
4. Ширина – radio buttons: < 100cm, 100–140cm, 140–160cm, > 160cm
5. МИН. ЗАКАЗ – radio: < 50м, 50–200м, 200–500м, 500м+

Each filter change:
- Updates URL search params using useRouter().push() with updated params
- Does NOT use useState for filter values (URL is source of truth)
- Read filter values from props (server-passed currentFilters)

"Сбросить все" button at top: navigates to /fabrics (clears all params)

FILE: /src/components/marketplace/ActiveFilterTags.tsx
CLIENT COMPONENT
- Reads currentFilters prop
- Renders dismissible tag for each active filter
- Remove button on each tag updates URL params

FILE: /src/components/marketplace/SortBar.tsx
CLIENT COMPONENT
- Props: total: number, currentSort: string
- Left: "Найдено {total} тканей"
- Right: sort select (По умолчанию, Сначала новые, Цена ↑, Цена ↓)
- Changing sort: updates URL params

FILE: /src/components/marketplace/FabricGrid.tsx
SERVER COMPONENT
- Renders grid of FabricCard components
- 3 col desktop, 2 tablet, 1 mobile
- EmptyState if no fabrics found

FILE: /src/components/marketplace/Pagination.tsx
CLIENT COMPONENT
- Shows page numbers with ellipsis for large page counts
- Previous / Next buttons
- Updates URL ?page= param on click

Mobile filter button:
- Fixed bottom-right floating button on mobile
- Opens FilterDrawer (Shadcn Sheet from bottom)
- Shows active filter count badge

Page generateMetadata:
- Dynamic title based on active filters
- e.g., "Хлопковые ткани – Каталог | TkanMarket"
```

---

### PROMPT 10 – Fabric Detail Page

```
Build the fabric detail page at /src/app/(public)/fabrics/[slug]/page.tsx

RENDERING: generateStaticParams for top 500 most-viewed fabrics. revalidate: 3600. 
Fall through to SSR for non-pre-generated slugs.

generateStaticParams: fetch top 500 fabrics by views_count DESC, return { slug } array.

SERVER COMPONENT:
- Fetch fabric by slug using FabricService.getBySlug()
- If not found: notFound() (renders 404 page)
- Fetch related fabrics in parallel: FabricService.getRelated()

BUILD THESE COMPONENTS:

FILE: /src/components/marketplace/ImageGallery.tsx
CLIENT COMPONENT
Props: images: string[], title: string

- Main image: next/image, aspect-ratio 1:1, max-width 600px
- Thumbnail strip below: 80×80px each, rounded-lg, border on selected
- Click thumbnail → swap main image (useState)
- Click main image → open Lightbox
- Lightbox: full-screen dialog with zoom + prev/next navigation

FILE: /src/components/marketplace/ProductInfoPanel.tsx
CLIENT COMPONENT (for modal open/close)
Props: fabric: FabricDetail

Top to bottom:
- Fabric type + category badges
- H1 title (fabric.title_ru)
- SKU text (fabric.sku)
- Price block: "от $X.XX / метр" + MOQ
- Quick spec grid (2×2): GSM, Width, Composition, Type
- "Запросить образец" button (primary, full width)
- "Запрос оптовой партии" button (outline, full width)
- Trust badges row: 3 icons with labels
- Supplier mini-card: logo, name, verified badge, link to supplier profile

FILE: /src/components/marketplace/ProductTabs.tsx
CLIENT COMPONENT (for tab switching)
Props: fabric: FabricDetail

Tab 1 – Описание: render fabric.description_ru in a styled prose div
Tab 2 – Характеристики: full spec table (GSM, Width, Composition, Type, MOQ, Price, etc.)
Tab 3 – Поставщик: supplier info card with link to full supplier profile

FILE: /src/components/forms/SampleRequestModal.tsx
CLIENT COMPONENT
Props: fabric: { id, title_ru }, isOpen: boolean, onClose: () => void

- Shadcn Dialog component
- Pre-filled fabric reference shown at top
- Form fields: company_name, contact_name, email, phone, country (select CIS_COUNTRIES), city, inquiry_text (textarea)
- react-hook-form + Zod validation (CreateLeadSchema)
- On submit: POST /api/v1/leads with source='SAMPLE_REQUEST', fabric_id
- Show loading spinner on submit button
- On success: show success message in modal

FILE: /src/components/forms/BulkInquiryModal.tsx
Similar to SampleRequestModal but for bulk orders.
Additional fields: required_quantity (meters), target_price, timeline.
source='MARKETPLACE_INQUIRY'

FILE: /src/components/marketplace/RelatedFabrics.tsx
SERVER COMPONENT
Props: fabrics: FabricSummary[]
- Section heading + horizontal scroll carousel on mobile
- 4-column grid on desktop
- FabricCard components

GENERATE PAGE METADATA:
- title: fabric.meta_title_ru || fabric.title_ru + " | TkanMarket"
- description: fabric.meta_description_ru
- OpenGraph: title, description, image (fabric.images[0])
- JSON-LD: Product schema with name, image, description, offers (price, currency, availability)
```

---

## ═══════════════════════════════════════════
## PHASE 4: ADMIN DASHBOARD UI
## ═══════════════════════════════════════════

---

### PROMPT 11 – Admin Layout & Sidebar

```
Build the admin dashboard layout.

FILE: /src/app/(admin)/layout.tsx
Server component. Checks auth (redirect to /admin/login if not authenticated).
Renders:
- AdminSidebar (fixed left, 240px wide)
- AdminTopBar (fixed top, full width minus sidebar)
- Main content area (ml-[240px], pt-[60px], bg-neutral-50, min-h-screen)

FILE: /src/components/admin/AdminSidebar.tsx
CLIENT COMPONENT (for collapse state)
Props: currentPath: string

Sidebar sections with nav items:
- Brand logo at top
- Nav items with icons (Lucide React) and labels
- Active state: bg-brand-100, text-brand-700, left border brand-500
- Hover state: bg-neutral-100
- Collapsible to icon-only mode (toggle button)
- Sections with separators

Nav items (with badge counts fetched from API):
- 📊 Dashboard → /admin/dashboard
- 🧵 Все ткани → /admin/fabrics
- 🧵 На проверке → /admin/fabrics?status=ai_processed (with pending count badge)
- 🏭 Поставщики → /admin/suppliers
- 📋 Все лиды → /admin/leads
- 📋 Мои лиды → /admin/leads?assigned=me
- 📱 Контент → /admin/social
- 🤖 Краулер → /admin/crawler
- ⚙️ Настройки → /admin/settings

FILE: /src/components/admin/AdminTopBar.tsx
CLIENT COMPONENT
- Fixed top bar with z-index above content
- Left: Page title (from context or route)
- Right: Notification bell icon | User avatar with dropdown menu
- Dropdown: Profile | Logout

FILE: /src/components/admin/StatsCard.tsx
Props: title, value (number or string), change (%, optional), icon (LucideIcon), color ('blue'|'green'|'yellow'|'red')
- Rounded card, white bg, shadow-sm
- Icon with colored background
- Value in large bold text
- Change indicator: green arrow up or red arrow down
```

---

### PROMPT 12 – Admin Dashboard Page

```
Build /src/app/(admin)/dashboard/page.tsx

SERVER COMPONENT. Fetch all stats in parallel using Promise.all().

Stats to fetch (create /src/services/stats.service.ts):
- getFabricStats(): { total, pending_review, ai_processing, published_today }
- getLeadStats(): { total, new_today, open, closed_won_this_month }
- getSocialStats(): { posts_this_week, scheduled, published_total }
- getCrawlerStats(): { last_run_at, last_run_status, products_found_last_run }

LAYOUT:
Row 1 – 4 StatsCard (Fabric stats)
Row 2 – 4 StatsCard (Lead stats)  
Row 3 – 4 StatsCard (Social + Crawler stats)

Row 4 – 2 column charts:
- Left chart: Fabrics published per day (last 30 days) – Recharts LineChart
- Right chart: Leads by source (last 30 days) – Recharts BarChart

Build chart components:
FILE: /src/components/admin/charts/FabricsPublishedChart.tsx
CLIENT COMPONENT – Recharts LineChart
Props: data: { date: string; count: number }[]

FILE: /src/components/admin/charts/LeadsBySourceChart.tsx
CLIENT COMPONENT – Recharts BarChart
Props: data: { source: string; count: number }[]

Row 5 – Activity Feed:
FILE: /src/components/admin/ActivityFeed.tsx
CLIENT COMPONENT (auto-refreshes every 30s via TanStack Query)
- Fetches last 20 system events from GET /api/v1/admin/activity
- Each event: icon based on event_type, message, relative timestamp
- Create /src/app/api/v1/admin/activity/route.ts endpoint
```

---

### PROMPT 13 – Admin Fabric Management

```
Build the admin fabric management pages.

FILE: /src/app/(admin)/fabrics/page.tsx
SERVER COMPONENT. 
- Parse status filter from searchParams
- Fetch fabrics with pagination using AdminFabricService

Build /src/services/admin-fabric.service.ts:
1. list(filters, pagination): admin version shows ALL fabrics including non-approved
2. approve(id: number, adminId: number): update status to 'approved', log activity
3. reject(id: number, reason: string, adminId: number): update status to 'rejected', log
4. bulkApprove(ids: number[], adminId: number): transaction, approve all
5. bulkReject(ids: number[], reason: string, adminId: number): transaction

FILE: /src/components/admin/FabricManagementTable.tsx
CLIENT COMPONENT
- TanStack Table with columns:
  □ (checkbox) | # | Thumb | Title | Supplier | Status Badge | GSM | MOQ | Date | Actions
- Row selection (for bulk actions)
- Bulk action bar (appears when rows selected): Approve | Reject buttons
- Individual row actions: Approve ✓ | Reject ✗ | Edit ✏️ | View 👁️
- Clicking Approve/Reject triggers API call with optimistic update
- Pagination controls below table
- Search input above table (debounced, 300ms)

Status tab filter bar above table:
- All | На проверке (pending) | AI обработка | Одобрено | Отклонено
- Each tab shows count badge

FILE: /src/app/(admin)/fabrics/[id]/page.tsx
SERVER COMPONENT. Fetch fabric by ID with all fields including raw data.

FILE: /src/components/admin/FabricEditForm.tsx
CLIENT COMPONENT
Props: fabric: AdminFabricDetail

Form with all editable fields (see FRONTEND-PRD.md Admin Page 03):
- Title RU/EN textareas
- Description RU textarea (large)
- Fabric Type select
- GSM, Width, MOQ, Price number inputs
- Composition dynamic rows: [Material input] [% input] [Remove button] + Add row button
- Tags input (comma-separated → stored as array)
- Is Featured toggle (Shadcn Switch)

Save on submit: PATCH /api/v1/admin/fabrics/[id]

Action bar (top of page):
- Back button → /admin/fabrics
- Approve button (green): PATCH status to 'approved'
- Reject button (red): opens RejectionModal (textarea for reason, then PATCH)
- View on marketplace link (if approved)

AI Confidence Panel (sidebar card):
- Shows ai_confidence_score as percentage with color coding
- Lists each extracted field and its confidence
- Fields below 0.7 confidence highlighted in amber
```

---

### PROMPT 14 – Admin Lead CRM

```
Build the admin Lead CRM pages.

FILE: /src/app/(admin)/leads/page.tsx
SERVER COMPONENT + CLIENT tabs

Default view: Kanban board (CLIENT COMPONENT)
Toggle to: Table view

FILE: /src/components/admin/LeadKanbanBoard.tsx
CLIENT COMPONENT
- Fetch leads grouped by status: GET /api/v1/admin/leads?view=kanban
- 6 columns: NEW | CONTACTED | QUALIFIED | PROPOSAL_SENT | NEGOTIATING | CLOSED
- Each column shows count badge and scrollable card list
- No drag-and-drop (Phase 2 feature) – use status dropdown on LeadCard

FILE: /src/components/admin/LeadCard.tsx (kanban card)
- Company name (bold)
- Contact name + email
- Lead source badge (colored)
- Created date (relative)
- Assigned user avatar
- Fabric name if set (truncated)
- Click → /admin/leads/[id]

FILE: /src/components/admin/LeadTableView.tsx
CLIENT COMPONENT – TanStack Table
Columns: # | Company | Contact | Email | Source | Status | Country | Assigned | Created | Actions

FILE: /src/app/(admin)/leads/[id]/page.tsx
SERVER COMPONENT

2-column layout:

Left column (lead details):
- Contact info card: name, company, email, phone, country, city
- Lead source + UTM info
- Fabric of interest (link)
- Status select (CLIENT – changes via API call)
- Assign to select (CLIENT – list of sales users)

Right column (activity + notes):
FILE: /src/components/admin/LeadActivityTimeline.tsx
CLIENT COMPONENT (TanStack Query, refetch every 30s)
- Timeline list of all lead_activity_log entries + lead_notes
- Sorted by created_at ASC
- Each entry: user avatar, action description, timestamp
- Status changes: "Статус изменён с NEW на CONTACTED"
- Notes: shown with full text + author

FILE: /src/components/admin/AddNoteForm.tsx
CLIENT COMPONENT
- Textarea + Submit button
- POST /api/v1/admin/leads/[id] with { action: 'add_note', content }
- Optimistic update: show note immediately, revert if error
```

---

## ═══════════════════════════════════════════
## PHASE 5: BACKGROUND WORKERS & AI PIPELINE
## ═══════════════════════════════════════════

---

### PROMPT 15 – Queue Infrastructure

```
Set up BullMQ queue infrastructure.

FILE: /src/lib/redis/client.ts
- Create and export Redis client using ioredis
- Handle connection errors with retry logic
- Export as singleton

FILE: /src/lib/queue/definitions.ts
Import QUEUE_NAMES from constants.
Create and export:
- crawlerQueue: Queue instance for QUEUE_NAMES.CRAWLER
- aiQueue: Queue instance for QUEUE_NAMES.AI
- imageQueue: Queue instance for QUEUE_NAMES.IMAGE
- socialQueue: Queue instance for QUEUE_NAMES.SOCIAL

Each queue configured with:
- defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 100, removeOnFail: 500 }

FILE: /src/lib/queue/helpers.ts
Helper functions:
- addCrawlerJob(payload: CrawlerJobPayload): Promise<Job>
- addAIJob(fabricId: number, priority?: number): Promise<Job>
- addImageJob(fabricId: number, imageUrls: string[]): Promise<Job>
- addSocialJob(fabricId: number): Promise<Job>
- getQueueStats(): Promise<{ [queueName]: { waiting, active, completed, failed } }>

FILE: /src/types/queue.types.ts
All job payload types:
- CrawlerJobPayload: { jobId, keywords, source, maxProducts }
- AIJobPayload: { jobId, entityId: number (fabricId), entityType: 'fabric', priority }
- ImageJobPayload: { jobId, entityId: number, imageUrls: string[] }
- SocialJobPayload: { jobId, entityId: number, platforms: SocialPlatform[] }

FILE: /src/app/api/v1/admin/queues/route.ts
GET endpoint returning queue stats (for dashboard display).
Admin auth required.
```

---

### PROMPT 16 – AI Processing Worker

```
Build the AI processing worker.

FILE: /src/lib/openai/client.ts
- Initialize and export OpenAI client
- Export helper: callOpenAI(messages, options) with error handling and retry

FILE: /src/lib/openai/prompts/fabric-enrichment.ts
Export a function buildFabricEnrichmentPrompt(rawProduct: RawFabric): ChatMessage[]

System prompt:
"You are an expert textile product data specialist. Your task is to analyze raw fabric product data from Chinese suppliers and extract/generate structured information. Always respond with valid JSON only, no other text."

User prompt template that includes: raw title, raw description, raw composition, source URL.

Expected JSON response structure matches AIProcessedProduct type.

FILE: /src/services/ai.service.ts
Functions:

1. processFabric(fabricId: number): Promise<AIProcessingResult>
   Steps:
   a. Fetch raw fabric from DB
   b. Build prompt
   c. Call OpenAI API (GPT-4o, response_format: json_object)
   d. Parse and validate response
   e. Calculate confidence score based on completeness of extraction
   f. Update fabric record with AI results and status='ai_processed'
   g. Log processing result
   h. If confidence < 0.6: add flag for mandatory review

2. generateSocialContent(fabricId: number, platform: SocialPlatform): Promise<SocialContent>
   Generate: caption, hashtags, reel script for given platform
   
3. generateBlogPost(fabricId: number): Promise<{ title: string; content: string }>

FILE: /src/workers/ai.worker.ts
BullMQ Worker for ai_processing_jobs queue:

- Process AIJobPayload
- Call AIService.processFabric(entityId)
- On success: add image job to image queue
- On failure: update fabric record with error, log failure
- Concurrency: 5
- Include job progress updates: job.updateProgress(percentage)

FILE: /src/workers/index.ts
Start all workers (single entry point for worker process).
Handle graceful shutdown (SIGTERM, SIGINT).
```

---

### PROMPT 17 – Crawler Worker

```
Build the supplier crawler worker.

FILE: /src/services/crawler.service.ts

Functions:
1. createRun(params: CreateCrawlerRunParams): Promise<CrawlerRun>
   - Create crawler_runs record
   
2. scrapeProducts(runId: number, keywords: string[], source: string, maxProducts: number): Promise<void>
   - Launch Playwright browser
   - For each keyword: search on source (1688/Alibaba)
   - Extract product listings from search results
   - For each product URL: scrape product details
   - Deduplicate by URL hash (check if source_url already exists in DB)
   - Save new products as raw fabric records with status='raw_scraped'
   - Queue AI processing job for each new product
   - Update crawler_run record with progress

3. extractProductData(page: Page, url: string): Promise<RawProductData>
   Playwright-based extraction:
   - Navigate to URL
   - Wait for product content to load
   - Extract: title, description, images, price, MOQ, composition info
   - Handle Chinese characters in content

4. extractSupplierData(page: Page): Promise<RawSupplierData>
   Extract supplier info from product page sidebar.

FILE: /src/workers/crawler.worker.ts
BullMQ Worker:
- Process CrawlerJobPayload
- Launch CrawlerService
- Update crawler_run status throughout
- On completion: log summary
- Concurrency: 3 (3 parallel crawlers max)

FILE: /src/app/api/v1/admin/crawler/run/route.ts
POST handler (admin only):
- Body: { keywords: string[], source: 'alibaba'|'1688'|'both', max_products: number }
- Validate inputs
- Create CrawlerRun record
- Add to crawlerQueue
- Return runId for status polling

FILE: /src/app/api/v1/admin/crawler/status/[runId]/route.ts
GET handler: return crawler_run record with current status and counts.
```

---

### PROMPT 18 – Social Media Worker

```
Build the social media automation system.

FILE: /src/services/social.service.ts

Functions:
1. scoreForSocial(fabric: Fabric): number
   Scoring algorithm (0-100):
   - images.length >= 3: +20 points
   - gsm is not null: +10 points
   - tags includes known trending materials: +15 points
   - composition includes premium materials (silk, linen, cashmere): +20 points
   - moq <= 100: +15 points
   - is_featured: +20 points
   Clamp to 0-100. Update fabric.social_score in DB.

2. createContentJob(fabricId: number): Promise<void>
   - Check social score >= 50
   - Add social_media_jobs to queue for each configured platform

3. generatePlatformContent(fabricId: number, platform: SocialPlatform): Promise<SocialPostDraft>
   - Fetch fabric with images
   - Build platform-specific prompt
   - Call OpenAI to generate: caption, hashtags (count varies by platform), reel script (if video)
   - Save social_posts record with status='DRAFT'

4. schedulePost(postId: number, scheduledAt: Date): Promise<void>
   - Update social_post status to 'SCHEDULED' and scheduled_at

5. publishPost(postId: number): Promise<void>
   - Fetch post record
   - Call platform API to publish (stubbed – real API integration Phase 2)
   - Update status to 'PUBLISHED', store platform_post_id

FILE: /src/workers/social.worker.ts
BullMQ Worker:
- Process SocialJobPayload
- Call SocialService.generatePlatformContent()
- Handle failures gracefully
- Concurrency: 2

FILE: /src/app/api/v1/admin/social/queue/route.ts
GET: paginated social_posts list with filters (platform, status)

FILE: /src/app/api/v1/admin/social/[id]/approve/route.ts
PATCH: update social_post status to 'APPROVED'

FILE: /src/app/api/v1/admin/social/[id]/schedule/route.ts
PATCH: set scheduled_at and status to 'SCHEDULED'
```

---

## ═══════════════════════════════════════════
## PHASE 6: POLISH & PRODUCTION READINESS
## ═══════════════════════════════════════════

---

### PROMPT 19 – SEO & Sitemap

```
Implement SEO infrastructure for TkanMarket.

FILE: /src/app/sitemap.ts
Next.js sitemap generator:
- Static pages: /, /fabrics, /suppliers, /contact
- Dynamic fabric pages: fetch all approved fabric slugs from DB, generate entries
- Dynamic supplier pages: fetch all supplier slugs
- lastModified: fabric.updated_at for dynamic pages
- changeFrequency: 'daily' for catalog, 'weekly' for detail pages
- priority: 1.0 for homepage, 0.8 for catalog, 0.7 for detail pages

FILE: /src/app/robots.ts
Next.js robots.ts:
- Allow all crawlers on public pages
- Disallow: /admin/*, /api/*

FILE: /src/lib/utils/seo.ts
Helper functions:
- generateFabricMetadata(fabric: FabricDetail): Metadata
  Returns Next.js Metadata object with title, description, OG, Twitter card
- generateFabricJsonLd(fabric: FabricDetail): object
  Returns Product schema JSON-LD object
- generateSupplierJsonLd(supplier: SupplierDetail): object
  Returns Organization/LocalBusiness JSON-LD

Add JSON-LD scripts to fabric detail page using <script type="application/ld+json">
```

---

### PROMPT 20 – Error Handling & Production Config

```
Add production-grade error handling and configuration.

FILE: /src/app/error.tsx
Global error boundary for unexpected errors.
- Shows user-friendly error page with "Вернуться на главную" button
- Logs error details (in production: send to error tracking)

FILE: /src/app/not-found.tsx
Custom 404 page:
- Clear message in Russian: "Страница не найдена"
- Suggest alternatives: browse catalog, go to homepage
- Search bar component

FILE: /src/app/(public)/fabrics/[slug]/not-found.tsx
Specific 404 for fabric pages:
- "Ткань не найдена"
- Link to browse similar fabrics
- Home search bar

FILE: /src/lib/logger.ts
Production-grade structured logger:
- In development: console.log with colors and formatting
- In production: JSON structured output (compatible with log aggregators)
- Levels: debug, info, warn, error
- Include: timestamp, level, message, context object
- Never log: email addresses, passwords, API keys (sanitize automatically)

FILE: /src/middleware.ts (update)
Add:
- Security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy)
- Rate limiting on /api/v1/leads (5 req/hour per IP using Redis counter)
- Rate limiting on /api/v1/* public endpoints (100 req/min per IP)

FILE: /src/lib/utils/rate-limit.ts
Rate limit helper using Redis:
- checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }>
- Uses Redis INCR + EXPIRE pattern

FILE: next.config.ts (update)
Add:
- Image domains for supplier image CDNs (alibaba, 1688, etc.)
- Content Security Policy headers
- Bundle analyzer setup (ANALYZE=true env flag)
- Compression enabled
```

---

## FINAL CHECKLIST BEFORE LAUNCH

```
Run through this checklist before deployment:

FUNCTIONALITY
□ All public pages load without errors
□ Fabric catalog filters work correctly (test each filter combination)
□ Fabric detail pages load and image gallery works
□ Sample request form submits and creates lead in DB
□ Admin login works
□ Admin can approve/reject fabrics
□ Admin can view and update leads
□ Crawler can be triggered manually from admin
□ AI processing queue works (test with 1 fabric)
□ Social content queue generates drafts

PERFORMANCE
□ Run Lighthouse on homepage – target: Performance > 90
□ Run Lighthouse on catalog page – target: Performance > 85
□ Check fabric catalog loads in < 2s on throttled 4G
□ Verify no N+1 database queries (use DB query logging in development)
□ All images use next/image with explicit dimensions
□ Check bundle size: no unnecessary large libraries

SEO
□ Homepage has correct H1 and meta tags
□ Fabric detail pages have JSON-LD Product schema
□ Sitemap.xml generates correctly and includes all fabrics
□ Robots.txt is correct
□ All images have alt text

SECURITY
□ All admin routes redirect to login when not authenticated
□ Public API cannot access admin data
□ Lead creation endpoint is rate limited
□ No secrets in client-side code
□ No sensitive data in browser console

DATABASE
□ All tables have integer PKs (verify with: SELECT column_name, data_type FROM information_schema.columns WHERE column_name = 'id')
□ All foreign key indexes exist
□ Soft delete filter applied to all public queries
□ Database migrations are up to date

CODE QUALITY
□ TypeScript compiles with zero errors (tsc --noEmit)
□ ESLint passes with zero warnings
□ No console.log statements in production code
□ All TODO comments have ticket references
```
