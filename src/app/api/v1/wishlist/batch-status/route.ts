import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireSession } from '@/lib/auth/require-session'
import { apiSuccess } from '@/lib/utils/api-response'
import { BuyerWishlistService } from '@/services/buyer-wishlist.service'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  fabricIds: z.array(z.number().int().positive()).min(1).max(100)
})

function parseUserId(session: { user?: { id?: string | null } }): number {
  const raw = session.user?.id
  if (!raw) throw new Error('User id missing')
  const n = Number.parseInt(String(raw), 10)
  if (!Number.isFinite(n)) throw new Error('Invalid user id')
  return n
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const userId = parseUserId(session)
    const json = await req.json()
    const parsed = bodySchema.parse(json)
    const savedIds = await BuyerWishlistService.listSavedFabricIds(userId, parsed.fabricIds)
    return apiSuccess({ savedIds })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
