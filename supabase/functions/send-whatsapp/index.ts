import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

// Valida formato E.164: + seguido de 7-15 dígitos
const E164_REGEX = /^\+[1-9]\d{6,14}$/

function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '')
  return E164_REGEX.test(cleaned) && cleaned.length <= 16
}

interface WhatsAppRequest {
  to: string
  message: string
  appointmentData?: any
}

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight

  const corsHeaders = getCorsHeaders(req)

  try {
    const { to, message, appointmentData }: WhatsAppRequest = await req.json()

    // ─── VALIDAR NÚMERO DE TELÉFONO ────────────────────────────────────────────
    if (!to || typeof to !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!validatePhone(to)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid phone number format (E.164 required, e.g. +573001234567)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Limitar longitud del mensaje
    if (message && message.length > 4096) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message too long (max 4096 characters)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Supabase client para resolver ciudad/ubicación
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = (supabaseUrl && supabaseServiceKey)
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null

    // WhatsApp Business API configuration
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
    
    if (!whatsappToken || !whatsappPhoneNumberId) {
      throw new Error('WhatsApp API not configured')
    }

    // Normalizar número (ya validado en E.164)
    const cleanedPhone = to.replace(/[\s\-().]/g, '')
    
    // Build WhatsApp message
    let whatsappMessage = message
    
    if (appointmentData) {
      const isUUID = (s?: string) => !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s).trim())
      const resolveCityName = async (cityOrUuid?: string): Promise<string | undefined> => {
        const candidate = (cityOrUuid || '').trim()
        if (!candidate) return undefined
        if (!isUUID(candidate)) return candidate
        try {
          if (!supabase) return candidate
          const { data: cityRow } = await supabase
            .from('cities')
            .select('name')
            .eq('id', candidate)
            .single()
          return cityRow?.name || candidate
        } catch (_) {
          return candidate
        }
      }

      let locationName: string | undefined = appointmentData.location_name || appointmentData.location
      let address: string | undefined = appointmentData.location_address || appointmentData.address
      let city: string | undefined = appointmentData.location_city || appointmentData.city

      const locationId: string | undefined = appointmentData.location_id || appointmentData.location?.id
      if (supabase && locationId) {
        try {
          const { data: loc } = await supabase
            .from('locations')
            .select('name,address,city')
            .eq('id', locationId)
            .single()
          locationName = locationName || loc?.name
          address = address || loc?.address
          city = city || loc?.city
        } catch (_) {}
      }

      if (address && /,\s*[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(address)) {
        const match = address.match(/^(.*?),\s*([0-9a-f-]{36})$/i)
        if (match) {
          address = match[1]
          city = city || match[2]
        }
      }
      city = await resolveCityName(city)
      const addressLine = address ? `${address}${city ? `, ${city}` : ''}` : undefined

      whatsappMessage = `
🗓️ *Recordatorio de Cita*

👋 Hola ${appointmentData.client_name},

Tienes una cita programada:

📅 *Fecha:* ${new Date(appointmentData.start_time).toLocaleDateString('es-ES')}
🕐 *Hora:* ${new Date(appointmentData.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
📍 *Lugar:* ${locationName || 'Por confirmar'}
${addressLine ? `📍 *Dirección:* ${addressLine}` : ''}
📝 *Servicio:* ${appointmentData.title}

${appointmentData.notes ? `📋 *Notas:* ${appointmentData.notes}` : ''}

¡Te esperamos! 😊

Si necesitas cancelar o reprogramar, por favor responde a este mensaje.
      `.trim()
    }

    // Send WhatsApp message using WhatsApp Business API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanedPhone,
          type: 'text',
          text: {
            body: whatsappMessage
          }
        }),
      }
    )

    if (!whatsappResponse.ok) {
      const error = await whatsappResponse.text()
      throw new Error(`Failed to send WhatsApp message: ${error}`)
    }

    const whatsappResult = await whatsappResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: whatsappResult.messages?.[0]?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        fallback: 'Message logged for manual follow-up'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
