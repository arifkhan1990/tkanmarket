'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { HeroSectionConfig } from '@/types/hero-section.types'
import { useI18n } from '@/hooks/useI18n'

export function useHeroSectionConfig() {
  return useQuery<ApiEnvelope<HeroSectionConfig>>({
    queryKey: ['admin-hero-section'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/hero')
      const json = (await res.json()) as ApiEnvelope<HeroSectionConfig>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : 'Request failed')
      }
      return json
    }
  })
}

export function useSaveHeroSection() {
  const { messages } = useI18n()
  const queryClient = useQueryClient()
  const s = messages.admin.heroPage

  return useMutation({
    mutationFn: async (input: HeroSectionConfig) => {
      const res = await fetch('/api/v1/admin/hero', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input)
      })
      const json = (await res.json()) as ApiEnvelope<HeroSectionConfig>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : s.requestFailed)
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-section'] })
      toast.success(s.saved)
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : s.saveFailed
      toast.error(message)
    }
  })
}

export function useGenerateHeroImage() {
  const { messages } = useI18n()
  const s = messages.admin.heroPage

  return useMutation({
    mutationFn: async (fabricId: number) => {
      const res = await fetch('/api/v1/admin/hero/generate-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fabric_id: fabricId })
      })
      const json = (await res.json()) as ApiEnvelope<{ fabric_id: number; job_id: string }>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : s.generationFailed)
      }
      return json.data
    },
    onSuccess: () => toast.success(messages.admin.heroPage.imageQueued),
    onError: (err) => {
      const message = err instanceof Error ? err.message : s.generationFailed
      toast.error(message)
    }
  })
}
