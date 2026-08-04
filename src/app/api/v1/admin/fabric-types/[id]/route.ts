import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { AdminFabricTypesService } from '@/services/admin-fabric-types.service'
import { logger } from '@/lib/logger'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const PatchBodySchema = z.object({
  slug: z.string().trim().min(1).max(100).toLowerCase().optional(),
  label_ru: z.string().trim().min(1).max(300).optional(),
  label_en: z.string().trim().min(1).max(300).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional()
})

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id } = ParamsSchema.parse(await ctx.params)

    const result = await AdminFabricTypesService.getById(id)
    if (!result) {
      return apiSuccess(null, undefined, 404)
    }
    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    await enforceRateLimit(req, {
      limit: 30,
      windowSeconds: 60,
      routeKey: 'admin:fabric-types:update'
    })

    const { id } = ParamsSchema.parse(await ctx.params)
    const json: unknown = await req.json()
    const body = PatchBodySchema.parse(json)

    const result = await AdminFabricTypesService.update(id, {
      slug: body.slug,
      labelRu: body.label_ru,
      labelEn: body.label_en,
      sortOrder: body.sort_order
    })

    logger.info('Fabric type updated', {
      adminId: Number(session.user.id),
      id,
      slug: result.slug
    })

    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    await enforceRateLimit(req, {
      limit: 20,
      windowSeconds: 60,
      routeKey: 'admin:fabric-types:delete'
    })

    const { id } = ParamsSchema.parse(await ctx.params)
    const force = req.nextUrl.searchParams.get('force') === 'true'

    const result = await AdminFabricTypesService.archive(id, force)

    logger.info('Fabric type archived', {
      adminId: Number(session.user.id),
      id,
      force,
      fabricCount: result.fabricCount
    })

    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
