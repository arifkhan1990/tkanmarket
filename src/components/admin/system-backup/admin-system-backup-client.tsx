'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Cloud, HardDrive, RefreshCw, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useAdminSystemBackupManualMutation, useAdminSystemBackupOverviewQuery } from '@/hooks/admin/useAdminSystemBackup'
import { cn } from '@/lib/utils'

function formatGb(n: number): string {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function BackupSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-muted" />
    </div>
  )
}

export function AdminSystemBackupClient() {
  const query = useAdminSystemBackupOverviewQuery()
  const manual = useAdminSystemBackupManualMutation()
  const d = query.data

  const [multiAuth, setMultiAuth] = React.useState(true)
  const [immutable, setImmutable] = React.useState(true)
  const [geoRedundancy, setGeoRedundancy] = React.useState(false)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">
            System Backup &amp; Recovery
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
            Continuity signals for TkanMarket: crawler run snapshots, storage targets, and administrative safeguards. External
            database backups are configured in your hosting provider.
          </p>
        </div>
        <Button
          type="button"
          className="rounded-xl bg-gradient-to-br from-primary to-primary-container font-bold text-on-primary shadow-lg"
          disabled={manual.isPending}
          onClick={() => manual.mutate(undefined)}
        >
          <HardDrive className="mr-2 h-4 w-4" aria-hidden />
          Create manual backup request
        </Button>
      </header>

      {query.isLoading && !d ? <BackupSkeleton /> : null}

      {d ? (
        <>
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-4 rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex justify-between">
                <span className="rounded-xl bg-secondary-container p-3 text-on-secondary-container">
                  <Shield className="h-6 w-6" aria-hidden />
                </span>
                <span
                  className={cn(
                    'rounded px-2 py-1 text-xs font-bold uppercase tracking-widest',
                    d.healthLabel === 'Healthy' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                  )}
                >
                  {d.healthLabel}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-on-surface">Infrastructure integrity</h2>
              <p className="text-sm text-on-surface-variant">{d.healthDetail}</p>
              <div className="flex justify-between border-t border-border pt-3 text-xs text-on-surface-variant">
                <span>Catalog reference</span>
                <span className="font-mono font-bold">{d.databaseSizeLabel}</span>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex justify-between">
                <span className="rounded-xl bg-amber-100 p-3 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                  <Cloud className="h-6 w-6" aria-hidden />
                </span>
                <span className="rounded px-2 py-1 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {d.storageDestination.slice(0, 24)}
                  {d.storageDestination.length > 24 ? '…' : ''}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-on-surface">Storage destination</h2>
              <p className="text-sm text-on-surface-variant">Provider-managed object storage for exports and artifacts.</p>
              <div className="flex justify-between border-t border-border pt-3 text-xs text-on-surface-variant">
                <span>Encryption</span>
                <span className="font-mono font-bold">{d.encryptionLabel}</span>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl bg-surface-container-low p-6">
              <div className="flex justify-between">
                <span className="rounded-xl bg-primary-fixed p-3 text-on-primary-fixed dark:bg-indigo-900/40 dark:text-indigo-200">
                  <RefreshCw className="h-6 w-6" aria-hidden />
                </span>
              </div>
              <h2 className="text-lg font-semibold text-on-surface">Scheduled backup</h2>
              <p className="text-sm text-on-surface-variant">{d.nextBackupLabel}</p>
              <div className="flex justify-between border-t border-border pt-3 text-xs">
                <span className="text-on-surface-variant">Type</span>
                <span className="font-bold uppercase tracking-wider text-on-surface">{d.backupTypeLabel}</span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-headline text-2xl font-bold">Recent operational snapshots</h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Derived from crawler runs — use as a continuity index alongside your real database backups.
              </p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface-container-lowest">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-5 py-4">Snapshot ID</th>
                    <th className="px-5 py-4">Timestamp</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Checksum</th>
                    <th className="px-5 py-4 text-right">Size</th>
                    <th className="px-5 py-4 text-center">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d.snapshots.map((s, idx) => (
                    <tr key={s.snapshotId} className={cn('hover:bg-muted/30', idx % 2 === 1 && 'bg-muted/20')}>
                      <td className="px-5 py-4 font-mono text-primary">{s.snapshotId}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {format(new Date(s.timestamp), 'MMM d, yyyy • HH:mm')}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 text-sm font-semibold',
                            s.status === 'SUCCESS' && 'text-emerald-600',
                            s.status === 'FAILED' && 'text-destructive',
                            s.status === 'PARTIAL' && 'text-amber-600'
                          )}
                        >
                          <span className="h-2 w-2 rounded-full bg-current" />
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{s.checksum}</td>
                      <td className="px-5 py-4 text-right font-mono">{formatGb(s.sizeBytes)}</td>
                      <td className="px-5 py-4 text-center text-xs">{s.sourceLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {d.snapshots.length === 0 ? (
                <p className="px-5 py-10 text-center text-muted-foreground">No crawler runs recorded yet.</p>
              ) : null}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="font-headline text-2xl font-bold">Recovery protocols</h2>
              <div className="space-y-3 rounded-xl bg-muted/40 p-4">
                <h3 className="font-bold text-on-surface">Retention policy</h3>
                <p className="text-sm text-on-surface-variant">{d.retentionNote}</p>
              </div>
              <div className="space-y-3 rounded-xl bg-muted/40 p-4">
                <h3 className="font-bold text-on-surface">Validation</h3>
                <p className="text-sm text-on-surface-variant">{d.validationNote}</p>
              </div>
            </div>

            <div className="space-y-6 rounded-2xl border border-border bg-surface-container-lowest p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Shield className="h-5 w-5 text-primary" aria-hidden />
                Administrative safeguards
              </h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">Require multi-auth for restore</span>
                  <Checkbox
                    checked={multiAuth}
                    onCheckedChange={(v) => setMultiAuth(v === true)}
                    aria-label="Multi-auth for restore"
                  />
                </label>
                <label className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">Immutable storage lock</span>
                  <Checkbox
                    checked={immutable}
                    onCheckedChange={(v) => setImmutable(v === true)}
                    aria-label="Immutable storage"
                  />
                </label>
                <label className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">Geographic redundancy</span>
                  <Checkbox
                    checked={geoRedundancy}
                    onCheckedChange={(v) => setGeoRedundancy(v === true)}
                    aria-label="Geo redundancy"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Preferences are UI-only until wired to your policy engine. Critical restores should always go through your DBA.
              </p>
              <Button type="button" variant="outline" className="w-full border-2 border-primary font-bold text-primary">
                Update security credentials
              </Button>
            </div>
          </section>
        </>
      ) : null}

      {!query.isLoading && !d ? (
        <p className="py-12 text-center text-muted-foreground">Unable to load backup overview.</p>
      ) : null}
    </div>
  )
}
