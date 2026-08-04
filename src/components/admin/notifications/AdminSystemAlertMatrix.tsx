'use client'

import * as React from 'react'
import { Bug, Database, Mail, MessageCircle, ShoppingBag, Smartphone, Wallet } from 'lucide-react'

import type {
  NotificationBooleanPrefKey,
  NotificationNumberPrefKey,
  NotificationPreferencesDraft
} from '@/lib/admin-notification-preferences'
import { cn } from '@/lib/utils'

type MatrixMessages = {
  matrixTitle: string
  matrixSubtitle: string
  triggersSection: string
  activeMonitors: string
  deliveryTitle: string
  threshold: string
  sensitivity: string
  latency: string
  retryPolicy: string
  retryValue: string
  alertCrawlerTitle: string
  alertCrawlerDesc: string
  alertBulkTitle: string
  alertBulkDesc: string
  alertPayoutTitle: string
  alertPayoutDesc: string
  alertDbTitle: string
  alertDbDesc: string
  slackTitle: string
  slackHint: string
  emailDigestTitle: string
  emailDigestHint: string
  smsTitle: string
  smsHint: string
}

function SystemAlertToggle({
  checked,
  onChange,
  ariaLabel
}: {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-surface-container-highest'
      )}
    >
      <span
        className={cn(
          'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'left-6' : 'left-1'
        )}
      />
    </button>
  )
}

function SystemAlertCardShell({
  borderClass,
  icon,
  title,
  desc,
  enabledKey,
  draft,
  onBool,
  children
}: {
  borderClass: string
  icon: React.ReactNode
  title: string
  desc: string
  enabledKey: NotificationBooleanPrefKey
  draft: NotificationPreferencesDraft
  onBool: (key: NotificationBooleanPrefKey, value: boolean) => void
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'space-y-4 rounded-xl border-l-4 bg-surface-container-lowest p-6 shadow-[0_20px_50px_rgba(24,28,32,0.04)]',
        borderClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-primary">
          {icon}
        </div>
        <SystemAlertToggle
          checked={draft[enabledKey] === true}
          onChange={(v) => onBool(enabledKey, v)}
          ariaLabel={title}
        />
      </div>
      <div>
        <h4 className="font-headline font-bold text-on-surface">{title}</h4>
        <p className="text-xs text-on-surface-variant">{desc}</p>
      </div>
      {children}
    </div>
  )
}

