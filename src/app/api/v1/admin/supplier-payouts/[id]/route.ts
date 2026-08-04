import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SupplierPayoutService } from '@/services/supplier-payout.service'
import { NotFoundError } from '@/lib/errors'

const PatchSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'PAID']),
  resolution_note: z.string().trim().max(2000).nullable().optional()
})

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const id = Number.parseInt((await context.params).id, 10)
    if (!Number.isFinite(id)) throw new NotFoundError('Payout not found')
    const body = PatchSchema.parse(await req.json())
    const updated = await SupplierPayoutService.updateStatus(id, {
      status: body.status,
      resolutionNote: body.resolution_note
    })
    if (!updated) throw new NotFoundError('Payout not found')
    return apiSuccess(updated)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
