param(
  [string]$BaseBranch = 'develop',
  [switch]$AllowDirty,
  [switch]$SkipGhAuth,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

function Invoke-Git {
  param([string]$GitArgs)
  $parts = $GitArgs -split ' '
  return (& git -C $repoRoot @parts 2>$null)
}

function Test-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

if (-not (Test-Command -Name 'git')) {
  throw 'git no esta disponible en PATH.'
}

$checks = @()

function Add-Check {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Hint
  )

  $script:checks += [pscustomobject]@{
    Name = $Name
    Ok = $Ok
    Hint = $Hint
  }
}

$insideRepo = ((Invoke-Git 'rev-parse --is-inside-work-tree') -join '').Trim().ToLowerInvariant()
Add-Check -Name 'Dentro de repositorio git' -Ok ($insideRepo -eq 'true') -Hint 'Ir al root del repo antes de continuar.'

$remoteInfo = (Invoke-Git 'remote -v') -join "`n"
$hasOrigin = $remoteInfo -match 'origin'
Add-Check -Name 'Remote origin configurado' -Ok $hasOrigin -Hint 'Configurar remote origin con git remote add origin <url>.'

$allBranches = (Invoke-Git 'branch -a') -join "`n"
$hasOriginDevelop = $allBranches -match "remotes/origin/$BaseBranch"
Add-Check -Name "Existe remotes/origin/$BaseBranch" -Ok $hasOriginDevelop -Hint "Ejecutar git fetch --all --prune y validar rama $BaseBranch remota."

$currentBranch = ((Invoke-Git 'rev-parse --abbrev-ref HEAD') -join '').Trim()
$onExpectedBranch = ($currentBranch -eq $BaseBranch)
Add-Check -Name "Rama actual es $BaseBranch" -Ok $onExpectedBranch -Hint "Cambiar con git checkout $BaseBranch o reejecutar bootstrap con -AutoNormalizeBaseBranch."

$statusShort = (Invoke-Git 'status -sb') -join "`n"
$isDirty = $statusShort -match '^[\s]*##' -and ($statusShort -split "`n").Count -gt 1
$dirtyOk = (-not $isDirty) -or [bool]$AllowDirty
$dirtyHint = 'Limpiar cambios locales con commit/stash antes de implementar.'
if ($AllowDirty) {
  $dirtyHint = 'Permitido por flag -AllowDirty (usar solo cuando sea intencional).'
}
Add-Check -Name 'Arbol de trabajo limpio' -Ok $dirtyOk -Hint $dirtyHint

$mergeConflictsRaw = (Invoke-Git 'diff --name-only --diff-filter=U')
$hasConflicts = $mergeConflictsRaw -and @($mergeConflictsRaw).Count -gt 0
Add-Check -Name 'Sin conflictos de merge' -Ok (-not $hasConflicts) -Hint 'Resolver conflictos antes de continuar.'

$upstreamRef = ((Invoke-Git "rev-parse --abbrev-ref $BaseBranch@{upstream}") -join '').Trim()
$hasUpstream = -not [string]::IsNullOrWhiteSpace($upstreamRef)
Add-Check -Name "Upstream configurado para $BaseBranch" -Ok $hasUpstream -Hint "Configurar tracking: git branch --set-upstream-to=origin/$BaseBranch $BaseBranch"

$upToDate = $false
if ($hasUpstream) {
  $aheadBehind = (Invoke-Git "rev-list --left-right --count $BaseBranch...$BaseBranch@{upstream}") -join ''
  if (-not [string]::IsNullOrWhiteSpace($aheadBehind)) {
    $parts = $aheadBehind.Trim() -split '\s+'
    if ($parts.Count -eq 2) {
      $ahead = [int]$parts[0]
      $behind = [int]$parts[1]
      $upToDate = ($ahead -eq 0 -and $behind -eq 0)
    }
  }
}
Add-Check -Name "$BaseBranch sincronizada con upstream" -Ok $upToDate -Hint "Actualizar con git checkout $BaseBranch; git pull origin $BaseBranch"

if (-not $SkipGhAuth) {
  $ghOk = $false
  if (Test-Command -Name 'gh') {
    & gh auth status 1>$null 2>$null
    $ghOk = ($LASTEXITCODE -eq 0)
  }
  Add-Check -Name 'GH CLI autenticado' -Ok $ghOk -Hint 'Autenticar con gh auth login.'
}

$failed = @($checks | Where-Object { -not $_.Ok })

Write-Output '=== Validacion Pre-Implementacion ==='
Write-Output "Repo root: $repoRoot"
Write-Output "Rama actual: $currentBranch"
Write-Output "Base esperada: $BaseBranch"
Write-Output ''

foreach ($c in $checks) {
  $mark = if ($c.Ok) { 'OK' } else { 'FAIL' }
  Write-Output "[$mark] $($c.Name)"
  if (-not $c.Ok) {
    Write-Output "  -> $($c.Hint)"
  }
}

Write-Output ''
if ($failed.Count -eq 0) {
  Write-Output 'Resultado: VALIDACION EXITOSA. Puedes iniciar implementacion.'
  exit 0
}

if ($DryRun) {
  Write-Output "Resultado: DRY-RUN con $($failed.Count) fallo(s). Corrige antes de implementar."
  exit 0
}

Write-Output "Resultado: BLOQUEADO con $($failed.Count) fallo(s)."
exit 1
