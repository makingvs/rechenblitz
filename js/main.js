import { register, go } from './state.js';
import { requestPersist } from './db.js';
import { renderProfiles } from './screens/profiles.js';
import { renderMenu } from './screens/menu.js';
import { renderSummary } from './screens/summary.js';
import { renderSession } from './session.js';
import { renderParent } from './parent.js';
import { renderSpiel } from './reward/spiel.js';
import { renderEntspannung } from './reward/entspannung.js';
import { renderMemory } from './reward/memory.js';
import { renderSammlung } from './screens/sammlung.js';
import { renderSpiele } from './reward/games.js';
import { renderMaulwurf } from './reward/maulwurf.js';
import { renderFaenger } from './reward/faenger.js';
import { renderNachmacher } from './reward/nachmacher.js';
import { renderMalen } from './reward/malen.js';
import { renderJumpRun } from './reward/jumprun.js';
import { renderAvatarEditor } from './screens/avatar-editor.js';

register('profiles', renderProfiles);
register('menu', renderMenu);
register('session', renderSession);
register('summary', renderSummary);
register('parent', renderParent);
register('spiel', renderSpiel);
register('entspannung', renderEntspannung);
register('memory', renderMemory);
register('sammlung', renderSammlung);
register('spiele', renderSpiele);
register('maulwurf', renderMaulwurf);
register('faenger', renderFaenger);
register('nachmacher', renderNachmacher);
register('malen', renderMalen);
register('jumprun', renderJumpRun);
register('avatar', renderAvatarEditor);

// Offline-Betrieb
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service Worker nicht registriert', e));
}
requestPersist();

// Doppeltipp-Zoom und Kontextmenü auf dem iPad unterdrücken
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
document.addEventListener('contextmenu', e => { if (!e.target.closest('input, textarea')) e.preventDefault(); });

go('profiles');
