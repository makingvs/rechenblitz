import { app, go } from '../state.js';
import { PATH } from '../strategies/index.js';
import { MODULES } from '../tasks/modules.js';
import { currentStrategy, mastery } from '../adaptive.js';
import { sessionMinutes } from '../session.js';
import { game, levelInfo, currentStreak } from '../gamify.js';
import { esc, fmtSec } from '../util.js';

export function renderMenu(root) {
  const { profile, progress } = app;
  if (!profile) return go('profiles');
  const focus = currentStrategy(profile, progress);
  const last = progress.sessions[progress.sessions.length - 1];
  const g = game(progress);
  const li = levelInfo(g.xp);
  const streak = currentStreak(progress);

  root.innerHTML = `
    <div class="page">
      <header class="page-head">
        <span class="avatar small">${profile.avatar}</span>
        <h1>Hallo ${esc(profile.name)}!</h1>
        <button class="btn btn-ghost" data-act="switch">Wechseln</button>
      </header>

      <button class="card game-card menu-game" data-act="sammlung">
        <span class="xp-line">
          <span class="level-chip">Level ${li.level}</span>
          <span class="level-title">${esc(li.title)}</span>
          <span class="menu-chips">
            <span class="chip">📅 ${streak} ${streak === 1 ? 'Tag' : 'Tage'}</span>
            <span class="chip">⭐ ${g.totalStars}</span>
            <span class="chip">🏅 ${Object.keys(g.badges).length}</span>
            <span class="chip">📒 ${new Set(g.stickers).size}</span>
          </span>
        </span>
        <span class="xp-bar"><span style="width:${Math.round(li.pct * 100)}%"></span></span>
        <span class="muted">Meine Sammlung ansehen ➜</span>
      </button>

      <button class="start-card" data-act="start">
        <span class="start-play">▶</span>
        <span>
          <span class="start-title">Heute üben</span>
          <span class="start-sub">${sessionMinutes()} Minuten · heute: ${focus.icon} ${esc(focus.title)}</span>
        </span>
      </button>
      ${last ? `<p class="last-line">Letztes Mal: ⭐ ${last.stars} Sterne · ${last.tempo.medianMs ? fmtSec(last.tempo.medianMs) + ' pro Aufgabe' : ''}${last.success ? ' · 🏆' : ''}</p>` : ''}

      <h2 class="section-title">Freies Üben</h2>
      <div class="tile-grid">
        ${PATH.map(s => {
          const open = profile.unlocked.includes(s.id);
          const m = Math.round(mastery(progress, s.id) * 100);
          return `
          <button class="tile ${open ? '' : 'locked'}" data-sid="${s.id}" ${open ? '' : 'disabled'} style="--accent:${s.color}">
            <span class="tile-icon">${open ? s.icon : '🔒'}</span>
            <span class="tile-title">${esc(s.title)}</span>
            ${open ? `<span class="mini-bar"><span style="width:${m}%"></span></span>` : ''}
          </button>`;
        }).join('')}
      </div>

      <h2 class="section-title">Bereiche</h2>
      <div class="module-row">
        ${MODULES.map(m => `
          <div class="module ${m.ready ? 'ready' : 'soon'}">
            <span class="tile-icon">${m.icon}</span>
            <span class="tile-title">${esc(m.title)}</span>
            <span class="module-note">${m.ready ? 'aktiv' : 'kommt bald'}</span>
          </div>`).join('')}
      </div>
    </div>`;

  root.querySelector('[data-act="switch"]').addEventListener('click', () => go('profiles'));
  root.querySelector('[data-act="sammlung"]').addEventListener('click', () => go('sammlung'));
  root.querySelector('[data-act="start"]').addEventListener('click', () => go('session', { mode: 'full' }));
  root.querySelectorAll('[data-sid]:not([disabled])').forEach(b =>
    b.addEventListener('click', () => go('session', { mode: 'free', strategyId: b.dataset.sid })));
}
