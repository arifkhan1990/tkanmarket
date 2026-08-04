import type { ChatMessage, RawFabric } from '@/types/ai.types'

export function buildFabricEnrichmentPrompt(rawProduct: RawFabric): ChatMessage[] {
  const system: ChatMessage = {
    role: 'system',
    content: [
      'You are an expert textile product data specialist. Your task is to analyze raw fabric product data from Chinese suppliers and extract/generate structured information.',
      'All output must be in English. Always respond with valid JSON only, no other text.',
      'Extract color from the product title, description, and any available images. Do not skip color even if it is not obvious — analyze the raw text carefully for hints like "red", "blue", "green", "white", "black", "yellow", "orange", "purple", "pink", "brown", "gray", "navy", "beige", etc.',
      'For fabric_type, look for keywords like "cotton", "polyester", "silk", "wool", "linen", "denim", "chiffon", "satin", "lace", "twill", "jersey", "organza", etc. in the raw title or description.',
      'For shipment_time, infer from any delivery/lead-time mentions in the raw data.'
    ].join(' ')
  }

  const user: ChatMessage = {
    role: 'user',
    content: [
      'Analyze the following raw fabric product and return JSON only with ALL required fields populated.',
      '',
      'Raw title:',
      rawProduct.rawTitle ?? '',
      '',
      'Raw description:',
      rawProduct.rawDescription ?? '',
      '',
      'Raw composition (if available):',
      rawProduct.composition ? JSON.stringify(rawProduct.composition) : '',
      '',
      'Source URL:',
      rawProduct.sourceUrl ?? '',
      '',
      'Existing data:',
      `  title_en: ${rawProduct.titleEn ?? ''}`,
      `  description_en: ${rawProduct.descriptionEn ?? ''}`,
      `  fabric_type: ${rawProduct.fabricType ?? ''}`,
      `  color_en: ${rawProduct.color ?? ''}`,
      `  gsm: ${rawProduct.gsm ?? ''}`,
      `  supply_type_en: ${rawProduct.supplyType ?? ''}`,
      `  tags_en: ${rawProduct.tags ? rawProduct.tags.join(', ') : ''}`,
      '',
      'IMPORTANT: Extract EVERY field from the raw data. For color, look at the title, description, and any color words or product names. For shipment_time, look for delivery estimates. For fabric_type, identify the material type from the raw text.',
      '',
      'Return JSON matching this exact structure (keys required):',
      '{',
      '  "title_en": string|null,',
      '  "description_en": string|null,',
      '  "fabric_type": string|null,',
      '  "gsm": number|null,',
      '  "width_cm": number|null,',
      '  "moq": number|null,',
      '  "price_usd": string|null,',
      '  "composition": Array<{ material: string; percentage: number }> | null,',
      '  "tags_en": string[],',
      '  "image_urls": string[],',
      '  "color_en": string|null,',
      '  "supply_type_en": string|null,',
      '  "shipment_time_en": string|null,',
      '  "usage_en": string|null,',
      '  "meta_title_en": string|null,',
      '  "meta_description_en": string|null,',
      '  "image_alt_en": string|null',
      '}'
    ].join('\n')
  }

  return [system, user]
}
