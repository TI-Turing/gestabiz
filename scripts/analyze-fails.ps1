$ansi = [regex]'\x1b\[[0-9;]*m'
$lines = Get-Content test-results.log
$fails = $lines | ForEach-Object { $ansi.Replace($_, '') } | Where-Object { $_ -match '^\s*FAIL\s+' }
$files = $fails | ForEach-Object {
  $clean = ($_ -replace '^\s*FAIL\s+', '').Trim()
  ($clean -split ' > ')[0].Trim()
}
$g = $files | Group-Object | Sort-Object Count -Descending
$g | Select-Object -First 35 | ForEach-Object { '{0,4}  {1}' -f $_.Count, $_.Name }
