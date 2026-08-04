# TkanMarket Crawler – Production Implementation Prompt
# Copy this entire prompt and paste into Claude Code

---

Before writing a single line of code, do the following in order:

1. Read CLAUDE.md fully
2. Read PRD.md sections 6 (Supplier Discovery Crawler) and 8 (Queue & Worker Architecture)
3. Read FEATURE-PROMPTS.md Prompt 17 (Crawler Worker)
4. Run: find src -type f | sort — to understand what already exists
5. Run: cat src/db/schema/crawler.schema.ts
6. Run: cat src/db/schema/fabrics.schema.ts
7. Run: cat src/lib/queue/helpers.ts
8. Run: cat src/lib/queue/definitions.ts
9. Run: cat src/lib/errors/index.ts
10. Run: cat src/lib/logger.ts

Only after reading ALL of the above, proceed with the implementation below.
DO NOT remove or overwrite any existing file. Only add new files or extend existing ones.

---

## What to build

A 100% production-grade, fully working web scraping and supplier discovery system for TkanMarket.
Target sources: 1688.com and Alibaba.com (both Chinese textile supplier platforms).
Language: TypeScript strict mode throughout.

---

## Files to create (in this exact order)

---

### FILE 1: src/lib/crawler/browser.ts

Playwright browser manager with:
- Singleton browser instance (reuse across jobs to save memory)
- Anti-detection: randomized user agents, viewport sizes, human-like delays
- Stealth mode: disable webdriver flag, override navigator properties
- Context-level proxy support (read from CRAWLER_PROXY_URL env if set)
- Auto-restart on crash
- Max 3 concurrent pages per browser instance (semaphore)
- exportFunction: getBrowser(): Promise<Browser>
- exportFunction: getPage(): Promise<{ page: Page; release: () => void }>
- exportFunction: closeBrowser(): Promise<void>
- Human-like delay helper: humanDelay(min: number, max: number): Promise<void>
  Uses crypto.randomInt for true randomness, range 800–3000ms default

Anti-detection setup on every new page:
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] })
    Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] })
    window.chrome = { runtime: {} }
  })

User agent pool (rotate randomly):
  - Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36
  - Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36
  - Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0
  - Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36

---

### FILE 2: src/lib/crawler/extractors/alibaba.extractor.ts

Alibaba.com product page extractor.

exportFunction: searchAlibaba(keyword: string, maxPages: number): Promise<string[]>
  - URL: https://www.alibaba.com/trade/search?SearchText={keyword}&f=y&IndexArea=product_en
  - Wait for: .organic-list or .m-gallery-product-item-v2
  - Extract all product URLs from search results
  - Handle pagination (next page button .next-pagination-item-next)
  - Deduplicate URLs
  - Return array of absolute product URLs
  - On selector timeout: log warning and return what was collected so far

exportFunction: scrapeAlibabaProduct(page: Page, url: string): Promise<RawProductData | null>
  Extracts:
  - title: h1.product-title or .product-name
  - description: .product-description or .detail-desc-decorate-richtext (inner text, strip HTML)
  - images: all img src inside .image-view-item or .product-image (filter out icons < 100px)
  - price: .price-range or .price (extract numeric range, keep as string)
  - moq: .moq or text containing "Minimum Order" (extract number + unit)
  - supplier_name: .company-name or .supplier-name
  - supplier_url: link to supplier profile
  - composition: search description + title for percentage patterns like "100% Cotton", "80% Polyester 20% Cotton"
  - gsm: search for patterns like "180gsm", "180 g/m²", "180 grams"
  - width: search for patterns like "150cm", "60 inches", "150 cm wide"
  - Return null if page fails to load or critical selectors missing
  - Timeout per page: 30 seconds

---

### FILE 3: src/lib/crawler/extractors/1688.extractor.ts

1688.com product page extractor (Chinese language).

exportFunction: search1688(keyword: string, maxPages: number): Promise<string[]>
  - URL: https://s.1688.com/selloffer/offerlist.htm?keywords={encodeURIComponent(keyword)}
  - Wait for: .sm-offer-list or .offer-list
  - Extract product URLs (filter to keep only detail pages: /offer/ in URL)
  - Handle pagination
  - Return deduplicated URLs

