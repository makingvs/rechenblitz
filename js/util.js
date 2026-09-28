// Kleine Hilfsfunktionen, die überall gebraucht werden.

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function median(arr) {
  if (!arr || !arr.length) return 0;
  const s = [...arr].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function avg(arr) {
  const a = arr.filter(x => typeof x === 'number' && isFinite(x));
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
}

export function uid() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function fmtSec(ms) {
  return (ms / 1000).toFixed(1).replace('.', ',') + ' s';
}

export function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ---- Töne (WebAudio, keine Dateien nötig) ----
let actx = null;
let soundOn = true;
export function setSound(on) { soundOn = on; }

function tone(freq, dur = 0.12, type = 'sine', vol = 0.15, delay = 0) {
  if (!soundOn) return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t0 = actx.currentTime + delay;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(actx.destination);
    o.start(t0);
    o.stop(t0 + dur);
  } catch { /* Ton ist optional */ }
}

export const sounds = {
  ok() { tone(784, 0.1); tone(1047, 0.12, 'sine', 0.15, 0.08); },
  star() { tone(1047, 0.1); tone(1319, 0.1, 'sine', 0.15, 0.07); tone(1568, 0.16, 'sine', 0.15, 0.14); },
  wrong() { tone(260, 0.2, 'triangle', 0.12); },
  pop() { tone(300 + Math.random() * 500, 0.07, 'square', 0.06); },
  gong() { tone(523, 0.6, 'sine', 0.12); tone(659, 0.6, 'sine', 0.08, 0.05); },
};
