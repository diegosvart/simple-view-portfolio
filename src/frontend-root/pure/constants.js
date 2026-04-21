const STAGE_LABELS = {
  e1: 'Etapa 1 — Ficha de Proyecto',
  e2: 'Etapa 2 — Aprobación de Sponsor',
  e3: 'Etapa 3 — Requerimientos Funcionales',
  e4: 'Etapa 4 — Requerimientos Técnicos',
  e5: 'Etapa 5 — Cotización y Proveedor',
  e6: 'Etapa 6 — Kick Off',
  e7: 'Etapa 7 — Iteración y Seguimiento',
  e8: 'Etapa 8 — Pruebas',
  e9: 'Etapa 9 — Marcha Blanca',
  e10: 'Etapa 10 — Entrega y Cierre Formal'
};

const STAGE_KEYS = Object.keys(STAGE_LABELS);
const STAGE_STATES = ['completado', 'en-curso', 'pendiente', 'bloqueado'];
const RAG_STATES = ['verde', 'ambar', 'rojo'];

module.exports = {
  STAGE_LABELS,
  STAGE_KEYS,
  STAGE_STATES,
  RAG_STATES
};
