'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { FABRIC_MATERIALS } from '@/constants'
import type { FabricQueryParams } from '@/lib/validations/fabric.validation'
import type { JunctionCategoryCount } from '@/types/marketplace.types'
import { countActiveFabricFilters } from '@/lib/marketplace/active-filters'
import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { useI18n } from '@/hooks/useI18n'
import { fabricTypeOptions, moqRangesTemplate, widthRanges, type SectionKey } from './filter-sidebar.constants'
import { DEFAULT_LOCALE } from '@/types/i18n.types'

export type CategoryCount = { category: string; count: number }

type FabricFilters = FabricQueryParams

function toggleArrayValue(current: string[] | undefined, value: string) {
  const set = new Set(current ?? [])
  if (set.has(value)) set.delete(value)
  else set.add(value)
  return Array.from(set)
}

function buildNextSearchParams(
  current: URLSearchParams,
  next: Array<{ key: string; value?: string | null; mode?: 'set' | 'append' | 'deleteAll' }>
) {
  const sp = new URLSearchParams(current.toString())
  for (const n of next) {
    if (n.mode === 'deleteAll') {
      sp.delete(n.key)
      continue
    }
    if (n.value === undefined) continue
    if (n.value === null || n.value === '') {
      sp.delete(n.key)
      continue
    }
    if (n.mode === 'append') sp.append(n.key, n.value)
    else sp.set(n.key, n.value)
  }
  sp.delete('page') // reset pagination on any filter change
  return sp
}

function Section(props: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-outline/10 bg-surface-container-lowest">
      <button
        type="button"
        onClick={props.onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-extrabold text-on-surface"
        data-state={props.open ? 'open' : 'closed'}
      >
        <span>{props.title}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', props.open ? 'rotate-180' : 'rotate-0')} aria-hidden />
      </button>
      {props.open ? <div className="px-5 pb-5">{props.children}</div> : null}
    </div>
  )
}

