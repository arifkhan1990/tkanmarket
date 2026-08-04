import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession, requireAdminSession } from '@/lib/auth/require-admin'
import { TeamAdminService } from '@/services/team-admin.service'

export const dynamic = 'force-dynamic'

const PostSchema = z.object({
  name: z.string().trim().min(1).max(200)
})

export async function GET() {
  try {
    await requireAdminSession()
    const data = await TeamAdminService.listTeams()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOnlySession()
    const json: unknown = await req.json()
    const body = PostSchema.parse(json)
    const team = await TeamAdminService.createTeam(body.name)
    return apiSuccess(team, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
