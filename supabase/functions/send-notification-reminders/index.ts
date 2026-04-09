import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('send-notification-reminders')

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(req)
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch pending notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*, appointments(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`)
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending notifications', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    let processed = 0
    let failed = 0
    const results = []

    for (const notification of notifications) {
      try {
        const appointment = notification.appointments
        let success = false

        switch (notification.delivery_method) {
          case 'email':
            if (appointment?.client_email) {
              const emailResponse = await supabase.functions.invoke('send-email', {
                body: {
                  to: appointment.client_email,
                  subject: notification.title,
                  message: notification.message,
                  template: notification.type,
                  appointmentData: appointment
                }
              })
              success = emailResponse.error === null
            }
            break

          case 'whatsapp':
            if (appointment?.client_whatsapp || appointment?.client_phone) {
              const whatsappResponse = await supabase.functions.invoke('send-whatsapp', {
                body: {
                  to: appointment.client_whatsapp || appointment.client_phone,
                  message: notification.message,
                  appointmentData: appointment
                }
              })
              success = whatsappResponse.error === null
            }
            break

          case 'push':
            const pushResponse = await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: notification.user_id,
                title: notification.title,
                body: notification.message,
                appointmentData: appointment
              }
            })
            success = pushResponse.error === null
            break

          case 'browser':
            // Browser notifications are handled client-side
            success = true
            break

          default:
        }

        // Update notification status
        if (success) {
          await supabase
            .from('notifications')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', notification.id)
          processed++
        } else {
          await supabase
            .from('notifications')
            .update({ status: 'failed' })
            .eq('id', notification.id)
          failed++
        }

        results.push({
          id: notification.id,
          type: notification.type,
          method: notification.delivery_method,
          status: success ? 'sent' : 'failed'
        })
      } catch (notificationError) {
        captureEdgeFunctionError(notificationError as Error, { functionName: 'send-notification-reminders', notificationId: notification.id })

        await supabase
          .from('notifications')
          .update({ status: 'failed' })
          .eq('id', notification.id)

        failed++
        results.push({
          id: notification.id,
          type: notification.type,
          method: notification.delivery_method,
          status: 'failed',
          error: (notificationError as Error).message
        })
      }
    }

    await flushSentry()
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processed + failed} notifications`,
        processed,
        failed,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    captureEdgeFunctionError(error as Error, { functionName: 'send-notification-reminders' })
    await flushSentry()
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
