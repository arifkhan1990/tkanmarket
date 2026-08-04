import type { NextRequest } from 'next/server'

import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { BlogAdminService } from '@/services/admin/blog-admin.service'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdminSession()

    const { slug } = await params
    if (!slug || slug.length < 2) {
      return apiError('VALIDATION_ERROR', 'Invalid slug', 400)
    }

    const post = await BlogAdminService.regenerate(slug)
    return apiSuccess(post)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
