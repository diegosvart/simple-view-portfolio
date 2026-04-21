# Flujo de Trabajo: De Requerimientos a Ejecución

Este documento describe cómo transformamos requerimientos en issues del repositorio y los ejecutamos de forma ordenada y automatizable.

## Principios

- **1 Issue = 1 PR**: Cada trabajo corresponde a exactamente un pull request contra `develop`.
- **Orden Lógico**: Las tareas se ejecutan en una secuencia planificada y acordada.
- **Automatización**: El agente sugiere y ejecuta automatizaciones mediante skills.
- **Trazabilidad**: Cada cambio es rastreable desde requerimiento → issue → PR → merge.

---

## Fase 0: Inicio de Sesion (Bootstrap)

Al iniciar una sesion nueva, ejecutar primero el bootstrap para cargar contexto real del repo.

**Skill**: `session-bootstrap`

**Skill complementaria**: `work-current-status-report`

**Comando recomendado**:
```powershell
./scripts/load-work-report.ps1 -Owner diegosvart -Repo simple-view-portfolio
```

Si no estas en `develop`, normaliza automaticamente en el bootstrap:
```powershell
./scripts/load-work-report.ps1 -Owner diegosvart -Repo simple-view-portfolio -AutoNormalizeBaseBranch
```

**Resultado esperado**:
- Estado actual de ramas.
- Issues pendientes ordenados por roadmap.
- Siguiente tarea sugerida por orden logico.
- Guardrail de inicio: sesion valida solo cuando queda normalizada sobre `develop`.

---

## Fase 0.5: Validacion Pre-Implementacion

Antes de crear rama o editar codigo, ejecutar una validacion obligatoria de precondiciones.

**Skill**: `pre-implementation-validation`

**Comando recomendado**:
```powershell
./scripts/validate-pre-implementation.ps1 -BaseBranch develop
```

**Bloqueos que detecta**:
- No estas en `develop`.
- Falta `origin/develop`.
- Arbol de trabajo sucio sin aprobacion explicita.
- Conflictos de merge.
- `develop` no sincronizada con upstream.
- GH CLI no autenticado.

**Uso excepcional**:
```powershell
./scripts/validate-pre-implementation.ps1 -BaseBranch develop -AllowDirty -DryRun
```

**Nota de consistencia**:
- Si el bootstrap detecta desvio de rama, normaliza con `-AutoNormalizeBaseBranch` y luego revalida con este step.

---

## Fase 1: Transformar Requerimientos en Issues

### 1.1 Crear Issue desde Contexto

**Cuándo**: Cuando tenemos una descripción informal de trabajo a realizar.

**Skill**: `create-issue-from-context`

**Script**: `scripts/create-issue-from-context.ps1`

**Entrada**: Contexto en lenguaje natural

**Salida**: Un issue en GitHub con estructura estándar

**Ejemplo**:
```powershell
./scripts/create-issue-from-context.ps1 `
  -Context "Revisar las buenas practicas de desarrollo implementadas en este proyecto" `
  -Priority P2 `
  -Labels backlog,quality
```

**Plantilla automática generada**:
- **Contexto/Problema**: Descripción del trabajo
- **Alcance**: Qué se incluye
- **Criterios de Aceptación**: Condiciones de éxito verificables
- **Verificación**: Cómo validar el resultado
- **Dependencias**: Bloqueadores conocidos
- **Fuera de Alcance**: Qué NO entra en este issue
- **Prioridad**: P0-P3

**Refinamiento automático**:
- Si falta `Title`, se genera desde el contexto.
- Si faltan secciones críticas, se rellenan con defaults sensatos.
- Los defaults son explícitos y reenviables si es necesario.

---

### 1.2 Planificar y Ordenar Issues

Una vez creados los issues, se acuerda un orden de ejecución. Este orden es la "roadmap" de trabajo.

**Ejemplo de secuencia acordada**:
```
Fase 1: #3, #4, #5, #6
Fase 2: #8, #10, #9, #7
Fase 3: #13, #12, #14, #11
Meta: #20 (buenas prácticas)
Meta siguiente: Tarea de seguridad Git (bloquear comandos dañinos)
```

Este orden se persiste en:
- Scripts (ej. `IssueSequence` en `advance-after-pr-close.ps1`)
- Memoria del repositorio (`.github/scripts/`)
- Documentación (este archivo)

---

## Fase 2: Implementar Trabajo por Issue

### 2.1 Crear rama de feature

Para cada issue, crear una rama con patrón consistente:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/issue-<NUMBER>-<SLUG>
```

