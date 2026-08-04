import { and, eq, gte, isNull, count } from 'drizzle-orm'

import { getDb } from '@/db'
import { users } from '@/db/schema/users.schema'
import { teams, teamMembers } from '@/db/schema/teams.schema'
import { auditLog } from '@/db/schema/audit.schema'

import type { AdminAccessInsights } from '@/types/admin-access-insights.types'

export class AdminAccessInsightsService {
  public static async getInsights(): Promise<AdminAccessInsights> {
    const db = getDb()
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [enabledRow, disabledRow, teamsRow, membersRow, auditEventsRow] = await Promise.all([
      db
        .select({ count: count() })
        .from(users)
        .where(and(isNull(users.deletedAt), eq(users.totpEnabled, true))),
      db
        .select({ count: count() })
        .from(users)
        .where(and(isNull(users.deletedAt), eq(users.totpEnabled, false))),
      db.select({ count: count() }).from(teams).where(isNull(teams.deletedAt)),
      db
        .select({ count: count() })
        .from(teamMembers)
        .where(isNull(teamMembers.deletedAt)),
      db
        .select({ count: count() })
        .from(auditLog)
        .where(and(isNull(auditLog.deletedAt), gte(auditLog.createdAt, since)))
    ])

    return {
      totp_enabled_users: enabledRow[0]?.count ?? 0,
      totp_disabled_users: disabledRow[0]?.count ?? 0,
      teams_total: teamsRow[0]?.count ?? 0,
      team_members_total: membersRow[0]?.count ?? 0,
      audit_events_24h: auditEventsRow[0]?.count ?? 0
    }
  }
}

