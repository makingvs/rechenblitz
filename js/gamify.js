// Gamification: Erfahrungspunkte & Level, Tage-Serie, Rekorde, Abzeichen, Sticker-Album.
// Alles wird im Lernstand des Kindes gespeichert (progress.game).
import { PATH } from './strategies/index.js';
import { mastery } from './adaptive.js';
import { fmtSec, pick } from './util.js';

export const STICKERS = [
  '🦊', '🐼', '🐯', '🐸', '🦁', '🐨', '🐙', '🦄', '🐢', '🐝', '🐧', '🐬', '🐻', '🐰', '🦉', '🐞',
  '🦋', '🐳', '🦖', '🦕', '🐲', '🦜', '🦩', '🦔', '🐿️', '🦥', '🐌', '🦀', '🐠', '🦒',
  '🚀', '🛸', '🌈', '⭐', '🌙', '☀️', '🍀', '🌻', '🍓', '🍉', '🍩', '🧁', '⚽', '🎸', '🎨', '🏰', '🎡', '🚂',
];

const TITLES = [
  'Rechen-Küken 🐣', 'Zahlen-Entdecker 🔎', 'Plus-Profi ➕', 'Minus-Meister ➖', 'Blitz-Rechner ⚡',
  'Zehner-Held 🦸', 'Rechen-Rakete 🚀', 'Zahlen-Zauberer 🧙', 'Mathe-Champion 🏆', 'Rechenblitz-Legende 🌟',
];

export const BADGES = [
  { id: 'start', icon: '🎉', title: 'Los geht’s!', desc: 'Erste Einheit geschafft' },
  { id: 'reward', icon: '🏆', title: 'Belohnt', desc: 'Erste Belohnung verdient' },
  { id: 'combo10', icon: '🔥', title: 'Feuer-Serie', desc: '10 richtig hintereinander' },
  { id: 'combo25', icon: '☄️', title: 'Kometen-Serie', desc: '25 richtig hintereinander' },
  { id: 'stars30', icon: '🌟', title: 'Sternenregen', desc: '30 Sterne in einer Einheit' },
  { id: 'stars60', icon: '💫', title: 'Sternen-Sturm', desc: '60 Sterne in einer Einheit' },
  { id: 'perfect', icon: '✨', title: 'Fehlerfrei', desc: 'Tempo-Runden ohne Fehler (mind. 10 Aufgaben)' },
  { id: 'record', icon: '⚡', title: 'Rekordjagd', desc: 'Eigenen Tempo-Rekord gebrochen' },
  { id: 'tasks500', icon: '💯', title: 'Fleißig', desc: '500 Aufgaben gerechnet' },
  { id: 'tasks2000', icon: '🏅', title: 'Super-fleißig', desc: '2000 Aufgaben gerechnet' },
  { id: 'days3', icon: '📅', title: 'Dranbleiber', desc: '3 Tage in Folge geübt' },
  { id: 'days7', icon: '🗓️', title: 'Wochen-Held', desc: '7 Tage in Folge geübt' },
  { id: 'level5', icon: '🎖️', title: 'Level 5', desc: 'Level 5 erreicht' },
  ...PATH.filter(s => s.id !== 'gemischt').map(s => ({
    id: 'meister_' + s.id, icon: s.icon, title: s.title, desc: `${s.title} gemeistert`,
  })),
];
const badgeById = Object.fromEntries(BADGES.map(b => [b.id, b]));

export function game(progress) {
  return (progress.game ||= {
    xp: 0, totalStars: 0, totalTasks: 0, bestStars: 0, bestCombo: 0, bestMedian: 0,
    days: 0, lastDay: '', badges: {}, stickers: [],
  });
}

// Level L beginnt bei 125·L·(L−1) XP: 0, 250, 750, 1500, 2500 …
const levelStart = L => 125 * L * (L - 1);
export function levelInfo(xp) {
  let L = 1;
  while (xp >= levelStart(L + 1)) L++;
  const a = levelStart(L), b = levelStart(L + 1);
  return { level: L, title: TITLES[Math.min(L, TITLES.length) - 1], pct: (xp - a) / (b - a), toNext: b - xp };
}

