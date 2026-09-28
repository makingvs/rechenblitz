// Darstellung des Bildes zu einer Aufgabe:
//   'show'   – Bild bleibt stehen (Aufgabe braucht gerade Hilfe: Fehler/Abzählen)
//   'flash'  – Bild wird kurz gezeigt (Blitzblick, oder Tempo/Fehler lassen nach)
//   'hidden' – kein Bild, nur ein kleiner Hilfe-Knopf (Normalfall)

export function mountVisual(el, svg, mode, { ms = 1500, onHint } = {}) {
  let timer = null;
  if (mode === 'hidden') {
    el.innerHTML = `<button class="hint-btn" type="button">💡 Hilfe</button>`;
    el.firstElementChild.addEventListener('click', () => {
      onHint?.();
      el.innerHTML = `<div class="visual">${svg}</div>`;
    });
  } else {
    el.innerHTML = `<div class="visual">${svg}</div>`;
    if (mode === 'flash') {
      timer = setTimeout(() => el.firstElementChild?.classList.add('gone'), ms);
    }
  }
  return () => clearTimeout(timer);
}
