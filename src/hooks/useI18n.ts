import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

import { DEFAULT_LOCALE, type Locale } from '@/types/i18n.types'
import { getLocaleFromPathname } from '@/lib/i18n/locale-path'
import { getMessages, type Messages } from '@/lib/i18n/get-messages'
import { useLocalePreference } from '@/lib/i18n/locale-preference-context'

// Keep key typing lightweight to avoid TS "excessively deep" instantiation errors in builds.
export type MessageKey = string

function getByDotPath(obj: Messages, key: MessageKey): string {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (!current || typeof current !== 'object') return key
    const record = current as Record<string, unknown>
    current = record[part]
  }
  return typeof current === 'string' ? current : key
}

export function useI18n() {
  const pathname = usePathname()
  const pathLocale = getLocaleFromPathname(pathname)
  /** Set in root layout from `x-locale` (see `src/proxy.ts`). Required when pathname is rewritten and has no `/en` prefix. */
  const serverLocale = useLocalePreference()
  const locale: Locale = pathLocale ?? serverLocale ?? DEFAULT_LOCALE

  const messages = useMemo(() => getMessages(locale), [locale])

  const t = useMemo(() => {
    return (key: MessageKey) => getByDotPath(messages, key)
  }, [messages])

  return { locale, messages, t }
}

