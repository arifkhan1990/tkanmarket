import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { LeadService } from '@/services/lead.service'
import { LeadStatusSchema } from '@/lib/validations/lead.validation'

const RouteParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const StatusSchema = LeadStatusSchema

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)
    const body = await req.json()
    const input = StatusSchema.parse(body)

    const actorId = await LeadService.getActorIdFromAdminSessionEmail(session.user.email)
    const updated = await LeadService.updateStatus(params.id, input, actorId)
    return apiSuccess(updated)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

