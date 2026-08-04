'use client'

import { useMemo, useState } from 'react'
import { ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useAdminNotificationSettings, useUpdateAdminNotificationSettings } from '@/hooks/admin/useAdminNotificationSettings'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

export function NotificationProtocolCard() {
  const { messages } = useI18n()
  const s = messages.admin.settingsPage

  const query = useAdminNotificationSettings()
  const mutation = useUpdateAdminNotificationSettings()

  const [draft, setDraft] = useState<{
    emailEnabled: boolean
    inAppEnabled: boolean
  } | null>(null)

  const values = useMemo(() => {
    if (draft) return draft
    return {
      emailEnabled: query.data?.email_enabled ?? true,
      inAppEnabled: query.data?.in_app_enabled ?? true
    }
  }, [draft, query.data?.email_enabled, query.data?.in_app_enabled])

  const onSave = () => {
    mutation.mutate({
      emailEnabled: values.emailEnabled,
      inAppEnabled: values.inAppEnabled
    })
  }

  if (query.isLoading) {
    return (
      <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4 animate-pulse" aria-hidden>
        <div className="h-5 w-56 rounded bg-surface-container-highest" />
        <div className="h-12 w-full rounded bg-surface-container-highest" />
        <div className="h-12 w-full rounded bg-surface-container-highest" />
        <div className="h-10 w-36 rounded-full bg-surface-container-highest" />
      </div>
    )
  }

  if (!query.data) return null

  return (
    <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-fixed/20 text-primary">
          <ShieldAlert className="h-5 w-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-widest text-outline">{s.notificationEmail}</div>
          <div className="text-lg font-extrabold">{s.notificationProtocolTitle}</div>
          <div className="text-xs text-on-surface-variant">{s.notificationProtocolSubtitle}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-highest">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-on-surface">{s.emailNotifications}</div>
            <div className="text-xs text-on-surface-variant">{s.emailNotificationsHint}</div>
          </div>
          <Checkbox
            checked={values.emailEnabled}
            onCheckedChange={(v) => setDraft((prev) => ({ ...(prev ?? values), emailEnabled: Boolean(v) }))}
          />
        </div>

        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-highest">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-on-surface">{s.inAppNotifications}</div>
            <div className="text-xs text-on-surface-variant">{s.inAppNotificationsHint}</div>
          </div>
          <Checkbox
            checked={values.inAppEnabled}
            onCheckedChange={(v) => setDraft((prev) => ({ ...(prev ?? values), inAppEnabled: Boolean(v) }))}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onSave} className="rounded-full" disabled={mutation.isPending || !draft}>
          {mutation.isPending ? s.saving : s.saveChanges}
        </Button>
        <Button
          variant="outline"
          className={cn('rounded-full')}
          onClick={() => query.refetch()}
          disabled={mutation.isPending}
        >
          {s.reset}
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setDraft(null)}
          disabled={!draft || mutation.isPending}
        >
          {s.discardEdits}
        </Button>
      </div>
    </div>
  )
}

