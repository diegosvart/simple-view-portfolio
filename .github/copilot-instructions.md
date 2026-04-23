# Copilot Instructions - simple-view-portfolio

Estas instrucciones aplican al workspace y complementan la guia extendida en `docs/copilot-instructions.md`.

## Decision Architecture Routing

Cuando el usuario solicite cualquiera de estos temas, se debe sugerir y priorizar el agente `ADR Decision Architect` antes de implementar cambios:
- ADR
- arquitectura
- trade-offs
- RFC
- migracion a React
- factibilidad tecnica
- decisiones de frontend

### Regla operativa
- Si la consulta es de decision/arquitectura, primero producir analisis de opciones y recomendacion con el agente `ADR Decision Architect`.
- Solo implementar codigo despues de que el enfoque haya sido validado por el usuario.

### Salida esperada para decisiones
1. Decision statement
2. Contexto y restricciones
3. Opciones consideradas
4. Analisis de trade-offs
5. Recomendacion
6. Riesgos y consecuencias
7. Plan por fases
