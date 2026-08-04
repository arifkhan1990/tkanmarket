import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminFabricTypesService } from '@/services/admin-fabric-types.service'
import { logger } from '@/lib/logger'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    await enforceRateLimit(req, {
      limit: 20,
      windowSeconds: 60,
      routeKey: 'admin:fabric-types:restore'
    })

    const { id } = ParamsSchema.parse(await ctx.params)
    await AdminFabricTypesService.restore(id)

    logger.info('Fabric type restored', {
      adminId: Number(session.user.id),
      id
    })

    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
