import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SettingsService } from '@/services/admin/settings.service'

const UpdateSchema = z.object({
  crawlerEnabled: z.boolean().optional(),
  crawlerDefaultMaxProducts: z.coerce.number().int().min(10).max(2000).optional(),
  leadRateLimitPerHour: z.coerce.number().int().min(1).max(200).optional(),
  notificationEmail: z.string().trim().email().nullable().optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const settings = await SettingsService.getSettings()
    return apiSuccess(settings)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = await req.json()
    const input = UpdateSchema.parse(body)
    const current = await SettingsService.getSettings()
    const updated = await SettingsService.updateSettings({
      crawlerEnabled: input.crawlerEnabled ?? current.crawlerEnabled,
      crawlerDefaultMaxProducts: input.crawlerDefaultMaxProducts ?? current.crawlerDefaultMaxProducts,
      leadRateLimitPerHour: input.leadRateLimitPerHour ?? current.leadRateLimitPerHour,
      notificationEmail: input.notificationEmail ?? current.notificationEmail
    })
    return apiSuccess(updated)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

