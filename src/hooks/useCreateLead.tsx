'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/useI18n'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { CreateLeadInput } from '@/lib/validations/lead.validation'
import type { LeadCreateResult } from '@/types/marketplace.types'

export type UseCreateLeadOptions = {
  /** Set when the caller handles success UI (e.g. client redirect to the lead thank-you page). */
  suppressSuccessToast?: boolean
}

export function useCreateLead(options?: UseCreateLeadOptions) {
  const { messages } = useI18n()
  const suppressSuccessToast = options?.suppressSuccessToast === true

  return useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input)
      })

      const json = (await res.json()) as ApiEnvelope<LeadCreateResult>

      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.leads.toast.requestFailed
        throw new Error(message)
      }

      return json.data
    },
    onSuccess: () => {
      if (!suppressSuccessToast) toast.success(messages.leads.toast.created)
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : messages.leads.toast.genericError
      toast.error(message)
    }
  })
}

