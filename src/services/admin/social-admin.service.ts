import type { SQL } from 'drizzle-orm'
import { and, asc, count, desc, eq, ilike, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { socialActivityLog, socialPosts, socialPostRevisions } from '@/db/schema/social.schema'
import { generatedMedia } from '@/db/schema/generated-media.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { users } from '@/db/schema/users.schema'
import { resolveR2Url } from '@/lib/storage/r2'
import { AIService } from '@/services/ai.service'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { addSocialJob } from '@/lib/queue/helpers'
import type {
  AdminSocialPostDetail,
  AdminSocialQueueItem,
  AdminSocialQueueResult,
  AdminSocialStats
} from '@/types/admin-social.types'
import type { SocialPlatform } from '@/types/queue.types'
import type { SocialContentShared } from '@/types/ai.types'
import type { ReelDuration } from '@/constants'

type Platform = 'INSTAGRAM' | 'TIKTOK' | 'PINTEREST' | 'FACEBOOK' | 'YOUTUBE'
type PostStatus = 'DRAFT' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'VIDEO_PENDING'
type ContentType = 'REEL_5' | 'REEL_8' | 'REEL_10' | 'CAROUSEL' | 'IMAGE_POST' | 'PIN'

function defaultContentTypeForPlatform(platform: Platform): ContentType {
  switch (platform) {
    case 'TIKTOK':
      return 'REEL_8'
    case 'PINTEREST':
      return 'PIN'
    case 'YOUTUBE':
      return 'REEL_8'
    case 'FACEBOOK':
      return 'IMAGE_POST'
    case 'INSTAGRAM':
    default:
      return 'CAROUSEL'
  }
}

function isVideoUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase().split('?')[0] ?? ''
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.m4v')
}

function pickPrimaryImage(mediaUrls: string[] | null | undefined, fabricImages: string[] | null | undefined): string | null {
  const all = [...(mediaUrls ?? []), ...(fabricImages ?? [])].filter(
    (u): u is string => Boolean(u && u.trim().length > 0 && !isVideoUrl(u))
  )
  if (all.length === 0) return null

  // Prioritize AI-generated images (/generated/ path or video thumbnails)
  const aiGen = all.find((u) => u.includes('/generated/') || u.includes('thumbnail'))
  if (aiGen) return aiGen

  return all[0] ?? null
}

function parseMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata) return {}
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  if (typeof metadata === 'object' && metadata !== null) {
    return metadata as Record<string, unknown>
  }
  return {}
}

function buildSharedContent(metadata: unknown, reelScript?: string | null): SocialContentShared {
  const m = parseMetadata(metadata)
  return {
    postTitle: (m.postTitle as string) ?? null,
    callToAction: (m.callToAction as string) ?? null,
    specificationsSummary: (m.specificationsSummary as string) ?? null,
    keyFeatures: Array.isArray(m.keyFeatures) ? (m.keyFeatures as string[]) : [],
    targetAudience: (m.targetAudience as string) ?? null,
    imagePrompt: (m.imagePrompt as string) ?? null,
    imageOverlayText: (m.imageOverlayText as string) ?? null,
    carouselSlides: Array.isArray(m.carouselSlides)
      ? (m.carouselSlides as Array<{ slideNumber: number; title: string; imageDescription: string }>)
      : [],
    reelScript: reelScript ?? (m.reelScript as string) ?? null,
    recommendedPostingTime: (m.recommendedPostingTime as string) ?? null
  }
}

function buildPostSnapshot(r: {
  captionText: string | null
  hashtags: string[] | null
  scriptText: string | null
  mediaUrls: string[] | null
  platformMetadata: unknown
}): Record<string, unknown> {
  return {
    caption: r.captionText ?? null,
    hashtags: r.hashtags ?? [],
    script: r.scriptText ?? null,
    mediaUrls: r.mediaUrls ?? [],
    platformMetadata: parseMetadata(r.platformMetadata)
  }
}

