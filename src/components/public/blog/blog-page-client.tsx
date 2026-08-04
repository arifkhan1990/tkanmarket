'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Search, Sparkles, X } from 'lucide-react'

import { BlogArticleCard } from '@/components/public/blog/blog-article-card'
import { BlogFeaturedHero } from '@/components/public/blog/blog-featured-hero'
import { BlogLoomingSection } from '@/components/public/blog/blog-looming-section'
import { BlogNewsletterForm } from '@/components/public/blog/blog-newsletter-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useBlogPostsInfinite } from '@/hooks/usePublicBlog'
import { useI18n } from '@/hooks/useI18n'
import { BLOG_TOPIC_PARAM, type BlogTopicParam } from '@/lib/blog-topics'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import type { BlogPostSummary } from '@/types/blog.types'

type Props = {
  initialTopic: BlogTopicParam
  initialFeatured: BlogPostSummary | null
}

type BlogStrings = {
  topicsAll: string
  topicSourcing: string
  topicLogistics: string
  topicSustainability: string
  topicTechnical: string
  topicTrends: string
  exploreTopics: string
  featuredBadge: string
  readMinutes: string
  readFullInsight: string
  searchPlaceholder: string
  searchClear: string
  searchResultsCount: string
  searchResultOne: string
  searchEmpty: string
  searchEmptyHint: string
  loadMore: string
  loadingMore: string
  paginationShowing: string
  sectionLatest: string
  sectionPopular: string
  eyebrow: string
  skeletonLoading: string
  emptyHeroTitle: string
  emptyHeroLead: string
  noTopicTitle: string
  noTopicLead: string
  placeholderSchedule: string
  loomingBadge: string
  loomingTitle: string
  loomingBody: string
  loomingExperts: string
  newsletterTitle: string
  newsletterSubtitle: string
  newsletterPlaceholder: string
  newsletterButton: string
  newsletterFootnote: string
  newsletterToastSuccess: string
  newsletterToastInvalid: string
  newsletterErrorGeneric: string
  newsletterAlready: string
  newsletterSubmitting: string
}

function categoryToTopicParam(category: string): BlogTopicParam {
  switch (category) {
    case 'Sourcing':
      return 'sourcing'
    case 'Logistics':
      return 'logistics'
    case 'Sustainability':
    case 'Sustainable Labs':
      return 'sustainability'
    case 'Technical Specs':
      return 'technical'
    case 'Market Trends':
      return 'trends'
    default:
      return 'all'
  }
}

function topicLabelFromKey(topic: BlogTopicParam, m: BlogStrings): string {
  switch (topic) {
    case 'sourcing':
      return m.topicSourcing
    case 'logistics':
      return m.topicLogistics
    case 'sustainability':
      return m.topicSustainability
    case 'technical':
      return m.topicTechnical
    case 'trends':
      return m.topicTrends
    default:
      return m.topicsAll
  }
}

function formatPostDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
      day: 'numeric'
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

