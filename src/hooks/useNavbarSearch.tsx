'use client'

import { useEffect, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'

import type { ApiResponse } from '@/lib/utils/api-response'
import type { PublicSearchResponse } from '@/types/public-search.types'
import type { Locale } from '@/types/i18n.types'

const DEBOUNCE_MS = 220

export function useDebouncedValue<T>(value: T, delay: number = DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function useNavbarSearch(rawQuery: string, locale: Locale) {
  const debouncedQuery = useDebouncedValue(rawQuery.trim())

  return useQuery({
    // Cache-key includes the locale so changing language doesn't show stale
    // titles for a few hundred ms.
    queryKey: ['public-search', locale, debouncedQuery],
    queryFn: async ({ signal }): Promise<PublicSearchResponse> => {
      const url = new URL('/api/v1/public/search', window.location.origin)
      if (debouncedQuery.length > 0) url.searchParams.set('q', debouncedQuery)
      url.searchParams.set('locale', locale)

      const res = await fetch(url.toString(), { signal })
      const json = (await res.json()) as ApiResponse<PublicSearchResponse> | {
        success: false
        error: { message: string }
      }
      if (!res.ok || !('success' in json) || !json.success) {
        throw new Error(
          'success' in json && !json.success ? json.error.message : 'Search failed'
        )
      }
      return json.data
    },
    // Keep previous results while the user keeps typing → no flicker.
    placeholderData: keepPreviousData,
    staleTime: 15 * 1000,
    gcTime: 60 * 1000,
    retry: 1
  })
}
