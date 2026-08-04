'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiKeyCreateResponse, ApiKeyRevokeResponse } from '@/types/api-keys-admin.types'
import { useI18n } from '@/hooks/useI18n'

export function useAdminApiKeysMutations() {
  const { messages } = useI18n()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationKey: ['admin-api-keys-create'],
    mutationFn: async (input: { name: string; scopes: string[] }) => {
      const res = await fetch('/api/v1/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      const json = (await res.json()) as { success: boolean; data?: ApiKeyCreateResponse; error?: { message: string } }
      if (!res.ok || !json.success || !json.data) throw new Error(json.error?.message ?? 'Failed to create API key')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] })
    }
  })

  const revoke = useMutation({
    mutationKey: ['admin-api-keys-revoke'],
    mutationFn: async (input: { apiKeyId: number }) => {
      const res = await fetch('/api/v1/admin/api-keys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeyId: input.apiKeyId })
      })
      const json = (await res.json()) as { success: boolean; data?: ApiKeyRevokeResponse; error?: { message: string } }
      if (!res.ok || !json.success || !json.data) throw new Error(json.error?.message ?? 'Failed to revoke API key')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] })
    }
  })

  React.useEffect(() => {
    if (!create.error && !revoke.error) return
    const err = (create.error ?? revoke.error) as unknown
    const msg = err instanceof Error ? err.message : messages.admin.loadErrors.auditLog
    toast.error(msg)
  }, [create.error, messages.admin.loadErrors.auditLog, revoke.error])

  return { create, revoke }
}

