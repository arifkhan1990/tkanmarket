import { and, count, desc, eq, gte, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { leads } from '@/db/schema/leads.schema'
import type { PublicBulkInquiryMetrics } from '@/types/public-bulk-inquiry-metrics.types'

export class PublicBulkInquiryMetricsService {
  public static async get(): Promise<PublicBulkInquiryMetrics> {
    const db = getDb()
    const now = new Date()
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [fabricsTotalRows, fabricsApprovedRows, inquiriesRows, leadDurationsRows] = await Promise.all([
      db.select({ total: count() }).from(fabrics).where(isNull(fabrics.deletedAt)),
      db
        .select({ approved: count() })
        .from(fabrics)
        .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved'))),
      db.select({ total: count() }).from(leads).where(and(isNull(leads.deletedAt), gte(leads.createdAt, last30Days))),
      db
        .select({ createdAt: leads.createdAt, updatedAt: leads.updatedAt })
        .from(leads)
        .where(and(isNull(leads.deletedAt), eq(leads.status, 'CLOSED_WON')))
        .orderBy(desc(leads.updatedAt))
        .limit(200)
    ])

    const fabricsTotal = fabricsTotalRows[0]?.total ?? 0
    const fabricsApproved = fabricsApprovedRows[0]?.approved ?? 0
    const qualityRatePercent = fabricsTotal === 0 ? null : (fabricsApproved / fabricsTotal) * 100

    const inquiriesThisMonth = inquiriesRows[0]?.total ?? 0

    const durationsMs = leadDurationsRows
      .map((r) => {
        const created = r.createdAt
        const updated = r.updatedAt
        return updated && created ? updated.getTime() - created.getTime() : null
      })
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0)

    const avgLeadTimeDays = durationsMs.length === 0 ? null : durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length / (24 * 60 * 60 * 1000)

    return {
      qualityRatePercent: qualityRatePercent === null ? null : Math.round(qualityRatePercent * 10) / 10,
      inquiriesThisMonth,
      avgLeadTimeDays: avgLeadTimeDays === null ? null : Math.round(avgLeadTimeDays * 10) / 10
    }
  }
}

