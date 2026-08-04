import { and, count, desc, eq, gte, ilike, isNull, lte, lt, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { aiPromptLogs } from '@/db/schema/ai-prompt-logs.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { users } from '@/db/schema/users.schema'
import type { AiPromptLogItem, AiPromptLogsListResponse, AiPromptLogsStats } from '@/types/ai-prompt-logs-admin.types'

export class AiPromptLogsAdminService {
  public static async list(params: {
    page: number
    limit: number
    source?: string | null
    model?: string | null
    status?: string | null
    from?: string | null
    to?: string | null
    q?: string | null
  }): Promise<AiPromptLogsListResponse> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const conditions = [isNull(aiPromptLogs.deletedAt)]

    if (params.source && params.source.trim().length > 0) {
      conditions.push(eq(aiPromptLogs.source, params.source.trim()))
    }
    if (params.model && params.model.trim().length > 0) {
      conditions.push(eq(aiPromptLogs.model, params.model.trim()))
    }
    if (params.status && params.status.trim().length > 0) {
      conditions.push(eq(aiPromptLogs.status, params.status.trim()))
    }
    if (params.from) {
      const d = new Date(params.from)
      if (!Number.isNaN(d.getTime())) conditions.push(gte(aiPromptLogs.createdAt, d))
    }
    if (params.to) {
      const d = new Date(params.to)
      if (!Number.isNaN(d.getTime())) conditions.push(lte(aiPromptLogs.createdAt, d))
    }
    if (params.q && params.q.trim().length > 0) {
      const term = `%${params.q.trim()}%`
      conditions.push(
        or(
          ilike(aiPromptLogs.prompt, term),
          ilike(aiPromptLogs.responseText, term),
          ilike(aiPromptLogs.model, term),
          ilike(aiPromptLogs.source, term)
        )!
      )
    }

    const whereClause = and(...conditions)

    const [totalRow, rows] = await Promise.all([
      db.select({ total: count() }).from(aiPromptLogs).where(whereClause),
      db
        .select({
          id: aiPromptLogs.id,
          source: aiPromptLogs.source,
          fabricId: aiPromptLogs.fabricId,
          fabricTitle: fabrics.titleEn,
          actorId: aiPromptLogs.actorId,
          actorName: users.name,
          actorEmail: users.email,
          model: aiPromptLogs.model,
          prompt: aiPromptLogs.prompt,
          systemPrompt: aiPromptLogs.systemPrompt,
          responseText: aiPromptLogs.responseText,
          imageCount: aiPromptLogs.imageCount,
          videoCount: aiPromptLogs.videoCount,
          promptTokenCount: aiPromptLogs.promptTokenCount,
          candidatesTokenCount: aiPromptLogs.candidatesTokenCount,
          totalTokenCount: aiPromptLogs.totalTokenCount,
          costUsd: aiPromptLogs.costUsd,
          status: aiPromptLogs.status,
          errorMessage: aiPromptLogs.errorMessage,
          durationMs: aiPromptLogs.durationMs,
          createdAt: aiPromptLogs.createdAt
        })
        .from(aiPromptLogs)
        .leftJoin(fabrics, eq(aiPromptLogs.fabricId, fabrics.id))
        .leftJoin(users, eq(aiPromptLogs.actorId, users.id))
        .where(whereClause)
        .orderBy(desc(aiPromptLogs.createdAt))
        .limit(params.limit)
        .offset(offset)
    ])

    const total = totalRow[0]?.total ?? 0
    const items: AiPromptLogItem[] = rows.map((r) => ({
      id: r.id,
      source: r.source,
      fabric_id: r.fabricId ?? null,
      fabric_title: r.fabricTitle ?? null,
      actor_id: r.actorId ?? null,
      actor_name: r.actorName ?? null,
      actor_email: r.actorEmail ?? null,
      model: r.model,
      prompt: r.prompt,
      system_prompt: r.systemPrompt ?? null,
      response_text: r.responseText ?? null,
      image_count: r.imageCount ?? null,
      video_count: r.videoCount ?? null,
      prompt_token_count: r.promptTokenCount ?? null,
      candidates_token_count: r.candidatesTokenCount ?? null,
      total_token_count: r.totalTokenCount ?? null,
      cost_usd: r.costUsd ? String(r.costUsd) : null,
      status: r.status,
      error_message: r.errorMessage ?? null,
      duration_ms: r.durationMs ?? null,
      created_at: r.createdAt.toISOString()
    }))

    return {
      items,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.limit))
      }
    }
  }

  public static async getById(id: number): Promise<AiPromptLogItem | null> {
    const db = getDb()
    const rows = await db
      .select({
        id: aiPromptLogs.id,
        source: aiPromptLogs.source,
        fabricId: aiPromptLogs.fabricId,
        fabricTitle: fabrics.titleEn,
        actorId: aiPromptLogs.actorId,
        actorName: users.name,
        actorEmail: users.email,
        model: aiPromptLogs.model,
        prompt: aiPromptLogs.prompt,
        systemPrompt: aiPromptLogs.systemPrompt,
        responseText: aiPromptLogs.responseText,
        imageCount: aiPromptLogs.imageCount,
        videoCount: aiPromptLogs.videoCount,
        promptTokenCount: aiPromptLogs.promptTokenCount,
        candidatesTokenCount: aiPromptLogs.candidatesTokenCount,
        totalTokenCount: aiPromptLogs.totalTokenCount,
        costUsd: aiPromptLogs.costUsd,
        status: aiPromptLogs.status,
        errorMessage: aiPromptLogs.errorMessage,
        durationMs: aiPromptLogs.durationMs,
        createdAt: aiPromptLogs.createdAt
      })
      .from(aiPromptLogs)
      .leftJoin(fabrics, eq(aiPromptLogs.fabricId, fabrics.id))
      .leftJoin(users, eq(aiPromptLogs.actorId, users.id))
      .where(and(eq(aiPromptLogs.id, id), isNull(aiPromptLogs.deletedAt)))
      .limit(1)

    const r = rows[0]
    if (!r) return null

    return {
      id: r.id,
      source: r.source,
      fabric_id: r.fabricId ?? null,
      fabric_title: r.fabricTitle ?? null,
      actor_id: r.actorId ?? null,
      actor_name: r.actorName ?? null,
      actor_email: r.actorEmail ?? null,
      model: r.model,
      prompt: r.prompt,
      system_prompt: r.systemPrompt ?? null,
      response_text: r.responseText ?? null,
      image_count: r.imageCount ?? null,
      video_count: r.videoCount ?? null,
      prompt_token_count: r.promptTokenCount ?? null,
      candidates_token_count: r.candidatesTokenCount ?? null,
      total_token_count: r.totalTokenCount ?? null,
      cost_usd: r.costUsd ? String(r.costUsd) : null,
      status: r.status,
      error_message: r.errorMessage ?? null,
      duration_ms: r.durationMs ?? null,
      created_at: r.createdAt.toISOString()
    }
  }

  public static async getStats(): Promise<AiPromptLogsStats> {
    const db = getDb()
    const [statsRow, successRow] = await Promise.all([
      db
        .select({
          totalPrompts: count(),
          totalTokens: sql<number>`coalesce(sum(${aiPromptLogs.totalTokenCount}), 0)`,
          totalInputTokens: sql<number>`coalesce(sum(${aiPromptLogs.promptTokenCount}), 0)`,
          totalOutputTokens: sql<number>`coalesce(sum(${aiPromptLogs.candidatesTokenCount}), 0)`,
          totalCost: sql<string>`coalesce(sum(${aiPromptLogs.costUsd}), 0)`,
          avgDuration: sql<number>`coalesce(avg(${aiPromptLogs.durationMs}), 0)`
        })
        .from(aiPromptLogs)
        .where(isNull(aiPromptLogs.deletedAt)),
      db
        .select({
          successCount: count()
        })
        .from(aiPromptLogs)
        .where(and(isNull(aiPromptLogs.deletedAt), eq(aiPromptLogs.status, 'success')))
    ])

    const totalPrompts = Number(statsRow[0]?.totalPrompts ?? 0)
    const totalTokens = Number(statsRow[0]?.totalTokens ?? 0)
    const totalInputTokens = Number(statsRow[0]?.totalInputTokens ?? 0)
    const totalOutputTokens = Number(statsRow[0]?.totalOutputTokens ?? 0)
    const totalCostUsd = Number(statsRow[0]?.totalCost ?? 0)
    const avgDurationMs = Number(statsRow[0]?.avgDuration ?? 0)
    const successCount = Number(successRow[0]?.successCount ?? 0)

    const successRatePct = totalPrompts === 0 ? 0 : (successCount / totalPrompts) * 100

    return {
      total_prompts: totalPrompts,
      total_tokens: totalTokens,
      total_input_tokens: totalInputTokens,
      total_output_tokens: totalOutputTokens,
      total_cost_usd: totalCostUsd,
      avg_duration_ms: Math.round(avgDurationMs),
      success_rate_pct: Number(successRatePct.toFixed(1))
    }
  }
}
