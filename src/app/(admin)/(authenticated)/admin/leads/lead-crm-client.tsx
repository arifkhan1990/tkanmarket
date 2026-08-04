'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  BarChart2,
  ChevronDown,
  Filter,
  LayoutGrid,
  Layers,
  Plus,
  Search,
  TableIcon,
  TrendingUp,
  Users,
  X
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LeadKanbanBoard } from '@/components/admin/LeadKanbanBoard'
import { LeadTableView } from '@/components/admin/LeadTableView'
import { useAdminUsers } from '@/hooks/admin/useAdminUsers'
import { useI18n } from '@/hooks/useI18n'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { LeadScoringDashboardResponse } from '@/types/lead-scoring-dashboard.types'
import type { LeadStatus, LeadSource } from '@/types/marketplace.types'

/* ─── Filter state ──────────────────────────────────────────────── */
export interface LeadFilters {
  q: string
  status: LeadStatus | ''
  source: LeadSource | ''
  assignedToId: string
}

const EMPTY_FILTERS: LeadFilters = { q: '', status: '', source: '', assignedToId: '' }

const STATUS_OPTIONS: LeadStatus[] = [
  'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST'
]
const SOURCE_OPTIONS: LeadSource[] = [
  'MARKETPLACE_INQUIRY', 'SAMPLE_REQUEST', 'SOCIAL_CAMPAIGN', 'DIRECT_CONTACT', 'MANUAL_ENTRY'
]

function labelFor(raw: string) {
  return raw.replace(/_/g, ' ')
}

