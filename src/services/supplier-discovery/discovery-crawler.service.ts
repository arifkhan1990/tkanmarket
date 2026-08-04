import { and, count, eq, isNull, max, min } from 'drizzle-orm'

import { getDb } from '@/db'
import {
  supplierDiscoveryProducts,
  supplierDiscoveryRuns,
  supplierDiscoverySuppliers
} from '@/db/schema/supplier-discovery.schema'
import { getPage, humanDelay } from '@/lib/crawler/browser'
import type { PageLike } from '@/lib/crawler/browser'
import { cleanProductData } from '@/lib/crawler/data-cleaner'
import type { EnrichedSupplierProfile } from '@/lib/crawler/source-registry'
import { getSourceHandlers } from '@/lib/crawler/source-registry'
import { normalizeProductUrl, urlHash16 } from '@/lib/crawler/url-normalize'
import { logger } from '@/lib/logger'
import {
  computeYearsInBusiness,
  parseMetersFromMoqText,
  qualifySupplierDraft,
  scoreProductPhotos
} from '@/services/supplier-discovery/qualification.service'
import type { SupplierDiscoveryCriteria } from '@/types/supplier-discovery.types'
import type { SupplierDiscoverySource } from '@/types/supplier-discovery.types'

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

function cleanerSource(
  s: SupplierDiscoverySource
): { source: 'alibaba' | '1688' | 'made_in_china'; sourceLanguage: 'en' | 'zh' } {
  if (s === '1688') return { source: '1688', sourceLanguage: 'zh' }
  if (s === 'made_in_china') return { source: 'made_in_china', sourceLanguage: 'en' }
  return { source: 'alibaba', sourceLanguage: 'en' }
}

function deriveSupplierUrl(cleanedSupplierUrl: string | null, productUrl: string): string {
  if (cleanedSupplierUrl && /^https?:\/\//i.test(cleanedSupplierUrl)) {
    return normalizeProductUrl(cleanedSupplierUrl)
  }
  try {
    const u = new URL(productUrl)
    return normalizeProductUrl(`${u.origin}/`)
  } catch {
    return normalizeProductUrl(productUrl)
  }
}

type RunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL'

async function updateDiscoveryRun(
  runId: number,
  patch: Partial<{
    status: RunStatus
    suppliersFound: number
    suppliersQualified: number
    productsExtracted: number
    draftsReady: number
    errorLog: string | null
    runNote: string | null
    startedAt: Date | null
    completedAt: Date | null
  }>
): Promise<void> {
  const db = getDb()
  await db
    .update(supplierDiscoveryRuns)
    .set({
      updatedAt: new Date(),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.suppliersFound !== undefined ? { suppliersFound: patch.suppliersFound } : {}),
      ...(patch.suppliersQualified !== undefined ? { suppliersQualified: patch.suppliersQualified } : {}),
      ...(patch.productsExtracted !== undefined ? { productsExtracted: patch.productsExtracted } : {}),
      ...(patch.draftsReady !== undefined ? { draftsReady: patch.draftsReady } : {}),
      ...(patch.errorLog !== undefined ? { errorLog: patch.errorLog } : {}),
      ...(patch.runNote !== undefined ? { runNote: patch.runNote } : {}),
      ...(patch.startedAt !== undefined ? { startedAt: patch.startedAt } : {}),
      ...(patch.completedAt !== undefined ? { completedAt: patch.completedAt } : {})
    })
    .where(eq(supplierDiscoveryRuns.id, runId))
}

