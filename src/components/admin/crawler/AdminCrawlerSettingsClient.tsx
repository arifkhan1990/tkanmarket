'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useAdminSettings, useUpdateAdminSettings, AdminSettingsSkeleton } from '@/hooks/admin/useAdminSettings'
import { useCrawlerDiagnosticsQuery } from '@/hooks/admin/useAdminCrawler'
import { useI18n } from '@/hooks/useI18n'
export function AdminCrawlerSettingsClient() {
  const { messages } = useI18n()
  const s = messages.admin.crawlerSettingsPage
  const settingsQuery = useAdminSettings()
  const updateMutation = useUpdateAdminSettings()
  const diagnosticsQuery = useCrawlerDiagnosticsQuery()

  const settings = settingsQuery.data?.success ? settingsQuery.data.data : null
  const diagnostics = diagnosticsQuery.data?.success ? diagnosticsQuery.data.data : null

  const [draft, setDraft] = useState<{
    crawlerEnabled: boolean
    crawlerDefaultMaxProducts: number
  } | null>(null)

  const values = useMemo(() => {
    if (draft) return draft
    return {
      crawlerEnabled: settings?.crawlerEnabled ?? true,
      crawlerDefaultMaxProducts: settings?.crawlerDefaultMaxProducts ?? 200,
    }
  }, [draft, settings])

  const onSave = () => {
    if (!settings) return
    updateMutation.mutate({
      crawlerEnabled: values.crawlerEnabled,
      crawlerDefaultMaxProducts: values.crawlerDefaultMaxProducts,
      leadRateLimitPerHour: settings.leadRateLimitPerHour,
      notificationEmail: settings.notificationEmail,
    })
  }

  if (settingsQuery.isLoading) return <AdminSettingsSkeleton />
  if (!settings) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{s.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{s.subtitle}</p>
      </div>

      <div className="rounded-[2rem] border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-6 text-xs font-bold uppercase tracking-widest text-outline">{s.generalTab}</div>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">{messages.admin.settingsPage.crawlerEnabled}</div>
              <div className="mt-1 text-sm text-on-surface-variant">{messages.admin.settingsPage.crawlerEnabledHint}</div>
            </div>
            <Checkbox
              checked={values.crawlerEnabled}
              onCheckedChange={(v) =>
                setDraft((prev) => ({
                  ...(prev ?? values),
                  crawlerEnabled: Boolean(v),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{s.maxProducts}</div>
            <div className="text-sm text-on-surface-variant">{s.maxProductsHint}</div>
            <Input
              value={String(values.crawlerDefaultMaxProducts)}
              className="max-w-xs rounded-xl font-mono"
              inputMode="numeric"
              onChange={(e) =>
                setDraft((prev) => ({
                  ...(prev ?? values),
                  crawlerDefaultMaxProducts: Number(e.target.value) || 200,
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-outline/10 bg-surface-container-low p-6">
          <h2 className="font-heading text-lg font-bold">{s.targetsTitle}</h2>
          <p className="mt-2 text-sm text-on-surface-variant">{s.targetsHint}</p>
          <ul className="mt-4 space-y-3">
            {diagnosticsQuery.isFetching && !diagnostics
              ? Array.from({ length: 3 }).map((_, i) => (
                  <li
                    key={i}
                    className="h-11 animate-pulse rounded-xl bg-surface-container-lowest/70"
                    aria-hidden
                  />
                ))
              : (diagnostics?.sourcesSupported ?? []).map((src) => (
                  <li
                    key={src.id}
                    className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-medium"
                  >
                    <span>{src.label}</span>
                    <span className={src.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-outline'}>
                      {src.enabled ? '✓' : '—'}
                    </span>
                  </li>
                ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button className="rounded-full" onClick={onSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? s.saving : s.save}
        </Button>
        <Button variant="outline" className="rounded-full" onClick={() => settingsQuery.refetch()}>
          {messages.admin.settingsPage.reset}
        </Button>
      </div>
    </div>
  )
}
