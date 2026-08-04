'use client'

import { TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminCommissionRulesQuery } from '@/hooks/admin/useAdminCommissionRules'
import { CommissionRuleCard } from '@/components/admin/commission/CommissionRuleCard'
import { useI18n } from '@/hooks/useI18n'

function CommissionSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-container-highest" />
        ))}
      </div>
      <div className="space-y-6 lg:col-span-4">
        <div className="h-72 animate-pulse rounded-2xl bg-surface-container-highest" />
        <div className="h-48 animate-pulse rounded-2xl bg-surface-container-highest" />
      </div>
    </div>
  )
}

export function AdminCommissionRulesClient() {
  const { messages } = useI18n()
  const m = messages.admin.commissionRulesPage
  const query = useAdminCommissionRulesQuery()
  const data = query.data

  function onSimulateEdit(kind: 'tier' | 'enableTiers' | 'flat') {
    toast.message(kind === 'tier' ? m.toastTierEdit : m.toastConfigQueued)
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{m.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">{m.subtitle}</p>
        </div>
        <Button
          type="button"
          className="rounded-xl bg-gradient-to-br from-primary to-primary-container px-6 py-3 font-semibold text-on-primary shadow-lg shadow-primary/20"
          onClick={() => toast.message(m.toastNewRule)}
        >
          {m.newRule}
        </Button>
      </header>

      {query.isLoading ? <CommissionSkeleton /> : null}

      {data ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {data.rules.map((rule) => (
              <CommissionRuleCard key={rule.id} rule={rule} onSimulateEdit={onSimulateEdit} />
            ))}
          </div>

          <div className="space-y-6 lg:col-span-4">
            <div className="relative overflow-hidden rounded-2xl bg-indigo-900 p-8 text-white shadow-2xl">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
              <h3 className="relative z-10 mb-8 flex items-center gap-2 text-xl font-bold">
                <TrendingUp className="h-5 w-5" aria-hidden />
                {m.projectedRevenue}
              </h3>
              <div className="relative z-10 space-y-6">
                <div>
                  <p className="mb-1 text-sm text-indigo-200">{m.monthlyGrossLabel}</p>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-4xl font-extrabold">{data.projections.monthlyGrossUsdLabel}</span>
                    <span className="text-sm font-bold text-emerald-400">{data.projections.changePercentLabel}</span>
                  </div>
                </div>
                <div className="h-px w-full bg-indigo-500/30" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-xs text-indigo-200">{m.effectiveRate}</p>
                    <p className="font-mono text-lg font-bold">{data.projections.effectiveRatePercentLabel}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-indigo-200">{m.platformFeesEst}</p>
                    <p className="font-mono text-lg font-bold">{data.projections.platformFeesUsdLabel}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-indigo-300">{m.disclaimer}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-outline/10 bg-card p-6 shadow-sm">
              <h4 className="mb-6 font-bold text-on-surface">{m.impactAnalysis}</h4>
              <div className="space-y-4">
                {data.rules.map((r) =>
                  r.insightTitle ? (
                    <div key={r.id} className="flex gap-4">
                      <div className="h-12 w-1 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-bold">{r.insightTitle}</p>
                        <p className="text-xs text-on-surface-variant">{r.insightBody}</p>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                className="mt-8 w-full rounded-xl py-3 font-bold"
                onClick={() => toast.message(m.toastPdf)}
              >
                {m.downloadPdf}
              </Button>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-card p-6 shadow-sm">
              <h4 className="mb-4 font-bold text-on-surface">{m.quickSimulation}</h4>
              <label className="mb-2 block text-xs font-bold uppercase text-on-surface-variant">{m.increaseAllPct}</label>
              <div className="flex gap-2">
                <Input className="font-mono" placeholder="0.0" disabled />
                <Button type="button" variant="secondary" onClick={() => toast.message(m.toastSimulate)}>
                  {m.simulate}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
