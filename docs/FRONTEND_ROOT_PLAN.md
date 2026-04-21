# Plan Tecnico: Modernizar el Frontend Canonico en Root

Este plan define como aplicar mejoras al frontend real del repositorio, actualmente contenido en `index.html`, sin romper el comportamiento vigente y reutilizando el codigo ya construido.

## Objetivo

Tratar `index.html` como una aplicacion frontend real, lista para evolucionar de forma incremental hacia una arquitectura mantenible y posteriormente conectable a un backend para Microsoft Graph.

## Principios

- Reutilizar antes de redisenar.
- Extraer logica pura antes de mover UI compleja.
- Mantener comportamiento estable mientras se modulariza.
- Separar UI, estado, validacion, serializacion y acceso a datos.
- Preparar una frontera de integracion para backend/MS Graph sin acoplar Graph a la vista.

## Fuentes de reutilizacion inmediatas

La app root ya contiene gran parte de la logica necesaria y debe ser la base del trabajo:

- Parsing markdown y serializacion de proyectos.
- Validacion y normalizacion del modelo.
- Mantenedor, formulario y controles de proyectos.
- Rendering de tabla y metricas.

Adicionalmente, el trabajo recientemente hecho en SPFx debe copiarse/adaptarse al root frontend cuando reduzca riesgo:

- Estados UX del mantenedor.
- Badge visual de estado.
- Transiciones `clean`, `dirty`, `validation-error`, `saved`, `import-conflict`.

## Plan por fases

### Fase 1: Aclarar la arquitectura y congelar la decision

1. Mantener esta ADR como decision vigente.
2. Declarar `index.html` como frontend canonico.
3. Marcar `m365/spfx` como deprecado y solo historico.

### Fase 2: Introducir estados UX en el root frontend

1. Copiar/adaptar la logica ya validada de SPFx al mantenedor del root.
2. Mantener IDs y estructura del DOM existentes siempre que no exista un defecto funcional.
3. Verificar manualmente las cinco transiciones UX del mantenedor.

### Fase 3: Partir el archivo por responsabilidades sin cambiar comportamiento

Orden recomendado de extraccion:

1. Constantes y catalogos.
2. Validacion y normalizacion del modelo.
3. Parsing/serializacion markdown.
4. Metricas y agregaciones.
5. Rendering y sincronizacion formulario/tabla.
6. Controlador de estado y proveedor de datos.

### Fase 4: Introducir una frontera de servicio

Definir una interfaz estable para el frontend:

- `load`
- `create`
- `update`
- `remove`
- `export`
- `reset`
- `refresh`

La vista debe hablar solo con esta interfaz.

### Fase 5: Preparar integracion futura con backend/MS Graph

Arquitectura objetivo:

`UI -> app controller/provider -> backend API -> MS Graph`

Responsabilidades fuera de la UI:

- autenticacion
- retries
- throttling
- mapping Graph <-> modelo interno
- manejo de errores de integracion

## Buenas practicas de desarrollo recomendadas

- Evitar nuevas mutaciones globales dispersas en `index.html`.
- Preferir funciones puras para validacion, parsing, serializacion y metricas.
- Encapsular estado del mantenedor para evitar saves no atomicos.
- Bloquear UI durante operaciones async sensibles.
- Mantener contratos de datos explicitos y estables.
- Introducir pruebas sobre logica pura antes de mover mas comportamiento visual.
- No mezclar integracion MS Graph con refactor visual en la misma entrega.

## Riesgos actuales del root frontend

- `index.html` concentra demasiadas responsabilidades.
- Existen mutaciones globales que pueden producir inconsistencias de estado.
- El mantenedor requiere una maquina de estados UX explicita.
- La capa de datos aun no esta formalizada como una interfaz de servicio.

## Estrategia de entrega recomendada

1. PR 1: ADR + docs + aviso de deprecacion SPFx.
2. PR 2: Migracion de estados UX del mantenedor al root.
3. PR 3: Extraccion de validacion y serializacion.
4. PR 4: Controlador de estado y proveedor.
5. PR 5: Harness de pruebas para logica pura.
6. PR 6: Adaptador backend-ready para futura integracion.

## Skills recomendadas para ahorrar contexto/tokens

Las skills de awesome-copilot que mas conviene cargar o replicar conceptualmente para este trabajo son:

- `acquire-codebase-knowledge`
- `create-architectural-decision-record`
- `documentation-writer`
- `create-implementation-plan`
- `refactor-plan`
- `refactor`
- `web-coder`
- `premium-frontend-ui`
- `webapp-testing`

## Criterios de exito

- La documentacion deja claro que el frontend activo es el root.
- El mantenedor del root tiene estados UX consistentes.
- La tabla actual no se rompe.
- La logica pura empieza a ser testeable por separado.
- El frontend queda listo para conectarse a un backend sin redisenar la UI.
