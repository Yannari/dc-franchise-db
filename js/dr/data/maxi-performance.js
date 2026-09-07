// ══════════════════════════════════════════════════════════════════════
// dr/data/maxi-performance.js — how she did, in this challenge's language
// ══════════════════════════════════════════════════════════════════════
//
// The per-queen performance beat, one per family. There is already a generic
// version of this in challenge-beats.js and it is the reason a Snatch Game and
// a Rusical read identically: five tiers from extraordinary to collapse, with
// no idea which night it was.
//
// This replaces it per family. A queen who bombs a Snatch Game is stuck in a
// chair unable to leave the character; a queen who bombs a Rusical is out of
// key in front of a live band; a queen who bombs a makeover has produced two
// people who do not look related. Same tier, completely different scene.
//
// ── THE SHAPE ─────────────────────────────────────────────────────────
//
// Always fires, one per queen, tiered by how she scored relative to the room —
// exactly like the runway walk. Nothing is drawn and nothing is optional.
//
//   family     which module this belongs to, matching CHAL_MODULES
//   serves     the challenge ids that family runs, for context
//   tiers      extraordinary | strong | competent | struggling | collapse
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// {a} is the queen. No {b} — this beat is about one performance. Same rules as
// everywhere: no real people, this show's words only, no stat by number, four
// genuinely different variants per tier, prose rather than captions.
//
// WRITE THE CRAFT SERIOUSLY. This is the thing the queens came to do, and it
// is the one place in the whole engine where the prose should respect it. A
// collapse should be painful to read and an extraordinary should feel like the
// clip that gets posted.

const t = (id, note, lines = []) => ({ id, note, lines });

/** Every family gets the same five, so the renderer can tier them identically. */
const tiers = (verbs) => [
  t('extraordinary', verbs.extraordinary),
  t('strong', verbs.strong),
  t('competent', verbs.competent),
  t('struggling', verbs.struggling),
  t('collapse', verbs.collapse),
];

export const MAXI_PERFORMANCE = [
  {
    family: 'snatch-game', serves: ['snatch-game'],
    label: 'the taping — she is in character on a panel for six questions',
    tiers: tiers({
      extraordinary: 'The character is fully alive and she never drops it. The best Snatch Game the season will see.',
      strong: 'She has a real character and the laughs are consistent.',
      competent: 'She gets through it. A couple land, the rest are fine.',
      struggling: 'The character is thin and she is working far too hard for very little.',
      collapse: 'She has nothing and cannot leave the chair.',
    }),
  },
  {
    family: 'girl-group', serves: ['girl-group', 'rumix', 'music-video'],
    label: 'the group number — her verse and her place in the choreography',
    tiers: tiers({
      extraordinary: 'She takes the number and makes it hers without stepping on anybody.',
      strong: 'Verse lands, choreography clean, she is visibly good.',
      competent: 'She hits her marks and does not stand out either way.',
      struggling: 'She is behind the choreography and the verse is not landing.',
      collapse: 'She is lost on stage and everybody can see her counting.',
    }),
  },
  {
    family: 'rusical', serves: ['rusical'],
    label: 'the musical number — her part, live band, full staging',
    tiers: tiers({
      extraordinary: 'She can act and sing and does both, in a part that suits her exactly.',
      strong: 'A real performance with a genuine character in it.',
      competent: 'She delivers the part. Nothing more is asked and nothing more happens.',
      struggling: 'The singing is a problem, or the character is, and she cannot hide either.',
      collapse: 'She is off the key and off the beat with the band still playing.',
    }),
  },
  {
    family: 'roast', serves: ['roast', 'stand-up'],
    label: 'her set — a microphone, a room, and material she wrote herself',
    tiers: tiers({
      extraordinary: 'Every bit lands and she owns the room by the second one.',
      strong: 'A properly good set with real jokes in it.',
      competent: 'She gets laughs. Not many, but real ones.',
      struggling: 'The material is not there and she can hear it not being there.',
      collapse: 'She dies on stage with time left on the clock.',
    }),
  },
  {
    family: 'makeover', serves: ['makeover'],
    label: 'the reveal — two people walking out who are meant to read as family',
    tiers: tiers({
      extraordinary: 'They look genuinely related and her partner is transformed and delighted.',
      strong: 'A convincing pair, well matched, clearly the same family.',
      competent: 'It reads. The connection is there if you look for it.',
      struggling: 'Two people in similar outfits rather than a family.',
      collapse: 'Her partner looks uncomfortable and nothing matches anything.',
    }),
  },
  {
    family: 'ball', serves: ['ball'],
    label: 'three looks in one night, one of them built this morning',
    tiers: tiers({
      extraordinary: 'All three land and the built one is the best thing on the runway.',
      strong: 'A strong trio with a real point of view.',
      competent: 'Two work and one does not, which is a night.',
      struggling: 'The built look lets the other two down badly.',
      collapse: 'The garment fails on the runway in front of everybody.',
    }),
  },
  {
    family: 'design', serves: ['design', 'acting', 'commercial', 'improv'],
    label: 'the built look, or the scene she was cast in',
    tiers: tiers({
      extraordinary: 'She found something in the material nobody else saw.',
      strong: 'Confident, finished, and clearly hers.',
      competent: 'It does the job and moves on.',
      struggling: 'Under-finished, and the panel will see every unfinished part.',
      collapse: 'It comes apart, or the scene dies with her in it.',
    }),
  },
  {
    family: 'talent-show', serves: ['talent-show'],
    label: 'her act, chosen by her, in front of everybody',
    tiers: tiers({
      extraordinary: 'The act is genuinely impressive and she has clearly done it for years.',
      strong: 'A real talent, properly performed.',
      competent: 'A fine act that nobody will remember by the finale.',
      struggling: 'She has overreached and it is visible.',
      collapse: 'The act fails in front of the room with nowhere to go.',
    }),
  },
  {
    family: 'lalaparuza', serves: ['lipsync-challenge'],
    label: 'the bracket — lip syncs back to back until one is left',
    tiers: tiers({
      extraordinary: 'She goes through the whole room and never looks tired.',
      strong: 'She wins the ones she should win and makes it look easy.',
      competent: 'She survives a round and goes out to somebody better.',
      struggling: 'She is out early and it was not close.',
      collapse: 'She loses the first one badly and watches the rest.',
    }),
  },
  {
    family: 'generic', serves: ['photoshoot', 'choreography', 'runway-challenge', 'singing', 'and any type with no module of its own'],
    label: 'a solo craft challenge — the fallback when a type has no module',
    tiers: tiers({
      extraordinary: 'She is the best in the room at exactly this and it shows.',
      strong: 'Comfortably good, and she knows it.',
      competent: 'She does what was asked.',
      struggling: 'This is not her skill and the room can tell.',
      collapse: 'She cannot do this and there is nowhere to put that.',
    }),
  },
];

export const PERFORMANCE_FAMILIES = MAXI_PERFORMANCE.map(x => x.family);

export function performanceFor(family) {
  return MAXI_PERFORMANCE.find(x => x.family === family)
    || MAXI_PERFORMANCE.find(x => x.family === 'generic');
}

export function unwrittenPerformanceTiers() {
  const out = [];
  for (const f of MAXI_PERFORMANCE) {
    for (const x of f.tiers) if (!x.lines || x.lines.length < 4) out.push(`${f.family}/${x.id}`);
  }
  return out;
}
