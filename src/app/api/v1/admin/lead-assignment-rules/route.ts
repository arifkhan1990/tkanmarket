import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { LeadOpsService } from '@/services/lead-ops.service'
import { LeadOpsConfigSchema } from '@/types/lead-assignment.types'

export const dynamic = 'force-dynamic'

const PutBodySchema = z.object({
  assignmentRules: LeadOpsConfigSchema.shape.assignmentRules,
  draftNote: z.string().max(2000).optional()
})

export async function GET() {
  try {
    await requireAdminSession()
    const data = await LeadOpsService.getAssignmentRulesDashboard()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const body = PutBodySchema.parse(await req.json().catch(() => ({})))
    const actorLabel = session.user.email ?? session.user.name ?? 'admin'
    const current = await LeadOpsService.getConfig()
    await LeadOpsService.saveConfig(
      {
        assignmentRules: body.assignmentRules,
        draftNote: body.draftNote ?? current.draftNote
      },
      { actorLabel }
    )
    const data = await LeadOpsService.getAssignmentRulesDashboard()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
