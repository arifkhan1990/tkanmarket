'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { Locale } from '@/types/i18n.types'

const LocalePreferenceContext = createContext<Locale | null>(null)

export function LocalePreferenceProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocalePreferenceContext.Provider value={locale}>{children}</LocalePreferenceContext.Provider>
}

/** Server-resolved locale (`x-locale` / cookies), e.g. when the edge proxy rewrites `/en/...` to `/...`. */
export function useLocalePreference(): Locale | null {
  return useContext(LocalePreferenceContext)
}
