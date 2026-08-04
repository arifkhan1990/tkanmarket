# TkanMarket — AI Service Recommendation (Google Ecosystem)

> **Goal**: Single provider diye sob kaj — text, image, video for reels/shorts
> **Current**: OpenAI GPT-4o only for text

---

## 1. Google er Current AI Models (June 2026)

| Capability | Google Model | Price | Quality |
|------------|-------------|-------|---------|
| **Text** | Gemini 3.1 Flash | $1.00/1M input, $6.00/1M output | ★★★★★ |
| **Image** | Gemini 2.5 Flash Image (Nano Banana) | $0.039/image | ★★★★★ |
| **Image** | Imagen 4 Fast | $0.02/image | ★★★★☆ |
| **Video** | Veo 3.1 Lite | $0.03-0.05/sec (720p) | ★★★★☆ |
| **Video** | Veo 3.1 Fast | $0.08-0.12/sec (1080p) | ★★★★★ |
| **Video** | Veo 3.1 Standard | $0.20-0.40/sec (1080p/4K) | ★★★★★ |
| **All-in-One** | **Gemini Omni Flash** (NEW) | Pricing TBA | ★★★★★ |

---

## 2. The Big News: Gemini Omni Flash (Google I/O 2026)

May 19, 2026 te Google **Gemini Omni Flash** launch koreche — **ekta model ja text, image, audio, video — sob create korte pare**:

```
Input: Text / Image / Audio / Video
                    │
            Gemini Omni Flash
                    │
Output: Text / Image / Audio / Video  ← ALL FROM ONE MODEL
```

- **Eta tai apni khujchen**: exactly one model that does everything
- Image-to-video, text-to-video, text-to-image — sob ekta API call e
- Real-world knowledge use kore (fabric, textile terms bujhe)
- Rollout started in Gemini app + YouTube Shorts (May 19)
- **API te asbe "coming weeks" e** — matlab June/July 2026 er moddhe

**Problem**: June 2026 e API e general availability hoyni ekhono. Tawai **ekhoni kaj suru korar jonno Vega 3.1 Lite + Gemini 3.1 Flash + Gemini 2.5 Flash Image** combo best. Omni Flash API available hole pore migrate kora jabe.

---

## 3. Google Vertex AI — Single Provider Solution

Vertex AI Google Cloud er ekta unified platform — **same API key, same SDK, same billing** diye sob Google model use kora jay.

### Complete Stack with Google Only

