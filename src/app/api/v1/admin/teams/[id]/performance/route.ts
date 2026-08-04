import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { TeamAdminService } from '@/services/team-admin.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id } = await context.params
    const teamId = Number(id)
    if (!Number.isFinite(teamId) || teamId < 1) throw new Error('Invalid team id')
    const data = await TeamAdminService.getTeamPerformance(teamId)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
