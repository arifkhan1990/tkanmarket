'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Home, Boxes } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export function NotFoundSearch() {
  const router = useRouter()
  const { locale, messages } = useI18n()
  const m = messages.notFound
  const placeholder = messages.homeSearch?.placeholder ?? 'Search the catalog...'
  const [value, setValue] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    router.push(withLocaleUrl(`/fabrics?q=${encodeURIComponent(q)}`, locale))
  }

  return (
    <div className="space-y-6">
      <div className="relative group max-w-md">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-primary" aria-hidden />
        </div>
        <form onSubmit={onSubmit} className="relative">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest text-on-surface placeholder:text-outline"
            placeholder={placeholder}
            aria-label={m.searchAriaLabel}
          />
        </form>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button
          type="button"
          asChild
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:opacity-90 active:scale-95 transition-all"
        >
          <Link href={withLocaleUrl('/', locale)}>
            <Home className="h-5 w-5" aria-hidden />
            {m.goHome}
          </Link>
        </Button>

        <Button
          type="button"
          asChild
          className="inline-flex items-center justify-center gap-2 bg-surface-container-high text-on-surface px-8 py-4 rounded-2xl font-bold text-lg hover:bg-surface-container-highest active:scale-95 transition-all"
        >
          <Link href={withLocaleUrl('/fabrics', locale)}>
            <Boxes className="h-5 w-5" aria-hidden />
            {m.goCatalog}
          </Link>
        </Button>
      </div>
    </div>
  )
}

