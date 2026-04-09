/**
 * send-renewal-reminder — Edge Function (cron: daily 09:00 UTC)
 *
 * Busca planes activos con auto_renew=true cuyo end_date vence en <= 2 días
 * y envía un recordatorio de renovación al owner del negocio via Brevo.
 * Crea una Preference de MercadoPago y enlaza el init_point en el correo.
 *
 * Variables requeridas:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   BREVO_API_KEY (o BREVO_SMTP_HOST/PORT/USER/PASSWORD como fallback)
 *   MERCADOPAGO_ACCESS_TOKEN
 *   APP_URL (default: https://gestabiz.com)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendBrevoEmail } from '../_shared/brevo.ts'

const PLAN_PRICES: Record<string, number> = {
  inicio: 89900,
  profesional: 159900,
  empresarial: 249900,
  // frontend aliases
  basico: 89900,
  pro: 159900,
}

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  inicio: 'Plan Básico',
  profesional: 'Plan Pro',
  empresarial: 'Plan Empresarial',
  basico: 'Plan Básico',
  pro: 'Plan Pro',
  free: 'Plan Gratis',
}

function getPlanPrice(planType: string): number {
  return PLAN_PRICES[planType] ?? 89900
}

function getPlanDisplayName(planType: string): string {
  return PLAN_DISPLAY_NAMES[planType] ?? planType
}

function buildRenewalEmailHtml(params: {
  ownerName: string
  planName: string
  planPrice: number
  endDate: string
  initPoint: string
}): string {
  const { ownerName, planName, planPrice, endDate, initPoint } = params
  const formattedPrice = planPrice.toLocaleString('es-CO')
  const formattedDate = new Date(endDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu plan Gestabiz se renueva en 2 dias</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f4fb; padding: 40px 20px; line-height: 1.6; }
    .wrapper { max-width: 600px; margin: 0 auto; }
    .header { background-color: #7C3AED; border-radius: 16px 16px 0 0; padding: 36px 32px 28px; text-align: center; }
    .logo-text { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; }
    .logo-gesta { color: #f0eeff; }
    .logo-biz { color: #3bbfa0; }
    .tagline { margin-top: 8px; font-size: 11px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: #3bbfa0; }
    .card { background: #ffffff; padding: 44px 40px 36px; }
    h1 { color: #1e293b; font-size: 24px; font-weight: 700; margin-bottom: 12px; text-align: center; line-height: 1.3; }
    .accent-line { width: 48px; height: 3px; background: linear-gradient(90deg, #7C3AED, #3bbfa0); border-radius: 2px; margin: 16px auto 28px; }
    .greeting { color: #475569; font-size: 15px; margin-bottom: 16px; }
    .message { color: #64748b; font-size: 15px; margin-bottom: 28px; line-height: 1.75; }
    .info-box { background: #f5f4fb; border: 1px solid #ede9f9; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ede9f9; font-size: 14px; }
    .info-row:last-child { border-bottom: none; padding-bottom: 0; }
    .info-label { color: #94a3b8; font-weight: 500; }
    .info-value { color: #1e293b; font-weight: 600; }
    .cta-container { text-align: center; margin: 36px 0 24px; }
    .cta-button { display: inline-block; background: #7C3AED; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 40px; border-radius: 10px; letter-spacing: 0.3px; }
    .alt-link-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 16px; }
    .alt-link-title { color: #475569; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
    .alt-link { color: #7C3AED; font-size: 12px; word-break: break-all; text-decoration: none; }
    .footer { background: #f0eeff; border-radius: 0 0 16px 16px; padding: 28px 32px; text-align: center; border-top: 1px solid #ede9f9; }
    .footer-text { color: #7c6fab; font-size: 12.5px; margin-bottom: 6px; line-height: 1.5; }
    .footer-link { color: #7C3AED; text-decoration: none; font-size: 12.5px; font-weight: 500; margin: 0 10px; }
    @media only screen and (max-width: 600px) {
      body { padding: 0; }
      .header { border-radius: 0; padding: 28px 20px; }
      .card { padding: 32px 20px; }
      .footer { border-radius: 0; padding: 22px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <a href="https://gestabiz.com" style="text-decoration:none;">
        <div class="logo-text">
          <span class="logo-gesta">Gesta</span><span class="logo-biz">biz</span>
        </div>
      </a>
      <p class="tagline">Agenda &middot; Gestiona &middot; Crece</p>
    </div>

    <div class="card">
      <h1>Tu plan se renueva en 2 dias</h1>
      <div class="accent-line"></div>

      <p class="greeting">Hola <strong>${ownerName}</strong>,</p>
      <p class="message">
        Te informamos que tu suscripcion a Gestabiz vence el <strong>${formattedDate}</strong>.
        Para continuar usando todas las funcionalidades sin interrupciones, realiza el pago de renovacion.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Plan</span>
          <span class="info-value">${planName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Monto</span>
          <span class="info-value">$${formattedPrice} COP/mes</span>
        </div>
        <div class="info-row">
          <span class="info-label">Vencimiento</span>
          <span class="info-value">${formattedDate}</span>
        </div>
      </div>

      <div class="cta-container">
        <a href="${initPoint}" class="cta-button">
          Renovar ahora
        </a>
      </div>

      <div class="alt-link-box">
        <p class="alt-link-title">El boton no funciona? Copia este enlace:</p>
        <a href="${initPoint}" class="alt-link">${initPoint}</a>
      </div>
    </div>

    <div class="footer">
      <p class="footer-text">&copy; 2026 Gestabiz &mdash; Todos los derechos reservados.</p>
      <p class="footer-text">Este es un mensaje automatico. No responder a este correo.</p>
      <div style="margin-top: 14px;">
        <a href="https://gestabiz.com" class="footer-link">Sitio web</a>
        <span style="color:#c4b8e8;">&bull;</span>
        <a href="https://gestabiz.com/support" class="footer-link">Soporte</a>
        <span style="color:#c4b8e8;">&bull;</span>
        <a href="https://gestabiz.com/privacy" class="footer-link">Privacidad</a>
      </div>
    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
  const appUrl = (Deno.env.get('APP_URL') ?? 'https://gestabiz.com').replace(/\/$/, '')

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!mpAccessToken) {
    return new Response(JSON.stringify({ error: 'MERCADOPAGO_ACCESS_TOKEN not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // ── 1. Find plans expiring within 2 days ──────────────────────────────────
  const now = new Date()
  const twodays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

  const { data: plans, error: plansError } = await supabase
    .from('business_plans')
    .select('id, business_id, plan_type, billing_cycle, end_date')
    .eq('status', 'active')
    .eq('auto_renew', true)
    .is('canceled_at', null)
    .gte('end_date', now.toISOString())
    .lte('end_date', twodays.toISOString())

  if (plansError) {
    return new Response(JSON.stringify({ error: plansError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!plans || plans.length === 0) {
    return new Response(JSON.stringify({ success: true, processed: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }


  let successCount = 0
  let errorCount = 0

  for (const plan of plans) {
    try {
      // ── 2. Get owner info ───────────────────────────────────────────────────
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('owner_id, name')
        .eq('id', plan.business_id)
        .single()

      if (bizError || !business) {
        errorCount++
        continue
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', business.owner_id)
        .single()

      if (profileError || !profile?.email) {
        errorCount++
        continue
      }

      const ownerEmail = profile.email
      const ownerName = profile.full_name ?? 'usuario'

      // ── 3. Create MercadoPago preference ────────────────────────────────────
      const planPrice = getPlanPrice(plan.plan_type)
      const planName = getPlanDisplayName(plan.plan_type)
      const billingCycle: string = plan.billing_cycle ?? 'monthly'

      const referenceCode = `${plan.business_id}::${plan.plan_type}::${billingCycle}`

      const preferencePayload = {
        items: [
          {
            title: `${planName} - ${billingCycle === 'monthly' ? 'Mensual' : 'Anual'} (Renovacion)`,
            description: `Renovacion de suscripcion ${billingCycle === 'monthly' ? 'mensual' : 'anual'} al ${planName}`,
            quantity: 1,
            unit_price: planPrice,
            currency_id: 'COP',
          },
        ],
        payer: {
          name: business.name ?? ownerName,
          email: ownerEmail,
        },
        back_urls: {
          success: `${appUrl}/app/admin/billing?payment=success`,
          failure: `${appUrl}/app/admin/billing?payment=failure`,
          pending: `${appUrl}/app/admin/billing?payment=pending`,
        },
        auto_return: 'approved',
        external_reference: referenceCode,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        statement_descriptor: 'GESTABIZ',
        metadata: {
          business_id: plan.business_id,
          plan_type: plan.plan_type,
          billing_cycle: billingCycle,
        },
      }

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferencePayload),
      })

      if (!mpResponse.ok) {
        const mpError = await mpResponse.text()
        errorCount++
        continue
      }

      const mpData = await mpResponse.json()
      const initPoint: string = mpData.init_point ?? ''

      // ── 4. Send email via Brevo ─────────────────────────────────────────────
      const emailHtml = buildRenewalEmailHtml({
        ownerName,
        planName,
        planPrice,
        endDate: plan.end_date,
        initPoint,
      })

      const brevoResult = await sendBrevoEmail({
        to: ownerEmail,
        subject: 'Tu plan Gestabiz se renueva en 2 dias',
        htmlBody: emailHtml,
        textBody: `Hola ${ownerName}, tu plan ${planName} vence pronto. Renueva en: ${initPoint}`,
        fromEmail: Deno.env.get('BREVO_SMTP_USER') ?? 'noreply@gestabiz.app',
        fromName: 'Gestabiz',
      })

      if (!brevoResult.success) {
        errorCount++
        continue
      }

      // ── 5. Log notification ─────────────────────────────────────────────────
      const { error: logError } = await supabase.from('notification_log').insert({
        business_id: plan.business_id,
        notification_type: 'billing_reminder',
        channel: 'email',
        recipient_contact: ownerEmail,
        status: 'sent',
        created_at: new Date().toISOString(),
      })

      if (logError) {
      }

      successCount++
    } catch (err) {
      errorCount++
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      processed: plans.length,
      sent: successCount,
      errors: errorCount,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