export function AdminSystemAlertMatrix({
  draft,
  onBool,
  onNumber,
  m
}: {
  draft: NotificationPreferencesDraft
  onBool: (key: NotificationBooleanPrefKey, value: boolean) => void
  onNumber: (key: NotificationNumberPrefKey, value: number) => void
  m: MatrixMessages
}) {
  const activeCount =
    (draft.monitor_crawler_error_rate === true ? 1 : 0) +
    (draft.monitor_large_bulk_order === true ? 1 : 0) +
    (draft.monitor_failed_payout === true ? 1 : 0) +
    (draft.monitor_db_latency === true ? 1 : 0)

  return (
    <section className="mb-12 space-y-8">
      <div className="max-w-3xl">
        <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">{m.matrixTitle}</h2>
        <p className="mt-2 text-lg leading-relaxed text-on-surface-variant">{m.matrixSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-headline text-xl font-bold text-on-surface">{m.triggersSection}</h3>
            <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-on-primary-container">
              {activeCount} {m.activeMonitors}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SystemAlertCardShell
              borderClass="border-error"
              icon={<Bug className="h-5 w-5 text-error" aria-hidden />}
              title={m.alertCrawlerTitle}
              desc={m.alertCrawlerDesc}
              enabledKey="monitor_crawler_error_rate"
              draft={draft}
              onBool={onBool}
            >
              <div className="border-t border-surface-container-low pt-3">
                <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-tight text-outline">
                  <span>{m.threshold}</span>
                  <span className="text-on-surface">{Number(draft.threshold_crawler_errors_5m)} / 5m</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={50}
                  value={Number(draft.threshold_crawler_errors_5m)}
                  onChange={(e) => onNumber('threshold_crawler_errors_5m', Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer accent-primary"
                  aria-label={m.alertCrawlerTitle}
                />
              </div>
            </SystemAlertCardShell>

            <SystemAlertCardShell
              borderClass="border-tertiary"
              icon={<ShoppingBag className="h-5 w-5 text-tertiary" aria-hidden />}
              title={m.alertBulkTitle}
              desc={m.alertBulkDesc}
              enabledKey="monitor_large_bulk_order"
              draft={draft}
              onBool={onBool}
            >
              <div className="border-t border-surface-container-low pt-3">
                <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-tight text-outline">
                  <span>{m.sensitivity}</span>
                  <span className="text-on-surface">${Number(draft.threshold_bulk_order_usd).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={50000}
                  step={500}
                  value={Number(draft.threshold_bulk_order_usd)}
                  onChange={(e) => onNumber('threshold_bulk_order_usd', Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer accent-primary"
                  aria-label={m.alertBulkTitle}
                />
              </div>
            </SystemAlertCardShell>

            <SystemAlertCardShell
              borderClass="border-primary"
              icon={<Wallet className="h-5 w-5 text-primary" aria-hidden />}
              title={m.alertPayoutTitle}
              desc={m.alertPayoutDesc}
              enabledKey="monitor_failed_payout"
              draft={draft}
              onBool={onBool}
            >
              <div className="flex items-center justify-between border-t border-surface-container-low pt-3">
                <span className="text-[10px] font-bold uppercase tracking-tight text-outline">{m.retryPolicy}</span>
                <span className="rounded bg-surface-container-high px-2 py-0.5 font-mono text-[11px] font-bold text-on-surface">
                  {m.retryValue}
                </span>
              </div>
            </SystemAlertCardShell>

            <SystemAlertCardShell
              borderClass="border-secondary"
              icon={<Database className="h-5 w-5 text-secondary" aria-hidden />}
              title={m.alertDbTitle}
              desc={m.alertDbDesc}
              enabledKey="monitor_db_latency"
              draft={draft}
              onBool={onBool}
            >
              <div className="border-t border-surface-container-low pt-3">
                <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-tight text-outline">
                  <span>{m.latency}</span>
                  <span className="text-on-surface">{Number(draft.threshold_db_latency_ms)} ms</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={1000}
                  step={10}
                  value={Number(draft.threshold_db_latency_ms)}
                  onChange={(e) => onNumber('threshold_db_latency_ms', Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer accent-primary"
                  aria-label={m.alertDbTitle}
                />
              </div>
            </SystemAlertCardShell>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <h3 className="font-headline text-xl font-bold text-on-surface">{m.deliveryTitle}</h3>
          <div className="space-y-6 rounded-2xl bg-surface-container-low p-6">
            {[
              {
                key: 'delivery_channel_slack' as const,
                title: m.slackTitle,
                hint: m.slackHint,
                icon: <MessageCircle className="h-6 w-6 text-primary" aria-hidden />
              },
              {
                key: 'delivery_channel_email' as const,
                title: m.emailDigestTitle,
                hint: m.emailDigestHint,
                icon: <Mail className="h-6 w-6 text-primary" aria-hidden />
              },
              {
                key: 'delivery_channel_sms' as const,
                title: m.smsTitle,
                hint: m.smsHint,
                icon: <Smartphone className="h-6 w-6 text-primary" aria-hidden />
              }
            ].map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm">
                    {row.icon}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-headline text-sm font-bold text-on-surface">{row.title}</h5>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{row.hint}</p>
                  </div>
                </div>
                <SystemAlertToggle
                  checked={draft[row.key] === true}
                  onChange={(v) => onBool(row.key, v)}
                  ariaLabel={row.title}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
