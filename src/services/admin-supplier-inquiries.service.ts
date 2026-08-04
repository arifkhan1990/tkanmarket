import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { leads } from '@/db/schema/leads.schema'

import type { SupplierInquiryRow } from '@/types/supplier-admin.types'

export class AdminSupplierInquiriesService {
  public static async listForSupplier(params: {
    supplierId: number
    page: number
    limit: number
  }): Promise<{ items: SupplierInquiryRow[]; total: number }> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const fabricIds = await db
      .select({ id: fabrics.id })
      .from(fabrics)
      .where(and(isNull(fabrics.deletedAt), eq(fabrics.supplierId, params.supplierId)))

    const ids = fabricIds.map((r) => r.id)
    if (ids.length === 0) {
      return { items: [], total: 0 }
    }

    const whereClause = and(isNull(leads.deletedAt), inArray(leads.fabricId, ids))

    const totalRows = await db.select({ total: count() }).from(leads).where(whereClause)
    const total = totalRows[0]?.total ?? 0

    const rows = await db
      .select({
        leadId: leads.id,
        status: leads.status,
        source: leads.source,
        companyName: leads.companyName,
        contactName: leads.contactName,
        email: leads.email,
        inquiryText: leads.inquiryText,
        createdAt: leads.createdAt,
        fabricTitle: fabrics.titleRu,
        fabricSlug: fabrics.slug
      })
      .from(leads)
      .innerJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .where(whereClause)
      .orderBy(desc(leads.createdAt))
      .limit(params.limit)
      .offset(offset)

    const items: SupplierInquiryRow[] = rows.map((r) => ({
      leadId: r.leadId,
      status: r.status,
      source: r.source,
      companyName: r.companyName,
      contactName: r.contactName,
      email: r.email,
      fabricTitle: r.fabricTitle,
      fabricSlug: r.fabricSlug,
      inquiryPreview:
        r.inquiryText.length > 160 ? `${r.inquiryText.slice(0, 157)}…` : r.inquiryText,
      createdAt: r.createdAt.toISOString()
    }))

    return { items, total }
  }
}