export function FilterSidebar(props: {
  currentFilters: FabricFilters
  categoryCounts: CategoryCount[]
  junctionCategoryCounts: JunctionCategoryCount[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale: hookLocale, messages } = useI18n()
  const locale = getLocaleFromPathname(pathname) ?? hookLocale ?? DEFAULT_LOCALE

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    material: true,
    catalogCategory: true,
    type: true,
    gsm: true,
    price: true,
    width: true,
    moq: true
  })

  const categoryMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of props.categoryCounts) m.set(c.category, c.count)
    return m
  }, [props.categoryCounts])

  const activeCount = useMemo(() => countActiveFabricFilters(props.currentFilters), [props.currentFilters])

  const moqRanges = useMemo(
    () => [
      { ...moqRangesTemplate[0], label: messages.fabrics.filters.moqRanges.lt50 },
      { ...moqRangesTemplate[1], label: messages.fabrics.filters.moqRanges.between50And200 },
      { ...moqRangesTemplate[2], label: messages.fabrics.filters.moqRanges.between200And500 },
      { ...moqRangesTemplate[3], label: messages.fabrics.filters.moqRanges.gte500 },
    ],
    [messages]
  )

  const go = (sp: URLSearchParams) => router.push(withLocaleUrl(`/fabrics?${sp.toString()}`, locale))

  const materialSelected = props.currentFilters.material ?? []
  const typeSelected = props.currentFilters.fabric_type
  const categorySlugSelected = props.currentFilters.category_slug?.trim() ?? ''
  const categoryLabel = (c: JunctionCategoryCount) => {
    if (locale === 'ru') return c.name_ru
    if (locale === 'en') return c.name_en ?? c.name_ru
    return c.name_ru || c.slug
  }

  const activeWidthRangeId = (() => {
    const min = props.currentFilters.width_min
    const max = props.currentFilters.width_max
    if (min === undefined && max === 99) return 'lt100'
    if (min === 100 && max === 140) return '100_140'
    if (min === 140 && max === 160) return '140_160'
    if (min === 161 && max === undefined) return 'gt160'
    return null
  })()

  const activeMoqRangeId = (() => {
    const min = props.currentFilters.moq_min
    const max = props.currentFilters.moq_max
    if (min === undefined && max === 49) return 'lt50'
    if (min === 50 && max === 200) return '50_200'
    if (min === 200 && max === 500) return '200_500'
    if (min === 500 && max === undefined) return '500p'
    return null
  })()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-extrabold text-on-surface">{messages.fabrics.filters.title}</div>
          {activeCount > 0 ? (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface-container-highest px-2 text-xs font-extrabold text-on-surface">
              {activeCount}
            </span>
          ) : null}
        </div>
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={() => router.push(withLocaleUrl('/fabrics', locale))}
        >
          {messages.fabrics.filters.resetAll}
        </Button>
      </div>

      <Section
        title={messages.fabrics.filters.material}
        open={open.material}
        onToggle={() => setOpen((v) => ({ ...v, material: !v.material }))}
      >
        <div className="space-y-2">
          {(FABRIC_MATERIALS as readonly string[]).map((m) => {
            const checked = materialSelected.includes(m)
            const count = categoryMap.get(m) ?? 0
            return (
              <label key={m} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 hover:bg-surface-container-low">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const nextArr = toggleArrayValue(materialSelected, m)
                      const base = buildNextSearchParams(searchParams, [{ key: 'material', mode: 'deleteAll' }])
                      for (const v of nextArr) base.append('material', v)
                      go(base)
                    }}
                  />
                  <span className="text-sm font-bold text-on-surface-variant">{m}</span>
                </span>
                <span className="text-xs font-bold text-outline">{count}</span>
              </label>
            )
          })}
        </div>
      </Section>

      {props.junctionCategoryCounts.length > 0 ? (
        <Section
          title={messages.fabrics.filters.catalogCategory}
          open={open.catalogCategory}
          onToggle={() => setOpen((v) => ({ ...v, catalogCategory: !v.catalogCategory }))}
        >
          <div className="space-y-2">
            <label className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 hover:bg-surface-container-low">
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="junction-category"
                  checked={categorySlugSelected.length === 0}
                  onChange={() => {
                    const sp = buildNextSearchParams(searchParams, [{ key: 'category_slug', value: null }])
                    go(sp)
                  }}
                />
                <span className="text-sm font-bold text-on-surface-variant">
                  {messages.fabrics.filters.catalogCategoryAny}
                </span>
              </span>
            </label>
            {props.junctionCategoryCounts.map((c) => {
              const slug = c.slug
              const count = c.count
              const label = categoryLabel(c)
              const checked = categorySlugSelected === slug
              return (
                <label
                  key={slug}
                  className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 hover:bg-surface-container-low"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <input
                      type="radio"
                      name="junction-category"
                      checked={checked}
                      onChange={() => {
                        const sp = buildNextSearchParams(searchParams, [{ key: 'category_slug', value: slug }])
                        go(sp)
                      }}
                    />
                    <span className="truncate text-sm font-bold text-on-surface-variant" title={label}>
                      {label}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-outline">{count}</span>
                </label>
              )
            })}
          </div>
        </Section>
      ) : null}

      <Section
        title={messages.fabrics.filters.fabricType}
        open={open.type}
        onToggle={() => setOpen((v) => ({ ...v, type: !v.type }))}
      >
        <div className="space-y-2">
          {fabricTypeOptions.map((t) => {
            const checked = typeSelected === t.value
            return (
              <label key={t.value} className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-surface-container-low">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const nextValue = checked ? null : t.value
                    const sp = buildNextSearchParams(searchParams, [{ key: 'fabric_type', value: nextValue }])
                    go(sp)
                  }}
                />
                <span className="text-sm font-bold text-on-surface-variant">
                  {messages.fabrics.filters.types[t.label as keyof typeof messages.fabrics.filters.types] ??
                    messages.fabrics.filters.types.other}
                </span>
              </label>
            )
          })}
        </div>
      </Section>

      <Section
        title={messages.fabrics.filters.gsm}
        open={open.gsm}
        onToggle={() => setOpen((v) => ({ ...v, gsm: !v.gsm }))}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.fabrics.filters.from}</div>
            <Input
              inputMode="numeric"
              defaultValue={props.currentFilters.gsm_min ?? ''}
              onBlur={(e) => {
                const v = e.target.value.trim()
                const sp = buildNextSearchParams(searchParams, [{ key: 'gsm_min', value: v || null }])
                go(sp)
              }}
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.fabrics.filters.to}</div>
            <Input
              inputMode="numeric"
              defaultValue={props.currentFilters.gsm_max ?? ''}
              onBlur={(e) => {
                const v = e.target.value.trim()
                const sp = buildNextSearchParams(searchParams, [{ key: 'gsm_max', value: v || null }])
                go(sp)
              }}
            />
          </div>
        </div>
      </Section>

      <Section
        title={messages.product.specs.price}
        open={open.price}
        onToggle={() => setOpen((v) => ({ ...v, price: !v.price }))}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.fabrics.filters.from}</div>
            <Input
              inputMode="decimal"
              defaultValue={props.currentFilters.price_usd_min ?? ''}
              onBlur={(e) => {
                const v = e.target.value.trim()
                const sp = buildNextSearchParams(searchParams, [{ key: 'price_usd_min', value: v || null }])
                go(sp)
              }}
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.fabrics.filters.to}</div>
            <Input
              inputMode="decimal"
              defaultValue={props.currentFilters.price_usd_max ?? ''}
              onBlur={(e) => {
                const v = e.target.value.trim()
                const sp = buildNextSearchParams(searchParams, [{ key: 'price_usd_max', value: v || null }])
                go(sp)
              }}
            />
          </div>
        </div>
      </Section>

      <Section
        title={messages.fabrics.filters.width}
        open={open.width}
        onToggle={() => setOpen((v) => ({ ...v, width: !v.width }))}
      >
        <div className="space-y-2">
          {widthRanges.map((r) => {
            const checked = activeWidthRangeId === r.id
            return (
              <label key={r.id} className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-surface-container-low">
                <input
                  type="radio"
                  name="width-range"
                  checked={checked}
                  onChange={() => {
                    const sp = buildNextSearchParams(searchParams, [
                      { key: 'width', value: null },
                      { key: 'width_min', value: r.min !== undefined ? String(r.min) : null },
                      { key: 'width_max', value: r.max !== undefined ? String(r.max) : null }
                    ])
                    go(sp)
                  }}
                />
                <span className="text-sm font-bold text-on-surface-variant">{r.label}</span>
              </label>
            )
          })}
          <Button
            variant="ghost"
            className="w-full justify-start rounded-2xl"
            onClick={() => {
              const sp = buildNextSearchParams(searchParams, [
                { key: 'width_min', value: null },
                { key: 'width_max', value: null }
              ])
              go(sp)
            }}
          >
            {messages.fabrics.filters.clear}
          </Button>
        </div>
      </Section>

      <Section
        title={messages.fabrics.filters.moq}
        open={open.moq}
        onToggle={() => setOpen((v) => ({ ...v, moq: !v.moq }))}
      >
        <div className="space-y-2">
          {moqRanges.map((r) => {
            const checked = activeMoqRangeId === r.id
            return (
              <label key={r.id} className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-surface-container-low">
                <input
                  type="radio"
                  name="moq-range"
                  checked={checked}
                  onChange={() => {
                    const sp = buildNextSearchParams(searchParams, [
                      { key: 'moq_min', value: r.min !== undefined ? String(r.min) : null },
                      { key: 'moq_max', value: r.max !== undefined ? String(r.max) : null }
                    ])
                    go(sp)
                  }}
                />
                <span className="text-sm font-bold text-on-surface-variant">{r.label}</span>
              </label>
            )
          })}
          <Button
            variant="ghost"
            className="w-full justify-start rounded-2xl"
            onClick={() => {
              const sp = buildNextSearchParams(searchParams, [
                { key: 'moq_min', value: null },
                { key: 'moq_max', value: null }
              ])
              go(sp)
            }}
          >
            {messages.fabrics.filters.clear}
          </Button>
        </div>
      </Section>
    </div>
  )
}
