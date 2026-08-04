import type { SQL } from 'drizzle-orm'
import { and, count, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { leads } from '@/db/schema/leads.schema'
import type { LeadSource, LeadStatus } from '@/types/marketplace.types'
import type {
  MessageCenterResponse,
  MessageCenterStats,
  MessageThreadRow
} from '@/types/admin-message-center.types'

const SOURCES: LeadSource[] = [
  'MARKETPLACE_INQUIRY',
  'SAMPLE_REQUEST',
  'SOCIAL_CAMPAIGN',
  'DIRECT_CONTACT',
  'MANUAL_ENTRY'
]

const STATUSES: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CLOSED_WON',
  'CLOSED_LOST'
]

function isLeadSource(s: string): s is LeadSource {
  return (SOURCES as string[]).includes(s)
}

function isLeadStatus(s: string): s is LeadStatus {
  return (STATUSES as string[]).includes(s)
}

function safePage(page: number): number {
  return page >= 1 && Number.isFinite(page) ? Math.floor(page) : 1
}

function safeLimit(limit: number): number {
  const l = Math.floor(limit)
  if (l < 1) return 20
  if (l > 50) return 50
  return l
}

function previewText(text: string, max = 140): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function escapeLikeNeedle(value: string): string {
  // Escape both `%` and `_` so user input cannot inject LIKE wildcards.
  return value.replace(/[%_]/g, (m) => `\\${m}`)
}

export class AdminMessageCenterService {
  /**
   * Performance contract:
   *  - Three SQL statements at most, dispatched concurrently via `Promise.all`:
   *      1. count(*) on the filtered set (drives pagination meta)
   *      2. paginated row query (LIMIT 20–50 with index-friendly ORDER BY updated_at DESC)
   *      3. global stats — total_active + per-status counts collapsed into one
   *         statement using `COUNT(*) FILTER (WHERE status = ...)` (NOT scoped by
   *         the filter so the KPI cards always reflect the full inbox)
   *  - All WHERE columns hit existing indexes; no joins, no per-row follow-ups.
   *
   * Security contract:
   *  - Caller MUST be an authenticated admin (enforced at the route layer).
   *  - All queries scope `leads.deletedAt IS NULL`.
   *  - User-supplied search and source/status strings flow through Zod validation
   *    and Drizzle's parameterized `ilike` / `eq` operators — no string interpolation.
   *  - The needle is escaped for both `%` and `_` LIKE wildcards before being
   *    wrapped in the pattern.
   */
  public static async listThreads(params: {
    page: number
    limit: number
    q: string | null
    source: string | null
    status: string | null
  }): Promise<MessageCenterResponse> {
    const db = getDb()
    const page = safePage(params.page)
    const limit = safeLimit(params.limit)
    const offset = (page - 1) * limit
    const search = params.q?.trim() ?? ''

    const sourceFilter = params.source?.trim() ?? ''
    const sourceCond: SQL | undefined =
      sourceFilter.length > 0 && isLeadSource(sourceFilter) ? eq(leads.source, sourceFilter) : undefined

    const statusFilter = params.status?.trim() ?? ''
    const statusCond: SQL | undefined =
      statusFilter.length > 0 && isLeadStatus(statusFilter) ? eq(leads.status, statusFilter) : undefined

    let searchCond: SQL | undefined
    if (search.length > 0) {
      const pattern = `%${escapeLikeNeedle(search)}%`
      searchCond =
        or(
          ilike(leads.companyName, pattern),
          ilike(leads.contactName, pattern),
          ilike(leads.inquiryText, pattern),
          ilike(leads.email, pattern)
        ) ?? undefined
    }

    const whereClause = and(isNull(leads.deletedAt), sourceCond, statusCond, searchCond)

    const totalRowsPromise = db.select({ c: count() }).from(leads).where(whereClause)

    const rowsPromise = db
      .select({
        id: leads.id,
        companyName: leads.companyName,
        contactName: leads.contactName,
        inquiryText: leads.inquiryText,
        source: leads.source,
        status: leads.status,
        updatedAt: leads.updatedAt
      })
      .from(leads)
      .where(whereClause)
      .orderBy(desc(leads.updatedAt))
      .limit(limit)
      .offset(offset)

    // Global stats — NOT scoped by the user filters so KPI cards always reflect the
    // full inbox health, not just the filtered slice. Single statement, FILTER clauses.
    const statsPromise = db
      .select({
        totalActive: sql<number>`COUNT(*)::int`,
        newCount: sql<number>`COUNT(*) FILTER (WHERE ${leads.status} = 'NEW')::int`,
        contactedCount: sql<number>`COUNT(*) FILTER (WHERE ${leads.status} = 'CONTACTED')::int`,
        qualifiedCount: sql<number>`COUNT(*) FILTER (WHERE ${leads.status} = 'QUALIFIED')::int`,
        proposalCount: sql<number>`COUNT(*) FILTER (WHERE ${leads.status} IN ('PROPOSAL_SENT', 'NEGOTIATING'))::int`,
        closedWonCount: sql<number>`COUNT(*) FILTER (WHERE ${leads.status} = 'CLOSED_WON')::int`
      })
      .from(leads)
      .where(isNull(leads.deletedAt))

    const [totalRows, rows, statsRows] = await Promise.all([totalRowsPromise, rowsPromise, statsPromise])

    const total = Number(totalRows[0]?.c ?? 0)
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

    const threads: MessageThreadRow[] = rows.map((r) => ({
      id: r.id,
      companyName: r.companyName,
      contactName: r.contactName,
      preview: previewText(r.inquiryText),
      source: r.source as LeadSource,
      status: r.status as LeadStatus,
      updatedAt: r.updatedAt.toISOString(),
      unreadHint: r.status === 'NEW'
    }))

    const statsRow = statsRows[0]
    const stats: MessageCenterStats = {
      totalActive: Number(statsRow?.totalActive ?? 0),
      newCount: Number(statsRow?.newCount ?? 0),
      contactedCount: Number(statsRow?.contactedCount ?? 0),
      qualifiedCount: Number(statsRow?.qualifiedCount ?? 0),
      proposalCount: Number(statsRow?.proposalCount ?? 0),
      closedWonCount: Number(statsRow?.closedWonCount ?? 0)
    }

    return {
      threads,
      stats,
      meta: { page, limit, total, totalPages },
      generatedAt: new Date().toISOString()
    }
  }
}
