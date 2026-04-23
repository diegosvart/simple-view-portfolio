# Guía de Replicación del Flujo de Trabajo con Agentes IA

> **Portabilidad**: Este documento está escrito para ser copiado a cualquier proyecto y adaptado.  
> Los valores específicos de este repo están marcados como `[REPO: valor]`.  
> Compatible con GitHub Copilot, Claude, Codex, OpenCode y cualquier agente que pueda leer archivos de instrucciones.

---

## Filosofía del método

Cinco principios que dan cohesión a todo lo demás:

1. **1 Issue = 1 PR**: Cada unidad de trabajo tiene un issue en GitHub y un PR contra `develop`. Sin excepciones.
2. **Orden lógico explícito**: La secuencia de issues se acuerda una sola vez y se persiste. El agente nunca elige qué hacer next por cuenta propia.
3. **Guardrails antes que ejecución**: Antes de tocar código, el agente valida que el entorno está en estado conocido y seguro.
4. **Automatizar lo repetible**: Si un ciclo manual se repite tres veces igual, se convierte en script + skill.
5. **Memoria local entre sesiones**: Al final de cada sesión el agente escribe un archivo de contexto breve. Al inicio de la siguiente lo lee.

---

## Enrutamiento para decisiones de arquitectura

Cuando la consulta sea sobre ADR, arquitectura, trade-offs, RFC o migración a React, se debe priorizar el agente `ADR Decision Architect` antes de ejecutar implementación.

Regla:
- Primero: análisis de opciones + recomendación técnica.
- Después: implementación solo si el usuario valida el enfoque.

---

## Parte 1 — Prerrequisitos del entorno

### 1.1 Herramientas requeridas

| Herramienta | Versión mínima | Verificación |
|---|---|---|
| Git | ≥ 2.35 | `git --version` |
| GitHub CLI (`gh`) | ≥ 2.30 | `gh --version` |
| PowerShell | ≥ 5.1 (o pwsh 7+) | `$PSVersionTable.PSVersion` |
| Node.js | ≥ 18 LTS | `node --version` |
| npm | ≥ 9 | `npm --version` |

### 1.2 Configuración mínima de Git

```bash
git config --global user.name  "Tu Nombre"
git config --global user.email "tu@email.com"
```

### 1.3 Autenticación GitHub CLI

```bash
gh auth login
gh auth status   # debe mostrar "Logged in to github.com"
```

### 1.4 Estructura de ramas requerida

```
main       ← releases consolidadas (solo merges desde develop)
develop    ← rama base de integración — NUNCA se trabaja directamente aquí
feature/issue-<N>-<slug>  ← una rama por issue
```

Crear la rama `develop` si no existe:

```bash
git checkout -b develop
git push -u origin develop
```

---

## Parte 2 — Estructura de archivos del workflow

Estos archivos deben existir en el repositorio destino. Los paths son convención — se pueden ajustar siempre que los scripts los referencien consistentemente.

```
.github/
  copilot-instructions.md     ← este archivo (instrucciones del agente)
  skills/
    session-bootstrap/
      SKILL.md
    pre-implementation-validation/
      SKILL.md
    advance-after-pr-close/
      SKILL.md
    session-close-memory/
      SKILL.md
    work-current-status-report/
      SKILL.md
docs/
  WORKFLOW.md                 ← descripción narrativa del flujo
  QUICK_REFERENCE.md          ← comandos concretos por fase
  AUTOMATION_STRATEGY.md      ← qué está automatizado y por qué
  LAST_SESSION_MEMORY.md      ← escrito por el agente al cerrar sesión
  decisions/
    ADR-0001-*.md             ← decisiones arquitectónicas relevantes
scripts/
  load-work-report.ps1        ← bootstrap de sesión
  validate-pre-implementation.ps1
  close-session.ps1
  advance-after-pr-close.ps1
  create-pr.ps1               ← opcional, implementar según necesidad
```

---

## Parte 3 — Constantes del repositorio

Definir estas variables una sola vez. Todos los scripts las usan como parámetros.

```
Owner        = [REPO: diegosvart]
Repo         = [REPO: simple-view-portfolio]
BaseBranch   = develop
IssueSequence = [REPO: 3,4,5,6,8,10,9,7,13,12,14,11,20,23]
```

