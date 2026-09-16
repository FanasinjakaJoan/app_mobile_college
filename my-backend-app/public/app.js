/* Browser mirror of the Flutter course-list state machine:
   idle -> loading -> success | empty | error (with retry + refresh). */
'use strict';

const view = document.getElementById('view');
const refreshBtn = document.getElementById('refresh-btn');

const state = {
  status: 'idle', // idle | loading | success | empty | error
  courses: [],
  error: '',
  lastUpdated: null,
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

const bookIcon =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';
const clockIcon =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>';

function render() {
  refreshBtn.disabled = state.status === 'loading';

  if (state.status === 'loading' || state.status === 'idle') {
    view.innerHTML = document.getElementById('tpl-loading').innerHTML;
    return;
  }

  if (state.status === 'error') {
    view.innerHTML = document.getElementById('tpl-error').innerHTML;
    document.getElementById('error-message').textContent = state.error;
    document.getElementById('retry-btn').addEventListener('click', load);
    return;
  }

  if (state.status === 'empty') {
    view.innerHTML = document.getElementById('tpl-empty').innerHTML;
    document.getElementById('empty-refresh-btn').addEventListener('click', load);
    return;
  }

  const time = state.lastUpdated
    ? ` · Actualisé à ${state.lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : '';
  const cards = state.courses
    .map((course) => {
      const schedule = course.schedule
        ? `<p class="schedule">${clockIcon}<span>${escapeHtml(course.schedule)}</span></p>`
        : '';
      return `<article class="card">
        <div class="card-top">
          <span class="chip">${escapeHtml(course.code)}</span>
          <span class="credits">${bookIcon}${escapeHtml(course.credits)} crédits</span>
        </div>
        <h3>${escapeHtml(course.title)}</h3>
        <p class="professor">${escapeHtml(course.professor)}</p>
        ${schedule}
      </article>`;
    })
    .join('');

  view.innerHTML =
    `<p class="summary">${state.courses.length} cours${escapeHtml(time)}</p>` +
    `<div class="grid">${cards}</div>`;
}

async function load() {
  state.status = 'loading';
  render();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const response = await fetch('/api/courses', {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`Le serveur a répondu ${response.status}.`);

    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : payload.data;
    if (!Array.isArray(items)) throw new Error('Réponse inattendue du serveur.');

    state.courses = items;
    state.lastUpdated = new Date();
    state.status = items.length > 0 ? 'success' : 'empty';
  } catch (err) {
    state.error =
      err.name === 'AbortError'
        ? 'Le serveur met trop de temps à répondre. Réessayez.'
        : 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    state.status = 'error';
  }
  render();
}

refreshBtn.addEventListener('click', load);
load();
