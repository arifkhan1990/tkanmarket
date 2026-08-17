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

  const gsmText = fabric.gsm != null ? String(fabric.gsm) : vm.notSpecified
  const widthText = fabric.widthCm != null ? `${fabric.widthCm} cm` : vm.notSpecified
  const colorText = fabric.color?.trim() ? fabric.color : vm.notSpecified
  const supplyTypeText = fabric.supplyType?.trim() ? fabric.supplyType : vm.notSpecified
  const shipmentTimeText = fabric.shipmentTime?.trim() ? fabric.shipmentTime : vm.notSpecified
  const compositionText =
    fabric.composition && fabric.composition.length > 0
      ? fabric.composition.map((c) => `${c.material} ${c.percentage}%`).join(', ')
      : vm.notSpecified

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
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary">Color</span>
              <span className="text-xs font-bold text-primary">{colorText}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary">Supply Type</span>
              <span className="text-xs font-bold text-primary">{supplyTypeText}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-lg:bg-surface-container-low max-lg:px-6 max-lg:py-8 lg:rounded-xl lg:border lg:border-outline-variant/10 lg:bg-surface-container-lowest lg:p-6 lg:shadow-sm">
        <h3 className="mb-6 font-heading text-sm font-bold uppercase tracking-widest text-primary">{vm.careGuide}</h3>
        <p className="text-xs italic leading-relaxed text-on-surface-variant">{vm.careNote}</p>
      </div>

      <div className="max-lg:border-y max-lg:border-outline-variant/10 max-lg:bg-surface max-lg:px-6 max-lg:py-8 lg:rounded-xl lg:border lg:border-outline-variant/10 lg:bg-surface-container-lowest lg:p-8 lg:shadow-sm">
        <h3 className="mb-6 font-heading text-sm font-bold uppercase tracking-widest text-primary">{vm.traceability}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-4">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-tighter text-secondary">Composition</div>
            <div className="text-sm font-bold text-on-surface">{compositionText}</div>
          </div>
          <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-4">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-tighter text-secondary">Shipment Time</div>
            <div className="text-sm font-bold text-on-surface">{shipmentTimeText}</div>
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
