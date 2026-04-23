/**
 * @typedef {Object} ProjectModel
 * Contrato canónico de datos para un proyecto del portafolio simple.
 *
 * Campos de identidad:
 * @property {string} name         - Nombre único del proyecto (requerido).
 * @property {string} descripcion  - Descripción breve del alcance o propósito.
 * @property {string} responsable  - Nombre del responsable / PM asignado.
 *
 * Estado general:
 * @property {RagValue} rag        - Semáforo RAG del proyecto.
 *
 * Etapas del ciclo de vida (E1–E10):
 * @property {StageValue} e1   - Ficha de Proyecto
 * @property {StageValue} e2   - Aprobación de Sponsor
 * @property {StageValue} e3   - Requerimientos Funcionales
 * @property {StageValue} e4   - Requerimientos Técnicos
 * @property {StageValue} e5   - Cotización y Proveedor
 * @property {StageValue} e6   - Kick Off
 * @property {StageValue} e7   - Iteración y Seguimiento
 * @property {StageValue} e8   - Pruebas
 * @property {StageValue} e9   - Marcha Blanca
 * @property {StageValue} e10  - Entrega y Cierre Formal
 */

/**
 * @typedef {'verde'|'ambar'|'rojo'} RagValue
 * Valores válidos del semáforo RAG (estado general del proyecto).
 * - verde  → en tiempo, sin riesgos activos
 * - ambar  → en riesgo o con desviación menor (valor de código sin tilde)
 * - rojo   → retrasado o bloqueado sin resolución
 */

/**
 * @typedef {'completado'|'en-curso'|'pendiente'|'bloqueado'} StageValue
 * Valores válidos del estado de cada etapa.
 * - completado  → etapa finalizada con evidencia
 * - en-curso    → etapa activa actualmente
 * - pendiente   → no iniciada
 * - bloqueado   → detenida por dependencia externa
 */

const THEME_KEY = 'pm-report-theme';
const DATA_KEY = 'pm-report-projects-markdown';

/** Catálogo canónico de fases (5 phases) */
const PHASES_CATALOG = [
  { id: 'definicion',     order: 1, label: 'Definición' },
  { id: 'diseno',         order: 2, label: 'Diseño' },
  { id: 'ejecucion',      order: 3, label: 'Ejecución' },
  { id: 'implementacion', order: 4, label: 'Implementación' },
  { id: 'cierre',         order: 5, label: 'Cierre' }
];

/**
 * Shims de compatibilidad para código heredado del mantenedor.
 * STAGE_KEYS y STAGE_LABELS quedan vacíos ya que el modelo migró a project.tasks[].
 * Se eliminarán cuando Etapa 4 migre el UI del mantenedor al nuevo modelo.
 */
const STAGE_LABELS = {};
const STAGE_KEYS = [];

/** Catálogo canónico de tareas por fase */
const TASKS_CATALOG = {
  definicion: [
    { code: '1.1', label: 'Coordinación ficha de proyecto' },
    { code: '1.2', label: 'Completar FDP' },
    { code: '1.3', label: 'Análisis FDP' },
    { code: '1.4', label: 'Iteración FDP' },
    { code: '1.5', label: 'Aprobación de Sponsor' }
  ],
  diseno: [
    { code: '2.1',  label: 'Coordinación especificación funcional de requerimientos' },
    { code: '2.2',  label: 'Completar EFR' },
    { code: '2.3',  label: 'Análisis EFR' },
    { code: '2.4',  label: 'Iteración EFR' },
    { code: '2.5',  label: 'Aprobación Lider de proyecto' },
    { code: '2.6',  label: 'Coordinación especificación de requerimientos técnicos' },
    { code: '2.7',  label: 'Completar ERT' },
    { code: '2.8',  label: 'Análisis ERT' },
    { code: '2.9',  label: 'Iteración ERT' },
    { code: '2.10', label: 'Aprobación Lider de proyecto' },
    { code: '2.11', label: 'Aprobación de Sponsor' },
    { code: '2.12', label: 'Envío a cotización' },
    { code: '2.13', label: 'Respuestas dudas y consultas proveedores' },
    { code: '2.14', label: 'Análisis y selección de proveedor' },
    { code: '2.15', label: 'Coordinación Kick Off' }
  ],
  ejecucion: [
    { code: '3.1', label: 'Solicitud planificación proyecto' },
    { code: '3.2', label: 'Análisis de planificación' },
    { code: '3.3', label: 'Reunión Kick Off' },
    { code: '3.4', label: 'Reuniones de seguimiento' },
    { code: '3.5', label: 'Definición plan de pruebas' },
    { code: '3.6', label: 'Ejecución plan de pruebas' }
  ],
  implementacion: [
    { code: '4.1', label: 'Reunión definición marcha blanca' },
    { code: '4.2', label: 'Preparación de ambiente productivo' },
    { code: '4.3', label: 'Certificación' },
    { code: '4.4', label: 'Roll Out' }
  ],
  cierre: [
    { code: '5.1', label: 'Periodo de garantía' },
    { code: '5.2', label: 'Retro alimentación del proyecto' },
    { code: '5.3', label: 'Cierre formal del proyecto' }
  ]
};

/** @type {StageValue[]} Catálogo canónico de estados de etapa */
const STAGE_STATES = ['completado', 'en-curso', 'pendiente', 'bloqueado'];
/** @type {RagValue[]} Catálogo canónico de valores RAG (ambar sin tilde es el valor de código) */
const RAG_STATES = ['verde', 'ambar', 'rojo'];
const BUCKETS = [
  { key: 'definicion', label: 'Definición' },
  { key: 'diseno', label: 'Diseño' },
  { key: 'ejecucion', label: 'Ejecución' },
  { key: 'implementacion', label: 'Implementación' },
  { key: 'cierre', label: 'Cierre' }
];

/**
 * UUID generator — Generar IDs únicos
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * LocalStorageRepository — Persistencia en localStorage con CRUD completo
 * @type {Object}
 */
const LocalStorageRepository = {
  STORAGE_KEY: 'portfolio.v1',
  
  load() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : { projects: [] };
    } catch (e) {
      console.error('Error loading portfolio from localStorage:', e);
      return { projects: [] };
    }
  },
  
  save(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving portfolio to localStorage:', e);
    }
  },
  
  /**
   * Obtener proyecto por ID
   */
  getProjectById(id) {
    const state = this.load();
    return (state.projects || []).find(p => p.id === id);
  },
  
  /**
   * Crear nuevo proyecto
   */
  createProject(project) {
    const state = this.load();
    const newProject = {
      id: generateUUID(),
      name: (project.name || '').trim(),
      leader: (project.leader || '').trim(),
      sponsor: (project.sponsor || '').trim(),
      rag: project.rag || 'verde',
      tasks: project.tasks || [],
      removed: false
    };
    state.projects = state.projects || [];
    state.projects.push(newProject);
    this.save(state);
    return newProject;
  },
  
  /**
   * Actualizar proyecto existente
   */
  updateProject(id, updates) {
    const state = this.load();
    const idx = (state.projects || []).findIndex(p => p.id === id);
    if (idx < 0) return null;
    
    const project = state.projects[idx];
    Object.assign(project, updates);
    this.save(state);
    return project;
  },
  
  /**
   * Remover proyecto (soft delete)
   */
  removeProject(id) {
    return this.updateProject(id, { removed: true });
  },
  
  /**
   * Agregar o actualizar tarea en proyecto
   */
  upsertTask(projectId, taskData) {
    const state = this.load();
    const project = (state.projects || []).find(p => p.id === projectId);
    if (!project) return null;
    
    project.tasks = project.tasks || [];
    const existingIdx = project.tasks.findIndex(t => t.id === taskData.id);
    
    if (existingIdx >= 0) {
      Object.assign(project.tasks[existingIdx], taskData);
    } else {
      project.tasks.push({
        id: generateUUID(),
        ...taskData
      });
    }
    
    this.save(state);
    return project;
  },
  
  /**
   * Remover tarea (soft delete)
   */
  removeTask(projectId, taskId) {
    const state = this.load();
    const project = (state.projects || []).find(p => p.id === projectId);
    if (!project) return null;
    
    const task = (project.tasks || []).find(t => t.id === taskId);
    if (task) {
      task.removed = true;
    }
    
    this.save(state);
    return project;
  }
};

