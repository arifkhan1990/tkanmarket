# Google Vertex AI Integration — Usage Guide

## Overview

This replaces OpenAI GPT-4o with Google Vertex AI for:

- **Text**: Gemini 3.5 Flash (fabric enrichment, social captions, blog posts)
- **Images**: Gemini 3.1 Flash Image (product photos — auto-generated)
- **Videos**: Veo 3.1 (reels — admin only, manual trigger)

---

## 1. Setup

### 1.1 Environment Variables (`.env.local`)

Use **Solution 1** (Vertex AI via ADC — supports text + images + video):

```
GOOGLE_VERTEX_AI_PROJECT_ID="tkanmarket-ai"
GOOGLE_VERTEX_AI_LOCATION="us-central1"
```

Optionally add impersonation (no JSON key file needed):

```
GOOGLE_IMPERSONATE_SERVICE_ACCOUNT="vertex-ai-sa@tkanmarket-ai.iam.gserviceaccount.com"
```

**Solution 2** (Gemini API Key — text + images only, NO video):

```
GOOGLE_API_KEY="AIzaSy..."
```



### 1.3 Database Migration

```bash
npm run db:generate   # creates migration for generated_media table + VIDEO_PENDING enum
npm run db:migrate    # applies to database
```



### 1.4 Start Workers

```bash
# Terminal 1 — AI text processing
npm run worker:ai

# Terminal 2 — Image generation
npm run worker:image

# Terminal 3 — Video generation
npm run worker:video

# Terminal 4 — Social content
npm run worker:social

# Or all at once:
npm run worker:all
```

---



## 2. Text AI (Automatic — No Action Needed)



### How it works

1. Crawler scrapes a fabric → saves raw data
2. AI worker picks up the job → calls `AIService.processFabric()`
3. `callGemini()` sends prompt to `gemini-3.5-flash` model
4. Returns structured data: title, description, composition, tags, etc.
5. Saves to `fabrics` table with status `ai_processed`



### What was replaced


| Before (OpenAI)                             | After (Google)                                        |
| ------------------------------------------- | ----------------------------------------------------- |
| `callOpenAI(messages, { model: 'gpt-4o' })` | `callGemini(messages, { model: 'gemini-3.5-flash' })` |
| `response_format: { type: 'json_object' }`  | `responseMimeType: 'application/json'`                |
| System prompt as message role               | System instruction as separate parameter              |




### Social content & blog posts

- `AIService.generateSocialContent()` → uses Gemini 3.5 Flash
- `AIService.generateBlogPost()` → uses Gemini 3.5 Flash
- All auto-triggered from the AI worker → social worker flow



### Cost

~$7/month for 1,000 fabrics (vs $100/month for GPT-4o)

---



## 3. Image Generation (Automatic)



### How it works

After AI text processing completes, `ai.worker.ts` automatically:

```typescript
// In ai.worker.ts:
await addImageGenerationJob(payload.entityId, '')
```

This enqueues a job to `IMAGE_GENERATION` queue. The `image-generation.worker` picks it up and:

1. Fetches fabric title/description
2. Builds a professional prompt: *"Create a professional product photo of this fabric on a white background..."*
3. Calls `generateGeminiImage()` with model `gemini-3.1-flash-image`
4. Gets GCS URI from Gemini response
5. Downloads & re-uploads to Cloudflare R2
6. Saves record in `generated_media` table with `type: 'image'`
7. Logs to `fabric_activity_log`



### Manual trigger (admin)

```bash
POST /api/v1/admin/fabrics/[id]/generate-image
Body: { "prompt": "optional custom prompt" }
```



### Check generated images

```bash
GET /api/v1/admin/fabrics/[id]/generated-media
```

Response:

```json
{
  "data": {
    "images": [
      {
        "id": 1,
        "type": "image",
        "url": "https://r2-bucket/fabrics/123/generated/1.png",
        "prompt": "...",
        "status": "COMPLETED",
        "createdAt": "2026-07-06T..."
      }
    ],
    "videos": []
  }
}
```



### Cost

$0.039/image → $0.156/fabric (4 images). Daily cap: 200 images.

---



## 4. Video Generation (Manual — Admin Only)

