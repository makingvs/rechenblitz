// Gemeinsamer Rahmen für die Belohnungsspiele: Kopfzeile, Zeitbalken, Punkte, Abschlusskarte.
import { go, onLeave } from '../state.js';
import { sounds, esc } from '../util.js';

/**
 * Baut den Spielrahmen. body: HTML des Spielfelds.
 * seconds: Spielzeit (0 = ohne Zeitlimit). onTimeUp wird nach Ablauf aufgerufen.
 */
export function gameShell(root, { icon, title, scoreIcon = '⭐', body, seconds = 0, back = 'menu', onTimeUp }) {
  root.innerHTML = `
    <div class="game">
      <header class="topbar">
        <button class="icon-btn" data-act="exit" aria-label="Beenden">✕</button>
        <div class="phase-label">${icon} ${esc(title)}</div>
        <div class="bar ${seconds ? '' : 'bar-count'}">${seconds ? '<div class="bar-fill"></div>' : ''}</div>
        <div class="stars">${scoreIcon} <span>0</span></div>
      </header>
      ${body}
      <div class="overlay" hidden></div>
    </div>`;
  const $ = s => root.querySelector(s);
  const scoreEl = $('.stars span');
  const overlay = $('.overlay');
  const timers = [];
  let score = 0, over = false;
  const stopAll = () => timers.forEach(t => { clearInterval(t); clearTimeout(t); });
  onLeave(stopAll);
  $('[data-act="exit"]').addEventListener('click', () => go(back));

  if (seconds) {
    const fill = $('.bar-fill');
    const t0 = Date.now();
    timers.push(setInterval(() => {
      const p = (Date.now() - t0) / (seconds * 1000);
      fill.style.width = Math.min(100, p * 100) + '%';
      if (p >= 1 && !over) onTimeUp ? onTimeUp() : api.end();
    }, 250));
  }

  const api = {
    $, root,
    get over() { return over; },
    get score() { return score; },
    add(n = 1) { score = Math.max(0, score + n); scoreEl.textContent = score; },
    setScore(n) { score = n; scoreEl.textContent = n; },
    every(fn, ms) { const t = setInterval(fn, ms); timers.push(t); return t; },
    later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; },
    // Abschlusskarte. again: optionaler „Nochmal“-Knopf
    end({ title: t, text = 'Super gemacht!', emoji = '🎉', again } = {}) {
      if (over) return;
      over = true;
      stopAll();
      sounds.star();
      overlay.innerHTML = `
        <div class="card intro-card">
          <div class="intro-icon">${emoji}</div>
          <h2>${esc(t ?? `${score} Punkte!`)}</h2>
          <p>${esc(text)}</p>
          <div class="btn-row">
            ${again ? '<button class="btn btn-big" data-act="again">Nochmal</button>' : ''}
            <button class="btn btn-big btn-go" data-act="done">Fertig</button>
          </div>
        </div>`;
      overlay.hidden = false;
      overlay.querySelector('[data-act="done"]').addEventListener('click', () => go(back));
      overlay.querySelector('[data-act="again"]')?.addEventListener('click', again);
    },
  };
  return api;
}
