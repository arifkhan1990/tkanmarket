import crypto from 'node:crypto'

import { and, count, eq, isNull } from 'drizzle-orm'

import { hashPassword } from '../lib/auth/password'
import { computeWholesaleTiersFromSimulator } from '../lib/wholesale-pricing/compute-tiers'
import { logger } from '../lib/logger'
import { getDb } from './index'
import { seedBlogPostsFromStitchDesign } from './seed-blog-posts'
import { syncShowcaseFabrics } from './seed-showcase-fabrics'
import { seedPromptRules } from './seed-prompt-rules'
import { seedTextPromptRules } from './seed-text-prompt-rules'
import {
  adminSettings,
  apiKeys,
  auditLog,
  crawlerRuns,
  bulkOrders,
  fabricCategoryTerms,
  fabrics,
  leadActivityLog,
  leadNotes,
  leads,
  notificationSettings,
  notifications,
  permissions,
  rawProducts,
  rolePermissions,
  roles,
  socialPosts,
  suppliers,
  teamMembers,
  teams,
  userRoles,
  users,
  wholesalePricingProfiles
} from './schema'

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return s.length > 0 ? s.slice(0, 80) : 'item'
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is required for seeding`)
  return v
}

function envOrDefault(params: { name: string; defaultValue: string }): string {
  const v = process.env[params.name]
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
  if (v) return v
  if (isProd) throw new Error(`${params.name} is required for seeding`)
  return params.defaultValue
}

async function ensureAdminUser(params: { email: string; name: string; password: string }) {
  const db = getDb()

  const existing = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, params.email))
    .limit(1)

  if (existing[0]?.id) {
    if (!existing[0].passwordHash) {
      await db
        .update(users)
        .set({ passwordHash: hashPassword(params.password), updatedAt: new Date() })
        .where(eq(users.id, existing[0].id))
    }
    return existing[0].id
  }

  const inserted = await db
    .insert(users)
    .values({
      email: params.email,
      name: params.name,
      role: 'ADMIN',
      avatarUrl: null,
      passwordHash: hashPassword(params.password),
      updatedAt: new Date(),
      deletedAt: null
    })
    .returning({ id: users.id })

  const row = inserted[0]
  if (!row) throw new Error('Failed to insert admin user')
  return row.id
}

async function ensureAdminSettings(notificationEmail: string) {
  const db = getDb()
  const rows = await db.select({ id: adminSettings.id }).from(adminSettings).limit(1)
  if (rows[0]?.id) return rows[0].id

  const inserted = await db
    .insert(adminSettings)
    .values({
      crawlerEnabled: true,
      crawlerDefaultMaxProducts: 200,
      leadRateLimitPerHour: 20,
      notificationEmail,
      leadOpsJson: {},
      updatedAt: new Date(),
      deletedAt: null
    })
    .returning({ id: adminSettings.id })

  const row = inserted[0]
  if (!row) throw new Error('Failed to insert admin settings')
  return row.id
}

async function seedFabricCategoryTerms() {
  const db = getDb()
  const existing = await db
    .select({ c: count() })
    .from(fabricCategoryTerms)
    .where(isNull(fabricCategoryTerms.deletedAt))
  if ((existing[0]?.c ?? 0) > 0) return

  const now = new Date()
  const rows = [
    { slug: 'Хлопок', nameRu: 'Хлопок', nameEn: 'Cotton', sortOrder: 10 },
    { slug: 'Лён', nameRu: 'Лён', nameEn: 'Linen', sortOrder: 20 },
    { slug: 'Полиэстер', nameRu: 'Полиэстер', nameEn: 'Polyester', sortOrder: 30 },
    { slug: 'Шёлк', nameRu: 'Шёлк', nameEn: 'Silk', sortOrder: 40 },
    { slug: 'Шерсть', nameRu: 'Шерсть', nameEn: 'Wool', sortOrder: 50 },
    { slug: 'Трикотаж', nameRu: 'Трикотаж', nameEn: 'Knitwear', sortOrder: 60 },
    { slug: 'Вискоза', nameRu: 'Вискоза', nameEn: 'Viscose', sortOrder: 70 },
    { slug: 'Нейлон', nameRu: 'Нейлон', nameEn: 'Nylon', sortOrder: 80 },
    { slug: 'Спандекс', nameRu: 'Спандекс', nameEn: 'Spandex', sortOrder: 90 },
    { slug: 'Смесовые', nameRu: 'Смесовые', nameEn: 'Blended', sortOrder: 100 }
  ] as const

  await db
    .insert(fabricCategoryTerms)
    .values(
      rows.map((r) => ({
        slug: r.slug,
        nameRu: r.nameRu,
        nameEn: r.nameEn,
        descriptionRu: null,
        descriptionEn: null,
        sortOrder: r.sortOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null
      }))
    )
    .onConflictDoNothing()
}

async function ensureRbacSeed() {
  const db = getDb()

  const roleInputs = [
    { key: 'admin', name: 'Admin', description: 'Full system access with all administrative privileges.' },
    { key: 'sales', name: 'Sales', description: 'Manage leads, quotes, and customer communications.' },
    { key: 'editor', name: 'Editor', description: 'Responsible for catalog/content updates.' },
    { key: 'viewer', name: 'Viewer', description: 'Read-only access to analytics and reports.' }
  ] as const

  const roleIds = new Map<string, number>()
  for (const r of roleInputs) {
    const existing = await db.select({ id: roles.id }).from(roles).where(eq(roles.key, r.key)).limit(1)
    const id =
      existing[0]?.id ??
      (
        await db
          .insert(roles)
          .values({
            key: r.key,
            name: r.name,
            description: r.description,
            updatedAt: new Date(),
            deletedAt: null
          })
          .returning({ id: roles.id })
      )[0]?.id
    if (!id) throw new Error(`Failed to ensure role: ${r.key}`)
    roleIds.set(r.key, id)
  }

  const permissionInputs = [
    { key: 'catalog.view', description: 'View catalog and fabric details.' },
    { key: 'catalog.edit', description: 'Create/update catalog items.' },
    { key: 'catalog.approve', description: 'Approve/reject catalog items.' },
    { key: 'suppliers.view', description: 'View suppliers and supplier details.' },
    { key: 'suppliers.edit', description: 'Create/update suppliers.' },
    { key: 'leads.view', description: 'View leads and lead details.' },
    { key: 'leads.edit', description: 'Edit leads, assign agents, update status.' },
    { key: 'system.logs.view', description: 'View system/audit/security logs.' },
    { key: 'system.roles.manage', description: 'Manage roles and permissions.' }
  ] as const

  const permissionIds = new Map<string, number>()
  for (const p of permissionInputs) {
    const existing = await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.key, p.key)).limit(1)
    const id =
      existing[0]?.id ??
      (
        await db
          .insert(permissions)
          .values({
            key: p.key,
            description: p.description,
            updatedAt: new Date(),
            deletedAt: null
          })
          .returning({ id: permissions.id })
      )[0]?.id
    if (!id) throw new Error(`Failed to ensure permission: ${p.key}`)
    permissionIds.set(p.key, id)
  }

  const adminRoleId = roleIds.get('admin')
  if (!adminRoleId) throw new Error('Admin role missing')

  for (const permissionId of permissionIds.values()) {
    await db
      .insert(rolePermissions)
      .values({
        roleId: adminRoleId,
        permissionId,
        updatedAt: new Date(),
        deletedAt: null
      })
      .onConflictDoNothing()
  }

  return { roleIds, permissionIds }
}

async function ensureAdminHasAdminRole(params: { adminUserId: number; adminRoleId: number }) {
  const db = getDb()
  await db
    .insert(userRoles)
    .values({
      userId: params.adminUserId,
      roleId: params.adminRoleId,
      updatedAt: new Date(),
      deletedAt: null
    })
    .onConflictDoNothing()
}

async function ensureNotificationSettings(userId: number) {
  const db = getDb()
  const existing = await db
    .select({ id: notificationSettings.id })
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1)
  if (existing[0]?.id) return existing[0].id

  const inserted = await db
    .insert(notificationSettings)
    .values({
      userId,
      emailEnabled: true,
      inAppEnabled: true,
      preferences: { digest: 'daily' },
      updatedAt: new Date(),
      deletedAt: null
    })
    .returning({ id: notificationSettings.id })
  const row = inserted[0]
  if (!row) throw new Error('Failed to insert notification settings')
  return row.id
}

async function seedFoundationAdminOps(params: { adminUserId: number }) {
  const db = getDb()

  await db.insert(auditLog).values({
    actorId: params.adminUserId,
    action: 'seed.foundation',
    entityType: 'seed',
    entityId: null,
    success: true,
    message: 'Seeded foundation admin ops entities',
    payload: { version: 1 },
    ip: null,
    userAgent: 'seed',
    updatedAt: new Date(),
    deletedAt: null
  })

  await ensureNotificationSettings(params.adminUserId)

  const existingNotification = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.title, 'Welcome to TkanMarket Admin'))
    .limit(1)
  if (!existingNotification[0]?.id) {
    await db.insert(notifications).values({
      userId: params.adminUserId,
      type: 'system',
      title: 'Welcome to TkanMarket Admin',
      body: 'Seeded environment is ready. Start with Catalog → Suppliers → Leads.',
      data: { cta: { href: '/admin', label: 'Open dashboard' } },
      readAt: null,
      archivedAt: null,
      isHighPriority: true,
      updatedAt: new Date(),
      deletedAt: null
    })
  }

  const leadSample = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.title, 'New marketplace lead'))
    .limit(1)
  if (!leadSample[0]?.id) {
    await db.insert(notifications).values({
      userId: params.adminUserId,
      type: 'lead_inquiry',
      title: 'New marketplace lead',
      body: 'A buyer submitted a fabric inquiry linked to your catalog.',
      data: { href: '/admin/leads' },
      readAt: null,
      archivedAt: null,
      isHighPriority: false,
      updatedAt: new Date(),
      deletedAt: null
    })
  }

  const socialSample = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.title, 'Social post needs review'))
    .limit(1)
  if (!socialSample[0]?.id) {
    await db.insert(notifications).values({
      userId: params.adminUserId,
      type: 'social_review',
      title: 'Social post needs review',
      body: 'A queued social asset is waiting for moderator approval.',
      data: { href: '/admin/social' },
      readAt: null,
      archivedAt: null,
      isHighPriority: false,
      updatedAt: new Date(),
      deletedAt: null
    })
  }

  const keySecret = `seed_${sha256Hex(`api_key:${params.adminUserId}`).slice(0, 24)}`
  const prefix = keySecret.slice(0, 8)
  const keyHash = sha256Hex(keySecret)

  const existingApiKey = await db.select({ id: apiKeys.id }).from(apiKeys).where(eq(apiKeys.keyHash, keyHash)).limit(1)
  if (!existingApiKey[0]?.id) {
    await db.insert(apiKeys).values({
      name: 'Seed Admin Key',
      prefix,
      keyHash,
      scopes: ['catalog:read', 'leads:read'],
      createdById: params.adminUserId,
      lastUsedAt: null,
      revokedAt: null,
      isActive: true,
      updatedAt: new Date(),
      deletedAt: null
    })
  }
}

async function seedSuppliersAndFabrics() {
  const db = getDb()

  const supplierInputs = [
    { name: 'Hangzhou Textile Co.', country: 'China', city: 'Hangzhou' },
    { name: 'Guangzhou Knit Factory', country: 'China', city: 'Guangzhou' }
  ] as const

  const supplierIds: number[] = []
  for (const s of supplierInputs) {
    const slug = `${slugify(s.name)}-${sha256Hex(s.name).slice(0, 8)}`
    const existing = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.slug, slug)).limit(1)
    if (existing[0]?.id) {
      const id = existing[0].id
      supplierIds.push(id)
      await db
        .update(suppliers)
        .set({ verified: true, updatedAt: new Date() })
        .where(eq(suppliers.id, id))
      continue
    }

    const inserted = await db
      .insert(suppliers)
      .values({
        name: s.name,
        slug,
        country: s.country,
        city: s.city,
        province: null,
        description: null,
        logoUrl: null,
        websiteUrl: null,
        verified: true,
        establishedYear: null,
        sourceUrl: null,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({ id: suppliers.id })
    const row = inserted[0]
    if (!row) throw new Error('Failed to insert supplier')
    supplierIds.push(row.id)
  }

  const fabricInputs = [
    {
      supplierIndex: 0,
      titleRu: 'Хлопковая ткань 200 GSM (для футболок)',
      tags: ['cotton', 'jersey', 'tshirt'],
      images: ['/og-placeholder.svg']
    },
    {
      supplierIndex: 1,
      titleRu: 'Полиэстер + спандекс, эластичный трикотаж 180 GSM',
      tags: ['polyester', 'spandex', 'stretch'],
      images: ['/og-placeholder.svg']
    }
  ] as const

  const fabricIds: number[] = []
  for (const f of fabricInputs) {
    const supplierId = supplierIds[f.supplierIndex]!
    const slug = `${slugify(f.titleRu)}-${sha256Hex(`${supplierId}:${f.titleRu}`).slice(0, 8)}`

    const existing = await db.select({ id: fabrics.id }).from(fabrics).where(eq(fabrics.slug, slug)).limit(1)
    if (existing[0]?.id) {
      fabricIds.push(existing[0].id)
      continue
    }

    const inserted = await db
      .insert(fabrics)
      .values({
        supplierId,
        slug,
        sku: null,
        status: 'approved',
        titleRu: f.titleRu,
        titleEn: null,
        descriptionRu: 'Seed product for local development and UI testing.',
        descriptionEn: null,
        metaTitleRu: null,
        metaDescriptionRu: null,
        metaTitleEn: null,
        metaDescriptionEn: null,
        imageAltRu: null,
        imageAltEn: null,
        fabricType: 'knit',
        gsm: 180,
        widthCm: 160,
        color: null,
        colorEn: null,
        supplyType: null,
        supplyTypeEn: null,
        shipmentTime: null,
        shipmentTimeEn: null,
        usageRu: null,
        usageEn: null,
        priceUsd: '4.50',
        moq: 50,
        composition: [{ material: 'cotton', percentage: 92 }, { material: 'spandex', percentage: 8 }],
        tags: [...f.tags],
        tagsEn: null,
        images: [...f.images],
        sourceUrl: null,
        rawTitle: null,
        rawDescription: null,
        aiConfidenceScore: null,
        aiProcessedAt: null,
        isFeatured: false,
        socialScore: 65,
        viewsCount: 0,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({ id: fabrics.id })
    const row = inserted[0]
    if (!row) throw new Error('Failed to insert fabric')
    fabricIds.push(row.id)
  }

  return { supplierIds, fabricIds }
}

async function seedLeadFlow(params: { adminUserId: number; fabricId: number }) {
  const db = getDb()

  const leadRows = await db
    .insert(leads)
    .values({
      source: 'MARKETPLACE_INQUIRY',
      status: 'NEW',
      companyName: 'CIS Garments LLC',
      contactName: 'Ivan Petrov',
      email: 'buyer@example.com',
      phone: '+7 999 000 00 00',
      country: 'Russia',
      city: 'Moscow',
      fabricId: params.fabricId,
      inquiryText: 'Interested in sample + MOQ/price details. Please contact via WhatsApp.',
      assignedToId: params.adminUserId,
      utmSource: 'seed',
      utmCampaign: 'local-dev',
      utmMedium: 'organic'
    })
    .returning({ id: leads.id })

  const leadId = leadRows[0]?.id
  if (!leadId) throw new Error('Failed to insert lead')

  await db.insert(leadNotes).values({
    leadId,
    authorId: params.adminUserId,
    content: 'Seed note: follow up within 24h.',
    updatedAt: new Date()
  })

  await db.insert(leadActivityLog).values({
    leadId,
    actorId: params.adminUserId,
    eventType: 'seed_created',
    payload: { note: 'Seed data inserted' },
    updatedAt: new Date()
  })

  return leadId
}

async function seedSocialPost(fabricId: number) {
  const db = getDb()
  await db.insert(socialPosts).values({
    fabricId,
    platform: 'INSTAGRAM',
    contentType: 'REEL_8',
    status: 'DRAFT',
    captionText: 'Новая ткань в каталоге — запросите образец!',
    hashtags: ['ткань', 'опт', 'поставщик'],
    scriptText: '8 сек скрипт для Reels',
    mediaUrls: [],
    scheduledAt: null,
    publishedAt: null,
    platformPostId: null,
    reach: null,
    likes: null,
    shares: null,
    linkClicks: null,
    errorMessage: null,
    updatedAt: new Date(),
    deletedAt: null
  })
}

async function seedCrawlerRun(adminUserId: number) {
  const db = getDb()
  await db.insert(crawlerRuns).values({
    status: 'COMPLETED',
    source: 'alibaba',
    keywords: ['cotton jersey', 'stretch knit'],
    productsFound: 10,
    productsSaved: 2,
    errorsCount: 0,
    triggeredById: adminUserId,
    startedAt: new Date(Date.now() - 1000 * 60 * 10),
    completedAt: new Date(),
    errorLog: null,
    updatedAt: new Date()
  })
}

async function seedBulkOrders(supplierIds: number[]) {
  const db = getDb()
  const existing = await db.select({ c: count() }).from(bulkOrders).where(isNull(bulkOrders.deletedAt))
  if ((existing[0]?.c ?? 0) > 0) return

  const s0 = supplierIds[0]
  const s1 = supplierIds[1] ?? supplierIds[0]
  if (s0 === undefined || s1 === undefined) return

  const day = 24 * 60 * 60 * 1000
  const now = Date.now()

  const rows = [
    {
      orderReference: 'TK-8942-X',
      buyerCompanyName: 'Velvet & Co.',
      supplierId: s0,
      supplierTier: 'GOLD' as const,
      totalMeters: '1240',
      estimatedValueUsd: '45000',
      status: 'PROCESSING' as const,
      orderedAt: new Date(now - 1 * day),
      updatedAt: new Date(),
      deletedAt: null
    },
    {
      orderReference: 'TK-8941-A',
      buyerCompanyName: 'Urban Threads',
      supplierId: s1,
      supplierTier: 'SILVER' as const,
      totalMeters: '850.5',
      estimatedValueUsd: '22000',
      status: 'IN_TRANSIT' as const,
      orderedAt: new Date(now - 2 * day),
      updatedAt: new Date(),
      deletedAt: null
    },
    {
      orderReference: 'TK-8939-L',
      buyerCompanyName: 'Heritage Looms',
      supplierId: s0,
      supplierTier: 'PLATINUM' as const,
      totalMeters: '4120',
      estimatedValueUsd: '198000',
      status: 'DELIVERED' as const,
      orderedAt: new Date(now - 5 * day),
      updatedAt: new Date(),
      deletedAt: null
    },
    {
      orderReference: 'TK-8935-Q',
      buyerCompanyName: 'Maison de Lin',
      supplierId: s1,
      supplierTier: 'STANDARD' as const,
      totalMeters: '1100',
      estimatedValueUsd: '31000',
      status: 'ON_HOLD' as const,
      orderedAt: new Date(now - 6 * day),
      updatedAt: new Date(),
      deletedAt: null
    }
  ]

  for (const row of rows) {
    await db.insert(bulkOrders).values(row)
  }
}

async function seedDefaultTeamAndMember(adminUserId: number) {
  const db = getDb()
  const slug = 'marketplace-ops'
  const [existingTeam] = await db.select({ id: teams.id }).from(teams).where(eq(teams.slug, slug)).limit(1)
  let teamId = existingTeam?.id
  if (!teamId) {
    const inserted = await db
      .insert(teams)
      .values({
        name: 'Marketplace Ops',
        slug,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({ id: teams.id })
    teamId = inserted[0]?.id
  }
  if (!teamId) return

  const [existingMember] = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, adminUserId), isNull(teamMembers.deletedAt)))
    .limit(1)
  if (existingMember?.id) return

  await db.insert(teamMembers).values({
    teamId,
    userId: adminUserId,
    title: 'Lead',
    updatedAt: new Date(),
    deletedAt: null
  })
}

async function seedSampleWholesaleProfile(fabricId: number) {
  const db = getDb()
  const [existingProf] = await db
    .select({ id: wholesalePricingProfiles.id })
    .from(wholesalePricingProfiles)
    .where(and(eq(wholesalePricingProfiles.fabricId, fabricId), isNull(wholesalePricingProfiles.deletedAt)))
    .limit(1)
  if (existingProf?.id) return

  const [fab] = await db.select({ priceUsd: fabrics.priceUsd }).from(fabrics).where(eq(fabrics.id, fabricId)).limit(1)
  const baseStr =
    fab?.priceUsd != null && String(fab.priceUsd).trim() !== '' && Number(fab.priceUsd) > 0
      ? String(fab.priceUsd)
      : '12.50'

  const simulator = {
    baseUnitCostUsd: baseStr,
    minTargetMarginPercent: '18.5',
    volumeDecayFactor: '0.92'
  }
  const tiers = computeWholesaleTiersFromSimulator(simulator)

  await db.insert(wholesalePricingProfiles).values({
    fabricId,
    tiers,
    simBaseUnitCostUsd: baseStr,
    simMinTargetMarginPercent: '18.50',
    simVolumeDecayFactor: '0.9200',
    updatedAt: new Date(),
    deletedAt: null
  })
}

async function seedRawProduct() {
  const db = getDb()
  const url = 'https://example.com/product/seed-raw-fabric'

  await db
    .insert(rawProducts)
    .values({
      source: 'manual',
      productUrl: url,
      urlHash: sha256Hex(url),
      rawTitle: 'Raw Cotton Fabric 180gsm',
      rawDescription: 'Unstructured scraped description for AI pipeline.',
      rawComposition: 'Cotton 100%',
      rawImages: ['/og-placeholder.svg'],
      supplierName: 'Seed Supplier',
      priceText: '$3.90/m',
      moqText: '50m',
      sourceLanguage: 'en',
      updatedAt: new Date(),
      deletedAt: null
    })
    .onConflictDoNothing()
}

async function main() {
  const adminEmail = envOrDefault({ name: 'ADMIN_EMAIL', defaultValue: 'admin@tkanmarket.local' })
  const adminPassword = envOrDefault({ name: 'ADMIN_PASSWORD', defaultValue: 'admin123' })

  const adminUserId = await ensureAdminUser({ email: adminEmail, name: 'TkanMarket Admin', password: adminPassword })
  await ensureAdminSettings(adminEmail)
  await seedFabricCategoryTerms()

  const { roleIds } = await ensureRbacSeed()
  const adminRoleId = roleIds.get('admin')
  if (!adminRoleId) throw new Error('Admin role id missing after RBAC seed')
  await ensureAdminHasAdminRole({ adminUserId, adminRoleId })

  const { fabricIds, supplierIds } = await seedSuppliersAndFabrics()
  await syncShowcaseFabrics(supplierIds)
  await seedBlogPostsFromStitchDesign()
  await seedPromptRules()
  await seedTextPromptRules()

  const firstFabricId = fabricIds[0]
  if (!firstFabricId) throw new Error('Seed did not create fabrics')

  await seedDefaultTeamAndMember(adminUserId)
  await seedSampleWholesaleProfile(firstFabricId)

  await seedBulkOrders(supplierIds)

  await seedLeadFlow({ adminUserId, fabricId: firstFabricId })
  await seedSocialPost(firstFabricId)
  await seedCrawlerRun(adminUserId)
  await seedRawProduct()
  await seedFoundationAdminOps({ adminUserId })
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err: unknown) => {
    logger.error('Database seed failed', {
      error: err instanceof Error ? err.message : String(err)
    })
    process.exit(1)
  })

