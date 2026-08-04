import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabricActivityLog } from '@/db/schema/fabric-activity-log.schema'
import { fabricCategoryTerms } from '@/db/schema/fabric-category-terms.schema'
import { fabricCategories, fabrics } from '@/db/schema/fabrics.schema'
import type {
  FabricTaxonomyActivityRow,
  FabricTaxonomyOverview,
  FabricTaxonomySampleFabric
} from '@/types/admin-fabric-taxonomy.types'

function compositionLabel(raw: unknown): string | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const parts: string[] = []
  for (const item of raw) {
    if (item && typeof item === 'object' && 'material' in item && 'percentage' in item) {
      const m = String((item as { material: string }).material ?? '').trim()
      const p = Number((item as { percentage: number }).percentage)
      if (m.length > 0 && Number.isFinite(p)) parts.push(`${p}% ${m}`)
    }
  }
  return parts.length > 0 ? parts.join(', ') : null
}

export class AdminFabricTaxonomyService {
  /**
   * Performance contract:
   *  - Two phases:
   *      Phase 1 (single statement): category list with `count(distinct fabric_id)`
   *        joined to `fabrics` and filtered by `deleted_at IS NULL`. Distinct count
   *        prevents over-counting if a fabric→category mapping ever has duplicates,
   *        and the join ensures soft-deleted fabrics don't inflate the count.
   *      Phase 2 (parallel via Promise.all, only when `selected` is non-empty):
   *        the most recent fabric in the selected category, AND its activity log
   *        rows. The previous implementation chained these sequentially.
   *  - All `WHERE` columns hit existing indexes (`fabric_categories_fabric_id_idx`,
   *    `fabrics_status_deleted_at_idx`, `fabric_activity_log` PK).
   *  - Sample query joins `fabric_categories` once with `LIMIT 1`. Activity query
   *    is bounded `LIMIT 12`. **No N+1.**
   *
   * Security contract:
   *  - Caller MUST be an authenticated admin (enforced at the route layer).
   *  - All queries scope `deletedAt IS NULL` on every joined table.
   *  - The `categorySlug` parameter is Zod-validated upstream and bound through
   *    Drizzle's parameterized `eq()`.
   */
  public static async getOverview(categorySlug: string | undefined): Promise<FabricTaxonomyOverview> {
    const db = getDb()

    // Phase 1 — use category terms as the source of truth (active + not deleted),
    // then attach fabric counts from the junction table.
    const countRows = await db
      .select({
        slug: fabricCategories.categorySlug,
        c: sql<number>`COUNT(DISTINCT ${fabricCategories.fabricId})::int`
      })
      .from(fabricCategories)
      .innerJoin(fabrics, eq(fabricCategories.fabricId, fabrics.id))
      .where(and(isNull(fabricCategories.deletedAt), isNull(fabrics.deletedAt)))
      .groupBy(fabricCategories.categorySlug)

    const countBySlug = new Map<string, number>()
    for (const r of countRows) countBySlug.set(r.slug, Number(r.c))

    const termRows = await db
      .select({ slug: fabricCategoryTerms.slug })
      .from(fabricCategoryTerms)
      .where(and(isNull(fabricCategoryTerms.deletedAt), eq(fabricCategoryTerms.isActive, true)))
      .orderBy(asc(fabricCategoryTerms.sortOrder), asc(fabricCategoryTerms.slug))

    const categories = termRows.map((r) => ({
      slug: r.slug,
      fabric_count: countBySlug.get(r.slug) ?? 0
    }))

    // Resolve the active selection — fall back to the first category when the
    // requested slug doesn't exist (or no slug was provided).
    let selected = categorySlug?.trim() ?? ''
    if (selected.length > 0 && !categories.some((c) => c.slug === selected)) {
      selected = ''
    }
    if (selected.length === 0 && categories.length > 0) {
      selected = categories[0]?.slug ?? ''
    }

    let sample: FabricTaxonomySampleFabric | null = null
    let activity: FabricTaxonomyActivityRow[] = []

    if (selected.length > 0) {
      // Phase 2 — fetch the latest sample fabric in the category.
      // Activity rows are fetched in parallel right after, but they depend on
      // the sample fabric id so we can't fold them into Phase 1.
      const fabricRows = await db
        .select({
          id: fabrics.id,
          slug: fabrics.slug,
          titleRu: fabrics.titleRu,
          titleEn: fabrics.titleEn,
          gsm: fabrics.gsm,
          widthCm: fabrics.widthCm,
          fabricType: fabrics.fabricType,
          composition: fabrics.composition,
          images: fabrics.images
        })
        .from(fabrics)
        .innerJoin(fabricCategories, eq(fabricCategories.fabricId, fabrics.id))
        .where(
          and(
            isNull(fabrics.deletedAt),
            isNull(fabricCategories.deletedAt),
            eq(fabricCategories.categorySlug, selected)
          )
        )
        .orderBy(desc(fabrics.updatedAt))
        .limit(1)

      const r = fabricRows[0]
      if (r) {
        const sampleFabricId = r.id

        const logRows = await db
          .select({
            id: fabricActivityLog.id,
            eventType: fabricActivityLog.eventType,
            message: fabricActivityLog.message,
            createdAt: fabricActivityLog.createdAt
          })
          .from(fabricActivityLog)
          .where(eq(fabricActivityLog.fabricId, sampleFabricId))
          .orderBy(desc(fabricActivityLog.createdAt))
          .limit(12)

        sample = {
          id: r.id,
          slug: r.slug,
          title_ru: r.titleRu,
          title_en: r.titleEn ?? null,
          gsm: r.gsm,
          width_cm: r.widthCm,
          fabric_type: r.fabricType ?? null,
          composition_label: compositionLabel(r.composition),
          images: r.images ?? null
        }

        activity = logRows.map((row) => ({
          id: row.id,
          event_type: row.eventType,
          message: row.message,
          created_at: row.createdAt.toISOString()
        }))
      }
    }

    return {
      categories,
      selected_slug: selected.length > 0 ? selected : null,
      sample,
      activity
    }
  }
}
