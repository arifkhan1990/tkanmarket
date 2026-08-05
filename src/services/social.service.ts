import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { socialPosts, socialPostRevisions } from '@/db/schema/social.schema'
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
      .where(and(
        eq(socialPosts.fabricId, fabricId),
        eq(socialPosts.platform, platform),
        inArray(socialPosts.contentType, ['IMAGE_POST', 'CAROUSEL', 'PIN'])
      ))
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

      const targetContentType = contentTypeForPlatform(platform)
      const prevRows = await db
        .select({ id: socialPosts.id, revisionNumber: socialPosts.revisionNumber })
        .from(socialPosts)
        .where(and(
          eq(socialPosts.fabricId, fabricId),
          eq(socialPosts.platform, platform),
          eq(socialPosts.contentType, targetContentType),
          isNull(socialPosts.deletedAt)
        ))
        .orderBy(desc(socialPosts.revisionNumber))
        .limit(1)
      const prev = prevRows[0]
      const revisionNumber = (prev?.revisionNumber ?? 0) + 1

      const [inserted] = await db
        .insert(socialPosts)
        .values({
          fabricId,
          platform,
          contentType: targetContentType,
          status: 'DRAFT',
          captionText: draft.captionText,
          hashtags: draft.hashtags,
          scriptText: draft.scriptText,
          mediaUrls: sourceMedia,
          platformMediaVariants: variants,
          platformMetadata: metadata,
          revisionNumber,
          supersedesPostId: prev?.id ?? null,
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
        .returning({ id: socialPosts.id })

      const postId = inserted?.id
      if (postId) {
        const snapshot = {
          ...metadata,
          caption: draft.captionText,
          hashtags: draft.hashtags,
          script: draft.scriptText
        }
        await db.insert(socialPostRevisions).values({
          postId,
          revisionNumber,
          changeType: prev ? 'REGENERATED' : 'GENERATED',
          snapshot,
          after: snapshot,
          changedByUserId: null
        })
      }

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
   * Generate complete, publish-ready social content for the requested platforms
   * in a single AI call and create one DRAFT post per platform. Unlike
   * generatePlatformContent this always INSERTS a new post row (versioning) —
   * previous drafts are preserved as history, never overwritten. Every insert
   * bumps the post's revision_number, links it to the superseded post and writes
   * a GENERATED entry in social_post_revisions.
   *
   * Concurrency-safe: a short-lived distributed lock per fabric prevents two
   * overlapping generation runs (double AI spend + duplicate posts) when the
   * admin clicks repeatedly or the auto flow and a manual job race.
   */
  public static async generateAllPlatformContent(fabricId: number, platforms: SocialPlatform[] = [...SOCIAL_PLATFORM]): Promise<{ created: number; posts: Array<{ id: number; platform: SocialPlatform }> }> {
    const db = getDb()

    const redis = getRedisClient()
    const lockKey = `social:content:lock:${fabricId}`
    let lockAcquired = false
    if (redis) {
      try {
        lockAcquired = (await redis.set(lockKey, '1', 'EX', 300, 'NX')) === 'OK'
      } catch (err) {
        logger.warn('Failed to acquire social content generation lock', {
          fabricId,
          message: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }
    if (redis && !lockAcquired) {
      logger.info('Social content generation skipped — another run is in progress', { fabricId })
      return { created: 0, posts: [] }
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

    const rows = await db
      .select({ id: fabrics.id, images: fabrics.images })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const f = rows[0]
    if (!f) {
      await releaseLock()
      throw new Error('Fabric not found')
    }
    const images = f.images ?? []
    if (images.length < 1) {
      await releaseLock()
      throw new Error('Fabric has no images for social content')
    }

    const created: Array<{ id: number; platform: SocialPlatform }> = []

    try {
      const contentByPlatform = await AIService.generateSocialContentAll(fabricId)

      for (const platform of platforms) {
        const content = contentByPlatform[platform]
        const hashtags = uniqHashtags(content.hashtags, maxHashtagsForPlatform(platform))
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

        const prevRows = await db
          .select({ id: socialPosts.id, revisionNumber: socialPosts.revisionNumber })
          .from(socialPosts)
          .where(and(
            eq(socialPosts.fabricId, fabricId),
            eq(socialPosts.platform, platform),
            inArray(socialPosts.contentType, ['IMAGE_POST', 'CAROUSEL', 'PIN']),
            isNull(socialPosts.deletedAt)
          ))
          .orderBy(desc(socialPosts.revisionNumber))
          .limit(1)
        const prev = prevRows[0]
        const revisionNumber = (prev?.revisionNumber ?? 0) + 1

        const [post] = await db
          .insert(socialPosts)
          .values({
            fabricId,
            platform,
            contentType: contentTypeForPlatform(platform),
            status: 'DRAFT',
            captionText: content.caption || null,
            hashtags,
            scriptText: content.reelScript,
            mediaUrls: sourceMedia,
            platformMediaVariants: variants,
            platformMetadata: metadata,
            revisionNumber,
            supersedesPostId: prev?.id ?? null,
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
          .returning({ id: socialPosts.id })

        const postId = post?.id
        if (postId) {
          created.push({ id: postId, platform })
          const snapshot = {
            ...metadata,
            caption: content.caption || null,
            hashtags,
            script: content.reelScript
          }
          await db.insert(socialPostRevisions).values({
            postId,
            revisionNumber,
            changeType: prev ? 'REGENERATED' : 'GENERATED',
            snapshot,
            after: snapshot,
            changedByUserId: null
          })
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Social generation failed'
      logger.error('Social content generation failed', { fabricId, message })
      for (const platform of platforms) {
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
    } finally {
      await releaseLock()
    }

    return { created: created.length, posts: created }
  }

  /**
   * Generate a video for a fabric — ONLY called when admin clicks the button.
   * NOT auto-triggered. Creates a VIDEO_PENDING social post (one per platform)
   * and enqueues a single Omni Flash generation job whose asset is reused
   * across every platform post. Without an explicit platform this generates
   * for ALL platforms.
   */
  public static async generateVideoForFabric(fabricId: number, options?: {
    prompt?: string
    duration?: ReelDuration
    platform?: SocialPlatform
    platforms?: SocialPlatform[]
    imageUrl?: string
  }): Promise<{ postId: number; mediaId: number }> {
    const db = getDb()
    const platforms = (options?.platforms && options.platforms.length > 0)
      ? [...options.platforms]
      : options?.platform
        ? [options.platform]
        : [...SOCIAL_PLATFORM]
    const duration = options?.duration ?? 8

    const fabricRows = await db
      .select({ id: fabrics.id, images: fabrics.images })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)
    const fabric = fabricRows[0]
    if (!fabric) throw new Error('Fabric not found')

    const imageUrl = options?.imageUrl ?? (fabric.images?.[0] ?? undefined)

    // Distributed lock: only one video preparation+enqueue per fabric at a time.
    // Guards against concurrent admin clicks and doubles as a second idempotency
    // barrier alongside the DB in-flight check.
    const lockKey = `social:video:lock:${fabricId}`
    const redis = getRedisClient()
    let lockAcquired = false
    if (redis) {
      try {
        lockAcquired = (await redis.set(lockKey, '1', 'EX', 60, 'NX')) === 'OK'
      } catch (err) {
        logger.warn('Failed to acquire video generation lock', {
          fabricId,
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
          isNull(socialPosts.deletedAt)
        ))
        .orderBy(desc(socialPosts.createdAt))
        .limit(1)
      logger.info('Video generation skipped — another request is already in progress', { fabricId })
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

    // Idempotency per platform: never create a duplicate post for the same
    // fabric+platform. Reuse the latest non-final post where one exists, so a
    // single video asset is shared by one post per platform.
    const platformPosts: Array<{ id: number; platform: SocialPlatform }> = []
    for (const platform of platforms) {
      const existing = await db
        .select({ id: socialPosts.id })
        .from(socialPosts)
        .where(and(
          eq(socialPosts.fabricId, fabricId),
          eq(socialPosts.platform, platform),
          inArray(socialPosts.contentType, ['REEL_5', 'REEL_8', 'REEL_10']),
          inArray(socialPosts.status, ['DRAFT', 'APPROVED', 'SCHEDULED', 'VIDEO_PENDING', 'FAILED'])
        ))
        .orderBy(desc(socialPosts.createdAt))
        .limit(1)

      if (existing[0]?.id) {
        platformPosts.push({ id: existing[0].id, platform })
        continue
      }

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

      if (post?.id) platformPosts.push({ id: post.id, platform })
    }

    const primary = platformPosts[0]
    if (!primary) throw new Error('Failed to create social post')
    const postId = primary.id

    // If a video for this fabric is already generating, return the existing post
    // idempotently — do NOT enqueue a concurrent duplicate generation.
    const inFlight = await db
      .select({ id: generatedMedia.id })
      .from(generatedMedia)
      .where(and(
        eq(generatedMedia.fabricId, fabricId),
        eq(generatedMedia.type, 'video'),
        inArray(generatedMedia.status, ['PENDING', 'PROCESSING'])
      ))
      .limit(1)
    if (inFlight.length > 0) {
      logger.info('Video generation skipped — an AI video is already in flight', { fabricId, postId })
      await releaseLock()
      return { postId, mediaId: 0 }
    }

    // If the primary post already carries an AI reel script, reuse it as-is —
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
      // Generate the complete AI content package for EVERY platform in ONE call
      // (title, caption, hashtags, reel script, CTA, target audience, thumbnail
      // prompt, posting time) so every platform post is publish-ready. If the AI
      // call fails, keep the bare posts and still enqueue the video job — the
      // worker retries content + thumbnail later.
      try {
        const contentByPlatform = await AIService.generateSocialContentAll(fabricId)
        thumbnailPrompt = contentByPlatform[primary.platform]?.imagePrompt ?? null
        for (const entry of platformPosts) {
          const content = contentByPlatform[entry.platform]
          const hashtags = uniqHashtags(content.hashtags, maxHashtagsForPlatform(entry.platform))
          const variantUrls = buildPlatformVariantSet((fabric.images ?? []).slice(0, 10), entry.platform)

          const [existingRow] = await db
            .select({
              captionText: socialPosts.captionText,
              hashtags: socialPosts.hashtags,
              scriptText: socialPosts.scriptText,
              platformMetadata: socialPosts.platformMetadata
            })
            .from(socialPosts)
            .where(eq(socialPosts.id, entry.id))
            .limit(1)

          const keepCaption = existingRow?.captionText?.trim() ? existingRow.captionText : (content.caption || null)
          const keepHashtags = (existingRow?.hashtags && existingRow.hashtags.length > 0) ? existingRow.hashtags : hashtags
          const keepScript = existingRow?.scriptText?.trim() ? existingRow.scriptText : content.reelScript
          const mergedMetadata = {
            postTitle: content.postTitle,
            callToAction: content.callToAction,
            specificationsSummary: content.specificationsSummary,
            keyFeatures: content.keyFeatures,
            targetAudience: content.targetAudience,
            imagePrompt: content.imagePrompt,
            imageOverlayText: content.imageOverlayText,
            carouselSlides: content.carouselSlides,
            recommendedPostingTime: content.recommendedPostingTime,
            ...(existingRow?.platformMetadata as Record<string, unknown> ?? {})
          }

          await db
            .update(socialPosts)
            .set({
              status: 'VIDEO_PENDING',
              captionText: keepCaption,
              hashtags: keepHashtags,
              scriptText: keepScript,
              mediaUrls: (fabric.images ?? []).slice(0, 10),
              platformMediaVariants: { [entry.platform]: variantUrls },
              platformMetadata: mergedMetadata,
              updatedAt: new Date()
            })
            .where(eq(socialPosts.id, entry.id))
        }
      } catch (err) {
        logger.warn('AI social content generation for video post failed; continuing with bare post', {
          fabricId,
          message: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // One video asset is generated for the fabric; the video worker attaches it
    // to every active platform post (see video-generation.service).
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
      .orderBy(desc(generatedMedia.createdAt))
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

