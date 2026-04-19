---
date: 2026-04-19
tags: [arquitectura, edge-functions, deno, supabase, serverless]
status: activo
---

# Edge Functions Supabase

~50 Edge Functions Deno organizadas por dominio. Deploy vía CI/CD (NUNCA manual salvo emergencia).

## Regla de Deploy

> **NUNCA** ejecutar `npx supabase functions deploy` manualmente.
> Flujo correcto: editar función → commit → push a rama → CI/CD despliega automáticamente.
> dev → workflow despliega a DEV. main → workflow despliega a PROD.

## Functions por Dominio

### Citas
| Función | Descripción |
|---------|-------------|
| `appointment-actions` | Confirmar, cancelar, gestión general |
| `appointment-status-updater` | Actualización automática de estados |
| `send-appointment-confirmation` | Email de confirmación con token |
| `calendar-integration` | Sync con Google Calendar |

### Notificaciones
| Función | Descripción |
|---------|-------------|
| `send-notification` | Envío multi-canal (Email/SMS/WhatsApp) |
| `send-email` / `send-email-reminder` | Emails vía Brevo |
| `send-sms-reminder` | SMS vía AWS SNS |
| `send-whatsapp` / `send-whatsapp-reminder` | WhatsApp Business API |
| `process-reminders` | Cron cada 5 min |
| `schedule-reminders` | Programar recordatorios |
| `send-notification-reminders` | Recordatorios de citas |
| `send-unread-chat-emails` | Emails de mensajes no leídos |
| `send-notifications` | Batch notifications |
| `send-reminders` | Recordatorios genéricos |
| `notify-business-unconfigured` | Alertar negocios sin configurar |

### Ausencias
| Función | Descripción |
|---------|-------------|
| `request-absence` | Solicitar ausencia (notifica a TODOS los admins) |
| `approve-reject-absence` | Aprobar/rechazar |
| `cancel-appointments-on-emergency-absence` | Cancelación automática |

### Empleados y Reclutamiento
| Función | Descripción |
|---------|-------------|
| `send-employee-request-notification` | Notificación de solicitud |
| `send-selection-notifications` | Notificaciones de selección en vacantes |
| `update-hierarchy` | Actualización de jerarquía |
| `cancel-future-appointments-on-transfer` | Cancelar citas al transferir sede |
| `process-pending-transfers` | Procesar transferencias pendientes |

### Pagos
| Función | Gateway |
|---------|---------|
| `create-checkout-session` | Stripe |
| `create-setup-intent` | Stripe |
| `manage-subscription` | Stripe |
| `stripe-webhook` | Stripe |
| `payu-create-checkout` | PayU |
| `payu-webhook` | PayU |
| `mercadopago-create-preference` | MercadoPago |
| `mercadopago-webhook` | MercadoPago |
| `mercadopago-manage-subscription` | MercadoPago |

### Analytics y Reportes
| Función | Descripción |
|---------|-------------|
| `refresh-ratings-stats` | Refresco vistas materializadas (cron 5 min) |
| `get-client-dashboard-data` | RPC wrapper dashboard cliente |
| `check-business-inactivity` | Verificación inactividad |
| `daily-digest` | Resumen diario |

### Otros
| Función | Descripción |
|---------|-------------|
| `send-message` | Chat messages |
| `send-bug-report-email` | Bug reports |
| `create-test-users` | Usuarios de prueba |
| `search_businesses` | Búsqueda |
| `refresh-permissions-cache` | Cache permisos |

## Secrets Requeridos

```bash
# Brevo (Email)
BREVO_API_KEY, BREVO_SMTP_HOST, BREVO_SMTP_PORT, BREVO_SMTP_USER, BREVO_SMTP_PASSWORD
# WhatsApp
WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
# Stripe
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
# AWS (SMS)
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
# General
SUPPORT_EMAIL
```

## Archivos Clave

- `supabase/functions/` — Todas las funciones
- `supabase/functions/README.md` — Documentación de funciones

## Notas Relacionadas

- [[base-de-datos]] — BD sobre la que operan las functions
- [[stack-tecnologico]] — Deno runtime
- [[sistema-notificaciones]] — Functions de notificaciones
- [[sistema-billing]] — Functions de pagos
- [[sistema-ausencias]] — Functions de ausencias
- [[sistema-citas]] — Functions de citas
- [[sistema-vacantes]] — Functions de reclutamiento