async function getOrCreateSupplierDraft(params: {
  runId: number
  source: SupplierDiscoverySource
  supplierUrl: string
  supplierUrlHash: string
  name: string | null
}): Promise<number> {
  const db = getDb()
  const existing = await db
    .select({ id: supplierDiscoverySuppliers.id })
    .from(supplierDiscoverySuppliers)
    .where(
      and(
        eq(supplierDiscoverySuppliers.runId, params.runId),
        eq(supplierDiscoverySuppliers.supplierUrlHash, params.supplierUrlHash),
        isNull(supplierDiscoverySuppliers.deletedAt)
      )
    )
    .limit(1)

  if (existing[0]?.id) return existing[0].id

  const inserted = await db
    .insert(supplierDiscoverySuppliers)
    .values({
      runId: params.runId,
      source: params.source,
      supplierUrl: params.supplierUrl,
      supplierUrlHash: params.supplierUrlHash,
      name: params.name,
      logoUrl: null,
      websiteUrl: null,
      establishedYear: null,
      city: null,
      province: null,
      country: 'China',
      yearsInBusiness: null,
      catalogSizeEstimate: 0,
      moqMinMeters: null,
      photosScore: null,
      qualified: false,
      qualificationReasons: [],
      status: 'NEW',
      updatedAt: new Date(),
      deletedAt: null
    })
    .returning({ id: supplierDiscoverySuppliers.id })

  const row = inserted[0]
  if (!row) throw new Error('Failed to insert supplier discovery draft')
  return row.id
}

async function refreshSupplierAggregates(db: ReturnType<typeof getDb>, supplierDraftId: number): Promise<void> {
  const rows = await db
    .select({
      moqMin: min(supplierDiscoveryProducts.moqMeters),
      cnt: count(),
      photoMax: max(supplierDiscoveryProducts.photoQualityScore)
    })
    .from(supplierDiscoveryProducts)
    .where(
      and(eq(supplierDiscoveryProducts.discoverySupplierId, supplierDraftId), isNull(supplierDiscoveryProducts.deletedAt))
    )

  const r = rows[0]
  const moqMin = r?.moqMin ?? null
  const cnt = r?.cnt ?? 0
  const photoMax = r?.photoMax ? String(r.photoMax) : null

  await db
    .update(supplierDiscoverySuppliers)
    .set({
      catalogSizeEstimate: cnt,
      moqMinMeters: moqMin,
      photosScore: photoMax,
      updatedAt: new Date()
    })
    .where(eq(supplierDiscoverySuppliers.id, supplierDraftId))
}

async function applyShowroomEnrichment(
  db: ReturnType<typeof getDb>,
  supplierDraftId: number,
  nameFromProduct: string | null,
  profile: EnrichedSupplierProfile
): Promise<void> {
  const year = new Date().getFullYear()
  const yearsBiz =
    profile.establishedYear != null
      ? computeYearsInBusiness(profile.establishedYear, year)
      : null

  const name =
    (profile.name && profile.name.trim().length > 0 ? profile.name.trim() : null) ??
    (nameFromProduct && nameFromProduct.trim().length > 0 ? nameFromProduct.trim() : null) ??
    null

  const hasAny =
    name ||
    profile.logoUrl ||
    profile.websiteUrl ||
    profile.city ||
    profile.province ||
    profile.establishedYear != null ||
    yearsBiz != null
  if (!hasAny) {
    return
  }

  await db
    .update(supplierDiscoverySuppliers)
    .set({
      ...(name ? { name } : {}),
      ...(profile.logoUrl ? { logoUrl: profile.logoUrl } : {}),
      ...(profile.websiteUrl ? { websiteUrl: profile.websiteUrl } : {}),
      ...(profile.city ? { city: profile.city } : {}),
      ...(profile.province ? { province: profile.province } : {}),
      ...(profile.establishedYear != null ? { establishedYear: profile.establishedYear } : {}),
      ...(yearsBiz != null ? { yearsInBusiness: yearsBiz } : {}),
      updatedAt: new Date()
    })
    .where(eq(supplierDiscoverySuppliers.id, supplierDraftId))
}

