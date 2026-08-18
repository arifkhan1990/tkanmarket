'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { Locale } from '@/types/i18n.types'
import type { Messages } from '@/lib/i18n/get-messages'

type I18nContextValue = {
  locale: Locale
  messages: Messages
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LocalePreferenceProvider({
  locale,
  messages,
  children
}: {
  locale: Locale
  messages: Messages
  children: ReactNode
}) {
  return (
    <I18nContext.Provider value={{ locale, messages }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18nContext(): I18nContextValue | null {
  return useContext(I18nContext)
}

/** Server-resolved locale (`x-locale` / cookies), e.g. when the edge proxy rewrites `/en/...` to `/...`. */
export function useLocalePreference(): Locale | null {
  const ctx = useContext(I18nContext)
  return ctx?.locale ?? null
}