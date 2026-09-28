// Bereich für Eltern/Lehrkraft: PIN-geschützt. Profile, Freigaben, Auswertung, Sicherung.
import { app, go, onLeave, previousScreen } from './state.js';
import * as db from './db.js';
import { AVATARS, listProfiles, createProfile, saveProfile, deleteProfile, loadProgress, saveProgress, emptyProgress } from './profiles.js';
import { PATH } from './strategies/index.js';
import { mastery, analysis, prettyId } from './adaptive.js';
import { numpad } from './ui/numpad.js';
import { DURATIONS, PAUSES, phasePlan } from './session.js';

// Zeigt, wie sich die eingestellte Dauer auf die Teile der Einheit verteilt.
function planText(p) {
  const total = p.settings.minutes || 25;
  const plan = phasePlan(total, p.settings.pauseMinutes || 1);
  const f = x => String(x).replace('.', ',');
  return `Ablauf: Aufwärmen ${f(plan.warm)} · Üben ${f(plan.ueben)} · Bewegungspause ${plan.pause} · Tempo ${f(plan.tempo)} · Atempause ${plan.pause} · Tempo ${f(plan.tempo)} min · danach Abschluss und Belohnung.`;
}
import { EXERCISES } from './reward/entspannung.js';
import { GAMES } from './reward/games.js';
import { game, levelInfo, BADGES } from './gamify.js';
import { esc, median, fmtSec, fmtDate, pick } from './util.js';

// Die PIN gilt nur, solange man im Erwachsenen-Bereich bleibt. Wer ihn verlässt
// (auch zu einem Test-Spiel), muss sie beim Zurückkommen erneut eingeben.
let unlocked = false;

export async function renderParent(root, view = {}) {
  if (previousScreen() !== 'parent') unlocked = false;
  const pin = await db.get('meta', 'pin');
  if (!pin) return renderPin(root, 'setup');
  if (!unlocked) return renderPin(root, 'check', pin);
  return renderDashboard(root, view);
}

// ---------- PIN ----------
function renderPin(root, mode, pin) {
  let typed = '', first = null;
  const title = { setup: 'Lege eine 4-stellige PIN fest', check: 'PIN eingeben', confirm: 'PIN wiederholen' };
  root.innerHTML = `
    <div class="page page-center pin-page">
      <header class="page-head">
        <button class="icon-btn" data-act="back" aria-label="Zurück">←</button>
        <h1>⚙️ Für Erwachsene</h1>
      </header>
      <p class="lead pin-title">${title[mode]}</p>
      <div class="pin-dots"></div>
      <p class="pin-msg"></p>
      <div class="pin-pad"></div>
      ${mode === 'check' ? '<button class="btn btn-ghost" data-act="forgot">PIN vergessen?</button>' : ''}
    </div>`;
  const dots = root.querySelector('.pin-dots');
  const msg = root.querySelector('.pin-msg');
  const titleEl = root.querySelector('.pin-title');
  const draw = () => { dots.innerHTML = [0, 1, 2, 3].map(i => `<span class="${i < typed.length ? 'on' : ''}"></span>`).join(''); };
  draw();
  root.querySelector('[data-act="back"]').addEventListener('click', () => go('profiles'));
  root.querySelector('[data-act="forgot"]')?.addEventListener('click', () => renderGate(root));

  const done = async () => {
    if (mode === 'check') {
      if (typed === pin) { unlocked = true; return go('parent'); }
      msg.textContent = 'Falsche PIN';
      dots.classList.add('shake');
      setTimeout(() => dots.classList.remove('shake'), 400);
    } else if (first == null) {
      first = typed;
      titleEl.textContent = title.confirm;
    } else if (typed === first) {
      await db.put('meta', 'pin', typed);
      unlocked = true;
      return go('parent');
    } else {
      first = null;
      titleEl.textContent = title.setup;
      msg.textContent = 'Die PINs waren verschieden. Bitte nochmal.';
    }
    typed = '';
    draw();
  };

  onLeave(numpad(root.querySelector('.pin-pad'), {
    onDigit: d => { if (typed.length < 4) { typed += d; msg.textContent = ''; draw(); if (typed.length === 4) setTimeout(done, 150); } },
    onDelete: () => { typed = typed.slice(0, -1); draw(); },
    onEnter: () => {},
  }));
}

