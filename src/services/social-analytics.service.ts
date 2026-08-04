import { and, asc, desc, eq, gte, isNotNull, isNull, lt, lte, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { socialActivityLog, socialPostAnalyticsHistory, socialPosts } from '@/db/schema/social.schema'
import { logger } from '@/lib/logger'
import { SocialCredentialsService } from '@/services/social-credentials.service'
import { getPublisher } from '@/lib/social/platforms'

import type { SocialPlatform } from '@/types/queue.types'

export interface AnalyticsSummary {
  platform: SocialPlatform | 'ALL'
  publishedCount: number
  totalReach: number
  totalImpressions: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalSaves: number
  totalLinkClicks: number
  totalVideoViews: number
}

export class SocialAnalyticsService {
  public static async syncPostAnalytics(postId: number): Promise<void> {
    const db = getDb()
    const rows = await db
      .select({
        id: socialPosts.id,
        platform: socialPosts.platform,
        platformPostId: socialPosts.platformPostId,
        status: socialPosts.status
      })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
      .limit(1)
    const post = rows[0]
    if (!post) return
    if (post.status !== 'PUBLISHED' || !post.platformPostId) return

    const credential = await SocialCredentialsService.getActiveForPlatform(post.platform)
    if (!credential) {
      logger.warn('Analytics sync: no active credentials', { postId, platform: post.platform })
      return
    }
    const publisher = getPublisher(post.platform)
    try {
      const snapshot = await publisher.fetchAnalytics(credential, post.platformPostId)
      const now = new Date()
      await db
        .update(socialPosts)
        .set({
          reach: snapshot.reach,
          impressions: snapshot.impressions,
          likes: snapshot.likes,
          comments: snapshot.comments,
          shares: snapshot.shares,
          saves: snapshot.saves,
          linkClicks: snapshot.linkClicks,
          videoViews: snapshot.videoViews,
          analyticsSyncedAt: now,
          updatedAt: now
        })
        .where(eq(socialPosts.id, postId))
      await db.insert(socialPostAnalyticsHistory).values({
        postId,
        reach: snapshot.reach,
        impressions: snapshot.impressions,
        likes: snapshot.likes,
        comments: snapshot.comments,
        shares: snapshot.shares,
        saves: snapshot.saves,
        linkClicks: snapshot.linkClicks,
        videoViews: snapshot.videoViews,
        rawPayload: snapshot.rawPayload
      })
      await db.insert(socialActivityLog).values({
        postId,
        action: 'ANALYTICS_SYNCED',
        actorUserId: null,
        details: { platform: post.platform }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'analytics sync failed'
      logger.error('Analytics sync failed', { postId, platform: post.platform, message })
      throw err
    }
  }

  public static async findPostIdsDueForSync(params: { limit: number; minIntervalMs: number; now?: Date }): Promise<number[]> {
    const db = getDb()
    const now = params.now ?? new Date()
    const cutoff = new Date(now.getTime() - params.minIntervalMs)
    const rows = await db
      .select({ id: socialPosts.id })
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.status, 'PUBLISHED'),
          isNotNull(socialPosts.platformPostId),
          isNull(socialPosts.deletedAt),
          or(isNull(socialPosts.analyticsSyncedAt), lte(socialPosts.analyticsSyncedAt, cutoff)) ?? sql`true`
        )
      )
      .orderBy(asc(socialPosts.analyticsSyncedAt))
      .limit(params.limit)
    return rows.map((r) => r.id)
  }

  public static async summary(params: {
    platform?: SocialPlatform
    campaignId?: number
    since?: Date
    until?: Date
  }): Promise<AnalyticsSummary[]> {
    const db = getDb()
    const conds = [eq(socialPosts.status, 'PUBLISHED'), isNull(socialPosts.deletedAt)]
    if (params.platform) conds.push(eq(socialPosts.platform, params.platform))
    if (params.campaignId !== undefined) conds.push(eq(socialPosts.campaignId, params.campaignId))
    if (params.since) conds.push(gte(socialPosts.publishedAt, params.since))
    if (params.until) conds.push(lt(socialPosts.publishedAt, params.until))

    const rows = await db
      .select({
        platform: socialPosts.platform,
        publishedCount: sql<number>`count(*)::int`,
        totalReach: sql<number>`coalesce(sum(${socialPosts.reach}), 0)::int`,
        totalImpressions: sql<number>`coalesce(sum(${socialPosts.impressions}), 0)::int`,
        totalLikes: sql<number>`coalesce(sum(${socialPosts.likes}), 0)::int`,
        totalComments: sql<number>`coalesce(sum(${socialPosts.comments}), 0)::int`,
        totalShares: sql<number>`coalesce(sum(${socialPosts.shares}), 0)::int`,
        totalSaves: sql<number>`coalesce(sum(${socialPosts.saves}), 0)::int`,
        totalLinkClicks: sql<number>`coalesce(sum(${socialPosts.linkClicks}), 0)::int`,
        totalVideoViews: sql<number>`coalesce(sum(${socialPosts.videoViews}), 0)::int`
      })
      .from(socialPosts)
      .where(and(...conds))
      .groupBy(socialPosts.platform)
      .orderBy(socialPosts.platform)

    return rows.map((r) => ({
      platform: r.platform,
      publishedCount: r.publishedCount,
      totalReach: r.totalReach,
      totalImpressions: r.totalImpressions,
      totalLikes: r.totalLikes,
      totalComments: r.totalComments,
      totalShares: r.totalShares,
      totalSaves: r.totalSaves,
      totalLinkClicks: r.totalLinkClicks,
      totalVideoViews: r.totalVideoViews
    }))
  }

  public static async postHistory(params: { postId: number; limit?: number }): Promise<
    Array<{ capturedAt: string; reach: number | null; impressions: number | null; likes: number | null; comments: number | null; shares: number | null; saves: number | null; linkClicks: number | null; videoViews: number | null }>
  > {
    const db = getDb()
    const rows = await db
      .select()
      .from(socialPostAnalyticsHistory)
      .where(eq(socialPostAnalyticsHistory.postId, params.postId))
      .orderBy(desc(socialPostAnalyticsHistory.capturedAt))
      .limit(params.limit ?? 100)
    return rows.map((r) => ({
      capturedAt: r.capturedAt.toISOString(),
      reach: r.reach,
      impressions: r.impressions,
      likes: r.likes,
      comments: r.comments,
      shares: r.shares,
      saves: r.saves,
      linkClicks: r.linkClicks,
      videoViews: r.videoViews
    }))
  }
}
