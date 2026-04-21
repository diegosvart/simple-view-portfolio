const test = require('node:test');
const assert = require('node:assert/strict');

const { createMaintainerController } = require('../../src/frontend-root/pure/maintainer-controller');

function createProject(name) {
  return {
    name,
    descripcion: 'Descripcion',
    responsable: 'PM',
    rag: 'verde',
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

test('controller tracks projects, selection and draft snapshot', () => {
  const controller = createMaintainerController();
  controller.setProjects([createProject('A'), createProject('B')]);

  const selected = controller.select(1);
  assert.equal(selected.selectedIndex, 1);
  assert.equal(selected.draft.name, 'B');

  const cleanDraft = controller.startNewDraft();
  assert.equal(cleanDraft.selectedIndex, -1);
  assert.equal(cleanDraft.draft.name, '');
});

test('controller blocks user selection changes during critical operation', async () => {
  const controller = createMaintainerController();
  controller.setProjects([createProject('A')]);

  await controller.runCriticalOperation('save', async () => {
    assert.throws(() => controller.select(0), /Operacion en curso: save/);
    const systemSelection = controller.select(0, { system: true });
    assert.equal(systemSelection.selectedIndex, 0);
  });

  const after = controller.select(0);
  assert.equal(after.selectedIndex, 0);
});

test('controller prevents concurrent critical operations', async () => {
  const controller = createMaintainerController();

  const first = controller.runCriticalOperation('refresh', async () => {
    assert.rejects(
      controller.runCriticalOperation('save', async () => {}),
      /Operacion en curso: refresh/
    );
  });

  await first;
  const after = await controller.runCriticalOperation('save', async () => 'ok');
  assert.equal(after, 'ok');
});
