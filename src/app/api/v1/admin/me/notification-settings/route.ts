import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminNotificationSettingsService } from '@/services/admin-notification-settings.service'

export const dynamic = 'force-dynamic'

const PrefValueSchema = z.union([z.boolean(), z.number()])
const PreferencesPatchSchema = z
  .record(z.string(), PrefValueSchema)
  .optional()
  .refine(
    (p) => {
      if (!p) return true
      return Object.values(p).every((v) => typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)))
    },
    { message: 'preferences must contain only booleans or finite numbers' }
  )

const PatchSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  preferences: PreferencesPatchSchema
})

export async function GET() {
  try {
    const session = await requireAdminSession()
    const userId = Number(session.user?.id)
    if (!Number.isFinite(userId)) throw new Error('Invalid session')

    const data = await AdminNotificationSettingsService.getOrCreate(userId)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const userId = Number(session.user?.id)
    if (!Number.isFinite(userId)) throw new Error('Invalid session')

    const json: unknown = await req.json()
    const body = PatchSchema.parse(json)

    const data = await AdminNotificationSettingsService.update({
      userId,
      input: {
        emailEnabled: body.emailEnabled,
        inAppEnabled: body.inAppEnabled,
        preferences: body.preferences
      }
    })
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

