// Zahlenhaus: Dachzahl oben, zwei Zimmer unten (a | ?).
export function hausSVG(f, { reveal = false } = {}) {
  const roof = f.b, left = f.a, right = reveal ? f.answer : '?';
  return `
  <svg viewBox="0 0 240 230" class="zahlenhaus" role="img" aria-label="Zahlenhaus ${roof}">
    <path d="M20 95 L120 12 L220 95 Z" class="haus-roof"/>
    <text x="120" y="80" class="haus-num haus-roofnum">${roof}</text>
    <rect x="30" y="95" width="180" height="120" rx="6" class="haus-body"/>
    <line x1="120" y1="95" x2="120" y2="215" class="haus-wall"/>
    <text x="75" y="172" class="haus-num dot-c1-text">${left}</text>
    <text x="165" y="172" class="haus-num ${reveal ? 'dot-c2-text' : 'haus-q'}">${right}</text>
  </svg>`;
}
