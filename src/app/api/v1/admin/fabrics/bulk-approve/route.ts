import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminFabricService } from '@/services/admin-fabric.service'

const BodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200)
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const body = BodySchema.parse(await req.json().catch(() => ({})))
    await AdminFabricService.bulkApprove(body.ids, Number(session.user.id ?? 0))
    return apiSuccess({ ids: body.ids, status: 'approved' })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

