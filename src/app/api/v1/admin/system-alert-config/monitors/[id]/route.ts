import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { SystemAlertConfigService } from '@/services/system-alert-config.service'

export const dynamic = 'force-dynamic'

const PatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    threshold_int: z.coerce.number().int().min(0).max(1_000_000).nullable().optional()
  })
  .refine((b) => b.enabled !== undefined || b.threshold_int !== undefined, {
    message: 'At least one of enabled or threshold_int is required'
  })

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const id = Number.parseInt((await context.params).id, 10)
    if (!Number.isFinite(id)) throw new NotFoundError('Monitor not found')
    const parsed = PatchSchema.safeParse(await req.json())
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid request body'
      throw new ValidationError(msg)
    }
    const body = parsed.data
    const bundle = await SystemAlertConfigService.updateMonitor(id, {
      enabled: body.enabled,
      thresholdInt: body.threshold_int
    })
    if (!bundle) throw new NotFoundError('Monitor not found')
    return apiSuccess(bundle)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
