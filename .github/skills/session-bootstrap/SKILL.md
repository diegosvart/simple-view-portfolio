# Skill: session-bootstrap

## Proposito
Detectar un nuevo inicio de sesion y establecer contexto operativo inmediato del repositorio.

## Cuando usar
- Al comenzar una sesion nueva del agente.
- Antes de ejecutar cambios, commits o PRs.

## Flujo
1. Ejecutar checklist Git de seguridad:
```powershell
git rev-parse --is-inside-work-tree
git remote -v
git branch -a
git status -sb
```
2. Si aparece `No commits yet` o falta `origin/develop`, detener el flujo.
3. Cargar informe acotado del estado actual:
```powershell
./scripts/load-work-report.ps1 -Owner diegosvart -Repo simple-view-portfolio
```
4. Continuar solo con el siguiente issue sugerido en orden logico.

## Salida esperada
- Estado de ramas local/remota.
- Issues abiertos y ordenados por roadmap.
- Siguiente tarea sugerida para ejecutar.

## Regla de seguridad
Esta skill prohibe reinicializar un repositorio clonado: no ejecutar `git init`.
