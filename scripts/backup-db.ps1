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
$fileName = "tanari-$((Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')).dump"
$containerFile = "/tmp/$fileName"
$hostFile = Join-Path $resolvedOutput $fileName

try {
  docker exec $containerId pg_dump --format=custom --no-owner --username $DatabaseUser --dbname $DatabaseName --file $containerFile
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }
  docker cp "${containerId}:${containerFile}" $hostFile
  if ($LASTEXITCODE -ne 0) { throw "docker cp failed." }
} finally {
  docker exec $containerId rm -f -- $containerFile | Out-Null
}

Write-Output $hostFile
