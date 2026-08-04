# Raw Data Processing Pipeline — Architecture Document

## 1. System Overview

TkanMarket operates a multi-stage data processing pipeline that transforms raw supplier data into enriched, AI-generated catalog entries with associated media assets. The pipeline is designed around the principle that raw data from any source (crawler, manual upload, bulk import) must be stored intact before any processing occurs, and all AI-generated outputs must be traceable back to their source.

### Core Philosophy

| Principle | Implementation |
|-----------|---------------|
| **Raw data immutability** | Original data is never modified — stored as-is in immutable tables |
| **Full processing lineage** | Every AI-generated record links back to its raw source |
| **Media durability** | All generated images/videos are stored in R2 with database references |
| **Decoupled processing** | BullMQ queues ensure async, observable, retryable processing |
| **Soft delete everywhere** | No hard deletes on catalog, media, or import records |
| **Observability** | Activity logs on every entity, queue metrics, error tracking |

---

## 2. Raw Data Ingestion Layer

### 2.1 Entry Points

Raw data enters the system through three distinct paths:

#### A. Crawler (Automated)
- **Worker**: `crawler.worker.ts` → `crawler.service.ts`
- **Queue**: `crawler_jobs`
- **Output**: Inserts into `raw_products` table and `crawler_runs` tracking record
- **Flow**: Keywords + Source → Playwright scrape → Parse → Store raw data + Create crawler run log

#### B. Bulk Excel Import (Admin)
- **API**: `POST /api/v1/admin/bulk-imports`
- **Service**: `AdminBulkImportService.createFromExcel()`
- **Flow**: Excel upload → Parse rows → Validate → Group by supplier → Create fabrics in `fabrics` table with `status = 'raw_scraped'` → Enqueue AI jobs → Enqueue translation jobs
- **Tracking**: `bulk_import_jobs` table records batch status

#### C. Manual Admin Upload (Future — needs schema)
- **Gap**: No dedicated "admin file upload" table exists yet. Currently bulk import and crawler are the only ingestion paths. A dedicated upload endpoint with its own tracking table is needed for the "original/raw data" source requested.

### 2.2 The `raw_products` Table (Current Raw Storage)

```
raw_products
├── id                  integer PK (auto-increment)
├── source              text NOT NULL        (e.g. 'alibaba', '1688', 'manual')
├── productUrl          text NOT NULL UNIQUE
├── urlHash             text NOT NULL UNIQUE
├── rawTitle            text NOT NULL
├── rawDescription      text
├── rawComposition      text
├── rawImages           text[] (array of URLs)
├── supplierName        text
├── priceText           text
├── moqText             text
├── sourceLanguage      enum ('zh', 'en') NOT NULL DEFAULT 'zh'
├── createdAt           timestamptz NOT NULL DEFAULT now()
├── updatedAt           timestamptz NOT NULL DEFAULT now()
└── deletedAt           timestamptz (soft delete)
```

**Why this table matters**: It is the immutable record of what was scraped/collected before any transformation. The `raw_` prefix on columns guarantees that the original values are never overwritten by AI processing.

### 2.3 The `crawler_runs` Table (Crawler Tracking)

```
crawler_runs
├── id                  integer PK
├── status              enum NOT NULL       (PENDING/RUNNING/COMPLETED/FAILED/PARTIAL)
├── source              text NOT NULL
├── keywords            text[] NOT NULL
├── productsFound       integer NOT NULL DEFAULT 0
├── productsSaved       integer NOT NULL DEFAULT 0
├── errorsCount         integer NOT NULL DEFAULT 0
├── triggeredById       integer FK → users
├── startedAt           timestamptz
├── completedAt         timestamptz
├── errorLog            text
├── createdAt           timestamptz NOT NULL DEFAULT now()
└── updatedAt           timestamptz NOT NULL DEFAULT now()
```

---

## 3. AI Processing Layer

