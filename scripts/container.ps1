[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet('up', 'down', 'status', 'logs', 'verify', 'rollback')]
  [string] $Action = 'up',

  [ValidateRange(30, 900)]
  [int] $WaitTimeoutSeconds = 180
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvironmentFile = Join-Path $ProjectRoot '.env.docker'
$EnvironmentTemplate = Join-Path $ProjectRoot '.env.docker.example'
$SecretDirectory = Join-Path $ProjectRoot '.docker-secrets'
$AppSecretFile = Join-Path $SecretDirectory 'db_app_password'
$RootSecretFile = Join-Path $SecretDirectory 'db_root_password'

function New-RandomSecret {
  $bytes = New-Object byte[] 32
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  } finally {
    $generator.Dispose()
  }

  $encoded = [Convert]::ToBase64String($bytes)
  return $encoded.Replace('/', '_').Replace('+', '-').TrimEnd('=')
}

function Initialize-DeploymentFiles {
  if (-not (Test-Path -LiteralPath $EnvironmentFile -PathType Leaf)) {
    Copy-Item -LiteralPath $EnvironmentTemplate -Destination $EnvironmentFile
    Write-Host 'Created .env.docker from the tracked template.'
  }

  if (-not (Test-Path -LiteralPath $SecretDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $SecretDirectory | Out-Null
  }

  foreach ($secretFile in @($AppSecretFile, $RootSecretFile)) {
    if (-not (Test-Path -LiteralPath $secretFile -PathType Leaf)) {
      [IO.File]::WriteAllText($secretFile, (New-RandomSecret))
    }
  }
}

function Assert-DeploymentFiles {
  foreach ($requiredFile in @(
      $EnvironmentFile,
      $AppSecretFile,
      $RootSecretFile
    )) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
      throw "Deployment file is missing: $requiredFile. Run the 'up' action first."
    }
  }
}

function Assert-Docker {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI was not found. Install or start Docker Desktop first.'
  }

  & docker version --format '{{.Server.Version}}' *> $null
  if ($LASTEXITCODE -ne 0) {
    throw 'Docker is installed, but its engine is not reachable.'
  }

  & docker compose version *> $null
  if ($LASTEXITCODE -ne 0) {
    throw 'Docker Compose v2 is required.'
  }
}

function Invoke-Compose {
  param([string[]] $Arguments)

  & docker compose --env-file $EnvironmentFile @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose failed: $($Arguments -join ' ')"
  }
}

function Get-DeploymentValue {
  param(
    [string] $Name,
    [string] $DefaultValue
  )

  $pattern = '^\s*' + [regex]::Escape($Name) + '\s*=\s*(.*)\s*$'
  $match = Get-Content -LiteralPath $EnvironmentFile |
    Select-String -Pattern $pattern |
    Select-Object -Last 1
  if (-not $match) {
    return $DefaultValue
  }

  return $match.Matches[0].Groups[1].Value.Trim().Trim('"').Trim("'")
}

function Get-ProbeUrl {
  $hostAddress = Get-DeploymentValue -Name 'APP_HOST' -DefaultValue '127.0.0.1'
  $portText = Get-DeploymentValue -Name 'APP_PORT' -DefaultValue '8080'
  $port = 0
  if (-not [int]::TryParse($portText, [ref] $port) -or $port -lt 1 -or $port -gt 65535) {
    throw "APP_PORT is not valid: $portText"
  }

  $probeHost = switch ($hostAddress) {
    '0.0.0.0' { '127.0.0.1' }
    '::' { '[::1]' }
    default { $hostAddress }
  }
  return "http://${probeHost}:$port"
}

function Test-Deployment {
  $baseUrl = Get-ProbeUrl
  $ready = Invoke-RestMethod -Uri "$baseUrl/health/ready" -TimeoutSec 10
  if ($ready.status -ne 'ready') {
    throw 'Application readiness check did not return ready.'
  }

  $page = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing -TimeoutSec 10
  if ($page.StatusCode -ne 200) {
    throw "Frontend returned HTTP $($page.StatusCode)."
  }

  $books = Invoke-RestMethod -Uri "$baseUrl/api/get_books" -TimeoutSec 10
  if (@($books).Count -lt 1) {
    throw 'Seeded book API returned an empty collection.'
  }

  Write-Host "Deployment verified: $baseUrl"
}

function Backup-CurrentImage {
  $appImage = Get-DeploymentValue -Name 'APP_IMAGE' -DefaultValue 'librarymanagement-app:local'
  $rollbackImage = Get-DeploymentValue -Name 'ROLLBACK_IMAGE' -DefaultValue 'librarymanagement-app:rollback'

  $runningImage = & docker compose --env-file $EnvironmentFile images --quiet app 2> $null |
    Select-Object -Last 1
  if ($LASTEXITCODE -ne 0 -or -not $runningImage) {
    & docker image inspect $appImage *> $null
    if ($LASTEXITCODE -eq 0) {
      $runningImage = $appImage
    }
  }

  if ($runningImage) {
    & docker image tag $runningImage $rollbackImage
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to retain rollback image: $rollbackImage"
    }
    Write-Host "Retained previous application image as $rollbackImage."
  }
}

Set-Location -LiteralPath $ProjectRoot
Assert-Docker

if ($Action -eq 'up') {
  Initialize-DeploymentFiles
} else {
  Assert-DeploymentFiles
}

Invoke-Compose -Arguments @('config', '--quiet')

try {
  switch ($Action) {
    'up' {
      Backup-CurrentImage
      Invoke-Compose -Arguments @(
        'up',
        '--detach',
        '--build',
        '--remove-orphans',
        '--wait',
        '--wait-timeout',
        $WaitTimeoutSeconds.ToString()
      )
      Test-Deployment
      Invoke-Compose -Arguments @('ps')
      Invoke-Compose -Arguments @('images')
    }
    'down' {
      Invoke-Compose -Arguments @('down', '--remove-orphans')
      Write-Host 'Containers stopped. The database volume and local secrets were preserved.'
    }
    'status' {
      Invoke-Compose -Arguments @('ps')
      Invoke-Compose -Arguments @('images')
    }
    'logs' {
      Invoke-Compose -Arguments @('logs', '--tail', '200', '--follow')
    }
    'verify' {
      Test-Deployment
      Invoke-Compose -Arguments @('ps')
    }
    'rollback' {
      $appImage = Get-DeploymentValue -Name 'APP_IMAGE' -DefaultValue 'librarymanagement-app:local'
      $rollbackImage = Get-DeploymentValue -Name 'ROLLBACK_IMAGE' -DefaultValue 'librarymanagement-app:rollback'
      & docker image inspect $rollbackImage *> $null
      if ($LASTEXITCODE -ne 0) {
        throw "Rollback image does not exist: $rollbackImage"
      }
      & docker image tag $rollbackImage $appImage
      if ($LASTEXITCODE -ne 0) {
        throw "Unable to retag $rollbackImage as $appImage"
      }
      Invoke-Compose -Arguments @(
        'up',
        '--detach',
        '--no-build',
        '--no-deps',
        '--force-recreate',
        '--wait',
        '--wait-timeout',
        $WaitTimeoutSeconds.ToString(),
        'app'
      )
      Test-Deployment
    }
  }
} catch {
  [Console]::Error.WriteLine($_.Exception.Message)
  & docker compose --env-file $EnvironmentFile ps
  & docker compose --env-file $EnvironmentFile logs --tail 120
  throw
}