`IssueSequence` es el orden acordado de ejecución de issues. Se persiste en los scripts como array. El agente **no altera este orden** sin acuerdo explícito con el usuario.

---

## Parte 4 — Ciclo completo de sesión

### Fase 0 — Bootstrap (OBLIGATORIO al iniciar cualquier sesión)

**Skill**: `session-bootstrap`

```powershell
./scripts/load-work-report.ps1 -Owner <Owner> -Repo <Repo>

# Si no estás en develop, normaliza automáticamente:
./scripts/load-work-report.ps1 -Owner <Owner> -Repo <Repo> -AutoNormalizeBaseBranch
```

**Qué produce**:
- Estado actual de ramas local/remota
- Lista de issues abiertos ordenados por `IssueSequence`
- Siguiente tarea sugerida
- Guardrail: bloquea sesión si no puede normalizar en `develop`

**Regla de seguridad**: Nunca ejecutar `git init` en un repo clonado.

---

### Fase 0.5 — Validación pre-implementación (OBLIGATORIO antes de crear rama)

**Skill**: `pre-implementation-validation`

```powershell
./scripts/validate-pre-implementation.ps1 -BaseBranch develop
```

**Checks que realiza**:

| Check | Descripción |
|---|---|
| ✅ Repo Git válido | `git rev-parse --is-inside-work-tree` |
| ✅ `origin` configurado | remote existe |
| ✅ `origin/develop` presente | rama base existe en remoto |
| ✅ Rama actual = `develop` | no trabajar desde otra rama |
| ✅ Árbol limpio | sin cambios sin commitear |
| ✅ Sin conflictos de merge | `git diff --name-only --diff-filter=U` vacío |
| ✅ `develop` sincronizada | upstream no está adelante |
| ✅ GH CLI autenticado | `gh auth status` OK |

Resultado: `VALIDACION EXITOSA` o `BLOQUEADO` con hints de corrección.

**Flags de excepción** (usar con criterio):
```powershell
-AllowDirty     # permite árbol sucio
-SkipGhAuth     # omite check de auth GH
-DryRun         # reporta sin bloquear
```

---

### Fase 1 — Crear issue desde contexto

Cuando el usuario describe trabajo informalmente, convertirlo en un issue estructurado antes de tocar código.

**Plantilla estándar de issue**:

```markdown
## Contexto / Problema
[Descripción del trabajo]

## Alcance
[Qué se incluye en este issue]

## Criterios de Aceptación
- [ ] Condición verificable 1
- [ ] Condición verificable 2

## Verificación
[Cómo validar que está completo]

## Dependencias
[Issues bloqueantes, si aplica]

## Fuera de Alcance
[Qué NO entra aquí explícitamente]

## Prioridad
P0 | P1 | P2 | P3
```

Crear con GH CLI:
```bash
gh issue create --title "título" --body "$(cat issue-body.md)" --label "label1,label2"
```

Agregar el nuevo número al final de `IssueSequence` en los scripts.

---

### Fase 2 — Implementar trabajo por issue

**Regla**: Una rama por issue. Sin mezclar dos issues en una rama.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/issue-<NUMBER>-<slug-corto>

