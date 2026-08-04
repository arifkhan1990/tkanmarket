'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import { Calendar, CheckCircle2, MoreHorizontal, Pencil, Trash2, Zap } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminSocialQueueItem } from '@/types/admin-social.types'
import { SocialPlatformIcon } from '@/components/admin/social/social-platform-icon'

const PLATFORM_STYLE: Record<string, { bg: string; text: string; short: string }> = {
  INSTAGRAM: { bg: 'bg-gradient-to-br from-rose-400 via-fuchsia-500 to-orange-400', text: 'text-white', short: 'IG' },
  TIKTOK: { bg: 'bg-gradient-to-br from-slate-900 to-slate-700', text: 'text-white', short: 'TT' },
  PINTEREST: { bg: 'bg-red-600', text: 'text-white', short: 'PT' },
  FACEBOOK: { bg: 'bg-blue-600', text: 'text-white', short: 'FB' },
  YOUTUBE: { bg: 'bg-red-500', text: 'text-white', short: 'YT' },
}

const STATUS_CLS: Record<string, string> = {
  DRAFT: 'bg-surface-container-high text-on-surface-variant',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  SCHEDULED: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  PUBLISHED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
}

function isVideoLike(contentType: string): boolean {
  const v = contentType.toUpperCase()
  return v.includes('REEL') || v.includes('VIDEO')
}

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
    <div className={cn('flex h-full w-full items-center justify-center', p.bg)}>
      <span className={cn('opacity-80', p.text)}>
        <SocialPlatformIcon platform={iconPlatform} className="h-5 w-5" />
      </span>
    </div>
  )
}

type Labels = {
  columnPreview: string
  columnScript: string
  columnContentType: string
  columnStatus: string
  columnRelease: string
  columnActions: string
  openPreview: string
  approve: string
  publish: string
  scheduleDate: string
  scheduleTime: string
  scheduleSave: string
  scheduleRequired: string
}

export type SocialQueueListTableProps = {
  items: AdminSocialQueueItem[]
  /** Reserved for future localization (kept for compatibility with callers). */
  locale?: string
  labels: Labels
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
  onToggleSelectAll?: () => void
  onApprove: (id: number) => void
  onPublish: (id: number) => void
  onSchedule: (id: number, scheduledAt: string) => void
  approvePending: boolean
  publishPending: boolean
  schedulePending: boolean
}