/**
 * Crear 7 proyectos iniciales de seed
 */
function seedInitialProjects() {
  const projects = [
    {
      name: 'Portal Interno RH',
      leader: 'Ana García',
      sponsor: 'Director de RRHH'
    },
    {
      name: 'Migración Cloud Infrastructure',
      leader: 'Carlos López',
      sponsor: 'CTO'
    },
    {
      name: 'Modernización Backend APIs',
      leader: 'María Rodríguez',
      sponsor: 'VP Engineering'
    },
    {
      name: 'Dashboard Ejecutivo BI',
      leader: 'Diego Martínez',
      sponsor: 'Director de Operaciones'
    },
    {
      name: 'Integración SAP Finance',
      leader: 'Patricia Sánchez',
      sponsor: 'CFO'
    },
    {
      name: 'Mobile App Cliente',
      leader: 'Roberto Fernández',
      sponsor: 'Director de Producto'
    },
    {
      name: 'Seguridad Infraestructura IT',
      leader: 'Laura Gómez',
      sponsor: 'Director de Seguridad'
    }
  ];

  projects.forEach(proj => {
    const newProj = {
      ...proj,
      rag: 'verde',
      tasks: []
    };

    // Pre-cargar todas las tareas del catálogo en estado 'pend'
    PHASES_CATALOG.forEach(phase => {
      const phaseTasks = TASKS_CATALOG[phase.id] || [];
      phaseTasks.forEach(taskTemplate => {
        newProj.tasks.push({
          id: generateUUID(),
          phaseId: phase.id,
          code: taskTemplate.code,
          label: taskTemplate.label,
          status: 'pend',
          removed: false
        });
      });
    });

    LocalStorageRepository.createProject(newProj);
  });

  // Aplicar progreso de demostración a los 2 primeros proyectos
  const state = LocalStorageRepository.load();
  const projectList = state.projects || [];

  // Proyecto 0 — Portal Interno RH: definicion 3 ok, 1 pend, 1 bloq → 60%
  if (projectList.length >= 1) {
    projectList[0].tasks.forEach(t => {
      if (t.phaseId === 'definicion') {
        if (['1.1', '1.2', '1.3'].includes(t.code)) t.status = 'ok';
        if (t.code === '1.5') t.status = 'bloq';
      }
    });
    projectList[0].rag = 'ambar';
  }

  // Proyecto 1 — Migración Cloud: definicion 2 ok, 2 pend, 1 bloq → 40%; diseno 1 ok
  if (projectList.length >= 2) {
    projectList[1].tasks.forEach(t => {
      if (t.phaseId === 'definicion') {
        if (['1.1', '1.2'].includes(t.code)) t.status = 'ok';
        if (t.code === '1.5') t.status = 'bloq';
      }
      if (t.phaseId === 'diseno' && t.code === '2.1') t.status = 'ok';
    });
  }

  LocalStorageRepository.save(state);
}

/**
 * PortfolioService — Servicios de negocio para proyectos con CRUD completo
 * @type {Object}
 */
const PortfolioService = {
  /**
   * Obtener lista de proyectos activos
   * @returns {Object[]}
   */
  getProjects() {
    const state = LocalStorageRepository.load();
    return (state.projects || []).filter(p => !p.removed);
  },
  
  /**
   * Calcular indicadores de avance del proyecto
   * @param {Object} project
   * @returns {Object}
   */
  computeProgress(project) {
    const byPhase = {};
    PHASES_CATALOG.forEach(phase => {
      const tasks = (project.tasks || []).filter(t => t.phaseId === phase.id && !t.removed);
      const done = tasks.filter(t => t.status === 'ok').length;
      byPhase[phase.id] = {
        total: tasks.length,
        done,
        pct: tasks.length ? Math.round((done * 100) / tasks.length) : 0
      };
    });
    const total = (project.tasks || []).filter(t => !t.removed).length;
    const done = (project.tasks || []).filter(t => !t.removed && t.status === 'ok').length;
    return {
      byPhase,
      overall: {
        total,
        done,
        pct: total ? Math.round((done * 100) / total) : 0
      }
    };
  },
  
  /**
   * Crear nuevo proyecto
   */
  createProject(name, leader, sponsor) {
    const project = {
      name,
      leader: leader || '',
      sponsor: sponsor || '',
      rag: 'verde',
      tasks: []
    };
    
    // Pre-cargar todas las tareas del catálogo
    PHASES_CATALOG.forEach(phase => {
      const phaseTasks = TASKS_CATALOG[phase.id] || [];
      phaseTasks.forEach(taskTemplate => {
        project.tasks.push({
          id: generateUUID(),
          phaseId: phase.id,
          code: taskTemplate.code,
          label: taskTemplate.label,
          status: 'pend',
          removed: false
        });
      });
    });
    
    return LocalStorageRepository.createProject(project);
  },
  
  /**
   * Actualizar metadatos del proyecto
   */
  updateProject(id, updates) {
    const project = LocalStorageRepository.getProjectById(id);
    if (!project) return null;
    
    const safeUpdates = {
      name: updates.name !== undefined ? updates.name : project.name,
      leader: updates.leader !== undefined ? updates.leader : project.leader,
      sponsor: updates.sponsor !== undefined ? updates.sponsor : project.sponsor,
      rag: updates.rag !== undefined ? updates.rag : project.rag
    };
    
    return LocalStorageRepository.updateProject(id, safeUpdates);
  },
  
  /**
   * Remover proyecto
   */
  removeProject(id) {
    return LocalStorageRepository.removeProject(id);
  },
  
  /**
   * Agregar tarea al proyecto
   */
  addTask(projectId, phaseId, code, label) {
    return LocalStorageRepository.upsertTask(projectId, {
      phaseId,
      code,
      label,
      status: 'pend',
      removed: false
    });
  },
  
  /**
   * Remover tarea del proyecto
   */
  removeTask(projectId, taskId) {
    return LocalStorageRepository.removeTask(projectId, taskId);
  },
  
  /**
   * Toggle estado de tarea (ok ↔ pend)
   */
  toggleTaskStatus(projectId, taskId) {
    const state = LocalStorageRepository.load();
    const project = (state.projects || []).find(p => p.id === projectId);
    if (!project) return null;
    
    const task = (project.tasks || []).find(t => t.id === taskId);
    if (!task) return null;
    
    task.status = task.status === 'ok' ? 'pend' : 'ok';
    LocalStorageRepository.save(state);
    return project;
  },
  
  /**
   * Inicializar con seed si está vacío.
   * Migración: si hay proyectos sin tareas (datos pre-Etapa 2), backfill con catálogo en 'pend'.
   */
  ensureInitialized() {
    const state = LocalStorageRepository.load();
    if (!state.projects || state.projects.length === 0) {
      seedInitialProjects();
      return;
    }
    // Migración: proyectos sin tareas reciben backfill del catálogo
    let migrated = false;
    state.projects.forEach(p => {
      if (!p.removed && (!p.tasks || p.tasks.length === 0)) {
        p.tasks = [];
        PHASES_CATALOG.forEach(phase => {
          const phaseTasks = TASKS_CATALOG[phase.id] || [];
          phaseTasks.forEach(taskTemplate => {
            p.tasks.push({
              id: generateUUID(),
              phaseId: phase.id,
              code: taskTemplate.code,
              label: taskTemplate.label,
              status: 'pend',
              removed: false
            });
          });
        });
        migrated = true;
      }
    });
    if (migrated) {
      LocalStorageRepository.save(state);
    }
  }
};
let currentProjects = [];
let selectedProjectIndex = -1;
let isTableFullscreen = false;
let activeMaintainerPhaseId = PHASES_CATALOG[0].id;
const DATA_SOURCE_MODES = ['markdown', 'planner'];
const DATA_SOURCE_MODE = 'markdown';
let dataProvider = createDataProvider(DATA_SOURCE_MODE);
const maintainerController = createMaintainerController();

