import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { FabricService } from '@/services/fabric.service'
import { NotFoundError } from '@/lib/errors'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'

const RouteParamsSchema = z.object({
  id: z.string().min(1)
})

function parseIdOrSlug(raw: string): { kind: 'id'; id: number } | { kind: 'slug'; slug: string } {
  const asNumber = Number(raw)
  const isIntString = Number.isInteger(asNumber) && String(asNumber) === raw
  if (isIntString && asNumber > 0) return { kind: 'id', id: asNumber }
  return { kind: 'slug', slug: raw }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await enforceRateLimit(req, { limit: 30, windowSeconds: 3600, routeKey: 'public:fabrics:detail' })
    const { id: raw } = RouteParamsSchema.parse(await context.params)
    const parsed = parseIdOrSlug(raw)

    const fabric =
      parsed.kind === 'id'
        ? await FabricService.getById(parsed.id)
        : await FabricService.getBySlug(parsed.slug)

    if (!fabric) throw new NotFoundError('Fabric not found')

    // non-blocking: track views
    void FabricService.incrementViewsCount(fabric.id)

    return apiSuccess(fabric)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

