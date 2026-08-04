import { and, count, desc, eq, gte, inArray, isNull, lt, ne } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { leads } from '@/db/schema/leads.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { NotFoundError } from '@/lib/errors'
import type { SupplierPartnerOverviewResponse } from '@/types/supplier-partner-overview.types'

export class SupplierPartnerOverviewService {
  public static async getBySlug(slug: string): Promise<SupplierPartnerOverviewResponse> {
    const db = getDb()
    const s = slug.trim()
    if (s.length < 2) throw new NotFoundError('Supplier not found')

    const supRows = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        slug: suppliers.slug,
        city: suppliers.city,
        country: suppliers.country,
        verified: suppliers.verified,
        logoUrl: suppliers.logoUrl
      })
      .from(suppliers)
      .where(and(eq(suppliers.slug, s), isNull(suppliers.deletedAt)))
      .limit(1)

    const sup = supRows[0]
    if (!sup) throw new NotFoundError('Supplier not found')

    const supplierId = sup.id

    const fabricCountRows = await db
      .select({ c: count() })
      .from(fabrics)
      .where(and(eq(fabrics.supplierId, supplierId), isNull(fabrics.deletedAt)))

    const publishedFabrics = fabricCountRows[0]?.c ?? 0

    const fabricIds = await db
      .select({ id: fabrics.id })
      .from(fabrics)
      .where(and(eq(fabrics.supplierId, supplierId), isNull(fabrics.deletedAt)))

    const ids = fabricIds.map((r) => r.id)

    let sampleRequests = 0
    let responded = 0
    let totalLeads = 0

    if (ids.length > 0) {
      const sampleRows = await db
        .select({ c: count() })
        .from(leads)
        .where(
          and(
            inArray(leads.fabricId, ids),
            isNull(leads.deletedAt),
            eq(leads.source, 'SAMPLE_REQUEST')
          )
        )
      sampleRequests = sampleRows[0]?.c ?? 0

      const totalRows = await db
        .select({ c: count() })
        .from(leads)
        .where(and(inArray(leads.fabricId, ids), isNull(leads.deletedAt)))
      totalLeads = totalRows[0]?.c ?? 0

      const respondedRows = await db
        .select({ c: count() })
        .from(leads)
        .where(
          and(
            inArray(leads.fabricId, ids),
            isNull(leads.deletedAt),
            ne(leads.status, 'NEW')
          )
        )
      responded = respondedRows[0]?.c ?? 0
    }

    const responseRate = totalLeads > 0 ? Math.round((responded / totalLeads) * 1000) / 10 : 0

    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))

    let momDelta: number | null = null
    if (ids.length > 0) {
      const cur = await db
        .select({ c: count() })
        .from(leads)
        .where(
          and(
            inArray(leads.fabricId, ids),
            isNull(leads.deletedAt),
            gte(leads.createdAt, monthStart)
          )
        )
      const prev = await db
        .select({ c: count() })
        .from(leads)
        .where(
          and(
            inArray(leads.fabricId, ids),
            isNull(leads.deletedAt),
            gte(leads.createdAt, prevMonthStart),
            lt(leads.createdAt, monthStart)
          )
        )
      const c = cur[0]?.c ?? 0
      const p = prev[0]?.c ?? 0
      if (p > 0) momDelta = Math.round(((c - p) / p) * 1000) / 10
      else if (c > 0) momDelta = 100
    }

    const topFabrics = await db
      .select({
        id: fabrics.id,
        sku: fabrics.sku,
        titleRu: fabrics.titleRu,
        views: fabrics.viewsCount,
        images: fabrics.images,
        slug: fabrics.slug
      })
      .from(fabrics)
      .where(and(eq(fabrics.supplierId, supplierId), isNull(fabrics.deletedAt)))
      .orderBy(desc(fabrics.viewsCount))
      .limit(5)

    const recentLeads =
      ids.length === 0
        ? []
        : await db
            .select({
              companyName: leads.companyName,
              inquiryText: leads.inquiryText,
              createdAt: leads.createdAt,
              status: leads.status
            })
            .from(leads)
            .where(and(inArray(leads.fabricId, ids), isNull(leads.deletedAt)))
            .orderBy(desc(leads.createdAt))
            .limit(5)

    return {
      supplier: {
        id: sup.id,
        name: sup.name,
        slug: sup.slug,
        city: sup.city,
        country: sup.country,
        verified: sup.verified,
        logo_url: sup.logoUrl
      },
      metrics: {
        published_fabrics: publishedFabrics,
        sample_request_leads: sampleRequests,
        response_rate_percent: responseRate,
        month_over_month_inquiry_delta_percent: momDelta
      },
      top_fabrics: topFabrics.map((f) => ({
        id: f.id,
        sku: f.sku,
        title: f.titleRu,
        views_count: f.views,
        image_url: f.images?.[0] ?? null,
        slug: f.slug
      })),
      recent_inquiries: recentLeads.map((l) => ({
        company_name: l.companyName,
        inquiry_excerpt: l.inquiryText.length > 120 ? `${l.inquiryText.slice(0, 117)}…` : l.inquiryText,
        created_at: l.createdAt.toISOString(),
        is_new: l.status === 'NEW'
      }))
    }
  }
}
