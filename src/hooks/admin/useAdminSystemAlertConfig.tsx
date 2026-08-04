'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useI18n } from '@/hooks/useI18n'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { SystemAlertConfigBundleDto } from '@/types/supplier-ops.types'

const QUERY_KEY = ['admin', 'system-alert-config'] as const

export function useAdminSystemAlertConfigQuery() {
  const { messages } = useI18n()
  const loadError = messages.admin.systemAlertConfigPage.loadError
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/system-alert-config')
      const json = (await res.json()) as ApiEnvelope<SystemAlertConfigBundleDto>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    }
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : loadError)
  }, [query.error, loadError])

  return query
}

export function useAdminSystemAlertMonitorPatchMutation() {
  const { messages } = useI18n()
  const saved = messages.admin.systemAlertConfigPage.toastMonitorSaved
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: number; enabled?: boolean; threshold_int?: number | null }) => {
      const res = await fetch(`/api/v1/admin/system-alert-config/monitors/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
          ...(input.threshold_int !== undefined ? { threshold_int: input.threshold_int } : {})
        })
      })
      const json = (await res.json()) as ApiEnvelope<SystemAlertConfigBundleDto>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Update failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEY, data)
      toast.success(saved)
    },
    onError: (e: Error) => toast.error(e.message)
  })
}

export function useAdminSystemAlertChannelPatchMutation() {
  const { messages } = useI18n()
  const saved = messages.admin.systemAlertConfigPage.toastChannelSaved
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: number; enabled: boolean }) => {
      const res = await fetch(`/api/v1/admin/system-alert-config/channels/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: input.enabled })
      })
      const json = (await res.json()) as ApiEnvelope<SystemAlertConfigBundleDto>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Update failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEY, data)
      toast.success(saved)
    },
    onError: (e: Error) => toast.error(e.message)
  })
}
