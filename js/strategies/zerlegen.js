// Zahlzerlegungen (Zahlenhäuser) – Grundlage für Ergänzen und Subtrahieren.
export default {
  id: 'zerlegen',
  title: 'Zahlenhäuser',
  icon: '🏠',
  color: '#8E6CCB',
  intro: 'Im Zahlenhaus wohnen zwei Zahlen. Zusammen ergeben sie die Dachzahl.',
  visual: 'haus',
  pool() {
    const ids = [];
    for (let c = 3; c <= 10; c++) for (let a = 1; a < c; a++) ids.push(`mis:${a}:${c}`);
    return ids;
  },
  tip(f) {
    return `Im Zahlenhaus ${f.b} wohnen ${f.a} und ${f.answer}: ${f.a} + ${f.answer} = ${f.b}.`;
  },
};