### 3.1 Processing States on `fabrics`

The `fabrics` table has a `status` enum that tracks where each record is in the pipeline:

```
raw_scraped → ai_processing → ai_processed → approved / rejected
```

- **`raw_scraped`**: Data entered but not yet AI-processed. This is the "raw" state.
- **`ai_processing`**: Currently being processed by the AI worker.
- **`ai_processed`**: AI enrichment complete. Data is enriched with English fields, confidence score, etc.
- **`approved`**: Admin has reviewed and approved the AI output.
- **`rejected`**: Admin has rejected — may be re-processed after edits.

### 3.2 The AI Worker Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  ai_queue (ai_processing_jobs)                                 │
│                                                                 │
│  Job Payload:                                                  │
│  { jobId, entityId, entityType: 'fabric', priority }           │
│                                                                 │
│  Worker: ai.worker.ts                                          │
│  ├── AIService.processFabric(entityId)                         │
│  │   ├── Read fabric from DB (all raw + enriched fields)       │
│  │   ├── Check for matching TextPromptRule                     │
│  │   ├── Build prompt (custom rule OR default)                 │
│  │   ├── Call Gemini (gemini-3.6-flash)                       │
│  │   ├── Parse + validate response via Zod                     │
│  │   ├── Compute confidence score (0.0–1.0)                    │
│  │   ├── Update fabrics table with AI output                   │
│  │   └── Log activity (AI_PROCESSED or AI_PROCESSED_LOW_CONF)  │
│  │                                                             │
│  ├── addImageGenerationJob(entityId)  ← enqueue               │
│  ├── addTranslationJob(entityId, 'ru')  ← enqueue            │
│  └── SocialService.createContentJob(entityId)  ← enqueue      │
│                                                                 │
│  On Failure:                                                   │
│  ├── Set fabric status back to 'raw_scraped'                   │
│  └── Insert fabricActivityLog with AI_PROCESSING_FAILED        │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 AI Processing Details

**AIService.processFabric()** does the following:
1. Fetches the fabric row by ID
2. Checks for a matching `TextPromptRule` (admin-configured enrichment rules)
3. Builds system/user messages for Gemini with fabric attributes
4. Calls `gemini-3.6-flash` with `responseFormat: 'json_object'`
5. Parses and validates the response with Zod schema (`ProcessedProductSchema`)
6. Computes a completeness confidence score across 9 dimensions
7. If confidence < 0.6, marks `mandatoryReview = true`
8. Updates the fabric row with all AI-generated fields and sets `status = 'ai_processed'`
9. Returns `{ fabricId, confidence01, mandatoryReview, processed }`

### 3.4 The Enrichment Prompt System

The system supports configurable AI prompts through `TextPromptRuleService`:
- **`enrichmentSystemPrompt`** + **`enrichmentUserTemplate`** — for AI processing
- **`socialSystemPrompt`** + **`socialUserTemplate`** — for social content
- **`blogSystemPrompt`** + **`blogUserTemplate`** — for blog posts
- **`imagePrompts`** — for image generation configurations
- **`videoPrompt`** + **`videoPromptEnabled`** — for video generation

This allows non-technical admins to tune AI output quality without code changes.

---

## 4. Media Generation Layer

### 4.1 The `generated_media` Table

This is the single table for all AI-generated images and videos (polymorphic design):

