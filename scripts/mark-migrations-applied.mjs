/**
 * mark-migrations-applied.mjs
 * Marca todas las migraciones locales como aplicadas en el proyecto PROD
 * Usar después de que initial_schema.sql establece el estado final completo
 *
 * Uso: node scripts/mark-migrations-applied.mjs
 */

import fs from 'fs'
import path from 'path'

const PROJECT_REF = 'emknatoknbomvmyumqju'
const ACCESS_TOKEN = 'sbp_939fa09fd90a56950b2b2e6d4fbb8a8a2f743e19'
const API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function query(sql, retries = 4) {
  for (let i = 0; i <= retries; i++) {
    await sleep(600)
    const res = await fetch(API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    })
    if (res.status === 429) { await sleep(3000 * (i + 1)); continue }
    const body = await res.text()
    if (!res.ok) throw new Error(`API ${res.status}: ${body}`)
    return JSON.parse(body)
  }
  throw new Error('Max retries exceeded')
}

async function main() {
  // Get all local migration versions
  const migrationsDir = path.join(process.cwd(), 'supabase/migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && f !== 'README.md')
    .map(f => {
      const match = f.match(/^(\d+)/)
      return match ? match[1] : null
    })
    .filter(Boolean)
    .sort()

  console.log(`Found ${files.length} migration versions locally`)

  // Get which ones are already applied in PROD
  const existing = await query(
    `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version`
  )
  const appliedVersions = new Set(existing.map(r => r.version))
  console.log(`Already applied in PROD: ${appliedVersions.size}`)

  const toApply = files.filter(v => !appliedVersions.has(v))
  console.log(`Need to mark as applied: ${toApply.length}`)

  if (toApply.length === 0) {
    console.log('All migrations already applied!')
    return
  }

  // Batch INSERT all pending versions into migration history
  const values = toApply.map(v => `('${v}')`).join(',\n')
  const insertSql = `
    INSERT INTO supabase_migrations.schema_migrations (version)
    VALUES ${values}
    ON CONFLICT (version) DO NOTHING
  `
  await query(insertSql)
  console.log(`✓ Marked ${toApply.length} migrations as applied`)
  console.log('Last:', toApply[toApply.length - 1])
}

main().catch(console.error)
