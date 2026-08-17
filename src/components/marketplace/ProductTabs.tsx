'use client'

import { useState } from 'react'

import type { FabricDetail } from '@/types/marketplace.types'
import { cn } from '@/lib/utils'
import { FabricDetailSourcingFaqAccordion } from '@/components/marketplace/fabric-detail-sourcing-faq'
import { useI18n } from '@/hooks/useI18n'

type TabKey = 'specs' | 'faq'

function typeLabel(v: FabricDetail['fabricType'], labels: Record<string, string>, fallbackOther: string) {
  if (!v) return '—'
  const key = String(v)
  return labels[key] ?? fallbackOther
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="text-xs font-bold uppercase tracking-widest text-outline">{label}</div>
      <div className="text-right text-sm font-extrabold text-on-surface">{value}</div>
    </div>
  )
}

function SpecRowNode({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="text-xs font-bold uppercase tracking-widest text-outline">{label}</div>
      <div className="text-right text-sm font-extrabold text-on-surface">{value}</div>
    </div>
  )
}

export function ProductTabs({ fabric }: { fabric: FabricDetail }) {
  const [tab, setTab] = useState<TabKey>('specs')
  const { locale, messages } = useI18n()
  const wv = messages.product.webV

  const usage =
    locale === 'en'
      ? (fabric.usageEn?.trim() ? fabric.usageEn : fabric.usageRu)
      : (fabric.usageRu?.trim() ? fabric.usageRu : fabric.usageEn)

  const tabs = [
    { key: 'specs' as const, label: messages.product.tabs.specs },
    { key: 'faq' as const, label: wv.faqSourcingTitle }
  ]

  return (
    <div className="w-full min-w-0 max-lg:-mx-6 max-lg:bg-surface-container-low">
      {/*
        Mobile: inner `w-max min-w-full flex-nowrap` so the strip is wider than the viewport when needed
        and horizontal swipe works (flex+min-w-0 alone often collapses or blocks touch scroll).
      */}
      <div
        className={cn(
          'mb-8 max-lg:mb-0 max-lg:pt-4 lg:pt-0',
          'overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x',
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          '[-webkit-overflow-scrolling:touch]'
        )}
      >
        <div
          className={cn(
            'flex w-max min-w-full flex-nowrap justify-start gap-4 border-b border-outline-variant/10 pb-0 sm:gap-6 md:gap-10 lg:gap-12 lg:border-outline-variant/20',
            'max-lg:px-6 max-lg:pe-8 lg:px-0'
          )}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={cn(
                'shrink-0 pb-4 text-left text-sm font-bold uppercase tracking-widest transition-colors',
                t.key === 'faq'
                  ? 'max-w-[11rem] whitespace-normal leading-snug tracking-wide sm:max-w-none sm:whitespace-nowrap sm:tracking-widest'
                  : 'whitespace-nowrap',
                tab === t.key ? 'border-b-2 border-primary text-primary' : 'text-outline hover:text-primary'
              )}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-8 md:grid-cols-3 md:gap-16 max-lg:bg-surface max-lg:px-6 max-lg:pb-8 max-lg:pt-6 lg:gap-12 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0">
        <div className="min-w-0 space-y-8 md:col-span-2">
          {tab === 'specs' ? (
            <div className="space-y-1 divide-y divide-outline-variant/10">
              <SpecRow
                label={messages.product.specs.type}
                value={typeLabel(
                  fabric.fabricType,
                  messages.fabrics.filters.types as unknown as Record<string, string>,
                  messages.fabrics.filters.types.other
                )}
              />
              <SpecRow label={messages.product.specs.gsm} value={fabric.gsm ? String(fabric.gsm) : '—'} />
              <SpecRow
                label={messages.product.specs.width}
                value={fabric.widthCm ? `${fabric.widthCm} cm` : '—'}
              />
              <SpecRow
                label={messages.product.specs.composition}
                value={
                  fabric.composition && fabric.composition.length > 0
                    ? fabric.composition.map((c) => `${c.material} ${c.percentage}%`).join(', ')
                    : '—'
                }
              />
              <SpecRow label={messages.product.specs.sku} value={fabric.sku ?? '—'} />
              <SpecRow label="Color" value={fabric.color ?? '—'} />
              <SpecRow label="Supply Type" value={fabric.supplyType ?? '—'} />
              <SpecRow label="Shipment Time" value={fabric.shipmentTime ?? '—'} />
              <SpecRowNode
                label="Use"
                value={usage?.trim() ? usage : <span className="text-outline">—</span>}
              />
            </div>
          ) : null}

          {tab === 'faq' ? (
            <div className="w-full min-w-0" role="region" aria-label={wv.faqSourcingTitle}>
              <FabricDetailSourcingFaqAccordion items={wv.faqSourcingItems} />
            </div>
          ) : null}
        </div>

        <aside className="h-fit min-w-0 rounded-xl border border-outline-variant/10 bg-surface-container-low p-8 shadow-sm">
          <h4 className="mb-6 font-heading font-bold tracking-tight text-primary">{wv.logisticsOverview}</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex flex-col gap-1 border-t border-outline-variant/10 pt-4">
              <span className="text-outline">{messages.fabrics.compare.cardLogisticsTitle}</span>
              <span className="font-semibold leading-relaxed text-on-surface">
                {messages.fabrics.compare.cardLogisticsBody}
              </span>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  )
}
