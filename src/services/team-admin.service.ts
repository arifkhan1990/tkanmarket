import { and, count, eq, inArray, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { leads } from '@/db/schema/leads.schema'
import { teamMembers, teams } from '@/db/schema/teams.schema'
import { users } from '@/db/schema/users.schema'
import type {
  TeamDashboardStats,
  TeamListItem,
  TeamMemberPerformanceRow,
  TeamMemberRow,
  TeamMemberWithUser,
  UserRoleLabel
} from '@/types/team-admin.types'

const TEAM_SEAT_LIMIT = 24

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return s.length > 0 ? s.slice(0, 80) : 'team'
}

export class TeamAdminService {
  public static async listTeams(): Promise<TeamListItem[]> {
    const db = getDb()
    const rows = await db
      .select({ id: teams.id, name: teams.name, slug: teams.slug })
      .from(teams)
      .where(isNull(teams.deletedAt))
      .orderBy(teams.id)
      .limit(200)

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug
    }))
  }

  public static async listTeamMembers(teamId: number): Promise<TeamMemberWithUser[]> {
    const db = getDb()
    const rows = await db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        userId: teamMembers.userId,
        title: teamMembers.title,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        userAvatarUrl: users.avatarUrl
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(
        and(eq(teamMembers.teamId, teamId), isNull(teamMembers.deletedAt), isNull(users.deletedAt))
      )
      .orderBy(teamMembers.id)
      .limit(500)

    return rows.map((r) => ({
      id: r.id,
      team_id: r.teamId,
      user_id: r.userId,
      title: r.title,
      user_name: r.userName,
      user_email: r.userEmail,
      user_role: r.userRole as UserRoleLabel,
      user_avatar_url: r.userAvatarUrl ?? null
    }))
  }

  public static async createTeam(name: string): Promise<TeamListItem> {
    const db = getDb()
    const base = slugify(name)
    let slug = base
    let n = 0
    while (n < 50) {
      const clash = await db
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.slug, slug))
        .limit(1)
      if (!clash[0]?.id) break
      n += 1
      slug = `${base}-${n}`
    }

    const [row] = await db
      .insert(teams)
      .values({
        name: name.trim(),
        slug,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({ id: teams.id, name: teams.name, slug: teams.slug })

    if (!row) throw new Error('Failed to create team')
    return { id: row.id, name: row.name, slug: row.slug }
  }

  public static async addMember(params: {
    teamId: number
    userId: number
    title?: string | null
  }): Promise<TeamMemberRow> {
    const db = getDb()

    const existingAny = await db
      .select({
        id: teamMembers.id,
        deletedAt: teamMembers.deletedAt
      })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, params.teamId), eq(teamMembers.userId, params.userId)))
      .limit(1)

    if (existingAny[0]?.id) {
      const prev = existingAny[0]
      if (!prev.deletedAt) {
        const row = await db
          .select({
            id: teamMembers.id,
            teamId: teamMembers.teamId,
            userId: teamMembers.userId,
            title: teamMembers.title
          })
          .from(teamMembers)
          .where(eq(teamMembers.id, prev.id))
          .limit(1)
        const r = row[0]
        if (!r) throw new Error('Failed to add member')
        return { id: r.id, team_id: r.teamId, user_id: r.userId, title: r.title }
      }
      await db
        .update(teamMembers)
        .set({
          deletedAt: null,
          title: params.title ?? null,
          updatedAt: new Date()
        })
        .where(eq(teamMembers.id, prev.id))
      const row = await db
        .select({
          id: teamMembers.id,
          teamId: teamMembers.teamId,
          userId: teamMembers.userId,
          title: teamMembers.title
        })
        .from(teamMembers)
        .where(eq(teamMembers.id, prev.id))
        .limit(1)
      const r = row[0]
      if (!r) throw new Error('Failed to add member')
      return { id: r.id, team_id: r.teamId, user_id: r.userId, title: r.title }
    }

    const [inserted] = await db
      .insert(teamMembers)
      .values({
        teamId: params.teamId,
        userId: params.userId,
        title: params.title ?? null,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        userId: teamMembers.userId,
        title: teamMembers.title
      })

    const ins = inserted
    if (!ins) throw new Error('Failed to add member')
    return { id: ins.id, team_id: ins.teamId, user_id: ins.userId, title: ins.title }
  }

  public static async removeMember(memberId: number): Promise<void> {
    const db = getDb()
    await db
      .update(teamMembers)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(teamMembers.id, memberId))
  }

  public static async getTeamMemberUserIds(teamId: number): Promise<number[]> {
    const db = getDb()
    const rows = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), isNull(teamMembers.deletedAt)))
    return rows.map((r) => r.userId)
  }

  public static async getTeamDashboard(teamId: number): Promise<TeamDashboardStats> {
    const db = getDb()
    const memberIds = await this.getTeamMemberUserIds(teamId)
    const memberCount = memberIds.length
    const seatUtil = Math.min(100, Math.round((memberCount / TEAM_SEAT_LIMIT) * 100))

    if (memberIds.length === 0) {
      return {
        team_id: teamId,
        member_count: 0,
        seat_limit: TEAM_SEAT_LIMIT,
        seat_utilization_pct: 0,
        total_assigned_leads: 0,
        closed_won_leads: 0,
        lead_conversion_pct: 0,
        avg_response_minutes: null
      }
    }

    const [agg] = await db
      .select({
        total: count(),
        won: sql<number>`coalesce(sum(case when ${leads.status} = 'CLOSED_WON' then 1 else 0 end), 0)::int`,
        avgMins: sql<number | null>`avg(case when ${leads.status} <> 'NEW' then extract(epoch from (${leads.updatedAt} - ${leads.createdAt})) / 60.0 else null end)`
      })
      .from(leads)
      .where(and(isNull(leads.deletedAt), inArray(leads.assignedToId, memberIds)))

    const totalAssigned = Number(agg?.total ?? 0)
    const closedWon = Number(agg?.won ?? 0)
    const conversion =
      totalAssigned > 0 ? Math.round((closedWon / totalAssigned) * 1000) / 10 : 0
    const avgMins =
      agg?.avgMins !== null && agg?.avgMins !== undefined ? Math.round(Number(agg.avgMins) * 10) / 10 : null

    return {
      team_id: teamId,
      member_count: memberCount,
      seat_limit: TEAM_SEAT_LIMIT,
      seat_utilization_pct: seatUtil,
      total_assigned_leads: totalAssigned,
      closed_won_leads: closedWon,
      lead_conversion_pct: conversion,
      avg_response_minutes: avgMins
    }
  }

  public static async getTeamPerformance(teamId: number): Promise<TeamMemberPerformanceRow[]> {
    const members = await this.listTeamMembers(teamId)
    const memberIds = members.map((m) => m.user_id)
    if (memberIds.length === 0) return []

    const db = getDb()
    const statsRows = await db
      .select({
        userId: leads.assignedToId,
        total: count(),
        won: sql<number>`coalesce(sum(case when ${leads.status} = 'CLOSED_WON' then 1 else 0 end), 0)::int`,
        avgMins: sql<number | null>`avg(case when ${leads.status} <> 'NEW' then extract(epoch from (${leads.updatedAt} - ${leads.createdAt})) / 60.0 else null end)`
      })
      .from(leads)
      .where(and(isNull(leads.deletedAt), inArray(leads.assignedToId, memberIds)))
      .groupBy(leads.assignedToId)

    const byUser = new Map<
      number,
      { total: number; won: number; avgMins: number | null }
    >()
    for (const s of statsRows) {
      if (s.userId === null) continue
      const uid = s.userId
      const total = Number(s.total ?? 0)
      const won = Number(s.won ?? 0)
      const avgRaw = s.avgMins
      const avgMins =
        avgRaw !== null && avgRaw !== undefined ? Math.round(Number(avgRaw) * 10) / 10 : null
      byUser.set(uid, { total, won, avgMins })
    }

    return members.map((m) => {
      const st = byUser.get(m.user_id)
      const assigned = st?.total ?? 0
      const won = st?.won ?? 0
      const conversion = assigned > 0 ? Math.round((won / assigned) * 1000) / 10 : 0
      return {
        team_member_id: m.id,
        user_id: m.user_id,
        user_name: m.user_name,
        user_email: m.user_email,
        user_role: m.user_role,
        title: m.title,
        user_avatar_url: m.user_avatar_url,
        assigned_leads: assigned,
        closed_won_leads: won,
        conversion_pct: conversion,
        avg_response_minutes: st?.avgMins ?? null
      }
    })
  }
}
