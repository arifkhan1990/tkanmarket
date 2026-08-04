import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { fabricActivityLog } from '@/db/schema/fabric-activity-log.schema'
import { callGemini } from '@/lib/google/client'
import { logger } from '@/lib/logger'

export interface TranslationResult {
  fabricId: number
  translatedFields: string[]
  sourceLang: 'ru' | 'en'
}

const TranslatedFieldsSchema = z.object({
  title_ru: z.string().trim().min(1).nullable(),
  title_en: z.string().trim().min(1).nullable(),
  title: z.string().trim().min(1).nullable(),
  description_ru: z.string().trim().min(1).nullable(),
  description_en: z.string().trim().min(1).nullable(),
  description: z.string().trim().min(1).nullable(),
  usage_ru: z.string().trim().min(1).nullable(),
  usage_en: z.string().trim().min(1).nullable(),
  usage: z.string().trim().min(1).nullable(),
  color: z.string().trim().min(1).nullable(),
  color_en: z.string().trim().min(1).nullable(),
  supply_type: z.string().trim().min(1).nullable(),
  supply_type_en: z.string().trim().min(1).nullable(),
  shipment_time: z.string().trim().min(1).nullable(),
  shipment_time_en: z.string().trim().min(1).nullable(),
  tags: z.array(z.string().trim().min(1)).nullable(),
  tags_en: z.array(z.string().trim().min(1)).nullable()
})

function buildRecoveryPrompt(
  missingFields: string[],
  fabric: {
    rawTitle: string | null
    rawDescription: string | null
    sourceUrl: string | null
  }
): { missingTargets: string[]; messages: Array<{ role: 'system' | 'user'; content: string }> } {
  const sourceVal = [
    fabric.rawTitle ? `Raw title: ${fabric.rawTitle}` : '',
    fabric.rawDescription ? `Raw description: ${fabric.rawDescription}` : '',
    fabric.sourceUrl ? `Source URL: ${fabric.sourceUrl}` : ''
  ].filter(Boolean).join('\n\n')

  if (!sourceVal) return { missingTargets: [], messages: [] }

  const fieldList = missingFields.map((f) => `  "${f}": string | null`).join(',\n')

  const fieldHints: Record<string, string> = {
    color: 'For color, look for any color words in the raw title and description (e.g., "red", "blue", "green", "white", "black", "navy", "beige", "pink", "yellow", "orange", "purple", "brown", "gray", "silver", "gold"). Analyze the product name and title carefully for color hints.',
    fabric_type: 'For fabric_type, look for material type keywords in the raw title and description (e.g., "cotton", "polyester", "silk", "wool", "linen", "denim", "chiffon", "satin", "twill", "jersey", "lace").',
    shipment_time: 'For shipment_time, look for delivery/lead-time mentions in the raw title and description (e.g., "15-20 days", "7 days", "1 month").',
    supply_type: 'For supply_type, look for product type and use hints in the raw title and description.',
    usage: 'For usage, look for product use-case mentions in the raw title, description, and category context.',
    title: 'For title, generate a clean English product title from the raw title. Capitalize properly and include key product identifiers.',
    description: 'For description, generate a clean English product description from the raw description. Include material composition, dimensions, and use case if mentioned in raw data.'
  }

  const fieldHintsSection = missingFields.map((f) => {
    const hint = fieldHints[f] ?? 'Extract this field from the raw data if possible.'
    return `- ${f}: ${hint}`
  }).join('\n')

  const systemMsg = [
    'You are an expert textile product data specialist.',
    'Extract specific fields from raw product data and generate accurate English values.',
    'For each field, provide the best possible value based on the raw data available.',
    'Always respond with valid JSON only, no other text.'
  ].join(' ')

  const userMsg = [
    'Extract the following fields from the raw product data below. Return null for any field that truly cannot be determined.',
    '',
    sourceVal,
    '',
    'Field extraction guidance:',
    fieldHintsSection,
    '',
    'Return JSON matching this exact structure:',
    '{',
    fieldList,
    '}'
  ].join('\n')

  return {
    missingTargets: missingFields,
    messages: [
      { role: 'system', content: systemMsg },
      { role: 'user', content: userMsg }
    ]
  }
}

