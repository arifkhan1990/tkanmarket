import { and, count, eq, gte, isNotNull, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { adminSettings } from '@/db/schema/admin-settings.schema'
import { leads } from '@/db/schema/leads.schema'
import { ValidationError } from '@/lib/errors'
import type { LeadAssignmentRulesResponse, LeadOpsConfig } from '@/types/lead-assignment.types'
import { LeadOpsConfigSchema } from '@/types/lead-assignment.types'

export class LeadOpsService {
  public static async getConfig(): Promise<LeadOpsConfig> {
    const db = getDb()
    const row = await db
      .select({ leadOpsJson: adminSettings.leadOpsJson })
      .from(adminSettings)
      .where(isNull(adminSettings.deletedAt))
      .limit(1)

    const raw = row[0]?.leadOpsJson
    const parsed = LeadOpsConfigSchema.safeParse(raw ?? {})
    if (!parsed.success) {
      return { assignmentRules: [] }
    }
    return parsed.data
  }

  public static async saveConfig(input: LeadOpsConfig, meta: { actorLabel: string }): Promise<LeadOpsConfig> {
    const parsed = LeadOpsConfigSchema.parse({
      ...input,
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: meta.actorLabel
    })
    const db = getDb()
    const row = await db
      .select({ id: adminSettings.id })
      .from(adminSettings)
      .where(isNull(adminSettings.deletedAt))
      .limit(1)
    const settingsId = row[0]?.id
    if (!settingsId) throw new ValidationError('Admin settings row missing')

    await db
      .update(adminSettings)
      .set({
        leadOpsJson: parsed as unknown as Record<string, unknown>,
        updatedAt: new Date()
      })
      .where(eq(adminSettings.id, settingsId))

    return parsed
  }

  public static async getAssignmentRulesDashboard(): Promise<LeadAssignmentRulesResponse> {
    const config = await LeadOpsService.getConfig()
    const db = getDb()
    const now = new Date()
    const d30 = new Date(now)
    d30.setDate(d30.getDate() - 30)

    const totalRow = await db
      .select({ total: count() })
      .from(leads)
      .where(and(isNull(leads.deletedAt), gte(leads.createdAt, d30)))

    const assignedRow = await db
      .select({ total: count() })
      .from(leads)
      .where(
        and(isNull(leads.deletedAt), gte(leads.createdAt, d30), isNotNull(leads.assignedToId))
      )

    const total = totalRow[0]?.total ?? 0
    const assigned = assignedRow[0]?.total ?? 0
    const routeVelocityPercent = total === 0 ? 0 : Math.round((assigned / total) * 100)

    return {
      config,
      stats: {
        routeVelocityPercent,
        activeRulesCount: config.assignmentRules.length,
        overlappingRules: 0,
        lastModifiedAt: config.lastModifiedAt ?? null
      }
    }
  }
}
