const test = require('node:test');
const assert = require('node:assert/strict');

const { UX_STATE_LABELS, deriveMaintainerUxState, projectModelsEqual } = require('../../src/frontend-root/pure/ux-state');

function createProject(name) {
  return {
    name,
    descripcion: 'Descripcion',
    responsable: 'PM',
    rag: 'verde',
    e1: 'pendiente',
    e2: 'pendiente',
    e3: 'pendiente',
    e4: 'pendiente',
    e5: 'pendiente',
    e6: 'pendiente',
    e7: 'pendiente',
    e8: 'pendiente',
    e9: 'pendiente',
    e10: 'pendiente'
  };
}

test('deriveMaintainerUxState returns clean for neutral states', () => {
  assert.equal(deriveMaintainerUxState('Sin cambios', false), 'clean');
  assert.equal(deriveMaintainerUxState('Editando: Proyecto A', false), 'clean');
});

test('deriveMaintainerUxState returns dirty when message indicates pending changes', () => {
  assert.equal(deriveMaintainerUxState('Con cambios pendientes por guardar.', false), 'dirty');
});

test('deriveMaintainerUxState returns saved for successful persistence actions', () => {
  assert.equal(deriveMaintainerUxState('Proyecto guardado en almacenamiento local.', false), 'saved');
  assert.equal(deriveMaintainerUxState('Proyecto eliminado en almacenamiento local.', false), 'saved');
  assert.equal(deriveMaintainerUxState('Archivo proyectos.md exportado.', false), 'saved');
});

test('deriveMaintainerUxState returns validation-error for generic errors', () => {
  assert.equal(deriveMaintainerUxState('El nombre del proyecto es obligatorio.', true), 'validation-error');
});

test('deriveMaintainerUxState returns import-conflict for load/reset conflicts', () => {
  assert.equal(deriveMaintainerUxState('No se pudieron cargar datos.', true), 'import-conflict');
  assert.equal(deriveMaintainerUxState('Conflicto en importacion detectado.', true), 'import-conflict');
});

test('UX_STATE_LABELS contains expected labels for all states', () => {
  assert.equal(UX_STATE_LABELS.clean, 'Limpio');
  assert.equal(UX_STATE_LABELS.dirty, 'Con cambios pendientes');
  assert.equal(UX_STATE_LABELS['validation-error'], 'Validacion con error');
  assert.equal(UX_STATE_LABELS.saved, 'Guardado correcto');
  assert.equal(UX_STATE_LABELS['import-conflict'], 'Conflicto en importacion');
});

test('projectModelsEqual returns true when projects match', () => {
  const base = createProject('Proyecto A');
  const same = createProject('Proyecto A');
  assert.equal(projectModelsEqual(base, same), true);
});

test('projectModelsEqual returns false when any field differs', () => {
  const base = createProject('Proyecto A');
  const next = createProject('Proyecto A');
  next.descripcion = 'Descripcion nueva';
  assert.equal(projectModelsEqual(base, next), false);
});
