// ══════════════════════════════════════════════════════════════════════
// dr/queen.js — what a queen is made of
// ══════════════════════════════════════════════════════════════════════
//
// TWO LAYERS, AND THE SEPARATION IS THE DESIGN.
//
// Layer 1 is the roster record every other show already uses: nine stats and
// an archetype. Nothing here reads them for judging — they are the PERSON, and
// they drive the werk room, the bonds, the reactions and the fights. A queen
// with `physical: 9` is not a better queen; she is somebody who happens to be
// strong, which on this show matters exactly as much as it does at a party.
//
// Layer 2 is the `drag` block below: seven craft stats the judges actually
// score, plus a style, a few traits and a persona voice. This is the only
// thing a maxi challenge blend may read.
//
// Star power is NEITHER, and is deliberately awkward to reach: it is computed
// once at season start, kept on `gs.dr.star`, and shown to nobody. It biases
// how a performance is RECEIVED (the host's bend in js/dr/judging.js) and
// never what the performance WAS. Wiring it into a performance would collapse
// the three steps — did it / how it was seen / what the host did about it —
// into one, and the whole point of this engine is that those can disagree.

export const DRAG_STATS = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];

export const DRAG_STYLES = ['pageant', 'comedy', 'fashion', 'camp', 'club-kid', 'spooky',
  'broadway', 'dancer', 'glamour', 'art'];

export const DRAG_TRAITS = [
  'padded', 'bearded', 'big-wigs', 'high-concept', 'seamstress',
  'choreographer', 'hometown-pageant', 'live-vocalist', 'stunt-queen',
  'body', 'face', 'wit', 'look-queen', 'camp-queen', 'shade-queen',
  'reveal-queen', 'crafty', 'impersonator', 'splits-and-dips',
  'pageant-polished', 'punk', 'androgynous', 'glamazon', 'narrator',
];

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const toStat = v => {
  const n = Number(v);
  return Number.isFinite(n) ? clamp(Math.round(n), 1, 10) : 5;
};

/* ── THE STYLE A QUEEN'S STATS SUGGEST, WHEN NOTHING IS AUTHORED ──────
   This was a seven-entry map from her single best craft, and it could not
   reach three of the ten styles at all: `pageant` was the fallback for a
   queen with no crafts, and `spooky` and `art` had no craft pointing at them.
   Measured over 720 generated queens — camp 20%, comedy 17%, dancer 15%,
   glamour 14%, fashion 13%, club-kid 13%, broadway 9%, and pageant, spooky
   and art at zero.

   That is not a cosmetic gap. A runway category flatters a STYLE, so the two
   categories built out of spooky and art — Night of a Thousand Ghouls and
   Creatures of the Deep — flattered nobody in any season anybody has ever
   played, and six more were half inert. The prompts changed every week and
   most weeks nothing under them moved.

   So a style is a SHAPE rather than a maximum. Three of them are combinations
   and could never be read off one number:

     art       high concept — she builds and she acts, and the look is not
               trying to be pretty, so a big runway score counts AGAINST it
     spooky    the dark performer: she builds, she sells it on the floor, and
               she has the disposition to go there
     pageant   the polished all-rounder — strong on the two visual crafts and
               EVEN across everything, which is the one shape a "best craft"
               reading can never see

   Ties go to the first listed, and an unauthored style is still a fallback
   rather than a claim: `player.drag.style` always wins when a human set it. */
const styleShapes = (d, arch) => {
  const mean = DRAG_STATS.reduce((s, k) => s + d[k], 0) / DRAG_STATS.length;
  const spread = Math.sqrt(DRAG_STATS
    .reduce((s, k) => s + (d[k] - mean) ** 2, 0) / DRAG_STATS.length);
  // How much she leans dark, from the disposition the franchise already has.
  const dark = { villain: 1, 'chaos-agent': 0.8, schemer: 0.7, mastermind: 0.5,
    hothead: 0.5, wildcard: 0.5 }[arch] || 0;
  // And how much she leans polished. A pageant queen is nobody's villain.
  const polished = { 'loyal-soldier': 0.8, hero: 0.7, 'social-butterfly': 0.6,
    goat: 0.4, 'challenge-beast': 0.4 }[arch] || 0;
  return {
    comedy: d.comedy + d.acting * 0.25,
    camp: d.acting + d.comedy * 0.35,
    fashion: d.design + d.runway * 0.35,
    glamour: d.runway + d.design * 0.25,
    dancer: d.dance + d.lipsync * 0.3,
    'club-kid': d.lipsync + d.dance * 0.3,
    broadway: d.singing + d.acting * 0.25,
    art: (d.design + d.acting) * 0.62 - d.runway * 0.15 + 2.2,
    spooky: (d.design + d.lipsync) * 0.5 + dark * 2.6 + 1.5,
    pageant: (d.runway + d.design) * 0.5 + polished * 1.5 + 2.3
      // Even is the whole point: a pageant queen has no hole in her game.
      + Math.max(0, 2.6 - spread) * 1.3,
  };
};

