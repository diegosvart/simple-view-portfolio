const { STAGE_KEYS } = require('./constants');
const { normalizeStage } = require('./validation');

function computeProjectMetrics(projects) {
  const list = Array.isArray(projects) ? projects : [];
  let completado = 0;
  let enCurso = 0;
  let bloqueado = 0;

  list.forEach((project) => {
    const states = STAGE_KEYS.map((stageKey) => normalizeStage(project && project[stageKey]));

    if (states.some((state) => state === 'bloqueado')) {
      bloqueado += 1;
      return;
    }

    if (states.every((state) => state === 'completado')) {
      completado += 1;
      return;
    }

    enCurso += 1;
  });

  return {
    total: list.length,
    completado,
    enCurso,
    bloqueado
  };
}

function summarizeBucket(tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  const total = list.length;
  let completed = 0;

  list.forEach((task) => {
    if (task && task.completed) {
      completed += 1;
    }
  });

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
}

function getBucketLevel(summary) {
  if (!summary || !summary.total) {
    return 'level-gray';
  }

  if (summary.percent >= 80) {
    return 'level-green';
  }

  if (summary.percent >= 40) {
    return 'level-amber';
  }

  if (summary.percent > 0) {
    return 'level-red';
  }

  return 'level-gray';
}

module.exports = {
  computeProjectMetrics,
  summarizeBucket,
  getBucketLevel
};
