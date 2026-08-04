'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export function HomeSearchBar() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const { locale, messages, t } = useI18n()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    router.push(withLocaleUrl(`/fabrics?q=${encodeURIComponent(q)}`, locale))
  }

  return (
    <section className="mx-auto w-full max-w-screen-2xl px-6 md:px-8 -mt-8 relative z-10">
      <div className="rounded-[2.5rem] bg-background border border-outline/10 shadow-soft p-6 md:p-8">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
              <Search className="h-5 w-5 text-on-surface-variant" aria-hidden />
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={t('homeSearch.placeholder')}
                className="h-8 border-none bg-transparent px-0 py-0 text-sm md:text-base focus-visible:ring-0"
              />
            </div>
            <Button type="submit" className="h-12 rounded-2xl px-8 text-base font-extrabold">
              {t('search.action')}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {messages.homeSearch.chips.map((c) => (
              <Button
                key={c}
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => router.push(withLocaleUrl(`/fabrics?material=${encodeURIComponent(c)}`, locale))}
              >
                {c}
              </Button>
            ))}
          </div>
        </form>
      </div>
    </section>
  )
}

