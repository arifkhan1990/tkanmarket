import type { SQL } from 'drizzle-orm'
import { and, asc, eq, inArray, isNotNull, isNull, lt, lte, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { notifications } from '@/db/schema/notifications.schema'
import { users } from '@/db/schema/users.schema'
import { socialActivityLog, socialCampaigns, socialPosts } from '@/db/schema/social.schema'
import { SOCIAL_ANALYTICS_SYNC_INTERVAL_MS, SOCIAL_MAX_PUBLISH_ATTEMPTS } from '@/constants'
import { AppError, NotFoundError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { SocialCredentialsService } from '@/services/social-credentials.service'
import { consumePublishSlot, releasePublishSlot } from '@/lib/social/rate-limiter'
import { PlatformPublishError, getPublisher } from '@/lib/social/platforms'
import { resolveR2Url } from '@/lib/storage/r2'
import { getPublicSiteUrl } from '@/lib/utils/seo'
import { DEFAULT_LOCALE } from '@/types/i18n.types'

/**
 * Extracts the provider's own error detail from a PlatformPublishError. Most
 * APIs (Facebook/Instagram Graph, TikTok, Pinterest, YouTube) return a nested
 * `{ error: { message } }` payload; surfacing it makes worker logs actionable
 * instead of the generic "XXX API 400 Bad Request".
 */
function describePlatformError(err: PlatformPublishError): string {
  const body = asRecord(err.body)
  const nested = asRecord(body.error)
  const detail = stringOrNull(nested.message) ?? stringOrNull(nested.error_user_msg) ?? stringOrNull(body.message)
  return detail ? `${err.message} — ${detail}` : err.message
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

export interface PublishResultSummary {
  postId: number
  platform: string
  platformPostId: string
  platformPostUrl: string | null
}

export class SocialPublisherService {
  public static async publishPost(params: { postId: number; actorUserId: number | null }): Promise<PublishResultSummary> {
    const db = getDb()

    // ── 1. Read the current row (cheap, non-blocking pre-flight) ──
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
        revisionNumber: socialPosts.revisionNumber,
        publishCredentialId: socialPosts.publishCredentialId,
        reviewState: socialPosts.reviewState,
        fabricImages: fabrics.images,
        fabricSlug: fabrics.slug
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
    if (post.status === 'PUBLISHING') {
      throw new ValidationError('Post is already being published')
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
    // Fabric detail page link is always appended so every published post
    // points back to the fabric on the site, regardless of how the content was
    // generated. Built fresh at publish time (never written back to the draft).
    const fabricUrl = post.fabricSlug
      ? `${getPublicSiteUrl()}/${DEFAULT_LOCALE}/fabrics/${post.fabricSlug}`
      : null
    const caption = fabricUrl ? `${post.captionText.trim()}\n\nView this fabric: ${fabricUrl}` : post.captionText
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

    // P2-6: media pre-flight — stored R2 keys must be resolved to public URLs
    // before the platform can fetch them, and every URL must be http(s).
    const resolvedMedia = mediaUrls
      .map((u) => resolveR2Url(u ?? ''))
      .filter((u): u is string => !!u)
    if (resolvedMedia.length === 0 || resolvedMedia.some((u) => !/^https?:\/\//.test(u))) {
      const msg = 'Post media contains private or invalid URLs that cannot be published'
      await this.markFailed({ postId: post.id, platform, message: msg, actorUserId: params.actorUserId, terminal: true })
      throw new ValidationError(msg)
    }

    // ── 1.5 Implicit approval ──
    //    "Publish now" must publish immediately without a separate approve step.
    //    A DRAFT (never approved) or FAILED (previously failed) post is approved
    //    here — recording approval semantics — before the atomic claim below.
    if (post.status === 'DRAFT' || post.status === 'FAILED') {
      const nextReviewState = post.reviewState === 'FULLY_APPROVED' ? 'FULLY_APPROVED' : 'CONTENT_APPROVED'
      const approved = await db
        .update(socialPosts)
        .set({
          status: 'APPROVED',
          reviewState: nextReviewState,
          approvedByUserId: params.actorUserId,
          approvedAt: new Date(),
          rejectionReason: null,
          rejectedByUserId: null,
          rejectedAt: null,
          updatedAt: new Date()
        })
        .where(and(eq(socialPosts.id, post.id), inArray(socialPosts.status, ['DRAFT', 'FAILED']), isNull(socialPosts.deletedAt)))
        .returning({ id: socialPosts.id })
      if (approved.length > 0) {
        await db.insert(socialActivityLog).values({
          postId: post.id,
          action: 'APPROVED',
          actorUserId: params.actorUserId,
          details: { autoApproved: true }
        })
      }
    }

    // ── 2. Atomic claim — the row-level gate that makes double-publish impossible.
    //    Only one concurrent worker can flip APPROVED/SCHEDULED → PUBLISHING; losers
    //    get zero rows back and exit without touching the platform. A post that lost
    //    a claim race is simply already in flight, so we treat it as a validation error.
    const claimed = await db
      .update(socialPosts)
      .set({
        status: 'PUBLISHING',
        publishAttempts: sql`${socialPosts.publishAttempts} + 1`,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(socialPosts.id, post.id),
          inArray(socialPosts.status, ['APPROVED', 'SCHEDULED', 'VIDEO_PENDING']),
          lt(socialPosts.publishAttempts, SOCIAL_MAX_PUBLISH_ATTEMPTS),
          isNull(socialPosts.deletedAt)
        )
      )
      .returning({ id: socialPosts.id })

    if (claimed.length === 0) {
      throw new ValidationError('Post could not be claimed for publishing; it may already be in progress')
    }

    // ── 3. Resolve the publish credential. Prefer the one bound to the post (the
    //    exact account it was reviewed/scheduled for); fall back to the platform's
    //    first active account. Binding is persisted so analytics always query the
    //    account the content actually ran on. ──
    const credential = post.publishCredentialId
      ? await SocialCredentialsService.getCredentialById(post.publishCredentialId)
      : await SocialCredentialsService.getActiveForPlatform(platform)
    if (!credential) {
      await this.markFailed({ postId: post.id, platform, message: `No connected ${platform} account available for publishing`, actorUserId: params.actorUserId, terminal: true })
      throw new AppError(`No connected ${platform} account available for publishing`, 'NO_CREDENTIAL', 412)
    }

    const slot = await consumePublishSlot(platform, credential.accountId)
    if (!slot.ok) {
      throw new AppError(`Daily publish quota reached for ${platform} (${credential.accountId}). Resets at ${slot.resetsAt.toISOString()}`, 'QUOTA_EXCEEDED', 429)
    }

    try {
      const publisher = getPublisher(platform)
      const result = await publisher.publish(credential, {
        captionText: caption,
        hashtags,
        scriptText: post.scriptText,
        mediaUrls: resolvedMedia,
        contentType: post.contentType,
        link: fabricUrl
      })

      const now = new Date()
      await db
        .update(socialPosts)
        .set({
          status: 'PUBLISHED',
          publishedAt: now,
          publishedByUserId: params.actorUserId,
          publishCredentialId: credential.id,
          platformAccountId: credential.accountId,
          publishedVersion: post.revisionNumber,
          mediaSnapshot: resolvedMedia,
          platformPostId: result.platformPostId,
          platformPostUrl: result.platformPostUrl,
          platformMetadata: result.rawResponse,
          errorMessage: null,
          lastPublishErrorAt: null,
          nextSyncAt: new Date(now.getTime() + SOCIAL_ANALYTICS_SYNC_INTERVAL_MS),
          updatedAt: now
        })
        .where(eq(socialPosts.id, post.id))

      await db.insert(socialActivityLog).values({
        postId: post.id,
        action: 'PUBLISHED',
        actorUserId: params.actorUserId,
        details: { platform, platformPostId: result.platformPostId, platformPostUrl: result.platformPostUrl, credentialId: credential.id, accountId: credential.accountId, publishedVersion: post.revisionNumber }
      })

      await this.notifyAdmins({
        type: 'social_publish_success',
        title: 'Social post published',
        body: `${platform} post #${post.id} published successfully`,
        data: { postId: post.id, platform, platformPostId: result.platformPostId, platformPostUrl: result.platformPostUrl }
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
      const message = err instanceof PlatformPublishError ? describePlatformError(err) : err instanceof Error ? err.message : 'Unknown publish error'
      const nextAttempts = post.publishAttempts + 1
      const terminal = !retryable || nextAttempts >= SOCIAL_MAX_PUBLISH_ATTEMPTS

      if (terminal) {
        await this.markFailed({ postId: post.id, platform, message, actorUserId: params.actorUserId, terminal: true, attempts: nextAttempts })
      } else {
        await db
          .update(socialPosts)
          .set({
            status: post.status === 'SCHEDULED' ? 'SCHEDULED' : 'APPROVED',
            errorMessage: message,
            lastPublishErrorAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(socialPosts.id, post.id))
        await db.insert(socialActivityLog).values({
          postId: post.id,
          action: 'UPDATED',
          actorUserId: params.actorUserId,
          details: { platform, error: message, terminal, attempts: nextAttempts }
        })
        logger.warn('Transient publish failure, will retry', { postId: post.id, platform, message, nextAttempts })
      }
      throw err
    }
  }

  private static async markFailed(params: {
    postId: number
    platform: string
    message: string
    actorUserId: number | null
    terminal: boolean
    attempts?: number
  }): Promise<void> {
    const db = getDb()
    const now = new Date()
    await db
      .update(socialPosts)
      .set({
        status: 'FAILED',
        errorMessage: params.message,
        lastPublishErrorAt: now,
        updatedAt: now
      })
      .where(eq(socialPosts.id, params.postId))

    await db.insert(socialActivityLog).values({
      postId: params.postId,
      action: 'FAILED',
      actorUserId: params.actorUserId,
      details: { platform: params.platform, error: params.message, terminal: params.terminal, attempts: params.attempts ?? null }
    })

    // Terminal failures are pushed to every admin's notification center so the
    // pipeline never dies silently (P2-4).
    if (params.terminal) {
      await this.notifyAdmins({
        type: 'social_publish_failed',
        title: 'Social post publish failed',
        body: `${params.platform} publish failed permanently for post #${params.postId}`,
        data: { postId: params.postId, platform: params.platform, error: params.message }
      })
    }
  }

  private static async notifyAdmins(params: { type: string; title: string; body: string; data: Record<string, unknown> }): Promise<void> {
    try {
      const db = getDb()
      const adminRows = await db.select({ id: users.id }).from(users).where(and(eq(users.role, 'ADMIN'), isNull(users.deletedAt)))
      if (adminRows.length === 0) return
      await db.insert(notifications).values(
        adminRows.map((u) => ({
          userId: u.id,
          type: params.type,
          title: params.title,
          body: params.body,
          data: params.data,
          isHighPriority: true
        }))
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'notification insert failed'
      logger.error('Failed to notify admins of publish failure', { message })
    }
  }

  public static async findDueScheduledPostIds(params: { limit: number; now?: Date }): Promise<number[]> {
    const db = getDb()
    const now = params.now ?? new Date()
    const rows = await db
      .select({ id: socialPosts.id })
      .from(socialPosts)
      .leftJoin(socialCampaigns, eq(socialPosts.campaignId, socialCampaigns.id))
      .where(
        and(
          eq(socialPosts.status, 'SCHEDULED'),
          isNotNull(socialPosts.scheduledAt),
          lte(socialPosts.scheduledAt, now),
          isNull(socialPosts.deletedAt),
          // Campaign gating (P2-9): posts attached to a PAUSED/ARCHIVED or deleted
          // campaign never auto-publish. Posts without a campaign are unaffected.
          or(isNull(socialCampaigns.id), and(isNull(socialCampaigns.deletedAt), inArray(socialCampaigns.status, ['PLANNING', 'ACTIVE', 'COMPLETED']))) as SQL
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
          inArray(socialPosts.status, ['DRAFT', 'FAILED', 'VIDEO_PENDING']),
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

  public static async scheduleMany(params: { postIds: number[]; scheduledAt: Date; actorUserId: number; timezone?: string }): Promise<number> {
    if (params.postIds.length === 0) return 0
    const db = getDb()
    const updated = await db
      .update(socialPosts)
      .set({
        status: 'SCHEDULED',
        scheduledAt: params.scheduledAt,
        scheduledByUserId: params.actorUserId,
        timezone: params.timezone ?? 'UTC',
        updatedAt: new Date()
      })
      .where(
        and(
          inArray(socialPosts.id, params.postIds),
          inArray(socialPosts.status, ['DRAFT', 'APPROVED', 'FAILED', 'VIDEO_PENDING', 'SCHEDULED']),
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
