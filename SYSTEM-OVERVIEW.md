# TkanMarket — Complete System Overview

## System Architecture (পুরো সিস্টেম কিভাবে কাজ করে)

```
                   ┌─────────────────┐
                   │   Admin Panel   │
                   │  (Dashboard)    │
                   └────────┬────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌───────────────┐ ┌──────────┐ ┌──────────────┐
    │ Single Create │ │ Bulk     │ │ Excel/CSV    │
    │ /fabrics/new  │ │ Create   │ │ Import       │
    │ (form input)  │ │ /fabrics │ │ (drag & drop)│
    └───────┬───────┘ └────┬─────┘ └──────┬───────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                           ▼
              ┌───────────────────────┐
              │   fabrics table       │
              │   status:             │
              │   "raw_scraped"       │  ← Admin input raw data
              └───────────┬───────────┘
                          │  Auto: AI job enqueued
                          ▼
              ┌───────────────────────┐
              │   AI Worker           │  ← Gemini 3.5 Flash (Vertex AI)
              │   (ai.worker)         │
              │                       │
              │   1. Text enrichment  │  → title_en, description_en,
              │      (Gemini)         │    fabric_type, gsm, width,
              │                       │    composition, tags, price
              │   2. fabric status    │  → "ai_processed"
              │      = done           │
              └───────┬───────────────┘
                      │
          ┌───────────┼───────────────┐
          │           │               │
          ▼           ▼               ▼
  ┌────────────┐ ┌────────┐  ┌──────────────┐
  │ Image Gen  │ │ Social │  │  Blog Post   │
  │ Worker     │ │ Worker │  │  (optional)  │
  │            │ │        │  │              │
  │ Gemini 3.1 │ │ Gemini │  │  Gemini 3.5  │
  │ Flash Image│ │ 3.5    │  │  Flash       │
  │            │ │ Flash  │  │              │
  │ → Product  │ │ → 5    │  │  → SEO blog  │
  │   images   │ │  plat- │  │    post      │
  │            │ │  forms │  │              │
  └──────┬─────┘ └───┬────┘  └──────────────┘
         │           │
         ▼           ▼
  ┌──────────────────────────────────┐
  │     Admin Dashboard Review       │
  │                                  │
  │  • Fabric list → দেখে approve/   │
  │    reject করে                     │
  │  • Social posts → edit করে       │
  │    schedule/publish করে          │
  │  • [Generate Video] button       │
  │    → Veo AI video তৈরি করে       │
  │  • Video preview দেখে → Approve/ │
  │    Reject                        │
  └──────────────────────────────────┘
```

---

## Database Tables (মূল টেবিলসমূহ)

| Table | What it stores | Status flow |
|-------|---------------|-------------|
| `fabrics` | All fabric products | `raw_scraped` → `ai_processing` → `ai_processed` → `approved` / `rejected` |
| `generated_media` | AI-generated images & videos | `PENDING` → `PROCESSING` → `COMPLETED` / `FAILED` |
| `social_posts` | Social media content drafts | `DRAFT` → `APPROVED` → `SCHEDULED` → `PUBLISHED` (or `VIDEO_PENDING` for videos) |
| `suppliers` | Chinese textile suppliers | Linked to fabrics |
| `leads` | Buyer inquiries/leads | `NEW` → `CONTACTED` → `QUALIFIED` → ... |

---

## Admin Dashboard — Complete Role Guide

### 1. Fabric Management (প্রোডাক্ট ম্যানেজমেন্ট)

```
Admin Panel → Admin → Fabrics
```

**Admin যা যা করতে পারে:**

