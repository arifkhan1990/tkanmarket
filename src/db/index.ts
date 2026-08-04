import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

type DrizzleDb = ReturnType<typeof drizzle>

type DbCache = { client: postgres.Sql; db: DrizzleDb }

/**
 * Persist the postgres-js pool on `globalThis` so Next.js dev HMR does not
 * create a new pool on every reload. Orphan pools were exhausting PostgreSQL
 * `max_connections` ("too many clients already", SQLSTATE 53300).
 */
const globalForDb = globalThis as unknown as { __tkanmarketDb?: DbCache }

function parsePoolMax(): number {
  const raw = process.env.DATABASE_POOL_MAX
  if (raw === undefined || raw === '') return 10
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : 10
}

function initDb(): DbCache {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required')

  const client = postgres(databaseUrl, {
    max: parsePoolMax(),
    // Recycle idle connections so dev / long-running servers do not hold slots forever.
    idle_timeout: 20,
    max_lifetime: 60 * 30
  })
  const db = drizzle(client)

  // Pre-warm the connection pool in background (don't await)
  client.reserve().then((conn) => {
    conn.release()
  }).catch(() => {
    // Ignore errors - the pool will retry on actual queries
  })

  return { client, db }
}

function getCache(): DbCache {
  if (!globalForDb.__tkanmarketDb) {
    globalForDb.__tkanmarketDb = initDb()
  }
  return globalForDb.__tkanmarketDb
}

export function getDb(): DrizzleDb {
  return getCache().db
}

export function getDbClient(): postgres.Sql {
  return getCache().client
}