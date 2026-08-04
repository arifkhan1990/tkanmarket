import type { NextRequest } from 'next/server'

import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { getDb } from '@/db'
import { generatedMedia } from '@/db/schema/generated-media.schema'
import { resolveR2Url } from '@/lib/storage/r2'
import { and, count, eq, isNull } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const fabricId = Number(id)
    if (!Number.isInteger(fabricId) || fabricId < 1) {
      return apiError('VALIDATION_ERROR', 'Invalid fabric ID', 400)
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20))
    const offset = (page - 1) * limit

    const db = getDb()

    const whereConditions = [
      eq(generatedMedia.fabricId, fabricId),
      isNull(generatedMedia.deletedAt),
      eq(generatedMedia.status, 'COMPLETED')
    ]

    if (type === 'image' || type === 'video') {
      whereConditions.push(eq(generatedMedia.type, type))
    }

    const [totalRows, items] = await Promise.all([
      db
        .select({ total: count() })
        .from(generatedMedia)
        .where(and(...whereConditions)),
      db
        .select({
          id: generatedMedia.id,
          fabricId: generatedMedia.fabricId,
          type: generatedMedia.type,
          mediaType: generatedMedia.mediaType,
          url: generatedMedia.url,
          thumbnailUrl: generatedMedia.thumbnailUrl,
          prompt: generatedMedia.prompt,
          provider: generatedMedia.provider,
          providerModel: generatedMedia.providerModel,
          status: generatedMedia.status,
          durationSeconds: generatedMedia.durationSeconds,
          aspectRatio: generatedMedia.aspectRatio,
          fileSizeBytes: generatedMedia.fileSizeBytes,
          createdAt: generatedMedia.createdAt
        })
        .from(generatedMedia)
        .where(and(...whereConditions))
        .orderBy(generatedMedia.createdAt)
        .limit(limit)
        .offset(offset)
    ])

    return apiSuccess({
      items: items.map((item) => ({
        ...item,
        url: resolveR2Url(item.url),
        thumbnailUrl: resolveR2Url(item.thumbnailUrl)
      })),
      pagination: {
        page,
        limit,
        total: totalRows[0]?.total ?? 0,
        totalPages: Math.ceil((totalRows[0]?.total ?? 0) / limit)
      }
    })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}