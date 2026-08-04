import { cookies, headers } from 'next/headers'

import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/types/i18n.types'

const LOCALE_COOKIE = 'tkan_locale'

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export async function getServerLocale(): Promise<Locale> {
  const raw = (await headers()).get('x-locale')
  if (raw && isLocale(raw)) return raw

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale

  return DEFAULT_LOCALE
}

