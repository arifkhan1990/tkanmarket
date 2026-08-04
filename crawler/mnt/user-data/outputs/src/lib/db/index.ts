import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

// ============================================================
// PostgreSQL connection singleton
// ============================================================

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Disable prefetch for serverless environments (Vercel)
const client = postgres(connectionString, {
  prepare: false,
  max:     10,
})

export const db = drizzle(client, { schema })

export type Database = typeof db
