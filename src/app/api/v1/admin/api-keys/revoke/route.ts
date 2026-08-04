import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession } from '@/lib/auth/require-admin'
import { ApiKeysAdminService } from '@/services/api-keys-admin.service'

export const dynamic = 'force-dynamic'

const RevokeSchema = z.object({
  apiKeyId: z.coerce.number().int().positive()
})

function parseClientIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for')
  if (!xff) return null
  const first = xff.split(',')[0]?.trim()
  return first && first.length > 0 ? first : null
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminOnlySession()
    const sessionUserId = Number(session.user.id)
    if (!Number.isFinite(sessionUserId) || sessionUserId <= 0) throw new Error('Invalid admin user')

    const body = await req.json()
    const input = RevokeSchema.parse(body)

    const ip = parseClientIp(req)
    const userAgent = req.headers.get('user-agent')

    const result = await ApiKeysAdminService.revoke({
      apiKeyId: input.apiKeyId,
      revokedById: sessionUserId,
      ip,
      userAgent
    })

    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