function mapRowToItem(r: {
  id: number
  platform: string
  contentType: string
  status: string
  reviewState: string | null
  revisionNumber: number | null
  rejectionReason: string | null
  supersedesPostId: number | null
  captionText: string | null
  scheduledAt: Date | null
  publishedAt: Date | null
  createdAt: Date
  approvedAt: Date | null
  publishAttempts: number
  lastPublishErrorAt: Date | null
  reach: number | null
  likes: number | null
  shares: number | null
  linkClicks: number | null
  errorMessage: string | null
  hashtags: string[] | null
  scriptText: string | null
  mediaUrls: string[] | null
  platformMetadata: Record<string, unknown> | null
  images: string[] | null
  fabricTitle: string | null
  fabricSku: string | null
  supplierName: string | null
  socialScore: number | null
  publishCredentialId: number | null
  platformAccountId: string | null
  publishedVersion: number | null
  timezone: string | null
}): AdminSocialQueueItem {
  return {
    id: r.id,
    platform: r.platform,
    contentType: r.contentType,
    status: r.status,
    reviewState: r.reviewState,
    revisionNumber: r.revisionNumber,
    rejectionReason: r.rejectionReason,
    supersedesPostId: r.supersedesPostId,
    captionText: r.captionText,
    scheduledAt: r.scheduledAt ? (r.scheduledAt instanceof Date ? r.scheduledAt.toISOString() : String(r.scheduledAt)) : null,
    publishedAt: r.publishedAt ? (r.publishedAt instanceof Date ? r.publishedAt.toISOString() : String(r.publishedAt)) : null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    approvedAt: r.approvedAt ? (r.approvedAt instanceof Date ? r.approvedAt.toISOString() : String(r.approvedAt)) : null,
    publishAttempts: r.publishAttempts,
    lastPublishErrorAt: r.lastPublishErrorAt ? (r.lastPublishErrorAt instanceof Date ? r.lastPublishErrorAt.toISOString() : String(r.lastPublishErrorAt)) : null,
    reach: r.reach,
    likes: r.likes,
    shares: r.shares,
    linkClicks: r.linkClicks,
    errorMessage: r.errorMessage,
    primaryImageUrl: pickPrimaryImage(r.mediaUrls, r.images),
    fabricTitle: r.fabricTitle,
    fabricSku: r.fabricSku,
    supplierName: r.supplierName,
    hashtags: r.hashtags,
    scriptText: r.scriptText,
    socialScore: r.socialScore,
    platformMetadata: r.platformMetadata,
    publishCredentialId: r.publishCredentialId,
    platformAccountId: r.platformAccountId,
    publishedVersion: r.publishedVersion,
    timezone: r.timezone
  }
}

export class SocialAdminService {
  private static baseJoin() {
    return getDb()
      .select({
        id: socialPosts.id,
        fabricId: socialPosts.fabricId,
        platform: socialPosts.platform,
        contentType: socialPosts.contentType,
        status: socialPosts.status,
        reviewState: socialPosts.reviewState,
        revisionNumber: socialPosts.revisionNumber,
        rejectionReason: socialPosts.rejectionReason,
        supersedesPostId: socialPosts.supersedesPostId,
        captionText: socialPosts.captionText,
        scheduledAt: socialPosts.scheduledAt,
        publishedAt: socialPosts.publishedAt,
        createdAt: socialPosts.createdAt,
        approvedAt: socialPosts.approvedAt,
        publishAttempts: socialPosts.publishAttempts,
        lastPublishErrorAt: socialPosts.lastPublishErrorAt,
        reach: socialPosts.reach,
        likes: socialPosts.likes,
        shares: socialPosts.shares,
        linkClicks: socialPosts.linkClicks,
        errorMessage: socialPosts.errorMessage,
        hashtags: socialPosts.hashtags,
        scriptText: socialPosts.scriptText,
        mediaUrls: socialPosts.mediaUrls,
        platformMetadata: socialPosts.platformMetadata,
        images: fabrics.images,
        fabricTitle: sql<string | null>`COALESCE(${fabrics.titleEn}, ${fabrics.titleRu})`,
        fabricSku: fabrics.sku,
        supplierName: suppliers.name,
        socialScore: fabrics.socialScore,
        publishCredentialId: socialPosts.publishCredentialId,
        platformAccountId: socialPosts.platformAccountId,
        publishedVersion: socialPosts.publishedVersion,
        timezone: socialPosts.timezone
      })
      .from(socialPosts)
      .leftJoin(fabrics, eq(socialPosts.fabricId, fabrics.id))
      .leftJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
  }

  public static async listQueue(params: {
    page: number
    limit: number
    platform?: Platform
  }): Promise<AdminSocialQueueResult> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const where = params.platform
      ? and(eq(socialPosts.platform, params.platform), eq(socialPosts.status, 'DRAFT'), isNull(socialPosts.deletedAt), isNull(fabrics.deletedAt))
      : and(eq(socialPosts.status, 'DRAFT'), isNull(socialPosts.deletedAt), isNull(fabrics.deletedAt))

    const totalRows = await db.select({ total: count() }).from(socialPosts).innerJoin(fabrics, eq(socialPosts.fabricId, fabrics.id)).where(where)

    const total = totalRows[0]?.total ?? 0

    const rows = await SocialAdminService.baseJoin()
      .where(where)
      .orderBy(desc(socialPosts.createdAt))
      .limit(params.limit)
      .offset(offset)