```
generated_media
├── id                  integer PK
├── fabricId            integer FK → fabrics (CASCADE)
├── socialPostId        integer FK → social_posts (nullable)
├── type                text NOT NULL       ('image' | 'video')
├── mediaType           text                ('IMAGE_1:1', 'REEL_5', etc.)
├── url                 text                -- R2 URL (or GCS URI)
├── thumbnailUrl        text                -- for video thumbnails
├── prompt              text NOT NULL       -- full prompt used
├── provider            text NOT NULL DEFAULT 'gemini'
├── providerModel       text                -- model name
├── providerJobId       text                -- external job ID
├── status              text NOT NULL DEFAULT 'PENDING'
│                       -- PENDING → PROCESSING → COMPLETED | FAILED
├── durationSeconds     integer             -- video only
├── aspectRatio         text                -- for video
├── fileSizeBytes       integer             -- for video
├── errorMessage        text                -- if FAILED
├── adminReviewedAt     timestamptz
├── adminReviewerId     integer FK → users (nullable)
├── adminReviewNotes    text
├── metadata            jsonb               -- arbitrary extra data
├── expiresAt           timestamptz         -- auto-cleanup
├── createdAt           timestamptz NOT NULL DEFAULT now()
├── updatedAt           timestamptz NOT NULL DEFAULT now()
└── deletedAt           timestamptz (soft delete)
```

### 4.2 Image Generation Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│  image_generation_queue (image_generation_jobs)                  │
│                                                                  │
│  Worker: image-generation.worker.ts                             │
│                                                                  │
│  For each fabric (batch or single):                             │
│  ├── Fetch fabric data from DB                                  │
│  ├── Resolve PromptRule for image generation                    │
│  ├── Compile image prompts from rule + fabric variables         │
│  ├── For each prompt config × count:                            │
│  │   ├── Insert record into generated_media (status=PENDING)    │
│  │   ├── Call Gemini image generation API                       │
│  │   ├── Update generated_media (status=COMPLETED, url=source)  │
│  │   ├── Upload source URI to R2                                │
│  │   │   ├── If data URI (base64): uploadBuffer()               │
│  │   │   └── If remote URL: uploadFromUrl()                     │
│  │   └── Store R2 URL in generated_media.url                     │
│  └── On failure: set status=FAILED, store errorMessage           │
│                                                                  │
│  R2 key pattern: fabrics/{fabricId}/generated/{mediaId}.png     │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 Video Generation Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│  video_generation_queue (video_generation_jobs)                  │
│                                                                  │
│  Worker: video-generation.worker.ts                             │
│                                                                  │
│  For each fabric:                                               │
│  ├── Fetch fabric data from DB                                  │
│  ├── Resolve PromptRule for video generation                    │
│  ├── Build video prompt + duration + aspect ratio               │
│  ├── Insert record into generated_media (status=PENDING)        │
│  ├── Call Gemini Omni Flash video API                           │
│  ├── Upload video buffer to R2                                  │
│  │   └── R2 key pattern: fabrics/{fabricId}/videos/{mediaId}.mp4│
│  ├── Update generated_media with R2 URL + fileSizeBytes         │
│  └── On failure: set status=FAILED, store errorMessage           │
└──────────────────────────────────────────────────────────────────┘
```

### 4.4 R2 Storage Configuration

The R2 client (`src/lib/storage/r2.ts`) uses Cloudflare R2 with S3-compatible API:
- **Provider**: Cloudflare R2 (S3 API)
- **Client**: `@aws-sdk/client-s3` `S3Client` with `region: 'auto'`
- **Endpoint**: `https://{accountId}.r2.cloudflarestorage.com`
- **Bucket**: Configured via `CLOUDFLARE_R2_BUCKET` env var
- **Public URL**: `{publicBaseUrl}/{key}`

Key functions:
- `uploadBuffer(buffer, key, contentType)` — for base64-decoded images and video buffers
- `uploadFromUrl(sourceUrl, key)` — for proxying remote image URLs to R2

---

## 5. Access & Display Layer

### 5.1 How Generated Media Is Accessed

Generated media is accessed through:

1. **Fabric detail page**: `ImageGenerationService.getByFabric(fabricId)` and `VideoGenerationService.getByFabric(fabricId)` query `generated_media` filtered by `fabricId`, `type`, and `deletedAt IS NULL`
2. **Admin media library**: `AdminMediaLibraryService` provides a centralized view of all generated media
3. **Social post creation**: When creating social posts, `generated_media` records with `type='image'` can be attached; video posts link via `socialPostId` FK

