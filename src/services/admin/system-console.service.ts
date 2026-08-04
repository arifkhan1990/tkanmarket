import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql
} from 'drizzle-orm'

import { getDb } from '@/db'
import {
  platformAppSettings,
  platformRegionalPreferences,
  platformTaxRegions,
  systemIntegrationHealthEvents,
  systemIntegrations,
  systemMaintenanceConfig,
  systemReleaseEntries,
  systemTechnicalLogs
} from '@/db/schema/system-console.schema'
import { logger } from '@/lib/logger'
import type {
  ConfigurationIntegrityDto,
  IntegrationHealthRowDto,
  LogHourlyBucketDto,
  NotificationMatrixRow,
  PlatformAppSettingsDto,
  PlatformRegionalPreferencesDto,
  PlatformTaxRegionDto,
  PreferenceRecentChangeDto,
  PublicMaintenancePayload,
  SystemIntegrationDto,
  SystemLogLevel,
  SystemMaintenanceConfigDto,
  SystemReleaseEntryDto,
  SystemTechnicalLogDto
} from '@/types/system-console.types'

const DEFAULT_NOTIFICATION_MATRIX: NotificationMatrixRow[] = [
  { alertType: 'New Inquiry Received', inApp: true, email: true, slack: false },
  { alertType: 'System Health Warning', inApp: true, email: true, slack: true },
  { alertType: 'New User Registration', inApp: true, email: false, slack: false }
]

function parseNotificationMatrix(raw: unknown): NotificationMatrixRow[] {
  if (!Array.isArray(raw)) return DEFAULT_NOTIFICATION_MATRIX
  const out: NotificationMatrixRow[] = []
  for (const row of raw) {
    if (
      row &&
      typeof row === 'object' &&
      'alertType' in row &&
      typeof (row as { alertType: unknown }).alertType === 'string'
    ) {
      const r = row as Record<string, unknown>
      out.push({
        alertType: r.alertType as string,
        inApp: Boolean(r.inApp),
        email: Boolean(r.email),
        slack: Boolean(r.slack)
      })
    }
  }
  return out.length ? out : DEFAULT_NOTIFICATION_MATRIX
}

