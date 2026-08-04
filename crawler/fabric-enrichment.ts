import type { OpenAI } from 'openai'

interface RawFabricInput {
  rawTitle:       string
  rawDescription: string
  rawComposition: string
  sourceUrl?:     string
  supplierName?:  string
}

// ============================================================
// Build the fabric enrichment prompt
// Returns messages array for OpenAI chat completion
// ============================================================
export function buildFabricEnrichmentPrompt(
  raw: RawFabricInput,
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    {
      role:    'system',
      content: `You are an expert textile product data specialist. Analyze raw fabric product data from Chinese suppliers and extract/generate structured information for a Russian/CIS B2B marketplace.

CRITICAL: Respond ONLY with valid JSON. No markdown, no explanations, no extra text.

JSON structure required:
{
  "titleRu": "string (max 120 chars, professional Russian name)",
  "titleEn": "string (max 120 chars, English name)",
  "descriptionRu": "string (150-300 words, professional Russian description for B2B buyers)",
  "descriptionEn": "string (optional, English version)",
  "metaTitleRu": "string (max 60 chars, SEO title in Russian)",
  "metaDescriptionRu": "string (max 155 chars, SEO description in Russian)",
  "fabricType": "woven|knit|nonwoven|lace|lining|technical|other",
  "composition": [{"material": "string", "percentage": number}],
  "gsm": number|null,
  "widthCm": number|null,
  "tags": ["string"],
  "confidenceScore": number (0.0-1.0, how confident you are in the extraction)
}

For composition: extract percentages accurately. If total != 100%, normalize.
For tags: include material names in Russian, use cases (одежда, постельное бельё, etc.), season if applicable.
For confidenceScore: 0.9+ if all specs clearly stated, 0.6-0.8 if partially inferred, below 0.6 if mostly guessed.`,
    },
    {
      role:    'user',
      content: `Analyze this fabric product and return structured JSON:

ORIGINAL TITLE: ${raw.rawTitle}

DESCRIPTION: ${raw.rawDescription || 'Not provided'}

COMPOSITION/SPECS: ${raw.rawComposition || 'Not provided'}

SUPPLIER: ${raw.supplierName || 'Unknown'}

SOURCE: ${raw.sourceUrl || 'Unknown'}`,
    },
  ]
}

// ============================================================
// Build social content generation prompt
// ============================================================
export function buildSocialContentPrompt(
  fabric: {
    titleRu:      string
    descriptionRu: string | null
    tags:         string[] | null
    gsm:          number | null
    composition:  { material: string; percentage: number }[] | null
  },
  platform: string,
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const platformInstructions: Record<string, string> = {
    INSTAGRAM: 'Instagram post. Caption max 2200 chars. 30 hashtags. Include emojis. Engaging, visual language.',
    TIKTOK:    'TikTok video script + caption. Script 15-30 seconds spoken. Caption max 150 chars. 5 hashtags. Trendy, fast-paced.',
    PINTEREST: 'Pinterest pin description. Max 500 chars. SEO-focused. No hashtags. Describe the fabric visually.',
    FACEBOOK:  'Facebook post. Max 500 chars. Professional B2B tone. 3-5 hashtags.',
  }

  return [
    {
      role:    'system',
      content: `You are a social media content creator for TkanMarket, a B2B fabric marketplace targeting Russian and CIS textile buyers. Create engaging content in Russian.

Respond ONLY with valid JSON:
{
  "captionText": "string",
  "hashtags": ["string"],
  "scriptText": "string|null (only for video platforms)",
  "callToAction": "string"
}`,
    },
    {
      role:    'user',
      content: `Create ${platform} content for this fabric:

NAME: ${fabric.titleRu}
COMPOSITION: ${fabric.composition?.map(c => `${c.material} ${c.percentage}%`).join(', ') || 'Не указано'}
GSM: ${fabric.gsm ?? 'Не указано'}
TAGS: ${fabric.tags?.join(', ') || 'Не указано'}

Platform instructions: ${platformInstructions[platform] || 'General social media post in Russian.'}`,
    },
  ]
}
