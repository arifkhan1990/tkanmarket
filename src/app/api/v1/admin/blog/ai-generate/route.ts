import type { NextRequest } from 'next/server'

import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { BlogAdminService } from '@/services/admin/blog-admin.service'
import { BlogPostGenerateSchema } from '@/lib/validations/blog.validation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()

    const body = await req.json()
    const parsed = BlogPostGenerateSchema.safeParse(body)

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const post = await BlogAdminService.generateAndStoreFromFabric(parsed.data.fabricId, {
      category: parsed.data.category,
      authorName: parsed.data.authorName,
      authorRole: parsed.data.authorRole,
    })

    return apiSuccess(post, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
