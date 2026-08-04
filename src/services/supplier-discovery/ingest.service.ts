import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import {
  supplierDiscoveryProducts,
  supplierDiscoveryRuns,
  supplierDiscoverySuppliers
} from '@/db/schema/supplier-discovery.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { NotFoundError } from '@/lib/errors'
import { addAIJob, addImageJob } from '@/lib/queue/helpers'
import { logger } from '@/lib/logger'

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return s.length > 0 ? s.slice(0, 80) : 'fabric'
}

async function getOrCreateSupplierFromDraft(params: {
  name: string
  sourceUrl: string
  websiteUrl: string | null
  logoUrl: string | null
  establishedYear: number | null
}): Promise<number> {
  const db = getDb()
  const supplierKey = params.sourceUrl.trim()
  const slugBase = slugify(params.name)
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
      name: params.name,
      slug,
      country: 'China',
      city: null,
      province: null,
      description: null,
      logoUrl: params.logoUrl,
      websiteUrl: params.websiteUrl,
      verified: false,
      establishedYear: params.establishedYear,
      sourceUrl: params.sourceUrl,
      updatedAt: new Date(),
      deletedAt: null
    })
    .returning({ id: suppliers.id })

  const row = inserted[0]
  if (!row) throw new Error('Failed to create supplier')
  return row.id
}

export class SupplierDiscoveryIngestService {
  /**
   * Ingests supplier drafts marked APPROVED_FOR_INGEST into `suppliers` + `fabrics`, then enqueues AI + image jobs.
   */
  public static async ingestApprovedForRun(runId: number): Promise<{ suppliersCreated: number; fabricsCreated: number }> {
    const db = getDb()

    const runRows = await db
      .select({ id: supplierDiscoveryRuns.id })
      .from(supplierDiscoveryRuns)
      .where(and(eq(supplierDiscoveryRuns.id, runId), isNull(supplierDiscoveryRuns.deletedAt)))
      .limit(1)
    if (!runRows[0]) {
      throw new NotFoundError('Discovery run not found')
    }

    const drafts = await db
      .select()
      .from(supplierDiscoverySuppliers)
      .where(
        and(
          eq(supplierDiscoverySuppliers.runId, runId),
          eq(supplierDiscoverySuppliers.status, 'APPROVED_FOR_INGEST'),
          isNull(supplierDiscoverySuppliers.deletedAt)
        )
      )

    let suppliersCreated = 0
    let fabricsCreated = 0

    for (const d of drafts) {
      const supplierName = d.name?.trim() || 'Unknown Supplier'
      const supplierId = await getOrCreateSupplierFromDraft({
        name: supplierName,
        sourceUrl: d.supplierUrl,
        websiteUrl: d.websiteUrl,
        logoUrl: d.logoUrl,
        establishedYear: d.establishedYear
      })
      suppliersCreated += 1

      const products = await db
        .select()
        .from(supplierDiscoveryProducts)
        .where(
          and(
            eq(supplierDiscoveryProducts.discoverySupplierId, d.id),
            isNull(supplierDiscoveryProducts.deletedAt)
          )
        )

      for (const p of products) {
        if (p.status === 'REJECTED') continue

        const existingFabric = await db
          .select({ id: fabrics.id })
          .from(fabrics)
          .where(and(eq(fabrics.sourceUrl, p.productUrl), isNull(fabrics.deletedAt)))
          .limit(1)
        if (existingFabric[0]?.id) continue

        const titleRu = p.rawTitle.trim().length > 0 ? p.rawTitle.trim() : 'Raw fabric'
        const slugBase = slugify(titleRu)
        const safeSuffix = Buffer.from(p.productUrl).toString('base64url').slice(0, 8)
        const slug = `${slugBase}-${safeSuffix}`.slice(0, 120)

        const inserted = await db
          .insert(fabrics)
          .values({
            supplierId,
            slug,
            sku: null,
            status: 'raw_scraped',
            titleRu,
            titleEn: null,
            descriptionRu: p.rawDescription,
            descriptionEn: null,
            metaTitleRu: null,
            metaDescriptionRu: null,
            fabricType: null,
            gsm: null,
            widthCm: null,
            priceUsd: null,
            moq: p.moqMeters,
            composition: null,
            tags: [],
            images: p.rawImages ?? [],
            sourceUrl: p.productUrl,
            rawTitle: p.rawTitle,
            rawDescription: p.rawDescription,
            aiConfidenceScore: null,
            aiProcessedAt: null,
            isFeatured: false,
            socialScore: null,
            viewsCount: 0,
            updatedAt: new Date(),
            deletedAt: null
          })
          .returning({ id: fabrics.id })

        const fabricRow = inserted[0]
        if (!fabricRow) continue
        fabricsCreated += 1

        await addAIJob(fabricRow.id)
        const imgs = p.rawImages ?? []
        if (imgs.length > 0) {
          await addImageJob(fabricRow.id, imgs)
        }
      }
    }

    logger.info('Supplier discovery ingest completed', { runId, suppliersCreated, fabricsCreated })
    return { suppliersCreated, fabricsCreated }
  }
}