// „PIN vergessen“: Erwachsenen-Hürde mit zwei Einmaleins-Aufgaben, dann neue PIN.
function renderGate(root) {
  const tasks = [0, 1].map(() => [pick([6, 7, 8, 9]), pick([6, 7, 8, 9])]);
  root.innerHTML = `
    <div class="page page-center">
      <h1>PIN zurücksetzen</h1>
      <p class="lead">Nur für Erwachsene: Bitte beide Aufgaben lösen.</p>
      <form class="gate-form card">
        ${tasks.map(([a, b], i) => `<label>${a} × ${b} = <input name="t${i}" inputmode="numeric" autocomplete="off" required></label>`).join('')}
        <p class="pin-msg"></p>
        <div class="btn-row">
          <button class="btn btn-go" type="submit">Neue PIN festlegen</button>
          <button class="btn btn-ghost" type="button" data-act="back">Abbrechen</button>
        </div>
      </form>
    </div>`;
  root.querySelector('[data-act="back"]').addEventListener('click', () => go('profiles'));
  root.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const ok = tasks.every(([a, b], i) => Number(fd.get('t' + i)) === a * b);
    if (!ok) { root.querySelector('.pin-msg').textContent = 'Leider nicht richtig.'; return; }
    await db.del('meta', 'pin');
    go('parent');
  });
}

// ---------- Übersicht ----------
async function renderDashboard(root, { selected } = {}) {
  const profiles = await listProfiles();
  const sel = profiles.find(p => p.id === selected) || profiles[0];
  const progress = sel ? await loadProgress(sel.id) : null;

  root.innerHTML = `
    <div class="page parent">
      <header class="page-head">
        <button class="icon-btn" data-act="back" aria-label="Zurück">←</button>
        <h1>⚙️ Für Erwachsene</h1>
      </header>

      <div class="child-tabs">
        ${profiles.map(p => `<button class="child-tab ${p === sel ? 'active' : ''}" data-id="${p.id}">${p.avatar} ${esc(p.name)}</button>`).join('')}
        <button class="child-tab add" data-act="add">+ Kind anlegen</button>
      </div>

      <div class="add-slot"></div>
      ${sel ? detailHTML(sel, progress) : '<div class="card"><p>Lege zuerst ein Kind an.</p></div>'}

      <section class="card">
        <h2>Spiele & Entspannung testen</h2>
        <p class="muted">So sehen die Belohnungen und Pausen für die Kinder aus. Hier zählt nichts für den Lernstand.</p>
        <div class="btn-row start">
          ${GAMES.map(g => `<button class="btn" data-test="${g.id}">${g.icon} ${esc(g.title)}</button>`).join('')}
          ${Object.entries(EXERCISES).map(([k, ex]) => `<button class="btn" data-test-ex="${k}">${ex.icon} ${esc(ex.title)}</button>`).join('')}
        </div>
      </section>

      <section class="card">
        <h2>Datensicherung</h2>
        <p class="muted">Alle Daten liegen nur auf diesem iPad. Sichere sie regelmäßig als Datei (z. B. in „Dateien“ oder iCloud Drive).</p>
        <div class="btn-row">
          <button class="btn" data-act="export">⬇︎ Sichern (Export)</button>
          <label class="btn">⬆︎ Wiederherstellen (Import)<input type="file" accept="application/json,.json" hidden data-act="import"></label>
          <button class="btn btn-ghost" data-act="pin">PIN ändern</button>
        </div>
      </section>
    </div>`;

  const on = (sel_, ev, fn) => root.querySelectorAll(sel_).forEach(el => el.addEventListener(ev, fn));
  on('[data-act="back"]', 'click', () => go('profiles'));
  on('.child-tab[data-id]', 'click', e => go('parent', { selected: e.currentTarget.dataset.id }));
  on('[data-act="add"]', 'click', () => showAddForm(root));
  on('[data-test]', 'click', e => go(e.currentTarget.dataset.test, { back: 'parent' }));
  on('[data-test-ex]', 'click', e => go('entspannung', { back: 'parent', start: e.currentTarget.dataset.testEx }));
  on('[data-act="export"]', 'click', doExport);
  on('[data-act="import"]', 'change', e => doImport(e.target.files[0]));
  on('[data-act="pin"]', 'click', async () => { await db.del('meta', 'pin'); go('parent'); });
  if (!profiles.length) showAddForm(root);
  if (sel) bindDetail(root, sel, progress);
}

