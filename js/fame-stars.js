// Drawing a FameResult.
//
// Separate from js/fame.js on purpose: that module must stay free of the DOM so
// the simulator can import it without dragging markup along. Everything visual
// about fame lives here; the words for each rung live there, because they are
// meaning rather than markup.
import { fameTerm } from './fame.js';

export const FAME_STAR_CSS = `
.fame-rating{display:inline-flex;align-items:center;gap:6px;vertical-align:middle;}
.fame-stars{display:inline-flex;gap:2px;}
.fame-star{width:15px;height:15px;display:inline-block;
  background:rgba(255,255,255,0.18);
  clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);}
.fame-star-full{background:linear-gradient(135deg,#ffd76a,#ffa726);}
/* A half is one star lit from the left, not two half-width elements — the
   clip-path is a single shape and cannot be cut in two without losing its
   points. */
.fame-star-half{background:linear-gradient(90deg,#ffd76a 50%,rgba(255,255,255,0.18) 50%);}
.fame-locked .fame-star-full{background:linear-gradient(135deg,#fff3c4,#ffb300);
  filter:drop-shadow(0 0 4px rgba(255,183,0,0.65));}
.fame-score{font-size:11px;opacity:0.6;font-variant-numeric:tabular-nums;}
@media(prefers-reduced-motion:reduce){.fame-locked .fame-star-full{filter:none;}}
`;

/**
 * A FameResult as five star positions, halves included.
 *
 * Always five positions, whatever the rating — an empty slot is the point of a
 * star rating. Returns an empty string rather than throwing on missing data, so
 * a page that could not load a database shows no rating instead of no page.
 */
export function renderStars(fame) {
  if (!fame || typeof fame.stars !== 'number') return '';

  const full = Math.floor(fame.stars);
  const half = fame.stars - full >= 0.5;
  const cells = [];
  for (let i = 0; i < 5; i++) {
    const cls = i < full ? 'fame-star fame-star-full'
      : (i === full && half) ? 'fame-star fame-star-half'
        : 'fame-star';
    cells.push(`<span class="${cls}"></span>`);
  }

  const seasons = `${fame.seasonsPlayed} season${fame.seasonsPlayed === 1 ? '' : 's'}`;
  // "1 stars" — only a whole one is singular; 0.5 and 1.5 both take the plural.
  const rating = `${fame.stars} star${fame.stars === 1 ? '' : 's'}`;
  const term = fameTerm(fame.stars);
  const title = fame.locked
    ? `${term} — famous, and it can no longer fade (${rating}, score ${fame.score}, ${seasons})`
    : `${term} — ${rating} (score ${fame.score}, from ${seasons})`;

  return `<span class="fame-rating${fame.locked ? ' fame-locked' : ''}" title="${title}">`
    + `<span class="fame-stars">${cells.join('')}</span>`
    + `<span class="fame-score">${fame.stars.toFixed(1)}</span></span>`;
}
