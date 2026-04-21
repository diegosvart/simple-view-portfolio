const { STAGE_KEYS } = require('./constants');
const { sanitizeProject, validateProjectCollectionOrThrow } = require('./validation');

function toMarkdownScalar(value, fallback) {
  const clean = String(value == null ? '' : value)
    .replace(/\r\n?/g, ' ')
    .replace(/\n/g, ' ')
    .trim();

  if (!clean) {
    return fallback;
  }

  return clean;
}

function parseMD(text) {
  if (text == null) {
    throw new Error('No se recibio contenido markdown para importar.');
  }

  const source = String(text).replace(/\r\n?/g, '\n');
  const lines = source.split('\n');
  const projects = [];
  let currentProject = null;

  const commitCurrentProject = () => {
    if (!currentProject) {
      return;
    }

    projects.push(currentProject);
    currentProject = null;
  };

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (!line) {
      return;
    }

    if (/^##\s*proyecto\s*:/i.test(line)) {
      commitCurrentProject();
      const name = line.replace(/^##\s*proyecto\s*:/i, '').trim();
      currentProject = { name };
      return;
    }

    if (/^#/.test(line)) {
      return;
    }

    if (!currentProject) {
      return;
    }

    const kvMatch = line.match(/^([a-zA-Z0-9_]+)\s*:\s*(.*)$/);
    if (!kvMatch) {
      throw new Error(`Linea ${lineNumber}: formato invalido. Usa "clave: valor".`);
    }

    const key = kvMatch[1].trim().toLowerCase();
    const value = kvMatch[2].trim();
    currentProject[key] = value;
  });

  commitCurrentProject();

  return validateProjectCollectionOrThrow(projects);
}

function serializeMD(projects) {
  const lines = [
    '# Portafolio TI 2026 — Grupo EBI',
    '# Fuente de datos del tablero de proyectos',
    '# Formato: editar este archivo y recargar index.html',
    ''
  ];

  projects.forEach((project) => {
    const safe = sanitizeProject(project);
    lines.push(`## proyecto: ${toMarkdownScalar(safe.name, 'Sin nombre')}`);
    lines.push(`descripcion: ${toMarkdownScalar(safe.descripcion, '-')}`);
    lines.push(`responsable: ${toMarkdownScalar(safe.responsable, '-')}`);
    lines.push(`rag: ${safe.rag}`);
    STAGE_KEYS.forEach((stageKey) => {
      lines.push(`${stageKey}: ${safe[stageKey] || 'pendiente'}`);
    });
    lines.push('');
  });

  return `${lines.join('\n').trim()}\n`;
}

module.exports = {
  toMarkdownScalar,
  parseMD,
  serializeMD
};
