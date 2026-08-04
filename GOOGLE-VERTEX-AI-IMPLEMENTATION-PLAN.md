# Google Vertex AI Integration — Production Implementation Plan

> **Objective**: Replace OpenAI GPT-4o with Google Vertex AI (Gemini 3.1 Flash, Gemini 2.5 Flash Image "Nano Banana", Veo 3.1 Lite) for social media content generation, product image generation, and short video/reel creation.

---

## Vertex AI Setup — Free $300 Credits Guide

### Google Cloud Console Setup Steps

1. **Go to** [console.cloud.google.com](https://console.cloud.google.com) এবং একটি নতুন Project তৈরি করুন (যেমন `tkanmarket-ai`)
2. **Enable APIs** (Navigation Menu → APIs & Services → Library):
   - `Vertex AI API`
   - `Cloud Storage API`
   - `Cloud Video Intelligence API` (Veo এর জন্য)
3. **Billing Account**: $300 free credits automatically active for new accounts — 90 days validity
4. **Quotas**: Default quotas are low. Request increase from Quotas page for production use.

### Service Account Key Problem — Solutions

> Your org has `iam.disableServiceAccountKeyCreation` policy. You cannot download JSON keys.
> This is actually a **security best practice**. Here are the alternatives:

| Method | Works for | Key Needed? | Security |
|--------|-----------|-------------|----------|
| **ADC (gcloud auth)** (Recommended for Dev) | Local dev | ❌ No | ✅ Best |
| **Workload Identity Federation** (Recommended for Production) | VPS/Docker | ❌ No | ✅✅ Best |
| **Direct Gemini API Key** (Easy fallback) | Text + Images only | ❌ No (simple key) | ⚠️ Less secure |
| **VM Default SA** | Only on GCP VMs | ❌ No | ✅✅ Best |
| **Ask Org Admin** (Last resort) | Everything | ✅ Creates key | ❌ Security risk |

#### Solution 1 (For Development): Application Default Credentials (ADC)

```bash
# Install gcloud CLI and login:
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/cloud-platform

# Or simpler:
gcloud auth login

# Then create the service account (without a key):
gcloud iam service-accounts create vertex-ai-sa \
  --display-name="Vertex AI Service Account"

# Grant permissions:
gcloud projects add-iam-policy-binding tkanmarket-ai \
  --member="serviceAccount:vertex-ai-sa@tkanmarket-ai.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding tkanmarket-ai \
  --member="serviceAccount:vertex-ai-sa@tkanmarket-ai.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Grant yourself impersonation permission:
gcloud iam service-accounts add-iam-policy-binding \
  vertex-ai-sa@tkanmarket-ai.iam.gserviceaccount.com \
  --member="user:your-email@gmail.com" \
  --role="roles/iam.serviceAccountTokenCreator"

# Add the GOOGLE_IMPERSONATE_SERVICE_ACCOUNT env var:
echo 'export GOOGLE_IMPERSONATE_SERVICE_ACCOUNT="vertex-ai-sa@tkanmarket-ai.iam.gserviceaccount.com"' >> ~/.zshrc
```

**Then in `src/lib/google/client.ts`**: ADC automatically picks up your local credentials and impersonates the service account.

#### Solution 2 (For Production VPS): Workload Identity Federation

```bash
# Step 1: Create a workload identity pool
gcloud iam workload-identity-pools create "tkanmarket-pool" \
  --location="global" \
  --display-name="TkanMarket Pool"

# Step 2: Create OIDC provider (for your VPS provider or any OIDC issuer)
gcloud iam workload-identity-pools providers create-oidc "vps-provider" \
  --location="global" \
  --workload-identity-pool="tkanmarket-pool" \
  --issuer-uri="https://your-vps-issuer" \
  --attribute-mapping="google.subject=assertion.sub"

# Step 3: Grant the service account access to the pool
gcloud iam service-accounts add-iam-policy-binding \
  vertex-ai-sa@tkanmarket-ai.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/tkanmarket-pool/*"
```

**Code change**: In `src/lib/google/client.ts`, use ADC which now fetches a token via workload identity federation — no JSON key file needed.

#### Solution 3 (Simplest Fallback): Gemini API Key (Text + Images Only)

```bash
# Go to https://aistudio.google.com/apikey → Generate API Key
# Then add to .env.local:
GOOGLE_API_KEY="AIza..."
```

**Limitation**: ❌ Veo video generation NOT available with API key. Only Vertex AI supports Veo.
**But**: For Phase 1 (text) and Phase 2 (images), Gemini API key works perfectly.
**For Phase 3 (video)**: Must use Solution 1 or 2.

### How Far $300 Free Credits Goes

| Service | Cost | With $300 You Get |
|---------|------|-------------------|
| Gemini 3.1 Flash Text | $1/1M input tokens | ~300M tokens (enrich **~75,000 fabrics**) |
| Gemini 2.5 Flash Image | $0.039/image | **~7,692 images** (∼1,923 fabrics × 4 images) |
| Veo 3.1 Lite 5s Video | $0.15/video | **~2,000 videos** |
| Veo 3.1 Lite 15s Video | $0.60/video | **~500 videos** |
| **All combined (100 fabrics)** | ~$76.60 | **~4 full months** of testing |

### Environment Variables (.env.local)

```
# ============================================
# OPTION A: ADC + Impersonation (RECOMMENDED)
# No JSON key file needed!
# ============================================
GOOGLE_VERTEX_AI_PROJECT_ID="tkanmarket-ai"
GOOGLE_VERTEX_AI_LOCATION="us-central1"

# For impersonation (if you created a dedicated service account):
GOOGLE_IMPERSONATE_SERVICE_ACCOUNT="vertex-ai-sa@tkanmarket-ai.iam.gserviceaccount.com"

# ============================================
# OPTION B: Direct Gemini API Key (Simple)
# Text + Images only. NO video (Veo).
# ============================================
# GOOGLE_API_KEY="AIzaSy..."

# ============================================
# OPTION C: Service Account JSON (IF org allows)
# Organization policy blocks this for most users
# ============================================
# GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# ============================================
# Optional: OpenAI as fallback during transition
# ============================================
OPENAI_API_KEY="sk-..."
```

### Auth Resolution Order (in `src/lib/google/client.ts`)

```
Client initialization logic:
1. Check GOOGLE_IMPERSONATE_SERVICE_ACCOUNT → use ADC + impersonation (RECOMMENDED)
2. Check GOOGLE_SERVICE_ACCOUNT_JSON → parse and use directly (if org allows)
3. Check GOOGLE_API_KEY → use Gemini API key (text + images only, no video)
4. Fall back to ADC (gcloud auth application-default login)

During development: gcloud auth login is enough
During production: ADC with workload identity federation or VM default SA
```

### Important Vertex AI vs Gemini API Differences

| Feature | Gemini API (API Key) | Vertex AI (Service Account) |
|---------|---------------------|---------------------------|
| Authentication | Simple API key | OAuth 2.0 / Service Account |
| Free tier | Yes (60 req/min) | $300 free credits |
| Image generation | Limited | Full access via Imagen/Gemini |
| Video generation (Veo) | ❌ Not available | ✅ Full access |
| Billing | Pay-as-you-go | Pay-as-you-go via GCP |
| Rate limits | Lower | Higher (quota adjustable) |
| **Production ready** | No | **Yes** |

**Conclusion**: আপনি Vertex AI ব্যবহার করবেন (service account), কারণ Veo video generation শুধুমাত্র Vertex AI-তেই available।

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phased Rollout Strategy](#2-phased-rollout-strategy)
3. [Phase 1 — Google AI SDK + Text Migration](#3-phase-1--google-ai-sdk--text-migration)
4. [Phase 2 — Image Generation (Nano Banana)](#4-phase-2--image-generation-gemini-25-flash-image-nano-banana)
5. [Phase 3 — Video Generation (Veo 3.1 Lite)](#5-phase-3--video-generation-veo-31-lite)
6. [Phase 4 — Admin Video Approval Flow](#6-phase-4--admin-video-approval-flow)
7. [Cost Optimization Strategy](#7-cost-optimization-strategy)
8. [Industry Best Practices](#8-industry-best-practices)
9. [Error Handling & Observability](#9-error-handling--observability)
10. [Complete File Change List](#10-complete-file-change-list)
11. [New Queue Pipeline Diagram](#11-new-queue-pipeline-diagram)

---

## 1. Architecture Overview

### Current Pipeline (OpenAI Only)

```
Crawler → AI Queue (OpenAI GPT-4o) → Image Queue (attach URLs) → Social Queue (GPT-4o text) → Publish Queue
                                        ↓
                                  Only attaches scraped URLs
                                  No AI image generation
```

### Target Pipeline (Vertex AI)

```
Crawler → AI Queue (Gemini 3.5 Flash text) ──→ Image Generation Queue (Gemini 3.1 Flash Image)
                                         │                 ↓
                                         │     Auto: Product Images Generated
                                         │                 ↓
                                         └──→ Social Queue (Gemini 3.5 Flash text)
                                                          ↓
                                               Auto → Image Post → Publish Queue
                                               Manual (Admin Button Click) → Video Generation
                                                                                  ↓
                                                                           Admin reviews video
                                                                                  ↓
                                                                           Approves → Publish Queue
```

### Video Generation Flow (Manual Only)

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Dashboard → Product List → Each Row Has [Generate    │
│  Video] Button                                              │
│                                                             │
│  Admin clicks button → Confirmation dialog → Veo job queued │
│                                                             │
│  Video Generation Worker processes (async, 30-120s)         │
│                                                             │
│  Admin notified → Preview → Approve / Reject → Publish      │
└─────────────────────────────────────────────────────────────┘

Cost saving: Instead of $450-750/mo for 1,000 auto-generated videos,
→ If admin generates only ~20-50 videos/month = $9-37/mo
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Google SDK** | `@google/genai` (new unified SDK, v1+) | Single SDK for text, image, video — replaces `@google/generative-ai` |
| **Text Model** | **Gemini 3.5 Flash** (latest, May 2026) | Cheaper than GPT-4o, better textile domain knowledge. DO NOT use `gemini-3.1-flash-001` (older gen) |
| **Image Model** | **Gemini 3.1 Flash Image** (Nano Banana 2) | Latest image gen. DO NOT use `gemini-2.5-flash-image-001` (retiring Oct 2026). For premium: `gemini-3-pro-image` |
| **Video Model** | **Veo 3.1 Lite** (`veo-3.1-generate-001`) | Only available on Vertex AI (not Gemini API). Cost-effective for reels |
| **Image Generation** | New queue `IMAGE_GENERATION` + new worker | Separate from existing `IMAGE` queue (which only attaches URLs) |
| **Video Generation** | New queue `VIDEO_GENERATION` + new worker | Video is slow/expensive, needs separate concurrency control |
| **Video Approval** | New `VIDEO_REVIEW` status in `social_posts` | Admin must review before publish; images auto-publish |
| **Storage** | Cloudflare R2 (already configured) | Generated images/videos stored in R2, not in DB |
| **Cost Control** | Rate limiting + batch size caps + template fallback | Prevent runaway costs |

---

## 2. Phased Rollout Strategy

### Phase 1 — Text Migration (Week 1)
- Install `@google/genai` SDK (`npm install @google/genai`)
- Create `src/lib/google/client.ts` (Vertex AI client with **Gemini 3.5 Flash** via service account)
- Replace `callOpenAI()` with `callGemini()` in `src/services/ai.service.ts`
- Update `.env.example` with `GOOGLE_VERTEX_AI_PROJECT_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`, etc.
- **Risk**: Low. Drop-in replacement for text.
- **Cost**: ~$7/mo (vs $100/mo for GPT-4o). **~93% reduction.**
- **Free credits**: $300 cover ~42 months of text-only usage — effectively **free for years**

> ⚠️ **Model version note**: Use `gemini-3.5-flash` (May 2026). Do NOT use `gemini-3.1-flash-001`. The 3.1 series is one generation behind and Gemini 3.5 Flash is cheaper, faster, and better quality.

### Phase 2 — Image Generation (Week 2-3)
- New DB schema: `generated_media` table (tracks images/videos, their status, prompt used)
- New image queue + worker: `image_generation_worker`
- New service: `ImageGenerationService` calling **Gemini 3.1 Flash Image** via Vertex AI
- Also support **Gemini 3 Pro Image** for premium/high-res images (optional, higher cost)
- Use existing `fabrics.images` column to store generated image URLs
- Integrate with Cloudflare R2 for image storage
- **Risk**: Medium. New queue, new cost dimension.
- **Cost**: ~$156/mo for 1,000 fabrics × 4 images.
- **Free credits**: $300 covers **~1,923 fabrics** (7,692 images) — test thoroughly before credits expire

> ⚠️ **Model version note**: Use `gemini-3.1-flash-image` (Nano Banana 2, May 2026). Do NOT use `gemini-2.5-flash-image-001` (retires Oct 2026). For higher quality: `gemini-3-pro-image`. The free credits will comfortably cover both.

### Phase 3 — Video Generation (Week 3-4)
- **KEY DECISION**: Videos are **NOT auto-generated**. Admin manually triggers per product via button.
- New video queue + worker: `video_generation_worker`
- New service: `VideoGenerationService` calling **Veo 3.1** (`veo-3.1-generate-001`) via Vertex AI
- **Note: Veo শুধুমাত্র Vertex AI-তেই available, Gemini API-তে না — service account লাগবেই**
- Add admin button in product table: "Generate Video" → confirmation dialog → queues Veo job
- Add `VIDEO_PENDING_APPROVAL` status to social_posts (or keep in generated_media table)
- Admin approval UI on existing `/admin/social/[id]/` page
- Supports image-to-video (reference-to-video) with 9:16 aspect ratio for reels
- **Risk**: Low-Medium. Manual trigger means full cost control.
- **Cost**: ~$9-37/mo for 20-50 admin-triggered videos (vs $450-750 for auto)
- **Free credits**: $300 covers **~500 videos** — with manual trigger, this lasts **10-25 months**

> ⚠️ **Model version note**: Use `veo-3.1-generate-001`. The Lite tier (`veo-3.1-lite`) is the most cost-efficient for short reels. For higher quality 1080p video use `veo-3.1-fast` or `veo-3.1-standard` at higher cost.

### Phase 4 — Admin Video Review Flow (Week 4)
- Extend admin social detail page to show video preview
- Add approve/reject buttons for videos
- Add "generate video" button for individual fabrics
- Add video generation settings page (budget caps, duration, style presets)
- **Risk**: Low. UI work on existing patterns.

---

## 3. Phase 1 — Google AI SDK + Text Migration

### 3.1 New File: `src/lib/google/client.ts`

Create a Vertex AI / Gemini client singleton following the same pattern as `src/lib/openai/client.ts`:

```
src/lib/google/
  client.ts          ← Gemini API client, callGemini() function
  prompts/           ← Prompt templates (mirrors src/lib/openai/prompts/)
    fabric-enrichment.ts  ← Move from openai/prompts/, adapt for Gemini
```

**Implementation details:**

```typescript
// Pattern for client.ts:
// 1. Lazy-init singleton using Vertex AI client (service account based)
// 2. GoogleAuth from google-auth-library reads GOOGLE_SERVICE_ACCOUNT_JSON or
//    falls back to Application Default Credentials (ADC) from gcloud CLI
// 3. callGemini() function with same interface as callOpenAI()
// 4. Retry with exponential backoff (same as existing openai client)
// 5. JSON mode support via responseMimeType: 'application/json'
// 6. Supports both synchronous (text) and streaming (images/video) operations
```

**Key differences from OpenAI client:**
- Gemini uses `responseMimeType: 'application/json'` instead of `response_format: { type: 'json_object' }`
- Gemini models: **`gemini-3.5-flash`** (text), **`gemini-3.1-flash-image`** (image, aka Nano Banana 2)
- Premium image: **`gemini-3-pro-image`** (higher quality, higher cost)
- Supports system instructions as a parameter, not as a message role
- Vertex AI requires project ID + location + authenticated client (not just API key)
- Veo video generation uses Vertex AI's async `predict()` with LRO (Long-Running Operation) polling

```typescript
// Vertex AI Client Structure:
import { GoogleAuth } from 'google-auth-library'
import { VertexAI } from '@google/genai'  // new unified SDK

// Auth resolution order (NO JSON KEY FILE NEEDED):
//
// 1. If GOOGLE_IMPERSONATE_SERVICE_ACCOUNT is set:
//    → ADC (gcloud auth) + impersonation → fetch token for the SA
//    → Best for dev: gcloud auth application-default login
//
// 2. Else if GOOGLE_SERVICE_ACCOUNT_JSON is set:
//    → Parse JSON key directly (blocked by org policy for most)
//
// 3. Else:
//    → Use ADC directly (your own user's permissions)
//    → Or GOOGLE_API_KEY for Gemini API

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
})

// If impersonation:
const impersonateSa = process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT
if (impersonateSa) {
  const client = await auth.getClient()
  // @google/genai SDK handles impersonation automatically via ADC
}

const vertexai = new VertexAI({
  project: process.env.GOOGLE_VERTEX_AI_PROJECT_ID,
  location: process.env.GOOGLE_VERTEX_AI_LOCATION ?? 'us-central1',
  googleAuth: auth
})

// For text: vertexai.preview.generateContent({ model, contents, config })
// For images: vertexai.preview.generateContent with responseModalities: ['Image', 'Text']
// For video: vertexai.preview.predict (Veo via Vertex AI Prediction service + polling)
```

### 3.2 Modify: `src/services/ai.service.ts`

**Changes needed:**

| Line | Current | Target |
|------|---------|--------|
| 8 | `import { callOpenAI } from '@/lib/openai/client'` | `import { callGemini } from '@/lib/google/client'` |
| 120 | `const text = await callOpenAI(messages, ...)` | `const text = await callGemini(messages, { model: 'gemini-3.5-flash', ... })` |
| 230 | `const text = await callOpenAI(messages, ...)` | `const text = await callGemini(messages, { model: 'gemini-3.5-flash', ... })` |
| 281 | `const text = await callOpenAI(messages, ...)` | `const text = await callGemini(messages, { model: 'gemini-3.5-flash', ... })` |

The Gemini prompt format is slightly different:
- System instruction goes in `systemInstruction` parameter
- User messages use `contents: [{ role: 'user', parts: [{ text: '...' }] }]`
- The `callGemini()` wrapper should normalize the `ChatMessage[]` format to Gemini's format

**No changes needed to:**
- Zod validation schemas (ProcessedProductSchema, SocialContentSchema, BlogPostSchema)
- Completeness scoring logic
- DB update logic
- Worker files (they only call AIService methods)

### 3.3 Modify: `.env.example`

Add Vertex AI env vars:
```
## Google Vertex AI (replaces OpenAI for text, image, video generation)
# === RECOMMENDED: ADC + Impersonation (no JSON key file) ===
# First: gcloud auth application-default login
# Then: Create SA + grant impersonation permission (detailed in setup guide above)
GOOGLE_VERTEX_AI_PROJECT_ID="tkanmarket-ai"
GOOGLE_VERTEX_AI_LOCATION="us-central1"
GOOGLE_IMPERSONATE_SERVICE_ACCOUNT="vertex-ai-sa@tkanmarket-ai.iam.gserviceaccount.com"

# === FALLBACK: Gemini API Key (text + images only, no Veo video) ===
# Get from: https://aistudio.google.com/apikey
# GOOGLE_API_KEY="AIzaSy..."

# === BLOCKED by org policy in most cases: ===
# GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

### 3.4 Modify: `src/constants/index.ts`

Add new queue names:
```typescript
export const QUEUE_NAMES = {
  // ... existing queues ...
  IMAGE_GENERATION: 'image_generation_jobs',
  VIDEO_GENERATION: 'video_generation_jobs'
} as const
```

Add video-related constants:
```typescript
export const VIDEO_CONTENT_TYPE = ['REEL_5', 'REEL_10', 'REEL_15', 'REEL_30'] as const
export const VIDEO_ASPECT_RATIO = ['9:16', '16:9', '1:1'] as const
export const VIDEO_MAX_DURATION_SECONDS = 30
export const VIDEO_GENERATION_CONCURRENCY = 2
export const IMAGE_GENERATION_CONCURRENCY = 3
export const IMAGES_PER_FABRIC_DEFAULT = 4
export const IMAGE_ASPECT_RATIOS = ['1:1', '4:3', '9:16', '16:9'] as const
```

### 3.5 Modify: `src/types/ai.types.ts`

Add new types:
```typescript
export type GeneratedImage = {
  id: number
  fabricId: number
  url: string
  prompt: string
  aspectRatio: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  createdAt: string
}

export type GeneratedVideo = {
  id: number
  fabricId: number
  url: string | null
  prompt: string
  duration: number
  aspectRatio: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED'
  adminReviewedAt: string | null
  adminReviewerId: number | null
  createdAt: string
}

export type ImageGenerationJobPayload = {
  jobId: string
  fabricId: number
  count: number          // number of images to generate
  aspectRatios: string[] // e.g. ['1:1', '9:16']
  promptOverrides?: Partial<{
    style: string
    mood: string
    productType: string   // e.g. 'dress', 'shirt', 'curtain'
    usageDescription: string  // user provides this: "make a evening gown"
  }>
}

export type VideoGenerationJobPayload = {
  jobId: string
  fabricId: number
  socialPostId: number | null  // link to existing social post if any
  duration: number              // 5, 10, or 15 seconds
  aspectRatio: string           // '9:16' for reels
  stylePreset?: string
  scriptText?: string           // from AI-generated reel script
}
```

---

## 4. Phase 2 — Image Generation (Gemini 3.1 Flash Image "Nano Banana 2")

### 4.1 New DB Schema: `src/db/schema/generated-media.schema.ts`

Create a new schema file for tracking AI-generated media:

```typescript
// generated_media table
// Tracks ALL AI-generated images and videos in one table
// Polymorphic: type = 'image' | 'video'
export const generatedMedia = pgTable('generated_media', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  fabricId: integer('fabric_id').notNull().references(() => fabrics.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),           // 'image' | 'video'
  mediaType: text('media_type'),          // 'IMAGE_1:1', 'IMAGE_9:16', 'REEL_5', 'REEL_10'
  url: text('url'),                        // R2 URL after generation
  thumbnailUrl: text('thumbnail_url'),     // Thumbnail for video
  prompt: text('prompt').notNull(),        // Full prompt used
  provider: text('provider').notNull(),    // 'gemini_2.5_flash_image' | 'veo_3.1_lite'
  providerJobId: text('provider_job_id'),  // Google's job ID for async operations
  status: text('status').notNull().default('PENDING'),
  // PENDING → PROCESSING → COMPLETED | FAILED
  duration: integer('duration'),           // seconds (video only)
  aspectRatio: text('aspect_ratio'),
  fileSize: integer('file_size'),           // bytes
  errorMessage: text('error_message'),
  adminReviewedAt: timestamp('admin_reviewed_at', { withTimezone: true }),
  adminReviewerId: integer('admin_reviewer_id').references(() => users.id, { onDelete: 'set null' }),
  adminReviewNotes: text('admin_review_notes'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),  // auto-cleanup old media
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
})

// Add indexes
```

**Then add to `src/db/schema/index.ts`**:
```typescript
export { generatedMedia } from './generated-media.schema'
```

**Then add migration**: `npm run db:generate`

### 4.2 New Service: `src/services/image-generation.service.ts`

```typescript
export class ImageGenerationService {
  // 1. Generate image via Gemini 3.1 Flash Image (Nano Banana 2)
  //    Model ID: 'gemini-3.1-flash-image'
  //    For premium: 'gemini-3-pro-image' (higher quality, higher cost)
  static async generateImage(fabricId: number, prompt: string, aspectRatio: string, model?: 'flash' | 'pro'): Promise<string>
  
  // 2. Upload to Cloudflare R2 (or use Google's hosted URL)
  static async uploadToStorage(imageBuffer: Buffer, fileName: string): Promise<string>
  
  // 3. Generate multiple images for a fabric based on different prompts
  static async generateProductImages(fabricId: number, options: {
    count: number
    aspectRatios: string[]
    usageDescription?: string  // user-provided: "show this fabric as a summer dress"
    model?: 'flash' | 'pro'   // default 'flash', use 'pro' for featured fabrics
  }): Promise<GeneratedImage[]>
  
  // 4. Build smart prompt using fabric data + user description
  static buildImagePrompt(fabric: FabricData, usageDescription?: string): string[]
  // Generates N different prompts for different product visualizations:
  // - "Flowing floral dress made from [fabric name], fabric texture visible..."
  // - "Tailored blazer in [fabric name], professional lighting..."
  // - "Fabric swatch closeup showing weave texture..."
  // - "[User description] made from [fabric name]..."
}

// Prompt engineering strategy for textile AI images:
// 1. Always include fabric type, composition, texture, color
// 2. Specify lighting (studio lighting, natural daylight)
// 3. Specify background (white background, lifestyle setting)
// 4. Add "fabric texture visible" to ensure the fabric is clear
// 5. For "user product" prompts: "A [user_description] made from [fabric_name], showing the drape and texture of the fabric clearly"
```

### 4.3 New Worker: `src/workers/image-generation.worker.ts`

```typescript
// Image Generation Worker
// Consumes QUEUE_NAMES.IMAGE_GENERATION
// Concurrency: IMAGE_GENERATION_CONCURRENCY (3)

// Models used:
// - Default: 'gemini-3.1-flash-image' (Nano Banana 2 — fast, cheap, good quality)
// - Premium: 'gemini-3-pro-image' (for featured fabrics, higher quality)
// DO NOT use: 'gemini-2.5-flash-image-001' (retires Oct 2026)

// Flow:
// 1. Receive job with fabricId + count + aspectRatios + promptOverrides
// 2. Fetch fabric data (title, description, composition, tags)
// 3. If fabric is featured → use 'gemini-3-pro-image' for premium quality
//    Else → use 'gemini-3.1-flash-image' for cost efficiency
// 4. Build prompts using ImageGenerationService.buildImagePrompt()
// 5. For each prompt, call Gemini via Vertex AI
// 6. Upload generated image to Cloudflare R2
// 7. Insert record into generated_media table
// 8. Update fabrics.images array with new URLs
// 9. Mark job complete

// Error handling:
// - If individual image fails, continue with others
// - Log failure in generated_media with errorMessage
// - Only fail the job if ALL images fail
```

### 4.4 New Queue Definition: `src/lib/queue/definitions.ts`

Add:
```typescript
let imageGenerationQueue: Queue | null = null
let videoGenerationQueue: Queue | null = null

export function getImageGenerationQueue(): Queue {
  if (!imageGenerationQueue) imageGenerationQueue = getOrCreateQueue(QUEUE_NAMES.IMAGE_GENERATION)
  return imageGenerationQueue
}

export function getVideoGenerationQueue(): Queue {
  if (!videoGenerationQueue) videoGenerationQueue = getOrCreateQueue(QUEUE_NAMES.VIDEO_GENERATION)
  return videoGenerationQueue
}
```

### 4.5 New Queue Helpers: `src/lib/queue/helpers.ts`

Add:
```typescript
export async function addImageGenerationJob(fabricId: number, options: {
  count?: number
  aspectRatios?: string[]
  usageDescription?: string
}): Promise<Job<ImageGenerationJobPayload>> {
  const payload: ImageGenerationJobPayload = {
    jobId: makeJobId('image_gen'),
    fabricId,
    count: options.count ?? IMAGES_PER_FABRIC_DEFAULT,
    aspectRatios: options.aspectRatios ?? ['1:1', '4:3'],
    promptOverrides: options.usageDescription ? { usageDescription: options.usageDescription } : undefined
  }
  return getImageGenerationQueue().add('image_generate', payload, { jobId: payload.jobId })
}

export async function addVideoGenerationJob(fabricId: number, options: {
  duration?: number
  aspectRatio?: string
  socialPostId?: number
  scriptText?: string
}): Promise<Job<VideoGenerationJobPayload>> {
  // ... similar pattern
}
```

### 4.6 Modify: `src/workers/ai.worker.ts`

After AI text processing completes, enqueue image generation (instead of just attaching scraped URLs):

```typescript
// Current (line 32-35):
const urls = result.processed.image_urls
if (Array.isArray(urls) && urls.length > 0) {
  await addImageJob(payload.entityId, urls)
}

// Target:
const scrapedUrls = result.processed.image_urls
if (Array.isArray(scrapedUrls) && scrapedUrls.length > 0) {
  await addImageJob(payload.entityId, scrapedUrls)  // still attach scraped URLs
}

// NEW: Enqueue AI image generation
await addImageGenerationJob(payload.entityId, {
  count: 4,
  aspectRatios: ['1:1', '9:16'],
  usageDescription: payload.usageDescription  // if user provided one
})
```

### 4.7 Cloudflare R2 Integration

The codebase already has R2 env vars configured. Create a new utility:

**New file: `src/lib/storage/r2.ts`**:
```typescript
export class R2Storage {
  static async upload(buffer: Buffer, key: string, contentType: string): Promise<string>
  static async delete(key: string): Promise<void>
  static getPublicUrl(key: string): string
}
```

This stores generated images/videos in R2 with path pattern:
```
generated/{fabricId}/{type}/{uuid}.{ext}
```

---

## 5. Phase 3 — Video Generation (Veo 3.1 Lite)

### 5.1 New Service: `src/services/video-generation.service.ts`

```typescript
export class VideoGenerationService {
  // 1. Generate video via Veo 3.1
  //    Model ID: 'veo-3.1-generate-001'
  //    Tiers: lite (cheapest) / fast (1080p) / standard (4K)
  //    Veo is async: returns a job ID, poll for completion
  static async generateVideo(fabricId: number, options: {
    duration: number       // 5, 10, or 15 seconds
    aspectRatio: string    // '9:16' for reels/shorts (supported since Jan 2026)
    prompt: string
    imageUrl?: string      // image-to-video: use fabric image as reference
    tier?: 'lite' | 'fast' | 'standard'  // default 'lite' for cost
  }): Promise<string>      // returns video URL
  
  // 2. Poll Veo job status (LRO — Long Running Operation)
  static async pollVideoJob(providerJobId: string): Promise<{ status: string; url?: string }>
  
  // 3. Build video prompt from fabric data + AI-generated reel script
  static buildVideoPrompt(fabric: FabricData, scriptText?: string): string
  
  // 4. Create video thumbnail for preview
  static async generateThumbnail(videoUrl: string): Promise<string>
}

// Prompt strategy for textile videos:
// "Dynamic close-up shots of [fabric_name] textile, showing weave pattern and texture.
//  Slow zoom on fabric surface with natural lighting. 
//  [If script: Visual of garments being made/displayed matching the script tone]
//  9:16 vertical format, suitable for Instagram Reels / TikTok"
```

### 5.2 New Worker: `src/workers/video-generation.worker.ts`

```typescript
// Video Generation Worker
// Consumes QUEUE_NAMES.VIDEO_GENERATION
// Concurrency: VIDEO_GENERATION_CONCURRENCY (2)

// Flow:
// 1. Receive job with fabricId + duration + aspectRatio (triggered by admin button click)
// 2. Fetch fabric data + existing images
// 3. Build prompt using VideoGenerationService.buildVideoPrompt()
// 4. If images exist, use first image as image-to-video seed
// 5. Call Veo 3.1 Lite API (async - get job ID)
// 6. Insert record into generated_media with status PROCESSING
// 7. Poll Veo job status every 30 seconds
// 8. On completion: upload video to R2, generate thumbnail
// 9. Update generated_media with URL, status = COMPLETED
// 10. Create/update social_post with media type = REEL
// 11. Set social_post status = VIDEO_PENDING_APPROVAL (not DRAFT)
// 12. Send admin notification: "Your video for [Fabric Name] is ready for review"

// IMPORTANT: 
// - Videos are NOT auto-generated. Admin clicks a button per product.
// - Videos are NOT auto-published. Admin must approve after reviewing.
// - This keeps costs under control (~$9-37/mo for 20-50 videos)

// Error handling:
// - Veo API times out? Retry up to 3x with exponential backoff
// - Veo returns low quality? Flag as FAILED, notify admin
// - Cost exceeded? Check budget cap before generating
```

### 5.3 Video Status Flow

The existing `social_posts.status` enum is `['DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED']`.

**Option A (Recommended):** Add `VIDEO_PENDING` status to the enum (requires migration)
```
'DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'VIDEO_PENDING'
```

**Option B (No migration):** Use a separate `generated_media` table with status, and link from `social_posts` via `platformMetadata`
```
social_posts.status = 'DRAFT', but platformMetadata = { videoId: 123, videoStatus: 'PENDING_APPROVAL' }
```

**Recommendation: Option A** — cleaner, queryable, indexed.

Add migration to add `VIDEO_PENDING` to the `social_post_status` enum:
```sql
ALTER TYPE social_post_status ADD VALUE 'VIDEO_PENDING';
```

Or with Drizzle (new migration):
```typescript
// In a custom migration SQL file
await db.execute(sql.raw(`ALTER TYPE social_post_status ADD VALUE 'VIDEO_PENDING'`))
```

### 5.4 Modify: `src/services/social.service.ts`

Add a new method `generateVideoForFabric()` that is called ONLY when admin clicks the button:

```typescript
// NEW METHOD — NOT called during auto-content generation
// Only called when admin clicks "Generate Video" button in product table

public static async generateVideoForFabric(fabricId: number, options: {
  duration: 5 | 10 | 15
  style?: string
}): Promise<{ postId: number }> {
  // 1. Fetch fabric data + existing images
  // 2. Create social_post with VIDEO_PENDING status
  // 3. Enqueue video generation job
  // 4. Return postId for admin to track
  return { postId }
}
```

**Do NOT auto-enqueue video generation** from `generatePlatformContent()`. Text and images are auto-generated, but video requires admin action.

Social content generation for reel-type posts still creates DRAFT posts with caption/hashtags/script, but the actual video generation is NOT triggered until admin clicks the button.

---

## 6. Phase 4 — Admin Video Management (Manual Trigger + Approval)

### 6.1 Modify: `src/app/api/v1/admin/social/[id]/route.ts`

Add video approval state to the PATCH handler:
- When post has `VIDEO_PENDING` status, return `videoUrl` and `videoThumbnailUrl` in the response
- Admin UI shows video preview

### 6.2 Add Admin "Generate Video" Button in Product Table

**File to modify**: Admin product list page (likely `src/app/(admin)/(authenticated)/admin/fabrics/` or similar admin fabric table)

Add a new column in the product table with a **"Generate Video"** button:

```typescript
// In admin fabric table component:
// Each row shows: [Product Name] [Status] [Actions ...]
// New action button: [Generate Video]
// 
// On click:
//   1. Show confirmation dialog with options:
//      - Duration: 5s / 10s / 15s (dropdown)
//      - Style: Product Showcase / Fabric Closeup / Lifestyle
//   2. On confirm → POST /api/v1/admin/social/generate-video
//      Body: { fabricId: number, duration: 5 | 10 | 15, style: string }
//   3. Show loading state on button
//   4. On completion → show notification + video preview link
```

**New API Route**: `src/app/api/v1/admin/social/generate-video/route.ts`

```typescript
// POST /api/v1/admin/social/generate-video
// Body: { fabricId: number, duration: 5 | 10 | 15, style?: string }
// 
// 1. Validate admin session
// 2. Create social_post with VIDEO_PENDING status
// 3. Enqueue video generation job
// 4. Return { postId, status: 'PROCESSING' }
```

### 6.3 Add API Route: `src/app/api/v1/admin/social/[id]/approve-video/route.ts`

```typescript
// POST /api/v1/admin/social/[id]/approve-video
// Body: { approved: boolean, notes?: string }
// 
// If approved:
//   - generated_media.status = COMPLETED
//   - social_posts.status = APPROVED
//   - social_posts.mediaUrls = [generated video URL]
//
// If rejected:
//   - generated_media.status = REJECTED
//   - social_posts.status = DRAFT (user can edit and retry)
//   - adminReviewNotes saved
```

### 6.3 Modify: `src/services/admin/social-admin.service.ts`

Add methods:
```typescript
public static async getVideoDetail(postId: number): Promise<{
  videoUrl: string | null
  thumbnailUrl: string | null
  status: string
  prompt: string
} | null>

public static async approveVideo(postId: number, actorUserId: number): Promise<void>

public static async rejectVideo(postId: number, actorUserId: number, notes?: string): Promise<void>

public static async requestVideoGeneration(fabricId: number, platform: Platform, duration: number): Promise<{ postId: number }>
```

### 6.4 Admin UI Changes

**Files to modify:**
- Admin fabric list page — Add "Generate Video" button in each row
- `src/app/(admin)/(authenticated)/admin/social/[id]/preview/page.tsx` — Add video preview player for `VIDEO_PENDING` posts
- `src/components/admin/social/social-preview-frames.tsx` — Add video thumbnail + "Preview Video" button
- `src/components/admin/social/social-queue-list-table.tsx` — Add video status badge + filter for `VIDEO_PENDING`

**New components:**
- `src/components/admin/social/social-video-preview.tsx` — Video player with approve/reject buttons
- `src/components/admin/social/social-video-generation-dialog.tsx` — Dialog to trigger video generation for a fabric (opens when admin clicks "Generate Video" button)

### 6.5 Admin Notifications

When a video is ready for review, notify admins via existing notification system:

**Modify** `src/workers/video-generation.worker.ts` — After video generation completes:
```typescript
// Send notification to all admin users
await NotificationService.sendToRole('ADMIN', {
  type: 'VIDEO_READY_FOR_REVIEW',
  title: 'New video ready for review',
  fabricId: payload.fabricId,
  generatedMediaId: mediaRecord.id
})
```

---

## 7. Cost Optimization Strategy

### 7.1 Cost Breakdown (Latest Models — July 2026)

| Operation | Provider | Cost | Auto/Manual |
|-----------|----------|------|-------------|
| Text enrichment | Gemini 3.5 Flash | $1.50/1M in, $9.00/1M out | **Auto** — ~$7/mo |
| Social captions (5 platforms) | Gemini 3.5 Flash | Same model | **Auto** — ~$2/mo |
| Blog post | Gemini 3.5 Flash | Same model | **Auto** — ~$1/mo |
| **Image generation** (×4 flash) | Gemini 3.1 Flash Image | $0.039/image | **Auto** — $156/mo (or $55 with smart gen) |
| **Image generation** (×1 pro) | Gemini 3 Pro Image | ~$0.08/image | **Auto** — featured fabrics only |
| **Video generation** (×1, 15s) | Veo 3.1 Lite | $0.03-0.05/sec | **Manual (admin button)** — $0.60/video |
| **Video generation** (×1, 15s) | Veo 3.1 Fast (1080p) | $0.08-0.12/sec | **Manual** — $1.20-1.80/video |

**Realistic monthly cost with manual video:**

| Scenario | Text | Images | Video (manual) | Total |
|----------|------|--------|----------------|-------|
| Smart images + 20 videos/mo | ~$10 | ~$55 | ~$12 (20 × $0.60) | **~$77/mo** |
| Smart images + 50 videos/mo | ~$10 | ~$55 | ~$30 (50 × $0.60) | **~$95/mo** |
| All images + 20 videos/mo | ~$10 | ~$156 | ~$12 | **~$178/mo** |
| **Current (GPT-4o text only)** | ~$100 | $0 | $0 | **~$100/mo** |

> ⚠️ Note: The Gemini 2.5 models (flash, pro, flash-lite) all retire **October 16, 2026** — do NOT build new code on them. Use **Gemini 3.5 Flash** (text) and **Gemini 3.1 Flash Image** (image) which have at least 12 months of availability.

### 7.2 Where to Save Money

#### Recommendation: Hybrid Video Strategy

```
Strategy A: Veo 3.1 Lite (High Quality, High Cost)
  - $0.03-0.05/sec → 15s reel = $0.45-0.75 per fabric
  - Use for: Top 10% fabrics (featured, high social score, premium suppliers)
  - Cost: ~$45-75/mo for top 100 fabrics

Strategy B: Shotstack / Remotion (Template-Based, Low Cost)
  - ~$0.003/video (static template with text overlay + music)
  - Use for: Remaining 90% fabrics
  - Cost: ~$3/mo for 900 fabrics

Strategy C: Hybrid (Recommended)
  - Top 10% → Veo 3.1 Lite (real AI video, high quality)
  - 90% → Shotstack template (image slideshow + AI caption + music)
  - Total: ~$48-78/mo for video
```

#### Image Generation Savings

```
Strategy: Generate fewer images, higher quality
  - 4 images/fabric = $0.156/fabric
  - 2 images/fabric = $0.078/fabric (save 50%)
  - Use 2 images: 1 product visualization + 1 fabric closeup
  
  Smart generation: Only generate images for fabrics with socialScore >= 50
  - ~30-40% of fabrics qualify
  - Cost: $156 × 35% = ~$55/mo
```

### 7.3 Rate Limiting & Budget Caps

```typescript
// In src/constants/index.ts
export const IMAGE_GENERATION_BUDGET = {
  DAILY_MAX_IMAGES: 200,          // hard cap per day
  MAX_IMAGES_PER_FABRIC: 4,       // per fabric
  MIN_SOCIAL_SCORE_FOR_IMAGE: 30, // minimum social score
  COOLDOWN_MINUTES: 5             // between generation batches
}

export const VIDEO_GENERATION_BUDGET = {
  DAILY_MAX_VIDEOS: 20,           // expensive, limit heavily
  MAX_DURATION_SECONDS: 15,
  MIN_SOCIAL_SCORE_FOR_VIDEO: 70, // only for top fabrics
  MONTHLY_BUDGET_USD: 100,        // hard monthly cap
  ADMIN_APPROVAL_REQUIRED: true   // always need admin for video
}
```

### 7.4 Redis-Backed Budget Tracker

```typescript
// New file: src/lib/rate-limit/ai-budget.ts
// Uses Redis to track daily/monthly AI spend
// Prevents runaway costs

export class AIBudgetTracker {
  static async consumeImageQuota(fabricId: number): Promise<boolean>
  static async consumeVideoQuota(fabricId: number): Promise<boolean>
  static async getDailyUsage(): Promise<{ images: number; videos: number; cost: number }>
  static async getMonthlySpend(): Promise<number>
}
```

---

## 8. Industry Best Practices

### 8.1 Prompt Engineering for Textile AI Images

```
PROMPT PATTERN:
"[Product description] made from [fabric name], a [composition] fabric with [texture/weave].
Studio lighting, sharp focus, [aspect_ratio] format.
Show the fabric texture clearly — drape, weave, and handfeel visible.
[Style: minimalist / editorial / lifestyle / product shot]
[Background: white / gradient / contextual / transparent]
[Lighting: studio / natural / dramatic / soft]"

Examples:
1. "Elegant evening gown made from Italian Silk Satin, a 100% silk charmeuse weave.
   Full-length shot on model, dramatic studio lighting, 9:16 vertical.
   Fabric sheen and drape clearly visible. Editorial fashion photography style."

2. "Tailored men's blazer made from Navy Wool Twill, 100% merino wool.
   Close-up detail shot showing the twill weave texture.
   Professional studio lighting, clean background.
   Suitable for LinkedIn business attire photography."
```

### 8.2 Caching Strategy

- **Generated images**: Cache in Cloudflare R2 with CDN (already configured via `CDN_IMAGE_RESIZER_BASE`)
- **Generated videos**: Serve via R2 public URL with Cloudflare CDN
- **Prompt results**: Cache fabric→prompt mapping to avoid re-generating prompts (reduce token usage)
- **Cache key**: `prompt_cache:{fabricId}:{seed}` → valid for 30 days

### 8.3 Image-to-Video Optimization (Veo)

For Veo image-to-video (using a fabric photo as seed):
```
1. Use fabric close-up image (not model shot) for best texture preservation
2. Add motion prompt: "Slow pan across fabric surface, camera gently zooming in,
   showing weave detail, natural fabric movement, soft lighting transition"
3. Keep duration short: 5-10 seconds for fabric showcase reels
4. Output format: 9:16 (1080×1920) for Reels/Shorts/TikTok
```

### 8.4 A/B Testing Framework

```typescript
// New file: src/services/media-ab-test.service.ts
// Test different prompt styles / models for the same fabric
// Compare engagement metrics

export class MediaABTestService {
  static async createTestVariants(fabricId: number, count: number = 2): Promise<number[]>
  // Creates N different images with different prompts
  // Tracks which version performs better (clicks, saves, shares)
  static async recordInteraction(mediaId: number, event: 'view' | 'click' | 'share'): Promise<void>
  static async getWinner(fabricId: number): Promise<number | null>
}
```

### 8.5 Async Video Generation with Webhook Callback

Veo 3.1 Lite video generation is async (takes 30-120 seconds). Use webhook callback:

```typescript
// In VideoGenerationService:
// 1. Submit job to Veo API with webhook URL
//    webhookUrl: `${NEXTAUTH_URL}/api/v1/webhooks/vertex-ai/video-complete`
// 2. Store providerJobId in generated_media
// 3. When webhook fires:
//    - Fetch video URL from Veo
//    - Upload to R2
//    - Update generated_media status
//    - Move social post to VIDEO_PENDING
//    - Notify admin

// New webhook route:
// src/app/api/v1/webhooks/vertex-ai/video-complete/route.ts
```

---

## 9. Error Handling & Observability

### 9.1 Error Categories

| Error | Handling | Retry? |
|-------|----------|--------|
| Gemini API rate limit | Exponential backoff, queue job retry | Yes, 3x |
| Gemini content filtered | Log prompt, flag for manual review | No |
| Veo async timeout | Poll up to 5min, then fail | Yes, 2x |
| Veo content policy violation | Log prompt, notify admin | No |
| R2 upload failure | Retry with backoff | Yes, 3x |
| Budget exceeded | Skip job, log warning | No |

### 9.2 Monitoring & Alerts

Add to `src/services/admin-system-health.service.ts`:
- Track `IMAGE_GENERATION` and `VIDEO_GENERATION` queue stats
- Alert if queue depth > 100
- Alert if failure rate > 10%
- Track daily spend in Redis, alert if approaching monthly budget

### 9.3 Logging

Add structured logging for all AI operations:
```typescript
logger.info('AI image generated', {
  fabricId: 123,
  model: 'gemini-2.5-flash-image',
  duration: 2.4, // seconds
  cost: 0.039,
  promptHash: 'abc123' // hash of prompt for dedup
})
```

---

## 10. Complete File Change List

### New Files to Create

| # | File Path | Purpose | Phase |
|---|-----------|---------|-------|
| 1 | `src/lib/google/client.ts` | Vertex AI / Gemini client singleton | 1 |
| 2 | `src/lib/google/prompts/fabric-enrichment.ts` | Gemini-optimized enrichment prompts | 1 |
| 3 | `src/lib/storage/r2.ts` | Cloudflare R2 upload/download utilities | 2 |
| 4 | `src/db/schema/generated-media.schema.ts` | `generated_media` table for tracking AI media | 2 |
| 5 | `src/services/image-generation.service.ts` | Gemini 2.5 Flash Image generation logic | 2 |
| 6 | `src/workers/image-generation.worker.ts` | BullMQ worker for image generation queue | 2 |
| 7 | `src/services/video-generation.service.ts` | Veo 3.1 Lite video generation logic | 3 |
| 8 | `src/workers/video-generation.worker.ts` | BullMQ worker for video generation queue | 3 |
| 9 | `src/lib/rate-limit/ai-budget.ts` | Redis-backed daily/monthly spend tracking | 3 |
| 10 | `src/services/media-ab-test.service.ts` | A/B testing framework for generated media | 3 |
| 11 | `src/app/api/v1/admin/social/generate-video/route.ts` | Admin manual video trigger API endpoint | 3 |
| 12 | `src/app/api/v1/admin/social/[id]/approve-video/route.ts` | Admin video approval API endpoint | 4 |
| 13 | `src/components/admin/social/social-video-preview.tsx` | Video preview + approve/reject UI component | 4 |
| 14 | `src/components/admin/social/social-video-generation-dialog.tsx` | "Generate Video" dialog for fabric table | 4 |
| 15 | `src/app/api/v1/webhooks/vertex-ai/video-complete/route.ts` | Veo async completion webhook | 3 |

### Existing Files to Modify

| # | File Path | Changes Needed | Phase |
|---|-----------|---------------|-------|
| 1 | `src/constants/index.ts` | Add `QUEUE_NAMES.IMAGE_GENERATION`, `QUEUE_NAMES.VIDEO_GENERATION`, budget constants | 1 |
| 2 | `src/types/ai.types.ts` | Add `GeneratedImage`, `GeneratedVideo`, `ImageGenerationJobPayload`, `VideoGenerationJobPayload` types | 1 |
| 3 | `src/lib/queue/definitions.ts` | Add `getImageGenerationQueue()`, `getVideoGenerationQueue()` | 2 |
| 4 | `src/lib/queue/helpers.ts` | Add `addImageGenerationJob()`, `addVideoGenerationJob()`, update stats maps | 2 |
| 5 | `src/services/ai.service.ts` | Replace `callOpenAI` → `callGemini`, update prompt format | 1 |
| 6 | `src/workers/ai.worker.ts` | Add `addImageGenerationJob()` call after AI processing (only for images, NOT video) | 2 |
| 6a | Admin product list page component | Add "Generate Video" button per row (triggers `POST /api/v1/admin/social/generate-video`) | 3 |
| 7 | `src/services/social.service.ts` | Add `generateVideoForFabric()` method (MANUAL — called from admin button only, NOT auto) | 3 |
| 8 | `src/services/admin/social-admin.service.ts` | Add `triggerVideoGeneration()`, `approveVideo()`, `rejectVideo()`, `getVideoDetail()` methods | 4 |
| 9 | `src/services/social-publisher.service.ts` | Skip `VIDEO_PENDING` posts in `findDueScheduledPostIds()` | 3 |
| 10 | `.env.example` | Add `GOOGLE_API_KEY`, `GOOGLE_VERTEX_AI_PROJECT_ID`, etc. | 1 |
| 11 | `src/db/schema/social.schema.ts` | Add `VIDEO_PENDING` to `socialPostStatusEnum` (via migration) | 3 |
| 12 | `src/db/schema/index.ts` | Add `generatedMedia` export | 2 |
| 13 | `src/types/queue.types.ts` | Add `ImageGenerationJobPayload`, `VideoGenerationJobPayload` types | 2 |
| 14 | `src/lib/openai/client.ts` | Make optional — keep for fallback, switch to google client as default | 1 |

### Database Migrations Needed

| # | Migration | Phase |
|---|-----------|-------|
| 1 | `CREATE TABLE generated_media (...)` | 2 |
| 2 | `ALTER TYPE social_post_status ADD VALUE 'VIDEO_PENDING'` | 3 |

### Feature Flag Addition

Add to `src/config/features.registry.json`:

```json
{
  "id": "vertex-ai-images",
  "label": "Vertex AI Image Generation",
  "description": "Generate product images using Gemini 3.1 Flash Image (Nano Banana 2). Disable to skip AI image generation.",
  "routes": [],
  "apiPaths": ["/api/v1/admin/generated-media"],
  "adminPaths": [],
  "navKeys": [],
  "adminNavHrefs": [],
  "workers": ["image-generation"],
  "schemas": ["generated_media"],
  "files": [
    "src/services/image-generation.service.ts",
    "src/workers/image-generation.worker.ts",
    "src/db/schema/generated-media.schema.ts",
    "src/lib/storage/r2.ts"
  ]
},
{
  "id": "vertex-ai-videos",
  "label": "Vertex AI Video Generation",
  "description": "Generate product reels/videos using Veo 3.1 Lite. Requires admin approval.",
  "routes": [],
  "apiPaths": ["/api/v1/admin/social/approve-video"],
  "adminPaths": [],
  "navKeys": [],
  "adminNavHrefs": [],
  "workers": ["video-generation"],
  "schemas": [],
  "files": [
    "src/services/video-generation.service.ts",
    "src/workers/video-generation.worker.ts"
  ]
}
```

---

## 11. New Queue Pipeline Diagram

```
                    ┌──────────────────────────────────────────────────────────┐
                    │                     VERTEX AI                            │
                    │  ┌─────────────────────────────────────────────────────┐  │
                     │  │  Gemini 3.5 Flash   Gemini 3.1 Flash    Veo 3.1     │  │
                     │  │  (Text)             Image (Nano Banana 2) Lite       │  │
                     │  │                     (Image Gen)         (Video)     │  │
                    │  └─────────────────────────────────────────────────────┘  │
                    └──────────────────────────────────────────────────────────┘
                                         │
                    Crawler Worker        │
                         │               │
                         ▼               │
                    ┌──────────┐         │
                    │ Crawler  │         │
                    │ Queue    │         │
                    └────┬─────┘         │
                         │               │
                         ▼               │
                    ┌──────────┐         │
                     │ AI Queue │◄────────┘  Gemini 3.5 Flash for text
                    │ (Worker) │──────────► fabric.titleEn/descriptionRu etc.
                    └────┬─────┘
                         │
               ┌─────────┼──────────────┐
               │         │              │
               ▼         ▼              ▼
        ┌──────────┐ ┌────────────┐ ┌──────────┐
        │ Image    │ │ Image Gen  │ │ Social   │
        │ Queue    │ │ Queue      │ │ Queue    │
        │(attach   │ │(NEW)       │ │(Worker)  │
        │ scraped) │ │            │ │          │
        └──────────┘ └──────┬─────┘ └────┬─────┘
                     │              │
                             ▼             │
                      ┌────────────┐       │
                      │ Gemini 3.1 │       ▼
                      │ Flash      │  ┌────────────┐
                      │ Image      │  │ Image Post │
                      │ (Generate) │  │ (DRAFT)    │
                      └──────┬─────┘  └──────┬─────┘
                             │               │
                             ▼               ▼
                      ┌────────────┐   ┌────────────┐
                      │ R2 Storage │   │ Publish    │
                      │ (images)   │   │ Queue      │
                      └────────────┘   └──────┬─────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ Facebook /  │
                    ┌──────────────┐    │ Instagram / │
                    │ Admin clicks  │   │ TikTok etc. │
                    │ [Gen Video]   │   └────────────┘
                    │ button in     │
                    │ product table │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Veo 3.1 Lite │
                    │ (Manual)     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ R2 Storage   │
                    │ (video)      │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Admin Review │
                    │ Page         │
                    └──────┬───────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
             ┌──────────┐  ┌──────────┐
             │ Approve  │  │ Reject   │
             │ → Publish│  │ → DRAFT  │
             └──────────┘  └──────────┘
```

---

## Free Credits Usage Plan ($300 — Manual Video)

```
$300 FREE CREDITS → 90 Days to use

Since video is manual (admin button), costs are fully controlled:

┌─────────────────────────────────────────────────────────┐
│ Phase 1 — Text (Days 1-7)                               │
│   Gemini 3.5 Flash: ~$1 (testing + validation)           │
│   → Test quality, fix prompts, validate                   │
├─────────────────────────────────────────────────────────┤
│ Phase 2 — Images (Days 8-21)                             │
│   Gemini 3.1 Flash Image: ~$50 (320 fabrics × 4 images)  │
│   → Test prompts, aspect ratios, auto-pipeline            │
├─────────────────────────────────────────────────────────┤
│ Phase 3 — Video (Days 22-30)                             │
│   Admin manually tests on ~20 products                   │
│   Veo 3.1 Lite: ~$12 (20 videos × $0.60)                 │
│   → Test quality, admin flow, approval UI                 │
├─────────────────────────────────────────────────────────┤
│ Production Buffer: ~$237                                  │
│   → Auto images ~$55/mo = ~4 months free                  │
│   → Manual videos ~$12-30/mo = as needed                  │
└─────────────────────────────────────────────────────────┘

→ With manual video, $300 free credits can last 4-5 months
→ Even after that, monthly bill = ~$74-95/mo
→ LESS than current OpenAI $100/mo (and you GET images + videos!)
```

## Summary: Estimated Costs & Timeline

### Implementation Effort

| Phase | Files to Create | Files to Modify | Estimated Time |
|-------|----------------|-----------------|----------------|
| Phase 1: Text Migration | 2 | 2 | 2-3 days |
| Phase 2: Image Generation | 5 | 5 | 4-5 days |
| Phase 3: Video Generation | 5 | 4 | 4-5 days |
| Phase 4: Admin Video UI | 2 | 4 | 3-4 days |
| **Total** | **14 files** | **15 files** | **13-17 days** |

### Monthly Cost Projection (Latest Models — Video Manual)

| Scenario | Text | Images | Video | Total |
|----------|------|--------|-------|-------|
| **Current** (GPT-4o only) | ~$100 | $0 | $0 | **~$100/mo** |
| **Google All Auto** (1,000 fabrics) | ~$10 | ~$156 | ~$600 | **~$766/mo** |
| **Google + Smart Images + Manual Video** | ~$10 | ~$55 | ~$20 (50 videos) | **~$85/mo** |
| **Google + Smart Images + Manual Video (low)** | ~$10 | ~$55 | ~$9 (20 videos) | **~$74/mo** ← BEST |
| **Google Text only (no images/video)** | ~$10 | $0 | $0 | **~$10/mo** ← cheapest |

> **Winner**: Auto-generate images (cheap), manually trigger videos only for top products. Total: **~$74-85/mo** — less than current OpenAI-only $100/mo!

### Key ROI Considerations

1. **Image generation pays for itself**: Replaces manual product photography. 4 generated images per fabric at $0.156 vs $50-200 for professional product photography.
2. **Video is expensive but optional**: Start with template-based (Shotstack) for 90%, AI video for top 10%.
3. **Google text is cheaper than OpenAI**: Gemini 3.5 Flash ($1.50/$9 per 1M tokens) vs GPT-4o ($2.50/$10 per 1M tokens) — **better quality at lower cost**.
4. **Always use latest models**: The `-001` suffix models like `gemini-2.5-flash-image-001` are retiring Oct 2026. Use `gemini-3.5-flash` (text) and `gemini-3.1-flash-image` / `gemini-3-pro-image` (image) which have 12+ month availability guarantees.
5. **Gemini Omni Flash** (future): When API releases, one model replaces all three — simplifies code, potentially reduces cost.

### Recommendation

```
Start with Phase 1 (text migration) — use Gemini 3.5 Flash.
  → Saves 60% vs GPT-4o. $300 free credit covers 42 months of text.

Add Phase 2 (image gen) — use Gemini 3.1 Flash Image (Nano Banana 2).
  → $300 covers ~1,923 fabrics × 4 images. Auto-generate for qualifying fabrics.
  → Use 3 Pro Image for featured/premium fabrics only.

Add Phase 3 (video gen) — MANUAL ONLY. Admin clicks button per product.
  → Veo 3.1 Lite via Vertex AI. $0.60/video (15s).
  → Admin only generates videos for products worth promoting.
  → Typical: 20-50 videos/month = $12-30/mo (vs $600 for auto).
  → Veo ONLY available on Vertex AI (not Gemini API) — must use service account.

⚠️ CRITICAL: Do NOT use any model with -001 suffix (e.g. gemini-2.5-flash-image-001).
  Those retire October 2026. Always use the latest generation models:
  - Text:    gemini-3.5-flash  (released May 2026, 12+ month availability)
  - Image:   gemini-3.1-flash-image  (released May 2026, 12+ month)
  - Premium: gemini-3-pro-image     (released May 2026, 12+ month)
  - Video:   veo-3.1-generate-001   (no retirement date announced)
```
