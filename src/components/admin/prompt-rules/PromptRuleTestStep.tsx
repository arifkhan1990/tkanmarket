'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PromptRuleTestResult } from '@/types/prompt-rules'

interface PromptRuleTestStepProps {
  testFabricData: {
    title: string
    fabricType: string
    color: string
    gsm: string
    composition: string
    tags: string
    supplyType: string
  }
  onUpdateTestData: (patch: Partial<PromptRuleTestStepProps['testFabricData']>) => void
  onRunTest: () => void
  testing: boolean
  testResult: PromptRuleTestResult | null
  onSave: () => void
  saving: boolean
  onBack: () => void
}

export function PromptRuleTestStep({
  testFabricData,
  onUpdateTestData,
  onRunTest,
  testing,
  testResult,
  onSave,
  saving,
  onBack
}: PromptRuleTestStepProps) {
  return (
    <div className="space-y-4 pt-4 px-2 pb-2">
      <Card className="border-primary/20 bg-surface">
        <CardHeader className="pb-3">
          <h3 className="text-sm font-bold flex items-center gap-2 text-on-surface">
            🧪 Test Rule Match & Preview Compiled Output
          </h3>
          <p className="text-xs text-on-surface-variant">
            Simulate how this prompt rule compiles when a matching fabric is processed.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant">Test Title</label>
              <Input
                value={testFabricData.title}
                onChange={(e) => onUpdateTestData({ title: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant">Fabric Type</label>
              <Input
                value={testFabricData.fabricType}
                onChange={(e) => onUpdateTestData({ fabricType: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant">Color</label>
              <Input
                value={testFabricData.color}
                onChange={(e) => onUpdateTestData({ color: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant">GSM Weight</label>
              <Input
                value={testFabricData.gsm}
                onChange={(e) => onUpdateTestData({ gsm: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant">Composition</label>
              <Input
                value={testFabricData.composition}
                onChange={(e) => onUpdateTestData({ composition: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1 flex items-end">
              <Button onClick={onRunTest} disabled={testing} size="sm" className="w-full h-8 text-xs">
                {testing ? 'Running Test...' : 'Run Live Test'}
              </Button>
            </div>
          </div>

          {testResult && (
            <div className="space-y-3 pt-3 border-t border-outline-variant/40">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">Result:</span>
                <Badge intent={testResult.matched ? 'success' : 'warning'}>
                  {testResult.matched ? '✅ Rule Matched Fabric' : '⚠️ Did Not Match Conditions'}
                </Badge>
              </div>

              <p className="text-xs text-on-surface-variant">{testResult.description}</p>

              {testResult.compiledImagePrompts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Compiled Image Prompts:</h4>
                  {testResult.compiledImagePrompts.map((ip, i) => (
                    <div key={i} className="rounded-md border border-outline-variant/50 bg-surface-container-lowest p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-on-surface">
                        <span>{ip.label}</span>
                        <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          x{ip.count} Images
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-on-surface-variant leading-relaxed">{ip.prompt}</p>
                    </div>
                  ))}
                </div>
              )}

              {testResult.compiledVideoPrompt && (
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Compiled Video Prompt:
                  </h4>
                  <div className="rounded-md border border-outline-variant/50 bg-surface-container-lowest p-3 font-mono text-[11px] text-on-surface-variant leading-relaxed">
                    {testResult.compiledVideoPrompt}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4 border-t border-outline-variant/40">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onSave} disabled={saving} className="gap-2 font-bold">
          {saving ? 'Saving...' : 'Confirm & Save Rule'}
        </Button>
      </div>
    </div>
  )
}