### 5.2 The `fabrics` Table — Enriched Output

After AI processing, the fabric table contains the enriched data that the system displays:

```
fabrics (post-processing state)
├── titleRu       — original (raw) or AI-enriched
├── titleEn       — AI-generated English translation
├── descriptionRu — AI-enriched
├── descriptionEn — AI-enriched
├── fabricType    — AI-classified
├── gsm           — AI-extracted
├── widthCm       — AI-extracted
├── color         — original + AI-enriched
├── composition   — AI-extracted JSON array
├── tags          — AI-extracted + normalized
├── priceUsd      — AI-extracted
├── moq           — AI-extracted
├── images        — array of R2/image URLs (from crawler + generated)
├── aiConfidenceScore  — decimal confidence (0.00–1.00)
├── aiProcessedAt       — timestamp of AI processing
├── status         — enum (raw_scraped | ai_processing | ai_processed | approved | rejected)
└── ...
```

### 5.3 Admin Review & Approval Flow

The system has an admin review flow for AI outputs:
- Low-confidence fabrics (`confidence < 0.6`) are flagged with `mandatoryReview`
- `generated_media` records have `adminReviewedAt`, `adminReviewerId`, `adminReviewNotes`
- Admin can approve/reject fabrics, which updates `fabrics.status`
- Activity log records (`AIManualReview`, `FABRIC_UPDATED`, etc.) track admin decisions

---

## 6. Supporting Infrastructure

### 6.1 Queue Architecture

All async processing is backed by BullMQ queues with Redis:

| Queue Name | Redis Key | Concurrency | Purpose |
|------------|-----------|-------------|---------|
| `crawler_jobs` | `crawler_jobs` | 3 | Web scraping jobs |
| `ai_processing_jobs` | `ai_processing_jobs` | 5 | AI enrichment of fabric data |
| `image_processing_jobs` | `image_processing_jobs` | — | Image post-processing (legacy) |
| `image_generation_jobs` | `image_generation_jobs` | 2 | AI image generation |
| `video_generation_jobs` | `video_generation_jobs` | 2 | AI video generation |
| `translation_jobs` | `translation_jobs` | 10 | Bilingual field translation |
| `social_media_jobs` | `social_media_jobs` | — | Social content generation |
| `social_publish_jobs` | `social_publish_jobs` | — | Social post publishing |
| `social_analytics_jobs` | `social_analytics_jobs` | — | Social analytics sync |
| `social_token_refresh_jobs` | `social_token_refresh_jobs` | — | OAuth token refresh |

### 6.2 Worker Process Isolation

Workers are compiled separately via `tsconfig.workers.json` (CommonJS output to `dist-workers/`). They cannot import from `src/app` or React-only code. The boundary is enforced by:
- Separate `tsconfig.workers.json` with explicit `include` paths
- `isWorkerEnabled()` feature flag check at startup
- `installGracefulShutdown()` for clean SIGTERM/SIGINT handling

### 6.3 Error Handling & Retry

- BullMQ default job options: `attempts: 3`, `backoff: { type: 'exponential', delay: 5000 }`
- `removeOnComplete: 100` and `removeOnFail: 500` for memory management
- On worker failure, the AI worker sets fabric status back to `raw_scraped` and logs the failure
- Media generation failures are stored in `generated_media.errorMessage`

---

## 7. Current Gaps & Required Enhancements

### 7.1 Gap: No Dedicated "Admin Upload Raw Data" Table

**Problem**: The current system has `raw_products` (for crawler data) and bulk import (which creates fabrics directly). There is no dedicated table for admin-uploaded raw data files that preserves the original file and its records separately from AI-processed output.

**Solution**: Create an `admin_raw_uploads` table and an `admin_raw_upload_rows` table:

```
admin_raw_uploads
├── id                    integer PK
├── filename              text NOT NULL          -- original file name
├── originalFileUrl       text                   -- R2 link to original uploaded file
├── fileType              text NOT NULL          -- 'EXCEL' | 'CSV' | 'JSON'
├── status                enum NOT NULL          -- PENDING | PROCESSING | COMPLETED | FAILED
├── totalRows             integer DEFAULT 0
├── processedRows         integer DEFAULT 0
├── errorRows             integer DEFAULT 0
├── uploadedByUserId      integer FK → users
├── startedAt             timestamptz
├── completedAt           timestamptz
├── createdAt             timestamptz NOT NULL DEFAULT now()
├── updatedAt             timestamptz NOT NULL DEFAULT now()
└── deletedAt             timestamptz            (soft delete)

admin_raw_upload_rows
├── id                    integer PK
├── uploadId              integer FK → admin_raw_uploads (RESTRICT)
├── rowIndex              integer NOT NULL       -- original row number in file
├── rawData               jsonb NOT NULL         -- the original row data as-is
├── normalizedData        jsonb                  -- AI-normalized version (if processed)
├── status                enum NOT NULL          -- PENDING | PROCESSING | COMPLETED | FAILED
├── errorMessage          text
├── createdAt             timestamptz NOT NULL DEFAULT now()
├── updatedAt             timestamptz NOT NULL DEFAULT now()
└── deletedAt             timestamptz            (soft delete)
```

### 7.2 Gap: No Processing Status Tracking for Bulk Imports

**Problem**: `bulk_import_jobs` tracks the import operation but not the AI processing status of individual rows.

**Solution**: Add a processing status column to `admin_raw_upload_rows` and enqueue AI jobs per row, not just per batch.

### 7.3 Gap: No Media Lifecycle Management

**Problem**: `generated_media` has an `expiresAt` field but no active cleanup job. Old media files accumulate in R2.

**Solution**: Create a scheduled worker or cron job that:
1. Queries `generated_media` where `expiresAt < now()` and `deletedAt IS NULL`
2. Deletes the R2 file (using `@aws-sdk/client-s3` DeleteObject)
3. Soft-deletes the DB record (`deletedAt = now()`)
4. Logs the cleanup in an activity/audit table

### 7.4 Gap: No Image/Video Gallery API for Public Display

**Problem**: There is no dedicated public API to fetch generated media for a fabric or product. The system has admin media library but no storefront-facing media endpoint.

**Solution**: Add `GET /api/v1/public/fabrics/[id]/media` that returns all `generated_media` records of type `image` for the fabric, filtered to only `COMPLETED` status, sorted by `createdAt`.

### 7.5 Gap: No R2 URL Signer for Private Access

**Problem**: All R2 URLs are public by default (`{bucket}.r2.dev`). For private data, signed URLs should be used.

**Solution**: Implement a `getSignedUrl(key, expiresIn)` utility using R2's signed URL feature for admin-only media access. Public catalog media can remain public.

---

## 8. Production Best Practices Being Followed

### 8.1 Database Conventions
- ✅ PKs are `integer(generatedAlwaysAsIdentity)` — never UUID
- ✅ Every table has `created_at`, `updated_at`, `deleted_at`
- ✅ Foreign keys are indexed
- ✅ Soft delete on all user-facing tables
- ✅ No raw SQL — Drizzle ORM only
- ✅ One schema file per domain in `src/db/schema/`

### 8.2 TypeScript Conventions
- ✅ Strict mode — no implicit `any`
- ✅ All function parameters and return types explicitly typed
- ✅ Zod validation on all API inputs before DB calls
- ✅ API responses use `apiSuccess()` / `apiError()` helpers

### 8.3 Queue Conventions
- ✅ All async processing through BullMQ queues
- ✅ Exponential backoff retry (3 attempts)
- ✅ Job progress tracking (`job.updateProgress()`)
- ✅ Graceful shutdown handling
- ✅ Feature-flag gating for all workers

