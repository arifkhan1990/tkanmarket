'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { REEL_DURATIONS } from '@/constants'

interface PromptRuleVideoStepProps {
  enabled: boolean
  videoPrompt: string
  durationSeconds: number
  aspectRatio: string
  onToggleEnabled: (enabled: boolean) => void
  onUpdatePrompt: (prompt: string) => void
  onUpdateDuration: (seconds: number) => void
  onUpdateAspectRatio: (ratio: string) => void
  onFocus: () => void
  onNext: () => void
  onBack: () => void
}

export function PromptRuleVideoStep({
  enabled,
  videoPrompt,
  durationSeconds,
  aspectRatio,
  onToggleEnabled,
  onUpdatePrompt,
  onUpdateDuration,
  onUpdateAspectRatio,
  onFocus,
  onNext,
  onBack
}: PromptRuleVideoStepProps) {
  return (
    <div className="space-y-4 pt-4 px-2 pb-2">
      <Card className="border-outline-variant/60">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="videoEnableToggle"
              checked={enabled}
              onChange={(e) => onToggleEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-outline-variant text-primary"
            />
            <div>
              <label htmlFor="videoEnableToggle" className="font-bold text-sm text-on-surface cursor-pointer">
                Enable Video Prompt Rule
              </label>
              <p className="text-xs text-on-surface-variant">Generates AI video clips for fabrics matching this rule.</p>
            </div>
          </div>

          {enabled && (
            <div className="space-y-4 pt-2 border-t border-outline-variant/40">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-on-surface-variant">Video Prompt Template</label>
                <Textarea
                  value={videoPrompt}
                  onFocus={onFocus}
                  onChange={(e) => onUpdatePrompt(e.target.value)}
                  rows={4}
                  placeholder="Cinematic slow-motion video of {color} fabric {title} draped elegantly..."
                  className="font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-on-surface-variant">Duration (Seconds)</label>
                  <Select
                    value={String(durationSeconds)}
                    onValueChange={(v) => onUpdateDuration(Number(v))}
                  >
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REEL_DURATIONS.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {d} seconds
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-on-surface-variant">Aspect Ratio</label>
                  <Select
                    value={aspectRatio}
                    onValueChange={onUpdateAspectRatio}
                  >
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9:16">📱 9:16 (Portrait / Reels / TikTok)</SelectItem>
                      <SelectItem value="16:9">💻 16:9 (Landscape)</SelectItem>
                      <SelectItem value="1:1">⏹️ 1:1 (Square)</SelectItem>
                      <SelectItem value="4:3">📺 4:3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4 border-t border-outline-variant/40">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} className="gap-2">
          Next: Live Test & Preview →
        </Button>
      </div>
    </div>
  )
}
