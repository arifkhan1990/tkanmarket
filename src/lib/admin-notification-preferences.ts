/** Boolean channel toggles (existing + matrix monitors + delivery). */
export const NOTIFICATION_BOOLEAN_PREF_KEYS = [
  'catalog_fabric_review_email',
  'catalog_fabric_review_push',
  'ai_low_confidence_email',
  'ai_low_confidence_slack',
  'sales_new_lead_email',
  'sales_lead_assigned_push',
  'sales_sample_email',
  'sales_sample_slack',
  'system_crawler_slack',
  'system_low_inventory_email',
  'system_job_failed_push',
  'system_job_failed_slack',
  'monitor_crawler_error_rate',
  'monitor_large_bulk_order',
  'monitor_failed_payout',
  'monitor_db_latency',
  'delivery_channel_slack',
  'delivery_channel_email',
  'delivery_channel_sms'
] as const

export type NotificationBooleanPrefKey = (typeof NOTIFICATION_BOOLEAN_PREF_KEYS)[number]

/** Numeric thresholds (system alert matrix). */
export const NOTIFICATION_NUMBER_PREF_KEYS = [
  'threshold_crawler_errors_5m',
  'threshold_bulk_order_usd',
  'threshold_db_latency_ms'
] as const

export type NotificationNumberPrefKey = (typeof NOTIFICATION_NUMBER_PREF_KEYS)[number]

export type NotificationPreferenceValue = boolean | number

export type NotificationPreferencesDraft = Record<string, NotificationPreferenceValue>

function defaultBoolean(key: NotificationBooleanPrefKey): boolean {
  if (key === 'catalog_fabric_review_push') return false
  if (key === 'system_low_inventory_email') return false
  if (key === 'delivery_channel_sms') return false
  if (key === 'monitor_db_latency') return false
  return true
}

function defaultNumber(key: NotificationNumberPrefKey): number {
  if (key === 'threshold_crawler_errors_5m') return 500
  if (key === 'threshold_bulk_order_usd') return 15000
  return 250
}

function clampNumber(key: NotificationNumberPrefKey, n: number): number {
  if (key === 'threshold_crawler_errors_5m') return Math.min(2000, Math.max(100, Math.round(n)))
  if (key === 'threshold_bulk_order_usd') return Math.min(50000, Math.max(1000, Math.round(n)))
  return Math.min(1000, Math.max(50, Math.round(n)))
}

export function defaultNotificationPreferences(): NotificationPreferencesDraft {
  const o: NotificationPreferencesDraft = {}
  for (const k of NOTIFICATION_BOOLEAN_PREF_KEYS) {
    o[k] = defaultBoolean(k)
  }
  for (const k of NOTIFICATION_NUMBER_PREF_KEYS) {
    o[k] = defaultNumber(k)
  }
  return o
}

export function mergeNotificationPreferences(prefs: Record<string, unknown> | null): NotificationPreferencesDraft {
  const base = defaultNotificationPreferences()
  if (!prefs) return base

  for (const k of NOTIFICATION_BOOLEAN_PREF_KEYS) {
    const v = prefs[k]
    if (typeof v === 'boolean') base[k] = v
  }
  for (const k of NOTIFICATION_NUMBER_PREF_KEYS) {
    const v = prefs[k]
    if (typeof v === 'number' && Number.isFinite(v)) {
      base[k] = clampNumber(k, v)
    }
  }
  return base
}
