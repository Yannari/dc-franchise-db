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
export const RUNWAY_CATEGORIES = [
  { label: 'Night of a Thousand Ghouls', styles: ['spooky', 'art'] },
  { label: 'Pageant Perfection', styles: ['pageant', 'glamour'] },
  { label: 'Feathers and Fringe', styles: ['glamour', 'camp'] },
  { label: 'Structure and Silhouette', styles: ['fashion', 'art'] },
  { label: 'Club Kid Couture', styles: ['club-kid', 'art'] },
  { label: 'Curtain Up', styles: ['broadway', 'glamour'] },
  { label: 'Bodysuit Realness', styles: ['dancer', 'club-kid'] },
  { label: 'Hometown Pride', styles: ['pageant', 'camp'] },
  { label: 'Something Borrowed', styles: ['fashion', 'glamour'] },
  { label: 'Cartoon Come to Life', styles: ['camp', 'comedy'] },
  { label: 'Black and White Ball', styles: ['fashion', 'pageant'] },
  { label: 'Creatures of the Deep', styles: ['art', 'spooky'] },
  { label: 'Denim and Diamonds', styles: ['glamour', 'club-kid'] },
  { label: 'The Colour Wheel', styles: ['art', 'club-kid'] },
  { label: 'Leather and Lace', styles: ['spooky', 'fashion'] },
  { label: 'Showgirl', styles: ['broadway', 'dancer'] },
  { label: 'Two Looks in One', styles: ['camp', 'art'] },
  { label: 'Bring Back My Girls', styles: [] },
  { label: 'Best Drag', styles: [] },
  { label: 'Category Is: You', styles: [] },
];

export function runwayById(label) {
  return RUNWAY_CATEGORIES.find(c => c.label === label) || null;
}
