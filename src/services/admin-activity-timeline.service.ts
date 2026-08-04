import { and, count, desc, eq, gte, ilike, inArray, isNull, lt, lte, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { auditLog, authSecurityEvents } from '@/db/schema/audit.schema'
import { aiPromptLogs } from '@/db/schema/ai-prompt-logs.schema'
import { fabricActivityLog } from '@/db/schema/fabric-activity-log.schema'
import { leads, leadActivityLog } from '@/db/schema/leads.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { users } from '@/db/schema/users.schema'
import type { PaginationMeta } from '@/types/api-envelope.types'
import type {
  AdminActivityTimelineEvent,
  AdminActivityTimelineListResponse,
  AdminActivityTimelineSidebarStats,
  AdminActivityTimelineUserStat
} from '@/types/admin-activity-timeline.types'

type ListParams = {
  page: number
  limit: number
  userId?: number | null
  from?: Date | null
  to?: Date | null
  q?: string | null
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function computePaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  }
}

function buildLeadMessage(eventType: string, companyName: string | null): string {
  const company = companyName ? ` (${companyName})` : ''
  if (eventType === 'created') return `New lead created${company}`
  if (eventType === 'status_changed') return `Lead status updated${company}`
  if (eventType === 'note_added') return `Note added${company}`
  if (eventType === 'assigned') return `Lead assigned${company}`
  return `${eventType}${company}`
}

function buildAuditMessage(action: string, entityType: string, entityId: number | null, message: string | null): string {
  if (message && message.trim().length > 0) return message
  const entity = entityId != null ? ` ${entityType} #${entityId}` : ` ${entityType}`
  return `${action}${entity}`
}

const FABRIC_EVENT_META: Record<string, { label: string; success?: boolean }> = {
  VIDEO_GENERATED: { label: 'AI video generated', success: true },
  VIDEO_SUPERSEDED: { label: 'AI video version superseded', success: true },
  VIDEO_GENERATION_FAILED: { label: 'AI video generation failed', success: false },
  IMAGE_BATCH_GENERATED: { label: 'AI image batch generated', success: true },
  AI_PROCESSING_FAILED: { label: 'AI processing failed', success: false },
  MEDIA_CLEANED_UP: { label: 'Old media versions cleaned up', success: true },
  FABRIC_CREATED: { label: 'Fabric created', success: true },
  FABRIC_UPDATED: { label: 'Fabric updated', success: true },
  FABRIC_APPROVED: { label: 'Fabric approved', success: true },
  FABRIC_REJECTED: { label: 'Fabric rejected', success: true },
  FABRIC_SUPERVISION_FLAG: { label: 'Fabric flagged for supervision', success: true },
  STATUS_UPDATED: { label: 'Fabric status updated', success: true },
  RAW_PRODUCT_IMPORTED: { label: 'Raw product imported', success: true },
  AB_TEST_VARIANTS_CREATED: { label: 'A/B test variants created', success: true }
}

function buildFabricMessage(eventType: string, message: string | null): string {
  const meta = FABRIC_EVENT_META[eventType]
  if (!meta) return message?.trim() ? message : 'Fabric event'
  // Superseded events already carry useful detail (count + replacing media id).
  if (eventType === 'VIDEO_SUPERSEDED' && message?.trim()) return message
  return meta.label
}

function buildAuthMessage(eventType: string, email: string | null): string {
  if (email && email.trim().length > 0) return `${eventType} for ${email}`
  return eventType
}

function toActor(actorId: number | null, name: string | null, avatarUrl: string | null) {
  return {
    id: actorId ?? null,
    name: name ?? null,
    avatarUrl: avatarUrl ?? null
  }
}

