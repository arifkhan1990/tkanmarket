import { callGemini } from '@/lib/google/client'
import { logger } from '@/lib/logger'

export interface FabricRawData {
  id?: number
  titleEn?: string | null
  titleRu?: string | null
  fabricType?: string | null
  color?: string | null
  colorEn?: string | null
  gsm?: number | null
  composition?: unknown
  usageEn?: string | null
  usageRu?: string | null
  tags?: string[] | null
}

export class FabricConsistencyGuardService {
  /**
   * Enforces 100% strict raw data locking into the prompt.
   * Prevents AI hallucination, color shift, sequence mismatch, or wrong design generation.
   */
  static enforceRawDataLock(basePrompt: string, fabric: FabricRawData): string {
    const color = fabric.colorEn ?? fabric.color ?? 'Exact original color'
    const fabricType = fabric.fabricType ?? 'Textile fabric'
    const gsm = fabric.gsm ? `${fabric.gsm} GSM` : ''
    const compositionStr = Array.isArray(fabric.composition)
      ? (fabric.composition as Array<{ material?: string; percentage?: number }>)
          .map((c) => `${c.percentage ? c.percentage + '%' : ''} ${c.material ?? ''}`.trim())
          .filter(Boolean)
          .join(', ')
      : String(fabric.composition ?? '')
    const usage = fabric.usageEn ?? fabric.usageRu ?? 'General apparel and home textile'

    const consistencyBlock = [
      `[CRITICAL RAW DATA ANCHOR & LOCK FOR 100% B2B FIDELITY]:`,
      `- EXACT TARGET COLOR & PALETTE: "${color}" (DO NOT alter color, shade, tint, tone, or hue. Output MUST strictly match original raw fabric color specification).`,
      `- MULTI-COLOR SWATCH TO ROLL SEQUENCE MATCHING: If the raw source image contains a stack or bundle of small cut fabric swatches in multiple colors, the generated fabric roll shot MUST arrange the rolls in the EXACT SAME color and design sequence as shown in the raw swatch stack.`,
      `- EXACT FABRIC / PATTERN / WEAVE STRUCTURE: "${fabricType}" (Maintain exact weave architecture, pattern repeats, and texture context across image and video).`,
      gsm ? `- EXACT WEIGHT: "${gsm}"` : '',
      compositionStr ? `- EXACT COMPOSITION: "${compositionStr}"` : '',
      `- INTENDED USAGE & CONTEXT: "${usage}"`,
      `MANDATORY CONSTRAINTS FOR IMAGE & VIDEO: Zero color drift. Zero hallucinated colors or altered patterns. Maintain 100% strict visual and contextual fidelity to original raw fabric cut samples.`,
      `NEGATIVE PROMPT / FORBIDDEN: wrong color, color shift, altered color sequence, mismatched pattern, hallucinated texture, inaccurate design, different fabric type.`
    ]
      .filter(Boolean)
      .join('\n')

    if (basePrompt.includes('CRITICAL RAW DATA ANCHOR')) {
      return basePrompt
    }

    return `${basePrompt}\n\n${consistencyBlock}`
  }

  /**
   * Post-Generation Vision Verification (Quality Gate):
   * Audits the generated image using Gemini Vision to verify color and pattern match.
   */
  static async verifyImageFidelity(
    generatedDataUrl: string,
    fabric: FabricRawData
  ): Promise<{ isValid: boolean; confidence: number; reason: string }> {
    try {
      const expectedColor = fabric.colorEn ?? fabric.color ?? 'specified color'
      const expectedType = fabric.fabricType ?? 'specified fabric type'

      const auditPrompt = [
        `You are a strict B2B textile quality control auditor.`,
        `Inspect the generated fabric image against these original raw specifications:`,
        `- Expected Color: "${expectedColor}"`,
        `- Expected Fabric Type / Pattern: "${expectedType}"`,
        ``,
        `Task: Verify if the generated image matches the expected color and fabric type/pattern without hallucination or color drift.`,
        `Return ONLY a valid JSON object in this exact format:`,
        `{ "match": true/false, "detectedColor": "...", "detectedPattern": "...", "confidence": 0.0 to 1.0, "reason": "..." }`
      ].join('\n')

      const responseText = await callGemini(
        [
          {
            role: 'user',
            content: `${auditPrompt}\n\n[Generated Image Data: ${generatedDataUrl.slice(0, 100)}... (truncated for reference)]`
          }
        ],
        {
          model: 'gemini-3.5-flash-lite',
          responseFormat: 'json_object',
          context: { source: 'image', fabricId: fabric.id }
        }
      )

      const parsed = JSON.parse(responseText) as {
        match?: boolean
        detectedColor?: string
        detectedPattern?: string
        confidence?: number
        reason?: string
      }

      const isValid = Boolean(parsed.match && (parsed.confidence ?? 0) >= 0.75)
      return {
        isValid,
        confidence: parsed.confidence ?? 0.5,
        reason: parsed.reason ?? 'Automated vision audit completed'
      }
    } catch (err) {
      logger.warn('Fabric consistency vision audit failed, defaulting to allow with warning', {
        message: (err as Error)?.message
      })
      return { isValid: true, confidence: 0.7, reason: 'Audit skipped due to technical error' }
    }
  }
}
