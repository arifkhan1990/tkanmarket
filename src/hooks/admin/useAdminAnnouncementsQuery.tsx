'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type {
  AdminAnnouncementCreateInput,
  AdminAnnouncementsListResponse
} from '@/types/admin-announcements.types'

export function useAdminAnnouncementsQuery() {
  return useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/announcements')
      const json = (await res.json()) as ApiEnvelope<AdminAnnouncementsListResponse>
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Failed to load announcements'
        toast.error(msg)
        throw new Error(msg)
      }
      return json.data
    },
    staleTime: 30 * 1000
  })
}

export function useCreateAnnouncementMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminAnnouncementCreateInput) => {
      const res = await fetch('/api/v1/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: input.title,
          body: input.body,
          importance: input.importance,
          reference_code: input.referenceCode ?? null
        })
      })
      const json = (await res.json()) as ApiEnvelope<{ id: number }>
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Could not post announcement'
        throw new Error(msg)
      }
      return json.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-announcements'] })
      toast.success('Announcement published')
    },
    onError: (e: Error) => {
      toast.error(e.message)
    }
  })
}

export function useAckAnnouncementMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (announcementId: number) => {
      const res = await fetch(`/api/v1/admin/announcements/${announcementId}/ack`, { method: 'POST' })
      const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Could not acknowledge'
        throw new Error(msg)
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-announcements'] })
      toast.success('Acknowledged')
    },
    onError: (e: Error) => {
      toast.error(e.message)
    }
  })
}
