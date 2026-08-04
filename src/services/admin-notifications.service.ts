import type { SQL } from 'drizzle-orm'
import { and, count, desc, eq, ilike, inArray, isNull, like, or } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { notifications } from '@/db/schema/notifications.schema'
import type {
  AdminNotificationCategoryFilter,
  AdminNotificationRow,
  AdminNotificationsListQuery
} from '@/types/admin-notifications.types'

function categoryWhere(category: AdminNotificationCategoryFilter): SQL | undefined {
  if (category === 'all') return undefined
  if (category === 'system') {
    return or(
      eq(notifications.type, 'system'),
      like(notifications.type, 'crawler%'),
      like(notifications.type, 'infra%'),
      like(notifications.type, 'job_%')
    )
  }
  if (category === 'leads') {
    return ilike(notifications.type, '%lead%')
  }
  return ilike(notifications.type, '%social%')
}

export class AdminNotificationsService {
  public static async list(
    query: AdminNotificationsListQuery
  ): Promise<{ items: AdminNotificationRow[]; total: number }> {
    const db = getDb()
    const offset = (query.page - 1) * query.limit
    const cat = categoryWhere(query.category)
    const base = and(
      eq(notifications.userId, query.userId),
      isNull(notifications.deletedAt),
      isNull(notifications.archivedAt),
      ...(cat ? [cat] : [])
    )

    const totalRows = await db.select({ total: count() }).from(notifications).where(base)
    const total = totalRows[0]?.total ?? 0

    const rows = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        data: notifications.data,
        readAt: notifications.readAt,
        isHighPriority: notifications.isHighPriority,
        createdAt: notifications.createdAt
      })
      .from(notifications)
      .where(base)
      .orderBy(desc(notifications.createdAt))
      .limit(query.limit)
      .offset(offset)

    const items: AdminNotificationRow[] = rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      data: (r.data as Record<string, unknown> | null) ?? null,
      read_at: r.readAt ? r.readAt.toISOString() : null,
      is_high_priority: r.isHighPriority,
      created_at: r.createdAt.toISOString()
    }))

    return { items, total }
  }

  /**
   * Returns the last 5 notifications (any read state) plus the total unread count.
   * Two concurrent queries — zero N+1. Used exclusively by the bell-dropdown preview.
   */
  public static async getPreview(params: { userId: number }): Promise<{
    unreadCount: number
    items: AdminNotificationRow[]
  }> {
    const db = getDb()
    const base = and(
      eq(notifications.userId, params.userId),
      isNull(notifications.deletedAt),
      isNull(notifications.archivedAt)
    )

    const [countRows, rows] = await Promise.all([
      db
        .select({ total: sql<number>`COUNT(*) FILTER (WHERE ${notifications.readAt} IS NULL)` })
        .from(notifications)
        .where(base),
      db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          body: notifications.body,
          data: notifications.data,
          readAt: notifications.readAt,
          isHighPriority: notifications.isHighPriority,
          createdAt: notifications.createdAt
        })
        .from(notifications)
        .where(base)
        .orderBy(desc(notifications.createdAt))
        .limit(5)
    ])

    const unreadCount = Number(countRows[0]?.total ?? 0)
    const items: AdminNotificationRow[] = rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      data: (r.data as Record<string, unknown> | null) ?? null,
      read_at: r.readAt ? r.readAt.toISOString() : null,
      is_high_priority: r.isHighPriority,
      created_at: r.createdAt.toISOString()
    }))

    return { unreadCount, items }
  }

  public static async markRead(params: { userId: number; ids: number[] }): Promise<number> {
    if (params.ids.length === 0) return 0
    const db = getDb()
    const now = new Date()
    const updated = await db
      .update(notifications)
      .set({ readAt: now, updatedAt: now })
      .where(
        and(
          eq(notifications.userId, params.userId),
          isNull(notifications.deletedAt),
          inArray(notifications.id, params.ids)
        )
      )
      .returning({ id: notifications.id })
    return updated.length
  }

  public static async markAllRead(params: {
    userId: number
    category: AdminNotificationCategoryFilter
  }): Promise<number> {
    const db = getDb()
    const now = new Date()
    const cat = categoryWhere(params.category)
    const base = and(
      eq(notifications.userId, params.userId),
      isNull(notifications.deletedAt),
      isNull(notifications.readAt),
      ...(cat ? [cat] : [])
    )

    const updated = await db
      .update(notifications)
      .set({ readAt: now, updatedAt: now })
      .where(base)
      .returning({ id: notifications.id })
    return updated.length
  }
}
