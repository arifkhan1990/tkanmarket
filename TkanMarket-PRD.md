# TkanMarket – Product Requirements Document (PRD)
**Version:** 1.0.0  
**Status:** Production-Ready  
**Last Updated:** 2025-01  
**Classification:** Internal Engineering Document

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [User Personas](#3-user-personas)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [Database Design Principles](#5-database-design-principles)
6. [Core Feature Modules](#6-core-feature-modules)
7. [API Design Standards](#7-api-design-standards)
8. [Queue & Worker Architecture](#8-queue--worker-architecture)
9. [AI Pipeline Specification](#9-ai-pipeline-specification)
10. [Social Media Automation Specification](#10-social-media-automation-specification)
11. [Lead CRM Specification](#11-lead-crm-specification)
12. [Performance Requirements](#12-performance-requirements)
13. [Security Requirements](#13-security-requirements)
14. [Scaling Strategy](#14-scaling-strategy)
15. [Success Metrics & KPIs](#15-success-metrics--kpis)

---

## 1. Executive Summary

TkanMarket is a B2B fabric discovery and sourcing marketplace. It connects Chinese textile suppliers with buyers in Russia and CIS markets. The system is not only a website — it is a marketplace combined with an internal operating system for:

- Catalog growth through automated supplier discovery
- AI-powered content enrichment
- Social media lead generation at scale
- CRM-driven sales follow-up

**Target Scale:** 50,000+ fabric SKUs within 24 months.  
**Primary Revenue:** Lead generation, premium supplier listings, commission on sample orders.

---

## 2. Product Vision & Goals

### Vision Statement
Become the #1 digital fabric sourcing destination for Russian and CIS textile buyers, powered by an AI-first internal operations platform.

### Strategic Goals
| Priority | Goal | Metric |
|----------|------|--------|
| P0 | Launch MVP marketplace | 500 published fabrics in 90 days |
| P0 | Lead capture working end-to-end | First lead within week 1 of launch |
| P1 | AI enrichment pipeline operational | 95% of products AI-enriched before admin review |
| P1 | Social media automation live | 50+ posts/week automated |
| P2 | Crawler operational on 1688/Alibaba | 1,000 raw products/day |
| P2 | Full CRM pipeline | 100% lead tracking with no manual loss |

### Non-Goals (Phase 1)
- Payment processing / transactions
- Supplier self-onboarding portal
- Mobile native app
- Multi-language other than Russian/English

---

## 3. User Personas

### 3.1 Buyer (Primary External User)
- Textile factory owner or procurement manager in Russia/CIS
- Needs: Find reliable fabric suppliers with specific specs (GSM, composition, width)
- Pain: No trusted B2B marketplace in Russian language
- Journey: Browse → Filter → View detail → Request sample → Sales follow-up

### 3.2 Admin Operator (Internal User)
- TkanMarket team member managing daily operations
- Needs: Review AI-enriched products, approve/reject, manage CRM leads
- Pain: Manual processing of hundreds of products per day
- Journey: Review queue → Edit spec → Approve → Monitor social pipeline

### 3.3 Sales Representative (Internal User)
- Manages leads and follow-ups
- Needs: Clear CRM view, lead history, assignment, notes
- Journey: Receive assignment → Contact lead → Log follow-up → Update status

---

## 4. System Architecture Overview

```
[External Traffic]
       │
       ▼
[CDN – Cloudflare / Vercel Edge]
       │
       ▼
[Next.js 16 App (App Router)]
  ├── /app (public marketplace pages)
  ├── /app/admin (admin dashboard – protected)
  └── /app/api (API routes)
       │
       ▼
[Service Layer – /src/services/]
  ├── FabricService
  ├── SupplierService
  ├── LeadService
  ├── CrawlerService
  ├── AIService
  └── SocialMediaService
       │
       ▼
[Queue Layer – BullMQ + Redis]
  ├── crawler_jobs
  ├── ai_processing_jobs
  ├── image_processing_jobs
  └── social_media_jobs
       │
       ▼
[Worker Processes – /src/workers/]
  ├── CrawlerWorker
  ├── AIWorker
  ├── ImageWorker
  └── SocialMediaWorker
       │
       ▼
[PostgreSQL Database]
  ├── Core schema (fabrics, suppliers, leads)
  ├── Raw data schema (raw_products)
  └── Social media schema (social_posts, campaigns)
```

### Technology Stack (Locked)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.x (App Router) |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | 3.x |
| UI Components | Shadcn/UI | Latest |
| Data Fetching | TanStack Query | 5.x |
| Database | PostgreSQL | 16.x |
| ORM | Drizzle ORM | Latest |
| Queue | BullMQ | Latest |
| Cache/Queue Broker | Redis | 7.x |
| Crawler | Playwright | Latest |
| AI | OpenAI API | GPT-4o |
| Image CDN | Cloudflare R2 / Vercel Blob | - |
| Deployment | Vercel + Railway (workers) | - |

---

## 5. Database Design Principles

### 5.1 Primary Key Strategy
**RULE: ALL tables use `INTEGER` with `AUTO_INCREMENT` (PostgreSQL: `SERIAL` or `GENERATED ALWAYS AS IDENTITY`).**

```sql
-- CORRECT pattern for every table
CREATE TABLE fabrics (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ...
);

-- NEVER use UUID as primary key
-- NEVER use BIGSERIAL unless table is expected to exceed 2 billion rows
```

**Rationale:** Integer PKs are faster for JOINs, smaller indexes, easier to debug, and work naturally with all ORM tools.

### 5.2 Foreign Key Strategy
All foreign keys reference the integer PK of parent table. Always use explicit `ON DELETE` behavior.

### 5.3 Soft Delete Pattern
All user-facing and catalog tables use soft delete:
```sql
deleted_at TIMESTAMPTZ DEFAULT NULL
```
Never hard delete catalog records, leads, or suppliers.

### 5.4 Timestamps
Every table has:
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
Use a trigger or ORM hook for `updated_at`.

### 5.5 Indexing Standards
- All foreign keys are indexed
- Columns used in WHERE clauses frequently get dedicated indexes
- Use partial indexes for status-based queries (e.g., `WHERE status = 'approved'`)
- Full-text search uses PostgreSQL `tsvector` columns with GIN indexes

---

## 6. Core Feature Modules

### Module 1: Public Marketplace
**Owner:** Frontend + Backend  
**Priority:** P0

Features:
- Fabric catalog with server-side rendering (SSR) for SEO
- Filter sidebar (material, GSM range, width, composition, MOQ, price)
- Search with full-text PostgreSQL search
- Fabric detail page with image gallery, spec table, supplier info
- Sample request modal form
- Bulk inquiry form
- Related fabrics carousel
- Supplier profile page
- SEO: sitemap, robots.txt, OpenGraph, JSON-LD structured data

### Module 2: Admin Dashboard
**Owner:** Frontend + Backend  
**Priority:** P0

Features:
- Auth-protected via NextAuth.js with role-based access (ADMIN, SALES, VIEWER)
- Product review queue (raw → approved/rejected)
- Inline spec editing
- Bulk approve/reject actions
- Supplier management CRUD
- Lead CRM views
- Social media queue management
- Analytics overview (product count, lead count, post performance)

### Module 3: Supplier Crawler
**Owner:** Backend Workers  
**Priority:** P1

Features:
- Playwright-based scraper for 1688.com, Alibaba, textile directories
- Keyword-driven discovery: enter keywords → crawler finds matching product URLs
- Product data extraction: title, price, MOQ, images, description, specs
- Duplicate detection by URL hash
- Scheduled cron: runs nightly (configurable)
- Admin UI to trigger manual crawl runs

### Module 4: AI Processing Pipeline
**Owner:** Backend Workers  
**Priority:** P1

Features:
- Raw product → structured product via GPT-4o
- Title cleanup and standardization
- Translation (Chinese → Russian + English)
- Tag extraction (material types, use cases, season)
- SEO description generation
- Meta title and description generation
- Fabric attribute classification (type, composition, GSM normalization)

### Module 5: Social Media Automation
**Owner:** Backend Workers  
**Priority:** P1

Features:
- Trigger: product approved → create social content jobs
- GPT-4o generates reel scripts, captions, hashtags
- Video asset rendering (remotion or ffmpeg-based)
- Platform scheduling: Instagram, TikTok, Pinterest, Facebook
- Post analytics ingestion
- Admin UI to manage content queue, approve/reject posts

### Module 6: Lead CRM
**Owner:** Backend + Frontend  
**Priority:** P0

Features:
- Lead creation from: marketplace forms, social campaigns, direct contact
- Lead status pipeline: NEW → CONTACTED → QUALIFIED → PROPOSAL → CLOSED_WON → CLOSED_LOST
- Assignment to sales reps
- Notes and activity log
- Follow-up reminders
- Basic reporting (leads by source, conversion rate)

---

## 7. API Design Standards

### 7.1 Route Conventions
```
/api/v1/fabrics                  GET  – list with pagination + filters
/api/v1/fabrics/:id              GET  – single fabric
/api/v1/fabrics/:id/related      GET  – related fabrics
/api/v1/suppliers                GET  – list
/api/v1/suppliers/:id            GET  – single supplier
/api/v1/leads                    POST – create lead (public)
/api/v1/admin/fabrics            GET, PATCH – admin fabric management
/api/v1/admin/fabrics/:id/status PATCH – approve/reject
/api/v1/admin/leads              GET  – all leads (admin only)
/api/v1/admin/leads/:id          PATCH – update lead
/api/v1/admin/crawler/run        POST – trigger crawl job
/api/v1/admin/social/queue       GET  – social content queue
```

### 7.2 Response Envelope
```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 24,
    "total": 4820,
    "totalPages": 201
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "FABRIC_NOT_FOUND",
    "message": "Fabric with ID 42 not found",
    "statusCode": 404
  }
}
```

### 7.3 Pagination Standard
All list endpoints support:
- `page` (default: 1)
- `limit` (default: 24, max: 100)
- `sort` (e.g., `created_at:desc`)

### 7.4 Validation
All API inputs validated with Zod schemas. Never trust client input.

---

## 8. Queue & Worker Architecture

### 8.1 Queue Definitions
| Queue | Purpose | Concurrency | Retry |
|-------|---------|------------|-------|
| `crawler_jobs` | Scrape supplier pages | 3 | 3 |
| `ai_processing_jobs` | Enrich raw products | 5 | 3 |
| `image_processing_jobs` | Resize/optimize images | 10 | 2 |
| `social_media_jobs` | Generate + publish content | 2 | 3 |

### 8.2 Job Payload Standards
Every job must include:
```typescript
interface BaseJob {
  jobId: string;        // UUID for tracking
  createdAt: string;    // ISO timestamp
  entityId: number;     // Integer FK to relevant record
  entityType: string;   // 'fabric' | 'supplier' | 'post'
  priority: number;     // 1-10 (10 = highest)
  metadata?: Record<string, unknown>;
}
```

### 8.3 Dead Letter Queue
Failed jobs after max retries go to `dead_letter_queue`. Admin dashboard shows failed jobs with error details and manual retry option.

### 8.4 Cron Schedule
| Time (UTC) | Job |
|-----------|-----|
| 02:00 | Keyword discovery crawl |
| 03:00 | Product page crawl |
| 04:00 | Supplier profile crawl |
| 06:00 | AI processing batch (new raw products) |
| 08:00 | Image processing batch |
| 09:00, 18:00 | Social media publish schedule |

---

## 9. AI Pipeline Specification

### 9.1 Input (Raw Product)
```typescript
interface RawProduct {
  id: number;
  productUrl: string;
  rawTitle: string;
  rawDescription: string;
  rawComposition: string;
  rawImages: string[];
  supplierName: string;
  price: string;
  moq: string;
  sourceLanguage: 'zh' | 'en';
}
```

### 9.2 AI Processing Steps
1. **Normalize title** – clean supplier jargon, standardize format
2. **Translate** – Chinese → Russian (primary) + English (secondary)
3. **Extract attributes** – parse composition %, GSM, width from raw text
4. **Classify fabric type** – map to internal taxonomy
5. **Generate description** – professional Russian-language product description (150–300 words)
6. **Generate SEO metadata** – meta title (60 chars), meta description (155 chars)
7. **Extract tags** – material, color family, use case, season

### 9.3 AI Output Schema
```typescript
interface AIProcessedProduct {
  titleRu: string;
  titleEn: string;
  descriptionRu: string;
  descriptionEn: string;
  metaTitleRu: string;
  metaDescriptionRu: string;
  composition: { material: string; percentage: number }[];
  gsm: number | null;
  widthCm: number | null;
  fabricType: FabricType;
  tags: string[];
  confidenceScore: number; // 0-1, how confident AI is in extraction
}
```

### 9.4 Confidence Threshold
- Score < 0.6: Flag for mandatory admin review
- Score 0.6–0.8: Auto-proceed, optional admin review
- Score > 0.8: Auto-proceed to admin approval queue

---

## 10. Social Media Automation Specification

### 10.1 Content Types Per Platform
| Platform | Content Type | Frequency |
|---------|-------------|-----------|
| Instagram | Reel (15s, 20s, 30s) | 2/day |
| Instagram | Carousel post | 1/day |
| TikTok | Reel (15s–30s) | 1/day |
| Pinterest | Product pin | 5/day |
| Facebook | Image post + caption | 1/day |

### 10.2 Content Generation Pipeline
```
Fabric Approved
      │
      ▼
[Score fabric for social suitability]
  High visual appeal + trending material = high score
      │
      ▼
[AI: Generate content brief]
  - Script for reel narration
  - Caption text (Russian)
  - Hashtags (30 for Instagram, 5 for TikTok)
  - Image prompt for product showcase
      │
      ▼
[Asset generation]
  - Download best fabric images from supplier
  - Apply branding overlay (logo, colors, watermark)
  - Render video reel from template + fabric images
      │
      ▼
[Admin review queue] (optional, configurable)
      │
      ▼
[Schedule to platform API]
      │
      ▼
[Store post record + track performance]
```

### 10.3 Social Scoring Algorithm
```typescript
function socialScore(fabric: Fabric): number {
  let score = 0;
  if (fabric.images.length >= 3) score += 20;
  if (fabric.gsm !== null) score += 10;
  if (fabric.tags.includes('trending')) score += 15;
  if (fabric.composition.some(c => PREMIUM_MATERIALS.includes(c.material))) score += 20;
  if (fabric.moq <= 100) score += 15; // accessible MOQ
  // normalize to 0-100
  return Math.min(score, 100);
}
```
Only fabrics with score ≥ 50 are queued for social content.

---

## 11. Lead CRM Specification

### 11.1 Lead Sources
- `MARKETPLACE_INQUIRY` – bulk inquiry form on marketplace
- `SAMPLE_REQUEST` – sample request form on fabric detail page
- `SOCIAL_CAMPAIGN` – UTM-tagged link from social post
- `DIRECT_CONTACT` – contact page form
- `MANUAL_ENTRY` – admin manually adds lead

### 11.2 Lead Pipeline States
```
NEW → CONTACTED → QUALIFIED → PROPOSAL_SENT → NEGOTIATING → CLOSED_WON
                                                          ↘ CLOSED_LOST
```

### 11.3 Lead Record
```typescript
interface Lead {
  id: number;
  source: LeadSource;
  status: LeadStatus;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  country: string;
  city: string | null;
  fabricInterest: number | null; // FK to fabric
  inquiryText: string;
  assignedTo: number | null; // FK to admin user
  notes: LeadNote[];
  utmSource: string | null;
  utmCampaign: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 12. Performance Requirements

| Metric | Target |
|--------|--------|
| Public page first load (LCP) | < 2.5s |
| API response (list endpoints) | < 200ms (p95) |
| API response (detail endpoints) | < 100ms (p95) |
| Search results | < 300ms (p95) |
| Image load (optimized WebP) | < 500ms on 4G |
| Crawler throughput | 200 products/hour minimum |
| AI processing throughput | 100 products/hour minimum |
| Uptime | 99.9% |

---

## 13. Security Requirements

### 13.1 Authentication
- Admin routes: NextAuth.js with JWT sessions + role-based access control (RBAC)
- Public API: rate limited (100 req/min per IP)
- Crawler: no public exposure – runs as internal service only

### 13.2 Input Validation
- All inputs validated with Zod at API route level
- SQL injection impossible via ORM (Drizzle parameterized queries)
- XSS prevention: React's built-in escaping + CSP headers

### 13.3 Data Privacy
- Buyer emails stored encrypted
- No third-party analytics on lead data
- GDPR-compatible data retention policies

### 13.4 API Security
- All admin API routes check session and role
- Secrets in environment variables only, never committed
- Rate limiting on all public endpoints via Redis

---

## 14. Scaling Strategy

### Phase 1 – MVP (Months 1–3)
- Single Vercel deployment for Next.js
- Railway for PostgreSQL + Redis
- Worker processes on Railway (single instance)
- Manual admin crawl triggers

### Phase 2 – Growth (Months 4–12)
- Separate Railway service for workers
- Redis cluster for queue
- CDN for images (Cloudflare R2)
- Read replica for PostgreSQL
- Crawler on dedicated server

### Phase 3 – Scale (Year 2+)
- Kubernetes for workers
- PostgreSQL cluster with connection pooling (PgBouncer)
- Dedicated AI processing service
- Multi-region CDN

---

## 15. Success Metrics & KPIs

### Product Health
| KPI | Target (Month 6) |
|-----|-----------------|
| Published fabrics | 5,000+ |
| Monthly unique buyers | 2,000+ |
| Sample requests/month | 50+ |
| Leads generated/month | 100+ |
| Social posts published/month | 200+ |
| AI-enriched product rate | 95%+ |
| Admin approval time | < 2 min/product |

### Technical Health
| KPI | Target |
|-----|--------|
| API error rate | < 0.1% |
| Queue backlog | < 500 jobs at any time |
| Crawler success rate | > 85% |
| AI processing success rate | > 90% |
| Failed job rate | < 5% |
