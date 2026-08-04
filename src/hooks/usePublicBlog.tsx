'use client'

import { useEffect, useState } from 'react'
import { useInfiniteQuery, useMutation, type InfiniteData } from '@tanstack/react-query'

import type { ApiResponse, PaginationMeta } from '@/lib/utils/api-response'
import type { BlogCategoryAggregate } from '@/services/blog.service'
import type { BlogPostSummary } from '@/types/blog.types'
import type { Locale } from '@/types/i18n.types'

const DEBOUNCE_MS = 250

export type BlogListPage = {
  items: BlogPostSummary[]
  categories: BlogCategoryAggregate[]
  meta: PaginationMeta
}

export type BlogListParams = {
  topic: string
  q: string
  limit?: number
  excludeLatest?: boolean
}

function useDebouncedValue<T>(value: T, delay = DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

/**
 * Infinite-paginated, debounced blog list. One round-trip per page (each page
 * also returns category aggregates so the chips render in the same response —
 * no extra request, no N+1).
 */
export function useBlogPostsInfinite(params: BlogListParams) {
  const debouncedQ = useDebouncedValue(params.q.trim())
  const limit = params.limit ?? 9
  const excludeLatest = params.excludeLatest ?? false

  return useInfiniteQuery<BlogListPage, Error, InfiniteData<BlogListPage>, readonly unknown[], number>({
    queryKey: ['public-blog', params.topic, debouncedQ, limit, excludeLatest],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const url = new URL('/api/v1/public/blog', window.location.origin)
      url.searchParams.set('page', String(pageParam))
      url.searchParams.set('limit', String(limit))
      if (params.topic && params.topic !== 'all') url.searchParams.set('topic', params.topic)
      if (debouncedQ.length >= 2) url.searchParams.set('q', debouncedQ)
      if (excludeLatest) url.searchParams.set('excludeLatest', 'true')

      const res = await fetch(url.toString(), { signal })
      const json = (await res.json()) as
        | (ApiResponse<{ items: BlogPostSummary[]; categories: BlogCategoryAggregate[] }> & {
            meta: PaginationMeta
          })
        | { success: false; error: { message: string } }

      if (!res.ok || !('success' in json) || !json.success) {
        throw new Error(
          'success' in json && !json.success ? json.error.message : 'Failed to load blog posts'
        )
      }
      return {
        items: json.data.items,
        categories: json.data.categories,
        meta: json.meta
      }
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.meta.page + 1
      return nextPage <= lastPage.meta.totalPages ? nextPage : undefined
    },
    staleTime: 30 * 1000
  })
}

export type SubscribeResult = { created: boolean }

export function useNewsletterSubscribe() {
  return useMutation<SubscribeResult, Error, { email: string; locale: Locale; source?: string }>({
    mutationFn: async (input) => {
      const res = await fetch('/api/v1/public/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: input.email,
          locale: input.locale,
          source: input.source ?? 'blog'
        })
      })
      const json = (await res.json()) as
        | ApiResponse<SubscribeResult>
        | { success: false; error: { message: string } }
      if (!res.ok || !('success' in json) || !json.success) {
        throw new Error(
          'success' in json && !json.success ? json.error.message : 'Subscription failed'
        )
      }
      return json.data
    }
  })
}