/**
 * @typedef {Object} PlannerTaskModel
 * @property {string} id
 * @property {string} title
 * @property {string} bucketKey
 * @property {number} percentComplete
 * @property {'notStarted'|'inProgress'|'completed'} status
 */

/**
 * @typedef {Object} PlannerProjectSnapshot
 * @property {string} planId
 * @property {string} planTitle
 * @property {string} groupId
 * @property {string} projectName
 * @property {string} rag
 * @property {Record<string,string>} stages
 * @property {Record<string, PlannerTaskModel[]>} tasksByBucket
 */

/**
 * @typedef {Object} DataProvider
 * @property {(markdownText: string) => ProjectModel[]} load
 * @property {(source?: string|Object[]) => ProjectModel[]} reset
 * @property {() => ProjectModel[]} refresh
 * @property {() => { total: number, completado: number, enCurso: number, bloqueado: number }} getMetrics
 * @property {(project: Object) => ProjectModel} create
 * @property {(index: number, project: Object) => ProjectModel} update
 * @property {(index: number) => ProjectModel} remove
 * @property {() => string} export
 */

/**
 * @typedef {DataProvider & {
 *   source: 'planner',
 *   config: { tenantId?: string, groupId?: string, planId?: string }
 * }} PlannerDataProviderContract
 */

/**
 * Mapeo de diseño ProjectModel -> Planner snapshot.
 * Sin llamadas Graph: solo transforma estructura para documentar contrato.
 * @param {Object} project
 * @param {{ planId?: string, groupId?: string }} [config]
 * @returns {PlannerProjectSnapshot}
 */
function mapProjectModelToPlannerSnapshot(project, config) {
  const p = sanitizeProject(project || {});
  const cfg = config || {};
  const tasksByBucket = {};

  BUCKETS.forEach((bucket) => {
    const templates = PLANNER_TASK_TEMPLATE[bucket.key] || [];
    tasksByBucket[bucket.key] = templates.map((title, index) => ({
      id: `${bucket.key}-${index + 1}`,
      title,
      bucketKey: bucket.key,
      percentComplete: 0,
      status: 'notStarted'
    }));
  });

  const stages = {};
  STAGE_KEYS.forEach((key) => {
    stages[key] = p[key];
  });

  return {
    planId: cfg.planId || '',
    planTitle: p.name,
    groupId: cfg.groupId || '',
    projectName: p.name,
    rag: p.rag,
    stages,
    tasksByBucket
  };
}

/**
 * Mapeo de diseño Planner snapshot -> ProjectModel.
 * Se usa para documentar reglas de transformación sin integrar Graph en esta iteración.
 * @param {PlannerProjectSnapshot} snapshot
 * @returns {ProjectModel}
 */
function mapPlannerSnapshotToProjectModel(snapshot) {
  const src = snapshot || {};
  const draft = {
    name: src.projectName || src.planTitle || '',
    descripcion: '',
    responsable: '',
    rag: src.rag || 'verde'
  };

  STAGE_KEYS.forEach((key) => {
    const value = src.stages && src.stages[key] ? src.stages[key] : 'pendiente';
    draft[key] = value;
  });

  return sanitizeProject(draft);
}

/**
 * Factory que retorna el provider apropiado según DATA_SOURCE_MODE.
 * Para cambiar de proveedor, actualizar DATA_SOURCE_MODE y proveer implementación.
 * @param {string} mode - 'markdown' o 'planner'
 * @param {Array} [initialProjects]
 * @returns {DataProvider}
 */
function createDataProvider(mode, initialProjects) {
  if (mode === 'planner') {
    return createPlannerDataProviderContract({});
  }
  return createMarkdownDataProvider(initialProjects || []);
}

/**
 * Contrato futuro de provider Planner.
 * Esta función NO implementa Graph ni persistencia remota; expone el shape esperado.
 * @param {{ tenantId?: string, groupId?: string, planId?: string }} [config]
 * @returns {PlannerDataProviderContract}
 */
function createPlannerDataProviderContract(config) {
  const notImplemented = () => {
    throw new Error('PlannerDataProvider no implementado en esta iteracion.');
  };

  const provider = {
    source: 'planner',
    config: config || {},
    load: notImplemented,
    setAll: notImplemented,
    getAll: notImplemented,
    getMetrics: notImplemented,
    create: notImplemented,
    update: notImplemented,
    remove: notImplemented,
    importMarkdown: notImplemented,
    exportMarkdown: notImplemented
  };

  return provider;
}

function computeProjectMetrics(projects) {
  const list = Array.isArray(projects) ? projects : [];
  let completado = 0;
  let enCurso = 0;
  let bloqueado = 0;

  list.forEach((project) => {
    const states = STAGE_KEYS.map((key) => normalizeStage(project && project[key]));
    if (states.some((state) => state === 'bloqueado')) {
      bloqueado++;
      return;
    }
    if (states.every((state) => state === 'completado')) {
      completado++;
      return;
    }
    enCurso++;
  });

  return {
    total: list.length,
    completado,
    enCurso,
    bloqueado
  };
}

/**
 * Crea el provider actual basado en markdown/local memory.
 * Mantiene encapsulada la colección para facilitar swap de origen (Planner) sin tocar UI.
 * @param {Object[]} initialProjects
 * @returns {DataProvider}
 */
function createMarkdownDataProvider(initialProjects) {
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

      baseline = parsed.map((project) => ({ ...project }));
      state = parsed.map((project) => ({ ...project }));
      return provider.refresh();
    },

    reset(source) {
      if (typeof source === 'undefined') {
        state = baseline.map((project) => ({ ...project }));
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

      state = next.map((project) => ({ ...project }));
      return provider.refresh();
    },

    refresh() {
      return state.map((project) => ({ ...project }));
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
    },

    setAll(projects) {
      return provider.reset(projects);
    },

    getAll() {
      return provider.refresh();
    },

    importMarkdown(markdownText) {
      return provider.load(markdownText);
    },

    exportMarkdown() {
      return provider.export();
    }
  };

  provider.reset(Array.isArray(initialProjects) ? initialProjects : []);
  return provider;
}

