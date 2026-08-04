'use client'

import * as React from 'react'
import Link from 'next/link'
import { BellRing, Info, Search } from 'lucide-react'
import { toast } from 'sonner'

import { AlertsSkeleton } from '@/components/admin/system-alerts/system-alerts-ui'
import { SystemAlertsActivitySection } from '@/components/admin/system-alerts/system-alerts-activity-section'
import { SystemAlertsMatrixAndChannels } from '@/components/admin/system-alerts/system-alerts-matrix-and-channels'
import { countLeafDiffs, UnsavedFooterText } from '@/components/admin/system-alerts/system-alerts-unsaved-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useAdminSystemAlertsQuery,
  useAdminSystemAlertsSave,
  toastSystemAlertsError
} from '@/hooks/admin/useAdminSystemAlerts'
import { useI18n } from '@/hooks/useI18n'
import { ADMIN_MAIN_CONTENT_HORIZONTAL_PADDING_CLASS } from '@/lib/admin-layout'
import { cn } from '@/lib/utils'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { DEFAULT_SYSTEM_ALERTS } from '@/lib/admin-system-alerts-defaults'
import type { SystemAlertActivityRow, SystemAlertsConfig } from '@/types/system-alerts.types'

export function AdminSystemAlertsClient({ embedded = false }: { embedded?: boolean }) {
  const { messages, locale } = useI18n()
  const p = messages.admin.systemAlertsPage
  const ns = messages.admin.notificationSettingsPage
  const q = useAdminSystemAlertsQuery()
  const save = useAdminSystemAlertsSave()
  const serverConfig = q.data?.config

  const [draft, setDraft] = React.useState<SystemAlertsConfig | null>(null)
  const [activityQuery, setActivityQuery] = React.useState('')

  React.useEffect(() => {
    if (serverConfig) setDraft(serverConfig)
  }, [serverConfig])

  const update = React.useCallback((fn: (d: SystemAlertsConfig) => SystemAlertsConfig) => {
    setDraft((prev) => {
      const base = prev ?? structuredClone(DEFAULT_SYSTEM_ALERTS)
      return fn(base)
    })
  }, [])

  const onSave = () => {
    if (!draft) return
    save.mutate(draft, {
      onSuccess: () => toast.success(p.saveOk),
      onError: toastSystemAlertsError
    })
  }

  const dirtyLeafCount = React.useMemo(() => {
    if (!draft || !serverConfig) return 0
    return countLeafDiffs(draft, serverConfig)
  }, [draft, serverConfig])

  const filteredActivity = React.useMemo(() => {
    const rows: SystemAlertActivityRow[] = q.data?.activity ?? []
    const needle = activityQuery.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => {
      const hay = [row.monitorId, row.title, row.subtitle, row.metricLabel].join(' ').toLowerCase()
      return hay.includes(needle)
    })
  }, [q.data?.activity, activityQuery])

  if (q.isLoading || !draft || !q.data) {
    return (
      <div className={embedded ? 'pb-10' : 'mx-auto max-w-6xl pb-24'}>
        <AlertsSkeleton />
      </div>
    )
  }

  const badgeText = p.activeMonitorsBadge.replace('{n}', String(q.data.activeMonitorCount))

  return (
    <div className={embedded ? 'space-y-6 pb-10' : 'mx-auto max-w-6xl pb-28'}>
      {!embedded ? (
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{p.title}</h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-on-surface-variant">{p.subtitle}</p>
            <p className="mt-2">
              <Link
                href={withLocaleUrl('/admin/system-alert-config', locale)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                {p.crossLinkDbPolicy}
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
              value={activityQuery}
              onChange={(e) => setActivityQuery(e.target.value)}
              placeholder={p.searchPlaceholder}
              className="rounded-xl border-outline/20 bg-surface-container-low pl-9 font-body text-sm"
              aria-label={p.searchPlaceholder}
            />
          </div>
        </header>
      ) : null}

      {q.isError ? (
        <div className="mb-6 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          {q.error instanceof Error ? q.error.message : p.loadError}
          <Button type="button" variant="outline" size="sm" className="ml-3" onClick={() => void q.refetch()}>
            {p.retry}
          </Button>
        </div>
      ) : null}

      <SystemAlertsMatrixAndChannels p={p} ns={ns} draft={draft} badgeText={badgeText} update={update} />

      <SystemAlertsActivitySection
        p={p}
        totalCount={q.data.activity.length}
        filteredActivity={filteredActivity}
      />

      <div
        className={cn(
          embedded
            ? 'mt-10 rounded-2xl border border-outline/15 bg-surface-container-lowest px-4 py-4'
            : 'fixed bottom-0 left-0 right-0 z-40 border-t border-outline/15 bg-surface/90 py-4 shadow-[0_-8px_30px_rgba(24,28,32,0.06)] backdrop-blur-md md:left-[var(--admin-sidebar-offset,0px)]',
          !embedded && ADMIN_MAIN_CONTENT_HORIZONTAL_PADDING_CLASS
        )}
        role="region"
        aria-label={dirtyLeafCount > 0 ? p.unsavedHint : p.footerHint}
      >
        <div className={embedded ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between' : 'mx-auto flex max-w-6xl flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center'}>
          {dirtyLeafCount > 0 ? (
            <>
              <p className="flex items-start gap-3 text-xs font-medium text-on-surface sm:items-center">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-destructive sm:mt-0" aria-hidden />
                <span>
                  <UnsavedFooterText
                    template={p.unsavedFooterTemplate}
                    count={dirtyLeafCount}
                    matrixLabel={p.matrixShortName}
                  />
                </span>
              </p>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => q.data && setDraft(structuredClone(q.data.config))}
                >
                  {p.discard}
                </Button>
                <Button type="button" className="rounded-xl shadow-md" disabled={save.isPending} onClick={onSave}>
                  {p.save}
                </Button>
              </div>
            </>
          ) : (
            <p className="flex items-center gap-3 text-xs font-medium text-on-surface-variant sm:pr-4">
              <BellRing className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {p.footerHint}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
