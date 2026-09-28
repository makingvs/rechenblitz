// Adaptivität: Leitner-Boxen je Aufgabe, Tempo-Ziel aus den eigenen Zeiten,
// Erkennen von zählendem Rechnen und Freischalten des Lernpfads.
import { median } from './util.js';
import { PATH, poolOf } from './strategies/index.js';

export const MASTERY_BOX = 3;       // ab Box 3 gilt eine Aufgabe als „sicher“
export const MASTERY_SHARE = 0.8;   // 80 % sicher → nächste Strategie frei
const MAX_NEW = 3;                  // höchstens 3 neue Aufgaben gleichzeitig einführen

export function factState(progress, id) {
  return (progress.facts[id] ||= {
    box: 0, help: 0, times: [], seen: 0, correct: 0, wrong: 0,
    streak: 0, slow: 0, offByOne: 0, last: 0,
  });
}

// Zielzeit: eigener Median der letzten richtigen Antworten − 5 %
export function targetMs(progress) {
  const recent = progress.recentTimes.slice(-60);
  if (recent.length < 8) return 6000;
  return Math.max(1200, Math.round(median(recent) * 0.95));
}

/**
 * Antwort verbuchen. Liefert:
 *   star      – richtig und im Tempo-Ziel
 *   counting  – vermutlich abgezählt (wiederholt sehr langsam)
 *
 * Bildhilfe: st.help > 0 → bei dieser Aufgabe wird das Bild gezeigt.
 * Sie wird nach einem Fehler oder bei Abzählen gesetzt und verschwindet
 * wieder nach schnellen, richtigen Antworten.
 */
export function record(progress, f, { correct, ms, given, hinted }) {
  const st = factState(progress, f.id);
  const target = targetMs(progress);
  const globalMedian = median(progress.recentTimes.slice(-60));
  const res = { star: false, counting: false, target };

  st.seen++;
  st.last = Date.now();
  if (st.box === 0) st.box = 1;

  if (correct) {
    st.correct++;
    st.times = [...st.times, ms].slice(-6);
    progress.recentTimes = [...progress.recentTimes, ms].slice(-200);
    res.star = !hinted && ms <= target;

    const slow = progress.recentTimes.length >= 10 && ms > 2 * globalMedian;
    const fast = ms <= target * 1.5;

    if (slow) {
      st.slow++;
      st.streak = 0;
      if (st.slow >= 2) {
        // Zweimal sehr langsam → wahrscheinlich gezählt: zurück zur Strategie, Bild wieder zeigen
        st.box = Math.max(1, st.box - 1);
        st.slow = 0;
        st.help = 2;
        res.counting = true;
      }
    } else {
      st.slow = 0;
      if (fast && !hinted) {
        st.box = Math.min(5, st.box + 1);
        st.streak++;
        st.help = Math.max(0, (st.help || 0) - 1);
      } else {
        st.streak = 0;
      }
    }
  } else {
    st.wrong++;
    st.box = 1;
    st.streak = 0;
    st.help = 2;
    if (Math.abs(given - f.answer) === 1) st.offByOne++;
  }
  return res;
}

/**
 * Nächste Aufgabe wählen.
 * weakShare: Anteil unsicherer/neuer Aufgaben (Rest: sichere → Erfolgserlebnisse)
 * recent: zuletzt gestellte IDs (werden vermieden)
 */