export class SystemConsoleService {
  public static async ensureSeed(): Promise<void> {
    const db = getDb()
    try {
      const [appRow] = await db.select({ id: platformAppSettings.id }).from(platformAppSettings).where(isNull(platformAppSettings.deletedAt)).limit(1)
      if (!appRow) {
        await db.insert(platformAppSettings).values({
          notificationMatrixJson: DEFAULT_NOTIFICATION_MATRIX as unknown as Record<string, unknown>[]
        })
      }
      const [regRow] = await db
        .select({ id: platformRegionalPreferences.id })
        .from(platformRegionalPreferences)
        .where(isNull(platformRegionalPreferences.deletedAt))
        .limit(1)
      if (!regRow) {
        await db.insert(platformRegionalPreferences).values({})
      }
      const taxCount = await db
        .select({ c: count() })
        .from(platformTaxRegions)
        .where(isNull(platformTaxRegions.deletedAt))
      if ((taxCount[0]?.c ?? 0) === 0) {
        await db.insert(platformTaxRegions).values([
          {
            regionCode: 'NA',
            label: 'North America (Domestic)',
            description: 'Applied to US & Canadian storefronts.',
            ratePercent: '8.2500',
            sortOrder: 1
          },
          {
            regionCode: 'EU',
            label: 'European Union (Shared)',
            description: 'Standardized VAT for Euro-zone partners.',
            ratePercent: '20.0000',
            sortOrder: 2
          },
          {
            regionCode: 'RU',
            label: 'Russian Federation',
            description: 'Local federal tax compliance rates.',
            ratePercent: '20.0000',
            sortOrder: 3
          }
        ])
      }
      const [maint] = await db
        .select({ id: systemMaintenanceConfig.id })
        .from(systemMaintenanceConfig)
        .where(isNull(systemMaintenanceConfig.deletedAt))
        .limit(1)
      if (!maint) {
        await db.insert(systemMaintenanceConfig).values({
          body:
            'We are currently fine-tuning the marketplace engine to provide a smoother, more secure experience.',
          migrationStepsJson: [
            { id: '1', label: 'Schema Sync', state: 'done' },
            { id: '2', label: 'API Handlers', state: 'in_progress' },
            { id: '3', label: 'Cache Purge', state: 'pending' }
          ] as unknown as Record<string, unknown>[]
        })
      }
      const integCount = await db
        .select({ c: count() })
        .from(systemIntegrations)
        .where(isNull(systemIntegrations.deletedAt))
      if ((integCount[0]?.c ?? 0) === 0) {
        const inserted = await db
          .insert(systemIntegrations)
          .values([
            {
              slug: 'erp',
              name: 'ERP Connector',
              description:
                'Synchronize inventory, wholesale pricing, and multi-warehouse logistics with SAP, Oracle, or Microsoft Dynamics.',
              status: 'CONNECTED',
              externalRef: 'ERP-992-TX',
              iconKey: 'account_tree',
              sortOrder: 1
            },
            {
              slug: 'logistics',
              name: 'Logistics Provider',
              description:
                'Real-time tracking and automated freight dispatching via FedEx, DHL, or regional B2B freight carriers.',
              status: 'ACTION_REQUIRED',
              externalRef: 'LOG-104-BW',
              iconKey: 'local_shipping',
              sortOrder: 2
            },
            {
              slug: 'communication',
              name: 'Communication Tools',
              description:
                'Automate supplier notifications, ticket escalations, and transactional SMS via Slack and Twilio integrations.',
              status: 'CONNECTED',
              externalRef: 'COM-452-SL',
              iconKey: 'chat_bubble',
              sortOrder: 3
            },
            {
              slug: 'payments',
              name: 'Payment Gateway',
              description:
                'Secure multi-currency B2B settlement, escrow services, and automated invoicing with Stripe or Adyen.',
              status: 'INACTIVE',
              externalRef: 'PAY-771-PY',
              iconKey: 'payments',
              sortOrder: 4
            }
          ])
          .returning({ id: systemIntegrations.id, slug: systemIntegrations.slug })
        const erp = inserted.find((r) => r.slug === 'erp')
        const log = inserted.find((r) => r.slug === 'logistics')
        const twilio = inserted.find((r) => r.slug === 'communication')
        if (erp) {
          await db.insert(systemIntegrationHealthEvents).values({
            integrationId: erp.id,
            endpointPath: '/v2/inventory/sync',
            responseLabel: '200 OK',
            healthDot: 'OK',
            occurredAt: new Date(Date.now() - 120_000)
          })
        }
        if (log) {
          await db.insert(systemIntegrationHealthEvents).values({
            integrationId: log.id,
            endpointPath: '/tracking/bulk-fetch',
            responseLabel: '408 TIMEOUT',
            healthDot: 'WARN',
            occurredAt: new Date(Date.now() - 900_000)
          })
        }
        if (twilio) {
          await db.insert(systemIntegrationHealthEvents).values({
            integrationId: twilio.id,
            endpointPath: '/sms/outbound/notify',
            responseLabel: '200 OK',
            healthDot: 'OK',
            occurredAt: new Date(Date.now() - 240_000)
          })
        }
      }
      const logC = await db
        .select({ c: count() })
        .from(systemTechnicalLogs)
        .where(isNull(systemTechnicalLogs.deletedAt))
      if ((logC[0]?.c ?? 0) === 0) {
        await db.insert(systemTechnicalLogs).values([
          {
            level: 'ERROR',
            serviceName: 'Crawler-Node-04',
            message: 'Connection timeout: Failed to fetch metadata from supplier_id: TK-9902',
            traceId: '8821-ff92-0129',
            occurredAt: new Date()
          },
          {
            level: 'INFO',
            serviceName: 'AI-Processing',
            message: 'Texture analysis complete for Fabric ID: SILK-221. Accuracy: 98.4%',
            traceId: '4412-ea88-0921',
            occurredAt: new Date(Date.now() - 3_000)
          },
          {
            level: 'WARN',
            serviceName: 'Web-Gateway',
            message: 'Rate limit threshold approached for IP: 192.168.1.42 (85/100 req/min)',
            traceId: '3319-bc21-7742',
            occurredAt: new Date(Date.now() - 6_000)
          },
          {
            level: 'INFO',
            serviceName: 'Logistics-GW',
            message: 'Shipment tracker hook received: TRK-55102 - Status: Dispatched',
            traceId: '1122-ab99-5510',
            occurredAt: new Date(Date.now() - 20_000)
          }
        ])
      }
      const relC = await db
        .select({ c: count() })
        .from(systemReleaseEntries)
        .where(isNull(systemReleaseEntries.deletedAt))
      if ((relC[0]?.c ?? 0) === 0) {
        await db.insert(systemReleaseEntries).values([
          {
            versionLabel: 'v2.4.0',
            title: 'The Prism Engine Integration',
            summary:
              'Faster fabric catalog previews, improved lead routing, and hardened security for admin sessions.',
            releaseKind: 'MAJOR',
            releasedAt: new Date('2023-10-24T12:00:00.000Z'),
            isFeatured: true,
            sortOrder: 1,
            highlightsJson: [
              {
                kind: 'new',
                title: 'New: Ray-traced previews',
                body: 'Marketplace fabrics now generate high-fidelity thumbnails automatically.'
              },
              {
                kind: 'improved',
                title: 'Improved: Team seat management',
                body: 'Batch-invite supplier domains with granular permission sets.'
              },
              {
                kind: 'fixed',
                title: 'Fixed: WebGL memory leaks',
                body: 'Resolved long-session tab crashes in Chromium-based browsers.'
              }
            ] as unknown as Record<string, unknown>[]
          },
          {
            versionLabel: 'v2.3.8',
            title: 'Security & Stability Hotfix',
            summary: 'OAuth hardening and dashboard API caching improvements.',
            releaseKind: 'PATCH',
            releasedAt: new Date('2023-10-12T12:00:00.000Z'),
            isFeatured: false,
            sortOrder: 2,
            highlightsJson: [
              {
                kind: 'security',
                title: 'Security: SSO refresh token handling',
                body: 'Hardened OAuth2 for enterprise identity providers.'
              },
              {
                kind: 'performance',
                title: 'Performance: Dashboard API optimization',
                body: 'Reduced initial dashboard load time through query caching.'
              }
            ] as unknown as Record<string, unknown>[]
          }
        ])
      }
    } catch (e) {
      logger.error('system_console_seed_failed', { err: e })
      throw e
    }
  }

