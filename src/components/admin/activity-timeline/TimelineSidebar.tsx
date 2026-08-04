'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Activity, Lightbulb, TrendingDown, TrendingUp, Users } from 'lucide-react'

import type { AdminActivityTimelineSidebarStats } from '@/types/admin-activity-timeline.types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'

function initials(name: string): string {
  const t = name.trim()
  return t[0]?.toUpperCase() ?? 'S'
}

function formatPct(v: number | null): string | null {
  if (v == null || !Number.isFinite(v)) return null
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(1)}%`
}

function Donut({
  total,
  inventory,
  orders,
  users,
  system
}: {
  total: number
  inventory: number
  orders: number
  users: number
  system: number
}) {
  const r = 22
  const c = 2 * Math.PI * r

  const safeTotal = total > 0 ? total : 1
  const pInventory = inventory / safeTotal
  const pOrders = orders / safeTotal
  const pUsers = users / safeTotal
  const pSystem = system / safeTotal

  const segs = [
    { p: pInventory },
    { p: pOrders },
    { p: pUsers },
    { p: pSystem }
  ].reduce(
    (
      acc: { offset: number; segs: Array<{ dash: string; dashOffset: number }> },
      item: { p: number }
    ) => {
      const dash = `${c * item.p} ${c}`
      const dashOffset = -c * acc.offset
      return { offset: acc.offset + item.p, segs: [...acc.segs, { dash, dashOffset }] }
    },
    { offset: 0, segs: [] as Array<{ dash: string; dashOffset: number }> }
  ).segs

  const invSeg = segs[0]!
  const orderSeg = segs[1]!
  const userSeg = segs[2]!
  const sysSeg = segs[3]!

  return (
    <div className="relative h-52 w-52">
      <svg className="h-52 w-52 -rotate-90" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} stroke="currentColor" strokeWidth="6" className="text-surface-container-highest" fill="none" />

        <circle
          cx="30"
          cy="30"
          r={r}
          strokeWidth="6"
          fill="none"
          strokeDasharray={invSeg.dash}
          strokeDashoffset={invSeg.dashOffset}
          className="text-primary"
        />
        <circle
          cx="30"
          cy="30"
          r={r}
          strokeWidth="6"
          fill="none"
          strokeDasharray={orderSeg.dash}
          strokeDashoffset={orderSeg.dashOffset}
          className="text-indigo-600 dark:text-indigo-400"
        />
        <circle
          cx="30"
          cy="30"
          r={r}
          strokeWidth="6"
          fill="none"
          strokeDasharray={userSeg.dash}
          strokeDashoffset={userSeg.dashOffset}
          className="text-emerald-600"
        />
        <circle
          cx="30"
          cy="30"
          r={r}
          strokeWidth="6"
          fill="none"
          strokeDasharray={sysSeg.dash}
          strokeDashoffset={sysSeg.dashOffset}
          className="text-outline"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-3xl font-black text-on-surface">{total.toLocaleString()}</div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Entities</div>
      </div>
    </div>
  )
}

export function TimelineSidebar({
  sidebar,
  isLoading
}: {
  sidebar: AdminActivityTimelineSidebarStats | undefined
  isLoading: boolean
}) {
  const weeklyTotal = sidebar?.weeklyTotalActions ?? 0
  const weeklyGrowth = sidebar?.weeklyGrowthPercent ?? null
  const engagement = sidebar?.userEngagementPercent ?? null
  const dist = sidebar?.entityDistribution
  const distTotal = dist ? dist.inventory + dist.orders + dist.users + dist.system : 0

  return (
    <div className="space-y-6">
      {isLoading ? (
        <>
          <Card className="p-6">
            <div className="h-4 w-1/2 rounded bg-surface-container-highest animate-pulse" />
            <div className="mt-4 h-10 w-2/3 rounded bg-surface-container-highest animate-pulse" />
            <div className="mt-2 h-4 w-1/3 rounded bg-surface-container-highest animate-pulse" />
          </Card>
          <Card className="p-6">
            <div className="h-4 w-2/3 rounded bg-surface-container-highest animate-pulse" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-surface-container-highest animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-surface-container-highest animate-pulse" />
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}

      {!isLoading && sidebar ? (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" aria-hidden />
                <div className="font-heading text-on-surface text-lg font-extrabold">Weekly Performance</div>
              </div>
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{format(new Date(), 'MMM d')}</div>
            </div>

            <div className="space-y-4">
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline/10">
                <div className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Total Actions</div>
                <div className="flex items-end justify-between gap-2">
                  <div className="text-3xl font-heading font-extrabold text-on-surface">{weeklyTotal.toLocaleString()}</div>
                  {weeklyGrowth == null ? null : (
                    <div className={cn('text-xs font-bold flex items-center gap-1', weeklyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {weeklyGrowth >= 0 ? <TrendingUp className="h-3.5 w-3.5" aria-hidden /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden />}
                      {formatPct(weeklyGrowth)}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline/10">
                <div className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">User Engagement</div>
                <div className="flex items-end justify-between gap-2">
                  <div className="text-3xl font-heading font-extrabold text-on-surface">{engagement == null ? '—' : `${engagement.toFixed(0)}%`}</div>
                  {engagement == null ? null : (
                    <div className="text-xs font-bold text-on-surface-variant">Last 7 days</div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-on-surface-variant" aria-hidden />
                <div className="font-heading text-on-surface text-lg font-extrabold">Top Active Users</div>
              </div>
            </div>
            <div className="space-y-4">
              {sidebar.topActiveUsers.length === 0 ? (
                <div className="text-sm text-on-surface-variant">No user activity in this range.</div>
              ) : null}
              {sidebar.topActiveUsers.map((u) => (
                <div key={u.userId} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.name ?? 'User'} /> : null}
                    <AvatarFallback>{initials(u.name ?? 'User')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-on-surface leading-tight truncate">{u.name ?? `User #${u.userId}`}</div>
                    <div className="text-xs text-on-surface-variant">{u.actions} actions today</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-primary">{`LVL ${u.level}`}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-heading text-on-surface text-lg font-extrabold mb-3">Entity Type Distribution</div>
            {dist ? (
              <>
                <div className="flex items-center justify-center py-2">
                  <Donut
                    total={distTotal}
                    inventory={dist.inventory}
                    orders={dist.orders}
                    users={dist.users}
                    system={dist.system}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="text-xs font-medium text-on-surface-variant">Inventory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                    <span className="text-xs font-medium text-on-surface-variant">Orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                    <span className="text-xs font-medium text-on-surface-variant">Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-outline" />
                    <span className="text-xs font-medium text-on-surface-variant">System</span>
                  </div>
                </div>
              </>
            ) : null}
          </Card>

          <div className="p-5 bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-xl">
            <div className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
                <Lightbulb className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <div className="font-bold text-sm">Pro Tip: Filter by User</div>
                <div className="text-xs mt-1 text-primary-fixed-dim">Pick a userId to instantly see their impact across audit + activity events.</div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

