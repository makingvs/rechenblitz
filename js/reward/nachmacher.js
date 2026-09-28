// Gedächtnisspiel „Nachmacher“: Die Tiere leuchten in einer Reihenfolge auf – nachtippen!
// Jede Runde kommt ein Tier dazu.
import { gameShell } from './common.js';
import { sounds } from '../util.js';

const PADS = [
  { icon: '🐸', color: '#2BA84A', freq: 392 },
  { icon: '🐳', color: '#2E86DE', freq: 494 },
  { icon: '🦊', color: '#E4572E', freq: 587 },
  { icon: '🐥', color: '#F6C343', freq: 698 },
];

let toneCtx = null;
function tone(freq) {
  try {
    toneCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = toneCtx.createOscillator(), gn = toneCtx.createGain();
    o.frequency.value = freq;
    gn.gain.setValueAtTime(0.15, toneCtx.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.001, toneCtx.currentTime + 0.35);
    o.connect(gn).connect(toneCtx.destination);
    o.start(); o.stop(toneCtx.currentTime + 0.35);
  } catch { /* Ton optional */ }
}

export function renderNachmacher(root, { back = 'menu' } = {}) {
  const g = gameShell(root, {
    icon: '🎵', title: 'Nachmacher', scoreIcon: '🏅', back,
    body: `
      <div class="simon-wrap">
        <p class="simon-msg">Schau genau zu …</p>
        <div class="simon">${PADS.map((p, i) => `
          <button class="pad" data-i="${i}" style="--c:${p.color}" aria-label="Tier ${i + 1}">${p.icon}</button>`).join('')}</div>
      </div>`,
  });
  const pads = [...root.querySelectorAll('.pad')];
  const msg = root.querySelector('.simon-msg');
  let seq = [], pos = 0, input = false, best = 0;

  const flash = (i, ms = 450) => {
    pads[i].classList.add('lit');
    tone(PADS[i].freq);
    g.later(() => pads[i].classList.remove('lit'), ms);
  };

  function nextRound() {
    seq.push(Math.floor(Math.random() * 4));
    pos = 0;
    input = false;
    msg.textContent = 'Schau genau zu …';
    const gap = Math.max(380, 700 - seq.length * 25);
    seq.forEach((i, k) => g.later(() => flash(i, gap * 0.7), 600 + k * gap));
    g.later(() => { input = true; msg.textContent = 'Jetzt du!'; }, 600 + seq.length * gap);
  }

  pads.forEach(p => p.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (!input || g.over) return;
    const i = Number(p.dataset.i);
    flash(i, 250);
    if (i !== seq[pos]) {
      input = false;
      sounds.wrong();
      best = Math.max(best, seq.length - 1);
      g.later(() => g.end({
        title: `${seq.length - 1} Tiere gemerkt!`,
        text: best >= 6 ? 'Wow, was für ein Gedächtnis!' : 'Toll gemacht!',
        emoji: '🧠',
        again: () => renderNachmacher(root, { back }),
      }), 500);
      return;
    }
    pos++;
    if (pos === seq.length) {
      input = false;
      g.setScore(seq.length);
      msg.textContent = 'Richtig! 🎉';
      g.later(nextRound, 900);
    }
  }));

  g.later(nextRound, 400);
}
