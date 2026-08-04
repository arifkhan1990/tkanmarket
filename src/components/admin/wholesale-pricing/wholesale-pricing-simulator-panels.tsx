'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Loader2, Save, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useWholesalePricingProfile, useWholesalePricingSaveMutation } from '@/hooks/admin/useWholesalePricingAdmin'
import { computeWholesaleTiersFromSimulator } from '@/lib/wholesale-pricing/compute-tiers'
import { cn } from '@/lib/utils'
import type { Messages } from '@/lib/i18n/get-messages'
import type { WholesalePricingProfileDto, WholesalePricingSimulatorParams } from '@/types/wholesale-pricing.types'

function estMarginPercent(tierIndex: number, minMargin: number, decay: number): number {
  const m = minMargin + (1 - decay) * 10 - tierIndex * 7
  return Math.max(4, Math.min(92, m))
}

function tierStatus(m: number): 'healthy' | 'competitive' | 'low' {
  if (m >= 25) return 'healthy'
  if (m >= 14) return 'competitive'
  return 'low'
}

export type WholesalePricingMsg = Messages['admin']['wholesalePricing']

export function WholesalePricingSimulatorPanels(props: {
  fabricId: number | null
  profile: WholesalePricingProfileDto | null
  fabric: NonNullable<ReturnType<typeof useWholesalePricingProfile>['data']>['fabric'] | null
  p: WholesalePricingMsg
  save: ReturnType<typeof useWholesalePricingSaveMutation>
}) {
  const { fabricId, profile, fabric, p, save } = props

  const profileMatches = fabric != null && fabricId != null && fabric.id === fabricId

  const derivedBase = useMemo(() => {
    if (!fabricId || !profileMatches) return 42.5
    if (profile?.simulator) return Number(profile.simulator.baseUnitCostUsd)
    if (fabric?.price_usd) {
      const px = Number(fabric.price_usd)
      if (Number.isFinite(px) && px > 0) return px
    }
    return 42.5
  }, [fabric, fabricId, profile, profileMatches])

  const derivedMinMargin = useMemo(() => {
    if (!fabricId || !profileMatches) return 18.5
    if (profile?.simulator) return Number(profile.simulator.minTargetMarginPercent)
    return 18.5
  }, [fabricId, profile, profileMatches])

  const derivedDecay = useMemo(() => {
    if (!fabricId || !profileMatches) return 0.92
    if (profile?.simulator) return Number(profile.simulator.volumeDecayFactor)
    return 0.92
  }, [fabricId, profile, profileMatches])

  const [baseOverride, setBaseOverride] = useState<number | null>(null)
  const [minOverride, setMinOverride] = useState<number | null>(null)
  const [decayOverride, setDecayOverride] = useState<number | null>(null)

  const base = baseOverride ?? derivedBase
  const minMargin = minOverride ?? derivedMinMargin
  const decay = decayOverride ?? derivedDecay

  const simParams: WholesalePricingSimulatorParams = useMemo(
    () => ({
      baseUnitCostUsd: String(base),
      minTargetMarginPercent: String(minMargin),
      volumeDecayFactor: String(decay)
    }),
    [base, decay, minMargin]
  )

  const tiers = useMemo(() => computeWholesaleTiersFromSimulator(simParams), [simParams])

  const annualModel = useMemo(() => {
    const midVol = 2500
    const avg =
      tiers.length > 0
        ? tiers.reduce((acc, t) => acc + Number(t.pricePerMeterUsd), 0) / tiers.length
        : base
    return Math.round(avg * midVol * 12 * 0.15)
  }, [base, tiers])

  const img = fabric?.images?.[0]

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <h3 className="mb-6 flex items-center gap-2 font-headline text-xl font-bold text-on-surface">
              <SlidersHorizontal className="h-5 w-5 text-primary" aria-hidden />
              {p.controlParams}
            </h3>
            <div className="space-y-8">
              <div>
                <div className="mb-2 flex justify-between text-sm font-semibold text-on-surface-variant">
                  <span>{p.baseUnitCost}</span>
                  <span className="font-mono text-primary">${base.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={0.5}
                  value={base}
                  onChange={(e) => setBaseOverride(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm font-semibold text-on-surface-variant">
                  <span>{p.minTargetMargin}</span>
                  <span className="font-mono text-primary">{minMargin.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={45}
                  step={0.5}
                  value={minMargin}
                  onChange={(e) => setMinOverride(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm font-semibold text-on-surface-variant">
                  <span>{p.volumeDecay}</span>
                  <span className="font-mono text-primary">{decay.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(decay * 100)}
                  onChange={(e) => setDecayOverride(Number(e.target.value) / 100)}
                  className="w-full accent-primary"
                />
              </div>
            </div>
            <div className="mt-8 space-y-2 rounded-xl bg-surface-container-low p-4">
              <p className="text-xs italic text-on-surface-variant">{p.modelHint}</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round(((base / 120) * 0.4 + (minMargin / 45) * 0.35 + decay * 0.25) * 100))}%`
                  }}
                />
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-on-primary shadow-xl">
            <p className="text-sm opacity-90">{p.projectedAnnual}</p>
            <p className="font-mono text-3xl font-bold">${(annualModel / 1_000_000).toFixed(2)}M</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setBaseOverride(null)
                setMinOverride(null)
                setDecayOverride(null)
              }}
            >
              {p.resetParams}
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-gradient-to-br from-primary to-primary/90 font-semibold shadow-lg shadow-primary/20"
              disabled={!fabricId || save.isPending}
              onClick={() => {
                if (!fabricId) return
                save.mutate({
                  fabricId,
                  tiers,
                  simulator: simParams,
                  recompute_from_simulator: true
                })
              }}
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {p.publishCurve}
            </Button>
          </div>
        </section>

        <section className="space-y-6 lg:col-span-8">
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <div className="min-h-[280px]">
              <div className="mb-4 flex justify-between">
                <div>
                  <h3 className="font-headline text-xl font-bold text-on-surface">{p.chartTitle}</h3>
                  <p className="text-sm text-on-surface-variant">{p.chartSubtitle}</p>
                </div>
              </div>
              <svg viewBox="0 0 800 220" className="h-56 w-full" preserveAspectRatio="none" aria-hidden>
                <line x1="0" y1="0" x2="800" y2="0" stroke="currentColor" className="text-outline/30" strokeDasharray="4" />
                <line x1="0" y1="55" x2="800" y2="55" stroke="currentColor" className="text-outline/30" strokeDasharray="4" />
                <line x1="0" y1="110" x2="800" y2="110" stroke="currentColor" className="text-outline/30" strokeDasharray="4" />
                <line x1="0" y1="165" x2="800" y2="165" stroke="currentColor" className="text-outline/30" strokeDasharray="4" />
                <path
                  d="M0,50 Q200,70 400,120 T800,175 L800,220 L0,220 Z"
                  fill="currentColor"
                  className="text-primary/15"
                />
                <path
                  d="M0,50 Q200,70 400,120 T800,175"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="4"
                />
                <path
                  d="M0,130 Q250,120 500,135 T800,100"
                  fill="none"
                  stroke="currentColor"
                  className="text-secondary"
                  strokeWidth="2"
                  strokeDasharray="6"
                />
              </svg>
              <div className="mt-2 flex justify-between px-1 font-mono text-[10px] text-on-surface-variant">
                <span>0</span>
                <span>500</span>
                <span>1.5k</span>
                <span>5k</span>
                <span>10k+ m</span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline/10 px-6 py-4">
              <h3 className="font-headline text-lg font-bold text-on-surface">{p.tierTableTitle}</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container-low">
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{p.tierColDesc}</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{p.tierColQty}</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{p.tierColPrice}</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{p.tierColMargin}</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{p.tierColStatus}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tierRow, i) => {
                  const m = estMarginPercent(i, minMargin, decay)
                  const st = tierStatus(m)
                  return (
                    <TableRow key={tierRow.sortOrder} className="hover:bg-surface-container-low/60">
                      <TableCell className="font-semibold">{tierRow.label}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {tierRow.minMeters} – {tierRow.maxMeters === null ? '∞' : tierRow.maxMeters}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-primary">${tierRow.pricePerMeterUsd}</TableCell>
                      <TableCell>{m.toFixed(1)}%</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight',
                            st === 'healthy' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
                            st === 'competitive' && 'bg-primary/15 text-primary',
                            st === 'low' && 'bg-destructive/15 text-destructive'
                          )}
                        >
                          {st === 'healthy'
                            ? p.tierStatusHealthy
                            : st === 'competitive'
                              ? p.tierStatusCompetitive
                              : p.tierStatusLow}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {fabric ? (
            <div className="flex flex-col gap-6 rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm md:flex-row md:items-center">
              {img ? (
                <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-xl md:h-40 md:w-48">
                  <Image src={img} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 200px" />
                </div>
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-xl bg-surface-container-high md:h-40 md:w-48">
                  <span className="text-sm text-on-surface-variant">—</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap gap-2">
                  {fabric.sku ? (
                    <span className="rounded bg-surface-container-high px-2 py-0.5 font-mono text-xs uppercase">SKU: {fabric.sku}</span>
                  ) : null}
                </div>
                <h4 className="font-headline text-xl font-bold text-on-surface">{fabric.title}</h4>
                <p className="mt-2 text-sm text-on-surface-variant">{p.fabricContext}</p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  )
}