exportFunction: scrape1688Product(page: Page, url: string): Promise<RawProductData | null>
  Extracts (Chinese selectors):
  - title: .d-title or #offerdetail-title h1
  - description: .d-desc or .desc-word (inner text)
  - images: .detail-gallery-img img[src], filter duplicates, convert // to https://
  - price: .d-price .price or .value (extract numeric)
  - moq: .d-order-quantity or text with 件/米/码
  - supplier_name: .company-name-container or .subj-name
  - composition: regex search in title + description for 棉/涤/纶/麻/丝 + percentage patterns
  - gsm: search for 克/平方米 or g/m² or gsm patterns
  - width: search for 幅宽 or cm/厘米/英寸 patterns
  - Translate key fields flag: markSourceLanguage as 'zh'

---

### FILE 4: src/lib/crawler/deduplicator.ts

Prevents saving duplicate products.

exportFunction: isDuplicate(sourceUrl: string): Promise<boolean>
  - Hash the URL (SHA-256, first 16 chars)
  - Check Redis cache first (key: `crawler:url:{hash}`, TTL 7 days)
  - If not in cache, check DB: SELECT id FROM fabrics WHERE source_url = $1
  - If found in either: return true
  - If not found: store in Redis with TTL, return false

exportFunction: markAsProcessed(sourceUrl: string): Promise<void>
  - Store URL hash in Redis with 7-day TTL

exportFunction: batchIsDuplicate(urls: string[]): Promise<Map<string, boolean>>
  - Check all URLs at once (pipeline Redis MGET, then single DB query for misses)
  - Returns Map<url, isDuplicate>

---

### FILE 5: src/lib/crawler/data-cleaner.ts

Cleans and normalizes raw scraped data before saving to DB.

interface RawProductData {
  title:         string
  description:   string
  images:        string[]
  price:         string | null
  moq:           string | null
  supplier_name: string
  supplier_url:  string | null
  composition:   string | null
  gsm:           string | null
  width:         string | null
  source_url:    string
  source:        '1688' | 'alibaba'
  source_language: 'zh' | 'en'
}

interface CleanedProductData {
  rawTitle:       string
  rawDescription: string
  images:         string[]
  priceUsd:       number | null
  moq:            number | null
  supplierName:   string
  supplierUrl:    string | null
  rawComposition: string
  gsmRaw:         string | null
  widthRaw:       string | null
  sourceUrl:      string
  source:         string
  sourceLanguage: 'zh' | 'en'
}

exportFunction: cleanProductData(raw: RawProductData): CleanedProductData
  - Strip HTML from all text fields
  - Normalize whitespace (replace multiple spaces/newlines with single space)
  - Filter images: remove duplicates, remove URLs shorter than 20 chars, keep max 10
  - Ensure all image URLs start with https:// (fix // prefix)
  - Parse price to number: extract first numeric value, convert CNY to USD if source is 1688 (use rate 0.14)
  - Parse MOQ to number: extract first integer from string
  - Truncate rawTitle to 500 chars max
  - Truncate rawDescription to 5000 chars max
  - Return CleanedProductData

---

### FILE 6: src/services/crawler.service.ts

Main crawler orchestration service.

DO NOT overwrite if file already exists — check first with: cat src/services/crawler.service.ts

exportClass CrawlerService with methods:

async createRun(params: {
  keywords:     string[]
  source:       'alibaba' | '1688' | 'both'
  maxProducts:  number
  triggeredById?: number
}): Promise<CrawlerRun>
  - Insert into crawler_runs table
  - Return created record

async executeRun(runId: number): Promise<void>
  - Fetch crawler_run record
  - Update status to RUNNING, startedAt = now()
  - For each keyword:
    - Call searchAlibaba() and/or search1688() based on source
    - Collect all product URLs (deduplicated across keywords too)
  - Batch check for duplicates: batchIsDuplicate(allUrls)
  - Filter to only new URLs
  - For each new URL (max maxProducts total):
    - scrape product details
    - clean data
    - save to fabrics table (status: raw_scraped, titleRu = rawTitle as placeholder)
    - dispatch AI processing job: addAIJob(fabricId, priority: 5)
    - update productsFound + productsSaved counters on crawler_run
    - humanDelay(1500, 4000) between requests
  - On completion: update status COMPLETED, completedAt = now()
  - On any unrecoverable error: update status FAILED, errorLog = error message

async getRunStatus(runId: number): Promise<CrawlerRun | null>
  - Fetch and return crawler_run by ID

async getRunHistory(page: number, limit: number): Promise<PaginatedResult<CrawlerRun>>
  - Paginated list, ordered by created_at DESC

