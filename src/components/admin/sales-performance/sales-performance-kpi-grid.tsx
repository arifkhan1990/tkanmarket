import { Clock, TrendingUp, UserPlus, Users, Wallet } from 'lucide-react'

import type { Messages } from '@/lib/i18n/get-messages'
import type { AdminSalesPerformanceResponse } from '@/types/admin-sales-performance.types'
import type { Locale } from '@/types/i18n.types'

import { fmtNum, fmtUsd, KpiCard } from './sales-performance-format'

type T = Messages['admin']['salesPerformancePage']

export function SalesPerformanceKpiGrid(props: { d: AdminSalesPerformanceResponse; locale: Locale; t: T }) {
  const { d, locale, t } = props
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard
        label={t.totalRevenue}
        hint={t.revenueHint}
        value={fmtUsd(d.analytics.stats.totalRevenue, locale, true)}
        delta={d.analytics.stats.revenueGrowthPercent}
        tone="up-good"
        icon={<Wallet className="h-5 w-5" aria-hidden />}
        iconClass="bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
        spark={d.analytics.sparklines.revenue}
        sparkColor="#1a40c2"
        vsPrev={t.vsPrev}
      />
      <KpiCard
        label={t.conversionRate}
        hint={t.conversionHint}
        value={`${d.analytics.stats.conversionRate.toFixed(2)}%`}
        delta={d.analytics.stats.conversionRateGrowthPercent}
        tone="up-good"
        icon={<TrendingUp className="h-5 w-5" aria-hidden />}
        iconClass="bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
        spark={d.analytics.sparklines.conversions}
        sparkColor="#7c3aed"
        vsPrev={t.vsPrev}
      />
      <KpiCard
        label={t.avgLeadTime}
        hint={t.leadTimeHint}
        value={d.avgLeadTimeDays != null ? `${d.avgLeadTimeDays.toFixed(1)} ${t.daysSuffix}` : '—'}
        delta={d.avgLeadTimeDeltaPercent}
        tone="down-good"
        icon={<Clock className="h-5 w-5" aria-hidden />}
        iconClass="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        spark={d.analytics.sparklines.conversions}
        sparkColor="#d97706"
        vsPrev={t.vsPrev}
      />
      <KpiCard
        label={t.statNewLeads}
        hint={t.statNewLeadsHint}
        value={fmtNum(d.analytics.stats.newLeads, locale, true)}
        delta={d.analytics.stats.newLeadsGrowthPercent}
        tone="up-good"
        icon={<UserPlus className="h-5 w-5" aria-hidden />}
        iconClass="bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
        spark={d.analytics.sparklines.traffic}
        sparkColor="#0284c7"
        vsPrev={t.vsPrev}
      />
      <KpiCard
        label={t.statActiveSuppliers}
        hint={t.statActiveSuppliersHint}
        value={fmtNum(d.analytics.stats.activeSuppliers, locale, true)}
        delta={d.analytics.stats.activeSuppliersGrowthPercent}
        tone="up-good"
        icon={<Users className="h-5 w-5" aria-hidden />}
        iconClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
        spark={d.analytics.sparklines.activeSuppliers}
        sparkColor="#059669"
        vsPrev={t.vsPrev}
      />
    </div>
  )
}
