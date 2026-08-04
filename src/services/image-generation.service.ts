import { and, eq, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { generatedMedia } from '@/db/schema/generated-media.schema'
import { fabricActivityLog } from '@/db/schema/fabric-activity-log.schema'
import { generateGeminiImage } from '@/lib/google/client'
import { filterFabricGalleryImageUrls } from '@/lib/fabric-gallery-image-urls'
import { uploadFromUrl, uploadBuffer } from '@/lib/storage/r2'
import { logger } from '@/lib/logger'
import { PromptRuleService } from '@/services/admin/prompt-rule.service'
import { EliteImagePromptService } from '@/services/elite-image-prompt.service'
import { FabricConsistencyGuardService } from '@/services/fabric-consistency-guard.service'
import type { PromptRule } from '@/types/prompt-rules'

const FALLBACK_PROMPT =
  'Create a professional product photo of this fabric on a white background. Show the texture and drape clearly. Studio lighting, high resolution, e-commerce style.'

const MAX_REFERENCE_IMAGES = 3

async function fetchImagesAsInlineData(imageUrls: string[] | null): Promise<string[]> {
  if (!imageUrls || imageUrls.length === 0) return []

  const valid = filterFabricGalleryImageUrls(imageUrls)
  const selected = valid.slice(0, MAX_REFERENCE_IMAGES)
  const results: string[] = []

  for (const url of selected) {
    try {
      if (url.startsWith('data:')) {
        results.push(url)
        continue
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000)
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      if (!response.ok) continue

      const contentType = response.headers.get('content-type') ?? 'image/jpeg'
      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      results.push(`data:${contentType};base64,${base64}`)
    } catch {
      // skip failed fetches
    }
  }

  return results
}

export class ImageGenerationService {
  static async generateBatchForFabric(fabricId: number): Promise<Array<{ mediaId: number; storageUrl: string }>> {
    const db = getDb()

    const rows = await db
      .select({
        id: fabrics.id,
        titleEn: fabrics.titleEn,
        titleRu: fabrics.titleRu,
        fabricType: fabrics.fabricType,
        color: fabrics.color,
        colorEn: fabrics.colorEn,
        gsm: fabrics.gsm,
        composition: fabrics.composition,
        tags: fabrics.tags,
        supplyType: fabrics.supplyType,
        usageRu: fabrics.usageRu,
        usageEn: fabrics.usageEn,
        descriptionEn: fabrics.descriptionEn,
        descriptionRu: fabrics.descriptionRu,
        images: fabrics.images
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const fabric = rows[0]
    if (!fabric) throw new Error('Fabric not found')

    const compositionStr = Array.isArray(fabric.composition)
      ? (fabric.composition as Array<{ material?: string }>).map((c) => c.material ?? '').filter(Boolean).join(', ')
      : ''
    const tagsStr = Array.isArray(fabric.tags) ? fabric.tags.join(', ') : ''

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

    const elitePrompts = EliteImagePromptService.generatePrompts({
      titleEn: fabric.titleEn,
      titleRu: fabric.titleRu,
      fabricType: fabric.fabricType,
      gsm: fabric.gsm,
      color: fabric.color,
      colorEn: fabric.colorEn,
      composition: fabric.composition as Array<{ material: string; percentage: number }> | null,
      usageRu: fabric.usageRu,
      usageEn: fabric.usageEn,
      descriptionRu: fabric.descriptionRu,
      descriptionEn: fabric.descriptionEn,
      tags: fabric.tags
    })

    const hasExplicitRule = rule && rule.conditions.length > 0 && rule.imagePrompts.length > 0
    let imagePromptConfigs = hasExplicitRule
      ? PromptRuleService.compilePrompts(rule, fabricVars).imagePrompts
      : elitePrompts

    const promptMeta = {
      ruleId: rule?.id ?? null,
      ruleName: hasExplicitRule ? (rule?.name ?? 'default') : 'elite-prompt-engine'
    }

    const inputImages = await fetchImagesAsInlineData(fabric.images)

    const tasks: Array<{ config: typeof imagePromptConfigs[number]; index: number }> = []
    for (const config of imagePromptConfigs) {
      for (let i = 0; i < config.count; i++) {
        tasks.push({ config, index: i })
      }
    }

    const settled = await Promise.allSettled(
      tasks.map((t) => {
        const lockedPrompt = FabricConsistencyGuardService.enforceRawDataLock(t.config.prompt, fabric)
        return this.generateSingleImage(fabricId, lockedPrompt, fabric, {
          ruleId: promptMeta.ruleId,
          ruleName: promptMeta.ruleName,
          promptType: t.config.type,
          promptLabel: t.config.label,
          batchIndex: t.index,
          inputImages
        })
      })
    )

    const results: Array<{ mediaId: number; storageUrl: string }> = []
    const errors: string[] = []
    for (const s of settled) {
      if (s.status === 'fulfilled') results.push(s.value)
      else errors.push(s.reason?.message ?? 'Unknown error')
    }

    await db.insert(fabricActivityLog).values({
      fabricId,
      actorId: null,
      eventType: 'IMAGE_BATCH_GENERATED',
      message: `Batch image generation completed: ${results.length}/${tasks.length} images using rule: ${promptMeta.ruleName}`,
      payload: { count: results.length, total: tasks.length, errors, ruleId: promptMeta.ruleId, ruleName: promptMeta.ruleName },
      updatedAt: new Date()
    })

    if (errors.length > 0) {
      logger.warn('Batch image generation had errors', { fabricId, errors })
    }

    if (results.length > 0) {
      const primaryUrl = results[0]?.storageUrl
      if (primaryUrl) {
        const existingImages = fabric.images ?? []
        const updatedImages = [primaryUrl, ...existingImages.filter((u) => u !== primaryUrl)]
        await db
          .update(fabrics)
          .set({ images: updatedImages, updatedAt: sql`now()` })
          .where(eq(fabrics.id, fabricId))
        logger.info('Primary fabric image updated from AI generation', { fabricId, url: primaryUrl })
      }
    }

    return results
  }

  private static async generateSingleImage(
    fabricId: number,
    prompt: string,
    fabric: {
      color?: string | null
      colorEn?: string | null
      fabricType?: string | null
      gsm?: number | null
      composition?: unknown
      usageEn?: string | null
      usageRu?: string | null
    },
    meta: {
      ruleId: number | null
      ruleName: string
      promptType: string
      promptLabel: string
      batchIndex: number
      inputImages?: string[]
    }
  ): Promise<{ mediaId: number; storageUrl: string }> {
    const db = getDb()

    const [inserted] = await db
      .insert(generatedMedia)
      .values({
        fabricId,
        type: 'image',
        mediaType: `IMAGE_${meta.promptType.toUpperCase()}`,
        prompt,
        status: 'PENDING',
        provider: 'gemini',
        providerModel: 'gemini-3.1-flash-image',
        metadata: {
          ruleId: meta.ruleId,
          ruleName: meta.ruleName,
          promptType: meta.promptType,
          promptLabel: meta.promptLabel,
          batchIndex: meta.batchIndex
        }
      })
      .returning()

    if (!inserted) throw new Error('Failed to create media record')
    const mediaId = inserted.id

    try {
      const urls = await generateGeminiImage(prompt, { inputImages: meta.inputImages, context: { source: 'image', fabricId } })
      const sourceUri = urls[0] ?? ''

      // Vision AI Quality Gate audit
      const audit = await FabricConsistencyGuardService.verifyImageFidelity(sourceUri, fabric)
      if (!audit.isValid) {
        logger.warn('Fabric consistency audit flagged potential mismatch', { fabricId, mediaId, reason: audit.reason, confidence: audit.confidence })
      }

      await db
        .update(generatedMedia)
        .set({ url: sourceUri, status: 'COMPLETED', updatedAt: sql`now()` })
        .where(eq(generatedMedia.id, mediaId))

      let storageUrl: string = sourceUri
      if (sourceUri) {
        try {
          if (sourceUri.startsWith('data:')) {
            const base64Data = sourceUri.split(',')[1]
            if (base64Data) {
              const buffer = Buffer.from(base64Data, 'base64')
              const key = `fabrics/${fabricId}/generated/${mediaId}.png`
              const r2Url = await uploadBuffer(buffer, key, 'image/png')
              if (r2Url) storageUrl = r2Url
            }
          } else {
            const key = `fabrics/${fabricId}/generated/${mediaId}.png`
            const r2Url = await uploadFromUrl(sourceUri, key)
            if (r2Url) storageUrl = r2Url
          }

          if (storageUrl !== sourceUri) {
            await db
              .update(generatedMedia)
              .set({ url: storageUrl, updatedAt: sql`now()` })
              .where(eq(generatedMedia.id, mediaId))
          }
        } catch (storageErr) {
          logger.warn('R2 upload failed, keeping source URI', { mediaId, message: (storageErr as Error)?.message })
        }
      }

      return { mediaId, storageUrl }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      await db
        .update(generatedMedia)
        .set({ status: 'FAILED', errorMessage: message, updatedAt: sql`now()` })
        .where(eq(generatedMedia.id, mediaId))
      throw err
    }
  }

  static async generateForFabric(fabricId: number, customPrompt?: string): Promise<{ mediaId: number; storageUrl: string }> {
    const db = getDb()

    const rows = await db
      .select({
        id: fabrics.id,
        titleEn: fabrics.titleEn,
        titleRu: fabrics.titleRu,
        fabricType: fabrics.fabricType,
        color: fabrics.color,
        colorEn: fabrics.colorEn,
        gsm: fabrics.gsm,
        composition: fabrics.composition,
        tags: fabrics.tags,
        supplyType: fabrics.supplyType,
        usageRu: fabrics.usageRu,
        usageEn: fabrics.usageEn,
        descriptionEn: fabrics.descriptionEn,
        descriptionRu: fabrics.descriptionRu,
        images: fabrics.images
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const fabric = rows[0]
    if (!fabric) throw new Error('Fabric not found')

    let prompt = customPrompt
    let matchedRule: PromptRule | null = null
    let promptType = 'custom'
    let promptLabel = 'Custom Prompt'
    if (!prompt) {
      const compositionStr = Array.isArray(fabric.composition)
        ? (fabric.composition as Array<{ material?: string }>).map((c) => c.material ?? '').filter(Boolean).join(', ')
        : ''
      const tagsStr = Array.isArray(fabric.tags) ? fabric.tags.join(', ') : ''

      matchedRule = await PromptRuleService.findMatchingRuleByData({
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

      if (matchedRule && matchedRule.conditions.length > 0 && matchedRule.imagePrompts.length > 0) {
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
        prompt = PromptRuleService.compilePrompts(matchedRule, fabricVars).imagePrompts[0]?.prompt ?? `${FALLBACK_PROMPT} Fabric: ${fabric.titleEn ?? fabric.titleRu ?? 'Unknown'}`
      } else {
        const elitePrompts = EliteImagePromptService.generatePrompts({
          titleEn: fabric.titleEn,
          titleRu: fabric.titleRu,
          fabricType: fabric.fabricType,
          gsm: fabric.gsm,
          color: fabric.color,
          colorEn: fabric.colorEn,
          composition: fabric.composition as Array<{ material: string; percentage: number }> | null,
          usageRu: fabric.usageRu,
          usageEn: fabric.usageEn,
          descriptionRu: fabric.descriptionRu,
          descriptionEn: fabric.descriptionEn,
          tags: fabric.tags
        })
        prompt = elitePrompts[0]?.prompt ?? `${FALLBACK_PROMPT} Fabric: ${fabric.titleEn ?? fabric.titleRu ?? 'Unknown'}`
        promptType = elitePrompts[0]?.type ?? 'fabricRoll'
        promptLabel = elitePrompts[0]?.label ?? 'Elite Fabric Roll Shot'
      }
    } else {
      prompt = `${prompt} [System Rule: ${PromptRuleService.FABRIC_CONSISTENCY_INSTRUCTION}]`
    }

    const lockedPrompt = FabricConsistencyGuardService.enforceRawDataLock(prompt, fabric)
    const inputImages = await fetchImagesAsInlineData(fabric.images)

    const result = await this.generateSingleImage(fabricId, lockedPrompt, fabric, {
      ruleId: matchedRule?.id ?? null,
      ruleName: matchedRule?.name ?? (customPrompt ? 'custom' : 'elite-prompt-engine'),
      promptType,
      promptLabel,
      batchIndex: 0,
      inputImages
    })

    if (result.storageUrl) {
      const existingImages = fabric.images ?? []
      const updatedImages = [result.storageUrl, ...existingImages.filter((u) => u !== result.storageUrl)]
      await db
        .update(fabrics)
        .set({ images: updatedImages, updatedAt: sql`now()` })
        .where(eq(fabrics.id, fabricId))
      logger.info('Primary fabric image updated from AI generation', { fabricId, url: result.storageUrl })
    }

    return result
  }

  static async getByFabric(fabricId: number) {
    const db = getDb()
    return db
      .select()
      .from(generatedMedia)
      .where(and(eq(generatedMedia.fabricId, fabricId), eq(generatedMedia.type, 'image'), isNull(generatedMedia.deletedAt)))
      .orderBy(generatedMedia.createdAt)
  }
}
