// ══════════════════════════════════════════════════════════════════════
// dr/arcs.js — the fifteen families, and the split that makes them safe
// ══════════════════════════════════════════════════════════════════════
//
// The catalogue is the user's, and it is the vocabulary the community actually
// uses about an edit rather than a set of engine categories. A FAMILY decides
// what the arc is; a VARIANT is the flavour, drawn from her craft, her drag
// style and what has actually happened to her, so two frontrunners in two
// seasons are not the same frontrunner.
//
// ── THE LOAD-BEARING RULE ─────────────────────────────────────────────
//
// An arc is either an AGENDA or a LABEL.
//
//   agenda — asks the host's bend for something. Bounded, and only ever a
//            lean. Front-runner, Underdog, Villain, Performance, Relationship,
//            Redemption.
//   label  — asks for NOTHING. Pure description, derived from what she is and
//            what already happened, and read by the VP, the aftermath and the
//            writer. Robbed, Hero, Narrator, Fashion, Pageant, Weakness,
//            Filler, Representation, Shock.
//
// Fifteen families all lobbying the bend would be fifteen thumbs on the scale
// and the season would stop being a contest. Most of this catalogue is label,
// which is exactly what makes it safe to grow this far.
//
// One more rule, enforced in js/dr/storylines.js: a queen carries AT MOST ONE
// agenda. Labels stack freely — a real edit layers "front-runner" and "fashion
// queen" on the same person all the time — but two agendas on one queen would
// double-count her in the bend.
import { dragOf, craftMean } from './queen.js';

/** A variant, with the test that picks it. First match wins, last is default. */
const v = (id, name, when = null) => ({ id, name, when });

const stat = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? n : 5;
};

export const ARC_FAMILIES = {
  // ── AGENDAS ─────────────────────────────────────────────────────────
  frontrunner: {
    kind: 'agenda', label: 'Winner / Front-runner',
    variants: [
      // She is winning because she wins things, not because she is watchable.
      v('challenge-beast', 'Challenge Beast', ({ wins }) => wins >= 3),
      // Polished to the point of being hard to love.
      v('professional', 'Professional', ({ d }) => d.runway >= 8 && d.design >= 7),
      // The edit is not hiding it any more.
      v('winners-edit', "Winner's Edit", ({ star, phase }) => star >= 7 && phase > 0.5),
      v('front-runner', 'Front-runner'),
    ],
  },
  underdog: {
    kind: 'agenda', label: 'Underdog / Growth',
    variants: [
      v('transformation', 'Transformation', ({ improved }) => improved >= 3),
      v('personal-growth', 'Personal Growth', ({ beats }) => beats.some(b => b.kind === 'breakthrough')),
      v('dark-horse', 'Dark Horse', ({ craft }) => craft >= 6),
      v('underdog', 'Underdog'),
    ],
  },
  villain: {
    kind: 'agenda', label: 'Villain / Rivalry',
    variants: [
      v('bitter-edit', 'Bitter Edit', ({ beats }) => beats.filter(b => b.kind === 'villainy').length >= 3),
      // Sharp rather than cruel: she is here to win and says so.
      v('fierce-competitor', 'Fierce Competitor', ({ p, wins }) => wins >= 2 && stat(p, 'loyalty') >= 5),
      v('rivalry-arc', 'Rivalry Arc', ({ hasRival }) => hasRival),
      v('villain', 'Villain'),
    ],
  },
  performance: {
    // EARNED. She has actually survived lip syncs; nobody is cast as this.
    kind: 'agenda', label: 'Performance Queen', earned: true,
    variants: [
      v('lipsync-assassin', 'Lip-Sync Assassin', ({ fights }) => fights >= 3),
      v('lipsync-diva', 'Lip-Sync Diva'),
    ],
  },
  relationship: {
    kind: 'agenda', label: 'Relationship',
    variants: [
      v('rivalry', 'Rivalry', ({ pairBond }) => pairBond <= -5),
      v('showmance', 'Romance', ({ romance }) => romance),
      v('friendship-arc', 'Friendship Arc'),
    ],
  },
  redemption: {
    // Gated on a returnee, which is the All Stars format. Defined here and
    // unassignable until that exists, rather than faked on a first-run cast.
    kind: 'agenda', label: 'Redemption / Returnee', requiresReturnee: true,
    variants: [
      v('comeback-queen', 'Comeback Queen', ({ returnedMidSeason }) => returnedMidSeason),
      v('rudemption-queen', 'RuDemption Queen', ({ priorSeasons }) => priorSeasons >= 1),
      v('redemption-queen', 'Redemption Queen'),
    ],
  },

  // ── LABELS ──────────────────────────────────────────────────────────
  robbed: {
    kind: 'label', label: 'Robbed / Unfulfilled', earned: true,
    variants: [
      v('finalist-without-a-crown', 'Finalist Without a Crown', ({ finalist }) => finalist),
      // The community's word for this is a real queen's name. This universe
      // has no real people — the same rule that keeps the Snatch Game
      // characters archetypes and World Tour from naming a country.
      v('perennial-bridesmaid', 'Perennial Bridesmaid', ({ highs }) => highs >= 3),
      v('early-outsider', 'Early Outsider', ({ phase }) => phase < 0.4),
      v('robbed-queen', 'Robbed Queen'),
    ],
  },
  hero: {
    kind: 'label', label: 'Hero / Congeniality',
    variants: [
      v('congeniality-edit', 'Congeniality Edit', ({ helps }) => helps >= 3),
      v('fan-favorite', 'Fan Favorite', ({ pop }) => pop >= 8),
      v('hero', 'Hero'),
    ],
  },
  narrator: {
    kind: 'label', label: 'Narrator / Personality',
    variants: [
      v('comedy-queen', 'Comedy Queen', ({ d }) => d.comedy >= 8),
      v('emotional-queen', 'Emotional Queen', ({ p }) => stat(p, 'temperament') <= 4),
      v('narrator', 'Narrator'),
    ],
  },
  fashion: {
    kind: 'label', label: 'Fashion / Aesthetic',
    variants: [
      v('club-kid', 'Club Kid', ({ d }) => d.style === 'club-kid'),
      v('alternative-queen', 'Alternative Queen', ({ d }) => d.style === 'art' || d.style === 'spooky'),
      v('fashion-queen', 'Fashion Queen', ({ d }) => d.style === 'fashion'),
      v('look-queen', 'Look Queen'),
    ],
  },
  pageant: {
    kind: 'label', label: 'Pageant / Traditional',
    variants: [
      v('professional', 'Professional', ({ d }) => d.runway >= 8 && d.design >= 7),
      v('pageant-queen', 'Pageant Queen'),
    ],
  },
  weakness: {
    kind: 'label', label: 'Weakness Edit',
    variants: [
      v('fashion-disaster', 'Fashion Disaster', ({ d }) => d.runway <= 3),
      // Brilliant at exactly one thing and lost everywhere else.
      v('one-trick-pony', 'One-Trick Pony', ({ spread }) => spread >= 4),
      v('safe-queen', 'Safe Queen'),
    ],
  },
  filler: {
    kind: 'label', label: 'Filler / Low-Visibility',
    variants: [
      v('safe-queen', 'Safe Queen', ({ safes }) => safes >= 4),
      v('filler-queen', 'Filler Queen'),
    ],
  },
  representation: {
    kind: 'label', label: 'Representation / Personal Story',
    variants: [
      v('family-story', 'Family Story', ({ p }) => stat(p, 'loyalty') >= 8),
      v('emotional-queen', 'Emotional Queen', ({ p }) => stat(p, 'temperament') <= 4),
      v('representation-story', 'Representation Story'),
    ],
  },
  shock: {
    kind: 'label', label: 'Shock / Twist', earned: true,
    variants: [
      v('comeback-queen', 'Comeback Queen', ({ returnedMidSeason }) => returnedMidSeason),
      v('shock-elimination', 'Shock Elimination'),
    ],
  },
};

