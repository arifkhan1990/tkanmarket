'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useAdminTeamPerformanceQuery } from '@/hooks/admin/useAdminTeamInsights'
import { useAdminTeamsQuery } from '@/hooks/admin/useAdminTeams'
import { useI18n } from '@/hooks/useI18n'
import type { UserRoleLabel } from '@/types/team-admin.types'

function initials(name: string): string {
  const p = name.trim().split(/\s+/).slice(0, 2)
  return p.map((x) => x[0]?.toUpperCase() ?? '').join('') || '—'
}

function roleLabel(
  role: UserRoleLabel,
  t: ReturnType<typeof useI18n>['messages']['admin']['teamsPage']
) {
  if (role === 'SALES') return t.roleSales
  if (role === 'ADMIN') return t.roleAdmin
  return t.roleViewer
}

export function AdminTeamPerformanceClient() {
  const { messages } = useI18n()
  const t = messages.admin.teamsPage
  const p = messages.admin.teamPerformancePage
  const teamsQuery = useAdminTeamsQuery()
  const [teamId, setTeamId] = useState<number | null>(null)

  const resolvedTeamId = useMemo(() => {
    const list = teamsQuery.data ?? []
    if (list.length === 0) return null
    if (teamId !== null && list.some((x) => x.id === teamId)) return teamId
    return list[0]?.id ?? null
  }, [teamsQuery.data, teamId])

  const perfQuery = useAdminTeamPerformanceQuery(resolvedTeamId)
  const rows = perfQuery.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-2 w-fit rounded-full" asChild>
            <Link href="/admin/teams">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              {messages.admin.sidebar.teams}
            </Link>
          </Button>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{p.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{p.subtitle}</p>
        </div>
        <div className="w-full sm:max-w-xs">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            {t.selectTeam}
          </label>
          {(teamsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-on-surface-variant">{p.emptyTeam}</p>
          ) : (
            <Select
              value={resolvedTeamId != null ? String(resolvedTeamId) : ''}
              onValueChange={(v) => setTeamId(Number(v))}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(teamsQuery.data ?? []).map((row) => (
                  <SelectItem key={row.id} value={String(row.id)}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {teamsQuery.isLoading && !teamsQuery.data ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : perfQuery.isLoading && !perfQuery.data ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-outline/10 bg-surface-container-low hover:bg-surface-container-low">
                <TableHead className="text-xs font-bold uppercase tracking-widest">{t.colMember}</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-widest">{t.colRole}</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-widest">
                  {t.colMetrics}
                </TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-widest">
                  {t.colAvgResp}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-sm text-on-surface-variant">
                    {p.emptyTeam}
                  </TableCell>
                </TableRow>
              ) : null}
              {rows.map((row) => (
                <TableRow key={row.team_member_id} className="border-outline/10">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 rounded-xl border border-outline/10">
                        {row.user_avatar_url ? <AvatarImage src={row.user_avatar_url} alt="" /> : null}
                        <AvatarFallback className="rounded-xl text-xs font-bold">{initials(row.user_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-on-surface">{row.user_name}</p>
                        <p className="font-mono text-xs text-on-surface-variant">{row.user_email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge intent="default" className="rounded-md font-bold">
                      {roleLabel(row.user_role, t)}
                    </Badge>
                    {row.title ? <p className="mt-1 text-xs text-on-surface-variant">{row.title}</p> : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono font-semibold text-on-surface">
                      {row.closed_won_leads} / {row.assigned_leads}
                    </span>
                    <p className="text-xs font-bold text-primary">{row.conversion_pct}%</p>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {row.avg_response_minutes != null ? `${row.avg_response_minutes} ${t.statsMinsSuffix}` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
