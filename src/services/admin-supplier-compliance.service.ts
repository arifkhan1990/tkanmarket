import { and, count, desc, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { suppliers } from '@/db/schema/suppliers.schema'
import type { SupplierCompliancePayload } from '@/types/supplier-admin.types'

export class AdminSupplierComplianceService {
  public static async getCompliance(): Promise<SupplierCompliancePayload> {
    const db = getDb()
    const base = isNull(suppliers.deletedAt)

    const pendingRows = await db
      .select({ total: count() })
      .from(suppliers)
      .where(and(base, eq(suppliers.verified, false)))
    const verifiedRows = await db
      .select({ total: count() })
      .from(suppliers)
      .where(and(base, eq(suppliers.verified, true)))

    const pendingCount = pendingRows[0]?.total ?? 0
    const verifiedCount = verifiedRows[0]?.total ?? 0

    const queue = await db
      .select({
        supplierId: suppliers.id,
        name: suppliers.name,
        slug: suppliers.slug,
        logoUrl: suppliers.logoUrl,
        country: suppliers.country,
        city: suppliers.city,
        updatedAt: suppliers.updatedAt
      })
      .from(suppliers)
      .where(and(base, eq(suppliers.verified, false)))
      .orderBy(desc(suppliers.updatedAt))
      .limit(24)

    const recentlyVerified = await db
      .select({
        supplierId: suppliers.id,
        name: suppliers.name,
        slug: suppliers.slug,
        logoUrl: suppliers.logoUrl,
        country: suppliers.country,
        updatedAt: suppliers.updatedAt
      })
      .from(suppliers)
      .where(and(base, eq(suppliers.verified, true)))
      .orderBy(desc(suppliers.updatedAt))
      .limit(12)

    return {
      pendingCount,
      verifiedCount,
      queue: queue.map((r) => ({
        supplierId: r.supplierId,
        name: r.name,
        slug: r.slug,
        logoUrl: r.logoUrl ?? null,
        country: r.country,
        city: r.city ?? null,
        updatedAt: r.updatedAt.toISOString()
      })),
      recentlyVerified: recentlyVerified.map((r) => ({
        supplierId: r.supplierId,
        name: r.name,
        slug: r.slug,
        logoUrl: r.logoUrl ?? null,
        country: r.country,
        updatedAt: r.updatedAt.toISOString()
      }))
    }
  }
}
