import { and, count, desc, eq, isNull } from 'drizzle-orm'
import crypto from 'node:crypto'

import { getDb } from '@/db'
import { bulkImportJobs } from '@/db/schema/bulk-import-jobs.schema'
import { rawProducts } from '@/db/schema/raw-products.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { AdminFabricService } from '@/services/admin-fabric.service'
import { parseExcel } from '@/lib/excel/parser'
import { addTranslationJob } from '@/lib/queue/helpers'
import { logger } from '@/lib/logger'
import { NotFoundError } from '@/lib/errors'
import type { BulkImportJobSummary, BulkImportJobStatus } from '@/types/admin-fabric-management.types'
import type { BulkFabricRowInput } from '@/lib/validations/fabric.validation'

export class AdminBulkImportService {
  static async createFromExcel(params: {
    filename: string
    buffer: ArrayBuffer
    adminId: number
  }): Promise<{ jobId: number; summary: BulkImportJobSummary }> {
    const db = getDb()

    const parseResult = parseExcel(params.buffer)
    const { rows, errors: parseErrors } = parseResult

    const allErrors: Array<{ row: number; field: string; message: string }> = [...parseErrors]

    if (rows.length === 0) {
      const defaultId = await AdminFabricService.resolveSupplierByName('Default Supplier')
      const [job] = await db
        .insert(bulkImportJobs)
        .values({
          supplierId: defaultId,
          filename: params.filename,
          totalRows: 0,
          successCount: 0,
          errorCount: allErrors.length,
          status: 'FAILED',
          errors: allErrors,
          createdById: params.adminId > 0 ? params.adminId : null,
          startedAt: new Date(),
          completedAt: new Date()
        })
        .returning()
      if (!job) throw new Error('Failed to create import job')
      return { jobId: job.id, summary: AdminBulkImportService.toSummary(job) }
    }

    const uniqueSuppliers = new Set<string>()
    for (const row of rows) {
      if (row.supplierName) uniqueSuppliers.add(row.supplierName.trim())
    }

    const supplierMap = new Map<string, number>()
    for (const name of uniqueSuppliers) {
      supplierMap.set(name, await AdminFabricService.resolveSupplierByName(name))
    }

    const defaultSupplierId = supplierMap.size === 0
      ? await AdminFabricService.resolveSupplierByName('Default Supplier')
      : null

    const groupedBySupplier = new Map<number, typeof rows>()
    for (const row of rows) {
      let sid: number
      if (row.supplierName) {
        sid = supplierMap.get(row.supplierName.trim()) ?? 0
      } else if (defaultSupplierId) {
        sid = defaultSupplierId
      } else {
        sid = supplierMap.values().next().value ?? 0
      }
      if (!sid) {
        allErrors.push({ row: 0, field: 'supplier', message: 'No supplier resolved for row' })
        continue
      }
      if (!groupedBySupplier.has(sid)) groupedBySupplier.set(sid, [])
      groupedBySupplier.get(sid)!.push(row)
    }

    const firstSupplierId = defaultSupplierId ?? supplierMap.values().next().value ?? 1
    const [job] = await db
      .insert(bulkImportJobs)
      .values({
        supplierId: firstSupplierId,
        filename: params.filename,
        totalRows: rows.length,
        successCount: 0,
        errorCount: 0,
        status: 'PROCESSING',
        errors: allErrors.length > 0 ? allErrors : null,
        createdById: params.adminId > 0 ? params.adminId : null,
        startedAt: new Date()
      })
      .returning()
    if (!job) throw new Error('Failed to create import job')

    try {
      let totalImported = 0
      const importErrors: Array<{ row: number; field: string; message: string }> = []

      for (const [sid, group] of groupedBySupplier) {
        const mappedRows = group.map((row) => ({
          titleRu: row.titleRu,
          titleEn: row.titleEn ?? null,
          fabricType: row.fabricType ?? null,
          gsm: row.gsm ?? null,
          widthCm: row.widthCm ?? null,
          priceUsd: null,
          moq: null,
          tags: null,
          sku: row.sku ?? null,
          descriptionRu: row.descriptionRu ?? null,
          usageRu: row.usageRu ?? null,
          color: row.color ?? null,
          supplyType: row.supplyType ?? null,
          shipmentTime: row.shipmentTime ?? null,
          composition: row.composition ?? null,
          images: row.images ?? null
        }))

        const result = await AdminFabricService.bulkCreate({
          supplierId: sid,
          rows: mappedRows,
          adminId: params.adminId
        })
        totalImported += result.ids.length

        // Enqueue translation for each newly created fabric
        await Promise.allSettled(
          result.ids.map((id) => addTranslationJob(id, 'ru').catch((e) => {
            logger.warn('Failed to enqueue translation', { fabricId: id, message: (e as Error).message })
          }))
        )
      }

      importErrors.push(...allErrors)
      const status: BulkImportJobStatus = importErrors.length > 0 ? 'PARTIAL' : 'COMPLETED'

      const [updated] = await db
        .update(bulkImportJobs)
        .set({
          successCount: totalImported,
          errorCount: importErrors.length,
          status,
          errors: importErrors.length > 0 ? importErrors : null,
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(bulkImportJobs.id, job.id))
        .returning()
      if (!updated) throw new Error('Failed to update import job')

      return { jobId: job.id, summary: AdminBulkImportService.toSummary(updated) }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error('Bulk import processing failed', { jobId: job.id, message })

      const [failed] = await db
        .update(bulkImportJobs)
        .set({
          status: 'FAILED',
          errorCount: rows.length,
          errors: [{ row: 0, field: 'processing', message }],
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(bulkImportJobs.id, job.id))
        .returning()
      if (!failed) throw new Error('Failed to update import job after error')

      return { jobId: job.id, summary: AdminBulkImportService.toSummary(failed) }
    }
  }

  static async list(params: {
    page: number
    limit: number
  }): Promise<{ items: BulkImportJobSummary[]; total: number }> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const [totalRows, items] = await Promise.all([
      db.select({ total: count() }).from(bulkImportJobs).where(isNull(bulkImportJobs.deletedAt)),
      db
        .select({
          id: bulkImportJobs.id,
          supplierId: bulkImportJobs.supplierId,
          supplierName: suppliers.name,
          filename: bulkImportJobs.filename,
          totalRows: bulkImportJobs.totalRows,
          successCount: bulkImportJobs.successCount,
          errorCount: bulkImportJobs.errorCount,
          status: bulkImportJobs.status,
          errors: bulkImportJobs.errors,
          createdById: bulkImportJobs.createdById,
          createdAt: bulkImportJobs.createdAt,
          updatedAt: bulkImportJobs.updatedAt
        })
        .from(bulkImportJobs)
        .innerJoin(suppliers, eq(bulkImportJobs.supplierId, suppliers.id))
        .where(isNull(bulkImportJobs.deletedAt))
        .orderBy(desc(bulkImportJobs.createdAt))
        .limit(params.limit)
        .offset(offset)
    ])

    return {
      items: items.map((r) => AdminBulkImportService.toSummary(r)),
      total: totalRows[0]?.total ?? 0
    }
  }

  static async getById(id: number): Promise<BulkImportJobSummary | null> {
    const db = getDb()
    const rows = await db
      .select({
        id: bulkImportJobs.id,
        supplierId: bulkImportJobs.supplierId,
        supplierName: suppliers.name,
        filename: bulkImportJobs.filename,
        totalRows: bulkImportJobs.totalRows,
        successCount: bulkImportJobs.successCount,
        errorCount: bulkImportJobs.errorCount,
        status: bulkImportJobs.status,
        errors: bulkImportJobs.errors,
        createdById: bulkImportJobs.createdById,
        createdAt: bulkImportJobs.createdAt,
        updatedAt: bulkImportJobs.updatedAt
      })
      .from(bulkImportJobs)
      .innerJoin(suppliers, eq(bulkImportJobs.supplierId, suppliers.id))
      .where(and(eq(bulkImportJobs.id, id), isNull(bulkImportJobs.deletedAt)))
      .limit(1)

    const r = rows[0]
    if (!r) return null
    return AdminBulkImportService.toSummary(r)
  }

  static async storeRawRows(params: {
    rows: BulkFabricRowInput[]
    batchId: string
  }): Promise<{ stored: number }> {
    const db = getDb()
    const timestamp = Date.now()
    let stored = 0

    const values: Array<typeof rawProducts.$inferInsert> = []
    for (let i = 0; i < params.rows.length; i++) {
      const row = params.rows[i] as BulkFabricRowInput
      const productUrl = `manual://bulk/${params.batchId}/${timestamp}-${i}`
      const urlHash = crypto.createHash('sha256').update(productUrl).digest('hex')

      values.push({
        source: 'manual',
        productUrl,
        urlHash,
        rawTitle: row.title_ru ?? '',
        rawDescription: row.description_ru ?? null,
        rawComposition: row.composition ? JSON.stringify(row.composition) : null,
        rawImages: row.images ?? null,
        supplierName: row.supplier_name ?? null,
        priceText: row.price_usd ?? null,
        moqText: row.moq ? String(row.moq) : null,
        sourceLanguage: 'zh'
      })
      stored++
    }

    if (values.length > 0) {
      await db.insert(rawProducts).values(values)
    }

    return { stored }
  }

  private static toSummary(r: {
    id: number
    supplierId: number
    supplierName?: string
    filename: string
    totalRows: number
    successCount: number
    errorCount: number
    status: string
    errors: unknown
    createdById: number | null
    createdAt: Date
    updatedAt: Date
  }): BulkImportJobSummary {
    return {
      id: r.id,
      supplier_id: r.supplierId,
      supplier_name: r.supplierName ?? 'Unknown',
      filename: r.filename,
      total_rows: r.totalRows,
      success_count: r.successCount,
      error_count: r.errorCount,
      status: r.status as BulkImportJobStatus,
      errors: r.errors as BulkImportJobSummary['errors'],
      created_by_id: r.createdById,
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString()
    }
  }
}
