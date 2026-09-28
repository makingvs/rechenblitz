// Globaler App-Zustand und einfacher Bildschirm-Router.
import { saveProgress as persistProgress, saveProfile as persistProfile } from './profiles.js';

export const app = {
  profile: null,   // aktives Kinderprofil
  progress: null,  // Lernstand des aktiven Kindes
};

const screens = {};
let cleanups = [];
let current = null, previous = null;

// Von welchem Bildschirm kam man zum aktuellen? (z. B. für die PIN-Abfrage)
export const previousScreen = () => previous;

export function register(name, render) { screens[name] = render; }

// Wird beim Verlassen des aktuellen Bildschirms ausgeführt (Timer, Listener …)
export function onLeave(fn) { cleanups.push(fn); }

export function go(name, ...args) {
  for (const fn of cleanups) { try { fn(); } catch (e) { console.error(e); } }
  cleanups = [];
  previous = current;
  current = name;
  try { window.speechSynthesis?.cancel(); } catch { /* optional */ }
  const root = document.getElementById('app');
  root.innerHTML = '';
  root.className = 'screen screen-' + name;
  window.scrollTo(0, 0);
  screens[name](root, ...args);
}

export function saveProgress() {
  if (!app.profile || !app.progress) return Promise.resolve();
  return persistProgress(app.profile.id, app.progress).catch(e => console.error('Speichern fehlgeschlagen', e));
}

export function saveProfile() {
  if (!app.profile) return Promise.resolve();
  return persistProfile(app.profile);
}
