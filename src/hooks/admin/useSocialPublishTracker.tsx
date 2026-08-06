'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminSocialPostDetail } from '@/types/admin-social.types'
import { useI18n } from '@/hooks/useI18n'

const POLL_INTERVAL_MS = 3000
const MAX_WATCH_MS = 2 * 60 * 1000

function SocialPublishStatusWatcher({ postId, onSettled }: { postId: number; onSettled?: () => void }) {
  const { messages } = useI18n()
  const t = messages.admin.socialPreviewPage
  const queryClient = useQueryClient()

  const settledRef = useRef(false)
  const [startedAt] = useState(() => Date.now())
  const onSettledRef = useRef(onSettled)

  useEffect(() => {
    onSettledRef.current = onSettled
  }, [onSettled])

  const { data, isError } = useQuery<ApiEnvelope<AdminSocialPostDetail>>({
    queryKey: ['social-publish-track', postId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/social/${postId}`)
      const json = (await res.json()) as ApiEnvelope<AdminSocialPostDetail>
      if (!res.ok || !json.success) throw new Error(!json.success ? json.error.message : 'Failed to load post')
      return json
    },
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    retry: 1
  })

  const post = data?.success ? data.data : undefined
  const status = post?.status

  useEffect(() => {
    if (settledRef.current) return

    const timedOut = Date.now() - startedAt > MAX_WATCH_MS
    if (isError && timedOut) {
      settledRef.current = true
      onSettledRef.current?.()
      return
    }
    if (!status) return

    if (status === 'PUBLISHED') {
      settledRef.current = true
      toast.success(t.publishCompleteToast)
      void queryClient.invalidateQueries({ queryKey: ['admin-social-post', postId] })
      onSettledRef.current?.()
    } else if (status === 'FAILED') {
      settledRef.current = true
      const msg = post?.errorMessage ?? t.publishFailedToast
      toast.error(msg)
      void queryClient.invalidateQueries({ queryKey: ['admin-social-post', postId] })
      onSettledRef.current?.()
    } else if (timedOut) {
      settledRef.current = true
      onSettledRef.current?.()
    }
    // startedAt is a stable mount-time constant; intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isError, post, queryClient, postId, t])

  return null
}

export function useSocialPublishTracker() {
  const queryClient = useQueryClient()
  const [trackedIds, setTrackedIds] = useState<Set<number>>(new Set())

  const track = useCallback((postId: number) => {
    setTrackedIds((prev) => {
      const next = new Set(prev)
      next.add(postId)
      return next
    })
  }, [])

  const remove = useCallback(
    (postId: number) => {
      setTrackedIds((prev) => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
      void queryClient.invalidateQueries({ queryKey: ['admin-social'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] })
    },
    [queryClient]
  )

  const PublishTrackers = useCallback(() => {
    const ids = Array.from(trackedIds)
    if (ids.length === 0) return null
    return (
      <>
        {ids.map((id) => (
          <SocialPublishStatusWatcher key={id} postId={id} onSettled={() => remove(id)} />
        ))}
      </>
    )
  }, [trackedIds, remove])

  return { track, PublishTrackers }
}
