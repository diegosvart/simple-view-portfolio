const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.resolve(__dirname, '..', '..', 'index.html');

test('root frontend entrypoint exists and includes maintainer anchors', () => {
  assert.equal(fs.existsSync(htmlPath), true, 'index.html must exist at repo root');

  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(html.includes('id="maintainer-panel"'), 'maintainer panel anchor is required');
  assert.ok(html.includes('id="maintainer-ux-state"'), 'maintainer UX state badge anchor is required');
  assert.ok(html.includes('id="mp-save"'), 'save button anchor is required');
  assert.ok(html.includes('id="proj-rows"'), 'project rows container is required');
});

test('index.html declares buildProjectRowElement as an extracted rendering function', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('function buildProjectRowElement('), 'buildProjectRowElement must be a named function');
});

test('index.html declares updateMetricsDisplay as an extracted rendering function', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('function updateMetricsDisplay('), 'updateMetricsDisplay must be a named function');
});

test('index.html declares renderProjects composing extracted functions', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('buildProjectRowElement(proj, idx)'), 'renderProjects must delegate row creation to buildProjectRowElement');
  assert.ok(html.includes('updateMetricsDisplay(dataProvider.getMetrics())'), 'renderProjects must delegate metrics update to updateMetricsDisplay');
});

test('index.html wires form sync functions: writeForm, readForm, refreshMaintainerSelect', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('function writeForm('), 'writeForm must be a named standalone function');
  assert.ok(html.includes('function readForm('), 'readForm must be a named standalone function');
  assert.ok(html.includes('function refreshMaintainerSelect('), 'refreshMaintainerSelect must be a named standalone function');
});

test('index.html includes DATA_SOURCE_MODE flag and createDataProvider factory', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('DATA_SOURCE_MODE'), 'DATA_SOURCE_MODE flag must be present');
  assert.ok(html.includes('function createDataProvider('), 'createDataProvider factory must be present');
});