```
 Fabric List Page
 ┌─────────────────────────────────────────────────────────────────┐
 │ [+ Create New] [Bulk Import Excel] [Search] [Filters ▼]        │
 │                                                                 │
 │ ┌─────┬──────────────┬──────────┬──────────────┬──────────────┐│
 │ │ ID  │ Fabric Name  │ Supplier │ Status       │ Actions      ││
 │ ├─────┼──────────────┼──────────┼──────────────┼──────────────┤│
 │ │ 1   │ Italian Silk │ Sup-1    │ ✅ approved   │ [Edit][View] ││
 │ │ 2   │ Cotton Voile │ Sup-2    │ ⏳ raw_scraped│[Process AI]  ││
 │ │ 3   │ Linen Fabric │ Sup-3    │ 🤖 ai_process │ [Edit]      ││
 │ │ 4   │ Polyester    │ Sup-1    │ 📝 ai_process │ [Edit]      ││
 │ │     │ Satin        │          │ ed            │ [Approve]   ││
 │ └─────┴──────────────┴──────────┴──────────────┴──────────────┘│
 │                                                                 │
 │  Status Legend:                                                  │
 │  raw_scraped    → Admin input done, AI pending                  │
 │  ai_processing  → AI worker currently processing                │
 │  ai_processed   → AI done, waiting for admin review             │
 │  approved       → Live in marketplace                           │
 │  rejected       → Hidden, can re-process                        │
 └─────────────────────────────────────────────────────────────────┘
```

#### 1a. Data Input Options

| Method | URL | What you provide |
|--------|-----|-----------------|
| **Single Create** | `/admin/fabrics/new` | Select supplier + enter title (RU) |
| **Bulk CSV/Excel** | `/admin/fabrics/bulk-create` | Upload .xlsx/.csv with title_ru (required), title_en, fabric_type, gsm, width_cm, price_usd, moq, tags |
| **Edit** | `/admin/fabrics/{id}` | Full form with all fields |

**Flow after input:**
```
Admin inputs data  →  status = "raw_scraped"
                           ↓
              Auto: AI Queue-তে job যায়
                           ↓
              Gemini 3.5 Flash enrichment
                           ↓
              status = "ai_processed"
                           ↓
              Auto: Image gen + Social content
                           ↓
              Admin reviews → Approve / Reject
```

### 2. Social Media Queue (সোশ্যাল মিডিয়া ম্যানেজমেন্ট)

```
Admin Panel → Admin → Social → Queue
```

```
 Social Queue Page
 ┌──────────────────────────────────────────────────────────────┐
 │ [Platform Filter] [Status Filter] [Bulk Approve]            │
 │                                                              │
 │ ┌─────┬──────────┬──────────┬──────────────┬───────────────┐│
 │ │ ID  │ Platform │ Content  │ Status       │ Actions       ││
 │ ├─────┼──────────┼──────────┼──────────────┼───────────────┤│
 │ │ 10  │ Instagram│ Caption… │ DRAFT        │ [Edit][Approve]│
 │ │ 11  │ TikTok   │ Script…  │ DRAFT        │ [Edit][Approve]│
 │ │ 12  │ Instagram│ Video…   │ VIDEO_PENDING│ [Preview]     ││
 │ │    │          │          │              │ [Approve]     ││
 │ │    │          │          │              │ [Reject]      ││
 │ │ 13  │ Facebook │ Caption… │ SCHEDULED    │ [Unschedule]  ││
 │ │ 14  │ Pinterest│ Pin text │ PUBLISHED    │ [View Stats]  ││
 │ └─────┴──────────┴──────────┴──────────────┴───────────────┘│
 └──────────────────────────────────────────────────────────────┘
```

### 3. Video Generation Flow (ভিডিও জেনারেশন)

```
Admin Panel → Admin → Fabrics → [Generate Video]
```

```
 Step-by-step:
 ┌──────────────────────────────────────────────┐
 │  1. Admin clicks [Generate Video] button      │
 │                                                │
 │  2. Dialog opens:                              │
 │     ┌──────────────────────────────────────┐  │
 │     │ Generate Video for "Italian Silk"    │  │
 │     │                                      │  │
 │     │ Duration:  ○ 5s  ● 10s  ○ 15s      │  │
 │     │ Platform:  ● Instagram  ○ TikTok     │  │
 │     │                                      │  │
 │     │ Cost: ~$0.40 per video               │  │
 │     │        [Cancel]  [Generate Video]    │  │
 │     └──────────────────────────────────────┘  │
 │                                                │
 │  3. Veo AI video তৈরি করে (30-120s)           │
 │                                                │
 │  4. Social Queue-তে VIDEO_PENDING status      │
 │                                                │
 │  5. Admin preview দেখে:                        │
 │     ┌──────────────────────────────────────┐  │
 │     │  🎬 Video Preview                    │  │
 │     │  ┌────────────────────────────────┐  │  │
 │     │  │        ▶ Video Player         │  │  │
 │     │  └────────────────────────────────┘  │  │
 │     │  Prompt: Slow pan across fabric...   │  │
 │     │  Notes: [__________________]        │  │
 │     │                                      │  │
 │     │  [Reject]              [Approve]    │  │
 │     └──────────────────────────────────────┘  │
 │                                                │
 │  6. Approved → status = APPROVED → publishable│
 └────────────────────────────────────────────────┘
```

