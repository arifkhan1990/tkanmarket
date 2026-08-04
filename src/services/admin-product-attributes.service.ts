import { and, count, desc, isNotNull, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import type {
  FabricTypeCountRow,
  ProductAttributesOverviewResponse,
  TagCountRow
} from '@/types/admin-product-attributes.types'

export class AdminProductAttributesService {
  /**
   * Performance contract:
   *  - Six SQL statements, ALL dispatched concurrently via `Promise.all`.
   *  - The tag aggregation uses Postgres `unnest(tags)` + GROUP BY so the database
   *    returns the top 24 tags directly. The previous implementation pulled every
   *    fabric row into JS (`SELECT tags ... cardinality > 0`) and bucketed in a
   *    JS Map — that scaled linearly with catalog size (PRD §1: 50k SKU target)
   *    and would overload the connection on a real catalog.
   *  - All counts hit the existing `fabrics_status_deleted_at_idx` and the
   *    `fabrics_tags_gin_idx` GIN index.
   *  - `AVG(gsm)` returns null when no rows match (we no longer COALESCE to 0
   *    so the client correctly renders `—` instead of a misleading `0`).
   *
   * Security contract:
   *  - Caller MUST be an authenticated admin (enforced at the route layer).
   *  - All queries scope `fabrics.deletedAt IS NULL`.
   *  - Endpoint is read-only and takes no user input.
   */
  public static async getOverview(): Promise<ProductAttributesOverviewResponse> {
    const db = getDb()

    const fabricTypesPromise = db
      .select({
        fabricType: fabrics.fabricType,
        c: count()
      })
      .from(fabrics)
      .where(isNull(fabrics.deletedAt))
      .groupBy(fabrics.fabricType)
      .orderBy(desc(count()))

    // Single PG statement: unnest the tags array, group, take top 24.
    // Replaces the prior "load every row, bucket in JS" implementation.
    const topTagsPromise = db.execute<{ tag: string; c: number }>(
      sql`
        SELECT tag, COUNT(*)::int AS c
        FROM (
          SELECT unnest(${fabrics.tags}) AS tag
          FROM ${fabrics}
          WHERE ${fabrics.deletedAt} IS NULL
            AND cardinality(${fabrics.tags}) > 0
        ) t
        GROUP BY tag
        ORDER BY COUNT(*) DESC
        LIMIT 24
      `
    )

    const totalPromise = db
      .select({ c: count() })
      .from(fabrics)
      .where(isNull(fabrics.deletedAt))

    const gsmPromise = db
      .select({ c: count() })
      .from(fabrics)
      .where(and(isNull(fabrics.deletedAt), isNotNull(fabrics.gsm)))

    const compositionPromise = db
      .select({ c: count() })
      .from(fabrics)
      .where(and(isNull(fabrics.deletedAt), isNotNull(fabrics.composition)))

    // No `COALESCE(..., 0)` — null avg becomes a real null so the client
    // renders `—` instead of a misleading `0` when no fabrics have GSM.
    const avgGsmPromise = db
      .select({ v: sql<number | null>`AVG(${fabrics.gsm})::numeric` })
      .from(fabrics)
      .where(and(isNull(fabrics.deletedAt), isNotNull(fabrics.gsm)))

    const [fabricTypeRows, topTagRows, totalRow, gsmRow, compRow, avgGsmRow] = await Promise.all([
      fabricTypesPromise,
      topTagsPromise,
      totalPromise,
      gsmPromise,
      compositionPromise,
      avgGsmPromise
    ])

    const fabricTypes: FabricTypeCountRow[] = fabricTypeRows.map((r) => ({
      fabricType: r.fabricType,
      count: Number(r.c)
    }))

    const topTagRowsArray = Array.isArray(topTagRows) ? topTagRows : []
    const topTags: TagCountRow[] = topTagRowsArray
      .map((r) => ({ tag: String(r.tag ?? '').trim(), count: Number(r.c ?? 0) }))
      .filter((r) => r.tag.length > 0)

    const avgRaw = avgGsmRow[0]?.v
    const avgGsm =
      avgRaw === null || avgRaw === undefined ? null : Math.round(Number(avgRaw) * 10) / 10

    return {
      fabricTypes,
      topTags,
      stats: {
        totalFabrics: Number(totalRow[0]?.c ?? 0),
        withGsm: Number(gsmRow[0]?.c ?? 0),
        avgGsm,
        withComposition: Number(compRow[0]?.c ?? 0)
      }
    }
  }
}
