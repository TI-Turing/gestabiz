-- Optimización del flujo de wizard: RPCs consolidadas para DateTimeSelection y EmployeeSelection
-- Reduce requests de 16-18 a 7-9 por sesión típica

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. RPC: get_wizard_employees_data
-- ─────────────────────────────────────────────────────────────────────────────
-- Consolida 4-5 queries en 1: employee_services, business_employees, business_roles, reviews
-- Input: businessId, serviceId, locationId
-- Output: Array de empleados con ratings pre-calculados, disponibilidad, etc.

CREATE OR REPLACE FUNCTION public.get_wizard_employees_data(
  p_business_id UUID,
  p_service_id UUID,
  p_location_id UUID DEFAULT NULL
)
RETURNS TABLE (
  employee_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  role TEXT,
  expertise_level TEXT,
  setup_completed BOOLEAN,
  supervisor_name TEXT,
  avg_rating NUMERIC,
  review_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    be.employee_id,
    p.full_name,
    p.avatar_url,
    p.email,
    be.role,
    es.expertise_level,
    be.setup_completed,
    (SELECT bp.full_name FROM public.profiles bp 
     WHERE bp.id = br_supervisor.user_id LIMIT 1) as supervisor_name,
    COALESCE(AVG(CAST(r.rating AS NUMERIC)), 0) as avg_rating,
    COUNT(r.id) as review_count
  FROM
    public.business_employees be
    INNER JOIN public.employee_services es ON be.employee_id = es.employee_id AND be.business_id = es.business_id
    INNER JOIN public.profiles p ON be.employee_id = p.id
    LEFT JOIN public.business_roles br ON be.business_id = br.business_id AND be.employee_id = br.user_id
    LEFT JOIN public.business_roles br_supervisor ON br.business_id = br_supervisor.business_id AND br.role = 'admin'
    LEFT JOIN public.reviews r ON r.employee_id = be.employee_id
  WHERE
    be.business_id = p_business_id
    AND es.service_id = p_service_id
    AND be.is_active = TRUE
    AND be.status = 'approved'
    AND (p_location_id IS NULL OR be.location_id = p_location_id)
  GROUP BY
    be.employee_id,
    p.full_name,
    p.avatar_url,
    p.email,
    be.role,
    es.expertise_level,
    be.setup_completed,
    br_supervisor.user_id
  ORDER BY
    avg_rating DESC NULLS LAST,
    p.full_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RPC: get_datetime_selection_data
-- ─────────────────────────────────────────────────────────────────────────────
-- Consolida 9 queries en 1 JSON compacto:
-- - location schedule (opens_at, closes_at)
-- - employee schedule (lunch break)
-- - work schedules
-- - day appointments (employee/resource)
-- - client appointments
-- - month appointments
-- - month absences
-- - employee transfer info

CREATE OR REPLACE FUNCTION public.get_datetime_selection_data(
  p_employee_id UUID DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_business_id UUID,
  p_location_id UUID,
  p_selected_date DATE,
  p_client_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_day_start TIMESTAMP;
  v_day_end TIMESTAMP;
  v_month_start DATE;
  v_month_end DATE;
BEGIN
  -- Calculate date ranges
  v_day_start := (p_selected_date::TIMESTAMP AT TIME ZONE 'America/Bogota')::DATE;
  v_day_end := (v_day_start + INTERVAL '1 day')::DATE;
  v_month_start := DATE_TRUNC('month', p_selected_date)::DATE;
  v_month_end := (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  v_result := JSONB_BUILD_OBJECT(
    'location_schedule', (
      SELECT JSONB_BUILD_OBJECT(
        'opens_at', opens_at,
        'closes_at', closes_at
      )
      FROM public.locations
      WHERE id = p_location_id
    ),
    'employee_schedule', CASE WHEN p_employee_id IS NOT NULL THEN (
      SELECT JSONB_BUILD_OBJECT(
        'lunch_break_start', lunch_break_start,
        'lunch_break_end', lunch_break_end,
        'has_lunch_break', has_lunch_break
      )
      FROM public.business_employees
      WHERE employee_id = p_employee_id AND business_id = p_business_id
    ) ELSE NULL END,
    'work_schedules', COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'day_of_week', day_of_week,
        'is_working', is_working
      ))
      FROM public.work_schedules
      WHERE employee_id = p_employee_id),
      '[]'::JSONB
    ),
    'day_appointments', COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', id,
        'start_time', start_time,
        'end_time', end_time,
        'status', status
      ) ORDER BY start_time)
      FROM public.appointments
      WHERE
        (CASE WHEN p_employee_id IS NOT NULL THEN employee_id = p_employee_id
              WHEN p_resource_id IS NOT NULL THEN resource_id = p_resource_id
              ELSE FALSE END)
        AND start_time >= v_day_start::TIMESTAMP
        AND end_time <= v_day_end::TIMESTAMP
        AND status IN ('pending', 'confirmed')),
      '[]'::JSONB
    ),
    'client_day_appointments', CASE WHEN p_client_id IS NOT NULL THEN COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', id,
        'start_time', start_time,
        'end_time', end_time,
        'status', status
      ) ORDER BY start_time)
      FROM public.appointments
      WHERE
        client_id = p_client_id
        AND start_time >= v_day_start::TIMESTAMP
        AND end_time <= v_day_end::TIMESTAMP
        AND status IN ('pending', 'confirmed')),
      '[]'::JSONB
    ) ELSE NULL END,
    'month_appointments', COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', id,
        'start_time', start_time,
        'end_time', end_time,
        'status', status,
        'employee_id', employee_id,
        'resource_id', resource_id
      ) ORDER BY start_time)
      FROM public.appointments
      WHERE
        ((CASE WHEN p_employee_id IS NOT NULL THEN employee_id = p_employee_id
               WHEN p_resource_id IS NOT NULL THEN resource_id = p_resource_id
               ELSE FALSE END)
        OR business_id = p_business_id)
        AND start_time::DATE >= v_month_start
        AND start_time::DATE <= v_month_end
        AND status IN ('pending', 'confirmed')),
      '[]'::JSONB
    ),
    'month_absences', CASE WHEN p_employee_id IS NOT NULL THEN COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', id,
        'start_date', start_date,
        'end_date', end_date,
        'absence_type', absence_type,
        'status', status
      ))
      FROM public.employee_absences
      WHERE
        employee_id = p_employee_id
        AND business_id = p_business_id
        AND status = 'approved'
        AND start_date <= v_month_end
        AND end_date >= v_month_start),
      '[]'::JSONB
    ) ELSE NULL END,
    'employee_transfer', CASE WHEN p_employee_id IS NOT NULL THEN (
      SELECT JSONB_BUILD_OBJECT(
        'location_id', location_id,
        'transfer_status', transfer_status,
        'transfer_effective_date', transfer_effective_date,
        'transfer_to_location_id', transfer_to_location_id
      )
      FROM public.business_employees
      WHERE employee_id = p_employee_id AND business_id = p_business_id
    ) ELSE NULL END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Índices para optimizar las queries dentro de las RPCs
-- ─────────────────────────────────────────────────────────────────────────────

-- Índice para employee_services (ya debería existir pero verificamos)
CREATE INDEX IF NOT EXISTS idx_employee_services_business_service
ON public.employee_services(business_id, service_id);

-- Índice para business_employees (ya debería existir pero verificamos)
CREATE INDEX IF NOT EXISTS idx_business_employees_business_location_active
ON public.business_employees(business_id, location_id, is_active, status);

-- Índice para appointments por rango de fecha (para month queries)
CREATE INDEX IF NOT EXISTS idx_appointments_start_time
ON public.appointments(start_time) WHERE status IN ('pending', 'confirmed');

-- Índice para employee_absences
CREATE INDEX IF NOT EXISTS idx_employee_absences_status_dates
ON public.employee_absences(employee_id, status, start_date, end_date);
