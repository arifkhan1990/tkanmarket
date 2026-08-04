'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Banknote, FlaskConical, GitCompare, Ruler, ShoppingBasket, Trash2, Weight, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useFabricCompare } from '@/hooks/useFabricCompare'
import { useI18n } from '@/hooks/useI18n'
import {
  clearStoredCompareIds,
  getStoredCompareIds,
  removeStoredCompareId,
  replaceStoredCompareIds,
  syncStoredCompareIds
} from '@/lib/compare/compare-storage'
import { resolveFabricImageFromList } from '@/lib/marketplace/image-fallbacks'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocalizedFabricTitle } from '@/lib/i18n/localized-fabric'
import type { FabricDetail } from '@/types/marketplace.types'
import { SampleRequestModal } from '@/components/forms/SampleRequestModal'

function compositionText(fabric: FabricDetail): string {
  if (fabric.composition && fabric.composition.length > 0) {
    return fabric.composition.map((c) => `${c.material} ${c.percentage}%`).join(', ')
  }
  return '—'
}

function sameIdList(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}

export function FabricCompareClient({
  requestedIds,
  initialFabrics
}: {
  requestedIds: number[]
  initialFabrics: FabricDetail[]
}) {
  const router = useRouter()
  const { locale, messages: m } = useI18n()
  const compare = m.fabrics.compare

  const [compareIds, setCompareIds] = React.useState<number[]>(() => requestedIds)

  /** Load compare list from localStorage before paint when the URL has no ?ids= (avoids empty flash). */
  React.useLayoutEffect(() => {
    if (requestedIds.length > 0) return
    setCompareIds((prev) => (prev.length > 0 ? prev : getStoredCompareIds()))
  }, [requestedIds])

  /**
   * Optional ?ids= in URL is only for shared links: save to storage, then keep the address bar as /fabrics/compare.
   */
  React.useEffect(() => {
    if (requestedIds.length === 0) return
    replaceStoredCompareIds(requestedIds)
    setCompareIds(requestedIds)
    router.replace(withLocaleUrl('/fabrics/compare', locale), { scroll: false })
  }, [requestedIds, router, locale])

  const initialFromServer =
    requestedIds.length > 0 &&
    initialFabrics.length > 0 &&
    sameIdList(requestedIds, compareIds)
      ? initialFabrics
      : undefined
  const query = useFabricCompare(compareIds, initialFromServer)
  const items = query.data ?? []

  const [sampleOpen, setSampleOpen] = React.useState<{ id: number; title: string } | null>(null)

  const remove = (id: number) => {
    removeStoredCompareId(id)
    setCompareIds((prev) => prev.filter((x) => x !== id))
  }

  const clearAll = () => {
    clearStoredCompareIds()
    setCompareIds([])
    toast.success(compare.clearedAll)
  }

  /**
   * Reconcile localStorage after the API responds: any IDs the user had stored
   * but that are no longer approved/visible (deleted, unapproved, missing) are
   * pruned from the list so the badge stays accurate.
   */
  React.useEffect(() => {
    if (query.isLoading || compareIds.length === 0) return
    const fetchedIds = new Set((query.data ?? []).map((f) => f.id))
    const stale = compareIds.filter((id) => !fetchedIds.has(id))
    if (stale.length === 0) return
    const changed = syncStoredCompareIds(fetchedIds)
    if (changed) {
      setCompareIds((prev) => prev.filter((id) => fetchedIds.has(id)))
      toast.message(compare.staleRemoved.replace('{count}', String(stale.length)))
    }
  }, [query.data, query.isLoading, compareIds, compare.staleRemoved])

  if (compareIds.length === 0) {
    return (
      <div className="w-full py-6 md:py-10">
        <div className="rounded-3xl border border-outline/10 bg-surface-container-lowest p-10 text-center shadow-sm">
          <GitCompare className="mx-auto h-12 w-12 text-primary/80" aria-hidden />
          <h1 className="mt-4 font-heading text-2xl font-extrabold text-on-surface">{compare.emptyTitle}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{compare.emptySubtitle}</p>
          <Button asChild className="mt-6 rounded-full">
            <Link href={withLocaleUrl('/fabrics', locale)}>{compare.browseCatalog}</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (query.isLoading && items.length === 0) {
    return (
      <div className="w-full space-y-8 pb-2 pt-2 md:space-y-10 md:pb-4">
        <FabricCompareToolbarSkeleton />
        <FabricCompareSkeleton count={compareIds.length} />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="w-full py-6 md:py-10">
        <div className="rounded-3xl border border-outline/10 bg-surface-container-lowest p-10 text-center">
          <p className="text-on-surface-variant">{compare.noneLoaded}</p>
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link href={withLocaleUrl('/fabrics', locale)}>{compare.browseCatalog}</Link>
          </Button>
        </div>
      </div>
    )
  }

  const cols = 1 + items.length
  const gridTemplate = `repeat(${cols}, minmax(0, 1fr))`

  return (
    <div className="w-full space-y-8 pb-2 pt-2 md:space-y-10 md:pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{compare.title}</h1>
          <p className="max-w-2xl text-base leading-relaxed text-on-surface-variant">{compare.subtitle}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="self-start gap-2 rounded-full border-error/30 text-error hover:bg-error/5 hover:text-error sm:self-auto"
          onClick={clearAll}
          aria-label={compare.clearAll}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {compare.clearAll}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-outline/10 bg-surface-container-lowest shadow-sm">
        <div className="min-w-[720px]">
          <div
            className="sticky top-16 z-20 grid gap-0 border-b-2 border-surface-container bg-surface-container-lowest"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="flex flex-col justify-end bg-surface-container-low p-6 md:p-8">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">{compare.overviewLabel}</span>
              <h2 className="mt-2 font-heading text-lg font-bold text-on-surface">
                {compare.selectedItems.replace('{count}', String(items.length))}
              </h2>
            </div>
            {items.map((f) => {
              const title = getLocalizedFabricTitle(f, locale)
              const img = resolveFabricImageFromList(f.images, f.imageUrl)
              return (
                <div key={f.id} className="group relative border-l border-surface-container p-4 md:p-6">
                  <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-highest shadow-sm">
                    <Image
                      src={img}
                      alt={title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 40vw, 200px"
                      unoptimized={isRemoteImageSrc(img)}
                    />
                    <button
                      type="button"
                      onClick={() => remove(f.id)}
                      className="absolute right-2.5 top-2.5 rounded-full border border-outline/15 bg-background/90 p-1.5 text-error opacity-0 shadow-sm backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
                      aria-label={compare.remove}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <h3 className="font-heading text-sm font-bold leading-snug text-on-surface md:text-base">{title}</h3>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {compare.sku}: <span className="font-mono">{f.sku ?? '—'}</span>
                  </p>
                </div>
              )
            })}
          </div>

          <CompareRow gridTemplate={gridTemplate} label={compare.rowComposition} icon={FlaskConical}>
            {items.map((f) => (
              <div key={f.id} className="border-l border-surface-container p-6 text-sm text-on-surface-variant">
                {compositionText(f)}
              </div>
            ))}
          </CompareRow>

          <CompareRow gridTemplate={gridTemplate} label={compare.rowGsm} icon={Weight}>
            {items.map((f) => (
              <div key={f.id} className="border-l border-surface-container p-6 font-mono text-sm text-on-surface">
                {f.gsm != null ? `${f.gsm} gsm` : '—'}
              </div>
            ))}
          </CompareRow>

          <CompareRow gridTemplate={gridTemplate} label={compare.rowWidth} icon={Ruler}>
            {items.map((f) => (
              <div key={f.id} className="border-l border-surface-container p-6 text-sm text-on-surface">
                {f.widthCm != null ? `${f.widthCm} cm` : '—'}
              </div>
            ))}
          </CompareRow>

          <CompareRow gridTemplate={gridTemplate} label={compare.rowMoq} icon={ShoppingBasket}>
            {items.map((f) => (
              <div key={f.id} className="border-l border-surface-container p-6 text-sm text-on-surface">
                {f.moq != null ? String(f.moq) : '—'}
              </div>
            ))}
          </CompareRow>

          <CompareRow gridTemplate={gridTemplate} label={compare.rowPrice} icon={Banknote}>
            {items.map((f) => (
              <div key={f.id} className="border-l border-surface-container p-6">
                <span className="font-mono text-lg font-bold text-primary">{f.priceUsd ? `$${f.priceUsd}` : '—'}</span>
              </div>
            ))}
          </CompareRow>

          <CompareRow gridTemplate={gridTemplate} label="Color">
            {items.map((f) => (
              <div key={f.id} className="border-l border-surface-container p-6 text-sm text-on-surface-variant">
                {f.color ?? '—'}
              </div>
            ))}
          </CompareRow>

          <CompareRow gridTemplate={gridTemplate} label="Supply Type">
            {items.map((f) => (
              <div key={f.id} className="border-l border-surface-container p-6 text-sm text-on-surface-variant">
                {f.supplyType ?? '—'}
              </div>
            ))}
          </CompareRow>

          <CompareRow gridTemplate={gridTemplate} label="Shipment Time">
            {items.map((f) => (
              <div key={f.id} className="border-l border-surface-container p-6 text-sm text-on-surface-variant">
                {f.shipmentTime ?? '—'}
              </div>
            ))}
          </CompareRow>

          <div className="grid gap-0 bg-surface-container-lowest" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="border-r border-surface-container p-6 md:p-8" />
            {items.map((f) => {
              const title = getLocalizedFabricTitle(f, locale)
              return (
                <div key={f.id} className="space-y-3 border-l border-surface-container p-6">
                  <Button
                    type="button"
                    className="w-full rounded-xl font-heading text-sm font-bold shadow-md"
                    onClick={() => setSampleOpen({ id: f.id, title })}
                  >
                    {compare.requestSample}
                  </Button>
                  <button
                    type="button"
                    className="w-full rounded-lg py-2 text-xs font-semibold text-error hover:bg-error/5"
                    onClick={() => remove(f.id)}
                  >
                    {compare.removeFromCompare}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-outline/10 bg-surface-container-low p-8 shadow-sm">
          <p className="font-heading text-lg font-bold text-on-surface">{compare.cardVerifiedTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{compare.cardVerifiedBody}</p>
        </div>
        <div className="rounded-3xl border border-outline/10 bg-surface-container-low p-8 shadow-sm">
          <p className="font-heading text-lg font-bold text-on-surface">{compare.cardSpecsTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{compare.cardSpecsBody}</p>
        </div>
        <div className="rounded-3xl border border-outline/10 bg-surface-container-low p-8 shadow-sm">
          <p className="font-heading text-lg font-bold text-on-surface">{compare.cardLogisticsTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{compare.cardLogisticsBody}</p>
        </div>
      </div>

      {sampleOpen ? (
        <SampleRequestModal
          fabric={{ id: sampleOpen.id, title: sampleOpen.title }}
          isOpen
          onClose={() => setSampleOpen(null)}
        />
      ) : null}
    </div>
  )
}

function CompareRow({
  gridTemplate,
  label,
  icon: Icon,
  children
}: {
  gridTemplate: string
  label: string
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  children: React.ReactNode
}) {
  return (
    <div
      className="grid gap-0 border-b border-surface-container even:bg-surface-container-low/20 hover:bg-surface-container-low/35"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      <div className="flex items-center gap-3 border-r border-surface-container p-6 md:p-8">
        {Icon ? <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden /> : null}
        <span className="font-heading text-sm font-bold text-on-surface">{label}</span>
      </div>
      {children}
    </div>
  )
}

export function FabricCompareToolbarSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <div className="h-10 w-full max-w-md animate-pulse rounded-2xl bg-surface-container-high md:h-11" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-surface-container-high" />
      </div>
      <div className="h-10 w-32 shrink-0 animate-pulse rounded-full bg-surface-container-high" />
    </div>
  )
}

export function FabricCompareSkeleton({ count }: { count: number }) {
  const cols = 1 + Math.min(Math.max(count, 1), 4)
  const gridTemplate = `repeat(${cols}, minmax(0, 1fr))`
  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-3xl border border-outline/10 bg-surface-container-lowest shadow-sm">
        <div className="min-w-[720px]">
          <div
            className="grid gap-0 border-b-2 border-surface-container bg-surface-container-lowest p-4 md:p-5"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {Array.from({ length: cols }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'animate-pulse bg-surface-container-high/60',
                  i === 0 ? 'min-h-[120px] rounded-3xl' : 'aspect-[4/3] rounded-3xl border border-outline/10'
                )}
              />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((r) => (
            <div
              key={r}
              className="h-16 animate-pulse border-b border-surface-container bg-surface-container-low/20 even:bg-surface-container-low/30"
            />
          ))}
          <div className="h-28 animate-pulse bg-surface-container-lowest md:h-32" />
        </div>
      </div>
    </div>
  )
}
