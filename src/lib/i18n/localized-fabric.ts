import type { Locale } from '@/types/i18n.types'

export function getLocalizedFabricTitle(
  fabric: { titleRu: string; titleEn?: string | null },
  locale: Locale
): string {
  if (locale === 'ru') return fabric.titleRu
  return fabric.titleEn?.trim() || fabric.titleRu
}

export function getLocalizedFabricTags(
  fabric: { tags: string[]; tagsEn?: string[] | null },
  locale: Locale
): string[] {
  if (locale === 'ru') return fabric.tags
  if (fabric.tagsEn && fabric.tagsEn.length > 0) return fabric.tagsEn
  return fabric.tags
}