function createMaintainerController() {
  const emptyDraft = sanitizeProject({ name: '', rag: 'verde', tasks: [] });
  const state = {
    projects: [],
    selectedIndex: -1,
    draft: { ...emptyDraft },
    activeOperation: ''
  };

  const cloneProjects = (projects) => projects.map((project) => ({ ...project }));

  const syncDraftFromSelection = () => {
    if (state.selectedIndex >= 0 && state.selectedIndex < state.projects.length) {
      state.draft = { ...state.projects[state.selectedIndex] };
      return;
    }

    state.selectedIndex = -1;
    state.draft = { ...emptyDraft };
  };

  const assertSelectionUnlocked = () => {
    if (state.activeOperation) {
      throw new Error(`Operacion en curso: ${state.activeOperation}. Espera a que termine.`);
    }
  };

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

function normalizeTaskStatus(rawStatus, completed) {
  const status = String(rawStatus || '').toLowerCase().trim();
  if (status === 'ok' || status === 'pend' || status === 'bloq') return status;
  if (status === 'completado' || status === 'completed' || status === 'done') return 'ok';
  if (status === 'bloqueado' || status === 'blocked') return 'bloq';
  if (typeof completed === 'boolean') return completed ? 'ok' : 'pend';
  return 'pend';
}

function inferPhaseId(task) {
  const byTask = String((task && (task.code || task.label || task.title)) || '').trim();
  const codeMatch = byTask.match(/^(\d+)\./);
  if (!codeMatch) return '';

  const phaseNumber = Number(codeMatch[1]);
  const map = {
    1: 'definicion',
    2: 'diseno',
    3: 'ejecucion',
    4: 'implementacion',
    5: 'cierre'
  };
  return map[phaseNumber] || '';
}

function normalizeProjectTasks(project) {
  const sourceTasks = Array.isArray(project && project.tasks) ? project.tasks : [];
  const phaseIds = new Set(PHASES_CATALOG.map((phase) => phase.id));

  const normalized = sourceTasks
    .map((task, index) => {
      const phaseId = String((task && (task.phaseId || task.bucketKey)) || inferPhaseId(task) || '').trim();
      if (!phaseIds.has(phaseId)) return null;

      return {
        id: task && task.id ? String(task.id) : generateUUID(),
        phaseId,
        code: String((task && task.code) || '').trim(),
        label: String((task && (task.label || task.title)) || '').trim() || `Tarea ${index + 1}`,
        status: normalizeTaskStatus(task && task.status, task && task.completed),
        removed: Boolean(task && task.removed)
      };
    })
    .filter((task) => task && !task.removed);

  if (normalized.length > 0) return normalized;

  const fallback = [];
  PHASES_CATALOG.forEach((phase) => {
    const phaseTasks = TASKS_CATALOG[phase.id] || [];
    phaseTasks.forEach((template) => {
      fallback.push({
        id: generateUUID(),
        phaseId: phase.id,
        code: template.code,
        label: template.label,
        status: 'pend',
        removed: false
      });
    });
  });
  return fallback;
}

/**
 * Etapa 3: Get tasks by phase from project, organized by status
 */
function getPhaseTasksByProject(project) {
  const safeTasks = normalizeProjectTasks(project);
  const byPhase = {};
  PHASES_CATALOG.forEach(phase => {
    const phaseTasks = safeTasks.filter(t => t.phaseId === phase.id && !t.removed);
    byPhase[phase.id] = {
      all: phaseTasks,
      completado: phaseTasks.filter(t => t.status === 'ok').length,
      pendiente: phaseTasks.filter(t => t.status === 'pend').length,
      bloqueado: phaseTasks.filter(t => t.status === 'bloq').length
    };
  });
  return byPhase;
}

/**
 * Etapa 3: Summarize phase tasks by status
 */
function summarizePhase(phaseData) {
  const total = phaseData.all.length;
  const completado = phaseData.completado;
  const pendiente = phaseData.pendiente;
  const bloqueado = phaseData.bloqueado;
  const percent = total > 0 ? Math.round((completado * 100) / total) : 0;
  return { total, completado, pendiente, bloqueado, percent };
}

function getBucketLevel(summary) {
  if (!summary.total) return 'level-gray';
  if (summary.percent >= 80) return 'level-green';
  if (summary.percent >= 40) return 'level-amber';
  if (summary.percent > 0) return 'level-red';
  return 'level-gray';
}

/**
 * Etapa 3: HTML para celda de fase con nuevo formato agrupado por estado
 */
function phaseCellHTML(phaseLabel, phaseData) {
  const safeData = phaseData && Array.isArray(phaseData.all)
    ? phaseData
    : { all: [], completado: 0, pendiente: 0, bloqueado: 0 };
  const summary = summarizePhase(safeData);
  const levelClass = getBucketLevel(summary);

  let tooltipContent;
  if (!summary.total) {
    tooltipContent = 'Sin tareas asignadas';
  } else {
    const okTasks   = safeData.all.filter(t => t.status === 'ok');
    const pendTasks = safeData.all.filter(t => t.status !== 'ok' && t.status !== 'bloq');
    const bloqTasks = safeData.all.filter(t => t.status === 'bloq');
    const taskLine  = t => t.code ? `${t.code} - ${t.label}` : t.label;

    const okSection = `<span style="color:#4caf50;">✓ Completadas: ${okTasks.length}</span>`
      + (okTasks.length ? '<br>' + okTasks.map(t => `&nbsp;&nbsp;${taskLine(t)}`).join('<br>') : '');
    const pendSection = `<span style="color:#ff9800;">○ Pendientes: ${pendTasks.length}</span>`
      + (pendTasks.length ? '<br>' + pendTasks.map(t => `&nbsp;&nbsp;${taskLine(t)}`).join('<br>') : '');
    const bloqSection = `<span style="color:#f44336;">✗ Bloqueadas: ${bloqTasks.length}</span>`
      + (bloqTasks.length ? '<br>' + bloqTasks.map(t => `&nbsp;&nbsp;${taskLine(t)}`).join('<br>') : '');

    tooltipContent = [okSection, pendSection, bloqSection].join('<br>');
  }

  return `
    <div class="bucket-progress-wrap">
      <div class="bucket-progress-bubble ${levelClass}">${summary.percent}%</div>
      <div class="bucket-tooltip">
        <strong>Tareas de ${phaseLabel}</strong><br>
        ${tooltipContent}
      </div>
    </div>`;
}


function setTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
  document.getElementById('theme-toggle-label').textContent = nextTheme === 'dark' ? 'Modo claro' : 'Modo oscuro';
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  setTheme(savedTheme);
  const toggle = document.getElementById('theme-toggle');
  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function parseMD(text) {
  if (text == null) {
    throw new Error('No se recibio contenido markdown para importar.');
  }

  const source = String(text).replace(/\r\n?/g, '\n');
  const lines = source.split('\n');
  const projects = [];
  let currentProject = null;

  const commitCurrentProject = () => {
    if (!currentProject) return;
    projects.push(currentProject);
    currentProject = null;
  };

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (!line) return;

    if (/^##\s*proyecto\s*:/i.test(line)) {
      commitCurrentProject();
      const name = line.replace(/^##\s*proyecto\s*:/i, '').trim();
      currentProject = { name };
      return;
    }

    if (/^#/.test(line)) {
      return;
    }

    if (!currentProject) {
      return;
    }

    const kvMatch = line.match(/^([a-zA-Z0-9_]+)\s*:\s*(.*)$/);
    if (!kvMatch) {
      throw new Error(`Linea ${lineNumber}: formato invalido. Usa "clave: valor".`);
    }

    const key = kvMatch[1].trim().toLowerCase();
    const value = kvMatch[2].trim();
    currentProject[key] = value;
  });

  commitCurrentProject();

  return validateProjectCollectionOrThrow(projects);
}

/**
 * Normaliza cualquier objeto en un {@link ProjectModel} canónico.
 * Garantiza que todos los campos tengan valores válidos según los catálogos.
 * @param {Object} project - Objeto con los datos crudos del proyecto.
 * @returns {ProjectModel}
 */
function sanitizeProject(project) {
  const normalizedTasks = normalizeProjectTasks(project);
  const leader = String((project && (project.responsable || project.leader)) || '').trim();
  const safe = {
    id: String((project && project.id) || '').trim(),
    name: (project.name || '').trim(),
    descripcion: (project.descripcion || '').trim(),
    responsable: leader,
    leader,
    sponsor: String((project && project.sponsor) || '').trim(),
    rag: normalizeRag(project.rag),
    tasks: normalizedTasks,
    removed: Boolean(project && project.removed)
  };

  STAGE_KEYS.forEach(key => {
    safe[key] = normalizeStage(project[key]);
  });

  return safe;
}

function normalizeRag(value) {
  const v = String(value || '').toLowerCase().trim();
  return RAG_STATES.includes(v) ? v : 'verde';
}

function normalizeStage(value) {
  const v = String(value || '').toLowerCase().trim();
  return STAGE_STATES.includes(v) ? v : 'pendiente';
}

function normalizeNameKey(value) {
  return String(value || '').trim().toLowerCase();
}

function collectProjectValidationErrors(project, options) {
  const cfg = options || {};
  const errors = [];
  const name = String((project && project.name) || '').trim();
  const rag = String((project && project.rag) || '').trim().toLowerCase();

  if (!name) {
    errors.push('El nombre del proyecto es obligatorio.');
  }

  if (rag && !RAG_STATES.includes(rag)) {
    errors.push(`RAG invalido: "${project.rag}".`);
  }

  STAGE_KEYS.forEach((key) => {
    const raw = String((project && project[key]) || '').trim().toLowerCase();
    if (raw && !STAGE_STATES.includes(raw)) {
      errors.push(`Estado invalido en ${key.toUpperCase()}: "${project[key]}".`);
    }
  });

  if (Array.isArray(cfg.existingProjects)) {
    const currentIndex = Number.isInteger(cfg.currentIndex) ? cfg.currentIndex : -1;
    const needle = normalizeNameKey(name);
    const duplicate = cfg.existingProjects.some((item, idx) => {
      if (idx === currentIndex) return false;
      return normalizeNameKey(item && item.name) === needle;
    });

    if (needle && duplicate) {
      errors.push('Ya existe otro proyecto con ese nombre.');
    }
  }

  return errors;
}

