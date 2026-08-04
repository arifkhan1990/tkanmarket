'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import { useI18n } from '@/hooks/useI18n'

export interface FabricsPublishedChartPoint {
  date: string
  count: number
}

function formatDateTick(value: unknown) {
  if (typeof value !== 'string') return ''
  // expected YYYY-MM-DD
  const parts = value.split('-')
  if (parts.length !== 3) return value
  return `${parts[1]}-${parts[2]}`
}

export function FabricsPublishedChart({ data }: { data: FabricsPublishedChartPoint[] }) {
  const { messages } = useI18n()
  const c = messages.admin.charts.fabricsPublished

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
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tm-outline-variant)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={formatDateTick} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