async function requalifyRunSuppliers(runId: number, criteria: SupplierDiscoveryCriteria): Promise<void> {
  const db = getDb()
  const currentYear = new Date().getFullYear()
  const supRows = await db
    .select()
    .from(supplierDiscoverySuppliers)
    .where(and(eq(supplierDiscoverySuppliers.runId, runId), isNull(supplierDiscoverySuppliers.deletedAt)))

  let qualifiedCount = 0
  let draftsReady = 0

  for (const s of supRows) {
    const products = await db
      .select({
        rawImages: supplierDiscoveryProducts.rawImages,
        moqMeters: supplierDiscoveryProducts.moqMeters
      })
      .from(supplierDiscoveryProducts)
      .where(
        and(eq(supplierDiscoveryProducts.discoverySupplierId, s.id), isNull(supplierDiscoveryProducts.deletedAt))
      )

    const productPhotoCounts = products.map((p) => p.rawImages?.length ?? 0)

    const yearsBiz =
      s.yearsInBusiness ??
      (s.establishedYear ? computeYearsInBusiness(s.establishedYear, currentYear) : null)

    const q = qualifySupplierDraft(
      {
        yearsInBusiness: yearsBiz,
        establishedYear: s.establishedYear,
        catalogSizeEstimate: s.catalogSizeEstimate,
        moqMinMeters: s.moqMinMeters,
        photosScore: s.photosScore,
        productPhotoCounts
      },
      criteria,
      currentYear
    )

    if (q.qualified) {
      qualifiedCount += 1
      draftsReady += 1
    }

    await db
      .update(supplierDiscoverySuppliers)
      .set({
        qualified: q.qualified,
        qualificationReasons: q.reasons,
        status: q.supplierStatus,
        updatedAt: new Date()
      })
      .where(eq(supplierDiscoverySuppliers.id, s.id))
  }

  await updateDiscoveryRun(runId, { suppliersQualified: qualifiedCount, draftsReady })
}

export class DiscoveryCrawlerService {
  public static async abortRunDisabled(runId: number, reason: string): Promise<void> {
    await updateDiscoveryRun(runId, {
      status: 'FAILED',
      completedAt: new Date(),
      errorLog: reason,
      startedAt: new Date()
    })
  }

  public static async markRunFatalFailure(runId: number, err: unknown): Promise<void> {
    const message = err instanceof Error ? err.message : String(err)
    const db = getDb()
    await db
      .update(supplierDiscoveryRuns)
      .set({
        status: 'FAILED',
        completedAt: new Date(),
        errorLog: `[fatal] ${message}`.slice(0, 8000),
        updatedAt: new Date()
      })
      .where(eq(supplierDiscoveryRuns.id, runId))
  }