function validateProjectOrThrow(project, options) {
  const errors = collectProjectValidationErrors(project, options);
  if (errors.length) {
    throw new Error(errors.join(' '));
  }
  return sanitizeProject(project);
}

function validateProjectCollectionOrThrow(projects) {
  const list = Array.isArray(projects) ? projects : [];
  const errors = [];
  const nameToIndex = new Map();

  list.forEach((project, index) => {
    const rowErrors = collectProjectValidationErrors(project);
    rowErrors.forEach((message) => {
      errors.push(`Proyecto ${index + 1}: ${message}`);
    });

    const key = normalizeNameKey(project && project.name);
    if (!key) return;

    if (nameToIndex.has(key)) {
      const prev = nameToIndex.get(key) + 1;
      errors.push(`Proyecto ${index + 1}: nombre duplicado con proyecto ${prev}.`);
      return;
    }

    nameToIndex.set(key, index);
  });

  if (errors.length) {
    throw new Error(errors.join(' '));
  }

  return list.map(sanitizeProject);
}

function toMarkdownScalar(value, fallback) {
  const clean = String(value == null ? '' : value)
    .replace(/\r\n?/g, ' ')
    .replace(/\n/g, ' ')
    .trim();

  if (!clean) {
    return fallback;
  }

  return clean;
}

function serializeMD(projects) {
  const lines = [
    '# Portafolio TI 2026 — Grupo EBI',
    '# Fuente de datos del tablero de proyectos',
    '# Formato: editar este archivo y recargar index.html',
    ''
  ];

  projects.forEach((project) => {
    const p = sanitizeProject(project);
    lines.push(`## proyecto: ${toMarkdownScalar(p.name, 'Sin nombre')}`);
    lines.push(`descripcion: ${toMarkdownScalar(p.descripcion, '-')}`);
    lines.push(`responsable: ${toMarkdownScalar(p.responsable, '-')}`);
    lines.push(`rag: ${p.rag}`);
    STAGE_KEYS.forEach((key) => lines.push(`${key}: ${p[key] || 'pendiente'}`));
    lines.push('');
  });

  return `${lines.join('\n').trim()}\n`;
}

function stageHTML(key, state) {
  const label = STAGE_LABELS[key] || key;
  const stateLabel = {
    completado: 'Completado',
    'en-curso': 'En curso',
    pendiente: 'Pendiente',
    bloqueado: 'Bloqueado'
  }[state] || state;
  const num = key.replace('e','');
  return `
    <div class="stage-wrap">
      <div class="stage-dot ${state}">${num}</div>
      <div class="stage-tooltip"><strong>${label}</strong><br>${stateLabel}</div>
    </div>`;
}

function buildProjectRowElement(proj, idx) {
  const row = document.createElement('div');
  row.className = 'proj-row';
  row.dataset.rag = normalizeRag(proj.rag);
  row.title = 'Doble clic para editar';

  // Etapa 3: Use real project tasks instead of fake data
  const phaseData = getPhaseTasksByProject(proj);
  const phasesHTML = PHASES_CATALOG.map((phase) => {
    const data = phaseData[phase.id] || { all: [], completado: 0, pendiente: 0, bloqueado: 0 };
    return `<div class="phase-cell">${phaseCellHTML(phase.label, data)}</div>`;
  }).join('');

  row.innerHTML = `
      <div class="proj-info">
        <div class="proj-name-row">
          <div class="rag-dot rag-${normalizeRag(proj.rag)}"></div>
          <span class="proj-name">${proj.name}</span>
        </div>
        <div class="proj-resp">${proj.responsable || proj.leader || ''}</div>
      </div>
      <div class="phases-grid">${phasesHTML}</div>`;
  row.addEventListener('dblclick', function() { openMaintainer(idx); });
  return row;
}

function computeProjectTaskProgress(project) {
  const tasks = normalizeProjectTasks(project).filter((task) => !task.removed);
  if (!tasks.length) return 0;

  const completed = tasks.filter((task) => task.status === 'ok').length;
  return Math.round((completed * 100) / tasks.length);
}

function getTaskStatusLabel(status) {
  return {
    ok: 'Completada',
    pend: 'Pendiente',
    bloq: 'Bloqueada'
  }[status] || 'Pendiente';
}

function ensureActiveMaintainerPhase(project) {
  const safeProject = sanitizeProject(project || { name: '', rag: 'verde', tasks: [] });
  const phaseIds = new Set(PHASES_CATALOG.map((phase) => phase.id));
  if (!phaseIds.has(activeMaintainerPhaseId)) {
    activeMaintainerPhaseId = PHASES_CATALOG[0].id;
  }

  const phaseData = getPhaseTasksByProject(safeProject);
  const hasAnyTaskInActive = phaseData[activeMaintainerPhaseId] && phaseData[activeMaintainerPhaseId].all.length > 0;
  if (hasAnyTaskInActive) return;

  const firstWithTasks = PHASES_CATALOG.find((phase) => (phaseData[phase.id] && phaseData[phase.id].all.length > 0));
  activeMaintainerPhaseId = firstWithTasks ? firstWithTasks.id : PHASES_CATALOG[0].id;
}

