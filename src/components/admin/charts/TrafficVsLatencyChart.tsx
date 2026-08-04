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

import type { TrafficVsLatencyPoint } from '@/types/admin-system-health.types'
import { useI18n } from '@/hooks/useI18n'

function formatTimeTick(value: unknown) {
  if (typeof value !== 'string') return ''
  // ISO time: take HH:mm from UTC
  const parts = value.split('T')
  if (parts.length < 2) return value
  return parts[1]?.slice(0, 5) ?? value
}

export function TrafficVsLatencyChart({ data }: { data: TrafficVsLatencyPoint[] }) {
  const { messages } = useI18n()
  const c = messages.admin.charts.trafficVsConversions

  return (
    <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4">
      <div>
        <div className="text-sm font-bold uppercase tracking-widest text-outline">{c.title}</div>
        <div className="mt-1 text-xs text-on-surface-variant">Traffic vs latency correlation</div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.4)" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} tickFormatter={formatTimeTick} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Area yAxisId="left" type="monotone" dataKey="traffic" stroke="#1a40c2" strokeWidth={2} fillOpacity={0.12} fill="#1a40c2" dot={false} />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="p95_latency_ms"
              stroke="#7c3aed"
              strokeWidth={2}
              fillOpacity={0}
              fill="transparent"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

