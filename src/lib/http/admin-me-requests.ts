import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminProfile, AdminTotpSetupPayload } from '@/types/admin-profile.types'

function assertSuccess<T>(res: Response, json: ApiEnvelope<T>): asserts json is { success: true; data: T } {
  if (!json.success) {
    throw new Error(json.error.message)
  }
  if (!res.ok) {
    throw new Error('Request failed')
  }
}

export async function getAdminProfileRequest(): Promise<AdminProfile> {
  const res = await fetch('/api/v1/admin/me')
  const json = (await res.json()) as ApiEnvelope<AdminProfile>
  assertSuccess(res, json)
  return json.data
}

export async function patchAdminProfileRequest(body: { name?: string; avatar_url?: string | null }): Promise<AdminProfile> {
  const res = await fetch('/api/v1/admin/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const json = (await res.json()) as ApiEnvelope<AdminProfile>
  assertSuccess(res, json)
  return json.data
}

export async function postAdminPasswordRequest(body: { current_password: string; new_password: string }): Promise<void> {
  const res = await fetch('/api/v1/admin/me/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
  assertSuccess(res, json)
}

export async function postTotpSetupRequest(): Promise<AdminTotpSetupPayload> {
  const res = await fetch('/api/v1/admin/me/totp/setup', { method: 'POST' })
  const json = (await res.json()) as ApiEnvelope<AdminTotpSetupPayload>
  assertSuccess(res, json)
  return json.data
}

export async function postTotpEnableRequest(code: string): Promise<void> {
  const res = await fetch('/api/v1/admin/me/totp/enable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  })
  const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
  assertSuccess(res, json)
}

export async function postTotpDisableRequest(password: string): Promise<void> {
  const res = await fetch('/api/v1/admin/me/totp/disable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
  assertSuccess(res, json)
}
