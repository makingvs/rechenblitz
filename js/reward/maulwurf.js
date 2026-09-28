// Reaktionsspiel: Tiere schauen aus den Löchern – schnell antippen!
// Goldener Hamster = 3 Punkte. Das Tempo steigt langsam an.
import { gameShell } from './common.js';
import { sounds, pick } from '../util.js';

const ANIMALS = ['🐹', '🐭', '🐰', '🦔'];

export function renderMaulwurf(root, { back = 'menu' } = {}) {
  const g = gameShell(root, {
    icon: '🐹', title: 'Hau den Hamster', scoreIcon: '🐹', seconds: 75, back,
    body: `<div class="mole-field">${Array.from({ length: 9 }, (_, i) => `
      <button class="hole" data-i="${i}" aria-label="Loch ${i + 1}"><span class="mole"></span></button>`).join('')}</div>`,
  });
  const holes = [...root.querySelectorAll('.hole')];
  const t0 = Date.now();

  holes.forEach(h => h.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (g.over || !h.classList.contains('up') || h.classList.contains('hit')) return;
    h.classList.add('hit');
    g.add(h.dataset.gold ? 3 : 1);
    sounds.pop();
    h.querySelector('.mole').textContent = '💫';
    setTimeout(() => h.classList.remove('up', 'hit'), 250);
  }));

  function popUp() {
    if (g.over) return;
    const free = holes.filter(h => !h.classList.contains('up'));
    if (free.length) {
      const h = pick(free);
      const gold = Math.random() < 0.12;
      h.dataset.gold = gold ? '1' : '';
      h.querySelector('.mole').textContent = gold ? '🌟' : pick(ANIMALS);
      h.classList.add('up');
      const stay = Math.max(650, 1300 - (Date.now() - t0) / 100);
      g.later(() => h.classList.remove('up'), stay);
    }
    const next = Math.max(420, 900 - (Date.now() - t0) / 120);
    g.later(popUp, next);
  }
  g.later(popUp, 600);
}
