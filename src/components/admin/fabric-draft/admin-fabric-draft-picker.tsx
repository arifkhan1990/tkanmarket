'use client'

import * as React from 'react'
import Image from 'next/image'
import { ChevronDown, Loader2, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import { useAdminFabricDraftOptionsQuery } from '@/hooks/admin/useAdminFabricDraftOptionsQuery'
import type { AdminFabricDraftOption } from '@/types/admin-fabric-draft-options.types'

export function AdminFabricDraftPicker(props: {
  valueId: number | null
  onSelectId: (id: number) => void
  className?: string
  placeholder?: string
  status?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState('')
  const [page, setPage] = React.useState(1)
  const limit = 20

  const query = useAdminFabricDraftOptionsQuery({
    q,
    page,
    limit,
    status: props.status,
    enabled: open
  })

  const items = query.data?.items ?? []
  const meta = query.data?.meta ?? null
  const selected = props.valueId ? items.find((x) => x.id === props.valueId) ?? null : null

  React.useEffect(() => {
    if (!open) return
    setPage(1)
  }, [query.debouncedQ, open])

  const canLoadMore = meta ? meta.page < meta.totalPages : false

  const pick = (id: number) => {
    props.onSelectId(id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-11 w-full justify-between rounded-xl bg-surface-container-lowest px-3 text-left font-medium',
            props.className
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected?.thumb_url ? (
              <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
                <Image
                  src={selected.thumb_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="28px"
                  unoptimized={isRemoteImageSrc(selected.thumb_url)}
                />
              </span>
            ) : (
              <span className="h-7 w-7 shrink-0 rounded-lg bg-surface-container-high" aria-hidden />
            )}
            <span className="min-w-0 truncate">
              {selected
                ? selected.title
                : props.valueId
                  ? `#${props.valueId}`
                  : props.placeholder ?? 'Select a fabric…'}
            </span>
          </span>
          {query.isFetching ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-70" aria-hidden />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4 opacity-70" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[min(520px,calc(100vw-2rem))] p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name…"
              className="h-10 rounded-xl pl-9"
              autoFocus
            />
          </div>
          {q.trim().length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => setQ('')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>

        <div className="mt-3">
          {query.isLoading && !query.data ? (
            <PickerSkeleton />
          ) : query.isError ? (
            <div className="rounded-xl border border-dashed border-outline/30 bg-surface-container-lowest p-6 text-center">
              <p className="text-sm font-semibold text-on-surface">Failed to load fabrics</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {query.error instanceof Error ? query.error.message : 'Please try again.'}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
              >
                {query.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
                Retry
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-72 pr-2">
              <div className="space-y-1">
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-outline/30 bg-surface-container-lowest p-6 text-center text-sm text-on-surface-variant">
                    No fabrics found.
                  </p>
                ) : (
                  items.map((it) => (
                    <OptionRow key={it.id} item={it} isActive={it.id === props.valueId} onPick={pick} />
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {canLoadMore ? (
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full rounded-xl"
              onClick={() => setPage((p) => p + 1)}
              disabled={query.isFetching}
            >
              {query.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              Load more
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function OptionRow({
  item,
  isActive,
  onPick
}: {
  item: AdminFabricDraftOption
  isActive: boolean
  onPick: (id: number) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(item.id)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isActive && 'border-outline/30 bg-surface-container-low'
      )}
    >
      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
        {item.thumb_url ? (
          <Image
            src={item.thumb_url}
            alt=""
            fill
            className="object-cover"
            sizes="40px"
            unoptimized={isRemoteImageSrc(item.thumb_url)}
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-on-surface">{item.title}</span>
        <span className="block truncate text-xs text-on-surface-variant">{item.supplier_name}</span>
      </span>
      <span className="shrink-0 font-mono text-[10px] text-on-surface-variant">#{item.id}</span>
    </button>
  )
}

function PickerSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 rounded-xl border border-outline/10 p-2">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  )
}

