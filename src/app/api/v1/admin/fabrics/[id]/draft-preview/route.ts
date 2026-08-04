import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { NotFoundError } from '@/lib/errors'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminFabricDraftPreviewService } from '@/services/admin-fabric-draft-preview.service'

export const dynamic = 'force-dynamic'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    const data = await AdminFabricDraftPreviewService.getById(params.id)
    if (!data) {
      throw new NotFoundError('Fabric not found')
    }
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
