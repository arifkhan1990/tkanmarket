import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession, requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { ApiKeysAdminService } from '@/services/api-keys-admin.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional().nullable()
})

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  scopes: z.array(z.string().trim().min(1).max(120)).max(20).optional().default([])
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)

    const query = QuerySchema.parse({ q: url.searchParams.get('q') })
    const data = await ApiKeysAdminService.list({ page, limit, q: query.q ?? undefined })
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminOnlySession()
    const sessionUserId = Number(session.user.id)
    if (!Number.isFinite(sessionUserId) || sessionUserId <= 0) throw new Error('Invalid admin user')

    const body = await req.json()
    const input = CreateSchema.parse(body)

    const createdById = sessionUserId
    const result = await ApiKeysAdminService.create({ name: input.name, scopes: input.scopes, createdById })

    return apiSuccess(result, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

