import type { LeadSource, LeadStatus } from '@/types/marketplace.types'

export type SupplierPerformanceRow = {
  supplierId: number
  name: string
  slug: string
  country: string
  city: string | null
  verified: boolean
  logoUrl: string | null
  fabricTotal: number
  fabricApproved: number
  qualityRatePercent: number
  inquiryTotal: number
  inquiryWon: number
  conversionPercent: number
  avgFabricViews: number
  /** Mean days to close won inquiries for this supplier (null if none). */
  avgCloseDays: number | null
  compositeScore: number
}

export type SupplierInsightsManagementKpis = {
  totalSuppliers: number
  verifiedSuppliers: number
  approvedFabrics: number
  marketplaceInquiries: number
}

export type SupplierPerformanceSnapshot = {
  globalQualityRatePercent: number
  avgInquiryToCloseDays: number | null
  responseIndex: number
  topPerformer: SupplierPerformanceRow | null
}

export type SupplierPerformanceMatrixResponse = {
  snapshot: SupplierPerformanceSnapshot
  radarSuppliers: { name: string; color: 'primary' | 'tertiary' }[]
  /** Normalized 0–100 per axis for first two radar suppliers */
  radarAxes: { label: string; a: number; b: number }[]
  rows: SupplierPerformanceRow[]
  heatmap: {
    weekLabels: string[]
    supplierLabels: string[]
    /** 0–100 intensity */
    cells: number[][]
    footnote: string
  }
  generatedAt: string
}

export type SupplierScorecardResponse = {
  variant: 'executive' | 'benchmark'
  snapshot: SupplierPerformanceSnapshot
  rows: SupplierPerformanceRow[]
  /** Five metrics 0–100 for primary supplier (first row) */
  scoreBreakdown: { label: string; value: number }[]
  generatedAt: string
}

export type SupplierPayoutStatus = 'processing' | 'completed' | 'on_hold'

export type SupplierPayoutRow = {
  id: number
  orderReference: string
  supplierId: number
  supplierName: string
  supplierSlug: string
  country: string
  city: string | null
  logoUrl: string | null
  orderValueUsd: string | null
  commissionUsd: string | null
  supplierShareUsd: string | null
  commissionPercent: number
  bulkStatus: string
  payoutStatus: SupplierPayoutStatus
  orderedAt: string
}

export type SupplierPayoutsSummary = {
  pendingUsd: string
  completedMtdUsd: string
  onHoldCount: number
  nextScheduledNote: string
  assumedCommissionPercent: number
}

export type SupplierPayoutsResponse = {
  summary: SupplierPayoutsSummary
  items: SupplierPayoutRow[]
  total: number
}

export type SupplierOnboardingStepKey = 'basic' | 'production' | 'verification' | 'catalog'

export type SupplierOnboardingStepStat = {
  key: SupplierOnboardingStepKey
  labelKey: string
  completedCount: number
}

export type SupplierOnboardingResponse = {
  steps: SupplierOnboardingStepStat[]
  averageCompletionPercent: number
  suppliersInProgress: number
}

export type SupplierInquiryListItem = {
  leadId: number
  status: LeadStatus
  source: LeadSource
  companyName: string
  contactName: string
  email: string
  inquiryText: string
  inquiryExcerpt: string
  fabricTitle: string | null
  fabricSlug: string | null
  createdAt: string
  updatedAt: string
}

export type SupplierInquiriesResponse = {
  supplier: {
    id: number
    name: string
    slug: string
    country: string
    city: string | null
    verified: boolean
  }
  items: SupplierInquiryListItem[]
  pendingCount: number
  total: number
}
