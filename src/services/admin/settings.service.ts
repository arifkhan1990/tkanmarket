import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { adminSettings } from '@/db/schema/admin-settings.schema'

export interface AdminSettings {
  crawlerEnabled: boolean
  crawlerDefaultMaxProducts: number
  leadRateLimitPerHour: number
  notificationEmail: string | null
}

export interface SocialMediaPolicy {
  watermarkEnabled: boolean
  watermarkText: string
  altTextTemplate: string
  requireFullyApprovedForPublish: boolean
}

const DEFAULT_SOCIAL_POLICY: SocialMediaPolicy = {
  watermarkEnabled: false,
  watermarkText: 'TkanMarket B2B',
  altTextTemplate: 'B2B Textile Sourcing - TkanMarket Fabric SKU: {sku}',
  requireFullyApprovedForPublish: true
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

  public static async getSocialPolicy(): Promise<SocialMediaPolicy> {
    const db = getDb()
    const row = await db
      .select({ socialMediaPolicyJson: adminSettings.socialMediaPolicyJson })
      .from(adminSettings)
      .where(isNull(adminSettings.deletedAt))
      .limit(1)

    const raw = row[0]?.socialMediaPolicyJson as Partial<SocialMediaPolicy> | null
    return {
      watermarkEnabled: raw?.watermarkEnabled ?? DEFAULT_SOCIAL_POLICY.watermarkEnabled,
      watermarkText: raw?.watermarkText ?? DEFAULT_SOCIAL_POLICY.watermarkText,
      altTextTemplate: raw?.altTextTemplate ?? DEFAULT_SOCIAL_POLICY.altTextTemplate,
      requireFullyApprovedForPublish: raw?.requireFullyApprovedForPublish ?? DEFAULT_SOCIAL_POLICY.requireFullyApprovedForPublish
    }
  }

  public static async updateSocialPolicy(input: Partial<SocialMediaPolicy>): Promise<SocialMediaPolicy> {
    const db = getDb()
    const current = await SettingsService.getSocialPolicy()
    const next: SocialMediaPolicy = {
      watermarkEnabled: input.watermarkEnabled ?? current.watermarkEnabled,
      watermarkText: input.watermarkText?.trim() ? input.watermarkText.trim() : current.watermarkText,
      altTextTemplate: input.altTextTemplate?.trim() ? input.altTextTemplate.trim() : current.altTextTemplate,
      requireFullyApprovedForPublish: input.requireFullyApprovedForPublish ?? current.requireFullyApprovedForPublish
    }

    const row = await db
      .select({ id: adminSettings.id })
      .from(adminSettings)
      .where(isNull(adminSettings.deletedAt))
      .limit(1)
    const settingsRow = row[0]
    if (settingsRow) {
      await db
        .update(adminSettings)
        .set({ socialMediaPolicyJson: next, updatedAt: new Date() })
        .where(eq(adminSettings.id, settingsRow.id))
    } else {
      await db.insert(adminSettings).values({
        crawlerEnabled: true,
        crawlerDefaultMaxProducts: 200,
        leadRateLimitPerHour: 5,
        socialMediaPolicyJson: next
      })
    }
    return next
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

