export const LOCALES = ['en', 'ru', 'zh'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

