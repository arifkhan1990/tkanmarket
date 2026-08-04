import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminSocialAiBatchInput, AdminSocialCreatePostInput } from '@/types/admin-social.types'

export async function createAdminSocialPost(input: AdminSocialCreatePostInput): Promise<{ ok: boolean; json: ApiEnvelope<{ id: number }> }> {
  const res = await fetch('/api/v1/admin/social/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(input)
  })
  const json = (await res.json()) as ApiEnvelope<{ id: number }>
  return { ok: res.ok, json }
}

export async function runAdminSocialAiBatch(input: AdminSocialAiBatchInput): Promise<{ ok: boolean; json: ApiEnvelope<{ created: number; ids: number[] }> }> {
  const res = await fetch('/api/v1/admin/social/ai-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(input)
  })
  const json = (await res.json()) as ApiEnvelope<{ created: number; ids: number[] }>
  return { ok: res.ok, json }
}

