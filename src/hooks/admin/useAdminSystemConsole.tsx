'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type {
  NotificationMatrixRow,
  PlatformAppSettingsDto,
  PlatformRegionalPreferencesDto,
  PlatformTaxRegionDto,
  PublicMaintenancePayload,
  SystemMaintenanceConfigDto
} from '@/types/system-console.types'
import type { ConfigurationIntegrityDto, PreferenceRecentChangeDto } from '@/types/system-console.types'
import type { IntegrationHealthRowDto, SystemIntegrationDto } from '@/types/system-console.types'
import type { LogHourlyBucketDto, SystemTechnicalLogDto } from '@/types/system-console.types'
import type { SystemReleaseEntryDto } from '@/types/system-console.types'

import { useI18n } from '@/hooks/useI18n'

async function parseJson<T>(res: Response): Promise<ApiEnvelope<T>> {
  return (await res.json()) as ApiEnvelope<T>
}

export function useAdminSystemAppSettings() {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-system-app-settings'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/system/app-settings')
      const json = await parseJson<PlatformAppSettingsDto>(res)
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.systemConsole.loadFailed)
      }
      return json.data
    }
  })
}

export function useUpdateSystemAppSettings() {
  const { messages } = useI18n()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      siteName?: string
      supportEmail?: string
      timezone?: string
      twoFactorRequired?: boolean
      sessionTimeoutMinutes?: number
      ipWhitelistEnabled?: boolean
      notificationMatrix?: NotificationMatrixRow[]
    }) => {
      const res = await fetch('/api/v1/admin/system/app-settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input)
      })
      const json = await parseJson<PlatformAppSettingsDto>(res)
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.systemConsole.saveFailed)
      }
      return json.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-system-app-settings'] })
      toast.success(messages.admin.systemConsole.saved)
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export interface SystemPreferencesPayload {
  preferences: PlatformRegionalPreferencesDto
  taxRegions: PlatformTaxRegionDto[]
  configurationIntegrity: ConfigurationIntegrityDto
  recentChanges: PreferenceRecentChangeDto[]
  maintenanceWindow: { scheduledStart: string | null; scheduledEnd: string | null }
}

export function useAdminSystemPreferences() {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-system-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/system/preferences')
      const json = await parseJson<SystemPreferencesPayload>(res)
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.systemConsole.loadFailed)
      }
      return json.data
    }
  })
}

export function useUpdateRegionalPreferences() {
  const { messages } = useI18n()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      primaryCurrency?: string
      platformTimezone?: string
      skuPrefixPattern?: string
      skuSequenceLength?: number
    }) => {
      const res = await fetch('/api/v1/admin/system/preferences', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input)
      })
      const json = await parseJson<{ preferences: PlatformRegionalPreferencesDto; taxRegions: PlatformTaxRegionDto[] }>(
        res
      )
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.systemConsole.saveFailed)
      }
      return json.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-system-preferences'] })
      toast.success(messages.admin.systemConsole.saved)
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useAdminSystemIntegrations() {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-system-integrations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/system/integrations')
      const json = await parseJson<{ integrations: SystemIntegrationDto[]; healthRows: IntegrationHealthRowDto[] }>(res)
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.systemConsole.loadFailed)
      }
      return json.data
    }
  })
}

export interface SystemLogsPayload {
  items: SystemTechnicalLogDto[]
  liveEventCount: number
  liveWindowMinutes: number
  services: string[]
  hourlyBuckets?: LogHourlyBucketDto[]
}

export function useAdminSystemLogs(params: {
  page: number
  limit: number
  level: string
  service: string
  from?: string
  to?: string
  q?: string
  includeAnalytics: boolean
}) {
  const { messages } = useI18n()
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    level: params.level,
    service: params.service,
    includeAnalytics: params.includeAnalytics ? 'true' : 'false'
  })
  if (params.from) sp.set('from', params.from)
  if (params.to) sp.set('to', params.to)
  if (params.q) sp.set('q', params.q)

  return useQuery({
    queryKey: ['admin-system-logs', sp.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/system/logs?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<SystemLogsPayload> & { meta?: PaginationMeta }
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.systemConsole.loadFailed)
      }
      return { data: json.data, meta: json.meta }
    }
  })
}

export interface SystemReleasesPayload {
  items: SystemReleaseEntryDto[]
  featured: SystemReleaseEntryDto | null
}

export function useAdminSystemReleases(page: number, limit: number) {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-system-releases', page, limit],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/system/releases?page=${page}&limit=${limit}`)
      const json = (await res.json()) as ApiEnvelope<SystemReleasesPayload> & { meta?: PaginationMeta }
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.systemConsole.loadFailed)
      }
      return { data: json.data, meta: json.meta }
    }
  })
}

export function useAdminSystemMaintenance() {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-system-maintenance'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/system/maintenance')
      const json = await parseJson<SystemMaintenanceConfigDto>(res)
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.systemConsole.loadFailed)
      }
      return json.data
    }
  })
}

export function useUpdateSystemMaintenance() {
  const { messages } = useI18n()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<SystemMaintenanceConfigDto> & { scheduledStart?: string | null; scheduledEnd?: string | null }) => {
      const res = await fetch('/api/v1/admin/system/maintenance', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input)
      })
      const json = await parseJson<SystemMaintenanceConfigDto>(res)
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.systemConsole.saveFailed)
      }
      return json.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-system-maintenance'] })
      void qc.invalidateQueries({ queryKey: ['public-maintenance'] })
      void qc.invalidateQueries({ queryKey: ['admin-system-preferences'] })
      toast.success(messages.admin.systemConsole.saved)
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function usePublicMaintenance() {
  return useQuery({
    queryKey: ['public-maintenance'],
    queryFn: async () => {
      const res = await fetch('/api/v1/public/maintenance')
      const json = await parseJson<PublicMaintenancePayload>(res)
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : 'Maintenance status unavailable')
      }
      return json.data
    }
  })
}
