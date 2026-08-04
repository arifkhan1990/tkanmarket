import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { LeadService } from '@/services/lead.service'

const RouteParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const AddNoteSchema = z.object({
  content: z.string().trim().min(1).max(6000)
})

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)
    const body = await req.json()
    const input = AddNoteSchema.parse(body)

    const actorId = await LeadService.getActorIdFromAdminSessionEmail(session.user.email)
    const note = await LeadService.addNote(params.id, actorId, input.content)
    return apiSuccess(note)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

