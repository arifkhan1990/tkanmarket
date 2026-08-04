import type { AdvancedAnalyticsResponse } from '@/types/admin-advanced-analytics.types'

export interface AdminSalesRecentConversionRow {
  leadId: number
  companyName: string
  fabricTitleEn: string | null
  fabricTitleRu: string | null
  fabricSku: string | null
  supplierName: string | null
  valueUsd: number
  closedAt: string
}

export type AdminSalesRepPerformanceBand = 'EXCEEDING' | 'ON_TARGET' | 'DEVELOPING'

export interface AdminSalesTopRepresentativeRow {
  userId: number
  name: string
  avatarUrl: string | null
  role: string
  regionLabel: string
  grossSalesUsd: number
  wonDeals: number
  performanceBand: AdminSalesRepPerformanceBand
}

export interface AdminSalesPerformanceResponse {
  periodDays: number
  analytics: AdvancedAnalyticsResponse
  avgLeadTimeDays: number | null
  avgLeadTimeDeltaPercent: number | null
  recentConversions: AdminSalesRecentConversionRow[]
  topRepresentatives: AdminSalesTopRepresentativeRow[]
}
