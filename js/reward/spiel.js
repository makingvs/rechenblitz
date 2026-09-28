// Belohnungsspiel: Ballone steigen auf – antippen lässt sie platzen.
// Bewusst ohne Rechnen: Die Belohnung soll reine Freude sein. Zeitlich begrenzt.
import { go, onLeave } from '../state.js';
import { sounds } from '../util.js';

const COLORS = ['#E4572E', '#2E86DE', '#2BA84A', '#F39C12', '#8E6CCB', '#16A2A5', '#E84393'];
export const GAME_SECONDS = 120;

export function renderSpiel(root, { back = 'menu' } = {}) {
  root.innerHTML = `
    <div class="game">
      <header class="topbar">
        <button class="icon-btn" data-act="exit" aria-label="Beenden">✕</button>
        <div class="phase-label">🎈 Ballonspiel</div>
        <div class="bar"><div class="bar-fill"></div></div>
        <div class="stars">🎈 <span>0</span></div>
      </header>
      <div class="sky"></div>
      <div class="overlay" hidden></div>
    </div>`;
  const sky = root.querySelector('.sky');
  const fill = root.querySelector('.bar-fill');
  const scoreEl = root.querySelector('.stars span');
  const overlay = root.querySelector('.overlay');
  root.querySelector('[data-act="exit"]').addEventListener('click', () => go(back));

  let score = 0, running = true;
  const t0 = Date.now();
  const ms = GAME_SECONDS * 1000;

  function spawn() {
    if (!running) return;
    const gold = Math.random() < 0.1;
    const b = document.createElement('div');
    b.className = 'balloon' + (gold ? ' gold' : '');
    b.style.left = (4 + Math.random() * 84) + '%';
    b.style.setProperty('--c', gold ? '#F6C343' : COLORS[Math.floor(Math.random() * COLORS.length)]);
    b.style.animationDuration = (4.5 + Math.random() * 3.5) + 's';
    if (gold) b.textContent = '⭐';
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (b.classList.contains('popped')) return;
      b.classList.add('popped');
      score += gold ? 3 : 1;
      scoreEl.textContent = score;
      sounds.pop();
      setTimeout(() => b.remove(), 250);
    });
    b.addEventListener('animationend', e => { if (e.animationName === 'rise') b.remove(); });
    sky.appendChild(b);
  }

  const spawner = setInterval(spawn, 600);
  const ticker = setInterval(() => {
    const p = (Date.now() - t0) / ms;
    fill.style.width = Math.min(100, p * 100) + '%';
    if (p >= 1) end();
  }, 250);
  onLeave(() => { clearInterval(spawner); clearInterval(ticker); });

  function end() {
    if (!running) return;
    running = false;
    clearInterval(spawner);
    clearInterval(ticker);
    sounds.star();
    overlay.innerHTML = `
      <div class="card intro-card">
        <div class="intro-icon">🎉</div>
        <h2>${score} Punkte!</h2>
        <p>Super gemacht. Bis zum nächsten Mal!</p>
        <button class="btn btn-big btn-go" type="button">Fertig</button>
      </div>`;
    overlay.hidden = false;
    overlay.querySelector('button').addEventListener('click', () => go(back));
  }
}
