'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

type PageItem = number | 'ellipsis'

function getPageItems(current: number, total: number): PageItem[] {
  const items: PageItem[] = []
  const add = (v: PageItem) => items.push(v)

  if (total <= 7) {
    for (let i = 1; i <= total; i++) add(i)
    return items
  }

  add(1)
  const left = Math.max(2, current - 1)
  const right = Math.min(total - 1, current + 1)

  if (left > 2) add('ellipsis')
  for (let i = left; i <= right; i++) add(i)
  if (right < total - 1) add('ellipsis')
  add(total)

  return items
}

export type AdminPaginationProps = {
  page: number
  pageSize: number
  totalItems: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  disabled?: boolean
  className?: string
}

export function AdminPagination({
  page,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  disabled,
  className
}: AdminPaginationProps) {
  const { messages } = useI18n()
  const p = messages.admin.pagination

  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / Math.max(1, pageSize)))
  const safePage = Math.min(Math.max(1, page), totalPages)

  const canPrev = safePage > 1
  const canNext = safePage < totalPages

  const items = useMemo(() => getPageItems(safePage, totalPages), [safePage, totalPages])

  const [jumpRaw, setJumpRaw] = useState('')

  const onJump = () => {
    const n = Number(jumpRaw)
    if (!Number.isFinite(n)) return
    const next = Math.min(totalPages, Math.max(1, Math.trunc(n)))
    onPageChange(next)
    setJumpRaw('')
  }

  const summary = p.summary
    .replace('{from}', String(totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1))
    .replace('{to}', String(Math.min(totalItems, safePage * pageSize)))
    .replace('{total}', String(totalItems))

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-outline/10 bg-surface-container-low/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
      aria-label={p.aria}
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-on-surface-variant">{summary}</p>
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-outline">{p.pageSizeLabel}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                const next = Number(v)
                if (!Number.isFinite(next) || next < 1) return
                onPageSizeChange(next)
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 w-[100px] rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={disabled || !canPrev}
            aria-label={messages.a11y.paginationPrev}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>

          {items.map((it, idx) => {
            if (it === 'ellipsis') {
              return (
                <span key={`e-${idx}`} className="px-1 text-on-surface-variant" aria-hidden>
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              )
            }
            const active = it === safePage
            return (
              <Button
                key={`p-${it}-${idx}`}
                type="button"
                variant={active ? 'default' : 'outline'}
                className={cn('h-9 min-w-9 rounded-full px-3', active ? '' : '')}
                onClick={() => onPageChange(it)}
                disabled={disabled}
                aria-current={active ? 'page' : undefined}
              >
                {it}
              </Button>
            )
          })}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={disabled || !canNext}
            aria-label={messages.a11y.paginationNext}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-outline">{p.jumpLabel}</span>
          <Input
            value={jumpRaw}
            onChange={(e) => setJumpRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onJump()
            }}
            inputMode="numeric"
            placeholder={p.jumpPlaceholder.replace('{total}', String(totalPages))}
            className="h-9 w-[120px] rounded-full font-mono"
            disabled={disabled}
            aria-label={p.jumpLabel}
          />
          <Button type="button" variant="secondary" className="h-9 rounded-full" onClick={onJump} disabled={disabled}>
            {p.go}
          </Button>
        </div>
      </div>
    </div>
  )
}