**Videos are NEVER auto-generated.** Admin must click a button to trigger.

### 4.1 Generate Video for a Single Fabric

```bash
POST /api/v1/admin/fabrics/123/generate-video
# or
POST /api/v1/admin/social/generate-video
Body: {
  "fabric_id": 123,
  "prompt": "optional custom prompt",     # default: auto-generated from fabric data
  "platform": "INSTAGRAM",                 # default: INSTAGRAM
  "image_url": "https://..."              # optional: use specific image as reference
}
```

Response:

```json
{
  "data": {
    "fabric_id": 123,
    "post_id": 45,
    "media_id": 67,
    "status": "VIDEO_PENDING"
  }
}
```



### 4.2 Generate Videos in Bulk

```bash
POST /api/v1/admin/social/bulk/generate-video
Body: {
  "fabric_ids": [1, 2, 3, 5, 10],
  "platform": "INSTAGRAM",
  "prompt": "optional shared prompt"
}
```

Response:

```json
{
  "data": {
    "results": [
      { "fabric_id": 1, "post_id": 45, "media_id": 67, "status": "VIDEO_PENDING" },
      { "fabric_id": 2, "post_id": 46, "media_id": 68, "status": "VIDEO_PENDING" }
    ],
    "errors": [
      { "fabric_id": 5, "error": "Fabric not found" }
    ],
    "total": 5,
    "succeeded": 4,
    "failed": 1
  }
}
```



### 4.3 What Happens After Trigger

1. Social post created with `status: 'VIDEO_PENDING'`
2. Job enqueued to `VIDEO_GENERATION` queue
3. `video-generation.worker` picks it up:
  - Calls `generateVeoVideo()` with model `veo-3.1-generate-001`
  - Gets an LRO (Long-Running Operation) name back
  - Polls every 10 seconds for up to 10 minutes
  - On completion: downloads video from GCS, uploads to R2
  - Updates `generated_media` status to `COMPLETED`
  - Logs activity
4. Admin views the video and approves/rejects



### 4.4 Check Video Status

```bash
GET /api/v1/admin/fabrics/123/generated-media
# Returns all images + videos for this fabric
```

Or check via social post:

```bash
GET /api/v1/admin/social/45
# Returns post detail with media info
```



### 4.5 Approve Video

```bash
POST /api/v1/admin/social/45/approve-video
Body: { "approved": true }
```

Result:

- `generated_media.status` → `COMPLETED`
- `social_posts.status` → `APPROVED`
- Video ready for scheduling/publishing



### 4.6 Reject Video

```bash
POST /api/v1/admin/social/45/approve-video
Body: { "approved": false, "notes": "quality too low, lighting bad" }
```

Result:

- `generated_media.status` → `FAILED`
- `generated_media.admin_review_notes` → "quality too low, lighting bad"
- `social_posts.status` → `DRAFT`
- Admin can edit caption, retry generation



### 4.7 Webhook (Optional)

Set this URL in Google Cloud Console → Vertex AI → Veo settings:

```
POST https://yourdomain.com/api/v1/webhooks/vertex-ai/video-complete
```

When Veo finishes, it calls this webhook and `VideoGenerationService.pollAndComplete()` runs immediately (no need to wait for polling interval). Without webhook, the worker polls every 10s for up to 10 min.

### Cost

$0.60/video (15s, Veo 3.1 Lite). Daily cap: 20 videos. Monthly cap: $100.

---



## 5. Budget Control



### Hard caps (in `src/lib/rate-limit/ai-budget.ts`)


| Resource       | Limit |
| -------------- | ----- |
| Images per day | 200   |
| Videos per day | 20    |
| Monthly spend  | $100  |




### How it works

- Uses Redis to track daily counts + monthly spend
- `AIBudgetTracker.consumeImageQuota()` called before generation
- `AIBudgetTracker.consumeVideoQuota()` called before generation
- If quota exceeded → job skipped, warning logged
- If Redis unavailable → quota check passes (fail-open)



### Check usage

```typescript
const usage = await AIBudgetTracker.getDailyUsage()
// { images: 5, videos: 1, cost: 0.60 }

const monthly = await AIBudgetTracker.getMonthlySpend()
// 12.50
```

---