---

### 4. Lead Management (লিড ম্যানেজমেন্ট)

```
Admin Panel → Admin → Leads
```

```
 Leads Page
 ┌─────────────────────────────────────────────────────────────┐
 │ [Status Filter] [Source Filter] [Search]                   │
 │                                                             │
 │ ┌─────┬──────────┬────────────┬──────────┬────────────────┐│
 │ │ ID  │ Buyer    │ Fabric     │ Status   │ Actions        ││
 │ ├─────┼──────────┼────────────┼──────────┼────────────────┤│
 │ │ 5   │ OOO Text │ Silk Satin │ NEW      │ [Contact]      ││
 │ │ 6   │ IP Arman │ Cotton     │ CONTACTED│ [Add Note]     ││
 │ │ 7   │ LLC Beta │ Linen      │ QUALIFIED│ [Proposal]     ││
 │ └─────┴──────────┴────────────┴──────────┴────────────────┘│
 └─────────────────────────────────────────────────────────────┘
```

---

### 5. Dashboard Stats (ড্যাশবোর্ড স্ট্যাটস)

```
Admin Panel → Dashboard
```

```
 ┌─────────────────────────────────────────────────────────┐
 │  📊 System Overview                                     │
 │                                                          │
 │  Total Fabrics: 30    │  Published Posts: 5             │
 │  AI Processed: 11     │  Scheduled: 2                   │
 │  Pending Review: 19   │  Drafts: 8                      │
 │                        │                                 │
 │  ⚠  Pending AI: 5     │  Video Pending: 1              │
 │                        │                                 │
 │  ┌────────────────────────────────────────────────────┐ │
 │  │  Queue Health (BullMQ)                            │ │
 │  │  AI Queue: 0 waiting  │  Image Gen: 0 waiting     │ │
 │  │  Social: 0 waiting    │  Video Gen: 0 waiting     │ │
 │  └────────────────────────────────────────────────────┘ │
 │                                                          │
 │  ┌────────────────────────────────────────────────────┐ │
 │  │  AI Budget Tracker (Redis)                        │ │
 │  │  Today: 0 images / 0 videos                       │ │
 │  │  Monthly spend: $0.00 / $100.00 limit             │ │
 │  └────────────────────────────────────────────────────┘ │
 └─────────────────────────────────────────────────────────┘
```

---

## Complete Workflow Summary

### Daily Routine for Admin

```
Morning:                         Afternoon:
┌──────────────────────┐        ┌──────────────────────┐
│ 1. Bulk Import       │        │ 1. Check Social Queue│
│    → Excel/CSV দিয়ে  │        │    → Approve posts   │
│      new fabric data  │        │    → Schedule posts  │
│      upload করো       │        │                      │
│                      │        │ 2. Generate Videos   │
│ 2. Fabric List Check  │        │    → Top fabrics-এ   │
│    → raw_scraped      │        │      video generate  │
│      গুলো AI process  │        │      করো             │
│      হচ্ছে কিনা দেখো  │        │                      │
│    → ai_processed     │        │ 3. Check Leads       │
│      গুলো approve করো │        │    → New leads-এ     │
│                      │        │      reply করো       │
│ 3. Rejected fabrics   │        │                      │
│    → edit করে ফেরত    │        │ 4. Approve pending   │
│      পাঠাও            │        │    videos            │
└──────────────────────┘        └──────────────────────┘
```

---

## Step-by-Step: First Time Use

### Step 1: Ensure supplier exists
Before adding fabrics, ensure at least one supplier exists in the system.

### Step 2: Add fabric data
Two ways:
- **Bulk import**: Go to `/admin/fabrics/bulk-create` → Download template → Fill Excel → Upload
- **Single add**: Go to `/admin/fabrics/new` → Select supplier → Enter title

