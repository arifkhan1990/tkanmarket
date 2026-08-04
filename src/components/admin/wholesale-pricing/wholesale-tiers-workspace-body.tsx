'use client'

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useAdminSupplierById } from '@/hooks/admin/useAdminSupplierById'
import { useWholesalePricingFabricList, useWholesalePricingSaveMutation } from '@/hooks/admin/useWholesalePricingAdmin'
import { mergeWholesaleFabricSelectOptions } from '@/lib/wholesale-pricing/merge-fabric-select-options'
import type { WholesalePricingSimulatorParams, WholesalePricingProfileDto, WholesalePricingTierRow } from '@/types/wholesale-pricing.types'
import type { WholesaleTiersWorkspaceCopy } from '@/types/wholesale-tiers-workspace.types'

import { WholesaleTiersEditorTable } from '@/components/admin/wholesale-pricing/wholesale-tiers-editor-table'
import { WholesaleTiersFabricSidebar } from '@/components/admin/wholesale-pricing/wholesale-tiers-fabric-sidebar'
import { WholesaleTiersWorkspaceHeader } from '@/components/admin/wholesale-pricing/wholesale-tiers-workspace-header'
import { WholesaleTiersMarginChart } from '@/components/admin/wholesale-pricing/wholesale-tiers-margin-chart'

export type { WholesaleTiersWorkspaceCopy } from '@/types/wholesale-tiers-workspace.types'

function normalizeSimulator(
  s: WholesalePricingProfileDto['simulator'] | undefined
): WholesalePricingSimulatorParams | null {
  if (!s) return null
  if (
    typeof s.baseUnitCostUsd === 'string' &&
    typeof s.minTargetMarginPercent === 'string' &&
    typeof s.volumeDecayFactor === 'string'
  ) {
    return s
  }
  return null
}

export function WholesaleTiersWorkspaceBody(props: {
  initialTiers: WholesalePricingTierRow[]
  p: WholesaleTiersWorkspaceCopy
  simulatorHref: string
  layout: 'admin' | 'supplier'
  supplierUiTab: 'studio' | 'console'
  supplierId?: number
  supplierQuery: ReturnType<typeof useAdminSupplierById>
  listQuery: ReturnType<typeof useWholesalePricingFabricList>
  fabricSelectRows: ReturnType<typeof mergeWholesaleFabricSelectOptions>
  q: string
  setQ: (v: string) => void
  page: number
  setPage: Dispatch<SetStateAction<number>>
  fabricId: number | null
  setFabricPick: (id: number | null) => void
  fabric: {
    id: number
    title: string
    sku: string | null
    price_usd: string | null
    moq: number | null
    images: string[] | null
  } | null
  existing: WholesalePricingProfileDto | null | undefined
  save: ReturnType<typeof useWholesalePricingSaveMutation>
}) {
  const {
    initialTiers,
    p,
    simulatorHref,
    layout,
    supplierUiTab,
    supplierId,
    supplierQuery,
    listQuery,
    fabricSelectRows,
    q,
    setQ,
    page,
    setPage,
    fabricId,
    setFabricPick,
    fabric,
    existing,
    save
  } = props

  const [tiers, setTiers] = useState<WholesalePricingTierRow[]>(initialTiers)

  const maxPrice = useMemo(() => {
    const nums = tiers.map((t) => Number(t.pricePerMeterUsd)).filter((n) => Number.isFinite(n))
    return nums.length ? Math.max(...nums, 1) : 1
  }, [tiers])

  const exportCsv = () => {
    const header = ['label', 'min_m', 'max_m', 'price_usd', 'discount_pct']
    const lines = [header.join(',')]
    for (const t of tiers) {
      lines.push(
        [t.label, String(t.minMeters), t.maxMeters === null ? '' : String(t.maxMeters), t.pricePerMeterUsd, t.effectiveDiscountPercent ?? ''].join(
          ','
        )
      )
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wholesale-tiers-${fabricId ?? 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const supplierName = supplierId && supplierQuery.data ? supplierQuery.data.name : null

  return (
    <>
      <WholesaleTiersWorkspaceHeader
        layout={layout}
        supplierUiTab={supplierUiTab}
        supplierName={supplierName}
        p={p}
        simulatorHref={simulatorHref}
        onExportCsv={exportCsv}
        onSave={() => {
          if (!fabricId) return
          save.mutate({
            fabricId,
            tiers,
            simulator: normalizeSimulator(existing?.simulator)
          })
        }}
        savePending={save.isPending}
        saveDisabled={!fabricId || save.isPending}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <WholesaleTiersMarginChart
            tiers={tiers}
            maxPrice={maxPrice}
            marginChartTitle={p.marginChartTitle}
            listPageSubtitle={p.listPageSubtitle}
          />
          <WholesaleTiersEditorTable tiers={tiers} setTiers={setTiers} fabric={fabric} p={p} />
        </div>

        <WholesaleTiersFabricSidebar
          p={p}
          q={q}
          setQ={setQ}
          page={page}
          setPage={setPage}
          fabricId={fabricId}
          setFabricPick={setFabricPick}
          fabric={
            fabric
              ? {
                  title: fabric.title,
                  moq: fabric.moq,
                  price_usd: fabric.price_usd,
                  images: fabric.images
                }
              : null
          }
          listQuery={listQuery}
          fabricSelectRows={fabricSelectRows}
        />
      </div>
    </>
  )
}
