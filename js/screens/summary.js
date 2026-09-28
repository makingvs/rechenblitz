// Abschluss einer Einheit: Vergleich mit den eigenen früheren Sitzungen, Belohnung, Gamification.
import { app, go, saveProgress, saveProfile } from '../state.js';
import { updateUnlocks } from '../adaptive.js';
import { byId } from '../strategies/index.js';
import { applySession } from '../gamify.js';
import { say } from '../ui/speech.js';
import { median, avg, fmtSec, esc, sounds } from '../util.js';

export const SUCCESS_ACC = 0.85;

export function renderSummary(root, stats) {
  const { profile, progress } = app;
  const newly = updateUnlocks(profile, progress);
  if (newly.length) saveProfile();

  if (stats.mode === 'free') {
    const g = applySession(progress, stats, null);
    saveProgress();
    return renderFree(root, stats, newly, g);
  }

  const t = stats.tempo;
  const acc = t.n ? t.correct / t.n : 0;
  const med = Math.round(median(t.times));
  const perMin = t.ms > 0 ? t.correct / (t.ms / 60000) : 0;

  // Vergleich mit dem eigenen Schnitt der letzten 3 Einheiten
  const prev = progress.sessions.slice(-3);
  const prevMed = avg(prev.map(s => s.tempo.medianMs).filter(x => x > 0));
  const prevPerMin = avg(prev.map(s => s.tempo.perMin));
  const faster = prevMed > 0 && med > 0 && med <= prevMed;
  const more = prev.length > 0 && perMin >= prevPerMin;
  const improved = !prev.length || faster || more;
  const success = t.n >= 5 && acc >= SUCCESS_ACC && improved;

  const rec = {
    date: Date.now(), minutes: stats.minutes, n: stats.n, correct: stats.correct,
    stars: stats.stars, focus: stats.focus, success, bestCombo: stats.bestCombo,
    tempo: { n: t.n, correct: t.correct, stars: t.stars, medianMs: med, perMin: +perMin.toFixed(2), acc: +acc.toFixed(3) },
  };
  progress.sessions.push(rec);
  const g = applySession(progress, stats, rec);
  saveProgress();

  let msg;
  if (success) msg = 'Super! Du hast dir eine Belohnung verdient!';
  else if (t.n < 5) msg = 'Gut geübt! Beim nächsten Mal schaffst du noch mehr Tempo-Aufgaben.';
  else if (acc < SUCCESS_ACC) msg = 'Gut geübt! Für die Belohnung brauchst du 85 % richtig. Lieber genau als hastig!';
  else msg = 'Gut geübt! Fast so schnell wie sonst – nächstes Mal klappt die Belohnung!';

  const compare = prevMed > 0 && med > 0
    ? (faster ? `🚀 schneller als sonst (${fmtSec(prevMed)})` : `sonst: ${fmtSec(prevMed)}`)
    : '';

  root.innerHTML = `
    <div class="page page-center summary">
      <div class="big-emoji">${success ? '🏆' : '💪'}</div>
      <h1>${esc(msg)}</h1>
      <div class="stat-row">
        <div class="stat"><span class="stat-val">${stats.correct}/${stats.n}</span><span class="stat-lbl">richtig</span></div>
        <div class="stat"><span class="stat-val">⭐ ${stats.stars}</span><span class="stat-lbl">Sterne${stats.bonus ? ` (${stats.bonus} Bonus)` : ''}</span></div>
        <div class="stat"><span class="stat-val">${med ? fmtSec(med) : '–'}</span><span class="stat-lbl">pro Aufgabe (Tempo)</span><span class="stat-cmp">${compare}</span></div>
        <div class="stat"><span class="stat-val">🔥 ${stats.bestCombo}</span><span class="stat-lbl">längste Serie</span></div>
      </div>
      ${gameHTML(g, newly)}
      <div class="btn-row">
        ${success ? '<button class="btn btn-big btn-go" data-act="spiele">🎁 Belohnung aussuchen</button>' : ''}
        <button class="btn btn-big ${success ? '' : 'btn-go'}" data-act="relax">🌿 Entspannen</button>
        <button class="btn btn-big btn-ghost" data-act="menu">Zum Menü</button>
      </div>
    </div>`;
  bind(root);
  success || g.levelUp ? sounds.star() : sounds.ok();
  say(msg);
}

// XP, Level, Serie, Rekorde, Abzeichen, Sticker
function gameHTML(g, newly) {
  const li = g.levelInfo;
  return `
    <div class="card game-card">
      <div class="xp-line">
        <span class="level-chip">Level ${li.level}</span>
        <span class="level-title">${esc(li.title)}</span>
        <span class="xp-gain">+${g.xp} XP</span>
      </div>
      <div class="xp-bar"><span style="width:${Math.round(li.pct * 100)}%"></span></div>
      ${g.levelUp ? `<p class="levelup">🎊 Level ${li.level} erreicht: <b>${esc(li.title)}</b>!</p>` : ''}
      ${g.streakUp && g.days > 1 ? `<p class="gain">📅 ${g.days} Tage in Folge geübt!</p>` : ''}
      ${g.records.map(r => `<p class="gain">🥇 Neuer Rekord – ${esc(r)}</p>`).join('')}
      ${newly.map(s => `<p class="gain">🔓 Neu freigeschaltet: <b>${s.icon} ${esc(s.title)}</b></p>`).join('')}
      ${g.newBadges.length ? `
        <div class="badge-new">
          ${g.newBadges.map(b => `<div class="badge on pop"><span class="badge-icon">${b.icon}</span><span class="badge-title">${esc(b.title)}</span><span class="badge-desc">${esc(b.desc)}</span></div>`).join('')}
        </div>` : ''}
      ${g.sticker ? `<p class="gain sticker-gain"><span class="sticker-big pop">${g.sticker}</span> ${g.stickerNew ? 'Neuer Sticker für dein Album!' : 'Noch ein Sticker für dein Album!'}</p>` : ''}
    </div>`;
}

function renderFree(root, stats, newly, g) {
  const s = byId[stats.focus];
  root.innerHTML = `
    <div class="page page-center summary">
      <div class="big-emoji">${s.icon}</div>
      <h1>${esc(s.title)}: gut geübt!</h1>
      <div class="stat-row">
        <div class="stat"><span class="stat-val">${stats.correct}/${stats.n}</span><span class="stat-lbl">richtig</span></div>
        <div class="stat"><span class="stat-val">⭐ ${stats.stars}</span><span class="stat-lbl">Sterne</span></div>
        <div class="stat"><span class="stat-val">🔥 ${stats.bestCombo}</span><span class="stat-lbl">längste Serie</span></div>
      </div>
      ${gameHTML(g, newly)}
      <div class="btn-row">
        <button class="btn btn-big btn-go" data-act="again">Nochmal</button>
        <button class="btn btn-big btn-ghost" data-act="menu">Zum Menü</button>
      </div>
    </div>`;
  bind(root, () => go('session', { mode: 'free', strategyId: stats.focus }));
  if (g.levelUp) sounds.star();
}

function bind(root, again) {
  const on = (act, fn) => root.querySelector(`[data-act="${act}"]`)?.addEventListener('click', fn);
  on('spiele', () => go('spiele'));
  on('relax', () => go('entspannung'));
  on('menu', () => go('menu'));
  on('again', again);
}
