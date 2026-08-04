import { and, count, desc, eq, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { adminRawUploads } from '@/db/schema/admin-raw-uploads.schema'
import { adminRawUploadRows } from '@/db/schema/admin-raw-upload-rows.schema'
import { adminRawProcessingLog } from '@/db/schema/admin-raw-processing-log.schema'
import { uploadBuffer } from '@/lib/storage/r2'
import { parseExcel } from '@/lib/excel/parser'
import { addAIJob } from '@/lib/queue/helpers'
import { logger } from '@/lib/logger'
import { rawProducts } from '@/db/schema/raw-products.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { fabricActivityLog } from '@/db/schema/fabric-activity-log.schema'
import { NotFoundError } from '@/lib/errors'
import type { AdminRawUploadRowStatus, AdminRawUploadStatus } from '@/types/admin-raw-upload.types'

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : null
}

function parseRawRows(buffer: ArrayBuffer, fileType: string): Array<Record<string, unknown>> {
  if (fileType === 'EXCEL' || fileType === 'CSV') {
    const parseResult = parseExcel(buffer)
    return parseResult.rows as unknown as Array<Record<string, unknown>>
  } else if (fileType === 'JSON') {
    const json = JSON.parse(new TextDecoder().decode(buffer))
    return Array.isArray(json) ? json : [json]
  }
  throw new Error(`Unsupported file type: ${fileType}`)
}

export class AdminRawUploadService {
  public static async createUpload(params: {
    filename: string
    fileType: string
    buffer: ArrayBuffer
    uploadedByUserId: number
  }): Promise<{ id: number; totalRows: number }> {
    const db = getDb()

    const [job] = await db
      .insert(adminRawUploads)
      .values({
        filename: params.filename,
        fileType: params.fileType,
        status: 'PROCESSING',
        totalRows: 0,
        processedRows: 0,
        errorRows: 0,
        uploadedByUserId: params.uploadedByUserId,
        startedAt: new Date()
      })
      .returning({ id: adminRawUploads.id })

    if (!job) throw new Error('Failed to create upload record')

    const uploadId = job.id
    let rows: Array<Record<string, unknown>> = []

    try {
      rows = parseRawRows(params.buffer, params.fileType)

      await db
        .update(adminRawUploads)
        .set({ totalRows: rows.length, updatedAt: sql`now()` })
        .where(eq(adminRawUploads.id, uploadId))

      const now = new Date()
      const rowRecords = rows.map((row, idx) => ({
        uploadId,
        rowIndex: idx + 1,
        rawData: row,
        normalizedData: null,
        status: 'PENDING' as AdminRawUploadRowStatus,
        errorMessage: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null
      }))

      if (rowRecords.length > 0) {
        await db.insert(adminRawUploadRows).values(rowRecords)
      }

      await db
        .update(adminRawUploads)
        .set({ status: 'COMPLETED', completedAt: new Date(), updatedAt: sql`now()` })
        .where(eq(adminRawUploads.id, uploadId))

      return { id: uploadId, totalRows: rows.length }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error('Raw upload processing failed', { uploadId, message })

      await db
        .update(adminRawUploads)
        .set({
          status: 'FAILED',
          errorRows: rows.length,
          completedAt: new Date(),
          updatedAt: sql`now()`
        })
        .where(eq(adminRawUploads.id, uploadId))

      throw err
    }
  }

