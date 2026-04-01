"""
Script para generar los 5 archivos de migración PROD a partir de los datos extraídos de DEV.
Ejecutar con: python scripts/generate_prod_migrations.py
"""
import json
import os
import re

BASE = r"c:\Users\Usuario\AppData\Roaming\Code\User\workspaceStorage\5f145622f13b2bad2ca47fafbd276c88\GitHub.copilot-chat\chat-session-resources\4768e3f3-5b93-4e42-86a3-ee8316891904"
MIGRATIONS_DIR = r"c:\Users\Usuario\source\repos\TI-Turing\gestabiz\supabase\migrations"

DEV_REF = "dkancockzvcqorqbwtyh"
PROD_REF = "emknatoknbomvmyumqju"
PROD_ANON_KEY = "REMOVED_SUPABASE_ANON_JWT"

# --- File paths for raw data ---
UTIL_FN_FILES = [
    os.path.join(BASE, "toolu_bdrk_015gxPgnX3AeM52CoECxa9rg__vscode-1775041568280", "content.json"),  # 0-29
    os.path.join(BASE, "toolu_bdrk_01W3K3FMN7hQXqjGRe7zSvTM__vscode-1775041568281", "content.json"),  # 30-59
    os.path.join(BASE, "toolu_bdrk_01K4zrLeiB5on4HDW2AxLZFS__vscode-1775041568282", "content.json"),  # 60-89
    os.path.join(BASE, "toolu_bdrk_01TjLFYCwC1DKwSZn2ytzBJd__vscode-1775041568283", "content.json"),  # 90-119
]
TRIGGER_FN_FILES = [
    os.path.join(BASE, "toolu_bdrk_013r9SCQoba42SvMM2KgJ5am__vscode-1775041568285", "content.json"),  # 0-44
    os.path.join(BASE, "toolu_bdrk_0111XdrbMWFppdRbx7gJd4bW__vscode-1775041568286", "content.json"),  # 45+
]
TRIGGER_METADATA_FILE = os.path.join(BASE, "toolu_bdrk_01TwDxkCEeH4jYwHGSJXMvPw__vscode-1775041568214", "content.json")
STORAGE_POLICIES_FILE = os.path.join(BASE, "toolu_bdrk_01EEL8PNzjeFa1iG796cESSD__vscode-1775041568288", "content.json")


def load_json_results(filepath):
    """Load the JSON array from a Supabase MCP result file."""
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()
    
    # The file is a JSON object with a "result" key containing a string
    # Inside that string, there's an <untrusted-data-...> tag wrapping a JSON array
    try:
        outer = json.loads(text)
        if isinstance(outer, dict) and "result" in outer:
            result_str = outer["result"]
        else:
            result_str = text
    except json.JSONDecodeError:
        result_str = text
    
    # Extract JSON array from between untrusted-data tags or raw text
    # Look for the JSON array pattern - greedy match from first [ to last ]
    match = re.search(r'\[.*\]', result_str, re.DOTALL)
    if match:
        json_str = match.group(0)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"  WARNING: JSON parse error in {filepath}: {e}")
            # Try to fix common issues like escaped newlines
            json_str = json_str.replace('\r\n', '\\r\\n').replace('\r', '\\r').replace('\n', '\\n')
            return json.loads(json_str)
    return []


def replace_dev_url(funcdef):
    """Replace DEV Supabase URLs with PROD URLs."""
    return funcdef.replace(DEV_REF, PROD_REF)


def clean_funcdef(funcdef):
    """Clean the function definition from escape sequences."""
    # Replace \r\n with \n, then \r alone
    funcdef = funcdef.replace("\\r\\n", "\n").replace("\\r", "\n").replace("\\n", "\n").replace("\\t", "\t")
    return funcdef


