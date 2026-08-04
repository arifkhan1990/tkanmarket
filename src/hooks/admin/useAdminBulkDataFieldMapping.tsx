'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import { useI18n } from '@/hooks/useI18n'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { BulkDataFieldMappingResponse, BulkDataFieldMappingSystemFieldKey } from '@/types/admin-bulk-data-field-mapping.types'

const TriggerSchema = z.object({
  source: z.string().trim().min(1).default('ADMIN'),
  keywords: z.array(z.string().trim().min(1)).min(1).max(20),
  maxProducts: z.number().int().positive().max(2000).optional()
})

type TriggerPayload = z.infer<typeof TriggerSchema>

export function useAdminBulkDataFieldMappingQuery() {
  const { messages } = useI18n()
  const loadFailed = messages.admin.loadErrors.fieldMapping

  const query = useQuery({
    queryKey: ['admin-bulk-data-field-mapping'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/bulk-data/field-mapping')
      const json = (await res.json()) as ApiEnvelope<BulkDataFieldMappingResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Failed to load field mapping')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 10 * 1000,
    refetchInterval: 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : loadFailed)
  }, [query.error, loadFailed])

  return query
}

export function useAdminBulkDataFieldMappingTrigger() {
  const qc = useQueryClient()
  const { messages } = useI18n()
  const ci = messages.admin.catalogImportPage

  return useMutation({
    mutationFn: async (payload: TriggerPayload) => {
      const parsed = TriggerSchema.parse(payload)
      const res = await fetch('/api/v1/admin/crawler/trigger', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed)
      })
      const json = (await res.json()) as ApiEnvelope<{ id: number }>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Failed to initialize import engine')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-bulk-data-field-mapping'] })
      void qc.invalidateQueries({ queryKey: ['admin-bulk-data-operations'] })
      void qc.invalidateQueries({ queryKey: ['admin-catalog-import-preview'] })
      toast.success(ci.importEngineSuccess)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : ci.importEngineFailed)
    }
  })
}

export function buildMappingKeywords(params: { mapping: Record<BulkDataFieldMappingSystemFieldKey, string> }) {
  const keywords = Object.values(params.mapping)
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
  const unique = Array.from(new Set(keywords))
  return unique.slice(0, 20) satisfies string[]
}