### Step 3: AI processes automatically
After adding, each fabric:
1. Status becomes `raw_scraped`
2. AI job auto-enqueued
3. `ai.worker.ts` processes via Gemini 3.5 Flash
4. Status becomes `ai_processed`
5. Image generation + Social content auto-triggers

### Step 4: Admin reviews
- Go to `/admin/fabrics` → Filter by `ai_processed`
- Check each fabric's AI-generated data
- Click [Approve] → Fabric goes live
- Click [Reject] → Can edit and retry

### Step 5: Social posts
- Go to `/admin/social/queue`
- Auto-generated posts appear as DRAFT
- Edit caption if needed → [Approve] → [Schedule] or [Publish]

### Step 6: Generate videos (optional)
- Go to any approved fabric → [Generate Video]
- Choose duration + platform
- Wait 30-120s for Veo AI
- Preview → [Approve] or [Reject]

---

## Auto vs Manual — What happens automatically?

| Feature | Automatic? | When? |
|---------|-----------|-------|
| AI text enrichment | ✅ Auto | Right after admin inputs data |
| Image generation | ✅ Auto | After AI enrichment completes |
| Social content generation | ✅ Auto | After AI enrichment (if score >= 50) |
| Blog post generation | ❌ Manual | Trigger per fabric |
| Video generation | ❌ Manual | Admin button click only |
| Video approval | ❌ Manual | Admin must review |
| Social post publishing | ❌ Manual | Admin schedule/publish |

---

## How to Use — Quick API Commands

```bash
# 1. Admin manually fabric input korar pore auto AI process hoy.
#    Kintu chaile manually AI process trigger korte paro:
curl -X POST http://localhost:3000/api/v1/admin/fabrics/1/ai-process \
  -H "Content-Type: application/json"

# 2. Bulk Excel import (frontend theke)
#    http://localhost:3000/admin/fabrics/bulk-create

# 3. Video generate (Admin only)
curl -X POST http://localhost:3000/api/v1/admin/social/generate-video \
  -H "Content-Type: application/json" \
  -d '{"fabric_id": 1, "duration": 15, "platform": "INSTAGRAM"}'

# 4. Video approve/reject
curl -X POST http://localhost:3000/api/v1/admin/social/1/approve-video \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```

---

## Tech Stack Summary

```
Frontend:        Next.js 16 (App Router), Tailwind, Shadcn/UI
Backend:         Next.js API Routes + Services Layer
Database:        PostgreSQL 16 + Drizzle ORM
Queue:           BullMQ + Redis 7
AI:              Google Vertex AI (Gemini 3.5 Flash, Gemini 3.1 Flash Image, Veo 3.1 Lite)
Data Input:      Admin Excel/CSV Import, Manual Form Input
Storage:         Cloudflare R2 (images + videos)
Auth:            NextAuth v5
Validation:      Zod
```

---

## Key Concepts

1. **Admin Input** = Data collection method (Excel upload বা form fillup)
2. **AI** = Data enhancer (Gemini দিয়ে raw data কে structured info-তে convert করে)
3. **Queue** = Task manager (BullMQ + Redis — background tasks manage করে)
4. **Worker** = Task executor (প্রতিটি queue-এর জন্য আলাদা worker)
5. **Admin Review** = Quality control (AI done → admin approve/reject)

---

## FAQ

**Q: নতুন fabric input দিতে কি করতে হবে?**  
A: `/admin/fabrics/bulk-create` → Excel upload করে দাও। Auto AI process শুরু হবে।

**Q: AI processing কতক্ষণ লাগে?**  
A: Per fabric: ~2-5 seconds (text) + ~10-20 seconds (image gen).

**Q: Video generate কতক্ষণ লাগে?**  
A: Veo API-তে 30-120 seconds। Worker auto-poll করে।

**Q: Budget কেমন?**  
A: $300 free credits আছে। Realistic monthly cost ~$77-95।

**Q: AI ঠিকমতো কাজ করছে কিনা বুঝব কিভাবে?**  
A: Dashboard এ Queue health দেখো। AI Queue, Image Gen Queue, Social Queue এ যদি 0 waiting থাকে তাহলে সব done।

**Q: Bulk import কতগুলো fabric support করে?**  
A: Max 200 rows per batch।