export function pickFact(progress, pool, { weakShare = 0.3, recent = [] } = {}) {
  const weak = [], safe = [], fresh = [];
  for (const id of pool) {
    if (recent.includes(id)) continue;
    const st = progress.facts[id];
    if (!st || st.box === 0) fresh.push(id);
    else if (st.box < MASTERY_BOX) weak.push(id);
    else safe.push(id);
  }
  // Neue Aufgaben nur dosiert und in der Reihenfolge des Pools (leicht → schwer)
  const inProgress = weak.length;
  weak.push(...fresh.slice(0, Math.max(1, MAX_NEW - Math.floor(inProgress / 4))));

  let group = Math.random() < weakShare ? weak : safe;
  if (!group.length) group = group === weak ? safe : weak;
  if (!group.length) group = pool.filter(id => !recent.includes(id));
  if (!group.length) group = pool;

  const now = Date.now();
  const weights = group.map(id => {
    const st = progress.facts[id];
    const box = st?.box || 0;
    const days = st?.last ? Math.min(7, (now - st.last) / 86400000) : 1;
    return (6 - box) * (1 + days);
  });
  let r = Math.random() * weights.reduce((s, w) => s + w, 0);
  for (let i = 0; i < group.length; i++) {
    r -= weights[i];
    if (r <= 0) return group[i];
  }
  return group[group.length - 1];
}

export function mastery(progress, sid) {
  const pool = poolOf(sid);
  const ok = pool.filter(id => (progress.facts[id]?.box || 0) >= MASTERY_BOX).length;
  return ok / pool.length;
}

// Schaltet die nächste Strategie frei, sobald die vorige beherrscht wird.
// Gibt die neu freigeschalteten Strategien zurück.
export function updateUnlocks(profile, progress) {
  const newly = [];
  for (let i = 0; i < PATH.length - 1; i++) {
    const s = PATH[i], next = PATH[i + 1];
    if (profile.unlocked.includes(s.id) && !profile.unlocked.includes(next.id) && mastery(progress, s.id) >= MASTERY_SHARE) {
      profile.unlocked.push(next.id);
      newly.push(next);
    }
  }
  return newly;
}

// Aktuelle Übungsstrategie: erste freigeschaltete, die noch nicht sicher sitzt.
export function currentStrategy(profile, progress) {
  const unlocked = PATH.filter(s => profile.unlocked.includes(s.id));
  return unlocked.find(s => s.id !== 'gemischt' && mastery(progress, s.id) < MASTERY_SHARE)
    || unlocked[unlocked.length - 1] || PATH[0];
}

// Alle Aufgaben aus freigeschalteten Strategien (für Aufwärmen und Tempo).
export function unlockedPool(profile, { withQty = true } = {}) {
  const set = new Set();
  for (const s of PATH) {
    if (!profile.unlocked.includes(s.id)) continue;
    for (const id of poolOf(s.id)) if (withQty || !id.startsWith('qty:')) set.add(id);
  }
  // Nur Blitzblick freigeschaltet? Dann trotzdem die Kraft-der-5-Additionen nehmen.
  if (!set.size) poolOf('kraft5').filter(id => !id.startsWith('qty:')).forEach(id => set.add(id));
  return [...set];
}

// Hinweise für Erwachsene: Fehler um ±1 deuten auf Abzählen hin.
export function analysis(progress) {
  const facts = Object.entries(progress.facts);
  const wrong = facts.reduce((s, [, st]) => s + st.wrong, 0);
  const off1 = facts.reduce((s, [, st]) => s + st.offByOne, 0);
  const notes = [];
  if (wrong >= 5 && off1 / wrong >= 0.4) {
    notes.push(`Viele Fehler liegen genau um 1 daneben (${off1} von ${wrong}). Das Kind zählt vermutlich noch ab. Übe gezielt „Kraft der 5“ und den Blitzblick.`);
  }
  const slow = facts.filter(([, st]) => st.times.length >= 3 && median(st.times) > 2 * median(progress.recentTimes)).map(([id]) => id);
  if (slow.length) notes.push(`Deutlich langsamer als sonst bei: ${slow.slice(0, 8).map(prettyId).join(', ')}.`);
  return notes;
}

export function prettyId(id) {
  const [t, a, b] = id.split(':');
  if (t === 'add') return `${a}+${b}`;
  if (t === 'sub') return `${a}−${b}`;
  if (t === 'mis') return `${a}+_=${b}`;
  if (t === 'qty') return `Menge ${a}`;
  if (t === 'mul') return `${a}·${b}`;
  return id;
}
