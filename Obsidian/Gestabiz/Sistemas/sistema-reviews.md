---
date: 2026-04-19
tags: [sistema, reviews, calificaciones, produccion]
status: completado
---

# Sistema de Reviews

Calificaciones anónimas por servicio y profesional con validación de cita completada, moderación y respuesta del negocio.

## Descripción

Los clientes pueden calificar negocios y profesionales (1-5 estrellas) después de completar una cita. Las reviews son anónimas y alimentan las vistas materializadas de ratings que usan el [[sistema-busqueda]] y los perfiles públicos.

## Flujo Principal

1. Cliente completa cita → `useCompletedAppointments` detecta cita elegible
2. `ReviewForm` aparece como opción post-cita
3. Cliente deja rating (1-5), comentario y tipo (business/employee)
4. Review guardada en tabla `reviews`
5. Admin puede moderar y responder desde `ReviewCard`
6. `refresh-ratings-stats` actualiza vistas materializadas (cron 5 min)

## Componentes Clave

| Componente | Ubicación | Líneas | Función |
|-----------|-----------|--------|---------|
| `ReviewCard` | `src/components/reviews/` | 232 | Display con avatar anónimo, respuestas |
| `ReviewForm` | `src/components/reviews/` | 165 | Formulario con 5 estrellas clickeables |
| `ReviewList` | `src/components/reviews/` | 238 | Lista con stats, filtros, distribución |

## Tablas de Base de Datos

- `reviews` — Calificaciones (rating 1-5, comment, response, review_type: 'business'|'employee')

## Vistas Materializadas

- `business_ratings_stats` — average_rating, review_count por negocio
- `employee_ratings_stats` — average_rating, review_count por empleado
- Refresco: `refresh-ratings-stats` (cron 5 min, CONCURRENTLY)

## Hook

- `useReviews` (229 líneas) — CRUD: createReview, respondToReview, toggleVisibility, deleteReview
- `useCompletedAppointments(clientId)` — Citas completadas sin review previa
- `usePendingReviews` — Reviews pendientes del cliente
- `useMandatoryReviews` — Reviews obligatorias (reclutamiento → [[sistema-vacantes]])

## Validaciones

- Solo clientes con citas completadas pueden dejar review
- No se puede dejar review duplicada para la misma cita
- Rating obligatorio (1-5), comentario opcional
- Admin puede ocultar reviews (toggleVisibility)

## Tipos de Review

- `business` — Review del negocio en general
- `employee` — Review de un profesional específico

## Permisos Requeridos

- `reviews.create` — Dejar review (proteger con [[sistema-permisos|PermissionGate]])
- `reviews.moderate` — Moderar reviews (ocultar/mostrar)
- `reviews.respond` — Responder a reviews

## Archivos Clave

- `src/components/reviews/ReviewCard.tsx`
- `src/components/reviews/ReviewForm.tsx`
- `src/components/reviews/ReviewList.tsx`
- `src/hooks/useReviews.ts`

## Notas Relacionadas

- [[sistema-citas]] — Reviews requieren cita completada
- [[sistema-busqueda]] — Reviews alimentan ratings en vistas materializadas
- [[sistema-vacantes]] — Reviews obligatorias al contratar/finalizar
- [[sistema-perfiles-publicos]] — Tab de reviews en perfil público del negocio
- [[sistema-permisos]] — Permisos `reviews.*`
