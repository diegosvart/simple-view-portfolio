# Skill: pre-implementation-validation

## Proposito
Validar precondiciones operativas antes de implementar cambios para evitar errores de flujo y estado Git inseguro.

## Cuando usar
- Despues del bootstrap y antes de crear rama feature.
- Antes de ejecutar scripts de PR o cambios de alcance.

## Comando
```powershell
./scripts/validate-pre-implementation.ps1 -BaseBranch develop
```

## Opciones
- `-AllowDirty`: permite continuar con cambios locales no commiteados.
- `-SkipGhAuth`: omite validacion de autenticacion GH CLI.
- `-DryRun`: reporta fallos sin bloquear (exit 0).

## Validaciones incluidas
- Repo Git valido.
- `origin` configurado.
- `remotes/origin/develop` presente.
- Rama actual igual a `develop`.
- Arbol limpio (o permitido por flag).
- Sin conflictos de merge.
- `develop` sincronizada con upstream.
- GH CLI autenticado (si no se omite).

## Salida esperada
Reporte con checks `OK/FAIL` y resultado final `VALIDACION EXITOSA` o `BLOQUEADO`.
