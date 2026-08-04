'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  BellRing,
  Bug,
  Database,
  Mail,
  MessageSquare,
  Search,
  ShoppingBag,
  Smartphone,
  Wallet
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  useAdminSystemAlertChannelPatchMutation,
  useAdminSystemAlertConfigQuery,
  useAdminSystemAlertMonitorPatchMutation
} from '@/hooks/admin/useAdminSystemAlertConfig'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import type { SystemAlertMonitorDto } from '@/types/supplier-ops.types'

const THRESHOLD_BOUNDS: Record<string, { min: number; max: number }> = {
  crawler_error_rate: { min: 100, max: 2000 },
  large_bulk_order: { min: 1000, max: 50000 },
  database_latency: { min: 50, max: 1000 }
}

function clampThreshold(monitorKey: string, value: number): number {
  const b = THRESHOLD_BOUNDS[monitorKey]
  if (!b) return value
  return Math.min(b.max, Math.max(b.min, Math.round(value)))
}

function accentBorder(accent: string): string {
  switch (accent) {
    case 'error':
      return 'border-l-4 border-destructive'
    case 'tertiary':
      return 'border-l-4 border-amber-600/90 dark:border-amber-500/80'
    case 'primary':
      return 'border-l-4 border-primary'
    case 'secondary':
      return 'border-l-4 border-secondary'
    default:
      return 'border-l-4 border-outline'
  }
}

function iconWrapClass(accent: string): string {
  switch (accent) {
    case 'error':
      return 'bg-error-container text-red-900 dark:text-red-200'
    case 'tertiary':
      return 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
    case 'primary':
      return 'bg-primary-fixed text-on-primary-fixed-variant'
    case 'secondary':
      return 'bg-secondary-container text-on-secondary-container'
    default:
      return 'bg-surface-container-high text-on-surface'
  }
}

function MonitorIcon({ monitorKey }: { monitorKey: string }) {
  const cls = 'h-5 w-5'
  switch (monitorKey) {
    case 'crawler_error_rate':
      return <Bug className={cls} aria-hidden />
    case 'large_bulk_order':
      return <ShoppingBag className={cls} aria-hidden />
    case 'failed_payout':
      return <Wallet className={cls} aria-hidden />
    case 'database_latency':
      return <Database className={cls} aria-hidden />
    default:
      return <BellRing className={cls} aria-hidden />
  }
}

function ChannelIcon({ channelKey }: { channelKey: string }) {
  const cls = 'h-5 w-5 text-primary'
  switch (channelKey) {
    case 'slack':
      return <MessageSquare className={cls} aria-hidden />
    case 'email':
      return <Mail className={cls} aria-hidden />
    case 'sms':
      return <Smartphone className={cls} aria-hidden />
    default:
      return <BellRing className={cls} aria-hidden />
  }
}

function ConfigSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-8 pb-24">
      <div className="h-10 w-2/3 rounded-xl bg-surface-container-high" />
      <div className="mb-4 flex items-center justify-between">
        <div className="h-7 w-48 rounded-lg bg-surface-container-high" />
        <div className="h-6 w-28 rounded-full bg-surface-container-high" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-xl bg-surface-container-high shadow-[0_20px_50px_rgba(24,28,32,0.04)]"
          />
        ))}
      </div>
    </div>
  )
}

