'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RuleCondition } from '@/types/prompt-rules'

const CONDITION_FIELDS: Array<{ value: RuleCondition['field']; label: string }> = [
  { value: 'fabricType', label: 'Fabric Type (e.g. silk, cotton)' },
  { value: 'color', label: 'Color' },
  { value: 'gsm', label: 'GSM Weight' },
  { value: 'composition', label: 'Composition' },
  { value: 'tag', label: 'Tag' },
  { value: 'supplyType', label: 'Supply Type' }
]

const CONDITION_OPERATORS: Array<{ value: RuleCondition['operator']; label: string }> = [
  { value: 'equals', label: 'Equals (=)' },
  { value: 'notEquals', label: 'Not Equals (!=)' },
  { value: 'contains', label: 'Contains' },
  { value: 'in', label: 'Is In (comma list)' },
  { value: 'gt', label: 'Greater Than (>)' },
  { value: 'gte', label: 'Greater or Equal (>=)' },
  { value: 'lt', label: 'Less Than (<)' },
  { value: 'lte', label: 'Less or Equal (<=)' }
]

interface TextRuleConditionBuilderProps {
  conditions: RuleCondition[]
  onAdd: () => void
  onUpdate: (index: number, patch: Partial<RuleCondition>) => void
  onRemove: (index: number) => void
}

export function TextRuleConditionBuilder({ conditions, onAdd, onUpdate, onRemove }: TextRuleConditionBuilderProps) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-on-surface">Matching Conditions</h3>
          <p className="text-[11px] text-on-surface-variant">Leave empty to apply to all fabrics as default fallback.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="h-7 text-xs gap-1">
          + Add Condition
        </Button>
      </div>

      {!conditions || conditions.length === 0 ? (
        <div className="p-4 text-center rounded-lg border border-dashed border-outline-variant/60 text-xs text-on-surface-variant bg-surface-container-lowest">
          🌐 No conditions set — This text rule will act as a <strong>Default Fallback Rule</strong>.
        </div>
      ) : (
        <div className="space-y-2">
          {conditions.map((cond, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-md border border-outline-variant/40 bg-surface-container-lowest">
              <Select value={cond.field} onValueChange={(v) => onUpdate(idx, { field: v as RuleCondition['field'] })}>
                <SelectTrigger className="h-8 text-xs w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITION_FIELDS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={cond.operator} onValueChange={(v) => onUpdate(idx, { operator: v as RuleCondition['operator'] })}>
                <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITION_OPERATORS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={Array.isArray(cond.value) ? cond.value.join(', ') : String(cond.value)}
                onChange={(e) => {
                  const val = cond.operator === 'in' ? e.target.value.split(',').map((s) => s.trim()) : e.target.value
                  onUpdate(idx, { value: val })
                }}
                placeholder="Value..."
                className="h-8 text-xs flex-1 font-mono"
              />

              <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(idx)} className="h-8 w-8 p-0 text-error">
                🗑️
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
