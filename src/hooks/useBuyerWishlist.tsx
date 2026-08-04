'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

import type { PaginationMeta } from '@/types/api-envelope.types'
import type {
  BuyerWishlistBatchStatusResponse,
  BuyerWishlistListResponse,
  BuyerWishlistStatusResponse
} from '@/types/buyer-wishlist.types'

import { useI18n } from '@/hooks/useI18n'
import {
  isWishlistApiSuccess,
  resolveWishlistApiMessage
} from '@/lib/wishlist/resolve-wishlist-api-message'

export type BuyerWishlistQueryParams = {
  page: number
  limit: number
  collection?: string
  q?: string
  enabled?: boolean
}

export function useWishlistBatchStatusQuery(fabricIds: number[], enabled = true) {
  const { status } = useSession()
  const { messages } = useI18n()
  const toasts = messages.wishlistPage.toasts
  const sortedKey = React.useMemo(
    () =>
      [...new Set(fabricIds)]
        .filter((id) => id > 0)
        .sort((a, b) => a - b)
        .join(','),
    [fabricIds]
  )

  const query = useQuery({
    queryKey: ['wishlist-batch', sortedKey],
    enabled: status === 'authenticated' && sortedKey.length > 0 && enabled,
    queryFn: async () => {
      const ids = sortedKey
        .split(',')
        .map((x) => Number.parseInt(x, 10))
        .filter((n) => Number.isFinite(n) && n > 0)
      if (ids.length === 0) return new Set<number>()

      const res = await fetch('/api/v1/wishlist/batch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fabricIds: ids })
      })
      const json = (await res.json()) as unknown
      if (isWishlistApiSuccess<BuyerWishlistBatchStatusResponse>(json)) {
        return new Set(json.data.savedIds)
      }
      throw new Error(resolveWishlistApiMessage(json, toasts.loadFailed, toasts))
    },
    staleTime: 45 * 1000
  })

  return query
}

export function useWishlistStatusQuery(fabricId: number, enabled: boolean) {
  const { messages } = useI18n()
  const toasts = messages.wishlistPage.toasts

  const query = useQuery({
    queryKey: ['wishlist-status', fabricId],
    enabled: enabled && fabricId > 0,
    queryFn: async () => {
      const url = new URL('/api/v1/wishlist/status', window.location.origin)
      url.searchParams.set('fabricId', String(fabricId))
      const res = await fetch(url.toString())
      const json = (await res.json()) as unknown

      if (isWishlistApiSuccess<BuyerWishlistStatusResponse>(json)) {
        return json.data.inWishlist
      }

      throw new Error(resolveWishlistApiMessage(json, toasts.loadFailed, toasts))
    },
    staleTime: 20 * 1000
  })

  return query
}

type BatchSnapshot = Array<[ReturnType<typeof JSON.stringify>, Set<number> | undefined]>

const WISHLIST_COUNT_KEY = ['wishlist-count'] as const

function snapshotBatchQueries(queryClient: ReturnType<typeof useQueryClient>): BatchSnapshot {
  // Save the current state of every batch-status cache so we can roll back on error.
  return queryClient.getQueriesData<Set<number>>({ queryKey: ['wishlist-batch'] }).map(([key, val]) => [
    JSON.stringify(key),
    val instanceof Set ? new Set(val) : undefined
  ])
}

function restoreBatchQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: BatchSnapshot
) {
  for (const [keyJson, val] of snapshot) {
    queryClient.setQueryData(JSON.parse(keyJson) as readonly unknown[], val)
  }
}

function patchBatchQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  fabricId: number,
  add: boolean
) {
  // Optimistically update every cached batch-status query that includes this fabricId.
  queryClient.setQueriesData<Set<number>>({ queryKey: ['wishlist-batch'] }, (prev) => {
    if (!(prev instanceof Set)) return prev
    const next = new Set(prev)
    if (add) next.add(fabricId)
    else next.delete(fabricId)
    return next
  })
}

function patchWishlistCount(
  queryClient: ReturnType<typeof useQueryClient>,
  delta: number,
  fabricAlreadySaved: boolean
) {
  // Skip when the action is a no-op (e.g. adding a fabric that's already saved).
  if (delta > 0 && fabricAlreadySaved) return
  if (delta < 0 && !fabricAlreadySaved) return
  queryClient.setQueryData<number>(WISHLIST_COUNT_KEY, (prev) => {
    const base = typeof prev === 'number' ? prev : 0
    return Math.max(0, base + delta)
  })
}

/** Lightweight count for the header badge. Falls back to 0 when unauthenticated. */
export function useWishlistCountNav() {
  const { status } = useSession()

  const query = useQuery({
    queryKey: WISHLIST_COUNT_KEY,
    enabled: status === 'authenticated',
    queryFn: async () => {
      const res = await fetch('/api/v1/wishlist/count')
      const json = (await res.json()) as unknown
      if (isWishlistApiSuccess<{ count: number }>(json)) {
        return json.data.count
      }
      throw new Error('Failed to load wishlist count')
    },
    staleTime: 60 * 1000
  })

  const count = status === 'authenticated' && typeof query.data === 'number' ? query.data : 0
  return { count, isAuthenticated: status === 'authenticated' }
}

