import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { leads } from '@/db/schema/leads.schema'
import { logisticsShipments } from '@/db/schema/logistics.schema'
import type { LeadStatus } from '@/types/marketplace.types'
import type {
  AdminSampleLifecycleResponse,
  AdminSampleLifecycleRow,
  AdminSampleLifecycleStats,
  SampleLifecycleStageUi
} from '@/types/admin-sample-lifecycle.types'

const STALE_DAYS = 21

function stageFromLead(status: LeadStatus, updatedAt: Date): SampleLifecycleStageUi {
  if (status === 'CLOSED_WON') return 'DELIVERED'
  if (status === 'CLOSED_LOST') return 'CLOSED'
  if (status === 'NEW' || status === 'CONTACTED' || status === 'QUALIFIED') return 'REQUESTED'
  if (status === 'PROPOSAL_SENT' || status === 'NEGOTIATING') {
    const stale = Date.now() - updatedAt.getTime() > STALE_DAYS * 86400000
    return stale ? 'DELAYED' : 'IN_TRANSIT'
  }
  return 'REQUESTED'
}

export class AdminSampleLifecycleService {
  public static async list(params: {
    page: number
    limit: number
    stage: 'ALL' | SampleLifecycleStageUi
  }): Promise<{ data: AdminSampleLifecycleResponse; total: number }> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit
    const base = and(isNull(leads.deletedAt), eq(leads.source, 'SAMPLE_REQUEST'))

    const allRows = await db
      .select({ id: leads.id, status: leads.status, updatedAt: leads.updatedAt })
      .from(leads)
      .where(base)

    const idByStage = new Map<number, SampleLifecycleStageUi>()
    for (const r of allRows) {
      const st = r.status as LeadStatus
      idByStage.set(r.id, stageFromLead(st, r.updatedAt))
    }

    const stats = this.computeStats(
      allRows.map((r) => ({ id: r.id, status: r.status as LeadStatus, updatedAt: r.updatedAt }))
    )

    let filteredIds = allRows.map((r) => r.id)
    if (params.stage !== 'ALL') {
      filteredIds = filteredIds.filter((id) => idByStage.get(id) === params.stage)
    }

    const total = filteredIds.length
    const pageIds = filteredIds
      .sort((a, b) => {
        const ua = allRows.find((x) => x.id === a)?.updatedAt?.getTime() ?? 0
        const ub = allRows.find((x) => x.id === b)?.updatedAt?.getTime() ?? 0
        return ub - ua
      })
      .slice(offset, offset + params.limit)

    if (pageIds.length === 0) {
      return {
        data: { stats, items: [] },
        total
      }
    }

    const detailRows = await db
      .select({
        leadId: leads.id,
        companyName: leads.companyName,
        inquiryText: leads.inquiryText,
        status: leads.status,
        updatedAt: leads.updatedAt,
        titleEn: fabrics.titleEn,
        titleRu: fabrics.titleRu,
        sku: fabrics.sku,
        images: fabrics.images,
        supplierId: fabrics.supplierId
      })
      .from(leads)
      .leftJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .where(and(inArray(leads.id, pageIds), or(isNull(fabrics.id), isNull(fabrics.deletedAt))))

    const supplierIds = [...new Set(detailRows.map((r) => r.supplierId).filter((x): x is number => x != null))]
    const shipMap = await this.latestShipmentsBySupplierIds(db, supplierIds)

    const orderIndex = new Map(pageIds.map((id, i) => [id, i]))
    const sortedDetails = [...detailRows].sort((a, b) => (orderIndex.get(a.leadId) ?? 0) - (orderIndex.get(b.leadId) ?? 0))

    const items: AdminSampleLifecycleRow[] = sortedDetails.map((r) => {
      const st = r.status as LeadStatus
      const stage = stageFromLead(st, r.updatedAt)
      const title =
        r.titleEn?.trim() ||
        r.titleRu?.trim() ||
        (r.inquiryText.trim().length > 0 ? r.inquiryText.trim().slice(0, 48) : 'Sample request')
      const img = r.images?.[0] ?? null
      const ship = r.supplierId != null ? shipMap.get(r.supplierId) : undefined
      let logisticsHint: string | null = null
      if (ship?.trackingCode && ship.courierName) {
        logisticsHint = `${ship.courierName}: ${ship.trackingCode}`
      } else if (ship?.trackingCode) {
        logisticsHint = ship.trackingCode
      } else if (stage === 'REQUESTED') {
        logisticsHint = 'Pending processing'
      }
      const feedbackHint =
        stage === 'DELIVERED' ? (r.inquiryText.length > 80 ? `${r.inquiryText.slice(0, 77)}…` : r.inquiryText) : null

      return {
        leadId: r.leadId,
        swatchTitle: title,
        sku: r.sku,
        imageUrl: img,
        buyerCompany: r.companyName,
        projectHint: r.inquiryText.length > 60 ? `${r.inquiryText.slice(0, 57)}…` : r.inquiryText,
        stage,
        leadStatus: st,
        trackingCode: ship?.trackingCode ?? null,
        courierName: ship?.courierName ?? null,
        logisticsHint,
        feedbackHint: stage === 'DELIVERED' ? feedbackHint : null,
        updatedAt: r.updatedAt.toISOString()
      }
    })

    return {
      data: { stats, items },
      total
    }
  }

  private static computeStats(
    rows: Array<{ id: number; status: LeadStatus; updatedAt: Date }>
  ): AdminSampleLifecycleStats {
    let requested = 0
    let inTransit = 0
    let delivered = 0
    let delayed = 0
    for (const r of rows) {
      const g = stageFromLead(r.status, r.updatedAt)
      if (g === 'REQUESTED') requested += 1
      else if (g === 'IN_TRANSIT') inTransit += 1
      else if (g === 'DELIVERED') delivered += 1
      else if (g === 'DELAYED') delayed += 1
    }
    const denom = rows.length
    const successRatePercent = denom === 0 ? 0 : Math.round((delivered / denom) * 1000) / 10
    return {
      requested,
      inTransit,
      delivered,
      delayed,
      successRatePercent
    }
  }

  private static async latestShipmentsBySupplierIds(
    db: ReturnType<typeof getDb>,
    supplierIds: number[]
  ): Promise<Map<number, { trackingCode: string; courierName: string; status: string }>> {
    const m = new Map<number, { trackingCode: string; courierName: string; status: string }>()
    if (supplierIds.length === 0) return m

    const rows = await db
      .select({
        supplierId: logisticsShipments.supplierId,
        trackingCode: logisticsShipments.trackingCode,
        courierName: logisticsShipments.courierName,
        status: logisticsShipments.status,
        updatedAt: logisticsShipments.updatedAt
      })
      .from(logisticsShipments)
      .where(and(isNull(logisticsShipments.deletedAt), inArray(logisticsShipments.supplierId, supplierIds)))
      .orderBy(desc(logisticsShipments.updatedAt))

    for (const r of rows) {
      if (r.supplierId == null) continue
      if (!m.has(r.supplierId)) {
        m.set(r.supplierId, {
          trackingCode: r.trackingCode,
          courierName: r.courierName,
          status: r.status
        })
      }
    }
    return m
  }

}
