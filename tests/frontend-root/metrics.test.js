const test = require('node:test');
const assert = require('node:assert/strict');

const { STAGE_KEYS } = require('../../src/frontend-root/pure/constants');
const { computeProjectMetrics, summarizeBucket, getBucketLevel } = require('../../src/frontend-root/pure/metrics');

function makeProject(name, stateByStage, rag) {
  const project = {
    name,
    descripcion: '',
    responsable: '',
    rag: rag || 'verde'
  };

  STAGE_KEYS.forEach((stageKey) => {
    project[stageKey] = stateByStage[stageKey] || 'pendiente';
  });

  return project;
}

test('computeProjectMetrics classifies completed, in-progress and blocked projects', () => {
  const allCompleted = {};
  STAGE_KEYS.forEach((stageKey) => {
    allCompleted[stageKey] = 'completado';
  });

  const blockedState = {};
  STAGE_KEYS.forEach((stageKey) => {
    blockedState[stageKey] = 'pendiente';
  });
  blockedState.e3 = 'bloqueado';

  const inProgressState = {};
  STAGE_KEYS.forEach((stageKey) => {
    inProgressState[stageKey] = 'pendiente';
  });
  inProgressState.e1 = 'completado';
  inProgressState.e2 = 'en-curso';

  const result = computeProjectMetrics([
    makeProject('Proyecto Completado', allCompleted),
    makeProject('Proyecto Bloqueado', blockedState),
    makeProject('Proyecto En Curso', inProgressState)
  ]);

  assert.deepEqual(result, {
    total: 3,
    completado: 1,
    enCurso: 1,
    bloqueado: 1
  });
});

test('summarizeBucket returns totals and rounded percent', () => {
  const summary = summarizeBucket([
    { title: 't1', completed: true },
    { title: 't2', completed: false },
    { title: 't3', completed: true }
  ]);

  assert.deepEqual(summary, {
    total: 3,
    completed: 2,
    percent: 67
  });
});

test('getBucketLevel returns expected level thresholds', () => {
  assert.equal(getBucketLevel({ total: 0, percent: 0 }), 'level-gray');
  assert.equal(getBucketLevel({ total: 5, percent: 0 }), 'level-gray');
  assert.equal(getBucketLevel({ total: 5, percent: 20 }), 'level-red');
  assert.equal(getBucketLevel({ total: 5, percent: 40 }), 'level-amber');
  assert.equal(getBucketLevel({ total: 5, percent: 80 }), 'level-green');
});
