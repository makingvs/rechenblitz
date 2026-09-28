import kraft5 from './kraft5.js';
import zerlegen from './zerlegen.js';
import ergaenzen10 from './ergaenzen10.js';
import verdoppeln from './verdoppeln.js';
import tausch from './tausch.js';
import gemischt from './gemischt.js';

// Lernpfad in didaktischer Reihenfolge.
export const PATH = [kraft5, zerlegen, ergaenzen10, verdoppeln, tausch, gemischt];
export const byId = Object.fromEntries(PATH.map(s => [s.id, s]));

const poolCache = {};
export function poolOf(sid) {
  return (poolCache[sid] ||= byId[sid].pool());
}

// Welche Strategie passt am besten zu einer Aufgabe? (für Tipps im gemischten Üben)
export function bestStrategy(f) {
  if (f.type === 'qty') return kraft5;
  if (f.type === 'mis') return f.b === 10 ? ergaenzen10 : zerlegen;
  if (f.type === 'add') {
    if (f.a + f.b === 10) return ergaenzen10;
    if (Math.abs(f.a - f.b) <= 1) return verdoppeln;
    if (f.b - f.a >= 2) return tausch;
    if (f.a >= 5) return kraft5;
    return gemischt;
  }
  if (f.type === 'sub') {
    if (f.a === 10) return ergaenzen10;
    if (f.a === 2 * f.b) return verdoppeln;
    return tausch;
  }
  return gemischt;
}

// Strategie für Tipp und Darstellung: die geübte Strategie, falls die Aufgabe dazugehört.
export function strategyFor(f, sid) {
  if (sid && sid !== 'gemischt' && poolOf(sid).includes(f.id)) return byId[sid];
  return bestStrategy(f);
}

export const tipFor = (f, sid) => strategyFor(f, sid).tip(f);
