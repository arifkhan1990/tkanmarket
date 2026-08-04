'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Factory, History, Layers, Search, X } from 'lucide-react'

import { GlobalSearchFooter } from '@/components/admin/global-search/global-search-footer'
import { GlobalSearchTrendingSection } from '@/components/admin/global-search/global-search-trending-section'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAdminLayout } from '@/components/admin/admin-layout-context'
import {
  pushRecentAdminSearch,
  readRecentAdminSearches,
  useAdminGlobalSearchQuery
} from '@/hooks/admin/useAdminGlobalSearchQuery'
import { useI18n } from '@/hooks/useI18n'
import { buildAdminGlobalSearchNavItems } from '@/lib/admin-global-search-nav'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import type { AdminGlobalSearchScope } from '@/types/admin-global-search.types'

const SCOPES: AdminGlobalSearchScope[] = ['all', 'fabrics', 'suppliers', 'leads']

export function GlobalSearchOverlay() {
  const router = useRouter()
  const { globalSearchOpen, setGlobalSearchOpen } = useAdminLayout()
  const { messages, locale } = useI18n()
  const g = messages.admin.globalSearch
  const [q, setQ] = React.useState('')
  const [recent, setRecent] = React.useState<string[]>([])
  const [scope, setScope] = React.useState<AdminGlobalSearchScope>('all')
  const [selectedNavIndex, setSelectedNavIndex] = React.useState(-1)
  const searchQuery = useAdminGlobalSearchQuery(q, { enabled: globalSearchOpen })
  const debouncedQ = searchQuery.debouncedQ
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (globalSearchOpen) {
      setRecent(readRecentAdminSearches())
      queueMicrotask(() => inputRef.current?.focus())
    }
  }, [globalSearchOpen])

  React.useEffect(() => {
    if (!globalSearchOpen) {
      setQ('')
      setScope('all')
      setSelectedNavIndex(-1)
    }
  }, [globalSearchOpen])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setGlobalSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setGlobalSearchOpen])

  const data = searchQuery.data
  const trending = data?.trendingCategories ?? []
  const fabrics = data?.fabrics ?? []
  const suppliers = data?.suppliers ?? []
  const leads = data?.leads ?? []

  const flatItems = React.useMemo(
    () => buildAdminGlobalSearchNavItems(data, scope, locale),
    [data, scope, locale]
  )

  React.useEffect(() => {
    setSelectedNavIndex(-1)
  }, [debouncedQ, scope, data])

  const hasQuery = debouncedQ.trim().length >= 2

  const selectedRef = React.useRef(-1)
  React.useEffect(() => {
    selectedRef.current = selectedNavIndex
  }, [selectedNavIndex])

  React.useEffect(() => {
    if (!globalSearchOpen || !hasQuery || flatItems.length === 0) return

    const onNav = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedNavIndex((i) => Math.min(flatItems.length - 1, i < 0 ? 0 : i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedNavIndex((i) => Math.max(0, i <= 0 ? 0 : i - 1))
      } else if (e.key === 'Enter') {
        const idx = selectedRef.current
        const hit = flatItems[idx]
        if (hit && idx >= 0) {
          e.preventDefault()
          pushRecentAdminSearch(hit.label)
          setGlobalSearchOpen(false)
          router.push(hit.href)
        }
      }
    }

    window.addEventListener('keydown', onNav)
    return () => window.removeEventListener('keydown', onNav)
  }, [globalSearchOpen, hasQuery, flatItems, router, setGlobalSearchOpen])

  const onNavigateResult = (recentLabel?: string) => {
    const label = recentLabel?.trim() || q.trim() || 'browse'
    pushRecentAdminSearch(label)
    setGlobalSearchOpen(false)
  }

  const selectedId = selectedNavIndex >= 0 ? flatItems[selectedNavIndex]?.id : undefined

  const scopeLabel = (s: AdminGlobalSearchScope) => {
    if (s === 'all') return g.scopeAll
    if (s === 'fabrics') return g.scopeFabrics
    if (s === 'suppliers') return g.scopeSuppliers
    return g.scopeLeads
  }

  const showFabrics = scope === 'all' || scope === 'fabrics'
  const showSuppliers = scope === 'all' || scope === 'suppliers'
  const showLeads = scope === 'all' || scope === 'leads'

  return (
    <Dialog open={globalSearchOpen} onOpenChange={setGlobalSearchOpen}>
      <DialogContent
        hideCloseButton
        overlayClassName="bg-black/45 backdrop-blur-none dark:bg-black/55"
        className={cn(
          'left-1/2 top-[max(4.5rem,8vh)] max-h-[min(88vh,720px)] w-[calc(100%-1.25rem)] max-w-2xl -translate-x-1/2 translate-y-0 gap-0 overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest p-0 shadow-2xl sm:w-[calc(100%-2rem)]'
        )}
      >
        <DialogTitle className="sr-only">{g.openSearch}</DialogTitle>
        <div className="flex flex-col border-b border-on-surface/5 bg-gradient-to-r from-surface-container-lowest/90 to-surface-container-low/80 px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Search className="h-5 w-5 shrink-0 text-primary sm:h-6 sm:w-6" aria-hidden />
            <Input
              ref={inputRef}
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={g.placeholder}
              className="min-h-11 flex-1 border-none bg-transparent text-base shadow-none placeholder:text-on-surface-variant/80 focus-visible:ring-0 sm:text-lg"
              aria-label={g.openSearch}
            />
            {q.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg"
                aria-label={g.clearQuery}
                onClick={() => setQ('')}
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
            <kbd className="hidden shrink-0 rounded-lg border border-outline-variant/30 bg-surface-container px-2 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wide text-outline sm:inline">
              esc
            </kbd>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label={g.openSearch}>
            {SCOPES.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={scope === s}
                onClick={() => setScope(s)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  scope === s
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high/70 text-on-surface-variant hover:bg-surface-container-highest'
                )}
              >
                {scopeLabel(s)}
              </button>
            ))}
          </div>
          {debouncedQ.trim().length === 0 ? (
            <p className="mt-3 text-[13px] leading-snug text-on-surface-variant sm:text-sm">{g.idleHint}</p>
          ) : null}
        </div>

        <div className="custom-scrollbar max-h-[min(56vh,540px)] overflow-y-auto">
          {debouncedQ.trim().length === 1 ? (
            <p className="px-4 py-6 text-center text-sm text-on-surface-variant sm:px-6">{g.minCharsHint}</p>
          ) : null}

          {recent.length > 0 && debouncedQ.trim().length < 2 ? (
            <section className="p-4 sm:p-5">
              <h3 className="px-1 py-2 font-headline text-[11px] font-bold uppercase tracking-[0.15em] text-outline/70">
                {g.recent}
              </h3>
              <div className="space-y-1">
                {recent.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQ(term)}
                    className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary/5"
                  >
                    <span className="flex items-center gap-3">
                      <History className="h-4 w-4 text-outline group-hover:text-primary" aria-hidden />
                      <span className="text-sm font-medium text-on-surface-variant">{term}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {hasQuery ? (
            searchQuery.isFetching && !searchQuery.data ? (
              <div className="space-y-3 p-4">
                <p className="px-1 text-xs font-medium text-on-surface-variant">{g.searchingLabel}</p>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-container-high" />
                ))}
              </div>
            ) : searchQuery.isError ? (
              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-destructive">
                    {searchQuery.error instanceof Error ? searchQuery.error.message : g.loadError}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={searchQuery.isFetching}
                    onClick={() => void searchQuery.refetch()}
                  >
                    {g.retry}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                  {showFabrics ? (
                    <section className="rounded-2xl bg-surface-container-low/40 p-4">
                      <div className="mb-3 flex items-center justify-between px-1">
                        <h3 className="font-headline text-[11px] font-bold uppercase tracking-[0.15em] text-outline/70">
                          {g.fabrics}
                        </h3>
                        <Layers className="h-4 w-4 text-primary/40" aria-hidden />
                      </div>
                      <div className="space-y-2">
                        {fabrics.length === 0 ? (
                          <p className="px-1 text-sm text-on-surface-variant">{g.noResults}</p>
                        ) : (
                          fabrics.map((f) => (
                            <Link
                              key={f.id}
                              href={withLocaleUrl(`/admin/fabrics/${f.id}`, locale)}
                              onClick={() => onNavigateResult(f.title)}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-container-lowest',
                                selectedId === `fabric-${f.id}` && 'bg-primary/8 ring-2 ring-primary/30'
                              )}
                            >
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                                {f.imageUrl ? (
                                  <Image src={f.imageUrl} alt={f.title} fill sizes="40px" className="object-cover" />
                                ) : null}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-on-surface">{f.title}</p>
                                <p className="text-[10px] font-medium uppercase tracking-wider text-outline">
                                  SKU: {f.sku ?? '—'}
                                </p>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </section>
                  ) : null}

                  {showSuppliers ? (
                    <section className="rounded-2xl bg-surface-container-low/40 p-4">
                      <div className="mb-3 flex items-center justify-between px-1">
                        <h3 className="font-headline text-[11px] font-bold uppercase tracking-[0.15em] text-outline/70">
                          {g.suppliers}
                        </h3>
                        <Factory className="h-4 w-4 text-primary/40" aria-hidden />
                      </div>
                      <div className="space-y-2">
                        {suppliers.length === 0 ? (
                          <p className="px-1 text-sm text-on-surface-variant">{g.noResults}</p>
                        ) : (
                          suppliers.map((s) => (
                            <Link
                              key={s.id}
                              href={withLocaleUrl(`/admin/suppliers?q=${encodeURIComponent(s.name)}`, locale)}
                              onClick={() => onNavigateResult(s.name)}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-container-lowest',
                                selectedId === `supplier-${s.id}` && 'bg-primary/8 ring-2 ring-primary/30'
                              )}
                            >
                              <div
                                className={cn(
                                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-headline text-xs font-bold',
                                  s.verified ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'
                                )}
                              >
                                {s.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-on-surface">{s.name}</p>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={cn(
                                      'h-1.5 w-1.5 rounded-full',
                                      s.verified ? 'bg-emerald-500' : 'bg-amber-500'
                                    )}
                                  />
                                  <p className="text-[10px] text-outline">
                                    {s.verified ? g.verifiedSupplier : g.onReview}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </section>
                  ) : null}
                </div>

                {showLeads ? (
                  <section className="mx-4 mb-4 rounded-2xl bg-primary/5 p-4">
                    <h3 className="px-2 py-2 font-headline text-[11px] font-bold uppercase tracking-[0.15em] text-primary/80">
                      {g.crmLeads}
                    </h3>
                    <div className="space-y-1">
                      {leads.length === 0 ? (
                        <p className="px-2 text-sm text-on-surface-variant">{g.noResults}</p>
                      ) : (
                        leads.map((l) => (
                          <Link
                            key={l.id}
                            href={withLocaleUrl(`/admin/leads/${l.id}`, locale)}
                            onClick={() => onNavigateResult(`${l.contactName} — ${l.companyName}`)}
                            className={cn(
                              'group flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all hover:bg-surface-container-lowest',
                              selectedId === `lead-${l.id}` && 'bg-primary/10 ring-2 ring-primary/30'
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container/30 text-[10px] font-bold text-primary">
                                {l.contactName
                                  .split(/\s+/)
                                  .map((p) => p[0] ?? '')
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-on-surface">{l.contactName}</p>
                                <p className="truncate text-[10px] text-outline">{l.companyName}</p>
                              </div>
                            </div>
                            <ArrowRight
                              className="h-4 w-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100"
                              aria-hidden
                            />
                          </Link>
                        ))
                      )}
                    </div>
                  </section>
                ) : null}
              </>
            )
          ) : null}

          {debouncedQ.trim().length === 0 ? (
            <GlobalSearchTrendingSection
              title={g.trendingCategories}
              emptyLabel={g.trendingEmpty}
              loadingLabel={g.searchingLabel}
              loadError={g.loadError}
              retryLabel={g.retry}
              trending={trending}
              isLoading={searchQuery.isFetching && !searchQuery.data}
              hasLoaded={Boolean(searchQuery.data)}
              isError={searchQuery.isError}
              isRetrying={searchQuery.isFetching}
              onRetry={() => void searchQuery.refetch()}
              onPick={(label) => setQ(label)}
            />
          ) : null}
        </div>

        <GlobalSearchFooter hintSelect={g.hintSelect} hintNavigate={g.hintNavigate} footerTag={g.footerTag} />
      </DialogContent>
    </Dialog>
  )
}
