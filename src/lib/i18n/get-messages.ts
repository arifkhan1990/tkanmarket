import type { Locale } from '@/types/i18n.types'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import { enMessages, type EnMessages } from '@/messages/en'
import { ruMessages } from '@/messages/ru'
import { zhMessages } from '@/messages/zh'

type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? readonly Widen<U>[]
        : T extends object
          ? { [K in keyof T]: Widen<T[K]> }
          : T

export type Messages = Widen<EnMessages>

export function getMessages(locale: Locale): Messages {
  switch (locale) {
    case 'en':
      return enMessages
    case 'ru':
      return ruMessages
    case 'zh':
      return zhMessages
    default: {
      const _exhaustive: never = locale
      return getMessages(DEFAULT_LOCALE)
    }
  }
}

