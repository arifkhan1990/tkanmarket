import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession, requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { SystemConsoleService } from '@/services/admin/system-console.service'
import type { NotificationMatrixRow } from '@/types/system-console.types'

const NotificationRowSchema = z.object({
  alertType: z.string().min(1),
  inApp: z.boolean(),
  email: z.boolean(),
  slack: z.boolean()
})

const UpdateSchema = z.object({
  siteName: z.string().min(1).max(200).optional(),
  supportEmail: z.string().email().optional(),
  timezone: z.string().min(1).max(120).optional(),
  twoFactorRequired: z.boolean().optional(),
  sessionTimeoutMinutes: z.coerce.number().int().min(5).max(480).optional(),
  ipWhitelistEnabled: z.boolean().optional(),
  notificationMatrix: z.array(NotificationRowSchema).optional()
})

export async function GET() {
  try {
    await requireAdminSession()
    const data = await SystemConsoleService.getAppSettings()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminOnlySession()
    const body = await req.json()
    const input = UpdateSchema.parse(body)
    const matrix = input.notificationMatrix as NotificationMatrixRow[] | undefined
    const updated = await SystemConsoleService.updateAppSettings({
      ...input,
      notificationMatrix: matrix,
      updatedByUserId: session.user?.id ? Number(session.user.id) : null
    })
    return apiSuccess(updated)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
