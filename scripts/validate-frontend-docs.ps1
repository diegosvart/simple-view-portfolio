param()

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$checks = @(
  @{
    Label = 'ADR exists'
    Path = 'docs/decisions/ADR-0001-deprecate-spfx.md'
    Type = 'exists'
  },
  @{
    Label = 'Frontend plan exists'
    Path = 'docs/FRONTEND_ROOT_PLAN.md'
    Type = 'exists'
  },
  @{
    Label = 'SPFx README exists'
    Path = 'm365/spfx/README.md'
    Type = 'exists'
  },
  @{
    Label = 'WORKFLOW references ADR'
    Path = 'docs/WORKFLOW.md'
    Type = 'contains'
    Pattern = 'ADR-0001-deprecate-spfx.md'
  },
  @{
    Label = 'WORKFLOW references frontend plan'
    Path = 'docs/WORKFLOW.md'
    Type = 'contains'
    Pattern = 'FRONTEND_ROOT_PLAN.md'
  },
  @{
    Label = 'WORKFLOW declares root frontend'
    Path = 'docs/WORKFLOW.md'
    Type = 'contains'
    Pattern = 'index.html'
  },
  @{
    Label = 'QUICK_REFERENCE references ADR'
    Path = 'docs/QUICK_REFERENCE.md'
    Type = 'contains'
    Pattern = 'ADR-0001-deprecate-spfx.md'
  },
  @{
    Label = 'QUICK_REFERENCE references frontend plan'
    Path = 'docs/QUICK_REFERENCE.md'
    Type = 'contains'
    Pattern = 'FRONTEND_ROOT_PLAN.md'
  },
  @{
    Label = 'QUICK_REFERENCE declares root frontend'
    Path = 'docs/QUICK_REFERENCE.md'
    Type = 'contains'
    Pattern = 'Frontend canonico actual: `index.html`'
  },
  @{
    Label = 'AUTOMATION_STRATEGY declares root frontend'
    Path = 'docs/AUTOMATION_STRATEGY.md'
    Type = 'contains'
    Pattern = 'El frontend canonico del repositorio vive en `index.html`'
  },
  @{
    Label = 'AUTOMATION_STRATEGY declares SPFx deprecated'
    Path = 'docs/AUTOMATION_STRATEGY.md'
    Type = 'contains'
    Pattern = '`m365/spfx` esta deprecado'
  },
  @{
    Label = 'SPFx README is marked deprecated'
    Path = 'm365/spfx/README.md'
    Type = 'contains'
    Pattern = 'Estado actual: DEPRECADO'
  },
  @{
    Label = 'SPFx README points to root frontend'
    Path = 'm365/spfx/README.md'
    Type = 'contains'
    Pattern = 'frontend activo y verificable se encuentra en `index.html`'
  }
)

$failed = 0

Write-Host '=== Validacion Documental del Frontend Canonico ==='

foreach ($check in $checks) {
  $targetPath = Join-Path $repoRoot $check.Path

  if ($check.Type -eq 'exists') {
    if (Test-Path $targetPath) {
      Write-Host "[OK] $($check.Label)"
    } else {
      Write-Host "[FAIL] $($check.Label)"
      $failed += 1
    }

    continue
  }

  if (-not (Test-Path $targetPath)) {
    Write-Host "[FAIL] $($check.Label)"
    $failed += 1
    continue
  }

  $content = Get-Content -Path $targetPath -Raw
  if ($content -match [regex]::Escape($check.Pattern)) {
    Write-Host "[OK] $($check.Label)"
  } else {
    Write-Host "[FAIL] $($check.Label)"
    $failed += 1
  }
}

if ($failed -gt 0) {
  Write-Host "Resultado: BLOQUEADO con $failed fallo(s)."
  exit 1
}

Write-Host 'Resultado: VALIDACION EXITOSA.'
exit 0