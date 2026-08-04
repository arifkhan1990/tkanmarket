export interface AdminAlertsHubRecentNotification {
  id: number
  type: string
  title: string
  body: string | null
  isHighPriority: boolean
  createdAt: string
}

export interface AdminAlertsHubRecentTrigger {
  id: number
  monitorKey: string
  label: string
  workerHint: string
  status: string
  avgLoadMs: number
  lastTriggeredAt: string
}

export interface AdminAlertsHubOverviewDto {
  notifications: {
    unreadTotal: number
    highPriorityUnread: number
    last7dCount: number
    recentUnread: AdminAlertsHubRecentNotification[]
  }
  monitors: {
    dbEnabledCount: number
    dbTotalCount: number
    channelsEnabledCount: number
    channelsTotalCount: number
    /** Number of triggers enabled in the JSON-backed system_alerts settings document. */
    settingsActiveTriggerCount: number
    recentTriggered: AdminAlertsHubRecentTrigger[]
  }
  generatedAt: string
}
