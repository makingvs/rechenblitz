// Kreativ-Pause: Malen mit dem Finger, Farben, Pinselgrößen und Stempel. Ruhig, ohne Punkte.
import { gameShell } from './common.js';
import { onLeave } from '../state.js';

const COLORS = ['#2B2A33', '#E4572E', '#F39C12', '#F6C343', '#2BA84A', '#16A2A5', '#2E86DE', '#8E6CCB', '#E84393', '#8B5A2B'];
const SIZES = [6, 14, 28];
const STAMPS = ['⭐', '🌸', '❤️', '🐞', '🌈', '🦋'];

export function renderMalen(root, { back = 'menu' } = {}) {
  const g = gameShell(root, {
    icon: '🎨', title: 'Malen', scoreIcon: '⏱️', seconds: 180, back,
    onTimeUp: () => g.end({ title: 'Schönes Bild!', text: 'Die Malzeit ist vorbei.', emoji: '🖼️' }),
    body: `
      <div class="paint">
        <div class="paint-tools">
          ${COLORS.map((c, i) => `<button class="swatch ${i === 1 ? 'on' : ''}" data-color="${c}" style="--c:${c}" aria-label="Farbe"></button>`).join('')}
          <span class="tool-sep"></span>
          ${SIZES.map((s, i) => `<button class="size ${i === 1 ? 'on' : ''}" data-size="${s}" aria-label="Pinsel ${s}"><i style="width:${s}px;height:${s}px"></i></button>`).join('')}
          <span class="tool-sep"></span>
          ${STAMPS.map(s => `<button class="stamp" data-stamp="${s}">${s}</button>`).join('')}
          <button class="stamp" data-eraser aria-label="Radiergummi">🧽</button>
          <button class="stamp" data-clear aria-label="Neues Bild">🗑️</button>
        </div>
        <canvas class="paint-canvas"></canvas>
      </div>`,
  });
  root.querySelector('.stars').style.visibility = 'hidden';
  const canvas = root.querySelector('.paint-canvas');
  const ctx = canvas.getContext('2d');
  let color = COLORS[1], size = SIZES[1], stamp = null, eraser = false;
  let drawing = false, lastPt = null;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const img = canvas.width ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, r.width, r.height);
    if (img) ctx.putImageData(img, 0, 0);
    ctx.lineCap = ctx.lineJoin = 'round';
  }
  setTimeout(resize, 0);
  window.addEventListener('resize', resize);
  onLeave(() => window.removeEventListener('resize', resize));

  const select = (sel, btn) => { root.querySelectorAll(sel).forEach(b => b.classList.toggle('on', b === btn)); };
  root.querySelectorAll('[data-color]').forEach(b => b.addEventListener('click', () => {
    color = b.dataset.color; stamp = null; eraser = false;
    select('[data-color], .stamp', b);
  }));
  root.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => { size = Number(b.dataset.size); select('[data-size]', b); }));
  root.querySelectorAll('[data-stamp]').forEach(b => b.addEventListener('click', () => {
    stamp = b.dataset.stamp; eraser = false; select('[data-color], .stamp', b);
  }));
  root.querySelector('[data-eraser]').addEventListener('click', e => { eraser = true; stamp = null; select('[data-color], .stamp', e.currentTarget); });
  root.querySelector('[data-clear]').addEventListener('click', () => {
    const r = canvas.getBoundingClientRect();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, r.width, r.height);
  });

  const pt = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const p = pt(e);
    if (stamp) {
      ctx.font = `${size * 2.4 + 16}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stamp, p.x, p.y);
      return;
    }
    drawing = true;
    lastPt = p;
    dot(p);
  });
  canvas.addEventListener('pointermove', e => {
    if (!drawing) return;
    const p = pt(e);
    ctx.strokeStyle = eraser ? '#fff' : color;
    ctx.lineWidth = eraser ? size * 2 : size;
    ctx.beginPath();
    ctx.moveTo(lastPt.x, lastPt.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPt = p;
  });
  const stop = () => { drawing = false; };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);

  function dot(p) {
    ctx.fillStyle = eraser ? '#fff' : color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, (eraser ? size * 2 : size) / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
