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

register('profiles', renderProfiles);
register('menu', renderMenu);
register('session', renderSession);
register('summary', renderSummary);
register('parent', renderParent);
register('spiel', renderSpiel);
register('entspannung', renderEntspannung);
register('memory', renderMemory);
register('sammlung', renderSammlung);

// Offline-Betrieb
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service Worker nicht registriert', e));
}
requestPersist();

// Doppeltipp-Zoom und Kontextmenü auf dem iPad unterdrücken
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
document.addEventListener('contextmenu', e => { if (!e.target.closest('input, textarea')) e.preventDefault(); });

go('profiles');
