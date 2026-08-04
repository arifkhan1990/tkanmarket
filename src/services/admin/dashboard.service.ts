import { eq, isNull } from 'drizzle-orm'
import { desc } from 'drizzle-orm'
import { count } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { leads, leadStatusEnum } from '@/db/schema/leads.schema'
import { socialPosts } from '@/db/schema/social.schema'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import type { AdminDashboardResponse, AdminDashboardLeadsStats, AdminDashboardFabricsStats } from '@/types/admin-dashboard.types'

export class AdminDashboardService {
  public static async getDashboard(): Promise<AdminDashboardResponse> {
    const db = getDb()
    const [fabricsGrouped, leadsCounts, socialCounts, latestRun, runningCount] = await Promise.all([
      db
        .select({ status: fabrics.status, count: count() })
        .from(fabrics)
        .where(isNull(fabrics.deletedAt))
        .groupBy(fabrics.status),
      db
        .select({ status: leads.status, count: count() })
        .from(leads)
        .where(isNull(leads.deletedAt))
        .groupBy(leads.status),
      db.select({ status: socialPosts.status, count: count() }).from(socialPosts).groupBy(socialPosts.status),
      db
        .select({
          id: crawlerRuns.id,
          status: crawlerRuns.status,
          startedAt: crawlerRuns.startedAt,
          completedAt: crawlerRuns.completedAt
        })
        .from(crawlerRuns)
        .orderBy(desc(crawlerRuns.id))
        .limit(1),
      db.select({ count: count() }).from(crawlerRuns).where(eq(crawlerRuns.status, 'RUNNING'))
    ])

    const fabricsStats: AdminDashboardFabricsStats = {
      pendingAi: 0,
      pendingReview: 0,
      approved: 0,
      rejected: 0
    }

    for (const row of fabricsGrouped) {
      if (row.status === 'ai_processing') fabricsStats.pendingAi = row.count
      if (row.status === 'ai_processed') fabricsStats.pendingReview = row.count
      if (row.status === 'approved') fabricsStats.approved = row.count
      if (row.status === 'rejected') fabricsStats.rejected = row.count
    }

    const leadsStats: AdminDashboardLeadsStats = {
      byStatus: {
        NEW: 0,
        CONTACTED: 0,
        QUALIFIED: 0,
        PROPOSAL_SENT: 0,
        NEGOTIATING: 0,
        CLOSED_WON: 0,
        CLOSED_LOST: 0
      }
    }

    for (const row of leadsCounts) {
      const key = row.status as keyof AdminDashboardLeadsStats['byStatus']
      leadsStats.byStatus[key] = row.count
    }

    const socialByStatus: Record<string, number> = {}
    for (const row of socialCounts) {
      socialByStatus[String(row.status)] = row.count
    }
    const queueTotal = Object.values(socialByStatus).reduce((a, b) => a + b, 0)

    const latestRunRow = latestRun[0]
      ? {
          id: latestRun[0].id,
          status: latestRun[0].status,
          startedAt: latestRun[0].startedAt ? latestRun[0].startedAt.toISOString() : null,
          completedAt: latestRun[0].completedAt ? latestRun[0].completedAt.toISOString() : null
        }
      : null

    return {
      fabrics: fabricsStats,
      leads: leadsStats,
      social: {
        queueTotal,
        byStatus: socialByStatus
      },
      crawler: {
        latestRun: latestRunRow,
        runningCount: runningCount[0]?.count ?? 0
      },
      generatedAt: new Date().toISOString()
    }
  }
}

