/**
 * Crea y envía a aprobación de Meta los templates de WhatsApp para recordatorios de citas.
 *
 * Templates creados:
 *   - cita_recordatorio_24h_pending     →  24 horas antes, cita pendiente
 *   - cita_recordatorio_24h_confirmed   →  24 horas antes, cita confirmada
 *   - cita_recordatorio_2h_pending      →  2 horas antes, cita pendiente
 *   - cita_recordatorio_2h_confirmed    →  2 horas antes, cita confirmada
 *
 * Rutas de la app usadas en los botones:
 *   ✅ /confirmar-cita/:token       →  ya existe   (AppointmentConfirmation.tsx)
 *   ❌ /cancelar-cita/:token        →  ya existe   (AppointmentCancellation.tsx)
 *   ⚠️  /reprogramar-cita/:token    →  TODO crear  (abrir modal de cita con opción de modificación)
 *
 * Uso:
 *   npx tsx scripts/create-whatsapp-templates.ts
 *   npx tsx scripts/create-whatsapp-templates.ts --list     # solo lista los templates existentes
 *
 * Variables de entorno requeridas:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   APP_URL (opcional, default: https://gestabiz.com)
 */

import 'dotenv/config'

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const APP_URL = (process.env.APP_URL ?? 'https://gestabiz.com').replace(/\/$/, '')
const DEV_APP_URL = 'https://dev.gestabiz.com'
const WHATSAPP_MEDIA_SAMPLE_URL = 'https://dkancockzvcqorqbwtyh.supabase.co/storage/v1/object/public/business-logos/532dbdb9-6c0f-4c08-b0a8-2e2b811d86be/logo.png'

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.error('\n❌  Se requieren TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN como variables de entorno.\n')
  process.exit(1)
}

const authHeader = `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64')}`

// ─── Twilio Content API ────────────────────────────────────────────────────────

async function createContent(payload: Record<string, unknown>): Promise<{ sid: string; friendly_name: string }> {
  const res = await fetch('https://content.twilio.com/v1/Content', {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json() as Record<string, unknown>
  if (!res.ok) throw new Error(`Twilio error (${res.status}): ${JSON.stringify(data, null, 2)}`)
  return data as { sid: string; friendly_name: string }
}

async function submitForApproval(sid: string, templateName: string): Promise<{ status: string; rejection_reason?: string }> {
  const res = await fetch(`https://content.twilio.com/v1/Content/${sid}/ApprovalRequests/whatsapp`, {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: templateName, category: 'UTILITY' }),
  })
  const data = await res.json() as Record<string, unknown>
  if (!res.ok) throw new Error(`Approval error (${res.status}): ${JSON.stringify(data, null, 2)}`)
  return data as { status: string; rejection_reason?: string }
}

async function listTemplates(): Promise<void> {
  const res = await fetch('https://content.twilio.com/v1/Content?PageSize=50', {
    headers: { Authorization: authHeader },
  })
  const data = await res.json() as { contents?: Array<{ sid: string; friendly_name: string; language: string }>; meta?: { page_size: number; total: number } }
  if (!res.ok) { console.error('Error fetching templates:', data); return }

  const list = data.contents ?? []
  if (list.length === 0) {
    console.log('\n📭  No hay templates creados todavía.\n')
    return
  }
  console.log(`\n📋  Templates existentes (${list.length}):\n`)
  for (const t of list) {
    console.log(`  ${t.friendly_name.padEnd(35)} ${t.sid}   [${t.language}]`)
  }
  console.log()
}

// ─── Definición de templates ───────────────────────────────────────────────────

const base24hVariables = {
  '1': WHATSAPP_MEDIA_SAMPLE_URL,
  '2': 'Gestabiz Barbershop',
  '3': 'María García',
  '4': 'viernes 4 de abril de 2026',
  '5': '10:00',
  '6': 'Sede Centro',
  '7': 'Corte de cabello',
  '8': 'tok_SaMpLeToKeN24h',
}

const base2hVariables = {
  '1': WHATSAPP_MEDIA_SAMPLE_URL,
  '2': 'Gestabiz Barbershop',
  '3': 'María García',
  '4': '10:00',
  '5': 'Sede Centro',
  '6': 'Corte de cabello',
  '7': 'tok_SaMpLeToKeN2h',
}

