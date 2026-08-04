'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent
} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BadgeCheck,
  ChevronDown,
  Clock,
  Flame,
  Layers,
  Loader2,
  Package,
  Search,
  Tag,
  TrendingUp,
  X
} from 'lucide-react'

import { useNavbarSearch } from '@/hooks/useNavbarSearch'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import type {
  PublicSearchCategory,
  PublicSearchFabric,
  PublicSearchFabricType,
  PublicSearchResponse,
  PublicSearchSupplier
} from '@/types/public-search.types'

/* ────────────────────────────── constants ────────────────────────────── */

const RECENT_KEY = 'tkn:recent-searches'
const RECENT_MAX = 6
const PLACEHOLDER_INTERVAL_MS = 3200
const PLACEHOLDER_FADE_MS = 400

type SearchScope = 'all' | 'fabrics' | 'suppliers'

type NavbarSearchProps = {
  variant?: 'pill' | 'full'
  onNavigate?: () => void
  autoFocus?: boolean
  className?: string
}

type FlatRow =
  | { kind: 'recent'; value: string }
  | { kind: 'trending'; value: PublicSearchCategory }
  | { kind: 'fabric'; value: PublicSearchFabric }
  | { kind: 'supplier'; value: PublicSearchSupplier }
  | { kind: 'category'; value: PublicSearchCategory }
  | { kind: 'type'; value: PublicSearchFabricType }
  | { kind: 'all'; value: string }

/* ────────────────────────────── localStorage ────────────────────────────── */

function loadRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .slice(0, RECENT_MAX)
  } catch {
    return []
  }
}

function saveRecentSearch(value: string) {
  if (typeof window === 'undefined') return
  const trimmed = value.trim()
  if (trimmed.length < 2) return
  try {
    const existing = loadRecentSearches()
    const dedup = [trimmed, ...existing.filter((v) => v.toLowerCase() !== trimmed.toLowerCase())]
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(dedup.slice(0, RECENT_MAX)))
  } catch {
    // ignore quota / private mode errors
  }
}

function clearRecentSearches() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(RECENT_KEY)
  } catch {
    // ignore
  }
}

/* ────────────────────────────── helpers ────────────────────────────── */

function HighlightedText({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim()
  if (trimmed.length === 0) return <>{text}</>
  const lower = text.toLowerCase()
  const needle = trimmed.toLowerCase()
  const idx = lower.indexOf(needle)
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/15 px-0.5 text-primary">{text.slice(idx, idx + trimmed.length)}</mark>
      {text.slice(idx + trimmed.length)}
    </>
  )
}

function buildFlatRows(
  data: PublicSearchResponse | undefined,
  recent: string[],
  query: string,
  scope: SearchScope
): FlatRow[] {
  const rows: FlatRow[] = []
  const trimmed = query.trim()

  if (trimmed.length < 2) {
    for (const r of recent) rows.push({ kind: 'recent', value: r })
    if (data?.trending?.length) {
      for (const t of data.trending) rows.push({ kind: 'trending', value: t })
    }
    return rows
  }

  if (data) {
    if (scope === 'all' || scope === 'fabrics') {
      for (const ft of data.fabricTypes) rows.push({ kind: 'type', value: ft })
      for (const f of data.fabrics) rows.push({ kind: 'fabric', value: f })
    }
    if (scope === 'all' || scope === 'suppliers') {
      for (const s of data.suppliers) rows.push({ kind: 'supplier', value: s })
    }
    if (scope === 'all') {
      for (const c of data.categories) rows.push({ kind: 'category', value: c })
    }
  }
  rows.push({ kind: 'all', value: trimmed })
  return rows
}

/* ────────────────────────────── animated placeholder ────────────────────────────── */

