import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

const MATIAS_API_BASE = {
  sandbox: 'https://apiv3.defontana.com/api',
  production: 'https://api.matias.io/v1',
}

const decryptField = (value: string, key: string): string => {
  const decoded = atob(value)
  return Array.from(decoded).map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreFlight(req)

  const corsHeaders = getCorsHeaders(req.headers.get('Origin') ?? '')

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const encKey = Deno.env.get('CERTIFICATE_ENCRYPTION_KEY') ?? 'gestabiz-dian-key-2026'

    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization') ?? ''
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const body = await req.json() as {
      businessId: string
      parentInvoiceId: string
      reason: '01' | '02' | '03' | '04'  // DIAN credit note reasons
      refundAmount: number
      notes?: string
    }

    const { businessId, parentInvoiceId, reason, refundAmount } = body

    if (!businessId || !parentInvoiceId) {
      return new Response(JSON.stringify({ error: 'businessId and parentInvoiceId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Fetch parent invoice — must be accepted
    const { data: parentInvoice } = await supabase
      .from('electronic_invoices')
      .select('*')
      .eq('id', parentInvoiceId)
      .eq('business_id', businessId)
      .single()

    if (!parentInvoice) {
      return new Response(JSON.stringify({ error: 'Factura original no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (parentInvoice.status !== 'accepted') {
      return new Response(JSON.stringify({ error: 'Solo se pueden anular facturas en estado Aceptada' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Idempotency: check if full-cancellation NC already exists
    const { data: existingNC } = await supabase
      .from('electronic_invoices')
      .select('id, status')
      .eq('parent_invoice_id', parentInvoiceId)
      .eq('document_type', 'credit_note')
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    if (existingNC) {
      return new Response(JSON.stringify({
        success: true,
        invoiceId: existingNC.id,
        status: existingNC.status,
        alreadyExists: true,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Fetch DIAN config
    const { data: software } = await supabase
      .from('business_dian_software')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_enrolled', true)
      .maybeSingle()

    if (!software) {
      return new Response(JSON.stringify({ error: 'El negocio no está habilitado para facturación electrónica' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { data: resolution } = await supabase
      .from('business_dian_resolution')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .maybeSingle()

    if (!resolution) {
      return new Response(JSON.stringify({ error: 'No hay resolución de numeración activa' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Reserve document number
    const { data: updatedRes, error: resUpdateError } = await supabase
      .from('business_dian_resolution')
      .update({ current_number: resolution.current_number + 1 })
      .eq('id', resolution.id)
      .eq('current_number', resolution.current_number)
      .select('current_number')
      .single()

    if (resUpdateError || !updatedRes) {
      return new Response(JSON.stringify({ error: 'Error al reservar número de nota crédito. Intenta de nuevo.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const documentNumber = resolution.current_number

    // Insert credit note record in pending state
    const { data: creditNote, error: insertError } = await supabase
      .from('electronic_invoices')
      .insert({
        business_id: businessId,
        appointment_id: parentInvoice.appointment_id,
        transaction_id: parentInvoice.transaction_id,
        client_id: parentInvoice.client_id,
        document_type: 'credit_note',
        document_number: documentNumber,
        prefix: resolution.prefix,
        parent_invoice_id: parentInvoiceId,
        credit_note_reason: reason,
        total_amount: refundAmount,
        status: 'pending',
        issued_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !creditNote) {
      return new Response(JSON.stringify({ error: 'Error al crear nota crédito: ' + insertError?.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Call Matias API for credit note
    const matiasToken = decryptField(software.matias_pat_token_encrypted, encKey)
    const matiasBase = MATIAS_API_BASE[software.environment as 'sandbox' | 'production']

    const parentDocNum = parentInvoice.prefix
      ? `${parentInvoice.prefix}${parentInvoice.document_number}`
      : String(parentInvoice.document_number)

    const ncDocNum = resolution.prefix
      ? `${resolution.prefix}${documentNumber}`
      : String(documentNumber)

    let matiasResponse: { cufe?: string; xml_url?: string; pdf_url?: string } = {}
    let apiError: string | null = null

    try {
      const apiRes = await fetch(`${matiasBase}/credit-notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${matiasToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_type: 'NC',
          document_number: ncDocNum,
          date: new Date().toISOString().split('T')[0],
          reason_code: reason,
          parent_invoice_number: parentDocNum,
          parent_cufe: parentInvoice.cufe,
          refund_amount: refundAmount,
          notes: body.notes ?? '',
        }),
        signal: AbortSignal.timeout(30000),
      })

      const responseText = await apiRes.text()
      if (apiRes.ok) {
        matiasResponse = JSON.parse(responseText)
      } else {
        apiError = `Matias API error ${apiRes.status}: ${responseText.slice(0, 200)}`
      }
    } catch (fetchErr) {
      apiError = `Error de red: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`
    }

    const newStatus = apiError ? 'rejected' : matiasResponse.cufe ? 'accepted' : 'pending'

    await supabase
      .from('electronic_invoices')
      .update({
        cufe: matiasResponse.cufe ?? null,
        xml_storage_path: matiasResponse.xml_url ?? null,
        pdf_storage_path: matiasResponse.pdf_url ?? null,
        status: newStatus,
        error_message: apiError,
        dian_response: matiasResponse,
      })
      .eq('id', creditNote.id)

    return new Response(JSON.stringify({
      success: !apiError,
      invoiceId: creditNote.id,
      status: newStatus,
      cufe: matiasResponse.cufe ?? null,
      error: apiError,
    }), {
      status: apiError ? 422 : 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (err) {
    console.error('emit-credit-note error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
