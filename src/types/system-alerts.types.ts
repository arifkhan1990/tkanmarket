export type SystemAlertsTriggers = {
  crawlerErrorRate: {
    enabled: boolean
    /** Max crawler HTTP error signals per 5-minute window before alert. */
    thresholdPer5m: number
  }
  largeBulkOrder: {
    enabled: boolean
    /** Minimum order value (USD) to treat as “large” for alerts. */
    minAmountUsd: number
  }
  failedPayout: {
    enabled: boolean
  }
  databaseLatency: {
    enabled: boolean
    /** Alert when estimated p99 latency exceeds this many ms. */
    maxP99Ms: number
  }
}

export type SystemAlertsDelivery = {
  slackWebhook: {
    enabled: boolean
    channelLabel: string | null
  }
  adminDigestEmail: {
    enabled: boolean
  }
  smsCritical: {
    enabled: boolean
  }
  customWebhook: {
    enabled: boolean
    endpointUrl: string | null
  }
}

export type SystemAlertsConfig = {
  triggers: SystemAlertsTriggers
  delivery: SystemAlertsDelivery
}

export type SystemAlertMonitorStatus = 'operational' | 'warning' | 'failed'

export type SystemAlertActivityRow = {
  monitorId: string
  title: string
  subtitle: string
  metricLabel: string
  status: SystemAlertMonitorStatus
  lastTriggered: string | null
}

export type SystemAlertsPayload = {
  config: SystemAlertsConfig
  activeMonitorCount: number
  activity: SystemAlertActivityRow[]
}
