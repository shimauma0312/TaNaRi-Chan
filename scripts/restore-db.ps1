param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [Parameter(Mandatory = $true)]
  [switch]$ConfirmRestore,
  [string]$DatabaseUser = "postgres",
  [string]$DatabaseName = "app_db"
)

$ErrorActionPreference = "Stop"
$resolvedBackup = [IO.Path]::GetFullPath($BackupFile)
if (-not (Test-Path -LiteralPath $resolvedBackup -PathType Leaf)) {
  throw "Backup file does not exist: $resolvedBackup"
}
if (-not $ConfirmRestore) {
  throw "Restore is destructive. Pass -ConfirmRestore explicitly."
}

$containerId = (docker compose ps -q db).Trim()
if (-not $containerId) {
  throw "The Compose database container is not running."
}

$containerFile = "/tmp/tanari-restore-$([guid]::NewGuid().ToString('N')).dump"
try {
  docker cp $resolvedBackup "${containerId}:${containerFile}"
  if ($LASTEXITCODE -ne 0) { throw "docker cp failed." }
  docker exec $containerId pg_restore --clean --if-exists --no-owner --username $DatabaseUser --dbname $DatabaseName $containerFile
  if ($LASTEXITCODE -ne 0) { throw "pg_restore failed." }
} finally {
  docker exec $containerId rm -f -- $containerFile | Out-Null
}

Write-Output "Restore completed from $resolvedBackup"
