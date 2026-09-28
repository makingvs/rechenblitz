// Liste aller Belohnungsspiele – für die Auswahl nach einer Einheit und den Test im Erwachsenen-Bereich.
import { go } from '../state.js';
import { esc } from '../util.js';

export const GAMES = [
  { id: 'spiel', icon: '🎈', title: 'Ballonspiel', kind: 'Reaktion' },
  { id: 'maulwurf', icon: '🐹', title: 'Hau den Hamster', kind: 'Reaktion' },
  { id: 'faenger', icon: '🧺', title: 'Sternenfänger', kind: 'Geschick' },
  { id: 'memory', icon: '🧠', title: 'Memory', kind: 'Gedächtnis' },
  { id: 'nachmacher', icon: '🎵', title: 'Nachmacher', kind: 'Gedächtnis' },
  { id: 'malen', icon: '🎨', title: 'Malen', kind: 'Kreativ' },
];

// Auswahlbildschirm „Belohnung aussuchen“ (nur nach einer erfolgreichen Einheit erreichbar)
export function renderSpiele(root) {
  root.innerHTML = `
    <div class="page">
      <header class="page-head">
        <h1>🎁 Such dir eine Belohnung aus!</h1>
      </header>
      <div class="tile-grid game-grid">
        ${GAMES.map(g => `
          <button class="tile" data-game="${g.id}">
            <span class="tile-icon">${g.icon}</span>
            <span class="tile-title">${esc(g.title)}</span>
            <span class="module-note">${g.kind}</span>
          </button>`).join('')}
        <button class="tile" data-game="entspannung">
          <span class="tile-icon">🌿</span>
          <span class="tile-title">Entspannen</span>
          <span class="module-note">Ruhe</span>
        </button>
      </div>
      <div class="btn-row"><button class="btn btn-ghost" data-act="menu">Zum Menü</button></div>
    </div>`;
  root.querySelectorAll('[data-game]').forEach(b => b.addEventListener('click', () => go(b.dataset.game)));
  root.querySelector('[data-act="menu"]').addEventListener('click', () => go('menu'));
}
