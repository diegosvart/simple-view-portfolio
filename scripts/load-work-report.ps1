param(
  [Parameter(Mandatory = $true)]
  [string]$Owner,

  [Parameter(Mandatory = $true)]
  [string]$Repo,

  [string]$BaseBranch = 'develop',

  [switch]$AutoNormalizeBaseBranch,

  [switch]$AllowDirtyNormalize,

  [int[]]$IssueSequence = @(3, 4, 5, 6, 8, 10, 9, 7, 13, 12, 14, 11, 20, 23)
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

$insideRepo = (Invoke-Git 'rev-parse --is-inside-work-tree') -join ''
if ($insideRepo.Trim().ToLowerInvariant() -ne 'true') {
  throw 'No estas dentro de un repositorio git.'
}

$statusShort = (Invoke-Git 'status -sb') -join "`n"
$currentBranch = ((Invoke-Git 'rev-parse --abbrev-ref HEAD') -join '').Trim()
$remoteInfo = (Invoke-Git 'remote -v') -join "`n"
$branchesTracking = (Invoke-Git 'branch -vv') -join "`n"

$startupGuardrailNotes = @()
$startupGuardrailBlocked = $false

if ($currentBranch -ne $BaseBranch) {
  $startupGuardrailNotes += "Rama actual '$currentBranch' no coincide con base esperada '$BaseBranch'."

  $statusLines = @($statusShort -split "`n")
  $isDirty = $statusLines.Count -gt 1

  if (-not $AutoNormalizeBaseBranch) {
    $startupGuardrailBlocked = $true
    $startupGuardrailNotes += "Normaliza estado con: git checkout $BaseBranch; git pull origin $BaseBranch"
    $startupGuardrailNotes += "O reintenta este script con -AutoNormalizeBaseBranch para correccion automatica guiada."
  } else {
    if ($isDirty -and -not $AllowDirtyNormalize) {
      $startupGuardrailBlocked = $true
      $startupGuardrailNotes += 'Hay cambios locales. No se puede cambiar de rama automaticamente sin confirmacion explicita.'
      $startupGuardrailNotes += 'Haz commit/stash o usa -AllowDirtyNormalize bajo tu responsabilidad para intentar normalizar.'
    } else {
      if ($isDirty -and $AllowDirtyNormalize) {
        $startupGuardrailNotes += 'Normalizacion solicitada con -AllowDirtyNormalize (modo excepcional).'
      }

      [void](Invoke-Git "checkout $BaseBranch")
      if ($LASTEXITCODE -ne 0) {
        $startupGuardrailBlocked = $true
        $startupGuardrailNotes += "No se pudo hacer checkout a $BaseBranch."
      } else {
        [void](Invoke-Git "pull origin $BaseBranch")
        if ($LASTEXITCODE -ne 0) {
          $startupGuardrailBlocked = $true
          $startupGuardrailNotes += "No se pudo actualizar $BaseBranch desde origin."
        } else {
          $currentBranch = ((Invoke-Git 'rev-parse --abbrev-ref HEAD') -join '').Trim()
          $statusShort = (Invoke-Git 'status -sb') -join "`n"
          $branchesTracking = (Invoke-Git 'branch -vv') -join "`n"
          $startupGuardrailNotes += "Normalizacion completada en '$BaseBranch'."
        }
      }
    }
  }
}

$hasOriginDevelop = $false
if ($remoteInfo -match 'origin') {
  $allBranches = (Invoke-Git 'branch -a') -join "`n"
  $hasOriginDevelop = $allBranches -match 'remotes/origin/develop'
}

$gitSafetyWarnings = @()
if ($statusShort -match 'No commits yet') {
  $gitSafetyWarnings += 'Detectado "No commits yet". Posible repo reinicializado o no sincronizado.'
}
if (-not $hasOriginDevelop) {
  $gitSafetyWarnings += 'No se encontro origin/develop. Verificar remoto y branch base.'
}

$openIssues = @()
if (Test-Command -Name 'gh') {
  $issuesJson = & gh issue list --repo "$Owner/$Repo" --state open --limit 200 --json number,title,url 2>$null
  if ($LASTEXITCODE -eq 0 -and $issuesJson) {
    $openIssues = @($issuesJson | ConvertFrom-Json)
  }
}

$sequenceRank = @{}
for ($i = 0; $i -lt $IssueSequence.Count; $i++) {
  $sequenceRank[$IssueSequence[$i]] = $i
}

$orderedIssues = @($openIssues | Sort-Object `
  @{ Expression = {
      $n = [int]$_.number
      if ($sequenceRank.ContainsKey($n)) { $sequenceRank[$n] } else { 100000 + $n }
    }
  }, `
  @{ Expression = { [int]$_.number } })

$orderedPendingInRoadmap = @($orderedIssues | Where-Object { $sequenceRank.ContainsKey([int]$_.number) })
$nextSuggested = $null
if ($orderedPendingInRoadmap.Count -gt 0) {
  $nextSuggested = $orderedPendingInRoadmap[0]
}

$suggestedTasks = @()
if ($gitSafetyWarnings.Count -gt 0) {
  $suggestedTasks += 'Detener trabajo y corregir estado Git antes de editar codigo.'
}
if ($currentBranch -ne $BaseBranch) {
  $suggestedTasks += "Volver a $BaseBranch y actualizar: git checkout $BaseBranch; git pull origin $BaseBranch"
}
if ($nextSuggested) {
  $suggestedTasks += "Tomar issue #$($nextSuggested.number): $($nextSuggested.title)"
}
if ($orderedIssues.Count -gt 1) {
  $nextTwo = $orderedIssues | Select-Object -First 3
  foreach ($it in $nextTwo) {
    $suggestedTasks += "Preparar alcance de issue #$($it.number)"
  }
}

$suggestedTasks = @($suggestedTasks | Select-Object -Unique)

Write-Output '=== Informe Acotado de Trabajo Actual ==='
Write-Output "Repo: $Owner/$Repo"
Write-Output "Rama actual: $currentBranch"
Write-Output "Base esperada: $BaseBranch"
Write-Output ''

Write-Output '[Git status -sb]'
Write-Output $statusShort
Write-Output ''

Write-Output '[Ramas locales (tracking)]'
Write-Output $branchesTracking
Write-Output ''

Write-Output '[Guardrails de inicio]'
if ($startupGuardrailNotes.Count -eq 0) {
  Write-Output '- OK: Sesion iniciada sobre la rama base esperada.'
} else {
  foreach ($note in $startupGuardrailNotes) {
    Write-Output "- $note"
  }
}
Write-Output ''

if ($gitSafetyWarnings.Count -gt 0) {
  Write-Output '[Alertas de seguridad Git]'
  foreach ($warn in $gitSafetyWarnings) {
    Write-Output "- $warn"
  }
  Write-Output ''
}

Write-Output "[Issues abiertos: $($orderedIssues.Count)]"
if ($orderedIssues.Count -eq 0) {
  Write-Output '- No se pudieron obtener issues (verificar gh auth login).' 
} else {
  foreach ($issue in $orderedIssues) {
    $tag = if ($sequenceRank.ContainsKey([int]$issue.number)) { 'roadmap' } else { 'fuera-roadmap' }
    Write-Output "- #$($issue.number) [$tag] $($issue.title)"
  }
}
Write-Output ''

Write-Output '[Siguiente sugerido por orden logico]'
if ($nextSuggested) {
  Write-Output "- #$($nextSuggested.number) $($nextSuggested.title)"
  Write-Output "- URL: $($nextSuggested.url)"
} else {
  Write-Output '- Sin pendientes en IssueSequence actual.'
}
Write-Output ''

Write-Output '[Tareas sugeridas]'
if ($suggestedTasks.Count -eq 0) {
  Write-Output '- No hay tareas sugeridas automaticas.'
} else {
  foreach ($task in $suggestedTasks | Select-Object -First 5) {
    Write-Output "- $task"
  }
}

if ($startupGuardrailBlocked) {
  Write-Output ''
  Write-Output 'Resultado: BLOQUEADO. Corrige/normaliza el estado Git y reintenta para iniciar sesion correctamente.'
  exit 1
}

Write-Output ''
Write-Output 'Resultado: OK. Sesion lista para continuar.'
