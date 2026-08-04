'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Download, Loader2, TrendingUp } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { TeamManagementStatsCards } from '@/components/admin/teams/team-management-stats-cards'
import {
  useAdminTeamDashboardQuery,
  useAdminTeamPerformanceQuery
} from '@/hooks/admin/useAdminTeamInsights'
import { useAdminTeamMembersQuery, useAdminTeamMutations, useAdminTeamsQuery } from '@/hooks/admin/useAdminTeams'
import { useAdminUsers } from '@/hooks/admin/useAdminUsers'
import { useI18n } from '@/hooks/useI18n'
import type { TeamMemberPerformanceRow, UserRoleLabel } from '@/types/team-admin.types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function TeamsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4" aria-hidden>
      <div className="h-40 animate-pulse rounded-2xl bg-surface-container-high md:col-span-2" />
      <div className="h-40 animate-pulse rounded-2xl bg-surface-container-high" />
      <div className="h-40 animate-pulse rounded-2xl bg-surface-container-high" />
    </div>
  )
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).slice(0, 2)
  return p.map((x) => x[0]?.toUpperCase() ?? '').join('') || '—'
}

function roleLabel(role: UserRoleLabel, t: ReturnType<typeof useI18n>['messages']['admin']['teamsPage']) {
  if (role === 'SALES') return t.roleSales
  if (role === 'ADMIN') return t.roleAdmin
  return t.roleViewer
}

