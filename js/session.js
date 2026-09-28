// Ablauf einer Übungseinheit (25 min) bzw. freies Üben einer Strategie.
import { app, go, onLeave, saveProgress } from './state.js';
import { parseFact, speakText } from './tasks/facts.js';
import { byId, strategyFor, poolOf } from './strategies/index.js';
import { record, pickFact, factState, currentStrategy, unlockedPool, targetMs } from './adaptive.js';
import { visualFor } from './visuals/index.js';
import { mountVisual } from './visuals/blitzblick.js';
import { numpad } from './ui/numpad.js';
import { say } from './ui/speech.js';
import { sounds, esc, median } from './util.js';
import { runExercise } from './reward/entspannung.js';

export const DURATIONS = [10, 15, 20, 25, 30];
export const PAUSES = [1, 2, 3];

// Gesamtdauer in Minuten: Einstellung im Erwachsenen-Bereich (Standard 25). Zum Testen: ?dauer=2
export function sessionMinutes(profile = app.profile) {
  const d = Number(new URLSearchParams(location.search).get('dauer'));
  if (d > 0) return d;
  return profile?.settings?.minutes || 25;
}

/**
 * Aufteilung einer Einheit in Minuten. Die Pausen sind fest (nie gekürzt, auch nicht im Testmodus);
 * die Rechenzeit ist der Rest (ohne ca. 3/25 für den Abschluss), mindestens aber 40 % der Gesamtzeit.
 * Bei 25 min und 1 min Pause: Aufwärmen 3 · Üben 7 · Pause 1 · Tempo 5 · Pause 1 · Tempo 5 · Abschluss.
 */
export function phasePlan(total, pause) {
  const tasks = Math.max(total * 0.4, total * 22 / 25 - 2 * pause);
  const part = x => Math.round(tasks * x / 20 * 10) / 10;
  return { warm: part(3), ueben: part(7), tempo: part(5), pause };
}

const COMBO_STEP = 5; // alle 5 richtigen in Folge: Bonus-Stern

function buildPhases(mode, strategyId) {
  if (mode === 'free') {
    const s = byId[strategyId];
    return [{ id: 'frei', title: s.title, icon: s.icon, kind: 'task', ms: Infinity, weakShare: 0.5, pool: poolOf(s.id), focus: s.id }];
  }
  const plan = phasePlan(sessionMinutes(), app.profile.settings.pauseMinutes || 1);
  const m = min => min * 60000;
  const focus = currentStrategy(app.profile, app.progress);
  const warmPool = unlockedPool(app.profile);
  const tempoPool = unlockedPool(app.profile, { withQty: false });
  return [
    { id: 'warm', title: 'Aufwärmen', icon: '🔥', kind: 'task', ms: m(plan.warm), weakShare: 0.1, pool: warmPool,
      intro: 'Wir wärmen uns auf – mit Aufgaben, die du schon gut kannst.' },
    { id: 'ueben', title: focus.title, icon: focus.icon, kind: 'task', ms: m(plan.ueben), weakShare: 0.5, pool: poolOf(focus.id), focus: focus.id,
      intro: `Heute üben wir: ${focus.title}. ${focus.intro}` },
    { id: 'pause1', title: 'Bewegungspause', icon: '🤸', kind: 'pause', ms: m(plan.pause), exercise: 'bewegung' },
    { id: 'tempo1', title: 'Tempo', icon: '⚡', kind: 'task', ms: m(plan.tempo), weakShare: 0.3, pool: tempoPool, tempo: true,
      intro: 'Jetzt zählt das Tempo! Für jede richtige und schnelle Antwort bekommst du einen Stern.' },
    { id: 'pause2', title: 'Atempause', icon: '🌿', kind: 'pause', ms: m(plan.pause), exercise: 'atmen' },
    { id: 'tempo2', title: 'Tempo', icon: '⚡', kind: 'task', ms: m(plan.tempo), weakShare: 0.3, pool: tempoPool, tempo: true,
      intro: 'Letzte Tempo-Runde! Schaffst du noch mehr Sterne?' },
  ];
}

