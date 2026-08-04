import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminFabricCategoryTermsService } from '@/services/admin-fabric-category-terms.service'

export const dynamic = 'force-dynamic'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id } = ParamsSchema.parse(await ctx.params)
    await AdminFabricCategoryTermsService.restore(id)
    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