function isSelectable(row: AdminSocialQueueItem): boolean {
  return row.status === 'DRAFT' || row.status === 'FAILED'
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function ReleaseCell({
  row,
  labels,
  onSchedule,
  schedulePending
}: {
  row: AdminSocialQueueItem
  labels: Labels
  onSchedule: (id: number, scheduledAt: string) => void
  schedulePending: boolean
}) {
  const canSchedule = row.status !== 'PUBLISHED'
  const releaseIso = row.status === 'PUBLISHED' ? row.publishedAt : row.scheduledAt
  const releaseLabel = releaseIso
    ? (() => {
        try {
          return formatDistanceToNow(new Date(releaseIso), { addSuffix: true })
        } catch {
          return releaseIso
        }
      })()
    : '—'
  const [open, setOpen] = useState(false)
  const [scheduleLocal, setScheduleLocal] = useState(() => toDatetimeLocalValue(releaseIso))

  const onSave = () => {
    if (!scheduleLocal) {
      toast.error(labels.scheduleRequired)
      return
    }
    onSchedule(row.id, new Date(scheduleLocal).toISOString())
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={!canSchedule}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs text-on-surface-variant transition-colors',
            canSchedule ? 'cursor-pointer hover:text-primary' : 'cursor-default'
          )}
          aria-label={labels.columnRelease}
        >
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          <span>{releaseLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant" htmlFor={`social-release-when-${row.id}`}>
            {labels.scheduleDate} / {labels.scheduleTime}
          </label>
          <Input
            id={`social-release-when-${row.id}`}
            type="datetime-local"
            value={scheduleLocal}
            onChange={(e) => setScheduleLocal(e.target.value)}
            className="h-11 rounded-xl border-outline/15 bg-surface-container-high"
          />
          <div className="flex items-center justify-between gap-2">
            {releaseIso ? (
              <span className="text-[11px] text-on-surface-variant">
                {format(new Date(releaseIso), 'PP')}
              </span>
            ) : (
              <span className="text-[11px] text-on-surface-variant">—</span>
            )}
            <Button type="button" size="sm" className="h-9 rounded-xl px-4" onClick={onSave} disabled={schedulePending || !scheduleLocal}>
              {labels.scheduleSave}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function PostRow({
  row,
  labels,
  selected,
  onToggleSelect,
  onApprove,
  onPublish,
  onSchedule,
  approvePending,
  publishPending,
  schedulePending,
}: {
  row: AdminSocialQueueItem
  labels: Labels
  selected: boolean
  onToggleSelect?: (id: number) => void
  onApprove: (id: number) => void
  onPublish: (id: number) => void
  onSchedule: (id: number, scheduledAt: string) => void
  approvePending: boolean
  publishPending: boolean
  schedulePending: boolean
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
    onError: (e: Error) => toast.error(e.message),
  })

  const platform = PLATFORM_STYLE[row.platform] ?? PLATFORM_STYLE['INSTAGRAM']!
  const statusCls = STATUS_CLS[row.status] ?? STATUS_CLS['DRAFT']!
  const scriptPreview = row.scriptText ?? row.captionText ?? null

  return (
    <TableRow className={selected ? 'bg-primary/5' : undefined}>
      <TableCell className="w-12 pr-0">
        {onToggleSelect ? (
          <Checkbox
            checked={selected}
            disabled={!isSelectable(row)}
            onCheckedChange={() => onToggleSelect(row.id)}
            aria-label={`Select post #${row.id}`}
          />
        ) : null}
      </TableCell>
      <TableCell className="w-[360px]">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-outline/10 bg-surface-container-high">
            {row.primaryImageUrl ? (
              <Image
                src={row.primaryImageUrl}
                alt={row.fabricTitle ?? ''}
                fill
                className="object-cover"
                sizes="56px"
                unoptimized={row.primaryImageUrl.startsWith('http')}
              />
            ) : isVideoLike(row.contentType) ? (
              <Image
                src="/placeholder-video.svg"
                alt={row.fabricTitle ?? ''}
                fill
                className="object-cover opacity-95"
                sizes="56px"
                priority={false}
              />
            ) : (
              <ImagePlaceholder platform={row.platform} />
            )}
            <div
              className={cn(
                'absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold shadow-md',
                platform.bg,
                platform.text
              )}
              aria-hidden
            >
              {platform.short}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-xs font-mono text-outline">#{row.id}</p>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', statusCls)}>
                {row.status}
              </span>
            </div>
            <p className="line-clamp-1 text-sm font-bold text-on-surface">{row.fabricTitle ?? '—'}</p>
            <p className="line-clamp-1 text-xs text-on-surface-variant lg:hidden">
              {row.platform} · {row.contentType.replace(/_/g, ' ')}
            </p>
            {row.supplierName ? (
              <p className="line-clamp-1 text-xs text-on-surface-variant">{row.supplierName}</p>
            ) : null}
          </div>
        </div>
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        <span className="text-xs font-semibold text-on-surface-variant">
          {row.contentType.replace(/_/g, ' ')}
        </span>
      </TableCell>

      <TableCell className="hidden max-w-[520px] lg:table-cell">
        {scriptPreview ? (
          <p className="line-clamp-2 text-xs italic leading-relaxed text-on-surface-variant">&ldquo;{scriptPreview}&rdquo;</p>
        ) : (
          <span className="text-xs text-on-surface-variant">—</span>
        )}
      </TableCell>

      <TableCell className="hidden w-[180px] xl:table-cell">
        <ReleaseCell
          row={row}
          labels={labels}
          onSchedule={onSchedule}
          schedulePending={schedulePending}
        />
      </TableCell>

      <TableCell className="w-[220px]">
        <div className="flex items-center justify-end gap-2">
          {row.status === 'DRAFT' || row.status === 'APPROVED' ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-xl border-outline/20 px-3 text-xs font-semibold"
              disabled={approvePending}
              onClick={() => onApprove(row.id)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              {labels.approve}
            </Button>
          ) : null}

          {row.status !== 'PUBLISHED' ? (
            <Button
              size="sm"
              className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold"
              disabled={publishPending}
              onClick={() => onPublish(row.id)}
            >
              <Zap className="h-3.5 w-3.5" aria-hidden />
              {labels.publish}
            </Button>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" aria-label={labels.columnActions}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/admin/social/${row.id}/preview`} className="gap-2">
                  <Pencil className="h-3.5 w-3.5" /> {labels.openPreview}
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
      </TableCell>
    </TableRow>
  )
}

export function SocialQueueListTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm">
      <div className="border-b border-outline/10 bg-surface-container-low/30 px-4 py-3">
        <div className="h-4 w-48 animate-pulse rounded bg-surface-container-high" />
      </div>
      <div className="divide-y divide-outline/10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 px-4 py-4">
            <div className="col-span-12 lg:col-span-5 flex items-center gap-3">
              <div className="h-14 w-14 animate-pulse rounded-xl bg-surface-container-high" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-surface-container-high" />
                <div className="h-4 w-64 animate-pulse rounded bg-surface-container-high" />
              </div>
            </div>
            <div className="hidden lg:block lg:col-span-4 h-10 animate-pulse rounded bg-surface-container-high" />
            <div className="hidden xl:block xl:col-span-2 h-6 animate-pulse rounded bg-surface-container-high" />
            <div className="col-span-12 lg:col-span-3 xl:col-span-1 flex justify-end gap-2">
              <div className="h-8 w-20 animate-pulse rounded-xl bg-surface-container-high" />
              <div className="h-8 w-20 animate-pulse rounded-xl bg-surface-container-high" />
              <div className="h-8 w-8 animate-pulse rounded-xl bg-surface-container-high" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SocialQueueListTable({ items, labels, selectedIds, onToggleSelect, onToggleSelectAll, onApprove, onPublish, onSchedule, approvePending, publishPending, schedulePending }: SocialQueueListTableProps) {
  const selectableItems = items.filter(isSelectable)
  const allSelected = onToggleSelectAll != null && selectableItems.length > 0 && selectableItems.every((i) => selectedIds?.has(i.id))
  return (
    <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 pr-0">
              {onToggleSelectAll ? (
                <Checkbox
                  checked={allSelected}
                  disabled={selectableItems.length === 0}
                  onCheckedChange={onToggleSelectAll}
                  aria-label="Select all on page"
                />
              ) : null}
            </TableHead>
            <TableHead>{labels.columnPreview}</TableHead>
            <TableHead className="hidden lg:table-cell">{labels.columnContentType}</TableHead>
            <TableHead className="hidden lg:table-cell">{labels.columnScript}</TableHead>
            <TableHead className="hidden xl:table-cell">{labels.columnRelease}</TableHead>
            <TableHead className="text-right">{labels.columnActions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <PostRow
              key={row.id}
              row={row}
              labels={labels}
              selected={selectedIds?.has(row.id) ?? false}
              onToggleSelect={onToggleSelect}
              onApprove={onApprove}
              onPublish={onPublish}
              onSchedule={onSchedule}
              approvePending={approvePending}
              publishPending={publishPending}
              schedulePending={schedulePending}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

