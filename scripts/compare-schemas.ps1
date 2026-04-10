
# Script para extraer y comparar schemas de DEV y PROD
# Usa la Management API de Supabase
#
# CONFIGURACIÓN: establecer la variable de entorno antes de ejecutar:
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
# O agregar al archivo .env y cargar con: . .\environments\local\.env.ps1

$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token) {
    Write-Error "SUPABASE_ACCESS_TOKEN no está configurado. Establecer la variable de entorno antes de ejecutar."
    exit 1
}

$devRef = "dkancockzvcqorqbwtyh"
$prodRef = "emknatoknbomvmyumqju"
$apiBase = "https://api.supabase.com/v1/projects"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

function Invoke-SupabaseSQL {
    param(
        [string]$ProjectRef,
        [string]$Query
    )
    $body = @{ query = $Query } | ConvertTo-Json
    try {
        $resp = Invoke-RestMethod -Uri "$apiBase/$ProjectRef/database/query" `
            -Method POST -Headers $headers -Body $body
        return $resp
    } catch {
        Write-Error "Error querying $ProjectRef : $_"
        return $null
    }
}

# ── Query 1: Tablas y columnas ──
$schemaQuery = @"
SELECT 
  t.table_name,
  c.column_name,
  c.ordinal_position,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  COALESCE(LEFT(c.column_default, 80), 'NULL') as col_default
FROM information_schema.tables t
JOIN information_schema.columns c 
  ON c.table_schema = t.table_schema AND c.table_name = t.table_name
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;
"@

# ── Query 2: Funciones ──
$functionsQuery = @"
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  t.typname as return_type,
  CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_type t ON p.prorettype = t.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
"@

# ── Query 3: Triggers ──
$triggersQuery = @"
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
"@

# ── Query 4: Enums ──
$enumsQuery = @"
SELECT 
  t.typname as enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;
"@

# ── Query 5: Indexes ──
$indexesQuery = @"
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
"@

# ── Query 6: RLS Policies ──
$rlsQuery = @"
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  LEFT(qual::text, 200) as using_expr,
  LEFT(with_check::text, 200) as check_expr
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
"@

# ── Query 7: Constraints ──
$constraintsQuery = @"
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  LEFT(cc.check_clause, 200) as check_clause,
  kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name AND tc.constraint_schema = cc.constraint_schema
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.constraint_schema = kcu.constraint_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;
"@

# ── Query 8: Views & Materialized Views ──
$viewsQuery = @"
SELECT 'view' as type, table_name as name, LEFT(view_definition, 300) as definition
FROM information_schema.views 
WHERE table_schema = 'public'
UNION ALL
SELECT 'matview', matviewname, LEFT(definition, 300)
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY type, name;
"@

function Format-SchemaOutput {
    param(
        [string]$Label,
        [object]$Tables,
        [object]$Functions,
        [object]$Triggers,
        [object]$Enums,
        [object]$Indexes,
        [object]$RLS,
        [object]$Constraints,
        [object]$Views
    )

    $output = "# SCHEMA DUMP: $Label`n"
    $output += "# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
    $output += "# ============================================`n`n"

    # ── TABLES ──
    $output += "## TABLES AND COLUMNS`n"
    $output += "=" * 60 + "`n`n"
    if ($Tables) {
        $currentTable = ""
        foreach ($row in $Tables) {
            if ($row.table_name -ne $currentTable) {
                if ($currentTable -ne "") { $output += "`n" }
                $currentTable = $row.table_name
                $output += "TABLE: $currentTable`n"
                $output += "-" * 40 + "`n"
            }
            $nullable = if ($row.is_nullable -eq 'YES') { 'NULL' } else { 'NOT NULL' }
            $default = if ($row.col_default -eq 'NULL') { '' } else { " DEFAULT $($row.col_default)" }
            $output += "  $($row.ordinal_position.ToString().PadLeft(3)). $($row.column_name.PadRight(40)) $($row.udt_name.PadRight(20)) $($nullable)$default`n"
        }
    } else { $output += "(no data)`n" }
    
    # ── ENUMS ──
    $output += "`n`n## ENUMS`n"
    $output += "=" * 60 + "`n`n"
    if ($Enums) {
        foreach ($row in $Enums) {
            $output += "ENUM: $($row.enum_name)`n  VALUES: $($row.values)`n`n"
        }
    } else { $output += "(no enums)`n" }

    # ── FUNCTIONS ──
    $output += "`n## FUNCTIONS`n"
    $output += "=" * 60 + "`n`n"
    if ($Functions) {
        foreach ($row in $Functions) {
            $output += "FUNC: $($row.function_name)($($row.arguments)) -> $($row.return_type) [$($row.security)]`n"
        }
    } else { $output += "(no functions)`n" }
    
    # ── TRIGGERS ──
    $output += "`n`n## TRIGGERS`n"
    $output += "=" * 60 + "`n`n"
    if ($Triggers) {
        foreach ($row in $Triggers) {
            $output += "TRIGGER: $($row.trigger_name) ON $($row.event_object_table) $($row.action_timing) $($row.event_manipulation)`n"
            $output += "  ACTION: $($row.action_statement)`n`n"
        }
    } else { $output += "(no triggers)`n" }

    # ── VIEWS ──
    $output += "`n## VIEWS & MATERIALIZED VIEWS`n"
    $output += "=" * 60 + "`n`n"
    if ($Views) {
        foreach ($row in $Views) {
            $output += "$($row.type.ToUpper()): $($row.name)`n"
            $output += "  DEF: $($row.definition)`n`n"
        }
    } else { $output += "(no views)`n" }

    # ── INDEXES ──
    $output += "`n## INDEXES`n"
    $output += "=" * 60 + "`n`n"
    if ($Indexes) {
        foreach ($row in $Indexes) {
            $output += "IDX: $($row.tablename).$($row.indexname)`n"
            $output += "  $($row.indexdef)`n`n"
        }
    } else { $output += "(no indexes)`n" }

    # ── RLS POLICIES ──
    $output += "`n## RLS POLICIES`n"
    $output += "=" * 60 + "`n`n"
    if ($RLS) {
        foreach ($row in $RLS) {
            $output += "POLICY: $($row.tablename).$($row.policyname) [$($row.cmd)] ($($row.permissive))`n"
            $output += "  ROLES: $($row.roles)`n"
            if ($row.using_expr) { $output += "  USING: $($row.using_expr)`n" }
            if ($row.check_expr) { $output += "  CHECK: $($row.check_expr)`n" }
            $output += "`n"
        }
    } else { $output += "(no policies)`n" }

    # ── CONSTRAINTS ──
    $output += "`n## CONSTRAINTS`n"
    $output += "=" * 60 + "`n`n"
    if ($Constraints) {
        $currentTable = ""
        foreach ($row in $Constraints) {
            if ($row.table_name -ne $currentTable) {
                if ($currentTable -ne "") { $output += "`n" }
                $currentTable = $row.table_name
                $output += "TABLE: $currentTable`n"
            }
            $extra = ""
            if ($row.check_clause) { $extra = " -> $($row.check_clause)" }
            if ($row.column_name) { $extra += " (col: $($row.column_name))" }
            $output += "  $($row.constraint_type.PadRight(15)) $($row.constraint_name)$extra`n"
        }
    } else { $output += "(no constraints)`n" }

    return $output
}

# ── Execute for both environments ──
Write-Host "Extracting DEV schema..." -ForegroundColor Cyan
$devTables = Invoke-SupabaseSQL -ProjectRef $devRef -Query $schemaQuery
$devFunctions = Invoke-SupabaseSQL -ProjectRef $devRef -Query $functionsQuery
$devTriggers = Invoke-SupabaseSQL -ProjectRef $devRef -Query $triggersQuery
$devEnums = Invoke-SupabaseSQL -ProjectRef $devRef -Query $enumsQuery
$devIndexes = Invoke-SupabaseSQL -ProjectRef $devRef -Query $indexesQuery
$devRLS = Invoke-SupabaseSQL -ProjectRef $devRef -Query $rlsQuery
$devConstraints = Invoke-SupabaseSQL -ProjectRef $devRef -Query $constraintsQuery
$devViews = Invoke-SupabaseSQL -ProjectRef $devRef -Query $viewsQuery

Write-Host "Extracting PROD schema..." -ForegroundColor Yellow
$prodTables = Invoke-SupabaseSQL -ProjectRef $prodRef -Query $schemaQuery
$prodFunctions = Invoke-SupabaseSQL -ProjectRef $prodRef -Query $functionsQuery
$prodTriggers = Invoke-SupabaseSQL -ProjectRef $prodRef -Query $triggersQuery
$prodEnums = Invoke-SupabaseSQL -ProjectRef $prodRef -Query $enumsQuery
$prodIndexes = Invoke-SupabaseSQL -ProjectRef $prodRef -Query $indexesQuery
$prodRLS = Invoke-SupabaseSQL -ProjectRef $prodRef -Query $rlsQuery
$prodConstraints = Invoke-SupabaseSQL -ProjectRef $prodRef -Query $constraintsQuery
$prodViews = Invoke-SupabaseSQL -ProjectRef $prodRef -Query $viewsQuery

# ── Format and save ──
$devOutput = Format-SchemaOutput -Label "DEV (dkancockzvcqorqbwtyh)" `
    -Tables $devTables -Functions $devFunctions -Triggers $devTriggers `
    -Enums $devEnums -Indexes $devIndexes -RLS $devRLS `
    -Constraints $devConstraints -Views $devViews

$prodOutput = Format-SchemaOutput -Label "PROD (emknatoknbomvmyumqju)" `
    -Tables $prodTables -Functions $prodFunctions -Triggers $prodTriggers `
    -Enums $prodEnums -Indexes $prodIndexes -RLS $prodRLS `
    -Constraints $prodConstraints -Views $prodViews

$devOutput | Out-File -FilePath "schema_DEV.txt" -Encoding utf8
$prodOutput | Out-File -FilePath "schema_PROD.txt" -Encoding utf8

Write-Host "`n✅ Files generated:" -ForegroundColor Green
Write-Host "  schema_DEV.txt" -ForegroundColor Cyan
Write-Host "  schema_PROD.txt" -ForegroundColor Yellow
Write-Host "`nCompare with: code --diff schema_DEV.txt schema_PROD.txt" -ForegroundColor White

# ── Quick summary ──
$devTableNames = ($devTables | Select-Object -ExpandProperty table_name -Unique)
$prodTableNames = ($prodTables | Select-Object -ExpandProperty table_name -Unique)

$onlyInDev = $devTableNames | Where-Object { $_ -notin $prodTableNames }
$onlyInProd = $prodTableNames | Where-Object { $_ -notin $devTableNames }
$inBoth = $devTableNames | Where-Object { $_ -in $prodTableNames }

Write-Host "`n── QUICK DIFF SUMMARY ──" -ForegroundColor Magenta
Write-Host "Tables in DEV:  $($devTableNames.Count)" -ForegroundColor Cyan
Write-Host "Tables in PROD: $($prodTableNames.Count)" -ForegroundColor Yellow
Write-Host "Tables in both: $($inBoth.Count)" -ForegroundColor Green

if ($onlyInDev.Count -gt 0) {
    Write-Host "`nOnly in DEV ($($onlyInDev.Count)):" -ForegroundColor Cyan
    $onlyInDev | ForEach-Object { Write-Host "  + $_" -ForegroundColor Cyan }
}
if ($onlyInProd.Count -gt 0) {
    Write-Host "`nOnly in PROD ($($onlyInProd.Count)):" -ForegroundColor Yellow
    $onlyInProd | ForEach-Object { Write-Host "  + $_" -ForegroundColor Yellow }
}

# ── Functions diff ──
$devFuncNames = ($devFunctions | Select-Object -ExpandProperty function_name -Unique)
$prodFuncNames = ($prodFunctions | Select-Object -ExpandProperty function_name -Unique)
$onlyDevFuncs = $devFuncNames | Where-Object { $_ -notin $prodFuncNames }
$onlyProdFuncs = $prodFuncNames | Where-Object { $_ -notin $devFuncNames }

Write-Host "`nFunctions in DEV:  $($devFuncNames.Count)" -ForegroundColor Cyan
Write-Host "Functions in PROD: $($prodFuncNames.Count)" -ForegroundColor Yellow

if ($onlyDevFuncs.Count -gt 0) {
    Write-Host "`nFunctions only in DEV ($($onlyDevFuncs.Count)):" -ForegroundColor Cyan
    $onlyDevFuncs | ForEach-Object { Write-Host "  + $_" -ForegroundColor Cyan }
}
if ($onlyProdFuncs.Count -gt 0) {
    Write-Host "`nFunctions only in PROD ($($onlyProdFuncs.Count)):" -ForegroundColor Yellow
    $onlyProdFuncs | ForEach-Object { Write-Host "  + $_" -ForegroundColor Yellow }
}
