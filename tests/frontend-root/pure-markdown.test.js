const test = require('node:test');
const assert = require('node:assert/strict');

const { toMarkdownScalar } = require('../../src/frontend-root/pure/markdown');

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