function buildTranslationPrompt(
  sourceLang: 'ru' | 'en',
  missingFields: string[],
  fabric: {
    titleRu: string | null
    titleEn: string | null
    descriptionRu: string | null
    descriptionEn: string | null
    usageRu: string | null
    usageEn: string | null
    color: string | null
    colorEn: string | null
    supplyType: string | null
    supplyTypeEn: string | null
    shipmentTime: string | null
    shipmentTimeEn: string | null
    tags: string[] | null
    tagsEn: string[] | null
    composition: unknown
  }
): { missingTargets: string[]; messages: Array<{ role: 'system' | 'user'; content: string }> } {
  const targetLang = sourceLang === 'ru' ? 'en' : 'ru'
  const sourceFields: string[] = []
  const missingTargets: string[] = []

  for (const field of missingFields) {
    const sourceKey = sourceLang === 'ru' ? field : field.replace(/_en$/, '').replace(/_ru$/, '')
    const sourceVal = sourceLang === 'ru'
      ? getFieldValue(fabric, `${field}_ru` as keyof typeof fabric) ?? getFieldValue(fabric, field as keyof typeof fabric)
      : getFieldValue(fabric, (field.endsWith('_en') ? field : `${field}_en`) as keyof typeof fabric) ?? getFieldValue(fabric, field as keyof typeof fabric)

    if (sourceVal) {
      sourceFields.push(`${field}: ${String(sourceVal)}`)
      missingTargets.push(field)
    }
  }

  if (missingTargets.length === 0) return { missingTargets: [], messages: [] }

  const systemMsg = [
    `You are a textile industry translator specializing in Russian ↔ English.`,
    `Translate the following fabric fields from ${sourceLang === 'ru' ? 'Russian' : 'English'} to ${targetLang === 'ru' ? 'Russian' : 'English'}.`,
    `Preserve all technical textile terminology, measurements, and material compositions accurately.`,
    `Return valid JSON only — no markdown, no extra text.`,
    `If a field cannot be translated (e.g., color names, proprietary names), transliterate it.`
  ].join(' ')

  const userMsg = [
    `Translate the following fabric fields from ${sourceLang.toUpperCase()} to ${targetLang.toUpperCase()}:`,
    '',
    ...sourceFields,
    '',
    `Return JSON schema:`,
    `{ ${missingTargets.map((f) => `"${f}": string | null`).join(', ')} }`
  ].join('\n')

  return {
    missingTargets,
    messages: [
      { role: 'system', content: systemMsg },
      { role: 'user', content: userMsg }
    ]
  }
}

function getFieldValue(obj: Record<string, unknown>, key: string): unknown {
  return key in obj ? obj[key] : null
}

export class FabricTranslationService {

