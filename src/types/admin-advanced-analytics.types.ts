import type { LeadsBySourcePoint, TrafficVsConversionsPoint, TopFabricCategoriesPoint } from './admin-stats.types'

export interface AdvancedAnalyticsSparklines {
  revenue: { date: string; value: number }[]
  traffic: { date: string; value: number }[]
  conversions: { date: string; value: number }[]
  activeSuppliers: { date: string; value: number }[]
}

export interface AdvancedAnalyticsStats {
  totalRevenue: number
  revenueGrowthPercent: number | null
  conversionRate: number
  conversionRateGrowthPercent: number | null
  newLeads: number
  newLeadsGrowthPercent: number | null
  activeSuppliers: number
  activeSuppliersGrowthPercent: number | null
}

export interface AdvancedAnalyticsResponse {
  period: { from: string; to: string }
  stats: AdvancedAnalyticsStats
  trafficVsConversions: TrafficVsConversionsPoint[]
  leadsBySource: LeadsBySourcePoint[]
  topFabricCategories: TopFabricCategoriesPoint[]
  sparklines: AdvancedAnalyticsSparklines
}

