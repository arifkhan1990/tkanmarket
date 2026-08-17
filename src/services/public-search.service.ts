import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabricCategories, fabrics } from '@/db/schema/fabrics.schema'
import type { Locale } from '@/types/i18n.types'
import type {
  PublicSearchCategory,
  PublicSearchFabricType,
  PublicSearchResponse
} from '@/types/public-search.types'

const PER_GROUP_LIMIT = 6
const TRENDING_LIMIT = 8
const MAX_QUERY_LENGTH = 100
const MIN_QUERY_LENGTH = 2

type FabricTypeValue = 'woven' | 'knit' | 'nonwoven' | 'lace' | 'lining' | 'technical' | 'other'

const FABRIC_TYPE_VALUES: readonly FabricTypeValue[] = [
  'woven',
  'knit',
  'nonwoven',
  'lace',
  'lining',
  'technical',
  'other'
]

const FABRIC_TYPE_LABELS: Record<string, Record<string, string>> = {
  en: { woven: 'Woven', knit: 'Knit', nonwoven: 'Nonwoven', lace: 'Lace', lining: 'Lining', technical: 'Technical', other: 'Other' },
  ru: { woven: 'Тканые', knit: 'Трикотаж', nonwoven: 'Нетканые', lace: 'Кружево', lining: 'Подкладка', technical: 'Технические', other: 'Другие' },
  zh: { woven: '梭织', knit: '针织', nonwoven: '无纺布', lace: '蕾丝', lining: '里布', technical: '技术面料', other: '其他' }
}

/**
 * Escape `%` and `_` so user input never reaches Postgres as wildcard
 * metacharacters. Combined with the parameterised query that Drizzle generates,
 * this prevents both LIKE-injection and accidental ReDoS-style cartesian scans.
 */
function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`)
}

function pickFabricTitle(
  locale: Locale,
  titleEn: string | null,
  titleRu: string
): string {
  if (locale === 'en') return (titleEn ?? titleRu).trim() || titleRu
  // ru and zh both fall back to the always-present Russian title
  return titleRu.trim() || (titleEn ?? '').trim() || 'Fabric'
}

function humanizeSlug(slug: string): string {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export class PublicSearchService {
  /**
   * One service call → 4 independent SQL statements run in parallel via
   * `Promise.all`. Each statement is a single round-trip with `LIMIT n`, so the
   * total cost is bounded regardless of how many fabrics or suppliers exist
   * (no N+1: the supplier name is joined inline, not fetched per row).
   */
  public static async searchAll(params: {
    q: string
    locale: Locale
  }): Promise<PublicSearchResponse> {
    const db = getDb()

    // Sanitize input: trim, clamp length, strip control characters.
    const cleaned = (params.q ?? '')
      .trim()
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .slice(0, MAX_QUERY_LENGTH)

    const trendingPromise = this.loadTrendingCategories(db)

    if (cleaned.length < MIN_QUERY_LENGTH) {
      const trending = await trendingPromise
      return {
        query: cleaned,
        fabrics: [],
        categories: [],
        fabricTypes: [],
        trending,
        totals: { fabrics: 0, categories: 0 }
      }
    }

    const pattern = `%${escapeLikePattern(cleaned)}%`

    const fabricPromise = db
      .select({
        id: fabrics.id,
        slug: fabrics.slug,
        sku: fabrics.sku,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        images: fabrics.images,
        fabricType: fabrics.fabricType
      })
      .from(fabrics)
      .where(
        and(
          isNull(fabrics.deletedAt),
          eq(fabrics.status, 'approved'),
          or(
            ilike(fabrics.titleRu, pattern),
            ilike(fabrics.titleEn, pattern),
            ilike(fabrics.sku, pattern)
          )
        )
      )
      .orderBy(desc(fabrics.isFeatured), desc(fabrics.viewsCount), desc(fabrics.updatedAt))
      .limit(PER_GROUP_LIMIT)

    const categoryPromise = db
      .select({
        slug: fabricCategories.categorySlug,
        c: count()
      })
      .from(fabricCategories)
      .where(
        and(
          isNull(fabricCategories.deletedAt),
          ilike(fabricCategories.categorySlug, pattern)
        )
      )
      .groupBy(fabricCategories.categorySlug)
      .orderBy(desc(count()))
      .limit(PER_GROUP_LIMIT)

    const matchedTypes = this.matchFabricTypes(cleaned, params.locale)

    const fabricTypeCountPromises = matchedTypes.map((ft) =>
      db
        .select({ c: count() })
        .from(fabrics)
        .where(
          and(
            isNull(fabrics.deletedAt),
            eq(fabrics.status, 'approved'),
            eq(fabrics.fabricType, ft)
          )
        )
        .then((rows) => ({ type: ft, count: Number(rows[0]?.c ?? 0) }))
    )

    const [fabricRows, categoryRows, trending, ...typeCounts] = await Promise.all([
      fabricPromise,
      categoryPromise,
      trendingPromise,
      ...fabricTypeCountPromises
    ])

    const localeLabels = FABRIC_TYPE_LABELS[params.locale] ?? FABRIC_TYPE_LABELS['en'] ?? {}
    const fabricTypes: PublicSearchFabricType[] = typeCounts
      .filter((tc) => tc.count > 0)
      .map((tc) => ({
        value: tc.type,
        label: localeLabels[tc.type] ?? humanizeSlug(tc.type),
        count: tc.count
      }))

    return {
      query: cleaned,
      fabrics: fabricRows.map((f) => ({
        id: f.id,
        slug: f.slug,
        sku: f.sku ?? null,
        title: pickFabricTitle(params.locale, f.titleEn, f.titleRu),
        imageUrl: f.images?.[0] ?? null,
        fabricType: f.fabricType ?? null
      })),
      categories: categoryRows.map((row) => ({
        slug: row.slug,
        label: humanizeSlug(row.slug),
        count: Number(row.c)
      })),
      fabricTypes,
      trending,
      totals: {
        fabrics: fabricRows.length,
        categories: categoryRows.length
      }
    }
  }

  private static matchFabricTypes(query: string, locale: Locale): FabricTypeValue[] {
    const q = query.toLowerCase()
    const labels = FABRIC_TYPE_LABELS[locale] ?? FABRIC_TYPE_LABELS['en'] ?? {}
    return FABRIC_TYPE_VALUES.filter((ft) => {
      if (ft.includes(q)) return true
      const label = labels[ft]
      if (label && label.toLowerCase().includes(q)) return true
      for (const loc of Object.values(FABRIC_TYPE_LABELS)) {
        const l = loc[ft]
        if (l && l.toLowerCase().includes(q)) return true
      }
      return false
    })
  }

  private static async loadTrendingCategories(
    db: ReturnType<typeof getDb>
  ): Promise<PublicSearchCategory[]> {
    const rows = await db
      .select({
        slug: fabricCategories.categorySlug,
        c: count()
      })
      .from(fabricCategories)
      .where(isNull(fabricCategories.deletedAt))
      .groupBy(fabricCategories.categorySlug)
      .orderBy(desc(count()))
      .limit(TRENDING_LIMIT)

    return rows.map((row) => ({
      slug: row.slug,
      label: humanizeSlug(row.slug),
      count: Number(row.c)
    }))
  }
}
