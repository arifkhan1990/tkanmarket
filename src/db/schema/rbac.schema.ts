import { pgTable, text, integer, timestamp, index, unique } from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const roles = pgTable(
  'roles',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    key: text('key').notNull(), // stable identifier, e.g. 'admin', 'sales'
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    rolesKeyUnique: unique('roles_key_unique').on(table.key)
  })
)

export const permissions = pgTable(
  'permissions',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    key: text('key').notNull(), // e.g. 'catalog.view'
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    permissionsKeyUnique: unique('permissions_key_unique').on(table.key)
  })
)

export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    rolePermissionsRoleIdIdx: index('role_permissions_role_id_idx').on(table.roleId),
    rolePermissionsPermissionIdIdx: index('role_permissions_permission_id_idx').on(table.permissionId),
    rolePermissionsRolePermissionUnique: unique('role_permissions_role_permission_unique').on(table.roleId, table.permissionId)
  })
)

export const userRoles = pgTable(
  'user_roles',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    userRolesUserIdIdx: index('user_roles_user_id_idx').on(table.userId),
    userRolesRoleIdIdx: index('user_roles_role_id_idx').on(table.roleId),
    userRolesUserRoleUnique: unique('user_roles_user_role_unique').on(table.userId, table.roleId)
  })
)

