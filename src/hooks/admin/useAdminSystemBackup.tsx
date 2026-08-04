'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { SystemBackupOverviewResponse } from '@/types/admin-system-backup.types'

export function useAdminSystemBackupOverviewQuery() {
  const query = useQuery({
    queryKey: ['admin-system-backup-overview'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/system-backup/overview')
      const json = (await res.json()) as ApiEnvelope<SystemBackupOverviewResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Failed to load backup overview')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 30 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load backup overview')
  }, [query.error])

  return query
}

export function useAdminSystemBackupManualMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (note?: string) => {
      const res = await fetch('/api/v1/admin/system-backup/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      })
      const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-audit-log'] })
      void qc.invalidateQueries({ queryKey: ['admin-audit-log-stats'] })
      toast.success('Backup request logged. Your infrastructure team can pick this up from audit logs.')
    },
    onError: (e: Error) => {
      toast.error(e.message)
    }
  })
}
