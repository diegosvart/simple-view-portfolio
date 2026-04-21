const { sanitizeProject } = require('./validation');

function createMaintainerController() {
  const emptyDraft = sanitizeProject({ name: '', rag: 'verde' });
  const state = {
    projects: [],
    selectedIndex: -1,
    draft: { ...emptyDraft },
    activeOperation: ''
  };

  const cloneProjects = (projects) => projects.map((project) => ({ ...project }));

  function syncDraftFromSelection() {
    if (state.selectedIndex >= 0 && state.selectedIndex < state.projects.length) {
      state.draft = { ...state.projects[state.selectedIndex] };
      return;
    }

    state.selectedIndex = -1;
    state.draft = { ...emptyDraft };
  }

  function assertSelectionUnlocked() {
    if (state.activeOperation) {
      throw new Error(`Operacion en curso: ${state.activeOperation}. Espera a que termine.`);
    }
  }

  return {
    setProjects(projects) {
      state.projects = cloneProjects(Array.isArray(projects) ? projects : []);
      syncDraftFromSelection();
      return this.getState();
    },

    select(index, options) {
      const cfg = options || {};
      if (!cfg.system) {
        assertSelectionUnlocked();
      }

      const nextIndex = Number.isInteger(index) ? index : -1;
      state.selectedIndex = nextIndex >= 0 && nextIndex < state.projects.length ? nextIndex : -1;
      syncDraftFromSelection();
      return this.getState();
    },

    startNewDraft(options) {
      return this.select(-1, options);
    },

    setDraft(project) {
      state.draft = sanitizeProject(project || emptyDraft);
      return this.getState();
    },

    getState() {
      return {
        projects: cloneProjects(state.projects),
        selectedIndex: state.selectedIndex,
        draft: { ...state.draft },
        activeOperation: state.activeOperation
      };
    },

    async runCriticalOperation(operationName, task) {
      if (state.activeOperation) {
        throw new Error(`Operacion en curso: ${state.activeOperation}. Espera a que termine.`);
      }

      state.activeOperation = String(operationName || 'operacion');

      try {
        return await task();
      } finally {
        state.activeOperation = '';
      }
    }
  };
}

module.exports = {
  createMaintainerController
};