async function getWeeklySidebarStats(params: { userId?: number | null }): Promise<AdminActivityTimelineSidebarStats> {
  const db = getDb()
  const now = new Date()
  const last7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const prev7Start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  let currLeadWhere = gte(leadActivityLog.createdAt, last7Start)
  let currFabricWhere = gte(fabricActivityLog.createdAt, last7Start)
  let currAuditWhere = and(isNull(auditLog.deletedAt), gte(auditLog.createdAt, last7Start))
  let currAuthWhere = and(isNull(authSecurityEvents.deletedAt), gte(authSecurityEvents.createdAt, last7Start))
  let currPromptLogWhere = gte(aiPromptLogs.createdAt, last7Start)

  let prevLeadWhere = and(gte(leadActivityLog.createdAt, prev7Start), lt(leadActivityLog.createdAt, last7Start))
  let prevFabricWhere = and(gte(fabricActivityLog.createdAt, prev7Start), lt(fabricActivityLog.createdAt, last7Start))
  let prevAuditWhere = and(isNull(auditLog.deletedAt), gte(auditLog.createdAt, prev7Start), lt(auditLog.createdAt, last7Start))
  let prevAuthWhere = and(
    isNull(authSecurityEvents.deletedAt),
    gte(authSecurityEvents.createdAt, prev7Start),
    lt(authSecurityEvents.createdAt, last7Start)
  )
  let prevPromptLogWhere = and(gte(aiPromptLogs.createdAt, prev7Start), lt(aiPromptLogs.createdAt, last7Start))

  if (params.userId) {
    currLeadWhere = and(currLeadWhere, eq(leadActivityLog.actorId, params.userId))!
    currFabricWhere = and(currFabricWhere, eq(fabricActivityLog.actorId, params.userId))!
    currAuditWhere = and(currAuditWhere, eq(auditLog.actorId, params.userId))!
    currAuthWhere = and(currAuthWhere, eq(authSecurityEvents.userId, params.userId))!

    prevLeadWhere = and(prevLeadWhere, eq(leadActivityLog.actorId, params.userId))!
    prevFabricWhere = and(prevFabricWhere, eq(fabricActivityLog.actorId, params.userId))!
    prevAuditWhere = and(prevAuditWhere, eq(auditLog.actorId, params.userId))!
    prevAuthWhere = and(prevAuthWhere, eq(authSecurityEvents.userId, params.userId))!
  }

  const [
    leadCurr,
    fabricCurr,
    auditCurr,
    authCurr,
    promptLogCurr,
    leadPrev,
    fabricPrev,
    auditPrev,
    authPrev,
    promptLogPrev
  ] = await Promise.all([
    db.select({ total: count() }).from(leadActivityLog).where(currLeadWhere),
    db.select({ total: count() }).from(fabricActivityLog).where(currFabricWhere),
    db.select({ total: count() }).from(auditLog).where(currAuditWhere),
    db.select({ total: count() }).from(authSecurityEvents).where(currAuthWhere),
    db.select({ total: count() }).from(aiPromptLogs).where(currPromptLogWhere),
    db.select({ total: count() }).from(leadActivityLog).where(prevLeadWhere),
    db.select({ total: count() }).from(fabricActivityLog).where(prevFabricWhere),
    db.select({ total: count() }).from(auditLog).where(prevAuditWhere),
    db.select({ total: count() }).from(authSecurityEvents).where(prevAuthWhere),
    db.select({ total: count() }).from(aiPromptLogs).where(prevPromptLogWhere)
  ])

  const weeklyTotalActions = (leadCurr[0]?.total ?? 0) + (fabricCurr[0]?.total ?? 0) + (auditCurr[0]?.total ?? 0) + (authCurr[0]?.total ?? 0) + (promptLogCurr[0]?.total ?? 0)
  const weeklyPrevActions = (leadPrev[0]?.total ?? 0) + (fabricPrev[0]?.total ?? 0) + (auditPrev[0]?.total ?? 0) + (authPrev[0]?.total ?? 0) + (promptLogPrev[0]?.total ?? 0)

  const weeklyGrowthPercent = weeklyPrevActions === 0 ? null : ((weeklyTotalActions - weeklyPrevActions) / weeklyPrevActions) * 100

  const [auditTotalRow, auditSuccessRow, authTotalRow, authSuccessRow] = await Promise.all([
    db.select({ total: count() }).from(auditLog).where(currAuditWhere),
    db.select({ total: count() }).from(auditLog).where(and(currAuditWhere, eq(auditLog.success, true))!),
    db.select({ total: count() }).from(authSecurityEvents).where(currAuthWhere),
    db
      .select({ total: count() })
      .from(authSecurityEvents)
      .where(and(currAuthWhere, eq(authSecurityEvents.success, true))!)
  ])

  const auditTotal = auditTotalRow[0]?.total ?? 0
  const auditSuccess = auditSuccessRow[0]?.total ?? 0
  const authTotal = authTotalRow[0]?.total ?? 0
  const authSuccess = authSuccessRow[0]?.total ?? 0

  const engageTotal = auditTotal + authTotal
  const successTotal = auditSuccess + authSuccess
  const userEngagementPercent = engageTotal === 0 ? null : (successTotal / engageTotal) * 100

  const [inventoryCountRow, ordersCountRow, auditUsersCountRow, authUsersCountRow, aiCountRow] = await Promise.all([
    db.select({ total: count() }).from(fabricActivityLog).where(currFabricWhere),
    db.select({ total: count() }).from(leadActivityLog).where(currLeadWhere),
    db.select({ total: count() }).from(auditLog).where(currAuditWhere),
    db.select({ total: count() }).from(authSecurityEvents).where(currAuthWhere),
    db.select({ total: count() }).from(aiPromptLogs).where(currPromptLogWhere)
  ])

  const entityDistribution = {
    inventory: inventoryCountRow[0]?.total ?? 0,
    orders: ordersCountRow[0]?.total ?? 0,
    users: (auditUsersCountRow[0]?.total ?? 0) + (authUsersCountRow[0]?.total ?? 0),
    system: aiCountRow[0]?.total ?? 0
  }

  const leadGroupRows = await db
    .select({ userId: leadActivityLog.actorId, actions: count() })
    .from(leadActivityLog)
    .where(currLeadWhere)
    .groupBy(leadActivityLog.actorId)

  const fabricGroupRows = await db
    .select({ userId: fabricActivityLog.actorId, actions: count() })
    .from(fabricActivityLog)
    .where(currFabricWhere)
    .groupBy(fabricActivityLog.actorId)

  const auditGroupRows = await db
    .select({ userId: auditLog.actorId, actions: count() })
    .from(auditLog)
    .where(currAuditWhere)
    .groupBy(auditLog.actorId)

  const authGroupRows = await db
    .select({ userId: authSecurityEvents.userId, actions: count() })
    .from(authSecurityEvents)
    .where(currAuthWhere)
    .groupBy(authSecurityEvents.userId)

  const actionsByUserId = new Map<number, number>()
  const addGroup = (rows: Array<{ userId: number | null; actions: unknown }>) => {
    for (const r of rows) {
      if (r.userId == null) continue
      const actionsNum = Number(r.actions)
      if (!Number.isFinite(actionsNum)) continue
      actionsByUserId.set(r.userId, (actionsByUserId.get(r.userId) ?? 0) + actionsNum)
    }
  }

  addGroup(leadGroupRows as unknown as Array<{ userId: number | null; actions: unknown }>)
  addGroup(fabricGroupRows as unknown as Array<{ userId: number | null; actions: unknown }>)
  addGroup(auditGroupRows as unknown as Array<{ userId: number | null; actions: unknown }>)
  addGroup(authGroupRows as unknown as Array<{ userId: number | null; actions: unknown }>)

  const topUsers = Array.from(actionsByUserId.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const topUserIds = topUsers.map(([id]) => id)
  const topUserRows =
    topUserIds.length > 0
      ? await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl }).from(users).where(inArray(users.id, topUserIds))
      : []

  const userById = new Map<number, { name: string; avatarUrl: string | null }>()
  for (const r of topUserRows) {
    userById.set(r.id, { name: r.name, avatarUrl: r.avatarUrl ?? null })
  }

  const topActiveUsers: AdminActivityTimelineUserStat[] = topUsers.map(([userId, actions]) => {
    const u = userById.get(userId)
    const level = clamp(Math.floor(actions / 25) + 1, 1, 5)
    return {
      userId,
      name: u?.name ?? null,
      avatarUrl: u?.avatarUrl ?? null,
      actions,
      level
    }
  })

  return {
    weeklyTotalActions,
    weeklyGrowthPercent,
    userEngagementPercent,
    topActiveUsers,
    entityDistribution
  }
}

