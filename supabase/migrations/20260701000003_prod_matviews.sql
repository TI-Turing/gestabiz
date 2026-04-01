-- =============================================================================
-- Migration: PROD Materialized Views
-- Idempotent: DROP CASCADE + CREATE + unique indexes
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.appointments_with_relations CASCADE;
CREATE MATERIALIZED VIEW public.appointments_with_relations AS

 SELECT a.id,
    a.created_at,
    a.updated_at,
    a.business_id,
    a.location_id,
    a.service_id,
    a.client_id,
    a.employee_id,
    a.start_time,
    a.end_time,
    a.status,
    a.notes,
    a.client_notes,
    a.price,
    a.currency,
    a.payment_status,
    a.reminder_sent,
    a.cancelled_at,
    a.cancelled_by,
    a.cancel_reason,
    a.is_location_exception,
    a.original_location_id,
    jsonb_build_object('id', b.id, 'name', b.name, 'description', b.description) AS business,
    jsonb_build_object('id', l.id, 'name', l.name, 'address', l.address, 'city', l.city, 'state', l.state, 'postal_code', l.postal_code, 'google_maps_url', l.google_maps_url) AS location,
    jsonb_build_object('id', e.id, 'full_name', e.full_name, 'email', e.email, 'phone', e.phone, 'avatar_url', e.avatar_url) AS employee,
    jsonb_build_object('id', c.id, 'full_name', c.full_name, 'email', c.email, 'phone', c.phone, 'avatar_url', c.avatar_url) AS client,
    jsonb_build_object('id', s.id, 'name', s.name, 'description', s.description, 'duration_minutes', s.duration_minutes, 'price', s.price, 'currency', s.currency) AS service
   FROM (((((appointments a
     LEFT JOIN businesses b ON ((a.business_id = b.id)))
     LEFT JOIN locations l ON ((a.location_id = l.id)))
     LEFT JOIN profiles e ON ((a.employee_id = e.id)))
     LEFT JOIN profiles c ON ((a.client_id = c.id)))
     LEFT JOIN services s ON ((a.service_id = s.id)));

CREATE UNIQUE INDEX IF NOT EXISTS appointments_with_relations_id_idx ON public.appointments_with_relations (id);

DROP MATERIALIZED VIEW IF EXISTS public.business_ratings_stats CASCADE;
CREATE MATERIALIZED VIEW public.business_ratings_stats AS

 SELECT b.id AS business_id,
    b.name AS business_name,
    count(r.id) AS review_count,
    COALESCE(avg(r.rating), (0)::numeric) AS average_rating,
    count(CASE WHEN (r.rating = 5) THEN 1 ELSE NULL::integer END) AS five_star_count,
    count(CASE WHEN (r.rating = 4) THEN 1 ELSE NULL::integer END) AS four_star_count,
    count(CASE WHEN (r.rating = 3) THEN 1 ELSE NULL::integer END) AS three_star_count,
    count(CASE WHEN (r.rating = 2) THEN 1 ELSE NULL::integer END) AS two_star_count,
    count(CASE WHEN (r.rating = 1) THEN 1 ELSE NULL::integer END) AS one_star_count,
    max(r.created_at) AS latest_review_at
   FROM (businesses b
     LEFT JOIN reviews r ON (((b.id = r.business_id) AND (r.is_visible = true))))
  WHERE (b.is_active = true)
  GROUP BY b.id, b.name;

CREATE UNIQUE INDEX IF NOT EXISTS business_ratings_stats_business_id_idx ON public.business_ratings_stats (business_id);

DROP MATERIALIZED VIEW IF EXISTS public.employee_ratings_stats CASCADE;
CREATE MATERIALIZED VIEW public.employee_ratings_stats AS

 SELECT p.id AS employee_id,
    p.full_name AS employee_name,
    count(r.id) AS review_count,
    COALESCE(avg(r.rating), (0)::numeric) AS average_rating,
    max(r.created_at) AS latest_review_at,
    count(DISTINCT r.business_id) AS businesses_count
   FROM (profiles p
     LEFT JOIN reviews r ON (((p.id = r.employee_id) AND (r.is_visible = true))))
  GROUP BY p.id, p.full_name;

