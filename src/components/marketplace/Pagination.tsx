'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { useI18n } from '@/hooks/useI18n'

function getPageItems(current: number, total: number) {
  const items: Array<number | 'ellipsis'> = []
  const add = (v: number | 'ellipsis') => items.push(v)

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

export function Pagination({
  page,
  totalPages
}: {
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const { locale, messages } = useI18n()

  if (totalPages <= 1) return null

  const items = getPageItems(page, totalPages)

  const go = (p: number) => {
    const next = new URLSearchParams(sp.toString())
    next.set('page', String(p))
    router.push(withLocaleUrl(`/fabrics?${next.toString()}`, locale))
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-8">
      <Button
        variant="outline"
        className="rounded-full"
        onClick={() => go(Math.max(1, page - 1))}
        disabled={page <= 1}
        aria-label={messages.a11y.paginationPrev}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </Button>

      {items.map((it, idx) => {
        if (it === 'ellipsis') {
          return (
            <div key={`e-${idx}`} className="px-2 text-on-surface-variant" aria-hidden>
              <MoreHorizontal className="h-4 w-4" />
            </div>
          )
        }
        const active = it === page
        return (
          <Button
            key={`page-${it}-${idx}`}
            variant={active ? 'default' : 'outline'}
            className={cn('rounded-full min-w-10', active ? '' : '')}
            onClick={() => go(it)}
            aria-current={active ? 'page' : undefined}
          >
            {it}
          </Button>
        )
      })}

      <Button
        variant="outline"
        className="rounded-full"
        onClick={() => go(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        aria-label={messages.a11y.paginationNext}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  )
}

