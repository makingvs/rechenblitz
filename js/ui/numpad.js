// Großes Ziffernfeld (statt Bildschirmtastatur). Reagiert auf pointerdown,
// damit schnelle Kinder nicht durch die Klick-Verzögerung gebremst werden.
// Gibt eine Aufräumfunktion zurück.

export function numpad(container, { onDigit, onDelete, onEnter }) {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  container.innerHTML = `
    <div class="numpad">
      ${keys.map(n => `<button class="key" data-k="${n}">${n}</button>`).join('')}
      <button class="key key-del" data-k="del" aria-label="Löschen">⌫</button>
      <button class="key" data-k="0">0</button>
      <button class="key key-ok" data-k="ok" aria-label="Fertig">✓</button>
    </div>`;

  const handle = k => {
    if (k === 'del') onDelete();
    else if (k === 'ok') onEnter();
    else onDigit(Number(k));
  };

  const onPointer = e => {
    const b = e.target.closest('[data-k]');
    if (!b || b.disabled) return;
    e.preventDefault();
    b.classList.add('pressed');
    setTimeout(() => b.classList.remove('pressed'), 120);
    handle(b.dataset.k);
  };
  const onKey = e => {
    if (e.target.closest?.('input, textarea')) return;
    if (/^[0-9]$/.test(e.key)) handle(e.key);
    else if (e.key === 'Backspace') handle('del');
    else if (e.key === 'Enter') handle('ok');
  };

  container.addEventListener('pointerdown', onPointer);
  window.addEventListener('keydown', onKey);
  return () => {
    container.removeEventListener('pointerdown', onPointer);
    window.removeEventListener('keydown', onKey);
  };
}
