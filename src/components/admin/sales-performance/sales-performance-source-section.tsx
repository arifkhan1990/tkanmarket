import { LeadsBySourceChart } from '@/components/admin/charts/LeadsBySourceChart'
import { invPanelFlat, invText } from '@/components/admin/inventory-suite/inventory-suite-styles'
import type { Messages } from '@/lib/i18n/get-messages'
import { cn } from '@/lib/utils'
import type { AdminSalesPerformanceResponse } from '@/types/admin-sales-performance.types'

type T = Messages['admin']['salesPerformancePage']

export function SalesPerformanceSourceSection(props: {
  d: AdminSalesPerformanceResponse
  t: T
}) {
  const { d, t } = props
  return (
    <section className="mb-4">
      <h2 className={cn('mb-4 text-lg font-bold', invText.title)}>{t.sourceMixTitle}</h2>
      <div className={cn(invPanelFlat(), 'p-4 md:p-6')}>
        <LeadsBySourceChart data={d.analytics.leadsBySource} />
      </div>
    </section>
  )
}
