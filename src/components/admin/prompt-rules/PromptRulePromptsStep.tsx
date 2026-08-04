'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { ImagePromptConfig, ImagePromptType } from '@/types/prompt-rules'

const IMAGE_PROMPT_TYPES: Array<{ value: ImagePromptType; label: string; description: string }> = [
  { value: 'fabricBest', label: 'Best Fabric Shot', description: 'Studio e-commerce product hero shot showcasing drape and texture' },
  { value: 'usageProduct', label: 'Fabric in Use', description: 'Lifestyle shot with tailor or model using the fabric material' },
  { value: 'thumbnail', label: 'Thumbnail Shot', description: 'Macro close-up shot emphasizing weave, pattern, and detail' }
]

interface PromptRulePromptsStepProps {
  imagePrompts: ImagePromptConfig[]
  onAdd: () => void
  onUpdate: (index: number, patch: Partial<ImagePromptConfig>) => void
  onRemove: (index: number) => void
  onFocus: (index: number) => void
  onNext: () => void
  onBack: () => void
}

export function PromptRulePromptsStep({
  imagePrompts,
  onAdd,
  onUpdate,
  onRemove,
  onFocus,
  onNext,
  onBack
}: PromptRulePromptsStepProps) {
  const totalImages = imagePrompts.reduce((s, p) => s + (p.count || 1), 0)

  return (
    <div className="space-y-4 pt-4 px-2 pb-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-on-surface">Image Generation Prompts ({imagePrompts.length})</h3>
          <p className="text-xs text-on-surface-variant">
            Total images generated per fabric under this rule: <strong>{totalImages} Image(s)</strong>
          </p>
        </div>
        <Button onClick={onAdd} variant="outline" size="sm" className="gap-1 text-xs">
          + Add Image Prompt
        </Button>
      </div>

      <div className="space-y-4">
        {imagePrompts.map((ip, i) => (
          <Card key={i} className="border-outline-variant/60 shadow-2xs">
            <CardHeader className="bg-surface-container-lowest pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                    #{i + 1}
                  </span>
                  <h4 className="font-bold text-sm text-on-surface">{ip.label || `Prompt Configuration #${i + 1}`}</h4>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onRemove(i)} className="h-7 text-xs text-destructive">
                  Delete Prompt
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-on-surface-variant">Shot Category</label>
                  <Select
                    value={ip.type}
                    onValueChange={(v) => onUpdate(i, { type: v as ImagePromptType })}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {IMAGE_PROMPT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-on-surface-variant">Label / Identifier</label>
                  <Input
                    value={ip.label}
                    onChange={(e) => onUpdate(i, { label: e.target.value })}
                    placeholder="e.g., Silk Best Hero Shot"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-on-surface-variant">Output Image Count</label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdate(i, { count: Math.max(1, ip.count - 1) })}
                      className="h-9 w-9 p-0"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={ip.count}
                      onChange={(e) => onUpdate(i, { count: Math.max(1, Number(e.target.value)) })}
                      min={1}
                      max={10}
                      className="h-9 text-center font-bold text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdate(i, { count: Math.min(10, ip.count + 1) })}
                      className="h-9 w-9 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase text-on-surface-variant">
                    AI Prompt Template (Supports variables)
                  </label>
                </div>
                <Textarea
                  value={ip.prompt}
                  onFocus={() => onFocus(i)}
                  onChange={(e) => onUpdate(i, { prompt: e.target.value })}
                  rows={3}
                  placeholder="e.g., Professional product photo of fabric {title} in {color}..."
                  className="font-mono text-xs leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4 border-t border-outline-variant/40">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} className="gap-2">
          Next: Configure Video Rule →
        </Button>
      </div>
    </div>
  )
}