**Ejemplo**:
```bash
git checkout -b feature/issue-8-contrato-planner-provider
```

### 2.2 Implementar cambios

- Editar código necesario.
- Mantener cambios focalizados al issue (una sola responsabilidad).
- No mezclar trabajo de múltiples issues en una rama.

### 2.3 Validar cambios

```bash
git diff
# Revisar manualmente
# Ejecutar validaciones (linters, tests si existen)
```

---

## Fase 3: Crear PR y Linkear Issue

### 3.1 Crear PR con Skill

**Skill**: `create-issue-pr`

**Script**: `scripts/create-pr.ps1`

**Propósito**: Crear un PR consistente contra `develop` que auto-linkee el issue.

**Ejemplo**:
```powershell
./scripts/create-pr.ps1 `
  -IssueNumber 8 `
  -BranchName "feature/issue-8-contrato-planner-provider" `
  -CommitMessage "feat: definir contrato futuro PlannerDataProvider" `
  -PrTitle "feat: definir contrato futuro PlannerDataProvider (issue #8)" `
  -PrBody "Define contrato futuro PlannerDataProvider y mapeos ProjectModel<->Planner sin integrar Graph en esta iteracion.`n`nCloses #8" `
  -Files index.html `
  -AssignSelf
```

**Flujo automático del script**:
1. Valida que el issue esté abierto en GitHub.
2. Valida que la rama exista en origin.
3. Valida autenticación de GH.
4. Crea commit (stage + commit).
5. Pushea rama a origin.
6. Crea PR con base `develop`.
7. Auto-linquea el issue (`Closes #<número>` en PR body).
8. Asigna el PR (opcional).

**Opciones disponibles**:
- `-DryRun`: Simular sin crear nada.
- `-Files <paths>`: Limitar cambios a archivos específicos.
- `-Draft`: Crear como PR borrador.
- `-RequestCopilotReview`: Solicitar revisión automática.

---

## Fase 4: Revisión y Merge

### 4.1 Revisión manual (si aplica)

- Code review humano o automático.
- Validación de criterios de aceptación del issue.

### 4.2 Merge del PR

El PR se mergea a `develop`:
- Por revisión manual: `gh pr merge <number>`
- Por auto-merge: Configuración del repositorio

---

## Fase 5: Cierre de Issue y Avance del Roadmap

### 5.1 Automatizar cierre y avance (OBLIGATORIO DESPUÉS DE MERGEAR)

**Skill**: `advance-after-pr-close`

**Script**: `scripts/advance-after-pr-close.ps1`

**Propósito**: 
1. Detectar que un PR fue merged.
2. Cerrar el issue linkado.
3. Reportar el siguiente issue en la roadmap.

⚠️ **RESPONSABILIDAD CRÍTICA**: Este step DEBE ejecutarse siempre después de mergear un PR, independientemente de quién lo mergee.

**Si el usuario mergeó la PR manualmente en GitHub**:
El agente debe detectarlo y ejecutar automáticamente:
```powershell
./scripts/advance-after-pr-close.ps1 -PullNumber <PR_NUMBER>
```

**Consecuencia de saltarse este step**: El issue quedará abierto permanentemente, rompiendo la lógica del flujo.

**Ejemplo**:
```powershell
./scripts/advance-after-pr-close.ps1 -PullNumber 18
```

**Flujo automático**:
1. Valida que PR fue merged a `develop`.
2. Extrae issue linkado del PR body (`Closes #<número>`).
3. Cierra el issue.
4. Busca siguiente issue abierto en la secuencia.
5. Reporta: `"Siguiente pendiente: issue #X"`.

**Sin argumentos**: Auto-detecta el último PR merged a `develop`.

