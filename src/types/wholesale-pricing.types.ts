export interface WholesalePricingTierRow {
  sortOrder: number
  label: string
  minMeters: number
  maxMeters: number | null
  pricePerMeterUsd: string
  effectiveDiscountPercent: string | null
}

export interface WholesalePricingSimulatorParams {
  baseUnitCostUsd: string
  minTargetMarginPercent: string
  volumeDecayFactor: string
}

export interface WholesalePricingProfileDto {
  id: number
  fabric_id: number
  tiers: WholesalePricingTierRow[]
  simulator: WholesalePricingSimulatorParams | null
  updated_at: string
}

export interface WholesalePricingFabricListItem {
  fabric_id: number
  sku: string | null
  title: string
  supplier_id: number
  supplier_name: string
  price_usd: string | null
  moq: number | null
  has_profile: boolean
}

export interface WholesalePricingFabricListResponse {
  items: WholesalePricingFabricListItem[]
}