### 8.4 Service Layer
- ✅ Business logic in services only — never in API routes
- ✅ Services call DB via Drizzle — no raw SQL for simple CRUD
- ✅ Services return typed DTOs, never raw DB rows
- ✅ Activity logging for all significant operations

### 8.5 Media Storage
- ✅ R2 for durable object storage (not local disk)
- ✅ Database references to R2 URLs (not storing files in DB)
- ✅ Separate metadata tracked in `generated_media` for each media asset
- ✅ Provider model and job ID tracked for traceability

### 8.6 Error Handling
- ✅ All async functions have try/catch
- ✅ Errors are logged (never console.log)
- ✅ AI failures set entity back to a retryable state
- ✅ `Promise.allSettled()` for batch operations (partial success allowed)

---

## 9. Data Flow Diagram (Full Pipeline)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RAW DATA INGESTION                              │
│                                                                         │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────────┐      │
│  │   Crawler     │  │  Bulk Excel      │  │  Admin File Upload  │      │
│  │  (worker)     │  │  Import (admin)  │  │  (TBD — new)        │      │
│  └──────┬───────┘  └────────┬─────────┘  └──────────┬──────────┘      │
│         │                   │                        │                   │
│         ▼                   ▼                        ▼                   │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │              raw_products (immutable raw data)                 │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │          bulk_import_jobs (batch tracking)                     │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │          crawler_runs (run tracking)                           │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     AI PROCESSING STAGE                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ai_queue → ai.worker.ts → AIService.processFabric()          │   │
│  │                                                                  │   │
│  │  Reads raw data → Enriches via Gemini → Updates fabrics table  │   │
│  │  status: raw_scraped → ai_processing → ai_processed            │   │
│  │  Confidence score computed → Low confidence = mandatory review  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                    ┌───────────────┼─────────────────┐                  │
│                    ▼               ▼                   ▼                  │
│  ┌──────────────┐ ┌────────────┐ ┌──────────────────────────┐         │
│  │ addAIJob     │ │addTranslation│ │ SocialService            │         │
│  │ (already done)│ │Job           │ │ .createContentJob()      │         │
│  └──────────────┘ └────────────┘ └──────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    MEDIA GENERATION STAGE                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  image_generation_queue → image-generation.worker.ts            │   │
│  │  ├── resolve PromptRule → compile prompts                      │   │
│  │  ├── call Gemini image API → get source URI                   │   │
│  │  ├── upload source to R2 (fabrics/{id}/generated/{mediaId}.png)│   │
│  │  └── store R2 URL in generated_media.url                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  video_generation_queue → video-generation.worker.ts            │   │
│  │  ├── resolve PromptRule → compile video prompt                │   │
│  │  ├── call Gemini Omni Flash API → get video buffer            │   │
│  │  ├── upload video to R2 (fabrics/{id}/videos/{mediaId}.mp4)   │   │
│  │  └── store R2 URL + fileSizeBytes in generated_media          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ACCESS & DISPLAY LAYER                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Generated media is accessible via:                             │   │
│  │  ├── ImageGenerationService.getByFabric(fabricId)              │   │
│  │  ├── VideoGenerationService.getByFabric(fabricId)              │   │
│  │  ├── Admin media library (full CRUD + review)                  │   │
│  │  ├── Public API: GET /api/v1/public/fabrics/[id]/media        │   │
│  │  └── Social post creation (attach generated media)             │   │
│  │                                                                  │   │
│  │  R2 URLs are stored in generated_media.url and served directly  │   │
│  │  (public bucket) or via signed URLs (private access)           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    REVIEW & APPROVAL LAYER                             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Admin reviews AI output:                                      │   │
│  │  ├── Low confidence → mandatory review flag                    │   │
│  │  ├── generated_media records have adminReview fields          │   │
│  │  ├── Approve → fabric.status = 'approved'                     │   │
│  │  └── Reject → fabric.status = 'rejected' (re-process after)   │   │
│  │  └── All decisions logged in fabricActivityLog                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Implementation Roadmap

