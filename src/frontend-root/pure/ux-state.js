const { STAGE_KEYS } = require('./constants');

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

function projectModelsEqual(left, right) {
  const a = left || {};
  const b = right || {};

  if (String(a.name || '').trim() !== String(b.name || '').trim()) return false;
  if (String(a.descripcion || '').trim() !== String(b.descripcion || '').trim()) return false;
  if (String(a.responsable || '').trim() !== String(b.responsable || '').trim()) return false;
  if (String(a.rag || '').trim().toLowerCase() !== String(b.rag || '').trim().toLowerCase()) return false;

  return STAGE_KEYS.every((stageKey) => {
    const leftValue = String(a[stageKey] || '').trim().toLowerCase();
    const rightValue = String(b[stageKey] || '').trim().toLowerCase();
    return leftValue === rightValue;
  });
}

module.exports = {
  UX_STATE_LABELS,
  deriveMaintainerUxState,
  projectModelsEqual
};
