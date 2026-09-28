// Zehnerfeld (2 × 5) als SVG. Die Fünferstruktur ist sofort sichtbar:
// Eine Reihe = 5. Rot = erste Zahl, Blau = zweite Zahl.
//   layout 'fill': Punkte laufen zeilenweise weiter (Kraft der 5)
//   layout 'rows': erste Zahl oben, zweite unten (Verdoppeln)
// reveal: bei Ergänzungsaufgaben die fehlenden Punkte blau zeigen.

const CELL = 64, R = 23, PAD = 10;

export function feldSVG(f, { layout = 'fill', reveal = false } = {}) {
  const cells = Array.from({ length: 10 }, () => 'empty');
  const set = (i, kind) => { if (i >= 0 && i < 10) cells[i] = kind; };

  if (f.type === 'qty') {
    for (let i = 0; i < f.a; i++) set(i, 'c1');
  } else if (f.type === 'add') {
    if (layout === 'rows' && f.a <= 5 && f.b <= 5) {
      for (let i = 0; i < f.a; i++) set(i, 'c1');
      for (let i = 0; i < f.b; i++) set(5 + i, 'c2');
    } else {
      for (let i = 0; i < f.a; i++) set(i, 'c1');
      for (let i = 0; i < f.b; i++) set(f.a + i, 'c2');
    }
  } else if (f.type === 'sub') {
    for (let i = 0; i < f.a; i++) set(i, i >= f.a - f.b ? 'gone' : 'c1');
  } else if (f.type === 'mis') {
    for (let i = 0; i < f.a; i++) set(i, 'c1');
    for (let i = f.a; i < f.b; i++) set(i, reveal ? 'c2' : 'open');
    for (let i = f.b; i < 10; i++) set(i, 'off');
  }

  const w = 5 * CELL + 2 * PAD, h = 2 * CELL + 2 * PAD;
  let body = `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="14" class="feld-frame"/>`;
  cells.forEach((kind, i) => {
    const x = PAD + (i % 5) * CELL, y = PAD + Math.floor(i / 5) * CELL;
    const cx = x + CELL / 2, cy = y + CELL / 2;
    body += `<rect x="${x + 3}" y="${y + 3}" width="${CELL - 6}" height="${CELL - 6}" rx="8" class="feld-cell${kind === 'off' ? ' off' : ''}"/>`;
    if (kind === 'c1' || kind === 'c2') {
      body += `<circle cx="${cx}" cy="${cy}" r="${R}" class="dot dot-${kind}"/>`;
    } else if (kind === 'gone') {
      body += `<circle cx="${cx}" cy="${cy}" r="${R}" class="dot dot-gone"/>`;
      body += `<path d="M${cx - 15} ${cy - 15}L${cx + 15} ${cy + 15}M${cx + 15} ${cy - 15}L${cx - 15} ${cy + 15}" class="cross"/>`;
    } else if (kind === 'open') {
      body += `<circle cx="${cx}" cy="${cy}" r="${R}" class="dot dot-open"/>`;
    }
  });
  // Trennlinie zwischen den Reihen betont die Fünfer
  body += `<line x1="${PAD}" y1="${PAD + CELL}" x2="${w - PAD}" y2="${PAD + CELL}" class="feld-mid"/>`;
  return `<svg viewBox="0 0 ${w} ${h}" class="zehnerfeld" role="img" aria-label="Zehnerfeld">${body}</svg>`;
}
