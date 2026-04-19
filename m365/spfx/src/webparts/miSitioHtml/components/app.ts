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

interface IProjectData {
  name: string;
  responsable?: string;
  rag?: string;
  [key: string]: string | undefined;
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
      projects.push(project);
    }
  });

  return projects;
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
    const states = Object.keys(STAGE_LABELS).map((key) => (project[key] || 'pendiente').toLowerCase());

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
    row.dataset.rag = project.rag || 'verde';

    const phasesHTML = PHASE_STAGES.map((keys) =>
      `<div class="phase-cell">${keys.map((key) => stageHTML(key, project[key] || 'pendiente')).join('')}</div>`
    ).join('');

    row.innerHTML = `
      <div class="proj-info">
        <div class="proj-name-row">
          <div class="rag-dot rag-${project.rag || 'verde'}"></div>
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

function showError(wrapper: HTMLElement, message: string): void {
  const area = wrapper.querySelector<HTMLElement>('#error-area');
  if (!area) {
    return;
  }

  area.innerHTML = `<div class="error-banner">${message}</div>`;
}

export function initApp(container: HTMLElement): void {
  const wrapper = container.querySelector<HTMLElement>('.mi-sitio-wrapper');
  if (!wrapper) {
    return;
  }

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

  const reloadButton = wrapper.querySelector<HTMLElement>('#refresh-btn');
  if (reloadButton) {
    reloadButton.addEventListener('click', () => {
      const projects = parseMarkdown(projectsMarkdown);
      renderProjects(wrapper, projects);
      setLastUpdate(wrapper);
    });
  }

  try {
    const projects = parseMarkdown(projectsMarkdown);

    if (!projects.length) {
      throw new Error('No se encontraron proyectos en el archivo local empaquetado.');
    }

    renderProjects(wrapper, projects);
    setLastUpdate(wrapper);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado al cargar datos.';
    showError(wrapper, `No se pudo cargar la data: ${message}`);
  }
}
