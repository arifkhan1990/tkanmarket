import type { AuditLogListItem } from '@/types/audit-log-admin.types'

function toCsvValue(v: unknown): string {
  const s = v == null ? '' : String(v)
  const escaped = s.replace(/"/g, '""')
  return `"${escaped}"`
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function exportAuditLogsCsv(items: AuditLogListItem[]) {
  const header = ['created_at', 'actor_email', 'actor_name', 'action', 'entity_type', 'entity_id', 'success', 'ip', 'message']
  const rows = items.map((e) => [
    e.created_at,
    e.actor_email ?? '',
    e.actor_name ?? '',
    e.action,
    e.entity_type,
    e.entity_id ?? '',
    e.success,
    e.ip ?? '',
    e.message ?? ''
  ])

  const csv = [header.map(toCsvValue).join(','), ...rows.map((r) => r.map(toCsvValue).join(','))].join('\n')
  downloadText(`audit-logs-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8')
}

export function initialsFromActor(actorName: string | null | undefined, actorEmail: string | null | undefined): string {
  const t = (actorName ?? actorEmail ?? 'U').trim()
  return t[0]?.toUpperCase() ?? 'U'
}

