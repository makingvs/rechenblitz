// Ergänzen auf 10 – die „Zehnerfreunde“. Wichtigste Vorbereitung für den Zehnerübergang im ZR 20.
export default {
  id: 'ergaenzen10',
  title: 'Ergänzen auf 10',
  icon: '🤝',
  color: '#2BA84A',
  intro: 'Zehnerfreunde: Zwei Zahlen, die zusammen 10 ergeben.',
  pool() {
    const ids = [];
    for (const a of [5, 9, 1, 8, 2, 7, 3, 6, 4]) ids.push(`mis:${a}:10`);
    for (let a = 1; a <= 9; a++) ids.push(`add:${a}:${10 - a}`);
    for (let b = 1; b <= 9; b++) ids.push(`sub:10:${b}`);
    return ids;
  },
  tip(f) {
    if (f.type === 'mis') return `${f.a} Plätze sind voll, ${f.answer} sind frei. ${f.a} und ${f.answer} sind Zehnerfreunde!`;
    if (f.type === 'add') return `${f.a} und ${f.b} sind Zehnerfreunde – zusammen 10!`;
    return `10 − ${f.b}: Denk an die Zehnerfreunde ${f.b} und ${f.answer}.`;
  },
};
