import type { LeadSource, LeadStatus } from '@/types/marketplace.types'

export type AdminSupplierDetail = {
  id: number
  name: string
  slug: string
  country: string
  city: string | null
  province: string | null
  description: string | null
  logoUrl: string | null
  websiteUrl: string | null
  verified: boolean
  establishedYear: number | null
  sourceUrl: string | null
  createdAt: string
  updatedAt: string
}

export type SupplierAnalyticsOverview = {
  periodLabel: string
  totalSuppliers: number
  verifiedSuppliers: number
  pendingVerification: number
  totalApprovedFabrics: number
  avgFabricsPerSupplier: number
  suppliersTrendPct: number | null
  fabricsTrendPct: number | null
  leadsLast30Days: number
  leadsPrev30Days: number
  leadsTrendPct: number | null
}

export type LeadStatusBucket = {
  status: LeadStatus
  count: number
}

export type SupplierAnalyticsFunnel = {
  totalLeads: number
  byStatus: LeadStatusBucket[]
}

export type CategoryShareRow = {
  categorySlug: string
  count: number
}

export type SupplierLeaderboardRow = {
  rank: number
  supplierId: number
  name: string
  slug: string
  logoUrl: string | null
  approvedFabrics: number
  avgSocialScore: number | null
  verified: boolean
}

export type SupplierAnalyticsPayload = {
  overview: SupplierAnalyticsOverview
  funnel: SupplierAnalyticsFunnel
  categoryShare: CategoryShareRow[]
  leaderboard: SupplierLeaderboardRow[]
}

export type ComplianceQueueRow = {
  supplierId: number
  name: string
  slug: string
  logoUrl: string | null
  country: string
  city: string | null
  updatedAt: string
}

export type ComplianceVerifiedRow = {
  supplierId: number
  name: string
  slug: string
  logoUrl: string | null
  country: string
  updatedAt: string
}

export type SupplierCompliancePayload = {
  pendingCount: number
  verifiedCount: number
  queue: ComplianceQueueRow[]
  recentlyVerified: ComplianceVerifiedRow[]
}

export type SupplierInquiryRow = {
  leadId: number
  status: LeadStatus
  source: LeadSource
  companyName: string
  contactName: string
  email: string
  fabricTitle: string | null
  fabricSlug: string | null
  inquiryPreview: string
  createdAt: string
}
