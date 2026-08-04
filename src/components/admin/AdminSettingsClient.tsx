'use client'

import { useMemo, useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAdminSettings, useUpdateAdminSettings, AdminSettingsSkeleton } from '@/hooks/admin/useAdminSettings'
import { useI18n } from '@/hooks/useI18n'

export function AdminSettingsClient() {
  const { messages } = useI18n()
  const s = messages.admin.settingsPage
  const settingsQuery = useAdminSettings()
  const updateMutation = useUpdateAdminSettings()

  const settings = settingsQuery.data?.success ? settingsQuery.data.data : null

  const [draft, setDraft] = useState<{
    crawlerEnabled: boolean
    leadRateLimitPerHour: number
    notificationEmail: string
  } | null>(null)

  const values = useMemo(() => {
    if (draft) return draft
    return {
      crawlerEnabled: settings?.crawlerEnabled ?? true,
      leadRateLimitPerHour: settings?.leadRateLimitPerHour ?? 5,
      notificationEmail: settings?.notificationEmail ?? ''
    }
  }, [draft, settings])

  const onSave = () => {
    if (!settings) return
    updateMutation.mutate({
      crawlerEnabled: values.crawlerEnabled,
      leadRateLimitPerHour: values.leadRateLimitPerHour,
      notificationEmail: values.notificationEmail.trim() ? values.notificationEmail.trim() : null
    })
  }

  if (settingsQuery.isLoading) return <AdminSettingsSkeleton />
  if (!settings) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{s.title}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{s.subtitle}</p>
      </div>

      <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{s.crawlerEnabled}</div>
              <div className="mt-1 text-sm text-on-surface-variant">{s.crawlerEnabledHint}</div>
            </div>
            <Checkbox
              checked={values.crawlerEnabled}
              onCheckedChange={(v) => setDraft((prev) => ({ ...(prev ?? values), crawlerEnabled: Boolean(v) }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-outline">{s.leadRateLimit}</div>
          <Input
            value={String(values.leadRateLimitPerHour)}
            onChange={(e) =>
              setDraft((prev) => ({
                ...(prev ?? values),
                leadRateLimitPerHour: Number(e.target.value)
              }))
            }
            inputMode="numeric"
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-outline">{s.notificationEmail}</div>
          <Input
            value={values.notificationEmail}
            onChange={(e) => setDraft((prev) => ({ ...(prev ?? values), notificationEmail: e.target.value }))}
            placeholder={s.optionalPlaceholder}
            inputMode="email"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button onClick={onSave} className="rounded-full" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? s.saving : s.saveChanges}
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => settingsQuery.refetch()}>
            {s.reset}
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => setDraft(null)} disabled={!draft}>
            {s.discardEdits}
          </Button>
        </div>
      </div>
    </div>
  )
}

