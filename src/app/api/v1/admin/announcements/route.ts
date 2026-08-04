import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { ValidationError } from '@/lib/errors'
import { AdminAnnouncementsService } from '@/services/admin-announcements.service'

export const dynamic = 'force-dynamic'

const createBodySchema = z.object({
  title: z.string().trim().min(2).max(300),
  body: z.string().trim().min(1).max(8000),
  importance: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  reference_code: z.string().trim().max(80).optional().nullable()
})

export async function GET() {
  try {
    await requireAdminSession()
    const data = await AdminAnnouncementsService.list()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const uid = session.user?.id ? parseInt(session.user.id, 10) : NaN
    if (!Number.isFinite(uid)) {
      return toApiErrorResponse(new ValidationError('Invalid session'))
    }
    const json: unknown = await req.json()
    const body = createBodySchema.parse(json)
    const created = await AdminAnnouncementsService.create(uid, {
      title: body.title,
      body: body.body,
      importance: body.importance,
      referenceCode: body.reference_code ?? null
    })
    return apiSuccess(created, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
