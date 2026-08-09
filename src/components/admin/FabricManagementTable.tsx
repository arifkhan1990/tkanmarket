'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState
} from '@tanstack/react-table'
import {
  CheckCircle2,
  Database,
  Eye,
  FileText,
  Film,
  LayoutTemplate,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Workflow,
  X,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

import { cn, isRemoteImageSrc } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import { FabricManagementSecondaryFilters } from '@/components/admin/fabric-management-secondary-filters'
import { fabricListDatePresetToRange } from '@/lib/admin/fabric-list-date-presets'
import {
  useAdminCategoryOptions,
  useAdminFabricActions,
  useAdminFabricList,
  useAdminSupplierOptions
} from '@/hooks/admin/useAdminFabricManagement'
import type { AdminFabricListItem, AdminFabricStatus } from '@/types/admin-fabric-management.types'
import { useI18n } from '@/hooks/useI18n'
import { interpolate } from '@/lib/i18n/interpolate'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { Locale } from '@/types/i18n.types'

function statusIntent(status: AdminFabricStatus) {
  if (status === 'approved') return 'success' as const
  if (status === 'rejected') return 'error' as const
  if (status === 'ai_processed') return 'warning' as const
  if (status === 'ai_processing') return 'brand' as const
  if (status === 'raw_scraped') return 'default' as const
  return 'default' as const
}

function localeFor(loc: Locale): string {
  return loc === 'ru' ? 'ru-RU' : loc === 'zh' ? 'zh-CN' : 'en-US'
}

function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(localeFor(locale)).format(n)
}

