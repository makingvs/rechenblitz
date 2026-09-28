import { app, go } from '../state.js';
import { listProfiles, loadProgress, saveProfile } from '../profiles.js';
import { avatarSVG, ensureLook } from '../avatar.js';
import { setSpeech } from '../ui/speech.js';
import { setSound, esc } from '../util.js';

export async function selectProfile(p) {
  if (ensureLook(p)) await saveProfile(p);
  app.profile = p;
  app.progress = await loadProgress(p.id);
  setSpeech(p.settings?.speech);
  setSound(p.settings?.sound !== false);
}

export async function renderProfiles(root) {
  const profiles = await listProfiles();
  for (const p of profiles) if (ensureLook(p)) await saveProfile(p);
  root.innerHTML = `
    <div class="page page-center hero-page">
      <h1 class="logo">Rechen<span>blitz</span> <i>⚡</i></h1>
      ${profiles.length ? `
        <p class="lead">Wer übt heute?</p>
        <div class="avatar-grid">
          ${profiles.map(p => `
            <button class="avatar-btn" data-id="${p.id}">
              <span class="avatar-pic">${avatarSVG(p.look)}</span>
              <span class="avatar-name">${esc(p.name)}</span>
            </button>`).join('')}
        </div>` : `
        <div class="card empty-card">
          <p><b>Willkommen!</b></p>
          <p>Noch ist kein Kind angelegt. Eine erwachsene Person richtet die App im Bereich <b>Für Erwachsene</b> ein.</p>
        </div>`}
      <button class="btn btn-ghost adult-btn" data-act="parent">⚙️ Für Erwachsene</button>
    </div>`;

  root.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', async () => {
    await selectProfile(profiles.find(p => p.id === b.dataset.id));
    go('menu');
  }));
  root.querySelector('[data-act="parent"]').addEventListener('click', () => go('parent'));
}
