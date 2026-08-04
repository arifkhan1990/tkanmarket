'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { ShippingRateCalculateInput } from '@/lib/validations/shipping-rate-calculator.validation'
import type { ShippingRateCalculateResult } from '@/types/shipping-rate-calculator.types'
import { useI18n } from '@/hooks/useI18n'

export function useShippingRateCalculatorMutation() {
  const { messages } = useI18n()
  return useMutation({
    mutationFn: async (body: ShippingRateCalculateInput) => {
      const res = await fetch('/api/v1/admin/shipping-rates/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as ApiEnvelope<ShippingRateCalculateResult>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.globalShippingPage.loadError)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })
}
