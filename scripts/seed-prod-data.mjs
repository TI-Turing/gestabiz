/**
 * seed-prod-data.mjs
 * Copia datos semilla desde DEV hacia PROD via Management API
 * Tablas: business_categories, public_holidays, permission_templates
 *
 * Uso: node scripts/seed-prod-data.mjs
 */

const DEV_REF   = 'dkancockzvcqorqbwtyh'
const PROD_REF  = 'emknatoknbomvmyumqju'
const TOKEN     = process.env.SUPABASE_ACCESS_TOKEN

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function queryProject(ref, sql, retries = 4) {
  const api = `https://api.supabase.com/v1/projects/${ref}/database/query`
  for (let i = 0; i <= retries; i++) {
    await sleep(800)
    const res = await fetch(api, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    })
    if (res.status === 429) { await sleep(4000 * (i + 1)); continue }
    const body = await res.text()
    if (!res.ok) throw new Error(`[${ref}] API ${res.status}: ${body}`)
    return JSON.parse(body)
  }
  throw new Error('Max retries exceeded')
}

function escape(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return String(val)
  if (Array.isArray(val)) return `ARRAY[${val.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',')}]::text[]`
  return `'${String(val).replace(/'/g, "''")}'`
}

async function seedTable({ table, columns, orderBy, onConflict, where = '' }) {
  console.log(`\n📋 ${table}...`)

  const rows = await queryProject(DEV_REF, `SELECT ${columns.join(', ')} FROM ${table}${where} ORDER BY ${orderBy}`)
  console.log(`  DEV rows: ${rows.length}`)
  if (!rows.length) { console.log('  Nothing to seed'); return }

  const values = rows.map(row =>
    `(${columns.map(col => escape(row[col])).join(', ')})`
  ).join(',\n  ')

  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES
      ${values}
    ${onConflict}
  `
  const result = await queryProject(PROD_REF, sql)
  console.log(`  ✓ Inserted/upserted ${rows.length} rows`)
  return result
}

async function main() {
  console.log('Iniciando seed de datos PROD desde DEV...\n')

  // 1. Countries (required before regions, cities, public_holidays, document_types)
  await seedTable({
    table: 'public.countries',
    columns: ['id', 'name', 'code', 'phone_prefix'],
    orderBy: 'name',
    onConflict: 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, phone_prefix = EXCLUDED.phone_prefix',
  })

  await sleep(1000)

  // 2. Regions (requires countries)
  await seedTable({
    table: 'public.regions',
    columns: ['id', 'name', 'country_id'],
    orderBy: 'name',
    onConflict: 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name',
  })

  await sleep(1000)

  // 3. Cities (requires regions)
  await seedTable({
    table: 'public.cities',
    columns: ['id', 'name', 'region_id'],
    orderBy: 'name',
    onConflict: 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name',
  })

  await sleep(1000)

  // 4. Document Types (requires countries)
  await seedTable({
    table: 'public.document_types',
    columns: ['id', 'name', 'abbreviation', 'country_id'],
    orderBy: 'name',
    onConflict: 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, abbreviation = EXCLUDED.abbreviation',
  })

  await sleep(1000)

  // 5. Business Categories (includes subcategories via parent_id)
  await seedTable({
    table: 'public.business_categories',
    columns: ['id', 'name', 'slug', 'description', 'icon_name', 'is_active', 'sort_order', 'parent_id'],
    orderBy: 'sort_order',
    onConflict: 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, is_active = EXCLUDED.is_active',
  })

  await sleep(1000)

  // Note: business_subcategories is a per-business junction table, not a catalog — skip

  // 6. Public Holidays (requires countries)
  await seedTable({
    table: 'public.public_holidays',
    columns: ['id', 'country_id', 'name', 'holiday_date', 'is_recurring', 'description'],
    orderBy: 'holiday_date',
    onConflict: 'ON CONFLICT (id) DO NOTHING',
  })

  await sleep(1000)

  // 7. Permission Templates (only global/system templates with business_id IS NULL)
  try {
    const rows = await queryProject(DEV_REF, `
      SELECT id, name, description, role, permissions, is_system_template
      FROM public.permission_templates
      WHERE business_id IS NULL
      ORDER BY name
    `)
    if (rows.length) {
      console.log(`\n📋 permission_templates... DEV rows: ${rows.length}`)
      for (const row of rows) {
        // permissions is a JSONB column
        const permJson = typeof row.permissions === 'string' ? row.permissions : JSON.stringify(row.permissions)
        const sql = `
          INSERT INTO public.permission_templates (id, name, description, role, permissions, is_system_template)
          VALUES (
            ${escape(row.id)},
            ${escape(row.name)},
            ${escape(row.description)},
            ${escape(row.role)},
            '${permJson.replace(/'/g, "''")}'::jsonb,
            ${escape(row.is_system_template)}
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            permissions = EXCLUDED.permissions,
            is_system_template = EXCLUDED.is_system_template
        `
        await queryProject(PROD_REF, sql)
        await sleep(200)
      }
      console.log(`  ✓ Inserted/upserted ${rows.length} permission templates`)
    }
  } catch (e) {
    console.warn('  ⚠ permission_templates:', e.message)
  }

  await sleep(1000)

  // 5. Storage Buckets (via Storage API)
  console.log('\n📋 Storage buckets...')
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const buckets = [
    { id: 'avatars',              name: 'avatars',              public: true  },
    { id: 'cvs',                  name: 'cvs',                  public: false },
    { id: 'chat-attachments',     name: 'chat-attachments',     public: false },
    { id: 'bug-report-evidences', name: 'bug-report-evidences', public: false },
    { id: 'service-images',       name: 'service-images',       public: true  },
    { id: 'location-media',       name: 'location-media',       public: true  },
    { id: 'location-images',      name: 'location-images',      public: true  },
    { id: 'location-videos',      name: 'location-videos',      public: true  },
  ]
  for (const b of buckets) {
    await sleep(400)
    const res = await fetch(`https://emknatoknbomvmyumqju.supabase.co/storage/v1/bucket`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(b),
    })
    const body = await res.text()
    console.log(`  ${b.id}: ${res.status === 200 || res.ok ? '✓' : body}`)
  }

  console.log('\n✅ Seed completado!')
}

main().catch(console.error)
