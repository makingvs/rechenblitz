import { addPairs, subPairs } from '../tasks/facts.js';

// Alle Aufgaben des ZR 10 gemischt. Tipps kommen von der jeweils passendsten Strategie.
export default {
  id: 'gemischt',
  title: 'Alles gemischt',
  icon: '🎲',
  color: '#16A2A5',
  intro: 'Jetzt kommt alles durcheinander. Denk an deine Tricks!',
  pool() {
    const ids = addPairs().map(([a, b]) => `add:${a}:${b}`);
    ids.push(...subPairs().map(([c, b]) => `sub:${c}:${b}`));
    for (let a = 1; a <= 9; a++) ids.push(`mis:${a}:10`);
    return ids;
  },
  tip(f) {
    if (f.type === 'add') return `Stell dir das Zehnerfeld vor: ${Math.max(f.a, f.b)} und noch ${Math.min(f.a, f.b)} → ${f.answer}.`;
    if (f.type === 'sub') return `Umkehraufgabe: ${f.b} + ${f.answer} = ${f.a}.`;
    return `${f.a} + ${f.answer} = ${f.b}.`;
  },
};
