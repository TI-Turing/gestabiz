/**
 * dump-schema-from-api.ts
 * Genera el schema inicial de Supabase DEV via Management API
 * y lo guarda en supabase/migrations/20251026230533_initial_schema.sql
 *
 * Uso: npx tsx scripts/dump-schema-from-api.ts
 */

import fs from 'fs'
import path from 'path'

const PROJECT_REF = 'dkancockzvcqorqbwtyh'
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const API_BASE = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function query(sql: string, retries = 3): Promise<unknown[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    })
    if (res.status === 429) {
      const wait = 2000 * (attempt + 1)
      process.stdout.write(` [429 wait ${wait}ms]`)
      await sleep(wait)
      continue
    }
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`API error ${res.status}: ${text}`)
    }
    await sleep(300) // small pause between calls
    return res.json() as Promise<unknown[]>
  }
  throw new Error('Max retries exceeded (429)')
}

// Parse PostgreSQL array literal "{a,b,c}" → ['a','b','c']
function pgArrayToJs(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[]
  if (typeof val === 'string') {
    return val.replace(/^\{|\}$/g, '').split(',').map(s => s.trim())
  }
  return []
}

// ─── Secciones del schema ───────────────────────────────────────────────────

async function getExtensions(): Promise<string> {
  const rows = await query(`
    SELECT extname FROM pg_catalog.pg_extension
    WHERE extname NOT IN ('plpgsql')
    ORDER BY extname
  `) as Array<{ extname: string }>
  if (!rows.length) return ''
  const lines = rows.map(r => `CREATE EXTENSION IF NOT EXISTS "${r.extname}";`)
  return `-- Extensions\n${lines.join('\n')}\n`
}

async function getEnums(): Promise<string> {
  const rows = await query(`
    SELECT t.typname,
           array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname
  `) as Array<{ typname: string; labels: string[] }>
  if (!rows.length) return ''
  const lines = rows.map(r => {
    const labels = pgArrayToJs(r.labels)
    return `CREATE TYPE public.${r.typname} AS ENUM (\n  ${labels.map(l => `'${l}'`).join(',\n  ')}\n);`
  })
  return `-- Custom Types / Enums\n${lines.join('\n')}\n`
}

async function getTables(): Promise<string> {
  // Get tables in dependency order using pg_depend
  const tables = await query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `) as Array<{ table_name: string }>

  const parts: string[] = []
  for (const { table_name } of tables) {
    const cols = await query(`
      SELECT
        c.column_name,
        c.udt_name,
        c.data_type,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.is_nullable,
        c.column_default,
        c.ordinal_position
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = '${table_name}'
      ORDER BY c.ordinal_position
    `) as Array<{
      column_name: string
      udt_name: string
      data_type: string
      character_maximum_length: number | null
      numeric_precision: number | null
      numeric_scale: number | null
      is_nullable: string
      column_default: string | null
      ordinal_position: number
    }>

    if (!cols.length) continue

    const colDefs = cols.map(c => {
      let type: string
      if (c.data_type === 'USER-DEFINED') {
        type = `public.${c.udt_name}`
      } else if (c.data_type === 'ARRAY') {
        // strip the leading underscore from udt_name
        const base = c.udt_name.startsWith('_') ? c.udt_name.slice(1) : c.udt_name
        type = `${base}[]`
      } else if (c.data_type === 'character varying') {
        type = c.character_maximum_length ? `varchar(${c.character_maximum_length})` : 'text'
      } else if (c.data_type === 'character') {
        type = c.character_maximum_length ? `char(${c.character_maximum_length})` : 'char'
      } else if (c.data_type === 'numeric') {
        type = (c.numeric_precision && c.numeric_scale != null)
          ? `numeric(${c.numeric_precision},${c.numeric_scale})`
          : 'numeric'
      } else {
        type = c.udt_name === c.data_type.replace(/ /g, '_') ? c.data_type : c.udt_name
      }
      const notNull = c.is_nullable === 'NO' ? ' NOT NULL' : ''
      const def = c.column_default ? ` DEFAULT ${c.column_default}` : ''
      return `    ${c.column_name} ${type}${def}${notNull}`
    })

    // Primary key
    const pk = await query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = '${table_name}'
      ORDER BY kcu.ordinal_position
    `) as Array<{ column_name: string }>

    if (pk.length) {
      colDefs.push(`    PRIMARY KEY (${pk.map(p => p.column_name).join(', ')})`)
    }

    // Unique constraints (not indexes)
    const uniques = await query(`
      SELECT tc.constraint_name,
             string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS cols
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
        AND tc.table_name = '${table_name}'
      GROUP BY tc.constraint_name
    `) as Array<{ constraint_name: string; cols: string }>
    for (const u of uniques) {
      colDefs.push(`    CONSTRAINT ${u.constraint_name} UNIQUE (${u.cols})`)
    }

    // Check constraints
    const checks = await query(`
      SELECT cc.constraint_name, cc.check_clause
      FROM information_schema.check_constraints cc
      JOIN information_schema.table_constraints tc
        ON cc.constraint_name = tc.constraint_name AND cc.constraint_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = '${table_name}'
        AND cc.check_clause NOT LIKE '%IS NOT NULL'
    `) as Array<{ constraint_name: string; check_clause: string }>
    for (const ch of checks) {
      colDefs.push(`    CONSTRAINT ${ch.constraint_name} CHECK (${ch.check_clause})`)
    }

    parts.push(
      `CREATE TABLE IF NOT EXISTS public.${table_name} (\n${colDefs.join(',\n')}\n);`
    )
  }

  return `-- Tables\n${parts.join('\n\n')}\n`
}

