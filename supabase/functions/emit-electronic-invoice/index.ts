import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

const MATIAS_API_BASE = {
  sandbox: 'https://apiv3.defontana.com/api',
  production: 'https://api.matias.io/v1',
}

// 5 UVT tope para POS (UVT 2026 = $47,065 COP)
const POS_MAX_COP = 5 * 47065

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

    // Auth
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
      appointmentId?: string
      transactionId?: string
      clientId?: string
      // Client fiscal data (optional — fallback to Consumidor Final)
      clientName?: string
      clientDocType?: string
      clientDocNumber?: string
      clientEmail?: string
      // Line items
      items: Array<{ description: string; quantity: number; unitPrice: number; taxRate?: number }>
      subtotal: number
      taxAmount: number
      total: number
      notes?: string
    }

    const { businessId, appointmentId, transactionId } = body

    if (!businessId) {
      return new Response(JSON.stringify({ error: 'businessId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Idempotency: check if invoice already exists for this appointment/transaction
    const idempotencyQuery = supabase.from('electronic_invoices').select('id, status, cufe')
    if (appointmentId) idempotencyQuery.eq('appointment_id', appointmentId)
    else if (transactionId) idempotencyQuery.eq('transaction_id', transactionId)

    const { data: existing } = await idempotencyQuery
      .eq('business_id', businessId)
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        invoiceId: existing.id,
        status: existing.status,
        cufe: existing.cufe,
        alreadyExists: true,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Fetch business DIAN config
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

    // Fetch active resolution
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

    if (new Date(resolution.valid_to) < new Date()) {
      return new Response(JSON.stringify({ error: 'La resolución de numeración ha vencido. Renueva tu autorización ante la DIAN.' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (resolution.current_number > resolution.to_number) {
      return new Response(JSON.stringify({ error: 'Se agotó el rango de numeración. Solicita una nueva resolución ante la DIAN.' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Determine document type: POS if total <= 5 UVT, invoice otherwise
    const documentType = body.total <= POS_MAX_COP ? 'pos' : 'invoice'

    // Fetch business info
    const { data: business } = await supabase
      .from('businesses')
      .select('name, tax_id, legal_name, address, city, email, phone')
      .eq('id', businessId)
      .single()

    // Client data — fallback to Consumidor Final (DIAN code)
    const clientName = body.clientName || 'Consumidor Final'
    const clientDocType = body.clientDocType || 'CC'
    const clientDocNumber = body.clientDocNumber || '222222222222'

    // Decrypt PAT token
    const matiasToken = decryptField(software.matias_pat_token_encrypted, encKey)
    const matiasBase = MATIAS_API_BASE[software.environment as 'sandbox' | 'production']

    // Reserve document number (pessimistic lock via DB)
    const { data: updatedRes, error: resUpdateError } = await supabase
      .from('business_dian_resolution')
      .update({ current_number: resolution.current_number + 1 })
      .eq('id', resolution.id)
      .eq('current_number', resolution.current_number) // optimistic lock
      .select('current_number')
      .single()

    if (resUpdateError || !updatedRes) {
      return new Response(JSON.stringify({ error: 'Error al reservar número de factura (conflicto). Intenta de nuevo.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const documentNumber = resolution.current_number
    const fullDocNumber = resolution.prefix
      ? `${resolution.prefix}${documentNumber}`
      : String(documentNumber)

    // Insert invoice record in pending state
    const { data: invoice, error: insertError } = await supabase
      .from('electronic_invoices')
      .insert({
        business_id: businessId,
        appointment_id: appointmentId ?? null,
        transaction_id: transactionId ?? null,
        client_id: body.clientId ?? null,
        document_type: documentType,
        document_number: documentNumber,
        prefix: resolution.prefix,
        total_amount: body.total,
        status: 'pending',
        issued_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !invoice) {
      return new Response(JSON.stringify({ error: 'Error al crear registro de factura: ' + insertError?.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Build Matias API payload
    const matiasPayload = {
      document_type: documentType === 'pos' ? 'DS' : 'FV', // DS=Documento POS, FV=Factura de Venta
      document_number: fullDocNumber,
      date: new Date().toISOString().split('T')[0],
      seller: {
        nit: business?.tax_id?.replace('-', '') ?? '',
        name: business?.legal_name ?? business?.name ?? '',
        address: business?.address ?? '',
        email: business?.email ?? '',
        phone: business?.phone ?? '',
      },
      buyer: {
        name: clientName,
        document_type: clientDocType,
        document_number: clientDocNumber,
        email: body.clientEmail ?? '',
      },
      items: body.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate ?? 0,
      })),
      subtotal: body.subtotal,
      tax: body.taxAmount,
      total: body.total,
      notes: body.notes ?? '',
      resolution: {
        number: resolution.resolution_number,
        prefix: resolution.prefix ?? '',
        technical_key: decryptField(resolution.technical_key_encrypted, encKey),
        valid_from: resolution.valid_from,
        valid_to: resolution.valid_to,
      },
    }

    // Call Matias API
    let matiasResponse: { cufe?: string; cude?: string; xml_url?: string; pdf_url?: string; status?: string } = {}
    let apiError: string | null = null

    try {
      const apiRes = await fetch(`${matiasBase}/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${matiasToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matiasPayload),
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

    // Update invoice record with result
    const newStatus = apiError ? 'rejected' : (matiasResponse.cufe || matiasResponse.cude) ? 'accepted' : 'pending'

    await supabase
      .from('electronic_invoices')
      .update({
        cufe: matiasResponse.cufe ?? null,
        cude: matiasResponse.cude ?? null,
        xml_storage_path: matiasResponse.xml_url ?? null,
        pdf_storage_path: matiasResponse.pdf_url ?? null,
        status: newStatus,
        dian_response: matiasResponse,
        error_message: apiError,
      })
      .eq('id', invoice.id)

    return new Response(JSON.stringify({
      success: !apiError,
      invoiceId: invoice.id,
      status: newStatus,
      cufe: matiasResponse.cufe ?? null,
      error: apiError,
    }), {
      status: apiError ? 422 : 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (err) {
    console.error('emit-electronic-invoice error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
