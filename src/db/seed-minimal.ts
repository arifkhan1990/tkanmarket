import crypto from 'node:crypto'

import { eq } from 'drizzle-orm'

import { hashPassword } from '../lib/auth/password'
import { logger } from '../lib/logger'
import { getDb } from './index'
import { seedPromptRules } from './seed-prompt-rules'
import { seedTextPromptRules } from './seed-text-prompt-rules'
import {
  adminSettings,
  apiKeys,
  auditLog,
  notificationSettings,
  notifications,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users
} from './schema'

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is required for seeding`)
  return v
}

function envOrDefault(params: { name: string; defaultValue: string }): string {
  const v = process.env[params.name]
  return v ?? params.defaultValue
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
      updatedAt: new Date(),
      deletedAt: null
    })
    .returning({ id: notificationSettings.id })

  return inserted[0]?.id
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

async function main() {
  logger.info('Seeding minimal data set: Tier 1 + prompt_rules + api_keys')

  const adminEmail = envOrDefault({ name: 'ADMIN_EMAIL', defaultValue: 'admin@tkanmarket.local' })
  const adminPassword = envOrDefault({ name: 'ADMIN_PASSWORD', defaultValue: 'admin123' })

  const adminUserId = await ensureAdminUser({ email: adminEmail, name: 'TkanMarket Admin', password: adminPassword })
  logger.info('Admin user ensured', { adminUserId })

  await ensureAdminSettings(adminEmail)
  logger.info('Admin settings ensured')

  const { roleIds } = await ensureRbacSeed()
  const adminRoleId = roleIds.get('admin')
  if (!adminRoleId) throw new Error('Admin role id missing after RBAC seed')
  await ensureAdminHasAdminRole({ adminUserId, adminRoleId })
  logger.info('RBAC seeded: 4 roles, 9 permissions, all mapped to admin')

  await seedPromptRules()
  logger.info('Fabric prompt rules seeded')

  await seedTextPromptRules()
  logger.info('Fabric text prompt rules seeded')

  await seedFoundationAdminOps({ adminUserId })
  logger.info('Foundation admin ops seeded (api_keys, audit_log, notifications, notification_settings)')

  logger.info('Minimal seed complete')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err: unknown) => {
    logger.error('Minimal seed failed', {
      error: err instanceof Error ? err.message : String(err)
    })
    process.exit(1)
  })
