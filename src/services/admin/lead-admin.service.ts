import { and, desc, eq, gte, inArray, isNull } from 'drizzle-orm'
import { count } from 'drizzle-orm'

import { getDb } from '@/db'
import { leads, leadActivityLog, leadNotes } from '@/db/schema/leads.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { users } from '@/db/schema/users.schema'
import { ValidationError } from '@/lib/errors'
import type { AdminLeadCard, AdminLeadDetail, AdminLeadNote } from '@/types/admin-leads.types'
import type { AdminKanbanLead, AdminLeadsKanbanResponse, LeadKanbanColumnKey } from '@/types/admin-leads-kanban.types'
import type { LeadScoringDashboardResponse, LeadScoringListItem } from '@/types/lead-scoring-dashboard.types'
import type { LeadStatus } from '@/types/marketplace.types'
import { computeLeadScore } from '@/lib/lead-score'

function qualificationLabel(score: number, status: LeadStatus): LeadScoringListItem['qualificationLabel'] {
  if (status === 'CLOSED_LOST' || score < 38) return 'flagged'
  if (['QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON'].includes(status)) return 'qualified'
  if (status === 'CONTACTED' || (score >= 58 && score < 85)) return 'assessing'
  return 'new'
}

export class LeadAdminService {
  public static async getKanban(): Promise<AdminLeadsKanbanResponse> {
    const db = getDb()

    const rows = await db
      .select({
        id: leads.id,
        status: leads.status,
        source: leads.source,
        companyName: leads.companyName,
        contactName: leads.contactName,
        email: leads.email,
        createdAt: leads.createdAt,
        assignedUserId: users.id,
        assignedUserName: users.name,
        assignedUserEmail: users.email,
        assignedUserAvatarUrl: users.avatarUrl,
        fabricId: fabrics.id,
        fabricSlug: fabrics.slug,
        fabricTitleRu: fabrics.titleRu,
        inquiryText: leads.inquiryText,
        country: leads.country
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedToId, users.id))
      .leftJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .where(isNull(leads.deletedAt))
      .orderBy(desc(leads.createdAt))
      .limit(500)

    const emptyColumns: Record<LeadKanbanColumnKey, AdminKanbanLead[]> = {
      NEW: [],
      CONTACTED: [],
      QUALIFIED: [],
      PROPOSAL_SENT: [],
      NEGOTIATING: [],
      CLOSED: []
    }

    for (const r of rows) {
      const status = r.status
      const key: LeadKanbanColumnKey =
        status === 'CLOSED_WON' || status === 'CLOSED_LOST' ? 'CLOSED' : (status as LeadKanbanColumnKey)

      const score = computeLeadScore({
        source: r.source,
        status,
        inquiryText: r.inquiryText,
        fabricId: r.fabricId ?? null,
        country: r.country
      }).total

      const lead: AdminKanbanLead = {
        id: r.id,
        status,
        source: r.source,
        company_name: r.companyName,
        contact_name: r.contactName,
        email: r.email,
        created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        score,
        assigned_user:
          r.assignedUserId && r.assignedUserName && r.assignedUserEmail
            ? {
                id: r.assignedUserId,
                name: r.assignedUserName,
                email: r.assignedUserEmail,
                avatar_url: r.assignedUserAvatarUrl ?? null
              }
            : null,
        fabric:
          r.fabricId && r.fabricSlug && r.fabricTitleRu
            ? { id: r.fabricId, slug: r.fabricSlug, title_ru: r.fabricTitleRu }
            : null
      }

      emptyColumns[key].push(lead)
    }

    const counts: Record<LeadKanbanColumnKey, number> = {
      NEW: emptyColumns.NEW.length,
      CONTACTED: emptyColumns.CONTACTED.length,
      QUALIFIED: emptyColumns.QUALIFIED.length,
      PROPOSAL_SENT: emptyColumns.PROPOSAL_SENT.length,
      NEGOTIATING: emptyColumns.NEGOTIATING.length,
      CLOSED: emptyColumns.CLOSED.length
    }

    return { columns: emptyColumns, counts }
  }

