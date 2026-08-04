#!/usr/bin/env node
import { readFile, writeFile, rm, stat, readdir, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY_PATH = join(ROOT, 'src/config/features.registry.json')
const STATE_PATH = join(ROOT, 'src/config/features.state.json')
const SCHEMA_INDEX_PATH = join(ROOT, 'src/db/schema/index.ts')
const MIGRATIONS_DIR = join(ROOT, 'src/db/migrations')

const COLOR = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function c(color, text) {
  return `${COLOR[color]}${text}${COLOR.reset}`
}

async function loadRegistry() {
  const raw = await readFile(REGISTRY_PATH, 'utf8')
  return JSON.parse(raw)
}

async function loadState() {
  if (!existsSync(STATE_PATH)) return {}
  const raw = await readFile(STATE_PATH, 'utf8')
  return JSON.parse(raw || '{}')
}

async function saveState(state) {
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8')
}

function statusColor(status) {
  if (status === 'enabled') return c('green', status)
  if (status === 'disabled') return c('yellow', status)
  if (status === 'purged') return c('red', status)
  return status
}

async function cmdList() {
  const registry = await loadRegistry()
  const state = await loadState()
  console.log(c('bold', '\nFeature registry:'))
  console.log(c('dim', '─'.repeat(70)))
  for (const f of registry) {
    const status = state[f.id] ?? 'enabled'
    console.log(`  ${c('cyan', f.id.padEnd(28))} ${statusColor(status.padEnd(10))} ${c('dim', f.label)}`)
  }
  console.log(c('dim', '─'.repeat(70)))
  const total = registry.length
  const disabled = registry.filter((f) => (state[f.id] ?? 'enabled') === 'disabled').length
  const enabled = registry.filter((f) => (state[f.id] ?? 'enabled') === 'enabled').length
  console.log(c('dim', `  ${total} total  —  ${enabled} enabled, ${disabled} disabled\n`))
}

async function cmdDisable(id) {
  const registry = await loadRegistry()
  const entry = registry.find((f) => f.id === id)
  if (!entry) exitError(`Feature "${id}" not found. Run "feature:list" to see valid ids.`)
  const state = await loadState()
  const prev = state[id] ?? 'enabled'
  if (prev === 'purged') exitError(`Feature "${id}" has been purged and cannot be toggled.`)
  state[id] = 'disabled'
  await saveState(state)
  console.log(`${c('yellow', '✓')} Feature ${c('bold', id)} disabled — hidden from UI + APIs, files untouched.`)
}

async function cmdEnable(id) {
  const registry = await loadRegistry()
  const entry = registry.find((f) => f.id === id)
  if (!entry) exitError(`Feature "${id}" not found.`)
  const state = await loadState()
  const prev = state[id] ?? 'enabled'
  if (prev === 'purged') exitError(`Feature "${id}" has been purged. Restore from git history to re-enable.`)
  state[id] = 'enabled'
  await saveState(state)
  console.log(`${c('green', '✓')} Feature ${c('bold', id)} enabled.`)
}

async function cmdPurge(id, { dryRun, yes }) {
  const registry = await loadRegistry()
  const entry = registry.find((f) => f.id === id)
  if (!entry) exitError(`Feature "${id}" not found.`)
  const state = await loadState()
  const current = state[id] ?? 'enabled'
  if (current !== 'disabled') {
    exitError(`Refusing to purge "${id}": current status is "${current}". Run "feature:disable ${id}" first and verify nothing breaks.`)
  }

  console.log(c('bold', `\nPurge plan for "${id}":\n`))
  console.log(c('dim', 'Files/dirs to delete:'))
  for (const p of entry.files) console.log(`  - ${p}`)
  console.log(c('dim', '\nSchemas to drop (via Drizzle migration):'))
  for (const s of entry.schemas) console.log(`  - ${s}`)
  console.log()

  if (dryRun) {
    console.log(c('yellow', 'Dry run — no changes made.\n'))
    return
  }
  if (!yes) {
    console.log(c('red', 'This will HARD-DELETE files and generate a DROP TABLE migration.'))
    console.log(c('red', 'Re-run with --yes to confirm.\n'))
    process.exit(1)
  }

  let deleted = 0
  for (const relPath of entry.files) {
    const abs = join(ROOT, relPath)
    if (!existsSync(abs)) {
      console.log(c('dim', `  skip (missing): ${relPath}`))
      continue
    }
    await rm(abs, { recursive: true, force: true })
    deleted++
    console.log(`  ${c('red', '✗')} removed: ${relPath}`)
  }

  if (entry.schemas.length > 0) {
    const migName = await generateDropMigration(id, entry.schemas)
    console.log(`\n${c('cyan', '✓')} Drizzle migration written: ${migName}`)
    console.log(c('dim', '  Apply it with: npm run db:migrate'))
  }

  if (entry.schemas.length > 0) await removeSchemaIndexExports(entry.files)

  state[id] = 'purged'
  await saveState(state)
  console.log(`\n${c('red', '✓')} Feature ${c('bold', id)} purged (${deleted} paths removed).\n`)
}

async function generateDropMigration(featureId, tables) {
  const existing = existsSync(MIGRATIONS_DIR) ? await readdir(MIGRATIONS_DIR) : []
  const nums = existing
    .map((f) => {
      const m = f.match(/^(\d{4})_/)
      return m ? Number.parseInt(m[1], 10) : -1
    })
    .filter((n) => n >= 0)
  const next = (nums.length > 0 ? Math.max(...nums) + 1 : 0).toString().padStart(4, '0')
  const slug = featureId.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
  const filename = `${next}_purge_${slug}.sql`
  const sql = [
    `-- Auto-generated by feature:purge for "${featureId}"`,
    `-- Review before running: npm run db:migrate`,
    '',
    ...tables.map((t) => `DROP TABLE IF EXISTS "${t}" CASCADE;`),
    ''
  ].join('\n')
  await writeFile(join(MIGRATIONS_DIR, filename), sql, 'utf8')
  return filename
}

async function removeSchemaIndexExports(files) {
  if (!existsSync(SCHEMA_INDEX_PATH)) return
  const schemaFiles = files
    .filter((f) => f.startsWith('src/db/schema/') && f.endsWith('.schema.ts'))
    .map((f) => f.replace(/^src\/db\/schema\//, './').replace(/\.ts$/, ''))
  if (schemaFiles.length === 0) return
  let content = await readFile(SCHEMA_INDEX_PATH, 'utf8')
  for (const rel of schemaFiles) {
    const pattern = new RegExp(`^export \\* from '${rel.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}'\\s*\\n?`, 'm')
    content = content.replace(pattern, '')
  }
  await writeFile(SCHEMA_INDEX_PATH, content, 'utf8')
  console.log(`  ${c('dim', '✓ cleaned src/db/schema/index.ts')}`)
}

function exitError(msg) {
  console.error(c('red', `Error: ${msg}`))
  process.exit(1)
}

function usage() {
  console.log(`
${c('bold', 'TkanMarket Feature CLI')}

${c('cyan', 'npm run feature:list')}                  Show all features + status
${c('cyan', 'npm run feature:disable')} ${c('dim', '<id>')}         Soft-hide feature (invisible to client + APIs)
${c('cyan', 'npm run feature:enable')} ${c('dim', '<id>')}          Reactivate a disabled feature
${c('cyan', 'npm run feature:purge')} ${c('dim', '<id> [--dry-run] [--yes]')}
                                    Hard delete files + generate DROP TABLE migration
                                    (feature must be disabled first)

${c('dim', 'Examples:')}
  npm run feature:disable blog
  npm run feature:enable blog
  npm run feature:purge blog -- --dry-run
  npm run feature:purge blog -- --yes
`)
}

async function main() {
  const [, , cmd, ...rest] = process.argv
  const flags = new Set(rest.filter((a) => a.startsWith('--')))
  const args = rest.filter((a) => !a.startsWith('--'))

  try {
    switch (cmd) {
      case 'list':
        await cmdList()
        break
      case 'disable':
        if (!args[0]) exitError('Missing feature id. Usage: feature:disable <id>')
        await cmdDisable(args[0])
        break
      case 'enable':
        if (!args[0]) exitError('Missing feature id. Usage: feature:enable <id>')
        await cmdEnable(args[0])
        break
      case 'purge':
        if (!args[0]) exitError('Missing feature id. Usage: feature:purge <id> [--dry-run] [--yes]')
        await cmdPurge(args[0], { dryRun: flags.has('--dry-run'), yes: flags.has('--yes') })
        break
      default:
        usage()
    }
  } catch (err) {
    exitError(err instanceof Error ? err.message : String(err))
  }
}

main()
