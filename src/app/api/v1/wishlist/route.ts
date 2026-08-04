import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireSession } from '@/lib/auth/require-session'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { apiSuccess } from '@/lib/utils/api-response'
import { withPagination } from '@/lib/utils/api-response'
import { BuyerWishlistService } from '@/services/buyer-wishlist.service'

export const dynamic = 'force-dynamic'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(6).max(48).default(12),
  collection: z.string().optional(),
  q: z.string().trim().min(1).optional()
})

const addSchema = z.object({
  fabricId: z.number().int().positive(),
  collectionLabel: z.string().trim().max(120).nullable().optional()
})

function parseUserId(session: { user?: { id?: string | null } }): number {
  const raw = session.user?.id
  if (!raw) throw new Error('User id missing')
  const n = Number.parseInt(String(raw), 10)
  if (!Number.isFinite(n)) throw new Error('Invalid user id')
  return n
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession()
    const userId = parseUserId(session)
    const parsed = listQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()))

    const { data, total } = await BuyerWishlistService.list(userId, {
      page: parsed.page,
      limit: parsed.limit,
      collection: parsed.collection,
      q: parsed.q
    })

    const paginated = withPagination(data.items, total, parsed.page, parsed.limit)
    return apiSuccess(
      {
        items: paginated.items,
        collections: data.collections,
        totals: data.totals
      },
      paginated.meta
    )
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 60, windowSeconds: 60, routeKey: 'wishlist:write' })
    const session = await requireSession()
    const userId = parseUserId(session)
    const json = await req.json()
    const parsed = addSchema.parse(json)
    await BuyerWishlistService.add(userId, {
      fabricId: parsed.fabricId,
      collectionLabel: parsed.collectionLabel ?? null
    })
    return apiSuccess({ ok: true }, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 60, windowSeconds: 60, routeKey: 'wishlist:write' })
    const session = await requireSession()
    const userId = parseUserId(session)
    const fabricIdRaw = req.nextUrl.searchParams.get('fabricId')
    const fabricId = z.coerce.number().int().positive().parse(fabricIdRaw)
    await BuyerWishlistService.remove(userId, fabricId)
    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
