'use client'

import * as React from 'react'
import { Download, List } from 'lucide-react'

import type { SystemHealthLogItem, SystemLogLevel } from '@/types/admin-system-health.types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function exportLogsTxt(logs: SystemHealthLogItem[]) {
  const content = logs
    .map((l) => `${l.ts} [${l.level}] ${l.message}`)
    .join('\n')
  downloadText(`technical-logs-${Date.now()}.txt`, content)
}

export function SystemHealthTechnicalLogsPanel({
  logs,
  level,
  onLevelChange
}: {
  logs: SystemHealthLogItem[]
  level: SystemLogLevel
  onLevelChange: (next: SystemLogLevel) => void
}) {
  return (
    <div className="mt-8 bg-surface-container-highest/50 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <List className="h-4 w-4 text-on-surface" aria-hidden />
          <h4 className="text-lg font-bold font-headline">Real-time Technical Logs</h4>
        </div>
        <div className="flex gap-4 items-center">
          <Select value={level} onValueChange={(v) => onLevelChange(v as SystemLogLevel)}>
            <SelectTrigger className="w-[160px] bg-surface-container-lowest border-none text-xs font-semibold rounded-lg px-3 py-2 ring-1 ring-outline-variant/30">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Levels</SelectItem>
              <SelectItem value="ERRORS">Errors</SelectItem>
              <SelectItem value="WARNINGS">Warnings</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" className="rounded-lg bg-surface-container-lowest p-2 shadow-sm transition-all hover:bg-surface-container-high" onClick={() => exportLogsTxt(logs)} disabled={logs.length === 0}>
            <Download className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="p-4 font-label text-xs leading-relaxed overflow-x-auto no-scrollbar max-h-[300px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-on-surface-variant py-6 text-sm">No logs for this filter.</div>
        ) : null}

        {logs.map((l, idx) => (
          <div key={`${l.ts}-${l.level}-${idx}`} className="flex gap-4 mb-2 hover:bg-surface-container-high/50 p-1 rounded">
            <span className="whitespace-nowrap text-outline">{new Date(l.ts).toISOString().slice(11, 23)}</span>
            <span className={l.level === 'ERROR' ? 'text-red-500' : l.level === 'WARN' ? 'text-amber-500' : 'text-blue-500'}>[{l.level}]</span>
            <span className="text-on-surface">{l.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SystemHealthTechnicalLogsPanelSkeleton() {
  return (
    <div className="mt-8 bg-surface-container-highest/50 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded bg-surface-container-highest animate-pulse" />
          <div className="h-5 w-64 rounded bg-surface-container-highest animate-pulse" />
        </div>
        <div className="h-10 w-44 rounded bg-surface-container-highest animate-pulse" />
      </div>
      <div className="p-4 max-h-[300px] overflow-y-auto">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="flex gap-4 mb-2 p-1 rounded animate-pulse">
            <div className="h-4 w-24 rounded bg-surface-container-highest" />
            <div className="h-4 w-20 rounded bg-surface-container-highest" />
            <div className="h-4 flex-1 rounded bg-surface-container-highest" />
          </div>
        ))}
      </div>
    </div>
  )
}