async function getForeignKeys(): Promise<string> {
  const fks = await query(`
    SELECT tc.constraint_name,
           tc.table_name,
           kcu.column_name,
           ccu.table_name AS foreign_table,
           ccu.column_name AS foreign_column,
           rc.delete_rule,
           rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `) as Array<{
    constraint_name: string
    table_name: string
    column_name: string
    foreign_table: string
    foreign_column: string
    delete_rule: string
    update_rule: string
  }>

  if (!fks.length) return ''

  const lines = fks.map(fk => {
    const onDelete = fk.delete_rule !== 'NO ACTION' ? ` ON DELETE ${fk.delete_rule}` : ''
    const onUpdate = fk.update_rule !== 'NO ACTION' ? ` ON UPDATE ${fk.update_rule}` : ''
    return `ALTER TABLE public.${fk.table_name} ADD CONSTRAINT ${fk.constraint_name} FOREIGN KEY (${fk.column_name}) REFERENCES public.${fk.foreign_table}(${fk.foreign_column})${onDelete}${onUpdate};`
  })
  return `-- Foreign Keys\n${lines.join('\n')}\n`
}

async function getRLS(): Promise<string> {
  const tables = await query(`
    SELECT tablename FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = true
    ORDER BY tablename
  `) as Array<{ tablename: string }>
  if (!tables.length) return ''
  const lines = tables.map(t => `ALTER TABLE public.${t.tablename} ENABLE ROW LEVEL SECURITY;`)
  return `-- Enable RLS\n${lines.join('\n')}\n`
}

async function getPolicies(): Promise<string> {
  const policies = await query(`
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `) as Array<{
    schemaname: string
    tablename: string
    policyname: string
    permissive: string
    roles: string[]
    cmd: string
    qual: string | null
    with_check: string | null
  }>
  if (!policies.length) return ''

  const lines = policies.map(p => {
    const permissive = p.permissive === 'PERMISSIVE' ? '' : ' AS RESTRICTIVE'
    const roles = p.roles && p.roles.length && !p.roles.includes('{') ? ` TO ${p.roles.join(', ')}` : ''
    const using = p.qual ? ` USING (${p.qual})` : ''
    const withCheck = p.with_check ? ` WITH CHECK (${p.with_check})` : ''
    return `CREATE POLICY "${p.policyname}" ON public.${p.tablename}${permissive} FOR ${p.cmd}${roles}${using}${withCheck};`
  })
  return `-- RLS Policies\n${lines.join('\n')}\n`
}

async function getIndexes(): Promise<string> {
  const indexes = await query(`
    SELECT indexdef
    FROM pg_catalog.pg_indexes
    WHERE schemaname = 'public'
      AND indexname NOT IN (
        SELECT conname FROM pg_catalog.pg_constraint
        WHERE contype IN ('p','u')
      )
    ORDER BY tablename, indexname
  `) as Array<{ indexdef: string }>
  if (!indexes.length) return ''
  return `-- Indexes\n${indexes.map(i => i.indexdef + ';').join('\n')}\n`
}

async function getFunctions(): Promise<string> {
  const fns = await query(`
    SELECT pg_get_functiondef(p.oid) AS def
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f', 'p')
    ORDER BY p.proname
  `) as Array<{ def: string }>
  if (!fns.length) return ''
  return `-- Functions\n${fns.map(f => f.def.trim() + '\n$$;\n').join('\n')}\n`.replace(/\$\$;\n\$\$;/g, '$$;')
}

async function getTriggers(): Promise<string> {
  const trigs = await query(`
    SELECT pg_get_triggerdef(t.oid) AS def, t.tgname
    FROM pg_catalog.pg_trigger t
    JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND NOT t.tgisinternal
    ORDER BY t.tgname
  `) as Array<{ def: string; tgname: string }>
  if (!trigs.length) return ''
  return `-- Triggers\n${trigs.map(t => t.def + ';').join('\n')}\n`
}