function renderMaintainerProjectList() {
  const container = document.getElementById('maintainer-project-list');
  if (!container) return;

  container.innerHTML = '';

  if (!currentProjects.length) {
    const empty = document.createElement('div');
    empty.className = 'maintainer-project-empty';
    empty.textContent = 'No hay proyectos cargados. Usa "Nuevo" para preparar el primer detalle.';
    container.appendChild(empty);
    return;
  }

  currentProjects.forEach((project, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'maintainer-project-item';
    if (index === selectedProjectIndex) {
      item.classList.add('active');
    }

    const progress = computeProjectTaskProgress(project);
    const leader = project.responsable || project.leader || 'Sin responsable';

    item.innerHTML = `
      <div class="maintainer-project-top">
        <span class="maintainer-project-name">${project.name}</span>
        <span class="maintainer-project-progress">${progress}%</span>
      </div>
      <div class="maintainer-project-bottom">
        <span class="maintainer-project-leader">${leader}</span>
        <span class="maintainer-project-leader">${normalizeRag(project.rag)}</span>
      </div>`;

    item.addEventListener('click', () => {
      const select = document.getElementById('mp-project-select');
      if (!select) return;
      select.value = String(index);
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    container.appendChild(item);
  });
}

function renderMaintainerPhaseTabs(project) {
  const tabsNode = document.getElementById('maintainer-phase-tabs');
  if (!tabsNode) return;

  const safeProject = sanitizeProject(project || { name: '', rag: 'verde', tasks: [] });
  ensureActiveMaintainerPhase(safeProject);
  const phaseData = getPhaseTasksByProject(safeProject);
  tabsNode.innerHTML = '';

  PHASES_CATALOG.forEach((phase) => {
    const summary = summarizePhase(phaseData[phase.id] || { all: [], completado: 0, pendiente: 0, bloqueado: 0 });
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'maintainer-phase-tab';
    if (phase.id === activeMaintainerPhaseId) {
      button.classList.add('active');
    }
    button.innerHTML = `
      <span class="maintainer-phase-tab-label">${phase.label}</span>
      <span class="maintainer-phase-tab-meta">${summary.percent}% · ${summary.total} tareas</span>`;
    button.addEventListener('click', () => {
      activeMaintainerPhaseId = phase.id;
      renderMaintainerPhaseTabs(safeProject);
      renderMaintainerPhaseDetail(safeProject);
    });
    tabsNode.appendChild(button);
  });
}

function renderMaintainerPhaseDetail(project) {
  const detailNode = document.getElementById('maintainer-phase-detail');
  if (!detailNode) return;

  const safeProject = sanitizeProject(project || { name: '', rag: 'verde', tasks: [] });
  ensureActiveMaintainerPhase(safeProject);
  const activePhase = PHASES_CATALOG.find((phase) => phase.id === activeMaintainerPhaseId) || PHASES_CATALOG[0];
  const phaseData = getPhaseTasksByProject(safeProject)[activePhase.id] || { all: [], completado: 0, pendiente: 0, bloqueado: 0 };
  const summary = summarizePhase(phaseData);

  const cards = phaseData.all.length
    ? phaseData.all.map((task) => `
      <article class="maintainer-task-card">
        <span class="maintainer-task-code">${task.code || activePhase.label}</span>
        <strong class="maintainer-task-label">${task.label}</strong>
        <span class="maintainer-task-status ${task.status}">${getTaskStatusLabel(task.status)}</span>
      </article>`).join('')
    : '<div class="maintainer-project-empty">Esta fase no tiene tareas visibles en el modelo actual.</div>';

  detailNode.innerHTML = `
    <div class="maintainer-phase-summary">
      <div>
        <h5>${activePhase.label}</h5>
        <p>${safeProject.name || 'Nuevo proyecto'} · ${summary.total} tareas en la fase seleccionada.</p>
      </div>
      <div class="maintainer-actions">
        <span class="maintainer-phase-pill">${summary.percent}% completado</span>
        <span class="maintainer-phase-pill">${summary.completado} OK</span>
        <span class="maintainer-phase-pill">${summary.pendiente} pendiente</span>
        <span class="maintainer-phase-pill">${summary.bloqueado} bloqueada</span>
      </div>
    </div>
    <div class="maintainer-task-list">${cards}</div>`;
}

function refreshMaintainerMasterDetail(project) {
  const safeProject = sanitizeProject(project || { name: '', rag: 'verde', tasks: [] });
  renderMaintainerProjectList();
  renderMaintainerPhaseTabs(safeProject);
  renderMaintainerPhaseDetail(safeProject);
}

function updateMetricsDisplay(metrics) {
  document.getElementById('m-total').textContent = metrics.total;
  document.getElementById('m-completado').textContent = metrics.completado;
  document.getElementById('m-encurso').textContent = metrics.enCurso;
  document.getElementById('m-bloqueado').textContent = metrics.bloqueado;
}

function computeTaskModelMetrics(projects) {
  const list = Array.isArray(projects) ? projects : [];
  let completado = 0;
  let enCurso = 0;
  let bloqueado = 0;

  list.forEach((project) => {
    const tasks = normalizeProjectTasks(project).filter((task) => !task.removed);
    if (!tasks.length) {
      enCurso++;
      return;
    }

    const hasBlocked = tasks.some((task) => task.status === 'bloq');
    if (hasBlocked) {
      bloqueado++;
      return;
    }

    const allDone = tasks.every((task) => task.status === 'ok');
    if (allDone) {
      completado++;
      return;
    }

    enCurso++;
  });

  return {
    total: list.length,
    completado,
    enCurso,
    bloqueado
  };
}

function renderProjects(projects) {
  currentProjects = (Array.isArray(projects) ? projects : []).map((project) => ({ ...project }));
  maintainerController.setProjects(currentProjects);
  const container = document.getElementById('proj-rows');
  container.innerHTML = '';

  updateMetricsDisplay(computeTaskModelMetrics(currentProjects));

  currentProjects.forEach((proj, idx) => {
    container.appendChild(buildProjectRowElement(proj, idx));
  });
  refreshMaintainerSelect();
}

function applyFilter(rag, btn) {
  document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.proj-row').forEach(row => {
    row.classList.toggle('hidden', rag !== 'todos' && row.dataset.rag !== rag);
  });
}

function applyActiveFilter() {
  const active = document.querySelector('.filter-pill.active');
  if (active) applyFilter(active.dataset.rag || 'todos', active);
}

const MAINTAINER_UX_LABELS = {
  clean: 'Limpio',
  dirty: 'Con cambios pendientes',
  'validation-error': 'Validacion con error',
  saved: 'Guardado correcto',
  'import-conflict': 'Conflicto en importacion'
};

function deriveMaintainerUxState(message, isError) {
  const normalized = String(message || '').toLowerCase();

  if (normalized.includes('conflicto') || normalized.includes('no se pudieron cargar datos')) {
    return 'import-conflict';
  }

  if (normalized.includes('cambios pendientes')) {
    return 'dirty';
  }

  if (normalized.includes('guardado') || normalized.includes('eliminado') || normalized.includes('exportado')) {
    return 'saved';
  }

  if (isError) {
    return 'validation-error';
  }

  return 'clean';
}

function setMaintainerStatus(message, isError) {
  const statusNode = document.getElementById('maintainer-status');
  const uxNode = document.getElementById('maintainer-ux-state');
  const panelNode = document.getElementById('maintainer-panel');
  if (!statusNode) return;

  const uxState = deriveMaintainerUxState(message, isError);

  statusNode.textContent = message;
  statusNode.classList.toggle('error', !!isError);

  if (uxNode) {
    uxNode.textContent = MAINTAINER_UX_LABELS[uxState] || MAINTAINER_UX_LABELS.clean;
    uxNode.setAttribute('data-ux-state', uxState);
  }

  if (panelNode) {
    panelNode.setAttribute('data-ux-state', uxState);
  }
}

function renderStageEditor() {
  const grid = document.getElementById('stage-editor-grid');
  if (!grid || grid.children.length > 0) return;

  STAGE_KEYS.forEach((key) => {
    const label = document.createElement('label');
    label.className = 'field-row stage-row';

    const title = document.createElement('span');
    title.textContent = key.toUpperCase();

    const select = document.createElement('select');
    select.id = `mp-${key}`;

    STAGE_STATES.forEach((state) => {
      const option = document.createElement('option');
      option.value = state;
      option.textContent = `${key.toUpperCase()} - ${state}`;
      select.appendChild(option);
    });

    label.appendChild(title);
    label.appendChild(select);
    grid.appendChild(label);
  });
}

function writeForm(project) {
  const p = sanitizeProject(project || { name: '', rag: 'verde', tasks: [] });
  maintainerController.setDraft(p);
  document.getElementById('mp-name').value = p.name || '';
  document.getElementById('mp-description').value = p.descripcion || '';
  document.getElementById('mp-responsable').value = p.responsable || '';
  document.getElementById('mp-rag').value = p.rag || 'verde';
  refreshMaintainerMasterDetail(p);
}

function readForm() {
  const draft = maintainerController.getState().draft || {};
  const project = {
    ...draft,
    name: document.getElementById('mp-name').value,
    descripcion: document.getElementById('mp-description').value,
    responsable: document.getElementById('mp-responsable').value,
    leader: document.getElementById('mp-responsable').value,
    rag: document.getElementById('mp-rag').value
  };

  STAGE_KEYS.forEach((key) => {
    project[key] = document.getElementById(`mp-${key}`).value;
  });

  return project;
}

function refreshMaintainerSelect() {
  const select = document.getElementById('mp-project-select');
  if (!select) return;

  maintainerController.setProjects(currentProjects);

  select.innerHTML = '';

  const empty = document.createElement('option');
  empty.value = '-1';
  empty.textContent = '[Nuevo proyecto]';
  select.appendChild(empty);

  currentProjects.forEach((project, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = project.name;
    select.appendChild(option);
  });

  if (selectedProjectIndex >= 0 && selectedProjectIndex < currentProjects.length) {
    select.value = String(selectedProjectIndex);
    writeForm(currentProjects[selectedProjectIndex]);
  } else {
    // Esta sincronizacion es interna de UI (no accion directa del usuario),
    // por eso evita el bloqueo de seleccion durante operaciones criticas.
    const snapshot = maintainerController.startNewDraft({ system: true });
    selectedProjectIndex = snapshot.selectedIndex;
    select.value = '-1';
    writeForm(snapshot.draft);
  }

  renderMaintainerProjectList();
}

function saveLocalData(projects) {
  dataProvider.reset(projects);
  localStorage.setItem(DATA_KEY, dataProvider.export());
}

