import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminFabricCategoryTermsService } from '@/services/admin-fabric-category-terms.service'

export const dynamic = 'force-dynamic'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const UpdateBodySchema = z
  .object({
    slug: z.string().trim().min(1).max(200).optional(),
    name_ru: z.string().trim().min(2).max(200).optional(),
    name_en: z.string().trim().max(200).optional().nullable(),
    description_ru: z.string().trim().max(2000).optional().nullable(),
    description_en: z.string().trim().max(2000).optional().nullable(),
    sort_order: z.number().int().min(-999999).max(999999).optional(),
    is_active: z.boolean().optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' })

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id } = ParamsSchema.parse(await ctx.params)
    const body = UpdateBodySchema.parse(await req.json())
    await AdminFabricCategoryTermsService.update(id, body)
    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

