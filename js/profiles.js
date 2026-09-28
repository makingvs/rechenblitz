import * as db from './db.js';
import { uid } from './util.js';
import { defaultLook } from './avatar.js';

export const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🦁', '🐨', '🐙', '🦄', '🐢', '🐝', '🐧', '🐬', '🐻', '🐰', '🦉', '🐞'];

export function emptyProgress() {
  // facts: Lernstand je Aufgabe, sessions: Protokoll der 25-min-Einheiten,
  // recentTimes: letzte Antwortzeiten (richtig) für die Tempo-Steuerung
  return { facts: {}, sessions: [], recentTimes: [] };
}

export async function listProfiles() {
  const list = await db.all('profiles');
  return list.sort((a, b) => a.created - b.created);
}

export async function createProfile(name, avatar) {
  const p = {
    id: uid(),
    name: name.trim(),
    avatar,
    created: Date.now(),
    settings: { speech: false, sound: true, minutes: 25, pauseMinutes: 1 },
    unlocked: ['kraft5'],
    look: defaultLook(),
  };
  await db.put('profiles', p.id, p);
  await db.put('progress', p.id, emptyProgress());
  return p;
}

export const saveProfile = p => db.put('profiles', p.id, p);

export async function deleteProfile(id) {
  await db.del('profiles', id);
  await db.del('progress', id);
}

export async function loadProgress(id) {
  return (await db.get('progress', id)) || emptyProgress();
}

export const saveProgress = (id, progress) => db.put('progress', id, progress);
