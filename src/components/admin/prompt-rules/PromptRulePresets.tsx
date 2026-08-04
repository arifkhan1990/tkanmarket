'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { ImagePromptType, RuleCondition } from '@/types/prompt-rules'

export interface RulePreset {
  name: string
  description: string
  priority: number
  conditions: RuleCondition[]
  imagePrompts: Array<{
    type: ImagePromptType
    label: string
    prompt: string
    count: number
  }>
  videoPrompt: string
  videoPromptEnabled: boolean
  videoDurationSeconds: number
  videoAspectRatio: string
}

export const PRESETS: RulePreset[] = [
  {
    name: 'Silk & Satin Rule Template',
    description: 'High-gloss, elegant drape rule tailored for silk, satin, and luxury lustrous fabrics.',
    priority: 10,
    conditions: [{ field: 'fabricType', operator: 'contains', value: 'silk' }],
    imagePrompts: [
      {
        type: 'fabricBest',
        label: 'Silk Hero Drape',
        prompt: 'Professional studio product photography of luxury silk fabric {title} in {color}. Show silky sheen, soft elegant ripples, specular highlights, and fluid drape on a neutral studio background. Soft box lighting, 8k resolution, e-commerce catalog quality.',
        count: 2
      },
      {
        type: 'usageProduct',
        label: 'Silk Evening Gown Concept',
        prompt: 'Elegant fashion portrait showing a high-end dress crafted from {color} silk fabric {title}. Soft directional lighting, graceful movement, haute couture runway aesthetics, crisp detail.',
        count: 2
      },
      {
        type: 'thumbnail',
        label: 'Silk Macro Texture',
        prompt: 'Extreme macro close-up of {color} silk fabric {title} weave structure. Fine luster threads, smooth texture, macro studio lens, sharp focus.',
        count: 1
      }
    ],
    videoPrompt: 'Cinematic slow-motion video (60fps) of {color} silk fabric {title} floating softly in gentle breeze. Silky light reflections, elegant fluid motion, studio lighting.',
    videoPromptEnabled: true,
    videoDurationSeconds: 8,
    videoAspectRatio: '9:16'
  },
  {
    name: 'Heavy Cotton & Denim Rule Template',
    description: 'Structured texture rule for heavy weight fabrics like denim, canvas, and twill.',
    priority: 20,
    conditions: [{ field: 'gsm', operator: 'gte', value: 300 }],
    imagePrompts: [
      {
        type: 'fabricBest',
        label: 'Denim / Heavy Fabric Roll',
        prompt: 'E-commerce product photo of heavyweight fabric {title} in {color} ({gsm} GSM). Heavy texture, crisp diagonal twill lines, folded neatly on clean background. Commercial studio photography.',
        count: 2
      },
      {
        type: 'usageProduct',
        label: 'Workwear / Jacket Usage',
        prompt: 'Lifestyle shot of a tailor workbench with rolled heavy {color} fabric {title}. Measuring tape, chalk lines, authentic craft atmosphere, warm natural lighting.',
        count: 2
      },
      {
        type: 'thumbnail',
        label: 'Twill Weave Macro',
        prompt: 'Macro close-up shot of {title} heavy fabric weave texture, showing thick cotton threads and sturdy structure, high contrast, studio macro detail.',
        count: 1
      }
    ],
    videoPrompt: 'Slow 360-degree rotating camera shot around a folded stack of heavy {color} fabric {title}. Detailed surface texture, studio directional lighting.',
    videoPromptEnabled: true,
    videoDurationSeconds: 8,
    videoAspectRatio: '9:16'
  },
  {
    name: 'Default Fallback Rule Template',
    description: 'Standard baseline prompt rule for general fabrics without specific matching constraints.',
    priority: 100,
    conditions: [],
    imagePrompts: [
      {
        type: 'fabricBest',
        label: 'Best Fabric View',
        prompt: 'Professional product photo of fabric {title} in {color} on neutral white studio backdrop. Clear texture, natural drape, balanced commercial lighting, high resolution.',
        count: 2
      },
      {
        type: 'usageProduct',
        label: 'Tailor & Craft Setting',
        prompt: 'Lifestyle image showing fabric {title} displayed in a modern textile studio setting. Professional lighting, realistic fabric material usage.',
        count: 2
      },
      {
        type: 'thumbnail',
        label: 'Texture Thumbnail',
        prompt: 'Square macro thumbnail shot of fabric {title} surface texture and weave pattern. Crisp details, high contrast, product catalog style.',
        count: 1
      }
    ],
    videoPrompt: 'Smooth panning video clip of fabric {title} unfolding gracefully on a cutting table. Natural studio lighting, 4K quality.',
    videoPromptEnabled: true,
    videoDurationSeconds: 8,
    videoAspectRatio: '9:16'
  }
]

interface PromptRulePresetsProps {
  onApply: (presetIndex: number) => void
}

export function PromptRulePresets({ onApply }: PromptRulePresetsProps) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
          🚀 Load Quick Preset Template (Optional)
        </h3>
        <p className="text-xs text-on-surface-variant">
          Need a starting point? Select one of our pre-configured fabric rules to quickly fill initial prompts and conditions.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onApply(idx)}
            className="flex flex-col text-left rounded-lg border border-outline-variant/60 bg-surface p-3 transition-all hover:border-primary hover:shadow-xs"
          >
            <span className="font-bold text-xs text-on-surface">{p.name}</span>
            <span className="mt-1 text-[11px] text-on-surface-variant line-clamp-2">{p.description}</span>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
