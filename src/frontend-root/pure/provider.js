const { parseMD, serializeMD } = require('./markdown');
const { computeProjectMetrics } = require('./metrics');
const { validateProjectCollectionOrThrow, validateProjectOrThrow } = require('./validation');

function cloneProjects(projects) {
  return projects.map((project) => ({ ...project }));
}

function createLocalMarkdownProvider(initialProjects) {
  let state = [];
  let baseline = [];

  const provider = {
    load(markdownText) {
      let parsed;
      try {
        parsed = parseMD(markdownText);
      } catch (error) {
        throw new Error(`Importacion markdown invalida: ${error.message}`);
      }

      baseline = cloneProjects(parsed);
      state = cloneProjects(parsed);
      return provider.refresh();
    },

    reset(source) {
      if (typeof source === 'undefined') {
        state = cloneProjects(baseline);
        return provider.refresh();
      }

      if (typeof source === 'string') {
        return provider.load(source);
      }

      if (!Array.isArray(source)) {
        throw new Error('Reset invalido: se esperaba markdown, arreglo o sin parametros.');
      }

      let next;
      try {
        next = validateProjectCollectionOrThrow(source);
      } catch (error) {
        throw new Error(`Coleccion de proyectos invalida: ${error.message}`);
      }

      state = cloneProjects(next);
      return provider.refresh();
    },

    refresh() {
      return cloneProjects(state);
    },

    getMetrics() {
      return computeProjectMetrics(state);
    },

    create(project) {
      const next = validateProjectOrThrow(project, { existingProjects: state, currentIndex: -1 });
      state = [...state, next];
      return { ...next };
    },

    update(index, project) {
      if (!Number.isInteger(index) || index < 0 || index >= state.length) {
        throw new Error('Indice de proyecto invalido para actualizar.');
      }

      const next = validateProjectOrThrow(project, { existingProjects: state, currentIndex: index });
      state = state.map((item, itemIndex) => (itemIndex === index ? next : item));
      return { ...next };
    },

    remove(index) {
      if (!Number.isInteger(index) || index < 0 || index >= state.length) {
        throw new Error('Indice de proyecto invalido para eliminar.');
      }

      const removed = state[index];
      state = state.filter((_, itemIndex) => itemIndex !== index);
      return { ...removed };
    },

    export() {
      return serializeMD(state);
    }
  };

  provider.reset(Array.isArray(initialProjects) ? initialProjects : []);
  return provider;
}

module.exports = {
  createLocalMarkdownProvider
};
