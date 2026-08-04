import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { NotFoundError } from '@/lib/errors'
import { LeadService } from '@/services/lead.service'
import { LeadStatusSchema } from '@/lib/validations/lead.validation'

const RouteParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const PatchBodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('update_status'), status: LeadStatusSchema }),
  z.object({ action: z.literal('add_note'), content: z.string().trim().min(1).max(6000) }),
  z.object({ action: z.literal('assign'), user_id: z.coerce.number().int().positive() })
])

const PostBodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('add_note'), content: z.string().trim().min(1).max(6000) })
])

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)
    const detail = await LeadService.getById(params.id)
    if (!detail) throw new NotFoundError('Lead not found')
    return apiSuccess(detail)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)
    const body = PostBodySchema.parse(await req.json().catch(() => ({})))
    const actorId = await LeadService.getActorIdFromAdminSessionEmail(session.user.email)
    const note = await LeadService.addNote(params.id, actorId, body.content)
    return apiSuccess(note)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)
    const body = PatchBodySchema.parse(await req.json())
    const actorId = await LeadService.getActorIdFromAdminSessionEmail(session.user.email)

    if (body.action === 'update_status') {
      const updated = await LeadService.updateStatus(params.id, body.status, actorId)
      return apiSuccess(updated)
    }

    if (body.action === 'add_note') {
      const note = await LeadService.addNote(params.id, actorId, body.content)
      return apiSuccess(note)
    }

    const updated = await LeadService.assign(params.id, body.user_id, actorId)
    return apiSuccess(updated)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

