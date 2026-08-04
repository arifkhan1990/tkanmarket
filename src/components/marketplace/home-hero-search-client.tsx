'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'

export function HomeHeroSearchClient() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [category, setCategory] = useState('')
  const { locale, messages, t } = useI18n()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('material', category)
    const qs = params.toString()
    router.push(withLocaleUrl(`/fabrics${qs ? `?${qs}` : ''}`, locale))
  }

  return (
    <div className="w-full space-y-3">
      <form onSubmit={onSubmit} className="w-full">
        <div className="flex h-14 items-stretch overflow-hidden rounded-xl border-2 border-primary bg-background shadow-lg">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label={messages.homeSearch.allCategories}
            className="h-full max-w-[9rem] shrink-0 cursor-pointer border-r border-primary/30 bg-surface-container-low px-3 text-sm font-semibold text-on-surface focus:outline-none"
          >
            <option value="">{messages.homeSearch.allCategories}</option>
            {messages.homeSearch.chips.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
            <Search className="h-5 w-5 shrink-0 text-on-surface-variant" aria-hidden />
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={messages.homeSearch.heroPlaceholder}
              className="h-full border-none bg-transparent px-0 py-0 text-base focus-visible:ring-0"
            />
          </div>

          <Button
            type="submit"
            className="h-full shrink-0 rounded-none rounded-r-[10px] px-8 text-base font-bold"
          >
            {t('search.action')}
          </Button>
        </div>
      </form>

      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-0.5">
        <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {messages.homeSearch.oftenSought}
        </span>
        {messages.homeSearch.chips.map((c) => (
          <button
            key={c}
            type="button"
            className={cn(
              'shrink-0 rounded-full border border-outline/15 px-4 py-1.5 text-xs font-semibold transition-colors',
              'bg-surface-container text-on-surface hover:bg-primary/10 hover:text-primary'
            )}
            onClick={() => router.push(withLocaleUrl(`/fabrics?material=${encodeURIComponent(c)}`, locale))}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
