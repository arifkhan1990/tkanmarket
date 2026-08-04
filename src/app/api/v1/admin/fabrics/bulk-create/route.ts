import type { NextRequest } from 'next/server'

import crypto from 'node:crypto'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminFabricService } from '@/services/admin-fabric.service'
import { AdminBulkImportService } from '@/services/admin-bulk-import.service'
import { addTranslationJob } from '@/lib/queue/helpers'
import { logger } from '@/lib/logger'
import { BulkFabricCreateSchema } from '@/lib/validations/fabric.validation'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const body = BulkFabricCreateSchema.parse(await req.json().catch(() => ({})))

    const mappedRows = body.rows.map((r) => ({
      titleRu: r.title_ru,
      titleEn: r.title_en,
      fabricType: r.fabric_type,
      gsm: r.gsm,
      widthCm: r.width_cm,
      priceUsd: r.price_usd,
      moq: r.moq,
      tags: r.tags,
      sku: r.sku,
      descriptionRu: r.description_ru,
      usageRu: r.usage_ru,
      usageEn: r.usage_en,
      color: r.color,
      colorEn: r.color_en,
      supplyType: r.supply_type,
      supplyTypeEn: r.supply_type_en,
      shipmentTime: r.shipment_time,
      shipmentTimeEn: r.shipment_time_en,
      tagsEn: null,
      composition: r.composition,
      images: r.images
    }))

    const enqueueTranslation = (ids: number[]) => {
      Promise.allSettled(
        ids.map((id) => addTranslationJob(id, 'ru').catch((e) => {
          logger.warn('Failed to enqueue translation', { fabricId: id, message: (e as Error).message })
        }))
      )
    }

    const batchId = crypto.randomUUID()

    if (body.supplier_id) {
      const result = await AdminFabricService.bulkCreate({
        supplierId: body.supplier_id,
        rows: mappedRows,
        adminId: Number(session.user.id ?? 0)
      })
      enqueueTranslation(result.ids)

      const rawResult = await AdminBulkImportService.storeRawRows({ rows: body.rows, batchId })

      return apiSuccess({ ...result, rawStored: rawResult.stored }, undefined, 201)
    }

    const groupedBySupplier = new Map<number, Array<(typeof mappedRows)[number]>>()
    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i] as NonNullable<typeof body.rows[number]>
      const mappedRow = mappedRows[i] as NonNullable<typeof mappedRows[number]>
      const supplierName = row.supplier_name?.trim() || 'Default Supplier'
      const sid = await AdminFabricService.resolveSupplierByName(supplierName)
      if (!sid) {
        throw new Error('Each row must have a supplier_name when supplier_id is not provided')
      }
      if (!groupedBySupplier.has(sid)) groupedBySupplier.set(sid, [])
      groupedBySupplier.get(sid)!.push(mappedRow)
    }

    const allIds: number[] = []
    for (const [sid, group] of groupedBySupplier) {
      const result = await AdminFabricService.bulkCreate({
        supplierId: sid,
        rows: group,
        adminId: Number(session.user.id ?? 0)
      })
      allIds.push(...result.ids)
    }

    enqueueTranslation(allIds)

    const rawResult = await AdminBulkImportService.storeRawRows({ rows: body.rows, batchId })

    return apiSuccess({ ids: allIds, rawStored: rawResult.stored }, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
