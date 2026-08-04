'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  WholesalePricingSimulatorPanels,
  type WholesalePricingMsg
} from '@/components/admin/wholesale-pricing/wholesale-pricing-simulator-panels'
import { useWholesalePricingFabricList, useWholesalePricingProfile, useWholesalePricingSaveMutation } from '@/hooks/admin/useWholesalePricingAdmin'
import { mergeWholesaleFabricSelectOptions } from '@/lib/wholesale-pricing/merge-fabric-select-options'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { Locale } from '@/types/i18n.types'

function WholesalePricingSimulatorShell(props: { urlParsed: number | null; p: WholesalePricingMsg; locale: Locale }) {
  const { urlParsed, p, locale } = props
  const [fabricPick, setFabricPick] = useState<number | null>(null)
  const listQuery = useWholesalePricingFabricList({ page: 1, limit: 60, q: '' })
  const firstListId = listQuery.data?.items[0]?.fabric_id ?? null
  const fabricId = fabricPick ?? urlParsed ?? firstListId

  const profileQuery = useWholesalePricingProfile(fabricId)
  const save = useWholesalePricingSaveMutation()

  const fabric = profileQuery.data?.fabric ?? null
  const profile = profileQuery.data?.profile ?? null

  const fabricSelectRows = useMemo(
    () => mergeWholesaleFabricSelectOptions(listQuery.data?.items ?? [], fabricId, fabric ?? null),
    [fabric, fabricId, listQuery.data?.items]
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{p.simulatorPageTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{p.simulatorPageSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-xl" asChild>
            <Link
              href={withLocaleUrl(
                fabricId ? `/admin/wholesale-pricing/tiers?fabricId=${fabricId}` : '/admin/wholesale-pricing/tiers',
                locale
              )}
            >
              {p.openTiersEditor}
            </Link>
          </Button>
        </div>
      </header>

      <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-[200px] flex-1">
            <span className="text-sm font-medium text-on-surface">{p.selectFabric}</span>
            {listQuery.isLoading ? (
              <Skeleton className="mt-2 h-10 w-full" />
            ) : (
              <Select value={fabricId ? String(fabricId) : ''} onValueChange={(v) => setFabricPick(Number(v))}>
                <SelectTrigger className="mt-2 rounded-xl">
                  <SelectValue placeholder={p.selectFabric} />
                </SelectTrigger>
                <SelectContent>
                  {fabricSelectRows.map((row) => (
                    <SelectItem key={row.fabric_id} value={String(row.fabric_id)}>
                      {row.sku ? `${row.sku} — ` : ''}
                      {row.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {profileQuery.isLoading ? (
          <Skeleton className="h-80 w-full rounded-xl" />
        ) : (
          <div data-wholesale-sim-panels>
            <WholesalePricingSimulatorPanels
              key={fabricId ?? 0}
              fabricId={fabricId}
              profile={profile}
              fabric={fabric}
              p={p}
              save={save}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function WholesalePricingSimulatorClient() {
  const { messages, locale } = useI18n()
  const p = messages.admin.wholesalePricing
  const searchParams = useSearchParams()
  const urlFabricIdParam = searchParams.get('fabricId')
  const urlParsed = useMemo(() => {
    const n = urlFabricIdParam ? Number(urlFabricIdParam) : NaN
    return Number.isFinite(n) && n > 0 ? n : null
  }, [urlFabricIdParam])

  return <WholesalePricingSimulatorShell key={String(urlParsed ?? 'no-url')} urlParsed={urlParsed} p={p} locale={locale} />
}