export const FAMILIES = Object.keys(ARC_FAMILIES);
export const AGENDAS = FAMILIES.filter(f => ARC_FAMILIES[f].kind === 'agenda');
export const LABELS = FAMILIES.filter(f => ARC_FAMILIES[f].kind === 'label');

export const isAgenda = family => ARC_FAMILIES[family]?.kind === 'agenda';

/**
 * Which flavour of a family this is.
 *
 * First matching variant wins and the last has no test, so a family always
 * resolves to something. `facts` is whatever the caller knows; a test reading
 * a fact nobody supplied simply does not match, which is why every variant
 * list ends in an unconditional one.
 */
export function pickVariant(family, facts = {}) {
  const fam = ARC_FAMILIES[family];
  if (!fam) return null;
  const p = facts.player || null;
  const full = {
    wins: 0, highs: 0, safes: 0, helps: 0, fights: 0, pop: 0, phase: 0,
    star: 5, improved: 0, beats: [], hasRival: false, romance: false,
    pairBond: 0, finalist: false, priorSeasons: 0, returnedMidSeason: false,
    ...facts,
    p,
    d: p ? dragOf(p) : dragOf(null),
    craft: p ? craftMean(p) : 5,
  };
  if (full.spread === undefined) {
    // How lopsided she is: the gap between her best craft and her worst.
    const vals = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing']
      .map(k => full.d[k]);
    full.spread = Math.max(...vals) - Math.min(...vals);
  }
  const hit = fam.variants.find(x => !x.when || (() => {
    try { return !!x.when(full); } catch { return false; }
  })());
  const chosen = hit || fam.variants[fam.variants.length - 1];
  return { id: chosen.id, name: chosen.name, family };
}

/** Every variant id in the catalogue, for guards and screens. */
export function allVariants() {
  return FAMILIES.flatMap(f => ARC_FAMILIES[f].variants.map(x => ({
    family: f, id: x.id, name: x.name, kind: ARC_FAMILIES[f].kind,
  })));
}
