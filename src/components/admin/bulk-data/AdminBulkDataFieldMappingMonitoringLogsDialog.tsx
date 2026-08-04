'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useI18n } from '@/hooks/useI18n'

export function AdminBulkDataFieldMappingMonitoringLogsDialog(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  runId: number | null
  source: string | null
  startedAt: string | null
  errorLog: string | null
}) {
  const { messages } = useI18n()
  const ci = messages.admin.catalogImportPage
  const runDisplay = String(props.runId ?? ci.dash)

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ci.monitoringLogsTitle}</DialogTitle>
          <DialogDescription>{ci.monitoringLogsDescription.replace('{runId}', runDisplay)}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-2xl bg-surface-container-lowest border border-outline/10 p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-outline">{ci.monitoringRunDetails}</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-on-surface-variant">{ci.monitoringSource}</div>
              <div className="font-mono font-bold">{props.source ?? ci.dash}</div>
            </div>
            <div>
              <div className="text-xs text-on-surface-variant">{ci.monitoringStartedAt}</div>
              <div className="font-mono font-bold">{props.startedAt ?? ci.dash}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-surface-container-lowest border border-outline/10 p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-outline">{ci.monitoringErrorLog}</div>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-surface-container-highest p-3 text-xs text-on-surface-variant">
            {props.errorLog ?? ci.monitoringNoErrors}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}

