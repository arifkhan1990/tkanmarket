export interface CommissionTierRow {
  volumeLabel: string
  minUsd: number
  maxUsd: number | null
  commissionPercent: string
  activeMerchants: number
}

export interface CommissionRuleDto {
  id: number
  categoryKey: string
  categoryLabel: string
  externalRef: string | null
  baseCommissionPercent: string
  minMonthlyVolumeUsd: number
  tierMode: 'FLAT' | 'TIERED'
  health: 'HEALTHY' | 'UNDER_REVIEW' | 'PAUSED'
  isActive: boolean
  tiers: CommissionTierRow[] | null
  insightTitle: string | null
  insightBody: string | null
}

export interface CommissionRulesDashboardDto {
  rules: CommissionRuleDto[]
  projections: {
    monthlyGrossUsdLabel: string
    effectiveRatePercentLabel: string
    platformFeesUsdLabel: string
    changePercentLabel: string
    disclaimer: string
  }
}
