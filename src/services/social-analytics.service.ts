import type { SQL } from 'drizzle-orm'
import { and, asc, desc, eq, gte, isNotNull, isNull, lt, lte, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { socialActivityLog, socialAnalyticsDaily, socialPostAnalyticsHistory, socialPosts } from '@/db/schema/social.schema'
import { SOCIAL_ANALYTICS_SYNC_INTERVAL_MS } from '@/constants'
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

export interface AnalyticsDailyPoint {
  date: string
  platform: SocialPlatform | 'ALL'
  totalReach: number
  totalImpressions: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalSaves: number
  totalLinkClicks: number
  totalVideoViews: number
}

/** Raw per-post analytics history is purged after this many days; the daily
 *  rollup table is the durable long-term source for dashboards. */
export const SOCIAL_ANALYTICS_HISTORY_RETENTION_DAYS = 90
export const SOCIAL_ANALYTICS_MAX_CONSECUTIVE_FAILURES = 5

export class SocialAnalyticsService {
  public static async syncPostAnalytics(postId: number): Promise<void> {
    const db = getDb()
    const rows = await db
      .select({
        id: socialPosts.id,
        platform: socialPosts.platform,
        platformPostId: socialPosts.platformPostId,
        status: socialPosts.status,
        publishCredentialId: socialPosts.publishCredentialId
      })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
      .limit(1)
    const post = rows[0]
    if (!post) return
    if (post.status !== 'PUBLISHED' || !post.platformPostId) return

    // P1-1: analytics must read from the exact account the post was published
    // with. Falls back to the platform's first active account for legacy posts
    // that predate credential binding.
    const credential = post.publishCredentialId
      ? await SocialCredentialsService.getCredentialById(post.publishCredentialId)
      : await SocialCredentialsService.getActiveForPlatform(post.platform)
    if (!credential) {
      logger.warn('Analytics sync: no active credentials', { postId, platform: post.platform })
      return
    }
    const publisher = getPublisher(post.platform)
    try {
      const snapshot = await publisher.fetchAnalytics(credential, post.platformPostId)
      const now = new Date()
      const today = now.toISOString().slice(0, 10)
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
          analyticsSyncAttempts: 0,
          nextSyncAt: new Date(now.getTime() + SOCIAL_ANALYTICS_SYNC_INTERVAL_MS),
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

      // Daily rollup (P2-3): a single upsert-per-post-per-day row that survives
      // raw-history purges and powers time-series dashboards cheaply.
      await db
        .insert(socialAnalyticsDaily)
        .values({
          postId,
          platform: post.platform,
          metricDate: today,
          reach: snapshot.reach ?? 0,
          impressions: snapshot.impressions ?? 0,
          likes: snapshot.likes ?? 0,
          comments: snapshot.comments ?? 0,
          shares: snapshot.shares ?? 0,
          saves: snapshot.saves ?? 0,
          linkClicks: snapshot.linkClicks ?? 0,
          videoViews: snapshot.videoViews ?? 0
        })
        .onConflictDoUpdate({
          target: [socialAnalyticsDaily.postId, socialAnalyticsDaily.metricDate],
          set: {
            reach: sql`excluded.reach`,
            impressions: sql`excluded.impressions`,
            likes: sql`excluded.likes`,
            comments: sql`excluded.comments`,
            shares: sql`excluded.shares`,
            saves: sql`excluded.saves`,
            linkClicks: sql`excluded.link_clicks`,
            videoViews: sql`excluded.video_views`,
            updatedAt: now
          }
        })

      await db.insert(socialActivityLog).values({
        postId,
        action: 'ANALYTICS_SYNCED',
        actorUserId: null,
        details: { platform: post.platform, credentialId: credential.id, accountId: credential.accountId }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'analytics sync failed'
      logger.error('Analytics sync failed', { postId, platform: post.platform, message })
      // Exponential backoff on consecutive failures so a dead account doesn't
      // hammer the queue forever; after the cap the post is skipped until an
      // operator resets it (P2-3).
      const [postRow] = await db
        .select({ analyticsSyncAttempts: socialPosts.analyticsSyncAttempts })
        .from(socialPosts)
        .where(eq(socialPosts.id, postId))
        .limit(1)
      const attempts = (postRow?.analyticsSyncAttempts ?? 0) + 1
      const base = SOCIAL_ANALYTICS_SYNC_INTERVAL_MS
      const backoffMs = Math.min(base * Math.pow(2, attempts - 1), base * 32)
      await db
        .update(socialPosts)
        .set({
          analyticsSyncAttempts: attempts,
          nextSyncAt: attempts >= SOCIAL_ANALYTICS_MAX_CONSECUTIVE_FAILURES ? null : new Date(Date.now() + backoffMs),
          updatedAt: new Date()
        })
        .where(eq(socialPosts.id, postId))
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
          // Respect the next_sync_at backoff gate and the consecutive-failure cap.
          // A post that has exhausted its cap is excluded until an operator resets it.
          lt(socialPosts.analyticsSyncAttempts, SOCIAL_ANALYTICS_MAX_CONSECUTIVE_FAILURES),
          or(
            sql`${socialPosts.nextSyncAt} IS NULL`,
            lte(socialPosts.nextSyncAt, now)
          ),
          or(isNull(socialPosts.analyticsSyncedAt), lte(socialPosts.analyticsSyncedAt, cutoff), sql`${socialPosts.analyticsSyncAttempts} > 0`) ?? sql`true`
        )
      )
      .orderBy(asc(socialPosts.analyticsSyncedAt))
      .limit(params.limit)
    return rows.map((r) => r.id)
  }

  /** Removes raw history rows older than the retention window. The daily rollup
   *  table remains intact so dashboards keep working. Call from the analytics
   *  scheduler tick. */
  public static async purgeExpiredHistory(params: { now?: Date } = {}): Promise<number> {
    const db = getDb()
    const now = params.now ?? new Date()
    const cutoff = new Date(now.getTime() - SOCIAL_ANALYTICS_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    const rows = await db
      .delete(socialPostAnalyticsHistory)
      .where(lt(socialPostAnalyticsHistory.capturedAt, cutoff))
      .returning({ id: socialPostAnalyticsHistory.id })
    return rows.length
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

  /** Daily time-series from the rollup table — the durable long-term analytics
   *  source that survives raw-history purges (P2-3). */
  public static async dailySeries(params: {
    platform?: SocialPlatform
    since?: Date
    until?: Date
  }): Promise<AnalyticsDailyPoint[]> {
    const db = getDb()
    const conds: SQL[] = []
    if (params.platform) conds.push(eq(socialAnalyticsDaily.platform, params.platform))
    if (params.since) conds.push(gte(socialAnalyticsDaily.metricDate, params.since.toISOString().slice(0, 10)))
    if (params.until) conds.push(lt(socialAnalyticsDaily.metricDate, params.until.toISOString().slice(0, 10)))

    const where = conds.length > 0 ? and(...conds) : undefined
    const rows = await db
      .select({
        date: sql<string>`to_char(${socialAnalyticsDaily.metricDate}, 'YYYY-MM-DD')`,
        platform: socialAnalyticsDaily.platform,
        totalReach: sql<number>`coalesce(sum(${socialAnalyticsDaily.reach}), 0)::int`,
        totalImpressions: sql<number>`coalesce(sum(${socialAnalyticsDaily.impressions}), 0)::int`,
        totalLikes: sql<number>`coalesce(sum(${socialAnalyticsDaily.likes}), 0)::int`,
        totalComments: sql<number>`coalesce(sum(${socialAnalyticsDaily.comments}), 0)::int`,
        totalShares: sql<number>`coalesce(sum(${socialAnalyticsDaily.shares}), 0)::int`,
        totalSaves: sql<number>`coalesce(sum(${socialAnalyticsDaily.saves}), 0)::int`,
        totalLinkClicks: sql<number>`coalesce(sum(${socialAnalyticsDaily.linkClicks}), 0)::int`,
        totalVideoViews: sql<number>`coalesce(sum(${socialAnalyticsDaily.videoViews}), 0)::int`
      })
      .from(socialAnalyticsDaily)
      .where(where)
      .groupBy(socialAnalyticsDaily.metricDate, socialAnalyticsDaily.platform)
      .orderBy(sql`to_char(${socialAnalyticsDaily.metricDate}, 'YYYY-MM-DD')`)

    return rows.map((r) => ({
      date: r.date,
      platform: r.platform,
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
