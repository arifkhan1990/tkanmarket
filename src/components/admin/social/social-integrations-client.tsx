'use client'

import * as React from 'react'
import { Loader2, Plug, RefreshCw, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SocialPlatformIcon, type SocialPlatformKey } from '@/components/admin/social/social-platform-icon'
import { AdminDeleteConfirmDialog } from '@/components/admin/admin-delete-confirm-dialog'
import {
  useAdminSocialIntegrations,
  useSocialIntegrationMutations,
  type SocialIntegration
} from '@/hooks/admin/useAdminSocialIntegrations'

const PLATFORMS = [
  { key: 'INSTAGRAM', label: 'Instagram' },
  { key: 'FACEBOOK', label: 'Facebook' },
  { key: 'TIKTOK', label: 'TikTok' },
  { key: 'PINTEREST', label: 'Pinterest' },
  { key: 'YOUTUBE', label: 'YouTube' }
] as const

function formatDate(value: string | null): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function IntegrationRow({ integration }: { integration: SocialIntegration }) {
  const { disconnect, refresh } = useSocialIntegrationMutations()
  const [expiresSoon, setExpiresSoon] = React.useState(false)
  React.useEffect(() => {
    if (!integration.expiresAt) {
      setExpiresSoon(false)
      return
    }
    setExpiresSoon(new Date(integration.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000)
  }, [integration.expiresAt])

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-muted">
          <SocialPlatformIcon platform={integration.platform} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{integration.accountName ?? integration.accountUsername ?? integration.accountId}</span>
            <Badge intent={integration.isActive ? 'success' : 'default'}>
              {integration.isActive ? 'Active' : 'Disabled'}
            </Badge>
            {expiresSoon && <Badge intent="warning">Expires soon</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            {integration.platform} · {integration.accountUsername ?? integration.accountId}
          </p>
          <p className="text-xs text-muted-foreground">
            Expires: {formatDate(integration.expiresAt)} · Last refresh: {formatDate(integration.lastRefreshedAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh.mutate(integration.id)}
          disabled={refresh.isPending}
        >
          {refresh.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
        <AdminDeleteConfirmDialog
          title={`Disconnect ${integration.platform}?`}
          description={`This will soft-disconnect the ${integration.platform} account. Connected social posts may stop working. This action cannot be undone.`}
          confirmLabel="Disconnect"
          onConfirm={async () => {
            await disconnect.mutateAsync(integration.id)
          }}
        >
          <Button variant="destructive" size="sm" disabled={disconnect.isPending}>
            <Trash2 className="mr-2 h-4 w-4" /> Disconnect
          </Button>
        </AdminDeleteConfirmDialog>
      </div>
    </div>
  )
}

export function SocialIntegrationsClient() {
  const [includeInactive, setIncludeInactive] = React.useState(false)
  const query = useAdminSocialIntegrations({ includeInactive })
  const { connect } = useSocialIntegrationMutations()

  const items: SocialIntegration[] = query.data?.success ? query.data.data.items : []
  const itemsKey = items.map((i) => `${i.platform}:${i.id}`).join(',')

  const byPlatform = React.useMemo(() => {
    const map = new Map<string, SocialIntegration[]>()
    for (const it of items) {
      const arr = map.get(it.platform) ?? []
      arr.push(it)
      map.set(it.platform, arr)
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Social integrations</h1>
          <p className="text-sm text-muted-foreground">
            Connect your brand accounts to publish content and sync analytics.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          Include disabled accounts
        </label>
      </div>

      {query.isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading integrations…
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {PLATFORMS.map((p) => {
          const accounts = byPlatform.get(p.key) ?? []
          return (
            <Card key={p.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <SocialPlatformIcon platform={p.key as SocialPlatformKey} className="h-5 w-5" />
                  {p.label}
                </h2>
                <Button
                  size="sm"
                  onClick={() => connect.mutate(p.key)}
                  disabled={connect.isPending}
                >
                  {connect.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}
                  Connect
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No accounts connected.</p>
                ) : (
                  accounts.map((acc) => (
                    <React.Fragment key={acc.id}>
                      <IntegrationRow integration={acc} />
                      <Separator />
                    </React.Fragment>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
