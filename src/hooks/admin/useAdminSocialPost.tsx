'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminSocialPostDetail } from '@/types/admin-social.types'

import { useI18n } from '@/hooks/useI18n'
import { useSocialPublishTracker } from '@/hooks/admin/useSocialPublishTracker'

export function useAdminSocialPost(id: number | null) {
  const { messages } = useI18n()
  return useQuery<ApiEnvelope<AdminSocialPostDetail>>({
    queryKey: ['admin-social-post', id],
    enabled: id !== null && id > 0,
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/social/${id}`)
      const json = (await res.json()) as ApiEnvelope<AdminSocialPostDetail>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    }
  })
}

export function useAdminSocialPostMutations(postId: number) {
  const queryClient = useQueryClient()
  const { messages } = useI18n()
  const t = messages.admin.socialPreviewPage
  const { track, PublishTrackers } = useSocialPublishTracker()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-social-post', postId] })
    queryClient.invalidateQueries({ queryKey: ['admin-social'] })
    queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] })
  }

  const patchPost = useMutation({
    mutationFn: async (body: { caption_text?: string; hashtags?: string[] }) => {
      const res = await fetch(`/api/v1/admin/social/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as ApiEnvelope<AdminSocialPostDetail>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success(t.saved)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const schedule = useMutation({
    mutationFn: async (scheduledAt: string) => {
      const res = await fetch(`/api/v1/admin/social/${postId}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: scheduledAt })
      })
      const json = (await res.json()) as ApiEnvelope<{ id: number }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success(t.scheduledToast)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const changePlatform = useMutation({
    mutationFn: async (platform: 'INSTAGRAM' | 'TIKTOK' | 'PINTEREST' | 'FACEBOOK' | 'YOUTUBE') => {
      const res = await fetch(`/api/v1/admin/social/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      })
      const json = (await res.json()) as ApiEnvelope<AdminSocialPostDetail>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success(t.platformChangedToast)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const reject = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/admin/social/${postId}/reject`, { method: 'POST' })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social'] })
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] })
      toast.success(t.rejectedToast)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const publish = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/admin/social/${postId}/publish`, { method: 'POST' })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success(t.publishQueuedToast)
      track(postId)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const regenerateCarousel = useMutation({
    mutationFn: async (prompt?: string | null) => {
      const res = await fetch(`/api/v1/admin/social/${postId}/regenerate/carousel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt ?? null })
      })
      const json = (await res.json()) as ApiEnvelope<{ carouselSlides: Array<{ slideNumber: number; title: string; imageDescription: string }> }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success(t.carouselRegenerated)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const regenerateImage = useMutation({
    mutationFn: async (prompt?: string | null) => {
      const res = await fetch(`/api/v1/admin/social/${postId}/regenerate/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt ?? null })
      })
      const json = (await res.json()) as ApiEnvelope<{ imagePrompt: string | null; imageOverlayText: string | null }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success(t.imageRegenerated)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const regenerateReel = useMutation({
    mutationFn: async (prompt?: string | null) => {
      const res = await fetch(`/api/v1/admin/social/${postId}/regenerate/reel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt ?? null })
      })
      const json = (await res.json()) as ApiEnvelope<{ reelScript: string | null }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success(t.reelRegenerated)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  return { patchPost, schedule, reject, publish, changePlatform, regenerateCarousel, regenerateImage, regenerateReel, PublishTrackers }
}
