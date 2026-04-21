const test = require('node:test');
const assert = require('node:assert/strict');

const { createLocalMarkdownProvider } = require('../../src/frontend-root/pure/provider');

function createSampleMarkdown() {
  return [
    '# Portafolio TI 2026 — Grupo EBI',
    '',
    '## proyecto: Proyecto Uno',
    'descripcion: Demo',
    'responsable: PM',
    'rag: verde',
    'e1: completado',
    'e2: pendiente',
    'e3: pendiente',
    'e4: pendiente',
    'e5: pendiente',
    'e6: pendiente',
    'e7: pendiente',
    'e8: pendiente',
    'e9: pendiente',
    'e10: pendiente',
    ''
  ].join('\n');
}

function createProject(name, rag) {
  return {
    name,
    descripcion: 'Descripcion',
    responsable: 'PM',
    rag: rag || 'verde',
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

test('provider contract supports load/export/refresh', () => {
  const provider = createLocalMarkdownProvider([]);
  const projects = provider.load(createSampleMarkdown());

  assert.equal(projects.length, 1);
  assert.equal(provider.refresh().length, 1);

  const markdown = provider.export();
  assert.match(markdown, /## proyecto: Proyecto Uno/);
});

test('provider contract supports create/update/remove with validated state', () => {
  const provider = createLocalMarkdownProvider([createProject('Base')]);

  provider.create(createProject('Nuevo', 'ambar'));
  assert.equal(provider.refresh().length, 2);

  provider.update(1, createProject('Nuevo Editado', 'rojo'));
  assert.equal(provider.refresh()[1].name, 'Nuevo Editado');

  provider.remove(1);
  assert.equal(provider.refresh().length, 1);
});

test('provider reset() without args restores baseline loaded from markdown', () => {
  const provider = createLocalMarkdownProvider([]);
  provider.load(createSampleMarkdown());
  provider.create(createProject('Temporal'));
  assert.equal(provider.refresh().length, 2);

  provider.reset();
  assert.equal(provider.refresh().length, 1);
  assert.equal(provider.refresh()[0].name, 'Proyecto Uno');
});

test('provider refresh returns isolated copies', () => {
  const provider = createLocalMarkdownProvider([createProject('A')]);
  const snapshot = provider.refresh();
  snapshot[0].name = 'Mutado fuera';

  assert.equal(provider.refresh()[0].name, 'A');
});

test('provider update/remove validate index bounds', () => {
  const provider = createLocalMarkdownProvider([createProject('A')]);

  assert.throws(() => provider.update(5, createProject('B')), /Indice de proyecto invalido para actualizar/);
  assert.throws(() => provider.remove(-1), /Indice de proyecto invalido para eliminar/);
});
