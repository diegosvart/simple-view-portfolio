param(
  [Parameter(Mandatory = $true)]
  [int]$IssueNumber,

  [string]$BranchName = '',

  [Parameter(Mandatory = $true)]
  [string]$CommitMessage,

  [Parameter(Mandatory = $true)]
  [string]$PrTitle,

  [string]$PrBody = '',

  [string[]]$Files = @(),

  [switch]$AssignSelf,

  [switch]$Draft,

  [switch]$RequestCopilotReview,

  [switch]$DryRun,

  [string]$Owner,

  [string]$Repo,

  [string]$BaseBranch = 'develop',

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

function Ensure-ClosesLine {
  param(
    [string]$Body,
    [int]$IssueRef
  )
  if ([string]::IsNullOrWhiteSpace($Body)) {
    return "Closes #$IssueRef`n`n## Cambios`n- Completar implementacion del issue."
  }
  if ($Body -match "(?im)closes\s+#$IssueRef\b") {
    return $Body
  }
  return "$Body`n`nCloses #$IssueRef"
}

if (-not (Test-Command -Name 'git')) {
  throw 'git no esta disponible en PATH.'
}

if (-not (Test-Command -Name 'gh')) {
  throw 'gh no esta disponible en PATH.'
}

$insideRepo = ((Invoke-Git 'rev-parse --is-inside-work-tree') -join '').Trim().ToLowerInvariant()
if ($insideRepo -ne 'true') {
  Write-Output 'Resultado: BLOQUEADO. No estas dentro de un repositorio git valido.'
  exit 1
}

$allBranches = (Invoke-Git 'branch -a') -join "`n"
if (-not ($allBranches -match "remotes/origin/$BaseBranch")) {
  Write-Output "Resultado: BLOQUEADO. No se encontro remotes/origin/$BaseBranch."
  exit 1
}

& gh auth status 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Output 'Resultado: BLOQUEADO. GH CLI no autenticado. Ejecutar gh auth login.'
  exit 1
}

$issueJson = & gh issue view $IssueNumber --repo "$Owner/$Repo" --json number,title,state,url 2>$null
if ($LASTEXITCODE -ne 0 -or -not $issueJson) {
  Write-Output "Resultado: BLOQUEADO. Issue #$IssueNumber no encontrado en $Owner/$Repo."
  exit 1
}

$issue = $issueJson | ConvertFrom-Json
if ($issue.state -ne 'OPEN') {
  Write-Output "Resultado: BLOQUEADO. Issue #$IssueNumber no esta abierto (state=$($issue.state))."
  exit 1
}

$currentBranch = ((Invoke-Git 'rev-parse --abbrev-ref HEAD') -join '').Trim()
$branchWarnings = @()
if ([string]::IsNullOrWhiteSpace($BranchName)) {
  $BranchName = $currentBranch
}
if ($BranchName -ne $currentBranch -and -not $DryRun) {
  Write-Output "Resultado: BLOQUEADO. Rama actual '$currentBranch' no coincide con -BranchName '$BranchName'."
  exit 1
} elseif ($BranchName -ne $currentBranch -and $DryRun) {
  $branchWarnings += "DRY-RUN con branch objetivo '$BranchName' distinto a rama actual '$currentBranch'."
}
if ($BranchName -eq $BaseBranch) {
  if ($DryRun) {
    $branchWarnings += "DRY-RUN detecto rama base '$BaseBranch'; se usa rama sugerida para simulacion."
    $BranchName = "feature/issue-$IssueNumber-pending"
  } else {
    Write-Output "Resultado: BLOQUEADO. No crear PR desde rama base '$BaseBranch'."
    exit 1
  }
}

$prBodyFinal = Ensure-ClosesLine -Body $PrBody -IssueRef $IssueNumber

if ($DryRun) {
  Write-Output '=== create-pr (DRY-RUN) ==='
  Write-Output "Repo: $Owner/$Repo"
  Write-Output "Issue: #$IssueNumber - $($issue.title)"
  Write-Output "Base: $BaseBranch"
  Write-Output "Head: $BranchName"
  Write-Output "Commit: $CommitMessage"
  Write-Output "PR Title: $PrTitle"
  if ($Files.Count -gt 0) {
    Write-Output "Files limit: $($Files -join ',')"
  } else {
    Write-Output 'Files limit: (all changed files)'
  }
  if ($branchWarnings.Count -gt 0) {
    foreach ($warn in $branchWarnings) {
      Write-Output "Warning: $warn"
    }
  }
  Write-Output ''
  Write-Output '[DRY-RUN] PR Body final:'
  Write-Output '---'
  Write-Output $prBodyFinal
  Write-Output '---'
  Write-Output 'Resultado: OK. DRY-RUN completado (sin commit/push/pr).'
  exit 0
}

if ($Files.Count -gt 0) {
  foreach ($file in $Files) {
    & git -C $repoRoot add -- $file 2>$null
    if ($LASTEXITCODE -ne 0) {
      Write-Output "Resultado: BLOQUEADO. No se pudo agregar archivo '$file'."
      exit 1
    }
  }
} else {
  & git -C $repoRoot add -A 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Output 'Resultado: BLOQUEADO. No se pudo hacer git add -A.'
    exit 1
  }
}

$staged = (Invoke-Git 'diff --cached --name-only') -join "`n"
if ([string]::IsNullOrWhiteSpace($staged)) {
  Write-Output 'Resultado: BLOQUEADO. No hay cambios staged para commitear.'
  exit 1
}

& git -C $repoRoot commit -m $CommitMessage 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Output 'Resultado: BLOQUEADO. No se pudo crear commit.'
  exit 1
}

& git -C $repoRoot push -u origin $BranchName 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Output "Resultado: BLOQUEADO. No se pudo pushear rama '$BranchName'."
  exit 1
}

$createArgs = @(
  'pr', 'create',
  '--repo', "$Owner/$Repo",
  '--base', $BaseBranch,
  '--head', $BranchName,
  '--title', $PrTitle,
  '--body', $prBodyFinal
)
if ($Draft) {
  $createArgs += '--draft'
}

$prUrl = & gh @createArgs 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($prUrl)) {
  Write-Output 'Resultado: BLOQUEADO. No se pudo crear PR.'
  exit 1
}

if ($AssignSelf) {
  & gh pr edit $prUrl --repo "$Owner/$Repo" --add-assignee '@me' 1>$null 2>$null
}

if ($RequestCopilotReview) {
  & gh pr comment $prUrl --repo "$Owner/$Repo" --body 'Requesting Copilot review for this PR.' 1>$null 2>$null
}

Write-Output '=== PR Creado ==='
Write-Output "- Issue: #$IssueNumber"
Write-Output "- Branch: $BranchName"
Write-Output "- URL: $prUrl"
Write-Output 'Resultado: OK. PR CREADO.'
