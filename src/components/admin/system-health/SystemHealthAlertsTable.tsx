'use client'

import type { AuditLogListItem } from '@/types/audit-log-admin.types'

export function SystemHealthAlertsTable({
  items,
  onViewJson
}: {
  items: AuditLogListItem[]
  onViewJson: (row: AuditLogListItem) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low/40">
            <tr>
              <th className="px-5 py-4 text-xs uppercase tracking-widest text-outline font-bold">Time</th>
              <th className="px-5 py-4 text-xs uppercase tracking-widest text-outline font-bold">Action</th>
              <th className="px-5 py-4 text-xs uppercase tracking-widest text-outline font-bold">Entity</th>
              <th className="px-5 py-4 text-xs uppercase tracking-widest text-outline font-bold">IP</th>
              <th className="px-5 py-4 text-xs uppercase tracking-widest text-outline font-bold text-right">JSON</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high/40">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-on-surface-variant">
                  No failed events found.
                </td>
              </tr>
            ) : null}
            {items.map((e) => (
              <tr key={e.id} className="hover:bg-surface-container-lowest transition-colors">
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="font-mono text-xs text-on-surface-variant">{new Date(e.created_at).toISOString().slice(0, 19).replace('T', ' ')}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-mono text-xs text-on-surface">{e.action}</div>
                  {e.message ? <div className="mt-1 text-xs text-on-surface-variant line-clamp-2">{e.message}</div> : null}
                </td>
                <td className="px-5 py-4">
                  <div className="text-xs font-semibold">{e.entity_type}</div>
                  {e.entity_id != null ? <div className="text-xs text-on-surface-variant font-mono">#{e.entity_id}</div> : null}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="font-mono text-xs">{e.ip ?? '—'}</div>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    className="text-primary hover:underline text-sm font-medium"
                    onClick={() => onViewJson(e)}
                  >
                    View JSON
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

