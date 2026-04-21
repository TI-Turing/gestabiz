$f = 'src\hooks\__tests__\useTaxCalculation.test.ts'
$c = Get-Content $f -Raw
$pattern = 'single: vi\.fn\(\)\.mockResolvedValue\(\{ data: ([^,]+), error: ([^ ]+) \}\)'
$replacement = 'single: vi.fn().mockResolvedValue({ data: $1, error: $2 }), maybeSingle: vi.fn().mockResolvedValue({ data: $1, error: $2 })'
$c2 = [regex]::Replace($c, $pattern, $replacement)
Set-Content -NoNewline -Path $f -Value $c2
Write-Host "done. matches:" ([regex]::Matches($c, $pattern)).Count