    return {
      items: rows.map((r) => mapRowToItem(r)),
      total
    }
  }

  public static async list(params: {
    page: number
    limit: number
    platform?: Platform
    status?: PostStatus
    search?: string
    contentType?: ContentType
    fabricId?: number
  }): Promise<AdminSocialQueueResult> {
    const offset = (params.page - 1) * params.limit

    const parts: SQL[] = [isNull(socialPosts.deletedAt), isNull(fabrics.deletedAt)]
    if (params.platform) parts.push(eq(socialPosts.platform, params.platform))
    if (params.status) parts.push(eq(socialPosts.status, params.status))
    if (params.fabricId !== undefined) parts.push(eq(socialPosts.fabricId, params.fabricId))
    if (params.search && params.search.trim().length > 0) {
      const needle = params.search.trim()
      parts.push(
        or(
          ilike(fabrics.titleRu, `%${needle}%`),
          ilike(fabrics.titleEn, `%${needle}%`),
          ilike(suppliers.name, `%${needle}%`),
          ilike(socialPosts.captionText, `%${needle}%`),
          ilike(socialPosts.errorMessage, `%${needle}%`)
        ) as SQL
      )
    }
    if (params.contentType) parts.push(eq(socialPosts.contentType, params.contentType))
    const where = and(...parts) as SQL

    const totalRows = await getDb()
      .select({ total: count() })
      .from(socialPosts)
      .innerJoin(fabrics, eq(socialPosts.fabricId, fabrics.id))
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(where)

    const total = totalRows[0]?.total ?? 0

    const rows = await SocialAdminService.baseJoin().where(where).orderBy(desc(socialPosts.updatedAt)).limit(params.limit).offset(offset)

    return {
      items: rows.map((r) => mapRowToItem(r)),
      total
    }
  }

  public static async getStats(platform?: Platform): Promise<AdminSocialStats> {
    const db = getDb()
    const platCond = platform ? and(isNull(socialPosts.deletedAt), eq(socialPosts.platform, platform)) : isNull(socialPosts.deletedAt)

    const [scheduledRow] = await db
      .select({ c: count() })
      .from(socialPosts)
      .where(and(platCond, eq(socialPosts.status, 'SCHEDULED')))

    const [publishedRow] = await db
      .select({ c: count() })
      .from(socialPosts)
      .where(and(platCond, eq(socialPosts.status, 'PUBLISHED')))

    const [activeRow] = await db
      .select({ c: sql<number>`count(distinct ${socialPosts.fabricId})::int` })
      .from(socialPosts)
      .where(
        and(platCond, inArray(socialPosts.status, ['DRAFT', 'APPROVED', 'SCHEDULED']))
      )

    const nextRows = await db
      .select({
        captionText: socialPosts.captionText,
        scheduledAt: socialPosts.scheduledAt
      })
      .from(socialPosts)
      .where(and(platCond, eq(socialPosts.status, 'SCHEDULED'), sql`${socialPosts.scheduledAt} IS NOT NULL`))
      .orderBy(asc(socialPosts.scheduledAt))
      .limit(1)

    const next = nextRows[0]
    let nextPublication: AdminSocialStats['nextPublication'] = null
    if (next?.scheduledAt) {
      const dt = next.scheduledAt instanceof Date ? next.scheduledAt : new Date(next.scheduledAt)
      nextPublication = {
        captionPreview: next.captionText ? (next.captionText.length > 80 ? `${next.captionText.slice(0, 80)}…` : next.captionText) : null,
        scheduledAt: dt.toISOString()
      }
    }

    return {
      totalScheduled: scheduledRow?.c ?? 0,
      totalPublished: publishedRow?.c ?? 0,
      activeCampaignFabrics: activeRow?.c ?? 0,
      nextPublication
    }
  }

  public static async getById(id: number): Promise<AdminSocialPostDetail | null> {
    const where = and(eq(socialPosts.id, id), isNull(socialPosts.deletedAt))

    const rows = await SocialAdminService.baseJoin().where(where).limit(1)
    const r = rows[0]
    if (!r) return null

    const base = mapRowToItem(r)

    const isReel = r.contentType.toUpperCase().includes('REEL') || r.contentType.toUpperCase().includes('VIDEO')

    let generatedVideoUrl: string | null = null
    if (isReel) {
      // Latest COMPLETED AI-generated reel for the post's fabric. Used by the
      // content-preview page so the admin can verify the video before publishing.
      const videoRows = await getDb()
        .select({ url: generatedMedia.url })
        .from(generatedMedia)
        .where(
          and(
            eq(generatedMedia.fabricId, r.fabricId),
            eq(generatedMedia.type, 'video'),
            eq(generatedMedia.status, 'COMPLETED'),
            isNotNull(generatedMedia.url),
            isNull(generatedMedia.deletedAt)
          )
        )
        .orderBy(desc(generatedMedia.createdAt))
        .limit(1)

      generatedVideoUrl = videoRows[0]?.url ? (resolveR2Url(videoRows[0].url) ?? null) : null
    }

    return {
      ...base,
      fabricId: r.fabricId,
      mediaUrls: r.mediaUrls,
      fabricImages: r.images,
      generatedVideoUrl
    }
  }

  private static async writeRevision(input: {
    postId: number
    revisionNumber: number
    changeType: 'GENERATED' | 'REGENERATED' | 'CAPTION_EDITED' | 'HASHTAGS_EDITED' | 'SCRIPT_EDITED' | 'SCHEDULED' | 'REJECTED' | 'RESTORED'
    snapshot: Record<string, unknown>
    before?: Record<string, unknown> | null
    after?: Record<string, unknown> | null
    actorUserId?: number | null
  }) {
    await getDb().insert(socialPostRevisions).values({
      postId: input.postId,
      revisionNumber: input.revisionNumber,
      changeType: input.changeType,
      snapshot: input.snapshot,
      before: input.before ?? null,
      after: input.after ?? null,
      changedByUserId: input.actorUserId ?? null
    })
  }

  public static async approve(id: number, actorUserId: number | null = null) {
    const db = getDb()
    const [existing] = await db
      .select({ reviewState: socialPosts.reviewState })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, id), isNull(socialPosts.deletedAt)))
      .limit(1)

    // Content approval. If the video was already fully approved, keep it that way.
    const nextReviewState = existing?.reviewState === 'FULLY_APPROVED' ? 'FULLY_APPROVED' : 'CONTENT_APPROVED'

    await db
      .update(socialPosts)
      .set({
        status: 'APPROVED',
        reviewState: nextReviewState,
        approvedByUserId: actorUserId,
        approvedAt: new Date(),
        rejectionReason: null,
        rejectedByUserId: null,
        rejectedAt: null,
        updatedAt: new Date()
      })
      .where(and(eq(socialPosts.id, id), isNull(socialPosts.deletedAt)))

    await db.insert(socialActivityLog).values({
      postId: id,
      action: 'APPROVED',
      actorUserId,
      details: { reviewState: nextReviewState }
    })
  }

  public static async schedule(id: number, scheduledAt: Date, actorUserId: number | null = null, timezone: string = 'UTC') {
    const db = getDb()
    const updated = await db
      .update(socialPosts)
      .set({
        status: 'SCHEDULED',
        scheduledAt,
        scheduledByUserId: actorUserId,
        timezone,
        updatedAt: new Date()
      })
      .where(and(eq(socialPosts.id, id), inArray(socialPosts.status, ['DRAFT', 'APPROVED', 'FAILED', 'VIDEO_PENDING', 'SCHEDULED']), isNull(socialPosts.deletedAt)))
      .returning({ id: socialPosts.id })
    if (updated.length > 0) {
      await db.insert(socialActivityLog).values({
        postId: id,
        action: 'SCHEDULED',
        actorUserId,
        details: { scheduledAt: scheduledAt.toISOString(), timezone }
      })
    }
  }

  public static async publish(id: number, actorUserId: number | null = null) {
    const { SocialPublisherService } = await import('@/services/social-publisher.service')
    await SocialPublisherService.publishPost({ postId: id, actorUserId })
  }

  public static async softDelete(id: number) {
    const db = getDb()
    await db.update(socialPosts).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(socialPosts.id, id))
  }

  public static async updateCaption(id: number, captionText: string, actorUserId: number | null = null) {
    const db = getDb()
    const trimmed = captionText.trim()
    const [post] = await db
      .select({
        revisionNumber: socialPosts.revisionNumber,
        captionText: socialPosts.captionText,
        hashtags: socialPosts.hashtags,
        scriptText: socialPosts.scriptText,
        mediaUrls: socialPosts.mediaUrls,
        platformMetadata: socialPosts.platformMetadata,
        reviewState: socialPosts.reviewState
      })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, id), isNull(socialPosts.deletedAt)))
      .limit(1)
    if (!post) throw new NotFoundError('Social post not found')

    const before = buildPostSnapshot(post)
    const nextCaption = trimmed.length > 0 ? trimmed : null

    await db
      .update(socialPosts)
      .set({ captionText: nextCaption, reviewState: post.reviewState === 'FULLY_APPROVED' ? 'FULLY_APPROVED' : 'NOT_REVIEWED', updatedAt: new Date() })
      .where(and(eq(socialPosts.id, id), isNull(socialPosts.deletedAt)))

    await SocialAdminService.writeRevision({
      postId: id,
      revisionNumber: post.revisionNumber,
      changeType: 'CAPTION_EDITED',
      snapshot: { ...before, caption: nextCaption },
      before,
      after: { ...before, caption: nextCaption },
      actorUserId
    })
  }

  public static async updateHashtags(id: number, hashtags: string[], actorUserId: number | null = null) {
    const db = getDb()
    const [post] = await db
      .select({
        revisionNumber: socialPosts.revisionNumber,
        captionText: socialPosts.captionText,
        hashtags: socialPosts.hashtags,
        scriptText: socialPosts.scriptText,
        mediaUrls: socialPosts.mediaUrls,
        platformMetadata: socialPosts.platformMetadata
      })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, id), isNull(socialPosts.deletedAt)))
      .limit(1)
    if (!post) throw new NotFoundError('Social post not found')

    const before = buildPostSnapshot(post)

    await db.update(socialPosts).set({ hashtags, updatedAt: new Date() }).where(and(eq(socialPosts.id, id), isNull(socialPosts.deletedAt)))

    await SocialAdminService.writeRevision({
      postId: id,
      revisionNumber: post.revisionNumber,
      changeType: 'HASHTAGS_EDITED',
      snapshot: { ...before, hashtags },
      before,
      after: { ...before, hashtags },
      actorUserId
    })
  }

  public static async createDraft(input: { fabricId: number; platform: Platform; contentType?: ContentType }) {
    const db = getDb()

    const contentType = input.contentType ?? defaultContentTypeForPlatform(input.platform)

    // Ensure fabric exists (and isn't soft-deleted) before creating a post.
    const fabricRows = await db
      .select({ id: fabrics.id })
      .from(fabrics)
      .where(and(eq(fabrics.id, input.fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    if (!fabricRows[0]) {
      throw new NotFoundError('Fabric not found')
    }

    const rows = await db
      .insert(socialPosts)
      .values({
        fabricId: input.fabricId,
        platform: input.platform,
        contentType,
        status: 'DRAFT',
        captionText: null,
        hashtags: null,
        scriptText: null,
        mediaUrls: [],
        platformMediaVariants: null,
        platformMetadata: null,
        scheduledAt: null,
        publishedAt: null,
        platformPostId: null,
        platformPostUrl: null,
        reach: null,
        impressions: null,
        likes: null,
        comments: null,
        shares: null,
        saves: null,
        linkClicks: null,
        videoViews: null,
        analyticsSyncedAt: null,
        publishAttempts: 0,
        lastPublishErrorAt: null,
        errorMessage: null,
        approvedByUserId: null,
        approvedAt: null,
        scheduledByUserId: null,
        publishedByUserId: null,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({ id: socialPosts.id })

    const created = rows[0]
    if (!created) {
      throw new Error('Failed to create social post')
    }

    // Enqueue AI social content generation for the requested platform only —
    // never silently generate content for all 5 platforms the admin didn't ask for.
    await addSocialJob(input.fabricId, [input.platform]).catch(() => {})

    return created
  }

  public static async createAiBatch(input: { postIds: number[] }): Promise<{ created: number; ids: number[] }> {
    if (input.postIds.length < 1 || input.postIds.length > 200) {
      throw new ValidationError('Select between 1 and 200 posts')
    }

    const db = getDb()

    // Only process posts that still need AI content — never reset published/scheduled posts.
    const rows = await db
      .select({
        id: socialPosts.id,
        fabricId: socialPosts.fabricId,
        platform: socialPosts.platform
      })
      .from(socialPosts)
      .where(
        and(
          inArray(socialPosts.id, input.postIds),
          inArray(socialPosts.status, ['DRAFT', 'FAILED']),
          isNull(socialPosts.deletedAt)
        )
      )

    if (rows.length === 0) {
      return { created: 0, ids: [] as number[] }
    }

    // Enqueue AI social content generation only for the selected posts' fabric+platform.
    await Promise.allSettled(rows.map((r) => addSocialJob(r.fabricId, [r.platform as Platform])))

    return { created: rows.length, ids: rows.map((r) => r.id) }
  }

  public static async changePlatform(postId: number, platform: Platform, actorUserId: number | null = null) {
    const db = getDb()

    const [post] = await db
      .select({
        id: socialPosts.id,
        fabricId: socialPosts.fabricId,
        platform: socialPosts.platform,
        contentType: socialPosts.contentType,
        status: socialPosts.status,
        revisionNumber: socialPosts.revisionNumber,
        captionText: socialPosts.captionText,
        hashtags: socialPosts.hashtags,
        scriptText: socialPosts.scriptText,
        mediaUrls: socialPosts.mediaUrls,
        platformMetadata: socialPosts.platformMetadata,
        publishedAt: socialPosts.publishedAt
      })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
      .limit(1)

    if (!post) throw new NotFoundError('Social post not found')
    if (post.publishedAt) throw new ValidationError('Cannot change platform of a published post')

    const previousPlatform = post.platform as Platform
    if (previousPlatform === platform) {
      return
    }

    const before = buildPostSnapshot(post)
    const nextRevisionNumber = post.revisionNumber + 1

    // Only the target platform changes — caption, hashtags, script, media and
    // metadata stay exactly as they are. No content is wiped or regenerated.
    await db
      .update(socialPosts)
      .set({
        platform,
        revisionNumber: nextRevisionNumber,
        updatedAt: new Date()
      })
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))

    const after = buildPostSnapshot(post)
    await SocialAdminService.writeRevision({
      postId,
      revisionNumber: nextRevisionNumber,
      changeType: 'REGENERATED',
      snapshot: { platform, contentType: post.contentType },
      before,
      after,
      actorUserId
    })

    await db.insert(socialActivityLog).values({
      postId,
      action: 'UPDATED',
      actorUserId,
      details: { previousPlatform, platform, contentType: post.contentType, reason: 'PLATFORM_CHANGED' }
    })
  }

  // ── Video generation admin methods ──

  public static async getVideoDetail(postId: number) {
    const db = getDb()
    const rows = await db
      .select({
        postId: socialPosts.id,
        platform: socialPosts.platform,
        status: socialPosts.status,
        mediaId: generatedMedia.id,
        mediaUrl: generatedMedia.url,
        thumbnailUrl: generatedMedia.thumbnailUrl,
        mediaStatus: generatedMedia.status,
        prompt: generatedMedia.prompt,
        providerJobId: generatedMedia.providerJobId,
        durationSeconds: generatedMedia.durationSeconds,
        aspectRatio: generatedMedia.aspectRatio,
        errorMessage: generatedMedia.errorMessage,
        adminReviewedAt: generatedMedia.adminReviewedAt,
        adminReviewNotes: generatedMedia.adminReviewNotes
      })
      .from(socialPosts)
      .leftJoin(generatedMedia, eq(socialPosts.id, generatedMedia.socialPostId as never))
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
      .limit(1)

    const row = rows[0] ?? null
    if (row) {
      row.mediaUrl = resolveR2Url(row.mediaUrl)
      row.thumbnailUrl = resolveR2Url(row.thumbnailUrl)
    }
    return row
  }

  public static async approveVideo(postId: number, actorUserId: number) {
    const db = getDb()
    const now = new Date()

    const [media] = await db
      .select({ id: generatedMedia.id })
      .from(generatedMedia)
      .where(eq(generatedMedia.socialPostId, postId))
      .limit(1)

    if (media) {
      await db
        .update(generatedMedia)
        .set({ status: 'COMPLETED', adminReviewedAt: now, adminReviewerId: actorUserId, updatedAt: now })
        .where(eq(generatedMedia.id, media.id))
    }

    // Video approved: mark the post fully approved (content + video reviewed).
    const [post] = await db
      .select({ revisionNumber: socialPosts.revisionNumber })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
      .limit(1)

    await db
      .update(socialPosts)
      .set({ status: 'APPROVED', reviewState: 'FULLY_APPROVED', updatedAt: now })
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))

    await SocialAdminService.writeRevision({
      postId,
      revisionNumber: post?.revisionNumber ?? 1,
      changeType: 'REGENERATED',
      snapshot: { videoApproved: true, reviewedByUserId: actorUserId },
      after: { videoApproved: true },
      actorUserId
    })
  }

  public static async rejectVideo(postId: number, actorUserId: number, notes?: string) {
    const db = getDb()
    const now = new Date()

    const [media] = await db
      .select({ id: generatedMedia.id })
      .from(generatedMedia)
      .where(eq(generatedMedia.socialPostId, postId))
      .limit(1)

    if (media) {
      await db
        .update(generatedMedia)
        .set({ status: 'FAILED', adminReviewedAt: now, adminReviewerId: actorUserId, adminReviewNotes: notes ?? null, updatedAt: now })
        .where(eq(generatedMedia.id, media.id))
    }

    const [post] = await db
      .select({ revisionNumber: socialPosts.revisionNumber })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
      .limit(1)

    await db
      .update(socialPosts)
      .set({
        status: 'DRAFT',
        reviewState: 'REJECTED',
        rejectionReason: notes ?? null,
        rejectedByUserId: actorUserId,
        rejectedAt: now,
        updatedAt: now
      })
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))

    await SocialAdminService.writeRevision({
      postId,
      revisionNumber: post?.revisionNumber ?? 1,
      changeType: 'REJECTED',
      snapshot: { videoRejected: true, rejectedByUserId: actorUserId, reason: notes ?? null },
      after: { rejected: true, reason: notes ?? null },
      actorUserId
    })

    await db.insert(socialActivityLog).values({
      postId,
      action: 'REJECTED',
      actorUserId,
      details: { platform: 'VIDEO', reason: notes ?? null }
    })
  }

  public static async reject(id: number, actorUserId: number | null, reason: string, notes?: string | null) {
    const db = getDb()
    const now = new Date()

    const [post] = await db
      .select({
        revisionNumber: socialPosts.revisionNumber,
        captionText: socialPosts.captionText,
        hashtags: socialPosts.hashtags,
        scriptText: socialPosts.scriptText,
        mediaUrls: socialPosts.mediaUrls,
        platformMetadata: socialPosts.platformMetadata
      })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, id), isNull(socialPosts.deletedAt)))
      .limit(1)

    if (!post) throw new NotFoundError('Social post not found')

    const rejectionReason = notes?.trim() ? `${reason}: ${notes.trim()}` : reason

    await db
      .update(socialPosts)
      .set({
        status: 'DRAFT',
        reviewState: 'REJECTED',
        rejectionReason,
        rejectedByUserId: actorUserId,
        rejectedAt: now,
        updatedAt: now
      })
      .where(and(eq(socialPosts.id, id), isNull(socialPosts.deletedAt)))

    const before = buildPostSnapshot(post)
    await SocialAdminService.writeRevision({
      postId: id,
      revisionNumber: post.revisionNumber,
      changeType: 'REJECTED',
      snapshot: before,
      before,
      after: { ...before, rejected: true, reason: rejectionReason },
      actorUserId
    })

    await db.insert(socialActivityLog).values({
      postId: id,
      action: 'REJECTED',
      actorUserId,
      details: { reason: rejectionReason }
    })
  }

  public static async listActivity(postId: number, limit = 100) {
    return getDb()
      .select({
        id: socialActivityLog.id,
        postId: socialActivityLog.postId,
        action: socialActivityLog.action,
        actorUserId: socialActivityLog.actorUserId,
        actorName: users.name,
        details: socialActivityLog.details,
        createdAt: socialActivityLog.createdAt
      })
      .from(socialActivityLog)
      .leftJoin(users, eq(socialActivityLog.actorUserId, users.id))
      .where(eq(socialActivityLog.postId, postId))
      .orderBy(desc(socialActivityLog.createdAt))
      .limit(limit)
  }

  public static async listRevisions(postId: number) {
    const db = getDb()
    return db
      .select({
        id: socialPostRevisions.id,
        revisionNumber: socialPostRevisions.revisionNumber,
        changeType: socialPostRevisions.changeType,
        snapshot: socialPostRevisions.snapshot,
        before: socialPostRevisions.before,
        after: socialPostRevisions.after,
        changedByUserId: socialPostRevisions.changedByUserId,
        createdAt: socialPostRevisions.createdAt
      })
      .from(socialPostRevisions)
      .where(eq(socialPostRevisions.postId, postId))
      .orderBy(desc(socialPostRevisions.createdAt))
  }

  public static async restoreVersion(postId: number, actorUserId: number | null, revisionId: number) {
    const db = getDb()
    const [revision] = await db
      .select({ snapshot: socialPostRevisions.snapshot })
      .from(socialPostRevisions)
      .where(and(eq(socialPostRevisions.id, revisionId), eq(socialPostRevisions.postId, postId)))
      .limit(1)
    if (!revision) throw new NotFoundError('Revision not found')

    const snap = (revision.snapshot ?? {}) as {
      caption?: string | null
      hashtags?: string[] | null
      script?: string | null
      platformMetadata?: Record<string, unknown> | null
    }

    const [post] = await db
      .select({
        revisionNumber: socialPosts.revisionNumber,
        captionText: socialPosts.captionText,
        hashtags: socialPosts.hashtags,
        scriptText: socialPosts.scriptText,
        mediaUrls: socialPosts.mediaUrls,
        platformMetadata: socialPosts.platformMetadata
      })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
      .limit(1)
    if (!post) throw new NotFoundError('Social post not found')

    const before = buildPostSnapshot(post)
    const nextRevisionNumber = post.revisionNumber + 1

    await db
      .update(socialPosts)
      .set({
        captionText: snap.caption?.trim() ? snap.caption : null,
        hashtags: snap.hashtags && snap.hashtags.length > 0 ? snap.hashtags : null,
        scriptText: snap.script ?? null,
        platformMetadata: snap.platformMetadata ?? null,
        reviewState: 'NOT_REVIEWED',
        revisionNumber: nextRevisionNumber,
        updatedAt: new Date()
      })
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))

    const after = buildPostSnapshot({
      captionText: snap.caption ?? null,
      hashtags: snap.hashtags ?? null,
      scriptText: snap.script ?? null,
      mediaUrls: post.mediaUrls,
      platformMetadata: snap.platformMetadata ?? null
    })
    await SocialAdminService.writeRevision({
      postId,
      revisionNumber: nextRevisionNumber,
      changeType: 'RESTORED',
      snapshot: after,
      before,
      after,
      actorUserId
    })

    await db.insert(socialActivityLog).values({
      postId,
      action: 'REOPENED',
      actorUserId,
      details: { restoredRevisionNumber: nextRevisionNumber, changeType: 'RESTORED' }
    })
  }

  public static async requestVideoGeneration(fabricId: number, platform: string, _duration: number) {
    const { SocialService } = await import('@/services/social.service')
    const result = await SocialService.generateVideoForFabric(fabricId, {
      platform: platform as 'INSTAGRAM' | 'TIKTOK' | 'PINTEREST' | 'FACEBOOK' | 'YOUTUBE',
      duration: _duration as ReelDuration
    })
    return result
  }

  public static async updatePlatformMetadata(postId: number, metadata: Record<string, unknown>) {
    const db = getDb()
    const rows = await db
      .update(socialPosts)
      .set({ platformMetadata: metadata, updatedAt: new Date() })
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
      .returning({ id: socialPosts.id })
    if (rows.length === 0) {
      throw new NotFoundError('Social post not found')
    }
  }

  public static async updateReelScript(postId: number, scriptText: string | null, metadata: Record<string, unknown>) {
    const db = getDb()
    const rows = await db
      .update(socialPosts)
      .set({ scriptText, platformMetadata: metadata, updatedAt: new Date() })
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
      .returning({ id: socialPosts.id })
    if (rows.length === 0) {
      throw new NotFoundError('Social post not found')
    }
  }

  public static async regenerateCarouselSlides(postId: number, actorUserId: number | null = null, customPrompt?: string | null) {
    const db = getDb()
    const [post] = await db.select().from(socialPosts).where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt))).limit(1)
    if (!post) throw new NotFoundError('Social post not found')
    if (!post.fabricId) throw new ValidationError('Post has no associated fabric')

    const platform = post.platform as SocialPlatform
    const existingMetadata = (post.platformMetadata ?? {}) as Record<string, unknown>
    const existingContent = buildSharedContent(existingMetadata, post.scriptText)

    const result = await AIService.regenerateCarouselSlides(post.fabricId, platform, existingContent, customPrompt)
    const updatedMetadata = { ...existingMetadata, carouselSlides: result.carouselSlides }
    await SocialAdminService.updatePlatformMetadata(postId, updatedMetadata)
    return result
  }

  public static async regenerateImageConcept(postId: number, actorUserId: number | null = null, customPrompt?: string | null) {
    const db = getDb()
    const [post] = await db.select().from(socialPosts).where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt))).limit(1)
    if (!post) throw new NotFoundError('Social post not found')
    if (!post.fabricId) throw new ValidationError('Post has no associated fabric')

    const platform = post.platform as SocialPlatform
    const existingMetadata = (post.platformMetadata ?? {}) as Record<string, unknown>
    const existingContent = buildSharedContent(existingMetadata, post.scriptText)

    const result = await AIService.regenerateImageConcept(post.fabricId, platform, existingContent, customPrompt)
    const updatedMetadata = {
      ...existingMetadata,
      imagePrompt: result.imagePrompt,
      imageOverlayText: result.imageOverlayText
    }
    await SocialAdminService.updatePlatformMetadata(postId, updatedMetadata)
    return result
  }

  public static async regenerateReelScript(postId: number, actorUserId: number | null = null, customPrompt?: string | null) {
    const db = getDb()
    const [post] = await db.select().from(socialPosts).where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt))).limit(1)
    if (!post) throw new NotFoundError('Social post not found')
    if (!post.fabricId) throw new ValidationError('Post has no associated fabric')

    const platform = post.platform as SocialPlatform
    const existingMetadata = (post.platformMetadata ?? {}) as Record<string, unknown>
    const existingContent = buildSharedContent(existingMetadata, post.scriptText)

    const result = await AIService.regenerateReelScript(post.fabricId, platform, existingContent, customPrompt)
    const updatedMetadata = { ...existingMetadata, reelScript: result.reelScript }
    await SocialAdminService.updateReelScript(postId, result.reelScript, updatedMetadata)
    return result
  }
}
