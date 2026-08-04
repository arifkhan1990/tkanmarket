export type LogisticsCarrierHealth = 'OPERATIONAL' | 'DELAYED' | 'MAINTENANCE'
export type LogisticsCarrierServiceType = 'EXPRESS' | 'ECONOMY' | 'FREIGHT'

export interface AdminLogisticsCarrierLaneTag {
  laneCode: string
}

export interface AdminLogisticsCarrierRow {
  id: number
  name: string
  carrierCode: string
  logoUrl: string | null
  regionTag: string | null
  serviceType: LogisticsCarrierServiceType
  health: LogisticsCarrierHealth
  avgTransitDays: number
  reliabilityPercent: number
  laneTags: AdminLogisticsCarrierLaneTag[]
}

export interface AdminLogisticsCarriersResponse {
  items: AdminLogisticsCarrierRow[]
}

export interface AdminLogisticsCarrierStats {
  activeCarriers: number
  globalHealthPercent: number
  avgTransitDays: number
  activeLanes: number
}

export interface AdminLogisticsCarriersOverviewResponse {
  stats: AdminLogisticsCarrierStats
  items: AdminLogisticsCarrierRow[]
}

export interface AdminLogisticsCarriersQuery {
  page: number
  limit: number
  region?: string
  serviceType?: LogisticsCarrierServiceType
  health?: LogisticsCarrierHealth
  q?: string
}