```powershell
./scripts/advance-after-pr-close.ps1
```

---

## Fase 6: Cierre de Sesion (Memoria Local)

Al terminar la sesion, registrar una memoria breve para continuidad inmediata.

**Skill**: `session-close-memory`

**Comando recomendado**:
```powershell
./scripts/close-session.ps1 `
  -Owner diegosvart `
  -Repo simple-view-portfolio `
  -SessionSummary "Resumen corto de lo realizado en la sesion"
```

Si terminaste en una feature branch, normaliza automaticamente antes de cerrar:
```powershell
./scripts/close-session.ps1 `
  -Owner diegosvart `
  -Repo simple-view-portfolio `
  -SessionSummary "Resumen corto de lo realizado en la sesion" `
  -AutoNormalizeBaseBranch
```

**Salida esperada**:
- Archivo `docs/LAST_SESSION_MEMORY.md` actualizado.
- Resumen pequeno y legible de la sesion.
- Siguiente issue sugerido por orden logico.
- Guardrail de cierre: la memoria solo se persiste si el estado final queda valido en `develop`.

**Siguiente tarea sugerida vigente**:
- Issue #8: S2-I5 | Definir contrato futuro PlannerDataProvider (sin Graph).

---

## Ciclo Completo: Ejemplo Práctico

### Escenario: Implementar Issue #8

1. **Requerimiento entra**: "Necesitamos un contrato para PlannerDataProvider"

2. **Ya existe issue**: #8 creado en la roadmap

3. **Implementar**:
   ```bash
   git checkout -b feature/issue-8-contrato-planner-provider
   # Editar index.html
   git add index.html
   ```

4. **Crear PR**:
   ```powershell
   ./scripts/create-pr.ps1 `
     -IssueNumber 8 `
     -BranchName feature/issue-8-contrato-planner-provider `
     -CommitMessage "feat: definir contrato PlannerDataProvider" `
     -PrTitle "feat: definir contrato futuro PlannerDataProvider (issue #8)" `
     -Files index.html `
     -AssignSelf
   ```
   → **Salida**: PR #19 creado, linkea issue #8

5. **Revisar y mergear**: PR revisado y mergeado a `develop`

6. **Cerrar y avanzar**:
   ```powershell
   ./scripts/advance-after-pr-close.ps1 -PullNumber 19
   ```
   → **Salida**: 
   ```
   PR #19 verificado como merged.
   Issue #8 cerrado.
   Siguiente pendiente: issue #10
   ```

7. **Automatización sugerida**: 
   - Si hay otro issue listo, el agente comienza implementación.
   - Si hay patrón repetible, sugiere nueva skill.

---

## Automatización Sugerida por el Agente

El agente debe detectar y sugerir automatizaciones en estos puntos:

### Patrón: Cambios repetitivos en archivo

**Detección**: 
- Múltiples PRs editando el mismo archivo con cambios similares.
- Cambios que siguen un patrón predecible.

**Sugerencia**:
- Crear función reutilizable en el código.
- Crear skill o script si es proceso manual repetido.

### Patrón: Ciclo manual repetible

**Detección**:
- Mismos pasos ejecutados en múltiples issues.
- Pasos que pueden automatizarse sin ambiguedad.

**Sugerencia**:
- Crear nuevo script en `scripts/`.
- Crear skill correspondiente en `.github/skills/`.
- Documentar entrada/salida clara.

### Patrón: Validación faltante

**Detección**:
- Issues que requieren validación manual.
- Criterios de aceptación ambiguos.

**Sugerencia**:
- Agregar validación a script existente.
- Refinar issue template.

### Ejemplo de Automatización Sugerida

**Contexto**: Hemos cerrado 4 issues y el flujo es manual.

**Agente sugiere**:
> "Detecto que el flujo crear-PR → reviewar → mergear → cerrar-issue es repetible. ¿Te gustaría que cree un script `auto-workflow.ps1` que ejecute todo el ciclo en un comando? Entrada: número de issue + rama. Salida: PR creado, merged, issue cerrado."

**Si usuario acepta**: Agente crea script y skill, la documenta, la prueba.

---

## Estructura de Carpetas de Automatización

```
.github/
  skills/
    create-issue-from-context/
      SKILL.md
    create-issue-pr/
      SKILL.md
    advance-after-pr-close/
      SKILL.md
    [nuevas skills generadas...]

