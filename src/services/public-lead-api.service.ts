import type { CreateLeadInput } from '@/lib/validations/lead.validation'
import type { ApiEnvelope } from '@/types/api-envelope.types'

export async function createPublicLead(input: CreateLeadInput): Promise<{ id: number }> {
  const res = await fetch('/api/v1/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  })

  const json = (await res.json()) as ApiEnvelope<{ id: number }>
  if (!res.ok || !json.success) {
    throw new Error(json.success ? 'Request failed' : json.error.message)
  }
  return json.data
}
