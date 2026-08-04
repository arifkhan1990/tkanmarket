'use client'

import { useMemo, useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminSystemAppSettings, useUpdateSystemAppSettings } from '@/hooks/admin/useAdminSystemConsole'
import { useI18n } from '@/hooks/useI18n'
import type { NotificationMatrixRow } from '@/types/system-console.types'

const TIMEZONES = ['UTC', 'Europe/Moscow', 'Asia/Shanghai', 'America/New_York'] as const

export function AdminSystemPlatformSettingsClient() {
  const { messages } = useI18n()
  const q = useAdminSystemAppSettings()
  const mut = useUpdateSystemAppSettings()
  const [tab, setTab] = useState('general')

  const base = q.data
  const [draft, setDraft] = useState<{
    siteName: string
    supportEmail: string
    timezone: string
    twoFactorRequired: boolean
    sessionTimeoutMinutes: number
    ipWhitelistEnabled: boolean
    matrix: NotificationMatrixRow[]
  } | null>(null)

  const values = useMemo(() => {
    if (!base) return null
    if (draft) return draft
    return {
      siteName: base.siteName,
      supportEmail: base.supportEmail,
      timezone: base.timezone,
      twoFactorRequired: base.twoFactorRequired,
      sessionTimeoutMinutes: base.sessionTimeoutMinutes,
      ipWhitelistEnabled: base.ipWhitelistEnabled,
      matrix: base.notificationMatrix
    }
  }, [base, draft])

  if (q.isLoading || !base || !values) {
    return <div className="h-[480px] animate-pulse rounded-3xl bg-surface-container-high" />
  }

  const patch = (partial: Partial<typeof values>) => setDraft((d) => ({ ...(d ?? values), ...partial }))

  const toggleMatrix = (index: number, key: keyof NotificationMatrixRow) => {
    const next = values.matrix.map((row, i) =>
      i === index ? { ...row, [key]: !row[key] } : row
    )
    patch({ matrix: next })
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">
          {messages.admin.sidebar.systemPlatformSettings}
        </h1>
        <p className="mt-2 max-w-2xl text-on-surface-variant">
          Global application identity, security posture, and notification routing for administrators.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6 flex w-full flex-wrap gap-1 rounded-2xl bg-surface-container-low p-1 md:w-auto">
          <TabsTrigger value="general" className="rounded-xl">
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl">
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl">
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <Card className="rounded-3xl border border-outline/10 shadow-sm">
            <CardHeader>
              <h3 className="text-lg font-bold">General</h3>
              <p className="text-sm text-on-surface-variant">Core platform identity and localization.</p>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-outline">Site name</span>
                <Input
                  className="rounded-xl"
                  value={values.siteName}
                  onChange={(e) => patch({ siteName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-outline">Support email</span>
                <Input
                  type="email"
                  className="rounded-xl"
                  value={values.supportEmail}
                  onChange={(e) => patch({ supportEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-outline">Timezone</span>
                <Select value={values.timezone} onValueChange={(v) => patch({ timezone: v })}>
                  <SelectTrigger className="rounded-xl">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <Card className="rounded-3xl border border-outline/10 shadow-sm">
            <CardHeader>
              <h3 className="text-lg font-bold">Security &amp; access</h3>
              <p className="text-sm text-on-surface-variant">Protect the administrative perimeter.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-4">
                <div>
                  <p className="font-semibold text-on-surface">Two-factor authentication (2FA)</p>
                  <p className="text-xs text-on-surface-variant">Require 2FA for all admin accounts.</p>
                </div>
                <Checkbox
                  checked={values.twoFactorRequired}
                  onCheckedChange={(v) => patch({ twoFactorRequired: Boolean(v) })}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-4">
                <div>
                  <p className="font-semibold text-on-surface">Session timeout</p>
                  <p className="text-xs text-on-surface-variant">Minutes until automatic sign-out.</p>
                </div>
                <Input
                  className="w-24 rounded-xl"
                  inputMode="numeric"
                  value={values.sessionTimeoutMinutes}
                  onChange={(e) => patch({ sessionTimeoutMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-4 opacity-90">
                <div>
                  <p className="font-semibold text-on-surface">IP whitelisting</p>
                  <p className="text-xs text-on-surface-variant">Limit dashboard access to CIDR blocks.</p>
                </div>
                <Checkbox
                  checked={values.ipWhitelistEnabled}
                  onCheckedChange={(v) => patch({ ipWhitelistEnabled: Boolean(v) })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <Card className="rounded-3xl border border-outline/10 shadow-sm">
            <CardHeader>
              <h3 className="text-lg font-bold">Notification preferences</h3>
              <p className="text-sm text-on-surface-variant">Choose channels per alert type.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert type</TableHead>
                    <TableHead className="text-center">In-app</TableHead>
                    <TableHead className="text-center">Email</TableHead>
                    <TableHead className="text-center">Slack</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {values.matrix.map((row, index) => (
                    <TableRow key={row.alertType}>
                      <TableCell className="font-medium">{row.alertType}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={row.inApp}
                          onCheckedChange={() => toggleMatrix(index, 'inApp')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={row.email}
                          onCheckedChange={() => toggleMatrix(index, 'email')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={row.slack}
                          onCheckedChange={() => toggleMatrix(index, 'slack')}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          className="rounded-2xl"
          onClick={() => {
            setDraft(null)
            void q.refetch()
          }}
        >
          Discard changes
        </Button>
        <Button
          type="button"
          className="rounded-2xl font-bold"
          disabled={mut.isPending}
          onClick={() =>
            mut.mutate({
              siteName: values.siteName,
              supportEmail: values.supportEmail,
              timezone: values.timezone,
              twoFactorRequired: values.twoFactorRequired,
              sessionTimeoutMinutes: values.sessionTimeoutMinutes,
              ipWhitelistEnabled: values.ipWhitelistEnabled,
              notificationMatrix: values.matrix
            })
          }
        >
          {mut.isPending ? 'Saving…' : 'Save configurations'}
        </Button>
      </div>
    </div>
  )
}
