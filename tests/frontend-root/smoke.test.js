const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.resolve(__dirname, '..', '..', 'index.html');
const appJsPath = path.resolve(__dirname, '..', '..', 'app.js');

test('root frontend entrypoint exists and includes maintainer anchors', () => {
  assert.equal(fs.existsSync(htmlPath), true, 'index.html must exist at repo root');

  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(html.includes('id="maintainer-panel"'), 'maintainer panel anchor is required');
  assert.ok(html.includes('id="maintainer-project-list"'), 'maintainer project list anchor is required');
  assert.ok(html.includes('id="maintainer-phase-tabs"'), 'maintainer phase tabs anchor is required');
  assert.ok(html.includes('id="maintainer-phase-detail"'), 'maintainer phase detail anchor is required');
  assert.ok(html.includes('id="maintainer-ux-state"'), 'maintainer UX state badge anchor is required');
  assert.ok(html.includes('id="mp-save"'), 'save button anchor is required');
  assert.ok(html.includes('id="proj-rows"'), 'project rows container is required');
});

test('app.js declares buildProjectRowElement as an extracted rendering function', () => {
  const js = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(js.includes('function buildProjectRowElement('), 'buildProjectRowElement must be a named function');
});

test('app.js declares updateMetricsDisplay as an extracted rendering function', () => {
  const js = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(js.includes('function updateMetricsDisplay('), 'updateMetricsDisplay must be a named function');
});

test('app.js declares renderProjects composing extracted functions', () => {
  const js = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(js.includes('buildProjectRowElement(proj, idx)'), 'renderProjects must delegate row creation to buildProjectRowElement');
  assert.ok(js.includes('updateMetricsDisplay(computeTaskModelMetrics(currentProjects))'), 'renderProjects must delegate metrics update based on task model');
});

test('app.js wires form sync functions: writeForm, readForm, refreshMaintainerSelect', () => {
  const js = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(js.includes('function writeForm('), 'writeForm must be a named standalone function');
  assert.ok(js.includes('function readForm('), 'readForm must be a named standalone function');
  assert.ok(js.includes('function refreshMaintainerSelect('), 'refreshMaintainerSelect must be a named standalone function');
  assert.ok(js.includes('function renderMaintainerProjectList('), 'master-detail project list renderer must be present');
  assert.ok(js.includes('function renderMaintainerPhaseTabs('), 'phase tabs renderer must be present');
  assert.ok(js.includes('function renderMaintainerPhaseDetail('), 'phase detail renderer must be present');
  assert.ok(js.includes('startNewDraft({ system: true })'), 'internal refresh sync must use system selection bypass');
});

test('app.js includes DATA_SOURCE_MODE flag and createDataProvider factory', () => {
  const js = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(js.includes('DATA_SOURCE_MODE'), 'DATA_SOURCE_MODE flag must be present');
  assert.ok(js.includes('function createDataProvider('), 'createDataProvider factory must be present');
});
