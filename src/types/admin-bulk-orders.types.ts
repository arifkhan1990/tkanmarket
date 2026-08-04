export type BulkOrderStatus = 'PROCESSING' | 'IN_TRANSIT' | 'DELIVERED' | 'ON_HOLD'
export type SupplierTier = 'PLATINUM' | 'GOLD' | 'SILVER' | 'STANDARD'

export interface AdminBulkOrdersQuery {
  page: number
  limit: number
  status?: BulkOrderStatus
  supplierTier?: SupplierTier
  dateFrom?: string
  dateTo?: string
  q?: string
}

export interface AdminBulkOrderRow {
  id: number
  orderReference: string
  buyerCompanyName: string
  supplierId: number
  supplierName: string
  supplierTier: SupplierTier
  totalMeters: number
  estimatedValueUsd: number | null
  status: BulkOrderStatus
  orderedAt: string
}

export interface AdminBulkOrdersMetrics {
  dailyVolumeMeters: number
  inTransitOrders: number
  flaggedOrders: number
  pendingSettlementUsd: number
}

export interface AdminBulkOrdersListResponse {
  items: AdminBulkOrderRow[]
  metrics: AdminBulkOrdersMetrics
}

export interface AdminBulkOrdersBulkUpdatePayload {
  ids: number[]
  status: BulkOrderStatus
}
