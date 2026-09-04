param(
  [string]$OutputDirectory = ".backups",
  [string]$DatabaseUser = "postgres",
  [string]$DatabaseName = "app_db"
)

$ErrorActionPreference = "Stop"
$containerId = (docker compose ps -q db).Trim()
if (-not $containerId) {
  throw "The Compose database container is not running."
}

$resolvedOutput = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null
$uniqueId = [guid]::NewGuid().ToString('N')
$fileName = "tanari-$((Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ'))-$uniqueId.dump"
$containerFile = "/tmp/tanari-backup-$uniqueId.dump"
$hostFile = Join-Path $resolvedOutput $fileName
$hostPartial = "$hostFile.partial"

try {
  docker exec $containerId pg_dump --format=custom --no-owner --username $DatabaseUser --dbname $DatabaseName --file $containerFile
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }
  docker exec $containerId pg_restore --list $containerFile | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Backup validation failed." }
  docker cp "${containerId}:${containerFile}" $hostPartial
  if ($LASTEXITCODE -ne 0) { throw "docker cp failed." }
  if ((Get-Item -LiteralPath $hostPartial).Length -le 0) { throw "Backup file is empty." }
  Move-Item -LiteralPath $hostPartial -Destination $hostFile
} finally {
  docker exec $containerId rm -f -- $containerFile | Out-Null
  if (Test-Path -LiteralPath $hostPartial) {
    Remove-Item -LiteralPath $hostPartial -Force
  }
}

Write-Output $hostFile
