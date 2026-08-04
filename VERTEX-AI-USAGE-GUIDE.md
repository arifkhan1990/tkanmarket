# Vertex AI Integration — Usage Guide

## Authentication Setup

`.env` ফাইলে তোমার service account JSON key সেট করা আছে:

```env
GOOGLE_VERTEX_AI_PROJECT_ID="tkanmarket-ai"
GOOGLE_VERTEX_AI_LOCATION="us-central1"
GOOGLE_APPLICATION_CREDENTIALS="src/config/tkanmarket-ai-bdc469cc274c.json"
```

**GOOGLE_APPLICATION_CREDENTIALS** = JSON key file path. ADC (Application Default Credentials) automatically reads this.

---

## Feature Overview (3 Phases)

| Phase | Feature | Model | Auto/Manual |
|-------|---------|-------|-------------|
| 1 | Text enrichment (fabric data) | Gemini 3.5 Flash | **Auto** (crawler → AI queue) |
| 1 | Social media captions | Gemini 3.5 Flash | **Auto** (after AI processing) |
| 1 | Blog post generation | Gemini 3.5 Flash | **Auto** |
| 2 | Product image generation | Gemini 3.1 Flash Image | **Auto** (after AI processing) |
| 3 | Video/reel generation | Veo 3.1 Lite | **Manual** (Admin button click) |
| 3 | Video approval | — | **Manual** (Admin approves) |

---

## Phase 1: Text Generation (Gemini 3.5 Flash)

### How it works
Crawler from 1688/Alibaba raw data scrapes → AI Queue processes via `src/workers/ai.worker.ts` → calls `AIService.processFabric()` → uses `callGemini()` with Gemini 3.5 Flash.

### Trigger manually
```bash
# Via API - process a single fabric
curl -X POST http://localhost:3000/api/v1/admin/ai/process \
  -H "Content-Type: application/json" \
  -d '{"fabric_id": 123}'

# Or add to AI queue directly (from code)
import { addAIJob } from '@/lib/queue/helpers'
await addAIJob(123)
```

### What gets generated
- `title_en` — English product title
- `description_en` — English description
- `meta_title_ru` / `meta_description_ru` — Russian SEO metadata
- `fabric_type`, `gsm`, `width_cm`, `moq`, `price_usd` — Structured attributes
- `composition` — Material breakdown with percentages
- `tags` — Search tags
- `image_urls` — Scraped image URLs extracted from raw data

### Social content
After AI processing, `SocialService.createContentJob()` runs automatically. It:
1. Scores the fabric (0-100) based on image count, materials, GSM, MOQ, etc.
2. If score >= 50, enqueues social content generation for all 5 platforms
3. Each platform gets platform-optimized caption + hashtags + content type

### Blog post
```typescript
import { AIService } from '@/services/ai.service'
const blog = await AIService.generateBlogPost(123)
// { title: string, content: string }
```

---

## Phase 2: Image Generation (Gemini 3.1 Flash Image)

### How it works
After AI text processing completes, `ai.worker.ts` automatically enqueues an `IMAGE_GENERATION` job. The `image-generation.worker.ts` picks it up and:

1. Calls `ImageGenerationService.generateForFabric(fabricId)`
2. Builds a prompt using fabric title
3. Calls `generateGeminiImage()` via Vertex AI
4. Uploads generated image to Cloudflare R2
5. Records in `generated_media` table with status `COMPLETED`

### Trigger manually
```bash
# Via API
curl -X POST http://localhost:3000/api/v1/admin/generated-media/generate \
  -H "Content-Type: application/json" \
  -d '{"fabric_id": 123, "prompt": "Optional custom prompt here"}'

# Or from code
import { addImageGenerationJob } from '@/lib/queue/helpers'
await addImageGenerationJob(123, 'Custom prompt for this fabric')
```

### Query generated images
```sql
SELECT * FROM generated_media 
WHERE fabric_id = 123 AND type = 'image' 
ORDER BY created_at DESC;
```

### A/B Testing
```typescript
import { MediaABTestService } from '@/services/media-ab-test.service'

// Create 3 variant prompts for same fabric
const mediaIds = await MediaABTestService.createTestVariants(123, 3)

// Record user interaction (view/click/share)
await MediaABTestService.recordInteraction(mediaId, 'click')

// Get winning variant
const winnerId = await MediaABTestService.getWinner(123)
```

### Budget controls (Redis-backed)
```typescript
import { AIBudgetTracker } from '@/lib/rate-limit/ai-budget'

// Check if quota available
const canGenerate = await AIBudgetTracker.consumeImageQuota()

// Track spend
await AIBudgetTracker.recordSpend(0.039)

// Get daily usage
const usage = await AIBudgetTracker.getDailyUsage()
// { images: number, videos: number, cost: number }
```

**Limits:** 200 images/day, 20 videos/day, $100/month budget cap.

---

## Phase 3: Video Generation (Veo 3.1 Lite)

