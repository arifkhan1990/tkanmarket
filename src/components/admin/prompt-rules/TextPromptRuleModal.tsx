'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { TextPromptRule, RuleCondition, TextPromptRuleCreateInput } from '@/types/prompt-rules'
import { TextRuleConditionBuilder } from './TextRuleConditionBuilder'

interface TextPromptRuleModalProps {
  rule?: TextPromptRule | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

const QUICK_VARS = [
  { tag: '{title_en}', label: 'Title (EN)' },
  { tag: '{title_ru}', label: 'Title (RU)' },
  { tag: '{fabric_type}', label: 'Fabric Type' },
  { tag: '{color}', label: 'Color' },
  { tag: '{composition}', label: 'Composition' },
  { tag: '{gsm}', label: 'GSM Weight' },
  { tag: '{width_cm}', label: 'Width (cm)' },
  { tag: '{moq}', label: 'MOQ' },
  { tag: '{price_usd}', label: 'Price (USD)' },
  { tag: '{tags}', label: 'Tags' },
  { tag: '{source_url}', label: 'Source URL' }
]

export function TextPromptRuleModal({ rule, isOpen, onClose, onSaved }: TextPromptRuleModalProps) {
  const isEdit = Boolean(rule?.id)

  const [form, setForm] = useState<TextPromptRuleCreateInput>({
    name: '',
    description: '',
    priority: 10,
    isActive: true,
    conditions: [],
    enrichmentSystemPrompt: '',
    enrichmentUserTemplate: '',
    translationSystemPrompt: '',
    translationUserTemplate: '',
    socialSystemPrompt: '',
    socialUserTemplate: '',
    blogSystemPrompt: '',
    blogUserTemplate: ''
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('general')
  const [lastFocusedField, setLastFocusedField] = useState<keyof TextPromptRuleCreateInput>('enrichmentUserTemplate')

  useEffect(() => {
    if (rule) {
      setForm({
        name: rule.name || '',
        description: rule.description || '',
        priority: rule.priority ?? 10,
        isActive: rule.isActive ?? true,
        conditions: rule.conditions || [],
        enrichmentSystemPrompt: rule.enrichmentSystemPrompt || '',
        enrichmentUserTemplate: rule.enrichmentUserTemplate || '',
        translationSystemPrompt: rule.translationSystemPrompt || '',
        translationUserTemplate: rule.translationUserTemplate || '',
        socialSystemPrompt: rule.socialSystemPrompt || '',
        socialUserTemplate: rule.socialUserTemplate || '',
        blogSystemPrompt: rule.blogSystemPrompt || '',
        blogUserTemplate: rule.blogUserTemplate || ''
      })
    } else {
      setForm({
        name: '',
        description: '',
        priority: 10,
        isActive: true,
        conditions: [],
        enrichmentSystemPrompt: 'You are a luxury textile expert. Provide structured JSON analysis of fabric properties.',
        enrichmentUserTemplate: 'Analyze this fabric: Title: {title_en}, Composition: {composition}. Return JSON.',
        translationSystemPrompt: 'You are a professional textile translator.',
        translationUserTemplate: 'Translate fabric details: {title_en} to Russian.',
        socialSystemPrompt: 'You are a social media copywriter for textiles.',
        socialUserTemplate: 'Create Instagram post for: {title_ru} / {title_en}.',
        blogSystemPrompt: 'You are a textile industry journalist.',
        blogUserTemplate: 'Write blog post for fabric: {title_en}.'
      })
    }
  }, [rule, isOpen])

  if (!isOpen) return null

  const updateForm = <K extends keyof TextPromptRuleCreateInput>(key: K, value: TextPromptRuleCreateInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addCondition = () => {
    setForm((prev) => ({
      ...prev,
      conditions: [...(prev.conditions || []), { field: 'fabricType', operator: 'equals', value: '' }]
    }))
  }

  const updateCondition = (index: number, patch: Partial<RuleCondition>) => {
    setForm((prev) => {
      const next = [...(prev.conditions || [])]
      if (next[index]) next[index] = { ...next[index], ...patch }
      return { ...prev, conditions: next }
    })
  }

  const removeCondition = (index: number) => {
    setForm((prev) => ({
      ...prev,
      conditions: (prev.conditions || []).filter((_, i) => i !== index)
    }))
  }

  const insertVariable = (tag: string) => {
    const currentVal = (form[lastFocusedField] as string) || ''
    updateForm(lastFocusedField, currentVal + ' ' + tag)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Rule Name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const url = isEdit ? `/api/v1/admin/text-prompt-rules/${rule?.id}` : '/api/v1/admin/text-prompt-rules'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to save text prompt rule')
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl bg-surface border border-outline-variant/40 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low">
          <div>
            <h2 className="text-lg font-bold text-on-surface">
              {isEdit ? '📝 Edit Text Prompt Rule' : '✨ Create Text Prompt Rule'}
            </h2>
            <p className="text-xs text-on-surface-variant">
              Configure system prompts and templates for AI enrichment, translations, social posts & blogs.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-on-surface-variant hover:text-on-surface">
            ✕
          </Button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-error/10 border border-error/20 p-3 text-xs text-error font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
            <span className="text-[11px] font-bold uppercase text-primary tracking-wider">
              ⚡ Quick Insert Variable (Target Field: {String(lastFocusedField)})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_VARS.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVariable(v.tag)}
                  className="px-2 py-0.5 text-[11px] font-mono rounded bg-surface border border-primary/30 text-primary hover:bg-primary hover:text-on-primary transition-all"
                >
                  + {v.tag}
                </button>
              ))}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full h-10 bg-surface-container-low p-1 text-xs">
              <TabsTrigger value="general">1. General & Matching</TabsTrigger>
              <TabsTrigger value="enrichment">2. Product Enrichment</TabsTrigger>
              <TabsTrigger value="social">3. Social Copy</TabsTrigger>
              <TabsTrigger value="blog">4. Blog & Translation</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-on-surface">Rule Name *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="e.g. Luxury Fabrics - Technical Enrichment"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-on-surface">Description</label>
                  <Textarea
                    value={form.description || ''}
                    onChange={(e) => updateForm('description', e.target.value)}
                    placeholder="Describe what this text rule targets..."
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Priority Index</label>
                  <Input
                    type="number"
                    value={form.priority}
                    onChange={(e) => updateForm('priority', Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                  <p className="text-[11px] text-on-surface-variant">Lower numbers run first (e.g. 10 runs before 20).</p>
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-outline-variant/40 bg-surface-container-lowest">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => updateForm('isActive', e.target.checked)}
                      className="rounded accent-primary h-4 w-4"
                    />
                    <span className="text-xs font-bold text-on-surface">Rule Active</span>
                  </label>
                </div>
              </div>

              <TextRuleConditionBuilder
                conditions={form.conditions || []}
                onAdd={addCondition}
                onUpdate={updateCondition}
                onRemove={removeCondition}
              />
            </TabsContent>

            <TabsContent value="enrichment" className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-primary flex items-center gap-1">🤖 Enrichment System Prompt</label>
                <Textarea
                  value={form.enrichmentSystemPrompt || ''}
                  onChange={(e) => updateForm('enrichmentSystemPrompt', e.target.value)}
                  onFocus={() => setLastFocusedField('enrichmentSystemPrompt')}
                  rows={3}
                  placeholder="e.g. You are a luxury textile expert. Always output valid JSON only..."
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-primary flex items-center gap-1">👤 Enrichment User Template</label>
                <Textarea
                  value={form.enrichmentUserTemplate || ''}
                  onChange={(e) => updateForm('enrichmentUserTemplate', e.target.value)}
                  onFocus={() => setLastFocusedField('enrichmentUserTemplate')}
                  rows={6}
                  placeholder="e.g. Analyze fabric: Title: {title_en}, Composition: {composition}..."
                  className="text-xs font-mono"
                />
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">📱 Social Media System Prompt</label>
                <Textarea
                  value={form.socialSystemPrompt || ''}
                  onChange={(e) => updateForm('socialSystemPrompt', e.target.value)}
                  onFocus={() => setLastFocusedField('socialSystemPrompt')}
                  rows={3}
                  placeholder="e.g. You are a B2B textile copywriter creating engaging social content..."
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">👤 Social Media User Template</label>
                <Textarea
                  value={form.socialUserTemplate || ''}
                  onChange={(e) => updateForm('socialUserTemplate', e.target.value)}
                  onFocus={() => setLastFocusedField('socialUserTemplate')}
                  rows={6}
                  placeholder="e.g. Create social post for: {title_ru} / {title_en}. GSM: {gsm}..."
                  className="text-xs font-mono"
                />
              </div>
            </TabsContent>

            <TabsContent value="blog" className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">🌐 Translation System Prompt</label>
                  <Textarea
                    value={form.translationSystemPrompt || ''}
                    onChange={(e) => updateForm('translationSystemPrompt', e.target.value)}
                    onFocus={() => setLastFocusedField('translationSystemPrompt')}
                    rows={3}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">👤 Translation User Template</label>
                  <Textarea
                    value={form.translationUserTemplate || ''}
                    onChange={(e) => updateForm('translationUserTemplate', e.target.value)}
                    onFocus={() => setLastFocusedField('translationUserTemplate')}
                    rows={3}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-600 dark:text-amber-400">📰 Blog System Prompt</label>
                  <Textarea
                    value={form.blogSystemPrompt || ''}
                    onChange={(e) => updateForm('blogSystemPrompt', e.target.value)}
                    onFocus={() => setLastFocusedField('blogSystemPrompt')}
                    rows={3}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-600 dark:text-amber-400">👤 Blog User Template</label>
                  <Textarea
                    value={form.blogUserTemplate || ''}
                    onChange={(e) => updateForm('blogUserTemplate', e.target.value)}
                    onFocus={() => setLastFocusedField('blogUserTemplate')}
                    rows={3}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/40 bg-surface-container-low">
          <Button variant="outline" onClick={onClose} disabled={saving} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm" className="font-bold gap-1.5">
            {saving ? 'Saving...' : (isEdit ? 'Save Text Rule' : 'Create Text Rule')}
          </Button>
        </div>
      </div>
    </div>
  )
}
