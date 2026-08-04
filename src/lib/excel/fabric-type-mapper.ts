export const FABRIC_TYPE_MAP: Record<string, string> = {
  'бархат': 'woven',
  'бархат стрейч': 'knit',
  'ткань': 'woven',
  'трикотаж': 'knit',
  'кожа': 'woven',
  'жаккард': 'woven',
  'пальтовая': 'woven',
  'костюмная': 'woven',
  'плательная': 'woven',
  'рубашечная': 'woven',
  'блузочная': 'woven',
  'подкладочная': 'lining',
  'сорочечная': 'woven',
  'курточная': 'woven',
  'спортивная': 'knit',
  'кружево': 'lace',
  'нетканный': 'nonwoven',
  'техническая': 'technical',
}

export function mapFabricType(rawType: string | null | undefined): string | null {
  if (!rawType) return null
  const normalized = rawType.trim().toLowerCase()

  if (FABRIC_TYPE_MAP[normalized]) return FABRIC_TYPE_MAP[normalized] as string

  for (const [key, value] of Object.entries(FABRIC_TYPE_MAP)) {
    if (normalized.includes(key)) return value
  }

  return 'other'
}
