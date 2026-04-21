import projectsMarkdown from './assets/proyectos.md';

const THEME_KEY = 'pm-report-theme';

const STAGE_LABELS: Record<string, string> = {
  e1: 'Etapa 1 - Ficha de Proyecto',
  e2: 'Etapa 2 - Aprobacion de Sponsor',
  e3: 'Etapa 3 - Requerimientos Funcionales',
  e4: 'Etapa 4 - Requerimientos Tecnicos',
  e5: 'Etapa 5 - Cotizacion y Proveedor',
  e6: 'Etapa 6 - Kick Off',
  e7: 'Etapa 7 - Iteracion y Seguimiento',
  e8: 'Etapa 8 - Pruebas',
  e9: 'Etapa 9 - Marcha Blanca',
  e10: 'Etapa 10 - Entrega y Cierre Formal'
};

const PHASE_STAGES: string[][] = [['e1', 'e2'], ['e3', 'e4', 'e5'], ['e6', 'e7', 'e8', 'e9'], ['e10']];
const STAGE_KEYS = Object.keys(STAGE_LABELS);
const STAGE_STATE_OPTIONS = ['completado', 'en-curso', 'pendiente', 'bloqueado'];
const RAG_OPTIONS = ['verde', 'ambar', 'rojo'];

type MaintainerUxState = 'clean' | 'dirty' | 'validation-error' | 'saved' | 'import-conflict';

const UX_STATE_LABELS: Record<MaintainerUxState, string> = {
  clean: 'Limpio',
  dirty: 'Con cambios pendientes',
  'validation-error': 'Validacion con error',
  saved: 'Guardado correcto',
  'import-conflict': 'Conflicto en importacion'
};

const MARKDOWN_HEADER = `# Portafolio TI 2026 - Grupo EBI
# Fuente de datos del tablero de proyectos
# Editar desde el mantenedor del WebPart o manualmente.
`;

export interface IMarkdownDataProvider {
  loadRemoteMarkdown: () => Promise<{ content: string; etag: string }>;
  saveRemoteMarkdown: (content: string, etag: string) => Promise<string>;
  editorEnabled: boolean;
  remotePathLabel: string;
}

interface IProjectData {
  name: string;
  descripcion?: string;
  responsable?: string;
  rag?: string;
  [key: string]: string | undefined;
}

type PlannerTaskStatus = 'notStarted' | 'inProgress' | 'completed';

interface IPlannerProviderConfig {
  tenantId?: string;
  groupId?: string;
  planId?: string;
}

interface IPlannerTaskModel {
  id: string;
  title: string;
  stageKey: string;
  percentComplete: number;
  status: PlannerTaskStatus;
}

interface IPlannerProjectSnapshot {
  planId: string;
  planTitle: string;
  groupId: string;
  projectName: string;
  rag: string;
  stages: Record<string, string>;
  tasks: IPlannerTaskModel[];
}

export interface IPlannerDataProviderContract {
  source: 'planner';
  config: IPlannerProviderConfig;
  loadPlannerSnapshots: () => Promise<IPlannerProjectSnapshot[]>;
  setProjectCollection: (projects: IProjectData[]) => Promise<IProjectData[]>;
  getProjectCollection: () => Promise<IProjectData[]>;
  createProject: (project: IProjectData) => Promise<IProjectData>;
  updateProject: (index: number, project: IProjectData) => Promise<IProjectData>;
  removeProject: (index: number) => Promise<IProjectData>;
}

const PLANNER_CONTRACT_RULES: string[] = [
  'No llamar Graph/Planner en esta iteracion; contrato y mapeos son de diseno.',
  'El nombre de proyecto debe ser estable para mapear planTitle/projectName.',
  'Las etapas deben usar solo estados permitidos: completado, en-curso, pendiente, bloqueado.',
  'Los IDs de tasks deben ser estables por etapa para soportar sincronizacion incremental futura.'
];

function mapStageStateToTaskStatus(state: string): PlannerTaskStatus {
  if (state === 'completado') {
    return 'completed';
  }

  if (state === 'en-curso' || state === 'bloqueado') {
    return 'inProgress';
  }

  return 'notStarted';
}

