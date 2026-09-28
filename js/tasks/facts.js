// Ein „Fakt“ ist eine einzelne Grundaufgabe mit stabiler ID.
// Format der ID: "typ:a:b" – funktioniert später genauso für ZR 20 und Malreihen.
//   add:a:b  →  a + b = ?
//   sub:a:b  →  a − b = ?
//   mis:a:b  →  a + ? = b   (Ergänzen / Zerlegen)
//   qty:n    →  Wie viele Punkte? (Blitzblick)
//   (später) mul:a:b → a · b = ?

export function parseFact(id) {
  const [type, x, y] = id.split(':');
  const a = Number(x), b = Number(y);
  switch (type) {
    case 'add': return { id, type, a, b, answer: a + b, parts: [a, '+', b, '=', '?'] };
    case 'sub': return { id, type, a, b, answer: a - b, parts: [a, '−', b, '=', '?'] };
    case 'mis': return { id, type, a, b, answer: b - a, parts: [a, '+', '?', '=', b] };
    case 'qty': return { id, type, a, b: 0, answer: a, parts: ['?'] };
    case 'mul': return { id, type, a, b, answer: a * b, parts: [a, '·', b, '=', '?'] };
    default: throw new Error('Unbekannte Aufgabe: ' + id);
  }
}

export function speakText(f) {
  switch (f.type) {
    case 'add': return `${f.a} plus ${f.b}`;
    case 'sub': return `${f.a} minus ${f.b}`;
    case 'mis': return `${f.a} plus wie viel ist ${f.b}?`;
    case 'qty': return 'Wie viele Punkte?';
    case 'mul': return `${f.a} mal ${f.b}`;
    default: return '';
  }
}

// Alle Additionen a + b ≤ max (a, b ≥ 1)
export function addPairs(max = 10) {
  const out = [];
  for (let a = 1; a < max; a++) for (let b = 1; a + b <= max; b++) out.push([a, b]);
  return out;
}

// Alle Subtraktionen c − b mit 1 ≤ b < c ≤ max
export function subPairs(max = 10) {
  const out = [];
  for (let c = 2; c <= max; c++) for (let b = 1; b < c; b++) out.push([c, b]);
  return out;
}
