param([string]$LogFile = 'tmp_useTax.log')
$ansi = [regex]'\x1b\[[0-9;]*m'
Get-Content $LogFile | ForEach-Object { $ansi.Replace($_, '') } | Where-Object { $_ -match 'FAIL|Expected|TypeError|Error:|expected' } | Select-Object -First 30
