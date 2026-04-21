const test = require('node:test');
const assert = require('node:assert/strict');

const { createPlannerProviderContract } = require('../../src/frontend-root/pure/planner-provider-contract');

// Interfaz esperada: identica a la del proveedor markdown local
const EXPECTED_METHODS = [
  'load', 'setAll', 'getAll', 'getMetrics',
  'create', 'update', 'remove', 'importMarkdown', 'exportMarkdown'
];

test('createPlannerProviderContract retorna objeto con source="planner"', () => {
  const provider = createPlannerProviderContract({});
  assert.equal(provider.source, 'planner');
});

test('createPlannerProviderContract retorna config proporcionada', () => {
  const cfg = { tenantId: 't1', groupId: 'g1', planId: 'p1' };
  const provider = createPlannerProviderContract(cfg);
  assert.deepEqual(provider.config, cfg);
});

test('createPlannerProviderContract sin argumentos retorna config vacio', () => {
  const provider = createPlannerProviderContract();
  assert.deepEqual(provider.config, {});
});

test('contrato expone todos los metodos requeridos por la interfaz DataProvider', () => {
  const provider = createPlannerProviderContract({});
  for (const method of EXPECTED_METHODS) {
    assert.equal(typeof provider[method], 'function', `Falta metodo: ${method}`);
  }
});

test('cada metodo del contrato lanza error descriptivo al invocarse', () => {
  const provider = createPlannerProviderContract({});
  for (const method of EXPECTED_METHODS) {
    assert.throws(
      () => provider[method](),
      (err) => {
        assert.ok(err instanceof Error, 'Debe lanzar Error');
        assert.ok(err.message.includes(method), `El mensaje debe incluir el nombre del metodo: ${method}`);
        return true;
      },
      `${method}() debe lanzar error`
    );
  }
});

test('contrato expone los metodos EXPECTED_METHODS definidos por la interfaz DataProvider futura', () => {
  const provider = createPlannerProviderContract({});
  // La interfaz futura (DataProvider) es un superconjunto del proveedor local.
  // Verificamos que EXPECTED_METHODS esten todos presentes.
  for (const method of EXPECTED_METHODS) {
    assert.equal(typeof provider[method], 'function', `Metodo requerido ausente: ${method}`);
  }
});

test('config del contrato es una copia defensiva (no referencia al objeto original)', () => {
  const cfg = { tenantId: 'original' };
  const provider = createPlannerProviderContract(cfg);
  cfg.tenantId = 'mutado';
  assert.equal(provider.config.tenantId, 'original', 'El config no debe mutar con el objeto original');
});
