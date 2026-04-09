-- ==========================================================
-- LIMPIEZA SEGURA DE CITAS FUERA DE SEDE (3 negocios)
-- ==========================================================
-- Negocios objetivo:
-- 1) Spa Zenith Bogotá
-- 2) Salón de Belleza Glamour
-- 3) Barberia El Estilo
--
-- Este script NO se ejecuta solo. Úsalo por bloques:
-- A) Auditoría de empleados y sede asignada
-- B) Preview de citas que serían eliminadas
-- C) DELETE controlado (con RETURNING)
--
-- Regla de eliminación:
-- - Solo citas con employee_id
-- - Solo cuando employee tiene sede asignada en business_employees.location_id
-- - Solo cuando appointment.location_id <> business_employees.location_id
-- - No toca citas en la sede correcta

-- ----------------------------------------------------------
-- A) AUDITORÍA: empleados y sede asignada por negocio
-- ----------------------------------------------------------
WITH target_businesses AS (
	SELECT id, name
	FROM public.businesses
	WHERE name IN (
		'Spa Zenith Bogotá',
		'Salón de Belleza Glamour',
		'Barberia El Estilo'
	)
)
SELECT
	tb.name AS business_name,
	be.employee_id,
	p.full_name AS employee_name,
	be.role,
	be.status,
	be.is_active,
	be.location_id AS employee_location_id,
	l.name AS employee_location_name
FROM public.business_employees be
JOIN target_businesses tb ON tb.id = be.business_id
LEFT JOIN public.profiles p ON p.id = be.employee_id
LEFT JOIN public.locations l ON l.id = be.location_id
ORDER BY tb.name, employee_name NULLS LAST;

-- ----------------------------------------------------------
-- B) PREVIEW: citas fuera de sede (NO elimina)
-- ----------------------------------------------------------
WITH target_businesses AS (
	SELECT id, name
	FROM public.businesses
	WHERE name IN (
		'Spa Zenith Bogotá',
		'Salón de Belleza Glamour',
		'Barberia El Estilo'
	)
), mismatches AS (
	SELECT
		a.id AS appointment_id,
		tb.name AS business_name,
		a.business_id,
		a.employee_id,
		p.full_name AS employee_name,
		a.location_id AS appointment_location_id,
		loc_a.name AS appointment_location_name,
		be.location_id AS employee_location_id,
		loc_e.name AS employee_location_name,
		a.start_time,
		a.end_time,
		a.status
	FROM public.appointments a
	JOIN target_businesses tb ON tb.id = a.business_id
	JOIN public.business_employees be
		ON be.business_id = a.business_id
	 AND be.employee_id = a.employee_id
	LEFT JOIN public.profiles p ON p.id = a.employee_id
	LEFT JOIN public.locations loc_a ON loc_a.id = a.location_id
	LEFT JOIN public.locations loc_e ON loc_e.id = be.location_id
	WHERE a.employee_id IS NOT NULL
		AND a.location_id IS NOT NULL
		AND be.location_id IS NOT NULL
		AND a.location_id <> be.location_id
)
SELECT *
FROM mismatches
ORDER BY business_name, employee_name, start_time;

-- Resumen por negocio
WITH target_businesses AS (
	SELECT id, name
	FROM public.businesses
	WHERE name IN (
		'Spa Zenith Bogotá',
		'Salón de Belleza Glamour',
		'Barberia El Estilo'
	)
), mismatches AS (
	SELECT a.id, tb.name AS business_name
	FROM public.appointments a
	JOIN target_businesses tb ON tb.id = a.business_id
	JOIN public.business_employees be
		ON be.business_id = a.business_id
	 AND be.employee_id = a.employee_id
	WHERE a.employee_id IS NOT NULL
		AND a.location_id IS NOT NULL
		AND be.location_id IS NOT NULL
		AND a.location_id <> be.location_id
)
SELECT business_name, COUNT(*) AS citas_fuera_de_sede
FROM mismatches
GROUP BY business_name
ORDER BY business_name;

-- ----------------------------------------------------------
-- C) DELETE CONTROLADO (ejecutar solo cuando valides el preview)
-- ----------------------------------------------------------
-- Recomendado: primero correr dentro de BEGIN/ROLLBACK para validar
-- y luego cambiar ROLLBACK por COMMIT.

BEGIN;

WITH target_businesses AS (
	SELECT id
	FROM public.businesses
	WHERE name IN (
		'Spa Zenith Bogotá',
		'Salón de Belleza Glamour',
		'Barberia El Estilo'
	)
), to_delete AS (
	SELECT a.id
	FROM public.appointments a
	JOIN target_businesses tb ON tb.id = a.business_id
	JOIN public.business_employees be
		ON be.business_id = a.business_id
	 AND be.employee_id = a.employee_id
	WHERE a.employee_id IS NOT NULL
		AND a.location_id IS NOT NULL
		AND be.location_id IS NOT NULL
		AND a.location_id <> be.location_id
)
DELETE FROM public.appointments a
USING to_delete d
WHERE a.id = d.id
RETURNING a.id, a.business_id, a.employee_id, a.location_id, a.start_time, a.end_time, a.status;

-- Cambia por COMMIT cuando confirmes que el resultado es correcto.
ROLLBACK;
