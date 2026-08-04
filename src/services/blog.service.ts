import { and, count, desc, eq, ilike, isNull, ne, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { blogPosts } from '@/db/schema/blog.schema'
import { getAllStitchBlogSummaries } from '@/lib/blog-stitch-posts'
import { logger } from '@/lib/logger'
import type { BlogPostDetail, BlogPostSummary } from '@/types/blog.types'

const MAX_LIMIT = 24
const DEFAULT_LIMIT = 9
const MAX_QUERY_LENGTH = 100

function mapRowToSummary(row: typeof blogPosts.$inferSelect): BlogPostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    heroImageUrl: row.heroImageUrl,
    category: row.category,
    readMinutes: row.readMinutes,
    authorName: row.authorName,
    createdAt: row.createdAt.toISOString()
  }
}

/** Escape `%`, `_` and `\` so user-supplied search terms can't trigger LIKE wildcards. */
function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`)
}

export type BlogListParams = {
  page: number
  limit: number
  /** Free-text search across title + excerpt. Empty string disables the filter. */
  q: string
  /** Exact `blog_posts.category` value to filter by. Null = all categories. */
  category: string | null
  /** When true, the most recent post (after filters) is excluded — used for the
   * "featured + grid" layout where the hero already shows the freshest post. */
  excludeLatest: boolean
}

export type BlogListResult = {
  items: BlogPostSummary[]
  total: number
  page: number
  limit: number
}

export type BlogCategoryAggregate = {
  category: string
  count: number
}

/** Legacy helper kept for the [slug] page until it's migrated to the paginated path. */
export async function listPublicBlogPosts(): Promise<BlogPostSummary[]> {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(blogPosts)
      .where(isNull(blogPosts.deletedAt))
      .orderBy(desc(blogPosts.createdAt))

    const mapped = rows.map(mapRowToSummary)
    if (mapped.length > 0) return mapped
    return getAllStitchBlogSummaries()
  } catch (error) {
    logger.error('listPublicBlogPosts failed', { err: error })
    return getAllStitchBlogSummaries()
  }
}

/**
 * Server-side paginated + filtered list. Runs a single COUNT(*) and a single
 * SELECT in parallel — no N+1, no per-row joins. Always returns whatever the
 * database has (zero rows is a real result, not an error). The redesigned
 * blog page is wired to this so the static stitch fallback never leaks into
 * the public UI.
 */
export async function listPublicBlogPostsPaginated(
  params: BlogListParams
): Promise<BlogListResult> {
  const db = getDb()

  const page = Math.max(1, Math.floor(params.page))
  const limit = Math.max(1, Math.min(MAX_LIMIT, Math.floor(params.limit)))
  const cleanedQuery = params.q
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, MAX_QUERY_LENGTH)

  const conditions = [isNull(blogPosts.deletedAt)]
  if (params.category) {
    conditions.push(eq(blogPosts.category, params.category))
  }
  if (cleanedQuery.length >= 2) {
    const pattern = `%${escapeLikePattern(cleanedQuery)}%`
    const searchClause = or(
      ilike(blogPosts.title, pattern),
      ilike(blogPosts.excerpt, pattern)
    )
    if (searchClause) conditions.push(searchClause)
  }
  const where = and(...conditions)

  // The first row is reserved for the hero on page 1 — when caller asks to
  // exclude it we widen the offset by 1 row and trim from the result.
  const heroOffset = params.excludeLatest && page === 1 ? 1 : 0
  const offset = (page - 1) * limit + heroOffset

  const [totalRows, rows] = await Promise.all([
    db.select({ c: count() }).from(blogPosts).where(where),
    db
      .select()
      .from(blogPosts)
      .where(where)
      .orderBy(desc(blogPosts.createdAt), desc(blogPosts.id))
      .limit(limit)
      .offset(offset)
  ])

  const total = Math.max(0, (totalRows[0]?.c ?? 0) - heroOffset)

  return {
    items: rows.map(mapRowToSummary),
    total,
    page,
    limit
  }
}

/**
 * Distinct category aggregate. One GROUP BY query — used by the filter chips
 * to render real counts ("Sourcing 12") instead of static labels.
 */
export async function listPublicBlogCategories(): Promise<BlogCategoryAggregate[]> {
  const db = getDb()
  const rows = await db
    .select({
      category: blogPosts.category,
      c: count()
    })
    .from(blogPosts)
    .where(and(isNull(blogPosts.deletedAt), sql`${blogPosts.category} IS NOT NULL`))
    .groupBy(blogPosts.category)
    .orderBy(desc(count()))

  return rows
    .filter((r): r is { category: string; c: number } => !!r.category)
    .map((row) => ({ category: row.category, count: Number(row.c) }))
}

/** Most recent post; used as the hero on page 1. */
export async function getLatestPublicBlogPost(): Promise<BlogPostSummary | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(blogPosts)
    .where(isNull(blogPosts.deletedAt))
    .orderBy(desc(blogPosts.createdAt), desc(blogPosts.id))
    .limit(1)

  const row = rows[0]
  return row ? mapRowToSummary(row) : null
}

/**
 * Posts to surface in the "related intelligence" rail on a detail page.
 *
 * Ranking: same-category posts first (by recency), then any other recent posts
 * to backfill if the category is small. Implemented as **one** SQL statement
 * via a synthetic priority column — no per-row joins, no second query, no N+1.
 */
export async function getRelatedPublicBlogPosts(
  excludeSlug: string,
  limit: number,
  category: string | null = null
): Promise<BlogPostSummary[]> {
  const cap = Math.max(1, Math.min(12, Math.floor(limit)))
  try {
    const db = getDb()

    // 0 = same category (preferred), 1 = anything else. Used in ORDER BY.
    const priorityExpr = category
      ? sql<number>`CASE WHEN ${blogPosts.category} = ${category} THEN 0 ELSE 1 END`
      : sql<number>`1`

    const rows = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        heroImageUrl: blogPosts.heroImageUrl,
        category: blogPosts.category,
        readMinutes: blogPosts.readMinutes,
        authorName: blogPosts.authorName,
        createdAt: blogPosts.createdAt,
        priority: priorityExpr
      })
      .from(blogPosts)
      .where(and(isNull(blogPosts.deletedAt), ne(blogPosts.slug, excludeSlug)))
      .orderBy(priorityExpr, desc(blogPosts.createdAt), desc(blogPosts.id))
      .limit(cap)

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      heroImageUrl: row.heroImageUrl,
      category: row.category,
      readMinutes: row.readMinutes,
      authorName: row.authorName,
      createdAt: row.createdAt.toISOString()
    }))
  } catch (error) {
    // Fail closed on the public surface — never leak the static stitch fallback
    // into a real production page. The detail view will simply omit the
    // "related" rail if this throws.
    logger.error('getRelatedPublicBlogPosts failed', { err: error, excludeSlug })
    return []
  }
}

export async function getPublicBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), isNull(blogPosts.deletedAt)))
      .limit(1)

    const row = rows[0]
    if (!row) return null

    const summary = mapRowToSummary(row)
    return {
      ...summary,
      body: row.body,
      authorRole: row.authorRole
    }
  } catch (error) {
    logger.error('getPublicBlogPostBySlug failed', { err: error, slug })
    return null
  }
}

