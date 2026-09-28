// „Meine Sammlung“: Level, Rekorde, Abzeichen und Sticker-Album des Kindes.
import { app, go } from '../state.js';
import { game, levelInfo, currentStreak, BADGES, STICKERS } from '../gamify.js';
import { esc, fmtSec } from '../util.js';

export function renderSammlung(root) {
  const { profile, progress } = app;
  if (!profile) return go('profiles');
  const g = game(progress);
  const li = levelInfo(g.xp);
  const owned = new Set(g.stickers);
  const badgeCount = BADGES.filter(b => g.badges[b.id]).length;

  root.innerHTML = `
    <div class="page">
      <header class="page-head">
        <button class="icon-btn" data-act="back" aria-label="Zurück">←</button>
        <h1>🏅 Meine Sammlung</h1>
      </header>

      <section class="card game-card">
        <div class="xp-line">
          <span class="avatar small">${profile.avatar}</span>
          <span class="level-chip">Level ${li.level}</span>
          <span class="level-title">${esc(li.title)}</span>
        </div>
        <div class="xp-bar"><span style="width:${Math.round(li.pct * 100)}%"></span></div>
        <p class="muted">Noch ${li.toNext} XP bis Level ${li.level + 1}</p>
        <div class="stat-row small">
          <div class="stat"><span class="stat-val">⭐ ${g.totalStars}</span><span class="stat-lbl">Sterne gesamt</span></div>
          <div class="stat"><span class="stat-val">📅 ${currentStreak(progress)}</span><span class="stat-lbl">Tage in Folge</span></div>
          <div class="stat"><span class="stat-val">🔥 ${g.bestCombo}</span><span class="stat-lbl">längste Serie</span></div>
          <div class="stat"><span class="stat-val">${g.bestMedian ? '⚡ ' + fmtSec(g.bestMedian) : '–'}</span><span class="stat-lbl">Tempo-Rekord</span></div>
        </div>
      </section>

      <section class="card">
        <h2>Abzeichen <span class="count">${badgeCount}/${BADGES.length}</span></h2>
        <div class="badge-grid">
          ${BADGES.map(b => g.badges[b.id]
            ? `<div class="badge on"><span class="badge-icon">${b.icon}</span><span class="badge-title">${esc(b.title)}</span><span class="badge-desc">${esc(b.desc)}</span></div>`
            : `<div class="badge"><span class="badge-icon">🔒</span><span class="badge-title">${esc(b.title)}</span><span class="badge-desc">${esc(b.desc)}</span></div>`).join('')}
        </div>
      </section>

      <section class="card">
        <h2>Sticker-Album <span class="count">${owned.size}/${STICKERS.length}</span></h2>
        <p class="muted">Für jede Einheit mit Belohnung gibt es einen neuen Sticker.</p>
        <div class="sticker-grid">
          ${STICKERS.map(s => `<span class="sticker ${owned.has(s) ? 'on' : ''}">${owned.has(s) ? s : '?'}</span>`).join('')}
        </div>
      </section>
    </div>`;
  root.querySelector('[data-act="back"]').addEventListener('click', () => go('menu'));
}
