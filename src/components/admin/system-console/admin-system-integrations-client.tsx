'use client'

import Link from 'next/link'
import {
  Bot,
  CreditCard,
  MessageCircle,
  Network,
  Ship,
  Code2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useAdminSystemIntegrations } from '@/hooks/admin/useAdminSystemConsole'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import type { IntegrationHealthRowDto, SystemIntegrationDto } from '@/types/system-console.types'

function iconFor(key: string) {
  switch (key) {
    case 'account_tree':
      return Network
    case 'local_shipping':
      return Ship
    case 'chat_bubble':
      return MessageCircle
    case 'payments':
      return CreditCard
    default:
      return Bot
  }
}

function statusBadge(status: SystemIntegrationDto['status']) {
  if (status === 'CONNECTED')
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
  if (status === 'ACTION_REQUIRED')
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
  return 'bg-surface-container-high text-on-surface-variant'
}

function dotClass(dot: IntegrationHealthRowDto['healthDot']) {
  if (dot === 'OK') return 'bg-emerald-500'
  if (dot === 'WARN') return 'bg-amber-500'
  return 'bg-red-500'
}

export function AdminSystemIntegrationsClient() {
  const { messages, locale } = useI18n()
  const t = messages.admin.systemIntegrationsPage
  const q = useAdminSystemIntegrations()

  if (q.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-surface-container-high" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-3xl bg-surface-container-lowest" />
          ))}
        </div>
      </div>
    )
  }

  if (q.isError || !q.data) {
    return (
      <p className="text-sm text-destructive">
        {q.error instanceof Error ? q.error.message : messages.admin.systemConsole.loadFailed}
      </p>
    )
  }

  const { integrations, healthRows } = q.data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-on-surface-variant">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((it) => {
          const Icon = iconFor(it.iconKey)
          return (
            <Card
              key={it.id}
              className="group flex flex-col rounded-3xl border border-outline/10 bg-surface-container-lowest shadow-sm transition hover:-translate-y-0.5"
            >
              <CardHeader className="pb-2">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
                  <Icon className="h-7 w-7" aria-hidden />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold">{it.name}</h3>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      statusBadge(it.status)
                    )}
                  >
                    {it.status === 'CONNECTED'
                      ? t.statusConnected
                      : it.status === 'ACTION_REQUIRED'
                        ? t.statusActionRequired
                        : t.statusInactive}
                  </span>
                </div>
                <p className="line-clamp-4 text-sm text-on-surface-variant">{it.description}</p>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between pt-0">
                <span className="font-mono text-xs text-outline">
                  {t.integrationIdLabel}: {it.externalRef}
                </span>
                <Button
                  size="sm"
                  variant={it.status === 'ACTION_REQUIRED' || it.status === 'INACTIVE' ? 'default' : 'secondary'}
                  className="rounded-xl"
                  type="button"
                >
                  {it.status === 'CONNECTED' ? t.btnConfigure : t.btnConnect}
                </Button>
              </CardContent>
            </Card>
          )
        })}

        <Card className="relative overflow-hidden rounded-3xl border-0 bg-primary text-primary-foreground lg:col-span-2">
          <CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-start md:justify-between">
            <div className="relative z-10 max-w-lg space-y-2">
              <div className="flex items-center gap-2">
                <Code2 className="h-6 w-6 opacity-90" aria-hidden />
                <h3 className="text-lg font-bold text-primary-foreground">{t.customCardTitle}</h3>
              </div>
              <p className="text-sm text-primary-foreground/90">{t.customCardBody}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="secondary" className="rounded-xl font-semibold" asChild>
                  <Link href={withLocaleUrl('/admin/api-keys', locale)}>{t.viewApiKeys}</Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  className="rounded-xl border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                >
                  {t.documentation}
                </Button>
              </div>
            </div>
            <Code2
              className="pointer-events-none absolute -bottom-6 -right-4 h-40 w-40 rotate-12 opacity-10"
              aria-hidden
            />
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-on-surface">{t.healthTitle}</h2>
            <p className="text-sm text-on-surface-variant">{t.healthSubtitle}</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-low">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container-high/80 hover:bg-surface-container-high/80">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-outline">
                  {t.colSystem}
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-outline">
                  {t.colEndpoint}
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-outline">
                  {t.colResponse}
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-outline">
                  {t.colTimestamp}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {healthRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', dotClass(row.healthDot))} />
                      <span className="text-sm font-semibold">{row.integrationName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-on-surface-variant">{row.endpointPath}</TableCell>
                  <TableCell>
                    <span className="rounded bg-surface-container-high px-2 py-0.5 font-mono text-[10px]">
                      {row.responseLabel}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-on-surface-variant">
                    {new Date(row.occurredAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