function migrateMarkdownProjectsToPortfolio(projects) {
  const legacyProjects = Array.isArray(projects) ? projects : [];
  legacyProjects.forEach((project) => {
    const created = PortfolioService.createProject(
      project.name,
      project.responsable || project.leader || '',
      project.sponsor || ''
    );

    PortfolioService.updateProject(created.id, {
      rag: normalizeRag(project.rag)
    });
  });

  return PortfolioService.getProjects();
}

function downloadMarkdown() {
  dataProvider.reset(currentProjects);
  const content = dataProvider.export();
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'proyectos.md';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function loadDataCore() {
  try {
    const storageProjects = PortfolioService.getProjects();
    if (storageProjects.length) {
      renderProjects(storageProjects);
      applyActiveFilter();
      setMaintainerStatus('Datos cargados desde almacenamiento local del navegador.', false);
      document.getElementById('error-area').innerHTML = '';

      const now = new Date();
      document.getElementById('last-update').textContent =
        'Actualizado ' + now.toLocaleDateString('es-CL', {day:'numeric', month:'short'}) +
        ' ' + now.toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'});
      return;
    }

    // Migración legacy: si hay datos markdown en el key antiguo, migrarlos
    const legacyMarkdown = localStorage.getItem(DATA_KEY);
    if (legacyMarkdown) {
      const markdownProjects = dataProvider.load(legacyMarkdown);
      if (markdownProjects.length) {
        const migratedProjects = migrateMarkdownProjectsToPortfolio(markdownProjects);
        localStorage.removeItem(DATA_KEY);
        renderProjects(migratedProjects);
        applyActiveFilter();
        setMaintainerStatus('Datos legacy migrados al almacenamiento local.', false);
        document.getElementById('error-area').innerHTML = '';
        const now = new Date();
        document.getElementById('last-update').textContent =
          'Actualizado ' + now.toLocaleDateString('es-CL', {day:'numeric', month:'short'}) +
          ' ' + now.toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'});
        return;
      }
    }

    // Sin datos — sembrar data inicial y renderizar
    seedInitialProjects();
    const seededProjects = PortfolioService.getProjects();
    renderProjects(seededProjects);
    applyActiveFilter();
    setMaintainerStatus('Datos iniciales cargados.', false);
    document.getElementById('error-area').innerHTML = '';
    const nowSeed = new Date();
    document.getElementById('last-update').textContent =
      'Actualizado ' + nowSeed.toLocaleDateString('es-CL', {day:'numeric', month:'short'}) +
      ' ' + nowSeed.toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'});
  } catch(e) {
    document.getElementById('error-area').innerHTML =
      `<div class="error-banner">No se pudo cargar los datos: ${e.message}.</div>`;
    setMaintainerStatus('No se pudieron cargar datos.', true);
  }
}

async function loadData() {
  try {
    // Etapa 2: Inicializar seed si localStorage está vacío
    PortfolioService.ensureInitialized();
    
    await maintainerController.runCriticalOperation('refresh', async () => {
      await loadDataCore();
    });
  } catch (error) {
    setMaintainerStatus(error.message, true);
  }
}

function openMaintainer(idx) {
  var panel = document.getElementById('maintainer-panel');
  if (panel) panel.classList.remove('hidden');
  const desired = (typeof idx === 'number') ? idx : -1;
  try {
    const snapshot = desired >= 0
      ? maintainerController.select(desired)
      : maintainerController.startNewDraft();
    selectedProjectIndex = snapshot.selectedIndex;
  } catch (error) {
    setMaintainerStatus(error.message, true);
    return;
  }
  refreshMaintainerSelect();
  var msg = (selectedProjectIndex >= 0 && selectedProjectIndex < currentProjects.length)
    ? 'Editando: ' + currentProjects[selectedProjectIndex].name
    : 'Nuevo proyecto listo para crear.';
  setMaintainerStatus(msg, false);
}

function projectModelsEqual(left, right) {
  const a = sanitizeProject(left || { name: '', rag: 'verde' });
  const b = sanitizeProject(right || { name: '', rag: 'verde' });

  if (a.name !== b.name) return false;
  if (a.descripcion !== b.descripcion) return false;
  if (a.responsable !== b.responsable) return false;
  if (a.rag !== b.rag) return false;

  return STAGE_KEYS.every((key) => a[key] === b[key]);
}

function setupMaintainerEvents() {
  let baselineProject = sanitizeProject({ name: '', rag: 'verde' });

  const syncBaselineFromForm = () => {
    baselineProject = sanitizeProject(readForm());
  };

  const refreshDirtyState = () => {
    const current = sanitizeProject(readForm());
    const liveErrors = collectProjectValidationErrors(current, {
      existingProjects: currentProjects,
      currentIndex: selectedProjectIndex
    });

    if (liveErrors.length > 0) {
      setMaintainerStatus(liveErrors[0], true);
      return;
    }

    if (projectModelsEqual(current, baselineProject)) {
      setMaintainerStatus('Sin cambios en formulario.', false);
      return;
    }

    setMaintainerStatus('Con cambios pendientes por guardar.', false);
  };

  const toggle = document.getElementById('maintainer-toggle');
  const panel = document.getElementById('maintainer-panel');
  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      if (panel.classList.contains('hidden')) {
        openMaintainer(selectedProjectIndex);
        return;
      }
      panel.classList.add('hidden');
    });
  }

  const mpClose = document.getElementById('mp-close');
  if (mpClose) {
    mpClose.addEventListener('click', () => {
      document.getElementById('maintainer-panel').classList.add('hidden');
    });
  }

  document.getElementById('mp-project-select').addEventListener('change', (event) => {
    const desiredIndex = parseInt(event.target.value, 10);

    try {
      const snapshot = desiredIndex >= 0
        ? maintainerController.select(desiredIndex)
        : maintainerController.startNewDraft();
      selectedProjectIndex = snapshot.selectedIndex;
      writeForm(snapshot.draft);
      syncBaselineFromForm();
      refreshDirtyState();
      if (selectedProjectIndex >= 0 && selectedProjectIndex < currentProjects.length) {
        setMaintainerStatus(`Editando: ${currentProjects[selectedProjectIndex].name}`, false);
      } else {
        setMaintainerStatus('Nuevo proyecto listo para crear.', false);
      }
    } catch (error) {
      setMaintainerStatus(error.message, true);
      event.target.value = String(selectedProjectIndex >= 0 ? selectedProjectIndex : -1);
    }
  });

  document.getElementById('mp-new').addEventListener('click', () => {
    try {
      const snapshot = maintainerController.startNewDraft();
      selectedProjectIndex = snapshot.selectedIndex;
    } catch (error) {
      setMaintainerStatus(error.message, true);
      return;
    }
    refreshMaintainerSelect();
    syncBaselineFromForm();
    setMaintainerStatus('Nuevo proyecto listo para crear.', false);
  });

  document.getElementById('mp-cancel').addEventListener('click', () => {
    refreshMaintainerSelect();
    syncBaselineFromForm();
    refreshDirtyState();
    setMaintainerStatus('Cambios descartados en formulario.', false);
  });

  document.getElementById('mp-save').addEventListener('click', async () => {
    try {
      await maintainerController.runCriticalOperation('save', async () => {
        let next;
        try {
          dataProvider.reset(currentProjects);
          if (selectedProjectIndex >= 0 && selectedProjectIndex < currentProjects.length) {
            dataProvider.update(selectedProjectIndex, readForm());
          } else {
            dataProvider.create(readForm());
          }
          next = dataProvider.refresh();
        } catch (error) {
          setMaintainerStatus(error.message, true);
          return;
        }

        saveLocalData(next);
        renderProjects(next);
        applyActiveFilter();
        const snapshot = maintainerController.startNewDraft({ system: true });
        selectedProjectIndex = snapshot.selectedIndex;
        refreshMaintainerSelect();
        syncBaselineFromForm();
        refreshDirtyState();
        setMaintainerStatus('Proyecto guardado en almacenamiento local.', false);
        document.getElementById('save-success-dialog').classList.remove('hidden');
      });
    } catch (error) {
      setMaintainerStatus(error.message, true);
    }
  });

  document.getElementById('mp-success-continue').addEventListener('click', () => {
    document.getElementById('save-success-dialog').classList.add('hidden');
  });

  document.getElementById('mp-success-exit').addEventListener('click', () => {
    document.getElementById('save-success-dialog').classList.add('hidden');
    document.getElementById('maintainer-panel').classList.add('hidden');
  });

  document.getElementById('mp-form-reset').addEventListener('click', () => {
    try {
      const snapshot = maintainerController.startNewDraft();
      selectedProjectIndex = snapshot.selectedIndex;
    } catch (error) {
      setMaintainerStatus(error.message, true);
      return;
    }
    refreshMaintainerSelect();
    syncBaselineFromForm();
    setMaintainerStatus('Formulario reiniciado.', false);
  });

  document.getElementById('mp-delete').addEventListener('click', async () => {
    try {
      await maintainerController.runCriticalOperation('delete', async () => {
        if (selectedProjectIndex < 0 || selectedProjectIndex >= currentProjects.length) {
          setMaintainerStatus('Selecciona un proyecto para eliminar.', true);
          return;
        }

        const target = currentProjects[selectedProjectIndex];
        if (!window.confirm(`Se eliminará el proyecto "${target.name}". ¿Deseas continuar?`)) {
          return;
        }

        let next;
        try {
          dataProvider.reset(currentProjects);
          dataProvider.remove(selectedProjectIndex);
          next = dataProvider.refresh();
        } catch (error) {
          setMaintainerStatus(error.message, true);
          return;
        }

        const snapshot = maintainerController.startNewDraft({ system: true });
        selectedProjectIndex = snapshot.selectedIndex;
        saveLocalData(next);
        renderProjects(next);
        applyActiveFilter();
        syncBaselineFromForm();
        refreshDirtyState();
        setMaintainerStatus('Proyecto eliminado en almacenamiento local.', false);
      });
    } catch (error) {
      setMaintainerStatus(error.message, true);
    }
  });

  document.getElementById('mp-export').addEventListener('click', () => {
    downloadMarkdown();
    setMaintainerStatus('Exportación completada. Guarda el archivo en el repositorio si deseas persistir los cambios.', false);
  });

  document.getElementById('mp-reset').addEventListener('click', async () => {
    try {
      await maintainerController.runCriticalOperation('reset', async () => {
        const isDirty = !projectModelsEqual(sanitizeProject(readForm()), baselineProject);
        if (isDirty && !window.confirm('Tienes cambios pendientes. ¿Descartar y reiniciar datos?')) {
          setMaintainerStatus('Reinicio cancelado. Se conservaron tus cambios locales.', false);
          return;
        }
        localStorage.removeItem(LocalStorageRepository.STORAGE_KEY);
        localStorage.removeItem(DATA_KEY);
        const snapshot = maintainerController.startNewDraft({ system: true });
        selectedProjectIndex = snapshot.selectedIndex;
        PortfolioService.ensureInitialized();
        await loadDataCore();
        syncBaselineFromForm();
        setMaintainerStatus('Datos reiniciados con valores de ejemplo.', false);
      });
    } catch (error) {
      setMaintainerStatus(error.message, true);
    }
  });

  const dirtyTargets = [
    'mp-name',
    'mp-description',
    'mp-responsable',
    'mp-rag'
  ];

  STAGE_KEYS.forEach((key) => {
    dirtyTargets.push(`mp-${key}`);
  });

  dirtyTargets.forEach((id) => {
    const node = document.getElementById(id);
    if (!node) return;

    node.addEventListener('input', () => {
      refreshMaintainerMasterDetail(readForm());
      refreshDirtyState();
    });
    node.addEventListener('change', () => {
      refreshMaintainerMasterDetail(readForm());
      refreshDirtyState();
    });
  });

  syncBaselineFromForm();
}

