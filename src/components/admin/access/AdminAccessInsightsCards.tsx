'use client'

import type { ReactNode } from 'react'

import { ShieldCheck, Sparkles, Users } from 'lucide-react'

import { useAdminAccessInsights } from '@/hooks/admin/useAdminAccessInsights'
import { useI18n } from '@/hooks/useI18n'
import type { AdminAccessInsights } from '@/types/admin-access-insights.types'

function Card({ icon, title, value, subtitle }: { icon: ReactNode; title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-fixed/30 text-primary">{icon}</div>
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-widest text-outline">{title}</div>
          <div className="mt-1 text-2xl font-extrabold font-mono text-on-surface">{value}</div>
          <div className="mt-1 text-xs text-on-surface-variant">{subtitle}</div>
        </div>
      </div>
    </div>
  )
}

export function AdminAccessInsightsCards() {
  const { messages } = useI18n()
  const m = messages.admin.accessInsights

  const query = useAdminAccessInsights()

  if (query.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4 animate-pulse"
            aria-hidden
          >
            <div className="h-10 w-10 rounded-2xl bg-surface-container-highest" />
            <div className="h-4 w-40 rounded bg-surface-container-highest" />
            <div className="h-8 w-24 rounded bg-surface-container-highest" />
            <div className="h-3 w-56 rounded bg-surface-container-highest" />
          </div>
        ))}
      </div>
    )
  }

  const data = query.data as AdminAccessInsights | undefined
  if (!data) return null

  const totpTotal = data.totp_enabled_users + data.totp_disabled_users
  const totpEnabledPct = totpTotal > 0 ? Math.round((data.totp_enabled_users / totpTotal) * 100) : 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card
        icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
        title={m.securityPulse.title}
        value={`${data.totp_enabled_users}`}
        subtitle={m.securityPulse.subtitle.replace('{pct}', String(totpEnabledPct))}
      />
      <Card
        icon={<Sparkles className="h-5 w-5" aria-hidden />}
        title={m.activitySpikes.title}
        value={`${data.audit_events_24h}`}
        subtitle={m.activitySpikes.subtitle}
      />
      <Card
        icon={<Users className="h-5 w-5" aria-hidden />}
        title={m.teamComposition.title}
        value={`${data.teams_total}`}
        subtitle={m.teamComposition.subtitle.replace('{members}', String(data.team_members_total))}
      />
    </div>
  )
}