function MonitorCard({
  m,
  p,
  onToggle,
  onThreshold,
  busy
}: {
  m: SystemAlertMonitorDto
  p: {
    threshold: string
    sensitivity: string
    latency: string
    retryPolicy: string
    retryPolicyValue: string
    unitErrors5m: string
    unitUsd: string
    unitMs: string
  }
  onToggle: (id: number, enabled: boolean) => void
  onThreshold: (id: number, monitorKey: string, value: number) => void
  busy: boolean
}) {
  const bounds = THRESHOLD_BOUNDS[m.monitorKey]
  const showSlider = bounds != null
  const value = m.thresholdInt ?? bounds?.min ?? 0

  const formatThreshold = () => {
    if (m.monitorKey === 'crawler_error_rate') return `${value} / 5m`
    if (m.monitorKey === 'large_bulk_order') return `$${value.toLocaleString()}`
    if (m.monitorKey === 'database_latency') return `${value}ms`
    return String(value)
  }

  const sliderLabel =
    m.monitorKey === 'crawler_error_rate'
      ? p.threshold
      : m.monitorKey === 'large_bulk_order'
        ? p.sensitivity
        : m.monitorKey === 'database_latency'
          ? p.latency
          : p.threshold

  return (
    <div
      className={cn(
        'space-y-4 rounded-xl border border-outline/10 bg-surface-container-lowest p-6 shadow-[0_20px_50px_rgba(24,28,32,0.04)]',
        accentBorder(m.accent)
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            iconWrapClass(m.accent)
          )}
        >
          <MonitorIcon monitorKey={m.monitorKey} />
        </div>
        <Checkbox
          checked={m.enabled}
          disabled={busy}
          onCheckedChange={(c) => onToggle(m.id, c === true)}
          aria-label={m.title}
        />
      </div>
      <div>
        <h3 className="font-heading font-bold text-on-surface">{m.title}</h3>
        <p className="mt-1 text-xs text-on-surface-variant">{m.description}</p>
      </div>
      <div className="border-t border-outline/10 pt-3">
        {showSlider ? (
          <div>
            <div className="mb-1 flex justify-between text-[10px] font-medium uppercase tracking-tighter text-outline">
              <span>{sliderLabel}</span>
              <span className="font-bold text-on-surface">{formatThreshold()}</span>
            </div>
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              value={value}
              disabled={busy}
              onChange={(e) => onThreshold(m.id, m.monitorKey, Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-primary disabled:opacity-50"
            />
            <p className="mt-1 text-[10px] text-on-surface-variant">
              {m.monitorKey === 'crawler_error_rate'
                ? p.unitErrors5m
                : m.monitorKey === 'large_bulk_order'
                  ? p.unitUsd
                  : p.unitMs}
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-on-surface-variant">
            <span className="font-bold text-on-surface">{p.retryPolicy}:</span> {p.retryPolicyValue}
          </p>
        )}
      </div>
    </div>
  )
}

export function AdminSystemAlertConfigClient({ embedded = false }: { embedded?: boolean }) {
  const { messages, locale } = useI18n()
  const p = messages.admin.systemAlertsPage
  const cfg = messages.admin.systemAlertConfigPage
  const q = useAdminSystemAlertConfigQuery()
  const monitorMut = useAdminSystemAlertMonitorPatchMutation()
  const channelMut = useAdminSystemAlertChannelPatchMutation()
  const [monitorSearch, setMonitorSearch] = React.useState('')

  const patchMonitor = React.useCallback(
    (id: number, input: { enabled?: boolean; threshold_int?: number | null }) => {
      monitorMut.mutate({ id, ...input })
    },
    [monitorMut]
  )

  const onThreshold = React.useCallback(
    (id: number, monitorKey: string, raw: number) => {
      const clamped = clampThreshold(monitorKey, raw)
      patchMonitor(id, { threshold_int: clamped })
    },
    [patchMonitor]
  )

  const filteredMonitors = React.useMemo(() => {
    if (!q.data) return []
    const needle = monitorSearch.trim().toLowerCase()
    if (!needle) return q.data.monitors
    return q.data.monitors.filter((m) => {
      const hay = `${m.title} ${m.description} ${m.monitorKey}`.toLowerCase()
      return hay.includes(needle)
    })
  }, [q.data, monitorSearch])

  if (q.isLoading || !q.data) {
    return (
      <div className={embedded ? 'pb-10' : ''}>
        <ConfigSkeleton />
      </div>
    )
  }

  if (q.isError) {
    return (
      <div className={embedded ? 'space-y-6 pb-10' : 'mx-auto max-w-6xl space-y-6 pb-24'}>
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          {q.error instanceof Error ? q.error.message : cfg.loadError}
          <Button type="button" variant="outline" size="sm" className="ml-3" onClick={() => void q.refetch()}>
            {p.retry}
          </Button>
        </div>
        <p>
          <Link
            href={withLocaleUrl('/admin/system-alerts', locale)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {cfg.crossLinkJsonPolicy}
          </Link>
        </p>
      </div>
    )
  }

  const data = q.data
  const active = data.monitors.filter((m) => m.enabled).length
  const badge = p.activeMonitorsBadge.replace('{n}', String(active))

  return (
    <div className={embedded ? 'space-y-6 pb-10' : 'mx-auto max-w-6xl pb-28'}>
      {!embedded ? (
        <header className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{p.title}</h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-on-surface-variant">{cfg.subtitle}</p>
            <p className="mt-2">
              <Link
                href={withLocaleUrl('/admin/system-alerts', locale)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                {cfg.crossLinkJsonPolicy}
              </Link>
            </p>
          </div>
          <div className="relative w-full max-w-md shrink-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
              aria-hidden
            />
            <Input
              type="search"
              value={monitorSearch}
              onChange={(e) => setMonitorSearch(e.target.value)}
              placeholder={cfg.monitorSearchPlaceholder}
              className="rounded-xl border-outline/20 bg-surface-container-low pl-9 font-body text-sm"
              aria-label={cfg.monitorSearchPlaceholder}
            />
          </div>
        </header>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-bold text-on-surface">{p.matrixTitle}</h2>
            <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-white">
              {badge}
            </span>
          </div>

          {filteredMonitors.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-outline/20 bg-surface-container-low/40 px-6 py-10 text-center text-sm text-on-surface-variant">
              {cfg.monitorFilterEmpty}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredMonitors.map((m) => (
                <MonitorCard
                  key={m.id}
                  m={m}
                  p={p}
                  busy={monitorMut.isPending && monitorMut.variables?.id === m.id}
                  onToggle={(id, enabled) => patchMonitor(id, { enabled })}
                  onThreshold={onThreshold}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-4">
          <h2 className="font-heading text-xl font-bold text-on-surface">{p.channelsTitle}</h2>
          <div className="space-y-4 rounded-2xl border border-outline/10 bg-surface-container-low p-6">
            {data.channels.map((ch) => (
              <div key={ch.id} className="border-b border-outline/10 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm">
                      <ChannelIcon channelKey={ch.channelKey} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading text-sm font-bold text-on-surface">{ch.label}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{ch.subtitle}</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={ch.enabled}
                    disabled={channelMut.isPending && channelMut.variables?.id === ch.id}
                    onCheckedChange={(c) => channelMut.mutate({ id: ch.id, enabled: c === true })}
                    aria-label={ch.label}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-on-surface">{p.logsTitle}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{p.logsSubtitle}</p>
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
        <div className="overflow-x-auto rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-[0_20px_50px_rgba(24,28,32,0.04)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-outline/10 bg-surface-container-low/80 text-[11px] uppercase tracking-widest text-on-surface-variant">
                <th className="px-4 py-3">{p.colDescription}</th>
                <th className="px-4 py-3">{p.colDetail}</th>
                <th className="px-4 py-3">{p.colLoad}</th>
                <th className="px-4 py-3">{p.colStatus}</th>
                <th className="px-4 py-3">{p.colLast}</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant">
                    {p.logsEmpty}
                  </td>
                </tr>
              ) : (
                data.logs.map((row) => (
                  <tr key={row.id} className="border-b border-outline/5 hover:bg-surface-container-low/40">
                    <td className="px-4 py-3 font-mono text-xs text-on-surface">{row.label}</td>
                    <td className="max-w-xs px-4 py-3 text-xs text-on-surface-variant">{row.workerHint}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.avgLoadMs}ms</td>
                    <td className="px-4 py-3 text-xs">{row.status}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">
                      {new Date(row.lastTriggeredAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