function showAddForm(root) {
  const slot = root.querySelector('.add-slot');
  let avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  slot.innerHTML = `
    <form class="card add-form">
      <h2>Neues Kind</h2>
      <label>Name <input name="name" maxlength="20" required autocomplete="off"></label>
      <div class="avatar-pick">${AVATARS.map(a => `<button type="button" class="${a === avatar ? 'on' : ''}" data-av="${a}">${a}</button>`).join('')}</div>
      <div class="btn-row"><button class="btn btn-go" type="submit">Anlegen</button></div>
    </form>`;
  slot.querySelectorAll('[data-av]').forEach(b => b.addEventListener('click', () => {
    avatar = b.dataset.av;
    slot.querySelectorAll('[data-av]').forEach(x => x.classList.toggle('on', x === b));
  }));
  slot.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = new FormData(e.target).get('name').trim();
    if (!name) return;
    const p = await createProfile(name, avatar);
    go('parent', { selected: p.id });
  });
  slot.querySelector('input').focus();
}

function detailHTML(p, progress) {
  const sessions = progress.sessions.slice(-20);
  const notes = analysis(progress);
  const problems = Object.entries(progress.facts)
    .filter(([, st]) => st.wrong > 0)
    .sort((a, b) => (b[1].wrong / b[1].seen) - (a[1].wrong / a[1].seen) || a[1].box - b[1].box)
    .slice(0, 10);
  const total = Object.values(progress.facts).reduce((s, st) => s + st.seen, 0);

  return `
    <section class="card">
      <h2>${p.avatar} ${esc(p.name)} – Überblick</h2>
      <div class="stat-row small">
        <div class="stat"><span class="stat-val">${progress.sessions.length}</span><span class="stat-lbl">Einheiten</span></div>
        <div class="stat"><span class="stat-val">${total}</span><span class="stat-lbl">Aufgaben gesamt</span></div>
        <div class="stat"><span class="stat-val">${progress.recentTimes.length ? fmtSec(median(progress.recentTimes.slice(-60))) : '–'}</span><span class="stat-lbl">aktuelles Tempo (Median)</span></div>
        <div class="stat"><span class="stat-val">${progress.sessions.filter(s => s.success).length}</span><span class="stat-lbl">Belohnungen</span></div>
        <div class="stat"><span class="stat-val">${levelInfo(game(progress).xp).level}</span><span class="stat-lbl">Level</span></div>
        <div class="stat"><span class="stat-val">${Object.keys(game(progress).badges).length}/${BADGES.length}</span><span class="stat-lbl">Abzeichen</span></div>
      </div>
      ${notes.map(n => `<p class="note">⚠️ ${esc(n)}</p>`).join('')}
    </section>

    <section class="card">
      <h2>Verlauf (letzte ${sessions.length || 0} Einheiten)</h2>
      ${sessions.length ? `
        <div class="chart-row">
          ${lineChart(sessions.map(s => ({ x: s.date, y: s.tempo.medianMs / 1000 })), { title: 'Sekunden pro Aufgabe (Tempo) – niedriger ist besser', fmt: v => v.toFixed(1).replace('.', ',') + ' s', zero: true })}
          ${lineChart(sessions.map(s => ({ x: s.date, y: s.tempo.acc * 100 })), { title: 'Richtig in den Tempo-Runden (%)', fmt: v => Math.round(v) + ' %', min: 0, max: 100 })}
        </div>
        <details><summary>Als Tabelle</summary>
          <table class="data-table"><thead><tr><th>Datum</th><th>Aufgaben</th><th>richtig</th><th>Sterne</th><th>s/Aufgabe</th><th>Tempo %</th><th>Belohnung</th></tr></thead>
          <tbody>${sessions.slice().reverse().map(s => `<tr><td>${fmtDate(s.date)}</td><td>${s.n}</td><td>${s.correct}</td><td>${s.stars}</td><td>${s.tempo.medianMs ? fmtSec(s.tempo.medianMs) : '–'}</td><td>${Math.round(s.tempo.acc * 100)} %</td><td>${s.success ? '🏆' : ''}</td></tr>`).join('')}</tbody></table>
        </details>` : '<p class="muted">Noch keine vollständige Einheit.</p>'}
    </section>

    <section class="card">
      <h2>Lernstand je Aufgabe</h2>
      <p class="muted">Jedes Feld ist eine Aufgabe. Je dunkler, desto sicherer (Leitner-Box 1–5). Tippe auf ein Feld für Details.</p>
      ${heatLegend()}
      <div class="heat-row">
        ${heatmap('Plus: a + b', range(1, 9), range(1, 9), (a, b) => a + b <= 10 ? `add:${a}:${b}` : null, progress, 'a', 'b')}
        ${heatmap('Minus: a − b', range(2, 10), range(1, 9), (a, b) => b < a ? `sub:${a}:${b}` : null, progress, 'a', 'b')}
      </div>
      <div class="heat-row">
        ${heatmap('Ergänzen: a + _ = 10', [10], range(1, 9), (c, a) => `mis:${a}:10`, progress, '', 'a')}
        ${heatmap('Blitzblick: Mengen', ['n'], range(1, 10), (_, n) => `qty:${n}`, progress, '', 'n')}
      </div>
      <p class="heat-info muted" aria-live="polite"></p>
    </section>

    <section class="card">
      <h2>Problemaufgaben</h2>
      ${problems.length ? `<table class="data-table"><thead><tr><th>Aufgabe</th><th>Fehler</th><th>gesehen</th><th>Box</th><th>Median-Zeit</th></tr></thead><tbody>
        ${problems.map(([id, st]) => `<tr><td>${prettyId(id)}</td><td>${st.wrong}</td><td>${st.seen}</td><td>${st.box}</td><td>${st.times.length ? fmtSec(median(st.times)) : '–'}</td></tr>`).join('')}
      </tbody></table>` : '<p class="muted">Noch keine Fehler – super!</p>'}
    </section>

    <section class="card">
      <h2>Lernpfad & Freigaben</h2>
      <p class="muted">Die nächste Strategie wird automatisch frei, wenn 80 % der Aufgaben sicher sitzen. Hier kannst du sie auch selbst freigeben.</p>
      <div class="path-list">
        ${PATH.map(s => {
          const m = Math.round(mastery(progress, s.id) * 100);
          return `<label class="path-item">
            <input type="checkbox" data-unlock="${s.id}" ${p.unlocked.includes(s.id) ? 'checked' : ''}>
            <span class="path-icon">${s.icon}</span><span class="path-title">${esc(s.title)}</span>
            <span class="mini-bar wide"><span style="width:${m}%"></span></span><span class="path-pct">${m} %</span>
          </label>`;
        }).join('')}
      </div>
    </section>

    <section class="card">
      <h2>Einstellungen für ${esc(p.name)}</h2>
      <label class="switch-row">Übungsdauer einer Einheit
        <select data-minutes>
          ${DURATIONS.map(m => `<option value="${m}" ${(p.settings.minutes || 25) === m ? 'selected' : ''}>${m} Minuten</option>`).join('')}
        </select>
      </label>
      <label class="switch-row">Länge jeder Pause
        <select data-pause>
          ${PAUSES.map(m => `<option value="${m}" ${(p.settings.pauseMinutes || 1) === m ? 'selected' : ''}>${m} ${m === 1 ? 'Minute' : 'Minuten'}</option>`).join('')}
        </select>
      </label>
      <p class="muted plan-text">${planText(p)}</p>
      <label class="switch-row"><input type="checkbox" data-set="speech" ${p.settings.speech ? 'checked' : ''}> Aufgaben vorlesen</label>
      <label class="switch-row"><input type="checkbox" data-set="sound" ${p.settings.sound !== false ? 'checked' : ''}> Töne</label>
      <label class="name-row">Name <input data-name value="${esc(p.name)}" maxlength="20"></label>
      <div class="avatar-pick">${AVATARS.map(a => `<button type="button" class="${a === p.avatar ? 'on' : ''}" data-av="${a}">${a}</button>`).join('')}</div>
      <div class="btn-row">
        <button class="btn btn-ghost" data-act="reset">Lernstand zurücksetzen</button>
        <button class="btn btn-danger" data-act="delete">Profil löschen</button>
      </div>
    </section>`;
}

