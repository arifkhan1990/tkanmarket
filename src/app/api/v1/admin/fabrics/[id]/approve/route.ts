import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminFabricService } from '@/services/admin-fabric.service'

const RouteParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)
    await AdminFabricService.approve(params.id, Number(session.user.id ?? 0))
    return apiSuccess({ id: params.id, status: 'approved' })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

