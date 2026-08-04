'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminGlobalSearchResponse } from '@/types/admin-global-search.types'

const RECENT_KEY = 'tkan_admin_global_search_recent'
const MAX_RECENT = 8

export function readRecentAdminSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

export function pushRecentAdminSearch(term: string) {
  const t = term.trim()
  if (t.length < 2) return
  if (typeof window === 'undefined') return
  const prev = readRecentAdminSearches().filter((x) => x.toLowerCase() !== t.toLowerCase())
  const next = [t, ...prev].slice(0, MAX_RECENT)
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}

function useDebouncedValue(value: string, ms: number) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return debounced
}

export function useAdminGlobalSearchQuery(q: string, options?: { enabled?: boolean }) {
  const debounced = useDebouncedValue(q, 320)
  const enabled = options?.enabled ?? true

  const query = useQuery({
    queryKey: ['admin-global-search', debounced],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('q', debounced)
      const res = await fetch(`/api/v1/admin/global-search?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AdminGlobalSearchResponse>
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Search failed'
        throw new Error(msg)
      }
      return json.data
    },
    enabled,
    staleTime: 20 * 1000
  })

  return { ...query, debouncedQ: debounced }
}