  public static async storeOriginalFile(params: {
    uploadId: number
    buffer: Buffer
    originalFileName: string
  }): Promise<string> {
    const key = `admin/raw-uploads/${params.uploadId}/${params.originalFileName}`
    const r2Url = await uploadBuffer(params.buffer, key, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    const db = getDb()
    await db
      .update(adminRawUploads)
      .set({ originalFileUrl: r2Url, updatedAt: sql`now()` })
      .where(eq(adminRawUploads.id, params.uploadId))
    return r2Url
  }

  public static async list(params: { page: number; limit: number }) {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const [totalRows, items] = await Promise.all([
      db.select({ total: count() }).from(adminRawUploads).where(isNull(adminRawUploads.deletedAt)),
      db
        .select({
          id: adminRawUploads.id,
          filename: adminRawUploads.filename,
          originalFileUrl: adminRawUploads.originalFileUrl,
          fileType: adminRawUploads.fileType,
          status: adminRawUploads.status,
          totalRows: adminRawUploads.totalRows,
          processedRows: adminRawUploads.processedRows,
          errorRows: adminRawUploads.errorRows,
          uploadedByUserId: adminRawUploads.uploadedByUserId,
          startedAt: adminRawUploads.startedAt,
          completedAt: adminRawUploads.completedAt,
          createdAt: adminRawUploads.createdAt,
          updatedAt: adminRawUploads.updatedAt
        })
        .from(adminRawUploads)
        .orderBy(desc(adminRawUploads.createdAt))
        .limit(params.limit)
        .offset(offset)
    ])

    return {
      items: items.map((r) => AdminRawUploadService.toSummary(r)),
      total: totalRows[0]?.total ?? 0
    }
  }

  public static async getById(id: number) {
    const db = getDb()
    const result = await db
      .select({
        id: adminRawUploads.id,
        filename: adminRawUploads.filename,
        originalFileUrl: adminRawUploads.originalFileUrl,
        fileType: adminRawUploads.fileType,
        status: adminRawUploads.status,
        totalRows: adminRawUploads.totalRows,
        processedRows: adminRawUploads.processedRows,
        errorRows: adminRawUploads.errorRows,
        uploadedByUserId: adminRawUploads.uploadedByUserId,
        startedAt: adminRawUploads.startedAt,
        completedAt: adminRawUploads.completedAt,
        createdAt: adminRawUploads.createdAt,
        updatedAt: adminRawUploads.updatedAt
      })
      .from(adminRawUploads)
      .where(and(eq(adminRawUploads.id, id), isNull(adminRawUploads.deletedAt)))
      .limit(1)

    const r = result[0]
    if (!r) throw new NotFoundError('Upload not found')
    return AdminRawUploadService.toSummary(r)
  }

  public static async getRows(params: { uploadId: number; page: number; limit: number }) {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const [totalRows, items] = await Promise.all([
      db
        .select({ total: count() })
        .from(adminRawUploadRows)
        .where(eq(adminRawUploadRows.uploadId, params.uploadId)),
      db
        .select({
          id: adminRawUploadRows.id,
          uploadId: adminRawUploadRows.uploadId,
          rowIndex: adminRawUploadRows.rowIndex,
          rawData: adminRawUploadRows.rawData,
          normalizedData: adminRawUploadRows.normalizedData,
          status: adminRawUploadRows.status,
          errorMessage: adminRawUploadRows.errorMessage
        })
        .from(adminRawUploadRows)
        .where(and(eq(adminRawUploadRows.uploadId, params.uploadId), isNull(adminRawUploadRows.deletedAt)))
        .orderBy(adminRawUploadRows.rowIndex)
        .limit(params.limit)
        .offset(offset)
    ])

    return {
      items: items.map((r) => AdminRawUploadService.toRowSummary(r)),
      total: totalRows[0]?.total ?? 0
    }
  }

  public static async processRows(uploadId: number): Promise<{ processedCount: number; errorCount: number }> {
    const db = getDb()

    const upload = await this.getById(uploadId)
    if (upload.status !== 'COMPLETED') {
      throw new Error(`Upload is not in COMPLETED state (current: ${upload.status})`)
    }

    await db
      .update(adminRawUploads)
      .set({ status: 'PROCESSING', startedAt: new Date(), updatedAt: sql`now()` })
      .where(eq(adminRawUploads.id, uploadId))

    const pendingRows = await db
      .select({
        id: adminRawUploadRows.id,
        rowIndex: adminRawUploadRows.rowIndex,
        rawData: adminRawUploadRows.rawData
      })
      .from(adminRawUploadRows)
      .where(and(eq(adminRawUploadRows.uploadId, uploadId), eq(adminRawUploadRows.status, 'PENDING')))

    let processedCount = 0
    let errorCount = 0

    for (const row of pendingRows) {
      try {
        const normalized = await this.normalizeRow(row.rawData as Record<string, unknown>)

        await db
          .update(adminRawUploadRows)
          .set({ normalizedData: normalized, status: 'COMPLETED', updatedAt: sql`now()` })
          .where(eq(adminRawUploadRows.id, row.id))

        if (normalized) {
          const source = 'manual_upload' as const
          const productUrl = (normalized as Record<string, unknown>)['productUrl'] as string | undefined
          const urlHash = productUrl ? `upload_${uploadId}_${row.rowIndex}_${Date.now().toString(36)}` : ''

          await db.insert(rawProducts).values({
            source,
            productUrl: productUrl ?? '',
            urlHash,
            rawTitle: (normalized as Record<string, unknown>)['rawTitle'] as string ?? '',
            rawDescription: (normalized as Record<string, unknown>)['rawDescription'] as string | undefined ?? null,
            rawComposition: (normalized as Record<string, unknown>)['rawComposition'] as string | undefined ?? null,
            rawImages: ((normalized as Record<string, unknown>)['rawImages'] as string[] | undefined) ?? null,
            supplierName: (normalized as Record<string, unknown>)['supplierName'] as string | undefined ?? null,
            priceText: (normalized as Record<string, unknown>)['priceText'] as string | undefined ?? null,
            moqText: (normalized as Record<string, unknown>)['moqText'] as string | undefined ?? null,
            sourceLanguage: 'en' as const,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }

        processedCount++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        await db
          .update(adminRawUploadRows)
          .set({ status: 'FAILED', errorMessage: message, updatedAt: sql`now()` })
          .where(eq(adminRawUploadRows.id, row.id))
        errorCount++
      }
    }

    const finalStatus = errorCount > 0 && processedCount === 0 ? 'FAILED' : 'COMPLETED'

    await db
      .update(adminRawUploads)
      .set({
        status: finalStatus as AdminRawUploadStatus,
        processedRows: processedCount,
        errorRows: errorCount,
        completedAt: new Date(),
        updatedAt: sql`now()`
      })
      .where(eq(adminRawUploads.id, uploadId))

    return { processedCount, errorCount }
  }

  public static async enqueueAIForUpload(uploadId: number): Promise<number> {
    const db = getDb()

    const rows = await db
      .select()
      .from(rawProducts)
      .where(
        and(
          eq(rawProducts.source, 'manual_upload'),
          isNull(rawProducts.deletedAt)
        )
      )
      .orderBy(desc(rawProducts.createdAt))
      .limit(100)

    let enqueuedCount = 0
    for (const row of rows) {
      try {
        const fabricId = await AdminRawUploadService.createFabricFromRaw(row)
        await addAIJob(fabricId)
        enqueuedCount++
      } catch (err) {
        logger.warn('Failed to enqueue AI job for raw product', { rawProductId: row.id, message: (err as Error).message })
      }
    }

    return enqueuedCount
  }

  private static async createFabricFromRaw(row: typeof rawProducts.$inferSelect): Promise<number> {
    const db = getDb()

    const [inserted] = await db
      .insert(fabrics)
      .values({
        supplierId: 1,
        slug: `manual-${row.id}-${Date.now().toString(36)}`,
        status: 'raw_scraped',
        titleRu: row.rawTitle ?? '',
        titleEn: null,
        descriptionRu: row.rawDescription ?? null,
        descriptionEn: null,
        usageRu: null,
        usageEn: null,
        metaTitleRu: null,
        metaDescriptionRu: null,
        metaTitleEn: null,
        metaDescriptionEn: null,
        imageAltRu: null,
        imageAltEn: null,
        fabricType: null,
        gsm: null,
        widthCm: null,
        color: null,
        colorEn: null,
        supplyType: null,
        supplyTypeEn: null,
        shipmentTime: null,
        shipmentTimeEn: null,
        priceUsd: null,
        moq: null,
        composition: null,
        tags: null,
        tagsEn: null,
        images: row.rawImages ?? null,
        sourceUrl: row.productUrl ?? null,
        rawTitle: row.rawTitle ?? null,
        rawDescription: row.rawDescription ?? null,
        aiConfidenceScore: null,
        aiProcessedAt: null,
        isFeatured: false,
        socialScore: null,
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({ id: fabrics.id })

    if (!inserted) throw new Error('Failed to create fabric from raw product')

    await db.insert(fabricActivityLog).values({
      fabricId: inserted.id,
      actorId: null,
      eventType: 'RAW_PRODUCT_IMPORTED',
      message: 'Raw product imported from admin upload',
      payload: { uploadId: row.source === 'manual_upload', rawProductId: row.id, sourceUrl: row.productUrl },
      updatedAt: new Date()
    })

    return inserted.id
  }

  private static async normalizeRow(rowData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const tr = rowData['titleRu']
    const trRu = rowData['title_ru']
    const titleRu = (typeof tr === 'string' ? tr : typeof trRu === 'string' ? trRu : null) ?? null
    if (!titleRu || String(titleRu).trim().length === 0) return null

    const te = rowData['titleEn'] ?? rowData['title_en']
    const rawDesc = rowData['rawDescription'] ?? rowData['raw_description']
    const descRu = rowData['descriptionRu'] ?? rowData['description_ru']
    const descEn = rowData['descriptionEn'] ?? rowData['description_en']
    const ft = rowData['fabricType'] ?? rowData['fabric_type']
    const gsm = rowData['gsm'] as number | undefined
    const wc = rowData['widthCm'] ?? rowData['width_cm']
    const color = rowData['color'] as string | undefined
    const st = rowData['supplyType'] ?? rowData['supply_type']
    const pt = rowData['priceText'] ?? rowData['price_text']
    const mq = rowData['moqText'] ?? rowData['moq_text']
    const sn = rowData['supplierName'] ?? rowData['supplier_name']
    const pu = rowData['productUrl'] ?? rowData['product_url']
    const ri = rowData['rawImages'] ?? rowData['raw_images']
    const comp = rowData['composition'] ?? null
    const tags = rowData['tags'] as string[] | undefined
    const sku = rowData['sku'] as string | undefined

    return {
      rawTitle: String(titleRu).trim(),
      titleEn: (typeof te === 'string' ? te : null) ?? null,
      rawDescription: (typeof rawDesc === 'string' ? rawDesc : null) ?? null,
      descriptionRu: (typeof descRu === 'string' ? descRu : null) ?? null,
      descriptionEn: (typeof descEn === 'string' ? descEn : null) ?? null,
      fabricType: (typeof ft === 'string' ? ft : null) ?? null,
      gsm: typeof gsm === 'number' ? gsm : null,
      widthCm: typeof wc === 'number' ? wc : null,
      color,
      supplyType: (typeof st === 'string' ? st : null) ?? null,
      priceText: (typeof pt === 'string' ? pt : null) ?? null,
      moqText: (typeof mq === 'string' ? mq : null) ?? null,
      supplierName: (typeof sn === 'string' ? sn : null) ?? null,
      productUrl: (typeof pu === 'string' ? pu : null) ?? null,
      rawImages: (Array.isArray(ri) ? ri : null) as string[] | null,
      composition: comp,
      tags,
      sku
    }
  }

  private static toSummary(r: {
    id: number
    filename: string
    originalFileUrl: string | null
    fileType: string
    status: string
    totalRows: number
    processedRows: number
    errorRows: number
    uploadedByUserId: number
    startedAt: Date | null
    completedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }) {
    return {
      id: r.id,
      filename: r.filename,
      originalFileUrl: r.originalFileUrl,
      fileType: r.fileType,
      status: r.status as AdminRawUploadStatus,
      totalRows: r.totalRows,
      processedRows: r.processedRows,
      errorRows: r.errorRows,
      uploadedByUserId: r.uploadedByUserId,
      startedAt: toIso(r.startedAt),
      completedAt: toIso(r.completedAt),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }
  }

  private static toRowSummary(r: {
    id: number
    uploadId: number
    rowIndex: number
    rawData: unknown
    normalizedData: unknown
    status: string
    errorMessage: string | null
  }) {
    return {
      id: r.id,
      uploadId: r.uploadId,
      rowIndex: r.rowIndex,
      rawData: r.rawData as Record<string, unknown>,
      normalizedData: r.normalizedData as Record<string, unknown> | null,
      status: r.status as AdminRawUploadRowStatus,
      errorMessage: r.errorMessage
    }
  }
}