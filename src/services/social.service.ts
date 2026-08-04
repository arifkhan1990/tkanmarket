import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { socialPosts } from '@/db/schema/social.schema'
import { generatedMedia } from '@/db/schema/generated-media.schema'
import { SOCIAL_PLATFORM, QUEUE_NAMES } from '@/constants'
import { addSocialJob, addVideoGenerationJob } from '@/lib/queue/helpers'
import { getRedisClient } from '@/lib/redis/client'
import { AIService } from '@/services/ai.service'
import type { SocialContentShared } from '@/types/ai.types'
import { buildPlatformVariantSet } from '@/lib/social/image-variants'
import { logger } from '@/lib/logger'

import type { FabricCompositionItem } from '@/types/fabric'
import type { SocialPlatform } from '@/types/queue.types'
import type { SocialPostDraft } from '@/types/social.types'
import type { ReelDuration } from '@/constants'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function normalizeToken(s: string) {
  return s.trim().toLowerCase()
}

const TRENDING_MATERIALS = new Set(
  [
    'хлопок',
    'лён',
    'лен',
    'вискоза',
    'шелк',
    'шёлк',
    'cotton',
    'linen',
    'viscose',
    'silk'
  ].map(normalizeToken)
)

const PREMIUM_MATERIALS = new Set(
  ['silk', 'linen', 'cashmere', 'шёлк', 'шелк', 'лён', 'лен', 'кашемир'].map(normalizeToken)
)

function includesAnyTag(tags: string[] | null | undefined, set: Set<string>) {
  if (!tags || tags.length === 0) return false
  for (const t of tags) {
    if (set.has(normalizeToken(t))) return true
  }
  return false
}

function includesPremiumComposition(composition: FabricCompositionItem[] | null | undefined) {
  if (!composition || composition.length === 0) return false
  for (const c of composition) {
    if (PREMIUM_MATERIALS.has(normalizeToken(c.material))) return true
  }
  return false
}

function contentTypeForPlatform(platform: SocialPlatform) {
  if (platform === 'PINTEREST') return 'PIN' as const
  if (platform === 'TIKTOK') return 'REEL_8' as const
  if (platform === 'YOUTUBE') return 'REEL_8' as const
  return 'IMAGE_POST' as const
}

function maxHashtagsForPlatform(platform: SocialPlatform) {
  if (platform === 'TIKTOK') return 8
  if (platform === 'INSTAGRAM') return 15
  if (platform === 'PINTEREST') return 10
  if (platform === 'FACEBOOK') return 8
  return 6
}

function uniqHashtags(values: string[], max: number): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of values) {
    const t = v.trim()
    if (!t) continue
    const tag = t.startsWith('#') ? t : `#${t}`
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(tag)
    if (out.length >= max) break
  }
  return out
}

export class SocialService {
  public static async scoreForSocial(fabric: {
    id: number
    images: string[] | null
    gsm: number | null
    tags: string[] | null
    tagsEn: string[] | null
    composition: FabricCompositionItem[] | null
    moq: number | null
    isFeatured: boolean
    titleEn: string | null
    descriptionEn: string | null
    fabricType: string | null
    metaTitleEn: string | null
    metaDescriptionEn: string | null
    aiProcessedAt: Date | null
  }): Promise<number> {
    let score = 0

    // Fabric went through the AI enrichment pipeline → strong baseline.
    if (fabric.aiProcessedAt != null) score += 50

    const imagesCount = fabric.images?.length ?? 0
    if (imagesCount >= 3) score += 10

    if (fabric.titleEn && fabric.descriptionEn) score += 15
    if (fabric.fabricType) score += 5
    if (fabric.gsm !== null) score += 5
    if (fabric.metaTitleEn && fabric.metaDescriptionEn) score += 5

    const tags = [...(fabric.tags ?? []), ...(fabric.tagsEn ?? [])]
    if (tags.length > 0) score += 5
    if (includesAnyTag(tags, TRENDING_MATERIALS)) score += 5
    if (fabric.composition && fabric.composition.length > 0) score += 5
    if (includesPremiumComposition(fabric.composition)) score += 5
    if (fabric.isFeatured) score += 5

    score = clamp(score, 0, 100)

    const db = getDb()
    await db
      .update(fabrics)
      .set({ socialScore: score, updatedAt: sql`now()` })
      .where(and(eq(fabrics.id, fabric.id), isNull(fabrics.deletedAt)))

    return score
  }

