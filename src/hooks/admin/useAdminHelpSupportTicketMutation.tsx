'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { CreateInternalSupportTicketResult, SupportTicketServiceArea, SupportTicketUrgency } from '@/types/admin-help-support.types'

export function useAdminHelpSupportTicketMutation() {
  return useMutation({
    mutationFn: async (body: {
      serviceArea: SupportTicketServiceArea
      urgency: SupportTicketUrgency
      subject: string
      description: string
    }) => {
      const res = await fetch('/api/v1/admin/help-support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as ApiEnvelope<CreateInternalSupportTicketResult>
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Failed to submit ticket'
        throw new Error(msg)
      }
      return json.data
    },
    onSuccess: () => {
      toast.success('Support request submitted.')
    },
    onError: (e: Error) => {
      toast.error(e.message)
    }
  })
}
