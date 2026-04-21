/**
 * planner-provider-contract.js
 *
 * Contrato/seam backend-ready para futura integracion con MS Graph.
 * Define la interfaz que debe cumplir cualquier implementacion remota.
 *
 * NOTAS DE DISENO:
 * - El frontend root se comunica solo con esta interfaz (UI -> provider -> backend API).
 * - Sustituir esta implementacion por una real no requiere cambios en la UI.
 * - No introduce dependencia de MS Graph ni autenticacion en esta iteracion.
 */

'use strict';

/**
 * @typedef {Object} PlannerProviderConfig
 * @property {string} [tenantId]
 * @property {string} [groupId]
 * @property {string} [planId]
 */

/**
 * @typedef {Object} PlannerProvider
 * @property {'planner'} source
 * @property {PlannerProviderConfig} config
 * @property {function(string): Array} load
 * @property {function(Array): void} setAll
 * @property {function(): Array} getAll
 * @property {function(): Object} getMetrics
 * @property {function(Object): void} create
 * @property {function(number, Object): void} update
 * @property {function(number): Object} remove
 * @property {function(string): Array} importMarkdown
 * @property {function(): string} exportMarkdown
 */

/**
 * Crea el contrato stub del provider Planner (backend-ready seam).
 * Cada metodo lanza un error claro indicando que requiere implementacion real.
 * La interfaz es identica a la del provider markdown para garantizar swap sin cambios UI.
 *
 * @param {PlannerProviderConfig} [config]
 * @returns {PlannerProvider}
 */
function createPlannerProviderContract(config) {
  const notImplemented = (methodName) => () => {
    throw new Error(`PlannerProvider.${methodName}() requiere implementacion real (MS Graph / backend API).`);
  };

  return {
    source: 'planner',
    config: Object.assign({}, config || {}),
    load: notImplemented('load'),
    setAll: notImplemented('setAll'),
    getAll: notImplemented('getAll'),
    getMetrics: notImplemented('getMetrics'),
    create: notImplemented('create'),
    update: notImplemented('update'),
    remove: notImplemented('remove'),
    importMarkdown: notImplemented('importMarkdown'),
    exportMarkdown: notImplemented('exportMarkdown')
  };
}

module.exports = { createPlannerProviderContract };
