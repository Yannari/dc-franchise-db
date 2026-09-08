// ══════════════════════════════════════════════════════════════════════
// dr/data/runways.js — the category, and what it rewards
// ══════════════════════════════════════════════════════════════════════
//
// A runway category is a PROMPT, and the interesting thing about a prompt is
// that it suits some queens more than others. Each carries the drag styles it
// flatters, which `runwayScore` reads: a spooky queen given "Night of a
// Thousand Ghouls" is playing at home, and the same queen given "Pageant
// Perfection" is not.
//
// Categories with no styles listed are deliberately neutral — a plain "Best
// Drag" asks everybody the same question — and `fitFor` treats an empty list
// as neutral rather than as a clash, so a neutral week advantages nobody.
//
// Before this file, `cfg.runwayCategory` was read by the week and set by
// nothing, so every episode fell back to "<Challenge name> eleganza" and every
// runway was neutral. Found by auditing Plan 1 against what the engine
// actually reads.
//
// ── `styles` AND `clashes` ARE NOT OPPOSITES ──────────────────────────
//
// `styles` is what the prompt flatters and is the ONLY one the score reads:
// `fitFor` gives 1 to a listed style and 0 to everything else, deliberately,
// because the fit term is worth 1.5 points and adding a third value to it
// would move a balance that was measured.
//
// `clashes` is narration only, and it exists because 0 was being asked to
// mean two different things. Two styles listed out of ten means eight styles
// score 0, so the beat that says a look did not answer the category fired for
// EIGHT QUEENS OF TEN every week — found by dumping an episode and reading
// it, where the same off-theme paragraph printed verbatim three times in one
// runway. A broadway queen at Bodysuit Realness is not in her wheelhouse; she
// is not fighting the prompt either. Only the styles named here are.
//
// So the runway narration reads three ways — `styles` is home, `clashes` is
// against, everything else is neutral — and roughly six queens in ten are
// neutral, which is what a prompt naming two styles actually means.
//
// The four style-less categories name no clashes either: a prompt that asks
// everybody the same question cannot be fought.
export const RUNWAY_CATEGORIES = [
  { label: 'Night of a Thousand Ghouls', styles: ['spooky', 'art'], clashes: ['pageant', 'glamour'] },
  { label: 'Pageant Perfection', styles: ['pageant', 'glamour'], clashes: ['club-kid', 'art'] },
  { label: 'Feathers and Fringe', styles: ['glamour', 'camp'], clashes: ['fashion', 'art'] },
  { label: 'Structure and Silhouette', styles: ['fashion', 'art'], clashes: ['camp', 'comedy'] },
  { label: 'Club Kid Couture', styles: ['club-kid', 'art'], clashes: ['pageant', 'broadway'] },
  { label: 'Curtain Up', styles: ['broadway', 'glamour'], clashes: ['club-kid', 'spooky'] },
  { label: 'Bodysuit Realness', styles: ['dancer', 'club-kid'], clashes: ['pageant', 'art'] },
  { label: 'Hometown Pride', styles: ['pageant', 'camp'], clashes: ['fashion', 'art'] },
  { label: 'Something Borrowed', styles: ['fashion', 'glamour'], clashes: ['club-kid', 'spooky'] },
  { label: 'Cartoon Come to Life', styles: ['camp', 'comedy'], clashes: ['fashion', 'pageant'] },
  { label: 'Black and White Ball', styles: ['fashion', 'pageant'], clashes: ['camp', 'club-kid'] },
  { label: 'Creatures of the Deep', styles: ['art', 'spooky'], clashes: ['pageant', 'broadway'] },
  { label: 'Denim and Diamonds', styles: ['glamour', 'club-kid'], clashes: ['broadway', 'spooky'] },
  { label: 'The Colour Wheel', styles: ['art', 'club-kid'], clashes: ['pageant', 'spooky'] },
  { label: 'Leather and Lace', styles: ['spooky', 'fashion'], clashes: ['comedy', 'broadway'] },
  { label: 'Showgirl', styles: ['broadway', 'dancer'], clashes: ['art', 'spooky'] },
  { label: 'Two Looks in One', styles: ['camp', 'art'], clashes: ['pageant', 'glamour'] },
  { label: 'Bring Back My Girls', styles: [] },
  { label: 'Best Drag', styles: [] },
  { label: 'Category Is: You', styles: [] },
];

export function runwayById(label) {
  return RUNWAY_CATEGORIES.find(c => c.label === label) || null;
}
