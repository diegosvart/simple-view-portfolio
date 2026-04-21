# Revisión de Buenas Prácticas de Desarrollo — simple-view-portfolio

**Issue:** #20  
**Fecha:** 2026-04-21  
**Alcance:** Revisión acotada del proyecto en su estado actual (post Sprint 5). Sin implementar cambios de código.

---

## Resumen Ejecutivo

El proyecto sigue un patrón de desarrollo bien estructurado con automatización de flujo, separación de lógica pura y cobertura de pruebas en crecimiento. Los hallazgos están priorizados por impacto.

---

## ✅ Buenas Prácticas Verificadas (en orden de prioridad)

### P1 — Arquitectura y Separación de Responsabilidades

| Práctica | Estado | Evidencia |
|---|---|---|
| Lógica pura extraída a módulos independientes | ✅ Implementado | `src/frontend-root/pure/` (8 módulos) |
| Separación `UI → provider → datos` | ✅ Implementado | `createDataProvider()` + factory pattern |
| Contrato/seam backend-ready sin dependencia de infraestructura | ✅ Implementado | `planner-provider-contract.js` |
| Feature flag para cambio de proveedor sin modificar UI | ✅ Implementado | `DATA_SOURCE_MODE` en `index.html` |
| Funciones de rendering extraídas (`buildProjectRowElement`, `updateMetricsDisplay`) | ✅ Implementado | `index.html` + smoke tests #38 |

### P1 — Automatización y Flujo de Trabajo

| Práctica | Estado | Evidencia |
|---|---|---|
| 1 Issue = 1 PR contra `develop` | ✅ Implementado | `WORKFLOW.md`, PRs #49–#56 |
| Gate pre-implementación obligatorio | ✅ Implementado | `validate-pre-implementation.ps1` |
| Avance post-merge automatizado (close issue + next) | ✅ Implementado | `advance-after-pr-close.ps1` |
| Bootstrap de sesión con estado real del repo | ✅ Implementado | `load-work-report.ps1` |

### P1 — Testing

| Práctica | Estado | Evidencia |
|---|---|---|
| Tests automatizados de lógica pura (unitarios) | ✅ Implementado | 43 tests en `tests/frontend-root/` |
| Tests de contrato para interfaces de proveedor | ✅ Implementado | `provider-contract.test.js`, `planner-contract.test.js` |
| Smoke tests de wiring DOM | ✅ Implementado | `smoke.test.js` (6 tests) |
| Tests de comportamiento del controlador/state layer | ✅ Implementado | `maintainer-controller.test.js` |

### P2 — Seguridad y Robustez

| Práctica | Estado | Evidencia |
|---|---|---|
| Validación de entrada en capas (UI + pure layer) | ✅ Implementado | `collectProjectValidationErrors()`, `validateProjectOrThrow()` |
| Sanitización antes de persistir | ✅ Implementado | `sanitizeProject()` aplicado en save/create |
| Guard de operaciones concurrentes en controller | ✅ Implementado | `maintainer-controller.js` — `isOperationInProgress` |
| Dirty state guard antes de operaciones destructivas (reset, reload) | ✅ Implementado | Handlers `mp-reset` y `refresh-btn` |
| Copia defensiva en factory de contrato | ✅ Implementado | `Object.assign({}, config)` en `createPlannerProviderContract` |

### P2 — Mantenibilidad

| Práctica | Estado | Evidencia |
|---|---|---|
| Documentación de flujo de trabajo | ✅ Implementado | `docs/WORKFLOW.md`, `docs/QUICK_REFERENCE.md` |
| Estrategia de automatización documentada | ✅ Implementado | `docs/AUTOMATION_STRATEGY.md` |
| Convención de ramas y commits | ✅ Implementado | `feature/issue-<N>-<slug>`, `feat(#N): ...` |

---

## ⚠️ Áreas de Mejora Detectadas (priorizadas por impacto)

### P1 — Alta prioridad

1. **`index.html` sigue siendo monolítico** — Toda la lógica de eventos, handlers y coordinación vive en un único archivo HTML de ~1800 líneas. La extracción de módulos puros avanzó pero la UI no está separada en módulos ES. Acción sugerida: migrar a bundler o al menos separar `app.js` como entrada.

2. **Sin tests de integración UI→Controller→Provider** — Los tests cubren lógica pura y contratos, pero no el flujo completo desde evento DOM hasta mutación de estado. El README de tests lo identifica como "Next test targets". Acción sugerida: agregar al menos 2–3 tests de integración que simulen ciclo completo (seleccionar proyecto → editar → guardar → verificar estado).

3. **`DATA_SOURCE_MODE` hardcodeado** — El flag `'markdown'` está en el código fuente. Un cambio de proveedor requiere editar `index.html`. Acción sugerida: leer el modo desde `localStorage` o un archivo de configuración externo para permitir cambio sin modificar código.

### P2 — Media prioridad

4. **Sin CI/CD** — No hay pipeline automatizado (GitHub Actions) que corra los tests en cada PR. Los tests se ejecutan manualmente. Acción sugerida: agregar workflow `.github/workflows/test.yml` con `npm run test:frontend-root` en cada push a `develop` y en PRs.

5. **`index.html` sin manejo de errores globales** — No hay `window.onerror` ni `window.addEventListener('unhandledrejection', ...)`. Errores silenciosos podrían pasar desapercibidos en producción. Acción sugerida: agregar handler global que loguee errores en consola.

6. **Ausencia de linting configurado** — El proyecto no tiene ESLint ni configuración de formato (Prettier). Estilos inconsistentes pueden acumularse. Acción sugerida: agregar `.eslintrc` mínimo y script `lint` en `package.json`.

### P3 — Baja prioridad

7. **Tests sin cobertura de ramas de error** — Los tests cubren happy paths bien, pero algunos paths de error de `provider.js` y `maintainer-controller.js` no tienen test de caso límite explícito. Acción sugerida: agregar 3–5 tests de error-path en los módulos más críticos.

8. **`proyectos.md` como fuente de datos en repo** — Los datos de proyectos conviven con el código. Cambios de datos producen commits de código. Acción sugerida: separar los datos a una carpeta `data/` con su propio flujo de actualización.

---

## Fuera de Alcance

- Implementar cualquiera de las mejoras anteriores (issue #20 es solo revisión).
- Integración con MS Graph, autenticación o backend real.
- Migración del `index.html` a framework (React, Vue, etc.) — requiere decisión de arquitectura separada.

---

## Entregables Verificables

- [x] Lista de prácticas implementadas verificadas en el código.
- [x] Lista de mejoras priorizadas P1/P2/P3 con acciones concretas.
- [x] Explicitado qué está incluido y qué queda fuera del alcance.
- [x] Cada hallazgo es convertible en issue/tarea ejecutable.
