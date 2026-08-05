import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { fabricActivityLog } from '@/db/schema/fabric-activity-log.schema'
import { SOCIAL_PLATFORM } from '@/constants'
import { callGemini } from '@/lib/google/client'
import { fetchImagesAsInlineData } from '@/services/image-generation.service'
import { buildFabricEnrichmentPrompt } from '@/lib/google/prompts/fabric-enrichment'
import { buildFabricTranslationPrompt } from '@/lib/google/prompts/fabric-translation'
import { logger } from '@/lib/logger'
import { TextPromptRuleService } from '@/services/admin/text-prompt-rule.service'

import type { AIProcessedProduct, AIProcessingResult, RawFabric, SocialContent, SocialContentByPlatform, SocialContentShared } from '@/types/ai.types'
import type { CarouselSlide } from '@/types/ai.types'
import type { SocialPlatform } from '@/types/queue.types'
import type { FabricCompositionItem } from '@/types/fabric'

const CompositionItemSchema = z.object({
  material: z.string().trim().min(1),
  percentage: z.number().min(0).max(100)
})

const EnrichedProductSchema = z.object({
  title_en: z.string().trim().min(1).nullable(),
  description_en: z.string().trim().min(1).nullable(),
  fabric_type: z.string().trim().min(1).max(50).nullable(),
  gsm: z.number().int().positive().nullable(),
  width_cm: z.number().int().positive().nullable(),
  moq: z.number().int().positive().nullable(),
  price_usd: z.string().trim().min(1).nullable(),
  composition: z.array(CompositionItemSchema).nullable(),
  tags_en: z.array(z.string().trim().min(1)).optional().default([]),
  image_urls: z.array(z.string().url()).optional().default([]),
  color_en: z.string().trim().min(1).nullable(),
  supply_type_en: z.string().trim().min(1).nullable(),
  shipment_time_en: z.string().trim().min(1).nullable(),
  usage_en: z.string().trim().min(1).nullable(),
  meta_title_en: z.string().trim().min(1).nullable(),
  meta_description_en: z.string().trim().min(1).nullable(),
  image_alt_en: z.string().trim().min(1).nullable()
})

const TranslationResultSchema = z.object({
  title_ru: z.string().trim().min(1).nullable(),
  description_ru: z.string().trim().min(1).nullable(),
  usage_ru: z.string().trim().min(1).nullable(),
  meta_title_ru: z.string().trim().min(1).nullable(),
  meta_description_ru: z.string().trim().min(1).nullable(),
  image_alt_ru: z.string().trim().min(1).nullable(),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
  color: z.string().trim().min(1).nullable(),
  supply_type: z.string().trim().min(1).nullable(),
  shipment_time: z.string().trim().min(1).nullable()
})

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function parsePriceNumeric(val: string | null | undefined): string | null {
  if (!val) return null
  const match = String(val).match(/(\d+(?:\.\d+)?)/)
  if (!match || !match[1]) return null
  const num = parseFloat(match[1])
  if (isNaN(num) || num <= 0) return null
  return num.toFixed(2)
}

function normalizeTags(tags: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const t of tags) {
    const v = t.trim()
    if (!v) continue
    const key = v.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(v)
  }
  return out.slice(0, 24)
}

function generateDefaultHashtags(fabricData: {
  fabricType: string | null
  color: string | null
  tags: string[] | null
  supplyType: string | null
}): string[] {
  const out: string[] = []
  const seen = new Set<string>()

  const add = (tag: string) => {
    const key = tag.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(tag)
  }

  add('#fabricsourcing')
  add('#b2btextiles')

  if (fabricData.fabricType) {
    add(`#${fabricData.fabricType.replace(/\s+/g, '').toLowerCase()}`)
  }
  if (fabricData.color) {
    add(`#${fabricData.color.replace(/\s+/g, '').toLowerCase()}fabric`)
  }
  if (fabricData.supplyType) {
    add(`#${fabricData.supplyType.replace(/\s+/g, '')}`)
  }
  ;(fabricData.tags ?? []).forEach((t) => {
    const cleaned = t.replace(/[^a-z0-9]/gi, '').toLowerCase()
    if (cleaned) add(`#${cleaned}`)
  })

  add('#textilemanufacturing')
  add('#fabricwholesale')
  add('#apparelproduction')
  add('#garmentfactory')
  add('#tkanmarket')

  return out.slice(0, 15)
}

function completenessScore(processed: AIProcessedProduct): number {
  const checks: boolean[] = [
    Boolean(processed.title_en),
    Boolean(processed.description_en),
    Boolean(processed.fabric_type),
    typeof processed.gsm === 'number',
    typeof processed.width_cm === 'number',
    typeof processed.moq === 'number',
    Boolean(processed.price_usd),
    Array.isArray(processed.composition) && processed.composition.length > 0,
    Array.isArray(processed.tags) && processed.tags.length > 0,
    Boolean(processed.color),
    Boolean(processed.supply_type),
    Boolean(processed.shipment_time),
    Boolean(processed.usage_ru),
    Boolean(processed.usage_en),
    Boolean(processed.meta_title_en),
    Boolean(processed.meta_description_en),
    Boolean(processed.image_alt_ru),
    Boolean(processed.image_alt_en),
    Array.isArray(processed.tags_en) && processed.tags_en.length > 0,
    Boolean(processed.color_en),
    Boolean(processed.supply_type_en),
    Boolean(processed.shipment_time_en)
  ]
  const filled = checks.filter(Boolean).length
  return clamp01(filled / checks.length)
}

function toComposition(items: AIProcessedProduct['composition']): FabricCompositionItem[] | null {
  if (!items || items.length === 0) return null
  return items.map((i) => ({ material: i.material, percentage: i.percentage }))
}

const CarouselSlideSchema = z.object({
  slide_number: z.number().int().positive().default(1),
  title: z.string().trim().min(1).default(''),
  image_description: z.string().trim().min(1).default('')
})

const SocialContentSchema = z.object({
  post_title: z.string().trim().min(1).nullable().optional().default(null),
  caption: z.string().trim().min(1),
  hashtags: z.array(z.string().trim().min(1)).optional().default([]),
  call_to_action: z.string().trim().min(1).nullable().optional().default(null),
  specifications_summary: z.string().trim().min(1).nullable().optional().default(null),
  key_features: z.array(z.string().trim().min(1)).optional().default([]),
  target_audience: z.string().trim().min(1).nullable().optional().default(null),
  image_prompt: z.string().trim().min(1).nullable().optional().default(null),
  image_overlay_text: z.string().trim().min(1).nullable().optional().default(null),
  carousel_slides: z.array(CarouselSlideSchema).optional().default([]),
  reel_script: z.string().trim().min(1).nullable().optional().default(null),
  recommended_posting_time: z.string().trim().min(1).nullable().optional().default(null)
})

const BlogPostSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1)
})

