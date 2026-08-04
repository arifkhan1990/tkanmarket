'use client'

import type { UserActivityLogItem, UserActivityUserSummary } from '@/types/user-activity-logs.types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function AdminUserActivityLogJsonDialog({
  open,
  onOpenChange,
  user,
  row
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
  user: UserActivityUserSummary | null
  row: UserActivityLogItem | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>User Activity JSON</DialogTitle>
        </DialogHeader>

        {row ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-3">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">User</div>
              <div className="mt-1 font-mono text-sm">
                {user?.name ?? '—'} (UID: {user?.id ?? '—'})
              </div>
            </div>

            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-3 overflow-auto max-h-[50vh]">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words">{JSON.stringify(row, null, 2)}</pre>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

