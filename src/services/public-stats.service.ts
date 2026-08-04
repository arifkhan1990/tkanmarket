import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { leads } from '@/db/schema/leads.schema'
import { count } from 'drizzle-orm'

export interface PublicStats {
  fabricsCount: number
  suppliersCount: number
  leadsCount: number
}

export class PublicStatsService {
  public static async getPublicStats(): Promise<PublicStats> {
    const db = getDb()
    const [fabricsRows, suppliersRows, leadsRows] = await Promise.all([
      db
        .select({ total: count() })
        .from(fabrics)
        .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved'))),
      db
        .select({ total: count() })
        .from(suppliers)
        .where(and(isNull(suppliers.deletedAt), eq(suppliers.verified, true))),
      db.select({ total: count() }).from(leads)
    ])

    return {
      fabricsCount: fabricsRows[0]?.total ?? 0,
      suppliersCount: suppliersRows[0]?.total ?? 0,
      leadsCount: leadsRows[0]?.total ?? 0
    }
  }
}

