'use client'

import { useQuery } from '@tanstack/react-query'

import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'
import { useI18n } from '@/hooks/useI18n'
import { fetchAdminDashboard } from '@/services/admin-dashboard-api.service'

export function useAdminDashboard() {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { ok, json } = await fetchAdminDashboard()
      if (!ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    }
  })
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3 sm:p-4 dark:border-outline/15">
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <StatCardSkeleton key={idx} compact />
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 h-[280px] animate-pulse" />
        <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 h-[280px] animate-pulse" />
      </div>
    </div>
  )
}

