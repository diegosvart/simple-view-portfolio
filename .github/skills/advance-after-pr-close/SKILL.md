# Skill: advance-after-pr-close

## Proposito
Cerrar el issue vinculado y reportar el siguiente pendiente despues de mergear un PR a `develop`.

## Cuando usar
- Inmediatamente despues de mergear un PR en la rama base.
- Cuando un PR fue mergeado manualmente en GitHub y hay que completar el ciclo.

## Comando
```powershell
./scripts/advance-after-pr-close.ps1 \
  -Owner diegosvart \
  -Repo simple-view-portfolio \
  -PullNumber <PR_NUMBER>
```

## Opciones
- `-DryRun`: simula cierre/avance sin aplicar cambios.
- `-SkipClose`: no cierra issue, solo reporta siguiente pendiente.
- `-BaseBranch`: rama base esperada (`develop` por defecto).

## Validaciones incluidas
- PR existe y esta mergeado.
- PR mergeado a rama base esperada.
- PR body contiene `Closes #<numero>`.
- Issue vinculado existe.

## Salida esperada
- Estado de cierre del issue vinculado.
- Siguiente issue sugerido por `IssueSequence`.
- Resultado final `CIERRE Y AVANCE COMPLETADO` o `BLOQUEADO`.