function mapStageStateToPercent(state: string): number {
  if (state === 'completado') {
    return 100;
  }

  if (state === 'en-curso') {
    return 50;
  }

  return 0;
}

export function mapProjectToPlannerSnapshot(
  project: IProjectData,
  config: IPlannerProviderConfig = {}
): IPlannerProjectSnapshot {
  const normalized = sanitizeProject(project);
  const stages: Record<string, string> = {};
  const tasks: IPlannerTaskModel[] = [];

  STAGE_KEYS.forEach((stageKey) => {
    const state = normalizeStageState(normalized[stageKey]);
    stages[stageKey] = state;

    tasks.push({
      id: `${normalized.name || 'project'}-${stageKey}`,
      title: STAGE_LABELS[stageKey] || stageKey,
      stageKey,
      percentComplete: mapStageStateToPercent(state),
      status: mapStageStateToTaskStatus(state)
    });
  });

  return {
    planId: config.planId || '',
    planTitle: normalized.name,
    groupId: config.groupId || '',
    projectName: normalized.name,
    rag: normalizeRag(normalized.rag),
    stages,
    tasks
  };
}

export function mapPlannerSnapshotToProject(snapshot: IPlannerProjectSnapshot): IProjectData {
  const source = snapshot || ({
    projectName: '',
    planTitle: '',
    rag: 'verde',
    stages: {}
  } as IPlannerProjectSnapshot);

  const draft: IProjectData = {
    name: (source.projectName || source.planTitle || '').trim(),
    descripcion: '',
    responsable: '',
    rag: normalizeRag(source.rag)
  };

  STAGE_KEYS.forEach((stageKey) => {
    const next = source.stages && source.stages[stageKey] ? source.stages[stageKey] : 'pendiente';
    draft[stageKey] = normalizeStageState(next);
  });

  return sanitizeProject(draft);
}

export function validatePlannerSnapshotContract(snapshot: IPlannerProjectSnapshot): string[] {
  const issues: string[] = [];
  const src = snapshot;

  if (!src || !src.projectName || !src.projectName.trim()) {
    issues.push('projectName es obligatorio para mantener identidad con ProjectModel.name.');
  }

  if (!src || !src.planTitle || !src.planTitle.trim()) {
    issues.push('planTitle es obligatorio para consistencia con Planner.');
  }

  const stageKeys = src && src.stages ? Object.keys(src.stages) : [];
  if (!stageKeys.length) {
    issues.push('stages no puede estar vacio; debe incluir el mapa de etapas canonicas.');
  }

  STAGE_KEYS.forEach((stageKey) => {
    if (!src || !src.stages || !src.stages[stageKey]) {
      issues.push(`Falta stage requerido: ${stageKey}.`);
      return;
    }

    const stageState = normalizeStageState(src.stages[stageKey]);
    if (stageState !== src.stages[stageKey]) {
      issues.push(`Valor no canonico en ${stageKey}: ${src.stages[stageKey]}.`);
    }
  });

  const seenIds: Record<string, boolean> = {};
  const taskList = src && Array.isArray(src.tasks) ? src.tasks : [];
  taskList.forEach((task) => {
    if (!task.id) {
      issues.push('Task sin id estable detectada.');
      return;
    }

    if (seenIds[task.id]) {
      issues.push(`Task id duplicado: ${task.id}.`);
      return;
    }

    seenIds[task.id] = true;
  });

  return issues;
}

export function createPlannerDataProviderContract(config: IPlannerProviderConfig = {}): IPlannerDataProviderContract {
  const notImplemented = async (): Promise<never> => {
    throw new Error('PlannerDataProvider no implementado en esta iteracion.');
  };

  return {
    source: 'planner',
    config,
    loadPlannerSnapshots: notImplemented,
    setProjectCollection: notImplemented,
    getProjectCollection: notImplemented,
    createProject: notImplemented,
    updateProject: notImplemented,
    removeProject: notImplemented
  };
}

export function getPlannerContractRules(): string[] {
  return PLANNER_CONTRACT_RULES.slice();
}

function normalizeRag(value: string | undefined): string {
  const normalized = (value || '').toLowerCase().trim();
  return RAG_OPTIONS.indexOf(normalized) >= 0 ? normalized : 'verde';
}

