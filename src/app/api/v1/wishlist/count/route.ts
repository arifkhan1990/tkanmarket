import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireSession } from '@/lib/auth/require-session'
import { apiSuccess } from '@/lib/utils/api-response'
import { BuyerWishlistService } from '@/services/buyer-wishlist.service'

export const dynamic = 'force-dynamic'

function parseUserId(session: { user?: { id?: string | null } }): number {
  const raw = session.user?.id
  if (!raw) throw new Error('User id missing')
  const n = Number.parseInt(String(raw), 10)
  if (!Number.isFinite(n)) throw new Error('Invalid user id')
  return n
}

export async function GET() {
  try {
    const session = await requireSession()
    const userId = parseUserId(session)
    const count = await BuyerWishlistService.countForUser(userId)
    return apiSuccess({ count })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
