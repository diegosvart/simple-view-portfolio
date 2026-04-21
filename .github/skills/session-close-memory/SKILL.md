# Skill: session-close-memory

## Proposito
Cerrar la sesion dejando una memoria local legible y breve de lo realizado.

## Cuando usar
- Al finalizar una sesion del agente.
- Antes de pausar trabajo o cambiar de contexto.

## Comando
```powershell
./scripts/close-session.ps1 \
  -Owner diegosvart \
  -Repo simple-view-portfolio \
  -SessionSummary "Resumen corto de la sesion"
```

## Salida
- Archivo local actualizado en `docs/LAST_SESSION_MEMORY.md`.
- Resumen breve de cambios realizados.
- Estado de rama y archivos modificados.
- Siguiente issue sugerido por orden logico.

## Nota
La memoria local es intencionalmente corta para lectura rapida al iniciar la siguiente sesion.
