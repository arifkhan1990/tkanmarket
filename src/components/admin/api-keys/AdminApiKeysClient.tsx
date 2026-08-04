'use client'

import * as React from 'react'
import { Copy, Download, Loader2, Plus, ShieldAlert, ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminApiKeysQuery } from '@/hooks/admin/useAdminApiKeysQuery'
import { useAdminApiKeysIntegrationsQuery } from '@/hooks/admin/useAdminApiKeysIntegrationsQuery'
import { useAdminApiKeysMutations } from '@/hooks/admin/useAdminApiKeysMutations'
import type { ApiKeyListItem } from '@/types/api-keys-admin.types'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import type { CrawlerIntegrationItem } from '@/types/api-keys-admin.types'

const DEFAULT_LIMIT = 12

function maskPrefixPreview(prefix: string) {
  return `${prefix}••••••••`
}

function scopesToArray(input: string): string[] {
  const cleaned = input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20)
  return cleaned
}

async function copyToClipboard(text: string) {
  if (!text) return
  await navigator.clipboard.writeText(text)
}

function ApiKeyRowSkeleton({ columns }: { columns: number }) {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  )
}

export function AdminApiKeysClient() {
  const { messages } = useI18n()

  const [page, setPage] = React.useState(1)
  const [draftQ, setDraftQ] = React.useState('')
  const [q, setQ] = React.useState<string | null>(null)
  const limit = DEFAULT_LIMIT

  const keysQuery = useAdminApiKeysQuery({ page, limit, q })
  const integrationsQuery = useAdminApiKeysIntegrationsQuery({ enabledDays: 7 })
  const { create, revoke } = useAdminApiKeysMutations()

  const integrations = integrationsQuery.data?.items ?? []

  const [createOpen, setCreateOpen] = React.useState(false)
  const [createName, setCreateName] = React.useState('')
  const [createScopes, setCreateScopes] = React.useState('catalog:read,leads:read')
  const [generatedSecret, setGeneratedSecret] = React.useState<string | null>(null)
  const [generatedPreview, setGeneratedPreview] = React.useState<string | null>(null)

  const resetCreate = () => {
    setCreateName('')
    setCreateScopes('catalog:read,leads:read')
    setGeneratedSecret(null)
    setGeneratedPreview(null)
  }

  const applySearch = () => {
    const term = draftQ.trim()
    setQ(term.length > 0 ? term : null)
    setPage(1)
  }

  const onCreate = async () => {
    const scopes = scopesToArray(createScopes)
    if (!createName.trim()) {
      toast.error('Name is required')
      return
    }
    const res = await create.mutateAsync({ name: createName.trim(), scopes })
    setGeneratedSecret(res.secret)
    setGeneratedPreview(res.preview)
    toast.success('API key generated')
  }

  const onRevoke = async (id: number) => {
    await revoke.mutateAsync({ apiKeyId: id })
    toast.success('API key revoked')
  }

  const keys = keysQuery.data?.items ?? []
  const meta = keysQuery.data?.meta ?? null

  const downloadCsv = () => {
    const header = ['id', 'name', 'prefix', 'scopes', 'last_used_at', 'is_active', 'revoked_at', 'created_at']
    const rows = keys.map((k) => [
      k.id,
      k.name,
      k.prefix,
      (k.scopes ?? []).join('|'),
      k.last_used_at ?? '',
      k.is_active,
      k.revoked_at ?? '',
      k.created_at
    ])
    const toCsvValue = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [header.map(toCsvValue).join(','), ...rows.map((r) => r.map(toCsvValue).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-keys-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const renderStatus = (k: ApiKeyListItem) => {
    if (!k.is_active) {
      return <Badge intent="error" className="rounded-full px-3 py-1">Revoked</Badge>
    }
    return <Badge intent="success" className="rounded-full px-3 py-1">Active</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">API Keys &amp; Integrations</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Manage secure tokens and crawler integrations.</p>
        </div>
        <div className="hidden rounded-full bg-surface-container-highest border border-outline/10 px-4 py-2 sm:block">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Security</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 max-w-xl">
          <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Search</label>
          <div className="flex gap-2 mt-1">
            <Input value={draftQ} onChange={(e) => setDraftQ(e.target.value)} placeholder="Name or prefix…" className="h-10" onKeyDown={(e) => e.key === 'Enter' && applySearch()} />
            <Button type="button" variant="secondary" className="h-10" onClick={applySearch}>
              {keysQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={downloadCsv} disabled={keys.length === 0}>
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Generate New Key
          </Button>
        </div>
      </div>

      <Card className="p-6 rounded-2xl bg-surface-container-lowest">
        <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container-low">
                  <TableHead>Name</TableHead>
                  <TableHead>Key Preview</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keysQuery.isLoading && !keysQuery.data ? (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <ApiKeyRowSkeleton key={i} columns={5} />
                    ))}
                  </>
                ) : null}

                {!keysQuery.isLoading && keys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-on-surface-variant">
                      No API keys found.
                    </TableCell>
                  </TableRow>
                ) : null}

                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-semibold">{k.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/15 w-fit">
                          {maskPrefixPreview(k.prefix)}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            void copyToClipboard(k.prefix)
                            toast.success('Prefix copied')
                          }}
                        >
                          <Copy className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-on-surface-variant">{k.last_used_at ? new Date(k.last_used_at).toISOString().slice(0, 16).replace('T', ' ') : '—'}</TableCell>
                    <TableCell>{renderStatus(k)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={cn('h-8 px-2', k.is_active ? 'text-error' : 'text-on-surface-variant')}
                          disabled={!k.is_active || revoke.isPending}
                          onClick={() => {
                            void onRevoke(k.id)
                          }}
                        >
                          <ShieldAlert className="h-4 w-4" aria-hidden />
                          Revoke
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {meta && meta.totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="text-sm text-on-surface-variant">
              Page {meta.page} / {meta.totalPages}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="p-6 rounded-2xl bg-surface-container-lowest">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="font-heading text-lg font-extrabold text-on-surface">Platform Integrations</div>
            <div className="text-sm text-on-surface-variant">Crawler sources connected to the marketplace pipeline.</div>
          </div>
        </div>

        {integrationsQuery.isLoading && !integrationsQuery.data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6 rounded-2xl">
                <Skeleton className="h-10 w-10 rounded-xl animate-pulse" />
                <Skeleton className="mt-4 h-4 w-24 animate-pulse" />
                <Skeleton className="mt-2 h-4 w-32 animate-pulse" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {integrations.map((it) => {
              const chip =
                it.status === 'COMPLETED'
                  ? { bg: 'bg-emerald-50 text-emerald-700', label: 'Connected' }
                  : it.status === 'FAILED'
                    ? { bg: 'bg-red-50 text-red-700', label: 'Needs Attention' }
                    : { bg: 'bg-surface-container-lowest text-on-surface-variant', label: 'Configured' }

              return (
                <Card key={it.source} className="p-6 rounded-2xl bg-surface-container-lowest">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <ShoppingCart className="h-6 w-6" aria-hidden />
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${chip.bg}`}>{chip.label}</span>
                  </div>
                  <div className="mt-4 font-heading text-lg font-extrabold text-on-surface">{it.source}</div>
                  <div className="mt-1 text-sm text-on-surface-variant line-clamp-2">
                    Last run: {it.last_run_at ? new Date(it.last_run_at).toISOString().slice(0, 16).replace('T', ' ') : '—'}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-on-surface-variant">Found</div>
                      <div className="text-xs font-mono text-on-surface">{it.products_found}</div>
                    </div>
                    <div>
                      <div className="text-xs text-on-surface-variant">Saved</div>
                      <div className="text-xs font-mono text-on-surface">{it.products_saved}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-on-surface-variant">
                    Errors: <span className="font-mono text-on-surface">{it.errors_count}</span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetCreate() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
          </DialogHeader>

          {!generatedSecret ? (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium text-on-surface">Name</label>
                <Input value={createName} onChange={(e) => setCreateName(e.target.value)} className="mt-1" placeholder="e.g. Production Crawler Node" />
              </div>
              <div>
                <label className="text-sm font-medium text-on-surface">Scopes</label>
                <Textarea value={createScopes} onChange={(e) => setCreateScopes(e.target.value)} className="mt-1" rows={3} placeholder="Comma-separated scopes" />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); resetCreate() }}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void onCreate()} disabled={create.isPending}>
                  {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-4">
                <div className="text-sm font-bold text-on-surface">Secret (copy now)</div>
                <div className="mt-2 font-mono text-sm break-all text-on-surface">{generatedSecret}</div>
              </div>
              <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Preview</div>
                <div className="mt-2 font-mono text-sm">{generatedPreview}</div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => void copyToClipboard(generatedSecret).then(() => toast.success('Secret copied'))}>
                  <Copy className="h-4 w-4" aria-hidden />
                  Copy Secret
                </Button>
                <Button type="button" onClick={() => { setCreateOpen(false); resetCreate() }}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

