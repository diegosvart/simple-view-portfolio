const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appJsPath = path.resolve(__dirname, '..', '..', 'app.js');
const html = fs.readFileSync(appJsPath, 'utf8');

function sliceFunction(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) {
    throw new Error(`No se pudo extraer bloque entre ${startMarker} y ${endMarker}`);
  }
  return source.slice(start, end).trim();
}

function loadPhaseCellFunctions() {
  const code = [
    sliceFunction(html, 'function summarizePhase', 'function getBucketLevel'),
    sliceFunction(html, 'function getBucketLevel', 'function phaseCellHTML'),
    sliceFunction(html, 'function phaseCellHTML', 'function setTheme')
  ].join('\n\n');

  const sandbox = {};
  vm.runInNewContext(`${code}\nthis.exports = { summarizePhase, getBucketLevel, phaseCellHTML };`, sandbox);
  return sandbox.exports;
}

test('phaseCellHTML renders percent, status counters and task details', () => {
  const { phaseCellHTML } = loadPhaseCellFunctions();
  const htmlResult = phaseCellHTML('Definición', {
    all: [
      { code: '1.1', label: 'Coordinación ficha de proyecto', status: 'ok' },
      { code: '1.2', label: 'Completar FDP', status: 'pend' },
      { code: '1.3', label: 'Análisis FDP', status: 'bloq' }
    ],
    completado: 1,
    pendiente: 1,
    bloqueado: 1
  });

  assert.match(htmlResult, />33%</, 'bubble should render rounded percent');
  assert.match(htmlResult, /Tareas de Definición/, 'tooltip title should say "Tareas de Definición"');
  assert.match(htmlResult, /✓ Completadas: 1/, 'tooltip should render completed group header');
  assert.match(htmlResult, /○ Pendientes: 1/, 'tooltip should render pending group header');
  assert.match(htmlResult, /✗ Bloqueadas: 1/, 'tooltip should render blocked group header');
  assert.match(htmlResult, /1\.1 - Coordinación ficha de proyecto/, 'tooltip should render completed task');
  assert.match(htmlResult, /1\.2 - Completar FDP/, 'tooltip should render pending task');
  assert.match(htmlResult, /1\.3 - Análisis FDP/, 'tooltip should render blocked task');
});

test('phaseCellHTML renders empty state safely when phase data is missing', () => {
  const { phaseCellHTML } = loadPhaseCellFunctions();
  const htmlResult = phaseCellHTML('Cierre');

  assert.match(htmlResult, />0%</, 'empty bubble should render zero percent');
  assert.match(htmlResult, /Tareas de Cierre/, 'empty tooltip title should say "Tareas de Cierre"');
  assert.match(htmlResult, /Sin tareas asignadas/, 'empty tooltip should render empty-state label');
});