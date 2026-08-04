export type SystemLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'

export type IntegrationStatus = 'CONNECTED' | 'ACTION_REQUIRED' | 'INACTIVE'

export type IntegrationHealthDot = 'OK' | 'WARN' | 'ERROR'

export type SystemReleaseKind = 'MAJOR' | 'PATCH' | 'FEATURE' | 'HOTFIX'

export interface NotificationMatrixRow {
  alertType: string
  inApp: boolean
  email: boolean
  slack: boolean
}

export interface PlatformAppSettingsDto {
  siteName: string
  supportEmail: string
  timezone: string
  twoFactorRequired: boolean
  sessionTimeoutMinutes: number
  ipWhitelistEnabled: boolean
  notificationMatrix: NotificationMatrixRow[]
  updatedAt: string
}

export interface PlatformRegionalPreferencesDto {
  primaryCurrency: string
  platformTimezone: string
  skuPrefixPattern: string
  skuSequenceLength: number
  updatedAt: string
}

export interface PlatformTaxRegionDto {
  id: number
  regionCode: string
  label: string
  description: string | null
  ratePercent: string
  sortOrder: number
}

export interface SystemIntegrationDto {
  id: number
  slug: string
  name: string
  description: string
  status: IntegrationStatus
  externalRef: string
  iconKey: string
}

export interface IntegrationHealthRowDto {
  id: number
  integrationName: string
  endpointPath: string
  responseLabel: string
  healthDot: IntegrationHealthDot
  occurredAt: string
}

export interface SystemTechnicalLogDto {
  id: number
  level: SystemLogLevel
  serviceName: string
  message: string
  traceId: string
  detailText: string | null
  occurredAt: string
}

export interface LogHourlyBucketDto {
  hourLabel: string
  count: number
}

export interface SystemReleaseHighlightDto {
  kind: 'new' | 'improved' | 'fixed' | 'security' | 'performance'
  title: string
  body: string
}

export interface SystemReleaseEntryDto {
  id: number
  versionLabel: string
  title: string
  summary: string
  releaseKind: SystemReleaseKind
  releasedAt: string
  highlights: SystemReleaseHighlightDto[]
  isFeatured: boolean
}

export interface SystemMaintenanceStepDto {
  id: string
  label: string
  state: 'done' | 'in_progress' | 'pending'
}

export interface SystemMaintenanceConfigDto {
  isEnabled: boolean
  headline: string
  body: string
  scheduledStart: string | null
  scheduledEnd: string | null
  migrationProgress: number
  migrationSteps: SystemMaintenanceStepDto[]
  systemIdLabel: string
  heroImageUrl: string | null
}

export interface PublicMaintenancePayload {
  isEnabled: boolean
  headline: string
  body: string
  scheduledEnd: string | null
  migrationProgress: number
  migrationSteps: SystemMaintenanceStepDto[]
  systemIdLabel: string
  heroImageUrl: string | null
}

export interface ConfigurationIntegrityDto {
  schemaSync: 'ok' | 'warn' | 'error'
  taxEngine: 'ok' | 'warn' | 'error'
  currencyApi: 'ok' | 'warn' | 'error'
  currencyApiNote: string | null
}

export interface PreferenceRecentChangeDto {
  id: string
  title: string
  actor: string
  occurredAt: string
}
