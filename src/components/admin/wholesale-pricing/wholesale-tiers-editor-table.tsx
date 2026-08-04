'use client'

import { Plus } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { interpolate } from '@/lib/i18n/interpolate'
import type { WholesalePricingTierRow } from '@/types/wholesale-pricing.types'

import type { WholesaleTiersWorkspaceCopy } from '@/types/wholesale-tiers-workspace.types'

type TierTableCopy = Pick<
  WholesaleTiersWorkspaceCopy,
  | 'tierTableTitle'
  | 'tiersAddTier'
  | 'tierDefaultLabel'
  | 'tiersColIndex'
  | 'tiersColLabel'
  | 'tiersColMinM'
  | 'tiersColMaxM'
  | 'tiersColPricePerM'
  | 'tiersColDiscountPct'
  | 'tiersMaxUnlimited'
>

export function WholesaleTiersEditorTable(props: {
  tiers: WholesalePricingTierRow[]
  setTiers: Dispatch<SetStateAction<WholesalePricingTierRow[]>>
  fabric: { price_usd: string | null } | null
  p: TierTableCopy
}) {
  const { tiers, setTiers, fabric, p } = props

  return (
    <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm">
      <div className="flex flex-col gap-4 border-b border-outline/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <h3 className="font-headline text-lg font-bold">{p.tierTableTitle}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() =>
            setTiers((prev) => [
              ...prev,
              {
                sortOrder: prev.length,
                label: interpolate(p.tierDefaultLabel, { n: prev.length + 1 }),
                minMeters: 0,
                maxMeters: null,
                pricePerMeterUsd: fabric?.price_usd ?? '0',
                effectiveDiscountPercent: null
              }
            ])
          }
        >
          <Plus className="mr-1 h-4 w-4" />
          {p.tiersAddTier}
        </Button>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              <th className="px-2 py-2">{p.tiersColIndex}</th>
              <th className="px-2 py-2">{p.tiersColLabel}</th>
              <th className="px-2 py-2">{p.tiersColMinM}</th>
              <th className="px-2 py-2">{p.tiersColMaxM}</th>
              <th className="px-2 py-2">{p.tiersColPricePerM}</th>
              <th className="px-2 py-2">{p.tiersColDiscountPct}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {tiers.map((t, i) => (
              <tr key={i} className="hover:bg-surface-container-low/50">
                <td className="px-2 py-3 font-mono">{i + 1}</td>
                <td className="px-2 py-3">
                  <Input
                    value={t.label}
                    onChange={(e) =>
                      setTiers((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                    }
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="number"
                    value={t.minMeters}
                    onChange={(e) =>
                      setTiers((prev) => prev.map((x, j) => (j === i ? { ...x, minMeters: Number(e.target.value) } : x)))
                    }
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="number"
                    value={t.maxMeters ?? ''}
                    placeholder={p.tiersMaxUnlimited}
                    onChange={(e) =>
                      setTiers((prev) =>
                        prev.map((x, j) =>
                          j === i
                            ? {
                                ...x,
                                maxMeters: e.target.value === '' ? null : Number(e.target.value)
                              }
                            : x
                        )
                      )
                    }
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-3">
                  <Input
                    value={t.pricePerMeterUsd}
                    onChange={(e) =>
                      setTiers((prev) => prev.map((x, j) => (j === i ? { ...x, pricePerMeterUsd: e.target.value } : x)))
                    }
                    className="h-9 font-mono"
                  />
                </td>
                <td className="px-2 py-3">
                  <Input
                    value={t.effectiveDiscountPercent ?? ''}
                    onChange={(e) =>
                      setTiers((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, effectiveDiscountPercent: e.target.value || null } : x))
                      )
                    }
                    className="h-9"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