export function expectedStyleFor(player) {
  const raw = (player && player.drag) || {};
  const d = Object.fromEntries(DRAG_STATS.map(k => [k, toStat(raw[k])]));
  const shapes = styleShapes(d, player && player.archetype);
  let best = 'pageant';
  let bestV = -Infinity;
  for (const style of DRAG_STYLES) {
    const v = shapes[style];
    if (v > bestV) { bestV = v; best = style; }
  }
  return best;
}

/**
 * The craft block, normalised. Never throws, never mutates, always complete:
 * a roster entry authored before this show existed reads as a queen of
 * middling everything rather than as a crash or a pile of NaN.
 */
export function dragOf(player) {
  const raw = (player && typeof player.drag === 'object' && player.drag) || {};
  const out = {};
  for (const k of DRAG_STATS) out[k] = toStat(raw[k]);
  out.style = DRAG_STYLES.includes(raw.style) ? raw.style : expectedStyleFor(player);
  out.traits = Array.isArray(raw.traits)
    ? raw.traits.filter(t => DRAG_TRAITS.includes(t)).slice(0, 3)
    : [];
  out.voice = typeof raw.voice === 'string' ? raw.voice : '';
  return out;
}

export function craftMean(player) {
  const d = dragOf(player);
  return DRAG_STATS.reduce((s, k) => s + d[k], 0) / DRAG_STATS.length;
}

// How much a camera wants somebody, by archetype. Villains and wildcards are
// television; floaters and goats are not. A SCALE, not a gate: every archetype
// scores, and the difference is a lean rather than a door.
const ARCH_STAR = {
  villain: 1.0, 'chaos-agent': 0.95, wildcard: 0.9, showmancer: 0.85,
  mastermind: 0.8, schemer: 0.8, hothead: 0.8, 'social-butterfly': 0.75,
  hero: 0.7, 'challenge-beast': 0.6, underdog: 0.6, 'perceptive-player': 0.5,
  'loyal-soldier': 0.45, floater: 0.3, goat: 0.25,
};

// Traits that read on camera before she has done anything.
const LOOK_TRAITS = new Set([
  'padded', 'body', 'face', 'big-wigs', 'bearded',
  'look-queen', 'glamazon', 'reveal-queen', 'pageant-polished',
]);

/**
 * How much the show WANTS her, in [0, 10]. Hidden from the cast and from every
 * screen; the audience never sees a number and neither does she.
 *
 * Weights are the spec's: entertainment .35, personality .30, age .15,
 * look .10, and a per-season roll .10 — the roll being what makes the same
 * queen a producers' darling one season and background the next.
 *
 * Everything here is proportional. There is no threshold anywhere: a queen one
 * point more social is slightly more wanted, never suddenly wanted.
 */
export function starPower(player, rng = Math.random) {
  const d = dragOf(player);
  const s = (player && player.stats) || {};
  const num = (k, dflt = 5) => (Number.isFinite(Number(s[k])) ? Number(s[k]) : dflt);

  // What she is like to WATCH, which is not what she is good at.
  const entertainment = (d.comedy + d.acting + d.lipsync) / 3;                  // 1..10

  // Personality is half her own numbers and half what her archetype is for.
  const personality = (num('social') * 0.5 + num('boldness') * 0.5) * 0.6
    + (ARCH_STAR[player && player.archetype] ?? 0.5) * 10 * 0.4;                // 1..10

  // Both ends of the age range are castable and the middle is not: the very
  // young are a story and the veterans are a legacy. A curve rather than two
  // brackets, so nobody's birthday moves them off a cliff.
  const age = Number.isFinite(Number(player && player.age)) ? Number(player.age) : 27;
  const ageScore = clamp(4 + Math.abs(age - 31) * 0.35, 0, 10);

  const look = clamp(4 + d.traits.filter(t => LOOK_TRAITS.has(t)).length * 2, 0, 10);

  const roll = rng() * 10;

  return clamp(
    entertainment * 0.35 + personality * 0.30 + ageScore * 0.15 + look * 0.10 + roll * 0.10,
    0, 10);
}
