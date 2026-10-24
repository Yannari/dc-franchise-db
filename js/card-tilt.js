// Player cards that behave like trading cards: they tilt toward the pointer
// with a light glare that follows it, and a winner's card catches the light
// in holographic foil.
//
// One listener on the grid, not one per card, so a grid redrawn by a filter or
// a sort keeps working without being wired again. Off for touch (there is no
// hover to follow) and for reduced motion.
//
// The transform is written inline while the pointer is over a card, which
// outranks whatever hover transform the page's own CSS gives its cards, and is
// removed when it leaves so that CSS is back in charge.

export const TILT_CSS = `
.bs-glare{position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;z-index:3;transition:opacity .25s ease;
  background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.30),rgba(255,255,255,0) 55%);mix-blend-mode:overlay}
.bs-tilting .bs-glare{opacity:1}
.bs-foil .bs-glare{mix-blend-mode:color-dodge;
  background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.35),rgba(255,255,255,0) 50%),
    linear-gradient(115deg,transparent 18%,rgba(255,62,165,.45) 32%,rgba(255,194,61,.45) 42%,rgba(74,222,128,.4) 52%,
      rgba(56,189,248,.45) 62%,rgba(123,92,255,.45) 72%,transparent 86%);
  background-size:100% 100%,260% 260%;background-position:center,var(--mx,50%) var(--my,50%)}
.bs-foil.bs-tilting .bs-glare{opacity:.85}
`;

export function ensureTiltCss(doc = document) {
  if (doc.getElementById('bs-tilt-css')) return;
  const s = doc.createElement('style');
  s.id = 'bs-tilt-css';
  s.textContent = TILT_CSS;
  doc.head.appendChild(s);
}

/** The card's rotation for a pointer at (px, py), each 0..1 across the card. */
export function tiltFor(px, py, max = 10) {
  const clamp = v => Math.max(0, Math.min(1, v));
  return { rx: +((0.5 - clamp(py)) * 2 * max).toFixed(2), ry: +((clamp(px) - 0.5) * 2 * max).toFixed(2) };
}

/**
 * Tilt every `selector` card inside `root`; cards matching `foil` get the
 * holographic glare. Returns a function that turns it off.
 */
export function enableTilt(root, selector, { foil = null, max = 10, lift = 'translateY(-8px) scale(1.03)' } = {}) {
  if (!root || typeof matchMedia !== 'function') return () => {};
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  ensureTiltCss(root.ownerDocument || document);
  let cur = null, raf = 0, last = null;

  const reset = card => {
    if (!card) return;
    card.classList.remove('bs-tilting');
    card.style.transform = '';
    card.style.transition = '';
  };
  const enter = card => {
    if (!card.querySelector(':scope > .bs-glare')) {
      card.insertAdjacentHTML('beforeend', '<span class="bs-glare" aria-hidden="true"></span>');
    }
    if (foil && card.matches(foil)) card.classList.add('bs-foil');
    card.classList.add('bs-tilting');
    card.style.transition = 'transform .1s ease-out, box-shadow .3s ease, border-color .3s ease, background .3s ease';
  };
  const apply = () => {
    raf = 0;
    if (!cur || !last) return;
    const r = cur.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (last.clientX - r.left) / r.width, py = (last.clientY - r.top) / r.height;
    const { rx, ry } = tiltFor(px, py, max);
    cur.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) ${lift}`;
    cur.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    cur.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  };
  const move = e => {
    const card = e.target.closest?.(selector);
    const inside = card && root.contains(card) ? card : null;
    if (inside !== cur) { reset(cur); cur = inside; if (cur) enter(cur); }
    if (!cur) return;
    last = e;
    if (!raf) raf = requestAnimationFrame(apply);
  };
  const leave = () => { reset(cur); cur = null; };

  root.addEventListener('pointermove', move, { passive: true });
  root.addEventListener('pointerleave', leave);
  return () => {
    root.removeEventListener('pointermove', move);
    root.removeEventListener('pointerleave', leave);
    leave();
  };
}
