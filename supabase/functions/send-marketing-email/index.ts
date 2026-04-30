import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

initSentry('send-marketing-email')

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

interface EmailRecipient {
  email: string
  name: string
}

interface SendMarketingEmailRequest {
  businessId: string
  assetPath: string
  recipients: EmailRecipient[]
  subject: string
  body: string
}

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight

  const corsHeaders = getCorsHeaders(req)

  try {
    // ── AUTH ─────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    let body: SendMarketingEmailRequest
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { businessId, assetPath, recipients, subject, body: emailBody } = body

    // ── VALIDACIONES ─────────────────────────────────────────────────────────
    if (!businessId || typeof businessId !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'businessId requerido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!assetPath || typeof assetPath !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'assetPath requerido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Se requiere al menos un destinatario' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Asunto requerido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const sanitizedSubject = subject.replace(/[\r\n]/g, ' ').trim().substring(0, 500)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // ── VERIFICAR AUTH DEL CALLER ─────────────────────────────────────────────
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const callerSupabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user: callerUser }, error: userErr } = await callerSupabase.auth.getUser()
    if (userErr || !callerUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verificar owner o admin
    const { data: bizData } = await supabaseAdmin
      .from('businesses')
      .select('owner_id, name, logo_url')
      .eq('id', businessId)
      .single()

    const isOwner = bizData?.owner_id === callerUser.id

    if (!isOwner) {
      const { data: roleData } = await supabaseAdmin
        .from('business_roles')
        .select('role')
        .eq('business_id', businessId)
        .eq('user_id', callerUser.id)
        .single()

      if (!roleData || roleData.role !== 'admin') {
        return new Response(
          JSON.stringify({ success: false, error: 'No tienes permisos para este negocio' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
    }

    // ── GENERAR URL FIRMADA (7 días) ──────────────────────────────────────────
    const { data: signedData, error: signErr } = await supabaseAdmin.storage
      .from('business-marketing-vault')
      .createSignedUrl(assetPath, 604800)

    if (signErr || !signedData?.signedUrl) {
      throw new Error('No se pudo generar URL firmada del archivo')
    }

    const assetUrl = signedData.signedUrl
    const ext = assetPath.split('.').pop()?.toLowerCase() ?? ''
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const isImage = imageExts.includes(ext)
    const fileName = assetPath.split('/').pop() ?? 'archivo'

    const businessName = bizData?.name ?? 'Tu negocio'
    const logoUrl: string | undefined = bizData?.logo_url ?? undefined

    // ── CONSTRUIR HTML ─────────────────────────────────────────────────────────
    const assetBlock = isImage
      ? `<div style="text-align:center;margin:24px 0;">
           <img src="${assetUrl}" alt="${fileName}" style="max-width:600px;width:100%;border-radius:8px;" />
         </div>`
      : `<div style="text-align:center;margin:24px 0;">
           <a href="${assetUrl}" target="_blank" rel="noopener noreferrer"
              style="display:inline-block;padding:12px 24px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">
             Descargar ${fileName}
           </a>
         </div>`

    const bodyHtml = emailBody
      ? `<p style="font-size:15px;line-height:1.6;color:#374151;">${emailBody.replace(/\n/g, '<br>')}</p>`
      : ''

    const footerLogoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${businessName}" style="height:36px;width:auto;margin-bottom:6px;border-radius:4px;" /><br>`
      : ''

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:32px 40px 0;">
              <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 16px;">${sanitizedSubject}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              ${assetBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px;border-top:1px solid #f3f4f6;margin-top:24px;">
              <div style="text-align:center;">
                ${footerLogoHtml}
                <p style="font-size:13px;color:#9ca3af;margin:0;">
                  ${businessName} · Gestionado con <strong style="color:#6366f1;">Gestabiz</strong>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    // ── ENVIAR VÍA BREVO ──────────────────────────────────────────────────────
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY no configurada')
    }

    const validRecipients = recipients.filter(r =>
      r.email && EMAIL_REGEX.test(r.email) && r.email.length <= 254
    )

    if (validRecipients.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ningún destinatario tiene email válido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const brevoPayload = {
      sender: { name: businessName, email: 'no-reply@gestabiz.com' },
      to: validRecipients.map(r => ({
        email: r.email.replace(/[\r\n]/g, '').trim(),
        name: r.name.replace(/[\r\n]/g, ' ').trim().substring(0, 100),
      })),
      subject: sanitizedSubject,
      htmlContent,
    }

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brevoPayload),
    })

    if (!brevoResponse.ok) {
      const errText = await brevoResponse.text()
      throw new Error(`Brevo error: ${errText}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: validRecipients.length,
        total: recipients.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    captureEdgeFunctionError(error as Error, { functionName: 'send-marketing-email' })
    await flushSentry()
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