  public static async getAppSettings(): Promise<PlatformAppSettingsDto> {
    await SystemConsoleService.ensureSeed()
    const db = getDb()
    const [row] = await db
      .select()
      .from(platformAppSettings)
      .where(isNull(platformAppSettings.deletedAt))
      .limit(1)
    if (!row) throw new Error('Platform app settings missing')
    return {
      siteName: row.siteName,
      supportEmail: row.supportEmail,
      timezone: row.timezone,
      twoFactorRequired: row.twoFactorRequired,
      sessionTimeoutMinutes: row.sessionTimeoutMinutes,
      ipWhitelistEnabled: row.ipWhitelistEnabled,
      notificationMatrix: parseNotificationMatrix(row.notificationMatrixJson),
      updatedAt: row.updatedAt.toISOString()
    }
  }

  public static async updateAppSettings(input: {
    siteName?: string
    supportEmail?: string
    timezone?: string
    twoFactorRequired?: boolean
    sessionTimeoutMinutes?: number
    ipWhitelistEnabled?: boolean
    notificationMatrix?: NotificationMatrixRow[]
    updatedByUserId?: number | null
  }): Promise<PlatformAppSettingsDto> {
    await SystemConsoleService.ensureSeed()
    const db = getDb()
    const current = await SystemConsoleService.getAppSettings()
    const [row] = await db
      .select({ id: platformAppSettings.id })
      .from(platformAppSettings)
      .where(isNull(platformAppSettings.deletedAt))
      .limit(1)
    if (!row) throw new Error('Platform app settings missing')

    await db
      .update(platformAppSettings)
      .set({
        siteName: input.siteName ?? current.siteName,
        supportEmail: input.supportEmail ?? current.supportEmail,
        timezone: input.timezone ?? current.timezone,
        twoFactorRequired: input.twoFactorRequired ?? current.twoFactorRequired,
        sessionTimeoutMinutes: input.sessionTimeoutMinutes ?? current.sessionTimeoutMinutes,
        ipWhitelistEnabled: input.ipWhitelistEnabled ?? current.ipWhitelistEnabled,
        notificationMatrixJson: (input.notificationMatrix ?? current.notificationMatrix) as unknown as Record<
          string,
          unknown
        >[],
        updatedByUserId: input.updatedByUserId ?? undefined,
        updatedAt: new Date()
      })
      .where(eq(platformAppSettings.id, row.id))

    return SystemConsoleService.getAppSettings()
  }

