import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { adminSettings } from '@/db/schema/admin-settings.schema'

export interface AdminSettings {
  crawlerEnabled: boolean
  crawlerDefaultMaxProducts: number
  leadRateLimitPerHour: number
  notificationEmail: string | null
}

export class SettingsService {
  public static async getSettings(): Promise<AdminSettings> {
    const db = getDb()
    const row = await db
      .select()
      .from(adminSettings)
      .where(isNull(adminSettings.deletedAt))
      .limit(1)

    const s = row[0]
    if (!s) {
      const inserted = await db
        .insert(adminSettings)
        .values({
          crawlerEnabled: true,
          crawlerDefaultMaxProducts: 200,
          leadRateLimitPerHour: 5,
          notificationEmail: null,
          leadOpsJson: {}
        })
        .returning()
      const created = inserted[0]
      if (!created) throw new Error('Failed to create admin settings row')
      return {
        crawlerEnabled: created.crawlerEnabled,
        crawlerDefaultMaxProducts: created.crawlerDefaultMaxProducts,
        leadRateLimitPerHour: created.leadRateLimitPerHour,
        notificationEmail: created.notificationEmail
      }
    }

    return {
      crawlerEnabled: s.crawlerEnabled,
      crawlerDefaultMaxProducts: s.crawlerDefaultMaxProducts,
      leadRateLimitPerHour: s.leadRateLimitPerHour,
      notificationEmail: s.notificationEmail
    }
  }

  public static async updateSettings(input: AdminSettings): Promise<AdminSettings> {
    const db = getDb()
    const current = await SettingsService.getSettings()
    const row = await db
      .select({ id: adminSettings.id })
      .from(adminSettings)
      .where(isNull(adminSettings.deletedAt))
      .limit(1)
    const settingsRow = row[0]
    if (!settingsRow) return current

    const updated = await db
      .update(adminSettings)
      .set({
        crawlerEnabled: input.crawlerEnabled ?? current.crawlerEnabled,
        crawlerDefaultMaxProducts: input.crawlerDefaultMaxProducts ?? current.crawlerDefaultMaxProducts,
        leadRateLimitPerHour: input.leadRateLimitPerHour ?? current.leadRateLimitPerHour,
        notificationEmail: input.notificationEmail,
        updatedAt: new Date()
      })
      .where(eq(adminSettings.id, settingsRow.id))
      .returning()

    const u = updated[0]
    if (!u) return current

    return {
      crawlerEnabled: u.crawlerEnabled,
      crawlerDefaultMaxProducts: u.crawlerDefaultMaxProducts,
      leadRateLimitPerHour: u.leadRateLimitPerHour,
      notificationEmail: u.notificationEmail
    }
  }
}

