// Optionales Vorlesen (de-DE) über die Sprachausgabe des iPads.
let enabled = false;

export function setSpeech(on) { enabled = !!on; }

export function say(text) {
  if (!enabled || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 0.95;
    const voice = speechSynthesis.getVoices().find(v => v.lang?.startsWith('de'));
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  } catch { /* Vorlesen ist optional */ }
}
