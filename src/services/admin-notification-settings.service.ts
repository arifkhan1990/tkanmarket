import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { notificationSettings } from '@/db/schema/notifications.schema'

import type { AdminNotificationSettings } from '@/types/admin-notification-settings.types'

export class AdminNotificationSettingsService {
  public static async getOrCreate(userId: number): Promise<AdminNotificationSettings> {
    const db = getDb()

    const existing = await db
      .select()
      .from(notificationSettings)
      .where(and(eq(notificationSettings.userId, userId), isNull(notificationSettings.deletedAt)))
      .limit(1)

    const row = existing[0]
    if (row) {
      return {
        id: row.id,
        user_id: row.userId,
        email_enabled: row.emailEnabled,
        in_app_enabled: row.inAppEnabled,
        preferences: (row.preferences as Record<string, unknown> | null) ?? null,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString()
      }
    }

    const inserted = await db
      .insert(notificationSettings)
      .values({
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        preferences: { digest: 'daily' },
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning()

    const created = inserted[0]
    if (!created) throw new Error('Failed to create notification settings')

    return {
      id: created.id,
      user_id: created.userId,
      email_enabled: created.emailEnabled,
      in_app_enabled: created.inAppEnabled,
      preferences: (created.preferences as Record<string, unknown> | null) ?? null,
      created_at: created.createdAt.toISOString(),
      updated_at: created.updatedAt.toISOString()
    }
  }

  public static async update(params: {
    userId: number
    input: {
      emailEnabled?: boolean
      inAppEnabled?: boolean
      preferences?: Record<string, unknown> | null
    }
  }): Promise<AdminNotificationSettings> {
    const db = getDb()

    const current = await this.getOrCreate(params.userId)

    const mergedPreferences =
      params.input.preferences === undefined
        ? current.preferences
        : {
            ...(current.preferences ?? {}),
            ...params.input.preferences
          }

    const updated = await db
      .update(notificationSettings)
      .set({
        emailEnabled: params.input.emailEnabled ?? current.email_enabled,
        inAppEnabled: params.input.inAppEnabled ?? current.in_app_enabled,
        preferences: mergedPreferences,
        updatedAt: new Date()
      })
      .where(and(eq(notificationSettings.userId, params.userId), isNull(notificationSettings.deletedAt)))
      .returning()

    const row = updated[0]
    if (!row) throw new Error('Failed to update notification settings')

    return {
      id: row.id,
      user_id: row.userId,
      email_enabled: row.emailEnabled,
      in_app_enabled: row.inAppEnabled,
      preferences: (row.preferences as Record<string, unknown> | null) ?? null,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString()
    }
  }
}

