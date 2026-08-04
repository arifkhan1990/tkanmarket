import type { LeadStatus } from '@/types/marketplace.types'

export interface AdminDashboardFabricsStats {
  pendingAi: number
  pendingReview: number
  approved: number
  rejected: number
}

export interface AdminDashboardLeadsStats {
  byStatus: Record<LeadStatus, number>
}

export interface AdminDashboardSocialStats {
  queueTotal: number
  byStatus: Record<string, number>
}

export interface AdminDashboardCrawlerStatus {
  latestRun: { id: number; status: string; startedAt: string | null; completedAt: string | null } | null
  runningCount: number
}

export interface AdminDashboardResponse {
  fabrics: AdminDashboardFabricsStats
  leads: AdminDashboardLeadsStats
  social: AdminDashboardSocialStats
  crawler: AdminDashboardCrawlerStatus
  generatedAt: string
}

