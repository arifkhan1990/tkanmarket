import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialAdminService } from '@/services/admin/social-admin.service'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    await SocialAdminService.approve(params.id)
    return apiSuccess({ id: params.id, status: 'APPROVED' })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return POST(req, context)
}

