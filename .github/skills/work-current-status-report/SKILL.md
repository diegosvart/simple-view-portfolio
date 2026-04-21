# Skill: work-current-status-report

## Proposito
Generar un informe acotado del trabajo actual para orientar al agente al inicio de sesion.

## Entrada
- `Owner`: propietario del repo GitHub.
- `Repo`: nombre del repositorio.
- `BaseBranch` (opcional): rama base de integracion (`develop` por defecto).
- `IssueSequence` (opcional): orden logico de ejecucion.

## Comando
```powershell
./scripts/load-work-report.ps1 \
  -Owner diegosvart \
  -Repo simple-view-portfolio \
  -BaseBranch develop
```

## Informe incluye
- Branch actual y estado corto (`git status -sb`).
- Tracking de ramas locales (`git branch -vv`).
- Issues abiertos de GitHub.
- Pendientes ordenados por `IssueSequence`.
- Tareas sugeridas para el proximo paso.

## Salida esperada
Reporte corto, accionable y sin ruido para continuar el flujo en menos de 1 minuto.