function formatDate(iso: string, locale: Locale): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(localeFor(locale), {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(d)
}

function useDebouncedValue(value: string, ms: number) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

type AiContentActionButtonProps = {
  label: string
  busy: boolean
  href?: string
  openInNewTab?: boolean
  onGenerate?: () => void
}

function AiContentActionButton({ label, busy, href, openInNewTab = false, onGenerate }: AiContentActionButtonProps) {
  const isPreview = !busy && Boolean(href)
  const isGenerate = !busy && !href && typeof onGenerate === 'function'
  const icon = busy ? (
    <Loader2 className="size-3.5 animate-spin text-violet-600" aria-hidden />
  ) : isPreview ? (
    <Eye className="size-3.5 text-violet-600" aria-hidden />
  ) : (
    <Sparkles className="size-3.5 text-violet-600" aria-hidden />
  )
  const className = 'h-7 gap-1.5 rounded-md px-2.5'

  if (href) {
    return (
      <Button asChild size="sm" variant="outline" className={className} title={label}>
        <Link href={href} target={openInNewTab ? '_blank' : undefined} rel={openInNewTab ? 'noopener noreferrer' : undefined}>
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </Link>
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className={className}
      onClick={onGenerate}
      disabled={busy || !isGenerate}
      title={label}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  )
}

export function FabricManagementTable({
  initialData,
  initialStatus,
  initialQ,
  initialPage,
  initialLimit,
  initialSupplierId,
  initialCreatedFrom,
  initialCreatedTo,
  initialCategorySlug
}: {
  initialData?: import('@/types/admin-fabric-management.types').AdminFabricListResponse
  initialStatus?: string
  initialQ?: string
  initialPage?: number
  initialLimit?: number
  initialSupplierId?: number
  initialCreatedFrom?: string
  initialCreatedTo?: string
  initialCategorySlug?: string
}) {
  const { messages, locale } = useI18n()
  const t = messages.admin.fabrics
  const sp = useSearchParams()
  const router = useRouter()

  const pageFromUrl = React.useMemo(() => {
    const raw = sp.get('page')
    const n = raw ? Number(raw) : 1
    return Number.isFinite(n) && n > 0 ? n : 1
  }, [sp])

  const pageSize = React.useMemo(() => {
    const raw = sp.get('limit')
    if (!raw) return initialLimit ?? 12
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 && n <= 100 ? n : (initialLimit ?? 12)
  }, [sp, initialLimit])

  const pageIndex = pageFromUrl - 1

  const currentStatus =
    (sp.get('status') as AdminFabricStatus | null) ?? (initialStatus as AdminFabricStatus | null) ?? null
  const tabKey: 'all' | AdminFabricStatus = currentStatus ?? 'all'

  const [q, setQ] = React.useState(initialQ ?? '')
  const debouncedQ = useDebouncedValue(q, 300)

  const supplierIdFromUrl = React.useMemo(() => {
    const raw = sp.get('supplier_id')
    if (!raw) return undefined
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : undefined
  }, [sp])

  const createdFromUrl = React.useMemo(() => {
    const v = sp.get('created_from')
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined
  }, [sp])

  const createdToUrl = React.useMemo(() => {
    const v = sp.get('created_to')
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined
  }, [sp])

  const categorySlugFromUrl = React.useMemo(() => {
    const v = sp.get('category_slug')
    return v && v.trim().length > 0 ? v.trim() : undefined
  }, [sp])

  const queryParams = React.useMemo(
    () => ({
      page: pageFromUrl,
      limit: pageSize,
      status: tabKey === 'all' ? undefined : tabKey,
      q: debouncedQ.trim().length > 0 ? debouncedQ.trim() : undefined,
      supplierId: supplierIdFromUrl,
      createdFrom: createdFromUrl,
      createdTo: createdToUrl,
      categorySlug: categorySlugFromUrl
    }),
    [
      categorySlugFromUrl,
      createdFromUrl,
      createdToUrl,
      debouncedQ,
      pageFromUrl,
      pageSize,
      supplierIdFromUrl,
      tabKey
    ]
  )

  const listInitialData = React.useMemo(() => {
    if (!initialData) return undefined
    const qNorm = debouncedQ.trim().length > 0 ? debouncedQ.trim() : undefined
    const qInit = initialQ && initialQ.trim().length > 0 ? initialQ.trim() : undefined
    if (qNorm !== qInit) return undefined
    const st = tabKey === 'all' ? undefined : tabKey
    if (st !== (initialStatus ?? undefined)) return undefined
    const pageOk = pageFromUrl === (initialPage && initialPage > 0 ? initialPage : 1)
    if (!pageOk) return undefined
    const limitOk = pageSize === (initialLimit ?? 12)
    if (!limitOk) return undefined
    if ((supplierIdFromUrl ?? undefined) !== (initialSupplierId ?? undefined)) return undefined
    if ((createdFromUrl ?? undefined) !== (initialCreatedFrom ?? undefined)) return undefined
    if ((createdToUrl ?? undefined) !== (initialCreatedTo ?? undefined)) return undefined
    if ((categorySlugFromUrl ?? undefined) !== (initialCategorySlug ?? undefined)) return undefined
    return initialData
  }, [
    categorySlugFromUrl,
    createdFromUrl,
    createdToUrl,
    initialCategorySlug,
    initialCreatedFrom,
    initialCreatedTo,
    initialData,
    initialQ,
    initialStatus,
    initialPage,
    initialLimit,
    initialSupplierId,
    debouncedQ,
    tabKey,
    pageFromUrl,
    pageSize,
    supplierIdFromUrl
  ])

  const query = useAdminFabricList(queryParams, { initialData: listInitialData })
  const supplierOptions = useAdminSupplierOptions()
  const categoryOptions = useAdminCategoryOptions()

  React.useEffect(() => {
    const cur = sp.get('q') ?? ''
    const next = debouncedQ.trim()
    if (next === cur) return
    const url = new URL(window.location.href)
    if (next.length > 0) url.searchParams.set('q', next)
    else url.searchParams.delete('q')
    router.replace(`${url.pathname}?${url.searchParams.toString()}`)
  }, [debouncedQ, router, sp])

  const supplierErrorToastSent = React.useRef(false)
  React.useEffect(() => {
    if (!supplierOptions.isError) {
      supplierErrorToastSent.current = false
      return
    }
    if (supplierErrorToastSent.current) return
    supplierErrorToastSent.current = true
    const msg =
      supplierOptions.error instanceof Error
        ? supplierOptions.error.message
        : t.supplierListLoadFailed
    toast.error(msg, { id: 'admin-supplier-options-error' })
  }, [supplierOptions.error, supplierOptions.isError, t.supplierListLoadFailed])

  const actions = useAdminFabricActions()

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState('')
  const [rejectMode, setRejectMode] = React.useState<'single' | 'bulk'>('single')
  const [rejectTargetId, setRejectTargetId] = React.useState<number | null>(null)
  const [bulkApproveOpen, setBulkApproveOpen] = React.useState(false)

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const counts = query.data?.counts

  const tabs = React.useMemo<Array<{ key: 'all' | AdminFabricStatus; label: string }>>(
    () => [
      { key: 'all', label: t.tabs.all },
      { key: 'raw_scraped', label: t.tabs.raw_scraped },
      { key: 'ai_processing', label: t.tabs.ai_processing },
      { key: 'ai_processed', label: t.tabs.ai_processed },
      { key: 'approved', label: t.tabs.approved },
      { key: 'rejected', label: t.tabs.rejected }
    ],
    [t.tabs]
  )

  const statusLabel = React.useCallback(
    (status: AdminFabricStatus): string => {
      switch (status) {
        case 'raw_scraped':
          return t.statusRawScraped
        case 'ai_processing':
          return t.statusAiProcessing
        case 'ai_processed':
          return t.statusAiProcessed
        case 'approved':
          return t.statusApproved
        case 'rejected':
          return t.statusRejected
        default: {
          const _exhaustive: never = status
          return _exhaustive
        }
      }
    },
    [t]
  )

  const selectedIds = React.useMemo(() => {
    const ids: number[] = []
    for (const [k, v] of Object.entries(rowSelection)) {
      if (!v) continue
      const id = Number(k)
      if (Number.isFinite(id) && id > 0) ids.push(id)
    }
    return ids
  }, [rowSelection])

  const getDisplayTitle = React.useCallback(
    (row: AdminFabricListItem): string => {
      // Russian-first by default; English admins still see the slug under it.
      const raw = row.title_ru || row.slug
      return raw.length > 40 ? `${raw.slice(0, 40)}…` : raw
    },
    []
  )

  const columns = React.useMemo<ColumnDef<AdminFabricListItem, unknown>[]>(() => {
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(v) => table.toggleAllPageRowsSelected(v === true)}
              aria-label={t.selectAll}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(v === true)}
              aria-label={t.selectRow}
            />
          </div>
        ),
        size: 44
      },
      { id: 'id', header: '#', cell: ({ row }) => <div className="text-sm font-mono">{row.original.id}</div> },
      {
        id: 'thumb',
        header: t.thumb,
        cell: ({ row }) => {
          const url = row.original.thumb_url
          return url ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-surface-container-highest">
              <Image src={url} alt="" fill sizes="40px" className="object-cover" unoptimized={isRemoteImageSrc(url)} />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-lg bg-surface-container-highest" />
          )
        }
      },
      {
        id: 'title',
        header: t.title,
        cell: ({ row }) => {
          const fullTitle = row.original.title_ru || row.original.slug
          const titleNode = (
            <div className="truncate text-sm font-semibold text-on-surface">{getDisplayTitle(row.original)}</div>
          )
          return (
            <div className="min-w-0">
              {fullTitle.length > 40 ? (
                <Tooltip>
                  <TooltipTrigger asChild>{titleNode}</TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-md">
                    <p className="break-words text-sm font-semibold text-on-surface">{fullTitle}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                titleNode
              )}
              <div className="truncate font-mono text-xs text-outline">{row.original.slug}</div>
            </div>
          )
        }
      },
      {
        id: 'supplier',
        header: t.supplier,
        cell: ({ row }) => <div className="text-sm text-on-surface-variant">{row.original.supplier_name}</div>
      },
      {
        id: 'status',
        header: t.status,
        cell: ({ row }) => (
          <Badge intent={statusIntent(row.original.status)}>{statusLabel(row.original.status)}</Badge>
        )
      },
      {
        id: 'fabricType',
        header: t.fabricType,
        cell: ({ row }) => (
          <div className="text-xs font-medium text-on-surface-variant">
            {row.original.fabric_type ?? '—'}
          </div>
        )
      },
      {
        id: 'gsm',
        header: t.gsm,
        cell: ({ row }) => (
          <div className="text-sm font-mono tabular-nums">
            {row.original.gsm != null ? formatNumber(row.original.gsm, locale) : '—'}
          </div>
        )
      },
      {
        id: 'widthCm',
        header: t.widthCm,
        cell: ({ row }) => (
          <div className="text-sm font-mono tabular-nums">
            {row.original.width_cm != null ? formatNumber(row.original.width_cm, locale) : '—'}
          </div>
        )
      },
      {
        id: 'priceUsd',
        header: t.priceUsd,
        cell: ({ row }) => (
          <div className="text-sm font-mono tabular-nums">
            {row.original.price_usd != null && row.original.price_usd.trim() !== ''
              ? new Intl.NumberFormat(localeFor(locale), { style: 'currency', currency: 'USD' }).format(Number(row.original.price_usd))
              : '—'}
          </div>
        )
      },
      {
        id: 'moq',
        header: t.moq,
        cell: ({ row }) => (
          <div className="text-sm font-mono tabular-nums">
            {row.original.moq != null ? formatNumber(row.original.moq, locale) : '—'}
          </div>
        )
      },
      {
        id: 'aiConfidence',
        header: 'AI',
        cell: ({ row }) => {
          const score = row.original.ai_confidence_score
          if (!score) return <div className="text-xs text-on-surface-variant">—</div>
          const pct = Math.round(Number(score) * 100)
          const color = pct >= 85 ? 'text-emerald-600' : pct >= 70 ? 'text-amber-600' : 'text-red-600'
          return <div className={`text-xs font-bold tabular-nums ${color}`}>{pct}%</div>
        }
      },
      {
        id: 'aiContent',
        header: t.aiContent,
        cell: ({ row }) => {
          const item = row.original
          const id = item.id
          const blogBusy = actions.generateBlog.isPending && actions.generateBlog.variables === id
          const videoBusy = actions.generateVideo.isPending && actions.generateVideo.variables === id
          const socialBusy = actions.generateSocial.isPending && actions.generateSocial.variables === id
          const blogHref = item.has_blog && item.blog_slug ? `/blog/${item.blog_slug}` : undefined
          const videoHref = item.has_video && item.video_post_id ? `/admin/social/${item.video_post_id}/preview` : undefined
          const socialHref = item.has_social && item.social_post_id ? `/admin/social/${item.social_post_id}/preview` : undefined
          return (
            <div className="flex flex-col gap-1.5">
              <AiContentActionButton
                label={t.aiContentBlog}
                busy={blogBusy}
                href={blogHref}
                openInNewTab
                onGenerate={item.has_blog ? undefined : () => actions.generateBlog.mutate(id)}
              />
              <AiContentActionButton
                label={t.aiContentVideo}
                busy={videoBusy}
                href={videoHref}
                onGenerate={item.has_video ? undefined : () => actions.generateVideo.mutate(id)}
              />
              <AiContentActionButton
                label={t.aiContentSocial}
                busy={socialBusy}
                href={socialHref}
                onGenerate={item.has_social ? undefined : () => actions.generateSocial.mutate(id)}
              />
            </div>
          )
        }
      },
      {
        id: 'date',
        header: t.date,
        cell: ({ row }) => (
          <div className="text-xs text-on-surface-variant">{formatDate(row.original.created_at, locale)}</div>
        )
      },
      {
        id: 'actions',
        header: t.actions,
        cell: ({ row }) => {
          const id = row.original.id
          const status = row.original.status
          const approvePending = actions.approve.isPending && actions.approve.variables === id
          const aiPending = actions.aiProcess.isPending && actions.aiProcess.variables === id
          const showAiProcess = status === 'raw_scraped' || status === 'ai_processing'
          return (
            <div className="flex items-center gap-1.5">
              {showAiProcess ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg gap-1.5 px-2.5"
                  onClick={() => actions.aiProcess.mutate(id)}
                  disabled={aiPending}
                  aria-label={t.aiProcessAction}
                  title={t.aiProcessAction}
                >
                  {aiPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Workflow className="size-3.5 text-violet-600" aria-hidden />
                  )}
                  <span className="text-xs font-medium">AI</span>
                </Button>
              ) : null}
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-lg"
                onClick={() => actions.approve.mutate(id)}
                disabled={approvePending || status === 'approved'}
                aria-label={t.approve}
                title={t.approve}
              >
                {approvePending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                )}
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-lg"
                onClick={() => {
                  setRejectMode('single')
                  setRejectTargetId(id)
                  setRejectReason('')
                  setRejectOpen(true)
                }}
                disabled={status === 'rejected'}
                aria-label={t.reject}
                title={t.reject}
              >
                <XCircle className="h-3.5 w-3.5 text-red-600" aria-hidden />
              </Button>
              <Button
                asChild
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-lg"
                aria-label={t.edit}
                title={t.edit}
              >
                <Link href={withLocaleUrl(`/admin/fabrics/${id}`, locale)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-lg"
                aria-label={t.buyerPreview}
                title={t.buyerPreview}
              >
                <Link href={withLocaleUrl(`/admin/fabric-draft-preview?id=${id}`, locale)}>
                  <LayoutTemplate className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                </Link>
              </Button>
            </div>
          )
        }
      }
    ]
  }, [actions.approve, actions.aiProcess, actions.generateBlog, actions.generateSocial, actions.generateVideo, getDisplayTitle, locale, statusLabel, t])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: items,
    columns,
    state: { rowSelection },
    getRowId: (row) => String(row.id),
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(total / pageSize))
  })

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = pageIndex > 0
  const canNext = pageIndex < pageCount - 1

  const setTab = (key: typeof tabKey) => {
    const url = new URL(window.location.href)
    if (key === 'all') url.searchParams.delete('status')
    else url.searchParams.set('status', key)
    url.searchParams.delete('page')
    router.push(`${url.pathname}?${url.searchParams.toString()}`)
    setRowSelection({})
  }

  const goToPage = (nextPage: number) => {
    const url = new URL(window.location.href)
    if (nextPage <= 1) url.searchParams.delete('page')
    else url.searchParams.set('page', String(nextPage))
    router.push(`${url.pathname}?${url.searchParams.toString()}`)
    setRowSelection({})
  }

  const onRefresh = () => {
    void query.refetch()
  }

  const onClearSearch = () => {
    setQ('')
  }

  const onConfirmBulkApprove = () => {
    if (selectedIds.length === 0) return
    actions.bulkApprove.mutate(selectedIds)
    setBulkApproveOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-2xl bg-surface-container-low p-1">
          {tabs.map((tab) => {
            const active = tab.key === tabKey
            const badge =
              tab.key === 'all'
                ? counts?.all
                : counts?.[tab.key as AdminFabricStatus]
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTab(tab.key)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors',
                  active
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-outline hover:text-on-surface'
                )}
                aria-pressed={active}
              >
                {tab.key === 'raw_scraped' ? (
                  <Database
                    className={cn('size-[16px] shrink-0', active ? 'text-primary' : 'text-outline')}
                    aria-hidden
                  />
                ) : tab.key === 'ai_processing' ? (
                  <Sparkles
                    className={cn('size-[16px] shrink-0', active ? 'text-primary' : 'text-outline')}
                    aria-hidden
                  />
                ) : null}
                <span>{tab.label}</span>
                {typeof badge === 'number' ? <Badge intent="default">{badge}</Badge> : null}
              </button>
            )
          })}
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:max-w-xl sm:flex-row sm:items-stretch sm:justify-end">
          <div className="relative w-full min-w-0 sm:min-w-[280px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline"
              aria-hidden
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-10 rounded-xl border-none bg-surface-container-highest pl-10 pr-9 shadow-none focus-visible:ring-2 focus-visible:ring-primary/20"
              type="search"
            />
            {q.length > 0 ? (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-outline hover:bg-surface-container-high hover:text-on-surface"
                aria-label={t.clearSearch}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 rounded-xl"
            onClick={onRefresh}
            disabled={query.isFetching}
            aria-label={t.refresh}
            title={t.refresh}
          >
            <RefreshCw className={cn('size-4', query.isFetching && 'animate-spin')} aria-hidden />
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 shrink-0 rounded-xl"
          >
            <Link href={withLocaleUrl('/admin/fabrics/bulk-create', locale)}>
              <Plus className="size-4" aria-hidden />
              {t.bulkEntry}
            </Link>
          </Button>
          <Button
            asChild
            className="h-10 shrink-0 rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
          >
            <Link href={withLocaleUrl('/admin/fabrics/new', locale)}>
              <Plus className="size-4" aria-hidden />
              {t.newEntry}
            </Link>
          </Button>
          {counts && (counts.raw_scraped > 0 || counts.ai_processing > 0) ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 gap-2 rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50"
              onClick={() => actions.processAllRaw.mutate()}
              disabled={actions.processAllRaw.isPending}
              aria-label="Process all raw fabrics"
              title="Queue all raw_scraped fabrics for AI processing"
            >
              {actions.processAllRaw.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Workflow className="size-4 text-violet-600" aria-hidden />
              )}
              <span>AI Process All ({counts.raw_scraped})</span>
            </Button>
          ) : null}
        </div>
      </div>

      <FabricManagementSecondaryFilters
        messages={messages}
        supplierIdFromUrl={supplierIdFromUrl}
        categorySlugFromUrl={categorySlugFromUrl}
        createdFromUrl={createdFromUrl}
        createdToUrl={createdToUrl}
        total={total}
        supplierOptions={supplierOptions}
        categoryOptions={categoryOptions}
        onSupplierChange={(next) => {
          const url = new URL(window.location.href)
          if (next === undefined) url.searchParams.delete('supplier_id')
          else url.searchParams.set('supplier_id', String(next))
          url.searchParams.delete('page')
          router.push(`${url.pathname}?${url.searchParams.toString()}`)
          setRowSelection({})
        }}
        onCategoryChange={(slug) => {
          const url = new URL(window.location.href)
          if (!slug) url.searchParams.delete('category_slug')
          else url.searchParams.set('category_slug', slug)
          url.searchParams.delete('page')
          router.push(`${url.pathname}?${url.searchParams.toString()}`)
          setRowSelection({})
        }}
        onDatePresetApply={(preset) => {
          const url = new URL(window.location.href)
          const range = fabricListDatePresetToRange(preset)
          if (!range.createdFrom) {
            url.searchParams.delete('created_from')
            url.searchParams.delete('created_to')
          } else {
            url.searchParams.set('created_from', range.createdFrom)
            url.searchParams.set('created_to', range.createdTo ?? '')
          }
          url.searchParams.delete('page')
          router.push(`${url.pathname}?${url.searchParams.toString()}`)
          setRowSelection({})
        }}
        onScrollToTable={() => {
          document.getElementById('admin-fabrics-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
      />

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-on-surface px-4 py-3 text-background shadow-xl sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
              aria-hidden
            >
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium">{t.selected}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="border-white/20 bg-white/10 text-surface hover:bg-white/20"
              onClick={() => {
                setRejectMode('bulk')
                setRejectTargetId(null)
                setRejectReason('')
                setRejectOpen(true)
              }}
              disabled={actions.bulkReject.isPending}
            >
              {actions.bulkReject.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : null}
              {t.reject}
            </Button>
            <Button
              variant="outline"
              className="border-violet-300/60 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
              onClick={() => actions.bulkAiProcess.mutate(selectedIds)}
              disabled={actions.bulkAiProcess.isPending}
            >
              {actions.bulkAiProcess.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : (
                <Workflow className="mr-2 size-4" aria-hidden />
              )}
              AI Process
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setBulkApproveOpen(true)}
              disabled={actions.bulkApprove.isPending}
            >
              {actions.bulkApprove.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : null}
              {t.approve}
            </Button>
            <div className="hidden h-6 w-px shrink-0 bg-white/10 sm:block" aria-hidden />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-background/60 hover:bg-white/10 hover:text-background"
              aria-label={t.clearSelection}
              onClick={() => setRowSelection({})}
            >
              <X className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}

      <div
        id="admin-fabrics-table"
        className="overflow-hidden rounded-[2rem] border border-outline/10 bg-surface-container-lowest shadow-sm"
      >
        {query.isError && query.data ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 border-b border-error/25 bg-error-container px-4 py-3 text-sm text-on-surface"
          >
            <span>{t.listRefreshFailed}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-error/40 bg-surface-container-lowest text-error hover:bg-error-container"
              disabled={query.isFetching}
              onClick={() => {
                void query.refetch()
              }}
            >
              {t.supplierListRetry}
            </Button>
          </div>
        ) : null}
        <Table className="min-w-[1200px]">
          <TableHeader className="bg-surface-container-low/80">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {query.isPending && !query.data ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell colSpan={15} className="py-3">
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : query.isError && !query.data ? (
              <TableRow>
                <TableCell colSpan={15} className="py-10 text-center">
                  <p className="text-sm text-destructive">
                    {query.error instanceof Error ? query.error.message : t.retryFailed}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-xl"
                    onClick={() => void query.refetch()}
                  >
                    <RefreshCw className="mr-2 size-4" aria-hidden />
                    {t.retry}
                  </Button>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="py-12 text-center">
                  <p className="text-sm text-on-surface-variant">{t.empty}</p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-xl"
                  >
                    <Link href={withLocaleUrl('/admin/fabrics/new', locale)}>
                      <Plus className="mr-2 size-4" aria-hidden />
                      {t.emptyCta}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="even:bg-surface-container-low/30 hover:bg-surface-container-low/60">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-on-surface-variant">
          <span className="font-mono">
            {interpolate(t.pageOf, { current: String(pageIndex + 1), total: String(pageCount) })}
          </span>
          <span className="mx-2 text-outline">·</span>
          <span className="font-mono">
            {interpolate(t.totalItemsLabel, { n: formatNumber(total, locale) })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => goToPage(pageFromUrl - 1)} disabled={!canPrev || query.isFetching}>
            {t.prev}
          </Button>
          <Button variant="outline" onClick={() => goToPage(pageFromUrl + 1)} disabled={!canNext || query.isFetching}>
            {t.next}
          </Button>
        </div>
      </div>

      {/* Reject reason dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectMode === 'bulk' ? t.rejectDialogTitleBulk : t.rejectDialogTitleSingle}
            </DialogTitle>
            <DialogDescription>{t.rejectDialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[140px]"
              maxLength={2000}
              minLength={3}
              placeholder={t.rejectDialogDescription}
              aria-label={t.rejectDialogDescription}
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                {t.cancel}
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                disabled={
                  rejectReason.trim().length < 3 ||
                  actions.reject.isPending ||
                  actions.bulkReject.isPending
                }
                onClick={() => {
                  const reason = rejectReason.trim()
                  if (reason.length < 3) return
                  if (rejectMode === 'single') {
                    const id = rejectTargetId
                    if (!id) return
                    actions.reject.mutate({ id, reason })
                  } else {
                    actions.bulkReject.mutate({ ids: selectedIds, reason })
                  }
                  setRejectOpen(false)
                }}
              >
                {(actions.reject.isPending || actions.bulkReject.isPending) ? (
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                ) : (
                  <XCircle className="mr-2 size-4" aria-hidden />
                )}
                {t.reject}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk approve confirmation dialog */}
      <Dialog open={bulkApproveOpen} onOpenChange={setBulkApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {interpolate(t.bulkApproveDialogTitle, { count: String(selectedIds.length) })}
            </DialogTitle>
            <DialogDescription>{t.bulkApproveDialogBody}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkApproveOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              onClick={onConfirmBulkApprove}
              disabled={actions.bulkApprove.isPending || selectedIds.length === 0}
            >
              {actions.bulkApprove.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 className="mr-2 size-4" aria-hidden />
              )}
              {interpolate(t.bulkApproveConfirm, { count: String(selectedIds.length) })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