const template24hPending = {
  friendly_name: 'cita_recordatorio_24h_pending_card_v2',
  language: 'es',
  variables: base24hVariables,
  types: {
    'whatsapp/card': {
      body:
        '*Recordatorio de cita · {{2}}*\n\n' +
        'Hola {{3}}, te recordamos que tienes una cita *mañana*:\n\n' +
        '📅 *Fecha:* {{4}}\n' +
        '🕐 *Hora:* {{5}}\n' +
        '📍 *Sede:* {{6}}\n' +
        '✂️ *Servicio:* {{7}}\n\n' +
        '⏳ Tienes *30 minutos* desde este mensaje para cancelar o reprogramar sin costo. ' +
        `Para reprogramar: ${APP_URL}/reprogramar-cita/{{8}}?src=wa24h_pending`,
      footer: 'Gestabiz · Tu gestor de citas',
      media: ['{{1}}'],
      actions: [
        { type: 'URL', title: 'Confirmar asistencia', url: `${APP_URL}/confirmar-cita/{{8}}` },
        { type: 'URL', title: 'Cancelar cita', url: `${APP_URL}/cancelar-cita/{{8}}` },
      ],
    },
  },
}

const template24hConfirmed = {
  friendly_name: 'cita_recordatorio_24h_confirmed_card_v2',
  language: 'es',
  variables: base24hVariables,
  types: {
    'whatsapp/card': {
      body:
        '*Recordatorio de cita · {{2}}*\n\n' +
        'Hola {{3}}, tu cita sigue *confirmada* para mañana:\n\n' +
        '📅 *Fecha:* {{4}}\n' +
        '🕐 *Hora:* {{5}}\n' +
        '📍 *Sede:* {{6}}\n' +
        '✂️ *Servicio:* {{7}}\n\n' +
        '⏳ Si necesitas hacer cambios, puedes reprogramar o cancelar durante los próximos *30 minutos*.',
      footer: 'Gestabiz · Tu gestor de citas',
      media: ['{{1}}'],
      actions: [
        { type: 'URL', title: 'Reprogramar', url: `${APP_URL}/reprogramar-cita/{{8}}` },
        { type: 'URL', title: 'Cancelar cita', url: `${APP_URL}/cancelar-cita/{{8}}` },
      ],
    },
  },
}

const template2hPending = {
  friendly_name: 'cita_recordatorio_2h_pending_card_v2',
  language: 'es',
  variables: base2hVariables,
  types: {
    'whatsapp/card': {
      body:
        '*Recordatorio de cita · {{2}}*\n\n' +
        'Hola {{3}}, tu cita es en *2 horas*:\n\n' +
        '🕐 *Hora:* {{4}}\n' +
        '📍 *Sede:* {{5}}\n' +
        '✂️ *Servicio:* {{6}}\n\n' +
        '⚠️ Solo puedes cancelar o reprogramar durante los *30 minutos* siguientes a este mensaje. ' +
        `Para reprogramar: ${APP_URL}/reprogramar-cita/{{7}}?src=wa2h_pending`,
      footer: 'Gestabiz · Tu gestor de citas',
      media: ['{{1}}'],
      actions: [
        { type: 'URL', title: 'Confirmar asistencia', url: `${APP_URL}/confirmar-cita/{{7}}` },
        { type: 'URL', title: 'Cancelar cita', url: `${APP_URL}/cancelar-cita/{{7}}` },
      ],
    },
  },
}

const template2hConfirmed = {
  friendly_name: 'cita_recordatorio_2h_confirmed_card_v2',
  language: 'es',
  variables: base2hVariables,
  types: {
    'whatsapp/card': {
      body:
        '*Recordatorio de cita · {{2}}*\n\n' +
        'Hola {{3}}, tu cita sigue *confirmada* y es en *2 horas*:\n\n' +
        '🕐 *Hora:* {{4}}\n' +
        '📍 *Sede:* {{5}}\n' +
        '✂️ *Servicio:* {{6}}\n\n' +
        '⚠️ Solo puedes cancelar o reprogramar durante los *30 minutos* siguientes a este mensaje.',
      footer: 'Gestabiz · Tu gestor de citas',
      media: ['{{1}}'],
      actions: [
        { type: 'URL', title: 'Reprogramar', url: `${APP_URL}/reprogramar-cita/{{7}}` },
        { type: 'URL', title: 'Cancelar cita', url: `${APP_URL}/cancelar-cita/{{7}}` },
      ],
    },
  },
}

