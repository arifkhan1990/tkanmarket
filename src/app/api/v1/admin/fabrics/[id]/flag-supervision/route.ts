import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminFabricService } from '@/services/admin-fabric.service'

const RouteParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const BodySchema = z.object({
  note: z.string().trim().max(2000).optional()
})

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)
    const body = BodySchema.parse(await req.json().catch(() => ({})))
    await AdminFabricService.flagForSupervision(
      params.id,
      body.note ?? null,
      Number(session.user.id ?? 0)
    )
    return apiSuccess({ id: params.id, flagged: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
