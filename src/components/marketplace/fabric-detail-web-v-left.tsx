import { ImageGallery } from '@/components/marketplace/ImageGallery'
import type { Messages } from '@/lib/i18n/get-messages'
import type { FabricDetail } from '@/types/marketplace.types'

type FabricDetailWebVLeftMessages = Messages['product']['webV']

function barPctFromGsm(gsm: number | null): number | null {
  if (gsm == null) return null
  return Math.min(100, Math.max(0, Math.round((gsm / 400) * 100)))
}

function barPctFromWidthCm(widthCm: number | null): number | null {
  if (widthCm == null) return null
  return Math.min(100, Math.max(0, Math.round((widthCm / 200) * 100)))
}

function barPctFromMoq(moq: number | null): number | null {
  if (moq == null) return null
  return Math.min(100, Math.max(0, 100 - Math.round((moq / 5000) * 100)))
}

function barPctFromViews(views: number): number | null {
  if (views <= 0) return null
  return Math.min(100, Math.max(0, Math.round((views / 800) * 100)))
}

function MetricBar({
  label,
  valueText,
  pct
}: {
  label: string
  valueText: string
  pct: number | null
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-bold text-secondary">{label}</span>
        <span className="text-xs font-bold text-primary">{valueText}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: pct == null ? '0%' : `${pct}%` }}
        />
      </div>
    </div>
  )
}

/** Hero gallery only — use with {@link FabricDetailWebVStacks} on mobile-first layouts (`design/mobile-v.html`). */
export function FabricDetailWebVGallery({ fabric, title }: { fabric: FabricDetail; title: string }) {
  return <ImageGallery images={fabric.images ?? []} title={title} />
}

/** Metrics, care, traceability — striped section backgrounds on small screens like mobile-v. */
export function FabricDetailWebVStacks({
  fabric,
  messages: vm
}: {
  fabric: FabricDetail
  messages: FabricDetailWebVLeftMessages
}) {
  const gsmPct = barPctFromGsm(fabric.gsm)
  const widthPct = barPctFromWidthCm(fabric.widthCm)
  const moqPct = barPctFromMoq(fabric.moq)
  const viewsPct = barPctFromViews(fabric.viewsCount ?? 0)

  const gsmText = fabric.gsm != null ? String(fabric.gsm) : vm.notSpecified
  const widthText = fabric.widthCm != null ? `${fabric.widthCm} cm` : vm.notSpecified
  const moqText = fabric.moq != null ? `${fabric.moq} m` : vm.notSpecified
  const viewsText = String(fabric.viewsCount ?? 0)

  const aiAt =
    fabric.aiProcessedAt && fabric.aiProcessedAt.length > 0
      ? new Date(fabric.aiProcessedAt).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      : null

  return (
    <div className="flex w-full min-w-0 flex-col max-lg:gap-0 lg:space-y-10">
      <div className="max-lg:bg-surface max-lg:px-6 max-lg:py-8 lg:rounded-xl lg:border lg:border-outline-variant/10 lg:bg-surface-container-lowest lg:p-6 lg:shadow-sm">
        <h3 className="mb-6 font-heading text-sm font-bold uppercase tracking-widest text-primary">
          {vm.performanceMetrics}
        </h3>
        <div className="grid max-lg:grid-cols-1 max-lg:gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="space-y-5">
            <MetricBar label={vm.metricGsm} valueText={gsmText} pct={gsmPct} />
            <MetricBar label={vm.metricWidth} valueText={widthText} pct={widthPct} />
          </div>
          <div className="space-y-5">
            <MetricBar label={vm.metricMoq} valueText={moqText} pct={moqPct} />
            <MetricBar label={vm.metricCatalogViews} valueText={viewsText} pct={viewsPct} />
          </div>
        </div>
      </div>

      <div className="max-lg:bg-surface-container-low max-lg:px-6 max-lg:py-8 lg:rounded-xl lg:border lg:border-outline-variant/10 lg:bg-surface-container-lowest lg:p-6 lg:shadow-sm">
        <h3 className="mb-6 font-heading text-sm font-bold uppercase tracking-widest text-primary">{vm.careGuide}</h3>
        <p className="text-xs italic leading-relaxed text-on-surface-variant">{vm.careNote}</p>
      </div>

      <div className="max-lg:border-y max-lg:border-outline-variant/10 max-lg:bg-surface max-lg:px-6 max-lg:py-8 lg:rounded-xl lg:border lg:border-outline-variant/10 lg:bg-surface-container-lowest lg:p-8 lg:shadow-sm">
        <h3 className="mb-6 font-heading text-sm font-bold uppercase tracking-widest text-primary">{vm.traceability}</h3>
        <div className="flex flex-col gap-8">
          {fabric.isFeatured ? (
            <div className="flex items-start gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <div>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{vm.featuredTitle}</h4>
                <p className="mt-1 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-200/90">{vm.featuredBody}</p>
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-4">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-tighter text-secondary">{vm.aiConfidence}</div>
              <div className="text-xl font-bold text-primary">
                {fabric.aiConfidenceScore != null && fabric.aiConfidenceScore.length > 0 ? fabric.aiConfidenceScore : vm.notSpecified}
              </div>
            </div>
            <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-4">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-tighter text-secondary">{vm.aiProcessedAt}</div>
              <div className="text-sm font-bold text-on-surface">{aiAt ?? vm.notSpecified}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Desktop default: gallery + stacks in one column (legacy). */
export function FabricDetailWebVLeft({
  fabric,
  title,
  messages
}: {
  fabric: FabricDetail
  title: string
  messages: FabricDetailWebVLeftMessages
}) {
  return (
    <div className="w-full min-w-0 space-y-10">
      <FabricDetailWebVGallery fabric={fabric} title={title} />
      <FabricDetailWebVStacks fabric={fabric} messages={messages} />
    </div>
  )
}
