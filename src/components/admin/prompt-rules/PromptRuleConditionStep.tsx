'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import type { RuleCondition } from '@/types/prompt-rules'

const CONDITION_FIELDS: Array<{ value: RuleCondition['field']; label: string; icon: string }> = [
  { value: 'fabricType', label: 'Fabric Type', icon: '🧵' },
  { value: 'color', label: 'Color', icon: '🎨' },
  { value: 'gsm', label: 'GSM (Weight)', icon: '⚖️' },
  { value: 'composition', label: 'Composition', icon: '🧪' },
  { value: 'tag', label: 'Tag / Category', icon: '🏷️' },
  { value: 'supplyType', label: 'Supply Type', icon: '📦' }
]

const CONDITION_OPERATORS: Array<{ value: RuleCondition['operator']; label: string }> = [
  { value: 'equals', label: 'Equals (=)' },
  { value: 'notEquals', label: 'Not Equals (≠)' },
  { value: 'contains', label: 'Contains text' },
  { value: 'in', label: 'In list (comma separated)' },
  { value: 'gt', label: 'Greater Than (>)' },
  { value: 'gte', label: 'Greater Than or Equal (≥)' },
  { value: 'lt', label: 'Less Than (<)' },
  { value: 'lte', label: 'Less Than or Equal (≤)' }
]

interface PromptRuleConditionStepProps {
  conditions: RuleCondition[]
  onAdd: () => void
  onUpdate: (index: number, patch: Partial<RuleCondition>) => void
  onRemove: (index: number) => void
  onNext: () => void
  onBack: () => void
}

export function PromptRuleConditionStep({
  conditions,
  onAdd,
  onUpdate,
  onRemove,
  onNext,
  onBack
}: PromptRuleConditionStepProps) {
  return (
    <div className="space-y-4 pt-4 px-2 pb-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-on-surface">Rule Matching Conditions</h3>
          <p className="text-xs text-on-surface-variant">
            If no conditions are added, this rule acts as a <strong>Default Fallback Rule</strong> that matches all fabrics.
          </p>
        </div>
        <Button onClick={onAdd} variant="outline" size="sm" className="gap-1 text-xs">
          + Add Condition
        </Button>
      </div>

      {conditions.length === 0 ? (
        <Card className="py-8 text-center border-dashed">
          <CardContent className="space-y-2">
            <span className="text-2xl">⚡</span>
            <p className="font-bold text-sm text-on-surface">No conditions added (Always Matches)</p>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              This rule will trigger for all fabric items unless a higher-priority rule matches first.
            </p>
            <Button onClick={onAdd} size="sm" className="mt-2">
              + Add First Condition
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conditions.map((cond, i) => (
            <Card key={i} className="border-outline-variant/60 bg-surface">
              <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4">
                <div className="space-y-1 flex-1">
                  <label className="text-[11px] font-bold uppercase text-on-surface-variant">Fabric Field</label>
                  <Select
                    value={cond.field}
                    onValueChange={(v) => onUpdate(i, { field: v as RuleCondition['field'] })}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITION_FIELDS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.icon} {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 flex-1">
                  <label className="text-[11px] font-bold uppercase text-on-surface-variant">Condition Operator</label>
                  <Select
                    value={cond.operator}
                    onValueChange={(v) => onUpdate(i, { operator: v as RuleCondition['operator'] })}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPERATORS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 flex-[2]">
                  <label className="text-[11px] font-bold uppercase text-on-surface-variant">Match Value</label>
                  <Input
                    value={String(cond.value)}
                    onChange={(e) =>
                      onUpdate(i, {
                        value: cond.field === 'gsm' ? Number(e.target.value) : e.target.value
                      })
                    }
                    placeholder={cond.field === 'gsm' ? 'e.g., 250' : 'e.g., silk, satin'}
                    className="h-9 text-xs font-medium"
                  />
                </div>

                <div className="flex sm:self-end">
                  <Button variant="destructive" size="sm" onClick={() => onRemove(i)} className="h-9 px-3 text-xs">
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-outline-variant/40">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} className="gap-2">
          Next: Configure Image Prompts →
        </Button>
      </div>
    </div>
  )
}
