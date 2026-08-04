'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminSystemPreferences, useUpdateRegionalPreferences } from '@/hooks/admin/useAdminSystemConsole'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

const CURRENCIES = ['USD', 'RUB', 'EUR', 'GBP', 'CNY'] as const
const TIMEZONES = ['UTC', 'Europe/Moscow', 'Asia/Shanghai', 'America/New_York'] as const

function skuPreview(pattern: string, seq: number) {
  const y = new Date().getFullYear()
  const base = pattern.replace('{{CAT}}', 'ELEC').replace('{{YEAR}}', String(y))
  const n = String(452).padStart(seq, '0')
  return base.includes('{{SEQ}}') ? base.replace('{{SEQ}}', n) : `${base}-${n}`
}

export function AdminSystemPreferencesClient() {
  const { messages } = useI18n()
  const q = useAdminSystemPreferences()
  const mut = useUpdateRegionalPreferences()
  const [tab, setTab] = useState('regional')
  const [currency, setCurrency] = useState<string | null>(null)
  const [tz, setTz] = useState<string | null>(null)
  const [skuPattern, setSkuPattern] = useState<string | null>(null)
  const [skuLen, setSkuLen] = useState<number | null>(null)

  const prefs = q.data?.preferences
  const effectiveCurrency = currency ?? prefs?.primaryCurrency ?? 'USD'
  const effectiveTz = tz ?? prefs?.platformTimezone ?? 'UTC'
  const effectivePattern = skuPattern ?? prefs?.skuPrefixPattern ?? 'MKTP-{{CAT}}-{{YEAR}}'
  const effectiveLen = skuLen ?? prefs?.skuSequenceLength ?? 6

  const preview = useMemo(() => skuPreview(effectivePattern, effectiveLen), [effectivePattern, effectiveLen])

  if (q.isLoading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-surface-container-high" />
  }
  if (q.isError || !q.data) {
    return (
      <p className="text-destructive text-sm">
        {q.error instanceof Error ? q.error.message : messages.admin.systemConsole.loadFailed}
      </p>
    )
  }

  const { taxRegions, configurationIntegrity, recentChanges, maintenanceWindow } = q.data

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">
          {messages.admin.sidebar.systemPreferences}
        </h1>
        <p className="mt-2 max-w-2xl text-on-surface-variant">
          Platform-wide defaults for currency, time, taxes, and SKU generation.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6 flex w-full flex-wrap gap-1 rounded-2xl bg-surface-container-low p-1.5 md:w-auto">
          <TabsTrigger value="regional" className="rounded-xl">
            Regional &amp; currency
          </TabsTrigger>
          <TabsTrigger value="sku" className="rounded-xl">
            Logic &amp; SKUs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regional" className="space-y-6">
          <Card className="rounded-3xl border border-outline/10">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Regional core</h3>
                <p className="text-sm text-on-surface-variant">Default financial and temporal anchors.</p>
              </div>
              <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] text-on-surface-variant">
                Updated {new Date(prefs?.updatedAt ?? '').toLocaleString()}
              </span>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-outline">Primary currency</span>
                <Select value={effectiveCurrency} onValueChange={setCurrency}>
                  <SelectTrigger className="rounded-xl py-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-outline">Platform timezone</span>
                <Select value={effectiveTz} onValueChange={setTz}>
                  <SelectTrigger className="rounded-xl py-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] italic text-on-surface-variant">Logging and scheduled tasks use this anchor.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-outline/10">
            <CardHeader>
              <h3 className="text-lg font-bold">Regional tax rates</h3>
              <p className="text-sm text-on-surface-variant">Destination defaults (read-only snapshot).</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {taxRegions.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface p-4 transition hover:bg-surface-container-low"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high font-bold text-primary">
                      {t.regionCode}
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{t.label}</p>
                      <p className="text-xs text-on-surface-variant">{t.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-primary">{t.ratePercent}%</p>
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant">VAT</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sku" className="space-y-6">
          <Card className="rounded-3xl border border-outline/10">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">SKU generation logic</h3>
                <p className="text-sm text-on-surface-variant">How catalog identifiers are composed.</p>
              </div>
              <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] text-on-surface-variant">
                System default
              </span>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Prefix pattern</span>
                  <Input
                    className="rounded-xl py-6 font-mono text-sm"
                    value={effectivePattern}
                    onChange={(e) => setSkuPattern(e.target.value)}
                  />
                </div>
                <div className="w-full space-y-2 md:w-40">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Sequence length</span>
                  <Input
                    type="number"
                    min={3}
                    max={12}
                    className="rounded-xl py-6 font-mono"
                    value={effectiveLen}
                    onChange={(e) => setSkuLen(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-on-surface p-6 text-background">
                <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-background/55">
                  <span>Preview</span>
                  <span className="text-emerald-400">Valid pattern</span>
                </div>
                <p className="font-mono text-xl tracking-widest">{preview}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-0 bg-primary text-primary-foreground lg:col-span-1">
          <CardHeader>
            <h3 className="text-lg font-bold">Maintenance window</h3>
            <p className="text-sm text-primary-foreground/80">
              {maintenanceWindow.scheduledStart && maintenanceWindow.scheduledEnd
                ? `${new Date(maintenanceWindow.scheduledStart).toLocaleString()} – ${new Date(maintenanceWindow.scheduledEnd).toLocaleString()}`
                : 'Schedule in the maintenance console.'}
            </p>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full rounded-xl font-bold" asChild>
              <Link href="/admin/system/maintenance">Edit window</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-outline/10 lg:col-span-2">
          <CardHeader>
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Configuration integrity
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              [
                ['Schema sync', configurationIntegrity.schemaSync],
                ['Tax engine', configurationIntegrity.taxEngine],
                ['Currency API', configurationIntegrity.currencyApi]
              ] as const
            ).map(([label, st]) => (
              <div key={label} className="flex items-center justify-between px-2">
                <span className="text-sm font-medium">{label}</span>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full shadow-sm',
                    st === 'ok' && 'bg-emerald-500 shadow-emerald-500/50',
                    st === 'warn' && 'bg-amber-500 shadow-amber-500/50',
                    st === 'error' && 'bg-red-500'
                  )}
                />
              </div>
            ))}
            {configurationIntegrity.currencyApiNote ? (
              <p className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-3 text-[11px] text-on-surface-variant">
                {configurationIntegrity.currencyApiNote}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="px-2">
        <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Recent changes</h4>
        <ul className="relative space-y-6 border-l border-outline/20 pl-6">
          {recentChanges.map((c) => (
            <li key={c.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-surface" />
              <p className="text-xs font-bold">{c.title}</p>
              <p className="text-[10px] text-on-surface-variant">
                {c.actor} · {new Date(c.occurredAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4 lg:left-[var(--admin-sidebar-width)]">
        <div className="flex gap-2 rounded-2xl border border-outline/10 bg-surface-container-lowest/95 p-2 shadow-2xl backdrop-blur">
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl px-6"
            onClick={() => {
              setCurrency(null)
              setTz(null)
              setSkuPattern(null)
              setSkuLen(null)
              void q.refetch()
            }}
          >
            Discard
          </Button>
          <Button
            type="button"
            className="rounded-xl px-8 font-bold"
            disabled={mut.isPending}
            onClick={() =>
              mut.mutate({
                primaryCurrency: currency ?? undefined,
                platformTimezone: tz ?? undefined,
                skuPrefixPattern: skuPattern ?? undefined,
                skuSequenceLength: skuLen ?? undefined
              })
            }
          >
            {mut.isPending ? 'Saving…' : 'Apply preferences'}
          </Button>
        </div>
      </div>
    </div>
  )
}
