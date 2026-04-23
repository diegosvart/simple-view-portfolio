param(
  [Parameter(Mandatory = $true)]
  [string]$Context,

  [string]$Title = '',

  [ValidateSet('P0', 'P1', 'P2', 'P3')]
  [string]$Priority = 'P2',

  [string[]]$Labels = @(),

  [string]$Owner,

  [string]$Repo,

  [string]$BaseBranch = 'develop',

  [switch]$DryRun,

  [string]$ConfigFile = (Join-Path $PSScriptRoot 'workflow-config.json')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$configHelpersPath = Join-Path $PSScriptRoot 'workflow-config.ps1'
if (Test-Path -LiteralPath $configHelpersPath) {
  . $configHelpersPath
}

$workflowConfig = $null
if (Get-Command -Name Get-WorkflowConfig -ErrorAction SilentlyContinue) {
  $workflowConfig = Get-WorkflowConfig -ConfigFilePath $ConfigFile
}

if (-not $PSBoundParameters.ContainsKey('Owner') -and $workflowConfig -and $workflowConfig.owner) {
  $Owner = $workflowConfig.owner
}
if (-not $PSBoundParameters.ContainsKey('Repo') -and $workflowConfig -and $workflowConfig.repo) {
  $Repo = $workflowConfig.repo
}
if (-not $PSBoundParameters.ContainsKey('BaseBranch') -and $workflowConfig -and $workflowConfig.baseBranch) {
  $BaseBranch = $workflowConfig.baseBranch
}
if ([string]::IsNullOrWhiteSpace($Owner) -or [string]::IsNullOrWhiteSpace($Repo)) {
  throw 'Owner/Repo no definidos. Proveer parametros o scripts/workflow-config.json.'
}

function Test-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

if (-not (Test-Command -Name 'git')) {
  throw 'git no esta disponible en PATH.'
}

if (-not (Test-Command -Name 'gh')) {
  throw 'gh no esta disponible en PATH.'
}

& gh auth status 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Output 'Resultado: BLOQUEADO. GH CLI no autenticado. Ejecutar gh auth login.'
  exit 1
}

if ([string]::IsNullOrWhiteSpace($Title)) {
  $normalized = ($Context -replace '\s+', ' ').Trim()
  if ($normalized.Length -gt 80) {
    $Title = $normalized.Substring(0, 80).TrimEnd() + '...'
  } else {
    $Title = $normalized
  }
}

$issueBodyLines = @(
  '## Contexto / Problema',
  $Context.Trim(),
  '',
  '## Alcance',
  '- Definir e implementar el trabajo descrito en el contexto.',
  '',
  '## Criterios de Aceptacion',
  '- [ ] El resultado cumple el objetivo funcional declarado.',
  '- [ ] Se valida mediante evidencia verificable (tests/revision/manual).',
  '',
  '## Verificacion',
  '- Ejecutar validaciones y registrar evidencia en el PR.',
  '',
  '## Dependencias',
  '- Sin dependencias declaradas.',
  '',
  '## Fuera de Alcance',
  '- Cambios no relacionados al contexto de este issue.',
  '',
  '## Prioridad',
  $Priority
)
$issueBody = $issueBodyLines -join "`n"

Write-Output '=== Crear Issue desde Contexto ==='
Write-Output "Repo: $Owner/$Repo"
Write-Output "BaseBranch de referencia: $BaseBranch"
Write-Output "Title: $Title"
Write-Output "Priority: $Priority"
if ($Labels.Count -gt 0) {
  Write-Output "Labels: $($Labels -join ',')"
} else {
  Write-Output 'Labels: (sin labels)'
}

if ($DryRun) {
  Write-Output ''
  Write-Output '[DRY-RUN] Body generado:'
  Write-Output '---'
  Write-Output $issueBody
  Write-Output '---'
  Write-Output 'Resultado: OK. DRY-RUN completado (issue no creado).'
  exit 0
}

$ghArgs = @(
  'issue', 'create',
  '--repo', "$Owner/$Repo",
  '--title', $Title,
  '--body', $issueBody
)
if ($Labels.Count -gt 0) {
  $ghArgs += @('--label', ($Labels -join ','))
}

$issueUrl = & gh @ghArgs 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($issueUrl)) {
  Write-Output 'Resultado: BLOQUEADO. No se pudo crear el issue.'
  exit 1
}

$issueNumber = ''
if ($issueUrl -match '/issues/(\d+)$') {
  $issueNumber = $matches[1]
}

Write-Output "- Issue creado: $issueUrl"
if (-not [string]::IsNullOrWhiteSpace($issueNumber)) {
  Write-Output "- Numero: #$issueNumber"
}
Write-Output 'Resultado: OK. ISSUE CREADO.'
