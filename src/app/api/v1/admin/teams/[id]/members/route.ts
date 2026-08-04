import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession, requireAdminSession } from '@/lib/auth/require-admin'
import { TeamAdminService } from '@/services/team-admin.service'

export const dynamic = 'force-dynamic'

const PostSchema = z.object({
  userId: z.number().int().positive(),
  title: z.string().trim().max(120).optional().nullable()
})

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id } = await context.params
    const teamId = Number(id)
    if (!Number.isFinite(teamId) || teamId < 1) throw new Error('Invalid team id')
    const data = await TeamAdminService.listTeamMembers(teamId)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminOnlySession()
    const { id } = await context.params
    const teamId = Number(id)
    if (!Number.isFinite(teamId) || teamId < 1) throw new Error('Invalid team id')

    const json: unknown = await req.json()
    const body = PostSchema.parse(json)
    const row = await TeamAdminService.addMember({
      teamId,
      userId: body.userId,
      title: body.title ?? null
    })
    return apiSuccess(row, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
