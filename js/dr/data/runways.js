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
// `styles` is what the prompt flatters and is the one the fit term reads:
// `fitFor` gives 1 to a listed style and 0 to everything else, deliberately,
// because the fit term is a bounded budget and adding a third value to it
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
// The style-less categories name no clashes either: a prompt that asks
// everybody the same question cannot be fought.
//
// ── `asks` AND `rewards` ──────────────────────────────────────────────
//
// `styles` asks what KIND of queen she is, and for a long time that was the
// only question any category asked — so twenty prompts were one prompt in
// twenty costumes. Half the prompts on the real show ask something far more
// specific: a reveal is a sewing problem, a showgirl number is a dancing one,
// a bodysuit is a body.
//
// `asks` names one craft the prompt genuinely tests. It is SIGNED and centred
// on five, so a category that asks for design helps the queen who sews and
// costs the queen who cannot — which is the whole reason a season of varied
// prompts should feel different from a season of neutral ones.
//
// `rewards` names traits it pays a small bonus on. Small on purpose: traits
// are authored-only, so making them worth much would quietly hand every
// season to the hand-built queens over the generated ones.
//
// The three together are worth what `fit` alone used to be worth. The budget
// and the measurement behind it are in js/dr/perform.js.
//
// A category may declare none of them, and four do. Those are the neutral
// weeks, and they earn their place: a season where every prompt has an angle
// has no baseline to measure the angled ones against.
export const RUNWAY_CATEGORIES = [
  // ── THE ONES THAT WERE ALREADY HERE ──
  { label: 'Night of a Thousand Ghouls', styles: ['spooky', 'art'], clashes: ['pageant', 'glamour'],
    asks: 'design', rewards: ['high-concept', 'crafty'] },
  { label: 'Pageant Perfection', styles: ['pageant', 'glamour'], clashes: ['club-kid', 'art'],
    asks: 'runway', rewards: ['pageant-polished', 'hometown-pageant'] },
  { label: 'Feathers and Fringe', styles: ['pageant', 'camp'], clashes: ['fashion', 'spooky'],
    asks: 'runway', rewards: ['big-wigs', 'glamazon'] },
  { label: 'Structure and Silhouette', styles: ['fashion', 'art'], clashes: ['camp', 'comedy'],
    asks: 'design', rewards: ['seamstress', 'high-concept'] },
  { label: 'Club Kid Couture', styles: ['club-kid', 'art'], clashes: ['pageant', 'broadway'],
    asks: 'design', rewards: ['punk', 'androgynous'] },
  { label: 'Curtain Up', styles: ['broadway', 'glamour'], clashes: ['club-kid', 'spooky'],
    asks: 'singing', rewards: ['live-vocalist', 'narrator'] },
  { label: 'Bodysuit Realness', styles: ['dancer', 'club-kid'], clashes: ['glamour', 'art'],
    asks: 'dance', rewards: ['body', 'splits-and-dips'] },
  { label: 'Hometown Pride', styles: ['pageant', 'comedy'], clashes: ['fashion', 'art'],
    rewards: ['hometown-pageant'] },
  { label: 'Something Borrowed', styles: ['fashion', 'glamour'], clashes: ['club-kid', 'spooky'],
    asks: 'design', rewards: ['seamstress'] },
  { label: 'Cartoon Come to Life', styles: ['camp', 'comedy'], clashes: ['fashion', 'glamour'],
    asks: 'comedy', rewards: ['camp-queen', 'impersonator'] },
  { label: 'Black and White Ball', styles: ['fashion', 'pageant'], clashes: ['camp', 'club-kid'],
    asks: 'runway', rewards: ['look-queen'] },
  { label: 'Creatures of the Deep', styles: ['art', 'spooky'], clashes: ['pageant', 'broadway'],
    asks: 'design', rewards: ['high-concept', 'crafty'] },
  { label: 'Denim and Diamonds', styles: ['glamour', 'dancer'], clashes: ['broadway', 'spooky'],
    asks: 'runway' },
  { label: 'The Colour Wheel', styles: ['camp', 'club-kid'], clashes: ['glamour', 'spooky'],
    asks: 'design', rewards: ['high-concept'] },
  { label: 'Leather and Lace', styles: ['spooky', 'fashion'], clashes: ['comedy', 'broadway'],
    asks: 'design', rewards: ['punk'] },
  { label: 'Showgirl', styles: ['broadway', 'dancer'], clashes: ['art', 'spooky'],
    asks: 'dance', rewards: ['splits-and-dips', 'big-wigs'] },
  { label: 'Two Looks in One', styles: ['camp', 'club-kid'], clashes: ['glamour', 'dancer'],
    asks: 'design', rewards: ['reveal-queen', 'seamstress'] },

  // ── SEWING NIGHTS ── the prompt is a construction problem before it is
  // anything else, and the queen who cannot sew cannot hide on one.
  { label: 'Anything But Fabric', styles: ['art', 'camp'], clashes: ['pageant', 'dancer'],
    asks: 'design', rewards: ['crafty', 'seamstress', 'high-concept'] },
  { label: 'Off the Bolt', styles: ['fashion', 'pageant'], clashes: ['comedy', 'club-kid'],
    asks: 'design', rewards: ['seamstress'] },
  { label: 'Reduce, Reuse, Realness', styles: ['art', 'club-kid'], clashes: ['pageant', 'broadway'],
    asks: 'design', rewards: ['crafty'] },
  { label: 'Now You See Her', styles: ['camp', 'comedy'], clashes: ['fashion', 'broadway'],
    asks: 'design', rewards: ['reveal-queen', 'stunt-queen'] },

  // ── BODY NIGHTS ── the look is what she does in it.
  { label: 'Legs for Days', styles: ['dancer', 'glamour'], clashes: ['art', 'camp'],
    asks: 'dance', rewards: ['body', 'splits-and-dips'] },
  { label: 'Padding Optional', styles: ['fashion', 'club-kid'], clashes: ['glamour', 'camp'],
    asks: 'runway', rewards: ['body', 'androgynous'] },
  { label: 'Curves and Swerves', styles: ['glamour', 'pageant'], clashes: ['art', 'dancer'],
    asks: 'runway', rewards: ['padded', 'glamazon'] },
  { label: 'Sickening in Sequins', styles: ['broadway', 'dancer'], clashes: ['art', 'spooky'],
    asks: 'dance', rewards: ['splits-and-dips'] },

  // ── CHARACTER NIGHTS ── she has to BE somebody, not only wear something.
  { label: 'Villain Era', styles: ['spooky', 'camp'], clashes: ['glamour', 'broadway'],
    asks: 'acting', rewards: ['shade-queen', 'camp-queen'] },
  { label: 'Silver Screen Siren', styles: ['glamour', 'broadway'], clashes: ['club-kid', 'art'],
    asks: 'acting', rewards: ['impersonator', 'face'] },
  { label: 'Monster Mash', styles: ['spooky', 'art'], clashes: ['pageant', 'glamour'],
    asks: 'acting', rewards: ['high-concept', 'stunt-queen'] },
  { label: 'Comedy Queen Couture', styles: ['comedy', 'camp'], clashes: ['fashion', 'broadway'],
    asks: 'comedy', rewards: ['wit', 'camp-queen'] },
  { label: 'Live and Let Diva', styles: ['broadway', 'glamour'], clashes: ['club-kid', 'dancer'],
    asks: 'singing', rewards: ['live-vocalist'] },

  // ── FACE AND HAIR ── no garment can save her.
  { label: 'Wig Wig Wiggity Wig', styles: ['pageant', 'comedy'], clashes: ['fashion', 'art'],
    asks: 'runway', rewards: ['big-wigs'] },
  { label: 'Face in a Book', styles: ['fashion', 'glamour'], clashes: ['comedy', 'club-kid'],
    asks: 'runway', rewards: ['face', 'look-queen'] },
  { label: 'Beard Is Here', styles: ['club-kid', 'art'], clashes: ['pageant', 'glamour'],
    asks: 'design', rewards: ['bearded', 'androgynous'] },

  // ── HIGH CONCEPT ── the idea has to be legible from the back of the room.
  { label: 'Book Ballroom', styles: ['art', 'broadway'], clashes: ['camp', 'dancer'],
    asks: 'design', rewards: ['high-concept', 'narrator'] },
  { label: 'Mother Nature', styles: ['art', 'spooky'], clashes: ['glamour', 'club-kid'],
    asks: 'design', rewards: ['high-concept', 'crafty'] },
  { label: 'The Future Is Now', styles: ['club-kid', 'fashion'], clashes: ['pageant', 'camp'],
    asks: 'design', rewards: ['androgynous', 'high-concept'] },
  { label: 'Painted Illusion', styles: ['art', 'fashion'], clashes: ['comedy', 'dancer'],
    asks: 'design', rewards: ['crafty', 'high-concept'] },

  // ── STUNTS ── the walk itself is the point.
  { label: 'Stairs and Stunts', styles: ['dancer', 'comedy'], clashes: ['fashion', 'glamour'],
    asks: 'dance', rewards: ['stunt-queen', 'splits-and-dips'] },
  { label: 'Feather Flight', styles: ['glamour', 'broadway'], clashes: ['club-kid', 'spooky'],
    asks: 'runway', rewards: ['big-wigs', 'glamazon'] },

  // ── AND THE NEUTRAL ONES ──
  // No styles, no ask, no traits: the weeks that advantage nobody, and the
  // baseline the angled prompts are only interesting against.
  { label: 'Bring Back My Girls', styles: [] },
  { label: 'Best Drag', styles: [] },
  { label: 'Category Is: You', styles: [] },
  { label: 'Graduation Day', styles: [] },
];

export function runwayById(label) {
  return RUNWAY_CATEGORIES.find(c => c.label === label) || null;
}
