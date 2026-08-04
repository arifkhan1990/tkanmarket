'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { LEAD_SUCCESS_PATH } from '@/lib/routes/lead-success'
import type { CreateLeadInput } from '@/lib/validations/lead.validation'
import { createPublicLead } from '@/services/public-lead-api.service'

export function useSampleRequestLeadMutation() {
  const router = useRouter()
  const { messages, locale } = useI18n()

  return useMutation({
    mutationFn: (input: CreateLeadInput) => createPublicLead(input),
    onSuccess: () => {
      router.push(withLocaleUrl(LEAD_SUCCESS_PATH, locale))
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : messages.leads.toast.genericError)
    }
  })
}
