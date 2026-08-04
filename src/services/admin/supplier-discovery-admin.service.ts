import { and, count, desc, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import {
  supplierDiscoveryProducts,
  supplierDiscoveryRuns,
  supplierDiscoverySuppliers
} from '@/db/schema/supplier-discovery.schema'
import { NotFoundError } from '@/lib/errors'
import { mergeSupplierDiscoveryCriteria } from '@/lib/validations/supplier-discovery.validation'
import type {
  SupplierDiscoveryCriteria,
  SupplierDiscoveryProductDraftRow,
  SupplierDiscoveryRunRow,
  SupplierDiscoverySupplierDraftRow
} from '@/types/supplier-discovery.types'
import type { SupplierDiscoverySource } from '@/types/supplier-discovery.types'

function mapRun(r: {
  id: number
  status: string
  sources: string[]
  criteriaJson: unknown
  keywords: string[]
  maxSuppliers: number
  maxProductsPerSupplier: number
  suppliersFound: number
  suppliersQualified: number
  productsExtracted: number
  draftsReady: number
  triggeredById: number | null
  startedAt: Date | null
  completedAt: Date | null
  errorLog: string | null
  runNote: string | null
  createdAt: Date
  updatedAt: Date
}): SupplierDiscoveryRunRow {
  const criteria = mergeSupplierDiscoveryCriteria(
    r.criteriaJson as Partial<SupplierDiscoveryCriteria> | undefined
  )
  return {
    id: r.id,
    status: r.status as SupplierDiscoveryRunRow['status'],
    sources: r.sources as SupplierDiscoverySource[],
    criteriaJson: criteria,
    keywords: r.keywords,
    maxSuppliers: r.maxSuppliers,
    maxProductsPerSupplier: r.maxProductsPerSupplier,
    suppliersFound: r.suppliersFound,
    suppliersQualified: r.suppliersQualified,
    productsExtracted: r.productsExtracted,
    draftsReady: r.draftsReady,
    triggeredById: r.triggeredById,
    startedAt: r.startedAt ? r.startedAt.toISOString() : null,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    errorLog: r.errorLog ?? null,
    runNote: r.runNote ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  }
}

function mapSupplier(r: {
  id: number
  runId: number
  source: string
  supplierUrl: string
  supplierUrlHash: string
  name: string | null
  logoUrl: string | null
  websiteUrl: string | null
  establishedYear: number | null
  city: string | null
  province: string | null
  country: string | null
  yearsInBusiness: number | null
  catalogSizeEstimate: number | null
  moqMinMeters: number | null
  photosScore: string | null
  qualified: boolean
  qualificationReasons: string[] | null
  status: string
  createdAt: Date
  updatedAt: Date
}): SupplierDiscoverySupplierDraftRow {
  return {
    id: r.id,
    runId: r.runId,
    source: r.source as SupplierDiscoverySource,
    supplierUrl: r.supplierUrl,
    supplierUrlHash: r.supplierUrlHash,
    name: r.name,
    logoUrl: r.logoUrl,
    websiteUrl: r.websiteUrl,
    establishedYear: r.establishedYear,
    city: r.city,
    province: r.province,
    country: r.country,
    yearsInBusiness: r.yearsInBusiness,
    catalogSizeEstimate: r.catalogSizeEstimate,
    moqMinMeters: r.moqMinMeters,
    photosScore: r.photosScore,
    qualified: r.qualified,
    qualificationReasons: r.qualificationReasons,
    status: r.status as SupplierDiscoverySupplierDraftRow['status'],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  }
}

function mapProduct(r: {
  id: number
  runId: number
  discoverySupplierId: number
  productUrl: string
  urlHash: string
  rawTitle: string
  rawDescription: string | null
  rawImages: string[] | null
  priceText: string | null
  moqText: string | null
  moqMeters: number | null
  compositionText: string | null
  gsmText: string | null
  widthText: string | null
  photoCount: number
  photoQualityScore: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}): SupplierDiscoveryProductDraftRow {
  return {
    id: r.id,
    runId: r.runId,
    discoverySupplierId: r.discoverySupplierId,
    productUrl: r.productUrl,
    urlHash: r.urlHash,
    rawTitle: r.rawTitle,
    rawDescription: r.rawDescription,
    rawImages: r.rawImages,
    priceText: r.priceText,
    moqText: r.moqText,
    moqMeters: r.moqMeters,
    compositionText: r.compositionText,
    gsmText: r.gsmText,
    widthText: r.widthText,
    photoCount: r.photoCount,
    photoQualityScore: r.photoQualityScore,
    status: r.status as SupplierDiscoveryProductDraftRow['status'],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  }
}

export class SupplierDiscoveryAdminService {
  public static async listRuns(params: { page: number; limit: number }): Promise<{
    runs: SupplierDiscoveryRunRow[]
    total: number
  }> {
    const db = getDb()
    const page = Math.max(1, params.page)
    const limit = Math.min(100, Math.max(1, params.limit))
    const offset = (page - 1) * limit

    const [totalRows, rows] = await Promise.all([
      db.select({ c: count() }).from(supplierDiscoveryRuns).where(isNull(supplierDiscoveryRuns.deletedAt)),
      db
        .select()
        .from(supplierDiscoveryRuns)
        .where(isNull(supplierDiscoveryRuns.deletedAt))
        .orderBy(desc(supplierDiscoveryRuns.id))
        .limit(limit)
        .offset(offset)
    ])

    const total = totalRows[0]?.c ?? 0
    return { runs: rows.map(mapRun), total }
  }

  public static async getRun(runId: number): Promise<SupplierDiscoveryRunRow> {
    const db = getDb()
    const rows = await db
      .select()
      .from(supplierDiscoveryRuns)
      .where(and(eq(supplierDiscoveryRuns.id, runId), isNull(supplierDiscoveryRuns.deletedAt)))
      .limit(1)
    const r = rows[0]
    if (!r) throw new NotFoundError('Discovery run not found')
    return mapRun(r)
  }

  public static async listRunSuppliers(
    runId: number,
    params: {
      page: number
      limit: number
      qualified?: boolean
      status?: SupplierDiscoverySupplierDraftRow['status']
      source?: SupplierDiscoverySource
    }
  ): Promise<{ suppliers: SupplierDiscoverySupplierDraftRow[]; total: number }> {
    await SupplierDiscoveryAdminService.getRun(runId)
    const db = getDb()
    const page = Math.max(1, params.page)
    const limit = Math.min(100, Math.max(1, params.limit))
    const offset = (page - 1) * limit

    const filters = [
      eq(supplierDiscoverySuppliers.runId, runId),
      isNull(supplierDiscoverySuppliers.deletedAt)
    ]
    if (params.qualified !== undefined) {
      filters.push(eq(supplierDiscoverySuppliers.qualified, params.qualified))
    }
    if (params.status) {
      filters.push(eq(supplierDiscoverySuppliers.status, params.status))
    }
    if (params.source) {
      filters.push(eq(supplierDiscoverySuppliers.source, params.source))
    }

    const whereClause = and(...filters)

    const [totalRows, rows] = await Promise.all([
      db.select({ c: count() }).from(supplierDiscoverySuppliers).where(whereClause),
      db
        .select()
        .from(supplierDiscoverySuppliers)
        .where(whereClause)
        .orderBy(desc(supplierDiscoverySuppliers.id))
        .limit(limit)
        .offset(offset)
    ])

    const total = totalRows[0]?.c ?? 0
    return { suppliers: rows.map(mapSupplier), total }
  }

  public static async listSupplierProducts(
    runId: number,
    supplierDraftId: number,
    params: { page: number; limit: number; status?: SupplierDiscoveryProductDraftRow['status'] }
  ): Promise<{ products: SupplierDiscoveryProductDraftRow[]; total: number }> {
    await SupplierDiscoveryAdminService.getRun(runId)
    const db = getDb()
    const page = Math.max(1, params.page)
    const limit = Math.min(100, Math.max(1, params.limit))
    const offset = (page - 1) * limit

    const filters = [
      eq(supplierDiscoveryProducts.runId, runId),
      eq(supplierDiscoveryProducts.discoverySupplierId, supplierDraftId),
      isNull(supplierDiscoveryProducts.deletedAt)
    ]
    if (params.status) {
      filters.push(eq(supplierDiscoveryProducts.status, params.status))
    }
    const whereClause = and(...filters)

    const [totalRows, rows] = await Promise.all([
      db.select({ c: count() }).from(supplierDiscoveryProducts).where(whereClause),
      db
        .select()
        .from(supplierDiscoveryProducts)
        .where(whereClause)
        .orderBy(desc(supplierDiscoveryProducts.id))
        .limit(limit)
        .offset(offset)
    ])

    const total = totalRows[0]?.c ?? 0
    return { products: rows.map(mapProduct), total }
  }

  public static async patchSupplierDraft(
    draftId: number,
    patch: {
      name?: string | null
      website_url?: string | null
      logo_url?: string | null
      established_year?: number | null
      city?: string | null
      province?: string | null
      country?: string | null
      status?: SupplierDiscoverySupplierDraftRow['status']
    }
  ): Promise<SupplierDiscoverySupplierDraftRow> {
    const db = getDb()
    const rows = await db
      .select()
      .from(supplierDiscoverySuppliers)
      .where(and(eq(supplierDiscoverySuppliers.id, draftId), isNull(supplierDiscoverySuppliers.deletedAt)))
      .limit(1)
    const existing = rows[0]
    if (!existing) throw new NotFoundError('Supplier draft not found')

    await db
      .update(supplierDiscoverySuppliers)
      .set({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.website_url !== undefined ? { websiteUrl: patch.website_url } : {}),
        ...(patch.logo_url !== undefined ? { logoUrl: patch.logo_url } : {}),
        ...(patch.established_year !== undefined ? { establishedYear: patch.established_year } : {}),
        ...(patch.city !== undefined ? { city: patch.city } : {}),
        ...(patch.province !== undefined ? { province: patch.province } : {}),
        ...(patch.country !== undefined ? { country: patch.country } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        updatedAt: new Date()
      })
      .where(eq(supplierDiscoverySuppliers.id, draftId))

    const updated = await db
      .select()
      .from(supplierDiscoverySuppliers)
      .where(eq(supplierDiscoverySuppliers.id, draftId))
      .limit(1)
    const r = updated[0]
    if (!r) throw new NotFoundError('Supplier draft not found')
    return mapSupplier(r)
  }

  public static async approveSupplierDraft(draftId: number): Promise<SupplierDiscoverySupplierDraftRow> {
    return SupplierDiscoveryAdminService.patchSupplierDraft(draftId, { status: 'APPROVED_FOR_INGEST' })
  }

  public static async rejectSupplierDraft(draftId: number): Promise<SupplierDiscoverySupplierDraftRow> {
    return SupplierDiscoveryAdminService.patchSupplierDraft(draftId, { status: 'REJECTED' })
  }
}