const template24hPendingDev = {
  friendly_name: 'dev_cita_recordatorio_24h_pending_card_v2',
  language: 'es',
  variables: base24hVariables,
  types: {
    'whatsapp/card': {
      body:
        '*Recordatorio de cita · {{2}}*\n\n' +
        'Hola {{3}}, te recordamos que tienes una cita *mañana*:\n\n' +
        '📅 *Fecha:* {{4}}\n' +
        '🕐 *Hora:* {{5}}\n' +
        '📍 *Sede:* {{6}}\n' +
        '✂️ *Servicio:* {{7}}\n\n' +
        '⏳ Tienes *30 minutos* desde este mensaje para cancelar o reprogramar sin costo. ' +
        `Para reprogramar: ${DEV_APP_URL}/reprogramar-cita/{{8}}?src=wa24h_pending`,
      footer: 'Gestabiz · Tu gestor de citas',
      media: ['{{1}}'],
      actions: [
        { type: 'URL', title: 'Confirmar asistencia', url: `${APP_URL}/confirmar-cita/{{8}}` },
        { type: 'URL', title: 'Cancelar cita', url: `${APP_URL}/cancelar-cita/{{8}}` },
      ],
    },
  },
}

const template24hConfirmedDev = {
  friendly_name: 'dev_cita_recordatorio_24h_confirmed_card_v2',
  language: 'es',
  variables: base24hVariables,
  types: {
    'whatsapp/card': {
      body:
        '*Recordatorio de cita · {{2}}*\n\n' +
        'Hola {{3}}, tu cita sigue *confirmada* para mañana:\n\n' +
        '📅 *Fecha:* {{4}}\n' +
        '🕐 *Hora:* {{5}}\n' +
        '📍 *Sede:* {{6}}\n' +
        '✂️ *Servicio:* {{7}}\n\n' +
        '⏳ Si necesitas hacer cambios, puedes reprogramar o cancelar durante los próximos *30 minutos*.',
      footer: 'Gestabiz · Tu gestor de citas',
      media: ['{{1}}'],
      actions: [
        { type: 'URL', title: 'Reprogramar', url: `${APP_URL}/reprogramar-cita/{{8}}` },
        { type: 'URL', title: 'Cancelar cita', url: `${APP_URL}/cancelar-cita/{{8}}` },
      ],
    },
  },
}

const template2hPendingDev = {
  friendly_name: 'dev_cita_recordatorio_2h_pending_card_v2',
  language: 'es',
  variables: base2hVariables,
  types: {
    'whatsapp/card': {
      body:
        '*Recordatorio de cita · {{2}}*\n\n' +
        'Hola {{3}}, tu cita es en *2 horas*:\n\n' +
        '🕐 *Hora:* {{4}}\n' +
        '📍 *Sede:* {{5}}\n' +
        '✂️ *Servicio:* {{6}}\n\n' +
        '⚠️ Solo puedes cancelar o reprogramar durante los *30 minutos* siguientes a este mensaje. ' +
        `Para reprogramar: ${DEV_APP_URL}/reprogramar-cita/{{7}}?src=wa2h_pending`,
      footer: 'Gestabiz · Tu gestor de citas',
      media: ['{{1}}'],
      actions: [
        { type: 'URL', title: 'Confirmar asistencia', url: `${APP_URL}/confirmar-cita/{{7}}` },
        { type: 'URL', title: 'Cancelar cita', url: `${APP_URL}/cancelar-cita/{{7}}` },
      ],
    },
  },
}

