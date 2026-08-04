import { and, eq, inArray, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { getPage, humanDelay } from '@/lib/crawler/browser'
import type { PageLike } from '@/lib/crawler/browser'
import { cleanProductData } from '@/lib/crawler/data-cleaner'
import { batchIsDuplicate } from '@/lib/crawler/deduplicator'
import { scrapeAlibabaProduct, searchAlibabaWithPage } from '@/lib/crawler/extractors/alibaba.extractor'
import { scrape1688Product, search1688WithPage } from '@/lib/crawler/extractors/1688.extractor'
import { scrapeMadeInChinaProduct, searchMadeInChinaWithPage } from '@/lib/crawler/extractors/made-in-china.extractor'
import { addAIJob } from '@/lib/queue/helpers'
import { NotFoundError } from '@/lib/errors'
import { logger } from '@/lib/logger'

import type { CreateCrawlerRunParams, CrawlerRun, CrawlerSource } from '@/types/crawler.types'

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : null
}

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return s.length > 0 ? s.slice(0, 80) : 'fabric'
}

function uniqStrings(values: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of values) {
    const t = v.trim()
    if (!t) continue
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

function envInt(name: string, fallback: number): number {
  const v = Number(process.env[name])
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeoutMs = Math.max(250, ms)
  let t: ReturnType<typeof setTimeout> | null = null
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        t = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
      })
    ])
  } finally {
    if (t) clearTimeout(t)
  }
}

async function getOrCreateSupplier(params: { name?: string | null; sourceUrl?: string | null; websiteUrl?: string | null; logoUrl?: string | null }) {
  const db = getDb()
  const supplierKey = params.sourceUrl?.trim() || params.websiteUrl?.trim() || params.name?.trim() || 'unknown'
  const slugBase = params.name?.trim() ? slugify(params.name.trim()) : 'supplier'
  const safeSuffix = Buffer.from(supplierKey).toString('base64url').slice(0, 10)
  const slug = `${slugBase}-${safeSuffix}`.slice(0, 120)

  const existing = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(and(eq(suppliers.slug, slug), isNull(suppliers.deletedAt)))
    .limit(1)

  if (existing[0]?.id) return existing[0].id

  const inserted = await db
    .insert(suppliers)
    .values({
      name: params.name?.trim() || 'Unknown Supplier',
      slug,
      country: 'China',
      city: null,
      province: null,
      description: null,
      logoUrl: params.logoUrl ?? null,
      websiteUrl: params.websiteUrl ?? null,
      verified: false,
      establishedYear: null,
      sourceUrl: params.sourceUrl ?? null,
      updatedAt: new Date(),
      deletedAt: null
    })
    .returning({ id: suppliers.id })

  const row = inserted[0]
  if (!row) throw new Error('Failed to create supplier')
  return row.id
}

async function updateRun(runId: number, patch: Partial<{ status: CrawlerRun['status']; productsFound: number; productsSaved: number; errorsCount: number; errorLog: string | null; startedAt: Date | null; completedAt: Date | null }>) {
  const db = getDb()
  await db
    .update(crawlerRuns)
    .set({
      updatedAt: new Date(),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.productsFound !== undefined ? { productsFound: patch.productsFound } : {}),
      ...(patch.productsSaved !== undefined ? { productsSaved: patch.productsSaved } : {}),
      ...(patch.errorsCount !== undefined ? { errorsCount: patch.errorsCount } : {}),
      ...(patch.errorLog !== undefined ? { errorLog: patch.errorLog } : {}),
      ...(patch.startedAt !== undefined ? { startedAt: patch.startedAt } : {}),
      ...(patch.completedAt !== undefined ? { completedAt: patch.completedAt } : {})
    })
    .where(eq(crawlerRuns.id, runId))
}

type CrawlMarketplaceKey = 'alibaba' | '1688' | 'made_in_china'

function sourcesToScrape(source: CrawlerSource): CrawlMarketplaceKey[] {
  if (source === 'both') return ['alibaba', '1688']
  if (source === 'all') return ['alibaba', '1688', 'made_in_china']
  if (source === 'made_in_china') return ['made_in_china']
  if (source === '1688') return ['1688']
  return ['alibaba']
}

function detectMarketplaceFromUrl(url: string): CrawlMarketplaceKey {
  if (url.includes('1688.com') || url.includes('detail.1688')) return '1688'
  if (url.includes('made-in-china.com')) return 'made_in_china'
  return 'alibaba'
}

export class CrawlerService {
  /**
   * Marks a run as failed when crawling is not allowed (e.g. disabled in settings).
   * Only transitions from non-terminal states — never clobbers a COMPLETED/PARTIAL/FAILED run
   * or the run's original startedAt timestamp.
   */
  public static async abortRunDisabled(runId: number, reason: string): Promise<void> {
    const db = getDb()
    const row = await db
      .select({ id: crawlerRuns.id, status: crawlerRuns.status })
      .from(crawlerRuns)
      .where(eq(crawlerRuns.id, runId))
      .limit(1)
    const run = row[0]
    if (!run) throw new NotFoundError('Crawler run not found')
    if (run.status !== 'PENDING' && run.status !== 'RUNNING') return

    await updateRun(runId, {
      status: 'FAILED',
      completedAt: new Date(),
      errorLog: reason
    })
  }