// Uhr, die stehen bleibt, solange die App im Hintergrund ist.
function makeClock() {
  let hiddenTotal = 0, hiddenAt = document.hidden ? performance.now() : null;
  const onVis = () => {
    if (document.hidden) hiddenAt ??= performance.now();
    else if (hiddenAt != null) { hiddenTotal += performance.now() - hiddenAt; hiddenAt = null; }
  };
  document.addEventListener('visibilitychange', onVis);
  return {
    now: () => (hiddenAt ?? performance.now()) - hiddenTotal,
    stop: () => document.removeEventListener('visibilitychange', onVis),
  };
}

export function renderSession(root, { mode = 'full', strategyId } = {}) {
  const progress = app.progress;
  const phases = buildPhases(mode, strategyId);
  const clock = makeClock();
  onLeave(clock.stop);

  const stats = {
    mode, focus: mode === 'free' ? strategyId : phases[1].focus,
    n: 0, correct: 0, stars: 0, times: [], started: Date.now(),
    combo: 0, bestCombo: 0, bonus: 0,
    tempo: { n: 0, correct: 0, stars: 0, times: [], ms: 0 },
  };

  let phaseIdx = -1, phase = null, phaseStart = null;
  let cur = null, locked = true, helpOpen = false, taskCount = 0;
  const recent = [], retry = [];
  // Hilfsmodus: Wird das Kind langsamer oder macht mehr Fehler, erscheinen die Bilder wieder.
  const lastResults = []; // {correct, ms} der letzten Antworten in dieser Einheit
  let helpMode = false;
  let stopVisual = () => {}, stopOverlay = () => {};
  onLeave(() => { stopVisual(); stopOverlay(); });

  root.innerHTML = `
    <div class="session">
      <header class="topbar">
        <button class="icon-btn" data-act="exit" aria-label="${mode === 'free' ? 'Fertig' : 'Beenden'}">${mode === 'free' ? 'Fertig' : '✕'}</button>
        <div class="phase-label"></div>
        <div class="bar"><div class="bar-fill"></div></div>
        <div class="combo" aria-label="Serie" hidden>🔥 <span>0</span></div>
        <div class="stars" aria-label="Sterne">⭐ <span>0</span></div>
      </header>
      <div class="toast" hidden></div>
      <section class="task-area">
        <div class="visual-slot"></div>
        <div class="equation" aria-live="polite"></div>
        <div class="feedback"></div>
      </section>
      <aside class="pad-slot"></aside>
      <div class="overlay" hidden></div>
    </div>`;
  const $ = s => root.querySelector(s);
  const els = {
    label: $('.phase-label'), bar: $('.bar'), fill: $('.bar-fill'), stars: $('.stars span'),
    combo: $('.combo'), comboN: $('.combo span'), toast: $('.toast'),
    visual: $('.visual-slot'), eq: $('.equation'), feedback: $('.feedback'), pad: $('.pad-slot'), overlay: $('.overlay'),
  };
  if (mode === 'free') els.bar.classList.add('bar-count');

  onLeave(numpad(els.pad, { onDigit, onDelete, onEnter: submit }));

  $('[data-act="exit"]').addEventListener('click', () => {
    if (mode === 'free') return finish();
    if (confirm('Möchtest du die Einheit wirklich beenden? Dein Lernstand bleibt gespeichert.')) go('menu');
  });

  const tick = setInterval(updateBar, 250);
  onLeave(() => clearInterval(tick));

  nextPhase();

  // ---------- Phasen ----------
  function nextPhase() {
    phaseIdx++;
    if (phaseIdx >= phases.length) return finish();
    phase = phases[phaseIdx];
    phaseStart = null;
    cur = null;
    locked = true;
    els.label.textContent = `${phase.icon} ${phase.title}`;
    els.eq.innerHTML = '';
    els.feedback.innerHTML = '';
    stopVisual();
    els.visual.innerHTML = '';
    updateBar();
    if (phase.kind === 'pause') return showPause();
    if (phase.intro) return showIntro();
    startPhase();
  }

  function startPhase() {
    hideOverlay();
    phaseStart = clock.now();
    nextTask();
  }

  function showIntro() {
    const n = phases.filter(p => p.kind === 'task').indexOf(phase) + 1;
    const total = phases.filter(p => p.kind === 'task').length;
    els.overlay.innerHTML = `
      <div class="card intro-card">
        <div class="intro-step">Teil ${n} von ${total}</div>
        <div class="intro-icon">${phase.icon}</div>
        <h2>${esc(phase.title)}</h2>
        <p>${esc(phase.intro)}</p>
        <button class="btn btn-big btn-go" type="button">Los!</button>
      </div>`;
    els.overlay.hidden = false;
    els.overlay.querySelector('.btn-go').addEventListener('click', startPhase);
    say(phase.intro);
  }

  function showPause() {
    els.overlay.innerHTML = `<div class="card pause-card"></div>`;
    els.overlay.hidden = false;
    stopOverlay = runExercise(els.overlay.firstElementChild, phase.exercise, phase.ms, () => nextPhase());
  }

  function hideOverlay() {
    stopOverlay();
    stopOverlay = () => {};
    els.overlay.hidden = true;
    els.overlay.innerHTML = '';
  }

  function phaseOver() {
    return phaseStart != null && clock.now() - phaseStart >= phase.ms;
  }

  function endTaskPhase() {
    if (phase.tempo) stats.tempo.ms += clock.now() - phaseStart;
    phaseStart = null;
    nextPhase();
  }

  function updateBar() {
    if (mode === 'free') { els.bar.textContent = `${stats.n} Aufgaben`; return; }
    const pct = phase && phase.kind === 'task' && phaseStart != null
      ? Math.min(1, (clock.now() - phaseStart) / phase.ms) : 0;
    els.fill.style.width = (pct * 100).toFixed(1) + '%';
  }

  // ---------- Aufgaben ----------
  function chooseId() {
    const i = retry.findIndex(r => r.due <= taskCount && recent[recent.length - 1] !== r.id && phase.pool.includes(r.id));
    if (i >= 0) return retry.splice(i, 1)[0].id;
    return pickFact(progress, phase.pool, { weakShare: phase.weakShare, recent: recent.slice(-3) });
  }

  function nextTask() {
    helpOpen = false;
    if (phaseOver()) return endTaskPhase();
    const id = chooseId();
    recent.push(id);
    taskCount++;
    const f = parseFact(id);
    const strat = strategyFor(f, phase.focus);
    const st = factState(progress, id);
    cur = { f, strat, typed: '', hinted: false, start: 0 };

    els.feedback.innerHTML = '';
    renderEquation();
    stopVisual();
    // Bild nur bei Bedarf: Aufgabe hatte zuletzt Fehler/Abzählen → Bild bleibt stehen;
    // Tempo oder Treffer lassen gerade nach → Bild kurz einblenden; sonst kein Bild.
    let mode, ms = 1500;
    if (f.type === 'qty') {
      mode = 'flash';
      ms = st.box >= 4 ? 800 : st.box >= 2 ? 1300 : 2000;
    } else if ((st.help || 0) > 0) mode = 'show';
    else if (helpMode) mode = 'flash';
    else mode = 'hidden';
    stopVisual = mountVisual(els.visual, visualFor(f, strat), mode, { ms, onHint: () => { if (cur) cur.hinted = true; } });
    say(speakText(f));
    cur.start = clock.now();
    locked = false;
  }

  function renderEquation(state = '') {
    if (!cur) return;
    const parts = cur.f.type === 'qty' ? ['Wie viele?', '?'] : cur.f.parts;
    els.eq.innerHTML = parts.map(p => {
      if (p === '?') return `<span class="ans ${state}">${cur.typed ? esc(cur.typed) : '&nbsp;'}</span>`;
      if (typeof p === 'number') return `<span class="num">${p}</span>`;
      if (p.length > 1) return `<span class="label">${esc(p)}</span>`;
      return `<span class="op">${esc(p)}</span>`;
    }).join('');
  }

  function onDigit(d) {
    if (locked || !cur) return;
    if (cur.typed.length >= 2) return;
    cur.typed = (cur.typed === '0' ? '' : cur.typed) + d;
    renderEquation();
  }

  function onDelete() {
    if (locked || !cur) return;
    cur.typed = cur.typed.slice(0, -1);
    renderEquation();
  }

  function submit() {
    if (helpOpen) return nextTask();
    if (locked || !cur || cur.typed === '') return;
    locked = true;
    const ms = clock.now() - cur.start;
    const given = Number(cur.typed);
    const correct = given === cur.f.answer;
    const res = record(progress, cur.f, { correct, ms, given, hinted: cur.hinted });

    stats.n++;
    if (correct) { stats.correct++; stats.times.push(ms); }
    if (res.star) stats.stars++;

    // Serie (Combo): alle 5 richtigen hintereinander gibt es einen Bonus-Stern
    let comboBonus = false;
    if (correct) {
      stats.combo++;
      stats.bestCombo = Math.max(stats.bestCombo, stats.combo);
      if (stats.combo % COMBO_STEP === 0) { stats.stars++; stats.bonus++; comboBonus = true; }
    } else stats.combo = 0;
    els.combo.hidden = stats.combo < 3;
    els.comboN.textContent = stats.combo;
    if (comboBonus) {
      els.combo.classList.remove('bump');
      void els.combo.offsetWidth;
      els.combo.classList.add('bump');
      toast(`🔥 ${stats.combo} richtig in Folge! +1 ⭐`);
    }

    updateHelpMode(correct, ms);
    if (phase.tempo) {
      const t = stats.tempo;
      t.n++;
      if (correct) { t.correct++; t.times.push(ms); }
      if (res.star) t.stars++;
    }
    saveProgress();
    els.stars.textContent = stats.stars;
    updateBar();

    if (correct) {
      renderEquation('ok');
      if (res.star) { sounds.star(); starBurst(); } else sounds.ok();
      if (res.counting) setTimeout(() => showHelp('counting'), 450);
      else setTimeout(nextTask, res.star ? 520 : 400);
    } else {
      renderEquation('bad');
      sounds.wrong();
      retry.push({ id: cur.f.id, due: taskCount + 3 });
      setTimeout(() => showHelp('wrong'), 650);
    }
  }

  // Nach Fehler oder bei vermutetem Abzählen: Bild + Strategie-Tipp zeigen.
  function showHelp(why) {
    if (!cur) return;
    helpOpen = true;
    const { f, strat } = cur;
    const tip = strat.tip(f);
    stopVisual();
    els.visual.innerHTML = `<div class="visual">${visualFor(f, strat, { reveal: true })}</div>`;
    cur.typed = String(f.answer);
    renderEquation('fix');
    const head = why === 'wrong'
      ? `Fast! Richtig ist <b>${f.answer}</b>.`
      : 'Richtig! Mit diesem Trick geht es noch schneller:';
    els.feedback.innerHTML = `
      <div class="help">
        <p class="help-head">${head}</p>
        <p class="help-tip">💡 ${esc(tip)}</p>
        <button class="btn btn-go" type="button">Weiter ➜</button>
      </div>`;
    els.feedback.querySelector('button').addEventListener('click', nextTask);
    say(tip);
  }

  // Hilfsmodus an: ≥ 2 Fehler in den letzten 6 Antworten oder deutlich langsamer als das Tempo-Ziel.
  // Wieder aus: letzte 6 fehlerfrei und im Tempo.
  function updateHelpMode(correct, ms) {
    lastResults.push({ correct, ms });
    if (lastResults.length > 6) lastResults.shift();
    if (lastResults.length < 4) return;
    const errors = lastResults.filter(r => !r.correct).length;
    const med = median(lastResults.filter(r => r.correct).map(r => r.ms));
    const target = targetMs(progress);
    if (!helpMode && (errors >= 2 || med > target * 1.5)) {
      helpMode = true;
      toast('💡 Die Bilder helfen dir jetzt kurz.');
    } else if (helpMode && lastResults.length === 6 && errors === 0 && med <= target) {
      helpMode = false;
      toast('🚀 Super! Jetzt wieder ohne Bilder.');
    }
  }

  let toastTimer = null;
  function toast(text) {
    els.toast.textContent = text;
    els.toast.hidden = false;
    els.toast.classList.remove('show');
    void els.toast.offsetWidth;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 1800);
  }
  onLeave(() => clearTimeout(toastTimer));

  function starBurst() {
    const s = document.createElement('div');
    s.className = 'star-burst';
    s.textContent = '⭐';
    els.eq.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }

  function finish() {
    if (phase?.kind === 'task' && phase.tempo && phaseStart != null) stats.tempo.ms += clock.now() - phaseStart;
    stats.minutes = Math.round((Date.now() - stats.started) / 60000);
    go('summary', stats);
  }
}
