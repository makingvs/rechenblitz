// Kinder-Avatar als SVG, aus Einzelteilen zusammengesetzt.
// Manche Teile werden erst mit höherem Level freigeschaltet (lvl).
import { levelInfo, game } from './gamify.js';
import { pick } from './util.js';

const SKINS = ['#FFE0CC', '#F7C9A6', '#E8AE84', '#C98B5B', '#9A6238', '#6B4226'];
const HAIR_COLORS = ['#2B1B12', '#6B3E1F', '#B5702C', '#E8C26A', '#D9582B', '#9AA0A6', '#6C5CE7', '#FF6FA8', '#1FB5A8'];
const CLOTH = ['#6C5CE7', '#FF6B6B', '#FFB020', '#22B573', '#2E9BF0', '#FF6FA8', '#1FB5A8', '#2B2A33', '#FFFFFF'];
const BGS = ['#E9E5FF', '#FFE3E3', '#FFF1C9', '#DDF6E8', '#DCEEFF', '#FFE0F0', '#2B2A33'];

// Katalog der wählbaren Teile. options: [{id, name, lvl?}] oder Farben.
export const PARTS = [
  { key: 'skin', label: 'Haut', icon: '✋', colors: SKINS },
  { key: 'hair', label: 'Frisur', icon: '💇', options: [
    { id: 'kurz', name: 'Kurz' }, { id: 'lang', name: 'Lang' }, { id: 'zoepfe', name: 'Zöpfe' },
    { id: 'locken', name: 'Locken' }, { id: 'stachel', name: 'Stachelig', lvl: 2 }, { id: 'dutt', name: 'Dutt', lvl: 2 },
    { id: 'glatze', name: 'Keine' },
  ] },
  { key: 'hairColor', label: 'Haarfarbe', icon: '🎨', colors: HAIR_COLORS, lvlFrom: { 6: 3, 7: 3, 8: 3 } },
  { key: 'eyes', label: 'Augen', icon: '👀', options: [
    { id: 'punkt', name: 'Punkte' }, { id: 'gross', name: 'Groß' }, { id: 'froh', name: 'Fröhlich' }, { id: 'zwinker', name: 'Zwinkern', lvl: 2 },
  ] },
  { key: 'mouth', label: 'Mund', icon: '👄', options: [
    { id: 'laecheln', name: 'Lächeln' }, { id: 'grinsen', name: 'Grinsen' }, { id: 'staunen', name: 'Staunen' }, { id: 'zunge', name: 'Zunge', lvl: 2 },
  ] },
  { key: 'shirt', label: 'Shirt', icon: '👕', colors: CLOTH },
  { key: 'deco', label: 'Motiv', icon: '⭐', options: [
    { id: 'none', name: 'Ohne' }, { id: 'stern', name: 'Stern' }, { id: 'herz', name: 'Herz' },
    { id: 'blitz', name: 'Blitz', lvl: 2 }, { id: 'streifen', name: 'Streifen', lvl: 3 },
  ] },
  { key: 'hat', label: 'Kopf', icon: '👑', options: [
    { id: 'none', name: 'Ohne' }, { id: 'kappe', name: 'Kappe' }, { id: 'schleife', name: 'Schleife' },
    { id: 'katze', name: 'Katzenohren', lvl: 2 }, { id: 'party', name: 'Partyhut', lvl: 3 }, { id: 'blumen', name: 'Blumenkranz', lvl: 3 },
    { id: 'krone', name: 'Krone', lvl: 4 }, { id: 'zauber', name: 'Zauberhut', lvl: 5 }, { id: 'pirat', name: 'Piratenhut', lvl: 6 },
    { id: 'helm', name: 'Astronaut', lvl: 7 },
  ] },
  { key: 'hatColor', label: 'Hutfarbe', icon: '🖌️', colors: CLOTH },
  { key: 'glasses', label: 'Brille', icon: '👓', options: [
    { id: 'none', name: 'Ohne' }, { id: 'rund', name: 'Rund' }, { id: 'sonne', name: 'Sonnenbrille', lvl: 2 }, { id: 'stern', name: 'Sternbrille', lvl: 4 },
  ] },
  { key: 'cape', label: 'Umhang', icon: '🦸', options: [
    { id: 'none', name: 'Ohne' }, { id: 'rot', name: 'Rot', lvl: 3 }, { id: 'lila', name: 'Lila', lvl: 4 }, { id: 'gold', name: 'Gold', lvl: 6 },
  ] },
  { key: 'bg', label: 'Hintergrund', icon: '🟣', colors: BGS },
];

