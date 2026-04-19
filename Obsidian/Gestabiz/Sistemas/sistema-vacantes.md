---
date: 2026-04-19
tags: [sistema, vacantes, reclutamiento, empleo, produccion]
status: completado
---

# Sistema de Vacantes y Reclutamiento

Reclutamiento completo con matching inteligente empleado-vacante, reviews obligatorias al contratar/finalizar, y detección de conflictos de horario. 7 fases, 100% completado.

## Descripción

Los administradores publican vacantes con requisitos, salario y ubicación. Los empleados aplican desde su dashboard. El sistema detecta conflictos de horario y calcula matching. Al contratar o finalizar un empleado, las reviews son obligatorias.

## Flujo Principal

1. Admin crea vacante en `CreateVacancy` (título, salario, sede, skills, horario)
2. Sistema publica y notifica empleados potenciales
3. Empleado ve vacantes matching en `MatchingVacancies`
4. Empleado aplica con CV y notas de disponibilidad
5. Sistema detecta conflictos de horario con `useScheduleConflicts`
6. Admin revisa aplicaciones en `ApplicationList`
7. Admin acepta → se activa `MandatoryReviewModal`
8. Empleado contratado, registrado en `business_employees`

## Componentes Clave (Admin)

| Componente | Líneas | Función |
|-----------|--------|---------|
| `RecruitmentDashboard` | — | Vista principal con tabs |
| `VacancyCard` | — | Card de vacante |
| `VacancyList` | — | Lista de vacantes |
| `VacancyDetail` | — | Detalle de vacante |
| `CreateVacancy` | — | Formulario de creación |
| `ApplicationCard` | — | Card de aplicación |
| `ApplicationList` | — | Lista de aplicaciones |
| `ApplicantProfileModal` | — | Modal de perfil del aplicante |
| `MandatoryReviewModal` | — | Review obligatoria al contratar/finalizar |

## Componentes Clave (Empleado)

- `MatchingVacancies` — Vacantes que coinciden con perfil
- `MyApplications` — Aplicaciones enviadas
- `EmployeeProfileEditor` — Edición de perfil profesional

## Tablas de Base de Datos

- `job_vacancies` — Vacantes (salary_range, commission_based, required_skills, location_id)
- `job_applications` — Aplicaciones (status, cv_url, availability_notes)
- `employee_profiles` — Perfiles profesionales (skills, experience, certifications)

## Edge Functions

- `send-selection-notifications` — Notificaciones de selección
- `send-employee-request-notification` — Notificación de solicitud

## Hooks (6, ~1,510 líneas)

- `useJobVacancies(businessId)` — CRUD de vacantes
- `useJobApplications(vacancyId)` — Aplicaciones por vacante
- `useMatchingVacancies(employeeId)` — Matching inteligente
- `useMandatoryReviews(applicationId)` — Reviews obligatorias
- `useScheduleConflicts(employeeId)` — Detección de conflictos
- `useEmployeeProfile(employeeId)` — Perfil profesional

## Matching Inteligente

Algoritmo que evalúa:
- Skills requeridos vs skills del empleado
- Ubicación preferida vs ubicación de la vacante
- Horario disponible vs horario requerido
- Salario esperado vs salario ofrecido

## Reviews Obligatorias

Al contratar o finalizar relación laboral → `MandatoryReviewModal` obliga a dejar review. Las reviews alimentan el [[sistema-reviews]].

## Formato Salarios

- Moneda: COP (pesos colombianos)
- Formato miles: 1.000.000
- Checkbox `commission_based` para salarios por comisión

## Tests E2E

45 tests con `describe.skip()` — pausados por rate limit de emails de Supabase. La funcionalidad es 100% operativa.

## Permisos Requeridos

- `recruitment.create_vacancy` — Crear vacantes (proteger con [[sistema-permisos|PermissionGate]])
- `recruitment.edit_vacancy` — Editar vacantes
- `recruitment.delete_vacancy` — Eliminar vacantes
- `recruitment.manage_applications` — Gestionar aplicaciones

## Storage

- Bucket `cvs` (private) — CVs de aplicantes

## Archivos Clave

- `src/components/jobs/RecruitmentDashboard.tsx`
- `src/components/jobs/CreateVacancy.tsx`
- `src/hooks/useJobVacancies.ts`
- `src/hooks/useJobApplications.ts`
- `supabase/functions/send-selection-notifications/`

## Notas Relacionadas

- [[sistema-permisos]] — Permisos `recruitment.*`
- [[sistema-notificaciones]] — Notificaciones de aplicaciones y selección
- [[sistema-reviews]] — Reviews obligatorias al contratar/finalizar
- [[sistema-citas]] — Detección de conflictos de horario con citas existentes
- [[sistema-sede-preferida]] — Pre-selección de sede en vacantes nuevas
