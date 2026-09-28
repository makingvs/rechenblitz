// Geschicklichkeitsspiel: Mit dem Korb fallende Sterne und Früchte fangen, Wolken ausweichen.
// Korb folgt dem Finger (ziehen oder tippen).
import { gameShell } from './common.js';
import { sounds, pick } from '../util.js';

const GOOD = ['⭐', '🍎', '🍓', '🍌', '🍒', '💎'];

export function renderFaenger(root, { back = 'menu' } = {}) {
  const g = gameShell(root, {
    icon: '🧺', title: 'Sternenfänger', scoreIcon: '⭐', seconds: 90, back,
    body: `<div class="catch-field"><div class="basket">🧺</div></div>`,
  });
  const field = root.querySelector('.catch-field');
  const basket = root.querySelector('.basket');
  let basketX = 0.5;     // 0..1
  let items = [];
  let last = performance.now(), spawnIn = 0;
  const t0 = performance.now();

  const setX = clientX => {
    const r = field.getBoundingClientRect();
    basketX = Math.min(0.95, Math.max(0.05, (clientX - r.left) / r.width));
  };
  field.addEventListener('pointerdown', e => { e.preventDefault(); setX(e.clientX); });
  field.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') setX(e.clientX); });

  function spawn() {
    const bad = Math.random() < 0.2;
    const el = document.createElement('div');
    el.className = 'fall';
    el.textContent = bad ? '🌧️' : pick(GOOD);
    field.appendChild(el);
    items.push({ el, x: 0.05 + Math.random() * 0.9, y: -0.05, bad, gem: el.textContent === '💎' });
  }

  function loop() {
    if (g.over) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const elapsed = (now - t0) / 1000;
    const speed = 0.28 + elapsed * 0.004;          // Bildschirmhöhen pro Sekunde
    spawnIn -= dt;
    if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.45, 1.1 - elapsed * 0.008); }

    basket.style.left = basketX * 100 + '%';
    const h = field.clientHeight, w = field.clientWidth;
    items = items.filter(it => {
      it.y += speed * dt;
      it.el.style.transform = `translate(${it.x * w - 24}px, ${it.y * h}px)`;
      const caught = it.y > 0.8 && it.y < 0.95 && Math.abs(it.x - basketX) * w < 60;
      if (caught) {
        if (it.bad) { g.add(-2); basket.classList.add('wet'); setTimeout(() => basket.classList.remove('wet'), 400); sounds.wrong(); }
        else { g.add(it.gem ? 3 : 1); sounds.pop(); }
        it.el.remove();
        return false;
      }
      if (it.y > 1.05) { it.el.remove(); return false; }
      return true;
    });
  }
  g.every(loop, 16);
}