# Ejemplos válidos:
# feature/issue-8-contrato-planner-provider
# feature/issue-23-ci-github-actions
```

**Convención de commits**:
```
feat(#N): descripción breve del cambio
fix(#N): descripción del fix
refactor(#N): descripción del refactor
test(#N): descripción de tests añadidos
docs(#N): actualización de documentación
```

---

### Fase 3 — Crear PR y vincular issue

**Regla crítica**: El PR body debe contener `Closes #<número>` para que el script de avance post-merge detecte el issue vinculado.

```bash
# Manual:
git add .
git commit -m "feat(#N): descripción"
git push -u origin feature/issue-N-slug

gh pr create \
  --base develop \
  --title "feat(#N): descripción" \
  --body "Closes #N

## Cambios
- [descripción]

## Verificación
- [cómo probar]"
```

```powershell
# Con script (si existe):
./scripts/create-pr.ps1 \
  -IssueNumber <N> \
  -BranchName "feature/issue-N-slug" \
  -CommitMessage "feat(#N): descripción" \
  -AssignSelf
```

---

### Fase 4 — Revisión y merge manual

Revisar en GitHub. Hacer merge cuando esté aprobado.  
**No hay automatización en esta fase.** El merge es siempre una acción humana deliberada.

---

### Fase 5 — Cierre de issue y avance (OBLIGATORIO después de mergear)

**Skill**: `advance-after-pr-close`

```powershell
# Auto-detecta el último PR mergeado:
./scripts/advance-after-pr-close.ps1 -Owner <Owner> -Repo <Repo>

# O explícito:
./scripts/advance-after-pr-close.ps1 -Owner <Owner> -Repo <Repo> -PullNumber <N>
```

**Qué produce**:
- Confirma que el PR está mergeado (no solo cerrado)
- Extrae `Closes #<N>` del body del PR
- Cierra el issue vinculado con comentario
- Reporta el siguiente issue pendiente según `IssueSequence`
- Resultado: `CIERRE Y AVANCE COMPLETADO` o `BLOQUEADO`

**El ciclo NO está completo hasta que este paso confirma issue cerrado.**

---

### Fase 6 — Cierre de sesión (OBLIGATORIO al finalizar)

**Skill**: `session-close-memory`

```powershell
./scripts/close-session.ps1 \
  -Owner <Owner> \
  -Repo <Repo> \
  -SessionSummary "Descripción de 1-2 líneas de lo realizado"
```

**Qué escribe en `docs/LAST_SESSION_MEMORY.md`**:
- Timestamp ISO
- Rama activa y estado git corto
- Resumen de la sesión
- Archivos modificados (primeros 12)
- Siguiente issue sugerido
- Nota de continuidad: ejecutar bootstrap en la próxima sesión

---

## Parte 5 — Skills del agente

Las skills son archivos `.github/skills/<nombre>/SKILL.md` que el agente carga cuando el contexto lo requiere. Son instrucciones específicas de dominio que complementan este archivo general.

| Skill | Cuándo cargarla | Comando asociado |
|---|---|---|
| `session-bootstrap` | Al iniciar sesión | `load-work-report.ps1` |
| `work-current-status-report` | Al iniciar sesión (complementaria) | `load-work-report.ps1` |
| `pre-implementation-validation` | Antes de crear rama feature | `validate-pre-implementation.ps1` |
| `advance-after-pr-close` | Inmediatamente después de mergear PR | `advance-after-pr-close.ps1` |
| `session-close-memory` | Al finalizar sesión | `close-session.ps1` |

### Estructura mínima de un SKILL.md

```markdown
# Skill: <nombre>

## Proposito
Una línea de para qué sirve.

## Cuando usar
- Condición disparadora

## Comando
\`\`\`powershell
./scripts/<script>.ps1 -Owner <Owner> -Repo <Repo>
\`\`\`

## Validaciones incluidas
- Lista de checks

## Salida esperada
Resultado final esperado y exit codes.
```

---

## Parte 6 — Scripts PowerShell: contrato de implementación

Cada script debe cumplir este contrato para ser compatible con el resto del flujo:

### Parámetros comunes (todos los scripts)

```powershell
param(
    [Parameter(Mandatory=$true)]  [string]$Owner,
    [Parameter(Mandatory=$true)]  [string]$Repo,
    [string]$BaseBranch = 'develop',
    [int[]]$IssueSequence = @(3,4,5,6,8,10,9,7,13,12,14,11,20,23),
    [switch]$DryRun
)
```

### Exit codes estándar

| Código | Significado |
|---|---|
| `0` | Éxito — flujo puede continuar |
| `1` | Bloqueado — corregir antes de continuar |

### Validaciones que todo script debe incluir

```powershell
# 1. Dentro de repo Git
if (-not (git rev-parse --is-inside-work-tree 2>$null)) {
    Write-Error "No es un repositorio Git válido"; exit 1
}

# 2. origin configurado
if (-not (git remote get-url origin 2>$null)) {
    Write-Error "Remote 'origin' no configurado"; exit 1
}

# 3. GH CLI autenticado (si el script usa gh)
if (-not (gh auth status 2>$null)) {
    Write-Error "GH CLI no autenticado. Ejecutar: gh auth login"; exit 1
}
```

### `load-work-report.ps1` — responsabilidades

1. Verificar que se está en `$BaseBranch` (o normalizar con `-AutoNormalizeBaseBranch`)
2. Listar ramas locales con tracking: `git branch -vv`
3. Consultar issues abiertos: `gh issue list --state open --json number,title`
4. Ordenar issues según `$IssueSequence`
5. Imprimir siguiente issue sugerido
6. Exit 0 si OK, Exit 1 si bloqueado

### `validate-pre-implementation.ps1` — responsabilidades

1. Ejecutar los 8 checks listados en Fase 0.5
2. Imprimir tabla de resultados `[OK]` / `[FAIL]`
3. Imprimir `VALIDACION EXITOSA` o `BLOQUEADO`
4. Con `-DryRun`: exit 0 aunque haya fallos, solo reportar

### `advance-after-pr-close.ps1` — responsabilidades

1. Resolver número de PR (parámetro o auto-detect último merged a `$BaseBranch`)
2. Verificar `gh pr view <N> --json state,mergedAt,baseRefName,body`
3. Extraer número de issue de body con regex `Closes #(\d+)`
4. Verificar que el issue existe y está abierto
5. Cerrar issue: `gh issue close <N> --comment "Cerrado por merge de PR #<PR>"`
6. Buscar siguiente issue en `$IssueSequence` que esté abierto
7. Imprimir resultado con URL del siguiente issue

### `close-session.ps1` — responsabilidades

1. Verificar estado final en `$BaseBranch` (o normalizar con flag)
2. Obtener resumen de archivos modificados: `git diff --name-only HEAD~1 HEAD`
3. Determinar siguiente issue pendiente (igual que `advance-after-pr-close`)
4. Escribir `docs/LAST_SESSION_MEMORY.md` con timestamp, resumen, estado, siguiente tarea

---

## Parte 7 — Convenciones de código y arquitectura

Estas convenciones aplican al código del proyecto, no al workflow en sí. Adaptarlas al stack del proyecto destino.

### Separación de responsabilidades (frontend vanilla)

```
src/
  frontend-root/
    pure/             ← lógica pura sin dependencias de DOM
      constants.js    ← constantes globales
      validation.js   ← funciones de validación (input → errors[])
      markdown.js     ← parsing/serialización
      metrics.js      ← cálculos y agregados
      ux-state.js     ← máquina de estados de UI
      provider.js     ← factory de data provider
      maintainer-controller.js  ← coordinador de operaciones
tests/
  frontend-root/
    *.test.js         ← tests con Node built-in runner
```

**Regla**: La carpeta `pure/` no puede importar `document`, `window` ni APIs de navegador.

### Tests

```bash
npm run test                    # todos los tests
node --test tests/**/*.test.js  # equivalente directo
```

Categorías de tests implementadas:

| Tipo | Archivo patrón | Qué verifica |
|---|---|---|
| Unitarios de lógica pura | `*.test.js` | Función con input/output determinístico |
| Contrato de proveedor | `*-contract.test.js` | Interfaz estable entre capas |
| Smoke DOM | `smoke.test.js` | Wiring entre funciones y DOM |
| Controlador | `*-controller.test.js` | Flujo de operaciones de estado |

### Seguridad en capas (OWASP)

```javascript
// Capa 1: validar en UI antes de llamar al dominio
const errors = collectProjectValidationErrors(rawInput);
if (errors.length) { showErrors(errors); return; }

// Capa 2: sanitizar antes de persistir
const safeProject = sanitizeProject(project);
await provider.save(safeProject);

// Capa 3: guard de operaciones concurrentes
if (isOperationInProgress) return;
isOperationInProgress = true;
try { await operation(); } finally { isOperationInProgress = false; }
```

---

## Parte 8 — Reglas operacionales críticas

Estas reglas el agente **nunca puede violar** sin confirmación explícita del usuario:

| # | Regla | Por qué |
|---|---|---|
| R1 | Nunca ejecutar `git init` en repo clonado | Destruye historial del remote |
| R2 | Nunca hacer push directo a `main` | Solo se mergea desde `develop` al consolidar release |
| R3 | Nunca mezclar dos issues en una rama | Rompe trazabilidad 1 Issue = 1 PR |
| R4 | Nunca hacer `git push --force` | Reescribe historial público |
| R5 | Nunca alterar `IssueSequence` sin acuerdo del usuario | El orden es contrato, no sugerencia |
| R6 | No continuar si `validate-pre-implementation` devuelve `BLOQUEADO` | El guardrail existe por razón |
| R7 | El ciclo termina en Fase 5, no en Fase 3 | PR creado ≠ ciclo completo |
| R8 | No cerrar issues manualmente si `advance-after-pr-close` puede hacerlo | Perder trazabilidad PR↔Issue |

---

## Parte 9 — Estrategia de automatización progresiva

Cuándo y cómo detectar que algo debe automatizarse:

**Señales de que algo debe convertirse en script + skill**:
- El mismo ciclo manual se repite ≥ 3 veces idéntico
- Una decisión es binaria y sin ambigüedad de contexto
- Un error humano en ese paso tiene alto impacto (estado git incorrecto, issue no cerrado, etc.)

**Proceso de automatización**:
1. Identificar el ciclo repetible
2. Escribir el script PowerShell con el contrato definido en Parte 6
3. Crear el SKILL.md correspondiente en `.github/skills/<nombre>/`
4. Agregar el comando a `docs/QUICK_REFERENCE.md`
5. Documentar en `docs/AUTOMATION_STRATEGY.md`
6. Crear issue para implementarlo y mergearlo via el flujo normal

**Automatizaciones pendientes de implementar en repos nuevos**:

| Script | Estado | Qué hace |
|---|---|---|
| `create-issue-from-context.ps1` | Pendiente | Convierte descripción informal en issue estructurado |
| `create-pr.ps1` | Pendiente | Crea PR con body estándar vinculado a issue |
| `.github/workflows/test.yml` | Pendiente | CI: corre tests en cada PR a `develop` |

---

## Parte 10 — Checklist de replicación en nuevo proyecto

Pasos para instalar este workflow en un proyecto desde cero:

```
[ ] 1. Crear repo en GitHub con ramas main + develop
[ ] 2. Copiar este archivo a .github/copilot-instructions.md
[ ] 3. Reemplazar [REPO: valor] con los valores reales del nuevo proyecto
[ ] 4. Crear carpeta scripts/ e implementar los 4 scripts core
[ ] 5. Crear carpeta .github/skills/ e implementar los 5 SKILL.md
[ ] 6. Crear docs/WORKFLOW.md, QUICK_REFERENCE.md, AUTOMATION_STRATEGY.md
[ ] 7. Crear docs/LAST_SESSION_MEMORY.md vacío (lo llena el agente)
[ ] 8. Definir IssueSequence con los issues iniciales del roadmap
[ ] 9. Ejecutar load-work-report.ps1 y verificar salida OK
[ ] 10. Ejecutar validate-pre-implementation.ps1 y verificar VALIDACION EXITOSA
```

---

## Referencia rápida de comandos

```powershell
# Inicio de sesión (siempre)
./scripts/load-work-report.ps1 -Owner <Owner> -Repo <Repo> [-AutoNormalizeBaseBranch]

# Pre-implementación (siempre antes de crear rama)
./scripts/validate-pre-implementation.ps1 -BaseBranch develop

# Desarrollo local
npm run dev      # servidor local en http://localhost:8080
npm run test     # suite de tests

# Después de mergear PR
./scripts/advance-after-pr-close.ps1 -Owner <Owner> -Repo <Repo>

# Cierre de sesión (siempre)
./scripts/close-session.ps1 -Owner <Owner> -Repo <Repo> -SessionSummary "..."
```

---

*Valores específicos de este repositorio: Owner=`diegosvart`, Repo=`simple-view-portfolio`, IssueSequence=`[3,4,5,6,8,10,9,7,13,12,14,11,20,23]`, frontend canónico=`index.html` en raíz (SPFx en `m365/spfx` deprecado por ADR-0001).*
