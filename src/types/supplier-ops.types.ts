export type SupplierReviewStatus = 'PENDING' | 'APPROVED' | 'FLAGGED' | 'REJECTED'

export type SupplierPayoutStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'PAID'

export type SupplierVerificationCaseStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'

export type VerificationChecklistItemState = 'completed' | 'processing' | 'pending' | 'error'

export interface VerificationChecklistItem {
  id: string
  title: string
  detail: string
  state: VerificationChecklistItemState
}

export type VerificationMessageRole = 'supplier' | 'admin'

export interface VerificationThreadMessage {
  role: VerificationMessageRole
  body: string
  at: string
}

export interface SupplierReviewAdminDto {
  id: number
  supplierId: number
  supplierName: string
  supplierSlug: string
  fabricId: number | null
  reviewerDisplayName: string
  reviewerBadge: string | null
  isAnonymous: boolean
  rating: number
  body: string
  skuSnapshot: string | null
  status: SupplierReviewStatus
  flagReason: string | null
  createdAt: string
  updatedAt: string
}

export interface SupplierReviewModerationStatsDto {
  totalReviews: number
  pendingCount: number
  flaggedCount: number
  averageRating: number | null
}

export interface SupplierVerificationCaseListItemDto {
  id: number
  supplierId: number
  supplierName: string
  referenceCode: string
  headline: string
  status: SupplierVerificationCaseStatus
  complianceScore: number
  updatedAt: string
}

export interface SupplierVerificationCaseDetailDto {
  id: number
  supplierId: number
  supplierName: string
  supplierSlug: string
  referenceCode: string
  headline: string
  summary: string
  complianceScore: number
  laborPct: number
  envPct: number
  supplyPct: number
  fiscalPct: number
  status: SupplierVerificationCaseStatus
  checklist: VerificationChecklistItem[]
  messages: VerificationThreadMessage[]
  facilityPhotoUrls: string[]
  internalNote: string | null
  createdAt: string
  updatedAt: string
}

export interface SupplierPayoutRequestDto {
  id: number
  supplierId: number
  supplierName: string
  supplierSlug: string
  requestedAmount: string
  balanceSnapshot: string
  bankLabel: string
  accountMask: string
  swiftCode: string | null
  status: SupplierPayoutStatus
  resolutionNote: string | null
  processedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SupplierPayoutLedgerItemDto {
  id: number
  kind: 'payout' | 'rejected'
  referenceLabel: string
  supplierName: string
  amount: string
  statusLabel: string
  occurredAt: string
}

export interface SupplierPayoutSummaryDto {
  totalPendingAmount: string
  ledger: SupplierPayoutLedgerItemDto[]
}

export type SystemAlertAccent = 'error' | 'tertiary' | 'primary' | 'secondary'

export interface SystemAlertMonitorDto {
  id: number
  monitorKey: string
  title: string
  description: string
  enabled: boolean
  thresholdInt: number | null
  accent: string
  sortOrder: number
}

export interface SystemAlertChannelDto {
  id: number
  channelKey: string
  label: string
  subtitle: string
  enabled: boolean
}

export interface SystemAlertPerformanceLogDto {
  id: number
  monitorKey: string
  label: string
  workerHint: string
  avgLoadMs: number
  status: string
  lastTriggeredAt: string
}

export interface SystemAlertConfigBundleDto {
  monitors: SystemAlertMonitorDto[]
  channels: SystemAlertChannelDto[]
  logs: SystemAlertPerformanceLogDto[]
}
