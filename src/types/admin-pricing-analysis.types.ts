export type PricingRiskLevel = 'Stable' | 'Volatile' | 'Critical'

export interface PricingAnalysisFabricRow {
  id: number
  sku: string | null
  title: string
  supplierName: string | null
  price_usd: number | null
  moq: number | null
  estimated_margin_percent: number | null
  risk: PricingRiskLevel
}

export interface PricingAnalysisChartPoint {
  month_label: string
  avg_price_usd: number | null
}

/** Discriminator for optimization signals — frontend localizes via templates. */
export type PricingOptimizationKind =
  | 'CRITICAL_SKU'
  | 'VOLATILE_SHARE'
  | 'HIGH_MARGIN_SKU'
  | 'PRICE_DRIFT_UP'
  | 'PRICE_DRIFT_DOWN'
  | 'NO_PRICED_FABRICS'

export interface PricingAnalysisOptimizationItem {
  id: string
  tag: 'SUPPLY_CHAIN' | 'MARKET_RISK' | 'OPPORTUNITY'
  kind: PricingOptimizationKind
  /**
   * Plain string params used to interpolate localized templates on the client.
   * Numbers are pre-formatted (rounded to whole or one-decimal as appropriate).
   */
  params: Record<string, string | number>
  created_at: string
}

export interface PricingAnalysisRiskDistribution {
  stable: number
  volatile: number
  critical: number
  total: number
}

export interface PricingAnalysisMarketHealth {
  /** Heuristic days proxy from catalog engagement (not accounting data). */
  inventory_turn_proxy_days: number
  avg_listing_views: number
}

export interface PricingAnalysisResponse {
  chart_points: PricingAnalysisChartPoint[]
  /** Top fabric category slugs from approved catalog (real data, not hardcoded). */
  series_tags: string[]
  fabrics: PricingAnalysisFabricRow[]
  assumed_commission_percent: number
  simulator: {
    projected_gross_profit_usd: number
    /** Computed from chart_points trend (first half vs second half). null if insufficient data. */
    projected_delta_percent: number | null
  }
  risk_distribution: PricingAnalysisRiskDistribution
  optimizations: PricingAnalysisOptimizationItem[]
  market_health: PricingAnalysisMarketHealth
  generated_at: string
}
