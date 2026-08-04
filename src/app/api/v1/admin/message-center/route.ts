import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminMessageCenterService } from '@/services/admin-message-center.service'

export const dynamic = 'force-dynamic'

const leadSourceEnum = z.enum([
  'MARKETPLACE_INQUIRY',
  'SAMPLE_REQUEST',
  'SOCIAL_CAMPAIGN',
  'DIRECT_CONTACT',
  'MANUAL_ENTRY'
])

const leadStatusEnum = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CLOSED_WON',
  'CLOSED_LOST'
])

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  q: z.string().max(200).optional().nullable(),
  source: leadSourceEnum.optional().nullable(),
  status: leadStatusEnum.optional().nullable()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const rawSource = url.searchParams.get('source')
    const rawStatus = url.searchParams.get('status')
    const parsed = QuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      q: url.searchParams.get('q'),
      source: rawSource && rawSource.length > 0 ? rawSource : null,
      status: rawStatus && rawStatus.length > 0 ? rawStatus : null
    })

    const data = await AdminMessageCenterService.listThreads({
      page: parsed.page,
      limit: parsed.limit,
      q: parsed.q ?? null,
      source: parsed.source ?? null,
      status: parsed.status ?? null
    })
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
