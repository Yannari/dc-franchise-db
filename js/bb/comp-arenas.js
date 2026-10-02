// ══════════════════════════════════════════════════════════════════════
// bb/comp-arenas.js — which set a competition is staged in
// ══════════════════════════════════════════════════════════════════════
//
// The real show stages most competitions in a handful of spaces and changes
// the apparatus; so does the viewer. Eight arenas for the house's comps, and
// the Block Buster's own set for every Block Buster game. Each arena is a
// render per season (tools/bb-house/house.py ARENA_ROOMS:
// assets/bb/house/<theme>/<arena>-td-b.webp); the comp's own screen draws its
// apparatus on top. tests/bb-comp-arenas.test.js holds every comp to a home.

export const ARENAS = {
  'arena-endurance': 'The backyard at night, rigged for endurance',
  'arena-course': 'The backyard by day, an obstacle course',
  'arena-puzzle': 'Puzzle stations',
  'arena-podiums': 'Quiz podiums and buzzers',
  'arena-stage': 'The game-show stage',
  'arena-lanes': 'Skill lanes and targets',
  'arena-pool': 'The pool',
  'arena-luck': 'The luck booth',
  'arena-blockbuster': 'The Block Buster arena',
};

const BY_COMP = {
  // endurance: hold on, hang on, stay on
  'bb-endurance-wall': 'arena-endurance', 'bb-endurance-soak': 'arena-endurance', 'bb-sig-the-wall': 'arena-endurance',
  'bb-grip-pole': 'arena-endurance', 'bb-grip-tightrope': 'arena-endurance', 'bb-grip-ship': 'arena-endurance',
  'bb-stamina-hold-up': 'arena-endurance', 'bb-stamina-log-roll': 'arena-endurance', 'bb-final-part-one': 'arena-endurance',
  'bb-duress-black-box': 'arena-endurance', 'pair-tethered': 'arena-endurance',
  // the course: run, carry, roll
  'bb-classic-ready-set-woah': 'arena-course', 'bb-classic-rollerball': 'arena-course', 'bb-physical-slide': 'arena-course',
  'bb-final-part-two': 'arena-course', 'pair-pouring-twenties': 'arena-course', 'bb-stamina-dizzy-discs': 'arena-course',
  // stations: build, solve, stack, remember
  'bb-classic-hanoi': 'arena-puzzle', 'bb-classic-solve-for-x': 'arena-puzzle', 'bb-classic-spelling': 'arena-puzzle',
  'bb-mental-puzzle': 'arena-puzzle', 'bb-grip-dominoes': 'arena-puzzle', 'bb-grip-knots': 'arena-puzzle',
  'bb-hand-caged-eggs': 'arena-puzzle', 'bb-hand-laser-maze': 'arena-puzzle', 'pair-blind-sort': 'arena-puzzle',
  'pair-house-of-cards': 'arena-puzzle', 'bb-mental-memory': 'arena-puzzle', 'bb-grip-memory-dip': 'arena-puzzle',
  'bb-classic-in-the-balance': 'arena-puzzle', 'bb-classic-dough': 'arena-puzzle',
  // podiums: answer, buzz, remember who said it
  'bb-mental-quiz': 'arena-podiums', 'bb-mental-knockout': 'arena-podiums', 'bb-recall-who-said-it': 'arena-podiums',
  'bb-recall-drunk-speeches': 'arena-podiums', 'bb-sig-before-or-after': 'arena-podiums', 'bb-final-part-three': 'arena-podiums',
  // the stage: the show-within-the-show comps
  'bb-sig-bb-comics': 'arena-stage', 'bb-sig-pressure-cooker': 'arena-stage', 'bb-social-zingbot': 'arena-stage',
  'bb-classic-stay-or-fold': 'arena-stage', 'bb-social-drink-or-bluff': 'arena-stage', 'bb-sig-otev': 'arena-stage',
  'bb-sig-hide-and-go-veto': 'arena-stage', 'bb-duress-punch-slap-kick': 'arena-stage',
  // lanes: aim and launch
  'bb-classic-slingshot': 'arena-lanes', 'bb-physical-precision': 'arena-lanes',
  // the pool
  'bb-hand-water-rescue': 'arena-pool',
  // luck
  'bb-luck-draw': 'arena-luck', 'bb-classic-tumblin-dice': 'arena-luck',
};

/** The arena a competition is staged in. Every Block Buster game is in the Block Buster arena. */
export function arenaFor(compId) {
  if (String(compId || '').startsWith('bb-arena-')) return 'arena-blockbuster';
  return BY_COMP[compId] || null;
}

export const COMP_ARENA_MAP = BY_COMP;
