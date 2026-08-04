'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useI18n } from '@/hooks/useI18n'

import type {
  BulkDataFieldMappingSystemField,
  BulkDataFieldMappingSystemFieldKey
} from '@/types/admin-bulk-data-field-mapping.types'

export function FieldMappingSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-4 h-7 w-56 animate-pulse rounded bg-surface-container-high" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="grid grid-cols-12 items-center gap-3 bg-surface-container-low/40 rounded-xl p-4">
            <div className="col-span-5 h-4 animate-pulse rounded bg-surface-container-high" />
            <div className="col-span-1 flex justify-center">
              <div className="h-5 w-5 animate-pulse rounded bg-surface-container-high" />
            </div>
            <div className="col-span-4 h-4 animate-pulse rounded bg-surface-container-high" />
            <div className="col-span-2 h-6 animate-pulse rounded bg-surface-container-high" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-12 animate-pulse rounded-xl bg-primary-container" />
    </div>
  )
}

export function AdminBulkDataFieldMappingTable(props: {
  systemFields: BulkDataFieldMappingSystemField[]
  availableSourceColumns: string[]
  hasSourceColumns: boolean
  mapping: Partial<Record<BulkDataFieldMappingSystemFieldKey, string>>
  onChangeMapping: (key: BulkDataFieldMappingSystemFieldKey, value: string) => void
  onClearAll: () => void
  onDownloadTemplate: () => void
  onConfirmMapping: () => void
  confirmFieldsCount: number
  confirmDisabled: boolean
  isConfirming: boolean
  feedSourceLabel?: string | null
}) {
  const { messages } = useI18n()
  const c = messages.admin.catalogImportPage

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-on-surface">{c.fieldMappingTitle}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">{c.fieldMappingSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {props.feedSourceLabel ? (
            <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              {c.feedPrefix}: {props.feedSourceLabel}
            </div>
          ) : null}
          <div className="rounded-full bg-surface-container-high px-4 py-2">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              {props.hasSourceColumns ? c.autoMatching : c.waitingSource}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-12 items-center px-4 pb-3 text-[10px] font-bold uppercase tracking-widest text-outline">
          <div className="col-span-5">{c.colSource}</div>
          <div className="col-span-1 flex justify-center">→</div>
          <div className="col-span-4">{c.colSystem}</div>
          <div className="col-span-2 text-right">{c.colValidation}</div>
        </div>

        {props.systemFields.map((field, idx) => {
          const selectedValue = props.mapping[field.key] ?? ''

          return (
            <div
              key={field.key}
              className="grid grid-cols-12 items-center rounded-2xl bg-surface-container-low/40 px-4 py-4 transition-colors hover:bg-surface-container-low"
            >
              <div className="col-span-5 flex items-center gap-3">
                <div className="rounded-lg bg-surface-container-lowest p-2 shadow-sm">
                  <span className="text-xs font-bold text-primary">CSV</span>
                </div>
                <span className="font-mono text-sm text-on-surface">{selectedValue || `Column ${idx + 1}`}</span>
              </div>
              <div className="col-span-1 flex justify-center">
                <span aria-hidden>↔</span>
              </div>
              <div className="col-span-4">
                <Select
                  value={selectedValue}
                  onValueChange={(v) => props.onChangeMapping(field.key, v)}
                  disabled={!props.hasSourceColumns || props.isConfirming}
                >
                  <SelectTrigger className="w-full bg-surface-container-lowest shadow-sm" aria-label={`Map ${field.label}`}>
                    <SelectValue placeholder="Select a source column" />
                  </SelectTrigger>
                  <SelectContent>
                    {props.hasSourceColumns
                      ? props.availableSourceColumns.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))
                      : null}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 text-right">
                <Badge intent={field.validationIntent}>{field.validationLabel}</Badge>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-outline/10 pt-6">
        <div className="text-xs font-medium text-on-surface-variant flex items-center gap-2">
          <span aria-hidden>ℹ</span>
          {c.draftNote}
        </div>
        <div className="flex gap-4">
          <Button type="button" variant="ghost" onClick={props.onClearAll}>
            {c.clearAll}
          </Button>
          <Button type="button" variant="outline" onClick={props.onDownloadTemplate}>
            {c.downloadTemplate}
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Button
          type="button"
          className="w-full"
          disabled={props.confirmDisabled}
          onClick={props.onConfirmMapping}
        >
          {c.confirmMapping.replace('{count}', String(props.confirmFieldsCount))}
        </Button>
      </div>
    </div>
  )
}

