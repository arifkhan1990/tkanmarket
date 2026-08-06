'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowDownUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Film,
  FolderOpen,
  History,
  ImageIcon,
  ImageOff,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Sparkles,
  X
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMediaLibraryQuery } from '@/hooks/admin/useMediaLibraryQuery'
import { useAdminFabricDraftOptionsQuery } from '@/hooks/admin/useAdminFabricDraftOptionsQuery'
import { useI18n } from '@/hooks/useI18n'
import { interpolate } from '@/lib/i18n/interpolate'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import type {
  MediaLibraryItem,
  MediaLibrarySort,
  MediaLibraryStatusFilter
} from '@/types/admin-media-library.types'

type ViewMode = 'grid' | 'list'
type CopyType = ReturnType<typeof useI18n>['messages']['admin']['mediaLibraryPage']

const PAGE_LIMIT = 12

function statusBadgeClasses(status: string): string {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200'
    case 'ai_processing':
    case 'ai_processed':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200'
    case 'raw_scraped':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
    case 'ai_image':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200'
    case 'ai_video':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200'
    case 'pending':
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200'
    case 'failed':
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200'
    default:
      return 'bg-surface-container-high text-on-surface-variant'
  }
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '')
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(',')
    )
    .join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
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
  iconClass
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  iconClass: string
}) {
  return (
    <div className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-5 shadow-sm dark:border-outline/15">
      <div className="flex items-start justify-between">
        <div className={cn('rounded-xl p-2.5', iconClass)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-outline">{label}</p>
      <p className="mt-1 font-mono text-3xl font-black tabular-nums text-on-surface">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
        statusBadgeClasses(status)
      )}
    >
      {status}
    </span>
  )
}

function VersionBadge({ item }: { item: MediaLibraryItem }) {
  if (item.type !== 'ai_video' && item.type !== 'ai_image') return null
  const isCurrent = item.isCurrentVersion !== false
  return (
    <span className="inline-flex flex-col items-start gap-1 align-middle">
      <span
        className={cn(
          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
          isCurrent
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
            : 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
        )}
      >
        {isCurrent ? 'Current' : 'Superseded'}
      </span>
      {typeof item.versionCount === 'number' && item.versionCount > 1 ? (
        <span className="rounded-full bg-black/60 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">
          v{item.versionCount}
        </span>
      ) : null}
    </span>
  )
}

