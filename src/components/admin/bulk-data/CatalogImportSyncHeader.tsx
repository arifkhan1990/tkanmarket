'use client'

import { CloudDownload, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/useI18n'

export function CatalogImportSyncHeader(props: {
  onFetchLatest: () => void
  onRunSync: () => void
  fetchDisabled: boolean
  syncDisabled: boolean
  isFetching: boolean
}) {
  const { messages } = useI18n()
  const c = messages.admin.catalogImportPage

  return (
    <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{c.title}</h2>
        <p className="mt-2 max-w-2xl text-lg text-on-surface-variant">{c.subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          className="rounded-xl px-6 py-3 font-semibold"
          disabled={props.fetchDisabled}
          onClick={props.onFetchLatest}
        >
          <CloudDownload className="mr-2 h-4 w-4" aria-hidden />
          {props.isFetching ? c.fetchStarting : c.fetchLatest}
        </Button>
        <Button
          type="button"
          className="rounded-xl bg-gradient-to-br from-primary to-primary-container px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/20"
          disabled={props.syncDisabled}
          onClick={props.onRunSync}
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          {c.runSync}
        </Button>
      </div>
    </div>
  )
}
