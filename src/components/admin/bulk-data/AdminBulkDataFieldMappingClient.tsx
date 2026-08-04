'use client'

import * as React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { useAdminBulkDataFieldMappingQuery, useAdminBulkDataFieldMappingTrigger } from '@/hooks/admin/useAdminBulkDataFieldMapping'
import { useAdminCatalogImportPreviewQuery } from '@/hooks/admin/useAdminCatalogImportPreview'
import { useI18n } from '@/hooks/useI18n'
import type {
  BulkDataFieldMappingResponse,
  BulkDataFieldMappingSystemFieldKey
} from '@/types/admin-bulk-data-field-mapping.types'

import { CatalogImportPreviewSection } from './CatalogImportPreviewSection'
import { CatalogImportSyncHeader } from './CatalogImportSyncHeader'
import { AdminBulkDataFieldMappingSidebar, RightSideSkeleton } from './AdminBulkDataFieldMappingSidebar'
import { AdminBulkDataFieldMappingMonitoringLogsDialog } from './AdminBulkDataFieldMappingMonitoringLogsDialog'
import { AdminBulkDataFieldMappingTable, FieldMappingSkeleton } from './AdminBulkDataFieldMappingTable'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function percentFromRun(run: BulkDataFieldMappingResponse['activeRun']) {
  if (!run) return 0
  if (run.status === 'COMPLETED') return 100
  if (run.productsFound <= 0) return 0
  const pct = (run.productsSaved / run.productsFound) * 100
  if (!Number.isFinite(pct)) return 0
  return clamp(Math.round(pct), 0, 100)
}

export function AdminBulkDataFieldMappingClient() {
  const { messages } = useI18n()
  const ci = messages.admin.catalogImportPage
  const query = useAdminBulkDataFieldMappingQuery()
  const trigger = useAdminBulkDataFieldMappingTrigger()
  const previewQuery = useAdminCatalogImportPreviewQuery()

  const [mapping, setMapping] = React.useState<Partial<Record<BulkDataFieldMappingSystemFieldKey, string>>>({})

  const [logOpen, setLogOpen] = React.useState(false)
  const [logError, setLogError] = React.useState<string | null>(null)
  const [logMeta, setLogMeta] = React.useState<{ runId: number; source: string; startedAt: string | null } | null>(
    null
  )

  const data = query.data
  const hasSourceColumns = Boolean(data && data.availableSourceColumns.length > 0)

  React.useEffect(() => {
    if (!data) return
    const defaults: Partial<Record<BulkDataFieldMappingSystemFieldKey, string>> = {}
    for (const field of data.systemFields) {
      const existing = mapping[field.key]
      defaults[field.key] = existing ?? data.availableSourceColumns[0] ?? ''
    }
    setMapping(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const activePct = percentFromRun(data?.activeRun ?? null)

  const runKeywords = React.useCallback((): string[] | null => {
    if (!data) return null
    const selected = data.systemFields.map((f) => mapping[f.key] ?? '').filter(Boolean)
    const unique = Array.from(new Set(selected)).filter(Boolean)
    if (unique.length > 0) return unique.slice(0, 20)
    if (data.availableSourceColumns.length > 0) return data.availableSourceColumns.slice(0, 20)
    return null
  }, [data, mapping])

  function confirmMappingKeywords() {
    return runKeywords() ?? []
  }

  function handleCrawlerSync() {
    const keywords = runKeywords()
    if (!keywords || keywords.length === 0) {
      toast.error(ci.noSourceColumns)
      return
    }
    trigger.mutate({ source: 'ADMIN', keywords })
  }

  async function openLog() {
    const run = data?.activeRun
    if (!run) return

    setLogError(null)
    setLogMeta({ runId: run.id, source: run.source, startedAt: run.startedAt })
    setLogOpen(true)

    try {
      const res = await fetch(`/api/v1/admin/crawler/status/${run.id}`)
      const json = (await res.json()) as unknown as {
        success: boolean
        data?: { run: { errorLog: string | null } | null }
        error?: { message: string }
      }

      if (!res.ok || !json.success || !json.data?.run) {
        const message = json.success ? ci.noLogFound : json.error?.message ?? ci.logLoadFailed
        toast.error(message)
        setLogError(message)
        return
      }
      setLogError(json.data.run.errorLog ?? null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ci.logLoadFailed)
      setLogError(ci.logLoadFailed)
    }
  }

  const syncDisabled = trigger.isPending || !data || runKeywords() === null

  return (
    <div className="mx-auto max-w-[1600px] pb-12">
      {data ? (
        <CatalogImportSyncHeader
          onFetchLatest={handleCrawlerSync}
          onRunSync={handleCrawlerSync}
          fetchDisabled={syncDisabled}
          syncDisabled={syncDisabled}
          isFetching={trigger.isPending}
        />
      ) : null}

      {!query.isLoading && !data ? (
        <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm text-on-surface-variant text-center">{ci.noContext}</div>
      ) : null}

      {query.isLoading && !data ? (
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <FieldMappingSkeleton />
          </div>
          <div className="lg:col-span-4">
            <RightSideSkeleton />
          </div>
        </div>
      ) : null}

      {data ? (
        <>
        <div className="grid gap-8 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <AdminBulkDataFieldMappingTable
              systemFields={data.systemFields}
              availableSourceColumns={data.availableSourceColumns}
              hasSourceColumns={hasSourceColumns}
              feedSourceLabel={previewQuery.data?.connection.feedSourceLabel}
              mapping={mapping}
              onChangeMapping={(key, value) => setMapping((prev) => ({ ...prev, [key]: value }))}
              onClearAll={() => {
                const cleared: Partial<Record<BulkDataFieldMappingSystemFieldKey, string>> = {}
                for (const f of data.systemFields) cleared[f.key] = ''
                setMapping(cleared)
              }}
              onDownloadTemplate={() => toast.message(ci.templateNotReady)}
              onConfirmMapping={() => {
                const keywords = confirmMappingKeywords()
                if (keywords.length === 0) {
                  toast.error(ci.selectColumnFirst)
                  return
                }
                trigger.mutate({ source: 'ADMIN', keywords })
              }}
              confirmFieldsCount={data.systemFields.length}
              confirmDisabled={!hasSourceColumns || trigger.isPending}
              isConfirming={trigger.isPending}
            />
          </section>

          <aside className="lg:col-span-4">
            <AdminBulkDataFieldMappingSidebar data={data} activePct={activePct} onOpenLog={openLog} />
          </aside>
        </div>
        <div className="mt-10">
          <CatalogImportPreviewSection preview={previewQuery.data} isLoading={previewQuery.isLoading} />
        </div>
        <Link
          href="/admin/crawler"
          className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl transition-transform hover:scale-105 active:scale-95"
          aria-label="Open crawler to add sources"
        >
          <Plus className="h-7 w-7" aria-hidden />
        </Link>
        </>
      ) : null}

      <AdminBulkDataFieldMappingMonitoringLogsDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        runId={logMeta?.runId ?? null}
        source={logMeta?.source ?? null}
        startedAt={logMeta?.startedAt ?? null}
        errorLog={logError}
      />
    </div>
  )
}

