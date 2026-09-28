// Modul-Registry. Neue Module (ZR 20, Malreihen) werden hier aktiviert,
// sobald ihre Strategien in js/strategies/ existieren.

export const MODULES = [
  {
    id: 'zr10',
    title: 'Zahlenraum 10',
    icon: '🔟',
    ready: true,
    strategies: ['kraft5', 'zerlegen', 'ergaenzen10', 'verdoppeln', 'tausch', 'gemischt'],
  },
  {
    id: 'zr20',
    title: 'Zahlenraum 20',
    icon: '🧮',
    ready: false,
    note: 'Kraft der 10 · Zehnerübergang · Zwanzigerfeld',
    strategies: [],
  },
  {
    id: 'malreihen',
    title: 'Malreihen',
    icon: '✖️',
    ready: false,
    note: 'Kernaufgaben · Hilfsaufgaben · Analogieaufgaben',
    strategies: [],
  },
];
