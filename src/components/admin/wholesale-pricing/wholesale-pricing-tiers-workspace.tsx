'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { useAdminSupplierById } from '@/hooks/admin/useAdminSupplierById'
import { useWholesalePricingFabricList, useWholesalePricingProfile, useWholesalePricingSaveMutation } from '@/hooks/admin/useWholesalePricingAdmin'
import { useI18n } from '@/hooks/useI18n'
import { interpolate } from '@/lib/i18n/interpolate'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { mergeWholesaleFabricSelectOptions } from '@/lib/wholesale-pricing/merge-fabric-select-options'
import { cn } from '@/lib/utils'
import type { WholesalePricingTierRow } from '@/types/wholesale-pricing.types'

import { WholesaleTiersWorkspaceBody } from '@/components/admin/wholesale-pricing/wholesale-tiers-workspace-body'
import type { WholesaleTiersWorkspaceCopy } from '@/types/wholesale-tiers-workspace.types'

export function WholesalePricingTiersWorkspace(props: {
  supplierId?: number
  /** `supplier` = studio/console visual toggle (stitch supplier_1 + supplier_2). */
  layout: 'admin' | 'supplier'
}) {
  const { messages, locale } = useI18n()
  const p = messages.admin.wholesalePricing
  const searchParams = useSearchParams()
  const urlFabricId = searchParams.get('fabricId')
  const supplierQuery = useAdminSupplierById(props.supplierId ?? null)
  const [supplierUiTab, setSupplierUiTab] = useState<'studio' | 'console'>('studio')

  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const listQuery = useWholesalePricingFabricList({
    page,
    limit: 20,
    q,
    supplierId: props.supplierId
  })

  const urlFabricIdNum = useMemo(() => {
    const n = urlFabricId ? Number(urlFabricId) : NaN
    return Number.isFinite(n) && n > 0 ? n : null
  }, [urlFabricId])

  const [fabricPick, setFabricPick] = useState<number | null>(null)
  const firstFabricId = listQuery.data?.items[0]?.fabric_id ?? null
  const fabricId = urlFabricIdNum ?? fabricPick ?? firstFabricId

  const profileQuery = useWholesalePricingProfile(fabricId)
  const save = useWholesalePricingSaveMutation()

  const fabric = profileQuery.data?.fabric ?? null
  const existing = profileQuery.data?.profile

  const simulatorHref = useMemo(() => {
    const path = fabricId
      ? `/admin/wholesale-pricing-simulator?fabricId=${fabricId}`
      : '/admin/wholesale-pricing-simulator'
    return withLocaleUrl(path, locale)
  }, [fabricId, locale])

  const defaultTiers = useMemo((): WholesalePricingTierRow[] => {
    if (existing?.tiers?.length) return existing.tiers
    if (fabric?.price_usd) {
      const px = Number(fabric.price_usd)
      if (Number.isFinite(px) && px > 0) {
        return [
          {
            sortOrder: 0,
            label: interpolate(p.tierDefaultLabel, { n: 1 }),
            minMeters: 1,
            maxMeters: 100,
            pricePerMeterUsd: px.toFixed(2),
            effectiveDiscountPercent: '0'
          }
        ]
      }
    }
    return []
  }, [existing, fabric, p.tierDefaultLabel])

  const fabricSelectRows = useMemo(
    () => mergeWholesaleFabricSelectOptions(listQuery.data?.items ?? [], fabricId, fabric ?? null),
    [fabric, fabricId, listQuery.data?.items]
  )

  const tierBodyKey = `${fabricId ?? 'x'}-${defaultTiers.map((t) => t.pricePerMeterUsd).join('|')}-${(existing?.tiers ?? []).length}`

  const msgs: WholesaleTiersWorkspaceCopy = {
    listPageTitle: p.listPageTitle,
    listPageSubtitle: p.listPageSubtitle,
    exportCsv: p.exportCsv,
    saveChanges: p.saveChanges,
    marginChartTitle: p.marginChartTitle,
    tierTableTitle: p.tierTableTitle,
    selectFabric: p.selectFabric,
    openSimulator: p.openSimulator,
    tiersFabricSearchPlaceholder: p.tiersFabricSearchPlaceholder,
    tiersFabricSearchApply: p.tiersFabricSearchApply,
    tiersPaginationPrev: p.tiersPaginationPrev,
    tiersPaginationNext: p.tiersPaginationNext,
    tiersPaginationPage: p.tiersPaginationPage,
    tiersAddTier: p.tiersAddTier,
    tiersColIndex: p.tiersColIndex,
    tiersColLabel: p.tiersColLabel,
    tiersColMinM: p.tiersColMinM,
    tiersColMaxM: p.tiersColMaxM,
    tiersColPricePerM: p.tiersColPricePerM,
    tiersColDiscountPct: p.tiersColDiscountPct,
    tiersMaxUnlimited: p.tiersMaxUnlimited,
    tierDefaultLabel: p.tierDefaultLabel,
    tiersFabricMoqPrice: p.tiersFabricMoqPrice,
    tiersFabricImageAlt: p.tiersFabricImageAlt
  }

  const inner = (
    <WholesaleTiersWorkspaceBody
      key={tierBodyKey}
      initialTiers={defaultTiers}
      p={msgs}
      simulatorHref={simulatorHref}
      layout={props.layout}
      supplierUiTab={supplierUiTab}
      supplierId={props.supplierId}
      supplierQuery={supplierQuery}
      listQuery={listQuery}
      fabricSelectRows={fabricSelectRows}
      q={q}
      setQ={setQ}
      page={page}
      setPage={setPage}
      fabricId={fabricId}
      setFabricPick={setFabricPick}
      fabric={fabric}
      existing={existing}
      save={save}
    />
  )

  if (props.layout === 'admin') {
    return <div className="space-y-6">{inner}</div>
  }

  return (
    <div className="mx-auto max-w-screen-2xl pb-12">
      <div
        role="group"
        aria-label={p.supplierLayoutGroupLabel}
        className="mb-6 grid w-full max-w-md grid-cols-2 gap-2 rounded-xl bg-surface-container-high p-1"
      >
        <Button
          type="button"
          variant="ghost"
          aria-pressed={supplierUiTab === 'studio'}
          className={cn(
            'h-11 rounded-lg font-medium',
            supplierUiTab === 'studio' && 'bg-surface-container-lowest text-on-surface shadow-sm'
          )}
          onClick={() => setSupplierUiTab('studio')}
        >
          {p.supplierStudioTab}
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-pressed={supplierUiTab === 'console'}
          className={cn(
            'h-11 rounded-lg font-medium',
            supplierUiTab === 'console' && 'bg-surface-container-lowest text-on-surface shadow-sm'
          )}
          onClick={() => setSupplierUiTab('console')}
        >
          {p.supplierConsoleTab}
        </Button>
      </div>
      <div
        className={cn(
          'rounded-2xl p-4 md:p-6',
          supplierUiTab === 'studio'
            ? 'border border-outline/10 bg-surface/30'
            : 'border border-outline/15 bg-surface-container-low/50 shadow-inner'
        )}
      >
        {inner}
      </div>
    </div>
  )
}