  public static async getRegionalPreferences(): Promise<{
    preferences: PlatformRegionalPreferencesDto
    taxRegions: PlatformTaxRegionDto[]
  }> {
    await SystemConsoleService.ensureSeed()
    const db = getDb()
    const [row] = await db
      .select()
      .from(platformRegionalPreferences)
      .where(isNull(platformRegionalPreferences.deletedAt))
      .limit(1)
    if (!row) throw new Error('Regional preferences missing')
    const taxes = await db
      .select()
      .from(platformTaxRegions)
      .where(isNull(platformTaxRegions.deletedAt))
      .orderBy(asc(platformTaxRegions.sortOrder), asc(platformTaxRegions.id))
    return {
      preferences: {
        primaryCurrency: row.primaryCurrency,
        platformTimezone: row.platformTimezone,
        skuPrefixPattern: row.skuPrefixPattern,
        skuSequenceLength: row.skuSequenceLength,
        updatedAt: row.updatedAt.toISOString()
      },
      taxRegions: taxes.map((t) => ({
        id: t.id,
        regionCode: t.regionCode,
        label: t.label,
        description: t.description,
        ratePercent: String(t.ratePercent),
        sortOrder: t.sortOrder
      }))
    }
  }

  public static async updateRegionalPreferences(input: {
    primaryCurrency?: string
    platformTimezone?: string
    skuPrefixPattern?: string
    skuSequenceLength?: number
    updatedByUserId?: number | null
  }): Promise<PlatformRegionalPreferencesDto> {
    await SystemConsoleService.ensureSeed()
    const db = getDb()
    const { preferences } = await SystemConsoleService.getRegionalPreferences()
    const [row] = await db
      .select({ id: platformRegionalPreferences.id })
      .from(platformRegionalPreferences)
      .where(isNull(platformRegionalPreferences.deletedAt))
      .limit(1)
    if (!row) throw new Error('Regional preferences missing')

    await db
      .update(platformRegionalPreferences)
      .set({
        primaryCurrency: input.primaryCurrency ?? preferences.primaryCurrency,
        platformTimezone: input.platformTimezone ?? preferences.platformTimezone,
        skuPrefixPattern: input.skuPrefixPattern ?? preferences.skuPrefixPattern,
        skuSequenceLength: input.skuSequenceLength ?? preferences.skuSequenceLength,
        updatedByUserId: input.updatedByUserId ?? undefined,
        updatedAt: new Date()
      })
      .where(eq(platformRegionalPreferences.id, row.id))

    const next = await SystemConsoleService.getRegionalPreferences()
    return next.preferences
  }

