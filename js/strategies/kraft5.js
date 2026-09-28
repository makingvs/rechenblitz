import { addPairs } from '../tasks/facts.js';

// Kraft der 5: Mengen strukturiert erfassen (5 und noch …) statt zählen.
export default {
  id: 'kraft5',
  title: 'Kraft der 5',
  icon: '🖐️',
  color: '#E4572E',
  intro: 'Schau genau hin: Eine volle Reihe sind immer 5!',
  pool() {
    const ids = [5, 10, 6, 4, 7, 3, 8, 2, 9, 1].map(n => `qty:${n}`);
    ids.push(...[1, 2, 3, 4, 5].map(b => `add:5:${b}`));
    ids.push(...[1, 2, 3, 4].map(a => `add:${a}:5`));
    for (const [a, b] of addPairs()) {
      if ((a > 5 || b > 5) && !ids.includes(`add:${a}:${b}`)) ids.push(`add:${a}:${b}`);
    }
    return ids;
  },
  tip(f) {
    if (f.type === 'qty') {
      if (f.a === 5) return 'Eine volle Reihe – das sind 5!';
      if (f.a === 10) return 'Zwei volle Reihen: 5 und 5 sind 10.';
      if (f.a > 5) return `Eine volle Reihe und noch ${f.a - 5}: 5 + ${f.a - 5} = ${f.a}.`;
      return `Fast eine volle Reihe: 5 − ${5 - f.a} = ${f.a}.`;
    }
    const big = Math.max(f.a, f.b), small = Math.min(f.a, f.b);
    if (big === 5) return `5 und ${small}: die volle Reihe und ${small} mehr → ${f.answer}.`;
    return `${big} ist 5 und ${big - 5}. Also 5 + ${big - 5} + ${small} = ${f.answer}.`;
  },
};
