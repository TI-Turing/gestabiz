---
date: 2026-04-19
tags: [sistema, citas, appointments, wizard, produccion]
status: completado
---

# Sistema de Gestión de Citas

Sistema central de Gestabiz que permite a los clientes reservar, reprogramar y cancelar citas con validación en tiempo real. Production ready.

## Descripción

El wizard multi-paso (`AppointmentWizard`) guía al cliente desde la selección del negocio hasta la confirmación de la cita en 6-8 pasos. El componente más crítico es `DateTimeSelection`, que ejecuta 3 queries en paralelo y aplica 10 validaciones simultáneas.

## Flujo Principal

1. Cliente selecciona negocio → servicio → sede → profesional → fecha/hora
2. `DateTimeSelection` valida disponibilidad en tiempo real
3. `createAppointment()` ejecuta INSERT (nueva) o UPDATE (reprogramación)
4. Se disparan notificaciones in-app + email al negocio
5. Cliente recibe email con link de confirmación sin login

## Componentes Clave

| Componente | Ubicación | Líneas | Función |
|-----------|-----------|--------|---------|
| `AppointmentWizard` | `src/components/appointments/` | — | Orquestador del wizard multi-paso |
| `DateTimeSelection` | `src/components/appointments/` | 328 | Validación de slots en tiempo real |
| `ConfirmationStep` | `src/components/appointments/` | — | Resumen pre-confirmación |
| `SuccessStep` | `src/components/appointments/` | — | Pantalla de éxito con confetti |
| `AppointmentCard` | `src/components/cards/` | — | Card self-fetch por ID |

## Tablas de Base de Datos

- `appointments` — Citas (start_time, end_time, status, employee_id OR resource_id, is_location_exception)
  - CHECK constraint: `employee_id IS NOT NULL OR resource_id IS NOT NULL`
- `services` — Servicios con precio y duración
- `locations` — Sedes con opens_at/closes_at
- `business_employees` — lunch_break_start/end, horario semanal

## Edge Functions

- `appointment-actions` — Confirmar, cancelar, gestión general
- `appointment-status-updater` — Actualización automática de estados
- `send-appointment-confirmation` — Email de confirmación con token
- `calendar-integration` — Sync con Google Calendar

## 10 Validaciones del DateTimeSelection

1. Horario apertura/cierre de la sede
2. Hora de almuerzo del profesional
3. Overlap con citas del mismo profesional
4. Overlap con citas del cliente en otros negocios
5. Festivos públicos colombianos → [[sistema-festivos|Festivos Públicos]]
6. Ausencias aprobadas del profesional → [[sistema-ausencias]]
7. Duración mínima del servicio (tiempo suficiente antes del cierre)
8. Anticipación mínima del negocio
9. Buffer de 90 minutos (no permite reservar en próximos 90 min)
10. Máximo de citas activas del cliente (5 por negocio default)

## Algoritmo de Overlap

```
slotStart < appointmentEnd AND slotEnd > appointmentStart
```

En modo edición (reprogramación), la cita actual se excluye del cálculo via prop `appointmentToEdit`.

## Reglas de Negocio

- CREATE vs UPDATE: `createAppointment()` diferencia entre INSERT y UPDATE automáticamente
- Exclusión de cita en edición permite reprogramar al mismo horario
- Citas con status `completed` o `cancelled` NO pueden reprogramarse ni cancelarse
- Si el servicio fue eliminado → LEFT JOIN muestra 'N/A' (nunca INNER JOIN en calendarios)
- Hora de almuerzo NO aplica a días pasados (no oculta citas históricas)

## Gotchas

- **CRÍTICO**: `appointments` NO tiene columnas `client_name`, `client_email`, `title` — siempre two-step query
- **CRÍTICO**: `services!inner` en joins oculta citas silenciosamente si el servicio fue eliminado
- `is_location_exception` marca empleados trabajando fuera de su sede asignada

## Permisos Requeridos

- `appointments.create` — Crear citas (proteger con [[sistema-permisos|PermissionGate]])
- `appointments.edit` — Editar/reprogramar
- `appointments.cancel` — Cancelar citas
- `appointments.cancel_own` — Cliente cancela sus propias citas
- `appointments.reschedule_own` — Cliente reprograma sus propias citas

## Hooks Relacionados

- `useWizardDataCache` — Cache entre pasos del wizard (localStorage 1h)
- `useAssigneeAvailability` — Validación unificada empleado OR recurso → [[sistema-modelo-flexible]]
- `useScheduleConflicts` — Detección de conflictos de horario
- `useCompletedAppointments` — Citas completadas del cliente (para reviews → [[sistema-reviews]])

## Archivos Clave

- `src/components/appointments/AppointmentWizard.tsx`
- `src/components/appointments/DateTimeSelection.tsx`
- `src/lib/services/appointments.ts`
- `supabase/functions/appointment-actions/`
- `supabase/functions/send-appointment-confirmation/`

## Token Flow para Confirmación/Cancelación Sin Login

Clientes pueden confirmar o cancelar citas mediante links públicos sin necesidad de autenticación.

### Rutas Públicas

- `/confirmar-cita/:token` — Componente `AppointmentConfirmation.tsx`
  - Obtiene el token de la URL
  - Llama RPC `confirm_appointment_by_token()` (SECURITY DEFINER)
  - Muestra estado de confirmación
  - Redirige a perfil público del negocio con toast de éxito

- `/cancelar-cita/:token` — Componente `AppointmentCancellation.tsx`
  - Obtiene el token de la URL
  - Llama RPC `cancel_appointment_by_token()` (SECURITY DEFINER)
  - Muestra estado de cancelación
  - Notifica al negocio y al cliente

### RPCs (SECURITY DEFINER)

```sql
confirm_appointment_by_token(token text)
  → appointment_id uuid, status text, timestamp

cancel_appointment_by_token(token text)
  → appointment_id uuid, status text, timestamp
```

Ambas validan que el token sea válido y no haya expirado (30 min de vida por defecto).

### Ciclo de Vida de una Cita

1. **pending** → Cliente en wizard
2. **confirmed** → Cliente confirma vía email link O automático si `auto_confirm` está habilitado
3. **no_show** / **completed** → Final (cron cada 30 min actualiza estados automáticamente)
4. **cancelled** → Cliente cancela vía link o admin desde panel

## Notas Relacionadas

- [[sistema-permisos]] — Permisos granulares para acciones de citas
- [[sistema-ausencias]] — Ausencias bloquean slots en DateTimeSelection
- [[sistema-notificaciones]] — Notificaciones de confirmación/cancelación/reprogramación
- [[sistema-busqueda]] — Búsqueda de negocios alimenta paso 1 del wizard
- [[sistema-reviews]] — Reviews requieren cita completada
- [[sistema-modelo-flexible]] — Recursos físicos como alternativa a employee_id
- [[sistema-perfiles-publicos]] — Deep-link desde perfil público preselecciona datos en wizard
- [[sistema-sede-preferida]] — Sede preferida pre-selecciona location en wizard
- [[sistema-google-calendar]] — Integración con Google Calendar
