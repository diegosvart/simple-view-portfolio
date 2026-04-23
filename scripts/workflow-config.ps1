Set-StrictMode -Version Latest

function Get-WorkflowConfig {
  param(
    [string]$ConfigFilePath = (Join-Path $PSScriptRoot 'workflow-config.json')
  )

  if (-not (Test-Path -LiteralPath $ConfigFilePath)) {
    return $null
  }

  try {
    $raw = Get-Content -LiteralPath $ConfigFilePath -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) {
      return $null
    }

    $cfg = $raw | ConvertFrom-Json
    $issueSequence = @()
    if ($cfg.PSObject.Properties.Name -contains 'issueSequence' -and $cfg.issueSequence) {
      $issueSequence = @($cfg.issueSequence | ForEach-Object { [int]$_ })
    }

    return [pscustomobject]@{
      owner = [string]$cfg.owner
      repo = [string]$cfg.repo
      baseBranch = [string]$cfg.baseBranch
      issueSequence = $issueSequence
      configPath = $ConfigFilePath
    }
  } catch {
    throw "No se pudo leer workflow config desde '$ConfigFilePath': $($_.Exception.Message)"
  }
}
