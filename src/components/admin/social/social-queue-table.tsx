'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Hash,
  MoreHorizontal,
  Pencil,
  Trash2,
  Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { AdminSocialQueueItem } from '@/types/admin-social.types'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import { SocialPlatformIcon } from '@/components/admin/social/social-platform-icon'

/* ─── Platform badge ─────────────────────────────────────────────── */
const PLATFORM_STYLE: Record<string, { bg: string; text: string; short: string }> = {
  INSTAGRAM: { bg: 'bg-gradient-to-br from-rose-400 via-fuchsia-500 to-orange-400', text: 'text-white', short: 'IG' },
  TIKTOK:    { bg: 'bg-gradient-to-br from-slate-900 to-slate-700',                  text: 'text-white', short: 'TT' },
  PINTEREST: { bg: 'bg-red-600',                                                      text: 'text-white', short: 'PT' },
  FACEBOOK:  { bg: 'bg-blue-600',                                                     text: 'text-white', short: 'FB' },
  YOUTUBE:   { bg: 'bg-red-500',                                                      text: 'text-white', short: 'YT' }
}

/* ─── Status badge intent ────────────────────────────────────────── */
const STATUS_CLS: Record<string, string> = {
  DRAFT:     'bg-surface-container-high text-on-surface-variant',
  APPROVED:  'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  SCHEDULED: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  PUBLISHED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  FAILED:    'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
}

function isVideoLike(contentType: string): boolean {
  const v = contentType.toUpperCase()
  return v.includes('REEL') || v.includes('VIDEO')
}

/* ─── Fabric placeholder ─────────────────────────────────────────── */
function ImagePlaceholder({ platform }: { platform: string }) {
  const p = PLATFORM_STYLE[platform] ?? PLATFORM_STYLE['INSTAGRAM']!
  const iconPlatform = (
    platform === 'INSTAGRAM' ||
    platform === 'TIKTOK' ||
    platform === 'PINTEREST' ||
    platform === 'FACEBOOK' ||
    platform === 'YOUTUBE'
  )
    ? platform
    : 'INSTAGRAM'
  return (
    <div className={cn('flex h-full w-full flex-col items-center justify-center gap-1.5', p.bg)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 opacity-40" fill="none" aria-hidden>
        <rect x="2" y="2" width="6" height="6" rx="1" fill="white" />
        <rect x="10" y="2" width="6" height="6" rx="1" fill="white" opacity="0.6" />
        <rect x="18" y="2" width="6" height="6" rx="1" fill="white" />
        <rect x="26" y="2" width="4" height="6" rx="1" fill="white" opacity="0.6" />
        <rect x="2" y="10" width="6" height="6" rx="1" fill="white" opacity="0.6" />
        <rect x="10" y="10" width="6" height="6" rx="1" fill="white" />
        <rect x="18" y="10" width="6" height="6" rx="1" fill="white" opacity="0.6" />
        <rect x="26" y="10" width="4" height="6" rx="1" fill="white" />
        <rect x="2" y="18" width="6" height="6" rx="1" fill="white" />
        <rect x="10" y="18" width="6" height="6" rx="1" fill="white" opacity="0.6" />
        <rect x="18" y="18" width="6" height="6" rx="1" fill="white" />
        <rect x="26" y="18" width="4" height="6" rx="1" fill="white" opacity="0.6" />
        <rect x="2" y="26" width="6" height="4" rx="1" fill="white" opacity="0.6" />
        <rect x="10" y="26" width="6" height="4" rx="1" fill="white" />
        <rect x="18" y="26" width="6" height="4" rx="1" fill="white" opacity="0.6" />
        <rect x="26" y="26" width="4" height="4" rx="1" fill="white" />
      </svg>
      <span className={cn('opacity-85', p.text)}>
        <SocialPlatformIcon platform={iconPlatform} className="h-4 w-4" />
      </span>
    </div>
  )
}

/* ─── Score bar ──────────────────────────────────────────────────── */
function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score))
  const cls = pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
        <div className={cn('h-full rounded-full', cls)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right font-mono text-[10px] font-bold text-on-surface-variant">{pct}</span>
    </div>
  )
}

/* ─── Props ──────────────────────────────────────────────────────── */
type SocialQueueTableProps = {
  items: AdminSocialQueueItem[]
  locale: string
  labels: {
    columnPreview: string
    columnScript: string
    columnStatus: string
    columnRelease: string
    columnActions: string
    openPreview: string
    approve: string
    publish: string
  }
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
  onApprove: (id: number) => void
  onPublish: (id: number) => void
  approvePending: boolean
  publishPending: boolean
}

/* ─── Card ───────────────────────────────────────────────────────── */
function isSelectable(row: AdminSocialQueueItem): boolean {
  return row.status === 'DRAFT' || row.status === 'FAILED'
}

