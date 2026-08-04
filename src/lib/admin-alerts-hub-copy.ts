import type { Messages } from '@/lib/i18n/get-messages'
import type { HubCopy } from '@/types/admin-alerts-hub-ui.types'
import type { Locale } from '@/types/i18n.types'

/**
 * Read alerts hub copy with a defensive fallback so SSR / partial bundles never blow up
 * if a translator hasn't synced the latest keys yet.
 */
export function resolveAlertsHubCopy(messages: Messages, locale: Locale): HubCopy {
  const hub = messages.admin.alertsHubPage as Partial<HubCopy> | undefined
  const nc = messages.admin.notificationCenterPage
  const fallbackOpen: Record<Locale, string> = {
    en: 'Open full page',
    ru: 'Открыть полностью',
    zh: '打开完整页面'
  }
  const fallbackRefresh: Record<Locale, string> = { en: 'Refresh', ru: 'Обновить', zh: '刷新' }
  const fallbackRetry: Record<Locale, string> = { en: 'Try again', ru: 'Повторить', zh: '重试' }

  return {
    title: hub?.title ?? nc.title,
    subtitle: hub?.subtitle ?? nc.subtitle,
    openFullPage: hub?.openFullPage ?? fallbackOpen[locale],
    refresh: hub?.refresh ?? fallbackRefresh[locale],
    lastSync: hub?.lastSync ?? 'Last synced {time}',
    tabOverview: hub?.tabOverview ?? 'Overview',
    tabInbox: hub?.tabInbox ?? 'Inbox',
    tabPreferences: hub?.tabPreferences ?? 'Preferences',
    tabSystemAlerts: hub?.tabSystemAlerts ?? 'System alerts',
    tabPolicy: hub?.tabPolicy ?? 'Alert policy',
    kpiUnreadLabel: hub?.kpiUnreadLabel ?? 'Unread notifications',
    kpiUnreadHint: hub?.kpiUnreadHint ?? 'Items waiting in your inbox.',
    kpiHighPriorityLabel: hub?.kpiHighPriorityLabel ?? 'High priority',
    kpiHighPriorityHint: hub?.kpiHighPriorityHint ?? 'Unread items flagged as urgent.',
    kpiMonitorsLabel: hub?.kpiMonitorsLabel ?? 'Active monitors',
    kpiMonitorsHint: hub?.kpiMonitorsHint ?? 'Database-backed monitors currently enabled.',
    kpiChannelsLabel: hub?.kpiChannelsLabel ?? 'Active channels',
    kpiChannelsHint: hub?.kpiChannelsHint ?? 'Delivery channels currently enabled.',
    ofTotal: hub?.ofTotal ?? 'of {total}',
    last7DaysSuffix: hub?.last7DaysSuffix ?? '{n} in last 7 days',
    recentUnreadTitle: hub?.recentUnreadTitle ?? 'Recent unread notifications',
    recentUnreadEmpty: hub?.recentUnreadEmpty ?? 'You are all caught up.',
    recentTriggeredTitle: hub?.recentTriggeredTitle ?? 'Recent monitor triggers',
    recentTriggeredEmpty: hub?.recentTriggeredEmpty ?? 'No monitor triggers recorded yet.',
    viewInbox: hub?.viewInbox ?? 'Open inbox',
    viewMonitors: hub?.viewMonitors ?? 'Open system alerts',
    highPriorityBadge: hub?.highPriorityBadge ?? 'High',
    operationalBadge: hub?.operationalBadge ?? 'OK',
    warningBadge: hub?.warningBadge ?? 'WARN',
    failedBadge: hub?.failedBadge ?? 'FAIL',
    avgLoadMs: hub?.avgLoadMs ?? 'avg {n} ms',
    overviewLoadFailed: hub?.overviewLoadFailed ?? 'Failed to load alerts overview',
    settingsTriggers: hub?.settingsTriggers ?? '{n} JSON triggers enabled',
    retry: hub?.retry ?? fallbackRetry[locale],
    kpiSectionLabel: hub?.kpiSectionLabel ?? 'Snapshot',
    activitySectionLabel: hub?.activitySectionLabel ?? 'Latest activity'
  }
}
