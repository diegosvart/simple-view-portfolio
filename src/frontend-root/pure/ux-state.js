const UX_STATE_LABELS = {
  clean: 'Limpio',
  dirty: 'Con cambios pendientes',
  'validation-error': 'Validacion con error',
  saved: 'Guardado correcto',
  'import-conflict': 'Conflicto en importacion'
};

function deriveMaintainerUxState(message, isError) {
  const normalized = String(message || '').toLowerCase();

  if (normalized.includes('conflicto') || normalized.includes('no se pudieron cargar datos')) {
    return 'import-conflict';
  }

  if (normalized.includes('cambios pendientes')) {
    return 'dirty';
  }

  if (normalized.includes('guardado') || normalized.includes('eliminado') || normalized.includes('exportado')) {
    return 'saved';
  }

  if (isError) {
    return 'validation-error';
  }

  return 'clean';
}

module.exports = {
  UX_STATE_LABELS,
  deriveMaintainerUxState
};
