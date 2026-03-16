import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight

  const corsHeaders = getCorsHeaders(req)

  console.log('[create-test-users] Function called')

  try {
    // ─── AUTENTICACIÓN: requiere clave de administrador ──────────────────────
    const adminSecret = req.headers.get('x-admin-secret')
    const expectedSecret = Deno.env.get('CREATE_TEST_USERS_SECRET')

    if (!expectedSecret) {
      // Si no hay secret configurado, la función está deshabilitada
      return new Response(
        JSON.stringify({ error: 'This endpoint is disabled in this environment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    if (!adminSecret || adminSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid admin secret' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verificar variables de entorno
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Cliente admin para crear usuarios
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const testUsers = [
      // Admins (10)
      { email: 'maria.rodriguez@example.com', name: 'María Rodríguez', phone: '+52 55 1234 5678', role: 'admin' },
      { email: 'carlos.garcia@example.com', name: 'Carlos García', phone: '+52 33 2345 6789', role: 'admin' },
      { email: 'ana.martinez@example.com', name: 'Ana Martínez', phone: '+52 81 3456 7890', role: 'admin' },
      { email: 'luis.hernandez@example.com', name: 'Luis Hernández', phone: '+52 55 4567 8901', role: 'admin' },
      { email: 'sofia.lopez@example.com', name: 'Sofía López', phone: '+52 33 5678 9012', role: 'admin' },
      { email: 'diego.morales@example.com', name: 'Diego Morales', phone: '+52 81 6789 0123', role: 'admin' },
      { email: 'valeria.cruz@example.com', name: 'Valeria Cruz', phone: '+52 55 7890 1234', role: 'admin' },
      { email: 'ricardo.jimenez@example.com', name: 'Ricardo Jiménez', phone: '+52 33 8901 2345', role: 'admin' },
      { email: 'camila.ruiz@example.com', name: 'Camila Ruiz', phone: '+52 81 9012 3456', role: 'admin' },
      { email: 'fernando.castillo@example.com', name: 'Fernando Castillo', phone: '+52 55 0123 4567', role: 'admin' },
      
      // Empleados (10)
      { email: 'elena.vargas@example.com', name: 'Elena Vargas', phone: '+52 33 1111 2222', role: 'employee' },
      { email: 'pablo.soto@example.com', name: 'Pablo Soto', phone: '+52 81 3333 4444', role: 'employee' },
      { email: 'natalia.reyes@example.com', name: 'Natalia Reyes', phone: '+52 55 5555 6666', role: 'employee' },
      { email: 'andres.torres@example.com', name: 'Andrés Torres', phone: '+52 33 7777 8888', role: 'employee' },
      { email: 'isabella.mendez@example.com', name: 'Isabella Méndez', phone: '+52 81 9999 0000', role: 'employee' },
      { email: 'miguel.romero@example.com', name: 'Miguel Romero', phone: '+52 55 1212 3434', role: 'employee' },
      { email: 'adriana.silva@example.com', name: 'Adriana Silva', phone: '+52 33 5656 7878', role: 'employee' },
      { email: 'javier.paredes@example.com', name: 'Javier Paredes', phone: '+52 81 9090 1212', role: 'employee' },
      { email: 'larissa.gutierrez@example.com', name: 'Larissa Gutiérrez', phone: '+52 55 3434 5656', role: 'employee' },
      { email: 'oscar.navarro@example.com', name: 'Oscar Navarro', phone: '+52 33 7878 9090', role: 'employee' },
      
      // Clientes (10)
      { email: 'lucia.moreno@example.com', name: 'Lucía Moreno', phone: '+52 81 2468 1357', role: 'client' },
      { email: 'alberto.vega@example.com', name: 'Alberto Vega', phone: '+52 55 9876 5432', role: 'client' },
      { email: 'patricia.ortega@example.com', name: 'Patricia Ortega', phone: '+52 33 1357 9246', role: 'client' },
      { email: 'gabriel.delgado@example.com', name: 'Gabriel Delgado', phone: '+52 81 8642 9753', role: 'client' },
      { email: 'daniela.campos@example.com', name: 'Daniela Campos', phone: '+52 55 7531 8642', role: 'client' },
      { email: 'roberto.aguilar@example.com', name: 'Roberto Aguilar', phone: '+52 33 9642 7531', role: 'client' },
      { email: 'monica.herrera@example.com', name: 'Mónica Herrera', phone: '+52 81 3579 1468', role: 'client' },
      { email: 'sergio.ramos@example.com', name: 'Sergio Ramos', phone: '+52 55 8024 6913', role: 'client' },
      { email: 'teresa.flores@example.com', name: 'Teresa Flores', phone: '+52 33 4682 5791', role: 'client' },
      { email: 'emilio.santos@example.com', name: 'Emilio Santos', phone: '+52 81 7139 4826', role: 'client' }
    ]

    const results = []
    const errors = []
    
    for (const userData of testUsers) {
      try {
        // Crear usuario en auth.users
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: Deno.env.get('TEST_USERS_PASSWORD') ?? 'TestPassword123!', // Contraseña configurable via secret
          email_confirm: true, // Auto-confirmar email
          user_metadata: {
            full_name: userData.name,
            role: userData.role
          }
        })

        if (authError) {
          errors.push({ email: userData.email, error: authError.message })
          continue
        }

        // Crear perfil público
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert([{
            id: authUser.user.id,
            email: userData.email,
            full_name: userData.name,
            phone: userData.phone,
            role: userData.role,
            is_active: true
          }])

        if (profileError) {
          errors.push({ email: userData.email, error: profileError.message })
          continue
        }

        results.push({
          id: authUser.user.id,
          email: userData.email,
          role: userData.role,
          created: true
        })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ email: userData.email, error: errorMessage })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created_users: results.length,
        users: results,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('[create-test-users] Unexpected error:', error instanceof Error ? error.message : 'unknown')
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})