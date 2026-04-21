const test = require('node:test');
const assert = require('node:assert/strict');

const { UX_STATE_LABELS, deriveMaintainerUxState } = require('../../src/frontend-root/pure/ux-state');

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