function bindDetail(root, p, progress) {
  const refresh = () => go('parent', { selected: p.id });
  const sync = async () => {
    await saveProfile(p);
    if (app.profile?.id === p.id) app.profile = p;
  };
  root.querySelectorAll('[data-unlock]').forEach(cb => cb.addEventListener('change', async () => {
    const id = cb.dataset.unlock;
    p.unlocked = cb.checked ? [...new Set([...p.unlocked, id])] : p.unlocked.filter(x => x !== id);
    if (!p.unlocked.length) p.unlocked = ['kraft5'];
    await sync();
  }));
  root.querySelectorAll('[data-set]').forEach(cb => cb.addEventListener('change', async () => {
    p.settings[cb.dataset.set] = cb.checked;
    await sync();
  }));
  root.querySelector('[data-minutes]').addEventListener('change', async e => {
    p.settings.minutes = Number(e.target.value);
    root.querySelector('.plan-text').textContent = planText(p);
    await sync();
  });
  root.querySelector('[data-pause]').addEventListener('change', async e => {
    p.settings.pauseMinutes = Number(e.target.value);
    root.querySelector('.plan-text').textContent = planText(p);
    await sync();
  });
  root.querySelector('[data-name]').addEventListener('change', async e => {
    const v = e.target.value.trim();
    if (v) { p.name = v; await sync(); refresh(); }
  });
  root.querySelectorAll('.card [data-av]').forEach(b => b.addEventListener('click', async () => {
    p.avatar = b.dataset.av;
    await sync();
    refresh();
  }));
  root.querySelector('[data-act="reset"]').addEventListener('click', async () => {
    if (!confirm(`Lernstand von ${p.name} wirklich zurücksetzen? Alle Übungsdaten gehen verloren.`)) return;
    const fresh = emptyProgress();
    await saveProgress(p.id, fresh);
    p.unlocked = ['kraft5'];
    await sync();
    if (app.profile?.id === p.id) app.progress = fresh;
    refresh();
  });
  root.querySelector('[data-act="delete"]').addEventListener('click', async () => {
    if (!confirm(`Profil ${p.name} mit allen Daten löschen?`)) return;
    await deleteProfile(p.id);
    if (app.profile?.id === p.id) { app.profile = null; app.progress = null; }
    go('parent');
  });
  const info = root.querySelector('.heat-info');
  root.querySelectorAll('.heat-cell[data-fact]').forEach(c => c.addEventListener('click', () => {
    info.textContent = c.getAttribute('aria-label');
  }));
}

