import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { FabricService } from '@/services/fabric.service'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { PAGINATION } from '@/constants'

const RouteParamsSchema = z.object({
  id: z.string().min(1)
})

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).optional()
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
    await enforceRateLimit(req, { limit: 20, windowSeconds: 3600, routeKey: 'public:fabrics:related' })
    const { id: raw } = RouteParamsSchema.parse(await context.params)
    const parsed = parseIdOrSlug(raw)
    const url = new URL(req.url)
    const { limit } = QuerySchema.parse({ limit: url.searchParams.get('limit') ?? undefined })

    const related =
      parsed.kind === 'id'
        ? await FabricService.getRelated(parsed.id, limit ?? 8)
        : await FabricService.getRelatedBySlug(parsed.slug, limit ?? 8)
    return apiSuccess(related)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
