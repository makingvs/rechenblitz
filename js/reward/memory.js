// Belohnungsspiel: Memory mit Tier- und Bild-Karten (6 Paare). Ohne Rechnen – reine Freude.
import { go } from '../state.js';
import { STICKERS } from '../gamify.js';
import { sounds, shuffle } from '../util.js';

export function renderMemory(root, { back = 'menu' } = {}) {
  const pairs = shuffle(STICKERS).slice(0, 6);
  const cards = shuffle([...pairs, ...pairs]);
  let open = [], found = 0, moves = 0, busy = false;

  root.innerHTML = `
    <div class="game">
      <header class="topbar">
        <button class="icon-btn" data-act="exit" aria-label="Beenden">✕</button>
        <div class="phase-label">🧠 Memory</div>
        <div class="bar bar-count">Finde alle Paare!</div>
        <div class="stars">Züge <span>0</span></div>
      </header>
      <div class="memory-board">
        ${cards.map((c, i) => `
          <button class="mem-card" data-i="${i}" aria-label="Karte ${i + 1}">
            <span class="mem-inner"><span class="mem-back">❓</span><span class="mem-front">${c}</span></span>
          </button>`).join('')}
      </div>
      <div class="overlay" hidden></div>
    </div>`;
  const movesEl = root.querySelector('.stars span');
  const overlay = root.querySelector('.overlay');
  root.querySelector('[data-act="exit"]').addEventListener('click', () => go(back));

  root.querySelectorAll('.mem-card').forEach(btn => btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (busy || btn.classList.contains('flip') || btn.classList.contains('done')) return;
    btn.classList.add('flip');
    sounds.pop();
    open.push(btn);
    if (open.length < 2) return;
    moves++;
    movesEl.textContent = moves;
    const [a, b] = open;
    open = [];
    if (cards[a.dataset.i] === cards[b.dataset.i]) {
      a.classList.add('done');
      b.classList.add('done');
      found++;
      setTimeout(() => sounds.ok(), 150);
      if (found === pairs.length) setTimeout(end, 600);
    } else {
      busy = true;
      setTimeout(() => { a.classList.remove('flip'); b.classList.remove('flip'); busy = false; }, 900);
    }
  }));

  function end() {
    sounds.star();
    overlay.innerHTML = `
      <div class="card intro-card">
        <div class="intro-icon">🎉</div>
        <h2>Geschafft in ${moves} Zügen!</h2>
        <p>${moves <= 9 ? 'Wow, was für ein Gedächtnis!' : 'Super gemacht!'}</p>
        <button class="btn btn-big btn-go" type="button">Fertig</button>
      </div>`;
    overlay.hidden = false;
    overlay.querySelector('button').addEventListener('click', () => go(back));
  }
}
