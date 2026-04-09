-- Fix: alinear la disponibilidad del wizard con la validación real de conflictos.
-- Problema: la RPC solo consideraba ('pending','confirmed') y omitía estados activos
-- como 'scheduled' o 'rescheduled', mostrando slots disponibles que luego fallaban al guardar.

CREATE OR REPLACE FUNCTION public.get_datetime_selection_data(
  p_business_id UUID,
  p_location_id UUID,
  p_selected_date DATE,
  p_employee_id UUID DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
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
        AND status NOT IN ('cancelled', 'no_show')),
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
        AND status NOT IN ('cancelled', 'no_show')),
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
        AND status NOT IN ('cancelled', 'no_show')),
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