export function useWishlistAddMutation() {
  const queryClient = useQueryClient()
  const { messages } = useI18n()
  const toasts = messages.wishlistPage.toasts

  return useMutation({
    mutationFn: async (fabricId: number) => {
      const res = await fetch('/api/v1/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fabricId })
      })

      const json = (await res.json()) as unknown
      if (isWishlistApiSuccess<{ ok: boolean }>(json)) {
        return json.data
      }
      throw new Error(resolveWishlistApiMessage(json, toasts.saveFailed, toasts))
    },
    onMutate: async (fabricId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist-batch'] })
      await queryClient.cancelQueries({ queryKey: ['wishlist-status', fabricId] })
      await queryClient.cancelQueries({ queryKey: WISHLIST_COUNT_KEY })
      const previousBatch = snapshotBatchQueries(queryClient)
      const previousStatus = queryClient.getQueryData<boolean>(['wishlist-status', fabricId])
      const previousCount = queryClient.getQueryData<number>(WISHLIST_COUNT_KEY)
      patchBatchQueries(queryClient, fabricId, true)
      queryClient.setQueryData(['wishlist-status', fabricId], true)
      patchWishlistCount(queryClient, +1, previousStatus === true)
      return { previousBatch, previousStatus, previousCount }
    },
    onError: (err, fabricId, ctx) => {
      if (ctx) {
        restoreBatchQueries(queryClient, ctx.previousBatch)
        queryClient.setQueryData(['wishlist-status', fabricId], ctx.previousStatus)
        if (ctx.previousCount !== undefined) {
          queryClient.setQueryData(WISHLIST_COUNT_KEY, ctx.previousCount)
        }
      }
      toast.error(err instanceof Error ? err.message : toasts.saveFailed)
    },
    onSuccess: () => {
      toast.success(toasts.saved)
    },
    onSettled: async (_data, _err, fabricId) => {
      // Re-fetch the authoritative list & status; batch queries already updated optimistically.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['buyer-wishlist'] }),
        queryClient.invalidateQueries({ queryKey: ['wishlist-status', fabricId] }),
        queryClient.invalidateQueries({ queryKey: WISHLIST_COUNT_KEY })
      ])
    }
  })
}

export function useBuyerWishlistQuery(params: BuyerWishlistQueryParams) {
  const { messages } = useI18n()
  const toasts = messages.wishlistPage.toasts

  const query = useQuery({
    queryKey: ['buyer-wishlist', params.page, params.limit, params.collection, params.q],
    enabled: params.enabled !== false,
    queryFn: async () => {
      const url = new URL('/api/v1/wishlist', window.location.origin)
      url.searchParams.set('page', String(params.page))
      url.searchParams.set('limit', String(params.limit))
      if (params.collection && params.collection !== '__all__') {
        url.searchParams.set('collection', params.collection)
      }
      if (params.q) url.searchParams.set('q', params.q)

      const res = await fetch(url.toString())
      const json = (await res.json()) as unknown

      if (isWishlistApiSuccess<BuyerWishlistListResponse>(json)) {
        const meta = 'meta' in json ? (json as { meta?: PaginationMeta }).meta : undefined
        return { data: json.data, meta }
      }

      throw new Error(resolveWishlistApiMessage(json, toasts.loadFailed, toasts))
    },
    staleTime: 30 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : toasts.loadFailed)
  }, [query.error, toasts.loadFailed])

  return query
}

export function useBuyerWishlistRemoveMutation() {
  const queryClient = useQueryClient()
  const { messages } = useI18n()
  const toasts = messages.wishlistPage.toasts

  return useMutation({
    mutationFn: async (fabricId: number) => {
      const url = new URL('/api/v1/wishlist', window.location.origin)
      url.searchParams.set('fabricId', String(fabricId))

      const res = await fetch(url.toString(), { method: 'DELETE' })
      const json = (await res.json()) as unknown
      if (isWishlistApiSuccess<{ ok: boolean }>(json)) {
        return json.data
      }
      throw new Error(resolveWishlistApiMessage(json, toasts.removeFailed, toasts))
    },
    onMutate: async (fabricId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist-batch'] })
      await queryClient.cancelQueries({ queryKey: ['wishlist-status', fabricId] })
      await queryClient.cancelQueries({ queryKey: WISHLIST_COUNT_KEY })
      const previousBatch = snapshotBatchQueries(queryClient)
      const previousStatus = queryClient.getQueryData<boolean>(['wishlist-status', fabricId])
      const previousCount = queryClient.getQueryData<number>(WISHLIST_COUNT_KEY)
      patchBatchQueries(queryClient, fabricId, false)
      queryClient.setQueryData(['wishlist-status', fabricId], false)
      // Treat the click as removing a saved item: count -1, but skip if we somehow
      // know the fabric was not saved (defensive — shouldn't happen via the UI).
      patchWishlistCount(queryClient, -1, previousStatus !== false)
      return { previousBatch, previousStatus, previousCount }
    },
    onError: (err, fabricId, ctx) => {
      if (ctx) {
        restoreBatchQueries(queryClient, ctx.previousBatch)
        queryClient.setQueryData(['wishlist-status', fabricId], ctx.previousStatus)
        if (ctx.previousCount !== undefined) {
          queryClient.setQueryData(WISHLIST_COUNT_KEY, ctx.previousCount)
        }
      }
      toast.error(err instanceof Error ? err.message : toasts.removeFailed)
    },
    onSuccess: () => {
      toast.success(toasts.removed)
    },
    onSettled: async (_data, _err, fabricId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['buyer-wishlist'] }),
        queryClient.invalidateQueries({ queryKey: ['wishlist-status', fabricId] }),
        queryClient.invalidateQueries({ queryKey: WISHLIST_COUNT_KEY })
      ])
    }
  })
}
