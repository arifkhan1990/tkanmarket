import { and, asc, eq, inArray, isNotNull, isNull, lte, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { socialActivityLog, socialPosts } from '@/db/schema/social.schema'
import { SOCIAL_MAX_PUBLISH_ATTEMPTS } from '@/constants'
import { AppError, NotFoundError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { SocialCredentialsService } from '@/services/social-credentials.service'
import { consumePublishSlot, releasePublishSlot } from '@/lib/social/rate-limiter'
import { PlatformPublishError, getPublisher } from '@/lib/social/platforms'

export interface PublishResultSummary {
  postId: number
  platform: string
  platformPostId: string
  platformPostUrl: string | null
}

export class SocialPublisherService {
  public static async publishPost(params: { postId: number; actorUserId: number | null }): Promise<PublishResultSummary> {
    const db = getDb()
    const rows = await db
      .select({
        id: socialPosts.id,
        fabricId: socialPosts.fabricId,
        platform: socialPosts.platform,
        contentType: socialPosts.contentType,
        status: socialPosts.status,
        captionText: socialPosts.captionText,
        hashtags: socialPosts.hashtags,
        scriptText: socialPosts.scriptText,
        mediaUrls: socialPosts.mediaUrls,
        platformMediaVariants: socialPosts.platformMediaVariants,
        publishAttempts: socialPosts.publishAttempts,
        fabricImages: fabrics.images
      })
      .from(socialPosts)
      .innerJoin(fabrics, eq(socialPosts.fabricId, fabrics.id))
      .where(and(eq(socialPosts.id, params.postId), isNull(socialPosts.deletedAt), isNull(fabrics.deletedAt)))
      .limit(1)

    const post = rows[0]
    if (!post) throw new NotFoundError('Social post not found')
    if (post.status === 'PUBLISHED') {
      throw new ValidationError('Post is already published')
    }
    if (post.publishAttempts >= SOCIAL_MAX_PUBLISH_ATTEMPTS) {
      throw new ValidationError(`Post exceeded the maximum of ${SOCIAL_MAX_PUBLISH_ATTEMPTS} publish attempts`)
    }
    if (!post.captionText || post.captionText.trim().length === 0) {
      const msg = 'Post cannot be published without a caption'
      await db
        .update(socialPosts)
        .set({
          status: 'FAILED',
          errorMessage: msg,
          lastPublishErrorAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(socialPosts.id, post.id))
      await db.insert(socialActivityLog).values({
        postId: post.id,
        action: 'FAILED',
        actorUserId: params.actorUserId,
        details: { platform: post.platform, error: msg }
      })
      throw new ValidationError(msg)
    }
    const caption = post.captionText
    const hashtags = post.hashtags ?? []

    const platform = post.platform
    const variantsByPlatform = (post.platformMediaVariants as Record<string, string[] | undefined> | null) ?? null
    const platformMedia = variantsByPlatform?.[platform] ?? null
    const mediaUrls = (platformMedia && platformMedia.length > 0 ? platformMedia : post.mediaUrls) ?? post.fabricImages ?? []
    if (!mediaUrls || mediaUrls.length === 0) {
      const msg = 'Post has no media available for publishing'
      await db
        .update(socialPosts)
        .set({
          status: 'FAILED',
          errorMessage: msg,
          lastPublishErrorAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(socialPosts.id, post.id))
      await db.insert(socialActivityLog).values({
        postId: post.id,
        action: 'FAILED',
        actorUserId: params.actorUserId,
        details: { platform: post.platform, error: msg }
      })
      throw new ValidationError(msg)
    }

    const credential = await SocialCredentialsService.getActiveForPlatform(platform)
    if (!credential) {
      throw new AppError(`No connected ${platform} account available for publishing`, 'NO_CREDENTIAL', 412)
    }

    const slot = await consumePublishSlot(platform, credential.accountId)
    if (!slot.ok) {
      throw new AppError(`Daily publish quota reached for ${platform} (${credential.accountId}). Resets at ${slot.resetsAt.toISOString()}`, 'QUOTA_EXCEEDED', 429)
    }

    await db
      .update(socialPosts)
      .set({
        publishAttempts: sql`${socialPosts.publishAttempts} + 1`,
        updatedAt: new Date()
      })
      .where(eq(socialPosts.id, post.id))

    try {
      const publisher = getPublisher(platform)
      const result = await publisher.publish(credential, {
        captionText: caption,
        hashtags,
        scriptText: post.scriptText,
        mediaUrls,
        contentType: post.contentType
      })

      await db
        .update(socialPosts)
        .set({
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedByUserId: params.actorUserId,
          platformPostId: result.platformPostId,
          platformPostUrl: result.platformPostUrl,
          platformMetadata: result.rawResponse,
          errorMessage: null,
          lastPublishErrorAt: null,
          updatedAt: new Date()
        })
        .where(eq(socialPosts.id, post.id))

      await db.insert(socialActivityLog).values({
        postId: post.id,
        action: 'PUBLISHED',
        actorUserId: params.actorUserId,
        details: { platform, platformPostId: result.platformPostId, platformPostUrl: result.platformPostUrl }
      })

      return {
        postId: post.id,
        platform,
        platformPostId: result.platformPostId,
        platformPostUrl: result.platformPostUrl
      }
    } catch (err) {
      await releasePublishSlot(platform, credential.accountId)
      const retryable = err instanceof PlatformPublishError ? err.retryable : true
      const message = err instanceof Error ? err.message : 'Unknown publish error'
      const nextAttempts = post.publishAttempts + 1
      const terminal = !retryable || nextAttempts >= SOCIAL_MAX_PUBLISH_ATTEMPTS
      await db
        .update(socialPosts)
        .set({
          status: terminal ? 'FAILED' : post.status === 'SCHEDULED' ? 'SCHEDULED' : 'APPROVED',
          errorMessage: message,
          lastPublishErrorAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(socialPosts.id, post.id))

      await db.insert(socialActivityLog).values({
        postId: post.id,
        action: terminal ? 'FAILED' : 'UPDATED',
        actorUserId: params.actorUserId,
        details: { platform, error: message, terminal, attempts: nextAttempts }
      })

      if (terminal) {
        throw err
      }
      logger.warn('Transient publish failure, will retry', { postId: post.id, platform, message, nextAttempts })
      throw err
    }
  }

  public static async findDueScheduledPostIds(params: { limit: number; now?: Date }): Promise<number[]> {
    const db = getDb()
    const now = params.now ?? new Date()
    const rows = await db
      .select({ id: socialPosts.id })
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.status, 'SCHEDULED'),
          isNotNull(socialPosts.scheduledAt),
          lte(socialPosts.scheduledAt, now),
          isNull(socialPosts.deletedAt)
        )
      )
      .orderBy(asc(socialPosts.scheduledAt))
      .limit(params.limit)
    return rows.map((r) => r.id)
  }

  public static async approveMany(params: { postIds: number[]; actorUserId: number }): Promise<number> {
    if (params.postIds.length === 0) return 0
    const db = getDb()
    const updated = await db
      .update(socialPosts)
      .set({ status: 'APPROVED', approvedByUserId: params.actorUserId, approvedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          inArray(socialPosts.id, params.postIds),
          inArray(socialPosts.status, ['DRAFT', 'FAILED']),
          isNull(socialPosts.deletedAt)
        )
      )
      .returning({ id: socialPosts.id })

    if (updated.length > 0) {
      await db.insert(socialActivityLog).values(
        updated.map((r) => ({
          postId: r.id,
          action: 'APPROVED' as const,
          actorUserId: params.actorUserId
        }))
      )
    }
    return updated.length
  }

  public static async scheduleMany(params: { postIds: number[]; scheduledAt: Date; actorUserId: number }): Promise<number> {
    if (params.postIds.length === 0) return 0
    const db = getDb()
    const updated = await db
      .update(socialPosts)
      .set({
        status: 'SCHEDULED',
        scheduledAt: params.scheduledAt,
        scheduledByUserId: params.actorUserId,
        updatedAt: new Date()
      })
      .where(
        and(
          inArray(socialPosts.id, params.postIds),
          inArray(socialPosts.status, ['DRAFT', 'APPROVED', 'FAILED']),
          isNull(socialPosts.deletedAt)
        )
      )
      .returning({ id: socialPosts.id })

    if (updated.length > 0) {
      await db.insert(socialActivityLog).values(
        updated.map((r) => ({
          postId: r.id,
          action: 'SCHEDULED' as const,
          actorUserId: params.actorUserId,
          details: { scheduledAt: params.scheduledAt.toISOString() }
        }))
      )
    }
    return updated.length
  }
}
