'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { SystemAlertsConfig, SystemAlertsPayload } from '@/types/system-alerts.types'

export function useAdminSystemAlertsQuery() {
  return useQuery({
    queryKey: ['admin-system-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/system-alerts')
      const json = (await res.json()) as ApiEnvelope<SystemAlertsPayload>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : 'Failed to load system alerts')
      }
      return json.data
    },
    staleTime: 30 * 1000
  })
}

export function useAdminSystemAlertsSave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (config: SystemAlertsConfig) => {
      const res = await fetch('/api/v1/admin/system-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const json = (await res.json()) as ApiEnvelope<SystemAlertsConfig>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : 'Failed to save')
      }
      return json.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-system-alerts'] })
    }
  })
}

export function toastSystemAlertsError(err: unknown) {
  toast.error(err instanceof Error ? err.message : 'Request failed')
}
