import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { SystemConsoleService } from '@/services/admin/system-console.service'

const UpdateSchema = z.object({
  primaryCurrency: z.string().min(3).max(8).optional(),
  platformTimezone: z.string().min(1).max(120).optional(),
  skuPrefixPattern: z.string().min(1).max(200).optional(),
  skuSequenceLength: z.coerce.number().int().min(3).max(12).optional()
})

export async function GET() {
  try {
    await requireAdminSession()
    const data = await SystemConsoleService.getRegionalPreferences()
    const integrity = SystemConsoleService.getConfigurationIntegrity()
    const recentChanges = await SystemConsoleService.getPreferenceRecentChanges()
    const maintenance = await SystemConsoleService.getMaintenance()
    return apiSuccess({
      ...data,
      configurationIntegrity: integrity,
      recentChanges,
      maintenanceWindow: {
        scheduledStart: maintenance.scheduledStart,
        scheduledEnd: maintenance.scheduledEnd
      }
    })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const body = await req.json()
    const input = UpdateSchema.parse(body)
    const preferences = await SystemConsoleService.updateRegionalPreferences({
      ...input,
      updatedByUserId: session.user?.id ? Number(session.user.id) : null
    })
    const full = await SystemConsoleService.getRegionalPreferences()
    return apiSuccess({ preferences, taxRegions: full.taxRegions })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
