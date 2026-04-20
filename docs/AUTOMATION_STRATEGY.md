# Estrategia de Automatización del Agente

Este documento define cómo el agente detecta oportunidades de automatización y las implementa en el flujo de trabajo.

## Principio General

**"Si algo es repetible y sin ambigüedad, debe automatizarse."**

El agente debe:
1. Observar patrones en el trabajo.
2. Sugerir automatización al detectar repetición.
3. Implementar skill + script correspondientes.
4. Documentar la nueva automatización.
5. Integrar en el flujo existente.

---

## Automatizaciones Actuales

### 1. Create Issue From Context

**Problema que resuelve**: Convertir requerimientos informales en issues estructurados.

**Antes**: Usuario describía trabajo, agente creaba issue manualmente.

**Ahora**: Script valida y rellena campos mínimos automáticamente.

**Ubicación**:
- Skill: `.github/skills/create-issue-from-context/SKILL.md`
- Script: `scripts/create-issue-from-context.ps1`

**Automatización incluida**:
- Validar campos obligatorios (Context).
- Generar Title desde Context si falta.
- Rellenar secciones estándar con defaults sensatos.
- Validar autenticación GH.
- Crear issue en GitHub en un comando.

---

### 2. Create Issue PR

**Problema que resuelve**: Crear PR consistente linqueado a issue, sin pasos manuales.

**Antes**: Múltiples comandos git, crear PR manualmente, linkear issue.

**Ahora**: Un script hace todo automáticamente.

**Ubicación**:
- Skill: `.github/skills/create-issue-pr/SKILL.md`
- Script: `scripts/create-pr.ps1`

**Automatización incluida**:
- Validar issue existe y está abierto.
- Validar rama existe en origin.
- Validar GH autenticado.
- Stage + commit automático.
- Push de rama.
- Crear PR contra `develop`.
- Auto-linkear con `Closes #<issue>`.
- Opcionalmente asignar y pedir revisión.

**Opciones automatizables**:
- `-Files <paths>`: Limitar cambios a archivos específicos (evita "ruido" en PR).
- `-Draft`: Marcar como borrador.
- `-AssignSelf`: Asignarse automáticamente.
- `-RequestCopilotReview`: Pedir revisión automática.
- `-DryRun`: Simular sin crear nada.

---

### 3. Advance After PR Close

**Problema que resuelve**: No esperar manual para cerrar issue y reportar siguiente.

**Antes**: PR mergeado, esperar a que usuario diga "cerrar issue", identificar siguiente.

**Ahora**: Script detecta merge automáticamente y avanza.

**Ubicación**:
- Skill: `.github/skills/advance-after-pr-close/SKILL.md`
- Script: `scripts/advance-after-pr-close.ps1`

**Automatización incluida**:
- Auto-detectar último PR merged a `develop` (sin argumentos).
- Validar PR merged (no solo closed).
- Extraer issue linkado del PR body.
- Cerrar issue.
- Identificar siguiente pendiente en secuencia.
- Reportar siguiente trabajo.

**Integración**:
- Si hay siguiente issue abierto, agente puede reportar "Continuemos con issue #X".
- Basis para gatillar siguiente implementación.

---

## Patrones de Detección de Nuevas Automatizaciones

### Patrón 1: Cambios repetitivos en mismo archivo

**Indicadores**:
- ≥3 PRs editando el mismo archivo.
- Cambios siguen estructura similar.
- Mismo tipo de validación/serialización.

**Ejemplo observado**:
- PR #16: agregar validación a función parseMD
- PR #17: refactorizar validación (repetida)
- PR #18: integrar validación con provider

**Sugerencia automática**:
> "He observado que 3 PRs consecutivos agregan o refacturizan validación. ¿Te gustaría que centralice la validación en una función reutilizable? Esto reduciría future PRs y evitaría duplicación."

**Acción**:
- Crear nueva función `validateProjectCollection()`.
- Actualizar PRs posteriores para reutilizarla.

---

### Patrón 2: Ciclo manual idéntico

**Indicadores**:
- Mismos comandos ejecutados en múltiples issues.
- Pasos que no dependen de decisiones humanas.
- Output predecible.

**Ejemplo observado**:
```
Issue #4: 
  1. git checkout -b feature/issue-4-...
  2. editar index.html
  3. validar con get_errors
  4. script create-pr.ps1
  5. esperar merge
  6. script advance-after-pr-close.ps1

Issue #5:
  (mismo ciclo)

Issue #6:
  (mismo ciclo)
```

**Sugerencia automática**:
> "El ciclo crear-rama → implementar → crear-PR → esperar-merge → cerrar-issue es repetible. Propongo un meta-script que orqueste todo. ¿Te gustaría `workflows/execute-issue-cycle.ps1`?"

**Acción**:
- Crear script `execute-issue-cycle.ps1`.
- Entrada: issue number, cambios de código.
- Salida: PR creado, merged, issue cerrado.

---

### Patrón 3: Decisiones binarias repetidas

**Indicadores**:
- Mismas preguntas en múltiples issues.
- Respuesta siempre igual.
- Puede codificarse.

**Ejemplo potencial**:
- Preguntar "¿Assignar a mí?" (siempre sí)
- Preguntar "¿Pedir revisión?" (siempre depende del issue)

**Sugerencia automática**:
> "¿Siempre quieres que me asigne los PRs? Puedo hacer `-AssignSelf` por defecto en los scripts."

**Acción**:
- Actualizar scripts con flag default.
- Documentar en SKILL.md.