scripts/
  create-issue-from-context.ps1
  create-pr.ps1
  advance-after-pr-close.ps1
  [nuevos scripts generados...]

docs/
  PROJECT_MODEL_SPEC.md      # Especificación del modelo de datos
  WORKFLOW.md                # Este archivo
  [nuevas docs...]
```

---

## Convenciones

### Nombres de rama
```
feature/issue-<NUMBER>-<SLUG>
```
- `<NUMBER>`: Número del issue
- `<SLUG>`: Resumen corto en lowercase con guiones

**Ejemplos**:
- `feature/issue-3-proyecto-model-spec`
- `feature/issue-8-contrato-planner-provider`

### Mensajes de commit
```
<tipo>: <descripción>
```
- Tipos: `feat`, `fix`, `refactor`, `docs`, `test`
- Descripción clara y relacionada al issue

**Ejemplos**:
- `feat: definir contrato futuro PlannerDataProvider`
- `refactor: centralizar validaciones de ProjectModel`

### Títulos de PR
```
<tipo>: <descripción> (issue #<NUMBER>)
```

**Ejemplo**:
- `feat: definir contrato futuro PlannerDataProvider (issue #8)`

### Body de PR
```
<Descripción del cambio>

Closes #<NUMBER>
```

El `Closes #<NUMBER>` es **obligatorio** para que el skill `advance-after-pr-close` funcione.

---

## Reglas de Oro del Flujo

Estas reglas son **no negociables**:

1. **Nunca mergear sin advance**: Si mergeas un PR, DEBES ejecutar `advance-after-pr-close` para cerrar el issue.
   - Sin esto, el issue queda abierto y el flujo se rompe.
   - El siguiente paso no puede comenzar.

2. **1 Issue = 1 PR**: No mezcles trabajo de múltiples issues en un solo PR.
   - Facilita el review.
   - Mantiene trazabilidad clara.
   - Simplifica rollbacks si es necesario.

3. **Base siempre develop**: Los PRs van SIEMPRE a `develop`, nunca a `main`.
   - `main` es solo para releases consolidadas.
   - `develop` es la rama de integración.

4. **PR body tiene Closes #X**: Es OBLIGATORIO para que `advance-after-pr-close` funcione.
   - Sin esto, el script no puede linkear issue a PR.
   - El issue no se cierra automáticamente.

5. **Sequence importa**: Los issues deben ejecutarse en orden lógico (roadmap).
   - No saltarse issues.
   - Facilita planificación y priorización.
   - Evita dependencias ocultas.

6. **Nunca reinicializar repos clonados**: Está prohibido ejecutar `git init` dentro de un repositorio ya clonado.
  - Antes de trabajar, ejecutar checklist mínimo:
    - `git rev-parse --is-inside-work-tree`
    - `git remote -v`
    - `git branch -a`
    - `git status -sb`
  - Si aparece `No commits yet` o falta `origin/develop`, detenerse y escalar.

---

## Troubleshooting

### Problema: PR fue mergeado pero issue no se cerró

**Causa**: PR body no contiene `Closes #<número>`

**Solución**: 
1. Editar PR body: `gh pr edit <number> --body "<nuevo body con Closes #<número>>"`
2. Ejecutar skill: `./scripts/advance-after-pr-close.ps1 -PullNumber <number>`

### Problema: Script dice "PR no merged"

**Causa**: PR aún está abierto o fue closed sin mergear

**Solución**:
1. Verificar estado: `gh pr view <number> --json state`
2. Si está closed: Reabrirlo o ignorar
3. Si está abierto: Mergear primero

### Problema: GH CLI no autenticado

**Solución**:
```powershell
gh auth login
# Seguir prompts para autenticarse
```

---

## Referencias

- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Convenciones Conventional Commits](https://www.conventionalcommits.org/)
- Memoria del repositorio: `/memories/repo/spfx-migration-notes.md`