  public static async runDiscovery(runId: number): Promise<void> {
    const db = getDb()
    const runRows = await db.select().from(supplierDiscoveryRuns).where(eq(supplierDiscoveryRuns.id, runId)).limit(1)
    const run = runRows[0]
    if (!run) throw new Error('Discovery run not found')

    const criteria = run.criteriaJson as SupplierDiscoveryCriteria
    const sources = run.sources as SupplierDiscoverySource[]
    const keywords = run.keywords
    const maxSuppliers = run.maxSuppliers
    const maxProductsPerSupplier = run.maxProductsPerSupplier

    const errors: string[] = []
    let productsExtracted = 0
    let suppliersFound = 0
    const startedAtMs = Date.now()
    const hardTimeoutMs = envInt('CRAWLER_HARD_TIMEOUT_MS', 35 * 60 * 1000)
    const assertNotTimedOut = () => {
      if (Date.now() - startedAtMs > hardTimeoutMs) {
        throw new Error(`Discovery hard timeout exceeded (${hardTimeoutMs}ms)`)
      }
    }

    try {
      await updateDiscoveryRun(runId, {
        status: 'RUNNING',
        startedAt: new Date(),
        completedAt: null,
        errorLog: null,
        runNote: null
      })

      const urlCandidates: string[] = []
      const maxPages = Math.min(5, Math.max(1, Number(process.env.CRAWLER_MAX_PAGES_PER_KEYWORD ?? 3)))
      const urlBudget = Math.min(2000, Math.max(50, maxSuppliers * maxProductsPerSupplier * 4))

      for (const src of sources) {
        const handlers = getSourceHandlers(src)
        assertNotTimedOut()
        const { page, release } = await withTimeout(getPage(), envInt('CRAWLER_GET_PAGE_TIMEOUT_MS', 25_000), 'getPage')
        const searchPage = page as unknown as PageLike
        try {
          for (const keyword of keywords) {
            try {
              assertNotTimedOut()
              const found = await withTimeout(
                handlers.search(searchPage, keyword, maxPages),
                envInt('CRAWLER_SEARCH_TIMEOUT_MS', 90_000),
                `search(${src})`
              )
              urlCandidates.push(...found.slice(0, 160))
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Search failed'
              errors.push(`[search ${src}] ${keyword}: ${msg}`)
            }
            await humanDelay()
          }
        } finally {
          await withTimeout(release(), envInt('CRAWLER_RELEASE_TIMEOUT_MS', 15_000), 'release')
        }
      }

      const normalizedUrls = uniqStrings(urlCandidates.map((u) => normalizeProductUrl(u))).slice(0, urlBudget)
      if (normalizedUrls.length === 0) {
        const hint =
          'No products were discovered from search. This can happen due to captcha/blocks, selector changes, zero results, or network/proxy issues.'
        const noteLines = [
          `[summary] sources=${sources.join(',')}`,
          `[summary] keywords=${keywords.join(', ')}`,
          `[summary] candidates=0`,
          `[summary] errors=${errors.length}`,
          hint
        ].filter(Boolean)
        await updateDiscoveryRun(runId, {
          status: errors.length > 0 ? 'FAILED' : 'COMPLETED',
          completedAt: new Date(),
          suppliersFound: 0,
          productsExtracted: 0,
          runNote: noteLines.join('\n'),
          errorLog: errors.length > 0 ? errors.slice(0, 80).join('\n').slice(0, 8000) : null
        })
        logger.warn('Supplier discovery produced zero URLs', { runId, sources, keywordsCount: keywords.length, errors: errors.length })
        return
      }

      const supplierProductCount = new Map<number, number>()
      const supplierKeyToId = new Map<string, number>()
      let distinctSuppliers = 0

      for (const rawUrl of normalizedUrls) {
        assertNotTimedOut()
        const productUrl = rawUrl
        const urlHash = urlHash16(productUrl)

        const existingProduct = await db
          .select({ id: supplierDiscoveryProducts.id })
          .from(supplierDiscoveryProducts)
          .where(
            and(eq(supplierDiscoveryProducts.runId, runId), eq(supplierDiscoveryProducts.urlHash, urlHash), isNull(supplierDiscoveryProducts.deletedAt))
          )
          .limit(1)
        if (existingProduct[0]?.id) continue

        let sourceForUrl: SupplierDiscoverySource = 'alibaba'
        if (productUrl.includes('1688.com')) sourceForUrl = '1688'
        else if (productUrl.includes('made-in-china.com')) sourceForUrl = 'made_in_china'
        else if (productUrl.includes('alibaba.com')) sourceForUrl = 'alibaba'
        else if (!sources.includes(sourceForUrl)) {
          const first = sources[0]
          if (first) sourceForUrl = first
        }

        if (!sources.includes(sourceForUrl)) continue

        const handlers = getSourceHandlers(sourceForUrl)
        const { source: srcKey, sourceLanguage } = cleanerSource(sourceForUrl)

        const { page, release } = await withTimeout(getPage(), envInt('CRAWLER_GET_PAGE_TIMEOUT_MS', 25_000), 'getPage')
        const productPage = page as unknown as PageLike
        try {
          const parsed = await withTimeout(
            handlers.scrapeProduct(productPage, productUrl),
            envInt('CRAWLER_PRODUCT_TIMEOUT_MS', 120_000),
            `scrape(${sourceForUrl})`
          )
          if (!parsed) {
            continue
          }

          const cleaned = cleanProductData({
            url: productUrl,
            source: srcKey,
            sourceLanguage,
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

          const supplierUrl = deriveSupplierUrl(cleaned.supplierUrl, productUrl)
          const supplierHash = urlHash16(supplierUrl)
          const mapKey = `${sourceForUrl}:${supplierHash}`

          let isNewSupplier = false
          let supplierDraftId = supplierKeyToId.get(mapKey)
          if (!supplierDraftId) {
            if (distinctSuppliers >= maxSuppliers) {
              continue
            }
            isNewSupplier = true
            supplierDraftId = await getOrCreateSupplierDraft({
              runId,
              source: sourceForUrl,
              supplierUrl,
              supplierUrlHash: supplierHash,
              name: cleaned.supplierName
            })
            supplierKeyToId.set(mapKey, supplierDraftId)
            distinctSuppliers = supplierKeyToId.size
            suppliersFound = distinctSuppliers
          }

          if (isNewSupplier && handlers.enrichSupplierProfile) {
            try {
              assertNotTimedOut()
              const profile = await withTimeout(
                handlers.enrichSupplierProfile(productPage, supplierUrl),
                envInt('CRAWLER_SUPPLIER_ENRICH_TIMEOUT_MS', 45_000),
                `enrich_supplier(${sourceForUrl})`
              )
              if (profile) {
                await applyShowroomEnrichment(db, supplierDraftId, cleaned.supplierName, profile)
              }
            } catch (enrichErr) {
              const em = enrichErr instanceof Error ? enrichErr.message : String(enrichErr)
              logger.warn('Supplier showroom enrichment failed', { runId, supplierUrl, message: em })
            }
          }

          const currentCount = supplierProductCount.get(supplierDraftId) ?? 0
          if (currentCount >= maxProductsPerSupplier) {
            continue
          }

          const moqMeters = parseMetersFromMoqText(parsed.moqText)
          const scored = scoreProductPhotos(cleaned.images)
          const productStatus = scored.photoCount >= 1 && cleaned.rawTitle.trim().length > 0 ? 'READY' : 'NEEDS_REVIEW'

          const insertedRows = await db
            .insert(supplierDiscoveryProducts)
            .values({
              runId,
              discoverySupplierId: supplierDraftId,
              productUrl,
              urlHash,
              rawTitle: cleaned.rawTitle,
              rawDescription: cleaned.rawDescription,
              rawImages: cleaned.images,
              priceText: parsed.priceText,
              moqText: parsed.moqText,
              moqMeters,
              compositionText: cleaned.rawComposition,
              gsmText: cleaned.gsmRaw,
              widthText: cleaned.widthRaw,
              photoCount: scored.photoCount,
              photoQualityScore: scored.photoQualityScore,
              status: productStatus,
              updatedAt: new Date(),
              deletedAt: null
            })
            .onConflictDoNothing({
              target: [supplierDiscoveryProducts.runId, supplierDiscoveryProducts.urlHash]
            })
            .returning({ id: supplierDiscoveryProducts.id })

          if (!insertedRows[0]?.id) {
            continue
          }

          productsExtracted += 1
          supplierProductCount.set(supplierDraftId, currentCount + 1)

          await refreshSupplierAggregates(db, supplierDraftId)
          if (productsExtracted % 5 === 0) {
            await updateDiscoveryRun(runId, { productsExtracted, suppliersFound })
          }
          await humanDelay()
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Product scrape failed'
          errors.push(`[product] ${productUrl}: ${msg}`)
        } finally {
          await withTimeout(release(), envInt('CRAWLER_RELEASE_TIMEOUT_MS', 15_000), 'release')
        }
      }

      await requalifyRunSuppliers(runId, criteria)

      const supplierCountRows = await db
        .select({ c: count() })
        .from(supplierDiscoverySuppliers)
        .where(and(eq(supplierDiscoverySuppliers.runId, runId), isNull(supplierDiscoverySuppliers.deletedAt)))
      const finalSupplierCount = supplierCountRows[0]?.c ?? 0
      await updateDiscoveryRun(runId, { suppliersFound: finalSupplierCount })

      const status: RunStatus =
        errors.length > 0 && productsExtracted > 0 ? 'PARTIAL' : errors.length > 0 ? 'FAILED' : 'COMPLETED'
      await updateDiscoveryRun(runId, {
        status,
        completedAt: new Date(),
        errorLog:
          errors.length > 0
            ? [
                `[summary] sources=${sources.join(',')}`,
                `[summary] keywords=${keywords.join(', ')}`,
                `[summary] productsExtracted=${productsExtracted}`,
                `[summary] suppliersFound=${suppliersFound}`,
                `[errors] ${errors.length} (showing up to 200)`,
                ...errors.slice(0, 200)
              ].join('\n')
            : null
      })
      logger.info('Supplier discovery run completed', { runId, productsExtracted, suppliersFound, errors: errors.length })
    } catch (fatal) {
      logger.error('Supplier discovery fatal', {
        runId,
        message: fatal instanceof Error ? fatal.message : String(fatal)
      })
      await DiscoveryCrawlerService.markRunFatalFailure(runId, fatal)
      throw fatal
    }
  }
}
