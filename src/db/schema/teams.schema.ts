import { pgTable, text, integer, timestamp, index, unique } from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const teams = pgTable(
  'teams',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    teamsSlugUnique: unique('teams_slug_unique').on(table.slug)
  })
)

export const teamMembers = pgTable(
  'team_members',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    teamMembersTeamIdIdx: index('team_members_team_id_idx').on(table.teamId),
    teamMembersUserIdIdx: index('team_members_user_id_idx').on(table.userId),
    teamMembersTeamUserUnique: unique('team_members_team_user_unique').on(table.teamId, table.userId)
  })
)
