'use client'

import type { WholesalePricingTierRow } from '@/types/wholesale-pricing.types'

export function WholesaleTiersMarginChart(props: {
  tiers: WholesalePricingTierRow[]
  maxPrice: number
  marginChartTitle: string
  listPageSubtitle: string
}) {
  const { tiers, maxPrice, marginChartTitle, listPageSubtitle } = props

  return (
    <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="font-headline text-xl font-bold text-on-surface">{marginChartTitle}</h3>
          <p className="text-sm text-on-surface-variant">{listPageSubtitle}</p>
        </div>
      </div>
      <div className="flex h-56 items-end gap-1 px-2">
        {tiers.map((t, i) => {
          const h = (Number(t.pricePerMeterUsd) / maxPrice) * 100
          return (
            <div
              key={i}
              className="group relative flex-1 rounded-t-md bg-primary/20 transition-colors hover:bg-primary/30"
              style={{ height: `${Math.max(8, h)}%` }}
              title={`$${t.pricePerMeterUsd}/m`}
            >
              <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-on-surface px-1.5 py-0.5 font-mono text-[10px] text-background opacity-0 transition-opacity group-hover:opacity-100">
                ${t.pricePerMeterUsd}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
