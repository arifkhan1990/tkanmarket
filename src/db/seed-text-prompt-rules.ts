import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from './index'
import { fabricTextPromptRules } from './schema'
import { logger } from '../lib/logger'

const DEFAULT_RULES = [
  {
    name: 'Silk & Luxury Fabrics — Premium Enrichment',
    description: 'High-quality enrichment for silk, cashmere, velvet, satin, brocade, organza, chiffon. Uses premium terminology: momme weight, micron count, pile height.',
    priority: 10,
    isActive: true,
    conditions: [
      { field: 'fabricType', operator: 'in' as const, value: ['silk', 'cashmere', 'velvet', 'satin', 'brocade', 'organza', 'chiffon'] }
    ],
    enrichmentSystemPrompt: 'You are a luxury textile expert specializing in silk, cashmere, and premium fabrics for B2B buyers. Use precise technical terminology: momme weight for silk, micron count for cashmere, pile height for velvet. Always include care instructions and end-use applications. Always respond with valid JSON only, no other text.',
    enrichmentUserTemplate: 'Analyze this luxury fabric and return structured data:\n\nRaw title: {title_en}\nRaw description: {description_en}\nComposition: {composition}\nSource: {source_url}\n\nReturn JSON with: title_en, description_en (mention momme/micron/pile, drape, hand-feel, luster, end uses like bridal/evening/luxury home), meta_title_ru, meta_description_ru, fabric_type, gsm, width_cm, moq, price_usd, composition [{material, percentage}], tags (include luxury/premium/bridal/evening), image_urls.',
    socialSystemPrompt: 'You are a luxury textile social media copywriter. Create aspirational B2B content for premium fabrics. Use elegant, sophisticated tone. Highlight exclusivity, craftsmanship, and end-use glamour. Always respond with valid JSON only.',
    socialUserTemplate: 'Create social content for this luxury fabric:\nTitle: {title_ru} / {title_en}\nType: {fabric_type}\nColor: {color}\nTags: {tags}\nPlatform: {platform}\n\nReturn JSON: { "caption": "...", "hashtags": [...], "reel_script": "..." }',
    blogSystemPrompt: 'You are a luxury textile journalist writing for B2B buyers. Deep technical knowledge, elegant prose. Cover history, production, quality markers, sourcing tips.',
    blogUserTemplate: 'Write a blog post about: {title_ru} / {title_en}\nFabric type: {fabric_type}\nComposition: {composition}\nTags: {tags}\n\nReturn JSON: { "title": "...", "content": "..." }'
  },
  {
    name: 'Cotton & Linen — Technical Enrichment',
    description: 'Technical enrichment for cotton, linen, hemp, bamboo, tencel, modal, rayon. Focuses on thread count, weave structure, weight (GSM), shrinkage, certifications (GOTS, Oeko-Tex).',
    priority: 20,
    isActive: true,
    conditions: [
      { field: 'fabricType', operator: 'in' as const, value: ['cotton', 'linen', 'hemp', 'bamboo', 'tencel', 'modal', 'rayon'] }
    ],
    enrichmentSystemPrompt: 'You are a technical textile specialist for natural fibers. Focus on thread count, weave structure, weight (GSM), shrinkage, certifications (GOTS, Oeko-Tex), sustainability metrics. B2B technical tone. Always respond with valid JSON only.',
    enrichmentUserTemplate: 'Analyze this natural fiber fabric:\n\nRaw title: {title_en}\nRaw description: {description_en}\nComposition: {composition}\nSource: {source_url}\n\nReturn JSON with: title_en (include fiber, weave, weight), description_en (thread count, GSM, shrinkage %, certifications, sustainability, end uses like shirting/bedding/workwear), meta_title_ru, meta_description_ru, fabric_type, gsm, width_cm, moq, price_usd, composition [{material, percentage}], tags (natural/sustainable/breathable/certified), image_urls.',
    socialSystemPrompt: 'B2B natural fiber copywriter. Emphasize sustainability, certifications, technical performance, versatility. Professional, informative tone.',
    socialUserTemplate: 'Social content for natural fiber fabric:\nTitle: {title_ru} / {title_en}\nType: {fabric_type}\nGSM: {gsm}\nColor: {color}\nTags: {tags}\nPlatform: {platform}\n\nReturn JSON: { "caption": "...", "hashtags": [...], "reel_script": "..." }',
    blogSystemPrompt: 'Technical textile writer for natural fibers. Cover fiber properties, weave types, certifications, sourcing regions, care.',
    blogUserTemplate: 'Blog about: {title_ru} / {title_en}\nType: {fabric_type}\nGSM: {gsm}\nComposition: {composition}\n\nReturn JSON: { "title": "...", "content": "..." }'
  },
  {
    name: 'Synthetics & Performance — Cost-Optimized Enrichment',
    description: 'Enrichment for polyester, nylon, spandex, elastane, acrylic, polyamide, microfiber, fleece, mesh, tricot. Focuses on denier, stretch %, moisture management, abrasion resistance, cost-efficiency.',
    priority: 30,
    isActive: true,
    conditions: [
      { field: 'fabricType', operator: 'in' as const, value: ['polyester', 'nylon', 'spandex', 'elastane', 'acrylic', 'polyamide', 'microfiber', 'fleece', 'mesh', 'tricot'] }
    ],
    enrichmentSystemPrompt: 'You are a performance textile specialist for synthetics and blends. Focus on: denier, filament count, stretch %, recovery, moisture-wicking, abrasion resistance (Martindale), pilling resistance, colorfastness, cost-efficiency. B2B technical-commercial tone. Always respond with valid JSON only.',
    enrichmentUserTemplate: 'Analyze this performance/synthetic fabric:\n\nRaw title: {title_en}\nRaw description: {description_en}\nComposition: {composition}\nSource: {source_url}\n\nReturn JSON with: title_en (include denier, stretch, application), description_en (polymer type, denier, stretch %/recovery, moisture management, abrasion rating, pilling grade, colorfastness, end uses like sportswear/swimwear/activewear/industrial), meta_title_ru, meta_description_ru, fabric_type, gsm, width_cm, moq, price_usd, composition [{material, percentage}], tags (performance/stretch/moisture-wicking/durable/cost-effective), image_urls.',
    socialSystemPrompt: 'Performance fabric B2B copywriter. Highlight technical specs, cost advantage, MOQ flexibility, quick turnaround. Direct, benefit-driven tone.',
    socialUserTemplate: 'Performance fabric social content:\nTitle: {title_ru} / {title_en}\nType: {fabric_type}\nGSM: {gsm}\nTags: {tags}\nColor: {color}\nPlatform: {platform}\n\nReturn JSON: { "caption": "...", "hashtags": [...], "reel_script": "..." }',
    blogSystemPrompt: 'Technical writer for synthetic performance fabrics. Cover polymer science, knit vs woven, finish technologies, cost structures, sourcing.',
    blogUserTemplate: 'Blog about performance fabric: {title_ru} / {title_en}\nType: {fabric_type}\nComposition: {composition}\nTags: {tags}\n\nReturn JSON: { "title": "...", "content": "..." }'
  }
]

