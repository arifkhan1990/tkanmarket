'use client'

import { Check, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/hooks/useI18n'
import { setLocaleCookieClient } from '@/lib/i18n/set-locale-cookie'
import { cn } from '@/lib/utils'
import { LOCALES, type Locale } from '@/types/i18n.types'

function localeLabel(locale: Locale, messages: { en: string; ru: string; zh: string }): string {
  if (locale === 'en') return messages.en
  if (locale === 'ru') return messages.ru
  return messages.zh
}

export function AdminLocaleSwitcher(props: {
  variant: 'dropdown' | 'inline'
  className?: string
}) {
  const { variant, className } = props
  const router = useRouter()
  const { locale, messages } = useI18n()
  const labels = messages.admin.topbar

  const apply = (next: Locale) => {
    if (next === locale) return
    setLocaleCookieClient(next)
    router.refresh()
  }

  if (variant === 'inline') {
    return (
      <div className={cn('grid gap-2', className)} role="radiogroup" aria-label={labels.switchLanguage}>
        {LOCALES.map((code) => (
          <Button
            key={code}
            type="button"
            variant={locale === code ? 'secondary' : 'outline'}
            className="h-11 justify-between rounded-xl border-outline/20 font-medium"
            onClick={() => apply(code)}
          >
            <span>{localeLabel(code, { en: labels.localeEn, ru: labels.localeRu, zh: labels.localeZh })}</span>
            {locale === code ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-10 w-10 shrink-0 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface', className)}
          aria-label={labels.switchLanguage}
        >
          <Globe className="h-[1.125rem] w-[1.125rem]" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        {LOCALES.map((code) => (
          <DropdownMenuItem key={code} className="gap-2" onClick={() => apply(code)}>
            <span className="flex-1">
              {localeLabel(code, { en: labels.localeEn, ru: labels.localeRu, zh: labels.localeZh })}
            </span>
            {locale === code ? <Check className="h-4 w-4 text-primary" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