export function AdminTeamsClient() {
  const { messages } = useI18n()
  const t = messages.admin.teamsPage
  const teamsQuery = useAdminTeamsQuery()
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRoleLabel>('ALL')
  const [q, setQ] = useState('')

  const teamId = useMemo(() => {
    const list = teamsQuery.data ?? []
    if (list.length === 0) return null
    if (selectedTeamId !== null && list.some((x) => x.id === selectedTeamId)) return selectedTeamId
    return list[0]?.id ?? null
  }, [teamsQuery.data, selectedTeamId])

  const teamName = useMemo(() => teamsQuery.data?.find((x) => x.id === teamId)?.name ?? '', [teamsQuery.data, teamId])

  const membersQuery = useAdminTeamMembersQuery(teamId)
  const dashboardQuery = useAdminTeamDashboardQuery(teamId)
  const performanceQuery = useAdminTeamPerformanceQuery(teamId)
  const usersQuery = useAdminUsers({ scope: 'all' })
  const { createTeam, addMember, removeMember } = useAdminTeamMutations()

  const [newTeamName, setNewTeamName] = useState('')
  const [addUserId, setAddUserId] = useState<string>('')
  const [memberTitle, setMemberTitle] = useState('')

  const perfByUser = useMemo(() => {
    const m = new Map<number, TeamMemberPerformanceRow>()
    for (const row of performanceQuery.data ?? []) {
      m.set(row.user_id, row)
    }
    return m
  }, [performanceQuery.data])

  const filteredMembers = useMemo(() => {
    const list = membersQuery.data ?? []
    const needle = q.trim().toLowerCase()
    return list.filter((row) => {
      if (roleFilter !== 'ALL' && row.user_role !== roleFilter) return false
      if (!needle) return true
      const blob = `${row.user_name} ${row.user_email} ${roleLabel(row.user_role, t)}`.toLowerCase()
      return blob.includes(needle)
    })
  }, [membersQuery.data, q, roleFilter, t])

  const onCreateTeam = (e: FormEvent) => {
    e.preventDefault()
    const name = newTeamName.trim()
    if (!name) return
    createTeam.mutate(name, {
      onSuccess: (row) => {
        setNewTeamName('')
        setSelectedTeamId(row.id)
      }
    })
  }

  const onAddMember = (e: FormEvent) => {
    e.preventDefault()
    if (!teamId || !addUserId) return
    const userId = Number(addUserId)
    if (!Number.isFinite(userId)) return
    addMember.mutate(
      { teamId, userId, title: memberTitle.trim() || null },
      {
        onSuccess: () => {
          setAddUserId('')
          setMemberTitle('')
        }
      }
    )
  }

  const onExport = () => {
    if (!teamId) return
    const rows = filteredMembers.map((m) => {
      const p = perfByUser.get(m.user_id)
      return [
        m.user_name,
        m.user_email,
        m.user_role,
        m.title ?? '',
        String(p?.assigned_leads ?? 0),
        String(p?.closed_won_leads ?? 0),
        String(p?.conversion_pct ?? 0),
        p?.avg_response_minutes != null ? String(p.avg_response_minutes) : ''
      ]
    })
    const header = ['name', 'email', 'role', 'title', 'leads_total', 'leads_won', 'conversion_pct', 'avg_resp_min']
    const esc = (cell: string) => `"${cell.replace(/"/g, '""')}"`
    const line = (cells: string[]) => cells.map(esc).join(',')
    const csv = [line(header), ...rows.map(line)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-${teamName || teamId}-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success(t.exportDoneToast)
  }

  const busy = createTeam.isPending || addMember.isPending
  const teams = teamsQuery.data ?? []
  const members = membersQuery.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{t.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" disabled={!teamId || members.length === 0} onClick={onExport}>
            <Download className="mr-2 h-4 w-4" aria-hidden />
            {t.exportMetrics}
          </Button>
          <Button asChild className="rounded-xl font-bold">
            <Link href="/admin/team-performance">
              <TrendingUp className="mr-2 h-4 w-4" aria-hidden />
              {t.openPerformance}
            </Link>
          </Button>
        </div>
      </div>

      {teamsQuery.isLoading && !teamsQuery.data ? (
        <TeamsSkeleton />
      ) : (
        <>
          <TeamManagementStatsCards
            stats={dashboardQuery.data}
            isLoading={dashboardQuery.isLoading}
            labels={{
              statsSeats: t.statsSeats,
              statsAvgResponse: t.statsAvgResponse,
              statsConversion: t.statsConversion,
              statsMinsSuffix: t.statsMinsSuffix,
              statsPctSuffix: t.statsPctSuffix,
              statsLeadsNote: t.statsLeadsNote,
              statsSeatBarHint: t.statsSeatBarHint
            }}
          />

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-1">
              <form
                onSubmit={onCreateTeam}
                className={cn(
                  'relative rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm',
                  busy && 'opacity-80'
                )}
              >
                {createTeam.isPending ? (
                  <div className="absolute right-4 top-4" aria-hidden>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : null}
                <h2 className="mb-4 font-headline text-lg font-bold text-on-surface">{t.createTeam}</h2>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      {t.teamName}
                    </label>
                    <Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="h-11" required />
                  </div>
                  <Button type="submit" disabled={createTeam.isPending} className="rounded-xl">
                    {t.create}
                  </Button>
                </div>
              </form>

              <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {t.selectTeam}
                </label>
                {teams.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">{t.emptyTeams}</p>
                ) : (
                  <Select value={teamId != null ? String(teamId) : ''} onValueChange={(v) => setSelectedTeamId(Number(v))}>
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((row) => (
                        <SelectItem key={row.id} value={String(row.id)}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
                <h2 className="mb-4 font-headline text-lg font-bold text-on-surface">{t.addMember}</h2>
                {!teamId ? (
                  <p className="text-sm text-on-surface-variant">{t.emptyTeams}</p>
                ) : (
                  <form onSubmit={onAddMember} className={cn('space-y-3', addMember.isPending && 'opacity-80')}>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        {messages.admin.userManagement.nameLabel}
                      </label>
                      <Select value={addUserId} onValueChange={setAddUserId}>
                        <SelectTrigger className="h-11 w-full rounded-xl">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {(usersQuery.data ?? []).map((u) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.name} ({u.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        {t.memberTitle}
                      </label>
                      <Input value={memberTitle} onChange={(e) => setMemberTitle(e.target.value)} className="h-11 rounded-xl" />
                    </div>
                    <Button type="submit" disabled={addMember.isPending || !addUserId} className="w-full rounded-xl">
                      {t.addMember}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm lg:col-span-2">
              <div className="flex flex-col gap-4 border-b border-outline/10 px-6 py-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <h2 className="font-headline text-xl font-bold text-on-surface">{t.membersTitle}</h2>
                  <div className="flex flex-wrap gap-2">
                    {(['ALL', 'SALES', 'ADMIN', 'VIEWER'] as const).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRoleFilter(key)}
                        className={cn(
                          'rounded-full px-4 py-1.5 text-xs font-bold transition-colors',
                          roleFilter === key
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
                        )}
                      >
                        {key === 'ALL'
                          ? t.filterAll
                          : key === 'SALES'
                            ? t.filterSales
                            : key === 'ADMIN'
                              ? t.filterAdmins
                              : t.filterViewers}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative w-full md:max-w-xs">
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="h-10 rounded-lg pl-3"
                  />
                </div>
              </div>

              {!teamId ? (
                <p className="px-6 py-12 text-center text-sm text-on-surface-variant">{t.emptyTeams}</p>
              ) : membersQuery.isLoading && !membersQuery.data ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  {membersQuery.isFetching ? (
                    <div className="absolute right-3 top-3 z-10" aria-hidden>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  ) : null}
                  <Table>
                    <TableHeader>
                      <TableRow className="border-outline/10 bg-surface-container-low hover:bg-surface-container-low">
                        <TableHead className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                          {t.colMember}
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                          {t.colRole}
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                          {t.colMetrics}
                        </TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                          {t.colAvgResp}
                        </TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                          {t.colActions}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-12 text-center text-sm text-on-surface-variant">
                            {members.length === 0 ? t.emptyMembers : messages.admin.globalSearch.noResults}
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {filteredMembers.map((row) => {
                        const p = perfByUser.get(row.user_id)
                        return (
                          <TableRow key={row.id} className="border-outline/10">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-11 w-11 rounded-xl border border-outline/10">
                                  {row.user_avatar_url ? (
                                    <AvatarImage src={row.user_avatar_url} alt="" />
                                  ) : null}
                                  <AvatarFallback className="rounded-xl text-xs font-bold">
                                    {initials(row.user_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-on-surface">{row.user_name}</p>
                                  <p className="font-mono text-xs text-on-surface-variant">{row.user_email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge intent="default" className="w-fit rounded-md bg-surface-container-high font-bold">
                                  {roleLabel(row.user_role, t)}
                                </Badge>
                                {row.title ? (
                                  <span className="text-xs text-on-surface-variant">{row.title}</span>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span>
                                    {p?.closed_won_leads ?? 0} / {p?.assigned_leads ?? 0}
                                  </span>
                                  <span className="text-primary">{p?.conversion_pct ?? 0}%</span>
                                </div>
                                <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-surface-container">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{
                                      width: `${Math.min(100, p?.conversion_pct ?? 0)}%`
                                    }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm font-semibold">
                              {p?.avg_response_minutes != null ? `${p.avg_response_minutes}${t.statsMinsSuffix}` : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={removeMember.isPending}
                                onClick={() => removeMember.mutate({ memberId: row.id, teamId: row.team_id })}
                              >
                                {t.removeMember}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
