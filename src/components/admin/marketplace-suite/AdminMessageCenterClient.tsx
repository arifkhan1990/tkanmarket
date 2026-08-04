'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  CheckCircle2,
  Download,
  HandshakeIcon,
  Inbox,
  MailOpen,
  RefreshCw,
  ShieldCheck,
  UserPlus
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { MessageCenterLeadPreview } from '@/components/admin/message-center/message-center-lead-preview'
import { MessageCenterThreadList } from '@/components/admin/message-center/message-center-thread-list'
import { Button } from '@/components/ui/button'
import { useMessageCenterQuery } from '@/hooks/admin/useMessageCenterQuery'
import { useI18n } from '@/hooks/useI18n'
import { interpolate } from '@/lib/i18n/interpolate'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import type { MessageCenterStats, MessageThreadRow } from '@/types/admin-message-center.types'
import {
  MESSAGE_CENTER_STATUS_FILTER_ALL,
  type MessageCenterStatusFilterValue,
  parseMessageCenterStatusQueryParam
} from '@/types/admin-message-center.types'

const PAGE_LIMIT = 20

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function downloadThreadsCsv(rows: MessageThreadRow[], filename: string) {
  const header = ['id', 'company', 'contact', 'source', 'status', 'updatedAt', 'preview']
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [r.id, r.companyName, r.contactName, r.source, r.status, r.updatedAt, r.preview]
        .map((c) => csvEscape(String(c)))
        .join(',')
    )
  ]
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

function KpiCard({
  label,
  value,
  icon: Icon,
  iconClass,
  active,
  onClick
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  iconClass: string
  active?: boolean
  onClick?: () => void
}) {
  const inner = (
    <div
      className={cn(
        'rounded-2xl border bg-surface-container-lowest p-4 text-left shadow-sm transition-all dark:border-outline/15',
        active ? 'border-primary/40 ring-1 ring-primary/30' : 'border-outline/15 hover:border-primary/30'
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn('rounded-xl p-2', iconClass)}>
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        {active ? (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-primary">
            on
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-outline">{label}</p>
      <p className="mt-1 font-mono text-2xl font-black tabular-nums text-on-surface">{value.toLocaleString()}</p>
    </div>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-pressed={!!active}
      >
        {inner}
      </button>
    )
  }
  return inner
}

function KpiStrip({
  stats,
  copy,
  onlyStatus,
  onSelectStatus
}: {
  stats: MessageCenterStats
  copy: ReturnType<typeof useI18n>['messages']['admin']['messageCenterPage']
  onlyStatus: MessageCenterStatusFilterValue
  onSelectStatus: (next: MessageCenterStatusFilterValue) => void
}) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        label={copy.kpiTotalActive}
        value={stats.totalActive}
        icon={Inbox}
        iconClass="bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
      />
      <KpiCard
        label={copy.kpiNew}
        value={stats.newCount}
        icon={UserPlus}
        iconClass="bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
        active={onlyStatus === 'NEW'}
        onClick={() => onSelectStatus(onlyStatus === 'NEW' ? MESSAGE_CENTER_STATUS_FILTER_ALL : 'NEW')}
      />
      <KpiCard
        label={copy.kpiContacted}
        value={stats.contactedCount}
        icon={MailOpen}
        iconClass="bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
        active={onlyStatus === 'CONTACTED'}
        onClick={() =>
          onSelectStatus(onlyStatus === 'CONTACTED' ? MESSAGE_CENTER_STATUS_FILTER_ALL : 'CONTACTED')
        }
      />
      <KpiCard
        label={copy.kpiQualified}
        value={stats.qualifiedCount}
        icon={ShieldCheck}
        iconClass="bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
        active={onlyStatus === 'QUALIFIED'}
        onClick={() =>
          onSelectStatus(onlyStatus === 'QUALIFIED' ? MESSAGE_CENTER_STATUS_FILTER_ALL : 'QUALIFIED')
        }
      />
      <KpiCard
        label={copy.kpiProposal}
        value={stats.proposalCount}
        icon={HandshakeIcon}
        iconClass="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
      />
      <KpiCard
        label={copy.kpiClosedWon}
        value={stats.closedWonCount}
        icon={CheckCircle2}
        iconClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
        active={onlyStatus === 'CLOSED_WON'}
        onClick={() =>
          onSelectStatus(onlyStatus === 'CLOSED_WON' ? MESSAGE_CENTER_STATUS_FILTER_ALL : 'CLOSED_WON')
        }
      />
    </section>
  )
}

