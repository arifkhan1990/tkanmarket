import { and, count, desc, gte, inArray } from 'drizzle-orm'

import { getDb } from '@/db'
import {
  catalogExportJobs,
  catalogExportStatusEnum,
  catalogExportFormatEnum
} from '@/db/schema/catalog-export.schema'
import type {
  CatalogExportOverviewResponse,
  CatalogExportJobSummary,
  CatalogExportFormat,
  CreateCatalogExportPayload
} from '@/types/admin-catalog-export.types'

function mapRowToSummary(row: {
  id: number
  jobName: string
  format: (typeof catalogExportFormatEnum.enumValues)[number]
  status: (typeof catalogExportStatusEnum.enumValues)[number]
  recordCount: number
  estimatedSizeBytes: number
  createdAt: Date
}): CatalogExportJobSummary {
  return {
    id: row.id,
    jobName: row.jobName,
    format: row.format as CatalogExportFormat,
    status: row.status,
    recordCount: row.recordCount,
    estimatedSizeBytes: row.estimatedSizeBytes,
    createdAt: row.createdAt.toISOString()
  }
}

export class AdminCatalogExportService {
  public static async getOverview(): Promise<CatalogExportOverviewResponse> {
    const db = getDb()
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [activeRows, recentRows, metricsRows, recordsRows] = await Promise.all([
      db
        .select()
        .from(catalogExportJobs)
        .where(
          and(
            gte(catalogExportJobs.createdAt, firstOfMonth),
            inArray(catalogExportJobs.status, ['PENDING', 'RUNNING'])
          )
        )
        .orderBy(desc(catalogExportJobs.createdAt))
        .limit(1),
      db
        .select()
        .from(catalogExportJobs)
        .orderBy(desc(catalogExportJobs.createdAt))
        .limit(5),
      db
        .select({
          totalExportsThisMonth: count()
        })
        .from(catalogExportJobs)
        .where(gte(catalogExportJobs.createdAt, firstOfMonth)),
      db
        .select({
          totalRecordsThisMonth: count(catalogExportJobs.recordCount)
        })
        .from(catalogExportJobs)
        .where(gte(catalogExportJobs.createdAt, firstOfMonth))
    ])

    const activeJob = activeRows[0] ? mapRowToSummary(activeRows[0]) : null
    const recentJobs = recentRows.map(mapRowToSummary)

    const totalExportsThisMonth = metricsRows[0]?.totalExportsThisMonth ?? 0
    const totalRecordsThisMonth = recordsRows[0]?.totalRecordsThisMonth ?? 0

    const usedBytesThisMonth = recentRows.reduce(
      (acc, row) => acc + row.estimatedSizeBytes,
      0
    )

    const quotaBytes = 3 * 1024 * 1024 * 1024

    return {
      activeJob,
      recentJobs,
      metrics: {
        totalExportsThisMonth,
        totalRecordsThisMonth,
        usedBytesThisMonth,
        quotaBytes
      }
    }
  }

  public static async createExportJob(payload: CreateCatalogExportPayload): Promise<void> {
    const db = getDb()

    const safeJobName = `export_${new Date().toISOString()}_${payload.format.toLowerCase()}`

    await db.insert(catalogExportJobs).values({
      jobName: safeJobName,
      format: payload.format,
      status: 'PENDING',
      recordCount: 0,
      estimatedSizeBytes: 0
    })
  }
}

