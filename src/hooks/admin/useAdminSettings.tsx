'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminSettings } from '@/services/admin/settings.service'

import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'
import { useI18n } from '@/hooks/useI18n'

export function useAdminSettings() {
  const { messages } = useI18n()
  return useQuery<ApiEnvelope<AdminSettings>>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/settings')
      const json = (await res.json()) as ApiEnvelope<AdminSettings>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    }
  })
}

export function useUpdateAdminSettings() {
  const { messages } = useI18n()
  return useMutation({
    mutationFn: async (input: {
      crawlerEnabled?: boolean
      crawlerDefaultMaxProducts?: number
      leadRateLimitPerHour?: number
      notificationEmail?: string | null
    }) => {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input)
      })
      const json = (await res.json()) as ApiEnvelope<AdminSettings>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => toast.success(messages.admin.settingsMutation.updated),
    onError: (err) => {
      const message = err instanceof Error ? err.message : messages.admin.settingsMutation.updateFailed
      toast.error(message)
    }
  })
}

export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 2 }).map((_, idx) => (
          <StatCardSkeleton key={idx} />
        ))}
      </div>
      <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 h-[360px] animate-pulse" />
    </div>
  )
}