CREATE UNIQUE INDEX IF NOT EXISTS employee_ratings_stats_employee_id_idx ON public.employee_ratings_stats (employee_id);

DROP MATERIALIZED VIEW IF EXISTS public.error_logs_summary CASCADE;
CREATE MATERIALIZED VIEW public.error_logs_summary AS

 SELECT source,
    level,
    component,
    environment,
    date("timestamp") AS date,
    count(*) AS error_count,
    count(DISTINCT user_id) AS affected_users,
    count(DISTINCT error_hash) AS unique_errors
   FROM error_logs
  WHERE ("timestamp" > (now() - '30 days'::interval))
  GROUP BY source, level, component, environment, (date("timestamp"));

DROP MATERIALIZED VIEW IF EXISTS public.mv_vacancy_selection_stats CASCADE;
CREATE MATERIALIZED VIEW public.mv_vacancy_selection_stats AS

 SELECT v.id AS vacancy_id,
    v.business_id,
    v.title,
    count(CASE WHEN ((ja.status)::text = 'pending'::text) THEN 1 ELSE NULL::integer END) AS pending_count,
    count(CASE WHEN ((ja.status)::text = 'reviewing'::text) THEN 1 ELSE NULL::integer END) AS reviewing_count,
    count(CASE WHEN ((ja.status)::text = 'in_selection_process'::text) THEN 1 ELSE NULL::integer END) AS in_selection_count,
    count(CASE WHEN ((ja.status)::text = 'accepted'::text) THEN 1 ELSE NULL::integer END) AS accepted_count,
    count(CASE WHEN ((ja.status)::text = 'rejected'::text) THEN 1 ELSE NULL::integer END) AS rejected_count,
    min(CASE WHEN ((ja.status)::text = 'in_selection_process'::text) THEN ja.selection_started_at ELSE NULL::timestamp with time zone END) AS first_selection_started_at,
    max(CASE WHEN ((ja.status)::text = 'in_selection_process'::text) THEN ja.selection_started_at ELSE NULL::timestamp with time zone END) AS last_selection_started_at
   FROM (job_vacancies v
     LEFT JOIN job_applications ja ON ((ja.vacancy_id = v.id)))
  WHERE ((v.status)::text = ANY ((ARRAY['open'::character varying, 'filled'::character varying])::text[]))
  GROUP BY v.id, v.business_id, v.title;

CREATE UNIQUE INDEX IF NOT EXISTS mv_vacancy_selection_stats_vacancy_id_idx ON public.mv_vacancy_selection_stats (vacancy_id);

DROP MATERIALIZED VIEW IF EXISTS public.resource_availability CASCADE;
CREATE MATERIALIZED VIEW public.resource_availability AS

 SELECT r.id AS resource_id,
    r.business_id,
    r.location_id,
    r.name,
    r.resource_type,
    r.capacity,
    r.is_active,
    count(a.id) FILTER (WHERE ((a.status = ANY (ARRAY['pending'::appointment_status, 'confirmed'::appointment_status])) AND (a.start_time > now()))) AS upcoming_bookings,
    max(a.end_time) FILTER (WHERE (a.status = ANY (ARRAY['pending'::appointment_status, 'confirmed'::appointment_status]))) AS next_available_from
   FROM (business_resources r
     LEFT JOIN appointments a ON ((a.resource_id = r.id)))
  WHERE (r.is_active = true)
  GROUP BY r.id, r.business_id, r.location_id, r.name, r.resource_type, r.capacity, r.is_active;

CREATE UNIQUE INDEX IF NOT EXISTS resource_availability_resource_id_idx ON public.resource_availability (resource_id);

DROP MATERIALIZED VIEW IF EXISTS public.user_active_permissions CASCADE;
CREATE MATERIALIZED VIEW public.user_active_permissions AS

 SELECT user_id,
    business_id,
    array_agg(permission ORDER BY permission) AS permissions,
    count(*) AS permissions_count,
    max(updated_at) AS last_updated
   FROM user_permissions
  WHERE (is_active = true)
  GROUP BY user_id, business_id;

CREATE UNIQUE INDEX IF NOT EXISTS user_active_permissions_user_id_business_id_idx ON public.user_active_permissions (user_id, business_id);