export function BlogPageClient({ initialTopic, initialFeatured }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { messages, locale } = useI18n()
  const m = messages.blog

  const [searchInput, setSearchInput] = useState<string>(searchParams.get('q') ?? '')
  const [topic, setTopic] = useState<BlogTopicParam>(initialTopic)

  // Keep the URL ?topic= in sync so the page is shareable; debounced search
  // term lives entirely client-side to avoid spamming `router.replace`.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (topic === 'all') params.delete('topic')
    else params.set('topic', topic)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    // We deliberately ignore searchParams identity churn — only react to topic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, pathname, router])

  const isSearching = searchInput.trim().length >= 2
  const excludeLatest = !isSearching && topic === 'all'

  const query = useBlogPostsInfinite({
    topic,
    q: searchInput,
    limit: 9,
    excludeLatest
  })

  const pages = useMemo(() => query.data?.pages ?? [], [query.data?.pages])
  const allItems = useMemo(() => pages.flatMap((p) => p.items), [pages])
  const meta = pages[pages.length - 1]?.meta
  const categoryAggregates = pages[0]?.categories ?? []
  const total = meta?.total ?? 0
  const shown = allItems.length

  // Featured slot only renders for the unfiltered "all" view on page 1, so
  // search results don't visually duplicate it.
  const showFeatured = !isSearching && topic === 'all' && initialFeatured !== null
  const featuredHref = initialFeatured
    ? withLocaleUrl(`/blog/${initialFeatured.slug}`, locale)
    : null

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // No-op — search runs on debounce. We just blur to dismiss the keyboard.
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  const onClearSearch = useCallback(() => setSearchInput(''), [])

  const onPickTopic = useCallback((next: BlogTopicParam) => {
    setTopic(next)
  }, [])

  const onLoadMore = () => {
    if (!query.isFetchingNextPage && query.hasNextPage) {
      void query.fetchNextPage()
    }
  }

  const totalLabel =
    total === 1
      ? m.searchResultOne
      : m.searchResultsCount.replace('{count}', String(total))

  // Build the actual chips: always start with "all", then real DB categories
  // sorted by count desc (already sorted by the service).
  const chips: Array<{ key: BlogTopicParam; label: string; count: number | null }> = [
    { key: 'all', label: m.topicsAll, count: null },
    ...categoryAggregates.map((row) => {
      const key = categoryToTopicParam(row.category)
      return {
        key,
        label: topicLabelFromKey(key, m),
        count: row.count
      }
    })
  ]
  // De-dupe by key (Sustainability + Sustainable Labs both map to "sustainability")
  const dedupedChips = chips.filter(
    (chip, idx, arr) => arr.findIndex((c) => c.key === chip.key) === idx
  )

  const isInitialLoading = query.isLoading && allItems.length === 0
  const showEmpty = !isInitialLoading && allItems.length === 0 && !showFeatured

  return (
    <div className="space-y-10 md:space-y-20">
      {/* HERO + intro — spacing matches design/blog.html (mb-20 after hero) */}
      {showFeatured ? (
        <BlogFeaturedHero
          post={initialFeatured}
          fallbackTitle={m.emptyHeroTitle}
          fallbackLead={m.emptyHeroLead}
          badge={m.featuredBadge}
          readLabel={(minutes) => m.readMinutes.replace('{n}', String(minutes))}
          formattedDate={
            initialFeatured ? formatPostDate(initialFeatured.createdAt, locale) : m.placeholderSchedule
          }
          readFull={m.readFullInsight}
          href={featuredHref}
        />
      ) : null}

      {/* SEARCH + REFINE */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">{m.eyebrow}</p>
            <h2 className="mt-1 font-heading text-3xl font-black tracking-tight text-on-surface md:text-4xl">
              {isSearching ? totalLabel : m.sectionLatest}
            </h2>
          </div>
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="group flex w-full items-center gap-2 rounded-full border border-outline/15 bg-surface-container-lowest px-5 py-3 shadow-sm transition-all focus-within:border-primary/40 focus-within:shadow-[0_0_0_4px_rgba(26,64,194,0.08)] md:max-w-md"
          >
            <Search
              className="h-4 w-4 shrink-0 text-on-surface-variant/70 transition-colors group-focus-within:text-primary"
              aria-hidden
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={m.searchPlaceholder}
              aria-label={m.searchPlaceholder}
              maxLength={100}
              spellCheck={false}
              className="h-7 min-w-0 flex-1 border-none bg-transparent px-0 py-0 text-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:outline-none focus-visible:ring-0"
            />
            {searchInput.length > 0 ? (
              <button
                type="button"
                onClick={onClearSearch}
                className="rounded-full p-1 text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface"
                aria-label={m.searchClear}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <span className="mr-1 text-sm font-bold uppercase tracking-widest text-on-surface/40">
            {m.exploreTopics}
          </span>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {dedupedChips.map((chip) => {
              const isActive = topic === chip.key
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => onPickTopic(chip.key)}
                  aria-pressed={isActive}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-primary text-on-primary shadow-soft'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high dark:hover:bg-surface-container-high'
                  )}
                >
                  <span>{chip.label}</span>
                  {chip.count != null ? (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums',
                        isActive
                          ? 'bg-on-primary/15 text-on-primary'
                          : 'bg-background/60 text-on-surface-variant'
                      )}
                    >
                      {chip.count}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* GRID */}
      <section>
        {isInitialLoading ? (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3" aria-label={m.skeletonLoading}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : showEmpty ? (
          <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container-low/40 px-6 py-20 text-center">
            <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary/40" aria-hidden />
            <p className="font-heading text-xl font-bold text-on-surface">{m.searchEmpty}</p>
            <p className="mt-2 text-sm text-on-surface-variant">{m.searchEmptyHint}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
              {allItems.map((post, idx) => (
                <BlogArticleCard
                  key={post.id}
                  post={post}
                  href={withLocaleUrl(`/blog/${post.slug}`, locale)}
                  formattedDate={formatPostDate(post.createdAt, locale)}
                  authorByPrefix={m.byAuthor}
                  // First row of the grid is above the fold on lg+ — eager-load
                  // those images so the browser doesn't pick one of them as a
                  // late-arriving LCP candidate.
                  priority={idx < 3}
                />
              ))}
            </div>

            {query.isError ? (
              <div className="mt-8 rounded-2xl border border-error/40 bg-error/10 px-5 py-4 text-sm text-error">
                {query.error?.message ?? m.searchEmpty}
              </div>
            ) : null}

            {meta && (shown > 0 || total > 0) ? (
              <div className="mt-12 flex flex-col items-center gap-4">
                <p className="text-xs font-medium uppercase tracking-widest text-on-surface/50">
                  {m.paginationShowing
                    .replace('{shown}', String(shown))
                    .replace('{total}', String(total))}
                </p>
                {query.hasNextPage ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full px-10 font-bold"
                    onClick={onLoadMore}
                    disabled={query.isFetchingNextPage}
                  >
                    {query.isFetchingNextPage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        {m.loadingMore}
                      </>
                    ) : (
                      m.loadMore
                    )}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* SECONDARY: looming section + popular topics anchor link */}
      {!isSearching && dedupedChips.length > 1 ? (
        <section className="rounded-3xl bg-surface-container-low p-6 dark:bg-surface-container/60 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-black tracking-tight text-on-surface md:text-3xl">
                {m.sectionPopular}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {dedupedChips
                .filter((c) => c.key !== 'all')
                .slice(0, 5)
                .map((chip) => (
                  <Link
                    key={chip.key}
                    href={withLocaleUrl(`/blog?topic=${chip.key}`, locale)}
                    onClick={(e) => {
                      e.preventDefault()
                      onPickTopic(chip.key)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface shadow-sm transition-transform hover:-translate-y-0.5"
                  >
                    {chip.label}
                    {chip.count != null ? (
                      <span className="text-xs text-on-surface-variant">{chip.count}</span>
                    ) : null}
                  </Link>
                ))}
            </div>
          </div>
        </section>
      ) : null}

      <BlogLoomingSection
        badge={m.loomingBadge}
        title={m.loomingTitle}
        body={m.loomingBody}
        expertsHint={m.loomingExperts}
      />

      <BlogNewsletterForm
        locale={locale}
        title={m.newsletterTitle}
        subtitle={m.newsletterSubtitle}
        placeholder={m.newsletterPlaceholder}
        button={m.newsletterButton}
        footnote={m.newsletterFootnote}
        toastSuccess={m.newsletterToastSuccess}
        toastInvalid={m.newsletterToastInvalid}
        toastAlready={m.newsletterAlready}
        toastError={m.newsletterErrorGeneric}
        submittingLabel={m.newsletterSubmitting}
      />
    </div>
  )
}