function useAnimatedPlaceholder(
  placeholders: readonly string[],
  fallback: string,
  isTyping: boolean
): { text: string; fading: boolean } {
  const [index, setIndex] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (isTyping || placeholders.length === 0) return
    const interval = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setIndex((i) => (i + 1) % placeholders.length)
        setFading(false)
      }, PLACEHOLDER_FADE_MS)
    }, PLACEHOLDER_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isTyping, placeholders])

  if (isTyping || placeholders.length === 0) return { text: fallback, fading: false }
  return { text: placeholders[index] ?? fallback, fading }
}

/* ────────────────────────────── main component ────────────────────────────── */

export const NavbarSearch = forwardRef<HTMLInputElement, NavbarSearchProps>(function NavbarSearch(
  { variant = 'pill', onNavigate, autoFocus = false, className },
  ref
) {
  const router = useRouter()
  const { locale, messages } = useI18n()
  const m = messages.navbarSearch

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [recent, setRecent] = useState<string[]>(() => loadRecentSearches())
  const [highlightKey, setHighlightKey] = useState<string>('')
  const [scope, setScope] = useState<SearchScope>('all')
  const [scopeOpen, setScopeOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const scopeRef = useRef<HTMLDivElement>(null)
  const innerInputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const placeholders = m.placeholders as readonly string[]
  const { text: animatedPlaceholder, fading: placeholderFading } = useAnimatedPlaceholder(
    placeholders,
    m.placeholder,
    query.length > 0
  )

  const scopeLabels: Record<SearchScope, string> = useMemo(
    () => ({ all: m.scopeAll, fabrics: m.scopeFabrics, suppliers: m.scopeSuppliers }),
    [m]
  )

  useEffect(() => {
    if (typeof ref === 'function') ref(innerInputRef.current)
    else if (ref) ref.current = innerInputRef.current
  }, [ref])

  useEffect(() => {
    if (autoFocus) innerInputRef.current?.focus()
  }, [autoFocus])

  const searchQuery = useNavbarSearch(query, locale)
  const data = searchQuery.data

  const flatRows = useMemo(
    () => buildFlatRows(data, recent, query, scope),
    [data, recent, query, scope]
  )
  const showLoading = query.trim().length >= 2 && searchQuery.isFetching && !data

  const nextHighlightKey = `${query}::${scope}::${data ? '1' : '0'}`
  if (nextHighlightKey !== highlightKey) {
    setHighlightKey(nextHighlightKey)
    setActiveIndex(0)
  }

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        innerInputRef.current?.focus()
        innerInputRef.current?.select()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Click-outside closes the dropdown
  useEffect(() => {
    if (!open && !scopeOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (target && containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
        setScopeOpen(false)
      }
      if (target && scopeRef.current && !scopeRef.current.contains(target)) {
        setScopeOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, scopeOpen])

  const closeAndNavigate = useCallback(() => {
    setOpen(false)
    onNavigate?.()
  }, [onNavigate])

  const goToFullResults = useCallback(
    (term: string) => {
      const trimmed = term.trim()
      if (!trimmed) return
      saveRecentSearch(trimmed)
      setRecent(loadRecentSearches())

      const matchedType = data?.fabricTypes.find(
        (ft) => ft.label.toLowerCase() === trimmed.toLowerCase() || ft.value.toLowerCase() === trimmed.toLowerCase()
      )
      if (matchedType) {
        router.push(withLocaleUrl(`/fabrics?fabric_type=${encodeURIComponent(matchedType.value)}`, locale))
      } else {
        const scopeParam = scope !== 'all' ? `&scope=${scope}` : ''
        router.push(withLocaleUrl(`/fabrics?q=${encodeURIComponent(trimmed)}${scopeParam}`, locale))
      }
      closeAndNavigate()
    },
    [closeAndNavigate, data?.fabricTypes, locale, router, scope]
  )

  const activateRow = useCallback(
    (row: FlatRow) => {
      switch (row.kind) {
        case 'fabric':
          saveRecentSearch(row.value.title)
          setRecent(loadRecentSearches())
          router.push(withLocaleUrl(`/fabrics/${row.value.slug}`, locale))
          closeAndNavigate()
          return
        case 'supplier':
          saveRecentSearch(row.value.name)
          setRecent(loadRecentSearches())
          router.push(withLocaleUrl(`/suppliers/${row.value.slug}`, locale))
          closeAndNavigate()
          return
        case 'type':
          saveRecentSearch(row.value.label)
          setRecent(loadRecentSearches())
          router.push(
            withLocaleUrl(`/fabrics?fabric_type=${encodeURIComponent(row.value.value)}`, locale)
          )
          closeAndNavigate()
          return
        case 'category':
        case 'trending':
          router.push(
            withLocaleUrl(`/fabrics?category_slug=${encodeURIComponent(row.value.slug)}`, locale)
          )
          closeAndNavigate()
          return
        case 'recent':
          setQuery(row.value)
          goToFullResults(row.value)
          return
        case 'all':
          goToFullResults(row.value)
          return
      }
    },
    [closeAndNavigate, goToFullResults, locale, router]
  )

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length === 0) return
    if (open && flatRows.length > 0 && activeIndex >= 0 && activeIndex < flatRows.length) {
      const row = flatRows[activeIndex]
      if (row && row.kind !== 'all') {
        activateRow(row)
        return
      }
    }
    goToFullResults(trimmed)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((idx) => (flatRows.length === 0 ? 0 : (idx + 1) % flatRows.length))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((idx) =>
        flatRows.length === 0 ? 0 : (idx - 1 + flatRows.length) % flatRows.length
      )
      return
    }
    if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        setOpen(false)
      }
      return
    }
    if (e.key === 'Tab' && !e.shiftKey && scope === 'all') {
      // Quick scope cycling via Tab (no prevent — let browser handle if no scope to cycle)
    }
  }

  const onClear = () => {
    setQuery('')
    innerInputRef.current?.focus()
  }

  const trimmed = query.trim()
  const hasResults = flatRows.length > 0
  const hasQuery = trimmed.length >= 2
  const isEmptyState = hasQuery && !showLoading && data && flatRows.length === 1

  const totals = data?.totals

  /* ────────────────────────────── scope selector ────────────────────────────── */

  const scopeSelector = (
    <div ref={scopeRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setScopeOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
          variant === 'pill'
            ? 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            : 'bg-surface-container px-3 py-1.5 text-on-surface-variant hover:text-on-surface'
        )}
        aria-label="Search scope"
      >
        <span>{scopeLabels[scope]}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', scopeOpen && 'rotate-180')} aria-hidden />
      </button>
      {scopeOpen ? (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[8rem] overflow-hidden rounded-xl border border-outline/15 bg-surface-container-lowest shadow-xl">
          {(['all', 'fabrics', 'suppliers'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setScope(s)
                setScopeOpen(false)
                innerInputRef.current?.focus()
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-medium transition-colors',
                s === scope
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface hover:bg-surface-container-low'
              )}
            >
              {s === 'all' ? (
                <Search className="h-3.5 w-3.5" aria-hidden />
              ) : s === 'fabrics' ? (
                <Package className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              )}
              <span>{scopeLabels[s]}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )

  /* ────────────────────────────── scope tabs in dropdown ────────────────────────────── */

  const scopeTabs = hasQuery && totals ? (
    <div className="flex items-center gap-1 border-b border-outline/10 px-3 py-2">
      {(['all', 'fabrics', 'suppliers'] as const).map((s) => {
        const count =
          s === 'all'
            ? totals.fabrics + totals.suppliers + totals.categories
            : s === 'fabrics'
              ? totals.fabrics
              : totals.suppliers
        return (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
              s === scope
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            )}
          >
            <span>{scopeLabels[s]}</span>
            {count > 0 ? (
              <span
                className={cn(
                  'min-w-[1.1rem] rounded-full px-1 py-0.5 text-center text-[10px] font-bold leading-none',
                  s === scope
                    ? 'bg-white/20 text-on-primary'
                    : 'bg-outline/10 text-on-surface-variant'
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  ) : null

  /* ────────────────────────────── pill / full wrappers ────────────────────────────── */

  const wrapperClass =
    variant === 'pill'
      ? 'group relative flex w-full items-center gap-1.5 rounded-full border border-outline/15 bg-surface-container-lowest pl-2 pr-1.5 py-1 shadow-sm transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-[0_0_0_4px_rgba(26,64,194,0.08)] hover:border-outline/30'
      : 'group relative flex w-full items-center gap-2 rounded-2xl border border-outline/15 bg-surface-container-low px-3.5 py-2.5 focus-within:border-primary/40'

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={onSubmit} role="search" autoComplete="off">
        <div
          className={wrapperClass}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-owns={listboxId}
        >
          {/* Scope selector */}
          {scopeSelector}

          {/* Divider */}
          {variant === 'pill' ? (
            <div className="h-5 w-px shrink-0 bg-outline/15" aria-hidden />
          ) : null}

          <Search
            className="h-4 w-4 shrink-0 text-on-surface-variant/70 transition-colors group-focus-within:text-primary"
            aria-hidden
          />

          {/* Input with animated placeholder */}
          <div className="relative min-w-0 flex-1">
            <input
              ref={innerInputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={query.length > 0 ? m.placeholder : ' '}
              aria-label={m.placeholder}
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={
                open && activeIndex >= 0 && activeIndex < flatRows.length
                  ? `${listboxId}-row-${activeIndex}`
                  : undefined
              }
              inputMode="search"
              maxLength={100}
              spellCheck={false}
              className={cn(
                'h-7 w-full min-w-0 rounded-xl border-none bg-transparent px-0 py-0 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:bg-transparent focus:outline-none focus-visible:ring-0',
                variant === 'pill' && 'min-w-[100px] xl:min-w-[140px] 2xl:min-w-[180px]'
              )}
            />
            {/* Animated placeholder overlay */}
            {query.length === 0 ? (
              <span
                className={cn(
                  'pointer-events-none absolute inset-0 flex items-center truncate text-sm text-on-surface-variant/60 transition-opacity',
                  placeholderFading ? 'opacity-0' : 'opacity-100'
                )}
                style={{ transitionDuration: `${PLACEHOLDER_FADE_MS}ms` }}
                aria-hidden
              >
                {animatedPlaceholder}
              </span>
            ) : null}
          </div>

          {query.length > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full p-1 text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface"
              aria-label={m.clear}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : variant === 'pill' ? (
            <kbd
              className="hidden items-center gap-0.5 rounded border border-outline/20 bg-surface-container px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant xl:inline-flex"
              aria-hidden
            >
              ⌘K
            </kbd>
          ) : null}
          {variant === 'pill' ? (
            <button
              type="submit"
              className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-on-primary transition-all hover:scale-105 hover:shadow-md active:scale-95"
            >
              {m.action}
            </button>
          ) : null}
        </div>
      </form>

      {/* ────────────────────────────── Dropdown ────────────────────────────── */}
      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={m.placeholder}
          className={cn(
            'absolute z-50 mt-2 max-h-[min(600px,80vh)] w-full overflow-hidden rounded-2xl border border-outline/15 bg-surface-container-lowest shadow-2xl dark:bg-card',
            variant === 'pill' && 'left-1/2 w-[min(600px,calc(100vw-2rem))] -translate-x-1/2'
          )}
        >
          {/* Scope tabs when searching */}
          {scopeTabs}

          {showLoading ? (
            <div className="flex items-center gap-3 px-5 py-6 text-sm text-on-surface-variant">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
              <span>{m.loading}</span>
            </div>
          ) : null}

          {searchQuery.isError ? (
            <div className="px-5 py-6 text-sm text-error">{m.errorLoad}</div>
          ) : null}

          {!showLoading && !searchQuery.isError ? (
            <RowsList
              rows={flatRows}
              recent={recent}
              activeIndex={activeIndex}
              listboxId={listboxId}
              hasQuery={hasQuery}
              isEmptyState={!!isEmptyState}
              query={trimmed}
              trendingChips={!hasQuery ? data?.trending ?? [] : []}
              onActivate={activateRow}
              onHover={setActiveIndex}
              onClearRecent={() => {
                clearRecentSearches()
                setRecent([])
              }}
              onTrendingClick={(cat) => {
                router.push(
                  withLocaleUrl(
                    `/fabrics?category_slug=${encodeURIComponent(cat.slug)}`,
                    locale
                  )
                )
                closeAndNavigate()
              }}
              messages={m}
              locale={locale}
            />
          ) : null}

          {hasResults && !showLoading ? (
            <div className="border-t border-outline/10 bg-surface-container-low/50 px-5 py-2.5 text-[11px] text-on-surface-variant">
              <span className="inline-flex items-center gap-3">
                <span>
                  <kbd className="rounded border border-outline/20 bg-background px-1 font-bold">↑</kbd>{' '}
                  <kbd className="rounded border border-outline/20 bg-background px-1 font-bold">↓</kbd>{' '}
                  {m.kbdNavigate}
                </span>
                <span>
                  <kbd className="rounded border border-outline/20 bg-background px-1 font-bold">↵</kbd>{' '}
                  {m.kbdSelect}
                </span>
                <span>
                  <kbd className="rounded border border-outline/20 bg-background px-1 font-bold">esc</kbd>{' '}
                  {m.kbdClose}
                </span>
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
})

/* ────────────────────────────── RowsList ────────────────────────────── */

type RowsListProps = {
  rows: FlatRow[]
  recent: string[]
  activeIndex: number
  listboxId: string
  hasQuery: boolean
  isEmptyState: boolean
  query: string
  trendingChips: PublicSearchCategory[]
  onActivate: (row: FlatRow) => void
  onHover: (index: number) => void
  onClearRecent: () => void
  onTrendingClick: (cat: PublicSearchCategory) => void
  messages: {
    sectionRecent: string
    sectionTrending: string
    sectionFabrics: string
    sectionSuppliers: string
    sectionCategories: string
    sectionFabricTypes: string
    clearRecent: string
    viewAll: string
    emptyTitle: string
    emptyHint: string
    sku: string
    popularNow: string
    typeProducts: string
  }
  locale: 'en' | 'ru' | 'zh'
}

function RowsList({
  rows,
  recent,
  activeIndex,
  listboxId,
  hasQuery,
  isEmptyState,
  query,
  trendingChips,
  onActivate,
  onHover,
  onClearRecent,
  onTrendingClick,
  messages
}: RowsListProps) {
  const groups: Array<{ key: string; title: string; rows: Array<{ row: FlatRow; index: number }> }> = []
  let currentKind: FlatRow['kind'] | null = null
  rows.forEach((row, index) => {
    if (row.kind !== currentKind) {
      currentKind = row.kind
      groups.push({
        key: row.kind,
        title:
          row.kind === 'recent'
            ? messages.sectionRecent
            : row.kind === 'trending'
              ? messages.sectionTrending
              : row.kind === 'type'
                ? messages.sectionFabricTypes
                : row.kind === 'fabric'
                  ? messages.sectionFabrics
                  : row.kind === 'supplier'
                    ? messages.sectionSuppliers
                    : row.kind === 'category'
                      ? messages.sectionCategories
                      : '',
        rows: []
      })
    }
    groups[groups.length - 1]?.rows.push({ row, index })
  })

  if (rows.length === 0 && trendingChips.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <Search className="mx-auto mb-3 h-8 w-8 text-outline" aria-hidden />
        <p className="text-sm font-bold text-on-surface">{messages.emptyTitle}</p>
        <p className="mt-1 text-xs text-on-surface-variant">{messages.emptyHint}</p>
      </div>
    )
  }

  if (isEmptyState) {
    return (
      <div>
        <div className="px-5 pb-2 pt-8 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-outline" aria-hidden />
          <p className="text-sm font-bold text-on-surface">{messages.emptyTitle}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{messages.emptyHint}</p>
        </div>
        <RenderGroups
          groups={groups}
          activeIndex={activeIndex}
          listboxId={listboxId}
          query={query}
          messages={messages}
          onActivate={onActivate}
          onHover={onHover}
          onClearRecent={onClearRecent}
          showRecentClear={!hasQuery && recent.length > 0}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Trending chips — shown when no query */}
      {!hasQuery && trendingChips.length > 0 ? (
        <div className="border-b border-outline/10 px-4 pb-3 pt-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">
              {messages.popularNow}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trendingChips.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => onTrendingClick(cat)}
                className="inline-flex items-center gap-1 rounded-full border border-outline/15 bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary active:scale-95"
              >
                <TrendingUp className="h-3 w-3 text-on-surface-variant" aria-hidden />
                {cat.label}
                <span className="text-[10px] text-on-surface-variant">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <RenderGroups
        groups={groups}
        activeIndex={activeIndex}
        listboxId={listboxId}
        query={query}
        messages={messages}
        onActivate={onActivate}
        onHover={onHover}
        onClearRecent={onClearRecent}
        showRecentClear={!hasQuery && recent.length > 0}
      />
    </div>
  )
}

/* ────────────────────────────── RenderGroups ────────────────────────────── */

function RenderGroups({
  groups,
  activeIndex,
  listboxId,
  query,
  messages,
  onActivate,
  onHover,
  onClearRecent,
  showRecentClear
}: {
  groups: Array<{ key: string; title: string; rows: Array<{ row: FlatRow; index: number }> }>
  activeIndex: number
  listboxId: string
  query: string
  messages: RowsListProps['messages']
  onActivate: (row: FlatRow) => void
  onHover: (index: number) => void
  onClearRecent: () => void
  showRecentClear: boolean
}) {
  return (
    <div className="py-2">
      {groups.map((group) => (
        <div key={group.key} className="px-2 pb-1">
          {group.title ? (
            <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
                {group.title}
              </p>
              {group.key === 'recent' && showRecentClear ? (
                <button
                  type="button"
                  onClick={onClearRecent}
                  className="text-[10px] font-bold uppercase tracking-widest text-outline hover:text-on-surface"
                >
                  {messages.clearRecent}
                </button>
              ) : null}
            </div>
          ) : null}
          {group.rows.map(({ row, index }) => (
            <Row
              key={`${group.key}-${index}`}
              row={row}
              query={query}
              isActive={index === activeIndex}
              listboxId={listboxId}
              flatIndex={index}
              messages={messages}
              onActivate={onActivate}
              onHover={onHover}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ────────────────────────────── Row ────────────────────────────── */

function Row({
  row,
  query,
  isActive,
  listboxId,
  flatIndex,
  messages,
  onActivate,
  onHover
}: {
  row: FlatRow
  query: string
  isActive: boolean
  listboxId: string
  flatIndex: number
  messages: RowsListProps['messages']
  onActivate: (row: FlatRow) => void
  onHover: (index: number) => void
}) {
  const id = `${listboxId}-row-${flatIndex}`
  const baseClass = cn(
    'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
    isActive ? 'bg-primary/10 text-on-surface' : 'text-on-surface hover:bg-surface-container-low'
  )

  const onClick = () => onActivate(row)
  const onMouseEnter = () => onHover(flatIndex)

  if (row.kind === 'fabric') {
    const f = row.value
    return (
      <Link
        href="#"
        onClick={(e) => {
          e.preventDefault()
          onClick()
        }}
        onMouseEnter={onMouseEnter}
        id={id}
        role="option"
        aria-selected={isActive}
        className={baseClass}
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-high shadow-sm ring-1 ring-outline/10">
          {f.imageUrl ? (
            <Image
              src={f.imageUrl}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
              unoptimized={isRemoteImageSrc(f.imageUrl)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
              <Package className="h-5 w-5" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            <HighlightedText text={f.title} query={query} />
          </p>
          <p className="mt-0.5 truncate text-xs text-on-surface-variant">
            {f.sku ? `${messages.sku}: ${f.sku}` : f.fabricType ?? ''}
            {f.supplierName ? ` · ${f.supplierName}` : ''}
          </p>
        </div>
        {isActive ? (
          <kbd className="hidden shrink-0 rounded border border-outline/20 bg-surface-container px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant sm:inline-block" aria-hidden>↵</kbd>
        ) : null}
      </Link>
    )
  }

  if (row.kind === 'supplier') {
    const s = row.value
    return (
      <Link
        href="#"
        onClick={(e) => {
          e.preventDefault()
          onClick()
        }}
        onMouseEnter={onMouseEnter}
        id={id}
        role="option"
        aria-selected={isActive}
        className={baseClass}
      >
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-high shadow-sm ring-1 ring-outline/10">
          {s.logoUrl ? (
            <Image
              src={s.logoUrl}
              alt=""
              fill
              sizes="48px"
              className="object-contain p-1"
              unoptimized={isRemoteImageSrc(s.logoUrl)}
            />
          ) : (
            <span className="text-base font-black text-on-surface-variant" aria-hidden>
              {s.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
            <HighlightedText text={s.name} query={query} />
            {s.verified ? (
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            ) : null}
          </p>
          {s.location ? (
            <p className="mt-0.5 truncate text-xs text-on-surface-variant">{s.location}</p>
          ) : null}
        </div>
        {isActive ? (
          <kbd className="hidden shrink-0 rounded border border-outline/20 bg-surface-container px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant sm:inline-block" aria-hidden>↵</kbd>
        ) : null}
      </Link>
    )
  }

  if (row.kind === 'type') {
    const ft = row.value
    return (
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        id={id}
        role="option"
        aria-selected={isActive}
        className={baseClass}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Layers className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            <HighlightedText text={ft.label} query={query} />
          </p>
          <p className="truncate text-xs text-on-surface-variant">
            {messages.typeProducts.replace('{n}', String(ft.count))}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {ft.value.toUpperCase()}
        </span>
        {isActive ? (
          <kbd className="hidden shrink-0 rounded border border-outline/20 bg-surface-container px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant sm:inline-block" aria-hidden>↵</kbd>
        ) : null}
      </button>
    )
  }

  if (row.kind === 'category' || row.kind === 'trending') {
    const c = row.value
    return (
      <Link
        href="#"
        onClick={(e) => {
          e.preventDefault()
          onClick()
        }}
        onMouseEnter={onMouseEnter}
        id={id}
        role="option"
        aria-selected={isActive}
        className={baseClass}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container/40 text-on-secondary-container dark:bg-secondary-container/25">
          {row.kind === 'trending' ? (
            <TrendingUp className="h-4 w-4" aria-hidden />
          ) : (
            <Tag className="h-4 w-4" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            <HighlightedText text={c.label} query={query} />
          </p>
          <p className="truncate text-xs text-on-surface-variant">{c.count}</p>
        </div>
      </Link>
    )
  }

  if (row.kind === 'recent') {
    return (
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        id={id}
        role="option"
        aria-selected={isActive}
        className={baseClass}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
          <Clock className="h-4 w-4" aria-hidden />
        </div>
        <span className="truncate text-sm font-semibold">{row.value}</span>
      </button>
    )
  }

  // 'all'
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      id={id}
      role="option"
      aria-selected={isActive}
      className={cn(
        'mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-primary transition-colors',
        isActive ? 'bg-primary/10' : 'hover:bg-surface-container-low'
      )}
    >
      <Search className="h-4 w-4" aria-hidden />
      {messages.viewAll.replace('{q}', row.value)}
    </button>
  )
}
