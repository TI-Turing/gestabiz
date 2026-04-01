---
date: 2026-03-29
tags: [feature, perfil-publico, profesional, completado]
---

# Perfil Público de Profesional

## URL

`/profesional/:employeeId`

## Qué muestra

- Avatar, nombre, job_title, enlace al negocio donde trabaja
- Rating promedio + total de reseñas
- Años de experiencia (de `employee_profiles`)
- Resumen profesional
- Especializaciones (badges)
- Servicios que ofrece con precio y duración + botón "Reservar" por servicio
- Reseñas visibles con avatar del cliente
- CTA "Reservar cita" (mobile al top, desktop inline)

## Flujo de reserva

Botón "Reservar" → `/negocio/:businessSlug?book=true&employeeId=:id`
→ `PublicBusinessProfile` detecta `?book=true` + `?employeeId` → llama `handleBookAppointment(undefined, undefined, employeeId)`
→ abre wizard con negocio Y empleado pre-seleccionados

## Compartir enlace

El empleado puede copiar su link público desde:
- `CompleteUnifiedSettings` → tab "Preferencias de empleado" → card "Tu perfil público"
- Botón copiar + botón abrir en nueva pestaña

## Archivos

- `src/pages/PublicEmployeeProfile.tsx` (nuevo)
- `src/App.tsx` — ruta `/profesional/:employeeId`
- `src/pages/PublicBusinessProfile.tsx` — lee `employeeId` al auto-book
- `src/components/settings/EmployeeRolePreferences.tsx` — card compartir perfil