function normalizeStageState(value: string | undefined): string {
  const normalized = (value || '').toLowerCase().trim();
  return STAGE_STATE_OPTIONS.indexOf(normalized) >= 0 ? normalized : 'pendiente';
}

function sanitizeProject(project: IProjectData): IProjectData {
  const normalized: IProjectData = {
    name: (project.name || '').trim(),
    descripcion: (project.descripcion || '').trim(),
    responsable: (project.responsable || '').trim(),
    rag: normalizeRag(project.rag)
  };

  STAGE_KEYS.forEach((stageKey) => {
    normalized[stageKey] = normalizeStageState(project[stageKey]);
  });

  return normalized;
}

function projectEquals(left: IProjectData, right: IProjectData): boolean {
  const normalizedLeft = sanitizeProject(left);
  const normalizedRight = sanitizeProject(right);

  if (
    normalizedLeft.name !== normalizedRight.name ||
    normalizedLeft.descripcion !== normalizedRight.descripcion ||
    normalizedLeft.responsable !== normalizedRight.responsable ||
    normalizedLeft.rag !== normalizedRight.rag
  ) {
    return false;
  }

  for (const stageKey of STAGE_KEYS) {
    if (normalizedLeft[stageKey] !== normalizedRight[stageKey]) {
      return false;
    }
  }

  return true;
}

function setTheme(wrapper: HTMLElement, theme: string): void {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  wrapper.setAttribute('data-theme', nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);

  const label = wrapper.querySelector<HTMLElement>('#theme-toggle-label');
  if (label) {
    label.textContent = nextTheme === 'dark' ? 'Modo claro' : 'Modo oscuro';
  }
}

