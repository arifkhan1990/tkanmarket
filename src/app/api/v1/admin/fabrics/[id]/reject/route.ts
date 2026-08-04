import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminFabricService } from '@/services/admin-fabric.service'

const RouteParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const RejectBodySchema = z.object({
  reason: z.string().trim().min(3).max(2000)
})

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)
    const body = RejectBodySchema.parse(await req.json().catch(() => ({})))
    await AdminFabricService.reject(params.id, body.reason, Number(session.user.id ?? 0))
    return apiSuccess({ id: params.id, status: 'rejected' })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