# =====================
# MIGRATION 1: FUNCTIONS
# =====================
def generate_functions_migration():
    print("Generating migration 1: functions...")
    
    # Collect all utility functions
    all_util_fns = []
    for fp in UTIL_FN_FILES:
        if os.path.exists(fp):
            rows = load_json_results(fp)
            all_util_fns.extend(rows)
            print(f"  Loaded {len(rows)} utility functions from {os.path.basename(os.path.dirname(fp))}")
    
    # Collect all trigger functions
    all_trigger_fns = []
    for fp in TRIGGER_FN_FILES:
        if os.path.exists(fp):
            rows = load_json_results(fp)
            all_trigger_fns.extend(rows)
            print(f"  Loaded {len(rows)} trigger functions from {os.path.basename(os.path.dirname(fp))}")
    
    print(f"  Total utility functions: {len(all_util_fns)}")
    print(f"  Total trigger functions: {len(all_trigger_fns)}")
    
    # Dependency ordering for utility functions
    # Functions that other functions depend on MUST come first
    priority_order = [
        "is_business_owner",  # used by is_business_admin, is_business_owner_for_storage
        "validate_business_configuration",  # used by update_business_configuration
        "extract_storage_entity_id",  # used by can_manage_location_media, can_manage_service_media
        "generate_invitation_code",  # used by auto_generate_invitation_code trigger
        "create_in_app_notification",  # used by many trigger functions
        "calculate_absence_days",  # used by update_vacation_balance_on_absence
        "refresh_ratings_stats",  # used by trigger_refresh_ratings_stats
    ]
    
    # Build name->funcdef map for utility functions
    util_map = {}
    for row in all_util_fns:
        name = row["proname"]
        funcdef = row["funcdef"]
        # Some functions have multiple overloads, collect them all
        if name not in util_map:
            util_map[name] = []
        util_map[name].append(funcdef)
    
    # Build name->funcdef map for trigger functions
    trigger_map = {}
    for row in all_trigger_fns:
        name = row["proname"]
        funcdef = row["funcdef"]
        if name not in trigger_map:
            trigger_map[name] = []
        trigger_map[name].append(funcdef)
    
    lines = []
    lines.append("-- =============================================================================")
    lines.append("-- Migration: PROD Functions (Utility + Trigger)")
    lines.append("-- Idempotent: uses CREATE OR REPLACE FUNCTION")
    lines.append("-- Generated from DEV environment with PROD URL substitutions")
    lines.append("-- =============================================================================")
    lines.append("")
    
    # Write priority functions first
    lines.append("-- ========================")
    lines.append("-- PRIORITY FUNCTIONS (dependencies)")
    lines.append("-- ========================")
    lines.append("")
    
    written = set()
    for pname in priority_order:
        if pname in util_map:
            for funcdef in util_map[pname]:
                funcdef = replace_dev_url(funcdef)
                lines.append(funcdef.rstrip())
                lines.append(";")
                lines.append("")
            written.add(pname)
    
    # Write remaining utility functions alphabetically
    lines.append("-- ========================")
    lines.append("-- UTILITY FUNCTIONS (alphabetical)")
    lines.append("-- ========================")
    lines.append("")
    
    for name in sorted(util_map.keys()):
        if name in written:
            continue
        for funcdef in util_map[name]:
            funcdef = replace_dev_url(funcdef)
            lines.append(funcdef.rstrip())
            lines.append(";")
            lines.append("")
        written.add(name)
    
    # Write trigger functions
    lines.append("-- ========================")
    lines.append("-- TRIGGER FUNCTIONS")
    lines.append("-- ========================")
    lines.append("")
    
    for name in sorted(trigger_map.keys()):
        for funcdef in trigger_map[name]:
            funcdef = replace_dev_url(funcdef)
            lines.append(funcdef.rstrip())
            lines.append(";")
            lines.append("")
    
    content = "\n".join(lines)
    outpath = os.path.join(MIGRATIONS_DIR, "20260701000001_prod_functions.sql")
    with open(outpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Written: {outpath} ({len(content)} bytes)")
    return outpath


# =====================
# MIGRATION 2: TRIGGERS
# =====================
def generate_triggers_migration():
    print("Generating migration 2: triggers...")
    
    triggers = load_json_results(TRIGGER_METADATA_FILE)
    print(f"  Total triggers: {len(triggers)}")
    
    lines = []
    lines.append("-- =============================================================================")
    lines.append("-- Migration: PROD Triggers")
    lines.append("-- Idempotent: DROP TRIGGER IF EXISTS + CREATE TRIGGER")
    lines.append("-- =============================================================================")
    lines.append("")
    
    for t in triggers:
        trig_name = t["trigger_name"]
        schema = t["schema_name"]
        table = t["table_name"]
        fn_name = t["function_name"]
        timing = t["timing"]  # BEFORE or AFTER
        level = t["level"]    # FOR EACH ROW or FOR EACH STATEMENT
        events = t["events"]  # INSERT, UPDATE, DELETE, INSERT OR DELETE, etc
        
        full_table = f"{schema}.{table}"
        
        lines.append(f"DROP TRIGGER IF EXISTS {trig_name} ON {full_table};")
        lines.append(f"CREATE TRIGGER {trig_name}")
        lines.append(f"  {timing} {events} ON {full_table}")
        lines.append(f"  {level}")
        lines.append(f"  EXECUTE FUNCTION public.{fn_name}();")
        lines.append("")
    
    content = "\n".join(lines)
    outpath = os.path.join(MIGRATIONS_DIR, "20260701000002_prod_triggers.sql")
    with open(outpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Written: {outpath} ({len(content)} bytes)")
    return outpath


# =====================
# MIGRATION 3: MATERIALIZED VIEWS
# =====================
def generate_matviews_migration():
    print("Generating migration 3: materialized views...")
    
    # Matview definitions (from session data)
    matviews = [
        {
            "name": "appointments_with_relations",
            "unique_index_col": "id",
            "definition": """
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
     LEFT JOIN services s ON ((a.service_id = s.id)))"""
        },
        {
            "name": "business_ratings_stats",
            "unique_index_col": "business_id",
            "definition": """
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
  GROUP BY b.id, b.name"""
        },
        {
            "name": "employee_ratings_stats",
            "unique_index_col": "employee_id",
            "definition": """
 SELECT p.id AS employee_id,
    p.full_name AS employee_name,
    count(r.id) AS review_count,
    COALESCE(avg(r.rating), (0)::numeric) AS average_rating,
    max(r.created_at) AS latest_review_at,
    count(DISTINCT r.business_id) AS businesses_count
   FROM (profiles p
     LEFT JOIN reviews r ON (((p.id = r.employee_id) AND (r.is_visible = true))))
  GROUP BY p.id, p.full_name"""
        },
        {
            "name": "error_logs_summary",
            "unique_index_col": None,  # No unique index possible
            "definition": """
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
  GROUP BY source, level, component, environment, (date("timestamp"))"""
        },
        {
            "name": "mv_vacancy_selection_stats",
            "unique_index_col": "vacancy_id",
            "definition": """
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
  GROUP BY v.id, v.business_id, v.title"""
        },
        {
            "name": "resource_availability",
            "unique_index_col": "resource_id",
            "definition": """
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
  GROUP BY r.id, r.business_id, r.location_id, r.name, r.resource_type, r.capacity, r.is_active"""
        },
        {
            "name": "user_active_permissions",
            "unique_index_col": "user_id, business_id",
            "definition": """
 SELECT user_id,
    business_id,
    array_agg(permission ORDER BY permission) AS permissions,
    count(*) AS permissions_count,
    max(updated_at) AS last_updated
   FROM user_permissions
  WHERE (is_active = true)
  GROUP BY user_id, business_id"""
        },
    ]
    
    lines = []
    lines.append("-- =============================================================================")
    lines.append("-- Migration: PROD Materialized Views")
    lines.append("-- Idempotent: DROP CASCADE + CREATE + unique indexes")
    lines.append("-- =============================================================================")
    lines.append("")
    
    for mv in matviews:
        name = mv["name"]
        lines.append(f"DROP MATERIALIZED VIEW IF EXISTS public.{name} CASCADE;")
        lines.append(f"CREATE MATERIALIZED VIEW public.{name} AS")
        lines.append(f"{mv['definition'].rstrip()};")
        lines.append("")
        
        if mv["unique_index_col"]:
            cols = mv["unique_index_col"]
            idx_suffix = cols.replace(", ", "_")
            lines.append(f"CREATE UNIQUE INDEX IF NOT EXISTS {name}_{idx_suffix}_idx ON public.{name} ({cols});")
            lines.append("")
    
    content = "\n".join(lines)
    outpath = os.path.join(MIGRATIONS_DIR, "20260701000003_prod_matviews.sql")
    with open(outpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Written: {outpath} ({len(content)} bytes)")
    return outpath


# =====================
# MIGRATION 4: STORAGE
# =====================
def generate_storage_migration():
    print("Generating migration 4: storage...")
    
    policies = load_json_results(STORAGE_POLICIES_FILE)
    print(f"  Total storage policies: {len(policies)}")
    
    lines = []
    lines.append("-- =============================================================================")
    lines.append("-- Migration: PROD Storage Buckets + Policies")
    lines.append("-- Idempotent: ON CONFLICT for buckets, DROP + CREATE for policies")
    lines.append("-- =============================================================================")
    lines.append("")
    
    # Buckets
    lines.append("-- ========================")
    lines.append("-- STORAGE BUCKETS")
    lines.append("-- ========================")
    lines.append("")
    
    buckets = [
        ("bug-reports-evidence", False, 10485760, "ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm','application/pdf','text/plain','application/json']"),
        ("business-logos", True, 2097152, "ARRAY['image/png','image/jpeg','image/jpg','image/webp']"),
        ("chat-attachments", False, 10485760, "ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','text/plain','application/zip','application/x-rar-compressed']"),
        ("cvs", False, 5242880, "ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']"),
        ("location-images", True, 5242880, "ARRAY['image/png','image/jpeg','image/jpg','image/webp']"),
        ("location-videos", True, None, None),
        ("service-images", True, 2097152, "ARRAY['image/png','image/jpeg','image/jpg','image/webp']"),
        ("user-avatars", True, 2097152, "ARRAY['image/png','image/jpeg','image/jpg','image/webp']"),
    ]
    
    for bid, public, size_limit, mime_types in buckets:
        pub = "true" if public else "false"
        sz = str(size_limit) if size_limit else "NULL"
        mt = mime_types if mime_types else "NULL"
        lines.append(f"INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)")
        lines.append(f"VALUES ('{bid}', '{bid}', {pub}, {sz}, {mt})")
        lines.append(f"ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;")
        lines.append("")
    
    # Policies
    lines.append("-- ========================")
    lines.append("-- STORAGE POLICIES")
    lines.append("-- ========================")
    lines.append("")
    
    for p in policies:
        pname = p["policyname"].replace("'", "''")
        cmd = p["cmd"]
        roles = p["roles"]  # e.g., {authenticated} or {public}
        using_expr = p["using_expr"]
        with_check = p["with_check"]
        
        # Parse roles from PostgreSQL array format
        role_str = roles.strip("{}").strip()
        
        lines.append(f"DROP POLICY IF EXISTS \"{p['policyname']}\" ON storage.objects;")
        
        if cmd == "SELECT":
            lines.append(f"CREATE POLICY \"{p['policyname']}\" ON storage.objects")
            lines.append(f"  FOR SELECT TO {role_str}")
            if using_expr:
                lines.append(f"  USING ({using_expr});")
            else:
                lines.append(f"  USING (true);")
        elif cmd == "INSERT":
            lines.append(f"CREATE POLICY \"{p['policyname']}\" ON storage.objects")
            lines.append(f"  FOR INSERT TO {role_str}")
            if with_check:
                lines.append(f"  WITH CHECK ({with_check});")
            else:
                lines.append(f"  WITH CHECK (true);")
        elif cmd == "UPDATE":
            lines.append(f"CREATE POLICY \"{p['policyname']}\" ON storage.objects")
            lines.append(f"  FOR UPDATE TO {role_str}")
            if using_expr:
                lines.append(f"  USING ({using_expr})")
            else:
                lines.append(f"  USING (true)")
            if with_check:
                lines.append(f"  WITH CHECK ({with_check});")
            else:
                lines.append(f";")
        elif cmd == "DELETE":
            lines.append(f"CREATE POLICY \"{p['policyname']}\" ON storage.objects")
            lines.append(f"  FOR DELETE TO {role_str}")
            if using_expr:
                lines.append(f"  USING ({using_expr});")
            else:
                lines.append(f"  USING (true);")
        
        lines.append("")
    
    content = "\n".join(lines)
    outpath = os.path.join(MIGRATIONS_DIR, "20260701000004_prod_storage.sql")
    with open(outpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Written: {outpath} ({len(content)} bytes)")
    return outpath


# =====================
# MIGRATION 5: CRON JOBS
# =====================
def generate_cron_migration():
    print("Generating migration 5: cron jobs...")
    
    lines = []
    lines.append("-- =============================================================================")
    lines.append("-- Migration: PROD Cron Jobs (pg_cron + pg_net)")
    lines.append("-- Idempotent: unschedule existing + reschedule with PROD URLs")
    lines.append("-- =============================================================================")
    lines.append("")
    lines.append("-- Unschedule existing jobs (idempotent)")
    lines.append("SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('appointment-status-updater', 'process-appointment-reminders');")
    lines.append("")
    lines.append("-- Schedule appointment status updater (every 30 min)")
    lines.append(f"SELECT cron.schedule(")
    lines.append(f"  'appointment-status-updater',")
    lines.append(f"  '*/30 * * * *',")
    lines.append(f"  $$SELECT net.http_post(")
    lines.append(f"    url:='https://{PROD_REF}.supabase.co/functions/v1/appointment-status-updater',")
    lines.append(f"    headers:='{{\"Content-Type\":\"application/json\",\"Authorization\":\"Bearer {PROD_ANON_KEY}\"}}'::jsonb,")
    lines.append(f"    body:='{{}}'::jsonb")
    lines.append(f"  )$$")
    lines.append(f");")
    lines.append("")
    lines.append("-- Schedule appointment reminders processor (every 30 min)")
    lines.append(f"SELECT cron.schedule(")
    lines.append(f"  'process-appointment-reminders',")
    lines.append(f"  '*/30 * * * *',")
    lines.append(f"  $$SELECT net.http_post(")
    lines.append(f"    url:='https://{PROD_REF}.supabase.co/functions/v1/process-reminders',")
    lines.append(f"    headers:='{{\"Content-Type\":\"application/json\",\"Authorization\":\"Bearer {PROD_ANON_KEY}\"}}'::jsonb,")
    lines.append(f"    body:='{{}}'::jsonb")
    lines.append(f"  )$$")
    lines.append(f");")
    lines.append("")
    
    content = "\n".join(lines)
    outpath = os.path.join(MIGRATIONS_DIR, "20260701000005_prod_cron_jobs.sql")
    with open(outpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Written: {outpath} ({len(content)} bytes)")
    return outpath


if __name__ == "__main__":
    print("=" * 60)
    print("Generating PROD migration files...")
    print("=" * 60)
    
    os.makedirs(MIGRATIONS_DIR, exist_ok=True)
    
    # Generate in order
    generate_functions_migration()
    generate_triggers_migration()
    generate_matviews_migration()
    generate_storage_migration()
    generate_cron_migration()
    
    print("")
    print("=" * 60)
    print("All 5 migration files generated successfully!")
    print("=" * 60)
    print(f"\nNext step: cd {os.path.dirname(MIGRATIONS_DIR)}")
    print(f"           npx supabase db push --project-ref {PROD_REF} --dns-resolver https --yes")
