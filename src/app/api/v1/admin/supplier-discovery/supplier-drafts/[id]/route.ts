import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { PatchSupplierDraftSchema } from '@/lib/validations/supplier-discovery.validation'
import { SupplierDiscoveryAdminService } from '@/services/admin/supplier-discovery-admin.service'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id } = await ctx.params
    const draftId = Number(id)
    if (!Number.isFinite(draftId) || draftId < 1) {
      throw new Error('Invalid id')
    }
    const body: unknown = await req.json()
    const patch = PatchSupplierDraftSchema.parse(body)
    const data = await SupplierDiscoveryAdminService.patchSupplierDraft(draftId, patch)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
