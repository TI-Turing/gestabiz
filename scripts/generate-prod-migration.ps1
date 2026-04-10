# generate-prod-migration.ps1
# Generates migration SQL to sync PROD with DEV indexes, functions, trigger, RLS policies

$ErrorActionPreference = 'Stop'

# 1. Parse PROD indexes
$prodIdx = Get-Content "prod_indexes.json" | ConvertFrom-Json
$prodSet = [System.Collections.Generic.HashSet[string]]::new()
foreach ($idx in $prodIdx) { [void]$prodSet.Add($idx) }
Write-Host "PROD indexes: $($prodSet.Count)"

# 2. Parse DEV indexes from the MCP result file
$devContentPath = 'c:\Users\Usuario\AppData\Roaming\Code\User\workspaceStorage\5f145622f13b2bad2ca47fafbd276c88\GitHub.copilot-chat\chat-session-resources\323c8e3c-6e83-4336-9b4a-34eb6cfe9963\toolu_bdrk_01B96jabTiU2wWcKhwZixn21__vscode-1775825615761\content.json'
$devContent = Get-Content $devContentPath -Raw

# Extract JSON array
$jsonMatch = [regex]::Match($devContent, '\[.*\]', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if (-not $jsonMatch.Success) {
    Write-Error "Could not find JSON array in DEV content"
    exit 1
}
$devIndexes = $jsonMatch.Value | ConvertFrom-Json
Write-Host "DEV indexes: $($devIndexes.Count)"

# 3. Find missing
$missing = @()
foreach ($idx in $devIndexes) {
    if (-not $prodSet.Contains($idx.indexname)) {
        $missing += $idx
    }
}
Write-Host "Missing in PROD: $($missing.Count)"

# 4. Build migration SQL
$sb = [System.Text.StringBuilder]::new()

[void]$sb.AppendLine("-- Migration: Sync PROD with DEV - Missing indexes, functions, trigger, and RLS policies")
[void]$sb.AppendLine("-- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$sb.AppendLine("-- DEV indexes: $($devIndexes.Count) | PROD indexes: $($prodSet.Count) | Missing: $($missing.Count)")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("BEGIN;")
[void]$sb.AppendLine("")

# ---- FUNCTIONS ----
[void]$sb.AppendLine("-- ============================================================================")
[void]$sb.AppendLine("-- 1. MISSING FUNCTIONS (2)")
[void]$sb.AppendLine("-- ============================================================================")
[void]$sb.AppendLine("")

[void]$sb.AppendLine(@'
CREATE OR REPLACE FUNCTION public.update_business_closed_days_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
'@)
[void]$sb.AppendLine("")

[void]$sb.AppendLine(@'
CREATE OR REPLACE FUNCTION public.claim_invite_code(invite_code_input text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id uuid;
  v_business_id uuid;
  v_business_name text;
  v_owner_id uuid;
  v_expires_at timestamptz;
  v_existing_request_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT id, business_id, invite_code_expires_at
  INTO v_request_id, v_business_id, v_expires_at
  FROM employee_join_requests
  WHERE invite_code = upper(trim(invite_code_input))
    AND employee_id IS NULL
    AND status = 'pending'
  LIMIT 1;

  IF v_request_id IS NULL THEN
    SELECT id, business_id INTO v_request_id, v_business_id
    FROM employee_join_requests
    WHERE invite_code = upper(trim(invite_code_input))
      AND employee_id = auth.uid()
      AND status = 'pending'
    LIMIT 1;

    IF v_request_id IS NOT NULL THEN
      SELECT b.name, b.owner_id INTO v_business_name, v_owner_id
      FROM businesses b WHERE b.id = v_business_id;
      RETURN jsonb_build_object(
        'request_id', v_request_id,
        'business_id', v_business_id,
        'business_name', v_business_name,
        'owner_id', v_owner_id
      );
    END IF;

    RAISE EXCEPTION 'Codigo no encontrado o ya fue usado';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'El codigo ha vencido';
  END IF;

  SELECT id INTO v_existing_request_id
  FROM employee_join_requests
  WHERE employee_id = auth.uid()
    AND business_id = v_business_id
    AND status = 'pending'
  LIMIT 1;

  IF v_existing_request_id IS NOT NULL THEN
    SELECT b.name, b.owner_id INTO v_business_name, v_owner_id
    FROM businesses b WHERE b.id = v_business_id;
    RETURN jsonb_build_object(
      'request_id', v_existing_request_id,
      'business_id', v_business_id,
      'business_name', v_business_name,
      'owner_id', v_owner_id
    );
  END IF;

  UPDATE employee_join_requests
  SET employee_id = auth.uid(), updated_at = now()
  WHERE id = v_request_id;

  SELECT b.name, b.owner_id
  INTO v_business_name, v_owner_id
  FROM businesses b WHERE b.id = v_business_id;

  RETURN jsonb_build_object(
    'request_id', v_request_id,
    'business_id', v_business_id,
    'business_name', v_business_name,
    'owner_id', v_owner_id
  );
END;
$function$;
'@)
[void]$sb.AppendLine("")

# ---- TRIGGER ----
[void]$sb.AppendLine("-- ============================================================================")
[void]$sb.AppendLine("-- 2. MISSING TRIGGER (1)")
[void]$sb.AppendLine("-- ============================================================================")
[void]$sb.AppendLine("")
[void]$sb.AppendLine(@'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_business_closed_days_updated_at'
  ) THEN
    CREATE TRIGGER trg_business_closed_days_updated_at
      BEFORE UPDATE ON public.business_closed_days
      FOR EACH ROW EXECUTE FUNCTION update_business_closed_days_updated_at();
  END IF;
END;
$$;
'@)
[void]$sb.AppendLine("")

# ---- RLS POLICIES ----
[void]$sb.AppendLine("-- ============================================================================")
[void]$sb.AppendLine("-- 3. MISSING RLS POLICIES (3) on employee_join_requests")
[void]$sb.AppendLine("-- ============================================================================")
[void]$sb.AppendLine("")

[void]$sb.AppendLine(@'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'employee_join_requests_delete_admin' AND tablename = 'employee_join_requests'
  ) THEN
    CREATE POLICY employee_join_requests_delete_admin ON public.employee_join_requests
      FOR DELETE
      USING (
        (EXISTS ( SELECT 1
           FROM businesses
          WHERE ((businesses.id = employee_join_requests.business_id) AND (businesses.owner_id = auth.uid()))))
        OR
        (EXISTS ( SELECT 1
           FROM business_roles
          WHERE ((business_roles.business_id = employee_join_requests.business_id) AND (business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text))))
      );
  END IF;
END;
$$;
'@)
[void]$sb.AppendLine("")

[void]$sb.AppendLine(@'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'employee_join_requests_select_invite_code' AND tablename = 'employee_join_requests'
  ) THEN
    CREATE POLICY employee_join_requests_select_invite_code ON public.employee_join_requests
      FOR SELECT
      USING ((invite_code IS NOT NULL) AND (employee_id IS NULL));
  END IF;
END;
$$;
'@)
[void]$sb.AppendLine("")

[void]$sb.AppendLine(@'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'employee_join_requests_update_claim' AND tablename = 'employee_join_requests'
  ) THEN
    CREATE POLICY employee_join_requests_update_claim ON public.employee_join_requests
      FOR UPDATE
      USING ((invite_code IS NOT NULL) AND (employee_id IS NULL))
      WITH CHECK ((employee_id = auth.uid()) AND (status = 'pending'::text) AND (invite_code IS NOT NULL));
  END IF;
END;
$$;
'@)
[void]$sb.AppendLine("")

# ---- INDEXES ----
[void]$sb.AppendLine("-- ============================================================================")
[void]$sb.AppendLine("-- 4. MISSING INDEXES ($($missing.Count))")
[void]$sb.AppendLine("-- ============================================================================")
[void]$sb.AppendLine("")

foreach ($idx in $missing) {
    $indexname = $idx.indexname
    $indexdef = $idx.indexdef -replace "'", "''"

    [void]$sb.AppendLine("-- Index: $indexname")
    [void]$sb.AppendLine("DO `$`$")
    [void]$sb.AppendLine("BEGIN")
    [void]$sb.AppendLine("  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '$indexname') THEN")
    [void]$sb.AppendLine("    EXECUTE '$indexdef';")
    [void]$sb.AppendLine("  END IF;")
    [void]$sb.AppendLine("END;")
    [void]$sb.AppendLine("`$`$;")
    [void]$sb.AppendLine("")
}

[void]$sb.AppendLine("COMMIT;")

# 5. Write file
$migrationPath = "supabase/migrations/20260701100000_sync_prod_with_dev_indexes.sql"
$sb.ToString() | Set-Content -Path $migrationPath -Encoding UTF8 -NoNewline

$fileInfo = Get-Item $migrationPath
Write-Host ""
Write-Host "=== Migration Generated Successfully ==="
Write-Host "Path: $migrationPath"
Write-Host "Size: $([math]::Round($fileInfo.Length/1KB, 1)) KB"
Write-Host "Functions: 2"
Write-Host "Triggers: 1"
Write-Host "RLS Policies: 3"
Write-Host "Indexes: $($missing.Count)"
