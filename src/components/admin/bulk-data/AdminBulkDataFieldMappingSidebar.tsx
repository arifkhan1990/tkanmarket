'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { useI18n } from '@/hooks/useI18n'
import type { BulkDataFieldMappingResponse } from '@/types/admin-bulk-data-field-mapping.types'
import type { Locale } from '@/types/i18n.types'

function numberLocale(loc: Locale): string {
  if (loc === 'ru') return 'ru-RU'
  if (loc === 'zh') return 'zh-CN'
  return 'en-US'
}

export function RightSideSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 h-6 w-52 animate-pulse rounded bg-surface-container-high" />
        <div className="h-3 w-full animate-pulse rounded bg-surface-container-high" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="h-24 animate-pulse rounded-2xl bg-surface-container-high" />
          <div className="h-24 animate-pulse rounded-2xl bg-surface-container-high" />
        </div>
      </div>
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 h-6 w-52 animate-pulse rounded bg-surface-container-high" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-14 animate-pulse rounded-xl bg-surface-container-high" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 h-6 w-52 animate-pulse rounded bg-surface-container-high" />
        <div className="h-52 animate-pulse rounded-xl bg-surface-container-high" />
      </div>
    </div>
  )
}

export function AdminBulkDataFieldMappingSidebar(props: {
  data: BulkDataFieldMappingResponse
  activePct: number
  onOpenLog: () => void
}) {
  const { locale, messages } = useI18n()
  const s = messages.admin.catalogImportSidebar
  const run = props.data.activeRun
  const statusIntent = run?.status === 'COMPLETED' ? 'success' : run ? 'warning' : 'default'
  const nl = numberLocale(locale)

  const barWidthClass = (() => {
    const bucket = Math.max(0, Math.min(100, Math.round(props.activePct / 10) * 10))
    switch (bucket) {
      case 0:
        return 'w-0'
      case 10:
        return 'w-[10%]'
      case 20:
        return 'w-[20%]'
      case 30:
        return 'w-[30%]'
      case 40:
        return 'w-[40%]'
      case 50:
        return 'w-[50%]'
      case 60:
        return 'w-[60%]'
      case 70:
        return 'w-[70%]'
      case 80:
        return 'w-[80%]'
      case 90:
        return 'w-[90%]'
      default:
        return 'w-[100%]'
    }
  })()

  const statusLabel = run ? run.status : s.idle

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h4 className="text-xl font-extrabold tracking-tight text-on-surface">{s.activeSyncTitle}</h4>
            <p className="mt-1 text-sm text-on-surface-variant">{s.liveStatus}</p>
          </div>
          <Badge intent={statusIntent}>{statusLabel}</Badge>
        </div>

        {run ? (
          <>
            <div className="mb-4 flex justify-between gap-4">
              <div className="text-xs font-bold text-on-surface-variant font-mono">
                {s.batchId}: #{run.id}
              </div>
              <div className="text-xs font-mono font-bold text-on-surface">{props.activePct}%</div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className={`h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-transform duration-500 ${barWidthClass}`}
                aria-hidden
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{s.processed}</p>
                <p className="mt-1 font-mono text-2xl font-black text-on-surface">{run.productsSaved.toLocaleString(nl)}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{s.errors}</p>
                <p className="mt-1 font-mono text-2xl font-black text-error">{run.errorsCount.toLocaleString(nl)}</p>
              </div>
            </div>

            <div className="mt-4">
              <Button type="button" className="w-full" variant="secondary" onClick={props.onOpenLog}>
                {s.openLogs}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-on-surface-variant">{s.noActiveJob}</p>
        )}
      </div>

      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h4 className="mb-5 text-xl font-extrabold tracking-tight text-on-surface">{s.validationRules}</h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-container/20 flex items-center justify-center">
              <span aria-hidden className="text-primary font-bold">
                ✓
              </span>
            </div>
            <div>
              <span className="block text-sm font-extrabold text-on-surface">{s.duplicateCheck}</span>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-1">{s.duplicateCheckDesc}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-tertiary-container/20 flex items-center justify-center">
              <span aria-hidden className="text-tertiary font-bold">
                $
              </span>
            </div>
            <div>
              <span className="block text-sm font-extrabold text-on-surface">{s.currencyNorm}</span>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-1">{s.currencyNormDesc}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100/40 flex items-center justify-center">
              <span aria-hidden className="text-emerald-700 font-bold">
                ⛭
              </span>
            </div>
            <div>
              <span className="block text-sm font-extrabold text-on-surface">{s.schemaCompliance}</span>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-1">{s.schemaComplianceDesc}</p>
            </div>
          </div>
        </div>

        <Button type="button" className="mt-6 w-full" variant="outline" disabled>
          {s.configureEngine}
        </Button>
      </div>

      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h4 className="mb-5 text-xl font-extrabold tracking-tight text-on-surface">{s.recentOps}</h4>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{s.recentColOp}</TableHead>
                <TableHead>{s.recentColSource}</TableHead>
                <TableHead>{s.recentColStatus}</TableHead>
                <TableHead className="text-right">{s.recentColVolume}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.data.recentHistory.slice(0, 6).map((r) => {
                const rowStatusIntent = r.status === 'COMPLETED' ? 'success' : r.status === 'FAILED' ? 'error' : 'warning'
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-bold text-on-surface">#{r.id}</TableCell>
                    <TableCell>{r.source}</TableCell>
                    <TableCell>
                      <Badge intent={rowStatusIntent}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm text-on-surface-variant">{r.productsSaved.toLocaleString(nl)}</span>
                    </TableCell>
                  </TableRow>
                )
              })}
              {props.data.recentHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-on-surface-variant">
                    {s.noOperations}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
