'use client'

import Image from 'next/image'
import type { Dispatch, SetStateAction } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useWholesalePricingFabricList } from '@/hooks/admin/useWholesalePricingAdmin'
import { interpolate } from '@/lib/i18n/interpolate'
import { mergeWholesaleFabricSelectOptions } from '@/lib/wholesale-pricing/merge-fabric-select-options'
import type { WholesaleTiersWorkspaceCopy } from '@/types/wholesale-tiers-workspace.types'

type SidebarCopy = Pick<
  WholesaleTiersWorkspaceCopy,
  | 'selectFabric'
  | 'tiersFabricSearchPlaceholder'
  | 'tiersFabricSearchApply'
  | 'tiersPaginationPrev'
  | 'tiersPaginationNext'
  | 'tiersPaginationPage'
  | 'tiersFabricImageAlt'
  | 'tiersFabricMoqPrice'
>

export function WholesaleTiersFabricSidebar(props: {
  p: SidebarCopy
  q: string
  setQ: (v: string) => void
  page: number
  setPage: Dispatch<SetStateAction<number>>
  fabricId: number | null
  setFabricPick: (id: number | null) => void
  fabric: {
    title: string
    moq: number | null
    price_usd: string | null
    images: string[] | null
  } | null
  listQuery: ReturnType<typeof useWholesalePricingFabricList>
  fabricSelectRows: ReturnType<typeof mergeWholesaleFabricSelectOptions>
}) {
  const { p, q, setQ, page, setPage, fabricId, setFabricPick, fabric, listQuery, fabricSelectRows } = props

  const meta = listQuery.data?.meta

  return (
    <div className="space-y-4 lg:col-span-4">
      <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-4 shadow-sm">
        <span className="text-sm font-medium text-on-surface">{p.selectFabric}</span>
        <div className="mt-2 flex gap-2">
          <Input
            placeholder={p.tiersFabricSearchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10"
          />
          <Button type="button" variant="secondary" onClick={() => listQuery.refetch()}>
            {p.tiersFabricSearchApply}
          </Button>
        </div>
        {listQuery.isLoading ? (
          <Skeleton className="mt-4 h-10 w-full" />
        ) : (
          <Select value={fabricId ? String(fabricId) : ''} onValueChange={(v) => setFabricPick(Number(v))}>
            <SelectTrigger className="mt-4 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fabricSelectRows.map((row) => (
                <SelectItem key={row.fabric_id} value={String(row.fabric_id)}>
                  {row.sku ? `${row.sku} · ` : ''}
                  {row.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {meta && meta.totalPages > 1 ? (
          <div className="mt-3 flex justify-between gap-2 text-xs text-on-surface-variant">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((x) => Math.max(1, x - 1))}
            >
              {p.tiersPaginationPrev}
            </Button>
            <span>{interpolate(p.tiersPaginationPage, { current: page, total: meta.totalPages })}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((x) => x + 1)}
            >
              {p.tiersPaginationNext}
            </Button>
          </div>
        ) : null}
      </div>

      {fabric ? (
        <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-4 shadow-sm">
          {fabric.images?.[0] ? (
            <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-xl">
              <Image
                src={fabric.images[0]}
                alt={interpolate(p.tiersFabricImageAlt, { title: fabric.title })}
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>
          ) : null}
          <p className="font-headline font-bold text-on-surface">{fabric.title}</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {interpolate(p.tiersFabricMoqPrice, {
              moq: fabric.moq != null ? String(fabric.moq) : '—',
              price: fabric.price_usd ?? '—'
            })}
          </p>
        </div>
      ) : null}
    </div>
  )
}