export function AdminMessageCenterClient() {
  const { messages, locale } = useI18n()
  const t = messages.admin.messageCenterPage
  const qc = useQueryClient()

  const filters = [
    { id: '', label: t.filterAll },
    { id: 'MARKETPLACE_INQUIRY', label: t.filterInquiries },
    { id: 'SAMPLE_REQUEST', label: t.filterSamples },
    { id: 'SOCIAL_CAMPAIGN', label: t.filterCampaigns },
    { id: 'DIRECT_CONTACT', label: t.filterDirect },
    { id: 'MANUAL_ENTRY', label: t.filterManual }
  ] as const

  const [page, setPage] = React.useState(1)
  const [source, setSource] = React.useState('')
  const [status, setStatus] = React.useState<MessageCenterStatusFilterValue>(MESSAGE_CENTER_STATUS_FILTER_ALL)
  const [searchInput, setSearchInput] = React.useState('')
  const search = useDebouncedValue(searchInput.trim(), 350)
  const [selectedId, setSelectedId] = React.useState<number | null>(null)

  // Restore initial state from URL.
  React.useEffect(() => {
    const url = new URL(window.location.href)
    const sp = url.searchParams
    const initSource = sp.get('source') ?? ''
    const initStatus = parseMessageCenterStatusQueryParam(sp.get('status'))
    const initQ = sp.get('q') ?? ''
    const initSelected = Number(sp.get('selected') ?? '')
    setSource(initSource)
    setStatus(initStatus)
    setSearchInput(initQ)
    if (Number.isFinite(initSelected) && initSelected > 0) setSelectedId(initSelected)
  }, [])

  // Reset page whenever filters change.
  React.useEffect(() => {
    setPage(1)
  }, [search, source, status])

  const [isLg, setIsLg] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setIsLg(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const query = useMessageCenterQuery({
    page,
    limit: PAGE_LIMIT,
    q: search,
    source,
    status
  })
  const data = query.data

  // Auto-select the first thread on desktop when none is selected.
  React.useEffect(() => {
    if (data === undefined) return
    if (!data.threads.length) {
      setSelectedId(null)
      return
    }
    const inList = selectedId != null && data.threads.some((th) => th.id === selectedId)
    if (!inList && isLg) {
      const first = data.threads[0]
      if (first) setSelectedId(first.id)
    }
  }, [data, selectedId, isLg])

  // Sync URL whenever the filters/selection change.
  React.useEffect(() => {
    const url = new URL(window.location.href)
    const sp = url.searchParams
    const setOrDelete = (key: string, value: string) => {
      if (value) sp.set(key, value)
      else sp.delete(key)
    }
    setOrDelete('source', source)
    setOrDelete('status', status === MESSAGE_CENTER_STATUS_FILTER_ALL ? '' : status)
    setOrDelete('q', search)
    setOrDelete('selected', selectedId != null ? String(selectedId) : '')
    window.history.replaceState(null, '', url.toString())
  }, [source, status, search, selectedId])

  const onRefresh = React.useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['admin-message-center'] })
    if (selectedId) await qc.invalidateQueries({ queryKey: ['admin-lead-detail', selectedId] })
  }, [qc, selectedId])

  const onExportCsv = React.useCallback(() => {
    if (!data?.threads.length) {
      toast.error(t.emptyThreads)
      return
    }
    downloadThreadsCsv(data.threads, `message-center-page-${page}.csv`)
    toast.success(t.exportToast)
  }, [data, page, t])

  const onClearFilters = React.useCallback(() => {
    setSource('')
    setStatus(MESSAGE_CENTER_STATUS_FILTER_ALL)
    setSearchInput('')
    setPage(1)
  }, [])

  const filtersActive =
    source !== '' || status !== MESSAGE_CENTER_STATUS_FILTER_ALL || search.length > 0

  const lastSync = data
    ? interpolate(t.lastSync, {
        time: formatDistanceToNow(new Date(data.generatedAt), { addSuffix: true })
      })
    : null

  const listCopy = {
    searchPlaceholder: t.searchPlaceholder,
    filtersAria: t.filtersAria,
    loadError: t.loadError,
    pagePrev: t.pagePrev,
    pageNext: t.pageNext,
    pageIndicator: t.pageIndicator,
    emptyThreads: t.emptyThreads,
    noResultsForQuery: t.noResultsForQuery,
    filterAll: t.filterAll,
    filterInquiries: t.filterInquiries,
    filterSamples: t.filterSamples,
    filterCampaigns: t.filterCampaigns,
    filterDirect: t.filterDirect,
    filterManual: t.filterManual,
    statusFilterAria: t.statusFilterAria,
    statusFilterAll: t.statusFilterAll,
    statusNew: t.statusNew,
    statusContacted: t.statusContacted,
    statusQualified: t.statusQualified,
    statusProposalSent: t.statusProposalSent,
    statusNegotiating: t.statusNegotiating,
    statusClosedWon: t.statusClosedWon,
    statusClosedLost: t.statusClosedLost,
    clearFilters: t.clearFilters
  }

  const previewCopy = {
    emptyTitle: t.emptyTitle,
    emptyHint: t.emptyHint,
    loadingLead: t.loadingLead,
    previewLoadError: t.previewLoadError,
    retryLoad: t.retryLoad,
    contactSection: t.contactSection,
    inquirySection: t.inquirySection,
    fabricSection: t.fabricSection,
    lastNotes: t.lastNotes,
    openFullLead: t.openFullLead,
    copyEmail: t.copyEmail,
    copiedToast: t.copiedToast,
    backToThreads: t.backToThreads,
    whatsappCta: t.whatsappCta
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">{t.title}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{t.subtitle}</p>
          {lastSync ? (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-outline">{lastSync}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={query.isFetching}
            onClick={() => void onRefresh()}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', query.isFetching && 'animate-spin')} aria-hidden />
            {t.refresh}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!data?.threads.length}
            onClick={onExportCsv}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            {t.exportCsv}
          </Button>
        </div>
      </div>

      {data ? (
        <section
          className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3 shadow-sm sm:p-4 dark:border-outline/15"
          aria-label={t.title}
        >
          <KpiStrip stats={data.stats} copy={t} onlyStatus={status} onSelectStatus={setStatus} />
        </section>
      ) : null}

      <div
        className={cn(
          'flex min-h-0 flex-col overflow-visible rounded-2xl border border-outline/10 bg-surface-container-lowest/80 shadow-sm dark:border-outline/15',
          'lg:flex-row lg:overflow-hidden lg:min-h-[34rem]',
          'lg:h-[calc(100dvh-var(--admin-topbar-height)-var(--admin-footer-height)-12rem)]',
          'xl:h-[calc(100dvh-var(--admin-topbar-height)-var(--admin-footer-height)-10rem)]',
          '2xl:h-[calc(100dvh-var(--admin-topbar-height)-var(--admin-footer-height)-9rem)]'
        )}
      >
        <section
          className={cn(
            'flex min-h-0 w-full flex-col border-outline/10 bg-surface-container-lowest/50 lg:h-full lg:w-[min(420px,40vw)] lg:shrink-0 lg:border-r lg:border-outline/10',
            selectedId != null && 'max-lg:hidden'
          )}
        >
          <MessageCenterThreadList
            t={listCopy}
            locale={locale}
            filters={filters}
            page={page}
            setPage={setPage}
            search={searchInput}
            onSearchChange={setSearchInput}
            source={source}
            onSourceChange={setSource}
            status={status}
            onStatusChange={setStatus}
            selectedId={selectedId}
            onSelectThread={(id) => setSelectedId(id)}
            onClearFilters={onClearFilters}
            filtersActive={filtersActive}
            query={query}
          />
        </section>

        <section
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col bg-surface-container-lowest/40 lg:h-full',
            selectedId == null && 'max-lg:hidden'
          )}
        >
          <MessageCenterLeadPreview
            leadId={selectedId}
            locale={locale}
            copy={previewCopy}
            onBackMobile={() => setSelectedId(null)}
            showMobileBack={selectedId != null}
          />
          <div className="hidden border-t border-outline/10 p-4 text-center text-xs text-on-surface-variant lg:block dark:border-outline/15">
            {t.desktopHintBefore}{' '}
            <Link href={withLocaleUrl('/admin/leads', locale)} className="font-medium text-primary hover:underline">
              {t.leadDetailLink}
            </Link>
            .
          </div>
        </section>
      </div>
    </div>
  )
}
