import { QueueName } from '@/types/enums'

// ============================================================
// Pagination
// ============================================================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 24,
  MAX_PAGE_SIZE:     100,
  ADMIN_PAGE_SIZE:   50,
} as const

// ============================================================
// Queue names (sourced from enum)
// ============================================================
export const QUEUE_NAMES = {
  CRAWLER: QueueName.CRAWLER,
  AI:      QueueName.AI,
  IMAGE:   QueueName.IMAGE,
  SOCIAL:  QueueName.SOCIAL,
} as const

// ============================================================
// Fabric materials list (Russian names for UI)
// ============================================================
export const FABRIC_MATERIALS = [
  'Хлопок',
  'Лён',
  'Шёлк',
  'Шерсть',
  'Полиэстер',
  'Вискоза',
  'Нейлон',
  'Спандекс',
  'Акрил',
  'Бамбук',
  'Модал',
  'Лиоцелл',
  'Кашемир',
  'Альпака',
  'Другое',
] as const

// ============================================================
// CIS / Russia countries for lead forms
// ============================================================
export const CIS_COUNTRIES = [
  'Россия',
  'Казахстан',
  'Беларусь',
  'Узбекистан',
  'Украина',
  'Азербайджан',
  'Армения',
  'Грузия',
  'Киргизия',
  'Молдова',
  'Таджикистан',
  'Туркменистан',
  'Другая страна',
] as const

// ============================================================
// Social media config
// ============================================================
export const SOCIAL_CONFIG = {
  MIN_SOCIAL_SCORE:    50,   // minimum score to be queued for social
  INSTAGRAM_PER_DAY:   2,
  TIKTOK_PER_DAY:      1,
  PINTEREST_PER_DAY:   5,
  FACEBOOK_PER_DAY:    1,
} as const

// ============================================================
// AI processing config
// ============================================================
export const AI_CONFIG = {
  CONFIDENCE_MANDATORY_REVIEW: 0.6,
  CONFIDENCE_OPTIONAL_REVIEW:  0.8,
  MAX_TITLE_LENGTH_RU:         120,
  MAX_META_TITLE_LENGTH:       60,
  MAX_META_DESC_LENGTH:        155,
} as const

// ============================================================
// Rate limiting
// ============================================================
export const RATE_LIMITS = {
  LEAD_FORM_PER_HOUR:  5,
  PUBLIC_API_PER_MIN:  100,
} as const

// ============================================================
// Premium materials (boost social score)
// ============================================================
export const PREMIUM_MATERIALS = [
  'silk', 'silks', 'Шёлк',
  'cashmere', 'Кашемир',
  'linen', 'Лён',
  'alpaca', 'Альпака',
  'merino', 'Меринос',
] as const

// ============================================================
// Fabric categories (for homepage CategoryGrid)
// ============================================================
export const FABRIC_CATEGORIES = [
  { slug: 'cotton',    labelRu: 'Хлопковые ткани',    material: 'Хлопок'   },
  { slug: 'linen',     labelRu: 'Льняные ткани',       material: 'Лён'      },
  { slug: 'synthetic', labelRu: 'Синтетические ткани', material: 'Полиэстер'},
  { slug: 'silk',      labelRu: 'Шёлковые ткани',      material: 'Шёлк'     },
  { slug: 'wool',      labelRu: 'Шерстяные ткани',     material: 'Шерсть'   },
  { slug: 'knit',      labelRu: 'Трикотаж',            material: 'Трикотаж' },
] as const
