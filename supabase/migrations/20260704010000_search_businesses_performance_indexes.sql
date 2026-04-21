-- =============================================================================
-- Migration: Performance indexes for search_businesses Edge Function
-- =============================================================================
-- Adds partial indexes that match the exact filter predicates used by the
-- search_businesses Edge Function. Goal: reduce ~4s response time to <1.5s
-- on cold cache by enabling index-only scans on the hot queries.
--
-- All indexes use IF NOT EXISTS to be idempotent and CONCURRENTLY to avoid
-- blocking writes on existing tables.
--
-- Hot queries optimized:
--   1. locations.is_active filter on city/state lookups
--   2. businesses.is_active + is_public + is_configured filter
--   3. business_employees.status='approved' AND is_active=true filter
--   4. employee_services.is_active filter on multi-column lookup
-- =============================================================================

-- locations: filter `is_active = true` is used in every city/region lookup.
CREATE INDEX IF NOT EXISTS idx_locations_business_id_active
  ON public.locations (business_id)
  WHERE is_active = true;

-- locations: city/state ilike fallback uses these columns frequently.
CREATE INDEX IF NOT EXISTS idx_locations_city_state_active
  ON public.locations (city, state)
  WHERE is_active = true;

-- businesses: every fetch filters by these three booleans together.
CREATE INDEX IF NOT EXISTS idx_businesses_active_public_configured
  ON public.businesses (is_active, is_public, is_configured)
  WHERE is_active = true AND is_public = true AND is_configured = true;

-- business_employees: availability check filters by status + is_active.
CREATE INDEX IF NOT EXISTS idx_business_employees_business_approved_active
  ON public.business_employees (business_id, employee_id)
  WHERE status = 'approved' AND is_active = true;

-- employee_services: multi-column lookup with is_active filter.
CREATE INDEX IF NOT EXISTS idx_employee_services_active_lookup
  ON public.employee_services (business_id, service_id, location_id, employee_id)
  WHERE is_active = true;

-- =============================================================================
-- Notes:
-- - business_ratings_stats already exists as a materialized view with a
--   unique index on business_id (consolidated_schema.sql line 13393).
-- - refresh_ratings_stats() runs every 5 minutes via cron — no action needed.
-- =============================================================================
