// Entspannungs- und Bewegungsübungen – für die Pausen in der Einheit und als Belohnung.
import { go, onLeave } from '../state.js';
import { say } from '../ui/speech.js';
import { sounds, esc } from '../util.js';

const MOVES = [
  ['🌳', 'Streck dich ganz groß wie ein Baum!'],
  ['🐸', 'Hüpfe 5-mal wie ein Frosch.'],
  ['👐', 'Schüttle deine Hände aus.'],
  ['🔄', 'Kreise deine Schultern nach hinten.'],
  ['🦩', 'Stell dich auf ein Bein wie ein Flamingo.'],
  ['👏', 'Klatsche 10-mal in die Hände.'],
  ['🐱', 'Mach einen Katzenbuckel – und streck dich wieder.'],
  ['🏃', 'Lauf ganz leise auf der Stelle.'],
];

// Dauer je Schritt: Bewegung 15 s; Anspannen 6 s, Lockern 10 s; Atmen 5 s ein / 5 s aus
const MOVE_MS = 15000, TENSE_MS = 6000, RELAX_MS = 10000, BREATH_MS = 5000;

// [Symbol, Text, true = Anspannen / false = Lockern]
const LOOSEN = [
  ['✊', 'Mach mit beiden Händen ganz feste Fäuste … halten …', true],
  ['🖐️', '… und jetzt lass ganz locker. Spür, wie warm die Hände werden.', false],
  ['🐢', 'Zieh die Schultern hoch bis zu den Ohren, wie eine Schildkröte … halten …', true],
  ['😌', '… und lass sie langsam fallen. Ganz locker.', false],
  ['😝', 'Kneif dein Gesicht ganz fest zusammen … halten …', true],
  ['🙂', '… und lass los. Dein Gesicht ist ganz entspannt.', false],
  ['🦶', 'Krall deine Zehen ganz fest ein … halten …', true],
  ['🌊', '… und lass sie wieder locker. Deine Füße sind ganz schwer und warm.', false],
];

export const EXERCISES = {
  atmen: { icon: '🎈', title: 'Ballon-Atmen', text: 'Atme ein, wenn der Ballon größer wird. Atme aus, wenn er kleiner wird.' },
  bewegung: { icon: '🤸', title: 'Bewegungspause', text: 'Mach mit!' },
  lockern: { icon: '😌', title: 'Anspannen & Lockern', text: 'Mach mit und spür den Unterschied.' },
};

/**
 * Übung in el abspielen. Nach ms erscheint „Weiter“ (onDone).
 * endless: läuft, bis „Fertig“ getippt wird.
 * Gibt eine Aufräumfunktion zurück.
 */
export function runExercise(el, kind, ms, onDone, { endless = false } = {}) {
  const ex = EXERCISES[kind];
  const timers = [];
  const later = (fn, t) => timers.push(setTimeout(fn, t));
  const every = (fn, t) => timers.push(setInterval(fn, t));

  el.innerHTML = `
    <div class="exercise">
      <div class="ex-head"><span class="ex-icon">${ex.icon}</span> ${esc(ex.title)}</div>
      <div class="ex-body"></div>
      <div class="ex-foot">
        ${endless ? '' : '<div class="bar ex-bar"><div class="bar-fill"></div></div>'}
        <button class="btn btn-go" type="button" ${endless ? '' : 'hidden'}>${endless ? 'Fertig' : 'Weiter ➜'}</button>
      </div>
    </div>`;
  const body = el.querySelector('.ex-body');
  const btn = el.querySelector('.btn');
  btn.addEventListener('click', () => { cleanup(); onDone(); });

  if (kind === 'atmen') {
    body.innerHTML = `
      <div class="breath"><div class="breath-circle"></div><div class="breath-text">Einatmen …</div></div>
      <p class="ex-text">${esc(ex.text)}</p>`;
    const txt = body.querySelector('.breath-text');
    let inhale = true;
    say('Einatmen');
    every(() => {
      inhale = !inhale;
      txt.textContent = inhale ? 'Einatmen …' : 'Ausatmen …';
      say(inhale ? 'Einatmen' : 'Ausatmen');
    }, BREATH_MS);
  } else {
    const list = kind === 'lockern' ? LOOSEN : MOVES;
    let i = kind === 'lockern' ? 0 : Math.floor(Math.random() * list.length);
    const show = () => {
      const [icon, text, tense] = list[i % list.length];
      const step = kind === 'lockern' ? (tense ? TENSE_MS : RELAX_MS) : MOVE_MS;
      body.innerHTML = `
        <div class="move ${kind === 'lockern' ? (tense ? 'tense' : 'relax') : ''}">
          <div class="move-icon">${icon}</div>
          <p class="move-text">${esc(text)}</p>
          <div class="step-bar"><span style="animation-duration:${step}ms"></span></div>
        </div>`;
      say(text);
      i++;
      later(show, step);
    };
    show();
  }

  if (!endless) {
    const fill = el.querySelector('.ex-bar .bar-fill');
    const t0 = Date.now();
    every(() => { fill.style.width = Math.min(100, (Date.now() - t0) / ms * 100) + '%'; }, 250);
    later(() => { btn.hidden = false; sounds.gong(); }, ms);
  }

  function cleanup() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); }
  return cleanup;
}

// Belohnungs-Bildschirm „Entspannen“: Übung auswählen.
export function renderEntspannung(root, { back = 'menu', start = null } = {}) {
  root.innerHTML = `
    <div class="page">
      <header class="page-head">
        <button class="icon-btn" data-act="back" aria-label="Zurück">←</button>
        <h1>🌿 Entspannen</h1>
      </header>
      <div class="tile-grid">
        ${Object.entries(EXERCISES).map(([k, ex]) => `
          <button class="tile" data-ex="${k}">
            <span class="tile-icon">${ex.icon}</span>
            <span class="tile-title">${esc(ex.title)}</span>
          </button>`).join('')}
      </div>
      <div class="card ex-card" hidden></div>
    </div>`;
  root.querySelector('[data-act="back"]').addEventListener('click', () => go(back));
  const card = root.querySelector('.ex-card');
  let stop = () => {};
  onLeave(() => stop());
  root.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => {
    stop();
    root.querySelector('.tile-grid').hidden = true;
    card.hidden = false;
    stop = runExercise(card, b.dataset.ex, 0, () => go(back), { endless: true });
  }));
  if (start) root.querySelector(`[data-ex="${start}"]`)?.click();
}
