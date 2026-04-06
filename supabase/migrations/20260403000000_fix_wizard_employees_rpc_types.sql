-- Fix: get_wizard_employees_data devolvía expertise_level como TEXT pero la
-- columna employee_services.expertise_level es int4.
-- PostgreSQL lanzaba "structure of query does not match function result type".
-- CREATE OR REPLACE no puede cambiar tipos de retorno; se hace DROP + CREATE.

DROP FUNCTION IF EXISTS public.get_wizard_employees_data(UUID, UUID, UUID);

CREATE FUNCTION public.get_wizard_employees_data(
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
  expertise_level INTEGER,
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
     WHERE bp.id = br_supervisor.user_id LIMIT 1) AS supervisor_name,
    COALESCE(AVG(CAST(r.rating AS NUMERIC)), 0) AS avg_rating,
    COUNT(r.id) AS review_count
  FROM
    public.business_employees be
    INNER JOIN public.employee_services es
      ON be.employee_id = es.employee_id AND be.business_id = es.business_id
    INNER JOIN public.profiles p ON be.employee_id = p.id
    LEFT JOIN public.business_roles br
      ON be.business_id = br.business_id AND be.employee_id = br.user_id
    LEFT JOIN public.business_roles br_supervisor
      ON br.business_id = br_supervisor.business_id AND br_supervisor.role = 'admin'
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
