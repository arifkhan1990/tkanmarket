'use client'

import * as React from 'react'
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SocialQueuePaginationProps {
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  onGoToPage: (page: number) => void
}

function buildPageRange(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const range: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)
  if (start > 2) range.push('ellipsis')
  for (let p = start; p <= end; p++) range.push(p)
  if (end < totalPages - 1) range.push('ellipsis')
  range.push(totalPages)
  return range
}

export function SocialQueuePagination({ total, page, pageSize, isLoading, onGoToPage }: SocialQueuePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, total)
  const pageRange = React.useMemo(() => buildPageRange(page, totalPages), [page, totalPages])

  if (total <= 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline/10 bg-surface-container-lowest px-4 py-3 shadow-sm">
      <p className="text-xs text-on-surface-variant">
        <span className="font-semibold tabular-nums text-on-surface">{rangeFrom}–{rangeTo}</span>
        {' of '}
        <span className="font-semibold tabular-nums text-on-surface">{total}</span>
        {' posts'}
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="First page"
          className="hidden h-8 w-8 rounded-xl border-outline/20 p-0 sm:flex"
          disabled={page <= 1 || isLoading}
          onClick={() => onGoToPage(1)}
        >
          <ChevronFirst className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Previous page"
          className="h-8 gap-1 rounded-xl border-outline/20 px-2.5"
          disabled={page <= 1 || isLoading}
          onClick={() => onGoToPage(page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {pageRange.map((item, idx) =>
            item === 'ellipsis' ? (
              <span key={`e-${idx}`} className="flex h-8 w-6 items-center justify-center text-xs text-on-surface-variant">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onGoToPage(item)}
                disabled={isLoading}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  'flex h-8 min-w-[32px] items-center justify-center rounded-xl px-2.5 text-xs font-semibold tabular-nums transition-colors',
                  item === page
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-outline/20 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                )}
              >
                {item}
              </button>
            )
          )}
        </div>

        <span className="px-1 text-xs tabular-nums text-on-surface-variant sm:hidden">
          {page}/{totalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Next page"
          className="h-8 gap-1 rounded-xl border-outline/20 px-2.5"
          disabled={page >= totalPages || isLoading}
          onClick={() => onGoToPage(page + 1)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Last page"
          className="hidden h-8 w-8 rounded-xl border-outline/20 p-0 sm:flex"
          disabled={page >= totalPages || isLoading}
          onClick={() => onGoToPage(totalPages)}
        >
          <ChevronLast className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

