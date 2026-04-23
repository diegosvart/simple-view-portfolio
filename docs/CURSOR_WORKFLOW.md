# Cursor Workflow Guide

This guide replicates the operational workflow in Cursor with the same guardrails and GitHub integration used in this repository.

## 1. Required files

- Cursor rules:
  - `.cursor/rules/workflow-core.mdc`
  - `.cursor/rules/workflow-guardrails.mdc`
  - `.cursor/rules/workflow-routing-adr.mdc`
  - `.cursor/rules/workflow-automation-policy.mdc`
- Scripts:
  - `scripts/load-work-report.ps1`
  - `scripts/validate-pre-implementation.ps1`
  - `scripts/create-issue-from-context.ps1`
  - `scripts/create-pr.ps1`
  - `scripts/advance-after-pr-close.ps1`
  - `scripts/close-session.ps1`
- Workflow config:
  - `scripts/workflow-config.json`

## 2. Source of truth for roadmap

`scripts/workflow-config.json` is the single source of truth for:
- owner
- repo
- base branch
- issue sequence

Default command usage now supports config-driven execution:

```powershell
./scripts/load-work-report.ps1
./scripts/advance-after-pr-close.ps1 -DryRun
./scripts/close-session.ps1 -SessionSummary "Resumen"
```

You can still override values explicitly per command:

```powershell
./scripts/load-work-report.ps1 -Owner diegosvart -Repo simple-view-portfolio
```

## 3. Full operational sequence (Fases 0 -> 6)

### Fase 0: Bootstrap

```powershell
./scripts/load-work-report.ps1
```

If branch drift is detected:

```powershell
./scripts/load-work-report.ps1 -AutoNormalizeBaseBranch
```

### Fase 0.5: Pre-implementation validation

```powershell
./scripts/validate-pre-implementation.ps1
```

Common exception modes:

```powershell
./scripts/validate-pre-implementation.ps1 -DryRun
./scripts/validate-pre-implementation.ps1 -AllowDirty
```

### Fase 1: Create issue from context

```powershell
./scripts/create-issue-from-context.ps1 `
  -Context "Descripcion del trabajo" `
  -Priority P2 `
  -Labels backlog,quality
```

Dry run:

```powershell
./scripts/create-issue-from-context.ps1 -Context "..." -DryRun
```

### Fase 2: Implement issue

```powershell
git checkout develop
git pull origin develop
git checkout -b feature/issue-<N>-<slug>
```

### Fase 3: Create PR linked to issue

```powershell
./scripts/create-pr.ps1 `
  -IssueNumber <N> `
  -BranchName "feature/issue-<N>-<slug>" `
  -CommitMessage "feat(#<N>): descripcion" `
  -PrTitle "feat(#<N>): descripcion" `
  -AssignSelf
```

Dry run:

```powershell
./scripts/create-pr.ps1 `
  -IssueNumber <N> `
  -CommitMessage "feat(#<N>): descripcion" `
  -PrTitle "feat(#<N>): descripcion" `
  -DryRun
```

### Fase 4: Manual review and merge

Merge remains human/manual in GitHub.

### Fase 5: Mandatory post-merge advance

```powershell
./scripts/advance-after-pr-close.ps1 -PullNumber <PR_NUMBER>
```

Dry run:

```powershell
./scripts/advance-after-pr-close.ps1 -DryRun
```

### Fase 6: Session close memory

```powershell
./scripts/close-session.ps1 -SessionSummary "Resumen corto de la sesion"
```

If closing from a feature branch:

```powershell
./scripts/close-session.ps1 `
  -SessionSummary "Resumen corto de la sesion" `
  -AutoNormalizeBaseBranch
```

## 4. Prompt examples for Cursor

- Bootstrap:
  - "Run phase 0 bootstrap and tell me the next suggested issue."
- Pre-checks:
  - "Run phase 0.5 validation and stop if blocked."
- Create issue:
  - "Create an issue from this context and show me the created number."
- Create PR:
  - "Create a PR for issue #80 and ensure body contains Closes #80."
- Post-merge:
  - "PR #77 was merged, run phase 5 and close the linked issue."
- Close session:
  - "Close session with memory summary of what we completed today."

## 5. Blocked states and resolution

If output contains `Resultado: BLOQUEADO`, do not continue to the next phase.

Typical fixes:
- Not on base branch: use `-AutoNormalizeBaseBranch`.
- Dirty tree: commit/stash or use explicit dirty exception flags.
- GH auth missing: `gh auth login`.
- Missing `Closes #<N>` in PR body: update PR body and re-run phase 5.

## 6. Replication checklist for a new repository

- [ ] Copy `.cursor/rules/*.mdc`.
- [ ] Copy scripts under `scripts/`.
- [ ] Create `scripts/workflow-config.json` with repo values.
- [ ] Validate `gh auth status`.
- [ ] Run `./scripts/load-work-report.ps1` and `./scripts/validate-pre-implementation.ps1`.
- [ ] Validate issue and PR flows with `-DryRun`.
- [ ] Update docs links and repository names.
