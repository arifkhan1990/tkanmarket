import { z } from 'zod'
import { and, desc, eq, gte, ilike, isNull, lte, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { leadActivityLog, leadNotes, leads } from '@/db/schema/leads.schema'
import { users } from '@/db/schema/users.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import type { CreateLeadInput } from '@/lib/validations/lead.validation'
import type { PaginatedResult } from '@/types/marketplace.types'
import type { Lead, LeadDetail, LeadListFilters, LeadNote, LeadSummary } from '@/types/lead.types'
import { computeLeadScore } from '@/lib/lead-score'
import type { LeadStatus } from '@/types/marketplace.types'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { count } from 'drizzle-orm'
import { filterFabricGalleryImageUrls } from '@/lib/fabric-gallery-image-urls'

export class LeadService {
  private static async requireUserIdByEmail(email: string): Promise<number> {
    const db = getDb()
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1)

    const id = rows[0]?.id
    if (!id) throw new ValidationError('User not found')
    return id
  }

  private static toIso(value: Date | string | null | undefined): string {
    if (!value) return ''
    return value instanceof Date ? value.toISOString() : String(value)
  }

  public static async create(input: CreateLeadInput): Promise<Lead> {
    const emailCheck = z.string().trim().email().safeParse(input.email)
    if (!emailCheck.success) throw new ValidationError('Invalid email')

    const db = getDb()

    // 60s soft-dedup: returns the existing lead instead of creating a duplicate
    // when the same (email, source) is resubmitted within the window (double-click,
    // browser resend). Longer windows would reject legitimate multi-day inquiries.
    const dedupWindowSeconds = 60
    const dedupCutoff = new Date(Date.now() - dedupWindowSeconds * 1000)
    const existing = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.email, input.email),
          eq(leads.source, input.source),
          gte(leads.createdAt, dedupCutoff),
          isNull(leads.deletedAt)
        )
      )
      .orderBy(desc(leads.createdAt))
      .limit(1)

    const dup = existing[0]
    if (dup) {
      return {
        id: dup.id,
        source: dup.source,
        status: dup.status,
        companyName: dup.companyName,
        contactName: dup.contactName,
        email: dup.email,
        phone: dup.phone ?? null,
        country: dup.country,
        city: dup.city ?? null,
        fabricId: dup.fabricId ?? null,
        inquiryText: dup.inquiryText,
        assignedToId: dup.assignedToId ?? null,
        utmSource: dup.utmSource ?? null,
        utmCampaign: dup.utmCampaign ?? null,
        utmMedium: dup.utmMedium ?? null,
        createdAt: LeadService.toIso(dup.createdAt),
        updatedAt: LeadService.toIso(dup.updatedAt)
      }
    }

    const result = await db.transaction(async (tx) => {
      const leadRows = await tx
        .insert(leads)
        .values({
          source: input.source,
          status: 'NEW',
          companyName: input.company_name,
          contactName: input.contact_name,
          email: input.email,
          phone: input.phone,
          country: input.country,
          city: input.city,
          fabricId: input.fabric_id,
          inquiryText: input.inquiry_text,
          utmSource: input.utm_source,
          utmCampaign: input.utm_campaign,
          utmMedium: null
        })
        .returning()

      const lead = leadRows[0]
      if (!lead) throw new Error('Lead insert failed')

      await tx.insert(leadActivityLog).values({
        leadId: lead.id,
        actorId: null,
        eventType: 'created',
        payload: { source: input.source }
      })

      return lead
    })

    return {
      id: result.id,
      source: result.source,
      status: result.status,
      companyName: result.companyName,
      contactName: result.contactName,
      email: result.email,
      phone: result.phone ?? null,
      country: result.country,
      city: result.city ?? null,
      fabricId: result.fabricId ?? null,
      inquiryText: result.inquiryText,
      assignedToId: result.assignedToId ?? null,
      utmSource: result.utmSource ?? null,
      utmCampaign: result.utmCampaign ?? null,
      utmMedium: result.utmMedium ?? null,
      createdAt: LeadService.toIso(result.createdAt),
      updatedAt: LeadService.toIso(result.updatedAt)
    }
  }

  public static async list(
    filters: LeadListFilters,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<LeadSummary>> {
    const db = getDb()
    const offset = (pagination.page - 1) * pagination.limit

    let whereClause = isNull(leads.deletedAt)

    if (filters.q?.trim()) {
      const pattern = `%${filters.q.trim()}%`
      whereClause =
        and(
          whereClause,
          or(
            ilike(leads.companyName, pattern),
            ilike(leads.contactName, pattern),
            ilike(leads.email, pattern)
          )
        ) ?? whereClause
    }
    if (filters.status) whereClause = and(whereClause, eq(leads.status, filters.status)) ?? whereClause
    if (typeof filters.assignedToId === 'number') {
      whereClause = and(whereClause, eq(leads.assignedToId, filters.assignedToId)) ?? whereClause
    }
    if (filters.source) whereClause = and(whereClause, eq(leads.source, filters.source)) ?? whereClause
    if (filters.country) whereClause = and(whereClause, eq(leads.country, filters.country)) ?? whereClause
    if (filters.createdFrom) whereClause = and(whereClause, gte(leads.createdAt, filters.createdFrom)) ?? whereClause
    if (filters.createdTo) whereClause = and(whereClause, lte(leads.createdAt, filters.createdTo)) ?? whereClause

    const totalRows = await db.select({ total: count() }).from(leads).where(whereClause)
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
        country: leads.country,
        createdAt: leads.createdAt,
        assignedUserId: users.id,
        assignedUserName: users.name,
        assignedUserEmail: users.email,
        assignedUserAvatarUrl: users.avatarUrl,
        fabricId: fabrics.id,
        fabricSlug: fabrics.slug,
        fabricTitleRu: fabrics.titleRu,
        fabricImages: fabrics.images,
        supplierName: suppliers.name
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedToId, users.id))
      .leftJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .leftJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(whereClause)
      .orderBy(desc(leads.createdAt))
      .limit(pagination.limit)
      .offset(offset)

    return {
      items: rows.map((r) => ({
        id: r.id,
        status: r.status,
        source: r.source,
        companyName: r.companyName,
        contactName: r.contactName,
        email: r.email,
        phone: r.phone ?? null,
        country: r.country,
        assignedTo:
          r.assignedUserId && r.assignedUserName && r.assignedUserEmail
            ? { id: r.assignedUserId, name: r.assignedUserName, email: r.assignedUserEmail, avatarUrl: r.assignedUserAvatarUrl ?? null }
            : null,
        fabric:
          r.fabricId && r.fabricSlug && r.fabricTitleRu && r.supplierName
            ? {
                id: r.fabricId,
                slug: r.fabricSlug,
                titleRu: r.fabricTitleRu,
                imageUrl: filterFabricGalleryImageUrls(r.fabricImages ?? undefined)[0] ?? null,
                supplierName: r.supplierName
              }
            : null,
        createdAt: LeadService.toIso(r.createdAt)
      })),
      total
    }
  }

  public static async getById(id: number): Promise<LeadDetail | null> {
    const db = getDb()
    const leadRows = await db
      .select({
        lead: leads,
        assignedUser: users,
        fabric: fabrics,
        supplier: suppliers
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedToId, users.id))
      .leftJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .leftJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
      .limit(1)

    const row = leadRows[0]
    if (!row) return null

    const notesRows = await db
      .select({
        id: leadNotes.id,
        leadId: leadNotes.leadId,
        content: leadNotes.content,
        createdAt: leadNotes.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorAvatarUrl: users.avatarUrl
      })
      .from(leadNotes)
      .leftJoin(users, eq(leadNotes.authorId, users.id))
      .where(eq(leadNotes.leadId, id))
      .orderBy(leadNotes.createdAt)

    const activityRows = await db
      .select({
        id: leadActivityLog.id,
        leadId: leadActivityLog.leadId,
        eventType: leadActivityLog.eventType,
        payload: leadActivityLog.payload,
        createdAt: leadActivityLog.createdAt,
        actorId: users.id,
        actorName: users.name,
        actorEmail: users.email,
        actorAvatarUrl: users.avatarUrl
      })
      .from(leadActivityLog)
      .leftJoin(users, eq(leadActivityLog.actorId, users.id))
      .where(eq(leadActivityLog.leadId, id))
      .orderBy(leadActivityLog.createdAt)

    const assignedTo =
      row.assignedUser?.id && row.assignedUser?.name && row.assignedUser?.email
        ? { id: row.assignedUser.id, name: row.assignedUser.name, email: row.assignedUser.email, avatarUrl: row.assignedUser.avatarUrl ?? null }
        : null

    const fabric =
      row.fabric?.id && row.fabric?.slug && row.fabric?.titleRu && row.supplier?.name
        ? {
            id: row.fabric.id,
            slug: row.fabric.slug,
            titleRu: row.fabric.titleRu,
            imageUrl: filterFabricGalleryImageUrls(row.fabric.images ?? undefined)[0] ?? null,
            supplierName: row.supplier.name
          }
        : null

    const lead: Lead = {
      id: row.lead.id,
      source: row.lead.source,
      status: row.lead.status,
      companyName: row.lead.companyName,
      contactName: row.lead.contactName,
      email: row.lead.email,
      phone: row.lead.phone ?? null,
      country: row.lead.country,
      city: row.lead.city ?? null,
      fabricId: row.lead.fabricId ?? null,
      inquiryText: row.lead.inquiryText,
      assignedToId: row.lead.assignedToId ?? null,
      utmSource: row.lead.utmSource ?? null,
      utmCampaign: row.lead.utmCampaign ?? null,
      utmMedium: row.lead.utmMedium ?? null,
      createdAt: LeadService.toIso(row.lead.createdAt),
      updatedAt: LeadService.toIso(row.lead.updatedAt)
    }

    const notes: LeadNote[] = notesRows.map((n) => ({
      id: n.id,
      leadId: n.leadId,
      author:
        n.authorId && n.authorName && n.authorEmail
          ? { id: n.authorId, name: n.authorName, email: n.authorEmail, avatarUrl: n.authorAvatarUrl ?? null }
          : null,
      content: n.content,
      createdAt: LeadService.toIso(n.createdAt)
    }))

    const scoring = computeLeadScore({
      source: lead.source,
      status: lead.status,
      inquiryText: lead.inquiryText,
      fabricId: lead.fabricId,
      country: lead.country
    })

    return {
      lead,
      assignedTo,
      fabric,
      notes,
      scoring,
      activity: activityRows.map((a) => ({
        id: a.id,
        leadId: a.leadId,
        actor:
          a.actorId && a.actorName && a.actorEmail
            ? { id: a.actorId, name: a.actorName, email: a.actorEmail, avatarUrl: a.actorAvatarUrl ?? null }
            : null,
        eventType: a.eventType,
        payload: a.payload,
        createdAt: LeadService.toIso(a.createdAt)
      }))
    }
  }

  public static async updateStatus(id: number, status: LeadStatus, actorId: number): Promise<Lead> {
    const db = getDb()
    const result = await db.transaction(async (tx) => {
      const currentRows = await tx
        .select({ status: leads.status })
        .from(leads)
        .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
        .limit(1)
      const from = currentRows[0]?.status
      if (!from) throw new NotFoundError('Lead not found')

      const updatedRows = await tx.update(leads).set({ status }).where(eq(leads.id, id)).returning()
      const updated = updatedRows[0]
      if (!updated) throw new Error('Lead update failed')

      await tx.insert(leadActivityLog).values({
        leadId: id,
        actorId,
        eventType: 'status_changed',
        payload: { from, to: status }
      })

      return updated
    })

    return {
      id: result.id,
      source: result.source,
      status: result.status,
      companyName: result.companyName,
      contactName: result.contactName,
      email: result.email,
      phone: result.phone ?? null,
      country: result.country,
      city: result.city ?? null,
      fabricId: result.fabricId ?? null,
      inquiryText: result.inquiryText,
      assignedToId: result.assignedToId ?? null,
      utmSource: result.utmSource ?? null,
      utmCampaign: result.utmCampaign ?? null,
      utmMedium: result.utmMedium ?? null,
      createdAt: LeadService.toIso(result.createdAt),
      updatedAt: LeadService.toIso(result.updatedAt)
    }
  }

  public static async addNote(leadId: number, authorId: number, content: string): Promise<LeadNote> {
    const db = getDb()
    const result = await db.transaction(async (tx) => {
      const leadExists = await tx
        .select({ id: leads.id })
        .from(leads)
        .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))
        .limit(1)
      if (!leadExists[0]?.id) throw new NotFoundError('Lead not found')

      const noteRows = await tx
        .insert(leadNotes)
        .values({ leadId, authorId, content })
        .returning({ id: leadNotes.id, createdAt: leadNotes.createdAt })

      const note = noteRows[0]
      if (!note) throw new Error('Note insert failed')

      await tx.insert(leadActivityLog).values({
        leadId,
        actorId: authorId,
        eventType: 'note_added',
        payload: { note_id: note.id }
      })

      return note
    })

    const authorRows = await db
      .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, authorId))
      .limit(1)

    const author = authorRows[0]

    return {
      id: result.id,
      leadId,
      author: author ? { id: author.id, name: author.name, email: author.email, avatarUrl: author.avatarUrl ?? null } : null,
      content,
      createdAt: LeadService.toIso(result.createdAt)
    }
  }

  public static async assign(leadId: number, userId: number, actorId: number): Promise<Lead> {
    const db = getDb()
    const result = await db.transaction(async (tx) => {
      const userRows = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .limit(1)
      if (!userRows[0]?.id) throw new ValidationError('Assigned user not found')

      const updatedRows = await tx
        .update(leads)
        .set({ assignedToId: userId })
        .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))
        .returning()

      const updated = updatedRows[0]
      if (!updated) throw new NotFoundError('Lead not found')

      await tx.insert(leadActivityLog).values({
        leadId,
        actorId,
        eventType: 'assigned',
        payload: { to_user_id: userId }
      })

      return updated
    })

    return {
      id: result.id,
      source: result.source,
      status: result.status,
      companyName: result.companyName,
      contactName: result.contactName,
      email: result.email,
      phone: result.phone ?? null,
      country: result.country,
      city: result.city ?? null,
      fabricId: result.fabricId ?? null,
      inquiryText: result.inquiryText,
      assignedToId: result.assignedToId ?? null,
      utmSource: result.utmSource ?? null,
      utmCampaign: result.utmCampaign ?? null,
      utmMedium: result.utmMedium ?? null,
      createdAt: LeadService.toIso(result.createdAt),
      updatedAt: LeadService.toIso(result.updatedAt)
    }
  }

  public static async deleteNote(noteId: number, leadId: number): Promise<void> {
    const db = getDb()
    const rows = await db
      .select({ id: leadNotes.id })
      .from(leadNotes)
      .where(and(eq(leadNotes.id, noteId), eq(leadNotes.leadId, leadId)))
      .limit(1)
    if (!rows[0]) throw new NotFoundError('Note not found')
    await db
      .update(leadNotes)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(leadNotes.id, noteId))
  }

  public static async getActorIdFromAdminSessionEmail(email: string | null | undefined): Promise<number> {
    if (!email) throw new ValidationError('Actor email missing')
    return LeadService.requireUserIdByEmail(email)
  }
}