export class AdminActivityTimelineService {
  public static async list(params: ListParams): Promise<AdminActivityTimelineListResponse> {
    try {
      const db = getDb()

      const page = Math.max(1, params.page)
      const limit = clamp(Math.floor(params.limit), 1, 100)
      const offset = (page - 1) * limit
      const fetchLimit = clamp(offset + limit, 1, 2000)
      const userId = params.userId ?? undefined

      const from = params.from ?? undefined
      const to = params.to ?? undefined
      const q = params.q?.trim() ? params.q.trim() : undefined
      const qTerm = q ? `%${q}%` : undefined

      let leadWhere = gte(leadActivityLog.id, 0)
    if (userId) leadWhere = and(leadWhere, eq(leadActivityLog.actorId, userId))!
    if (from) leadWhere = and(leadWhere, gte(leadActivityLog.createdAt, from))!
    if (to) leadWhere = and(leadWhere, lte(leadActivityLog.createdAt, to))!
    if (qTerm) leadWhere = and(leadWhere, ilike(leadActivityLog.eventType, qTerm))!

      let fabricWhere = gte(fabricActivityLog.id, 0)
    if (userId) fabricWhere = and(fabricWhere, eq(fabricActivityLog.actorId, userId))!
    if (from) fabricWhere = and(fabricWhere, gte(fabricActivityLog.createdAt, from))!
    if (to) fabricWhere = and(fabricWhere, lte(fabricActivityLog.createdAt, to))!
      if (qTerm) {
      fabricWhere = and(fabricWhere, or(ilike(fabricActivityLog.eventType, qTerm), ilike(fabricActivityLog.message, qTerm)))!
      }

      let auditWhere = isNull(auditLog.deletedAt)
    if (userId) auditWhere = and(auditWhere, eq(auditLog.actorId, userId))!
    if (from) auditWhere = and(auditWhere, gte(auditLog.createdAt, from))!
    if (to) auditWhere = and(auditWhere, lte(auditLog.createdAt, to))!
      if (qTerm) {
      auditWhere = and(auditWhere, or(ilike(auditLog.action, qTerm), ilike(auditLog.entityType, qTerm), ilike(auditLog.message, qTerm)))!
      }

      let authWhere = isNull(authSecurityEvents.deletedAt)
    if (userId) authWhere = and(authWhere, eq(authSecurityEvents.userId, userId))!
    if (from) authWhere = and(authWhere, gte(authSecurityEvents.createdAt, from))!
    if (to) authWhere = and(authWhere, lte(authSecurityEvents.createdAt, to))!
      if (qTerm) {
      authWhere = and(
        authWhere,
        or(ilike(authSecurityEvents.eventType, qTerm), ilike(authSecurityEvents.email, qTerm), ilike(authSecurityEvents.ip, qTerm))
      )!
      }

      let promptLogWhere = gte(aiPromptLogs.id, 0)
    if (from) promptLogWhere = and(promptLogWhere, gte(aiPromptLogs.createdAt, from))!
    if (to) promptLogWhere = and(promptLogWhere, lte(aiPromptLogs.createdAt, to))!
      if (qTerm) {
      promptLogWhere = and(promptLogWhere, or(ilike(aiPromptLogs.source, qTerm), ilike(aiPromptLogs.prompt, qTerm), ilike(aiPromptLogs.status, qTerm)))!
      }

      const [leadCountRow, fabricCountRow, auditCountRow, authCountRow, promptLogCountRow] = await Promise.all([
        db.select({ total: count() }).from(leadActivityLog).where(leadWhere),
        db.select({ total: count() }).from(fabricActivityLog).where(fabricWhere),
        db.select({ total: count() }).from(auditLog).where(auditWhere),
        db.select({ total: count() }).from(authSecurityEvents).where(authWhere),
        db.select({ total: count() }).from(aiPromptLogs).where(promptLogWhere)
      ])

      const total =
        (leadCountRow[0]?.total ?? 0) +
        (fabricCountRow[0]?.total ?? 0) +
        (auditCountRow[0]?.total ?? 0) +
        (authCountRow[0]?.total ?? 0) +
        (promptLogCountRow[0]?.total ?? 0)

      const [leadRows, fabricRows, auditRows, authRows, promptLogRows] = await Promise.all([
        db
          .select({
            id: leadActivityLog.id,
            eventType: leadActivityLog.eventType,
            createdAt: leadActivityLog.createdAt,
            actorId: leadActivityLog.actorId,
            actorName: users.name,
            actorAvatarUrl: users.avatarUrl,
            leadId: leadActivityLog.leadId,
            companyName: leads.companyName
          })
          .from(leadActivityLog)
          .leftJoin(users, eq(leadActivityLog.actorId, users.id))
          .leftJoin(leads, eq(leadActivityLog.leadId, leads.id))
          .where(leadWhere)
          .orderBy(desc(leadActivityLog.id))
          .limit(fetchLimit),
        db
          .select({
            id: fabricActivityLog.id,
            eventType: fabricActivityLog.eventType,
            createdAt: fabricActivityLog.createdAt,
            actorId: fabricActivityLog.actorId,
            actorName: users.name,
            actorAvatarUrl: users.avatarUrl,
            fabricId: fabricActivityLog.fabricId,
            message: fabricActivityLog.message
          })
          .from(fabricActivityLog)
          .leftJoin(users, eq(fabricActivityLog.actorId, users.id))
          .leftJoin(fabrics, eq(fabricActivityLog.fabricId, fabrics.id))
          .where(fabricWhere)
          .orderBy(desc(fabricActivityLog.id))
          .limit(fetchLimit),
        db
          .select({
            id: auditLog.id,
            createdAt: auditLog.createdAt,
            action: auditLog.action,
            entityType: auditLog.entityType,
            entityId: auditLog.entityId,
            success: auditLog.success,
            message: auditLog.message,
            ip: auditLog.ip,
            actorId: auditLog.actorId,
            actorName: users.name,
            actorAvatarUrl: users.avatarUrl
          })
          .from(auditLog)
          .leftJoin(users, eq(auditLog.actorId, users.id))
          .where(auditWhere)
          .orderBy(desc(auditLog.createdAt))
          .limit(fetchLimit),
        db
          .select({
            id: authSecurityEvents.id,
            createdAt: authSecurityEvents.createdAt,
            eventType: authSecurityEvents.eventType,
            success: authSecurityEvents.success,
            ip: authSecurityEvents.ip,
            email: authSecurityEvents.email,
            userId: authSecurityEvents.userId,
            actorName: users.name,
            actorAvatarUrl: users.avatarUrl
          })
          .from(authSecurityEvents)
          .leftJoin(users, eq(authSecurityEvents.userId, users.id))
          .where(authWhere)
          .orderBy(desc(authSecurityEvents.createdAt))
          .limit(fetchLimit),
        db
          .select({
            id: aiPromptLogs.id,
            createdAt: aiPromptLogs.createdAt,
            source: aiPromptLogs.source,
            status: aiPromptLogs.status,
            model: aiPromptLogs.model,
            prompt: aiPromptLogs.prompt,
            errorMessage: aiPromptLogs.errorMessage,
            imageCount: aiPromptLogs.imageCount,
            videoCount: aiPromptLogs.videoCount,
            durationMs: aiPromptLogs.durationMs,
            fabricId: aiPromptLogs.fabricId,
            fabricSlug: fabrics.slug
          })
          .from(aiPromptLogs)
          .leftJoin(fabrics, eq(aiPromptLogs.fabricId, fabrics.id))
          .where(promptLogWhere)
          .orderBy(desc(aiPromptLogs.createdAt))
          .limit(fetchLimit)
      ])

      const leadEvents: AdminActivityTimelineEvent[] = leadRows.map((r) => ({
        id: r.id,
        source: 'LEAD',
        event_type: String(r.eventType),
        message: buildLeadMessage(String(r.eventType), r.companyName ?? null),
        created_at: r.createdAt.toISOString(),
        actor: toActor(r.actorId ?? null, r.actorName ?? null, r.actorAvatarUrl ?? null),
        ip: null,
        resource: { id: r.leadId, label: `Lead #${r.leadId}`, href: `/admin/leads/${r.leadId}` }
      }))

      const fabricEvents: AdminActivityTimelineEvent[] = fabricRows.map((r) => ({
        id: r.id,
        source: 'FABRIC',
        event_type: String(r.eventType),
        message: buildFabricMessage(String(r.eventType), r.message ?? null),
        created_at: r.createdAt.toISOString(),
        actor: toActor(r.actorId ?? null, r.actorName ?? null, r.actorAvatarUrl ?? null),
        ip: null,
        success: FABRIC_EVENT_META[String(r.eventType)]?.success,
        resource: { id: r.fabricId, label: `Fabric #${r.fabricId}`, href: `/admin/fabrics/${r.fabricId}` }
      }))

      const auditEvents: AdminActivityTimelineEvent[] = auditRows.map((r) => ({
        id: r.id,
        source: 'AUDIT',
        event_type: String(r.action),
        message: buildAuditMessage(String(r.action), String(r.entityType), r.entityId ?? null, r.message ?? null),
        created_at: r.createdAt.toISOString(),
        actor: toActor(r.actorId ?? null, r.actorName ?? null, r.actorAvatarUrl ?? null),
        ip: r.ip ?? null,
        success: r.success,
        resource: {
          id: r.entityId ?? null,
          label: r.entityId != null ? `${r.entityType} #${r.entityId}` : String(r.entityType)
        }
      }))

      const authEvents: AdminActivityTimelineEvent[] = authRows.map((r) => ({
        id: r.id,
        source: 'AUTH',
        event_type: String(r.eventType),
        message: buildAuthMessage(String(r.eventType), r.email ?? null),
        created_at: r.createdAt.toISOString(),
        actor: toActor(r.userId ?? null, r.actorName ?? null, r.actorAvatarUrl ?? null),
        ip: r.ip ?? null,
        success: r.success,
        resource: {
          id: r.userId ?? null,
          label: r.email ? r.email : r.userId != null ? `User #${r.userId}` : 'User'
        }
      }))

      const aiEvents: AdminActivityTimelineEvent[] = promptLogRows.map((r) => ({
        id: r.id,
        source: 'AI',
        event_type: String(r.source),
        message: [r.source.toUpperCase(), r.status === 'failed' ? 'FAILED' : 'OK', r.model, r.prompt?.slice(0, 120)].filter(Boolean).join(' · '),
        created_at: r.createdAt.toISOString(),
        actor: { id: null, name: 'AI', avatarUrl: null },
        ip: null,
        success: r.status === 'success',
        resource: r.fabricId
          ? { id: r.fabricId, label: `Fabric #${r.fabricId}`, href: r.fabricSlug ? `/fabrics/${r.fabricSlug}` : `/admin/fabrics/${r.fabricId}` }
          : undefined
      }))

      const all = [...leadEvents, ...fabricEvents, ...auditEvents, ...authEvents, ...aiEvents].sort((a, b) =>
        a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0
      )

      const events = all.slice(offset, offset + limit)

      const sidebar = await getWeeklySidebarStats({ userId: params.userId ?? null })

      return {
        events,
        meta: computePaginationMeta(page, limit, total),
        sidebar
      }
    } catch (err) {
      throw err
    }
  }
}

