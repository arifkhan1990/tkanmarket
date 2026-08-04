import { pgTable, integer, text, timestamptz, pgEnum, boolean } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'SALES', 'VIEWER'])

export const users = pgTable('users', {
  id:        integer('id').generatedAlwaysAsIdentity().primaryKey(),
  email:     text('email').notNull().unique(),
  name:      text('name').notNull(),
  password:  text('password').notNull(),
  role:      userRoleEnum('role').notNull().default('VIEWER'),
  avatarUrl: text('avatar_url'),
  isActive:  boolean('is_active').notNull().default(true),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  deletedAt: timestamptz('deleted_at'),
})

export type User        = typeof users.$inferSelect
export type NewUser     = typeof users.$inferInsert
