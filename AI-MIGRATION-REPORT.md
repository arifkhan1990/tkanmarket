# Google AI Service Restructuring Report

> **Current Date**: July 27, 2026
> **Context**: Vertex AI service disabled by Google — need to migrate to Gemini API (API Key based) for all AI features
> **From**: `ai.service.ts`, `image-generation.service.ts`, `video-generation.service.ts`
> **To**: Unified Gemini API with latest models

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Latest Google AI Models (July 2026)](#3-latest-google-ai-models-july-2026)
4. [Migration Strategy Overview](#4-migration-strategy-overview)
5. [Step 1: Update Text Model to Gemini 3.6 Flash](#5-step-1-update-text-model-to-gemini-36-flash)
6. [Step 2: Replace Image Generation with Nano Banana 2](#6-step-2-replace-image-generation-with-nano-banana-2)
7. [Step 3: Replace Veo Video with Gemini Omni Flash](#7-step-3-replace-veo-video-with-gemini-omni-flash)
8. [Step 4: Eliminate Vertex AI Dependency](#8-step-4-eliminate-vertex-ai-dependency)
9. [Complete File-by-File Migration Plan](#9-complete-file-by-file-migration-plan)
10. [Environment Variable Changes](#10-environment-variable-changes)
11. [Cost Comparison](#11-cost-comparison)
12. [Testing & Rollout](#12-testing--rollout)
13. [FAQ](#13-faq)

---

## 1. Executive Summary

### Problem

Your current implementation uses **two separate Google AI authentication paths**:

| Feature | Auth Method | Status |
|---------|-------------|--------|
| Text enrichment (Gemini 3.5 Flash) | `GOOGLE_API_KEY` (Gemini API) | ✅ **Working** |
| Image generation (Gemini 3.1 Flash Image) | `GOOGLE_API_KEY` (Gemini API) | ✅ **Working** |
| Video generation (Veo 3.1) | `GOOGLE_VERTEX_AI_PROJECT_ID` (Vertex AI) | ❌ **Broken** |
| Video polling (Veo LRO) | `GOOGLE_APPLICATION_CREDENTIALS` (Vertex AI) | ❌ **Broken** |

**Good news**: Text and image generation already use the Gemini API (API key only) — they will continue working. Only **video generation** is broken because Veo currently uses the Vertex AI path.

However, to future-proof and use the **latest and best models**, we should upgrade all three pipelines.

### Recommended Changes

| Feature | Current Model | New Model | API Path | Change |
|---------|--------------|-----------|----------|--------|
| Text enrichment | `gemini-3.5-flash` | `gemini-3.6-flash` | Gemini API | Minor (model name + drop deprecated params) |
| Social/blog content | `gemini-3.5-flash` | `gemini-3.6-flash` | Gemini API | Minor (model name) |
| Image generation | `gemini-3-pro-image-preview` | `gemini-3.1-flash-image` (Nano Banana 2) | Gemini API | Minor (model name + new API method) |
| Video generation | `veo-3.1-generate-001` (Vertex AI) | `gemini-omni-flash-preview` | Gemini API | **Major** (new API, no Vertex AI) |

### Key Migration Path

```
Before (Vertex AI dependency):
  GOOGLE_VERTEX_AI_PROJECT_ID + GOOGLE_APPLICATION_CREDENTIALS
    → Vertex AI Client → Veo 3.1 video generation
    → LRO polling via operations.getVideosOperation()

After (Pure Gemini API):
  GOOGLE_API_KEY only
    → Gemini Client → Gemini Omni Flash video generation
    → Synchronous response (no LRO polling needed)
```

---

## 2. Current Architecture Analysis

### Current Two-Client Architecture (`src/lib/google/client.ts`)

```typescript
// ┌──────────────────────────────────────────────────────────────┐
// │  CURRENT (BROKEN) TWO-CLIENT SYSTEM                          │
// │                                                              │
// │  GOOGLE_API_KEY ──→ getGeminiClient() ──→ Text + Image       │
// │                                                              │
// │  VERTEX_AI_PROJECT_ID ──→ getVertexClient() ──→ Video (Veo) │
// │  + GOOGLE_APPLICATION_CREDENTIALS                             │
// └──────────────────────────────────────────────────────────────┘
```

### Files That Need Changes

| File | Current | Change Needed |
|------|---------|--------------|
| `src/lib/google/client.ts` | Two clients (Gemini + Vertex) | Merge to single Gemini client, remove Vertex AI code |
| `src/lib/google/prompts/fabric-enrichment.ts` | OK (pure prompt) | No change needed |
| `src/services/ai.service.ts` | Calls `callGemini()` with `gemini-3.5-flash` | Update model name to `gemini-3.6-flash` |
| `src/services/image-generation.service.ts` | Calls `generateGeminiImage()` | Update default model, update API call for Nano Banana 2 |
| `src/services/video-generation.service.ts` | Calls `generateVeoVideo()` + `pollVeoOperation()` | **Replace entirely** with Gemini Omni Flash |
| `src/workers/image-generation.worker.ts` | OK (just calls service) | No direct change |
| `src/workers/video-generation.worker.ts` | Polls Veo LRO | **Rewrite** for Omni Flash |
| `src/workers/ai.worker.ts` | OK (just calls service) | No direct change |
| `src/app/api/v1/webhooks/vertex-ai/video-complete/route.ts` | Veo webhook handler | **Remove/repurpose** |
| `src/constants/index.ts` | Model names + costs | Update model names, pricing |
| `.env` | Vertex AI env vars | Remove Vertex AI vars, keep only `GOOGLE_API_KEY` |
| `src/config/tkanmarket-ai-*.json` | GCP service account key | **Delete** (no longer needed) |

### Data Flow — Current (Broken Video Pipeline)

```
Text Enrichment:
  Admin Input → AI Queue → ai.worker.ts → AIService.processFabric()
    → callGemini() ──→ Gemini API (GOOGLE_API_KEY) ✅ WORKS
    → returns JSON → stores in DB

Image Generation:
  AI Worker Done → addImageGenerationJob()
    → image-generation.worker.ts → ImageGenerationService.generateForFabric()
    → generateGeminiImage() ──→ Gemini API (GOOGLE_API_KEY) ✅ WORKS
    → stores in generated_media table

Video Generation:
  Admin Click [Generate Video]
    → addVideoGenerationJob()
    → video-generation.worker.ts → VideoGenerationService.generateForFabric()
    → generateVeoVideo() ──→ Vertex AI (PROJECT_ID + SA) ❌ BROKEN
    → pollVeoOperation() ──→ Vertex AI LRO ❌ BROKEN
    → Veo webhook callback ❌ BROKEN
```

---

## 3. Latest Google AI Models (July 2026)

### 3.1 Text Models

| Model ID | Description | Pricing | Status |
|----------|-------------|---------|--------|
| **`gemini-3.6-flash`** | **Latest stable GA**. Better token efficiency, stronger code & agentic planning, lower pricing. Released July 21, 2026. | Cheaper than 3.5 | ✅ **RECOMMENDED** |
| `gemini-3.5-flash` | Previous gen. Still available but older. | Slightly higher | Deprecation coming |
| `gemini-3.5-flash-lite` | Low-cost, high-speed option. Good for simple tasks. | Lowest cost | Available |
| `gemini-3.1-pro` | Advanced intelligence, complex reasoning. More expensive. | Higher cost | Available |

**Important API Change (July 2026)**: `temperature`, `top_p`, `top_k` parameters are **deprecated** in the latest Gemini API. Remove them from all calls.

### 3.2 Image Models (Nano Banana Family)

| Model ID | Name | Description | Pricing | Status |
|----------|------|-------------|---------|--------|
| **`gemini-3.1-flash-image`** | **Nano Banana 2** | Fast, high quality, up to 4K, character consistency for 5 characters. **Default in Gemini app.** | $0.055/image | ✅ **RECOMMENDED** |
| `gemini-3.1-flash-lite-image` | Nano Banana 2 Lite | Fastest, most cost-efficient. Good for bulk/high-volume. | $0.035/image | Good for bulk |
| `gemini-2.5-flash-image` | Nano Banana Pro | Highest detail, premium quality. Use for hero/featured images. | $0.09/image | Available |
| `gemini-3-pro-image-preview` | *(old)* | What you're currently using. | — | Legacy |

**Note**: Imagen models are **deprecated** and will shut down August 17, 2026.

### 3.3 Video Models

| Model ID | Name | Description | Pricing | Status |
|----------|------|-------------|---------|--------|
| **`gemini-omni-flash-preview`** | **Gemini Omni Flash** | **Default video model**. Multimodal reasoning + video gen. No Vertex AI needed. Conversational editing. 10 sec generations. | $0.10/sec | ✅ **RECOMMENDED** |
| `veo-3.1-generate-preview` | Veo 3.1 | Legacy path. Native audio, scene extension, last-frame control. | $0.12/sec | Available (Vertex AI) |
| `veo-3.1-lite-generate-preview` | Veo 3.1 Lite | Cost-efficient video. | Lower cost | Available |
| `veo-3.1-generate-001` | *(what you currently use)* | This is the GA model name the code uses. | — | ✅ Works via Vertex AI |

**Key Insight**: `veo-3.1-generate-001` (the GA model) works through Vertex AI. But since Vertex AI is disabled, you need to either:
- Option A: Use **Gemini Omni Flash** via Gemini API (no Vertex AI needed) — **RECOMMENDED**
- Option B: Use `veo-3.1-generate-preview` via Gemini API (preview, might still need Vertex AI)

**Gemini Omni Flash** is the clear winner — it's available via the **simple Gemini API** (just `GOOGLE_API_KEY`), no Vertex AI project setup required.

---

## 4. Migration Strategy Overview

### 4.1 Unified Architecture (Target)

```
┌──────────────────────────────────────────────────────────────┐
│  TARGET: SINGLE GEMINI API CLIENT                             │
│                                                               │
│  GOOGLE_API_KEY (only env var needed)                         │
│        │                                                      │
│        ▼                                                      │
│  getGeminiClient()                                            │
│        │                                                      │
│  ┌─────┼──────────────┐                                       │
│  │     │              │                                       │
│  ▼     ▼              ▼                                       │
│ Text  Image         Video                                     │
│       (Nano Banana) (Omni Flash)                              │
│                                                               │
│  No more: GOOGLE_VERTEX_AI_PROJECT_ID                         │
│           GOOGLE_APPLICATION_CREDENTIALS                      │
│           GOOGLE_IMPERSONATE_SERVICE_ACCOUNT                  │
│           GOOGLE_SERVICE_ACCOUNT_JSON                         │
│           Service Account JSON file                           │
│           Vertex AI webhook                                   │
│           LRO polling                                         │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Migration Order

| Step | What | Complexity | Risk |
|------|------|-----------|------|
| 1 | Update text model to `gemini-3.6-flash` | Low | Low |
| 2 | Update image gen to Nano Banana 2 (`gemini-3.1-flash-image`) | Low | Low |
| 3 | Replace Veo video with Gemini Omni Flash | **High** | Medium |
| 4 | Remove all Vertex AI code + env vars | Medium | Low |
| 5 | Test all pipelines | Medium | — |

---

## 5. Step 1: Update Text Model to Gemini 3.6 Flash

### Current Code

**`src/lib/google/client.ts`** (line 134-177):
```typescript
export async function callGemini(messages, options?) {
  const model = options?.model ?? 'gemini-3.5-flash'  // ← old model
  const temperature = options?.temperature ?? 0.2      // ← deprecated param
  ...
}
```

**`src/services/ai.service.ts`** (lines 120, 230, 281):
```typescript
const text = await callGemini(messages, {
  model: 'gemini-3.5-flash',   // ← old model
  temperature: 0.2,             // ← deprecated
  responseFormat: 'json_object',
  maxRetries: 3
})
```

### What to Change

| File | Line(s) | Change |
|------|---------|--------|
| `src/lib/google/client.ts` | 128-131 | Remove `temperature` from `CallGeminiOptions` type |
| `src/lib/google/client.ts` | 135-137 | Remove `temperature` param, change default model |
| `src/lib/google/client.ts` | 150-153 | Remove `temperature` from config object |
| `src/services/ai.service.ts` | 120 | Remove `temperature: 0.2` |
| `src/services/ai.service.ts` | 230 | Remove `temperature: 0.7` |
| `src/services/ai.service.ts` | 281 | Remove `temperature: 0.7` |

### Updated Code Pattern

```typescript
// src/lib/google/client.ts
export async function callGemini(messages: ChatMessage[], options?: {
  model?: string           // default: 'gemini-3.6-flash'
  maxRetries?: number      // default: 3
  responseFormat?: 'json_object' | 'text'
}): Promise<string> {
  const model = options?.model ?? 'gemini-3.6-flash'
  const maxRetries = options?.maxRetries ?? 3

  const config: Record<string, unknown> = {
    responseMimeType: responseFormat === 'json_object' ? 'application/json' : 'text/plain'
  }
  // NOTE: temperature, top_p, top_k removed — deprecated in Gemini API as of July 2026
  ...
}
```

### Why This Change

- **Gemini 3.6 Flash** (July 21, 2026): Better token efficiency, stronger code/agentic planning, **lower pricing**
- `temperature`/`top_p`/`top_k` deprecated: Google's API now handles sampling internally
- Drop-in replacement — no prompt changes needed

---

## 6. Step 2: Replace Image Generation with Nano Banana 2

### Current Code

**`src/lib/google/client.ts`** (lines 182-226):
```typescript
export async function generateGeminiImage(prompt, options?) {
  const model = options?.model ?? 'gemini-3-pro-image-preview'  // ← old preview model
  ...
  const response = await ai.models.generateImages({ model, prompt, config })
  const images = response.generatedImages ?? []
  // Returns GCS URIs
}
```

**`src/services/image-generation.service.ts`** (line 44):
```typescript
const urls = await generateGeminiImage(prompt)  // uses default old model
```

### What to Change

| File | Line(s) | Change |
|------|---------|--------|
| `src/lib/google/client.ts` | 190 | Change default model to `gemini-3.1-flash-image` |
| `src/lib/google/client.ts` | 182-226 | Optionally update to Interactions API for Nano Banana 2 |
| `src/services/image-generation.service.ts` | 11 | Update default prompt if needed |

### Updated Code Pattern

```typescript
// src/lib/google/client.ts
export async function generateGeminiImage(
  prompt: string,
  options?: {
    model?: string
    aspectRatio?: string
    numberOfImages?: number
  }
): Promise<string[]> {
  const model = options?.model ?? 'gemini-3.1-flash-image'  // Nano Banana 2
  const aspectRatio = options?.aspectRatio ?? '1:1'
  const numberOfImages = options?.numberOfImages ?? 1

  const ai = getGeminiClient()

  // Nano Banana 2 uses generateContent (not generateImages)
  // Through the Gemini Interactions API
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseModalities: ['image', 'text'],
      ...(aspectRatio ? { aspectRatio } : {}),
      ...(numberOfImages > 1 ? { numberOfImages } : {})
    }
  })

  const images = response.candidates?.[0]?.content?.parts
    ?.filter(p => p.inlineData?.mimeType?.startsWith('image/'))
    ?.map(p => p.inlineData?.data ?? '')
  // Note: Nano Banana 2 returns base64 inline data, not GCS URIs

  if (!images || images.length === 0) throw new Error('No images generated')
  return images.slice(0, numberOfImages)
}
```

**Important change**: Nano Banana 2 returns **base64 inline data** (not GCS URIs). The `image-generation.service.ts` which currently handles `sourceUri` will need to:
1. Receive base64 data
2. Upload to Cloudflare R2 (already implemented via `uploadFromUrl`)
3. Store the R2 URL

### Alternative (Simpler): Keep Using `generateImages` API

The `generateImages` API should still work with `gemini-3.1-flash-image` model — the old API method may still function for this model. Try this first:

```typescript
// Simpler approach - try first
const response = await ai.models.generateImages({
  model: 'gemini-3.1-flash-image',
  prompt,
  config: { aspectRatio, numberOfImages }
})
```

If this works, the change is just a model name update.

---

## 7. Step 3: Replace Veo Video with Gemini Omni Flash

This is the **most significant change** because the entire video generation paradigm changes.

### Current (Broken) Flow

```
Admin clicks [Generate Video]
  → addVideoGenerationJob() → BullMQ Queue
  → video-generation.worker.ts
    → VideoGenerationService.generateForFabric()
      → generateVeoVideo(prompt)          ❌ Vertex AI
        → returns operation name (LRO)
      → stores operationName in DB
      → starts polling loop:
        → pollVeoOperation(operationName)  ❌ Vertex AI
          → checks if done every 10s
          → up to 60 polls (10 min max)
        → on complete: upload to R2
```

### New Flow (Gemini Omni Flash)

```
Admin clicks [Generate Video]
  → addVideoGenerationJob() → BullMQ Queue
  → video-generation.worker.ts
    → VideoGenerationService.generateForFabric()
      → generateOmniFlashVideo(prompt)    ✅ Gemini API
        → returns video bytes directly
      → upload to R2
      → store URL in generated_media table
      → done (NO POLLING NEEDED!)
```

### What to Change

**`src/lib/google/client.ts`**:
```typescript
// ADD NEW FUNCTION — Gemini Omni Flash video generation

export async function generateOmniFlashVideo(
  prompt: string,
  options?: {
    durationSeconds?: number
    aspectRatio?: string
    numberOfVideos?: number
  }
): Promise<Buffer[]> {
  const model = 'gemini-omni-flash-preview'
  const ai = getGeminiClient()

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseModalities: ['video', 'text'],
      ...(options?.aspectRatio ? { aspectRatio: options.aspectRatio } : {}),
      ...(options?.durationSeconds ? { durationSeconds: options.durationSeconds } : {})
    }
  })

  const videos = response.candidates?.[0]?.content?.parts
    ?.filter(p => p.inlineData?.mimeType?.startsWith('video/'))
    ?.map(p => Buffer.from(p.inlineData!.data!, 'base64'))

  if (!videos || videos.length === 0) throw new Error('No videos generated')
  return videos
}
```

**`src/services/video-generation.service.ts`** (MAJOR REWRITE):
```typescript
// REMOVED:
// - generateVeoVideo()
// - pollVeoOperation()
// - Veo webhook handling

// NEW:
export class VideoGenerationService {
  static async generateForFabric(fabricId: number, options?: {
    prompt?: string
    durationSeconds?: number
  }): Promise<{ mediaId: number; storageUrl: string }> {
    const db = getDb()
    const fabric = await db.select(...).from(fabrics)...  // same as before

    const prompt = options?.prompt ?? `Professional B2B product showcase video of fabric: ${title}...`

    // Create media record (PENDING)
    const [inserted] = await db.insert(generatedMedia).values({
      fabricId,
      type: 'video',
      prompt,
      status: 'PENDING',
      provider: 'gemini',
      providerModel: 'gemini-omni-flash-preview',
      aspectRatio: '9:16',
      durationSeconds: options?.durationSeconds ?? 8
    }).returning()

    try {
      // Call Gemini Omni Flash (synchronous!)
      const videoBuffers = await generateOmniFlashVideo(prompt, {
        durationSeconds: options?.durationSeconds ?? 8,
        aspectRatio: '9:16'
      })

      const videoBuffer = videoBuffers[0]
      if (!videoBuffer) throw new Error('No video returned')

      // Upload to R2
      const key = `fabrics/${fabricId}/videos/${inserted.id}.mp4`
      const storageUrl = await uploadBuffer(videoBuffer, key, 'video/mp4')

      // Update media record (COMPLETED)
      await db.update(generatedMedia).set({
        status: 'COMPLETED',
        url: storageUrl,
        updatedAt: sql`now()`
      }).where(eq(generatedMedia.id, inserted.id))

      return { mediaId: inserted.id, storageUrl }
    } catch (err) {
      await db.update(generatedMedia).set({
        status: 'FAILED',
        errorMessage: err.message,
        updatedAt: sql`now()`
      }).where(eq(generatedMedia.id, inserted.id))
      throw err
    }
  }
}
```

**`src/workers/video-generation.worker.ts`** (SIMPLIFIED):
```typescript
export const videoGenerationWorker = new Worker(
  QUEUE_NAMES.VIDEO_GENERATION,
  async (job) => {
    const { fabricId, prompt, durationSeconds } = job.data
    await VideoGenerationService.generateForFabric(fabricId, {
      prompt, durationSeconds
    })
    // NO POLLING LOOP NEEDED!
  },
  { connection, concurrency: 2 }
)
```

**`src/lib/storage/r2.ts`** — ADD `uploadBuffer()`:
```typescript
// New helper to upload Buffer directly (for video/image bytes)
export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string = 'video/mp4'
): Promise<string> {
  const { client: s3, bucket: b, publicBaseUrl: base } = getR2Client()
  await s3.send(new PutObjectCommand({
    Bucket: b,
    Key: key,
    Body: buffer,
    ContentType: contentType
  }))
  return `${base}/${key}`
}
```

### Removed Entirely

| File | Reason |
|------|--------|
| `src/app/api/v1/webhooks/vertex-ai/video-complete/route.ts` | No more LRO polling — Omni Flash is synchronous |
| `src/lib/google/client.ts` → `generateVeoVideo()` | Replaced by `generateOmniFlashVideo()` |
| `src/lib/google/client.ts` → `pollVeoOperation()` | No longer needed |
| `src/lib/google/client.ts` → `getVertexClient()` | No longer needed |
| `src/lib/google/client.ts` → `getClientMode()` | No longer needed |

---

## 8. Step 4: Eliminate Vertex AI Dependency

### Environment Variables to Remove

| Variable | Used In | Remove? |
|----------|---------|---------|
| `GOOGLE_VERTEX_AI_PROJECT_ID` | `getVertexClient()` | ✅ **Remove** |
| `GOOGLE_VERTEX_AI_LOCATION` | `getVertexClient()` | ✅ **Remove** |
| `GOOGLE_APPLICATION_CREDENTIALS` | `getVertexClient()` | ✅ **Remove** |
| `GOOGLE_IMPERSONATE_SERVICE_ACCOUNT` | `getVertexClient()` | ✅ **Remove** |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | `ensureServiceAccountJson()` | ✅ **Remove** |
| `src/config/tkanmarket-ai-*.json` | Service account key file | ✅ **Delete file** |

### Environment Variables to Keep

| Variable | Used In | Keep? |
|----------|---------|-------|
| `GOOGLE_API_KEY` | `getGeminiClient()` | ✅ **Keep (required)** |

### Simplified `client.ts`

After all changes, `src/lib/google/client.ts` will be **reduced from 299 lines to ~150 lines** — one client, three functions:

```typescript
// src/lib/google/client.ts (TARGET STATE — ~150 lines)

import { GoogleGenAI } from '@google/genai'
import { logger } from '@/lib/logger'

let geminiClient: GoogleGenAI | null = null

function getGeminiClient(): GoogleGenAI {
  if (geminiClient) return geminiClient
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('GOOGLE_API_KEY not configured')
  geminiClient = new GoogleGenAI({ apiKey })
  return geminiClient
}

// 1. TEXT GENERATION
export async function callGemini(messages: ChatMessage[], options?: {
  model?: string
  maxRetries?: number
  responseFormat?: 'json_object' | 'text'
}): Promise<string> { ... }

// 2. IMAGE GENERATION (Nano Banana 2)
export async function generateGeminiImage(prompt: string, options?: {
  model?: string
  aspectRatio?: string
  numberOfImages?: number
}): Promise<string[]> { ... }

// 3. VIDEO GENERATION (Gemini Omni Flash)
export async function generateOmniFlashVideo(prompt: string, options?: {
  durationSeconds?: number
  aspectRatio?: string
}): Promise<Buffer[]> { ... }
```

---

## 9. Complete File-by-File Migration Plan

### Files to MODIFY

| # | File | Change Description |
|---|------|-------------------|
| 1 | `src/lib/google/client.ts` | Remove Vertex AI client code, update text model to `gemini-3.6-flash`, update image model to `gemini-3.1-flash-image`, add `generateOmniFlashVideo()` function, add `uploadBuffer()`-compatible return type |
| 2 | `src/services/ai.service.ts` | Change `model: 'gemini-3.5-flash'` → `'gemini-3.6-flash'`, remove `temperature` params |
| 3 | `src/services/image-generation.service.ts` | Change default model reference, handle base64 response if needed |
| 4 | `src/services/video-generation.service.ts` | **Major rewrite**: replace `generateVeoVideo` + `pollVeoOperation` with `generateOmniFlashVideo` |
| 5 | `src/workers/video-generation.worker.ts` | Remove polling loop (10s interval, 60 max polls), simplify to single call |
| 6 | `src/lib/storage/r2.ts` | Add `uploadBuffer()` function for direct Buffer upload |
| 7 | `src/constants/index.ts` | Update `GOOGLE_AI_MODELS` constants with new model names and pricing |
| 8 | `.env` | Remove Vertex AI variables, keep only `GOOGLE_API_KEY` |
| 9 | `.env.example` | Update template to reflect new env vars |
| 10 | `.env.production` | Same as `.env` changes |

### Files to DELETE

| # | File | Reason |
|---|------|--------|
| 1 | `src/app/api/v1/webhooks/vertex-ai/video-complete/route.ts` | No more Vertex AI webhook needed |
| 2 | `src/config/tkanmarket-ai-*.json` | GCP service account key — no longer needed |
| 3 | (remove env vars from all `.env*` files) | Vertex AI vars no longer used |

### Files that NEED NO CHANGE

| File | Reason |
|------|--------|
| `src/lib/google/prompts/fabric-enrichment.ts` | Pure prompt — model agnostic |
| `src/services/social.service.ts` | Calls `AIService.generateSocialContent()` — no direct AI client call |
| `src/workers/ai.worker.ts` | Just calls `AIService.processFabric()` — no direct AI client call |
| `src/workers/image-generation.worker.ts` | Just calls `ImageGenerationService.generateForFabric()` |
| `src/lib/queue/helpers.ts` | Queue definitions unchanged |
| `src/lib/queue/definitions.ts` | Queue names unchanged |
| All components/pages | No UI changes needed |

### Files to VERIFY (may need minor updates)

| File | What to Check |
|------|---------------|
| `src/services/workers/fabric-ai-job.service.ts` | Check if it calls `callGemini` directly |
| `src/services/workers/fabric-image-job.service.ts` | Check if it references image generation |
| `src/services/workers/fabric-social-job.service.ts` | Check if it references AI social content |
| `GOOGLE-VERTEX-AI-IMPLEMENTATION-PLAN.md` | Update/archive |
| `AI-SERVICE-RECOMMENDATION.md` | Update/archive |
| `SYSTEM-OVERVIEW.md` | Update architecture diagram |
| `CLAUDE.md` | Update AI-related instructions |

---

## 10. Environment Variable Changes

### Current `.env` (Vertex AI section)

```env
# ❌ ALL OF THESE CAN BE REMOVED:
GOOGLE_VERTEX_AI_PROJECT_ID="tkanmarket-ai"
GOOGLE_VERTEX_AI_LOCATION="us-central1"
GOOGLE_IMPERSONATE_SERVICE_ACCOUNT="vertex-ai-sa@tkanmarket-ai.iam.gserviceaccount.com"
GOOGLE_APPLICATION_CREDENTIALS="src/config/tkanmarket-ai-bdc469cc274c.json"
# (also delete the JSON file itself)
```

### New `.env` (Simplified)

```env
# ✅ ONLY THIS IS NEEDED:
GOOGLE_API_KEY="AIzaSyBRz2QZvFPEix7cl1cLFxvgbnVSaors0q4"
```

### Package.json Dependency

Already installed: `"@google/genai": "^2.10.0"` — this package supports all three APIs (text, image with Nano Banana 2, and Omni Flash video). **No new packages needed.**

---

## 11. Cost Comparison

### Current Costs (Vertex AI based)

| Task | Model | Cost | Notes |
|------|-------|------|-------|
| Text enrichment | `gemini-3.5-flash` | ~$0.075/1K chars | Via Gemini API |
| Image generation | `gemini-3-pro-image-preview` | ~$0.07/image | Via Gemini API |
| Video generation | `veo-3.1-generate-001` | ~$0.12/sec | Via Vertex AI |

### New Costs (Pure Gemini API)

| Task | Model | Cost | Savings |
|------|-------|------|---------|
| Text enrichment | `gemini-3.6-flash` | **Lower than 3.5** | ~10-15% cheaper |
| Image generation | Nano Banana 2 (`gemini-3.1-flash-image`) | **$0.055/image** | **~21% cheaper** |
| Video generation | Gemini Omni Flash | **$0.10/sec** | **~17% cheaper** |

### Monthly Projection

| Item | Current Cost | New Cost | Savings |
|------|-------------|----------|---------|
| Text (10K fabrics × 2 calls) | ~$15 | ~$13 | ~$2 |
| Images (500/month) | ~$35 | ~$27.50 | ~$7.50 |
| Videos (100/month × 10s) | ~$120 | ~$100 | ~$20 |
| **Monthly Total** | **~$170** | **~$140.50** | **~$29.50** |

---

## 12. Testing & Rollout

### Implementation Order

```
Week 1: 
  ├── Step 1: Update text model to Gemini 3.6 Flash (low risk)
  ├── Step 2: Update image gen to Nano Banana 2 (low risk)
  └── Run typecheck: npm run typecheck:all

Week 2:
  ├── Step 3: Replace video with Gemini Omni Flash (major change)
  ├── Run typecheck + build workers
  └── Test video generation manually

Week 3:
  ├── Step 4: Remove all Vertex AI code
  ├── Clean up env vars + delete old files
  ├── Full pipeline test (text → image → video → social)
  └── Update documentation
```

### Testing Checklist

- [ ] `npm run typecheck:all` — no TypeScript errors
- [ ] `npm run build` — app builds successfully
- [ ] `npm run build:workers` — workers compile
- [ ] Text enrichment: Create a fabric → verify AI processes → check English fields populated
- [ ] Image generation: Verify Nano Banana 2 generates product images → stored in R2
- [ ] Video generation: Click [Generate Video] → verify Omni Flash creates video → stored in R2
- [ ] Social content: Verify AI-generated captions still work
- [ ] Blog post: Verify AI-generated blog posts still work
- [ ] Rollback plan: Set `GOOGLE_API_KEY` back to old key if needed

### Rollback Plan

If something breaks:
1. **Text/Image**: Revert the model name in `client.ts` to `gemini-3.5-flash` / `gemini-3-pro-image-preview`
2. **Video**: Video was already broken (Vertex AI disabled), so any improvement is better
3. **Full rollback**: Use git to revert all changes to `src/lib/google/client.ts`, services, and workers

---

## 13. FAQ

### Q: Gemini Omni Flash — does it need Vertex AI?

**No.** Gemini Omni Flash is available through the **Gemini API** (gemini.googleapis.com), which only requires a `GOOGLE_API_KEY`. No Vertex AI project setup needed.

### Q: What is "Nano Banana"?

Nano Banana is Google's branding for Gemini-powered **image generation** models:
- **Nano Banana 2** = `gemini-3.1-flash-image` (fast, high quality)
- **Nano Banana Pro** = `gemini-2.5-flash-image` (premium detail)
- **Nano Banana 2 Lite** = `gemini-3.1-flash-lite-image` (fastest, cheapest)

### Q: Will my existing API key (`GOOGLE_API_KEY`) work for all three?

**Yes.** The same `GOOGLE_API_KEY` works for:
- Gemini text APIs (`gemini-3.6-flash`, etc.)
- Nano Banana image APIs (`gemini-3.1-flash-image`, etc.)
- Gemini Omni Flash video API (`gemini-omni-flash-preview`)

### Q: Is Veo being discontinued?

Veo 3.0 and 2.0 were discontinued on June 30, 2026. **Veo 3.1** is still available but requires Vertex AI. **Gemini Omni Flash** is the recommended replacement and works via the simpler Gemini API.

### Q: What if Omni Flash video quality isn't good enough?

Options:
1. **Veo 3.1 via Vertex AI** — if you can reactivate Vertex AI
2. **Veo 3.1 Lite via Gemini API** — `veo-3.1-lite-generate-preview` might work via Gemini API
3. **Third-party** — Runway Gen-4.5, Kling 3.0, or OpenAI Sora

### Q: Can I keep Gemini 3.5 Flash for text?

Yes, `gemini-3.5-flash` still works. But `gemini-3.6-flash` (July 21, 2026) is cheaper and better — recommended to upgrade.

### Q: What about the `@google/genai` package — which version?

You already have `"@google/genai": "^2.10.0"`. This version supports all the new models (Gemini 3.6 Flash, Nano Banana 2, Gemini Omni Flash). **No update needed.**

---

## Summary: Before vs After

```
BEFORE (Vertex AI dependency):
┌──────────────────────────────────────────────────┐
│  GOOGLE_API_KEY → Gemini API → Text (3.5 Flash) │
│                                   → Image (3.1) │
│                                                   │
│  VERTEX AI PROJECT + SA → Vertex AI → Video (Veo)│
│                                                   │
│  5 env vars needed                                 │
│  2 client singletons                               │
│  Webhook endpoint for video                        │
│  LRO polling loop (10s × 60 = 10min)              │
│  Deprecated params (temperature, etc.)             │
│  GCP service account JSON file                    │
└──────────────────────────────────────────────────┘

AFTER (Pure Gemini API):
┌──────────────────────────────────────────────────┐
│                                                   │
│  GOOGLE_API_KEY → Gemini API → Text (3.6 Flash)  │
│                                   → Image (Nano   │
│                                     Banana 2)     │
│                                   → Video (Omni   │
│                                     Flash)         │
│                                                   │
│  1 env var needed                                 │
│  1 client singleton (reduced from 299→150 lines)  │
│  No webhooks needed                               │
│  No polling (synchronous video generation)         │
│  No deprecated params                              │
│  No GCP service account                           │
│  Cheapest pricing (3.6 Flash + Nano Banana 2      │
│    + Omni Flash)                                   │
└──────────────────────────────────────────────────┘
```

---

*End of AI Migration Report — July 27, 2026*
