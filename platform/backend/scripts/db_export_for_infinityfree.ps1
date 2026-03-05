param(
    [string]$DbHost = "127.0.0.1",
    [int]$Port = 3306,
    [string]$User = "root",
    [string]$Database = "moducore_platform",
    [string]$Password = "",
    [string]$OutputDir = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $OutputDir = Join-Path $PSScriptRoot "..\sql\backups"
}

$resolvedOutputDir = [System.IO.Path]::GetFullPath($OutputDir)
if (-not (Test-Path $resolvedOutputDir)) {
    New-Item -ItemType Directory -Path $resolvedOutputDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = Join-Path $resolvedOutputDir ("{0}_{1}.sql" -f $Database, $timestamp)

$dumpCommand = Get-Command "mysqldump" -ErrorAction Stop
$dumpArgs = @(
    "-h", $DbHost,
    "-P", "$Port",
    "-u", $User,
    "--default-character-set=utf8mb4",
    "--single-transaction",
    "--skip-lock-tables",
    "--no-tablespaces",
    "--routines",
    "--triggers",
    "--events",
    "--skip-extended-insert",
    $Database
)

if ([string]::IsNullOrWhiteSpace($Password)) {
    $dumpArgs = @("-p") + $dumpArgs
} else {
    $dumpArgs = @("--password=$Password") + $dumpArgs
}

Write-Host "Start export: $Database"
Write-Host "Output file: $outputFile"
if ([string]::IsNullOrWhiteSpace($Password)) {
    Write-Host "Please enter MySQL password when prompted."
}

& $dumpCommand.Source @dumpArgs | Out-File -FilePath $outputFile -Encoding utf8
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    if (Test-Path $outputFile) {
        Remove-Item -Force $outputFile
    }
    throw "mysqldump failed, ExitCode=$exitCode"
}

Write-Host "Done."
Write-Host "Backup file: $outputFile"
