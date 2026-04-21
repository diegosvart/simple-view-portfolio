const { RAG_STATES, STAGE_KEYS, STAGE_STATES } = require('./constants');

function normalizeRag(value) {
  const normalized = String(value || '').toLowerCase().trim();
  return RAG_STATES.includes(normalized) ? normalized : 'verde';
}

function normalizeStage(value) {
  const normalized = String(value || '').toLowerCase().trim();
  return STAGE_STATES.includes(normalized) ? normalized : 'pendiente';
}

function normalizeNameKey(value) {
  return String(value || '').trim().toLowerCase();
}

function sanitizeProject(project) {
  const source = project || {};
  const safe = {
    name: String(source.name || '').trim(),
    descripcion: String(source.descripcion || '').trim(),
    responsable: String(source.responsable || '').trim(),
    rag: normalizeRag(source.rag)
  };

  STAGE_KEYS.forEach((stageKey) => {
    safe[stageKey] = normalizeStage(source[stageKey]);
  });

  return safe;
}

function collectProjectValidationErrors(project, options) {
  const cfg = options || {};
  const source = project || {};
  const errors = [];
  const name = String(source.name || '').trim();
  const rag = String(source.rag || '').trim().toLowerCase();

  if (!name) {
    errors.push('El nombre del proyecto es obligatorio.');
  }

  if (rag && !RAG_STATES.includes(rag)) {
    errors.push(`RAG invalido: "${source.rag}".`);
  }

  STAGE_KEYS.forEach((stageKey) => {
    const raw = String(source[stageKey] || '').trim().toLowerCase();
    if (raw && !STAGE_STATES.includes(raw)) {
      errors.push(`Estado invalido en ${stageKey.toUpperCase()}: "${source[stageKey]}".`);
    }
  });

  if (Array.isArray(cfg.existingProjects)) {
    const currentIndex = Number.isInteger(cfg.currentIndex) ? cfg.currentIndex : -1;
    const needle = normalizeNameKey(name);
    const duplicate = cfg.existingProjects.some((item, index) => {
      if (index === currentIndex) {
        return false;
      }

      return normalizeNameKey(item && item.name) === needle;
    });

    if (needle && duplicate) {
      errors.push('Ya existe otro proyecto con ese nombre.');
    }
  }

  return errors;
}

function validateProjectOrThrow(project, options) {
  const errors = collectProjectValidationErrors(project, options);
  if (errors.length) {
    throw new Error(errors.join(' '));
  }

  return sanitizeProject(project);
}

function validateProjectCollectionOrThrow(projects) {
  const list = Array.isArray(projects) ? projects : [];
  const errors = [];
  const nameToIndex = new Map();

  list.forEach((project, index) => {
    const rowErrors = collectProjectValidationErrors(project);
    rowErrors.forEach((message) => {
      errors.push(`Proyecto ${index + 1}: ${message}`);
    });

    const key = normalizeNameKey(project && project.name);
    if (!key) {
      return;
    }

    if (nameToIndex.has(key)) {
      const previous = nameToIndex.get(key) + 1;
      errors.push(`Proyecto ${index + 1}: nombre duplicado con proyecto ${previous}.`);
      return;
    }

    nameToIndex.set(key, index);
  });

  if (errors.length) {
    throw new Error(errors.join(' '));
  }

  return list.map(sanitizeProject);
}

module.exports = {
  normalizeRag,
  normalizeStage,
  normalizeNameKey,
  sanitizeProject,
  collectProjectValidationErrors,
  validateProjectOrThrow,
  validateProjectCollectionOrThrow
};