---

### Patrón 4: Validación faltante

**Indicadores**:
- Errores que podrían prevenirse automáticamente.
- Cambios manuales en PRs después de creados.
- Mensajes de error repetidos.

**Ejemplo potencial**:
- PR creado contra `main` en lugar de `develop`.
- Commit sin mensaje claro.
- Issue número no coincide con rama.

**Sugerencia automática**:
> "He visto que 2 PRs tuvieron que editarse porque el base era incorrecto. Voy a agregar validación en el script: confirmar que base es siempre `develop`."

**Acción**:
- Agregar validación a script existente.
- Documentar en SKILL.md.

---

### Patrón 5: Flujo que puede ser manejado por el agente solo

**Indicadores**:
- Usuario dice "continúa con el siguiente issue".
- No hay decisiones pendientes.
- Todo es predecible.

**Ejemplo observado**:
- PR #18 merged.
- Ejecutar advance-after-pr-close: "siguiente es #8".
- Usuario dice "prosigue con issue #8".
- Agente podría hacer todo sin pedir.

**Sugerencia automática**:
> "He terminado issue #6. El siguiente es #8. ¿Quieres que continue directamente o prefieres revisar primero?"

**Acción**:
- Implementar el siguiente issue sin pedir más.
- Reportar progreso.

---

## Implementación de Nueva Automatización

Cuando el agente detecta oportunidad de automatización:

### Paso 1: Validar que es automatizable

```
¿Es sin ambigüedad? 
  ¿Tiene entrada clara?
  ¿Tiene salida predecible?
  ¿Hay excepciones?
```

Si hay excepciones, documentar fallback manual.

### Paso 2: Diseñar la automatización

**Preguntas**:
- ¿Es un script (PowerShell) o una función de código?
- ¿Qué parametriza? ¿Qué es fijo?
- ¿Cuál es el DryRun?
- ¿Dónde va? `scripts/` o `workflows/`?

### Paso 3: Crear skill

Crear `.github/skills/<nombre>/SKILL.md`:
- Propósito (1 línea).
- Cuándo usar.
- Entrada/salida.
- Comando de ejecución.
- Casos de error.

### Paso 4: Crear script

En `scripts/`:
- Validar entrada obligatoria.
- Validar precondiciones (GH auth, repo, etc).
- DryRun por defecto o con flag.
- Output claro.
- Mensajes de error informativos.

### Paso 5: Documentar

- Agregar link en este documento.
- Agregar ejemplo concreto.
- Actualizar WORKFLOW.md si cambia flujo.

### Paso 6: Probar

- DryRun.
- Ejecución real.
- Validar resultado en GitHub.

### Paso 7: Integrar

- Documentar cómo se llama desde flujo existente.
- Actualizar README si aplica.
- Guardar en memoria del repo.

---

## Tabla de Automatizaciones Existentes

| ID | Nombre | Script | Entrada | Salida | Usado en |
|----|--------|--------|---------|--------|----------|
| A1 | Create Issue From Context | `create-issue-from-context.ps1` | Context + Opcionales | Issue URL | Inicio de ciclo |
| A2 | Create Issue PR | `create-pr.ps1` | IssueNumber + Branch + Message | PR URL | Antes de merge |
| A3 | Advance After PR Close | `advance-after-pr-close.ps1` | PRNumber (opcional) | Issue cerrado + Siguiente reportado | Después de merge |

---

## Criterios para Sugerir Automatización

El agente debe sugerir automatización cuando:

✅ **Algo se repite ≥2 veces**
- Ciclo manual idéntico en diferentes issues.
- Validaciones equivalentes en varios PRs.

✅ **Es predecible y sin decisión humana**
- No hay "¿cuál prefieres?" en el flujo.
- Output es determinista.

✅ **Previene errores comunes**
- Errores que podrían automatizarse.
- Validaciones que no se hacen siempre.

✅ **Ahorra tiempo significativo**
- >2 comandos manualmente ejecutados.
- >3 pasos repetitivos.

❌ **NO sugerir si**
- Hay decisiones subjétivas involucradas.
- El flujo es claramente excepcional.
- No se ha hecho al menos 2 veces.
- Es muy específico a un solo case.

---

## Propuesta de Automatización: Próximos Pasos

**Candidata A: Execute Issue Cycle**

```powershell
./workflows/execute-issue-cycle.ps1 `
  -IssueNumber 8 `
  -BranchName feature/issue-8-contrato-planner-provider `
  -CommitMessage "feat: definir contrato PlannerDataProvider" `
  -Files index.html
```

Esto ejecutaría:
1. Crear rama.
2. Esperar cambios en los archivos.
3. Crear PR (automático).
4. Esperar merge (manual).
5. Cerrar issue (automático).
6. Reportar siguiente.

**Candidata B: Auto Workflow (Full)**

```powershell
./workflows/auto-workflow.ps1 `
  -IssueNumber 8 `
  -Action implement `  # o: review, merge, close
  -AllowMerge  # para permitir merge automático si no hay conflictos
```

Esto permitiría orquestar todo el ciclo sin intervención.

---

## Memoria

Automatizaciones sugeridas y estado:
- A1 `create-issue-from-context`: ✅ Implementada
- A2 `create-pr`: ✅ Implementada
- A3 `advance-after-pr-close`: ✅ Implementada
- **Candidata**: Execute Issue Cycle (no decidida)
- **Candidata**: Auto Workflow (no decidida)