function parseMarkdown(text: string): IProjectData[] {
  const projects: IProjectData[] = [];
  const blocks = text.split(/^## proyecto:/im).slice(1);

  blocks.forEach((block) => {
    const lines = block.trim().split('\n');
    const name = lines[0].trim();
    const project: IProjectData = { name };

    lines.slice(1).forEach((line) => {
      const match = line.match(/^(\w+):\s*(.+)/);
      if (match) {
        project[match[1].trim().toLowerCase()] = match[2].trim();
      }
    });

    if (name) {
      projects.push(sanitizeProject(project));
    }
  });

  return projects;
}

function serializeMarkdown(projects: IProjectData[]): string {
  const lines: string[] = [MARKDOWN_HEADER.trim(), ''];

  projects.forEach((project) => {
    const normalized = sanitizeProject(project);
    lines.push(`## proyecto: ${normalized.name}`);
    lines.push(`descripcion: ${normalized.descripcion || '-'}`);
    lines.push(`responsable: ${normalized.responsable || '-'}`);
    lines.push(`rag: ${normalized.rag || 'verde'}`);

    STAGE_KEYS.forEach((stageKey) => {
      lines.push(`${stageKey}: ${normalized[stageKey] || 'pendiente'}`);
    });

    lines.push('');
  });

  return `${lines.join('\n').trim()}\n`;
}

function stageHTML(key: string, state: string): string {
  const label = STAGE_LABELS[key] || key;
  const stateLabel = ({
    completado: 'Completado',
    'en-curso': 'En curso',
    pendiente: 'Pendiente',
    bloqueado: 'Bloqueado'
  } as Record<string, string>)[state] || state;

  const num = key.replace('e', '');

  return `
    <div class="stage-wrap">
      <div class="stage-dot ${state}">${num}</div>
      <div class="stage-tooltip"><strong>${label}</strong><br>${stateLabel}</div>
    </div>`;
}

function renderProjects(wrapper: HTMLElement, projects: IProjectData[]): void {
  const container = wrapper.querySelector<HTMLElement>('#proj-rows');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  let completed = 0;
  let inProgress = 0;
  let blocked = 0;

  projects.forEach((project) => {
    const states = STAGE_KEYS.map((key) => normalizeStageState(project[key]));

    if (states.some((state) => state === 'bloqueado')) {
      blocked += 1;
    } else if (states.every((state) => state === 'completado')) {
      completed += 1;
    } else {
      inProgress += 1;
    }
  });

  const totalNode = wrapper.querySelector<HTMLElement>('#m-total');
  const completedNode = wrapper.querySelector<HTMLElement>('#m-completado');
  const inProgressNode = wrapper.querySelector<HTMLElement>('#m-encurso');
  const blockedNode = wrapper.querySelector<HTMLElement>('#m-bloqueado');

  if (totalNode) totalNode.textContent = String(projects.length);
  if (completedNode) completedNode.textContent = String(completed);
  if (inProgressNode) inProgressNode.textContent = String(inProgress);
  if (blockedNode) blockedNode.textContent = String(blocked);

  projects.forEach((project) => {
    const row = document.createElement('div');
    row.className = 'proj-row';
    row.dataset.rag = normalizeRag(project.rag);

    const phasesHTML = PHASE_STAGES.map((keys) =>
      `<div class="phase-cell">${keys.map((key) => stageHTML(key, normalizeStageState(project[key]))).join('')}</div>`
    ).join('');

    row.innerHTML = `
      <div class="proj-info">
        <div class="proj-name-row">
          <div class="rag-dot rag-${normalizeRag(project.rag)}"></div>
          <span class="proj-name">${project.name}</span>
        </div>
        <div class="proj-resp">${project.responsable || ''}</div>
      </div>
      <div class="phases-grid">${phasesHTML}</div>`;

    container.appendChild(row);
  });
}

function applyFilter(wrapper: HTMLElement, rag: string, sourceButton: HTMLElement): void {
  wrapper.querySelectorAll<HTMLElement>('.filter-pill').forEach((button) => {
    button.classList.remove('active');
  });

  sourceButton.classList.add('active');

  wrapper.querySelectorAll<HTMLElement>('.proj-row').forEach((row) => {
    const rowRag = row.dataset.rag || 'verde';
    const shouldHide = rag !== 'todos' && rowRag !== rag;
    row.classList.toggle('hidden', shouldHide);
  });
}

function applyCurrentFilter(wrapper: HTMLElement): void {
  const active = wrapper.querySelector<HTMLElement>('.filter-pill.active');
  if (!active) {
    return;
  }

  applyFilter(wrapper, active.dataset.rag || 'todos', active);
}

function setLastUpdate(wrapper: HTMLElement): void {
  const node = wrapper.querySelector<HTMLElement>('#last-update');
  if (!node) {
    return;
  }

  const now = new Date();
  node.textContent =
    'Actualizado ' + now.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) +
    ' ' + now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function showBanner(wrapper: HTMLElement, message: string, type: 'error' | 'warn'): void {
  const area = wrapper.querySelector<HTMLElement>('#error-area');
  if (!area) {
    return;
  }

  area.innerHTML = `<div class="error-banner ${type === 'warn' ? 'warning' : ''}">${message}</div>`;
}

function clearBanner(wrapper: HTMLElement): void {
  const area = wrapper.querySelector<HTMLElement>('#error-area');
  if (!area) {
    return;
  }

  area.innerHTML = '';
}

function renderStageEditor(wrapper: HTMLElement): void {
  const grid = wrapper.querySelector<HTMLElement>('#stage-editor-grid');
  if (!grid || grid.children.length > 0) {
    return;
  }

  STAGE_KEYS.forEach((stageKey) => {
    const field = document.createElement('label');
    field.className = 'field-row stage-row';

    const title = document.createElement('span');
    title.textContent = stageKey.toUpperCase();

    const select = document.createElement('select');
    select.id = `mp-${stageKey}`;

    STAGE_STATE_OPTIONS.forEach((stateOption) => {
      const option = document.createElement('option');
      option.value = stateOption;
      option.textContent = `${stageKey.toUpperCase()} - ${stateOption}`;
      select.appendChild(option);
    });

    field.appendChild(title);
    field.appendChild(select);
    grid.appendChild(field);
  });
}

function readProjectForm(wrapper: HTMLElement): IProjectData {
  const getValue = (selector: string): string => {
    const node = wrapper.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector);
    return node && typeof node.value === 'string' ? node.value.trim() : '';
  };

  const project: IProjectData = {
    name: getValue('#mp-name'),
    descripcion: getValue('#mp-description'),
    responsable: getValue('#mp-responsable'),
    rag: getValue('#mp-rag')
  };

  STAGE_KEYS.forEach((stageKey) => {
    project[stageKey] = getValue(`#mp-${stageKey}`);
  });

  return sanitizeProject(project);
}