  public static async recomputeSocialScore(fabricId: number): Promise<number> {
    const db = getDb()
    const rows = await db
      .select({
        id: fabrics.id,
        images: fabrics.images,
        gsm: fabrics.gsm,
        tags: fabrics.tags,
        tagsEn: fabrics.tagsEn,
        composition: fabrics.composition,
        moq: fabrics.moq,
        isFeatured: fabrics.isFeatured,
        titleEn: fabrics.titleEn,
        descriptionEn: fabrics.descriptionEn,
        fabricType: fabrics.fabricType,
        metaTitleEn: fabrics.metaTitleEn,
        metaDescriptionEn: fabrics.metaDescriptionEn,
        aiProcessedAt: fabrics.aiProcessedAt
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const f = rows[0]
    if (!f) return 0

    return SocialService.scoreForSocial({
      id: f.id,
      images: f.images ?? null,
      gsm: f.gsm,
      tags: f.tags ?? null,
      tagsEn: f.tagsEn ?? null,
      composition: (f.composition as FabricCompositionItem[] | null) ?? null,
      moq: f.moq,
      isFeatured: Boolean(f.isFeatured),
      titleEn: f.titleEn,
      descriptionEn: f.descriptionEn,
      fabricType: f.fabricType,
      metaTitleEn: f.metaTitleEn,
      metaDescriptionEn: f.metaDescriptionEn,
      aiProcessedAt: f.aiProcessedAt
    })
  }

  public static async createContentJob(fabricId: number): Promise<void> {
    const db = getDb()
    const rows = await db
      .select({
        id: fabrics.id,
        images: fabrics.images,
        gsm: fabrics.gsm,
        tags: fabrics.tags,
        tagsEn: fabrics.tagsEn,
        composition: fabrics.composition,
        moq: fabrics.moq,
        isFeatured: fabrics.isFeatured,
        titleEn: fabrics.titleEn,
        descriptionEn: fabrics.descriptionEn,
        fabricType: fabrics.fabricType,
        metaTitleEn: fabrics.metaTitleEn,
        metaDescriptionEn: fabrics.metaDescriptionEn,
        aiProcessedAt: fabrics.aiProcessedAt
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const f = rows[0]
    if (!f) throw new Error('Fabric not found')

    const score = await SocialService.scoreForSocial({
      id: f.id,
      images: f.images ?? null,
      gsm: f.gsm,
      tags: f.tags ?? null,
      tagsEn: f.tagsEn ?? null,
      composition: (f.composition as FabricCompositionItem[] | null) ?? null,
      moq: f.moq,
      isFeatured: Boolean(f.isFeatured),
      titleEn: f.titleEn,
      descriptionEn: f.descriptionEn,
      fabricType: f.fabricType,
      metaTitleEn: f.metaTitleEn,
      metaDescriptionEn: f.metaDescriptionEn,
      aiProcessedAt: f.aiProcessedAt
    })

    if (score < 95) {
      logger.info('Social content job skipped — fabric social readiness score below 95 threshold', { fabricId, score })
      return
    }

    await addSocialJob(fabricId)
  }

  public static async generatePlatformContent(fabricId: number, platform: SocialPlatform, sharedContent?: SocialContentShared): Promise<SocialPostDraft> {
    const db = getDb()
    const rows = await db
      .select({
        id: fabrics.id,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        descriptionRu: fabrics.descriptionRu,
        descriptionEn: fabrics.descriptionEn,
        tags: fabrics.tags,
        images: fabrics.images
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const f = rows[0]
    if (!f) throw new Error('Fabric not found')
    const images = f.images ?? []
    if (images.length < 1) throw new Error('Fabric has no images for social content')

    // Upsert-ish: if DRAFT exists for this fabric+platform, update; else create.
    const existing = await db
      .select({ id: socialPosts.id, status: socialPosts.status })
      .from(socialPosts)
      .where(and(eq(socialPosts.fabricId, fabricId), eq(socialPosts.platform, platform)))
      .limit(1)

    try {
      const content = await AIService.generateSocialContent(fabricId, platform, sharedContent)
      const hashtags = uniqHashtags(content.hashtags, maxHashtagsForPlatform(platform))
      const draft: SocialPostDraft = {
        fabricId,
        platform,
        captionText: content.caption,
        hashtags,
        scriptText: content.reelScript,
        contentType: contentTypeForPlatform(platform)
      }

      const sourceMedia = images.slice(0, 10)
      const variantUrls = buildPlatformVariantSet(sourceMedia, platform)
      const variants = { [platform]: variantUrls }

      const metadata = {
        postTitle: content.postTitle,
        callToAction: content.callToAction,
        specificationsSummary: content.specificationsSummary,
        keyFeatures: content.keyFeatures,
        targetAudience: content.targetAudience,
        imagePrompt: content.imagePrompt,
        imageOverlayText: content.imageOverlayText,
        carouselSlides: content.carouselSlides,
        recommendedPostingTime: content.recommendedPostingTime
      }

      if (existing[0]?.id) {
        await db
          .update(socialPosts)
          .set({
            status: 'DRAFT',
            captionText: draft.captionText,
            hashtags: draft.hashtags,
            scriptText: draft.scriptText,
            contentType: draft.contentType,
            platformMediaVariants: variants,
            platformMetadata: metadata,
            errorMessage: null,
            updatedAt: sql`now()`
          })
          .where(eq(socialPosts.id, existing[0].id))
        return draft
      }

      await db.insert(socialPosts).values({
        fabricId,
        platform,
        contentType: draft.contentType,
        status: 'DRAFT',
        captionText: draft.captionText,
        hashtags: draft.hashtags,
        scriptText: draft.scriptText,
        mediaUrls: sourceMedia,
        platformMediaVariants: variants,
        platformMetadata: metadata,
        scheduledAt: null,
        publishedAt: null,
        platformPostId: null,
        reach: null,
        likes: null,
        shares: null,
        linkClicks: null,
        errorMessage: null,
        updatedAt: new Date()
      })

      return draft
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Social generation failed'
      logger.error('Social content generation failed', { fabricId, platform, message })

      if (existing[0]?.id) {
        await db
          .update(socialPosts)
          .set({
            status: 'FAILED',
            errorMessage: message,
            updatedAt: sql`now()`
          })
          .where(eq(socialPosts.id, existing[0].id))
      } else {
        await db.insert(socialPosts).values({
          fabricId,
          platform,
          contentType: contentTypeForPlatform(platform),
          status: 'FAILED',
          captionText: null,
          hashtags: null,
          scriptText: null,
          mediaUrls: images.slice(0, 10),
          scheduledAt: null,
          publishedAt: null,
          platformPostId: null,
          reach: null,
          likes: null,
          shares: null,
          linkClicks: null,
          errorMessage: message,
          updatedAt: new Date()
        })
      }

      throw err
    }
  }

  /**
   * Generate a video for a fabric — ONLY called when admin clicks the button.
   * NOT auto-triggered. This creates a VIDEO_PENDING social post and enqueues
   * the Omni Flash generation job.
   */
  public static async generateVideoForFabric(fabricId: number, options?: {
    prompt?: string
    duration?: ReelDuration
    platform?: SocialPlatform
    imageUrl?: string
  }): Promise<{ postId: number; mediaId: number }> {
    const db = getDb()
    const platform = options?.platform ?? 'INSTAGRAM'
    const duration = options?.duration ?? 8

    const fabricRows = await db
      .select({ id: fabrics.id, images: fabrics.images })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)
    const fabric = fabricRows[0]
    if (!fabric) throw new Error('Fabric not found')

    const imageUrl = options?.imageUrl ?? (fabric.images?.[0] ?? undefined)

    // Distributed lock: only one request may prepare+enqueue a video per
    // fabric+platform at a time. Guards against concurrent admin clicks and
    // doubles as a second idempotency barrier alongside the DB in-flight check.
    const lockKey = `social:video:lock:${fabricId}:${platform}`
    const redis = getRedisClient()
    let lockAcquired = false
    if (redis) {
      try {
        lockAcquired = (await redis.set(lockKey, '1', 'EX', 60, 'NX')) === 'OK'
      } catch (err) {
        logger.warn('Failed to acquire video generation lock', {
          fabricId,
          platform,
          message: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }
    if (redis && !lockAcquired) {
      const concurrent = await db
        .select({ id: socialPosts.id })
        .from(socialPosts)
        .where(and(
          eq(socialPosts.fabricId, fabricId),
          eq(socialPosts.platform, platform),
          isNull(socialPosts.deletedAt)
        ))
        .orderBy(desc(socialPosts.createdAt))
        .limit(1)
      logger.info('Video generation skipped — another request is already in progress', { fabricId, platform })
      return { postId: concurrent[0]?.id ?? 0, mediaId: 0 }
    }

    const releaseLock = async () => {
      if (redis && lockAcquired) {
        try {
          await redis.del(lockKey)
        } catch {
          // lock will expire on its own TTL
        }
      }
    }

    // Idempotency: never create a duplicate post (or duplicate expensive video
    // job) for the same fabric+platform. Reuse the latest non-final post.
    const existingPost = await db
      .select({ id: socialPosts.id, status: socialPosts.status })
      .from(socialPosts)
      .where(and(
        eq(socialPosts.fabricId, fabricId),
        eq(socialPosts.platform, platform),
        inArray(socialPosts.status, ['DRAFT', 'APPROVED', 'SCHEDULED', 'VIDEO_PENDING', 'FAILED'])
      ))
      .orderBy(socialPosts.createdAt)
      .limit(1)

    let postId = existingPost[0]?.id ?? null

    // If a video for this fabric is already generating, return the existing post
    // idempotently — do NOT enqueue a concurrent duplicate generation.
    let videoInFlight = false
    if (postId != null) {
      const inFlight = await db
        .select({ id: generatedMedia.id })
        .from(generatedMedia)
        .where(and(
          eq(generatedMedia.fabricId, fabricId),
          eq(generatedMedia.type, 'video'),
          inArray(generatedMedia.status, ['PENDING', 'PROCESSING'])
        ))
        .limit(1)
      videoInFlight = inFlight.length > 0
    }

    if (postId != null && !videoInFlight) {
      await db
        .update(socialPosts)
        .set({
          status: 'VIDEO_PENDING',
          errorMessage: null,
          mediaUrls: (fabric.images ?? []).slice(0, 10),
          updatedAt: sql`now()`
        })
        .where(eq(socialPosts.id, postId))
    } else if (postId == null) {
      const [post] = await db
        .insert(socialPosts)
        .values({
          fabricId,
          platform,
          contentType: `REEL_${duration}`,
          status: 'VIDEO_PENDING',
          mediaUrls: (fabric.images ?? []).slice(0, 10),
          updatedAt: new Date()
        })
        .returning({ id: socialPosts.id })

      postId = post?.id ?? null
      if (!postId) throw new Error('Failed to create social post')
    }

    if (videoInFlight) {
      logger.info('Video generation skipped — an AI video is already in flight', { fabricId, platform, postId })
      await releaseLock()
      return { postId, mediaId: 0 }
    }

    // If the linked post already carries an AI reel script, reuse it as-is —
    // never regenerate (and overwrite) the fabric's social content on every
    // video request. Only generate a fresh content package when no script
    // exists yet. The video worker picks the script up via findFabricReelScript.
    let thumbnailPrompt: string | null = null
    const existingContent = await db
      .select({ scriptText: socialPosts.scriptText, platformMetadata: socialPosts.platformMetadata })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
      .limit(1)
    const existingPostRow = existingContent[0]
    const hasExistingScript = Boolean(existingPostRow?.scriptText?.trim())

    if (hasExistingScript) {
      const existingMeta = (existingPostRow?.platformMetadata ?? {}) as Record<string, unknown>
      thumbnailPrompt = (existingMeta.imagePrompt as string | null) ?? null
      logger.info('Reusing existing reel script for video post', { fabricId, postId })
    } else {
      // Generate the complete AI content package (title, caption, hashtags,
      // reel script, CTA, target audience, thumbnail prompt, posting time) so
      // the post is publish-ready. If the AI call fails, keep the bare post
      // and still enqueue the video job — the worker retries content + thumbnail later.
      try {
        const content = await AIService.generateSocialContent(fabricId, platform, undefined, { requireReelScript: true })
        const hashtags = uniqHashtags(content.hashtags, maxHashtagsForPlatform(platform))
        thumbnailPrompt = content.imagePrompt
        await db
          .update(socialPosts)
          .set({
            captionText: content.caption,
            hashtags,
            scriptText: content.reelScript,
            mediaUrls: (fabric.images ?? []).slice(0, 10),
            platformMetadata: {
              postTitle: content.postTitle,
              callToAction: content.callToAction,
              specificationsSummary: content.specificationsSummary,
              keyFeatures: content.keyFeatures,
              targetAudience: content.targetAudience,
              imagePrompt: content.imagePrompt,
              imageOverlayText: content.imageOverlayText,
              carouselSlides: content.carouselSlides,
              recommendedPostingTime: content.recommendedPostingTime
            },
            updatedAt: new Date()
          })
          .where(eq(socialPosts.id, postId))
      } catch (err) {
        logger.warn('AI social content generation for video post failed; continuing with bare post', {
          fabricId,
          message: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // The reel script is already stored on the post; generateForFabric merges the
    // latest script into the video prompt via findFabricReelScript.
    await addVideoGenerationJob(fabricId, {
      fabricId,
      prompt: options?.prompt ?? '',
      imageUrl,
      thumbnailPrompt: thumbnailPrompt ?? undefined,
      durationSeconds: duration,
      socialPostId: postId
    })

    const [media] = await db
      .select({ id: generatedMedia.id })
      .from(generatedMedia)
      .where(eq(generatedMedia.fabricId, fabricId))
      .orderBy(generatedMedia.createdAt)
      .limit(1)

    await releaseLock()

    return { postId, mediaId: media?.id ?? 0 }
  }

  public static async schedulePost(postId: number, scheduledAt: Date, actorUserId: number | null = null): Promise<void> {
    const db = getDb()
    await db
      .update(socialPosts)
      .set({
        status: 'SCHEDULED',
        scheduledAt,
        scheduledByUserId: actorUserId,
        updatedAt: sql`now()`
      })
      .where(and(eq(socialPosts.id, postId), inArray(socialPosts.status, ['DRAFT', 'APPROVED'])))
  }

  public static async publishPost(postId: number, actorUserId: number | null = null): Promise<void> {
    const { SocialPublisherService } = await import('@/services/social-publisher.service')
    await SocialPublisherService.publishPost({ postId, actorUserId })
  }
}