export async function seedTextPromptRules(): Promise<number> {
  const db = getDb()

  let processed = 0
  for (const rule of DEFAULT_RULES) {
    const existing = await db
      .select({ id: fabricTextPromptRules.id })
      .from(fabricTextPromptRules)
      .where(and(eq(fabricTextPromptRules.name, rule.name), isNull(fabricTextPromptRules.deletedAt)))
      .limit(1)

    if (existing[0]?.id) {
      await db
        .update(fabricTextPromptRules)
        .set({
          description: rule.description,
          priority: rule.priority,
          isActive: rule.isActive,
          conditions: rule.conditions as never,
          enrichmentSystemPrompt: rule.enrichmentSystemPrompt,
          enrichmentUserTemplate: rule.enrichmentUserTemplate,
          socialSystemPrompt: rule.socialSystemPrompt,
          socialUserTemplate: rule.socialUserTemplate,
          blogSystemPrompt: rule.blogSystemPrompt,
          blogUserTemplate: rule.blogUserTemplate,
          updatedAt: new Date()
        })
        .where(eq(fabricTextPromptRules.id, existing[0].id))
    } else {
      await db.insert(fabricTextPromptRules).values({
        name: rule.name,
        description: rule.description,
        priority: rule.priority,
        isActive: rule.isActive,
        conditions: rule.conditions as never,
        enrichmentSystemPrompt: rule.enrichmentSystemPrompt,
        enrichmentUserTemplate: rule.enrichmentUserTemplate,
        socialSystemPrompt: rule.socialSystemPrompt,
        socialUserTemplate: rule.socialUserTemplate,
        blogSystemPrompt: rule.blogSystemPrompt,
        blogUserTemplate: rule.blogUserTemplate
      })
    }
    processed++
  }

  logger.info('Text prompt rules seeded/upserted safely', { count: processed })
  return processed
}
