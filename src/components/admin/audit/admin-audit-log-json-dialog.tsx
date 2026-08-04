'use client'

import type { AuditLogListItem } from '@/types/audit-log-admin.types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function AdminAuditLogJsonDialog({
  open,
  onOpenChange,
  row
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
  row: AuditLogListItem | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Audit Event JSON</DialogTitle>
        </DialogHeader>

        {row ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Action</div>
                <div className="mt-1 font-mono text-sm">{row.action}</div>
              </div>
              <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Entity</div>
                <div className="mt-1 font-mono text-sm">
                  {row.entity_type}
                  {row.entity_id != null ? ` #${row.entity_id}` : ''}
                </div>
              </div>
              <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">IP</div>
                <div className="mt-1 font-mono text-sm">{row.ip ?? '—'}</div>
              </div>
              <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">User Agent</div>
                <div className="mt-1 font-mono text-sm line-clamp-2">{row.user_agent ?? '—'}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-3 overflow-auto max-h-[50vh]">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words">
                {JSON.stringify(
                  { payload: row.payload ?? null, message: row.message, created_at: row.created_at },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

