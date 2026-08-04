import type { NextRequest } from 'next/server'

import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { BlogAdminService } from '@/services/admin/blog-admin.service'
import { BlogPostCreateSchema, BlogPostQuerySchema } from '@/lib/validations/blog.validation'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()

    const url = new URL(req.url)
    const parsed = BlogPostQuerySchema.safeParse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      q: url.searchParams.get('q') ?? '',
      category: url.searchParams.get('category') ?? undefined,
    })

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400)
    }

    const result = await BlogAdminService.list(parsed.data)
    return apiSuccess(result.items, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / parsed.data.limit)),
    })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()

    const body = await req.json()
    const parsed = BlogPostCreateSchema.safeParse(body)

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid blog post data', 400)
    }

    const post = await BlogAdminService.create(parsed.data)
    return apiSuccess(post, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
