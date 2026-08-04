'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import { useI18n } from '@/hooks/useI18n'
import type { TrafficVsConversionsPoint } from '@/types/admin-stats.types'

function formatDateTick(value: unknown) {
  if (typeof value !== 'string') return ''
  const parts = value.split('-')
  if (parts.length !== 3) return value
  return `${parts[1]}-${parts[2]}`
}

export function TrafficVsConversionsChart({ data }: { data: TrafficVsConversionsPoint[] }) {
  const { messages } = useI18n()
  const c = messages.admin.charts.trafficVsConversions

  return (
    <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-outline">{c.title}</div>
        <div className="mt-1 text-xs text-on-surface-variant">{c.subtitle}</div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="trafficGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a40c2" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#1a40c2" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="convGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#bcc6ff" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#bcc6ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.4)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={formatDateTick} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="traffic" stroke="#1a40c2" strokeWidth={2} fill="url(#trafficGradient)" dot={false} />
            <Area
              type="monotone"
              dataKey="conversions"
              stroke="#7c3aed"
              strokeWidth={2}
              fill="url(#convGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

