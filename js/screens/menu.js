import { app, go } from '../state.js';
import { PATH } from '../strategies/index.js';
import { MODULES } from '../tasks/modules.js';
import { currentStrategy, mastery } from '../adaptive.js';
import { sessionMinutes } from '../session.js';
import { game, levelInfo, currentStreak } from '../gamify.js';
import { avatarSVG } from '../avatar.js';
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
      <section class="hero">
        <button class="hero-avatar" data-act="avatar" aria-label="Avatar gestalten">${avatarSVG(profile.look)}<span class="hero-edit">✏️</span></button>
        <div class="hero-info">
          <div class="hero-top">
            <h1>Hallo ${esc(profile.name)}!</h1>
            <button class="btn btn-ghost btn-small" data-act="switch">Wechseln</button>
          </div>
          <div class="xp-line">
            <span class="level-chip">Level ${li.level}</span>
            <span class="level-title">${esc(li.title)}</span>
          </div>
          <span class="xp-bar"><span style="width:${Math.round(li.pct * 100)}%"></span></span>
          <div class="menu-chips">
            <span class="chip">📅 ${streak} ${streak === 1 ? 'Tag' : 'Tage'}</span>
            <span class="chip">⭐ ${g.totalStars}</span>
            <button class="chip chip-btn" data-act="sammlung">🏅 ${Object.keys(g.badges).length} Abzeichen</button>
            <button class="chip chip-btn" data-act="sammlung">📒 ${new Set(g.stickers).size} Sticker</button>
          </div>
        </div>
      </section>

      <button class="start-card" data-act="start">
        <span class="start-play">▶</span>
        <span class="start-text">
          <span class="start-title">Heute üben</span>
          <span class="start-sub">${sessionMinutes()} Minuten · heute: ${focus.icon} ${esc(focus.title)}</span>
        </span>
        <span class="start-deco">⚡</span>
      </button>
      ${last ? `<p class="last-line">Letztes Mal: ⭐ ${last.stars} Sterne${last.tempo.medianMs ? ' · ' + fmtSec(last.tempo.medianMs) + ' pro Aufgabe' : ''}${last.success ? ' · 🏆' : ''}</p>` : ''}

      <h2 class="section-title">Freies Üben</h2>
      <div class="tile-grid">
        ${PATH.map(s => {
          const open = profile.unlocked.includes(s.id);
          const m = Math.round(mastery(progress, s.id) * 100);
          return `
          <button class="tile ${open ? '' : 'locked'}" data-sid="${s.id}" ${open ? '' : 'disabled'} style="--accent:${s.color}">
            <span class="tile-badge">${open ? s.icon : '🔒'}</span>
            <span class="tile-title">${esc(s.title)}</span>
            ${open ? `<span class="mini-bar"><span style="width:${m}%"></span></span>` : '<span class="module-note">noch gesperrt</span>'}
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

  const on = (sel, fn) => root.querySelectorAll(sel).forEach(b => b.addEventListener('click', fn));
  on('[data-act="switch"]', () => go('profiles'));
  on('[data-act="sammlung"]', () => go('sammlung'));
  on('[data-act="avatar"]', () => go('avatar'));
  on('[data-act="start"]', () => go('session', { mode: 'full' }));
  on('[data-sid]:not([disabled])', e => go('session', { mode: 'free', strategyId: e.currentTarget.dataset.sid }));
}
