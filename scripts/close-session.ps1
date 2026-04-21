param(
  [Parameter(Mandatory = $true)]
  [string]$Owner,

  [Parameter(Mandatory = $true)]
  [string]$Repo,

  [string]$BaseBranch = 'develop',

  [int[]]$IssueSequence = @(3, 4, 5, 6, 8, 10, 9, 7, 13, 12, 14, 11, 20, 23),

  [string]$SessionSummary = '',

  [string]$OutputFile = 'docs/LAST_SESSION_MEMORY.md'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$targetPath = Join-Path $repoRoot $OutputFile
$targetDir = Split-Path -Parent $targetPath

if (-not (Test-Path $targetDir)) {
  New-Item -ItemType Directory -Path $targetDir | Out-Null
}

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

$insideRepo = ((Invoke-Git 'rev-parse --is-inside-work-tree') -join '').Trim().ToLowerInvariant()
if ($insideRepo -ne 'true') {
  throw 'No estas dentro de un repositorio git valido.'
}

$dateIso = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
$currentBranch = ((Invoke-Git 'rev-parse --abbrev-ref HEAD') -join '').Trim()
$statusShort = (Invoke-Git 'status -sb') -join "`n"
$changedFilesRaw = (Invoke-Git 'status --porcelain')
$changedFiles = @()
foreach ($line in $changedFilesRaw) {
  if ($line.Length -ge 4) {
    $changedFiles += $line.Substring(3).Trim()
  }
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

$nextSuggested = $null
$roadmapPending = @($orderedIssues | Where-Object { $sequenceRank.ContainsKey([int]$_.number) })
if ($roadmapPending.Count -gt 0) {
  $nextSuggested = $roadmapPending[0]
}

if ([string]::IsNullOrWhiteSpace($SessionSummary)) {
  if ($changedFiles.Count -eq 0) {
    $SessionSummary = 'Sesion sin cambios locales pendientes.'
  } else {
    $SessionSummary = "Sesion con $($changedFiles.Count) archivo(s) actualizado(s) en el repositorio."
  }
}

$lines = @()
$lines += '# Last Session Memory'
$lines += ''
$lines += "- Fecha: $dateIso"
$lines += "- Repositorio: $Owner/$Repo"
$lines += "- Rama activa: $currentBranch"
$lines += "- Base esperada: $BaseBranch"
$lines += ''
$lines += '## Resumen pequeno'
$lines += "- $SessionSummary"
$lines += ''
$lines += '## Estado Git (corto)'
$lines += '```text'
$lines += $statusShort
$lines += '```'
$lines += ''
$lines += '## Archivos tocados en la sesion'
if ($changedFiles.Count -eq 0) {
  $lines += '- Sin archivos locales modificados.'
} else {
  foreach ($file in ($changedFiles | Select-Object -First 12)) {
    $lines += "- $file"
  }
}
$lines += ''
$lines += '## Siguiente tarea sugerida'
if ($nextSuggested) {
  $lines += "- Issue #$($nextSuggested.number): $($nextSuggested.title)"
  $lines += "- URL: $($nextSuggested.url)"
} else {
  $lines += '- Sin issue sugerido por roadmap (verificar configuracion de IssueSequence o acceso a GH).'
}
$lines += ''
$lines += '## Nota de continuidad'
$lines += '- Ejecutar session-bootstrap al iniciar la proxima sesion.'

Set-Content -Path $targetPath -Value ($lines -join "`n") -Encoding UTF8

Write-Output "Memoria de sesion escrita en: $OutputFile"
if ($nextSuggested) {
  Write-Output "Siguiente sugerido: issue #$($nextSuggested.number)"
}