  /**
   * Persists FAILED when the worker throws before normal completion (Playwright crash, OOM, etc.).
   * Does not clear productsFound / productsSaved already written by partial progress.
   * Skips the update if the run already reached a terminal state (rare late-crash race).
   */
  public static async markRunFatalFailure(runId: number, err: unknown): Promise<void> {
    const db = getDb()
    const row = await db
      .select({ status: crawlerRuns.status })
      .from(crawlerRuns)
      .where(eq(crawlerRuns.id, runId))
      .limit(1)
    const current = row[0]
    if (!current) return
    if (current.status !== 'PENDING' && current.status !== 'RUNNING') return

    const message = err instanceof Error ? err.message : String(err)
    await db
      .update(crawlerRuns)
      .set({
        status: 'FAILED',
        completedAt: new Date(),
        errorLog: `[fatal] ${message}`.slice(0, 8000),
        updatedAt: new Date()
      })
      .where(eq(crawlerRuns.id, runId))
  }

  public static async createRun(params: CreateCrawlerRunParams): Promise<CrawlerRun> {
    const db = getDb()
    const rows = await db
      .insert(crawlerRuns)
      .values({
        status: 'PENDING',
        source: params.source,
        keywords: params.keywords,
        productsFound: 0,
        productsSaved: 0,
        errorsCount: 0,
        triggeredById: params.triggeredById ?? null,
        startedAt: null,
        completedAt: null,
        errorLog: null
      })
      .returning()

    const r = rows[0]
    if (!r) throw new Error('Failed to create crawler run')

    return {
      id: r.id,
      status: r.status,
      source: r.source,
      keywords: r.keywords,
      productsFound: r.productsFound,
      productsSaved: r.productsSaved,
      errorsCount: r.errorsCount,
      startedAt: toIso(r.startedAt),
      completedAt: toIso(r.completedAt),
      errorLog: r.errorLog ?? null
    }
  }