const template2hConfirmedDev = {
  friendly_name: 'dev_cita_recordatorio_2h_confirmed_card_v2',
  language: 'es',
  variables: base2hVariables,
  types: {
    'whatsapp/card': {
      body:
        '*Recordatorio de cita · {{2}}*\n\n' +
        'Hola {{3}}, tu cita sigue *confirmada* y es en *2 horas*:\n\n' +
        '🕐 *Hora:* {{4}}\n' +
        '📍 *Sede:* {{5}}\n' +
        '✂️ *Servicio:* {{6}}\n\n' +
        '⚠️ Solo puedes cancelar o reprogramar durante los *30 minutos* siguientes a este mensaje.',
      footer: 'Gestabiz · Tu gestor de citas',
      media: ['{{1}}'],
      actions: [
        { type: 'URL', title: 'Reprogramar', url: `${APP_URL}/reprogramar-cita/{{7}}` },
        { type: 'URL', title: 'Cancelar cita', url: `${APP_URL}/cancelar-cita/{{7}}` },
      ],
    },
  },
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function deleteContent(sid: string): Promise<void> {
  await fetch(`https://content.twilio.com/v1/Content/${sid}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader },
  })
}

async function main() {
  const args = process.argv.slice(2)
  const devOnly = args.includes('--dev-only')

  if (args.includes('--list')) {
    await listTemplates()
    return
  }

  // Opción: reenviar approval a un SID existente (--approve-sid HXxxx --name nombre)
  const approveSidIdx = args.indexOf('--approve-sid')
  if (approveSidIdx !== -1) {
    const sid = args[approveSidIdx + 1]
    const nameIdx = args.indexOf('--name')
    const name = nameIdx !== -1 ? args[nameIdx + 1] : sid
    console.log(`\n📤  Enviando approval para SID ${sid} (nombre: ${name})...`)
    const result = await submitForApproval(sid, name)
    console.log(`    Estado: ${result.status}`)
    return
  }

  console.log('\n🚀  Creando templates de WhatsApp en Twilio...\n')
  console.log(`    APP_URL: ${APP_URL}`)
  console.log(`    Account SID: ${ACCOUNT_SID!.substring(0, 8)}...\n`)

  const results: Array<{ name: string; sid?: string; status?: string; error?: string; envKey: string }> = []

  const templates = devOnly
    ? [
        { template: template24hPendingDev, envKey: 'TWILIO_TEMPLATE_SID_DEV_24H_PENDING' },
        { template: template24hConfirmedDev, envKey: 'TWILIO_TEMPLATE_SID_DEV_24H_CONFIRMED' },
        { template: template2hPendingDev, envKey: 'TWILIO_TEMPLATE_SID_DEV_2H_PENDING' },
        { template: template2hConfirmedDev, envKey: 'TWILIO_TEMPLATE_SID_DEV_2H_CONFIRMED' },
      ]
    : [
        { template: template24hPending, envKey: 'TWILIO_TEMPLATE_SID_24H_PENDING' },
        { template: template24hConfirmed, envKey: 'TWILIO_TEMPLATE_SID_24H_CONFIRMED' },
        { template: template2hPending, envKey: 'TWILIO_TEMPLATE_SID_2H_PENDING' },
        { template: template2hConfirmed, envKey: 'TWILIO_TEMPLATE_SID_2H_CONFIRMED' },
      ]

  for (const { template, envKey } of templates) {
    const name = template.friendly_name
    console.log(`📝  Creando template "${name}"...`)

    try {
      const content = await createContent(template)
      console.log(`    ✅  Creado.  SID: ${content.sid}`)

      console.log(`    📤  Enviando a aprobación de WhatsApp (categoría: UTILITY)...`)
      const approval = await submitForApproval(content.sid, name)
      console.log(`    ✅  Enviado.  Estado: ${approval.status}`)
      if (approval.rejection_reason) {
        console.warn(`    ⚠️   Motivo de rechazo: ${approval.rejection_reason}`)
      }

      results.push({ name, sid: content.sid, status: approval.status, envKey })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`    ❌  Error: ${msg}`)
      results.push({ name, error: msg, envKey })
    }

    console.log()
  }

  // Resumen final
  console.log('─────────────────────────────────────────────────────────────────')
  console.log('📋  Resumen\n')

  const successful = results.filter(r => r.sid)
  const failed    = results.filter(r => r.error)

  if (successful.length > 0) {
    console.log('✅  Templates creados. Agrega estos SIDs como secrets en Supabase:\n')
    for (const r of successful) {
      console.log(`    ${r.envKey}=${r.sid}`)
    }
    console.log()
    console.log('    npx supabase secrets set \\')
    for (const r of successful) {
      console.log(`      ${r.envKey}=${r.sid} \\`)
    }
    console.log()
  }

  if (failed.length > 0) {
    console.log('❌  Templates con error:\n')
    for (const r of failed) {
      console.log(`    ${r.name}: ${r.error}`)
    }
    console.log()
  }

  console.log('💡  La aprobación de Meta puede tardar entre minutos y 24 horas.')
  console.log('    Verifica el estado en: https://console.twilio.com/us1/develop/sms/content-template-builder\n')

  console.log('⚠️   PENDIENTE: crear la ruta /reprogramar-cita/:token en App.tsx')
  console.log('    Debe abrir el modal de detalle de la cita con la opción de modificación preseleccionada.\n')
}

main().catch(console.error)
