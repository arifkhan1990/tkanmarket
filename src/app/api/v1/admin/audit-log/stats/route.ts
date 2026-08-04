import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AuditLogAdminService } from '@/services/audit-log-admin.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  rangeDays: z.coerce.number().int().min(1).max(365).optional().default(30)
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const params = QuerySchema.parse({ rangeDays: url.searchParams.get('rangeDays') })
    const data = await AuditLogAdminService.getStats({ rangeDays: params.rangeDays })
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

