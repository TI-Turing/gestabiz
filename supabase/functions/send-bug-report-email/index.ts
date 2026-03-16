import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendBrevoEmail } from '../_shared/brevo.ts'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

// Escapa caracteres HTML para prevenir inyección en templates de email
function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

interface BugReportEmailRequest {
  bugReportId: string
  userId: string
  title: string
  description: string
  stepsToReproduce?: string
  severity: string
  userEmail: string
  userName: string
  userAgent?: string
  browserVersion?: string
  deviceType?: string
  screenResolution?: string
  affectedPage?: string
}

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    // Verificar API key
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Obtener datos del body
    const body: BugReportEmailRequest = await req.json()
    const {
      bugReportId,
      userId,
      title,
      description,
      stepsToReproduce,
      severity,
      userEmail,
      userName,
      userAgent,
      browserVersion,
      deviceType,
      screenResolution,
      affectedPage
    } = body

    // Validaciones
    if (!bugReportId || !userId || !title || !description || !severity) {
      throw new Error('Missing required fields')
    }

    // Configuración de correo
    const supportEmail = Deno.env.get('SUPPORT_EMAIL')

    if (!supportEmail) {
      throw new Error('SUPPORT_EMAIL not configured')
    }

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener información adicional del reporte
    const { data: bugReport } = await supabase
      .from('bug_reports')
      .select('*, bug_report_evidences(count)')
      .eq('id', bugReportId)
      .single()

    const evidenceCount = bugReport?.bug_report_evidences?.[0]?.count || 0

    // Definir emoji y color según severidad
    const severityConfig: Record<string, { emoji: string; color: string; label: string }> = {
      low: { emoji: '🟢', color: '#10b981', label: 'Baja' },
      medium: { emoji: '🟡', color: '#f59e0b', label: 'Media' },
      high: { emoji: '🟠', color: '#f97316', label: 'Alta' },
      critical: { emoji: '🔴', color: '#ef4444', label: 'Crítica' }
    }

    const config = severityConfig[severity] || severityConfig.medium

    // Escapar todos los datos de usuario antes de insertar en HTML
    const safeTitle = escapeHtml(title)
    const safeDescription = escapeHtml(description)
    const safeStepsToReproduce = escapeHtml(stepsToReproduce)
    const safeUserName = escapeHtml(userName)
    const safeUserEmail = escapeHtml(userEmail)
    const safeAffectedPage = escapeHtml(affectedPage)
    const safeBrowserVersion = escapeHtml(browserVersion)
    const safeDeviceType = escapeHtml(deviceType)
    const safeScreenResolution = escapeHtml(screenResolution)
    const safeBugReportId = escapeHtml(bugReportId)

    // Construir HTML del email
    const htmlBody = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Reporte de Bug</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🐛 Nuevo Reporte de Bug
              </h1>
              <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">
                Sistema de Reporte de Problemas - Gestabiz
              </p>
            </td>
          </tr>

          <!-- Severity Badge -->
          <tr>
            <td style="padding: 24px 40px 16px 40px;">
              <div style="display: inline-block; background-color: ${config.color}15; color: ${config.color}; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px;">
                ${config.emoji} Severidad: ${config.label}
              </div>
            </td>
          </tr>

          <!-- Bug Title -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <h2 style="margin: 0; color: #1f2937; font-size: 22px; font-weight: 600;">
                ${safeTitle}
              </h2>
            </td>
          </tr>

          <!-- Reporter Info -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <table style="width: 100%; background-color: #f9fafb; border-radius: 8px; padding: 16px;">
                <tr>
                  <td style="padding: 0;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Reportado por
                    </p>
                    <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 500;">
                      ${safeUserName}
                    </p>
                    <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">
                      ${safeUserEmail}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Description -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">
                Descripcion del Problema
              </h3>
              <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 16px; border-radius: 4px;">
                <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${safeDescription}
                </p>
              </div>
            </td>
          </tr>

          ${safeStepsToReproduce ? `
          <!-- Steps to Reproduce -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">
                Pasos para Reproducir
              </h3>
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${safeStepsToReproduce}
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Technical Details -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">
                Detalles Tecnicos
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${safeAffectedPage ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px;">Pagina Afectada:</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #1f2937; font-size: 13px; font-weight: 500;">${safeAffectedPage}</span>
                  </td>
                </tr>
                ` : ''}
                ${safeBrowserVersion ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px;">Navegador:</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #1f2937; font-size: 13px; font-weight: 500;">${safeBrowserVersion}</span>
                  </td>
                </tr>
                ` : ''}
                ${safeDeviceType ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px;">Dispositivo:</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #1f2937; font-size: 13px; font-weight: 500;">${safeDeviceType}</span>
                  </td>
                </tr>
                ` : ''}
                ${safeScreenResolution ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px;">Resolucion:</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #1f2937; font-size: 13px; font-weight: 500;">${safeScreenResolution}</span>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6b7280; font-size: 13px;">Evidencias Adjuntas:</span>
                  </td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="color: #1f2937; font-size: 13px; font-weight: 500;">${evidenceCount} archivo(s)</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bug Report ID -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                  ID del Reporte
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 14px; font-family: 'Courier New', monospace; font-weight: 600;">
                  ${safeBugReportId}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                Este email fue generado automáticamente por el sistema de reporte de bugs de Gestabiz.<br>
                Por favor, no responder a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Texto plano alternativo (sin HTML, pero usando valores sin escapado HTML)
    const textBody = `
NUEVO REPORTE DE BUG

Severidad: ${config.label}
Titulo: ${title}

REPORTADO POR:
${userName} (${userEmail})

DESCRIPCION:
${description}

${stepsToReproduce ? `PASOS PARA REPRODUCIR:\n${stepsToReproduce}\n\n` : ''}

DETALLES TECNICOS:
${affectedPage ? `Pagina Afectada: ${affectedPage}\n` : ''}
${browserVersion ? `Navegador: ${browserVersion}\n` : ''}
${deviceType ? `Dispositivo: ${deviceType}\n` : ''}
${screenResolution ? `Resolucion: ${screenResolution}\n` : ''}
Evidencias Adjuntas: ${evidenceCount} archivo(s)

ID del Reporte: ${bugReportId}

---
Este email fue generado automaticamente por el sistema de reporte de bugs de Gestabiz.
    `

    // Enviar email vía Brevo
    const emailResult = await sendBrevoEmail({
      to: supportEmail,
      subject: `[${config.label}] ${safeTitle}`,
      htmlBody: htmlBody,
      textBody: textBody,
      fromEmail: 'no-reply@gestabiz.com',
      fromName: 'Gestabiz Bug Reporter'
    })

    // Actualizar log de notificaciones si existe
    if (bugReport) {
      await supabase
        .from('notification_log')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: {
            ...bugReport,
            brevo_message_id: emailResult.messageId
          }
        })
        .eq('metadata->bug_report_id', bugReportId)
        .eq('notification_type', 'bug_report_created')
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResult.messageId,
        message: 'Bug report email sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending bug report email:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