function writeProjectForm(wrapper: HTMLElement, project: IProjectData): void {
  const safe = sanitizeProject(project);

  const setValue = (selector: string, value: string): void => {
    const node = wrapper.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector);
    if (node) {
      node.value = value;
    }
  };

  setValue('#mp-name', safe.name || '');
  setValue('#mp-description', safe.descripcion || '');
  setValue('#mp-responsable', safe.responsable || '');
  setValue('#mp-rag', safe.rag || 'verde');

  STAGE_KEYS.forEach((stageKey) => {
    setValue(`#mp-${stageKey}`, safe[stageKey] || 'pendiente');
  });
}

function setMaintainerStatus(wrapper: HTMLElement, message: string, isError: boolean): void {
  const statusNode = wrapper.querySelector<HTMLElement>('#maintainer-status');
  const stateNode = wrapper.querySelector<HTMLElement>('#maintainer-ux-state');
  const panel = wrapper.querySelector<HTMLElement>('#maintainer-panel');

  let uxState: MaintainerUxState = 'clean';
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.indexOf('conflicto') >= 0) {
    uxState = 'import-conflict';
  } else if (normalizedMessage.indexOf('guardad') >= 0 || normalizedMessage.indexOf('eliminad') >= 0) {
    uxState = 'saved';
  } else if (normalizedMessage.indexOf('cambios pendientes') >= 0) {
    uxState = 'dirty';
  } else if (isError) {
    uxState = 'validation-error';
  }

  if (!statusNode) {
    return;
  }

  statusNode.textContent = message;
  statusNode.classList.toggle('error', isError);

  if (stateNode) {
    stateNode.textContent = UX_STATE_LABELS[uxState];
    stateNode.setAttribute('data-ux-state', uxState);
  }

  if (panel) {
    panel.setAttribute('data-ux-state', uxState);
  }
}