export class AIService {
  public static async processFabric(fabricId: number): Promise<AIProcessingResult> {
    const db = getDb()

    const rows = await db
      .select({
        id: fabrics.id,
        rawTitle: fabrics.rawTitle,
        rawDescription: fabrics.rawDescription,
        composition: fabrics.composition,
        sourceUrl: fabrics.sourceUrl,
        images: fabrics.images,
        titleEn: fabrics.titleEn,
        titleRu: fabrics.titleRu,
        fabricType: fabrics.fabricType,
        color: fabrics.color,
        gsm: fabrics.gsm,
        supplyType: fabrics.supplyType,
        tags: fabrics.tags,
        descriptionEn: fabrics.descriptionEn,
        descriptionRu: fabrics.descriptionRu
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const rawRow = rows[0]
    if (!rawRow) throw new Error('Fabric not found')

    await db
      .update(fabrics)
      .set({ status: 'ai_processing', updatedAt: sql`now()` })
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))

    /* ── Step 1: Enrichment in English ─────────────── */

    const textPromptRule = await TextPromptRuleService.findMatchingRule({
      fabricType: rawRow.fabricType,
      color: rawRow.color,
      gsm: rawRow.gsm,
      supplyType: rawRow.supplyType
    })

    let messages
    if (textPromptRule?.enrichmentSystemPrompt && textPromptRule?.enrichmentUserTemplate) {
      const vars = TextPromptRuleService.buildFabricVariables({
        titleEn: rawRow.titleEn,
        titleRu: rawRow.titleRu,
        fabricType: rawRow.fabricType,
        color: rawRow.color,
        composition: rawRow.composition ? JSON.stringify(rawRow.composition) : '',
        tags: Array.isArray(rawRow.tags) ? rawRow.tags.join(', ') : '',
        supplyType: rawRow.supplyType,
        descriptionEn: rawRow.descriptionEn,
        descriptionRu: rawRow.descriptionRu,
        sourceUrl: rawRow.sourceUrl,
        gsm: rawRow.gsm,
        images: Array.isArray(rawRow.images) ? rawRow.images.join(', ') : '',
        rawTitle: rawRow.rawTitle ?? '',
        rawDescription: rawRow.rawDescription ?? ''
      })
      const userContent = TextPromptRuleService.substituteVariables(textPromptRule.enrichmentUserTemplate, vars)
      const strictSuffix = '\n\nMANDATORY REQUIREMENT: You MUST generate non-null title_en, description_en, usage_en, tags_en, meta_title_en, meta_description_en, and image_alt_en. If raw product info is brief, compose professional B2B catalog content based on the fabric_type and gsm.'
      messages = [
        { role: 'system' as const, content: (textPromptRule.enrichmentSystemPrompt ?? '') + strictSuffix },
        { role: 'user' as const, content: userContent }
      ]
    } else {
      const rawProduct: RawFabric = {
        id: rawRow.id,
        rawTitle: rawRow.rawTitle ?? null,
        rawDescription: rawRow.rawDescription ?? null,
        composition: (rawRow.composition as FabricCompositionItem[] | null) ?? null,
        sourceUrl: rawRow.sourceUrl ?? null,
        titleRu: rawRow.titleRu ?? null,
        titleEn: rawRow.titleEn ?? null,
        descriptionRu: rawRow.descriptionRu ?? null,
        descriptionEn: rawRow.descriptionEn ?? null,
        fabricType: rawRow.fabricType ?? null,
        color: rawRow.color ?? null,
        gsm: rawRow.gsm ?? null,
        supplyType: rawRow.supplyType ?? null,
        tags: rawRow.tags ?? null,
        images: rawRow.images ?? null
      }
      messages = buildFabricEnrichmentPrompt(rawProduct)
    }

    const rawInlineImages = await fetchImagesAsInlineData(rawRow.images)

    const enText = await callGemini(messages, {
      model: 'gemini-3.6-flash',
      responseFormat: 'json_object',
      maxRetries: 3,
      context: { source: 'enrichment', fabricId },
      inlineImages: rawInlineImages
    })

    let enJson: unknown
    try {
      enJson = JSON.parse(enText)
    } catch {
      throw new Error('Gemini returned invalid JSON (enrichment)')
    }

    const enriched = EnrichedProductSchema.parse(enJson)
    const fabricType = enriched.fabric_type ?? rawRow.fabricType ?? 'Textile Fabric'
    const gsm = enriched.gsm ?? rawRow.gsm ?? null
    const colorEn = enriched.color_en ?? rawRow.color ?? 'Multicolor'
    const supplyTypeEn = enriched.supply_type_en ?? rawRow.supplyType ?? 'In stock in China'
    
    // Smart Title Synthesis if null
    const generatedTitle = `${colorEn !== 'Multicolor' ? colorEn + ' ' : ''}Premium ${fabricType}${gsm ? ` (${gsm} GSM)` : ''}`
    const titleEn = enriched.title_en ?? rawRow.titleEn ?? rawRow.titleRu ?? generatedTitle

    // Smart Description Synthesis if null
    const generatedDesc = `High-quality B2B ${fabricType.toLowerCase()} fabric${gsm ? ` with a weight of ${gsm} GSM` : ''}. Featuring excellent texture, drape, and durability, perfect for fashion garments, apparel production, and commercial textile projects.`
    const descriptionEn = enriched.description_en ?? rawRow.descriptionEn ?? rawRow.descriptionRu ?? generatedDesc

    // Smart Usage Synthesis if null
    const generatedUsage = `Apparel Production, Fashion Garments, Commercial Textiles, ${fabricType} Products`
    const usageEn = enriched.usage_en ?? generatedUsage

    // Smart SEO fields if null
    const metaTitleEn = enriched.meta_title_en ?? `${titleEn} | Wholesale B2B Fabric`
    const metaDescriptionEn = enriched.meta_description_en ?? descriptionEn.slice(0, 155)
    const imageAltEn = enriched.image_alt_en ?? titleEn

    // Smart Tags Synthesis if null or empty
    const defaultTags = [
      fabricType.toLowerCase(),
      `${fabricType.toLowerCase()} fabric`,
      colorEn.toLowerCase(),
      'textile',
      'wholesale',
      'b2b fabric'
    ]
    const tagsEn = normalizeTags(
      enriched.tags_en && enriched.tags_en.length > 0
        ? enriched.tags_en
        : (rawRow.tags && rawRow.tags.length > 0 ? rawRow.tags : defaultTags)
    )

    const enNormalized = {
      ...enriched,
      title_en: titleEn,
      description_en: descriptionEn,
      fabric_type: fabricType,
      gsm,
      width_cm: enriched.width_cm ?? 150,
      moq: enriched.moq ?? 300,
      price_usd: enriched.price_usd ?? null,
      composition: (enriched.composition && enriched.composition.length > 0)
        ? enriched.composition
        : ((rawRow.composition as FabricCompositionItem[] | null) ?? [{ material: fabricType, percentage: 100 }]),
      color_en: colorEn,
      supply_type_en: supplyTypeEn,
      shipment_time_en: enriched.shipment_time_en ?? '15-20 days',
      usage_en: usageEn,
      meta_title_en: metaTitleEn,
      meta_description_en: metaDescriptionEn,
      image_alt_en: imageAltEn,
      tags_en: tagsEn,
      image_urls: enriched.image_urls && enriched.image_urls.length > 0 ? enriched.image_urls : (Array.isArray(rawRow.images) ? rawRow.images : [])
    }

    /* ── Step 2: Translate English → Russian ──────── */

    const trMessages = buildFabricTranslationPrompt({
      title_en: enNormalized.title_en,
      description_en: enNormalized.description_en,
      usage_en: enNormalized.usage_en,
      meta_title_en: enNormalized.meta_title_en,
      meta_description_en: enNormalized.meta_description_en,
      image_alt_en: enNormalized.image_alt_en,
      tags_en: enNormalized.tags_en,
      color_en: enNormalized.color_en,
      supply_type_en: enNormalized.supply_type_en,
      shipment_time_en: enNormalized.shipment_time_en
    })

    const ruText = await callGemini(trMessages, {
      model: 'gemini-3.6-flash',
      responseFormat: 'json_object',
      maxRetries: 3,
      context: { source: 'translation', fabricId }
    })

    let ruJson: unknown
    try {
      ruJson = JSON.parse(ruText)
    } catch {
      throw new Error('Gemini returned invalid JSON (translation)')
    }

    const translation = TranslationResultSchema.parse(ruJson)
    const ruNormalized = {
      title_ru: translation.title_ru ?? enNormalized.title_en ?? null,
      description_ru: translation.description_ru ?? enNormalized.description_en ?? null,
      usage_ru: translation.usage_ru ?? enNormalized.usage_en ?? null,
      meta_title_ru: translation.meta_title_ru ?? translation.title_ru ?? enNormalized.meta_title_en ?? null,
      meta_description_ru: translation.meta_description_ru ?? translation.description_ru ?? enNormalized.meta_description_en ?? null,
      image_alt_ru: translation.image_alt_ru ?? translation.title_ru ?? enNormalized.image_alt_en ?? null,
      tags: translation.tags && translation.tags.length > 0 ? translation.tags : enNormalized.tags_en,
      color: translation.color ?? enNormalized.color_en ?? null,
      supply_type: translation.supply_type ?? enNormalized.supply_type_en ?? null,
      shipment_time: translation.shipment_time ?? enNormalized.shipment_time_en ?? null
    }

    /* ── Step 3: Combine into AIProcessedProduct ──── */

    const combined: AIProcessedProduct = {
      title_en: enNormalized.title_en,
      description_en: enNormalized.description_en,
      title_ru: ruNormalized.title_ru,
      description_ru: ruNormalized.description_ru,
      meta_title_ru: ruNormalized.meta_title_ru,
      meta_description_ru: ruNormalized.meta_description_ru,
      fabric_type: enNormalized.fabric_type,
      gsm: enNormalized.gsm,
      width_cm: enNormalized.width_cm,
      moq: enNormalized.moq,
      price_usd: enNormalized.price_usd,
      composition: enNormalized.composition,
      tags: normalizeTags(ruNormalized.tags ?? []),
      image_urls: enNormalized.image_urls,
      color: ruNormalized.color,
      supply_type: ruNormalized.supply_type,
      shipment_time: ruNormalized.shipment_time,
      usage_ru: ruNormalized.usage_ru,
      usage_en: enNormalized.usage_en,
      meta_title_en: enNormalized.meta_title_en,
      meta_description_en: enNormalized.meta_description_en,
      image_alt_ru: ruNormalized.image_alt_ru,
      image_alt_en: enNormalized.image_alt_en,
      tags_en: enNormalized.tags_en,
      color_en: enNormalized.color_en,
      supply_type_en: enNormalized.supply_type_en,
      shipment_time_en: enNormalized.shipment_time_en
    }

    const confidence01 = completenessScore(combined)
    const mandatoryReview = confidence01 < 0.6

    /* ── Step 4: Store in DB ──────────────────────── */

    try {
      await db.transaction(async (tx) => {
        await tx
          .update(fabrics)
          .set({
            titleEn: combined.title_en,
            ...(combined.title_ru != null ? { titleRu: combined.title_ru } : {}),
            descriptionEn: combined.description_en,
            descriptionRu: combined.description_ru,
            usageRu: combined.usage_ru,
            usageEn: combined.usage_en,
            metaTitleRu: combined.meta_title_ru,
            metaDescriptionRu: combined.meta_description_ru,
            metaTitleEn: combined.meta_title_en,
            metaDescriptionEn: combined.meta_description_en,
            imageAltRu: combined.image_alt_ru,
            imageAltEn: combined.image_alt_en,
            fabricType: combined.fabric_type,
            gsm: combined.gsm,
            widthCm: combined.width_cm,
            moq: combined.moq,
            priceUsd: parsePriceNumeric(combined.price_usd),
            composition: toComposition(combined.composition) as never,
            tags: combined.tags,
            tagsEn: combined.tags_en,
            color: combined.color,
            colorEn: combined.color_en,
            supplyType: combined.supply_type,
            supplyTypeEn: combined.supply_type_en,
            shipmentTime: combined.shipment_time,
            shipmentTimeEn: combined.shipment_time_en,
            aiConfidenceScore: String(confidence01) as never,
            aiProcessedAt: sql`now()`,
            status: 'ai_processed',
            updatedAt: sql`now()`
          })
          .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))

        await tx.insert(fabricActivityLog).values({
          fabricId,
          actorId: null,
          eventType: mandatoryReview ? 'AI_PROCESSED_LOW_CONFIDENCE' : 'AI_PROCESSED',
          message: mandatoryReview ? 'AI processed (low confidence, needs review)' : 'AI processed',
          payload: {
            confidence01,
            mandatoryReview,
            imageUrlsSuggested: combined.image_urls.length
          },
          updatedAt: new Date()
        })
      })
    } catch (err) {
      logger.error('AI processing DB update failed', { fabricId, message: (err as Error | undefined)?.message })
      throw err
    }

    return {
      fabricId,
      confidence01,
      mandatoryReview,
      processed: combined
    }
  }

  public static async generateSocialContentShared(fabricId: number): Promise<SocialContentShared> {
    const db = getDb()
    const rows = await db
      .select({
        id: fabrics.id,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        descriptionRu: fabrics.descriptionRu,
        descriptionEn: fabrics.descriptionEn,
        tags: fabrics.tags,
        images: fabrics.images,
        sourceUrl: fabrics.sourceUrl,
        fabricType: fabrics.fabricType,
        color: fabrics.color,
        gsm: fabrics.gsm,
        widthCm: fabrics.widthCm,
        moq: fabrics.moq,
        priceUsd: fabrics.priceUsd,
        composition: fabrics.composition,
        usageRu: fabrics.usageRu,
        usageEn: fabrics.usageEn,
        supplyType: fabrics.supplyType
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const f = rows[0]
    if (!f) throw new Error('Fabric not found')

    const compStr = Array.isArray(f.composition) && f.composition.length > 0
      ? (f.composition as FabricCompositionItem[]).map((c) => `${c.material} ${c.percentage}%`).join(', ')
      : ''

    const textPromptRule = await TextPromptRuleService.findMatchingRule({
      fabricType: f.fabricType,
      color: f.color,
      gsm: f.gsm,
      supplyType: f.supplyType
    })

    let messages
    if (textPromptRule?.socialSystemPrompt && textPromptRule?.socialUserTemplate) {
      const vars = TextPromptRuleService.buildFabricVariables({
        titleEn: f.titleEn,
        titleRu: f.titleRu,
        fabricType: f.fabricType,
        color: f.color,
        tags: (f.tags ?? []).join(', '),
        supplyType: f.supplyType,
        descriptionEn: f.descriptionEn,
        descriptionRu: f.descriptionRu,
        sourceUrl: f.sourceUrl
      })
      const userContent = TextPromptRuleService.substituteVariables(textPromptRule.socialUserTemplate, vars)
      messages = [
        { role: 'system' as const, content: textPromptRule.socialSystemPrompt },
        { role: 'user' as const, content: userContent }
      ]
    } else {
      messages = [
        {
          role: 'system' as const,
          content:
            'You are a master social media copywriter and content strategist for TkanMarket, a premier B2B fabric sourcing marketplace. Generate platform-agnostic social media content data. ALL CONTENT MUST BE STRICTLY WRITTEN IN ENGLISH ONLY. Always respond with valid JSON only.'
        },
        {
          role: 'user' as const,
          content: [
            `Title (EN): ${f.titleEn ?? f.titleRu ?? ''}`,
            `Fabric Type: ${f.fabricType ?? ''}`,
            `Composition: ${compStr}`,
            `Weight (GSM): ${f.gsm ? `${f.gsm} g/m²` : ''}`,
            `Width: ${f.widthCm ? `${f.widthCm} cm` : ''}`,
            `MOQ: ${f.moq ? `${f.moq} meters` : ''}`,
            `Price: ${f.priceUsd ? `$${f.priceUsd}/m` : ''}`,
            `Color: ${f.color ?? ''}`,
            `Usage: ${f.usageEn ?? f.usageRu ?? ''}`,
            `Supply Type: ${f.supplyType ?? ''}`,
            `Description: ${f.descriptionEn ?? f.descriptionRu ?? ''}`,
            `Tags: ${(f.tags ?? []).join(', ')}`,
            `Source URL: ${f.sourceUrl ?? ''}`,
            `Catalog Image Count: ${(f.images ?? []).length}`,
            '',
            'Return JSON with platform-agnostic social media data:',
            '{',
            '  "post_title": string (Catchy English post headline/hook)',
            '  "call_to_action": string (Clear B2B Call To Action in English)',
            '  "specifications_summary": string (Formatted block of technical specs: Composition, GSM, Width, MOQ, Price)',
            '  "key_features": string[] (3-4 bullet points of fabric benefits in English)',
            '  "target_audience": string (Intended buyer demographic)',
            '  "image_prompt": string (AI image generation prompt for product/lifestyle photoshoot)',
            '  "image_overlay_text": string (Short text graphic overlay for the main post image)',
            '  "recommended_posting_time": string (Suggested posting time)',
            '}'
          ].join('\n')
        }
      ]
    }

    const text = await callGemini(messages, {
      model: 'gemini-3.6-flash',
      responseFormat: 'json_object',
      maxRetries: 3,
      context: { source: 'social', fabricId }
    })
    const json = JSON.parse(text) as unknown
    const parsed = SocialContentSchema.partial().parse(json)

    return {
      postTitle: parsed.post_title ?? null,
      callToAction: parsed.call_to_action ?? null,
      specificationsSummary: parsed.specifications_summary ?? null,
      keyFeatures: Array.isArray(parsed.key_features) ? parsed.key_features : [],
      targetAudience: parsed.target_audience ?? null,
      imagePrompt: parsed.image_prompt ?? null,
      imageOverlayText: parsed.image_overlay_text ?? null,
      carouselSlides: [],
      reelScript: null,
      recommendedPostingTime: parsed.recommended_posting_time ?? null
    }
  }

  public static async generateSocialContent(
    fabricId: number,
    platform: SocialPlatform,
    sharedContent?: SocialContentShared,
    options?: { requireReelScript?: boolean }
  ): Promise<SocialContent> {
    const db = getDb()
    const rows = await db
      .select({
        id: fabrics.id,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        descriptionRu: fabrics.descriptionRu,
        descriptionEn: fabrics.descriptionEn,
        tags: fabrics.tags,
        images: fabrics.images,
        sourceUrl: fabrics.sourceUrl,
        fabricType: fabrics.fabricType,
        color: fabrics.color,
        gsm: fabrics.gsm,
        widthCm: fabrics.widthCm,
        moq: fabrics.moq,
        priceUsd: fabrics.priceUsd,
        composition: fabrics.composition,
        usageRu: fabrics.usageRu,
        usageEn: fabrics.usageEn,
        supplyType: fabrics.supplyType
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const f = rows[0]
    if (!f) throw new Error('Fabric not found')

    const compStr = Array.isArray(f.composition) && f.composition.length > 0
      ? (f.composition as FabricCompositionItem[]).map((c) => `${c.material} ${c.percentage}%`).join(', ')
      : ''

    const textPromptRule = await TextPromptRuleService.findMatchingRule({
      fabricType: f.fabricType,
      color: f.color,
      gsm: f.gsm,
      supplyType: f.supplyType
    })

    // For video/reel posts the response MUST be a complete publish-ready package:
    // every field below is required — no omissions allowed.
    const reelCompletenessHint = options?.requireReelScript
      ? [
          '',
          'THIS IS A VIDEO / REEL POST. Your JSON response MUST include EVERY field below — do not omit or null any of them:',
          '- post_title: a catchy English hook for a video/reel (required)',
          '- caption: a complete ready-to-publish English caption with a strong opening hook, technical specs summary, and a clear B2B call to action (required)',
          '- hashtags: at least 8-15 relevant English B2B textile hashtags (required)',
          '- call_to_action: clear B2B CTA (required)',
          '- specifications_summary: formatted block of Composition, GSM, Width, MOQ, Price (required)',
          '- key_features: 3-4 bullet points of fabric benefits (required)',
          '- target_audience: intended buyer demographic (required)',
          '- image_prompt: an AI image generation prompt for the video thumbnail / cover image — vertical 9:16, dramatic product shot of the fabric (required)',
          '- image_overlay_text: short text graphic overlay (required)',
          '- reel_script: a DETAILED scene-by-scene video script with scene timings in seconds, camera moves, transitions, and on-screen text. This is a video post so reel_script is REQUIRED, never null (required)',
          '- recommended_posting_time (required)'
        ].join('\n')
      : ''

    let messages
    if (textPromptRule?.socialSystemPrompt && textPromptRule?.socialUserTemplate) {
      const vars = TextPromptRuleService.buildFabricVariables({
        titleEn: f.titleEn,
        titleRu: f.titleRu,
        fabricType: f.fabricType,
        color: f.color,
        tags: (f.tags ?? []).join(', '),
        supplyType: f.supplyType,
        descriptionEn: f.descriptionEn,
        descriptionRu: f.descriptionRu,
        sourceUrl: f.sourceUrl
      })
      vars['platform'] = platform
      const userContent = TextPromptRuleService.substituteVariables(textPromptRule.socialUserTemplate, vars)
      messages = [
        { role: 'system' as const, content: textPromptRule.socialSystemPrompt },
        { role: 'user' as const, content: reelCompletenessHint ? `${userContent}\n${reelCompletenessHint}` : userContent }
      ]
    } else {
      const sharedHint = sharedContent
        ? [
            `SHARED CONTENT (do not regenerate these, use as context):`,
            `- Post Title: ${sharedContent.postTitle ?? '(none)'}`,
            `- Call To Action: ${sharedContent.callToAction ?? '(none)'}`,
            `- Specifications Summary: ${sharedContent.specificationsSummary ?? '(none)'}`,
            `- Key Features: ${(sharedContent.keyFeatures ?? []).join(', ') || '(none)'}`,
            `- Target Audience: ${sharedContent.targetAudience ?? '(none)'}`,
            `- Image Prompt: ${sharedContent.imagePrompt ?? '(none)'}`,
            `- Image Overlay Text: ${sharedContent.imageOverlayText ?? '(none)'}`,
            `- Recommended Posting Time: ${sharedContent.recommendedPostingTime ?? '(none)'}`,
            ''
          ].join('\n')
        : ''

      messages = [
        {
          role: 'system' as const,
          content:
            'You are a master social media copywriter and content strategist for TkanMarket, a premier B2B fabric sourcing marketplace connecting textile suppliers with international garment manufacturers, fashion brands, ateliers, and textile wholesalers. ALL CONTENT MUST BE STRICTLY WRITTEN IN ENGLISH ONLY. The "hashtags" field in your JSON response is REQUIRED AND MUST contain at least 5-10 relevant English B2B textile hashtags. Generate complete, highly engaging, professional social media post data including post text, visual image directives/prompts, carousel slide concepts, and MUST include hashtags. Always respond with valid JSON only.'
        },
        {
          role: 'user' as const,
          content: [
            `Platform: ${platform}`,
            `${sharedHint}`,
            `Title (EN): ${f.titleEn ?? f.titleRu ?? ''}`,
            `Fabric Type: ${f.fabricType ?? ''}`,
            `Composition: ${compStr}`,
            `Weight (GSM): ${f.gsm ? `${f.gsm} g/m²` : ''}`,
            `Width: ${f.widthCm ? `${f.widthCm} cm` : ''}`,
            `MOQ: ${f.moq ? `${f.moq} meters` : ''}`,
            `Price: ${f.priceUsd ? `$${f.priceUsd}/m` : ''}`,
            `Color: ${f.color ?? ''}`,
            `Usage: ${f.usageEn ?? f.usageRu ?? ''}`,
            `Supply Type: ${f.supplyType ?? ''}`,
            `Description: ${f.descriptionEn ?? f.descriptionRu ?? ''}`,
            `Tags: ${(f.tags ?? []).join(', ')}`,
            `Source URL: ${f.sourceUrl ?? ''}`,
            `Catalog Image Count: ${(f.images ?? []).length}`,
            '',
            'Return JSON with social media data (strictly in English only):',
            '{',
            '  "post_title": string (Catchy English post headline/hook)',
            '  "caption": string (Complete ready-to-publish English post caption with headline, technical specs summary, bullet highlights, and B2B CTA)',
            '  "hashtags": string[] (REQUIRED: at least 5-10 English B2B textile hashtags)',
            '  "call_to_action": string (Clear B2B Call To Action)',
            '  "specifications_summary": string (Formatted block of technical specs)',
            '  "key_features": string[] (3-4 bullet points of fabric benefits)',
            '  "target_audience": string (Intended buyer demographic)',
            '  "image_prompt": string (AI image generation prompt)',
            '  "image_overlay_text": string (Short text graphic overlay)',
            '  "carousel_slides": Array<{ "slide_number": number, "title": string, "image_description": string }> (Visual layout concept)',
            '  "reel_script": string|null (Detailed video reel / TikTok script, or null if image post)',
            '  "recommended_posting_time": string (Suggested posting time)',
            '}',
            reelCompletenessHint
          ].join('\n')
        }
      ]
    }

    const text = await callGemini(messages, {
      model: 'gemini-3.6-flash',
      responseFormat: 'json_object',
      maxRetries: 3,
      context: { source: 'social', fabricId }
    })
    let json = JSON.parse(text) as unknown
    let parsed = SocialContentSchema.parse(json)

    // For video posts a reel script is mandatory. If the model skipped it, retry
    // once with an explicit demand so the post is always complete.
    if (options?.requireReelScript && !parsed.reel_script) {
      const retryMessages = [
        ...messages,
        {
          role: 'user' as const,
          content:
            'Your previous response was missing the reel_script field, which is REQUIRED for this video/reel post. Re-answer with the full JSON, this time ALWAYS including a complete detailed reel_script (scene-by-scene with timings) and every other field. Never set reel_script to null.'
        }
      ]
      const retryText = await callGemini(retryMessages, {
        model: 'gemini-3.6-flash',
        responseFormat: 'json_object',
        maxRetries: 2,
        context: { source: 'social', fabricId }
      })
      json = JSON.parse(retryText) as unknown
      parsed = SocialContentSchema.parse(json)
    }

    const fabricImages = f.images ?? []

    const aiHashtags = normalizeTags(parsed.hashtags)
    const hashtags = aiHashtags.length > 0
      ? aiHashtags
      : generateDefaultHashtags({
          fabricType: f.fabricType,
          color: f.color,
          tags: f.tags,
          supplyType: f.supplyType
        })

    const shared = sharedContent ?? {
      postTitle: null,
      callToAction: null,
      specificationsSummary: null,
      keyFeatures: [],
      targetAudience: null,
      imagePrompt: null,
      imageOverlayText: null,
      carouselSlides: [],
      reelScript: null,
      recommendedPostingTime: null
    }

    return {
      platform,
      postTitle: parsed.post_title ?? shared.postTitle,
      caption: parsed.caption,
      hashtags,
      callToAction: parsed.call_to_action ?? shared.callToAction,
      specificationsSummary: parsed.specifications_summary ?? shared.specificationsSummary,
      keyFeatures: parsed.key_features.length > 0 ? parsed.key_features : shared.keyFeatures,
      targetAudience: parsed.target_audience ?? shared.targetAudience,
      imagePrompt: parsed.image_prompt ?? shared.imagePrompt ?? (options?.requireReelScript
        ? `Vertical 9:16 cinematic cover shot of ${f.titleEn ?? f.titleRu ?? 'this fabric'}: close-up of the fabric texture and drape in motion, dramatic studio lighting, rich saturated color, premium B2B product showcase.`
        : null),
      imageOverlayText: parsed.image_overlay_text ?? shared.imageOverlayText,
      carouselSlides: parsed.carousel_slides.length > 0
        ? parsed.carousel_slides.map((s) => ({
            slideNumber: s.slide_number,
            title: s.title,
            imageDescription: s.image_description
          }))
        : shared.carouselSlides,
      mediaUrls: fabricImages,
      reelScript: parsed.reel_script ?? shared.reelScript,
      recommendedPostingTime: parsed.recommended_posting_time ?? shared.recommendedPostingTime
    }
  }

  public static async generateSocialContentAll(fabricId: number): Promise<SocialContentByPlatform> {
    const db = getDb()
    const rows = await db
      .select({
        id: fabrics.id,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        descriptionRu: fabrics.descriptionRu,
        descriptionEn: fabrics.descriptionEn,
        tags: fabrics.tags,
        images: fabrics.images,
        sourceUrl: fabrics.sourceUrl,
        fabricType: fabrics.fabricType,
        color: fabrics.color,
        gsm: fabrics.gsm,
        widthCm: fabrics.widthCm,
        moq: fabrics.moq,
        priceUsd: fabrics.priceUsd,
        composition: fabrics.composition,
        usageRu: fabrics.usageRu,
        usageEn: fabrics.usageEn,
        supplyType: fabrics.supplyType
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const f = rows[0]
    if (!f) throw new Error('Fabric not found')

    const compStr = Array.isArray(f.composition) && f.composition.length > 0
      ? (f.composition as FabricCompositionItem[]).map((c) => `${c.material} ${c.percentage}%`).join(', ')
      : ''

    const textPromptRule = await TextPromptRuleService.findMatchingRule({
      fabricType: f.fabricType,
      color: f.color,
      gsm: f.gsm,
      supplyType: f.supplyType
    })

    const allPlatformHint = [
      '',
      'Generate complete, publish-ready social media content for ALL FIVE platforms in ONE JSON response.',
      'Every platform block below is REQUIRED and must contain EVERY field — do not omit or null any of them:',
      '- caption: a complete ready-to-publish English caption with a strong opening hook, technical specs summary, and a clear B2B call to action (required)',
      '- hashtags: at least 8-15 relevant English B2B textile hashtags, adapted to the platform (required)',
      '- post_title: a catchy English post headline/hook (required)',
      '- call_to_action: clear B2B CTA (required)',
      '- specifications_summary: formatted block of Composition, GSM, Width, MOQ, Price (required)',
      '- key_features: 3-4 bullet points of fabric benefits (required)',
      '- target_audience: intended buyer demographic (required)',
      '- image_prompt: an AI image generation prompt for the post image / video thumbnail, adapted to the platform aspect ratio (required)',
      '- image_overlay_text: short text graphic overlay (required)',
      '- carousel_slides: array of slide concepts (required, 0-5 items)',
      '- reel_script: a DETAILED scene-by-scene video script with scene timings in seconds, camera moves, transitions, and on-screen text (required, never null)',
      '- recommended_posting_time: suggested posting time (required)'
    ].join('\n')

    const platformListHint = [...SOCIAL_PLATFORM].map((p) => `  "${p}": { ...full social media content block... }`).join('\n')

    let messages
    if (textPromptRule?.socialSystemPrompt && textPromptRule?.socialUserTemplate) {
      const vars = TextPromptRuleService.buildFabricVariables({
        titleEn: f.titleEn,
        titleRu: f.titleRu,
        fabricType: f.fabricType,
        color: f.color,
        tags: (f.tags ?? []).join(', '),
        supplyType: f.supplyType,
        descriptionEn: f.descriptionEn,
        descriptionRu: f.descriptionRu,
        sourceUrl: f.sourceUrl
      })
      const userContent = TextPromptRuleService.substituteVariables(textPromptRule.socialUserTemplate, vars)
      messages = [
        { role: 'system' as const, content: textPromptRule.socialSystemPrompt },
        { role: 'user' as const, content: `${userContent}\n${allPlatformHint}\n\nRespond with a single JSON object keyed by platform:\n{\n${platformListHint}\n}` }
      ]
    } else {
      messages = [
        {
          role: 'system' as const,
          content:
            'You are a master social media copywriter and content strategist for TkanMarket, a premier B2B fabric sourcing marketplace connecting textile suppliers with international garment manufacturers, fashion brands, ateliers, and textile wholesalers. ALL CONTENT MUST BE STRICTLY WRITTEN IN ENGLISH ONLY. Generate complete, highly engaging, professional social media post data for EVERY platform (INSTAGRAM, TIKTOK, PINTEREST, FACEBOOK, YOUTUBE) adapted to each platform\'s style, tone, and best practices. Always respond with valid JSON only.'
        },
        {
          role: 'user' as const,
          content: [
            `Title (EN): ${f.titleEn ?? f.titleRu ?? ''}`,
            `Fabric Type: ${f.fabricType ?? ''}`,
            `Composition: ${compStr}`,
            `Weight (GSM): ${f.gsm ? `${f.gsm} g/m²` : ''}`,
            `Width: ${f.widthCm ? `${f.widthCm} cm` : ''}`,
            `MOQ: ${f.moq ? `${f.moq} meters` : ''}`,
            `Price: ${f.priceUsd ? `$${f.priceUsd}/m` : ''}`,
            `Color: ${f.color ?? ''}`,
            `Usage: ${f.usageEn ?? f.usageRu ?? ''}`,
            `Supply Type: ${f.supplyType ?? ''}`,
            `Description: ${f.descriptionEn ?? f.descriptionRu ?? ''}`,
            `Tags: ${(f.tags ?? []).join(', ')}`,
            `Source URL: ${f.sourceUrl ?? ''}`,
            `Catalog Image Count: ${(f.images ?? []).length}`,
            '',
            allPlatformHint,
            '',
            'Return a single JSON object with exactly these five keys, each holding a full social media content block:',
            '{',
            platformListHint,
            '}',
            '',
            'Each block shape:',
            '{',
            '  "post_title": string',
            '  "caption": string',
            '  "hashtags": string[]',
            '  "call_to_action": string',
            '  "specifications_summary": string',
            '  "key_features": string[]',
            '  "target_audience": string',
            '  "image_prompt": string',
            '  "image_overlay_text": string',
            '  "carousel_slides": Array<{ "slide_number": number, "title": string, "image_description": string }>',
            '  "reel_script": string',
            '  "recommended_posting_time": string',
            '}'
          ].join('\n')
        }
      ]
    }

    const text = await callGemini(messages, {
      model: 'gemini-3.6-flash',
      responseFormat: 'json_object',
      maxRetries: 3,
      context: { source: 'social', fabricId }
    })
    const json = JSON.parse(text) as Record<string, unknown>

    // Parse each platform block independently. If the model returned a flat
    // (non-per-platform) response, only INSTAGRAM parses and becomes the shared
    // fallback for the remaining platforms — one call, zero extra requests.
    type SocialContentPartial = Partial<z.infer<typeof SocialContentSchema>>
    const blocks: Record<SocialPlatform, SocialContentPartial> = {} as Record<SocialPlatform, SocialContentPartial>
    const instagramParsed = SocialContentSchema.partial().safeParse(json['INSTAGRAM'])
    const fallbackBlock: SocialContentPartial = instagramParsed.success ? instagramParsed.data : {}
    for (const platform of SOCIAL_PLATFORM) {
      const parsed = SocialContentSchema.partial().safeParse(json[platform])
      blocks[platform] = parsed.success ? parsed.data : fallbackBlock
    }

    const fallbackDefaultHashtags = generateDefaultHashtags({
      fabricType: f.fabricType,
      color: f.color,
      tags: f.tags,
      supplyType: f.supplyType
    })

    const result = {} as SocialContentByPlatform

    for (const platform of SOCIAL_PLATFORM) {
      const block = blocks[platform] ?? fallbackBlock
      const aiHashtags = normalizeTags(block.hashtags ?? [])
      const hashtags = aiHashtags.length > 0 ? aiHashtags : fallbackDefaultHashtags
      const carouselSlides = (block.carousel_slides ?? []).map((s) => ({
        slideNumber: s.slide_number,
        title: s.title,
        imageDescription: s.image_description
      }))
      result[platform] = {
        postTitle: block.post_title ?? null,
        caption: block.caption ?? '',
        hashtags,
        callToAction: block.call_to_action ?? null,
        specificationsSummary: block.specifications_summary ?? null,
        keyFeatures: block.key_features ?? [],
        targetAudience: block.target_audience ?? null,
        imagePrompt: block.image_prompt ?? `Vertical 9:16 cinematic cover shot of ${f.titleEn ?? f.titleRu ?? 'this fabric'}: close-up of the fabric texture and drape in motion, dramatic studio lighting, rich saturated color, premium B2B product showcase.`,
        imageOverlayText: block.image_overlay_text ?? null,
        carouselSlides,
        reelScript: block.reel_script ?? null,
        recommendedPostingTime: block.recommended_posting_time ?? null
      }
    }

    return result
  }

  public static async regenerateCarouselSlides(fabricId: number, platform: SocialPlatform, existingContent: SocialContentShared, customPrompt?: string | null): Promise<{ carouselSlides: CarouselSlide[] }> {
    const db = getDb()
    const rows = await db
      .select({
        id: fabrics.id,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        descriptionRu: fabrics.descriptionRu,
        descriptionEn: fabrics.descriptionEn,
        tags: fabrics.tags,
        images: fabrics.images,
        sourceUrl: fabrics.sourceUrl,
        fabricType: fabrics.fabricType,
        color: fabrics.color,
        gsm: fabrics.gsm,
        widthCm: fabrics.widthCm,
        moq: fabrics.moq,
        priceUsd: fabrics.priceUsd,
        composition: fabrics.composition,
        usageRu: fabrics.usageRu,
        usageEn: fabrics.usageEn,
        supplyType: fabrics.supplyType
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const f = rows[0]
    if (!f) throw new Error('Fabric not found')

    const compStr = Array.isArray(f.composition) && f.composition.length > 0
      ? (f.composition as FabricCompositionItem[]).map((c) => `${c.material} ${c.percentage}%`).join(', ')
      : ''

    const textPromptRule = await TextPromptRuleService.findMatchingRule({
      fabricType: f.fabricType,
      color: f.color,
      gsm: f.gsm,
      supplyType: f.supplyType
    })

    const existingSlides = existingContent.carouselSlides?.map((s) => `Slide ${s.slideNumber}: ${s.title} - ${s.imageDescription}`).join('\n') ?? ''

    let messages
    if (textPromptRule?.socialSystemPrompt && textPromptRule?.socialUserTemplate) {
      const vars = TextPromptRuleService.buildFabricVariables({
        titleEn: f.titleEn,
        titleRu: f.titleRu,
        fabricType: f.fabricType,
        color: f.color,
        tags: (f.tags ?? []).join(', '),
        supplyType: f.supplyType,
        descriptionEn: f.descriptionEn,
        descriptionRu: f.descriptionRu,
        sourceUrl: f.sourceUrl
      })
      vars['platform'] = platform
      const userContent = TextPromptRuleService.substituteVariables(textPromptRule.socialUserTemplate, vars)
      messages = [
        { role: 'system' as const, content: textPromptRule.socialSystemPrompt },
        { role: 'user' as const, content: customPrompt ? `${userContent}\n\nEditor direction for this carousel:\n${customPrompt}` : userContent }
      ]
    } else {
      messages = [
        {
          role: 'system' as const,
          content:
            'You are a master social media visual designer for TkanMarket. Generate ONLY carousel slide visual layout concepts. ALL CONTENT MUST BE IN ENGLISH ONLY. Always respond with valid JSON only.'
        },
        {
          role: 'user' as const,
          content: [
            `Platform: ${platform}`,
            `Title (EN): ${f.titleEn ?? f.titleRu ?? ''}`,
            `Fabric Type: ${f.fabricType ?? ''}`,
            `Composition: ${compStr}`,
            `Color: ${f.color ?? ''}`,
            `Tags: ${(f.tags ?? []).join(', ')}`,
            `Existing Carousel Slides (regenerate these with fresh visual concepts):`,
            existingSlides || '(none)',
            customPrompt ? `\nEditor direction for this carousel:\n${customPrompt}` : '',
            '',
            'Return JSON with ONLY carousel slide data:',
            '{',
            '  "carousel_slides": Array<{ "slide_number": number, "title": string, "image_description": string }>',
            '}'
          ].join('\n')
        }
      ]
    }

    const text = await callGemini(messages, {
      model: 'gemini-3.6-flash',
      responseFormat: 'json_object',
      maxRetries: 3,
      context: { source: 'social', fabricId }
    })
    const json = JSON.parse(text) as unknown
    const parsed = z.object({ carousel_slides: z.array(CarouselSlideSchema).optional().default([]) }).parse(json)

    return {
      carouselSlides: parsed.carousel_slides.map((s) => ({
        slideNumber: s.slide_number,
        title: s.title,
        imageDescription: s.image_description
      }))
    }
  }

  public static async regenerateImageConcept(fabricId: number, platform: SocialPlatform, existingContent: SocialContentShared, customPrompt?: string | null): Promise<{ imagePrompt: string | null; imageOverlayText: string | null }> {
    const db = getDb()
    const rows = await db
      .select({
        id: fabrics.id,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        descriptionRu: fabrics.descriptionRu,
        descriptionEn: fabrics.descriptionEn,
        tags: fabrics.tags,
        images: fabrics.images,
        sourceUrl: fabrics.sourceUrl,
        fabricType: fabrics.fabricType,
        color: fabrics.color,
        gsm: fabrics.gsm,
        widthCm: fabrics.widthCm,
        moq: fabrics.moq,
        priceUsd: fabrics.priceUsd,
        composition: fabrics.composition,
        usageRu: fabrics.usageRu,
        usageEn: fabrics.usageEn,
        supplyType: fabrics.supplyType
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const f = rows[0]
    if (!f) throw new Error('Fabric not found')

    const compStr = Array.isArray(f.composition) && f.composition.length > 0
      ? (f.composition as FabricCompositionItem[]).map((c) => `${c.material} ${c.percentage}%`).join(', ')
      : ''

    const textPromptRule = await TextPromptRuleService.findMatchingRule({
      fabricType: f.fabricType,
      color: f.color,
      gsm: f.gsm,
      supplyType: f.supplyType
    })

    let messages
    if (textPromptRule?.socialSystemPrompt && textPromptRule?.socialUserTemplate) {
      const vars = TextPromptRuleService.buildFabricVariables({
        titleEn: f.titleEn,
        titleRu: f.titleRu,
        fabricType: f.fabricType,
        color: f.color,
        tags: (f.tags ?? []).join(', '),
        supplyType: f.supplyType,
        descriptionEn: f.descriptionEn,
        descriptionRu: f.descriptionRu,
        sourceUrl: f.sourceUrl
      })
      vars['platform'] = platform
      const userContent = TextPromptRuleService.substituteVariables(textPromptRule.socialUserTemplate, vars)
      messages = [
        { role: 'system' as const, content: textPromptRule.socialSystemPrompt },
        { role: 'user' as const, content: customPrompt ? `${userContent}\n\nEditor direction for this image concept:\n${customPrompt}` : userContent }
      ]
    } else {
      messages = [
        {
          role: 'system' as const,
          content:
            'You are a master visual creative director for TkanMarket. Generate ONLY image/visual media concepts and prompts. ALL CONTENT MUST BE IN ENGLISH ONLY. Always respond with valid JSON only.'
        },
        {
          role: 'user' as const,
          content: [
            `Platform: ${platform}`,
            `Title (EN): ${f.titleEn ?? f.titleRu ?? ''}`,
            `Fabric Type: ${f.fabricType ?? ''}`,
            `Composition: ${compStr}`,
            `Color: ${f.color ?? ''}`,
            `Tags: ${(f.tags ?? []).join(', ')}`,
            `Existing Image Prompt: ${existingContent.imagePrompt ?? '(none)'}`,
            `Existing Image Overlay Text: ${existingContent.imageOverlayText ?? '(none)'}`,
            customPrompt ? `\nEditor direction for this image concept:\n${customPrompt}` : '',
            '',
            'Regenerate FRESH visual media concepts. Return JSON:',
            '{',
            '  "image_prompt": string (AI image generation prompt for product/lifestyle photoshoot)',
            '  "image_overlay_text": string (Short text graphic overlay for the main post image)',
            '}'
          ].join('\n')
        }
      ]
    }

    const text = await callGemini(messages, {
      model: 'gemini-3.6-flash',
      responseFormat: 'json_object',
      maxRetries: 3,
      context: { source: 'social', fabricId }
    })
    const json = JSON.parse(text) as unknown
    const parsed = z.object({
      image_prompt: z.string().trim().min(1).nullable().optional().default(null),
      image_overlay_text: z.string().trim().min(1).nullable().optional().default(null)
    }).parse(json)

    return {
      imagePrompt: parsed.image_prompt,
      imageOverlayText: parsed.image_overlay_text
    }
  }

  public static async regenerateReelScript(fabricId: number, platform: SocialPlatform, existingContent: SocialContentShared, customPrompt?: string | null): Promise<{ reelScript: string | null }> {
    const db = getDb()
    const rows = await db
      .select({
        id: fabrics.id,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        descriptionRu: fabrics.descriptionRu,
        descriptionEn: fabrics.descriptionEn,
        tags: fabrics.tags,
        images: fabrics.images,
        sourceUrl: fabrics.sourceUrl,
        fabricType: fabrics.fabricType,
        color: fabrics.color,
        gsm: fabrics.gsm,
        widthCm: fabrics.widthCm,
        moq: fabrics.moq,
        priceUsd: fabrics.priceUsd,
        composition: fabrics.composition,
        usageRu: fabrics.usageRu,
        usageEn: fabrics.usageEn,
        supplyType: fabrics.supplyType
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const f = rows[0]
    if (!f) throw new Error('Fabric not found')

    const compStr = Array.isArray(f.composition) && f.composition.length > 0
      ? (f.composition as FabricCompositionItem[]).map((c) => `${c.material} ${c.percentage}%`).join(', ')
      : ''

    const textPromptRule = await TextPromptRuleService.findMatchingRule({
      fabricType: f.fabricType,
      color: f.color,
      gsm: f.gsm,
      supplyType: f.supplyType
    })

    const existingScript = existingContent.reelScript ?? '(none)'

    let messages
    if (textPromptRule?.socialSystemPrompt && textPromptRule?.socialUserTemplate) {
      const vars = TextPromptRuleService.buildFabricVariables({
        titleEn: f.titleEn,
        titleRu: f.titleRu,
        fabricType: f.fabricType,
        color: f.color,
        tags: (f.tags ?? []).join(', '),
        supplyType: f.supplyType,
        descriptionEn: f.descriptionEn,
        descriptionRu: f.descriptionRu,
        sourceUrl: f.sourceUrl
      })
      vars['platform'] = platform
      const userContent = TextPromptRuleService.substituteVariables(textPromptRule.socialUserTemplate, vars)
      messages = [
        { role: 'system' as const, content: textPromptRule.socialSystemPrompt },
        { role: 'user' as const, content: customPrompt ? `${userContent}\n\nEditor direction for this reel/video script:\n${customPrompt}` : userContent }
      ]
    } else {
      messages = [
        {
          role: 'system' as const,
          content:
            'You are a master video scriptwriter for TkanMarket. Generate ONLY video reel/scripts. ALL CONTENT MUST BE IN ENGLISH ONLY. Always respond with valid JSON only.'
        },
        {
          role: 'user' as const,
          content: [
            `Platform: ${platform}`,
            `Title (EN): ${f.titleEn ?? f.titleRu ?? ''}`,
            `Fabric Type: ${f.fabricType ?? ''}`,
            `Composition: ${compStr}`,
            `Color: ${f.color ?? ''}`,
            `Tags: ${(f.tags ?? []).join(', ')}`,
            `Existing Reel Script (regenerate with fresh visual shots and narration):`,
            existingScript,
            customPrompt ? `\nEditor direction for this reel/video script:\n${customPrompt}` : '',
            '',
            'Return JSON with ONLY reel script:',
            '{',
            '  "reel_script": string|null (Detailed video reel script with visual shots and English narration, or null if image post)',
            '}'
          ].join('\n')
        }
      ]
    }

    const text = await callGemini(messages, {
      model: 'gemini-3.6-flash',
      responseFormat: 'json_object',
      maxRetries: 3,
      context: { source: 'social', fabricId }
    })
    const json = JSON.parse(text) as unknown
    const parsed = z.object({ reel_script: z.string().trim().min(1).nullable().optional().default(null) }).parse(json)

    return {
      reelScript: parsed.reel_script
    }
  }

  public static async generateBlogPost(fabricId: number): Promise<{ title: string; content: string }> {
    const db = getDb()
    const rows = await db
      .select({
        id: fabrics.id,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        descriptionRu: fabrics.descriptionRu,
        descriptionEn: fabrics.descriptionEn,
        tags: fabrics.tags,
        fabricType: fabrics.fabricType,
        color: fabrics.color,
        gsm: fabrics.gsm,
        supplyType: fabrics.supplyType
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const f = rows[0]
    if (!f) throw new Error('Fabric not found')

    const textPromptRule = await TextPromptRuleService.findMatchingRule({
      fabricType: f.fabricType,
      color: f.color,
      gsm: f.gsm,
      supplyType: f.supplyType
    })

    let messages
    if (textPromptRule?.blogSystemPrompt && textPromptRule?.blogUserTemplate) {
      const vars = TextPromptRuleService.buildFabricVariables({
        titleEn: f.titleEn,
        titleRu: f.titleRu,
        fabricType: f.fabricType,
        color: f.color,
        tags: (f.tags ?? []).join(', '),
        supplyType: f.supplyType,
        descriptionEn: f.descriptionEn,
        descriptionRu: f.descriptionRu
      })
      const userContent = TextPromptRuleService.substituteVariables(textPromptRule.blogUserTemplate, vars)
      messages = [
        { role: 'system' as const, content: textPromptRule.blogSystemPrompt },
        { role: 'user' as const, content: userContent }
      ]
    } else {
      messages = [
        {
          role: 'system' as const,
          content: 'You are a B2B textile content writer. Write all content in English. Always respond with valid JSON only, no other text.'
        },
        {
          role: 'user' as const,
          content: [
            'Write a helpful blog post for buyers about this fabric.',
            `Title EN: ${f.titleEn ?? ''}`,
            `Description EN: ${f.descriptionEn ?? ''}`,
            `Tags: ${(f.tags ?? []).join(', ')}`,
            '',
            'Return JSON:',
            '{ "title": string, "content": string }'
          ].join('\n')
        }
      ]
    }

    const text = await callGemini(messages, {
      model: 'gemini-3.6-flash',
      responseFormat: 'json_object',
      maxRetries: 3,
      context: { source: 'blog', fabricId }
    })
    const json = JSON.parse(text) as unknown
    const parsed = BlogPostSchema.parse(json)
    return parsed
  }
}