export function defaultLook() {
  return {
    skin: pick(SKINS.slice(0, 4)), hair: pick(['kurz', 'lang', 'zoepfe', 'locken']), hairColor: pick(HAIR_COLORS.slice(0, 5)),
    eyes: 'punkt', mouth: 'laecheln', shirt: pick(CLOTH.slice(0, 7)), deco: 'none',
    hat: 'none', hatColor: '#FF6B6B', glasses: 'none', cape: 'none', bg: pick(BGS.slice(0, 6)),
  };
}

// Ist eine Option für diesen Lernstand schon freigeschaltet?
export function requiredLevel(part, value) {
  if (part.options) return part.options.find(o => o.id === value)?.lvl || 1;
  const idx = part.colors.indexOf(value);
  return part.lvlFrom?.[idx] || 1;
}
export const playerLevel = progress => levelInfo(game(progress).xp).level;

let uid = 0;
const CAPE = { rot: '#E63946', lila: '#7B2FF7', gold: '#F5B700' };

/** SVG eines Avatars. opts.bg=false → ohne Hintergrundkreis (z. B. im Spiel). */
export function avatarSVG(look, { bg = true, cls = 'avatar-svg' } = {}) {
  const L = { ...defaultLook(), ...look };
  const id = 'av' + (++uid);
  const hc = L.hairColor, sk = L.skin;
  const dark = '#2B2A33';
  let s = `<svg viewBox="0 -24 200 246" class="${cls}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Avatar">`;
  s += `<defs><clipPath id="${id}c"><circle cx="100" cy="110" r="100"/></clipPath>
    <pattern id="${id}s" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="7" fill="rgba(255,255,255,.45)"/></pattern></defs>`;
  s += `<g ${bg ? `clip-path="url(#${id}c)"` : ''}>`;
  if (bg) s += `<circle cx="100" cy="110" r="100" fill="${L.bg}"/>`;

  // Umhang (hinter dem Körper)
  if (L.cape !== 'none') s += `<path d="M62 146 C40 170 20 200 6 222 L194 222 C180 200 160 170 138 146 Z" fill="${CAPE[L.cape]}"/>`;
  // Lange Haare hinten
  if (L.hair === 'lang') s += `<path d="M48 96 C48 40 152 40 152 96 L158 170 C140 178 124 168 120 156 L80 156 C76 168 60 178 42 170 Z" fill="${hc}"/>`;
  if (L.hair === 'zoepfe') s += `<circle cx="46" cy="112" r="17" fill="${hc}"/><circle cx="154" cy="112" r="17" fill="${hc}"/><circle cx="42" cy="136" r="13" fill="${hc}"/><circle cx="158" cy="136" r="13" fill="${hc}"/>`;

  // Körper & Hals
  s += `<rect x="88" y="132" width="24" height="26" rx="8" fill="${sk}"/>`;
  s += `<path d="M36 222 C36 176 64 152 100 152 C136 152 164 176 164 222 Z" fill="${L.shirt}"/>`;
  if (L.shirt === '#FFFFFF') s += `<path d="M36 222 C36 176 64 152 100 152 C136 152 164 176 164 222 Z" fill="none" stroke="#E4E0F0" stroke-width="3"/>`;
  if (L.cape !== 'none') s += `<path d="M74 154 L100 172 L126 154" fill="none" stroke="${CAPE[L.cape]}" stroke-width="8" stroke-linejoin="round"/>`;
  if (L.deco === 'streifen') s += `<path d="M36 222 C36 176 64 152 100 152 C136 152 164 176 164 222 Z" fill="url(#${id}s)"/>`;
  if (L.deco === 'stern') s += `<path d="M100 170 l6 13 14 1 -11 9 4 14 -13 -8 -13 8 4 -14 -11 -9 14 -1 z" fill="#FFD43B" stroke="#F0A800" stroke-width="2"/>`;
  if (L.deco === 'herz') s += `<path d="M100 206 C82 192 78 182 84 175 C90 168 98 172 100 178 C102 172 110 168 116 175 C122 182 118 192 100 206 Z" fill="#FF4D6D"/>`;
  if (L.deco === 'blitz') s += `<path d="M106 166 L88 192 L100 192 L94 212 L114 184 L102 184 Z" fill="#FFD43B" stroke="#F0A800" stroke-width="2"/>`;

  s += '</g>'; // ab hier nicht mehr beschnitten (Hüte dürfen über den Kreis hinausragen)

  // Kopf & Ohren
  s += `<circle cx="52" cy="100" r="10" fill="${sk}"/><circle cx="148" cy="100" r="10" fill="${sk}"/>`;
  s += `<circle cx="100" cy="94" r="50" fill="${sk}"/>`;

  // Gesicht
  const eye = (x, kind) => {
    if (kind === 'froh') return `<path d="M${x - 8} 97 Q${x} 87 ${x + 8} 97" stroke="${dark}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    if (kind === 'gross') return `<circle cx="${x}" cy="94" r="11" fill="#fff"/><circle cx="${x + 1}" cy="95" r="7" fill="${dark}"/><circle cx="${x + 3}" cy="92" r="2.6" fill="#fff"/>`;
    return `<circle cx="${x}" cy="95" r="6.5" fill="${dark}"/><circle cx="${x + 2}" cy="93" r="2.2" fill="#fff"/>`;
  };
  if (L.eyes === 'zwinker') s += eye(80, 'punkt') + `<path d="M112 96 Q120 90 128 96" stroke="${dark}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  else s += eye(80, L.eyes) + eye(120, L.eyes);
  s += `<circle cx="70" cy="112" r="8" fill="#FF8FA3" opacity=".45"/><circle cx="130" cy="112" r="8" fill="#FF8FA3" opacity=".45"/>`;
  if (L.mouth === 'grinsen') s += `<path d="M82 112 Q100 136 118 112 Z" fill="${dark}"/><path d="M86 113 L114 113 L112 118 L88 118 Z" fill="#fff"/>`;
  else if (L.mouth === 'staunen') s += `<ellipse cx="100" cy="120" rx="8" ry="10" fill="${dark}"/>`;
  else {
    s += `<path d="M84 114 Q100 130 116 114" stroke="${dark}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    if (L.mouth === 'zunge') s += `<path d="M96 121 Q100 132 106 121 Z" fill="#FF6B81"/>`;
  }

  // Haare vorne
  const fringe = `M50 94 C48 46 80 38 100 38 C124 38 154 48 150 94 C142 70 122 62 100 64 C80 62 58 70 50 94 Z`;
  if (L.hair === 'kurz' || L.hair === 'lang' || L.hair === 'zoepfe' || L.hair === 'dutt') s += `<path d="${fringe}" fill="${hc}"/>`;
  if (L.hair === 'dutt') s += `<circle cx="100" cy="36" r="18" fill="${hc}"/>`;
  if (L.hair === 'stachel') s += `<path d="M50 92 L54 56 L68 66 L74 40 L88 58 L100 32 L112 58 L126 40 L132 66 L146 56 L150 92 C140 70 120 64 100 66 C80 64 60 70 50 92 Z" fill="${hc}"/>`;
  if (L.hair === 'locken') {
    for (const [x, y, r] of [[58, 76, 15], [70, 56, 16], [90, 46, 17], [112, 46, 17], [132, 56, 16], [144, 76, 15], [52, 96, 11], [148, 96, 11]]) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${hc}"/>`;
  }

  // Brille
  if (L.glasses === 'rund') s += `<g fill="none" stroke="${dark}" stroke-width="4"><circle cx="80" cy="95" r="15"/><circle cx="120" cy="95" r="15"/><path d="M95 95 L105 95"/></g>`;
  if (L.glasses === 'sonne') s += `<g fill="${dark}"><rect x="62" y="84" width="34" height="22" rx="9"/><rect x="104" y="84" width="34" height="22" rx="9"/><rect x="94" y="90" width="12" height="4"/></g><rect x="68" y="88" width="10" height="4" rx="2" fill="#fff" opacity=".5"/>`;
  if (L.glasses === 'stern') {
    const star = (cx) => `<path d="M${cx} 78 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1 z" fill="#FFD43B" fill-opacity=".55" stroke="#F08C00" stroke-width="3"/>`;
    s += star(80) + star(120) + `<path d="M95 94 L105 94" stroke="#F08C00" stroke-width="3"/>`;
  }

  // Kopfbedeckung
  const hcl = L.hatColor;
  switch (L.hat) {
    case 'kappe': s += `<path d="M52 72 C54 34 146 34 148 72 Z" fill="${hcl}"/><path d="M100 72 L172 72 C172 80 160 84 146 82 L100 80 Z" fill="${hcl}"/><circle cx="100" cy="38" r="5" fill="${dark}" opacity=".25"/>`; break;
    case 'schleife': s += `<g transform="translate(132 50) rotate(20)"><path d="M0 0 L-24 -14 L-24 14 Z M0 0 L24 -14 L24 14 Z" fill="${hcl}"/><circle r="7" fill="${hcl}" stroke="${dark}" stroke-opacity=".2" stroke-width="2"/></g>`; break;
    case 'katze': s += `<path d="M56 64 L60 22 L88 48 Z M144 64 L140 22 L112 48 Z" fill="${hcl}"/><path d="M62 54 L64 32 L80 48 Z M138 54 L136 32 L120 48 Z" fill="#FFB3C6"/>`; break;
    case 'party': s += `<path d="M76 52 L100 -4 L124 52 Z" fill="${hcl}"/><path d="M86 30 L114 30 M81 42 L119 42" stroke="#fff" stroke-width="5"/><circle cx="100" cy="-2" r="8" fill="#FFD43B"/>`; break;
    case 'blumen': for (const [x, y, c] of [[58, 70, '#FF6B81'], [74, 52, '#FFD43B'], [92, 44, '#7AD7F0'], [110, 44, '#FF6B81'], [128, 52, '#FFD43B'], [142, 70, '#7AD7F0']]) s += `<circle cx="${x}" cy="${y}" r="9" fill="${c}"/><circle cx="${x}" cy="${y}" r="3.5" fill="#fff"/>`; break;
    case 'krone': s += `<path d="M62 60 L66 22 L84 42 L100 16 L116 42 L134 22 L138 60 Z" fill="#FFC928" stroke="#E0A000" stroke-width="3"/><circle cx="100" cy="46" r="6" fill="#FF4D6D"/><circle cx="80" cy="50" r="4" fill="#4DABF7"/><circle cx="120" cy="50" r="4" fill="#4DABF7"/>`; break;
    case 'zauber': s += `<path d="M44 66 L156 66 C150 74 50 74 44 66 Z" fill="${hcl}"/><path d="M60 66 L108 -10 L140 66 Z" fill="${hcl}"/><path d="M104 24 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z M86 48 l2 5 5 1 -4 3 1 5 -4 -3 -4 3 1 -5 -4 -3 5 -1 z" fill="#FFD43B"/>`; break;
    case 'pirat': s += `<path d="M40 64 C60 30 140 30 160 64 C140 56 60 56 40 64 Z" fill="#2B2A33"/><path d="M60 58 C70 20 130 20 140 58 Z" fill="#2B2A33"/><circle cx="100" cy="42" r="8" fill="#fff"/><path d="M94 52 L106 52" stroke="#fff" stroke-width="3"/>`; break;
    case 'helm': s += `<circle cx="100" cy="94" r="64" fill="#BDE0FE" fill-opacity=".25" stroke="#DDE3EA" stroke-width="7"/><path d="M60 50 Q76 36 96 34" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>`; break;
  }
  s += '</svg>';
  return s;
}

// Avatar als Bild (für das Jump & Run auf Canvas)
export function avatarImage(look) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(avatarSVG(look, { bg: false }));
  return img;
}

// Ältere Profile haben noch keinen Avatar → einen erzeugen.
export function ensureLook(profile) {
  if (!profile.look) { profile.look = defaultLook(); return true; }
  return false;
}
