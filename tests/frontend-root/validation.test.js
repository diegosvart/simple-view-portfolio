const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeRag,
  normalizeStage,
  sanitizeProject,
  collectProjectValidationErrors,
  validateProjectOrThrow
} = require('../../src/frontend-root/pure/validation');

const { STAGE_KEYS } = require('../../src/frontend-root/pure/constants');

test('normalizeRag uses canonical states and fallback', () => {
  assert.equal(normalizeRag('ambar'), 'ambar');
  assert.equal(normalizeRag('ROJO'), 'rojo');
  assert.equal(normalizeRag('invalido'), 'verde');
});

test('normalizeStage uses canonical states and fallback', () => {
  assert.equal(normalizeStage('completado'), 'completado');
  assert.equal(normalizeStage('EN-CURSO'), 'en-curso');
  assert.equal(normalizeStage('desconocido'), 'pendiente');
});

test('sanitizeProject returns complete canonical project shape', () => {
  const project = sanitizeProject({
    name: '  Proyecto Uno  ',
    descripcion: '  Desc  ',
    responsable: '  PM  ',
    rag: 'ROJO',
    e1: 'COMPLETADO',
    e2: 'invalido'
  });

  assert.equal(project.name, 'Proyecto Uno');
  assert.equal(project.descripcion, 'Desc');
  assert.equal(project.responsable, 'PM');
  assert.equal(project.rag, 'rojo');
  assert.equal(project.e1, 'completado');
  assert.equal(project.e2, 'pendiente');

  STAGE_KEYS.forEach((stageKey) => {
    assert.ok(project[stageKey], `${stageKey} should exist in sanitized project`);
  });
});

test('collectProjectValidationErrors detects duplicate names and invalid stage values', () => {
  const errors = collectProjectValidationErrors(
    {
      name: 'Proyecto A',
      rag: 'verde',
      e1: 'valor-no-valido'
    },
    {
      existingProjects: [{ name: 'Proyecto A' }]
    }
  );

  assert.ok(errors.some((error) => error.includes('Estado invalido en E1')));
  assert.ok(errors.some((error) => error.includes('Ya existe otro proyecto con ese nombre')));
});

test('validateProjectOrThrow throws on invalid project and returns sanitized on valid input', () => {
  assert.throws(() => {
    validateProjectOrThrow({ name: '', rag: 'verde' });
  }, /El nombre del proyecto es obligatorio/);

  const result = validateProjectOrThrow({
    name: 'Proyecto B',
    rag: 'AMBAR',
    e1: 'en-curso'
  });

  assert.equal(result.name, 'Proyecto B');
  assert.equal(result.rag, 'ambar');
  assert.equal(result.e1, 'en-curso');
});
