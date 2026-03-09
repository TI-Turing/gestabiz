-- =============================================================================
-- Migration: Fix get_business_locations_with_city_names RPC function
-- =============================================================================
-- Description: Fix column reference from l.hours to l.business_hours
--              The locations table uses 'business_hours' not 'hours'
-- Date: 2026-03-09
-- Issue: 400 error "column l.hours does not exist" when loading business profile
-- =============================================================================

-- Drop existing function (return type changed)
DROP FUNCTION IF EXISTS public.get_business_locations_with_city_names(UUID);

-- Recreate with correct column name
CREATE OR REPLACE FUNCTION public.get_business_locations_with_city_names(
  p_business_id UUID
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  business_id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  city_name TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  is_active BOOLEAN,
  opens_at TIME,
  closes_at TIME,
  business_hours JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.created_at,
    l.updated_at,
    l.business_id,
    l.name,
    l.address,
    l.city,
    CASE 
      WHEN l.city ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN COALESCE((SELECT c.name FROM cities c WHERE c.id = l.city::uuid LIMIT 1), l.city)
      ELSE l.city
    END AS city_name,
    l.state,
    l.country,
    l.postal_code,
    l.latitude,
    l.longitude,
    l.phone,
    l.email,
    l.is_active,
    l.opens_at,
    l.closes_at,
    l.business_hours
  FROM locations l
  WHERE l.business_id = p_business_id
    AND l.is_active = true
  ORDER BY l.name;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_business_locations_with_city_names(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_business_locations_with_city_names(UUID) IS 
  'Returns business locations with city names resolved from cities table instead of UUIDs';
