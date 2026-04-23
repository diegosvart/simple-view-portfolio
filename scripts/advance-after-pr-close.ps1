param(
  [int]$PullNumber,

  [string]$Owner,

  [string]$Repo,

  [string]$BaseBranch = 'develop',

  [int[]]$IssueSequence = @(),

  [switch]$DryRun,

  [switch]$SkipClose,

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
if (-not $PSBoundParameters.ContainsKey('IssueSequence') -and $workflowConfig -and $workflowConfig.issueSequence.Count -gt 0) {
  $IssueSequence = @($workflowConfig.issueSequence)
}
if (-not $IssueSequence -or $IssueSequence.Count -eq 0) {
  $IssueSequence = @(3, 4, 5, 6, 8, 10, 9, 7, 13, 12, 14, 11, 20, 23)
}
if ([string]::IsNullOrWhiteSpace($Owner) -or [string]::IsNullOrWhiteSpace($Repo)) {
  throw 'Owner/Repo no definidos. Proveer parametros o scripts/workflow-config.json.'
}

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

function Fail-And-Exit {
  param([string]$Message)

  Write-Output ''
  Write-Output '=== Avance Post-Merge: BLOQUEADO ==='
  Write-Output "- $Message"
  Write-Output 'Resultado: BLOQUEADO (exit 1)'

  if ($DryRun) {
    Write-Output 'Nota: -DryRun activo, se retorna exit 0 para diagnostico.'
    exit 0
  }

  exit 1
}

if (-not (Test-Command -Name 'git')) {
  throw 'git no esta disponible en PATH.'
}

if (-not (Test-Command -Name 'gh')) {
  throw 'gh no esta disponible en PATH.'
}

$insideRepo = ((Invoke-Git 'rev-parse --is-inside-work-tree') -join '').Trim().ToLowerInvariant()
if ($insideRepo -ne 'true') {
  throw 'No estas dentro de un repositorio git valido.'
}

$allBranches = (Invoke-Git 'branch -a') -join "`n"
if (-not ($allBranches -match "remotes/origin/$BaseBranch")) {
  Fail-And-Exit -Message "No se encontro remotes/origin/$BaseBranch."
}

& gh auth status 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  Fail-And-Exit -Message 'gh CLI no autenticado. Ejecutar gh auth login.'
}

if (-not $PullNumber) {
  $mergedPrListJson = & gh pr list --repo "$Owner/$Repo" --state merged --base "$BaseBranch" --limit 1 --json number 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $mergedPrListJson) {
    Fail-And-Exit -Message "No se pudo auto-detectar un PR merged en $BaseBranch."
  }

  $mergedPrList = @($mergedPrListJson | ConvertFrom-Json)
  if ($mergedPrList.Count -eq 0) {
    Fail-And-Exit -Message "No hay PR merged en $BaseBranch para procesar."
  }

  $PullNumber = [int]$mergedPrList[0].number
}

$prJson = & gh pr view $PullNumber --repo "$Owner/$Repo" --json number,title,body,state,mergedAt,baseRefName,url 2>$null
if ($LASTEXITCODE -ne 0 -or -not $prJson) {
  Fail-And-Exit -Message "PR #$PullNumber no encontrado en $Owner/$Repo."
}

$pr = $prJson | ConvertFrom-Json
if (-not $pr.mergedAt -or $pr.state -ne 'MERGED') {
  Fail-And-Exit -Message "PR #$PullNumber no esta mergeado (state=$($pr.state))."
}

if ($pr.baseRefName -ne $BaseBranch) {
  Fail-And-Exit -Message "PR #$PullNumber mergeado a '$($pr.baseRefName)', no a '$BaseBranch'."
}

$linkedIssueNumber = $null
if ($pr.body -match '(?im)closes\s+#(\d+)') {
  $linkedIssueNumber = [int]$matches[1]
} else {
  Fail-And-Exit -Message "PR #$PullNumber no contiene 'Closes #<numero>' en el body."
}

$issueJson = & gh issue view $linkedIssueNumber --repo "$Owner/$Repo" --json number,title,state,url 2>$null
if ($LASTEXITCODE -ne 0 -or -not $issueJson) {
  Fail-And-Exit -Message "Issue #$linkedIssueNumber no encontrado en $Owner/$Repo."
}

$issue = $issueJson | ConvertFrom-Json
$issueWasClosed = ($issue.state -eq 'CLOSED')

Write-Output '=== Avance Post-Merge (advance-after-pr-close) ==='
Write-Output "- PR: #$($pr.number) $($pr.title)"
Write-Output "- URL PR: $($pr.url)"
Write-Output "- Issue vinculado: #$linkedIssueNumber $($issue.title)"
Write-Output "- Estado issue antes: $($issue.state)"

if (-not $SkipClose -and -not $issueWasClosed) {
  if ($DryRun) {
    Write-Output "- [DRY-RUN] Se cerraria issue #$linkedIssueNumber"
  } else {
    & gh issue close $linkedIssueNumber --repo "$Owner/$Repo" --comment "Cerrado por PR #$PullNumber mergeado a $BaseBranch." 1>$null 2>$null
    if ($LASTEXITCODE -ne 0) {
      Fail-And-Exit -Message "No se pudo cerrar issue #$linkedIssueNumber."
    }
    Write-Output "- Issue #$linkedIssueNumber cerrado correctamente."
  }
} elseif ($issueWasClosed) {
  Write-Output "- Issue #$linkedIssueNumber ya estaba cerrado."
} elseif ($SkipClose) {
  Write-Output '- Flag -SkipClose activo: no se cierra issue.'
}

$openIssues = @()
$issuesJson = & gh issue list --repo "$Owner/$Repo" --state open --limit 200 --json number,title,url 2>$null
if ($LASTEXITCODE -eq 0 -and $issuesJson) {
  $openIssues = @($issuesJson | ConvertFrom-Json)
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

Write-Output ''
if ($orderedIssues.Count -gt 0) {
  $nextIssue = $orderedIssues[0]
  Write-Output "- Siguiente pendiente: issue #$($nextIssue.number)"
  Write-Output "- Titulo: $($nextIssue.title)"
  Write-Output "- URL: $($nextIssue.url)"
} else {
  Write-Output '- Sin issues abiertos en el roadmap actual.'
}

if ($DryRun) {
  Write-Output 'Resultado: DRY-RUN completado (exit 0).'
} else {
  Write-Output 'Resultado: CIERRE Y AVANCE COMPLETADO (exit 0).'
}