  public static async scrapeProducts(runId: number, keywords: string[], source: string, maxProducts: number): Promise<void> {
    const runSource = (
      source === 'both' ||
      source === '1688' ||
      source === 'alibaba' ||
      source === 'made_in_china' ||
      source === 'all'
        ? source
        : 'alibaba'
    ) satisfies CrawlerSource

    let productsFound = 0
    let productsSaved = 0
    let errorsCount = 0
    const errors: string[] = []

    try {
      await updateRun(runId, { status: 'RUNNING', startedAt: new Date(), completedAt: null, errorLog: null })
      const jobStartedAt = Date.now()
      const hardTimeoutMs = envInt('CRAWLER_HARD_TIMEOUT_MS', 35 * 60 * 1000)
      const shouldAbort = () => Date.now() - jobStartedAt > hardTimeoutMs
      const assertNotTimedOut = () => {
        if (shouldAbort()) {
          throw new Error(`Crawler hard timeout exceeded (${hardTimeoutMs}ms)`)
        }
      }

      const sources = sourcesToScrape(runSource)
      const urlCandidates: string[] = []

      for (const src of sources) {
        assertNotTimedOut()
        const { page, release } = await withTimeout(getPage(), envInt('CRAWLER_GET_PAGE_TIMEOUT_MS', 25_000), 'getPage')
        const searchPage = page as unknown as PageLike
        for (const keyword of keywords) {
          try {
            assertNotTimedOut()
            const maxPages = Math.min(5, Math.max(1, Number(process.env.CRAWLER_MAX_PAGES_PER_KEYWORD ?? 3)))
            const searchTimeout = envInt('CRAWLER_SEARCH_TIMEOUT_MS', 90_000)
            const found = await withTimeout(
              src === 'alibaba'
                ? searchAlibabaWithPage(searchPage, keyword, maxPages)
                : src === '1688'
                  ? search1688WithPage(searchPage, keyword, maxPages)
                  : searchMadeInChinaWithPage(searchPage, keyword, maxPages),
              searchTimeout,
              `search(${src})`
            )
            urlCandidates.push(...found.slice(0, 120))
            await humanDelay()
          } catch (err) {
            errorsCount += 1
            const msg = err instanceof Error ? err.message : 'Search failed'
            errors.push(`[search ${src}] ${keyword}: ${msg}`)
          }
        }
        await withTimeout(release(), envInt('CRAWLER_RELEASE_TIMEOUT_MS', 15_000), 'release')
      }

      const uniqueUrls = uniqStrings(urlCandidates).slice(0, Math.max(1, maxProducts))
      const dupMap = await batchIsDuplicate(uniqueUrls)
      const newUrls = uniqueUrls.filter((u) => dupMap.get(u) !== true)
      productsFound = newUrls.length
      await updateRun(runId, { productsFound })

      // Avoid N+1: pre-check already-saved URLs in one query.
      const db = getDb()
      const existingRows =
        newUrls.length > 0
          ? await db
              .select({ sourceUrl: fabrics.sourceUrl })
              .from(fabrics)
              .where(and(inArray(fabrics.sourceUrl, newUrls), isNull(fabrics.deletedAt)))
          : []
      const existing = new Set<string>()
      for (const r of existingRows) {
        if (typeof r.sourceUrl === 'string' && r.sourceUrl.length > 0) existing.add(r.sourceUrl)
      }
      const scrapeTargets = newUrls.filter((u) => !existing.has(u))

      for (const url of scrapeTargets) {
        let release: (() => Promise<void>) | null = null
        try {
          assertNotTimedOut()
          const pageCtx = await withTimeout(getPage(), envInt('CRAWLER_GET_PAGE_TIMEOUT_MS', 25_000), 'getPage')
          release = pageCtx.release
          const productPage = pageCtx.page as unknown as PageLike

          const marketplace = detectMarketplaceFromUrl(url)
          const scrapeTimeout = envInt('CRAWLER_PRODUCT_TIMEOUT_MS', 120_000)
          const parsed = await withTimeout(
            marketplace === '1688'
              ? scrape1688Product(productPage, url)
              : marketplace === 'made_in_china'
                ? scrapeMadeInChinaProduct(productPage, url)
                : scrapeAlibabaProduct(productPage, url),
            scrapeTimeout,
            `scrape(${marketplace})`
          )
          if (!parsed) {
            continue
          }

          const cleaned = cleanProductData({
            url,
            source: marketplace,
            sourceLanguage: marketplace === '1688' ? 'zh' : 'en',
            title: parsed.title,
            description: parsed.description,
            imageUrls: parsed.imageUrls,
            priceText: parsed.priceText,
            moqText: parsed.moqText,
            compositionText: parsed.compositionText,
            gsmText: parsed.gsmText,
            widthText: parsed.widthText,
            supplierName: parsed.supplierName,
            supplierUrl: parsed.supplierUrl
          })

          const supplierId = await getOrCreateSupplier({
            name: cleaned.supplierName,
            sourceUrl: cleaned.supplierUrl,
            websiteUrl: null,
            logoUrl: null
          })

          const titleRu = cleaned.rawTitle.trim().length > 0 ? cleaned.rawTitle.trim() : 'Raw fabric'
          const slugBase = slugify(titleRu)
          const safeSuffix = Buffer.from(url).toString('base64url').slice(0, 8)
          const slug = `${slugBase}-${safeSuffix}`

          const inserted = await db
            .insert(fabrics)
            .values({
              supplierId,
              slug,
              sku: null,
              status: 'raw_scraped',
              titleRu,
              titleEn: null,
              descriptionRu: cleaned.rawDescription,
              descriptionEn: null,
              metaTitleRu: null,
              metaDescriptionRu: null,
              fabricType: null,
              gsm: null,
              widthCm: null,
              priceUsd: cleaned.priceUsd,
              moq: cleaned.moq,
              composition: null,
              tags: [],
              images: cleaned.images,
              sourceUrl: cleaned.sourceUrl,
              rawTitle: cleaned.rawTitle,
              rawDescription: cleaned.rawDescription,
              aiConfidenceScore: null,
              aiProcessedAt: null,
              isFeatured: false,
              socialScore: null,
              viewsCount: 0,
              updatedAt: new Date(),
              deletedAt: null
            })
            .returning({ id: fabrics.id })

          const row = inserted[0]
          if (!row) throw new Error('Insert fabric failed')
          productsSaved += 1

          await addAIJob(row.id)
          await updateRun(runId, { productsSaved })
          await humanDelay()
        } catch (err) {
          errorsCount += 1
          const msg = err instanceof Error ? err.message : 'Product scrape failed'
          errors.push(`[product] ${url}: ${msg}`)
          await updateRun(runId, { errorsCount })
        } finally {
          if (release) {
            try {
              await withTimeout(release(), envInt('CRAWLER_RELEASE_TIMEOUT_MS', 15_000), 'release')
            } catch {
              /* ignore release errors */
            }
          }
        }
      }

      const status: CrawlerRun['status'] = errorsCount > 0 && productsSaved > 0 ? 'PARTIAL' : errorsCount > 0 ? 'FAILED' : 'COMPLETED'
      await updateRun(runId, { status, completedAt: new Date(), errorsCount, errorLog: errors.length > 0 ? errors.slice(0, 200).join('\n') : null })
      logger.info('Crawler run completed', { runId, productsFound, productsSaved, errorsCount })
    } catch (fatal) {
      logger.error('Crawler run fatal error', {
        runId,
        message: fatal instanceof Error ? fatal.message : String(fatal)
      })
      await CrawlerService.markRunFatalFailure(runId, fatal)
      throw fatal
    }
  }

}

