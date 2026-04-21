const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('root frontend entrypoint exists and includes maintainer anchors', () => {
  const filePath = path.resolve(__dirname, '..', '..', 'index.html');
  assert.equal(fs.existsSync(filePath), true, 'index.html must exist at repo root');

  const html = fs.readFileSync(filePath, 'utf8');

  assert.ok(html.includes('id="maintainer-panel"'), 'maintainer panel anchor is required');
  assert.ok(html.includes('id="mp-save"'), 'save button anchor is required');
  assert.ok(html.includes('id="proj-rows"'), 'project rows container is required');
});