async function getSequences(): Promise<string> {
  const seqs = await query(`
    SELECT sequence_name, start_value, minimum_value, maximum_value, increment
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
    ORDER BY sequence_name
  `) as Array<{
    sequence_name: string
    start_value: string
    minimum_value: string
    maximum_value: string
    increment: string
  }>
  if (!seqs.length) return ''
  const lines = seqs.map(s =>
    `CREATE SEQUENCE IF NOT EXISTS public.${s.sequence_name} START ${s.start_value} INCREMENT ${s.increment} MINVALUE ${s.minimum_value} MAXVALUE ${s.maximum_value};`
  )
  return `-- Sequences\n${lines.join('\n')}\n`
}

async function getStorageBuckets(): Promise<string> {
  const buckets = await query(`
    SELECT id, name, public, file_size_limit, allowed_mime_types
    FROM storage.buckets
    ORDER BY name
  `) as Array<{
    id: string
    name: string
    public: boolean
    file_size_limit: number | null
    allowed_mime_types: string[] | null
  }>
  if (!buckets.length) return ''
  const lines = buckets.map(b => {
    const limit = b.file_size_limit ? `, file_size_limit := ${b.file_size_limit}` : ''
    const mimes = b.allowed_mime_types?.length
      ? `, allowed_mime_types := ARRAY[${b.allowed_mime_types.map(m => `'${m}'`).join(', ')}]`
      : ''
    return `INSERT INTO storage.buckets (id, name, public${b.file_size_limit ? ', file_size_limit' : ''})\n  VALUES ('${b.id}', '${b.name}', ${b.public}${limit})\n  ON CONFLICT (id) DO NOTHING;`
  })
  return `-- Storage Buckets\n${lines.join('\n')}\n`
}

async function getGrantsToRoles(): Promise<string> {
  const grants = await query(`
    SELECT grantee, table_name, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee IN ('anon', 'authenticated', 'service_role')
    ORDER BY table_name, grantee, privilege_type
  `) as Array<{ grantee: string; table_name: string; privilege_type: string }>
  if (!grants.length) return ''

  // Group by table+grantee
  const grouped: Record<string, string[]> = {}
  for (const g of grants) {
    const key = `${g.table_name}|${g.grantee}`
    grouped[key] = grouped[key] || []
    grouped[key].push(g.privilege_type)
  }
  const lines = Object.entries(grouped).map(([key, privs]) => {
    const [table, grantee] = key.split('|')
    return `GRANT ${privs.join(', ')} ON public.${table} TO ${grantee};`
  })
  return `-- Grants\n${lines.join('\n')}\n`
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Generando schema desde DEV (dkancockzvcqorqbwtyh)...')

  const sections: string[] = [
    '-- ============================================================',
    '-- SCHEMA INICIAL — Gestabiz DEV',
    `-- Generado: ${new Date().toISOString()}`,
    '-- Proyecto: dkancockzvcqorqbwtyh (gestabiz-dev)',
    '-- ============================================================',
    '',
  ]

  const steps = [
    ['Extensions',   getExtensions],
    ['Enums',        getEnums],
    ['Sequences',    getSequences],
    ['Tables',       getTables],
    ['Foreign Keys', getForeignKeys],
    ['RLS',          getRLS],
    ['Policies',     getPolicies],
    ['Indexes',      getIndexes],
    ['Functions',    getFunctions],
    ['Triggers',     getTriggers],
    ['Storage',      getStorageBuckets],
    ['Grants',       getGrantsToRoles],
  ] as const

  for (const [name, fn] of steps) {
    process.stdout.write(`  ${name}... `)
    try {
      const sql = await (fn as () => Promise<string>)()
      if (sql) {
        sections.push(sql)
        console.log('OK')
      } else {
        console.log('(vacío)')
      }
    } catch (e) {
      console.error(`ERROR: ${e}`)
    }
  }

  const output = sections.join('\n')
  const outPath = path.join(
    process.cwd(),
    'supabase/migrations/20251026230533_initial_schema.sql'
  )
  fs.writeFileSync(outPath, output, 'utf-8')
  console.log(`\nEscrito en: ${outPath}`)
  console.log(`Tamaño: ${(output.length / 1024).toFixed(1)} KB`)

  // También limpiar el archivo vacío create_location_media (ya está en initial_schema)
  const emptyFile = path.join(
    process.cwd(),
    'supabase/migrations/20251026230506_create_location_media.sql'
  )
  fs.writeFileSync(emptyFile, '-- Placeholder: location_media was included in initial_schema\n', 'utf-8')
  console.log('Limpiado: 20251026230506_create_location_media.sql')
}

main().catch(console.error)
