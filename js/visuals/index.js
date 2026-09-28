import { feldSVG } from './zehnerfeld.js';
import { hausSVG } from './zahlenhaus.js';

// Wählt die passende Darstellung für eine Aufgabe und Strategie.
export function visualFor(f, strategy, { reveal = false } = {}) {
  if (f.type === 'mis' && f.b < 10 && strategy?.visual === 'haus') {
    return `<div class="visual-pair">${hausSVG(f, { reveal })}${feldSVG(f, { reveal })}</div>`;
  }
  if (f.type === 'mis' && f.b < 10) return hausSVG(f, { reveal });
  return feldSVG(f, { layout: strategy?.layout || 'fill', reveal });
}
