import type { ChatMessage } from '@/types/ai.types'

export type EnrichedFields = {
  title_en: string | null
  description_en: string | null
  usage_en: string | null
  meta_title_en: string | null
  meta_description_en: string | null
  image_alt_en: string | null
  tags_en: string[]
  color_en: string | null
  supply_type_en: string | null
  shipment_time_en: string | null
}

export function buildFabricTranslationPrompt(enFields: EnrichedFields): ChatMessage[] {
  const system: ChatMessage = {
    role: 'system',
    content: [
      'You are a professional Russian translator specializing in textiles and the B2B fabric industry.',
      'Translate the following English fabric product data into Russian.',
      'Use accurate textile terminology. For shipment_time, keep the numeric format (e.g., "15-20 days" → "15-20 дней").',
      'Always respond with valid JSON only, no other text.'
    ].join(' ')
  }

  const user: ChatMessage = {
    role: 'user',
    content: [
      'Translate these English fabric fields into Russian. Return JSON only.',
      '',
      `title_en: ${enFields.title_en ?? ''}`,
      `description_en: ${enFields.description_en ?? ''}`,
      `usage_en: ${enFields.usage_en ?? ''}`,
      `meta_title_en: ${enFields.meta_title_en ?? ''}`,
      `meta_description_en: ${enFields.meta_description_en ?? ''}`,
      `image_alt_en: ${enFields.image_alt_en ?? ''}`,
      `tags_en: ${enFields.tags_en.join(', ')}`,
      `color_en: ${enFields.color_en ?? ''}`,
      `supply_type_en: ${enFields.supply_type_en ?? ''}`,
      `shipment_time_en: ${enFields.shipment_time_en ?? ''}`,
      '',
      'Return JSON matching this exact structure (keys required):',
      '{',
      '  "title_ru": string|null,',
      '  "description_ru": string|null,',
      '  "usage_ru": string|null,',
      '  "meta_title_ru": string|null,',
      '  "meta_description_ru": string|null,',
      '  "image_alt_ru": string|null,',
      '  "tags": string[],',
      '  "color": string|null,',
      '  "supply_type": string|null,',
      '  "shipment_time": string|null',
      '}'
    ].join('\n')
  }

  return [system, user]
}
