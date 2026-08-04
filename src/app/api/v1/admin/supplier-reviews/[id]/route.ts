import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SupplierReviewService } from '@/services/supplier-review.service'
import { NotFoundError } from '@/lib/errors'

const PatchSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED']),
  flag_reason: z.string().trim().max(2000).nullable().optional()
})

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const id = Number.parseInt((await context.params).id, 10)
    if (!Number.isFinite(id)) throw new NotFoundError('Review not found')
    const body = PatchSchema.parse(await req.json())
    const updated = await SupplierReviewService.updateStatus(id, {
      status: body.status,
      flagReason: body.flag_reason
    })
    if (!updated) throw new NotFoundError('Review not found')
    return apiSuccess(updated)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