```
┌─────────────────────────────────────────────────────┐
│              GOOGLE VERTEX AI (Single Provider)       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  TEXT →  Gemini 3.1 Flash                             │
│          $1.00/1M in / $6.00/1M out                   │
│          GPT-4o er theke sasto, sameness quality      │
│                                                      │
│  IMAGE → Gemini 2.5 Flash Image (Nano Banana)        │
│          $0.039/image                                │
│          Product image er jonno best                  │
│          Fabric texture, textile term bujhe            │
│                                                      │
│  VIDEO → Veo 3.1 Lite (for reels/shorts)             │
│          $0.03-0.05/sec (720p)                       │
│          15 sec reel = $0.45-0.75                     │
│          9:16 aspect ratio (vertical video)           │
│          SynthID watermark automatic                  │
│                                                      │
│  FUTURE → Gemini Omni Flash                          │
│          Single model for ALL                         │
│          API available soon                           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 4. Pricing Comparison

### Per 1,000 Fabrics (Full Pipeline)

| Item | Google Solution | Cost |
|------|----------------|------|
| **Text Enrichment** (~4K tokens) | Gemini 3.1 Flash | ~$4.00 |
| **Social Text** (5 platforms) | Gemini 3.1 Flash | ~$2.00 |
| **Blog Posts** | Gemini 3.1 Flash | ~$1.00 |
| **Product Images** (4 per fabric) | Gemini 2.5 Flash Image | $156.00 |
| **Video Reels** (1 per fabric, 15s) | Veo 3.1 Lite | $450-750 |
| **Total** | | **~$613-913/month** |

Hmm, video khub expensive. Ei jonno **phased approach** better.

### Cost-Saving Alternative (Hybrid)

| Item | Solution | Cost |
|------|----------|------|
| Text | Gemini 3.1 Flash | ~$7.00 |
| Images | Gemini 2.5 Flash Image | $156.00 |
| **Video (template-based)** | **Shotstack / Remotion** | **~$3.00** |
| **Total** | | **~$166/month** |

### Vs Current (GPT-4o Only, Text Only)

| Solution | Cost | Includes |
|----------|------|----------|
| **Current** (GPT-4o text only) | ~$100/mo | Only text |
| **Google + Veo 3.1 Lite** | ~$900/mo | Text + Image + Video |
| **Google + Shotstack video** | ~$170/mo | Text + Image + Video |
| **Google Omni Flash** (future) | ? | All-in-one |

---

## 5. Quality Assessment per Task

### Text Generation (Product Enrichment)
- **Gemini 3.1 Flash vs GPT-4o**: Almost equal quality
- Gemini's advantage: World knowledge — understands Chinese textile terms, fabric composition better
- Russian language support: Excellent
- **Verdict**: ★★★★★ Can fully replace GPT-4o

### Image Generation (Product Photos)
- **Gemini 2.5 Flash Image (Nano Banana)**: State-of-the-art
- World knowledge use kore — fabric type, texture, weave pattern bujhe accurate image generate kore
- Supports 9:16, 1:1, 16:9, 4:3, 3:4 aspect ratios
- Text rendering in image is excellent (important for social posts with text overlay)
- **Verdict**: ★★★★★ Professional quality, B2B suitable

### Video Generation (Reels/Shorts)
- **Veo 3.1 Lite**: Good quality, fast, cheap
- **Veo 3.1 Fast**: Better quality, $0.08-0.10/sec
- 9:16 vertical format — perfect for TikTok, Instagram Reels, YouTube Shorts
- Image-to-video support: fabric photo diye video generate kora jay
- Audio automatically synchronized
- **Verdict**: ★★★★☆ Professional, but expensive for bulk (1,000 fabrics = $450-750)

---

## 6. Current Codebase Integration Path

### Step 1: Install Google AI SDK
```bash
npm install @google/generative-ai
```

### Step 2: Create Google AI Client
**New file**: `src/lib/google/client.ts`
- Singleton client for Google Generative AI
- Support for Gemini 3.1 Flash, Gemini 2.5 Flash Image, Veo 3.1

### Step 3: Replace OpenAI Calls (3 files to change)
- `src/services/ai.service.ts` — `callOpenAI` → `callGemini`
- Add `responseModalities: ["Text", "Image"]` support for image output
- Keep existing Drizzle + Zod validation pipeline same

### Step 4: Add Image Generation
- New method in `AIService`: `generateProductImage(fabricId, aspectRatio?)`
- Call Gemini 2.5 Flash Image with fabric description
- Store URL in `fabrics.images` (existing column)

### Step 5: Add Video Generation
- New method: `generateReel(fabricId, platform)`
- Call Veo 3.1 Lite with image + text prompt
- 9:16 aspect ratio, 15-30 seconds
- Store video URL in `social_posts.media_urls`

### Files to Keep Unchanged
- `src/db/schema/*` — No DB changes needed
- `src/workers/social.worker.ts` — Same queue pattern
- `src/lib/social/image-variants.ts` — Platform dimension logic stays
- `src/types/ai.types.ts` — Add new types alongside existing

---

## 7. Recommendation Summary

```
╔══════════════════════════════════════════════════════════════╗
║              FINAL RECOMMENDATION (GOOGLE ONLY)              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   PLATFORM → Google Vertex AI (unified SDK + billing)        ║
║                                                              ║
║   TEXT     → Gemini 3.1 Flash  ($1/$6 per 1M tokens)        ║
║   IMAGES   → Gemini 2.5 Flash Image ($0.039/image)           ║
║   VIDEO    → Veo 3.1 Lite ($0.03-0.05/sec) OR               ║
║              Shotstack ($0.003/video) for cost saving         ║
║                                                              ║
║   SESSION  → Google AI Studio or Vertex AI                   ║
║                                                              ║
║   MONTHLY  → ~$170 (Google + template video)                 ║
║           or ~$900 (Google + Veo AI video)                   ║
║           vs ~$100 currently (text-only GPT-4o)              ║
║                                                              ║
║   QUALITY  → ★★★★★ Text : ★★★★★ Images : ★★★★☆ Video       ║
║                                                              ║
║   MIGRATE  → Text + Image now, Video optional now,           ║
║              then Gemini Omni Flash when API releases         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### Key Decisions:

| Decision | Choice | Why |
|----------|--------|-----|
| **One provider** | Google Vertex AI | All models under one platform, one SDK, one billing |
| **Text model** | Gemini 3.1 Flash | Fast, cheap, excellent quality, understands textile domain |
| **Image model** | Gemini 2.5 Flash Image | World knowledge helps generate accurate fabric textures |
| **Video model** | Veo 3.1 Lite (or Shotstack) | 9:16 for reels, image-to-video supported; Shotstack for budget |
| **Future** | Gemini Omni Flash | When API releases — single model replaces all three above |

### Why Google > OpenAI for this Project:
1. **Single ecosystem**: Google-ke text, image, video — sob ekta platform e
2. **World knowledge**: Gemini er fabric/textile domain knowledge beshi
3. **Veo 3.1**: OpenAI Sora teu emon video model nei (Sora only via ChatGPT subscription)
4. **Imagen 4**: DALL-E 3 er cheye sasto ($0.02 vs $0.04)
5. **Gemini Omni Flash**: Bhabishyote ekta model e sob hobe
6. **Russian language support**: Gemini supports Russian natively (important for meta_title_ru, description_ru)

### Risk:
- **Gemini Omni Flash API** available na howa porjonto Veo alada model use korte hobe
- Google Cloud setup needs (Vertex AI enable korte hobe)
- Existing OpenAI code modify korte hobe
