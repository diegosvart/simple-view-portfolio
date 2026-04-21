# Quick Reference: Comandos de Flujo de Trabajo

Referencia rápida de comandos para ejecutar el flujo de trabajo.

## Nota Arquitectonica

- Frontend canonico actual: `index.html` en la raiz del repo.
- SPFx en `m365/spfx` esta deprecado y no es la superficie activa para nuevas features.
- Ver ADR: `docs/decisions/ADR-0001-deprecate-spfx.md`.
- Ver plan tecnico: `docs/FRONTEND_ROOT_PLAN.md`.

Validacion automatica recomendada:
```powershell
./scripts/validate-frontend-docs.ps1
```

---

## 0. Inicio de Sesion (obligatorio)

```powershell
./scripts/load-work-report.ps1 -Owner diegosvart -Repo simple-view-portfolio
```

Si no estas en `develop`, normalizar en el mismo paso:
```powershell
./scripts/load-work-report.ps1 -Owner diegosvart -Repo simple-view-portfolio -AutoNormalizeBaseBranch
```

Salida esperada:
- Estado de ramas (local y tracking).
- Issues abiertos en orden logico.
- Siguiente tarea sugerida.
- Guardrail de inicio validado sobre `develop`.

---

## 0.5 Validacion Pre-Implementacion (obligatorio)

```powershell
./scripts/validate-pre-implementation.ps1 -BaseBranch develop
```

Si necesitas diagnostico sin bloqueo:
```powershell
./scripts/validate-pre-implementation.ps1 -BaseBranch develop -DryRun
```

Si necesitas excepcion controlada por cambios locales:
```powershell
./scripts/validate-pre-implementation.ps1 -BaseBranch develop -AllowDirty
```


## 1. Crear Issue desde Contexto

> Nota: si `scripts/create-issue-from-context.ps1` no existe en tu copia local, usar `gh issue create` con la plantilla del workflow.

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

> Nota: si `scripts/create-pr.ps1` no existe en tu copia local, usar flujo manual: `git push -u origin <branch>` + `gh pr create --base develop --head <branch> --body "...\n\nCloses #<n>"`.

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

**Una vez approved y merged**, continuar con paso 5 (obligatorio para cerrar ciclo).

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

**Regla de completitud**:
- El ciclo NO se considera completo al crear PR.
- El ciclo termina solo cuando este paso confirma issue cerrado y siguiente pendiente.

---

## 6. Cierre de Sesion (memoria local)

```powershell
./scripts/close-session.ps1 `
  -Owner diegosvart `
  -Repo simple-view-portfolio `
  -SessionSummary "Resumen corto de la sesion"
```

Si cierras desde una feature branch:
```powershell
./scripts/close-session.ps1 `
  -Owner diegosvart `
  -Repo simple-view-portfolio `
  -SessionSummary "Resumen corto de la sesion" `
  -AutoNormalizeBaseBranch
```

Salida esperada:
- Actualiza `docs/LAST_SESSION_MEMORY.md`.
- Deja resumen breve de trabajo realizado.
- Informa siguiente issue sugerido por roadmap.
- Si no logra normalizar a `develop`, el cierre se bloquea y no persiste memoria.

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

# 4. Una vez merged, EJECUTAR INMEDIATAMENTE este step:
./scripts/advance-after-pr-close.ps1 -PullNumber 19

# ⚠️ CRÍTICO: Este step cierra el issue y reporta el siguiente.
# No saltarlo o el issue quedará abierto indefinidamente y el flujo se rompe.

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
| "Resultado: BLOQUEADO" en bootstrap | No estás en `develop` y no se normalizó | Reintentar con `-AutoNormalizeBaseBranch` o ejecutar checkout/pull manual |
| "Resultado: BLOQUEADO" en cierre | Estado final no válido para cierre | Normalizar a `develop`, limpiar árbol y reejecutar `close-session.ps1` |

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

**Siguiente tarea sugerida actual**: issue #8 (S2-I5 | Definir contrato futuro PlannerDataProvider sin Graph)

**Nueva tarea agregada**: Seguridad Git para prevenir comandos dañinos (incluye bloqueo operativo de `git init` en repos clonado y validaciones previas obligatorias)

**Checklist obligatorio antes de trabajar**:
- `git rev-parse --is-inside-work-tree`
- `git remote -v`
- `git branch -a`
- `git status -sb`

**Regla de detención**: Si ves `No commits yet` o no existe `origin/develop`, detener ejecución y no aplicar cambios.

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

