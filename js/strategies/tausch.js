import { addPairs, subPairs } from '../tasks/facts.js';

// Tauschaufgaben (große Zahl zuerst) und Umkehraufgaben (Minus über Plus lösen).
export default {
  id: 'tausch',
  title: 'Tauschen & Umkehren',
  icon: '🔄',
  color: '#2E86DE',
  intro: 'Tausche die Zahlen, wenn es leichter wird. Und Minus kannst du mit Plus lösen!',
  pool() {
    const ids = [];
    for (const [a, b] of addPairs()) if (b - a >= 2) ids.push(`add:${a}:${b}`);
    for (const [c, b] of subPairs()) if (c < 10 && c !== 2 * b) ids.push(`sub:${c}:${b}`);
    return ids;
  },
  tip(f) {
    if (f.type === 'add') return `Tauschaufgabe: ${f.b} + ${f.a} ist leichter. Fang mit der großen Zahl an → ${f.answer}.`;
    return `Umkehraufgabe: ${f.b} + ? = ${f.a}. Denn ${f.b} + ${f.answer} = ${f.a}.`;
  },
};