private async saveRawProduct(data: CleanedProductData, supplierId: number): Promise<number>
  - Upsert supplier (find by name or create)
  - Generate slug from title (slugify + unique suffix if conflict)
  - Generate SKU: 'TKN-' + zero-padded ID
  - Insert into fabrics table
  - Return new fabric ID

private async upsertSupplier(name: string, url: string | null, source: string): Promise<number>
  - Check if supplier exists by name (case-insensitive)
  - If exists: return existing ID
  - If not: insert new supplier record, return new ID

---

### FILE 7: src/workers/crawler.worker.ts

BullMQ Worker that processes crawler_jobs queue.

DO NOT overwrite if file already exists.

- Worker concurrency: 3
- Import: CrawlerService
- On job received:
  - Log job start with runId
  - Call job.updateProgress(0)
  - Call CrawlerService.executeRun(payload.crawlerRunId)
  - Call job.updateProgress(100)
  - Log completion
- On job failure:
  - Update crawler_run status to FAILED in DB
  - Log error with runId and message
- Graceful shutdown: worker.close() on SIGTERM

---

### FILE 8: src/app/api/v1/admin/crawler/run/route.ts

POST /api/v1/admin/crawler/run

DO NOT overwrite if file already exists.

Request body:
{
  keywords:     string[]  // required, min 1, max 20
  source:       'alibaba' | '1688' | 'both'
  max_products: number    // min 1, max 500, default 100
}

Handler:
1. requireAdminAuth()
2. Validate body with Zod schema
3. CrawlerService.createRun(...)
4. addCrawlerJob({ crawlerRunId: run.id, ...params })
5. Return 201 with { runId: run.id, status: 'PENDING', message: 'Crawler job queued' }

---

### FILE 9: src/app/api/v1/admin/crawler/status/[runId]/route.ts

GET /api/v1/admin/crawler/status/[runId]

1. requireAdminAuth()
2. Parse runId as integer
3. CrawlerService.getRunStatus(runId)
4. Return 404 if not found
5. Return run record

---

### FILE 10: src/app/api/v1/admin/crawler/history/route.ts

GET /api/v1/admin/crawler/history

1. requireAdminAuth()
2. parsePaginationParams(searchParams)
3. CrawlerService.getRunHistory(page, limit)
4. Return paginated response

---

## Environment variables to add to .env.example (do not add values, just keys)

CRAWLER_PROXY_URL=          # optional: http://user:pass@host:port
CRAWLER_CNY_TO_USD_RATE=0.14
CRAWLER_REQUEST_DELAY_MIN=1500
CRAWLER_REQUEST_DELAY_MAX=4000
CRAWLER_MAX_PAGES_PER_KEYWORD=3
CRAWLER_PAGE_TIMEOUT=30000

---

## After all files are created, run these checks in order:

1. npx tsc --noEmit
   Fix ALL TypeScript errors before proceeding.

2. Verify these imports resolve correctly:
   - @/lib/crawler/browser
   - @/lib/crawler/deduplicator
   - @/lib/crawler/data-cleaner
   - @/lib/crawler/extractors/alibaba.extractor
   - @/lib/crawler/extractors/1688.extractor
   - @/services/crawler.service
   - @/workers/crawler.worker

3. Check that no existing file was modified unless it was explicitly listed above.

4. Confirm crawler_runs table schema matches what CrawlerService expects.

---

## Quality checklist — verify each point before finishing:

- [ ] Every function has explicit TypeScript return types
- [ ] No `any` types anywhere — use `unknown` and narrow, or specific types
- [ ] All DB operations use Drizzle ORM (no raw SQL except complex queries)
- [ ] All errors use custom error classes from @/lib/errors
- [ ] All logging uses @/lib/logger (no console.log)
- [ ] humanDelay() called between every HTTP request (1.5–4s)
- [ ] Duplicate check happens BEFORE scraping (not after)
- [ ] Images filtered: https:// only, no duplicates, max 10 per product
- [ ] Supplier upsert is idempotent (safe to run multiple times)
- [ ] Worker handles SIGTERM gracefully (worker.close())
- [ ] API routes return proper HTTP status codes (201 for created, 404 for not found)
- [ ] Zod validation on all API route inputs
- [ ] requireAdminAuth() on all admin routes
- [ ] No secrets or credentials hardcoded anywhere