// ---------- Diagramme ----------
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const BOX_LABEL = ['nicht geübt', '1 neu', '2', '3 sicher', '4', '5 automatisiert'];

function heatLegend() {
  return `<div class="heat-legend">${BOX_LABEL.map((l, i) => `<span><i class="heat-cell box${i}"></i>${l}</span>`).join('')}</div>`;
}

function heatmap(title, rows, cols, idOf, progress, rowLbl, colLbl) {
  const head = `<tr><th></th>${cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
  const body = rows.map(r => `<tr><th>${typeof r === 'number' && rowLbl ? r : ''}</th>${cols.map(c => {
    const id = idOf(r, c);
    if (!id) return '<td></td>';
    const st = progress.facts[id];
    const box = st?.box || 0;
    const label = st
      ? `${prettyId(id)}: Box ${box}, ${st.seen}× gesehen, ${st.wrong} Fehler${st.times.length ? ', Median ' + fmtSec(median(st.times)) : ''}`
      : `${prettyId(id)}: noch nicht geübt`;
    return `<td><button class="heat-cell box${box}" data-fact="${id}" aria-label="${esc(label)}" title="${esc(label)}"></button></td>`;
  }).join('')}</tr>`).join('');
  return `<figure class="heat"><figcaption>${esc(title)}</figcaption><table class="heat-table">${cols.length ? `<thead>${head}</thead>` : ''}<tbody>${body}</tbody></table></figure>`;
}

// Einfaches Liniendiagramm (eine Reihe, eine Achse) mit Tooltips pro Punkt.
function lineChart(points, { title, fmt, min, max, zero }) {
  const W = 360, H = 170, L = 44, R = 12, T = 12, B = 26;
  const ys = points.map(p => p.y).filter(v => isFinite(v));
  let lo = min ?? (zero ? 0 : Math.min(...ys)), hi = max ?? Math.max(...ys, lo + 1);
  if (hi === lo) hi = lo + 1;
  hi = max ?? hi * 1.1;
  const x = i => points.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (points.length - 1);
  const y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = [lo, (lo + hi) / 2, hi];
  const grid = ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" class="grid"/><text x="${L - 6}" y="${y(t) + 4}" class="axis" text-anchor="end">${fmt(t)}</text>`).join('');
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.y).toFixed(1)}`).join(' ');
  const dots = points.map((p, i) => `<g class="pt"><circle cx="${x(i)}" cy="${y(p.y)}" r="12" class="hit"/><circle cx="${x(i)}" cy="${y(p.y)}" r="4.5" class="mark"/><title>${fmtDate(p.x)}: ${fmt(p.y)}</title></g>`).join('');
  const xl = points.length > 1
    ? `<text x="${x(0)}" y="${H - 6}" class="axis">${fmtDate(points[0].x)}</text><text x="${x(points.length - 1)}" y="${H - 6}" class="axis" text-anchor="end">${fmtDate(points[points.length - 1].x)}</text>`
    : `<text x="${x(0)}" y="${H - 6}" class="axis" text-anchor="middle">${fmtDate(points[0].x)}</text>`;
  return `<figure class="chart"><figcaption>${esc(title)}</figcaption>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${grid}<path d="${path}" class="line"/>${dots}${xl}</svg></figure>`;
}

// ---------- Sicherung ----------
async function doExport() {
  const data = await db.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rechenblitz-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

async function doImport(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!confirm('Alle Daten auf diesem iPad werden durch die Sicherung ersetzt. Fortfahren?')) return;
    await db.importAll(data);
    app.profile = null;
    app.progress = null;
    unlocked = true;
    alert('Sicherung wiederhergestellt.');
    go('parent');
  } catch (e) {
    alert('Import fehlgeschlagen: ' + e.message);
  }
}
