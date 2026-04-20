# Quick Reference: Comandos de Flujo de Trabajo

Referencia rápida de comandos para ejecutar el flujo de trabajo.

---

## 1. Crear Issue desde Contexto

```powershell
./scripts/create-issue-from-context.ps1 `
  -Context "Descripción del trabajo" `
  -Title "Título opcional" `
  -Priority P2 `
  -Labels tag1,tag2
```

**Dry run** (sin crear):
```powershell
./scripts/create-issue-from-context.ps1 `
  -Context "..." `
  -DryRun
```

**Salida**: Número del issue creado (ej. `#20`)

---

## 2. Implementar Issue

```bash
# Crear rama
git checkout develop
git pull origin develop
git checkout -b feature/issue-<NUMBER>-<SLUG>

# Hacer cambios...
# Editar archivos, etc.

# Validar
git status
git diff
```

---

## 3. Crear PR

```powershell
./scripts/create-pr.ps1 `
  -IssueNumber <NUMBER> `
  -BranchName "feature/issue-<NUMBER>-<SLUG>" `
  -CommitMessage "feat: descripción corta" `
  -PrTitle "feat: descripción (issue #<NUMBER>)" `
  -Files archivo1.ts,archivo2.ts `
  -AssignSelf
```

**Dry run** (sin crear PR):
```powershell
./scripts/create-pr.ps1 `
  -IssueNumber <NUMBER> `
  ... `
  -DryRun
```

**Salida**: URL del PR (ej. `https://github.com/.../pull/19`)

---

## 4. Revisar y Mergear PR

**Revisar manualmente en GitHub**: https://github.com/diegosvart/simple-view-portfolio/pulls

**Una vez approved y merged**, continuar con paso 5.

---

## 5. Cerrar Issue y Avanzar

```powershell
./scripts/advance-after-pr-close.ps1 -PullNumber <PR_NUMBER>
```

**Auto-detectar último PR merged**:
```powershell
./scripts/advance-after-pr-close.ps1
```

**Dry run** (sin cerrar):
```powershell
./scripts/advance-after-pr-close.ps1 -PullNumber <PR_NUMBER> -DryRun
```

**Salida**: 
```
PR #X mergeado.
Issue #Y cerrado.
Siguiente pendiente: issue #Z
```

---

## Ciclo Completo: Comandos Paso a Paso

### Ejemplo: Issue #8

```powershell
# 1. Crear rama e implementar
git checkout develop
git pull
git checkout -b feature/issue-8-contrato-planner
# ... editar archivos ...

# 2. Crear PR
./scripts/create-pr.ps1 `
  -IssueNumber 8 `
  -BranchName feature/issue-8-contrato-planner `
  -CommitMessage "feat: definir contrato PlannerDataProvider" `
  -PrTitle "feat: definir contrato futuro PlannerDataProvider (issue #8)" `
  -Files index.html `
  -AssignSelf

# 3. Revisar en GitHub (manual)

# 4. Una vez merged, avanzar
./scripts/advance-after-pr-close.ps1 -PullNumber 19

# Salida: "Siguiente pendiente: issue #10"
```

---

## Valores por Defecto

| Parámetro | Defecto | Script |
|-----------|---------|--------|
| `Priority` | P2 | create-issue-from-context |
| `Base` | develop | create-pr |
| `IssueSequence` | 3,4,5,6,8,10,9,7,13,12,14,11 | advance-after-pr-close |

---

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "GH not authenticated" | GH CLI no iniciado sesión | `gh auth login` |
| "Issue not open" | Issue ya cerrado | Verificar número |
| "PR not merged" | PR aún abierto o closed sin mergear | Mergear primero |
| "Branch not found" | Rama no está en origin | `git push -u origin <branch>` |
| "Closes #X not in body" | PR body no tiene linkeo | `gh pr edit <number> --body "...Closes #X"` |

---

## Variantes de Uso

### Con Draft
```powershell
./scripts/create-pr.ps1 `
  -IssueNumber 8 `
  ... `
  -Draft
```

### Sin asignación automática
```powershell
./scripts/create-pr.ps1 `
  -IssueNumber 8 `
  ...
  # (sin -AssignSelf)
```

### Solicitar revisión de Copilot
```powershell
./scripts/create-pr.ps1 `
  -IssueNumber 8 `
  ... `
  -RequestCopilotReview
```

### Limitar a archivos específicos
```powershell
./scripts/create-pr.ps1 `
  -IssueNumber 8 `
  ... `
  -Files "index.html,docs/README.md"
```

---

## Información Útil

**Roadmap de issues**: 3, 4, 5, 6, 8, 10, 9, 7, 13, 12, 14, 11, 20

**Base branch**: `develop` (no main)

**PR convention**: 1 issue = 1 PR

**Repo**: https://github.com/diegosvart/simple-view-portfolio

**Issues**: https://github.com/diegosvart/simple-view-portfolio/issues

**PRs**: https://github.com/diegosvart/simple-view-portfolio/pulls

---

## Más información

- [`WORKFLOW.md`](WORKFLOW.md) - Flujo completo explicado
- [`AUTOMATION_STRATEGY.md`](AUTOMATION_STRATEGY.md) - Cómo detectar nuevas automatizaciones
- [`PROJECT_MODEL_SPEC.md`](PROJECT_MODEL_SPEC.md) - Especificación del modelo de datos

