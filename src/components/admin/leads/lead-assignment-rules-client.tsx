'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLeadAssignmentRulesQuery, useLeadAssignmentRulesSave } from '@/hooks/admin/useLeadAssignmentRules'
import type { LeadAssignmentRule, LeadAssignmentTrigger } from '@/types/lead-assignment.types'
import { useI18n } from '@/hooks/useI18n'

function emptyRule(): LeadAssignmentRule {
  return {
    id: `rule-${Date.now()}`,
    name: 'New rule',
    version: 'v1.0',
    trigger: 'MARKETPLACE',
    conditions: [{ field: 'fabric_type', op: 'CONTAINS', value: '' }],
    assignment: { type: 'ROUND_ROBIN', teamLabel: 'General sales' }
  }
}

export function LeadAssignmentRulesClient() {
  const { messages } = useI18n()
  const m = messages.admin.leadAssignmentPage
  const q = useLeadAssignmentRulesQuery()
  const save = useLeadAssignmentRulesSave()

  const [rules, setRules] = React.useState<LeadAssignmentRule[]>([])

  React.useEffect(() => {
    if (q.data?.config.assignmentRules) setRules(q.data.config.assignmentRules)
  }, [q.data?.config.assignmentRules])

  const stats = q.data?.stats

  const onSave = () => {
    save.mutate(
      { assignmentRules: rules },
      {
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Error')
      }
    )
  }

  if (q.isLoading) {
    return <div className="animate-pulse space-y-6">{Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-24 rounded-2xl bg-surface-container-high" />
    ))}</div>
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{m.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">{m.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-[2rem] bg-surface-container-low p-8 lg:col-span-4">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">{m.velocityLabel}</p>
          <p className="mt-2 font-heading text-4xl font-light text-on-surface">
            {stats?.routeVelocityPercent ?? 0}
            <span className="text-2xl font-bold">%</span>
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">{m.velocityHint}</p>
        </div>
        <div className="rounded-[2rem] border border-outline/10 bg-surface-container-lowest p-8 shadow-sm lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-heading text-2xl font-bold">{m.activeStack}</h2>
            <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
              {m.rulesCount.replace('{count}', String(stats?.activeRulesCount ?? rules.length))}
            </span>
          </div>
          <div className="mt-6 space-y-3">
            {rules.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface-container-low p-4">
                <div>
                  <div className="font-heading font-bold text-on-surface">{r.name}</div>
                  <div className="text-xs text-on-surface-variant">
                    {r.trigger} · {r.conditions[0]?.field ?? '—'}
                  </div>
                </div>
                <span className="text-xs text-on-surface-variant">{r.version}</span>
              </div>
            ))}
            {rules.length === 0 ? <div className="text-sm text-on-surface-variant">—</div> : null}
          </div>
        </div>
      </div>

      <section className="rounded-[2rem] bg-surface-container p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-heading text-2xl font-extrabold">{m.newRule}</h2>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setRules((prev) => [...prev, emptyRule()])}>
              <Plus className="mr-2 h-4 w-4" />
              {m.addCondition}
            </Button>
            <Button type="button" className="bg-gradient-to-br from-primary to-primary-container font-bold shadow-lg" onClick={onSave} disabled={save.isPending}>
              {m.deploy}
            </Button>
          </div>
        </div>

        <div className="mt-10 space-y-8">
          {rules.map((rule, idx) => (
            <div key={rule.id} className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-outline">#{idx + 1}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => setRules((prev) => prev.filter((x) => x.id !== rule.id))} aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-outline">{m.newRule}</div>
                  <Input value={rule.name} onChange={(e) => {
                    const v = e.target.value
                    setRules((prev) => prev.map((x) => (x.id === rule.id ? { ...x, name: v } : x)))
                  }} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-outline">{m.stepTrigger}</div>
                  <Select
                    value={rule.trigger}
                    onValueChange={(v) =>
                      setRules((prev) => prev.map((x) => (x.id === rule.id ? { ...x, trigger: v as LeadAssignmentTrigger } : x)))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEB">{m.triggerWeb}</SelectItem>
                      <SelectItem value="MARKETPLACE">{m.triggerMarket}</SelectItem>
                      <SelectItem value="DIRECT">{m.triggerDirect}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-outline">Field</div>
                  <Input
                    value={rule.conditions[0]?.field ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      setRules((prev) =>
                        prev.map((x) =>
                          x.id === rule.id
                            ? { ...x, conditions: [{ field: v, op: 'CONTAINS', value: x.conditions[0]?.value ?? '' }] }
                            : x
                        )
                      )
                    }}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-outline">Value</div>
                  <Input
                    value={rule.conditions[0]?.value ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      setRules((prev) =>
                        prev.map((x) =>
                          x.id === rule.id
                            ? { ...x, conditions: [{ field: x.conditions[0]?.field ?? 'fabric', op: 'CONTAINS', value: v }] }
                            : x
                        )
                      )
                    }}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-outline">{m.teamRoundRobin}</div>
                  <Input
                    value={rule.assignment.type === 'ROUND_ROBIN' ? rule.assignment.teamLabel : ''}
                    onChange={(e) => {
                      const v = e.target.value
                      setRules((prev) =>
                        prev.map((x) => (x.id === rule.id ? { ...x, assignment: { type: 'ROUND_ROBIN', teamLabel: v } } : x))
                      )
                    }}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-outline/20 pt-8">
          <div>
            <p className="text-xs font-bold uppercase text-on-surface-variant">{m.lastModified}</p>
            <p className="text-sm font-medium">{stats?.lastModifiedAt ? new Date(stats.lastModifiedAt).toLocaleString() : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-on-surface-variant">{m.collision}</p>
            <p className="text-sm font-semibold text-primary">{m.noOverlap}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => q.data && setRules(q.data.config.assignmentRules)}>
            {m.draftDiscard}
          </Button>
        </footer>
      </section>
    </div>
  )
}