## 6. Auth Resolution (How `client.ts` Chooses)

```
1. GOOGLE_VERTEX_AI_PROJECT_ID + GOOGLE_IMPERSONATE_SERVICE_ACCOUNT
   → Vertex AI via ADC + impersonation (BEST — no key file)

2. GOOGLE_VERTEX_AI_PROJECT_ID (without impersonation)
   → Plain ADC (VM default SA, Cloud Run)

3. GOOGLE_API_KEY
   → Gemini API key (text + images only — NO Veo video)
```

Error if none set:

```
Google AI not configured.
  Solution 1 (Vertex AI): Set GOOGLE_VERTEX_AI_PROJECT_ID + optionally GOOGLE_IMPERSONATE_SERVICE_ACCOUNT
  Solution 2 (API key):   Set GOOGLE_API_KEY (text+images only, no Veo video)
```

---



## 7. Complete File Reference



### Library


| File                                          | Exports                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/lib/google/client.ts`                    | `callGemini()`, `generateGeminiImage()`, `generateVeoVideo()`, `pollVeoOperation()`, `getClientMode()` |
| `src/lib/google/prompts/fabric-enrichment.ts` | `buildFabricEnrichmentPrompt()`                                                                        |
| `src/lib/storage/r2.ts`                       | `uploadFromUrl()`                                                                                      |
| `src/lib/rate-limit/ai-budget.ts`             | `AIBudgetTracker` class                                                                                |




### Services


| File                                         | Key Methods                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/services/ai.service.ts`                 | `processFabric()`, `generateSocialContent()`, `generateBlogPost()`                |
| `src/services/image-generation.service.ts`   | `generateForFabric()`, `getByFabric()`                                            |
| `src/services/video-generation.service.ts`   | `generateForFabric()`, `pollAndComplete()`, `getByFabric()`                       |
| `src/services/social.service.ts`             | `generateVideoForFabric()` (admin only)                                           |
| `src/services/admin/social-admin.service.ts` | `getVideoDetail()`, `approveVideo()`, `rejectVideo()`, `requestVideoGeneration()` |




### Workers


| Worker                                   | Queue                   | Concurrency |
| ---------------------------------------- | ----------------------- | ----------- |
| `src/workers/ai.worker.ts`               | `ai_processing_jobs`    | 5           |
| `src/workers/image-generation.worker.ts` | `image_generation_jobs` | 2           |
| `src/workers/video-generation.worker.ts` | `video_generation_jobs` | 1           |




### API Routes


| Route                                        | Method | Action                               |
| -------------------------------------------- | ------ | ------------------------------------ |
| `/api/v1/admin/fabrics/[id]/generate-image`  | POST   | Trigger image gen                    |
| `/api/v1/admin/fabrics/[id]/generate-video`  | POST   | Trigger single video                 |
| `/api/v1/admin/fabrics/[id]/generated-media` | GET    | List media                           |
| `/api/v1/admin/social/generate-video`        | POST   | Trigger single video (alt)           |
| `/api/v1/admin/social/bulk/generate-video`   | POST   | Bulk trigger `{ fabric_ids: [...] }` |
| `/api/v1/admin/social/[id]/approve-video`    | POST   | `{ approved: bool, notes?: string }` |
| `/api/v1/webhooks/vertex-ai/video-complete`  | POST   | Veo callback                         |




### DB Schema


| Table                 | Key Columns                        |
| --------------------- | ---------------------------------- |
| `generated_media`     | `id`, `fabric_id`, `type` ('image' |
| `social_posts.status` | Added `'VIDEO_PENDING'` to enum    |




### Constants


| Constant                       | Value                      |
| ------------------------------ | -------------------------- |
| `QUEUE_NAMES.IMAGE_GENERATION` | `'image_generation_jobs'`  |
| `QUEUE_NAMES.VIDEO_GENERATION` | `'video_generation_jobs'`  |
| `GOOGLE_AI_MODELS.TEXT`        | `'gemini-3.5-flash'`       |
| `GOOGLE_AI_MODELS.IMAGE`       | `'gemini-3.1-flash-image'` |
| `GOOGLE_AI_MODELS.VIDEO`       | `'veo-3.1-generate-001'`   |


