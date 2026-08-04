'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { KeyRound, Loader2, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ADMIN_API_SANDBOX_ENDPOINTS } from '@/constants/admin-api-sandbox-catalog'
import { useAdminApiKeysQuery } from '@/hooks/admin/useAdminApiKeysQuery'
import { useI18n } from '@/hooks/useI18n'
import { toast } from 'sonner'

function endpointDescription(
  id: (typeof ADMIN_API_SANDBOX_ENDPOINTS)[number]['descriptionKey'],
  m: ReturnType<typeof useI18n>['messages']['admin']['apiSandboxPage']
): string {
  switch (id) {
    case 'stats':
      return m.endpointStats
    case 'categories':
      return m.endpointCategories
    case 'dashboard':
      return m.endpointDashboard
    case 'teams':
      return m.endpointTeams
    case 'crawlerDiag':
      return m.endpointCrawlerDiag
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

export function AdminApiSandboxClient() {
  const { messages } = useI18n()
  const t = messages.admin.apiSandboxPage
  const keysQuery = useAdminApiKeysQuery({ page: 1, limit: 24, q: null })
  const items = useMemo(() => keysQuery.data?.items ?? [], [keysQuery.data])
  const activeKeys = useMemo(() => items.filter((k) => k.is_active && !k.revoked_at), [items])

  const [selectedId, setSelectedId] = useState<string>(ADMIN_API_SANDBOX_ENDPOINTS[0]?.id ?? '')
  const [responseText, setResponseText] = useState<string>('')
  const [running, setRunning] = useState(false)

  const selected = useMemo(
    () => ADMIN_API_SANDBOX_ENDPOINTS.find((e) => e.id === selectedId) ?? ADMIN_API_SANDBOX_ENDPOINTS[0],
    [selectedId]
  )

  const onRun = async () => {
    if (!selected) return
    setRunning(true)
    setResponseText('')
    try {
      const res = await fetch(selected.path, {
        method: selected.method,
        credentials: 'include',
        headers: { Accept: 'application/json' }
      })
      const text = await res.text()
      try {
        const json = JSON.parse(text) as unknown
        setResponseText(JSON.stringify(json, null, 2))
      } catch {
        setResponseText(text)
      }
      if (!res.ok) {
        toast.error(`${res.status} ${res.statusText}`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : messages.authPublic.requestFailed)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{t.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-on-surface-variant">{t.subtitle}</p>
        </div>
        <div className="hidden rounded-full bg-surface-container-highest border border-outline/10 px-4 py-2 sm:block">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Sandbox</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <Card className="border-outline/10 bg-surface-container-lowest shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="font-headline text-lg font-bold">{t.keysTitle}</h3>
              <KeyRound className="h-5 w-5 text-primary" aria-hidden />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-on-surface-variant">{t.keysHint}</p>
              {keysQuery.isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.slice(0, 6).map((k) => (
                    <li
                      key={k.id}
                      className="rounded-xl border border-outline/10 bg-surface-container-low px-3 py-2 font-mono text-xs text-on-surface"
                    >
                      <span className="text-on-surface-variant">{k.name}</span>
                      <div className="truncate text-on-surface">{k.prefix}••••</div>
                    </li>
                  ))}
                  {items.length === 0 ? <li className="text-sm text-on-surface-variant">{t.keysEmpty}</li> : null}
                </ul>
              )}
              <Button variant="outline" className="w-full rounded-xl" asChild>
                <Link href="/admin/api-keys">{t.openKeysPage}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-outline/10 bg-surface-container-lowest shadow-sm">
            <CardHeader>
              <h3 className="font-headline text-lg font-bold">{t.usageTitle}</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-on-surface-variant">
                {t.usageDailyLabel}:{' '}
                {t.usageDailyValue.replace('{active}', String(activeKeys.length)).replace('{total}', String(items.length))}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <Card className="border-outline/10 bg-surface-container-lowest shadow-sm">
            <CardHeader>
              <h3 className="font-headline text-lg font-bold">{t.catalogTitle}</h3>
              <p className="text-sm text-on-surface-variant">{t.catalogSubtitle}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {t.selectEndpoint}
                  </label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_API_SANDBOX_ENDPOINTS.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.method} {e.path}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    className="h-11 w-full rounded-xl font-bold sm:w-auto"
                    onClick={() => void onRun()}
                    disabled={running || !selected}
                  >
                    {running ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        {t.running}
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" aria-hidden />
                        {t.run}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {selected ? (
                <div className="rounded-xl border border-outline/10 bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">{t.method}</p>
                  <p className="font-mono text-sm font-semibold text-on-surface">{selected.method}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-widest text-primary">{t.path}</p>
                  <p className="break-all font-mono text-sm text-on-surface">{selected.path}</p>
                  <p className="mt-3 text-sm text-on-surface-variant">
                    {endpointDescription(selected.descriptionKey, t)}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-outline/15 bg-surface-container-highest text-on-surface shadow-xl">
            <CardHeader className="border-b border-outline/15 bg-surface-container-low py-3">
              <h3 className="font-mono text-sm font-bold text-on-surface-variant">{t.responseTitle}</h3>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[min(420px,50vh)] w-full p-4">
                <pre className="font-mono text-xs leading-relaxed">
                  {responseText || '—'}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
