-- Migration: Create employee performance RPC functions
-- Used by useEmployeeMetrics hook (src/hooks/useEmployeeMetrics.ts)
-- Covers last 30 days by default

CREATE OR REPLACE FUNCTION calculate_employee_occupancy(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC * 100.0 / COUNT(*)::NUMERIC,
        1
      )
    END,
    0
  )
  FROM appointments
  WHERE employee_id = p_user_id
    AND business_id = p_business_id
    AND start_time >= NOW() - INTERVAL '30 days';
$$;

CREATE OR REPLACE FUNCTION calculate_employee_rating_by_business(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    ROUND(AVG(rating)::NUMERIC, 2),
    0
  )
  FROM reviews
  WHERE employee_id = p_user_id
    AND business_id = p_business_id
    AND is_visible = true;
$$;

CREATE OR REPLACE FUNCTION calculate_employee_revenue(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    SUM(
      COALESCE(a.gross_amount, s.price, 0)
    ),
    0
  )
  FROM appointments a
  LEFT JOIN services s ON s.id = a.service_id
  WHERE a.employee_id = p_user_id
    AND a.business_id = p_business_id
    AND a.status = 'completed'
    AND a.start_time >= NOW() - INTERVAL '30 days';
$$;

GRANT EXECUTE ON FUNCTION calculate_employee_occupancy(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_employee_rating_by_business(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_employee_revenue(UUID, UUID) TO authenticated;
