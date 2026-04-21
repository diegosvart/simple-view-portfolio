# ADR-0001: Deprecar SPFx y Consolidar el Frontend en Root

- Estado: Aceptada
- Fecha: 2026-04-20

## Contexto

El repositorio contiene dos superficies frontend:

1. La aplicacion activa y hoy verificable en `index.html` en la raiz del repo.
2. Un experimento de migracion a `m365/spfx` que depende de un stack legado no operativo en el entorno actual (`Node >=10.13.0 <11.0.0`).

Trabajo reciente aterrizo en SPFx por error operacional, aunque la superficie funcional que realmente representa el producto es la app raiz.

Adicionalmente, `index.html` ya concentra el dominio, la logica de parsing/serializacion markdown, el mantenedor, el rendering y parte de la futura integracion de datos. El archivo es grande, pero contiene suficiente logica reusable para evolucionar de forma incremental sin reescribir desde cero.

## Decision

- `m365/spfx` queda deprecado como superficie de desarrollo activo.
- `index.html` en la raiz del repo pasa a ser la fuente de verdad del frontend actual.
- Cualquier trabajo util implementado en SPFx debe copiarse/adaptarse al root frontend, no redisenarse desde cero.
- La evolucion futura del frontend debe separar UI, estado, validacion, serializacion y proveedores de datos para habilitar una integracion posterior con backend/MS Graph.
- La UI no debe conectarse directamente a MS Graph; la integracion futura debe ocurrir via una capa de backend o servicio.

## Consecuencias

- La documentacion del repo debe declarar explicitamente que SPFx es historico/deprecado.
- Los nuevos cambios funcionales deben apuntar al frontend raiz.
- El trabajo sobre `index.html` debe ejecutarse con enfoque de buenas practicas frontend: modularizacion incremental, contratos estables, pruebas sobre logica pura y separacion de responsabilidades.
- Si en el futuro se adopta un toolchain moderno, la migracion debe preservar los contratos extraidos y evitar una reescritura total.

## Estado de Implementacion Esperado

- README de SPFx con aviso de deprecacion.
- Documentacion principal enlazando esta ADR.
- Plan tecnico para modernizar `index.html` como frontend mantenible.
