// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

interface NotificationPayload {
  type: 'INSERT'
  table: string
  schema: string
  record: {
    id: string
    user_id: string
    type: string
    title: string
    message: string
    data: Record<string, any>
    created_at: string
  }
  old_record: null
}

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405, 
        headers: corsHeaders 
      })
    }

    // Obtener payload del trigger de Supabase
    const payload: NotificationPayload = await req.json()

    // Solo procesar notificaciones de tipo 'business_unconfigured'
    if (payload.record.type !== 'business_unconfigured') {
      return new Response(JSON.stringify({ 
        message: 'Notification type not supported', 
        type: payload.record.type 
      }), { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Inicializar cliente de Supabase
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(url, serviceKey)

    const businessId = payload.record.data?.business_id

    if (!businessId) {
      return new Response(JSON.stringify({ error: 'Missing business_id in notification data' }), { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Obtener información del negocio y owner
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('name, owner_id, profiles:owner_id(email, full_name)')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      console.error('Error fetching business:', businessError)
      return new Response(JSON.stringify({ error: 'Business not found' }), { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    const ownerEmail = (business as any).profiles?.email
    const ownerName = (business as any).profiles?.full_name || 'Estimado usuario'
    const businessName = business.name

    if (!ownerEmail) {
      console.error('Owner email not found for business:', businessId)
      return new Response(JSON.stringify({ error: 'Owner email not found' }), { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    // Obtener detalles de qué falta
    const { data: locations } = await supabase
      .from('locations')
      .select('id')
      .eq('business_id', businessId)
      .eq('is_active', true)

    const { data: services } = await supabase
      .from('services')
      .select('id')
      .eq('business_id', businessId)
      .eq('is_active', true)

    const { data: employees } = await supabase
      .from('business_employees')
      .select('id')
      .eq('business_id', businessId)
      .eq('is_active', true)

    const hasLocations = (locations || []).length > 0
    const hasServices = (services || []).length > 0
    const hasEmployees = (employees || []).length > 0

    const missingItems = []
    if (!hasLocations) missingItems.push('sedes activas')
    if (!hasServices) missingItems.push('servicios activos')
    if (!hasEmployees) missingItems.push('empleados/recursos activos asignados')

    const missingText = missingItems.length > 0 
      ? missingItems.join(', ') 
      : 'configuración completa (sedes, servicios, empleados)'

    // Enviar email usando Brevo SMTP
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')!
    const supportEmail = Deno.env.get('SUPPORT_EMAIL') || 'soporte@gestabiz.com'

    const emailBody = {
      sender: { 
        name: 'Gestabiz', 
        email: supportEmail 
      },
      to: [{ 
        email: ownerEmail, 
        name: ownerName 
      }],
      subject: `⚠️ Tu negocio "${businessName}" ya no está disponible al público`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Gestabiz</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #dc2626; margin-top: 0;">🔴 Negocio no disponible al público</h2>
            
            <p>Hola <strong>${ownerName}</strong>,</p>
            
            <p>Te informamos que tu negocio <strong>"${businessName}"</strong> ha sido marcado como <strong>no disponible al público</strong>.</p>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-weight: bold;">⚠️ ¿Por qué pasó esto?</p>
              <p style="margin: 10px 0 0 0;">Tu negocio no está visible para los clientes porque falta lo siguiente:</p>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>${missingText}</li>
              </ul>
            </div>
            
            <h3 style="color: #667eea;">✅ ¿Qué debes hacer?</h3>
            <ol style="padding-left: 20px;">
              <li><strong>Agrega sedes activas</strong> con dirección y horarios de atención</li>
              <li><strong>Crea servicios</strong> y asígnalos a las sedes</li>
              <li><strong>Vincula empleados o recursos físicos</strong> a los servicios</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://gestabiz.com/app/admin/overview" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Ir a mi Dashboard
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Una vez que completes la configuración, tu negocio volverá a estar visible automáticamente para tus clientes.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Si necesitas ayuda, contáctanos en <a href="mailto:${supportEmail}" style="color: #667eea;">${supportEmail}</a>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Gestabiz. Todos los derechos reservados.</p>
          </div>
        </body>
        </html>
      `,
    }

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify(emailBody),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Brevo API error:', errorText)
      return new Response(JSON.stringify({ 
        error: 'Failed to send email', 
        details: errorText 
      }), { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    const emailResult = await emailResponse.json()

    console.log('Email sent successfully:', {
      businessId,
      businessName,
      ownerEmail,
      messageId: emailResult.messageId,
    })

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email notification sent',
      businessId,
      ownerEmail,
    }), { 
      status: 200, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Error in notify-business-unconfigured:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500, 
      headers: { 
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } 
    })
  }
})
