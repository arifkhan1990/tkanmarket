import type { AdminFabricStatus } from '@/types/admin-fabric-management.types'
import type { Locale } from '@/types/i18n.types'

export interface ConfidenceBand {
  band: 'mandatory' | 'optional' | 'auto' | 'missing'
  color: string
  label: string
}

function localeFor(loc: Locale): string {
  return loc === 'ru' ? 'ru-RU' : loc === 'zh' ? 'zh-CN' : 'en-US'
}

export function formatDateTime(iso: string | null, locale: Locale): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(localeFor(locale), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export function statusLabel(
  status: AdminFabricStatus,
  copy: {
    statusRawScraped: string
    statusAiProcessing: string
    statusAiProcessed: string
    statusApproved: string
    statusRejected: string
  }
): string {
  switch (status) {
    case 'raw_scraped':
      return copy.statusRawScraped
    case 'ai_processing':
      return copy.statusAiProcessing
    case 'ai_processed':
      return copy.statusAiProcessed
    case 'approved':
      return copy.statusApproved
    case 'rejected':
      return copy.statusRejected
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

export function statusBadgeClasses(status: AdminFabricStatus): string {
  switch (status) {
    case 'raw_scraped':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
    case 'ai_processing':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200'
    case 'ai_processed':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200'
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200'
    default:
      return 'bg-surface-container-high text-on-surface-variant'
  }
}

/** PRD §9.4: <0.6 mandatory, 0.6–0.8 optional, >0.8 auto. */
export function aiConfidenceBand(
  scoreString: string | null,
  copy: {
    aiConfidenceMissing: string
    aiConfidenceMandatory: string
    aiConfidenceOptional: string
    aiConfidenceAuto: string
  }
): ConfidenceBand {
  if (!scoreString) {
    return {
      band: 'missing',
      color: 'bg-surface-container-high text-on-surface-variant',
      label: copy.aiConfidenceMissing
    }
  }
  const n = Number(scoreString)
  if (!Number.isFinite(n)) {
    return {
      band: 'missing',
      color: 'bg-surface-container-high text-on-surface-variant',
      label: copy.aiConfidenceMissing
    }
  }
  if (n < 0.6) {
    return {
      band: 'mandatory',
      color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200',
      label: copy.aiConfidenceMandatory
    }
  }
  if (n <= 0.8) {
    return {
      band: 'optional',
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
      label: copy.aiConfidenceOptional
    }
  }
  return {
    band: 'auto',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
    label: copy.aiConfidenceAuto
  }
}

