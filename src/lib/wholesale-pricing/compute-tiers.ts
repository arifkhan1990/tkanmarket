import type { WholesalePricingSimulatorParams, WholesalePricingTierRow } from '@/types/wholesale-pricing.types'

function numStr(n: number, decimals: number): string {
  return n.toFixed(decimals)
}

/** Deterministic tier ladder from simulator sliders (log-scaled volume discount). */
export function computeWholesaleTiersFromSimulator(params: WholesalePricingSimulatorParams): WholesalePricingTierRow[] {
  const base = Number(params.baseUnitCostUsd)
  const decay = Math.min(0.999, Math.max(0, Number(params.volumeDecayFactor)))
  if (!Number.isFinite(base) || base <= 0) return []

  const ranges: Array<{ label: string; min: number; max: number | null }> = [
    { label: 'Standard Sample', min: 1, max: 50 },
    { label: 'Small Batch', min: 51, max: 500 },
    { label: 'Bulk Commercial', min: 501, max: 2500 },
    { label: 'Industrial Contract', min: 2501, max: 10000 }
  ]

  return ranges.map((r, i) => {
    const mid = r.max === null ? r.min * 2 : (r.min + r.max) / 2
    const t = Math.log(1 + mid / 100) / Math.log(1 + 5000 / 100)
    const discount = decay * t * 0.42
    const price = Math.max(0.01, base * (1 - discount))
    const listRef = base * 1.12
    const discPct = listRef > 0 ? Math.max(0, Math.min(99, (1 - price / listRef) * 100)) : null
    return {
      sortOrder: i,
      label: r.label,
      minMeters: r.min,
      maxMeters: r.max,
      pricePerMeterUsd: numStr(Math.round(price * 100) / 100, 2),
      effectiveDiscountPercent: discPct === null ? null : numStr(Math.round(discPct * 10) / 10, 1)
    }
  })
}
