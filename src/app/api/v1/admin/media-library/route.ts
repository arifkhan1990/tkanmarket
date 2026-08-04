import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminMediaLibraryService } from '@/services/admin-media-library.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(48).optional().default(12),
  q: z.string().max(200).optional().nullable(),
  folder: z.string().max(120).optional().nullable(),
  fabricId: z.coerce.number().int().positive().optional().nullable(),
  status: z.enum(['all', 'approved', 'draft', 'rejected']).optional().default('all'),
  sort: z.enum(['recent', 'images_desc', 'title_asc']).optional().default('recent')
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const parsed = QuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      q: url.searchParams.get('q'),
      folder: url.searchParams.get('folder'),
      fabricId: url.searchParams.get('fabricId') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      sort: url.searchParams.get('sort') ?? undefined
    })

    const data = await AdminMediaLibraryService.list({
      page: parsed.page,
      limit: parsed.limit,
      q: parsed.q ?? null,
      folderSlug: parsed.folder ?? null,
      fabricId: parsed.fabricId ?? null,
      statusFilter: parsed.status,
      sort: parsed.sort
    })
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
