import type { ChatMessage, RawFabric } from '@/types/ai.types'

export function buildFabricEnrichmentPrompt(rawProduct: RawFabric): ChatMessage[] {
  const system: ChatMessage = {
    role: 'system',
    content: [
      'You are an elite B2B textile product catalog enrichment AI. Your task is to analyze raw fabric product data and generate complete, high-converting, professional B2B product specifications and SEO metadata.',
      'All output must be in English. Always respond with valid JSON only, no other text or markdown formatting.',
      'IMPORTANT RULES FOR GENERATION AND ENRICHMENT:',
      '1. NEVER return null for title_en, description_en, fabric_type, tags_en, supply_type_en, usage_en, meta_title_en, meta_description_en, or image_alt_en. If raw data is sparse or missing, INFER and GENERATE rich, professional textile industry content based on fabric_type, gsm, texture, composition, and B2B catalog standards.',
      '2. title_en: Create a professional B2B title including fabric type, GSM, color/texture (e.g. "Premium 350 GSM 3D Embroidered Lace Fabric").',
      '3. description_en: Write a comprehensive 2-3 paragraph B2B product description highlighting weave structure, texture, drape, durability, suitable garment applications, and wholesale appeal.',
      '4. fabric_type: Identify or infer the exact fabric classification (e.g. "Lace", "Cotton Jersey", "Velvet", "Satin", "Chiffon", "Denim", etc.).',
      '5. gsm & width_cm & moq & price_usd: Extract explicit numbers if present. If missing, infer realistic industry standards (e.g. standard width 140-150cm, MOQ 300-500 meters).',
      '6. composition: Extract or infer material blend (e.g. [{ material: "Polyester", percentage: 100 }]).',
      '7. tags_en: Provide 6-10 relevant lowercase B2B textile tags (e.g. ["lace", "3d lace", "embroidered", "eveningwear", "textiles", "wholesale"]).',
      '8. color_en: Identify or infer the primary color (e.g. "White", "Black", "Off-White", "Multicolor").',
      '9. usage_en: List primary garment/textile uses (e.g. "Evening wear, Bridal dresses, Haute couture, Fashion apparel").',
      '10. meta_title_en, meta_description_en, image_alt_en: Provide fully optimized B2B SEO metadata.'
    ].join(' ')
  }

  const user: ChatMessage = {
    role: 'user',
    content: [
      'Analyze and enrich the following raw fabric product data into a complete B2B product catalog item in JSON:',
      '',
      'Raw title:',
      rawProduct.rawTitle ?? rawProduct.titleEn ?? rawProduct.titleRu ?? '',
      '',
      'Raw description:',
      rawProduct.rawDescription ?? rawProduct.descriptionEn ?? rawProduct.descriptionRu ?? '',
      '',
      'Raw composition (if available):',
      rawProduct.composition ? JSON.stringify(rawProduct.composition) : '',
      '',
      'Source URL:',
      rawProduct.sourceUrl ?? '',
      '',
      'Existing attributes:',
      `  fabric_type: ${rawProduct.fabricType ?? ''}`,
      `  color_en: ${rawProduct.color ?? ''}`,
      `  gsm: ${rawProduct.gsm ?? ''}`,
      `  supply_type_en: ${rawProduct.supplyType ?? ''}`,
      `  tags_en: ${rawProduct.tags ? rawProduct.tags.join(', ') : ''}`,
      '',
      'Return JSON matching this exact structure:',
      '{',
      '  "title_en": "string",',
      '  "description_en": "string",',
      '  "fabric_type": "string",',
      '  "gsm": number,',
      '  "width_cm": number,',
      '  "moq": number,',
      '  "price_usd": "string",',
      '  "composition": [{"material": "string", "percentage": number}],',
      '  "tags_en": ["string"],',
      '  "image_urls": ["string"],',
      '  "color_en": "string",',
      '  "supply_type_en": "string",',
      '  "shipment_time_en": "string",',
      '  "usage_en": "string",',
      '  "meta_title_en": "string",',
      '  "meta_description_en": "string",',
      '  "image_alt_en": "string"',
      '}'
    ].join('\n')
  }

  return [system, user]
}
