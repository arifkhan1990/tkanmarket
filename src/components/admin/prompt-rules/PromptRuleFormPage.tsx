'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type {
  PromptRule,
  RuleCondition,
  ImagePromptConfig,
  ImagePromptType,
  PromptRuleTestResult
} from '@/types/prompt-rules'

import { api, AVAILABLE_VARIABLES } from './prompt-rules-helpers'
import { PRESETS } from './PromptRulePresets'
import { PromptRuleBasicStep } from './PromptRuleBasicStep'
import { PromptRuleConditionStep } from './PromptRuleConditionStep'
import { PromptRulePromptsStep } from './PromptRulePromptsStep'
import { PromptRuleVideoStep } from './PromptRuleVideoStep'
import { PromptRuleTestStep } from './PromptRuleTestStep'

export function PromptRuleFormPage({ ruleId, onClose }: { ruleId?: number; onClose: () => void }) {
  const isEdit = Boolean(ruleId)
  const [saving, setSaving] = useState(false)
  const [activeStep, setActiveStep] = useState<'basic' | 'conditions' | 'images' | 'video' | 'test'>('basic')
  const [focusedPromptIndex, setFocusedPromptIndex] = useState<number | 'video' | null>(null)
  const [testResult, setTestResult] = useState<PromptRuleTestResult | null>(null)
  const [testing, setTesting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: 10,
    isActive: true,
    conditions: [] as RuleCondition[],
    imagePrompts: [
      {
        type: 'fabricBest' as ImagePromptType,
        label: 'Best Fabric Shot',
        prompt: 'Professional product photo of fabric {title} on white background. Show texture and drape clearly. Studio lighting, high resolution, e-commerce style.',
        count: 2
      },
      {
        type: 'usageProduct' as ImagePromptType,
        label: 'Fabric in Use',
        prompt: 'Lifestyle photo showing fabric {title} being used as fabric material in a real setting. A professional tailor working with the material. Soft natural lighting, warm atmosphere, realistic.',
        count: 2
      },
      {
        type: 'thumbnail' as ImagePromptType,
        label: 'Thumbnail',
        prompt: 'Close-up macro shot of fabric {title} texture and weave pattern. High contrast, sharp details, square format, product thumbnail style on white background.',
        count: 1
      }
    ],
    videoPrompt: 'Cinematic slow-motion video of fabric {title} in {color} draped gracefully. Studio lighting, smooth camera motion.',
    videoPromptEnabled: true,
    videoDurationSeconds: 8,
    videoAspectRatio: '9:16'
  })

  const [testFabricData, setTestFabricData] = useState({
    title: 'Luxury Royal Silk Satin',
    fabricType: 'silk',
    color: 'Royal Blue',
    gsm: '180',
    composition: '100% Silk',
    tags: 'luxury, evening-wear, satin',
    supplyType: 'in_stock'
  })

  /* Fetch existing rule if in edit mode */
  useEffect(() => {
    if (!ruleId) return
    api<PromptRule>(`/api/v1/admin/prompt-rules/${ruleId}`).then((res) => {
      if (!res.data) return
      const r = res.data
      setForm({
        name: r.name,
        description: r.description ?? '',
        priority: r.priority,
        isActive: r.isActive,
        conditions: r.conditions ?? [],
        imagePrompts: r.imagePrompts ?? [],
        videoPrompt: r.videoPrompt ?? '',
        videoPromptEnabled: r.videoPromptEnabled ?? true,
        videoDurationSeconds: r.videoDurationSeconds ?? 8,
        videoAspectRatio: r.videoAspectRatio ?? '9:16'
      })
    })
  }, [ruleId])

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const applyPreset = (presetIndex: number) => {
    const p = PRESETS[presetIndex]
    if (!p) return
    setForm((prev) => ({
      ...prev,
      name: prev.name || p.name,
      description: p.description,
      priority: p.priority,
      conditions: p.conditions,
      imagePrompts: p.imagePrompts,
      videoPrompt: p.videoPrompt,
      videoPromptEnabled: p.videoPromptEnabled,
      videoDurationSeconds: p.videoDurationSeconds,
      videoAspectRatio: p.videoAspectRatio
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Please enter a rule name.')
      setActiveStep('basic')
      return
    }

    setSaving(true)
    const url = isEdit ? `/api/v1/admin/prompt-rules/${ruleId}` : '/api/v1/admin/prompt-rules'
    const method = isEdit ? 'PUT' : 'POST'
    const body = {
      ...form,
      description: form.description || undefined,
      videoPrompt: form.videoPrompt || undefined,
      videoDurationSeconds: form.videoDurationSeconds || undefined,
      videoAspectRatio: form.videoAspectRatio || undefined,
      conditions: form.conditions,
      imagePrompts: form.imagePrompts.map((ip) => ({
        ...ip,
        count: Math.max(1, ip.count)
      }))
    }

    const res = await api(url, { method, body: JSON.stringify(body) })
    setSaving(false)
    if (res.error) {
      alert(res.error)
      return
    }
    onClose()
  }

  const handleTest = async () => {
    setTesting(true)
    const gsm = testFabricData.gsm ? Number(testFabricData.gsm) : null
    const res = await api<PromptRuleTestResult>(
      ruleId ? `/api/v1/admin/prompt-rules/${ruleId}/test` : '/api/v1/admin/prompt-rules/test-draft',
      {
        method: 'POST',
        body: JSON.stringify({
          rule: form,
          fabricData: { ...testFabricData, gsm }
        })
      }
    )
    setTesting(false)
    if (res.data) setTestResult(res.data)
  }

  const addCondition = () => {
    update('conditions', [...form.conditions, { field: 'fabricType', operator: 'equals', value: '' }])
  }

  const updateCondition = (index: number, patch: Partial<RuleCondition>) => {
    const updated = form.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c))
    update('conditions', updated)
  }

  const removeCondition = (index: number) => {
    update('conditions', form.conditions.filter((_, i) => i !== index))
  }

  const addImagePrompt = () => {
    update('imagePrompts', [
      ...form.imagePrompts,
      {
        type: 'fabricBest',
        label: `Prompt Shot #${form.imagePrompts.length + 1}`,
        prompt: 'Studio product shot of fabric {title} in {color}.',
        count: 1
      }
    ])
  }

  const updateImagePrompt = (index: number, patch: Partial<ImagePromptConfig>) => {
    const updated = form.imagePrompts.map((ip, i) => (i === index ? { ...ip, ...patch } : ip))
    update('imagePrompts', updated)
  }

  const removeImagePrompt = (index: number) => {
    update('imagePrompts', form.imagePrompts.filter((_, i) => i !== index))
  }

  const insertVariable = (variableTag: string) => {
    if (focusedPromptIndex === 'video') {
      update('videoPrompt', form.videoPrompt + ' ' + variableTag)
    } else if (typeof focusedPromptIndex === 'number' && form.imagePrompts[focusedPromptIndex]) {
      const current = form.imagePrompts[focusedPromptIndex].prompt
      updateImagePrompt(focusedPromptIndex, { prompt: current + ' ' + variableTag })
    } else if (form.imagePrompts.length > 0 && form.imagePrompts[0]) {
      const current = form.imagePrompts[0].prompt
      updateImagePrompt(0, { prompt: current + ' ' + variableTag })
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-outline-variant/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2 text-xs">
              ← Back to List
            </Button>
            <Badge intent={form.isActive ? 'success' : 'warning'} className="text-xs">
              {form.isActive ? 'Active Rule' : 'Inactive Draft'}
            </Badge>
          </div>
          <h1 className="mt-1 font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">
            {isEdit ? `Edit Rule: ${form.name || 'Untitled'}` : 'Create New AI Prompt Rule'}
          </h1>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            Configure matching conditions, image generation prompt templates, and video rule parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 font-semibold">
            {saving ? 'Saving Rule...' : isEdit ? 'Update Rule' : 'Save Rule'}
          </Button>
        </div>
      </div>

      {/* Stepper Tabs Bar */}
      <Card className="p-1 shadow-xs">
        <Tabs value={activeStep} onValueChange={(v) => setActiveStep(v as typeof activeStep)}>
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-surface-container-low">
            <TabsTrigger value="basic" className="py-2.5 text-xs flex flex-col sm:flex-row items-center gap-1.5 font-semibold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-mono text-primary">1</span>
              <span>General Info</span>
            </TabsTrigger>

            <TabsTrigger value="conditions" className="py-2.5 text-xs flex flex-col sm:flex-row items-center gap-1.5 font-semibold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-mono text-primary">2</span>
              <span>Conditions ({form.conditions.length})</span>
            </TabsTrigger>

            <TabsTrigger value="images" className="py-2.5 text-xs flex flex-col sm:flex-row items-center gap-1.5 font-semibold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-mono text-primary">3</span>
              <span>Images ({form.imagePrompts.length})</span>
            </TabsTrigger>

            <TabsTrigger value="video" className="py-2.5 text-xs flex flex-col sm:flex-row items-center gap-1.5 font-semibold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-mono text-primary">4</span>
              <span>Video Rule</span>
            </TabsTrigger>

            <TabsTrigger value="test" className="py-2.5 text-xs flex flex-col sm:flex-row items-center gap-1.5 font-semibold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-mono text-primary">5</span>
              <span>Live Test</span>
            </TabsTrigger>
          </TabsList>

          {/* Quick Insert Floating Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-lowest px-4 py-2 text-xs border-t border-outline-variant/40">
            <span className="font-semibold text-on-surface-variant text-[11px]">⚡ Quick Insert Variable:</span>
            {AVAILABLE_VARIABLES.map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => insertVariable(v.tag)}
                className="rounded-md bg-surface-container-high px-2 py-0.5 font-mono text-[11px] text-on-surface hover:bg-primary/20 hover:text-primary transition-colors"
                title={`Click to insert ${v.tag} (${v.desc})`}
              >
                + {v.tag}
              </button>
            ))}
          </div>

          {/* STEP 1: Basic Info */}
          <TabsContent value="basic">
            <PromptRuleBasicStep
              isEdit={isEdit}
              form={form}
              onUpdate={update}
              onApplyPreset={applyPreset}
              onNext={() => setActiveStep('conditions')}
            />
          </TabsContent>

          {/* STEP 2: Conditions */}
          <TabsContent value="conditions">
            <PromptRuleConditionStep
              conditions={form.conditions}
              onAdd={addCondition}
              onUpdate={updateCondition}
              onRemove={removeCondition}
              onNext={() => setActiveStep('images')}
              onBack={() => setActiveStep('basic')}
            />
          </TabsContent>

          {/* STEP 3: Image Prompts */}
          <TabsContent value="images">
            <PromptRulePromptsStep
              imagePrompts={form.imagePrompts}
              onAdd={addImagePrompt}
              onUpdate={updateImagePrompt}
              onRemove={removeImagePrompt}
              onFocus={(i) => setFocusedPromptIndex(i)}
              onNext={() => setActiveStep('video')}
              onBack={() => setActiveStep('conditions')}
            />
          </TabsContent>

          {/* STEP 4: Video Rule */}
          <TabsContent value="video">
            <PromptRuleVideoStep
              enabled={form.videoPromptEnabled}
              videoPrompt={form.videoPrompt}
              durationSeconds={form.videoDurationSeconds}
              aspectRatio={form.videoAspectRatio}
              onToggleEnabled={(v) => update('videoPromptEnabled', v)}
              onUpdatePrompt={(p) => update('videoPrompt', p)}
              onUpdateDuration={(d) => update('videoDurationSeconds', d)}
              onUpdateAspectRatio={(r) => update('videoAspectRatio', r)}
              onFocus={() => setFocusedPromptIndex('video')}
              onNext={() => setActiveStep('test')}
              onBack={() => setActiveStep('images')}
            />
          </TabsContent>

          {/* STEP 5: Live Test */}
          <TabsContent value="test">
            <PromptRuleTestStep
              testFabricData={testFabricData}
              onUpdateTestData={(patch) => setTestFabricData((p) => ({ ...p, ...patch }))}
              onRunTest={handleTest}
              testing={testing}
              testResult={testResult}
              onSave={handleSave}
              saving={saving}
              onBack={() => setActiveStep('video')}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
