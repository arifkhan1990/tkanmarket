'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

type Props = {
  query: string | undefined
  totalFabrics: number
  titleCatalog: string
  subtitleCatalog: string
  searchTitlePrefix: string
  searchSubtitle: string
  refinePlaceholder: string
  refineSubmit: string
  chipAll: string
  chipThisQuery: string
  foundPrefix: string
  foundSuffix: string
}

export function CatalogSearchHero({
  query,
  totalFabrics,
  titleCatalog,
  subtitleCatalog,
  searchTitlePrefix,
  searchSubtitle,
  refinePlaceholder,
  refineSubmit,
  chipAll,
  chipThisQuery,
  foundPrefix,
  foundSuffix
}: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const { locale } = useI18n()
  const [draft, setDraft] = useState(query ?? '')

  const hasQuery = Boolean(query && query.trim().length > 0)

  const pushSearch = (nextQ: string | null) => {
    const p = new URLSearchParams(sp.toString())
    if (nextQ && nextQ.trim().length > 0) p.set('q', nextQ.trim())
    else p.delete('q')
    p.delete('page')
    router.push(withLocaleUrl(`/fabrics?${p.toString()}`, locale))
  }

  return (
    <div className="mb-8 space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl md:text-display">
            {hasQuery ? (
              <>
                {searchTitlePrefix}{' '}
                <span className="text-primary">&quot;{query}&quot;</span>
              </>
            ) : (
              titleCatalog
            )}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant md:text-base">
            {hasQuery ? searchSubtitle.replace('{total}', totalFabrics.toLocaleString()) : subtitleCatalog}
          </p>
          <p className="mt-3 text-sm font-medium text-outline">
            {foundPrefix}{' '}
            <span className="font-extrabold text-on-surface">
              {totalFabrics.toLocaleString(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US')}
            </span>{' '}
            {foundSuffix}
          </p>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-col gap-4 rounded-2xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm',
          'sm:flex-row sm:items-center sm:gap-4'
        )}
      >
        <Search className="hidden h-6 w-6 shrink-0 text-primary sm:block" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && pushSearch(draft)}
            placeholder={refinePlaceholder}
            className="border-none bg-transparent font-heading text-base font-semibold shadow-none focus-visible:ring-0 md:text-lg"
            aria-label={refinePlaceholder}
          />
          <Button type="button" className="shrink-0 rounded-xl" onClick={() => pushSearch(draft)}>
            {refineSubmit}
          </Button>
        </div>
        <div className="hidden h-8 w-px bg-outline-variant/40 sm:block" />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft('')
              pushSearch(null)
            }}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wide',
              !hasQuery ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container text-outline-variant'
            )}
          >
            {chipAll}
          </button>
          {hasQuery ? (
            <span className="rounded-lg bg-primary-fixed px-3 py-1 text-xs font-bold uppercase tracking-wide text-on-primary-fixed">
              {chipThisQuery}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
