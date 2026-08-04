import type { NextRequest } from 'next/server'

import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { BlogAdminService } from '@/services/admin/blog-admin.service'
import { BlogPostUpdateSchema } from '@/lib/validations/blog.validation'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdminSession()

    const { slug } = await params
    if (!slug || slug.length < 2) {
      return apiError('VALIDATION_ERROR', 'Invalid slug', 400)
    }

    const post = await BlogAdminService.getBySlug(slug)
    return apiSuccess(post)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdminSession()

    const { slug } = await params
    if (!slug || slug.length < 2) {
      return apiError('VALIDATION_ERROR', 'Invalid slug', 400)
    }

    const body = await req.json()
    const parsed = BlogPostUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid blog post data', 400)
    }

    if (Object.keys(parsed.data).length === 0) {
      return apiError('VALIDATION_ERROR', 'No fields to update', 400)
    }

    const post = await BlogAdminService.update(slug, parsed.data)
    return apiSuccess(post)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdminSession()

    const { slug } = await params
    if (!slug || slug.length < 2) {
      return apiError('VALIDATION_ERROR', 'Invalid slug', 400)
    }

    await BlogAdminService.delete(slug)
    return apiSuccess({ deleted: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
