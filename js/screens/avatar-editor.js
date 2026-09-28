// Avatar gestalten: am Ende jeder Einheit (und über „Meine Sammlung“).
// Besondere Teile werden mit höherem Level freigeschaltet.
import { app, go, saveProfile } from '../state.js';
import { PARTS, avatarSVG, requiredLevel, playerLevel, defaultLook } from '../avatar.js';
import { sounds, esc, pick } from '../util.js';

export function renderAvatarEditor(root, { back = 'menu' } = {}) {
  const { profile, progress } = app;
  if (!profile) return go('profiles');
  const level = playerLevel(progress);
  const look = { ...defaultLook(), ...profile.look };
  let tab = PARTS[0].key;

  root.innerHTML = `
    <div class="page editor">
      <header class="page-head">
        <button class="icon-btn" data-act="back" aria-label="Zurück">←</button>
        <h1>👕 Mein Avatar</h1>
        <button class="btn" data-act="random">🎲 Zufall</button>
        <button class="btn btn-go" data-act="save">Fertig ✓</button>
      </header>
      <div class="editor-main">
        <div class="editor-preview card">
          <div class="preview-big"></div>
          <p class="muted">Level ${level} · Neue Sachen gibt es mit jedem Level!</p>
        </div>
        <div class="editor-side">
          <nav class="part-tabs">
            ${PARTS.map(p => `<button class="part-tab" data-tab="${p.key}"><span>${p.icon}</span>${esc(p.label)}</button>`).join('')}
          </nav>
          <div class="part-options card"></div>
        </div>
      </div>
    </div>`;

  const preview = root.querySelector('.preview-big');
  const optionsEl = root.querySelector('.part-options');

  function draw() {
    preview.innerHTML = avatarSVG(look);
    root.querySelectorAll('.part-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const part = PARTS.find(p => p.key === tab);
    const values = part.options ? part.options.map(o => o.id) : part.colors;
    optionsEl.innerHTML = `<div class="${part.colors ? 'color-grid' : 'option-grid'}">
      ${values.map(v => {
        const need = requiredLevel(part, v);
        const locked = need > level;
        const on = look[part.key] === v;
        if (part.colors) {
          return `<button class="color-opt ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-v="${v}" style="--c:${v}" ${locked ? 'disabled' : ''} aria-label="Farbe">${locked ? `🔒<small>Lv ${need}</small>` : ''}</button>`;
        }
        const name = part.options.find(o => o.id === v).name;
        return `<button class="option ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-v="${v}" ${locked ? 'disabled' : ''}>
          <span class="option-img">${avatarSVG({ ...look, [part.key]: v }, { bg: false })}</span>
          <span class="option-name">${locked ? `🔒 ab Level ${need}` : esc(name)}</span>
        </button>`;
      }).join('')}
    </div>`;
    optionsEl.querySelectorAll('[data-v]:not([disabled])').forEach(b => b.addEventListener('click', () => {
      look[part.key] = b.dataset.v;
      sounds.pop();
      draw();
    }));
  }

  root.querySelectorAll('.part-tab').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; draw(); }));
  root.querySelector('[data-act="random"]').addEventListener('click', () => {
    for (const p of PARTS) {
      const values = (p.options ? p.options.map(o => o.id) : p.colors).filter(v => requiredLevel(p, v) <= level);
      look[p.key] = pick(values);
    }
    sounds.pop();
    draw();
  });
  root.querySelector('[data-act="back"]').addEventListener('click', () => go(back));
  root.querySelector('[data-act="save"]').addEventListener('click', async () => {
    profile.look = { ...look };
    await saveProfile();
    sounds.star();
    go(back);
  });
  draw();
}
