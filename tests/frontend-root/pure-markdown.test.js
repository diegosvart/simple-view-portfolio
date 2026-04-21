const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { toMarkdownScalar, parseMD, serializeMD } = require('../../src/frontend-root/pure/markdown');

test('toMarkdownScalar trims and preserves content', () => {
  assert.equal(toMarkdownScalar('  Proyecto A  ', '-'), 'Proyecto A');
});

test('toMarkdownScalar normalizes line breaks to spaces', () => {
  assert.equal(toMarkdownScalar('Linea 1\nLinea 2\r\nLinea 3', '-'), 'Linea 1 Linea 2 Linea 3');
});

test('toMarkdownScalar returns fallback for empty-like values', () => {
  assert.equal(toMarkdownScalar('', '-'), '-');
  assert.equal(toMarkdownScalar('   ', '-'), '-');
  assert.equal(toMarkdownScalar(null, '-'), '-');
});

test('parseMD + serializeMD round-trip preserves canonical project data', () => {
  const source = [
    '# Portafolio TI 2026 — Grupo EBI',
    '# Fuente de datos del tablero de proyectos',
    '',
    '## proyecto: Proyecto Uno',
    'descripcion: Desc uno',
    'responsable: PM Uno',
    'rag: verde',
    'e1: completado',
    'e2: en-curso',
    'e3: pendiente',
    'e4: pendiente',
    'e5: pendiente',
    'e6: pendiente',
    'e7: pendiente',
    'e8: pendiente',
    'e9: pendiente',
    'e10: pendiente',
    '',
    '## proyecto: Proyecto Dos',
    'descripcion: Desc dos',
    'responsable: PM Dos',
    'rag: rojo',
    'e1: pendiente',
    'e2: pendiente',
    'e3: pendiente',
    'e4: pendiente',
    'e5: pendiente',
    'e6: pendiente',
    'e7: pendiente',
    'e8: pendiente',
    'e9: pendiente',
    'e10: bloqueado',
    ''
  ].join('\n');

  const parsed = parseMD(source);
  const serialized = serializeMD(parsed);
  const reparsed = parseMD(serialized);

  assert.equal(parsed.length, 2);
  assert.deepEqual(reparsed, parsed);
});

test('parseMD throws on invalid key-value format inside project block', () => {
  const source = [
    '## proyecto: Proyecto Invalido',
    'descripcion: Ok',
    'linea invalida sin separador'
  ].join('\n');

  assert.throws(() => {
    parseMD(source);
  }, /formato invalido/);
});

test('parseMD supports current proyectos.md root file', () => {
  const filePath = path.resolve(__dirname, '..', '..', 'proyectos.md');
  const markdown = fs.readFileSync(filePath, 'utf8');

  const parsed = parseMD(markdown);
  assert.ok(parsed.length > 0, 'proyectos.md should produce at least one project');

  const serialized = serializeMD(parsed);
  assert.ok(serialized.includes('## proyecto:'), 'serialized markdown should include project sections');
});
