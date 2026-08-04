'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import { useI18n } from '@/hooks/useI18n'

export interface LeadsBySourceChartPoint {
  source: string
  count: number
}

function formatSource(value: unknown) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (m) => m.toUpperCase())
}

export function LeadsBySourceChart({ data }: { data: LeadsBySourceChartPoint[] }) {
  const { messages } = useI18n()
  const c = messages.admin.charts.leadsBySource

  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <div className="mb-4">
          <div className="text-sm font-semibold text-on-surface">{c.title}</div>
          <div className="text-xs text-on-surface-variant">{c.subtitle}</div>
        </div>
        <div className="flex h-[280px] items-center justify-center rounded-lg border border-outline/15 bg-surface-container-low">
          <div className="text-sm text-on-surface-variant">{c.empty}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
      <div className="mb-4">
        <div className="text-sm font-semibold text-on-surface">{c.title}</div>
        <div className="text-xs text-on-surface-variant">{c.subtitle}</div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tm-outline-variant)" />
            <XAxis
              dataKey="source"
              tick={{ fontSize: 12 }}
              tickFormatter={formatSource}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

