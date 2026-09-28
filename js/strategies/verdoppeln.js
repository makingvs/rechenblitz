// Verdoppeln, Halbieren und Nachbaraufgaben (4 + 5 = 4 + 4 + 1).
export default {
  id: 'verdoppeln',
  title: 'Verdoppeln',
  icon: '👯',
  color: '#F39C12',
  intro: 'Verdoppeln ist leicht – und die Nachbaraufgabe ist nur 1 mehr!',
  layout: 'rows',
  pool() {
    const ids = [];
    for (let a = 1; a <= 5; a++) ids.push(`add:${a}:${a}`);
    for (let a = 1; a <= 4; a++) ids.push(`add:${a}:${a + 1}`, `add:${a + 1}:${a}`);
    for (let a = 1; a <= 5; a++) ids.push(`sub:${2 * a}:${a}`);
    return ids;
  },
  tip(f) {
    if (f.type === 'sub') return `Halbieren: Die Hälfte von ${f.a} ist ${f.answer}.`;
    if (f.a === f.b) return `Verdoppeln: ${f.a} und noch einmal ${f.a} sind ${f.answer}.`;
    const m = Math.min(f.a, f.b);
    return `Nachbaraufgabe: ${m} + ${m} = ${2 * m}, und noch 1 dazu → ${f.answer}.`;
  },
};