/* ─── KPI stat card ─────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', accent)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <div className="font-heading text-3xl font-extrabold tracking-tight text-on-surface leading-none">
        {value}
      </div>
      <p className="text-xs text-on-surface-variant">{sub}</p>
    </div>
  )
}

function StatSkeleton() {
  return <div className="h-[108px] animate-pulse rounded-2xl bg-surface-container-high" />
}

interface LeadCrmClientProps {
  initialAssignedMode?: 'all' | 'me'
}

/* ─── Main component ────────────────────────────────────────────── */
export function LeadCrmClient({ initialAssignedMode = 'all' }: LeadCrmClientProps) {
  const { messages } = useI18n()
  const c = messages.admin.leadCrm
  const sp = messages.admin.leadScoringPage
  const { data: session } = useSession()
  const router = useRouter()

  const defaultView: 'kanban' | 'table' = initialAssignedMode === 'me' ? 'table' : 'kanban'

  const [view, setView] = React.useState<'kanban' | 'table'>(defaultView)
  const [showFilters, setShowFilters] = React.useState(false)
  const [filters, setFilters] = React.useState<LeadFilters>(EMPTY_FILTERS)

  const usersQuery = useAdminUsers({ role: 'SALES' })
  const salesUsers = usersQuery.data ?? []

  const currentUserId = session?.user?.id ? String(session.user.id) : ''

  React.useEffect(() => {
    if (initialAssignedMode === 'me' && currentUserId) {
      setFilters((prev) => ({
        ...prev,
        assignedToId: currentUserId
      }))
    }
  }, [initialAssignedMode, currentUserId])

  /* KPI stats from scoring endpoint – stale 60 s, no block on render */
  const statsQuery = useQuery({
    queryKey: ['admin-leads-crm-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/leads/scoring', { credentials: 'same-origin' })
      const json = (await res.json()) as ApiEnvelope<LeadScoringDashboardResponse>
      if (!res.ok || !json.success) return null
      return json.data.metrics
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false
  })
  const metrics = statsQuery.data

  const setFilter = <K extends keyof LeadFilters>(key: K, val: LeadFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: val }))

  const activeCount = [filters.status, filters.source, filters.assignedToId].filter(Boolean).length

  const isMyLeads = Boolean(currentUserId && filters.assignedToId === currentUserId)

  const handleScopeChange = (scope: 'all' | 'me') => {
    if (scope === 'all') {
      setFilters((prev) => ({ ...prev, assignedToId: '' }))
      router.replace('/admin/leads')
      return
    }

    if (!currentUserId) return
    setFilters((prev) => ({ ...prev, assignedToId: currentUserId }))
    setView('table')
    router.replace('/admin/leads?assigned=me')
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">
            {c.title}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">{c.subtitle}</p>
        </div>
        <Button className="shrink-0 gap-2 rounded-xl font-bold shadow-lg shadow-primary/20" asChild>
          <Link href="/admin/bulk-inquiries">
            <Plus className="h-4 w-4" />
            {c.createLead}
          </Link>
        </Button>
      </div>

      {/* ── KPI bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : metrics ? (
          <>
            <StatCard
              label={sp.metricsTotal}
              value={String(metrics.totalLeads30d)}
              sub="Last 30 days"
              icon={Users}
              accent="bg-primary/10 text-primary"
            />
            <StatCard
              label={sp.metricsAvgScore}
              value={String(metrics.avgScore)}
              sub="Out of 100"
              icon={BarChart2}
              accent="bg-secondary/10 text-secondary"
            />
            <StatCard
              label={sp.metricsQualified}
              value={`${metrics.qualifiedRatePercent}%`}
              sub="30-day cohort"
              icon={TrendingUp}
              accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label={sp.metricsWinRate}
              value={`${metrics.winRatePercent}%`}
              sub="Closed deals (90d)"
              icon={Layers}
              accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            />
          </>
        ) : null}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Scope toggle: All / My leads */}
        <div className="flex items-center gap-1 rounded-xl border border-outline/15 bg-surface-container-lowest p-1 shadow-sm">
          <button
            type="button"
            onClick={() => handleScopeChange('all')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              !isMyLeads
                ? 'bg-surface-container-high text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            {'All leads'}
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange('me')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              isMyLeads
                ? 'bg-surface-container-high text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            {'My leads'}
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[180px] flex-1 md:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
            aria-hidden
          />
          <Input
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder={c.searchPlaceholder}
            className="rounded-xl border-outline/20 bg-surface-container-low pl-9"
          />
          {filters.q && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-outline hover:text-on-surface"
              onClick={() => setFilter('q', '')}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter button */}
        <Button
          type="button"
          variant="outline"
          className={cn(
            'gap-2 rounded-xl border-outline/20 transition-colors',
            showFilters && 'border-primary/40 bg-primary/5 text-primary'
          )}
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform duration-200', showFilters && 'rotate-180')}
          />
        </Button>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-0.5 rounded-xl border border-outline/15 bg-surface-container-lowest p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              view === 'kanban'
                ? 'bg-surface-container-high text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            {c.kanban}
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              view === 'table'
                ? 'bg-surface-container-high text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <TableIcon className="h-3.5 w-3.5" />
            {c.table}
          </button>
        </div>
      </div>

      {/* ── Filter panel ────────────────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-outline/10 bg-surface-container-low/70 p-4 shadow-sm backdrop-blur-sm">
          {/* Status */}
          <div className="min-w-[155px] space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Status
            </p>
            <Select
              value={filters.status || '_all'}
              onValueChange={(v) => setFilter('status', v === '_all' ? '' : (v as LeadStatus))}
            >
              <SelectTrigger className="h-9 rounded-xl border-outline/20 bg-background text-sm">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {labelFor(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source */}
          <div className="min-w-[175px] space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Source
            </p>
            <Select
              value={filters.source || '_all'}
              onValueChange={(v) => setFilter('source', v === '_all' ? '' : (v as LeadSource))}
            >
              <SelectTrigger className="h-9 rounded-xl border-outline/20 bg-background text-sm">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All sources</SelectItem>
                {SOURCE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {labelFor(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned to (table only) */}
          {view === 'table' && salesUsers.length > 0 && (
            <div className="min-w-[155px] space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Assigned to
              </p>
              <Select
                value={filters.assignedToId || '_all'}
                onValueChange={(v) => setFilter('assignedToId', v === '_all' ? '' : v)}
              >
                <SelectTrigger className="h-9 rounded-xl border-outline/20 bg-background text-sm">
                  <SelectValue placeholder="Anyone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Anyone</SelectItem>
                  {salesUsers.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {activeCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 rounded-xl text-on-surface-variant hover:text-error"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* ── Board / Table ────────────────────────────────────────── */}
      {view === 'kanban' ? (
        <LeadKanbanBoard query={filters.q} source={filters.source} />
      ) : (
        <LeadTableView
          q={filters.q}
          status={filters.status}
          source={filters.source}
          assignedToId={filters.assignedToId}
        />
      )}
    </div>
  )
}