function MediaCard({
  item,
  copy,
  onPreview,
  onCopyUrl
}: {
  item: MediaLibraryItem
  copy: CopyType
  onPreview: (item: MediaLibraryItem) => void
  onCopyUrl: (url: string) => void
}) {
  return (
    <div
      className={cn(
        'group overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md dark:border-outline/15',
        item.isCurrentVersion === false && 'opacity-60 saturate-50'
      )}
    >
      <div className="relative aspect-square bg-surface-container-high">
        {item.primaryImage ? (
          <button
            type="button"
            onClick={() => onPreview(item)}
            className="absolute inset-0 h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={copy.previewTitle}
          >
            {item.primaryImage.endsWith('.mp4') ? (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <video src={item.primaryImage} poster={item.thumbnailUrl ?? undefined} className="h-full w-full object-cover" muted />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Film className="h-8 w-8 text-white" aria-hidden />
                </span>
              </div>
            ) : (
              <Image
                src={item.primaryImage}
                alt=""
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                unoptimized={isRemoteImageSrc(item.primaryImage)}
              />
            )}
            {(item.videos && item.videos.length > 0) || item.status === 'ai_video' ? (
              <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 p-1.5">
                <Film className="h-4 w-4 text-white" aria-hidden />
              </span>
            ) : null}
            <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
              {interpolate(copy.imageCount, { n: item.imageCount })}
            </span>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100">
              <span className="rounded-full bg-white/95 p-2.5 text-on-surface shadow-lg">
                <Eye className="h-5 w-5" aria-hidden />
              </span>
            </div>
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-on-surface-variant">
            <ImageOff className="h-8 w-8 opacity-50" aria-hidden />
            <span className="sr-only">{copy.noImage}</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          <StatusBadge status={item.status} />
          {item.type === 'ai_video' || item.type === 'ai_image' ? <VersionBadge item={item} /> : null}
        </div>
      </div>
      <div className="space-y-2 p-3">
        <p className="line-clamp-2 text-sm font-bold text-on-surface">{item.title}</p>
        <p className="truncate text-[11px] text-on-surface-variant">{item.supplierName ?? '—'}</p>
        {item.categorySlugs.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {item.categorySlugs.slice(0, 2).map((slug) => (
              <span
                key={slug}
                className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant"
              >
                {slug}
              </span>
            ))}
            {item.categorySlugs.length > 2 ? (
              <span className="font-mono text-[9px] text-outline">+{item.categorySlugs.length - 2}</span>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-center gap-1 pt-1">
          <Button asChild type="button" variant="outline" size="sm" className="h-8 flex-1 gap-1 rounded-lg text-[11px]">
            <Link href={`/admin/fabrics/${item.id}`}>
              <ExternalLink className="h-3 w-3" aria-hidden />
              {copy.openFabric}
            </Link>
          </Button>
          {item.primaryImage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-lg p-0"
              onClick={() => onCopyUrl(item.primaryImage as string)}
              aria-label={copy.copyUrl}
              title={copy.copyUrl}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MediaListRow({
  item,
  copy,
  locale,
  onPreview,
  onCopyUrl
}: {
  item: MediaLibraryItem
  copy: CopyType
  locale: string
  onPreview: (item: MediaLibraryItem) => void
  onCopyUrl: (url: string) => void
}) {
  return (
    <div className="flex items-center gap-4 border-b border-outline/10 px-4 py-3 last:border-b-0 hover:bg-surface-container-low/60">
      <button
        type="button"
        onClick={() => item.primaryImage && onPreview(item)}
        disabled={!item.primaryImage}
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={copy.previewTitle}
      >
        {item.primaryImage ? (
          item.primaryImage.endsWith('.mp4') ? (
            <video src={item.primaryImage} poster={item.thumbnailUrl ?? undefined} muted preload="metadata" className="h-full w-full object-cover" />
          ) : (
            <Image src={item.primaryImage} alt="" fill className="object-cover" sizes="56px" unoptimized={isRemoteImageSrc(item.primaryImage)} />
          )
        ) : (
          <ImageOff className="absolute inset-0 m-auto h-5 w-5 text-on-surface-variant" aria-hidden />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <Link href={`/admin/fabrics/${item.id}`} className="block truncate text-sm font-bold text-on-surface hover:text-primary">
          {item.title}
        </Link>
        <p className="truncate text-xs text-on-surface-variant">{item.supplierName ?? '—'}</p>
      </div>
      <div className="hidden w-32 shrink-0 truncate font-mono text-[10px] uppercase tracking-wider text-on-surface-variant md:block">
        {item.categorySlugs.slice(0, 2).join(', ') || '—'}
      </div>
      <div className="hidden w-16 shrink-0 text-right font-mono text-sm tabular-nums text-on-surface md:block">
        {item.imageCount}
      </div>
      <div className="hidden w-24 shrink-0 md:block">
        <StatusBadge status={item.status} />
      </div>
      <div className="hidden w-28 shrink-0 text-right font-mono text-[11px] text-on-surface-variant md:block">
        {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {item.primaryImage ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-lg p-0"
            onClick={() => onCopyUrl(item.primaryImage as string)}
            aria-label={copy.copyUrl}
            title={copy.copyUrl}
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
          </Button>
        ) : null}
        <Button asChild type="button" variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0" aria-label={copy.openFabric}>
          <Link href={`/admin/fabrics/${item.id}`}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
      {/* locale only used to keep prop usage warning silent for future i18n number formatting */}
      <span className="hidden">{locale}</span>
    </div>
  )
}

function PreviewDialog({
  item,
  open,
  onOpenChange,
  copy,
  onCopyUrl
}: {
  item: MediaLibraryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  copy: CopyType
  onCopyUrl: (url: string) => void
}) {
  const [index, setIndex] = React.useState(0)
  React.useEffect(() => {
    if (open) setIndex(0)
  }, [open, item])

  if (!item) return null
  const mediaItems = [...(item.images ?? []), ...(item.videos ?? [])]
  const total = mediaItems.length
  const current = total > 0 ? mediaItems[Math.min(index, total - 1)] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-extrabold tracking-tight text-on-surface">
            {item.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-on-surface-variant">
            {item.supplierName ?? '—'} · <StatusBadge status={item.status} />
            {item.type === 'ai_video' || item.type === 'ai_image' ? (
              <>
                {' '}· <VersionBadge item={item} />
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-container-high">
          {current ? (
            current.endsWith('.mp4') ? (
              <video src={current} poster={item.thumbnailUrl ?? undefined} controls autoPlay className="h-full w-full object-contain" />
            ) : (
              <Image
                src={current}
                alt={item.title}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 90vw, 800px"
                unoptimized={isRemoteImageSrc(current)}
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-on-surface-variant">{copy.noImage}</div>
          )}
          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + total) % total)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                aria-label={copy.previousImage}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % total)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                aria-label={copy.nextImage}
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
              <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[11px] text-white">
                {interpolate(copy.imageOf, { current: index + 1, total })}
              </span>
            </>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {item.categorySlugs.map((slug) => (
              <span
                key={slug}
                className="rounded bg-surface-container-high px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant"
              >
                {slug}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {current ? (
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => onCopyUrl(current)}>
                <Copy className="mr-2 h-3.5 w-3.5" aria-hidden />
                {copy.copyUrl}
              </Button>
            ) : null}
            <Button asChild type="button" variant="secondary" size="sm" className="rounded-lg">
              <Link href={`/admin/fabrics/${item.id}`}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" aria-hidden />
                {copy.openFabric}
              </Link>
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm" className="rounded-lg">
                <X className="mr-2 h-3.5 w-3.5" aria-hidden />
                {copy.previewClose}
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AdminMediaLibraryClient() {
  const { messages, locale } = useI18n()
  const t = messages.admin.mediaLibraryPage
  const router = useRouter()

  const [page, setPage] = React.useState(1)
  const [folder, setFolder] = React.useState('')
  const [searchInput, setSearchInput] = React.useState('')
  const search = useDebouncedValue(searchInput.trim(), 350)
  const [statusFilter, setStatusFilter] = React.useState<MediaLibraryStatusFilter>('all')
  const [sortKey, setSortKey] = React.useState<MediaLibrarySort>('recent')
  const [view, setView] = React.useState<ViewMode>('grid')
  const [previewItem, setPreviewItem] = React.useState<MediaLibraryItem | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [fabricIdInput, setFabricIdInput] = React.useState('')
  const [fabricPickerOpen, setFabricPickerOpen] = React.useState(false)
  const [fabricPickerQuery, setFabricPickerQuery] = React.useState('')

  const searchParams = useSearchParams()
  const fabricId = React.useMemo(() => {
    const val = searchParams.get('fabricId')
    return val ? Number(val) : null
  }, [searchParams])

  // Reset to page 1 whenever filters change.
  React.useEffect(() => {
    setPage(1)
  }, [search, folder, statusFilter, sortKey, fabricId])

  const query = useMediaLibraryQuery({
    page,
    limit: PAGE_LIMIT,
    q: search,
    folder,
    fabricId,
    status: statusFilter,
    sort: sortKey
  })
  const data = query.data

  // Client-side toggle to hide SUPERSEDED AI video versions (default ON).
  const [showSuperseded, setShowSuperseded] = React.useState(false)
  const visibleItems = React.useMemo(() => {
    const items = data?.items ?? []
    if (showSuperseded) return items
    return items.filter((item) => item.isCurrentVersion !== false)
  }, [data, showSuperseded])

  const [aiModalOpen, setAiModalOpen] = React.useState(false)
  const [aiFabricId, setAiFabricId] = React.useState('')
  const [aiMediaType, setAiMediaType] = React.useState<'image' | 'video'>('image')
  const [isGeneratingAi, setIsGeneratingAi] = React.useState(false)

  // Post to Social state
  const handleGenerateAi = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const fid = parseInt(aiFabricId, 10)
    if (!fid || fid < 1) {
      toast.error('Enter a valid Fabric ID')
      return
    }
    setIsGeneratingAi(true)
    try {
      const endpoint = aiMediaType === 'image'
        ? `/api/v1/admin/fabrics/${fid}/generate-image`
        : `/api/v1/admin/fabrics/${fid}/generate-video`
      const res = await fetch(endpoint, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to generate AI media')
      toast.success(aiMediaType === 'image' ? 'AI Image successfully generated/regenerated' : 'AI Video successfully generated/regenerated')
      setAiModalOpen(false)
      setAiFabricId('')
      void query.refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate AI media')
    } finally {
      setIsGeneratingAi(false)
    }
  }, [aiFabricId, aiMediaType, query])

  const filtersActive =
    folder !== '' || statusFilter !== 'all' || search.length > 0 || sortKey !== 'recent' || fabricId !== null

  const handleClearFilters = React.useCallback(() => {
    setFolder('')
    setStatusFilter('all')
    setSearchInput('')
    setSortKey('recent')
    setFabricIdInput('')
    setFabricPickerQuery('')
    setFabricPickerOpen(false)
    if (fabricId !== null) router.replace('/admin/media-library')
    setPage(1)
  }, [router, fabricId])

  const handleFabricIdFilter = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return
      const val = fabricIdInput.trim()
      if (!val) return
      const num = Number(val)
      if (!Number.isInteger(num) || num < 1) return
      const url = new URL(window.location.href)
      url.searchParams.set('fabricId', String(num))
      url.searchParams.delete('page')
      router.replace(url.pathname + url.search)
      setPage(1)
    },
    [fabricIdInput, router]
  )

  const handleFabricIdClear = React.useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete('fabricId')
    url.searchParams.delete('page')
    router.replace(url.pathname + url.search)
    setFabricIdInput('')
    setPage(1)
  }, [router])

  const fabricQuery = useAdminFabricDraftOptionsQuery({
    q: fabricPickerQuery,
    page: 1,
    limit: 20,
    enabled: fabricPickerOpen
  })

  const handleCopyUrl = React.useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url)
        toast.success(t.copyUrlSuccess)
      } catch {
        toast.error(t.copyUrlError)
      }
    },
    [t.copyUrlError, t.copyUrlSuccess]
  )

  const handlePreview = React.useCallback((item: MediaLibraryItem) => {
    setPreviewItem(item)
    setPreviewOpen(true)
  }, [])

  const handleExport = React.useCallback(() => {
    const items = data?.items ?? []
    if (items.length === 0) {
      toast.error(t.exportCsvEmpty)
      return
    }
    const header = [t.colTitle, t.colSupplier, t.colCategories, t.colImages, t.colStatus, t.colUpdated, 'Primary URL']
    const rows: (string | number)[][] = [header]
    for (const it of items) {
      rows.push([
        it.title,
        it.supplierName ?? '',
        it.categorySlugs.join('|'),
        it.imageCount,
        it.status,
        it.updatedAt,
        it.primaryImage ?? ''
      ])
    }
    downloadCsv(`media-library-${Date.now()}.csv`, rows)
    toast.success(t.exportCsvToast)
  }, [data, t])

  const lastSync = data
    ? interpolate(t.lastSync, { time: formatDistanceToNow(new Date(data.generatedAt), { addSuffix: true }) })
    : null

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
        {/* Header */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <h1 className="font-heading text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">{t.title}</h1>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{t.subtitle}</p>
            {lastSync ? (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-outline">{lastSync}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setShowSuperseded((v) => !v)}
              aria-pressed={showSuperseded}
              title="Show or hide superseded AI video versions"
            >
              <History className="mr-2 h-4 w-4" aria-hidden />
              {showSuperseded ? 'Showing superseded' : 'Hide superseded versions'}
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full gap-2 bg-primary text-primary-foreground"
              onClick={() => setAiModalOpen(true)}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Generate / Regenerate AI Media
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', query.isFetching && 'animate-spin')} aria-hidden />
              {t.refresh}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={handleExport}
              disabled={!data || data.items.length === 0}
            >
              <Download className="mr-2 h-4 w-4" aria-hidden />
              {t.exportCsv}
            </Button>
          </div>
        </header>

        {/* KPI strip */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data ? (
            <>
              <KpiCard
                label={t.statTotal}
                value={data.stats.totalWithImages.toLocaleString(locale)}
                icon={ImageIcon}
                iconClass="bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
              />
              <KpiCard
                label={t.statApproved}
                value={data.stats.approvedCount.toLocaleString(locale)}
                icon={Sparkles}
                iconClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              />
              <KpiCard
                label={t.statDraft}
                value={data.stats.draftCount.toLocaleString(locale)}
                icon={ImageOff}
                iconClass="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              />
              <KpiCard
                label={t.statImages}
                value={data.stats.totalImages.toLocaleString(locale)}
                icon={LayoutGrid}
                iconClass="bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
              />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          )}
        </section>

        {/* Body grid: folders sidebar + content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-4 shadow-sm dark:border-outline/15">
              <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t.folders}</p>
              <nav className="max-h-[480px] space-y-1 overflow-y-auto pr-1">
                {query.isLoading && !data
                  ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)
                  : (data?.folders ?? []).map((f) => (
                      <button
                        key={f.slug || 'all'}
                        type="button"
                        onClick={() => setFolder(f.slug)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                          folder === f.slug
                            ? 'bg-primary/10 font-bold text-primary'
                            : 'text-on-surface hover:bg-surface-container-high'
                        )}
                        aria-pressed={folder === f.slug}
                      >
                        <span className="flex min-w-0 items-center gap-2 truncate">
                          <FolderOpen className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                          <span className="truncate capitalize">{f.label}</span>
                        </span>
                        <span className="ml-2 shrink-0 font-mono text-[10px] tabular-nums text-on-surface-variant">
                          {f.count.toLocaleString(locale)}
                        </span>
                      </button>
                    ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-6 lg:col-span-9">
            {/* Filter toolbar */}
            <section className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-4 shadow-sm dark:border-outline/15">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                 <div className="relative w-full lg:max-w-xs">
                   <Search
                     className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                     aria-hidden
                   />
                   <Input
                     type="search"
                     value={searchInput}
                     onChange={(e) => setSearchInput(e.target.value)}
                     placeholder={t.searchPlaceholder}
                     className="pl-9"
                     aria-label={t.searchPlaceholder}
                   />
                  </div>
                  <Popover open={fabricPickerOpen} onOpenChange={setFabricPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl"
                      >
                        {fabricId !== null
                          ? `Fabric #${fabricId}`
                          : 'Select fabric…'}
                        <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-50" aria-hidden />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[min(360px,calc(100vw-2rem))] p-3">
                      <Input
                        type="search"
                        value={fabricPickerQuery}
                        onChange={(e) => setFabricPickerQuery(e.target.value)}
                        placeholder="Search by title or SKU…"
                        className="h-9 rounded-lg"
                        autoFocus
                      />
                      <ScrollArea className="mt-2 h-60">
                        {fabricQuery.isLoading ? (
                          <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Skeleton key={i} className="h-10 w-full rounded-lg" />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {fabricQuery.data?.items.map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                  const url = new URL(window.location.href)
                                  url.searchParams.set('fabricId', String(f.id))
                                  url.searchParams.delete('page')
                                  router.replace(url.pathname + url.search)
                                  setFabricPickerOpen(false)
                                  setFabricIdInput('')
                                }}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-container-high',
                                  fabricId === f.id && 'bg-primary/10 font-bold text-primary'
                                )}
                              >
                                <span className="flex-1 truncate font-medium">{f.title}</span>
                                <span className="shrink-0 font-mono text-[10px] text-on-surface-variant">
                                  #{f.id}
                                </span>
                              </button>
                            ))}
                            {!fabricQuery.data?.items.length ? (
                              <p className="py-4 text-center text-sm text-on-surface-variant">
                                No fabrics found.
                              </p>
                            ) : null}
                          </div>
                        )}
                      </ScrollArea>
                      {fabricId !== null ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2 w-full rounded-lg text-xs"
                          onClick={handleFabricIdClear}
                        >
                          Clear fabric filter
                        </Button>
                      ) : null}
                    </PopoverContent>
                  </Popover>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MediaLibraryStatusFilter)}>
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue placeholder={t.statusAll} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.statusAll}</SelectItem>
                      <SelectItem value="approved">{t.statusApproved}</SelectItem>
                      <SelectItem value="draft">{t.statusDraft}</SelectItem>
                      <SelectItem value="rejected">{t.statusRejected}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortKey} onValueChange={(v) => setSortKey(v as MediaLibrarySort)}>
                    <SelectTrigger className="w-full sm:w-56">
                      <ArrowDownUp className="mr-2 h-4 w-4" aria-hidden />
                      <SelectValue placeholder={t.sortLabel} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">{t.sortRecent}</SelectItem>
                      <SelectItem value="images_desc">{t.sortImagesDesc}</SelectItem>
                      <SelectItem value="title_asc">{t.sortTitleAsc}</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center rounded-xl border border-outline/15 bg-surface-container-low p-0.5">
                    <button
                      type="button"
                      onClick={() => setView('grid')}
                      className={cn(
                        'rounded-lg p-1.5 transition-colors',
                        view === 'grid'
                          ? 'bg-surface-container-lowest text-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      )}
                      aria-label={t.viewGrid}
                      aria-pressed={view === 'grid'}
                      title={t.viewGrid}
                    >
                      <LayoutGrid className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setView('list')}
                      className={cn(
                        'rounded-lg p-1.5 transition-colors',
                        view === 'list'
                          ? 'bg-surface-container-lowest text-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      )}
                      aria-label={t.viewList}
                      aria-pressed={view === 'list'}
                      title={t.viewList}
                    >
                      <List className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  {filtersActive ? (
                    <Button type="button" variant="ghost" size="sm" className="gap-1 text-xs" onClick={handleClearFilters}>
                      <X className="h-3.5 w-3.5" aria-hidden />
                      {t.clearFilters}
                    </Button>
                  ) : null}
              </div>
            </section>

            {/* Items */}
            {query.isLoading && !data ? (
              view === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2 rounded-2xl border border-outline/15 bg-surface-container-lowest p-4 shadow-sm">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              )
            ) : visibleItems.length > 0 ? (
              view === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {visibleItems.map((item) => (
                    <MediaCard key={item.key || `item-${item.id}`} item={item} copy={t} onPreview={handlePreview} onCopyUrl={handleCopyUrl} />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-outline/15 bg-surface-container-lowest shadow-sm dark:border-outline/15">
                  <div className="hidden items-center gap-4 border-b border-outline/10 bg-surface-container-low/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant md:flex">
                    <span className="w-14 shrink-0" />
                    <span className="flex-1">{t.colTitle}</span>
                    <span className="w-32 shrink-0">{t.colCategories}</span>
                    <span className="w-16 shrink-0 text-right">{t.colImages}</span>
                    <span className="w-24 shrink-0">{t.colStatus}</span>
                    <span className="w-28 shrink-0 text-right">{t.colUpdated}</span>
                    <span className="w-[70px] shrink-0 text-right">{t.colActions}</span>
                  </div>
                  {visibleItems.map((item) => (
                    <MediaListRow
                      key={item.key || `item-${item.id}`}
                      item={item}
                      copy={t}
                      locale={locale}
                      onPreview={handlePreview}
                      onCopyUrl={handleCopyUrl}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-outline/20 p-12 text-center text-sm text-on-surface-variant">
                {search
                  ? interpolate(t.noResultsFor, { q: search })
                  : data && data.items.length > 0 && !showSuperseded
                    ? 'All results are superseded versions — toggle "Show superseded" to reveal them.'
                    : t.empty}
              </div>
            )}

            {/* Pagination */}
            {data && data.meta.totalPages > 1 ? (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-mono text-sm tabular-nums text-on-surface-variant">
                  {interpolate(t.page, { current: data.meta.page, total: data.meta.totalPages })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={page >= data.meta.totalPages || query.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <PreviewDialog
        item={previewItem}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        copy={t}
        onCopyUrl={handleCopyUrl}
      />

      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleGenerateAi}>
            <DialogHeader>
              <DialogTitle>Generate or Regenerate AI Media</DialogTitle>
              <DialogDescription>
                Enter a Fabric ID and select a media type to trigger AI generation or force a regeneration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Fabric ID *
                </label>
                <Input
                  type="number"
                  min={1}
                  value={aiFabricId}
                  onChange={(e) => setAiFabricId(e.target.value)}
                  placeholder="e.g. 12"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Media Type *
                </label>
                <Select value={aiMediaType} onValueChange={(v) => setAiMediaType(v as 'image' | 'video')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">AI Image (Batch / Single)</SelectItem>
                    <SelectItem value="video">AI Video Reel (Omniflash)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setAiModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isGeneratingAi}>
                {isGeneratingAi && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Run AI Generation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
