import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

// Matias sends a webhook when DIAN accepts or rejects a document
// Body shape (adapt to actual Matias webhook format):
// { invoice_id: <our internal ID>, cufe?: string, cude?: string, status: 'accepted'|'rejected', xml_url?: string, pdf_url?: string, error?: string }

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreFlight(req)

  const corsHeaders = getCorsHeaders(req.headers.get('Origin') ?? '')

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const webhookSecret = Deno.env.get('MATIAS_WEBHOOK_SECRET') ?? ''

    // Verify webhook signature if configured
    if (webhookSecret) {
      const signature = req.headers.get('X-Matias-Signature') ?? ''
      if (signature !== webhookSecret) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json() as {
      invoice_id: string        // Our electronic_invoices.id
      cufe?: string
      cude?: string
      status: 'accepted' | 'rejected'
      xml_url?: string
      pdf_url?: string
      error?: string
    }

    if (!body.invoice_id) {
      return new Response(JSON.stringify({ error: 'invoice_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Fetch current invoice to verify it exists and is still pending
    const { data: invoice } = await supabase
      .from('electronic_invoices')
      .select('id, status, business_id')
      .eq('id', body.invoice_id)
      .single()

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Only update if still in pending state (idempotent)
    if (invoice.status !== 'pending') {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const newStatus = body.status === 'accepted' ? 'accepted' : 'rejected'

    await supabase
      .from('electronic_invoices')
      .update({
        status: newStatus,
        cufe: body.cufe ?? null,
        cude: body.cude ?? null,
        xml_storage_path: body.xml_url ?? null,
        pdf_storage_path: body.pdf_url ?? null,
        error_message: body.error ?? null,
        dian_response: body,
      })
      .eq('id', body.invoice_id)

    // If rejected, create in-app notification for business admin
    if (newStatus === 'rejected') {
      await supabase
        .from('in_app_notifications')
        .insert({
          type: 'electronic_invoice_rejected',
          business_id: invoice.business_id,
          data: {
            invoice_id: body.invoice_id,
            error: body.error ?? 'La DIAN rechazó el documento',
          },
          priority: 1,
        })
    }

    return new Response(JSON.stringify({ ok: true, invoiceId: body.invoice_id, status: newStatus }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (err) {
    console.error('matias-webhook error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
