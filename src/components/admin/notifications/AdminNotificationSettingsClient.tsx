'use client'

import * as React from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { AdminSystemAlertMatrix } from '@/components/admin/notifications/AdminSystemAlertMatrix'
import { useAdminNotificationSettings, useUpdateAdminNotificationSettings } from '@/hooks/admin/useAdminNotificationSettings'
import { useI18n } from '@/hooks/useI18n'
import type { NotificationBooleanPrefKey, NotificationNumberPrefKey } from '@/lib/admin-notification-preferences'
import { mergeNotificationPreferences, type NotificationPreferencesDraft } from '@/lib/admin-notification-preferences'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ADMIN_MAIN_CONTENT_HORIZONTAL_PADDING_CLASS } from '@/lib/admin-layout'
import { cn } from '@/lib/utils'

function Row({
  title,
  description,
  keys,
  draft,
  onToggle
}: {
  title: ReactNode
  description: string
  keys: { field: NotificationBooleanPrefKey; label: string }[]
  draft: NotificationPreferencesDraft
  onToggle: (field: NotificationBooleanPrefKey, checked: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="font-bold text-on-surface">{title}</h3>
        <p className="text-sm text-on-surface-variant">{description}</p>
      </div>
      <div className="flex flex-wrap gap-4">
        {keys.map(({ field, label }) => (
          <label
            key={field}
            className={cn('flex cursor-pointer items-center gap-2 text-xs font-mono uppercase text-on-surface-variant')}
          >
            <Checkbox checked={draft[field] === true} onCheckedChange={(c) => onToggle(field, c === true)} />
            {label}
          </label>
        ))}
      </div>
    </div>
  )
}

export function AdminNotificationSettingsClient({ embedded = false }: { embedded?: boolean }) {
  const { messages } = useI18n()
  const p = messages.admin.notificationSettingsPage
  const q = useAdminNotificationSettings()
  const mutation = useUpdateAdminNotificationSettings()

  const [draft, setDraft] = React.useState<NotificationPreferencesDraft | null>(null)

  React.useEffect(() => {
    if (!q.data) return
    setDraft(mergeNotificationPreferences(q.data.preferences))
  }, [q.data])

  const dirty =
    draft && q.data ? JSON.stringify(draft) !== JSON.stringify(mergeNotificationPreferences(q.data.preferences)) : false

  const setBool = (field: NotificationBooleanPrefKey, checked: boolean) => {
    setDraft((prev) => (prev ? { ...prev, [field]: checked } : prev))
  }

  const setNum = (field: NotificationNumberPrefKey, value: number) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const save = async () => {
    if (!draft) return
    await mutation.mutateAsync({ preferences: { ...draft } })
  }

  const discard = () => {
    if (!q.data) return
    setDraft(mergeNotificationPreferences(q.data.preferences))
  }

  if (q.isLoading && !q.data) {
    return (
      <div className={embedded ? 'space-y-4 py-6' : 'mx-auto max-w-7xl space-y-4 py-10'}>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!draft) {
    return null
  }

  const ch = p.channels

  return (
    <div className={embedded ? 'space-y-10 pb-10' : 'mx-auto max-w-7xl pb-28'}>
      {!embedded ? (
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-on-surface">{p.title}</h1>
            <p className="mt-1 text-on-surface-variant">{p.subtitle}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/notifications">← {messages.admin.notificationCenterPage.title}</Link>
          </Button>
        </div>
      ) : null}

      <AdminSystemAlertMatrix draft={draft} onBool={setBool} onNumber={setNum} m={p} />

      <div className="space-y-10">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-xl font-bold">{p.catalogTitle}</h2>
            <p className="text-sm text-on-surface-variant">{p.catalogSubtitle}</p>
          </div>
          <div className="space-y-4 md:col-span-2">
            <Row
              title={p.fabricReviewTitle}
              description={p.fabricReviewDesc}
              keys={[
                { field: 'catalog_fabric_review_email', label: ch.email },
                { field: 'catalog_fabric_review_push', label: ch.push }
              ]}
              draft={draft}
              onToggle={setBool}
            />
            <Row
              title={p.aiLowTitle}
              description={p.aiLowDesc}
              keys={[
                { field: 'ai_low_confidence_email', label: ch.email },
                { field: 'ai_low_confidence_slack', label: ch.slack }
              ]}
              draft={draft}
              onToggle={setBool}
            />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-xl font-bold">{p.salesTitle}</h2>
            <p className="text-sm text-on-surface-variant">{p.salesSubtitle}</p>
          </div>
          <div className="space-y-4 md:col-span-2">
            <Row
              title={p.newLeadTitle}
              description={p.newLeadDesc}
              keys={[{ field: 'sales_new_lead_email', label: ch.email }]}
              draft={draft}
              onToggle={setBool}
            />
            <Row
              title={p.leadAssignedTitle}
              description={p.leadAssignedDesc}
              keys={[{ field: 'sales_lead_assigned_push', label: ch.push }]}
              draft={draft}
              onToggle={setBool}
            />
            <Row
              title={p.sampleTitle}
              description={p.sampleDesc}
              keys={[
                { field: 'sales_sample_email', label: ch.email },
                { field: 'sales_sample_slack', label: ch.slack }
              ]}
              draft={draft}
              onToggle={setBool}
            />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-xl font-bold">{p.systemTitle}</h2>
            <p className="text-sm text-on-surface-variant">{p.systemSubtitle}</p>
          </div>
          <div className="space-y-4 md:col-span-2">
            <div className="rounded-xl border-l-4 border-error bg-surface-container-low">
              <Row
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {p.crawlerTitle}
                    <span className="rounded bg-error-container px-2 py-0.5 font-mono text-[10px] text-on-error-container">
                      {p.crawlerCritical}
                    </span>
                  </span>
                }
                description={p.crawlerDesc}
                keys={[{ field: 'system_crawler_slack', label: ch.slack }]}
                draft={draft}
                onToggle={setBool}
              />
            </div>
            <Row
              title={p.lowInventoryTitle}
              description={p.lowInventoryDesc}
              keys={[{ field: 'system_low_inventory_email', label: ch.email }]}
              draft={draft}
              onToggle={setBool}
            />
            <Row
              title={p.jobFailedTitle}
              description={p.jobFailedDesc}
              keys={[
                { field: 'system_job_failed_push', label: ch.push },
                { field: 'system_job_failed_slack', label: ch.slack }
              ]}
              draft={draft}
              onToggle={setBool}
            />
          </div>
        </section>
      </div>

      <footer
        className={cn(
          embedded
            ? 'mt-10 flex items-center justify-between gap-3 rounded-2xl border border-outline/15 bg-surface-container-lowest px-4 py-4'
            : 'fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-outline/15 bg-background/95 py-4 backdrop-blur md:left-[var(--admin-sidebar-width)]',
          !embedded && ADMIN_MAIN_CONTENT_HORIZONTAL_PADDING_CLASS,
          !dirty && 'opacity-90'
        )}
      >
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          {dirty ? <span className="h-2 w-2 rounded-full bg-primary" aria-hidden /> : null}
          {dirty ? p.dirtyHint : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" disabled={!dirty} onClick={discard}>
            {p.discard}
          </Button>
          <Button type="button" disabled={!dirty || mutation.isPending} onClick={() => void save()}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {p.save}
          </Button>
        </div>
      </footer>
    </div>
  )
}
