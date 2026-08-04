export type LogisticsCourierMode = 'AIR' | 'ROAD' | 'SEA' | 'RAIL'

export type LogisticsShipmentStatus = 'IN_TRANSIT' | 'DELAYED' | 'CUSTOMS_HOLD' | 'DELIVERED'

export type AdminLogisticsShipmentRow = {
  id: number
  trackingCode: string
  originCity: string
  originCountry: string
  supplierName: string
  courierName: string
  courierMode: LogisticsCourierMode
  estimatedDeliveryAt: string | null
  deliveryStatusNote: string | null
  status: LogisticsShipmentStatus
}

export type AdminLogisticsShipmentsOverview = {
  onTimePercent: number
  onTimeDeltaPercent: number
  totalShipments: number
  domesticSharePercent: number
  globalSharePercent: number
  corridorLabel: string | null
  activeCorridorTrucks: number | null
  mapImageUrl: string
}

export type AdminLogisticsShipmentsListResponse = {
  overview: AdminLogisticsShipmentsOverview
  items: AdminLogisticsShipmentRow[]
}

export type AdminLogisticsShipmentsQuery = {
  page: number
  limit: number
  status?: LogisticsShipmentStatus | 'ALL'
}