function PostCard({
  row,
  locale,
  labels,
  selected,
  onToggleSelect,
  onApprove,
  onPublish,
  approvePending,
  publishPending
}: {
  row: AdminSocialQueueItem
  locale: string
  labels: SocialQueueTableProps['labels']
  selected: boolean
  onToggleSelect?: (id: number) => void
  onApprove: (id: number) => void
  onPublish: (id: number) => void
  approvePending: boolean
  publishPending: boolean
}) {
  const qc = useQueryClient()

  const reject = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/admin/social/${row.id}/reject`, { method: 'POST', credentials: 'same-origin' })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) throw new Error(!json.success ? json.error.message : 'Failed to reject')
    },
    onSuccess: () => {
      toast.success('Post rejected')
      void qc.invalidateQueries({ queryKey: ['admin-social'] })
      void qc.invalidateQueries({ queryKey: ['admin-social-stats'] })
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const platform = PLATFORM_STYLE[row.platform] ?? PLATFORM_STYLE['INSTAGRAM']!
  const statusCls = STATUS_CLS[row.status] ?? STATUS_CLS['DRAFT']!

  const releaseIso = row.status === 'PUBLISHED' ? row.publishedAt : row.scheduledAt
  const releaseLabel = releaseIso
    ? (() => {
        try { return formatDistanceToNow(new Date(releaseIso), { addSuffix: true }) }
        catch { return releaseIso }
      })()
    : null

  const scriptPreview = row.scriptText ?? row.captionText ?? null

  return (
    <article className={cn('group relative flex flex-col overflow-hidden rounded-2xl border bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md', selected ? 'border-primary/50 ring-1 ring-primary/30' : 'border-outline/10')}>
      {/* Selection toggle */}
      {onToggleSelect ? (
        <Checkbox
          checked={selected}
          disabled={!isSelectable(row)}
          onCheckedChange={() => onToggleSelect(row.id)}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          className="absolute left-2.5 top-2.5 z-10 h-6 w-6 rounded-full border-white/60 bg-black/55 shadow-md backdrop-blur-sm transition-colors data-[state=checked]:border-primary"
          aria-label={`Select post #${row.id}`}
        />
      ) : null}

      {/* Thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-high">
        {row.primaryImageUrl ? (
          <Image
            src={row.primaryImageUrl}
            alt={row.fabricTitle ?? ''}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={row.primaryImageUrl.startsWith('http')}
          />
        ) : isVideoLike(row.contentType) ? (
          <Image
            src="/placeholder-video.svg"
            alt={row.fabricTitle ?? ''}
            fill
            className="object-cover opacity-95"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={false}
          />
        ) : (
          <ImagePlaceholder platform={row.platform} />
        )}

        {/* Platform badge */}
        <div className={cn('absolute bottom-2.5 left-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold shadow-md', platform.bg, platform.text)}>
          {platform.short}
        </div>

        {/* Content type chip */}
        <div className="absolute right-2.5 top-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {row.contentType.replace(/_/g, ' ')}
        </div>

        {/* Edit overlay on hover */}
        <Link
          href={`/admin/social/${row.id}/preview`}
          className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30"
          aria-label={labels.openPreview}
        >
          <div className="flex h-10 w-10 scale-75 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
            <Pencil className="h-4 w-4 text-slate-900" aria-hidden />
          </div>
        </Link>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-mono text-outline">#{row.id}</p>
            <p className="line-clamp-1 text-sm font-bold text-on-surface">{row.fabricTitle ?? '—'}</p>
            {row.supplierName && (
              <p className="truncate text-[11px] text-on-surface-variant">{row.supplierName}</p>
            )}
          </div>
          <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', statusCls)}>
            {row.status}
          </span>
        </div>

        {/* Score */}
        {row.socialScore != null && <ScoreBar score={row.socialScore} />}

        {/* Caption preview */}
        {scriptPreview && (
          <p className="line-clamp-2 text-xs italic leading-relaxed text-on-surface-variant">
            &ldquo;{scriptPreview}&rdquo;
          </p>
        )}

        {/* Hashtag count */}
        {row.hashtags && row.hashtags.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-outline">
            <Hash className="h-3 w-3" aria-hidden />
            <span>{row.hashtags.length} hashtags</span>
          </div>
        )}

        {/* Release date */}
        {releaseLabel && (
          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
            <Calendar className="h-3 w-3 shrink-0" aria-hidden />
            <span>{releaseLabel}</span>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-1 border-t border-outline/8 px-4 py-3">
        <div className="flex gap-1.5">
          {row.status === 'DRAFT' || row.status === 'APPROVED' ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 rounded-lg border-outline/20 px-2.5 text-[11px] font-semibold"
              disabled={approvePending}
              onClick={() => onApprove(row.id)}
            >
              <CheckCircle2 className="h-3 w-3" />
              {labels.approve}
            </Button>
          ) : null}
          {row.status !== 'PUBLISHED' ? (
            <Button
              size="sm"
              className="h-7 gap-1 rounded-lg px-2.5 text-[11px] font-semibold"
              disabled={publishPending}
              onClick={() => onPublish(row.id)}
            >
              <Zap className="h-3 w-3" />
              {labels.publish}
            </Button>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" aria-label={labels.columnActions}>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href={`/admin/social/${row.id}/preview`} className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" /> {labels.openPreview}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              disabled={reject.isPending}
              onClick={() => reject.mutate()}
            >
              <Trash2 className="h-3.5 w-3.5" /> Reject &amp; delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}

/* ─── Card grid skeleton ─────────────────────────────────────────── */
export function SocialQueueCardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm">
          <div className="aspect-[4/3] animate-pulse bg-surface-container-high" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface-container-high" />
            <div className="h-2.5 w-full animate-pulse rounded bg-surface-container-high" />
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-surface-container-high" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Main grid ──────────────────────────────────────────────────── */
export function SocialQueueTable({ items, locale, labels, selectedIds, onToggleSelect, onApprove, onPublish, approvePending, publishPending }: SocialQueueTableProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((row) => (
        <PostCard
          key={row.id}
          row={row}
          locale={locale}
          labels={labels}
          selected={selectedIds?.has(row.id) ?? false}
          onToggleSelect={onToggleSelect}
          onApprove={onApprove}
          onPublish={onPublish}
          approvePending={approvePending}
          publishPending={publishPending}
        />
      ))}
    </div>
  )
}
