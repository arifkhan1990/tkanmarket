'use client'

import * as React from 'react'
import { Server, Clock } from 'lucide-react'

import type { SystemHealthNode } from '@/types/admin-system-health.types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

function statusTone(status: SystemHealthNode['status']) {
  if (status === 'ONLINE') return { text: 'text-green-600', dot: 'bg-green-500', badge: 'bg-green-50' }
  if (status === 'DEGRADED') return { text: 'text-red-600', dot: 'bg-red-500', badge: 'bg-red-50' }
  return { text: 'text-amber-500', dot: 'bg-amber-500', badge: 'bg-amber-50' }
}

export function SystemHealthNodesPanel({ nodes }: { nodes: SystemHealthNode[] }) {
  return (
    <div className="col-span-12 xl:col-span-4 bg-surface-container-low rounded-2xl p-6">
      <h4 className="text-lg font-bold font-headline mb-4">Server Nodes</h4>
      <div className="space-y-4">
        {nodes.map((n) => {
          const tone = statusTone(n.status)
          return (
            <div key={n.node_id} className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                  <Server className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-bold font-headline">{n.name}</p>
                  <p className="text-[10px] font-label text-on-surface-variant">ID: TK-{n.node_id}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn('text-xs font-bold', tone.text)}>{n.status}</p>
                <p className="text-[10px] font-label text-on-surface-variant">
                  CPU: {n.cpu_percent}%
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <Button type="button" variant="ghost" className="w-full mt-6 py-3 bg-surface-container-high text-on-surface hover:bg-surface-variant rounded-xl">
        View All Nodes <Clock className="h-4 w-4 ml-1" aria-hidden />
      </Button>
    </div>
  )
}

export function SystemHealthNodesPanelSkeleton() {
  return (
    <div className="col-span-12 xl:col-span-4 bg-surface-container-low rounded-2xl p-6">
      <h4 className="text-lg font-bold font-headline mb-4">Server Nodes</h4>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="bg-surface-container-lowest p-4 rounded-xl animate-pulse">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high" />
                <div>
                  <div className="h-4 w-32 rounded bg-surface-container-highest" />
                  <div className="mt-2 h-3 w-24 rounded bg-surface-container-highest" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-3 w-20 rounded bg-surface-container-highest" />
                <div className="mt-2 h-3 w-24 rounded bg-surface-container-highest" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 h-10 w-full rounded-xl bg-surface-container-highest animate-pulse" />
    </div>
  )
}

