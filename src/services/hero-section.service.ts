import { and, eq, inArray, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { adminSettings } from '@/db/schema/admin-settings.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { generatedMedia } from '@/db/schema/generated-media.schema'
import {
  DEFAULT_HERO_CONFIG,
  HERO_BOTTOM_CARDS_LIMIT,
  HERO_SLIDER_LIMIT,
  type HeroCardItem,
  type HeroSectionConfig,
  type HeroShowcase
} from '@/types/hero-section.types'
import type { FabricSummary } from '@/types/marketplace.types'
import { FabricService } from '@/services/fabric.service'

/**
 * Homepage hero section — admin-managed fabric selection for the slider, right
 * column card and bottom row, plus an optional YouTube embed. Stored in the
 * single-row `admin_settings.hero_section_json` jsonb column.
 */
export class HeroSectionService {
  public static async getConfig(): Promise<HeroSectionConfig> {
    const db = getDb()
    const row = await db
      .select({ heroSectionJson: adminSettings.heroSectionJson })
      .from(adminSettings)
      .where(isNull(adminSettings.deletedAt))
      .limit(1)

    const raw = row[0]?.heroSectionJson as Partial<HeroSectionConfig> | null
    return this.normalize(raw)
  }

  public static async saveConfig(input: Partial<HeroSectionConfig>): Promise<HeroSectionConfig> {
    const db = getDb()
    const current = await this.getConfig()

    const nextRaw: HeroSectionConfig = {
      mode: input.mode ?? current.mode,
      slider: Array.isArray(input.slider) ? input.slider : current.slider,
      rightCard: input.rightCard !== undefined ? input.rightCard : current.rightCard,
      bottomCards: Array.isArray(input.bottomCards) ? input.bottomCards : current.bottomCards,
      video: { ...current.video, ...(input.video ?? {}) }
    }
    const next = this.normalize(nextRaw)

    const row = await db
      .select({ id: adminSettings.id })
      .from(adminSettings)
      .where(isNull(adminSettings.deletedAt))
      .limit(1)

    const settingsRow = row[0]
    if (settingsRow) {
      await db
        .update(adminSettings)
        .set({ heroSectionJson: next, updatedAt: new Date() })
        .where(eq(adminSettings.id, settingsRow.id))
    } else {
      await db.insert(adminSettings).values({
        crawlerEnabled: true,
        crawlerDefaultMaxProducts: 200,
        leadRateLimitPerHour: 5,
        heroSectionJson: next
      })
    }
    return next
  }

  public static async getVideoEmbedId(): Promise<string | null> {
    const config = await this.getConfig()
    return config.video.youtubeEmbedId ?? null
  }

  /**
   * Verify the fabric can be used in the hero (exists, approved, not deleted)
   * and enqueue an AI hero image generation job for it.
   */
  public static async enqueueHeroImageGeneration(fabricId: number): Promise<{ jobId: string }> {
    const db = getDb()
    const row = await db
      .select({ id: fabrics.id })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt), eq(fabrics.status, 'approved')))
      .limit(1)
    if (!row[0]) throw new Error('Fabric not found or not approved')

    const { addImageGenerationJob } = await import('@/lib/queue/helpers')
    const job = await addImageGenerationJob(fabricId, '', { promptType: 'elegantDrape' })
    return { jobId: job.id ?? job.name }
  }

  /**
   * Resolve the hero slots for the public homepage. In auto mode (or when
   * custom mode has no assigned fabric anywhere) the featured-fabric ranking is
   * used exactly as before.
   */
  public static async getHeroShowcase(): Promise<HeroShowcase> {
    const config = await this.getConfig()
    const hasCustomSelection =
      config.slider.some((s) => s.enabled) || config.rightCard !== null || config.bottomCards.length > 0

    if (config.mode === 'auto' || !hasCustomSelection) {
      const featured = await FabricService.getFeatured(11)
      return {
        sliderItems: featured.slice(0, HERO_SLIDER_LIMIT),
        cardItems: featured.slice(HERO_SLIDER_LIMIT),
        videoEmbedId: config.video.youtubeEmbedId ?? null
      }
    }

    const sliderItems = await this.loadSliderItems(config.slider.filter((s) => s.enabled))
    const cardItems = await this.loadCardItems(config.rightCard, config.bottomCards)
    return {
      sliderItems,
      cardItems,
      videoEmbedId: config.video.youtubeEmbedId ?? null
    }
  }

  private static normalize(input: Partial<HeroSectionConfig> | null): HeroSectionConfig {
    const base = DEFAULT_HERO_CONFIG
    const mode = input?.mode === 'custom' ? 'custom' : 'auto'

    const slider = (Array.isArray(input?.slider) ? input!.slider : [])
      .filter((s) => Number.isInteger(s.fabricId) && s.fabricId > 0)
      .slice(0, HERO_SLIDER_LIMIT)
      .map((s) => ({
        fabricId: s.fabricId,
        enabled: s.enabled !== false,
        imageUrl: typeof s.imageUrl === 'string' && s.imageUrl.length > 0 ? s.imageUrl : null
      }))

    const normalizeCard = (c: HeroCardItem | null | undefined): HeroCardItem | null => {
      if (!c || !Number.isInteger(c.fabricId) || c.fabricId <= 0) return null
      return {
        fabricId: c.fabricId,
        imageUrl: typeof c.imageUrl === 'string' && c.imageUrl.length > 0 ? c.imageUrl : null
      }
    }

    const rightCard = normalizeCard(input?.rightCard)
    const bottomCards = (Array.isArray(input?.bottomCards) ? input!.bottomCards : [])
      .map(normalizeCard)
      .filter((c): c is HeroCardItem => c !== null)
      .slice(0, HERO_BOTTOM_CARDS_LIMIT)

    const youtubeEmbedIdRaw = input?.video?.youtubeEmbedId
    const video = {
      youtubeEmbedId:
        typeof youtubeEmbedIdRaw === 'string' && youtubeEmbedIdRaw.trim().length > 0
          ? youtubeEmbedIdRaw.trim()
          : base.video.youtubeEmbedId
    }

    return { mode, slider, rightCard, bottomCards, video }
  }

  private static async loadSliderItems(slides: Array<{ fabricId: number; imageUrl: string | null }>): Promise<FabricSummary[]> {
    const ids = slides.map((s) => s.fabricId)
    const summaries = await this.loadFabricSummariesByIds(ids)
    const byId = new Map(summaries.map((s) => [s.id, s]))
    return slides.flatMap((slide) => {
      const summary = byId.get(slide.fabricId)
      if (!summary) return []
      return [{ ...summary, imageUrl: slide.imageUrl ?? summary.imageUrl }]
    })
  }

  private static async loadCardItems(
    rightCard: HeroCardItem | null,
    bottomCards: HeroCardItem[]
  ): Promise<FabricSummary[]> {
    const cards = [...(rightCard ? [rightCard] : []), ...bottomCards]
    const ids = cards.map((c) => c.fabricId)
    const summaries = await this.loadFabricSummariesByIds(ids)
    const byId = new Map(summaries.map((s) => [s.id, s]))
    return cards.flatMap((card) => {
      const summary = byId.get(card.fabricId)
      if (!summary) return []
      return [{ ...summary, imageUrl: card.imageUrl ?? summary.imageUrl }]
    })
  }

  private static async loadFabricSummariesByIds(ids: number[]): Promise<FabricSummary[]> {
    if (ids.length === 0) return []
    const uniqueIds = Array.from(new Set(ids))
    const db = getDb()

    const rows = await db
      .select({
        id: fabrics.id,
        slug: fabrics.slug,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        fabricType: fabrics.fabricType,
        gsm: fabrics.gsm,
        widthCm: fabrics.widthCm,
        tags: fabrics.tags,
        tagsEn: fabrics.tagsEn,
        images: fabrics.images,
        sku: fabrics.sku,
        color: fabrics.color,
        colorEn: fabrics.colorEn,
        supplyType: fabrics.supplyType,
        supplyTypeEn: fabrics.supplyTypeEn,
        shipmentTime: fabrics.shipmentTime,
        shipmentTimeEn: fabrics.shipmentTimeEn
      })
      .from(fabrics)
      .where(and(inArray(fabrics.id, uniqueIds), isNull(fabrics.deletedAt), eq(fabrics.status, 'approved')))

    const videoRows = await db
      .select({
        fabricId: generatedMedia.fabricId,
        url: generatedMedia.url,
        thumbnailUrl: generatedMedia.thumbnailUrl
      })
      .from(generatedMedia)
      .where(
        and(
          inArray(generatedMedia.fabricId, uniqueIds),
          eq(generatedMedia.type, 'video'),
          eq(generatedMedia.status, 'COMPLETED'),
          isNull(generatedMedia.deletedAt)
        )
      )
      .orderBy(generatedMedia.createdAt)

    const videoMap = new Map<number, { videoUrl: string | null; thumbnailUrl: string | null }>()
    for (const row of videoRows) {
      if (!videoMap.has(row.fabricId)) {
        videoMap.set(row.fabricId, { videoUrl: row.url ?? null, thumbnailUrl: row.thumbnailUrl ?? null })
      }
    }

    return rows.map((r) => {
      const video = videoMap.get(r.id) ?? { videoUrl: null, thumbnailUrl: null }
      return {
        id: r.id,
        slug: r.slug,
        titleRu: r.titleRu,
        titleEn: r.titleEn ?? null,
        fabricType: r.fabricType,
        gsm: r.gsm,
        widthCm: r.widthCm,
        imageUrl: r.images?.[0] ?? null,
        tags: r.tags ?? [],
        tagsEn: r.tagsEn ?? null,
        sku: r.sku,
        color: r.color ?? null,
        colorEn: r.colorEn ?? null,
        supplyType: r.supplyType ?? null,
        supplyTypeEn: r.supplyTypeEn ?? null,
        shipmentTime: r.shipmentTime ?? null,
        shipmentTimeEn: r.shipmentTimeEn ?? null,
        hasVideo: video.videoUrl !== null,
        thumbnailUrl: video.thumbnailUrl
      }
    })
  }
}
