import type { NextRequest } from 'next/server'
import { and, desc, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { socialPosts } from '@/db/schema/social.schema'
import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const db = getDb()
    const rows = await db
      .select({
        id: socialPosts.id,
        platform: socialPosts.platform,
        contentType: socialPosts.contentType,
        errorMessage: socialPosts.errorMessage,
        lastPublishErrorAt: socialPosts.lastPublishErrorAt,
        publishAttempts: socialPosts.publishAttempts,
        fabricTitle: fabrics.titleRu,
        fabricSku: fabrics.sku
      })
      .from(socialPosts)
      .innerJoin(fabrics, eq(socialPosts.fabricId, fabrics.id))
      .where(and(eq(socialPosts.status, 'FAILED'), isNull(socialPosts.deletedAt), isNull(fabrics.deletedAt)))
      .orderBy(desc(socialPosts.lastPublishErrorAt))
      .limit(20)

    return apiSuccess({
      failures: rows.map((r) => ({
        id: r.id,
        platform: r.platform,
        contentType: r.contentType,
        error_message: r.errorMessage,
        last_publish_error_at: r.lastPublishErrorAt ? r.lastPublishErrorAt.toISOString() : null,
        publish_attempts: r.publishAttempts,
        fabric_title: r.fabricTitle,
        fabric_sku: r.fabricSku
      }))
    })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
