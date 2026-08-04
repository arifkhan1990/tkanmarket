export type ShippingCarrierCode = 'dhl_express' | 'fedex_priority' | 'maersk_ocean'

export interface ShippingRateLineItem {
  label: string
  unit_rate_label: string
  quantity_label: string
  amount_usd: number
}

export interface ShippingCarrierQuote {
  code: ShippingCarrierCode
  label: string
  mode_label: string
  total_usd: number
  eta_days_min: number
  eta_days_max: number
  is_best_value: boolean
  breakdown: ShippingRateLineItem[]
}

export interface ShippingRateCalculateResult {
  route_label: string
  chargeable_weight_kg: number
  fuel_surcharge_percent: number
  carriers: ShippingCarrierQuote[]
}
