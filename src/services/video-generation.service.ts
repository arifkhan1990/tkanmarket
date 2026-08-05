import { and, desc, eq, inArray, isNotNull, isNull, ne, sql, type SQL } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { generatedMedia } from '@/db/schema/generated-media.schema'
import { fabricActivityLog } from '@/db/schema/fabric-activity-log.schema'
import { socialPosts } from '@/db/schema/social.schema'
import { generateGeminiImage, generateOmniFlashVideo } from '@/lib/google/client'
import { uploadBuffer } from '@/lib/storage/r2'
import { logger } from '@/lib/logger'
import { PromptRuleService } from '@/services/admin/prompt-rule.service'
import { AIService } from '@/services/ai.service'
import { fetchImagesAsInlineData, ImageGenerationService } from '@/services/image-generation.service'
import { FabricConsistencyGuardService } from '@/services/fabric-consistency-guard.service'
import { MEDIA_VERSION_RETENTION, REEL_DURATIONS } from '@/constants'
import type { ReelDuration } from '@/constants'
import type { SocialPlatform } from '@/types/queue.types'

const DEFAULT_VIDEO_PROMPT = 'Professional B2B product showcase video of fabric: {title}. Slow camera pan, soft studio lighting, show texture and color accuracy. Minimalist style.'

/** Coerce any requested duration to the nearest allowed reel duration (5s / 8s / 10s). */
function normalizeReelDuration(value: number | null | undefined): ReelDuration {
  if (value == null) return 8
  // REEL_DURATIONS is a non-empty const tuple, index 0 is always present.
  const first = REEL_DURATIONS[0]!
  return REEL_DURATIONS.slice(1).reduce<ReelDuration>((closest, d) =>
    Math.abs(d - value) < Math.abs(closest - value) ? d : closest,
    first
  )
}

/**
 * Returns the latest non-empty AI-generated reel script for a fabric
 * (stored on its social posts' script_text by the social content generator).
 * When a preferredPostId is given (the post this video is linked to), that
 * post's script is used first so the visual direction matches its own content.
 */
async function findFabricReelScript(fabricId: number, preferredPostId?: number): Promise<string | null> {
  const db = getDb()

  if (preferredPostId != null) {
    const preferred = await db
      .select({ scriptText: socialPosts.scriptText })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, preferredPostId), eq(socialPosts.fabricId, fabricId), isNull(socialPosts.deletedAt)))
      .limit(1)
    const preferredScript = preferred[0]?.scriptText?.trim()
    if (preferredScript && preferredScript.length > 0) return preferredScript
  }

  const rows = await db
    .select({ scriptText: socialPosts.scriptText })
    .from(socialPosts)
    .where(and(eq(socialPosts.fabricId, fabricId), isNotNull(socialPosts.scriptText), isNull(socialPosts.deletedAt)))
    .orderBy(desc(socialPosts.createdAt))
    .limit(1)

  const script = rows[0]?.scriptText?.trim()
  return script && script.length > 0 ? script : null
}

const DEFAULT_THUMBNAIL_PROMPT =
  'Vertical 9:16 cinematic cover shot of a premium B2B fabric: close-up of the fabric texture and drape in motion, dramatic studio lighting, rich saturated color, high resolution, professional product showcase.'

