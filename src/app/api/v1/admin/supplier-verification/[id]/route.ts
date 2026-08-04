import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SupplierVerificationService } from '@/services/supplier-verification.service'
import { NotFoundError } from '@/lib/errors'
import type { VerificationChecklistItem } from '@/types/supplier-ops.types'

const ChecklistItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  detail: z.string().min(1),
  state: z.enum(['completed', 'processing', 'pending', 'error'])
})

const PatchSchema = z.object({
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED']).optional(),
  internal_note: z.string().max(8000).nullable().optional(),
  checklist: z.array(ChecklistItemSchema).optional()
})

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const id = Number.parseInt((await context.params).id, 10)
    if (!Number.isFinite(id)) throw new NotFoundError('Case not found')
    const row = await SupplierVerificationService.getById(id)
    if (!row) throw new NotFoundError('Case not found')
    return apiSuccess(row)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const id = Number.parseInt((await context.params).id, 10)
    if (!Number.isFinite(id)) throw new NotFoundError('Case not found')
    const body = PatchSchema.parse(await req.json())
    const checklist = body.checklist as VerificationChecklistItem[] | undefined
    const updated = await SupplierVerificationService.updateCase(id, {
      status: body.status,
      internalNote: body.internal_note,
      checklist
    })
    if (!updated) throw new NotFoundError('Case not found')
    return apiSuccess(updated)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
