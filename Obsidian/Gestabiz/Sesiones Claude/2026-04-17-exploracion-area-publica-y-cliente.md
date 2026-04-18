---
date: 2026-04-17
tags: [exploracion, manual-usuario, area-publica, cliente]
---

# Exploración exhaustiva: Área pública + Experiencia cliente

## Contexto

Sesión orientada a alimentar `docs/Manual_Usuario_Gestabiz.docx` y `docs/Propuesta_Valor_Gestabiz.docx` (regla #14 de CLAUDE.md). Se lanzaron 7 agentes Explore en paralelo cubriendo:

1. ✅ Landing, Auth, Onboarding (`ac474952`)
2. ✅ Experiencia del cliente (`a786cb3f`)
3. ⛔ Admin operacional — sin contenido (límite de uso)
4. ⛔ Admin financiero — sin contenido
5. ⛔ Experiencia empleado — sin contenido
6. ⛔ Settings y cuenta — sin contenido
7. ⛔ Sistemas cross-cutting — sin contenido

> **Pendiente**: relanzar los 5 agentes restantes cuando se restaure el budget (reset 17 abr 5pm GMT-5).

---

## 1. Área pública y onboarding (resumen)

### Landing (`LandingPage.tsx`)
- Hero con CTAs `Prueba gratuita 30 días` → `/register` y `Ver planes` → scroll `#pricing`
- 9 features (Calendario, Recordatorios, Clientes, Reportes, App móvil, Trabajos, Analytics, Automatización, Seguridad)
- ROI calculator: $1.250.000 perdidos por ausencias vs $795.100 ganancia con Gestabiz
- Stats: 80% reducción no-shows, 12h/sem ahorradas, 35% más reservas, 340% ROI
- Pricing integrado vía `<PricingPlans showCTA />` (planes Free/Básico/Pro — ver `src/lib/pricingPlans.ts`)
- 3 testimonios + blog preview + footer multivertical (Salones, Clínicas, Barberías, Gimnasios, Spas, Odontología, Psicología, Fisioterapia, Entrenadores, Coworking)
- Auto-redirect a `/app` si hay sesión

### Auth (`AuthScreen.tsx`)
- 3 modos: LOGIN, SIGNUP, RESET PASSWORD
- 3 métodos: email+contraseña, Google OAuth, Magic Link (DEV only)
- Account inactive modal (cuenta dada de baja → opción reactivar)
- Timeout 12s en login/signup, errores capturados en Sentry
- Preserva query params post-login si venía de flujo de booking

### Pricing (`PricingPlans.tsx`)
- Toggle Mensual/Anual (anual = 10 meses, "2 meses gratis")
- 3 planes activos (Fase 1 Abr 2026): Gratis, Básico ($89.900/mes), Pro ($159.900/mes)
- CTA por plan → `/login` con redirect post-login

### Business Registration Wizard
- Campos: nombre, categoría (popover searchable), modelo de recurso (professional/physical/hybrid/group), tipo legal, tax ID, contacto, ubicación cascada (país→región→ciudad)
- Validaciones: nombre ≥3, categoría requerida, teléfono requerido
- Trigger BD inserta owner como `manager` en `business_employees` automáticamente

### Perfil público (`/negocio/:slug`)
- 5 tabs: Información, Servicios, Empleados, Ubicaciones, Reviews
- Header: rating + #reviews, botones "Reservar" y "Chat con admin"
- Flujo sin login: anónimo reserva → token por email → confirma en `/confirmar-cita/:token`
- SEO completo (meta tags dinámicos, OG, JSON-LD)

### Páginas de token
- `/confirmar-cita/:token`: PATCH status `pending → confirmed`
- `/cancelar-cita/:token`: textarea motivo opcional, PATCH `→ cancelled`
- Estados: loading, token inválido, ya confirmado, deadline expirado, éxito

### Búsqueda
- `SearchBar`: dropdown tipo (services/businesses/users), debounce 300ms, top 5 + "Ver más"
- `SearchResults`: filtros, sort (relevance/distance/rating/newest/oldest/balanced), distancia Haversine
- RPCs: `search_businesses`, `search_services`, `search_professionals` con `ts_rank`

---

## 2. Experiencia del cliente (resumen)

### Dashboard cliente
- Header sticky con título dinámico + CTA `+ Agendar Cita` + toggle List/Calendar
- Sidebar: Mis Citas, Favoritos, Historial, Perfil, Configuración
- Lista: grid auto-fill min 350px de `AppointmentCard` (imagen servicio/ubicación, status badge, click → modal detalles)
- Calendario: `ClientCalendarView`, click fecha → preselecciona en wizard
- Columna derecha: `BusinessSuggestions` (por ciudad preferida o cercanía)

### Wizard de reserva (6-8 pasos condicionales)

| # | Paso | Componente | Condición |
|---|------|-----------|-----------|
| 0 | Entry | — | Desde dashboard o perfil público |
| 1 | BusinessSelection | — | Solo si NO preseleccionado |
| 2 | ServiceSelection | — | Siempre (puede saltar si empleado sin servicios) |
| 3 | LocationSelection | — | Si negocio tiene >1 ubicación |
| 4 | EmployeeSelection | — | Si servicio tiene >1 empleado |
| 4.5 | EmployeeBusinessSelection | — | Si empleado atiende en múltiples negocios |
| 5 | DateTimeSelection | — | Siempre |
| 6 | ConfirmationStep | — | Resumen + textarea notas (max 500 chars) |
| 7 | SuccessStep | — | Botones: Ver detalle, Chatear, Volver |

### Validaciones de disponibilidad (`isTimeSlotAvailable`)
1. Fecha ≥ hoy
2. NO festivo (`usePublicHolidays`)
3. Negocio abierto (`useBusinessClosedDays`)
4. Ubicación abierta en hora
5. Empleado trabaja en hora
6. NO en `lunch_break` (solo días futuros — `isLunchBreak` retorna false para días pasados, ver gotcha en CLAUDE.md)
7. NO overlap con citas del empleado
8. NO overlap con citas del cliente (mismo cliente no puede estar en 2 lugares)
9. Duración del servicio cabe antes de cierre
10. NO empleado en `employee_transfers` o `employee_absences` aprobada

### Modal de detalles de cita
- Info: status badge, negocio, servicio (imagen, descripción, duración), fecha/hora 12h, profesional (avatar/contacto), ubicación (link Google Maps), notas, precio
- Acciones (si status NOT IN [completed, cancelled, no_show]):
  - **Chatear con profesional** → `createOrGetConversation` → abre `FloatingChatButton`
  - **Reprogramar** → wizard en modo edición con datos preseleccionados
  - **Cancelar cita** → confirm dialog → UPDATE status='cancelled'

### Modal obligatorio de reseña (`MandatoryReviewModal`)
- Trigger: cita `status='completed'` AND no review previa
- Rating 1-5 (requerido) + comentario (opcional)
- Botón "Recordarme luego" → delay 5 min
- INSERT en `reviews` → refetch dashboard

### Chat flotante (`FloatingChatButton`)
- Esquina inferior derecha, badge rojo con `unreadCount`
- Activación: manual (desde detalles cita) o por URL (`?conversation=id`)
- Realtime: `useInAppNotifications({ type: 'chat_message' })`
- Solo permite chat con profesionales de citas propias

### Favoritos
- RPC `get_user_favorite_businesses`
- Toggle optimistic + `toggle_favorite_business` RPC
- Cards con: logo, rating, dirección, botones Agendar/Ver Perfil/Heart

### Historial
- Citas completadas/canceladas
- Filtros por mes/estado/negocio
- Acción "Dejar/Ver Reseña" + "Chatear con Profesional"

### Notificaciones al cliente
| Tipo | Trigger | Canal |
|------|---------|-------|
| Confirmación de cita | Post-wizard | Toast + Email + SMS |
| Recordatorio (24h antes) | Cron `process-reminders` | In-app + Email + SMS opcional |
| Cancelación/reprogramación | Admin cambia status | Toast + Email |
| Mensaje chat | Nuevo mensaje | Badge + Toast/Push |
| Reseña pendiente | Cita completed | Modal automático |
| Respuesta a reseña | Admin responde | Toast |

### Excepciones manejadas
- Cita cancelada mientras cliente está en wizard → DateTimeSelection refresca, slot vuelve a disponible
- Negocio cerrado mid-flow → bloquea todos los slots, sugiere otra fecha
- Empleado sin vínculo a negocio → no aparece en EmployeeSelection
- Servicio sin `duration_minutes` → fallback a 30 min con warning
- Teléfono no verificado → `PhoneRequiredModal` bloquea acceso al dashboard

---

## Pendiente para próxima sesión

Cuando se restaure budget (5pm GMT-5), relanzar 5 exploraciones:

1. **Admin operacional**: AdminDashboard + módulos `overview/appointments/services/locations/employees/clients/sales/quickSales/absences/recruitment/permissions`
2. **Admin financiero**: `expenses/reports/billing` + sistema contable (taxes, charts, exports)
3. **Empleado**: EmployeeDashboard + módulos `myAppointments/myClients/myStats/myAbsences/myProfile`
4. **Settings**: `CompleteUnifiedSettings` (3 perfiles: admin/employee/client) + integraciones (Google Calendar, payment gateways)
5. **Cross-cutting**: notificaciones, chat, bug reports, i18n, Analytics GA4, sistema de cards reutilizables

Una vez completado, generar:
- `docs/Manual_Usuario_Gestabiz.docx` (guía funcional por rol)
- `docs/Propuesta_Valor_Gestabiz.docx` (pitch comercial con ROI, casos de uso, comparativa)
