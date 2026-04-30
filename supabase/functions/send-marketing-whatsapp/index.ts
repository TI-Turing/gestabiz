import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

initSentry('send-marketing-whatsapp')

const MAX_RECIPIENTS = 50

interface Recipient {
  phone: string
  name: string
}

interface SendMarketingWhatsAppRequest {
  businessId: string
  assetPath: string
  recipients: Recipient[]
  caption?: string
}

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight

  const corsHeaders = getCorsHeaders(req)

  try {
    // ── AUTH: verificar JWT del caller ──────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    let body: SendMarketingWhatsAppRequest
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { businessId, assetPath, recipients, caption } = body

    // ── VALIDACIONES ────────────────────────────────────────────────────────
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

    if (recipients.length > MAX_RECIPIENTS) {
      return new Response(
        JSON.stringify({ success: false, error: `Máximo ${MAX_RECIPIENTS} destinatarios por envío` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar que el caller es admin u owner del negocio
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

    // Verificar pertenencia: owner OR admin
    const { data: bizData } = await supabaseAdmin
      .from('businesses')
      .select('owner_id')
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

    // ── GENERAR URL FIRMADA (7 días) ─────────────────────────────────────────
    const { data: signedData, error: signErr } = await supabaseAdmin.storage
      .from('business-marketing-vault')
      .createSignedUrl(assetPath, 604800)

    if (signErr || !signedData?.signedUrl) {
      throw new Error('No se pudo generar URL firmada del archivo')
    }

    const mediaUrl = signedData.signedUrl

    // Detectar tipo de media por extensión
    const ext = assetPath.split('.').pop()?.toLowerCase() ?? ''
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const videoExts = ['mp4', 'webm']
    const docExts = ['pdf']

    let mediaType: 'image' | 'video' | 'document'
    if (imageExts.includes(ext)) mediaType = 'image'
    else if (videoExts.includes(ext)) mediaType = 'video'
    else if (docExts.includes(ext)) mediaType = 'document'
    else mediaType = 'document'

    // ── WHATSAPP API ─────────────────────────────────────────────────────────
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    if (!whatsappToken || !phoneNumberId) {
      throw new Error('WhatsApp API no configurada')
    }

    const results: { phone: string; success: boolean; error?: string }[] = []

    for (const recipient of recipients) {
      // Validar teléfono
      const cleanPhone = recipient.phone.replace(/[\s\-().]/g, '')
      if (!PHONE_REGEX.test(cleanPhone)) {
        results.push({ phone: recipient.phone, success: false, error: 'Número inválido' })
        continue
      }

      const messageBody: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
          ...(caption ? { caption: caption.substring(0, 1024) } : {}),
        },
      }

      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${whatsappToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageBody),
          }
        )

        if (!response.ok) {
          const errText = await response.text()
          results.push({ phone: cleanPhone, success: false, error: errText })
        } else {
          results.push({ phone: cleanPhone, success: true })
        }
      } catch (sendErr: unknown) {
        const msg = sendErr instanceof Error ? sendErr.message : 'Error desconocido'
        results.push({ phone: cleanPhone, success: false, error: msg })
      }
    }

    const successCount = results.filter(r => r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: recipients.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    captureEdgeFunctionError(error as Error, { functionName: 'send-marketing-whatsapp' })
    await flushSentry()
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
