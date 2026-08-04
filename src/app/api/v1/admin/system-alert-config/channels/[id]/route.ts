import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { NotFoundError } from '@/lib/errors'
import { SystemAlertConfigService } from '@/services/system-alert-config.service'

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  enabled: z.boolean()
})

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const id = Number.parseInt((await context.params).id, 10)
    if (!Number.isFinite(id)) throw new NotFoundError('Channel not found')
    const body = PatchSchema.parse(await req.json())
    const bundle = await SystemAlertConfigService.updateChannel(id, { enabled: body.enabled })
    if (!bundle) throw new NotFoundError('Channel not found')
    return apiSuccess(bundle)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
