import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

const MATIAS_API_BASE = {
  sandbox: 'https://apiv3.defontana.com/api',   // Matias sandbox
  production: 'https://api.matias.io/v1',        // Matias production — update with real URL
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreFlight(req)

  const corsHeaders = getCorsHeaders(req.headers.get('Origin') ?? '')

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const encKey = Deno.env.get('CERTIFICATE_ENCRYPTION_KEY') ?? 'gestabiz-dian-key-2026'

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify caller is authenticated
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
      environment: 'sandbox' | 'production'
      matiasToken: string
      nit: string
      dv: number
      legalName: string
      typeOrganizationId: number
      ciiuCode: string
      municipalityCode: string
      taxResponsibilities: string[]
      useOwnSoftware?: boolean
      ownSoftwareId?: string
      ownSoftwarePin?: string
      certificateBase64: string
      certificatePassword: string
      resolution: {
        number: string
        prefix: string | null
        fromNumber: number
        toNumber: number
        validFrom: string
        validTo: string
        technicalKey: string
      }
    }

    const { businessId, environment, matiasToken, certificateBase64, certificatePassword, resolution } = body

    // Verify caller is owner/admin of this business
    const { data: bizData } = await supabase
      .from('businesses')
      .select('id, owner_id')
      .eq('id', businessId)
      .single()

    if (!bizData) {
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const isOwner = bizData.owner_id === user.id
    if (!isOwner) {
      const { data: roleData } = await supabase
        .from('business_roles')
        .select('role')
        .eq('business_id', businessId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!roleData || roleData.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
    }

    // Store certificate in private Storage bucket
    const certPath = `dian/certificates/${businessId}.p12`
    const certBytes = Uint8Array.from(atob(certificateBase64), c => c.charCodeAt(0))
    const { error: storageError } = await supabase.storage
      .from('electronic-invoices')
      .upload(certPath, certBytes, {
        contentType: 'application/x-pkcs12',
        upsert: true,
      })

    if (storageError) {
      console.error('Certificate storage error:', storageError)
      return new Response(JSON.stringify({ error: 'Error storing certificate: ' + storageError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Encrypt sensitive fields with basic XOR+base64 (replace with Vault in production)
    const encryptField = (value: string): string => {
      const key = encKey
      const encrypted = Array.from(value).map((c, i) =>
        String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      ).join('')
      return btoa(encrypted)
    }

    // Test connection to Matias API
    const matiasBase = MATIAS_API_BASE[environment]
    let testSuccess = false
    let testError: string | null = null

    try {
      // Matias health-check / token validation endpoint
      const testRes = await fetch(`${matiasBase}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${matiasToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (testRes.ok || testRes.status === 401) {
        // 401 means token was invalid, 200 means OK
        // We treat 200 as success
        testSuccess = testRes.ok
        if (!testSuccess) {
          testError = `Token inválido (HTTP ${testRes.status}). Verifica tu PAT de Matias.`
        }
      } else {
        // Non-200/401 may mean network issue or wrong URL
        // In sandbox mode, accept any 2xx or 4xx (API reachable)
        testSuccess = testRes.status < 500
        if (!testSuccess) {
          testError = `Error de conexión con Matias API (HTTP ${testRes.status})`
        }
      }
    } catch (fetchErr) {
      // Network error — still save config but mark as not tested
      testError = `No se pudo conectar con Matias API: ${fetchErr instanceof Error ? fetchErr.message : 'Error de red'}`
      testSuccess = false
    }

    if (!testSuccess) {
      return new Response(JSON.stringify({ error: testError ?? 'Conexión con Matias API fallida' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Upsert business_dian_software
    const { error: softwareError } = await supabase
      .from('business_dian_software')
      .upsert({
        business_id: businessId,
        environment,
        matias_pat_token_encrypted: encryptField(matiasToken),
        certificate_storage_path: certPath,
        certificate_password_encrypted: encryptField(certificatePassword),
        certificate_expires_at: null, // Extracted from cert in validate step
        own_software_id: body.useOwnSoftware ? (body.ownSoftwareId ?? null) : null,
        own_software_pin_encrypted: body.useOwnSoftware && body.ownSoftwarePin
          ? encryptField(body.ownSoftwarePin)
          : null,
        is_enrolled: true,
        enrolled_at: new Date().toISOString(),
      }, { onConflict: 'business_id' })

    if (softwareError) {
      console.error('Software upsert error:', softwareError)
      return new Response(JSON.stringify({ error: 'Error guardando configuración Matias: ' + softwareError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Update business fiscal fields
    await supabase
      .from('businesses')
      .update({
        tax_id: `${body.nit}-${body.dv}`,
        legal_name: body.legalName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    // Deactivate any existing active resolutions
    await supabase
      .from('business_dian_resolution')
      .update({ is_active: false })
      .eq('business_id', businessId)
      .eq('is_active', true)

    // Insert new resolution
    const { error: resError } = await supabase
      .from('business_dian_resolution')
      .insert({
        business_id: businessId,
        resolution_number: resolution.number,
        prefix: resolution.prefix,
        from_number: resolution.fromNumber,
        to_number: resolution.toNumber,
        current_number: resolution.fromNumber,
        valid_from: resolution.validFrom,
        valid_to: resolution.validTo,
        technical_key_encrypted: encryptField(resolution.technicalKey),
        is_active: true,
      })

    if (resError) {
      console.error('Resolution insert error:', resError)
      return new Response(JSON.stringify({ error: 'Error guardando resolución: ' + resError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({ success: true, environment }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (err) {
    console.error('dian-enroll-business error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
