import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { LeadService } from '@/services/lead.service'
import { LeadAdminService } from '@/services/admin/lead-admin.service'
import { LeadSourceSchema, LeadStatusSchema } from '@/lib/validations/lead.validation'

export const dynamic = 'force-dynamic'

const LeadAdminQuerySchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  q: z.string().trim().min(1).max(200).optional(),
  status: LeadStatusSchema.optional(),
  source: LeadSourceSchema.optional(),
  assigned_to_id: z.coerce.number().int().positive().optional(),
  country: z.string().trim().min(1).optional(),
  created_from: z.coerce.date().optional(),
  created_to: z.coerce.date().optional()
})

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    await requireAdminSession()

    const view = url.searchParams.get('view')
    if (view === 'kanban') {
      const data = await LeadAdminService.getKanban()
      return apiSuccess(data)
    }

    const params = LeadAdminQuerySchema.parse({
      ...parsePaginationParams(url.searchParams),
      q: url.searchParams.get('q') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      source: url.searchParams.get('source') ?? undefined,
      assigned_to_id: url.searchParams.get('assigned_to_id') ?? undefined,
      country: url.searchParams.get('country') ?? undefined,
      created_from: url.searchParams.get('created_from') ?? undefined,
      created_to: url.searchParams.get('created_to') ?? undefined
    })

    const result = await LeadService.list(
      {
        q: params.q,
        status: params.status,
        source: params.source,
        assignedToId: params.assigned_to_id,
        country: params.country,
        createdFrom: params.created_from,
        createdTo: params.created_to
      },
      { page: params.page, limit: params.limit }
    )

    const meta = withPagination(result.items, result.total, params.page, params.limit).meta
    return apiSuccess({ items: result.items, total: result.total }, meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

