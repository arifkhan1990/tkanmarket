'use client'

import * as React from 'react'

import type { SystemHealthChartPoint } from '@/types/system-health-monitor.types'

export function SystemHealthAreaChart({ points, ariaLabel }: { points: SystemHealthChartPoint[]; ariaLabel: string }) {
  const safe = points.length > 0 ? points : [{ label: '—', count: 0 }]

  const width = 600
  const height = 220
  const padX = 18
  const padY = 16

  const max = Math.max(...safe.map((p) => p.count), 1)
  const min = Math.min(...safe.map((p) => p.count), 0)
  const span = Math.max(1, max - min)

  const step = safe.length > 1 ? (width - padX * 2) / (safe.length - 1) : 0
  const xFor = (i: number) => padX + i * step
  const yFor = (v: number) => padY + ((max - v) / span) * (height - padY * 2)

  const baseY = height - padY

  const linePath = safe
    .map((p, i) => {
      const x = xFor(i)
      const y = yFor(p.count)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  const areaPath = `${linePath} L ${xFor(safe.length - 1).toFixed(2)} ${baseY.toFixed(2)} L ${xFor(0).toFixed(2)} ${baseY.toFixed(2)} Z`

  return (
    <div className="relative w-full">
      <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a40c2" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1a40c2" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g opacity="0.4">
          {Array.from({ length: 5 }).map((_, i) => {
            const y = padY + (i * (height - padY * 2)) / 4
            return <line key={i} x1={padX} y1={y} x2={width - padX} y2={y} stroke="currentColor" strokeWidth="1" />
          })}
        </g>

        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={linePath} fill="none" stroke="#1a40c2" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

        {safe.map((p, i) => {
          const x = xFor(i)
          const y = yFor(p.count)
          const isLast = i === safe.length - 1
          return <circle key={p.label + i} cx={x} cy={y} r={isLast ? 6 : 4} fill={isLast ? '#1a40c2' : '#dde1ff'} stroke="white" strokeWidth="2" />
        })}
      </svg>
    </div>
  )
}

