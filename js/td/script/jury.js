// ══════════════════════════════════════════════════════════════════════
// td/script/jury.js — a Jury House moment, decided by js/rescue-island.js, becomes a scene
// ══════════════════════════════════════════════════════════════════════
//
// The interlude engine (generateInterludeLife, the jury venue) decides the week and applies its
// consequences: who arrives, the grudge and how it ends, the outsider and who pulls them in, the
// juror who cannot let go, the new friends, the motel's group nights, every bond change. It still
// writes its own one-line summary; this replaces that line with the scene (lines/jury.js) through
// the camp's picker, so the same repetition rules hold and the transcript is the scene.
//
// The beat's badge says what the engine decided. Roles: {a} is the person the moment is about.
import { makeScene } from './scene.js';
import { scriptEvent } from './write.js';

// badge → [pool kind, ending, how the beat's players map onto {a} {b} {c}]
const BY_BADGE = {
  'NEW ARRIVAL': b => (b.players.length > 1 ? ['jury.arrive', 'hug', 'ab'] : ['jury.arrive', 'alone', 'a']),
  'OLD WOUNDS': () => ['jury.grudge', 'wounds', 'ab'],
  'IT BOILS OVER': () => ['jury.grudge', 'boils', 'ab'],
  'THE RECKONING': () => ['jury.grudge', 'reckon', 'ab'],
  'BURIED IT': () => ['jury.grudge', 'buried', 'ab'],
  'ON THE OUTSIDE': () => ['jury.outsider', 'outside', 'a'],
  // the engine names the one who reaches out first here; the scene is about the outsider
  'A SEAT AT THE TABLE': () => ['jury.outsider', 'seat', 'ba'],
  BELONGING: () => ['jury.outsider', 'belong', 'ab'],
  "CAN'T LET GO": () => ['jury.bitter', 'start', 'a'],
  'THE GRUDGE VOTE': () => ['jury.bitter', 'vote', 'a'],
  'STRANGE BEDFELLOWS': () => ['jury.friends', 'strange', 'ab'],
  'THICK AS THIEVES': () => ['jury.friends', 'thick', 'ab'],
  'THE VOTE LOOMS': () => ['jury.looms', 'any', 'a'],
  PROCESSING: () => ['jury.solo', 'processing', 'a'],
  ROOTING: b => (b.fin ? ['jury.solo', 'rooting', 'a'] : ['jury.solo', 'watching', 'a']),
  WATCHING: () => ['jury.solo', 'watching', 'a'],
  RESTLESS: () => ['jury.solo', 'restless', 'a'],
  'SETTLING IN': () => ['jury.solo', 'settle', 'a'],
  'COMMON GROUND': () => ['jury.pair', 'common', 'ab'],
  'GAME TALK': () => ['jury.pair', 'gametalk', 'ab'],
  CONFESSIONAL: () => ['jury.conf', 'any', 'a'],
  'MOTEL LIFE': b => ['jury.group', /aerobics/i.test(b.text) ? 'aerobics' : /bingo/i.test(b.text) ? 'bingo' : 'music', 'abc'],
  'ONE LAST NIGHT': b => ['jury.night', /cards/i.test(b.text) ? 'cards' : 'toast', 'abc'],
};

/** The pool key a jury beat plays from ('jury.grudge.wounds'), or null. */
export function juryKeyOf(beat) {
  const f = BY_BADGE[beat?.badge];
  if (!f) return null;
  const [kind, ending] = f(beat);
  return `${kind}.${ending}`;
}

/**
 * Write a Jury House beat as a scene, in place: the beat gains scene, lines and a `text` that is
 * now the transcript, and `jkey` (its pool key, which the viewer stages by). ctx: { ep, residents }.
 * A beat with nothing to say for it keeps the engine's sentence.
 */
export function scriptJury(beat, ctx = {}) {
  const f = BY_BADGE[beat?.badge];
  if (!f || beat.lines) return beat;
  const [kind, ending, roles] = f(beat);
  const ps = beat.players || [];
  const who = roles === 'ba' ? { a: ps[1], b: ps[0] }
    : { a: ps[0], ...(roles.length > 1 ? { b: ps[1] } : {}), ...(roles.length > 2 ? { c: ps[2] } : {}) };
  if (!who.a || (roles.length > 1 && !who.b) || (roles === 'abc' && !who.c)) return beat;
  const data = { ending };
  if (kind === 'jury.bitter') {
    if (!beat.target) return beat;
    data.target = beat.target;
    data.intent = (ctx.active || []).includes(beat.target) ? 'finalist' : 'gone';
  }
  if (ending === 'rooting') data.fin = beat.fin;
  try {
    scriptEvent(beat, makeScene(kind, who, data, [...(ctx.residents || [])], null), { ep: ctx.ep, phase: 'post' });
    beat.jkey = `${kind}.${ending}`;
  } catch (err) { console.warn('jury scene fell back to the engine sentence:', beat.badge, err?.message); }
  return beat;
}