function setupGlobalEvents() {
  document.querySelectorAll('.filter-pill').forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.dataset.rag || 'todos', button));
  });

  document.getElementById('refresh-btn').addEventListener('click', () => {
    const uxNode = document.getElementById('maintainer-ux-state');
    const isDirty = uxNode && uxNode.getAttribute('data-ux-state') === 'dirty';
    if (isDirty && !window.confirm('Tienes cambios pendientes. ¿Descartar y recargar?')) {
      return;
    }
    loadData();
  });

  const tableHead = document.querySelector('.table-head');
  if (tableHead) {
    tableHead.addEventListener('dblclick', () => openMaintainer(-1));
  }

  // Tooltip flotante para celdas de fase — position:fixed para escapar del scroll container
  (function setupPhaseCellTooltip() {
    const tip = document.getElementById('floating-tooltip');
    const tableScroll = document.getElementById('progress-table-scroll');
    if (!tip || !tableScroll) return;

    function positionTip(anchor) {
      const rect = anchor.getBoundingClientRect();
      tip.style.display = 'block';
      const tipW = tip.offsetWidth;
      const tipH = tip.offsetHeight;
      let top = rect.top - tipH - 8;
      let left = rect.left + rect.width / 2 - tipW / 2;
      if (left < 4) left = 4;
      if (left + tipW > window.innerWidth - 4) left = window.innerWidth - tipW - 4;
      if (top < 4) top = rect.bottom + 8;
      tip.style.top = top + 'px';
      tip.style.left = left + 'px';
    }

    tableScroll.addEventListener('mouseover', (e) => {
      const wrap = e.target.closest('.bucket-progress-wrap');
      if (!wrap) return;
      const source = wrap.querySelector('.bucket-tooltip');
      if (!source) return;
      tip.innerHTML = source.innerHTML;
      positionTip(wrap);
    });

    tableScroll.addEventListener('mouseout', (e) => {
      const wrap = e.target.closest('.bucket-progress-wrap');
      if (!wrap) return;
      if (!wrap.contains(e.relatedTarget)) {
        tip.style.display = 'none';
      }
    });
  })();
}

function setTableFullscreen(nextState) {
  const wrap = document.getElementById('progress-table-wrap');
  if (!wrap) return;

  isTableFullscreen = !!nextState;
  document.body.classList.toggle('table-fullscreen', isTableFullscreen);
  wrap.classList.toggle('fullscreen-mode', isTableFullscreen);
}

async function exportFullscreenTablePng() {
  if (!isTableFullscreen) return;

  const target = document.getElementById('progress-table-wrap');
  const button = document.getElementById('table-export-png');
  if (!target || !button || !window.html2canvas) return;

  const prevText = button.textContent;
  button.disabled = true;
  button.textContent = 'Generando...';

  try {
    const canvas = await window.html2canvas(target, {
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false
    });

    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `estado-avance-${stamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    document.getElementById('error-area').innerHTML = `<div class="error-banner warning">No se pudo exportar PNG: ${error.message}</div>`;
  } finally {
    button.disabled = false;
    button.textContent = prevText;
  }
}

function setupTableFullscreenEvents() {
  const fsOpen = document.getElementById('table-fs-open');
  const fsExit = document.getElementById('table-fs-exit');
  const exportPng = document.getElementById('table-export-png');

  if (fsOpen) fsOpen.addEventListener('click', () => setTableFullscreen(true));
  if (fsExit) fsExit.addEventListener('click', () => setTableFullscreen(false));
  if (exportPng) exportPng.addEventListener('click', () => exportFullscreenTablePng());

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isTableFullscreen) {
      setTableFullscreen(false);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const loadStart = Date.now();
  function hideLoader() {
    const screen = document.getElementById('loading-screen');
    if (!screen) return;
    const elapsed = Date.now() - loadStart;
    const delay = Math.max(0, 1000 - elapsed);
    setTimeout(function() {
      screen.classList.add('fade-out');
      setTimeout(function() { screen.style.display = 'none'; }, 420);
    }, delay);
  }

  initTheme();
  renderStageEditor();
  setupGlobalEvents();
  setupTableFullscreenEvents();
  setupMaintainerEvents();
  loadData().finally(hideLoader);

  if (window.AOS) {
    AOS.init({ duration: 500, once: true, easing: 'ease-out-cubic' });
  }
  if (window.lucide) {
    lucide.createIcons();
  }
});
