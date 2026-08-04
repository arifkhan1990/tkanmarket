import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { AuthError } from '@/lib/errors'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminHelpSupportService } from '@/services/admin-help-support.service'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  serviceArea: z.enum(['CRAWLER', 'AI', 'WEB', 'DATABASE']),
  urgency: z.enum(['NORMAL', 'HIGH', 'CRITICAL']),
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(8000)
})

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession()
    const userId = Number(session.user.id ?? 0)
    if (!userId) {
      throw new AuthError('Invalid session user')
    }

    const json: unknown = await req.json()
    const body = bodySchema.parse(json)

    const result = await AdminHelpSupportService.createTicket({
      submittedByUserId: userId,
      serviceArea: body.serviceArea,
      urgency: body.urgency,
      subject: body.subject,
      description: body.description
    })

    return apiSuccess(result, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
