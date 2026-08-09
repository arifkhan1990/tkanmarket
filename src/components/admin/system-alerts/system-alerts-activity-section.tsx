'use client'

import { StatusPill } from '@/components/admin/system-alerts/system-alerts-ui'
import { Button } from '@/components/ui/button'
import type { Messages } from '@/lib/i18n/get-messages'
import type { SystemAlertActivityRow } from '@/types/system-alerts.types'

type SystemAlertsPage = Messages['admin']['systemAlertsPage']

export function SystemAlertsActivitySection({
  p,
  totalCount,
  filteredActivity
}: {
  p: SystemAlertsPage
  totalCount: number
  filteredActivity: SystemAlertActivityRow[]
}) {
  return (
    <section className="mt-14 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-on-surface">{p.logsTitle}</h2>
          <p className="mt-1 max-w-lg text-sm text-on-surface-variant">{p.logsSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" className="rounded-lg text-xs font-bold" disabled>
            {p.filter}
          </Button>
          <Button type="button" variant="secondary" size="sm" className="rounded-lg text-xs font-bold" disabled>
            {p.exportCsvSoon}
          </Button>
        </div>
      </div>
      {totalCount === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline/20 bg-surface-container-low/40 px-6 py-10 text-center text-sm text-on-surface-variant">
          {p.logsEmpty}
        </p>
      ) : filteredActivity.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline/20 bg-surface-container-low/40 px-6 py-10 text-center text-sm text-on-surface-variant">
          {p.activitySearchEmpty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-[0_20px_50px_rgba(24,28,32,0.04)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="bg-surface-container-low/80 text-[11px] uppercase tracking-wider text-on-surface-variant">
                <th className="px-4 py-3">{p.colMonitor}</th>
                <th className="px-4 py-3">{p.colDescription}</th>
                <th className="px-4 py-3 text-right">{p.colMetric}</th>
                <th className="px-4 py-3">{p.colStatus}</th>
                <th className="px-4 py-3 text-right">{p.colLast}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {filteredActivity.map((row) => (
                <tr key={row.monitorId} className="hover:bg-surface-container-low/40">
                  <td className="px-4 py-4 font-mono text-xs text-primary">{row.monitorId}</td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-on-surface">{row.title}</div>
                    <div className="text-[10px] text-on-surface-variant">{row.subtitle}</div>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-xs">{row.metricLabel}</td>
                  <td className="px-4 py-4">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-4 py-4 text-right text-xs text-on-surface-variant">
                    {row.lastTriggered ? new Date(row.lastTriggered).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
