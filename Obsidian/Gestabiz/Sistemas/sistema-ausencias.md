---
date: 2026-04-19
tags: [sistema, ausencias, vacaciones, empleados, produccion]
status: completado
---

# Sistema de Ausencias y Vacaciones

Gestión completa de ausencias y vacaciones con balance automático, aprobación obligatoria y notificaciones multicanal a todos los admins.

## Descripción

Todo empleado puede solicitar ausencias (vacaciones, emergencia, enfermedad, personal, otra). La aprobación es **SIEMPRE obligatoria** — es una regla de negocio no negociable. El sistema integra festivos públicos colombianos, calcula días hábiles automáticamente y bloquea slots en el [[sistema-citas|wizard de citas]].

## Flujo Principal

1. Empleado abre `AbsenceRequestModal` desde su dashboard
2. Selecciona tipo, rango de fechas (con range highlighting) y motivo
3. Sistema valida contra festivos → [[sistema-festivos|Festivos Públicos]]
4. Se crea solicitud con status `pending`
5. Edge Function `request-absence` notifica a TODOS los admins/managers (in-app + email)
6. Admin aprueba/rechaza desde `AbsencesTab`
7. Si aprobada → balance actualizado → empleado notificado → slots bloqueados en citas

## Tipos de Ausencia

| Tipo | Descripción | Afecta vacaciones |
|------|-------------|-------------------|
| `vacation` | Vacaciones programadas | Sí (descuenta del balance) |
| `emergency` | Emergencia | No |
| `sick_leave` | Licencia médica | No |
| `personal` | Personal | No |
| `other` | Otro motivo | No |

## Componentes Clave

| Componente | Ubicación | Líneas | Función |
|-----------|-----------|--------|---------|
| `AbsenceRequestModal` | `src/components/absences/` | 310 | Formulario con range highlighting |
| `AbsenceApprovalCard` | `src/components/absences/` | 224 | Card de aprobación para admin |
| `VacationDaysWidget` | `src/components/absences/` | 142 | Balance de vacaciones |
| `AbsencesTab` | `src/components/absences/` | 98 | Tab completo en AdminDashboard |

## Tablas de Base de Datos

- `employee_absences` — Solicitudes de ausencia (tipo, fechas, estado, motivo)
- `absence_approval_requests` — Solicitudes de aprobación (approved_by, notes)
- `vacation_balance` — Balance automático (disponibles, usados, pendientes, restantes)
- `public_holidays` — 54 festivos colombianos 2025-2027
- `businesses` — Campos: `vacation_days_per_year` (15), `require_absence_approval` (TRUE siempre), `max_advance_vacation_request_days` (90)
- `business_employees` — Campos: `hire_date`, `vacation_days_accrued`

## Edge Functions

- `request-absence` — Empleados solicitan ausencias (v2: 350+ líneas, notifica a TODOS admins + email)
- `approve-reject-absence` — Admins aprueban/rechazan (237 líneas)
- `cancel-appointments-on-emergency-absence` — Cancelación automática de citas (226 líneas)

## Hooks

- `useEmployeeAbsences(employeeId, businessId)` — Perspectiva del empleado
- `useAbsenceApprovals(businessId)` — Perspectiva del administrador
- `usePublicHolidays(countryId, year)` — Cache 24h, helpers `isHoliday()`, `getHolidayName()`
- `useEmployeeTimeOff(employeeId, businessId)` — Tiempo libre del empleado

## Política Crítica

> **`require_absence_approval = true` SIEMPRE en TODOS los negocios.**
> No es parametrizable. Es una regla de negocio no negociable.
> - Nuevos negocios: default `true` en migración
> - Negocios existentes: forzado por migración `20251020110000`

## Integración con Citas

Cuando una ausencia es aprobada, `DateTimeSelection` (validación #6) bloquea automáticamente los slots del profesional durante el rango de la ausencia. Si es ausencia de emergencia, `cancel-appointments-on-emergency-absence` cancela automáticamente todas las citas futuras y notifica a los clientes.

## Reglas de Negocio

- Balance automático: 15 días/año por defecto (configurable por negocio)
- Festivos excluidos del cálculo de días de vacaciones
- Ausencia emergencia → cancelación automática de citas + notificación a clientes
- TODOS los admins/managers reciben notificación (no solo el manager directo)

## Permisos Requeridos

- `absences.request` — Empleado solicita ausencia (proteger con [[sistema-permisos|PermissionGate]])
- `absences.approve` — Admin aprueba/rechaza

## Archivos Clave

- `src/components/absences/AbsenceRequestModal.tsx`
- `src/components/absences/AbsenceApprovalCard.tsx`
- `src/components/absences/VacationDaysWidget.tsx`
- `src/hooks/useEmployeeAbsences.ts`
- `src/hooks/useAbsenceApprovals.ts`
- `src/hooks/usePublicHolidays.ts`
- `supabase/functions/request-absence/`
- `supabase/functions/approve-reject-absence/`

## Notas Relacionadas

- [[sistema-citas]] — Ausencias bloquean slots en DateTimeSelection (validación #6)
- [[sistema-permisos]] — Permisos `absences.approve` y `absences.request`
- [[sistema-notificaciones]] — Notificaciones a admins y empleados
- [[sistema-configuraciones]] — Config de vacaciones por negocio
- [[sistema-festivos]] — Festivos colombianos excluidos del cálculo