function dedupeUrls(urls: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of urls) {
    const v = u?.trim()
    if (!v) continue
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

/**
 * Ensures the linked VIDEO_PENDING social post carries the complete AI content
 * package (caption, hashtags, reel script, metadata). Called by the video worker
 * so a post is always publish-ready even if the initial generation failed.
 */
async function ensurePostContent(
  fabricId: number,
  postId: number,
  platform: SocialPlatform
): Promise<{ reelScript: string | null; imagePrompt: string | null }> {
  const db = getDb()
  const rows = await db
    .select({
      id: socialPosts.id,
      captionText: socialPosts.captionText,
      platformMetadata: socialPosts.platformMetadata,
      images: fabrics.images
    })
    .from(socialPosts)
    .innerJoin(fabrics, eq(socialPosts.fabricId, fabrics.id))
    .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
    .limit(1)

  const post = rows[0]
  if (!post) return { reelScript: null, imagePrompt: null }

  const existingMeta = (post.platformMetadata ?? {}) as Record<string, unknown>
  const existingImagePrompt = (existingMeta.imagePrompt as string | null) ?? null

  if (post.captionText?.trim()) {
    return {
      reelScript: (existingMeta.reelScript as string | null) ?? null,
      imagePrompt: existingImagePrompt
    }
  }

  try {
    const content = await AIService.generateSocialContent(fabricId, platform, undefined, { requireReelScript: true })
    const hashtags = content.hashtags.slice(0, 15)
    await db
      .update(socialPosts)
      .set({
        captionText: content.caption,
        hashtags: hashtags.length > 0 ? hashtags : null,
        scriptText: content.reelScript,
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
    return { reelScript: content.reelScript, imagePrompt: content.imagePrompt }
  } catch (err) {
    logger.warn('Failed to backfill AI social content for video post', {
      fabricId,
      postId,
      message: (err as Error)?.message
    })
    return { reelScript: null, imagePrompt: existingImagePrompt }
  }
}

/** Generates a 9:16 thumbnail cover for the reel and returns its R2 URL (or null). */
async function generateVideoThumbnail(
  fabricId: number,
  mediaId: number,
  prompt: string | null,
  inputImages?: string[]
): Promise<string | null> {
  try {
    const urls = await generateGeminiImage(prompt?.trim() ? prompt : DEFAULT_THUMBNAIL_PROMPT, {
      aspectRatio: '9:16',
      inputImages,
      context: { source: 'video', fabricId }
    })
    const sourceUri = urls[0]
    if (!sourceUri) return null

    let storageUrl: string | null = null
    if (sourceUri.startsWith('data:')) {
      const base64Data = sourceUri.split(',')[1]
      if (base64Data) {
        const buffer = Buffer.from(base64Data, 'base64')
        const key = `fabrics/${fabricId}/videos/${mediaId}-thumb.png`
        storageUrl = await uploadBuffer(buffer, key, 'image/png')
      }
    }
    return storageUrl
  } catch (err) {
    logger.warn('Video thumbnail generation failed', { fabricId, mediaId, message: (err as Error)?.message })
    return null
  }
}

export class VideoGenerationService {
  static async generateForFabric(
    fabricId: number,
    options?: {
      prompt?: string
      durationSeconds?: number
      aspectRatio?: string
      socialPostId?: number
      thumbnailPrompt?: string
    }
  ): Promise<{ mediaId: number; storageUrl: string | null }> {
    const db = getDb()

    const rows = await db
      .select({
        id: fabrics.id,
        titleEn: fabrics.titleEn,
        titleRu: fabrics.titleRu,
        fabricType: fabrics.fabricType,
        color: fabrics.color,
        gsm: fabrics.gsm,
        composition: fabrics.composition,
        tags: fabrics.tags,
        supplyType: fabrics.supplyType,
        descriptionEn: fabrics.descriptionEn,
        descriptionRu: fabrics.descriptionRu,
        images: fabrics.images
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const fabric = rows[0]
    if (!fabric) throw new Error('Fabric not found')

    // When the video is linked to a social post, make sure that post is fully
    // populated with AI content (caption/hashtags/script/metadata). Done before
    // the prompt is built so findFabricReelScript can pick up the fresh script.
    let linkedImagePrompt: string | null = null
    if (options?.socialPostId) {
      try {
        const postRows = await db
          .select({ platform: socialPosts.platform })
          .from(socialPosts)
          .where(and(eq(socialPosts.id, options.socialPostId), isNull(socialPosts.deletedAt)))
          .limit(1)
        const pl = postRows[0]?.platform
        if (pl) {
          const prepared = await ensurePostContent(fabricId, options.socialPostId, pl)
          linkedImagePrompt = prepared.imagePrompt
        }
      } catch (err) {
        logger.warn('Failed to prepare linked social post content', {
          fabricId,
          postId: options.socialPostId,
          message: (err as Error)?.message
        })
      }
    }

    const compositionStr = Array.isArray(fabric.composition)
      ? (fabric.composition as Array<{ material?: string }>).map((c) => c.material ?? '').filter(Boolean).join(', ')
      : ''
    const tagsStr = Array.isArray(fabric.tags) ? fabric.tags.join(', ') : ''

    let inputImages = await fetchImagesAsInlineData(fabric.images)
    if (inputImages.length === 0) {
      const generatedImgRows = await db
        .select({ url: generatedMedia.url })
        .from(generatedMedia)
        .where(and(
          eq(generatedMedia.fabricId, fabricId),
          eq(generatedMedia.type, 'image'),
          eq(generatedMedia.status, 'COMPLETED'),
          isNull(generatedMedia.deletedAt)
        ))
        .orderBy(desc(generatedMedia.createdAt))
        .limit(3)
      const genUrls = generatedImgRows.map((r) => r.url).filter((u): u is string => Boolean(u))
      if (genUrls.length > 0) {
        inputImages = await fetchImagesAsInlineData(genUrls)
      }
    }

    let prompt = options?.prompt
    let durationSeconds = options?.durationSeconds
    let aspectRatio = options?.aspectRatio

    if (!prompt) {
      const fabricVars = PromptRuleService.buildFabricVariables({
        titleEn: fabric.titleEn,
        titleRu: fabric.titleRu,
        fabricType: fabric.fabricType,
        gsm: fabric.gsm,
        color: fabric.color,
        composition: compositionStr,
        tags: tagsStr,
        supplyType: fabric.supplyType,
        descriptionEn: fabric.descriptionEn,
        descriptionRu: fabric.descriptionRu
      })

      const rule = await PromptRuleService.findMatchingRuleByData({
        titleEn: fabric.titleEn,
        titleRu: fabric.titleRu,
        fabricType: fabric.fabricType,
        gsm: fabric.gsm,
        color: fabric.color,
        composition: compositionStr,
        tags: tagsStr,
        supplyType: fabric.supplyType,
        descriptionEn: fabric.descriptionEn,
        descriptionRu: fabric.descriptionRu
      })

      let basePrompt: string
      if (rule && rule.videoPromptEnabled && rule.videoPrompt) {
        basePrompt = PromptRuleService.compilePrompts(rule, fabricVars).videoPrompt ?? `B2B product showcase of ${fabric.titleEn ?? fabric.titleRu ?? 'fabric'}`
        if (!durationSeconds && rule.videoDurationSeconds) durationSeconds = rule.videoDurationSeconds
        if (!aspectRatio && rule.videoAspectRatio) aspectRatio = rule.videoAspectRatio
      } else {
        basePrompt = PromptRuleService.substituteVariables(DEFAULT_VIDEO_PROMPT, fabricVars)
      }

      // If AI already produced a reel script for this fabric, merge it into the
      // prompt so the generated video follows the fabric's own visual direction.
      const reelScript = await findFabricReelScript(fabricId, options?.socialPostId)
      prompt = reelScript
        ? `${basePrompt}\n\nVISUAL DIRECTION — follow this AI-generated reel script scene by scene:\n${reelScript}`
        : basePrompt
    }

    const visualAnchor = inputImages.length > 0
      ? `[MANDATORY VISUAL REFERENCE]: The input reference image(s) show the EXACT physical fabric sample. The video MUST strictly display THIS EXACT fabric sample—maintaining 100% precision in color, pattern, weave structure, surface texture, drape, and visual identity without any alteration or color shift.`
      : `[MANDATORY COLOR & TEXTURE CONSTRAINTS]: Strictly adhere to the fabric specifications: Color "${fabric.color ?? 'Original'}", Type "${fabric.fabricType ?? 'Textile'}", Weight ${fabric.gsm ?? ''} GSM. Do NOT alter color, hue, pattern, or texture.`

    prompt = `${visualAnchor}\n\n${prompt}`

    if (prompt && !prompt.includes('FABRIC_CONSISTENCY_INSTRUCTION')) {
      prompt = `${prompt} [System Rule: ${PromptRuleService.FABRIC_CONSISTENCY_INSTRUCTION}]`
    }

    prompt = FabricConsistencyGuardService.enforceRawDataLock(prompt, fabric)

    durationSeconds = normalizeReelDuration(durationSeconds)
    aspectRatio = aspectRatio ?? '9:16'

    // ── AI generation first — DB record is only created on success ──────────
    // This ensures no orphaned PENDING/FAILED records are left behind when the
    // AI model rejects or times out the request.
    let videoBuffer: Buffer
    try {
      logger.info('Starting Omni Flash video generation', { fabricId, durationSeconds, aspectRatio })

      const videoBuffers = await generateOmniFlashVideo(prompt, {
        durationSeconds,
        aspectRatio,
        inputImages,
        context: { source: 'video', fabricId }
      })

      const buf = videoBuffers[0]
      if (!buf) throw new Error('No video data returned from Omni Flash')
      videoBuffer = buf
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'

      // Log the failure to the activity log but do NOT write any generated_media row.
      await db.insert(fabricActivityLog).values({
        fabricId,
        actorId: null,
        eventType: 'VIDEO_GENERATION_FAILED',
        message: 'Omni Flash video generation failed — no DB record created',
        payload: { error: message, durationSeconds, aspectRatio },
        updatedAt: new Date()
      })

      throw err
    }

    // ── AI succeeded — now persist the result ────────────────────────────────
    const tempKey = `fabrics/${fabricId}/videos/tmp-${Date.now()}.mp4`
    let storageUrl: string | null = null
    try {
      storageUrl = await uploadBuffer(videoBuffer, tempKey, 'video/mp4')
    } catch (storageErr) {
      logger.warn('R2 video upload failed, will store without remote URL', {
        fabricId,
        message: (storageErr as Error)?.message
      })
    }

    const [inserted] = await db
      .insert(generatedMedia)
      .values({
        fabricId,
        socialPostId: options?.socialPostId ?? null,
        type: 'video',
        mediaType: `REEL_${durationSeconds}`,
        prompt,
        status: 'COMPLETED',
        url: storageUrl,
        fileSizeBytes: videoBuffer.length,
        provider: 'gemini',
        providerModel: 'gemini-omni-flash-preview',
        aspectRatio,
        durationSeconds
      })
      .returning()

    if (!inserted) throw new Error('Failed to create media record after successful generation')
    const mediaId = inserted.id

    // Rename the R2 object to the canonical key now that we have the mediaId.
    // If renaming fails, the file is still accessible via the temp key.
    if (storageUrl) {
      const canonicalKey = `fabrics/${fabricId}/videos/${mediaId}.mp4`
      try {
        const renamedUrl = await uploadBuffer(videoBuffer, canonicalKey, 'video/mp4')
        await db
          .update(generatedMedia)
          .set({ url: renamedUrl, updatedAt: sql`now()` })
          .where(eq(generatedMedia.id, mediaId))
        storageUrl = renamedUrl
      } catch {
        // Keep the temp key URL — not critical
      }
    }

    // Mark this version COMPLETED, supersede older active versions of the same
    // scope, and enforce the retention cap — all in one transaction so the
    // version lineage stays consistent even if a later step crashes.
    await db.transaction(async (tx) => {
      await tx.insert(fabricActivityLog).values({
        fabricId,
        actorId: null,
        eventType: 'VIDEO_GENERATED',
        message: 'Omni Flash video generation completed',
        payload: { mediaId, storageUrl, fileSizeBytes: videoBuffer.length },
        updatedAt: new Date()
      })

      const scopeParts: SQL[] = [
        eq(generatedMedia.fabricId, fabricId),
        eq(generatedMedia.type, 'video'),
        isNull(generatedMedia.deletedAt)
      ]
      if (options?.socialPostId != null) scopeParts.push(eq(generatedMedia.socialPostId, options.socialPostId))
      const scopeCond = and(...scopeParts)

      const superseded = await tx
        .update(generatedMedia)
        .set({ status: 'SUPERSEDED', supersededByMediaId: mediaId, updatedAt: sql`now()` })
        .where(and(scopeCond, ne(generatedMedia.id, mediaId), eq(generatedMedia.status, 'COMPLETED')))
        .returning({ id: generatedMedia.id })

      if (superseded.length > 0) {
        await tx.insert(fabricActivityLog).values({
          fabricId,
          actorId: null,
          eventType: 'VIDEO_SUPERSEDED',
          message: `${superseded.length} previous video version(s) superseded by media ${mediaId}`,
          payload: { supersededIds: superseded.map((r) => r.id), byMediaId: mediaId },
          updatedAt: new Date()
        })
      }

      // Retention: keep the newest MEDIA_VERSION_RETENTION versions, soft-delete
      // the older ones. R2 objects of pruned versions are freed by the cleanup sweep.
      const pruneCandidates = await tx
        .select({ id: generatedMedia.id })
        .from(generatedMedia)
        .where(and(scopeCond, inArray(generatedMedia.status, ['COMPLETED', 'SUPERSEDED'])))
        .orderBy(desc(generatedMedia.createdAt))
        .offset(MEDIA_VERSION_RETENTION)

      if (pruneCandidates.length > 0) {
        await tx
          .update(generatedMedia)
          .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
          .where(inArray(generatedMedia.id, pruneCandidates.map((c) => c.id)))
      }
    })

    // Generate a thumbnail cover and keep the linked social post in sync
    // (media_urls must start with the video, then the cover, then fabric images).
    if (options?.socialPostId) {
      const thumbnailUrl = await generateVideoThumbnail(fabricId, mediaId, options.thumbnailPrompt ?? linkedImagePrompt, inputImages)
      if (thumbnailUrl) {
        await db
          .update(generatedMedia)
          .set({ thumbnailUrl, updatedAt: sql`now()` })
          .where(eq(generatedMedia.id, mediaId))
      }
      try {
        // Cross-platform reuse: one generated video is shared by every active
        // (non-final) platform post of the fabric, so the same asset can be
        // published to Instagram, TikTok, Facebook, YouTube and Pinterest.
        const linkedRows = await db
          .select({ id: socialPosts.id, mediaUrls: socialPosts.mediaUrls, images: fabrics.images })
          .from(socialPosts)
          .innerJoin(fabrics, eq(socialPosts.fabricId, fabrics.id))
          .where(and(
            eq(socialPosts.fabricId, fabricId),
            inArray(socialPosts.contentType, ['REEL_5', 'REEL_8', 'REEL_10']),
            inArray(socialPosts.status, ['DRAFT', 'APPROVED', 'SCHEDULED', 'VIDEO_PENDING']),
            isNull(socialPosts.deletedAt)
          ))
        for (const linked of linkedRows) {
          const next = dedupeUrls([storageUrl, thumbnailUrl, ...(linked.mediaUrls ?? []), ...(linked.images ?? [])])
          await db
            .update(socialPosts)
            .set({ mediaUrls: next.length > 0 ? next : null, updatedAt: new Date() })
            .where(eq(socialPosts.id, linked.id))
        }
      } catch (err) {
        logger.warn('Failed to sync social post media', {
          fabricId,
          postId: options.socialPostId,
          message: (err as Error)?.message
        })
      }
    }

    return { mediaId, storageUrl }
  }

  static async getByFabric(fabricId: number) {
    const db = getDb()
    return db
      .select()
      .from(generatedMedia)
      .where(and(eq(generatedMedia.fabricId, fabricId), eq(generatedMedia.type, 'video'), isNull(generatedMedia.deletedAt)))
      .orderBy(generatedMedia.createdAt)
  }
}
