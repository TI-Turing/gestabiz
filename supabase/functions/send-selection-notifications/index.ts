// =====================================================
// Edge Function: send-selection-notifications
// Descripción: Envía notificaciones de proceso de selección
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { escapeHtml } from '../_shared/html.ts';
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('send-selection-notifications')

interface SelectionNotificationPayload {
  type: 'started' | 'selected' | 'not_selected';
  application_id: string;
  vacancy_id: string;
  vacancy_title: string;
  business_id: string;
  business_name: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  selected_user_id?: string;
  selected_user_email?: string;
  selected_user_name?: string;
  rejected_candidates?: Array<{
    user_id: string;
    user_email: string;
    user_name: string;
  }>;
  vacancy_filled?: boolean;
}

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req);
  if (corsPreFlight) return corsPreFlight;
  const corsHeaders = getCorsHeaders(req);

  try {
    // ─── AUTENTICACIÓN: JWT obligatorio ────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const payload: SelectionNotificationPayload = await req.json();
    const { type, vacancy_title, business_name } = payload;


    // Procesar según tipo de notificación
    switch (type) {
      case 'started':
        await sendSelectionStartedNotification(supabaseClient, payload);
        break;
      
      case 'selected':
        await sendSelectedNotification(supabaseClient, payload);
        
        // Notificar a los rechazados si existen
        if (payload.rejected_candidates && payload.rejected_candidates.length > 0) {
          for (const candidate of payload.rejected_candidates) {
            await sendNotSelectedNotification(supabaseClient, {
              ...payload,
              user_id: candidate.user_id,
              user_email: candidate.user_email,
              user_name: candidate.user_name,
            });
          }
        }
        break;
      
      case 'not_selected':
        await sendNotSelectedNotification(supabaseClient, payload);
        break;
      
      default:
        throw new Error(`Tipo de notificación desconocido: ${type}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notificaciones enviadas' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    captureEdgeFunctionError(error as Error, { functionName: 'send-selection-notifications' })
    await flushSentry()
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Notificación: Proceso de selección iniciado
 */
async function sendSelectionStartedNotification(
  supabase: any,
  payload: SelectionNotificationPayload
) {
  const { user_id, user_email, user_name, vacancy_title, business_name, application_id, vacancy_id, business_id } = payload;

  // Escapar datos de usuario para HTML
  const safeUserName = escapeHtml(user_name);
  const safeVacancyTitle = escapeHtml(vacancy_title);
  const safeBusinessName = escapeHtml(business_name);

  // 1. Crear notificación in-app
  await supabase.from('in_app_notifications').insert({
    user_id,
    type: 'job_selection_process_started',
    title: 'Proceso de Seleccion Iniciado',
    message: `Has sido seleccionado para participar en el proceso de seleccion de "${vacancy_title}" en ${business_name}`,
    data: {
      application_id,
      vacancy_id,
      vacancy_title,
      business_id,
      business_name,
    },
    read: false,
  });

  // 2. Registrar en notification_log
  await supabase.from('notification_log').insert({
    user_id,
    notification_type: 'job_selection_process_started',
    channel: 'email',
    status: 'sent',
    metadata: {
      vacancy_title,
      business_name,
      application_id,
    },
  });

  // 3. Preparar email HTML
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .steps li { margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ¡Felicidades!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${safeUserName}</strong>,</p>

      <p>Nos complace informarte que has sido seleccionado para participar en el proceso de seleccion de:</p>

      <h2 style="color: #667eea; margin: 20px 0;">${safeVacancyTitle}</h2>
      <p style="font-size: 16px;">en <strong>${safeBusinessName}</strong></p>
      
      <div class="alert">
        <p style="margin: 0;"><strong>📞 Próximo paso:</strong></p>
        <p style="margin: 5px 0 0 0;">El administrador del negocio se pondrá en contacto contigo pronto para acordar una entrevista.</p>
      </div>
      
      <div class="steps">
        <p><strong>Para prepararte:</strong></p>
        <ul>
          <li>✅ Revisa la información completa de la vacante</li>
          <li>✅ Prepara tus preguntas para la entrevista</li>
          <li>✅ Estate atento a mensajes del administrador</li>
          <li>✅ Ten disponible tu CV y portafolio (si aplica)</li>
        </ul>
      </div>
      
      <center>
        <a href="${Deno.env.get('FRONTEND_URL')}/app/employee/applications" class="button">
          Ver Mis Aplicaciones
        </a>
      </center>
      
      <div class="footer">
        <p>Este es un correo automático. No respondas a este mensaje.</p>
        <p>© 2025 Gestabiz - Sistema de Gestión de Negocios</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // 4. Enviar email (si está configurado AWS SES)
  if (Deno.env.get('AWS_ACCESS_KEY_ID')) {
    try {
      // Aquí iría la lógica de AWS SES
      // Por ahora solo lo registramos
    } catch (error) {
    }
  }
}

/**
 * Notificación: Candidato seleccionado como empleado
 */
async function sendSelectedNotification(
  supabase: any,
  payload: SelectionNotificationPayload
) {
  const { selected_user_id, selected_user_email, selected_user_name, vacancy_title, business_name, application_id, vacancy_id, business_id } = payload;

  // 1. Crear notificación in-app
  await supabase.from('in_app_notifications').insert({
    user_id: selected_user_id,
    type: 'job_employee_selected',
    title: '🎊 ¡Has sido seleccionado!',
    message: `¡Felicidades! Has sido seleccionado como empleado para "${vacancy_title}" en ${business_name}`,
    data: {
      application_id,
      vacancy_id,
      vacancy_title,
      business_id,
      business_name,
    },
    read: false,
  });

  // 2. Registrar en notification_log
  await supabase.from('notification_log').insert({
    user_id: selected_user_id,
    notification_type: 'job_employee_selected',
    channel: 'email',
    status: 'sent',
    metadata: {
      vacancy_title,
      business_name,
      application_id,
    },
  });

  // 3. Email HTML
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .steps li { margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎊 ¡Felicidades, has sido seleccionado!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${selected_user_name}</strong>,</p>
      
      <p>Es un placer informarte que has sido seleccionado para el puesto de:</p>
      
      <h2 style="color: #10b981; margin: 20px 0;">${vacancy_title}</h2>
      <p style="font-size: 16px;">en <strong>${business_name}</strong></p>
      
      <div class="success-box">
        <p style="margin: 0;"><strong>🎉 ¡Bienvenido al equipo!</strong></p>
        <p style="margin: 5px 0 0 0;">Ya formas parte de ${business_name}. Estamos emocionados de trabajar contigo.</p>
      </div>
      
      <div class="steps">
        <p><strong>Próximos pasos:</strong></p>
        <ul>
          <li>✅ Completa tu perfil de empleado</li>
          <li>✅ Configura tu horario de trabajo</li>
          <li>✅ Especifica los servicios que ofreces</li>
          <li>✅ Coordina tu fecha de inicio</li>
        </ul>
      </div>
      
      <center>
        <a href="${Deno.env.get('FRONTEND_URL')}/app" class="button">
          Ir al Dashboard de Empleado
        </a>
      </center>
      
      <div class="footer">
        <p>Este es un correo automático. No respondas a este mensaje.</p>
        <p>© 2025 Gestabiz - Sistema de Gestión de Negocios</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

}

/**
 * Notificación: Candidato no seleccionado
 */
async function sendNotSelectedNotification(
  supabase: any,
  payload: SelectionNotificationPayload
) {
  const { user_id, user_email, user_name, vacancy_title, business_name, application_id, vacancy_id, business_id } = payload;

  // 1. Crear notificación in-app
  await supabase.from('in_app_notifications').insert({
    user_id,
    type: 'job_not_selected',
    title: 'Actualización de Proceso',
    message: `Hemos decidido continuar con otros participantes para "${vacancy_title}" en ${business_name}`,
    data: {
      application_id,
      vacancy_id,
      vacancy_title,
      business_id,
      business_name,
    },
    read: false,
  });

  // 2. Registrar en notification_log
  await supabase.from('notification_log').insert({
    user_id,
    notification_type: 'job_not_selected',
    channel: 'email',
    status: 'sent',
    metadata: {
      vacancy_title,
      business_name,
      application_id,
    },
  });

  // 3. Email HTML
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: #e0e7ff; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Actualización de tu Aplicación</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${user_name}</strong>,</p>
      
      <p>Gracias por tu interés en el puesto de <strong>${vacancy_title}</strong> en ${business_name}.</p>
      
      <p>Después de una cuidadosa consideración, hemos decidido continuar con otros participantes en esta ocasión.</p>
      
      <div class="info-box">
        <p style="margin: 0;"><strong>💼 Tu perfil es valioso</strong></p>
        <p style="margin: 5px 0 0 0;">Te animamos a seguir aplicando a otras vacantes en nuestra plataforma. Hay muchas oportunidades esperándote.</p>
      </div>
      
      <center>
        <a href="${Deno.env.get('FRONTEND_URL')}/app/employee/vacancies" class="button">
          Ver Vacantes Disponibles
        </a>
      </center>
      
      <div class="footer">
        <p>Este es un correo automático. No respondas a este mensaje.</p>
        <p>© 2025 Gestabiz - Sistema de Gestión de Negocios</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

}