### IMPORTANT: Videos are NOT auto-generated
Videos are only created when an **admin clicks a button**. This keeps costs under control.

### Admin Trigger Flow
```
Admin Dashboard → Fabric List → Click [Generate Video] Button
                                         ↓
                              Dialog opens (duration + platform)
                                         ↓
                              POST /api/v1/admin/social/generate-video
                                         ↓
                              video-generation.worker starts
                                         ↓
                              Veo API called (async, 30-120s)
                                         ↓
                              Worker polls every 10s for completion
                                         ↓
                              Video uploaded to R2
                                         ↓
                              Social post status = VIDEO_PENDING
```

### API: Generate Video
```bash
curl -X POST http://localhost:3000/api/v1/admin/social/generate-video \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "fabric_id": 123,
    "duration": 15,
    "platform": "INSTAGRAM"
  }'

# Response:
# { "data": { "fabric_id": 123, "post_id": 456, "media_id": 789, "status": "VIDEO_PENDING" } }
```

### API: Generate from Code
```typescript
import { SocialService } from '@/services/social.service'
const result = await SocialService.generateVideoForFabric(123, {
  duration: 15,
  platform: 'INSTAGRAM'
})
// { postId: 456, mediaId: 789 }
```

### Admin Review Flow
```
Social Queue → VIDEO_PENDING posts appear
                    ↓
         Admin clicks to preview video
                    ↓
         [Approve] or [Reject] with notes
                    ↓
  If Approved → status = APPROVED → ready for publishing
  If Rejected → status = DRAFT → admin can edit and retry
```

### API: Approve/Reject Video
```bash
# Approve
curl -X POST http://localhost:3000/api/v1/admin/social/456/approve-video \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"approved": true}'

# Reject with notes
curl -X POST http://localhost:3000/api/v1/admin/social/456/approve-video \
  -H "Content-Type: application/json" \
  -d '{"approved": false, "notes": "Low resolution, regenerate with better lighting"}'
```

### React Components (Admin UI)
```tsx
// In admin fabric list page, each row:
import { SocialVideoGenerationDialog } from '@/components/admin/social/social-video-generation-dialog'

<SocialVideoGenerationDialog
  fabricId={123}
  fabricTitle="Italian Silk Satin"
  onGenerationStarted={(result) => console.log('Video queued', result)}
/>

// In admin social post detail page:
import { SocialVideoPreview } from '@/components/admin/social/social-video-preview'

<SocialVideoPreview
  postId={456}
  videoUrl="https://r2.url/video.mp4"
  thumbnailUrl="https://r2.url/thumb.jpg"
  status="VIDEO_PENDING"
  prompt="Slow pan across fabric surface..."
  onApproved={() => refetch()}
  onRejected={() => refetch()}
/>
```

### Webhook (Veo async completion)
When Veo finishes generating, it can call:
```
POST /api/v1/webhooks/vertex-ai/video-complete
Body: { operationName: "...", status: "COMPLETED" }
```

---

## Cost Estimates

| Operation | Model | Cost | With $300 credits |
|-----------|-------|------|-------------------|
| Text enrichment | Gemini 3.5 Flash | ~$0.000001/token | ~300M tokens (75K fabrics) |
| Image generation | Gemini 3.1 Flash Image | $0.039/image | ~7,692 images |
| Video (15s) | Veo 3.1 Lite | $0.60/video | ~500 videos |

**Monthly estimate (realistic):**
- Text: ~$10/mo
- Images (smart gen, 35% fabrics): ~$55/mo
- Videos (20-50 manual): ~$12-30/mo
- **Total: ~$77-95/mo**

---

## Testing Checklist

- [ ] `npm run dev` — app starts without Google auth errors
- [ ] Crawl a fabric → check `generated_media` table for AI-generated images
- [ ] Hit `POST /api/v1/admin/social/generate-video` with a fabric_id → returns `postId`
- [ ] Check `video-generation.worker.ts` logs for Veo API calls
- [ ] After video completes → `GET /api/v1/admin/social/:id` returns `VIDEO_PENDING` status
- [ ] `POST approve-video` → status changes to `APPROVED`
- [ ] Check Redis: `budget:images:daily:*` and `budget:videos:daily:*` keys increment

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Google AI not configured` | No valid auth method found | Check `.env` has `GOOGLE_VERTEX_AI_PROJECT_ID` + `GOOGLE_APPLICATION_CREDENTIALS` |
| `Veo requires Vertex AI` | Using Gemini API key instead of Vertex AI | Set `GOOGLE_VERTEX_AI_PROJECT_ID` |
| Image gen fails with 429 | Rate limited | Worker auto-retries 3x with backoff |
| Video stays `PROCESSING` forever | Veo job hung | Check `video-generation.worker.ts` logs; manually call `pollAndComplete(mediaId)` |
| `R2 upload failed` | R2 not configured | Set `CLOUDFLARE_R2_*` env vars; service keeps GCS URI as fallback |
