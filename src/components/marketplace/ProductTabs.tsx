'use client'

import Link from 'next/link'
import { useState } from 'react'

import type { FabricDetail } from '@/types/marketplace.types'
import { cn } from '@/lib/utils'
import { FabricDetailSourcingFaqAccordion } from '@/components/marketplace/fabric-detail-sourcing-faq'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocalizedFabricTitle, getLocalizedFabricTags } from '@/lib/i18n/localized-fabric'

type TabKey = 'description' | 'specs' | 'supplier' | 'compliance' | 'faq'

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
  const [tab, setTab] = useState<TabKey>('description')
  const { locale, messages } = useI18n()
  const wv = messages.product.webV

  const fabricTitle = getLocalizedFabricTitle(fabric, locale)
  const description =
    locale === 'en'
      ? (fabric.descriptionEn?.trim() ? fabric.descriptionEn : fabric.descriptionRu)
      : fabric.descriptionRu
  const localizedTags = getLocalizedFabricTags(fabric, locale)

  const origin = [fabric.supplier.country, fabric.supplier.city].filter(Boolean).join(', ')

  const tabs = [
    { key: 'description' as const, label: messages.product.tabs.description },
    { key: 'specs' as const, label: messages.product.tabs.specs },
    { key: 'supplier' as const, label: messages.product.tabs.supplier },
    { key: 'compliance' as const, label: wv.complianceTab },
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
          {tab === 'description' ? (
            <div>
              <h3 className="mb-4 font-heading text-2xl font-bold tracking-tight text-on-surface">
                {fabricTitle}
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
                {description?.trim() ? description : messages.product.descriptionMissing}
              </p>
            </div>
          ) : null}

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
              <SpecRow label={messages.product.specs.moq} value={fabric.moq ? String(fabric.moq) : '—'} />
              <SpecRow label={messages.product.specs.price} value={fabric.priceUsd ? `$${fabric.priceUsd} / m` : '—'} />
              <SpecRow label={messages.product.specs.sku} value={fabric.sku ?? '—'} />
              <SpecRowNode
                label={messages.product.specs.source}
                value={
                  fabric.sourceUrl ? (
                    <a
                      href={fabric.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex font-extrabold text-primary hover:underline underline-offset-4"
                    >
                      {messages.product.specs.openSource}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
            </div>
          ) : null}

          {tab === 'supplier' ? (
            <div className="space-y-4">
              <div className="text-sm font-extrabold text-on-surface">{fabric.supplier.name}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{fabricTitle}</div>
              <div className="text-sm text-on-surface-variant">
                {fabric.supplier.country}
                {fabric.supplier.city ? `, ${fabric.supplier.city}` : ''}
              </div>
              {fabric.supplier.province ? (
                <div className="text-sm text-on-surface-variant">{fabric.supplier.province}</div>
              ) : null}
              <Link
                href={withLocaleUrl(`/suppliers/${fabric.supplier.slug}`, locale)}
                className="inline-block text-sm font-extrabold text-primary hover:underline underline-offset-4"
              >
                {messages.product.goToSupplier}
              </Link>
            </div>
          ) : null}

          {tab === 'compliance' ? (
            <div className="space-y-6">
              <p className="text-sm leading-relaxed text-on-surface-variant">{wv.logisticsLeadNote}</p>
              <div className="space-y-1 divide-y divide-outline-variant/10">
                <SpecRow
                  label={messages.product.specs.composition}
                  value={
                    fabric.composition && fabric.composition.length > 0
                      ? fabric.composition.map((c) => `${c.material} ${c.percentage}%`).join(', ')
                      : '—'
                  }
                />
                <SpecRow
                  label={wv.aiConfidence}
                  value={fabric.aiConfidenceScore && fabric.aiConfidenceScore.length > 0 ? fabric.aiConfidenceScore : '—'}
                />
                <SpecRow label={wv.aiProcessedAt} value={fabric.aiProcessedAt ? String(fabric.aiProcessedAt) : '—'} />
                <SpecRow label={wv.featuredTitle} value={fabric.isFeatured ? wv.yes : wv.no} />
              </div>
              {fabric.tags && fabric.tags.length > 0 ? (
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-outline">
                    {messages.product.specs.tags}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {localizedTags.map((t, i) => (
                      <span
                        key={`${t}-${i}`}
                        className="rounded-full border border-outline-variant/20 bg-surface-container-low px-3 py-1 text-xs font-semibold text-secondary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
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
            <li className="flex items-center justify-between gap-2">
              <span className="text-outline">{wv.logisticsOrigin}</span>
              <span className="max-w-[55%] text-right font-semibold text-on-surface">{origin || '—'}</span>
            </li>
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
