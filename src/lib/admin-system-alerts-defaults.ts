import type { SystemAlertsConfig } from '@/types/system-alerts.types'

/** Safe to import from Client Components — no DB or server-only modules. */
export const DEFAULT_SYSTEM_ALERTS: SystemAlertsConfig = {
  triggers: {
    crawlerErrorRate: { enabled: true, thresholdPer5m: 500 },
    largeBulkOrder: { enabled: true, minAmountUsd: 15000 },
    failedPayout: { enabled: true },
    databaseLatency: { enabled: false, maxP99Ms: 250 }
  },
  delivery: {
    slackWebhook: { enabled: false, channelLabel: '#ops-alerts-global' },
    adminDigestEmail: { enabled: true },
    smsCritical: { enabled: false },
    customWebhook: { enabled: false, endpointUrl: null }
  }
}