export function initApp(container: HTMLElement, dataProvider: IMarkdownDataProvider): void {
  const wrapper = container.querySelector<HTMLElement>('.mi-sitio-wrapper');
  if (!wrapper) {
    return;
  }

  let currentProjects: IProjectData[] = [];
  let currentEtag = '*';
  let selectedProjectIndex = -1;
  let baselineProject: IProjectData = sanitizeProject({
    name: '',
    descripcion: '',
    responsable: '',
    rag: 'verde'
  });

  const maintainerPanel = wrapper.querySelector<HTMLElement>('#maintainer-panel');
  const maintainerToggle = wrapper.querySelector<HTMLElement>('#maintainer-toggle');
  const projectSelect = wrapper.querySelector<HTMLSelectElement>('#mp-project-select');
  const remotePathLabel = wrapper.querySelector<HTMLElement>('#remote-path-label');

  renderStageEditor(wrapper);

  if (remotePathLabel) {
    remotePathLabel.textContent = dataProvider.remotePathLabel;
  }

  const refreshMaintainerSelector = (): void => {
    if (!projectSelect) {
      return;
    }

    projectSelect.innerHTML = '';

    const newOption = document.createElement('option');
    newOption.value = '-1';
    newOption.textContent = '[Nuevo proyecto]';
    projectSelect.appendChild(newOption);

    currentProjects.forEach((project, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = project.name;
      projectSelect.appendChild(option);
    });

    if (selectedProjectIndex >= 0 && selectedProjectIndex < currentProjects.length) {
      projectSelect.value = String(selectedProjectIndex);
      writeProjectForm(wrapper, currentProjects[selectedProjectIndex]);
      baselineProject = sanitizeProject(currentProjects[selectedProjectIndex]);
    } else {
      selectedProjectIndex = -1;
      projectSelect.value = '-1';
      writeProjectForm(wrapper, {
        name: '',
        descripcion: '',
        responsable: '',
        rag: 'verde'
      });
      baselineProject = sanitizeProject({
        name: '',
        descripcion: '',
        responsable: '',
        rag: 'verde'
      });
    }
  };

  const refreshDirtyState = (): void => {
    const current = readProjectForm(wrapper);

    if (projectEquals(current, baselineProject)) {
      setMaintainerStatus(wrapper, 'Limpio: sin cambios pendientes.', false);
      return;
    }

    setMaintainerStatus(wrapper, 'Con cambios pendientes por guardar.', false);
  };

  const loadProjects = async (showFallbackWarning: boolean): Promise<void> => {
    try {
      const remote = await dataProvider.loadRemoteMarkdown();
      const parsed = parseMarkdown(remote.content);

      if (!parsed.length) {
        throw new Error('El archivo remoto no contiene proyectos validos.');
      }

      currentProjects = parsed;
      currentEtag = remote.etag || '*';
      renderProjects(wrapper, currentProjects);
      applyCurrentFilter(wrapper);
      refreshMaintainerSelector();
      setLastUpdate(wrapper);
      clearBanner(wrapper);
      setMaintainerStatus(wrapper, 'Datos cargados desde archivo remoto.', false);
      refreshDirtyState();
    } catch (error) {
      currentProjects = parseMarkdown(projectsMarkdown);
      currentEtag = '*';
      renderProjects(wrapper, currentProjects);
      applyCurrentFilter(wrapper);
      refreshMaintainerSelector();
      setLastUpdate(wrapper);

      if (showFallbackWarning) {
        const message = error instanceof Error ? error.message : 'Error inesperado';
        showBanner(
          wrapper,
          `No se pudo cargar el origen remoto. Se uso el archivo local empaquetado. Detalle: ${message}`,
          'warn'
        );
      }

      setMaintainerStatus(wrapper, 'Conflicto en importacion: modo contingencia con datos locales.', true);
      refreshDirtyState();
    }
  };

  const saveProjects = async (): Promise<void> => {
    if (!dataProvider.editorEnabled) {
      setMaintainerStatus(wrapper, 'El mantenedor esta deshabilitado por configuracion.', true);
      return;
    }

    const draft = readProjectForm(wrapper);

    if (!draft.name) {
      setMaintainerStatus(wrapper, 'El nombre del proyecto es obligatorio.', true);
      return;
    }

    let duplicateIndex = -1;
    for (let i = 0; i < currentProjects.length; i += 1) {
      if (i === selectedProjectIndex) {
        continue;
      }

      if (currentProjects[i].name.toLowerCase() === draft.name.toLowerCase()) {
        duplicateIndex = i;
        break;
      }
    }

    if (duplicateIndex >= 0) {
      setMaintainerStatus(wrapper, 'Ya existe otro proyecto con ese nombre.', true);
      return;
    }

    const nextProjects = currentProjects.slice();
    const safeDraft = sanitizeProject(draft);

    if (selectedProjectIndex >= 0 && selectedProjectIndex < nextProjects.length) {
      nextProjects[selectedProjectIndex] = safeDraft;
    } else {
      nextProjects.push(safeDraft);
      selectedProjectIndex = nextProjects.length - 1;
    }

    try {
      const markdown = serializeMarkdown(nextProjects);
      const newEtag = await dataProvider.saveRemoteMarkdown(markdown, currentEtag);
      currentProjects = nextProjects;
      currentEtag = newEtag || '*';
      renderProjects(wrapper, currentProjects);
      applyCurrentFilter(wrapper);
      refreshMaintainerSelector();
      baselineProject = sanitizeProject(safeDraft);
      setLastUpdate(wrapper);
      clearBanner(wrapper);
      setMaintainerStatus(wrapper, 'Cambios guardados correctamente.', false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar.';
      setMaintainerStatus(wrapper, message, true);
    }
  };

  const deleteProject = async (): Promise<void> => {
    if (selectedProjectIndex < 0 || selectedProjectIndex >= currentProjects.length) {
      setMaintainerStatus(wrapper, 'Selecciona un proyecto para eliminar.', true);
      return;
    }

    const selected = currentProjects[selectedProjectIndex];
    const confirmed = window.confirm(`Se eliminara el proyecto "${selected.name}". Deseas continuar?`);
    if (!confirmed) {
      return;
    }

    const nextProjects = currentProjects.filter((_, index) => index !== selectedProjectIndex);

    try {
      const markdown = serializeMarkdown(nextProjects);
      const newEtag = await dataProvider.saveRemoteMarkdown(markdown, currentEtag);
      currentProjects = nextProjects;
      currentEtag = newEtag || '*';
      selectedProjectIndex = -1;
      renderProjects(wrapper, currentProjects);
      applyCurrentFilter(wrapper);
      refreshMaintainerSelector();
      setLastUpdate(wrapper);
      clearBanner(wrapper);
      setMaintainerStatus(wrapper, 'Proyecto eliminado.', false);
      refreshDirtyState();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar.';
      setMaintainerStatus(wrapper, message, true);
    }
  };

  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  setTheme(wrapper, savedTheme);

  const toggle = wrapper.querySelector<HTMLElement>('#theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const currentTheme = wrapper.getAttribute('data-theme');
      setTheme(wrapper, currentTheme === 'dark' ? 'light' : 'dark');
    });
  }

  wrapper.querySelectorAll<HTMLElement>('.filter-pill').forEach((button) => {
    button.addEventListener('click', () => {
      const rag = button.dataset.rag || 'todos';
      applyFilter(wrapper, rag, button);
    });
  });

  if (maintainerToggle && maintainerPanel) {
    if (!dataProvider.editorEnabled) {
      maintainerToggle.classList.add('disabled');
      maintainerToggle.setAttribute('disabled', 'true');
      maintainerToggle.title = 'Habilita el mantenedor en el panel de propiedades del WebPart.';
    }

    maintainerToggle.addEventListener('click', () => {
      maintainerPanel.classList.toggle('hidden');
    });
  }

  if (projectSelect) {
    projectSelect.addEventListener('change', () => {
      selectedProjectIndex = parseInt(projectSelect.value, 10);

      if (selectedProjectIndex >= 0 && selectedProjectIndex < currentProjects.length) {
        writeProjectForm(wrapper, currentProjects[selectedProjectIndex]);
        baselineProject = sanitizeProject(currentProjects[selectedProjectIndex]);
        setMaintainerStatus(wrapper, `Editando: ${currentProjects[selectedProjectIndex].name}`, false);
      } else {
        selectedProjectIndex = -1;
        writeProjectForm(wrapper, {
          name: '',
          descripcion: '',
          responsable: '',
          rag: 'verde'
        });
        baselineProject = sanitizeProject({
          name: '',
          descripcion: '',
          responsable: '',
          rag: 'verde'
        });
        setMaintainerStatus(wrapper, 'Nuevo proyecto listo para crear.', false);
      }

      refreshDirtyState();
    });
  }

  const reloadButton = wrapper.querySelector<HTMLElement>('#refresh-btn');
  if (reloadButton) {
    reloadButton.addEventListener('click', () => {
      loadProjects(true);
    });
  }

  const newButton = wrapper.querySelector<HTMLElement>('#mp-new');
  if (newButton) {
    newButton.addEventListener('click', () => {
      selectedProjectIndex = -1;
      refreshMaintainerSelector();
      setMaintainerStatus(wrapper, 'Nuevo proyecto listo para crear.', false);
      refreshDirtyState();
    });
  }

  const cancelButton = wrapper.querySelector<HTMLElement>('#mp-cancel');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      refreshMaintainerSelector();
      setMaintainerStatus(wrapper, 'Cambios descartados en formulario.', false);
      refreshDirtyState();
    });
  }

  const saveButton = wrapper.querySelector<HTMLElement>('#mp-save');
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      saveProjects();
    });
  }

  const deleteButton = wrapper.querySelector<HTMLElement>('#mp-delete');
  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      deleteProject();
    });
  }

  wrapper.querySelectorAll<HTMLElement>('#maintainer-panel input, #maintainer-panel textarea, #maintainer-panel select').forEach((field) => {
    field.addEventListener('input', () => {
      refreshDirtyState();
    });

    field.addEventListener('change', () => {
      refreshDirtyState();
    });
  });

  loadProjects(false);
}