import { and, count, desc, eq, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { adminRawProcessingLog } from '@/db/schema/admin-raw-processing-log.schema'
import { logger } from '@/lib/logger'
import type {
  AdminRawProcessingLogStatus,
  AdminRawProcessingLogSummary
} from '@/types/admin-raw-processing-log.types'

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : null
}

export class AdminRawProcessingLogService {
  public static async create(params: {
    uploadId: number
    rowId: number
    status?: AdminRawProcessingLogStatus
  }): Promise<number> {
    const db = getDb()

    const [record] = await db
      .insert(adminRawProcessingLog)
      .values({
        uploadId: params.uploadId,
        rowId: params.rowId,
        status: params.status ?? 'PENDING'
      })
      .returning({ id: adminRawProcessingLog.id })

    if (!record) throw new Error('Failed to create processing log')
    return record.id
  }

  public static async updateStatus(
    id: number,
    params: {
      status?: AdminRawProcessingLogStatus
      aiConfidenceScore?: string | null
      aiStatus?: string | null
      errorMessage?: string | null
      fabricId?: number | null
      retriesCount?: number
      notes?: string | null
    }
  ): Promise<void> {
    const db = getDb()

    await db
      .update(adminRawProcessingLog)
      .set({
        ...(params.status !== undefined && { status: params.status }),
        ...(params.aiConfidenceScore !== undefined && {
          aiConfidenceScore: params.aiConfidenceScore
        }),
        ...(params.aiStatus !== undefined && { aiStatus: params.aiStatus }),
        ...(params.errorMessage !== undefined && {
          errorMessage: params.errorMessage
        }),
        ...(params.fabricId !== undefined && { fabricId: params.fabricId }),
        ...(params.retriesCount !== undefined && {
          retriesCount: params.retriesCount
        }),
        ...(params.notes !== undefined && { notes: params.notes }),
        updatedAt: sql`now()`
      })
      .where(eq(adminRawProcessingLog.id, id))
  }

  public static async getByUploadId(uploadId: number) {
    const db = getDb()

    const rows = await db
      .select({
        id: adminRawProcessingLog.id,
        uploadId: adminRawProcessingLog.uploadId,
        rowId: adminRawProcessingLog.rowId,
        fabricId: adminRawProcessingLog.fabricId,
        status: adminRawProcessingLog.status,
        aiConfidenceScore: adminRawProcessingLog.aiConfidenceScore,
        aiProcessedAt: adminRawProcessingLog.aiProcessedAt,
        aiStatus: adminRawProcessingLog.aiStatus,
        errorMessage: adminRawProcessingLog.errorMessage,
        retriesCount: adminRawProcessingLog.retriesCount,
        notes: adminRawProcessingLog.notes,
        createdAt: adminRawProcessingLog.createdAt,
        updatedAt: adminRawProcessingLog.updatedAt
      })
      .from(adminRawProcessingLog)
      .where(and(eq(adminRawProcessingLog.uploadId, uploadId), isNull(adminRawProcessingLog.deletedAt)))
      .orderBy(desc(adminRawProcessingLog.createdAt))

    return rows.map((r) => AdminRawProcessingLogService.toSummary(r))
  }

  public static async getByFabricId(fabricId: number) {
    const db = getDb()

    const rows = await db
      .select({
        id: adminRawProcessingLog.id,
        uploadId: adminRawProcessingLog.uploadId,
        rowId: adminRawProcessingLog.rowId,
        fabricId: adminRawProcessingLog.fabricId,
        status: adminRawProcessingLog.status,
        aiConfidenceScore: adminRawProcessingLog.aiConfidenceScore,
        aiProcessedAt: adminRawProcessingLog.aiProcessedAt,
        aiStatus: adminRawProcessingLog.aiStatus,
        errorMessage: adminRawProcessingLog.errorMessage,
        retriesCount: adminRawProcessingLog.retriesCount,
        notes: adminRawProcessingLog.notes,
        createdAt: adminRawProcessingLog.createdAt,
        updatedAt: adminRawProcessingLog.updatedAt
      })
      .from(adminRawProcessingLog)
      .where(and(eq(adminRawProcessingLog.fabricId, fabricId), isNull(adminRawProcessingLog.deletedAt)))
      .orderBy(desc(adminRawProcessingLog.createdAt))

    return rows.map((r) => AdminRawProcessingLogService.toSummary(r))
  }

  public static async getStats(uploadId: number) {
    const db = getDb()

    const [total, completed, failed, pending] = await Promise.all([
      db
        .select({ total: count() })
        .from(adminRawProcessingLog)
        .where(and(eq(adminRawProcessingLog.uploadId, uploadId), isNull(adminRawProcessingLog.deletedAt))),
      db
        .select({ total: count() })
        .from(adminRawProcessingLog)
        .where(
          and(
            eq(adminRawProcessingLog.uploadId, uploadId),
            eq(adminRawProcessingLog.status, 'COMPLETED'),
            isNull(adminRawProcessingLog.deletedAt)
          )
        ),
      db
        .select({ total: count() })
        .from(adminRawProcessingLog)
        .where(
          and(
            eq(adminRawProcessingLog.uploadId, uploadId),
            eq(adminRawProcessingLog.status, 'FAILED'),
            isNull(adminRawProcessingLog.deletedAt)
          )
        ),
      db
        .select({ total: count() })
        .from(adminRawProcessingLog)
        .where(
          and(
            eq(adminRawProcessingLog.uploadId, uploadId),
            eq(adminRawProcessingLog.status, 'PENDING'),
            isNull(adminRawProcessingLog.deletedAt)
          )
        )
    ])

    return {
      total: total[0]?.total ?? 0,
      completed: completed[0]?.total ?? 0,
      failed: failed[0]?.total ?? 0,
      pending: pending[0]?.total ?? 0
    }
  }

  private static toSummary(r: {
    id: number
    uploadId: number
    rowId: number
    fabricId: number | null
    status: string
    aiConfidenceScore: string | null
    aiProcessedAt: Date | null
    aiStatus: string | null
    errorMessage: string | null
    retriesCount: number
    notes: string | null
    createdAt: Date
    updatedAt: Date
  }): AdminRawProcessingLogSummary {
    return {
      id: r.id,
      uploadId: r.uploadId,
      rowId: r.rowId,
      fabricId: r.fabricId,
      status: r.status as AdminRawProcessingLogStatus,
      aiConfidenceScore: r.aiConfidenceScore,
      aiProcessedAt: toIso(r.aiProcessedAt),
      aiStatus: r.aiStatus,
      errorMessage: r.errorMessage,
      retriesCount: r.retriesCount,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }
  }
}
