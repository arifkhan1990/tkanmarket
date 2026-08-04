import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { NotFoundError } from '@/lib/errors'
import { adminAnnouncementAcknowledgements, adminAnnouncements } from '@/db/schema/admin-announcements.schema'
import { users } from '@/db/schema/users.schema'
import type {
  AdminAnnouncementCreateInput,
  AdminAnnouncementListItem,
  AdminAnnouncementsListResponse,
  AdminAnnouncementImportance
} from '@/types/admin-announcements.types'

function iconForRow(id: number, importance: AdminAnnouncementImportance): AdminAnnouncementListItem['iconKey'] {
  const mod = id % 3
  if (importance === 'HIGH') return 'rocket_launch'
  if (mod === 0) return 'settings_suggest'
  if (mod === 1) return 'security'
  return 'campaign'
}

export class AdminAnnouncementsService {
  public static async list(): Promise<AdminAnnouncementsListResponse> {
    const db = getDb()
    const teamSizeRow = await db
      .select({ c: count() })
      .from(users)
      .where(and(isNull(users.deletedAt), inArray(users.role, ['ADMIN', 'SALES'])))
    const teamSize = teamSizeRow[0]?.c ?? 1

    const rows = await db
      .select({
        id: adminAnnouncements.id,
        title: adminAnnouncements.title,
        body: adminAnnouncements.body,
        importance: adminAnnouncements.importance,
        referenceCode: adminAnnouncements.referenceCode,
        createdAt: adminAnnouncements.createdAt
      })
      .from(adminAnnouncements)
      .where(isNull(adminAnnouncements.deletedAt))
      .orderBy(desc(adminAnnouncements.createdAt))
      .limit(30)

    const ids = rows.map((r) => r.id)
    const ackCounts = new Map<number, number>()
    if (ids.length > 0) {
      const acks = await db
        .select({
          aid: adminAnnouncementAcknowledgements.announcementId,
          c: count()
        })
        .from(adminAnnouncementAcknowledgements)
        .innerJoin(users, eq(adminAnnouncementAcknowledgements.userId, users.id))
        .where(and(inArray(adminAnnouncementAcknowledgements.announcementId, ids), isNull(users.deletedAt)))
        .groupBy(adminAnnouncementAcknowledgements.announcementId)
      for (const a of acks) {
        ackCounts.set(a.aid, Number(a.c))
      }
    }

    const recentByAnn = new Map<number, { id: number; name: string; avatarUrl: string | null }[]>()
    if (ids.length > 0) {
      const recent = await db
        .select({
          announcementId: adminAnnouncementAcknowledgements.announcementId,
          userId: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
          ackAt: adminAnnouncementAcknowledgements.createdAt
        })
        .from(adminAnnouncementAcknowledgements)
        .innerJoin(users, eq(adminAnnouncementAcknowledgements.userId, users.id))
        .where(and(inArray(adminAnnouncementAcknowledgements.announcementId, ids), isNull(users.deletedAt)))
        .orderBy(desc(adminAnnouncementAcknowledgements.createdAt))

      const sorted = [...recent].sort((a, b) => b.ackAt.getTime() - a.ackAt.getTime())
      for (const r of sorted) {
        const list = recentByAnn.get(r.announcementId) ?? []
        if (list.length >= 3) continue
        if (list.some((u) => u.id === r.userId)) continue
        list.push({ id: r.userId, name: r.name, avatarUrl: r.avatarUrl })
        recentByAnn.set(r.announcementId, list)
      }
    }

    const items: AdminAnnouncementListItem[] = rows.map((r) => {
      const ackCount = ackCounts.get(r.id) ?? 0
      return {
        id: r.id,
        title: r.title,
        body: r.body,
        importance: r.importance as AdminAnnouncementImportance,
        referenceCode: r.referenceCode,
        createdAt: r.createdAt.toISOString(),
        ackCount,
        teamSize,
        recentAckAuthors: recentByAnn.get(r.id) ?? [],
        iconKey: iconForRow(r.id, r.importance as AdminAnnouncementImportance)
      }
    })

    const rates = items.map((i) => (teamSize === 0 ? 0 : Math.min(100, Math.round((i.ackCount / teamSize) * 100))))
    const openRatePercent =
      rates.length === 0 ? 0 : Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)

    return {
      overview: {
        openRatePercent,
        activeAdminUsers: teamSize,
        teamSize
      },
      items
    }
  }

  public static async create(userId: number, input: AdminAnnouncementCreateInput): Promise<{ id: number }> {
    const db = getDb()
    const [row] = await db
      .insert(adminAnnouncements)
      .values({
        title: input.title.trim(),
        body: input.body.trim(),
        importance: input.importance,
        referenceCode: input.referenceCode?.trim() || null,
        createdByUserId: userId
      })
      .returning({ id: adminAnnouncements.id })
    return { id: row?.id ?? 0 }
  }

  public static async acknowledge(userId: number, announcementId: number): Promise<void> {
    const db = getDb()
    const found = await db
      .select({ id: adminAnnouncements.id })
      .from(adminAnnouncements)
      .where(and(eq(adminAnnouncements.id, announcementId), isNull(adminAnnouncements.deletedAt)))
      .limit(1)
    if (!found[0]) {
      throw new NotFoundError('Announcement not found')
    }
    await db
      .insert(adminAnnouncementAcknowledgements)
      .values({
        announcementId,
        userId
      })
      .onConflictDoNothing()
  }
}
