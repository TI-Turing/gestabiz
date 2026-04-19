---
date: 2026-04-19
tags: [sistema, festivos, holidays, colombia, produccion]
status: completado
---

# Tabla de Festivos Públicos

54 festivos colombianos 2025-2027 precargados para validar ausencias, vacaciones y bloqueo de slots en citas.

## Descripción

La tabla `public_holidays` almacena festivos nacionales. El hook `usePublicHolidays` proporciona helpers para consultar si una fecha es festiva y obtener su nombre. Se integra con [[sistema-ausencias|ausencias]], [[sistema-citas|citas]] y vacaciones.

## Tabla de Base de Datos

`public.public_holidays`:
- `country_id` — País (ej: 'CO' para Colombia)
- `name` — Nombre del festivo
- `holiday_date` — Fecha (DATE)
- `is_recurring` — Si se repite cada año
- `description` — Descripción opcional

### Índices
- `country_id`
- `holiday_date`
- Combined: `(country_id, holiday_date)`

### RLS
- SELECT: público (cualquiera puede leer)
- INSERT/UPDATE/DELETE: solo admins

## Datos Cargados

- 54 festivos colombianos para 2025, 2026 y 2027
- 13 festivos fijos por año (Año Nuevo, Navidad, Independencia, etc.)
- 5 festivos móviles por año (basados en Pascua: Carnaval, Semana Santa, Corpus Christi)

## Hook

`usePublicHolidays(countryId, year)` — 85 líneas:
- Query cacheada: `['public-holidays', countryId, currentYear]`
- **StaleTime: 24 horas** (datos estables)
- Helpers: `isHoliday(date)`, `getHolidayName(date)`
- Formato fechas: YYYY-MM-DD

## Integración

| Módulo | Cómo usa festivos |
|--------|-------------------|
| AbsenceRequestModal | Valida festivos en rangos de ausencia |
| VacationDaysWidget | Excluye festivos del cálculo de días de vacaciones |
| DateTimeSelection | Bloquea slots en festivos públicos |
| Formularios | Validación automática |

## Migraciones

- `20251020000003_create_public_holidays_table.sql` — Creación de tabla + índices + RLS
- `20251020000004_seed_colombian_holidays.sql` — Seed de 54 festivos

## Error Resuelto

> **PGRST205: Could not find the table 'public.public_holidays'**
> Causa: tabla no existía en Supabase. Solución: crear tabla + cargar datos + RLS + Índices.
> Estado: ✅ RESUELTO.

## Archivos Clave

- `src/hooks/usePublicHolidays.ts`

## Notas Relacionadas

- [[sistema-ausencias]] — Valida festivos en solicitudes de ausencia
- [[sistema-citas]] — DateTimeSelection bloquea slots en festivos
- [[base-de-datos]] — Tabla con RLS y triggers auto-updated_at
