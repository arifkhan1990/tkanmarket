import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { LeadAdminService } from '@/services/admin/lead-admin.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  selected_lead_id: z.coerce.number().int().positive().optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const q = QuerySchema.parse({
      selected_lead_id: url.searchParams.get('selected_lead_id') ?? undefined
    })
    const data = await LeadAdminService.getScoringDashboard(q.selected_lead_id)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
