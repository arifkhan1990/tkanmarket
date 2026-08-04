export type InventoryFabricStatusUi = 'Healthy' | 'Reorder' | 'Watchlist' | 'Critical' | 'Urgent' | 'Stable' | 'Optimal'

export type AdminInventorySummary = {
  generatedAt: string
  totalStockValueUsd: number
  lowStockSkuCount: number
  agingInventoryPercent: number
  activeSuppliers: number
  totalSkuCount: number
  stockTurnoverProxy: number
  avgFulfillmentDaysProxy: number
  returnRatePercent: number
  globalHealthIndex: number
  readinessScore: number
  readinessDeltaPercent: number
  replenishmentNote: string
  agingBuckets: {
    days90Plus: number
    days60to90: number
    days0to60: number
  }
  stockValuationUsd: number
  avgUnitCostUsd: number
  inventoryHealthScore: number
  turnoverRate: number
  serviceLevelPercent: number
  activeAdminUsers: number
}

export type AdminInventoryMaterialBar = {
  label: string
  unitsProxy: number
  barPercent: number
}

export type AdminInventoryLowAlert = {
  fabricId: number
  title: string
  sku: string | null
  severity: 'CRITICAL' | 'URGENT' | 'ATTENTION'
  remainingNote: string
}

export type AdminInventoryRegionalRow = {
  regionKey: string
  label: string
  regionCode: string
  catalogUnits: number
  fillPercent: number
  statusNote: 'OK' | 'LOW' | 'MAINTENANCE'
}

export type AdminInventoryHubMarker = {
  topPercent: number
  leftPercent: number
  label: string
  capacityPercent: number
  status: 'ok' | 'warn'
}

export type AdminInventoryHub = {
  mapImageUrl: string
  activeLanes: number
  delayedLanes: number
  markers: AdminInventoryHubMarker[]
  utilizationSeries: { label: string; percent: number }[]
}

export type AdminInventoryTransitRow = {
  trackingCode: string
  status: string
  productNote: string
  routeNote: string
}

export type AdminInventoryFabricRow = {
  id: number
  sku: string | null
  title: string
  categoryLabel: string
  stockLevelNote: string
  thresholdNote: string
  leadTimeNote: string
  status: InventoryFabricStatusUi
  imageUrl: string | null
  warehouseNote: string | null
  turnoverNote: string | null
  thresholdFillPercent: number | null
}

export type AdminInventoryInsightsResponse = {
  summary: AdminInventorySummary
  materialDistribution: AdminInventoryMaterialBar[]
  materialDistributionChart: AdminInventoryMaterialBar[]
  lowStockAlerts: AdminInventoryLowAlert[]
  regionalRows: AdminInventoryRegionalRow[]
  hub: AdminInventoryHub
  transits: AdminInventoryTransitRow[]
}

export type AdminInventoryFabricsListResponse = {
  items: AdminInventoryFabricRow[]
  total: number
}
