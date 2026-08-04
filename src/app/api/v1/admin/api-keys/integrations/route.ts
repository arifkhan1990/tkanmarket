import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { ApiKeysAdminService } from '@/services/api-keys-admin.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  enabledDays: z.coerce.number().int().positive().max(30).optional().default(7)
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const params = QuerySchema.parse({ enabledDays: url.searchParams.get('enabledDays') })

    const data = await ApiKeysAdminService.getCrawlerIntegrations({ enabledDays: params.enabledDays })
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