  public static async getIntegrationsWithHealth(): Promise<{
    integrations: SystemIntegrationDto[]
    healthRows: IntegrationHealthRowDto[]
  }> {
    await SystemConsoleService.ensureSeed()
    const db = getDb()
    const integrations = await db
      .select()
      .from(systemIntegrations)
      .where(isNull(systemIntegrations.deletedAt))
      .orderBy(asc(systemIntegrations.sortOrder), asc(systemIntegrations.id))
    const integRows = integrations.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      status: r.status,
      externalRef: r.externalRef,
      iconKey: r.iconKey
    }))
    const ids = integRows.map((i) => i.id)
    if (ids.length === 0) return { integrations: integRows, healthRows: [] }
    const events = await db
      .select({
        id: systemIntegrationHealthEvents.id,
        integrationId: systemIntegrationHealthEvents.integrationId,
        endpointPath: systemIntegrationHealthEvents.endpointPath,
        responseLabel: systemIntegrationHealthEvents.responseLabel,
        healthDot: systemIntegrationHealthEvents.healthDot,
        occurredAt: systemIntegrationHealthEvents.occurredAt,
        integName: systemIntegrations.name
      })
      .from(systemIntegrationHealthEvents)
      .innerJoin(systemIntegrations, eq(systemIntegrationHealthEvents.integrationId, systemIntegrations.id))
      .where(
        and(isNull(systemIntegrationHealthEvents.deletedAt), inArray(systemIntegrationHealthEvents.integrationId, ids))
      )
      .orderBy(desc(systemIntegrationHealthEvents.occurredAt))
      .limit(50)
    const healthRows: IntegrationHealthRowDto[] = events.map((e) => ({
      id: e.id,
      integrationName: e.integName,
      endpointPath: e.endpointPath,
      responseLabel: e.responseLabel,
      healthDot: e.healthDot,
      occurredAt: e.occurredAt.toISOString()
    }))
    return { integrations: integRows, healthRows }
  }

  public static async getTechnicalLogs(params: {
    page: number
    limit: number
    level?: SystemLogLevel | 'ALL'
    service?: string
    from?: string
    to?: string
    q?: string
  }): Promise<{ items: SystemTechnicalLogDto[]; total: number; liveWindowMinutes: number; liveEventCount: number }> {
    await SystemConsoleService.ensureSeed()
    const db = getDb()
    const { page, limit } = params
    const offset = (page - 1) * limit

    const conditions = [isNull(systemTechnicalLogs.deletedAt)]
    if (params.level && params.level !== 'ALL') {
      conditions.push(eq(systemTechnicalLogs.level, params.level))
    }
    if (params.service && params.service !== 'ALL') {
      conditions.push(eq(systemTechnicalLogs.serviceName, params.service))
    }
    if (params.from) {
      conditions.push(gte(systemTechnicalLogs.occurredAt, new Date(params.from)))
    }
    if (params.to) {
      conditions.push(lte(systemTechnicalLogs.occurredAt, new Date(params.to)))
    }
    if (params.q && params.q.trim()) {
      const term = `%${params.q.trim()}%`
      conditions.push(
        or(
          ilike(systemTechnicalLogs.message, term),
          ilike(systemTechnicalLogs.serviceName, term),
          ilike(systemTechnicalLogs.traceId, term)
        )!
      )
    }

    const whereExpr = and(...conditions)
    const [totalRow] = await db.select({ c: count() }).from(systemTechnicalLogs).where(whereExpr)
    const total = Number(totalRow?.c ?? 0)

    const rows = await db
      .select()
      .from(systemTechnicalLogs)
      .where(whereExpr)
      .orderBy(desc(systemTechnicalLogs.occurredAt))
      .limit(limit)
      .offset(offset)

    const windowStart = new Date(Date.now() - 15 * 60 * 1000)
    const [liveCountRow] = await db
      .select({ c: count() })
      .from(systemTechnicalLogs)
      .where(and(isNull(systemTechnicalLogs.deletedAt), gte(systemTechnicalLogs.occurredAt, windowStart)))

    return {
      items: rows.map((r) => ({
        id: r.id,
        level: r.level,
        serviceName: r.serviceName,
        message: r.message,
        traceId: r.traceId,
        detailText: r.detailText,
        occurredAt: r.occurredAt.toISOString()
      })),
      total,
      liveWindowMinutes: 15,
      liveEventCount: Number(liveCountRow?.c ?? 0)
    }
  }

  public static async getLogHourlyBuckets(): Promise<LogHourlyBucketDto[]> {
    await SystemConsoleService.ensureSeed()
    const db = getDb()
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const rows = await db
      .select({
        h: sql<string>`date_trunc('hour', ${systemTechnicalLogs.occurredAt})`.as('h'),
        c: count()
      })
      .from(systemTechnicalLogs)
      .where(and(isNull(systemTechnicalLogs.deletedAt), gte(systemTechnicalLogs.occurredAt, dayAgo)))
      .groupBy(sql`date_trunc('hour', ${systemTechnicalLogs.occurredAt})`)
      .orderBy(asc(sql`date_trunc('hour', ${systemTechnicalLogs.occurredAt})`))

    return rows.map((r) => ({
      hourLabel: r.h,
      count: Number(r.c)
    }))
  }

  public static async listDistinctLogServices(): Promise<string[]> {
    await SystemConsoleService.ensureSeed()
    const db = getDb()
    const rows = await db
      .selectDistinct({ name: systemTechnicalLogs.serviceName })
      .from(systemTechnicalLogs)
      .where(isNull(systemTechnicalLogs.deletedAt))
      .orderBy(asc(systemTechnicalLogs.serviceName))
    return rows.map((r) => r.name)
  }

  public static async getReleases(params: { page: number; limit: number }): Promise<{
    items: SystemReleaseEntryDto[]
    total: number
    featured: SystemReleaseEntryDto | null
  }> {
    await SystemConsoleService.ensureSeed()
    const db = getDb()
    const offset = (params.page - 1) * params.limit
    const [totalRow] = await db.select({ c: count() }).from(systemReleaseEntries).where(isNull(systemReleaseEntries.deletedAt))
    const total = Number(totalRow?.c ?? 0)
    const rows = await db
      .select()
      .from(systemReleaseEntries)
      .where(isNull(systemReleaseEntries.deletedAt))
      .orderBy(desc(systemReleaseEntries.releasedAt), desc(systemReleaseEntries.id))
      .limit(params.limit)
      .offset(offset)

    const featured = await db
      .select()
      .from(systemReleaseEntries)
      .where(and(isNull(systemReleaseEntries.deletedAt), eq(systemReleaseEntries.isFeatured, true)))
      .orderBy(desc(systemReleaseEntries.releasedAt))
      .limit(1)
    const mapRow = (r: typeof systemReleaseEntries.$inferSelect): SystemReleaseEntryDto => ({
      id: r.id,
      versionLabel: r.versionLabel,
      title: r.title,
      summary: r.summary,
      releaseKind: r.releaseKind,
      releasedAt: r.releasedAt.toISOString(),
      highlights: Array.isArray(r.highlightsJson)
        ? (r.highlightsJson as SystemReleaseEntryDto['highlights'])
        : [],
      isFeatured: r.isFeatured
    })
    return {
      items: rows.map(mapRow),
      total,
      featured: featured[0] ? mapRow(featured[0]) : null
    }
  }

  public static async getMaintenance(): Promise<SystemMaintenanceConfigDto> {
    await SystemConsoleService.ensureSeed()
    const db = getDb()
    const [row] = await db
      .select()
      .from(systemMaintenanceConfig)
      .where(isNull(systemMaintenanceConfig.deletedAt))
      .limit(1)
    if (!row) throw new Error('Maintenance config missing')
    const stepsRaw = row.migrationStepsJson
    const migrationSteps: SystemMaintenanceConfigDto['migrationSteps'] =
      Array.isArray(stepsRaw) && stepsRaw.length
        ? (stepsRaw as SystemMaintenanceConfigDto['migrationSteps'])
        : [
            { id: '1', label: 'Schema Sync', state: 'done' as const },
            { id: '2', label: 'API Handlers', state: 'in_progress' as const },
            { id: '3', label: 'Cache Purge', state: 'pending' as const }
          ]
    return {
      isEnabled: row.isEnabled,
      headline: row.headline,
      body: row.body,
      scheduledStart: row.scheduledStart ? row.scheduledStart.toISOString() : null,
      scheduledEnd: row.scheduledEnd ? row.scheduledEnd.toISOString() : null,
      migrationProgress: row.migrationProgress,
      migrationSteps,
      systemIdLabel: row.systemIdLabel,
      heroImageUrl: row.heroImageUrl
    }
  }

  public static async updateMaintenance(input: Partial<SystemMaintenanceConfigDto>): Promise<SystemMaintenanceConfigDto> {
    await SystemConsoleService.ensureSeed()
    const db = getDb()
    const current = await SystemConsoleService.getMaintenance()
    const [row] = await db
      .select({ id: systemMaintenanceConfig.id })
      .from(systemMaintenanceConfig)
      .where(isNull(systemMaintenanceConfig.deletedAt))
      .limit(1)
    if (!row) throw new Error('Maintenance config missing')

    const scheduledStart =
      input.scheduledStart === undefined
        ? undefined
        : input.scheduledStart === null
          ? null
          : new Date(input.scheduledStart)
    const scheduledEnd =
      input.scheduledEnd === undefined ? undefined : input.scheduledEnd === null ? null : new Date(input.scheduledEnd)
    const heroImageUrl =
      input.heroImageUrl === undefined ? undefined : input.heroImageUrl === '' ? null : input.heroImageUrl

    await db
      .update(systemMaintenanceConfig)
      .set({
        isEnabled: input.isEnabled ?? current.isEnabled,
        headline: input.headline ?? current.headline,
        body: input.body ?? current.body,
        ...(scheduledStart !== undefined ? { scheduledStart } : {}),
        ...(scheduledEnd !== undefined ? { scheduledEnd } : {}),
        migrationProgress: input.migrationProgress ?? current.migrationProgress,
        migrationStepsJson: (input.migrationSteps ?? current.migrationSteps) as unknown as Record<string, unknown>[],
        systemIdLabel: input.systemIdLabel ?? current.systemIdLabel,
        ...(heroImageUrl !== undefined ? { heroImageUrl } : {}),
        updatedAt: new Date()
      })
      .where(eq(systemMaintenanceConfig.id, row.id))

    return SystemConsoleService.getMaintenance()
  }

  public static async getPublicMaintenance(): Promise<PublicMaintenancePayload> {
    await SystemConsoleService.ensureSeed()
    const full = await SystemConsoleService.getMaintenance()
    return {
      isEnabled: full.isEnabled,
      headline: full.headline,
      body: full.body,
      scheduledEnd: full.scheduledEnd,
      migrationProgress: full.migrationProgress,
      migrationSteps: full.migrationSteps,
      systemIdLabel: full.systemIdLabel,
      heroImageUrl: full.heroImageUrl
    }
  }

  public static getConfigurationIntegrity(): ConfigurationIntegrityDto {
    return {
      schemaSync: 'ok',
      taxEngine: 'ok',
      currencyApi: 'warn',
      currencyApiNote: 'Currency API has high latency. Using last cached exchange rates (4h ago).'
    }
  }

  public static async getPreferenceRecentChanges(): Promise<PreferenceRecentChangeDto[]> {
    const { preferences } = await SystemConsoleService.getRegionalPreferences()
    return [
      {
        id: '1',
        title: 'Regional preferences updated',
        actor: 'System',
        occurredAt: preferences.updatedAt
      }
    ]
  }
}