  static async ensureBilingual(fabricId: number): Promise<TranslationResult | null> {
    const db = getDb()

    const rows = await db
      .select({
        id: fabrics.id,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        descriptionRu: fabrics.descriptionRu,
        descriptionEn: fabrics.descriptionEn,
        usageRu: fabrics.usageRu,
        usageEn: fabrics.usageEn,
        color: fabrics.color,
        colorEn: fabrics.colorEn,
        supplyType: fabrics.supplyType,
        supplyTypeEn: fabrics.supplyTypeEn,
        shipmentTime: fabrics.shipmentTime,
        shipmentTimeEn: fabrics.shipmentTimeEn,
        tags: fabrics.tags,
        tagsEn: fabrics.tagsEn,
        composition: fabrics.composition,
        rawTitle: fabrics.rawTitle,
        rawDescription: fabrics.rawDescription,
        sourceUrl: fabrics.sourceUrl
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const fabric = rows[0]
    if (!fabric) {
      logger.warn('Translation skipped — fabric not found', { fabricId })
      return null
    }

    const ruFields: Record<string, string | null> = {
      title_ru: fabric.titleRu,
      description_ru: fabric.descriptionRu,
      usage_ru: fabric.usageRu,
      color: fabric.color,
      supply_type: fabric.supplyType,
      shipment_time: fabric.shipmentTime
    }

    const enFields: Record<string, string | string[] | null> = {
      title_en: fabric.titleEn,
      description_en: fabric.descriptionEn,
      usage_en: fabric.usageEn,
      color_en: fabric.colorEn,
      supply_type_en: fabric.supplyTypeEn,
      shipment_time_en: fabric.shipmentTimeEn
    }

    const hasRuData = Object.values(ruFields).some((v) => v !== null && v.trim().length > 0)
    const hasEnData = Object.values(enFields).some((v) => v !== null && (typeof v === 'string' ? v.trim().length > 0 : v.length > 0))

    /* ── Recovery: generate missing fields from raw data ── */
    const recoveryFields: string[] = []
    if (!hasRuData && !hasEnData) {
      const rawTitle = fabric.rawTitle ?? ''
      const rawDescription = fabric.rawDescription ?? ''
      const sourceUrl = fabric.sourceUrl ?? ''

      if (rawTitle.trim() || rawDescription.trim() || sourceUrl.trim()) {
        for (const [key, enKey] of [
          ['title', 'title_en'],
          ['description', 'description_en'],
          ['usage', 'usage_en'],
          ['color', 'color_en'],
          ['supply_type', 'supply_type_en'],
          ['shipment_time', 'shipment_time_en']
        ] as [string, string][]) {
          if (!(ruFields[key] && ruFields[key]!.trim().length > 0) &&
              !(enFields[enKey] && enFields[enKey] && typeof enFields[enKey] === 'string' && enFields[enKey]!.trim().length > 0)) {
            recoveryFields.push(key)
          }
        }
      }
    }

    const missingEn: string[] = []
    for (const [key, val] of Object.entries(ruFields)) {
      const enKey = key === 'color' ? 'color_en' : key === 'supply_type' ? 'supply_type_en' : key === 'shipment_time' ? 'shipment_time_en' : key.replace('_ru', '_en')
      if (val && val.trim().length > 0 && (!(enKey in enFields) || !enFields[enKey as keyof typeof enFields])) {
        missingEn.push(enKey)
      }
    }

    if (fabric.tags && fabric.tags.length > 0 && (!fabric.tagsEn || fabric.tagsEn.length === 0)) {
      missingEn.push('tags_en')
    }

    const missingRu: string[] = []
    for (const [key, val] of Object.entries(enFields)) {
      const ruKey = key.replace('_en', '_ru') === 'color__ru' ? 'color' : key.replace('_en', '_ru')
      const actualRuKey = ruKey as keyof typeof ruFields
      if (val && (typeof val === 'string' ? val.trim().length > 0 : val.length > 0) && (!(actualRuKey in ruFields) || !ruFields[actualRuKey])) {
        missingRu.push(ruKey === 'color' ? 'color' : key.replace('_en', '_ru'))
      }
    }

    if (fabric.tagsEn && fabric.tagsEn.length > 0 && (!fabric.tags || fabric.tags.length === 0)) {
      missingRu.push('tags')
    }

    let sourceLang: 'ru' | 'en'
    let fieldsToTranslate: string[]
    let isRecovery = false

    if (missingEn.length > 0) {
      sourceLang = 'ru'
      fieldsToTranslate = missingEn
    } else if (missingRu.length > 0) {
      sourceLang = 'en'
      fieldsToTranslate = missingRu
    } else if (recoveryFields.length > 0) {
      isRecovery = true
      sourceLang = 'en'
      fieldsToTranslate = recoveryFields
    } else {
      return null
    }

    const { messages } = isRecovery
      ? buildRecoveryPrompt(fieldsToTranslate, fabric)
      : buildTranslationPrompt(sourceLang, fieldsToTranslate, fabric)
    if (messages.length === 0) return null

    try {
      const text = await callGemini(messages, {
        model: 'gemini-3.6-flash',
        responseFormat: 'json_object',
        maxRetries: 3,
        context: { source: 'translation', fabricId }
      })

      let parsedJson: unknown
      try {
        parsedJson = JSON.parse(text)
      } catch {
        throw new Error('Gemini returned invalid JSON during translation')
      }

      const translated = TranslatedFieldsSchema.partial().parse(parsedJson)

      const updateData: Record<string, unknown> = {}
      const actuallyTranslated: string[] = []

      for (const field of fieldsToTranslate) {
        const value = translated[field as keyof typeof translated]
        if (value !== null && value !== undefined) {
          const dbKey = isRecovery
            ? (field === 'title' ? 'titleEn' as const
              : field === 'description' ? 'descriptionEn' as const
              : field === 'usage' ? 'usageEn' as const
              : field === 'color' ? 'colorEn' as const
              : field === 'supply_type' ? 'supplyTypeEn' as const
              : field === 'shipment_time' ? 'shipmentTimeEn' as const
              : field === 'tags' ? 'tags' as const
              : field === 'tags_en' ? 'tagsEn' as const
              : `${field.charAt(0).toUpperCase()}${field.slice(1).replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}` as never)
            : field === 'tags' ? 'tags' as const
            : field === 'tags_en' ? 'tagsEn' as const
            : field === 'color' ? 'color' as const
            : field === 'color_en' ? 'colorEn' as const
            : field === 'supply_type' ? 'supplyType' as const
            : field === 'supply_type_en' ? 'supplyTypeEn' as const
            : field === 'shipment_time' ? 'shipmentTime' as const
            : field === 'shipment_time_en' ? 'shipmentTimeEn' as const
            : `${field.charAt(0).toUpperCase()}${field.slice(1).replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}` as never
          if (dbKey === 'tags' || dbKey === 'tagsEn') {
            updateData[dbKey] = value as string[]
          } else {
            updateData[dbKey] = String(value).trim() || null
          }
          actuallyTranslated.push(field)
        }
      }

      if (actuallyTranslated.length === 0) {
        logger.warn('Translation produced no usable fields', { fabricId })
        return null
      }

      await db.transaction(async (tx) => {
        await tx
          .update(fabrics)
          .set({
            ...updateData,
            updatedAt: sql`now()`
          } as Record<string, unknown>)
          .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))

        await tx.insert(fabricActivityLog).values({
          fabricId,
          actorId: null,
          eventType: 'FABRIC_UPDATED',
          message: `Auto-translated: ${actuallyTranslated.join(', ')} (${sourceLang} → ${sourceLang === 'ru' ? 'en' : 'ru'})`,
          payload: { translatedFields: actuallyTranslated, sourceLang },
          updatedAt: new Date()
        })
      })

      return { fabricId, translatedFields: actuallyTranslated, sourceLang }
    } catch (err) {
      logger.error('Fabric translation failed', { fabricId, message: err instanceof Error ? err.message : String(err) })
      throw err
    }
  }
}
