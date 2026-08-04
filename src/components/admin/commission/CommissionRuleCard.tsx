'use client'

import { Leaf, Pencil, Wind } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/useI18n'
import type { CommissionRuleDto } from '@/types/commission-rules.types'
import type { Locale } from '@/types/i18n.types'
import { cn } from '@/lib/utils'

function numberLocale(loc: Locale): string {
  if (loc === 'ru') return 'ru-RU'
  if (loc === 'zh') return 'zh-CN'
  return 'en-US'
}

export function CommissionRuleCard({
  rule,
  onSimulateEdit
}: {
  rule: CommissionRuleDto
  onSimulateEdit: (kind: 'tier' | 'enableTiers' | 'flat') => void
}) {
  const { locale, messages } = useI18n()
  const m = messages.admin.commissionRulesPage
  const Icon = rule.categoryKey === 'silk' ? Wind : Leaf
  const base = Number.parseFloat(rule.baseCommissionPercent)

  function healthBadge(h: CommissionRuleDto['health']) {
    switch (h) {
      case 'HEALTHY':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{m.healthHealthy}</Badge>
      case 'UNDER_REVIEW':
        return <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">{m.healthUnderReview}</Badge>
      case 'PAUSED':
        return <Badge intent="default">{m.healthPaused}</Badge>
      default: {
        const _exhaustive: never = h
        return _exhaustive
      }
    }
  }

  const healthLabel =
    rule.health === 'HEALTHY' ? m.healthHealthy : rule.health === 'UNDER_REVIEW' ? m.healthUnderReview : m.healthPaused

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm border border-outline/10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'rounded-xl p-3',
              rule.categoryKey === 'silk' ? 'bg-orange-100 text-orange-900' : 'bg-indigo-100 text-indigo-800'
            )}
          >
            <Icon className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-bold text-on-surface">{rule.categoryLabel}</h3>
            <p className="font-mono text-xs text-on-surface-variant">
              {m.catId}: {rule.externalRef ?? m.dash}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rule.isActive ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
              {m.active}
            </span>
          ) : (
            <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold uppercase text-on-surface">
              {m.inactive}
            </span>
          )}
          {healthBadge(rule.health)}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-container-low p-4">
          <p className="mb-1 text-xs font-medium text-on-surface-variant">{m.baseCommission}</p>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-3xl font-bold text-primary">{Number.isFinite(base) ? Math.round(base) : '—'}</span>
            <span className="text-lg font-bold text-on-surface">%</span>
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4">
          <p className="mb-1 text-xs font-medium text-on-surface-variant">{m.minMonthlyVol}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-on-surface">$</span>
            <span className="font-mono text-2xl font-bold">{rule.minMonthlyVolumeUsd.toLocaleString(numberLocale(locale))}</span>
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4">
          <p className="mb-1 text-xs font-medium text-on-surface-variant">{m.status}</p>
          <div className="mt-2 flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                rule.health === 'HEALTHY' ? 'bg-emerald-500' : rule.health === 'UNDER_REVIEW' ? 'bg-amber-500' : 'bg-outline'
              )}
            />
            <span className="text-sm font-semibold">{healthLabel}</span>
          </div>
        </div>
      </div>

      {rule.tierMode === 'TIERED' && rule.tiers && rule.tiers.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-outline/10">
          <div className="grid grid-cols-4 gap-2 bg-surface-container-high px-4 py-2 text-xs font-bold uppercase tracking-tighter text-on-surface-variant">
            <div>{m.tierVolume}</div>
            <div>{m.tierCommission}</div>
            <div>{m.tierMerchants}</div>
            <div className="text-right">{m.tierAction}</div>
          </div>
          <div>
            {rule.tiers.map((t, idx) => (
              <div
                key={`${t.volumeLabel}-${idx}`}
                className="grid grid-cols-4 items-center border-t border-outline/5 px-4 py-4 text-sm odd:bg-muted/30"
              >
                <div className="font-mono">{t.volumeLabel}</div>
                <div className="font-bold text-primary">{t.commissionPercent}%</div>
                <div>{t.activeMerchants}</div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-primary"
                    aria-label={m.editTierAria}
                    onClick={() => onSimulateEdit('tier')}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-r-xl border-l-4 border-primary bg-surface-container-low/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="text-primary" aria-hidden>
              ℹ
            </span>
            <p className="text-sm text-on-surface">
              {m.flatRuleBefore}
              <strong>{m.flatRuleStrong}</strong>
              {m.flatRuleAfter}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="shrink-0 font-bold uppercase" onClick={() => onSimulateEdit('enableTiers')}>
            {m.enableTiers}
          </Button>
        </div>
      )}
    </section>
  )
}