### Phase 1: Raw Upload Infrastructure (New)
1. Create `admin_raw_uploads` schema (file metadata, user reference, status tracking)
2. Create `admin_raw_upload_rows` schema (per-row raw data, status, errors)
3. Add API routes: `POST /api/v1/admin/raw-uploads` (upload), `GET /api/v1/admin/raw-uploads` (list), `GET /api/v1/admin/raw-uploads/[id]/rows` (row detail)
4. Create `AdminRawUploadService` for business logic
5. Create admin UI components for upload and monitoring
6. Add R2 upload path for original files (not just generated media)

### Phase 2: Processing Pipeline (Enhance)
7. Enqueue AI jobs per raw upload row (not just batch-level)
8. Create `admin_raw_processing_log` table for tracking per-row processing
9. Add processing status filtering to admin UI

### Phase 3: Media Lifecycle (New)
10. Create a cleanup worker for expired `generated_media` records
11. Implement R2 file deletion when soft-deleting media records
12. Add `getSignedUrlForAdmin(key, expiresIn)` for private media access

### Phase 4: Public Access (New)
13. Add `GET /api/v1/public/fabrics/[id]/media` endpoint
14. Create client component for media gallery in public fabric detail page
15. Add image/video type filtering and pagination

### Phase 5: Observability (Enhance)
16. Add processing latency metrics to admin dashboard
17. Add media generation success/failure rates
18. Add queue depth monitoring to admin system health

---

## 11. Key Files Reference

| File | Purpose |
|------|---------|
| `src/db/schema/raw-products.schema.ts` | Immutable raw product data from crawlers |
| `src/db/schema/generated-media.schema.ts` | AI-generated images and videos |
| `src/db/schema/bulk-import-jobs.schema.ts` | Batch import job tracking |
| `src/db/schema/crawler.schema.ts` | Crawler run tracking |
| `src/db/schema/fabrics.schema.ts` | Enriched fabric catalog (AI output target) |
| `src/db/schema/fabric-activity-log.schema.ts` | Audit trail for all fabric changes |
| `src/workers/ai.worker.ts` | AI enrichment worker |
| `src/workers/image-generation.worker.ts` | Image generation worker |
| `src/workers/video-generation.worker.ts` | Video generation worker |
| `src/workers/crawler.worker.ts` | Crawler/scraping worker |
| `src/services/ai.service.ts` | AI processing business logic |
| `src/services/image-generation.service.ts` | Image generation service |
| `src/services/video-generation.service.ts` | Video generation service |
| `src/services/admin-bulk-import.service.ts` | Bulk import orchestration |
| `src/lib/queue/definitions.ts` | BullMQ queue definitions |
| `src/lib/queue/helpers.ts` | Queue job helper functions |
| `src/lib/storage/r2.ts` | R2 upload utilities |
| `src/workers/worker-utils.ts` | Graceful shutdown + connection helpers |
| `src/lib/features/index.ts` | Feature flag system (worker gating) |
| `src/constants/index.ts` | Queue names, enum values, cost constants |
| `src/types/queue.types.ts` | TypeScript types for queue payloads |
| `src/types/ai.types.ts` | TypeScript types for AI processing |

---

## 12. Environment Variables Required

```bash
# R2 / Object Storage
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_BASE_URL=

# BullMQ / Redis
REDIS_URL=redis://localhost:6379

# Google AI (Gemini)
GOOGLE_AI_API_KEY=
```

---

*Document version: 1.0 — Date: 2026-07-28*
*Codebase: TkanMarket — Next.js 16 + Drizzle + BullMQ + Redis + R2 + Gemini*
