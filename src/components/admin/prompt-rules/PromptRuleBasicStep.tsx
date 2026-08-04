'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PromptRulePresets } from './PromptRulePresets'

interface PromptRuleBasicStepProps {
  isEdit: boolean
  form: {
    name: string
    description: string
    priority: number
    isActive: boolean
  }
  onUpdate: <K extends 'name' | 'description' | 'priority' | 'isActive'>(key: K, value: any) => void
  onApplyPreset: (index: number) => void
  onNext: () => void
}

export function PromptRuleBasicStep({ isEdit, form, onUpdate, onApplyPreset, onNext }: PromptRuleBasicStepProps) {
  return (
    <div className="space-y-6 pt-4 px-2 pb-2">
      {!isEdit && <PromptRulePresets onApply={onApplyPreset} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Rule Name *</label>
          <Input
            value={form.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            placeholder="e.g., Silk & Satin Premium Visual Rule"
            className="font-medium"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Rule Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            placeholder="Describe when this rule should apply and its target fabric category..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Execution Priority (Lower = Higher Priority)
          </label>
          <Input
            type="number"
            value={form.priority}
            onChange={(e) => onUpdate('priority', Number(e.target.value))}
            min={0}
            max={9999}
            className="font-mono"
          />
          <p className="text-[11px] text-on-surface-variant">Priority 0 runs first. Fallback rules usually have priority 100.</p>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-outline-variant/60 p-4 bg-surface">
          <input
            type="checkbox"
            id="isActiveToggle"
            checked={form.isActive}
            onChange={(e) => onUpdate('isActive', e.target.checked)}
            className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
          />
          <div>
            <label htmlFor="isActiveToggle" className="font-bold text-sm text-on-surface cursor-pointer">
              Enable Rule (Active State)
            </label>
            <p className="text-xs text-on-surface-variant">When inactive, this rule will be skipped during fabric AI generation.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onNext} className="gap-2">
          Next: Configure Matching Conditions →
        </Button>
      </div>
    </div>
  )
}
