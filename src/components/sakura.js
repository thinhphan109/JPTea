/**
 * Sakura petals component — injects 12 falling petals into DOM
 */

export function mountSakura(target = document.body) {
  if (target.querySelector('.sakura-container')) return;
  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const container = document.createElement('div');
  container.className = 'sakura-container';
  container.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < 12; i++) {
    const petal = document.createElement('div');
    petal.className = 'sakura';
    container.appendChild(petal);
  }

  target.appendChild(container);
}

export function unmountSakura() {
  document.querySelector('.sakura-container')?.remove();
}
