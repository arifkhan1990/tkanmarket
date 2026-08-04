'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, LayoutList } from 'lucide-react'

import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function SortBar({
  currentSort,
  currentView = 'grid'
}: {
  total: number
  currentSort: string
  currentView?: 'grid' | 'list'
}) {
  const pathname = usePathname()
  const router = useRouter()
  const sp = useSearchParams()
  const { locale: hookLocale, messages } = useI18n()
  const locale = getLocaleFromPathname(pathname) ?? hookLocale ?? DEFAULT_LOCALE

  const sortOptions = [
    { value: 'created_at_desc', label: messages.sort.options.newest },
    { value: 'price_usd_asc', label: messages.sort.options.priceAsc },
    { value: 'price_usd_desc', label: messages.sort.options.priceDesc },
    { value: 'gsm_asc', label: messages.sort.options.gsmAsc },
  ] as const

  const pushWithParams = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(sp.toString())
    mutate(next)
    next.delete('page')
    router.push(withLocaleUrl(`/fabrics?${next.toString()}`, locale))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 rounded-2xl border border-outline/10 bg-surface-container-lowest px-5 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            {messages.sort.labelShort}
          </span>
          <div className="min-w-[180px]">
            <Select
              value={currentSort}
              onValueChange={(v) => {
                pushWithParams((next) => next.set('sort', v))
              }}
            >
              <SelectTrigger aria-label={messages.sort.ariaLabel} className="h-9 rounded-full border-outline/10 bg-surface-container-low px-4 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className="flex items-center gap-1 rounded-xl bg-surface-container-low p-1"
          role="group"
          aria-label={messages.sort.viewLayoutGroup}
        >
          <button
            type="button"
            onClick={() => pushWithParams((next) => next.set('view', 'grid'))}
            aria-pressed={currentView === 'grid'}
            aria-label={messages.sort.a11yViewGrid}
            className={cn(
              'rounded-lg p-2 transition-colors',
              currentView === 'grid'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-outline hover:bg-surface-container-highest hover:text-on-surface'
            )}
          >
            <LayoutGrid className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => pushWithParams((next) => next.set('view', 'list'))}
            aria-pressed={currentView === 'list'}
            aria-label={messages.sort.a11yViewList}
            className={cn(
              'rounded-lg p-2 transition-colors',
              currentView === 'list'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-outline hover:bg-surface-container-highest hover:text-on-surface'
            )}
          >
            <LayoutList className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