  public static async listKanban(params: { page: number; limit: number }) {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const totalRows = await db.select({ total: count() }).from(leads).where(isNull(leads.deletedAt))

    const total = totalRows[0]?.total ?? 0

    const rows = await db
      .select({
        id: leads.id,
        status: leads.status,
        source: leads.source,
        companyName: leads.companyName,
        contactName: leads.contactName,
        email: leads.email,
        phone: leads.phone,
        fabricTitleRu: fabrics.titleRu,
        createdAt: leads.createdAt
      })
      .from(leads)
      .leftJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .where(isNull(leads.deletedAt))
      .orderBy(desc(leads.createdAt))
      .limit(params.limit)
      .offset(offset)

    return {
      items: rows.map((r) => ({
      id: r.id,
      status: r.status,
      source: r.source,
      companyName: r.companyName,
      contactName: r.contactName,
      email: r.email,
      phone: r.phone,
      fabricTitleRu: r.fabricTitleRu,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)
      })),
      total
    }
  }

  public static async getDetail(id: number): Promise<AdminLeadDetail | null> {
    const db = getDb()
    const leadRows = await db
      .select({
        id: leads.id,
        status: leads.status,
        source: leads.source,
        companyName: leads.companyName,
        contactName: leads.contactName,
        email: leads.email,
        phone: leads.phone,
        fabricTitleRu: fabrics.titleRu,
        createdAt: leads.createdAt
      })
      .from(leads)
      .leftJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
      .limit(1)

    const lead = leadRows[0]
    if (!lead) return null

    const notesRows = await db
      .select({
        id: leadNotes.id,
        content: leadNotes.content,
        createdAt: leadNotes.createdAt,
        authorName: users.name
      })
      .from(leadNotes)
      .leftJoin(users, eq(leadNotes.authorId, users.id))
      .where(eq(leadNotes.leadId, id))
      .orderBy(desc(leadNotes.createdAt))

    const notes: AdminLeadNote[] = notesRows.map((n) => ({
      id: n.id,
      content: n.content,
      createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
      authorName: n.authorName ?? null
    }))

    return {
      lead: {
        id: lead.id,
        status: lead.status,
        source: lead.source,
        companyName: lead.companyName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        fabricTitleRu: lead.fabricTitleRu,
        createdAt: lead.createdAt instanceof Date ? lead.createdAt.toISOString() : String(lead.createdAt)
      },
      notes
    }
  }

  public static async updateStatus(id: number, status: AdminLeadCard['status']) {
    const db = getDb()
    await db.transaction(async (tx) => {
      await tx.update(leads).set({ status }).where(eq(leads.id, id))

      await tx.insert(leadActivityLog).values({
        leadId: id,
        actorId: null,
        eventType: 'STATUS_UPDATED',
        payload: { status }
      })
    })
  }

  public static async addNote(id: number, authorEmail: string, content: string) {
    const db = getDb()

    const authorRows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, authorEmail))
      .limit(1)

    const authorId = authorRows[0]?.id
    if (!authorId) {
      throw new ValidationError('Note author not found')
    }

    await db.insert(leadNotes).values({
      leadId: id,
      authorId,
      content
    })
  }

  public static async getScoringDashboard(selectedLeadId?: number): Promise<LeadScoringDashboardResponse> {
    const db = getDb()
    const now = new Date()
    const d30 = new Date(now)
    d30.setDate(d30.getDate() - 30)
    const d14 = new Date(now)
    d14.setDate(d14.getDate() - 14)
    const d90 = new Date(now)
    d90.setDate(d90.getDate() - 90)

    const total30Row = await db
      .select({ total: count() })
      .from(leads)
      .where(and(isNull(leads.deletedAt), gte(leads.createdAt, d30)))
    const totalLeads30d = total30Row[0]?.total ?? 0

    const recentRows = await db
      .select({
        id: leads.id,
        status: leads.status,
        source: leads.source,
        companyName: leads.companyName,
        contactName: leads.contactName,
        country: leads.country,
        inquiryText: leads.inquiryText,
        fabricId: leads.fabricId,
        fabricTitleRu: fabrics.titleRu,
        createdAt: leads.createdAt
      })
      .from(leads)
      .leftJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .where(and(isNull(leads.deletedAt), gte(leads.createdAt, d30)))
      .orderBy(desc(leads.createdAt))
      .limit(120)

    const items: LeadScoringListItem[] = recentRows.map((r) => {
      const full = computeLeadScore({
        source: r.source,
        status: r.status,
        inquiryText: r.inquiryText,
        fabricId: r.fabricId ?? null,
        country: r.country
      })
      return {
        id: r.id,
        companyName: r.companyName,
        contactName: r.contactName,
        country: r.country,
        source: r.source,
        status: r.status,
        fabricTitleRu: r.fabricTitleRu ?? null,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        score: full.total,
        qualificationLabel: qualificationLabel(full.total, r.status)
      }
    })

    items.sort((a, b) => b.score - a.score)

    const avgScore =
      items.length === 0 ? 0 : Math.round(items.reduce((s, x) => s + x.score, 0) / items.length)

    const qualifiedCount = items.filter((x) =>
      ['QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON'].includes(x.status)
    ).length
    const qualifiedRatePercent = items.length === 0 ? 0 : Math.round((qualifiedCount / items.length) * 100)

    const closedRows = await db
      .select({ status: leads.status })
      .from(leads)
      .where(
        and(
          isNull(leads.deletedAt),
          inArray(leads.status, ['CLOSED_WON', 'CLOSED_LOST']),
          gte(leads.updatedAt, d90)
        )
      )

    const won = closedRows.filter((r) => r.status === 'CLOSED_WON').length
    const lost = closedRows.filter((r) => r.status === 'CLOSED_LOST').length
    const winRatePercent = won + lost === 0 ? 0 : Math.round((won / (won + lost)) * 100)

    const velRows = await db
      .select({ createdAt: leads.createdAt })
      .from(leads)
      .where(and(isNull(leads.deletedAt), gte(leads.createdAt, d14)))

    const byDay = new Map<string, number>()
    for (const r of velRows) {
      const d = r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)
      const key = d.toISOString().slice(0, 10)
      byDay.set(key, (byDay.get(key) ?? 0) + 1)
    }

    const velocity: Array<{ day: string; count: number }> = []
    for (let i = 13; i >= 0; i -= 1) {
      const dt = new Date(now)
      dt.setDate(dt.getDate() - i)
      const key = dt.toISOString().slice(0, 10)
      velocity.push({ day: key, count: byDay.get(key) ?? 0 })
    }

    const pickId = selectedLeadId ?? items[0]?.id
    let selectedBreakdown: LeadScoringDashboardResponse['selectedBreakdown'] = null
    if (pickId) {
      const row = recentRows.find((r) => r.id === pickId) ?? recentRows[0]
      if (row) {
        const sc = computeLeadScore({
          source: row.source,
          status: row.status,
          inquiryText: row.inquiryText,
          fabricId: row.fabricId ?? null,
          country: row.country
        })
        selectedBreakdown = {
          leadId: row.id,
          companyName: row.companyName,
          budgetAlignment: sc.budgetAlignment,
          volumeRequirement: sc.volumeRequirement,
          urgencyTimeline: sc.urgencyTimeline,
          insight: `Strong match on ${sc.budgetAlignment >= 7 ? 'budget' : 'profile'} signals; ${sc.urgencyTimeline >= 7 ? 'fast-follow recommended' : 'nurture sequence'} for ${row.companyName}.`
        }
      }
    }

    return {
      items: items.slice(0, 40),
      metrics: {
        totalLeads30d,
        avgScore,
        qualifiedRatePercent,
        winRatePercent
      },
      velocity,
      selectedBreakdown
    }
  }
}

