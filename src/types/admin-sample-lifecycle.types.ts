import type { LeadStatus } from '@/types/marketplace.types'

export type SampleLifecycleStageUi =
  | 'REQUESTED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'DELAYED'
  | 'CLOSED'

export interface AdminSampleLifecycleRow {
  leadId: number
  swatchTitle: string
  sku: string | null
  imageUrl: string | null
  buyerCompany: string
  projectHint: string
  stage: SampleLifecycleStageUi
  leadStatus: LeadStatus
  trackingCode: string | null
  courierName: string | null
  logisticsHint: string | null
  feedbackHint: string | null
  updatedAt: string
}

export interface AdminSampleLifecycleStats {
  requested: number
  inTransit: number
  delivered: number
  delayed: number
  successRatePercent: number
}

export interface AdminSampleLifecycleResponse {
  stats: AdminSampleLifecycleStats
  items: AdminSampleLifecycleRow[]
}