const dayKey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

// Aktuelle Tage-Serie (0, wenn gestern und heute nicht geübt wurde)
export function currentStreak(progress) {
  const g = game(progress);
  const today = dayKey(new Date()), yesterday = dayKey(new Date(Date.now() - 86400000));
  return g.lastDay === today || g.lastDay === yesterday ? g.days : 0;
}

/**
 * Nach einer Einheit (oder freiem Üben) aufrufen. rec = Sitzungsprotokoll (nur volle Einheit).
 * Liefert, was es Neues gibt: xp, Level-Aufstieg, Abzeichen, Rekorde, Sticker.
 */
export function applySession(progress, stats, rec) {
  const g = game(progress);
  const res = { newBadges: [], records: [], sticker: null };
  const earn = id => {
    if (!g.badges[id] && badgeById[id]) { g.badges[id] = Date.now(); res.newBadges.push(badgeById[id]); }
  };

  // Erfahrungspunkte
  res.xp = stats.correct + stats.stars * 2 + (rec?.success ? 50 : 0);
  res.levelBefore = levelInfo(g.xp).level;
  g.xp += res.xp;
  res.levelInfo = levelInfo(g.xp);
  res.levelUp = res.levelInfo.level > res.levelBefore;
  g.totalStars += stats.stars;
  g.totalTasks += stats.n;

  // Tage-Serie
  const today = dayKey(new Date());
  if (g.lastDay !== today && stats.n > 0) {
    const yesterday = dayKey(new Date(Date.now() - 86400000));
    g.days = g.lastDay === yesterday ? g.days + 1 : 1;
    g.lastDay = today;
    res.streakUp = true;
  }
  res.days = g.days;

  // Rekorde
  if (stats.bestCombo > g.bestCombo) {
    if (g.bestCombo >= 5) res.records.push(`Längste Serie: ${stats.bestCombo} richtig hintereinander 🔥`);
    g.bestCombo = stats.bestCombo;
  }
  if (rec) {
    if (stats.stars > g.bestStars) {
      if (g.bestStars > 0) res.records.push(`Sterne-Rekord: ${stats.stars} ⭐`);
      g.bestStars = stats.stars;
    }
    const med = rec.tempo.medianMs;
    if (med > 0 && rec.tempo.n >= 10 && rec.tempo.acc >= 0.85) {
      if (g.bestMedian && med < g.bestMedian) { res.records.push(`Tempo-Rekord: ${fmtSec(med)} pro Aufgabe ⚡`); earn('record'); }
      if (!g.bestMedian || med < g.bestMedian) g.bestMedian = med;
    }
  }

  // Abzeichen
  if (rec) earn('start');
  if (rec?.success) earn('reward');
  if (stats.bestCombo >= 10) earn('combo10');
  if (stats.bestCombo >= 25) earn('combo25');
  if (stats.stars >= 30) earn('stars30');
  if (stats.stars >= 60) earn('stars60');
  if (rec && rec.tempo.n >= 10 && rec.tempo.acc === 1) earn('perfect');
  if (g.totalTasks >= 500) earn('tasks500');
  if (g.totalTasks >= 2000) earn('tasks2000');
  if (g.days >= 3) earn('days3');
  if (g.days >= 7) earn('days7');
  if (res.levelInfo.level >= 5) earn('level5');
  for (const s of PATH) if (s.id !== 'gemischt' && mastery(progress, s.id) >= 0.8) earn('meister_' + s.id);

  // Sticker für jede erfolgreiche Einheit – zuerst die, die noch fehlen
  if (rec?.success) {
    const missing = STICKERS.filter(s => !g.stickers.includes(s));
    res.sticker = pick(missing.length ? missing : STICKERS);
    g.stickers.push(res.sticker);
    res.stickerNew = missing.length > 0;
  }
  return res;
}
