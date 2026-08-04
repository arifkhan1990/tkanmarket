import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { NotFoundError } from '@/lib/errors'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminFabricService } from '@/services/admin-fabric.service'
import type { FabricCompositionItem } from '@/types/fabric'

const RouteParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const CompositionItemSchema = z.object({
  material: z.string().trim().min(1).max(100),
  percentage: z.number().min(0).max(100)
}) satisfies z.ZodType<FabricCompositionItem>

export const dynamic = 'force-dynamic'

const PatchBodySchema = z.object({
  title_ru: z.string().trim().min(2).max(300),
  title_en: z.string().trim().min(2).max(300).nullable(),
  usage_ru: z.string().trim().min(0).max(20000).nullable(),
  usage_en: z.string().trim().min(0).max(20000).nullable(),
  description_ru: z.string().trim().min(0).max(20000).nullable(),
  description_en: z.string().trim().min(0).max(20000).nullable(),
  fabric_type: z.string().trim().min(1).max(50).nullable(),
  gsm: z.number().int().min(0).max(2000).nullable(),
  width_cm: z.number().int().min(0).max(5000).nullable(),
  moq: z.number().int().min(0).max(100000000).nullable(),
  price_usd: z.string().trim().min(1).max(40).nullable(),
  composition: z.array(CompositionItemSchema).max(50).nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(50).nullable(),
  tags_en: z.array(z.string().trim().min(1).max(40)).max(50).nullable(),
  meta_title_ru: z.string().trim().min(0).max(300).nullable(),
  meta_title_en: z.string().trim().min(0).max(300).nullable(),
  meta_description_ru: z.string().trim().min(0).max(500).nullable(),
  meta_description_en: z.string().trim().min(0).max(500).nullable(),
  image_alt_ru: z.string().trim().min(0).max(500).nullable(),
  image_alt_en: z.string().trim().min(0).max(500).nullable(),
  color: z.string().trim().min(0).max(100).nullable(),
  color_en: z.string().trim().min(0).max(100).nullable(),
  supply_type: z.string().trim().min(0).max(100).nullable(),
  supply_type_en: z.string().trim().min(0).max(100).nullable(),
  shipment_time: z.string().trim().min(0).max(100).nullable(),
  shipment_time_en: z.string().trim().min(0).max(100).nullable(),
  is_featured: z.boolean()
})

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)
    const fabric = await AdminFabricService.getById(params.id)
    if (!fabric) {
      return toApiErrorResponse(new NotFoundError('Fabric not found'))
    }
    return apiSuccess(fabric)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)
    const body = PatchBodySchema.parse(await req.json().catch(() => ({})))
    await AdminFabricService.update(params.id, body, Number(session.user.id ?? 0))
    return apiSuccess({ id: params.id })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

