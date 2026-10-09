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
import { scriptEvent, fill, transcript } from './write.js';

// Where a scene finds its people, when its script opens straight on a line (the user, 2026-10-09:
// "no setup for a conversation"): one stage direction that says where they are and why the talk
// starts. Read only when the picked script has no staging of its own up front.
const SETUP = {
  'jury.arrive.hug': ['{a} walks into the motel lobby with a bag. {b} is waiting by the front desk.', 'The van pulls up outside the motel, and {a} climbs out. {b} is already at the door.'],
  'jury.arrive.alone': ['{a} walks into the motel with a bag over one shoulder.', 'The van drops {a} at the motel gate and drives off.'],
  'jury.grudge.wounds': ['{a} and {b} end up in the lounge at the same time, and the room goes quiet.', 'First morning with both of them under the same roof. {a} spots {b} across the lounge.'],
  'jury.grudge.boils': ["At the buffet, {a} and {b} end up at the same table, and it has been tense all week.", '{a} and {b} have been circling each other for days. At the buffet, it finally starts.'],
  'jury.grudge.reckon': ["It's late. The pool lights are on, and {a} and {b} are the only two still up.", 'Everyone else has gone to bed. {a} is still sitting by the pool when {b} comes out.'],
  'jury.grudge.buried': ['The last night at the motel. {a} and {b} are at the bar together, which nobody would have bet on.', 'Last night at the motel, and {a} and {b} are sitting side by side at the bar.'],
  'jury.outsider.outside': ['{a} is on the edge of things again while everyone else crowds together.', 'Another meal, another table full of people {a} barely knows.'],
  'jury.outsider.seat': ['{a} is alone at the end of a table again. This time {b} notices.', 'Lunch at the buffet. {a} sits by {a.ref}, and {b} sees it.'],
  'jury.outsider.belong': ['The last night by the pool. {a} is right in the middle of the group, next to {b}.', 'Last night at the motel, and {a} is not sitting alone any more. {b} saw to that.'],
  'jury.bitter.start': ["{a} has been in a mood since breakfast, and everyone knows why.", '{a} is on a lounger with the feeds on, glaring at the screen.'],
  'jury.bitter.vote': ['{a} has been quiet all evening. Then {a} speaks up.', 'The last night, and the talk at the bar turns to the jury vote. {a} has been waiting for it.'],
  'jury.friends.strange': ['{a} and {b} never talked once in the game. They have never been alone in a room together.', "{a} and {b} were on opposite sides of every vote. Neither of them is sure what to say to the other."],
  'jury.friends.thick': ['{a} and {b} have been inseparable for days.', 'Nobody has seen {a} without {b} since the day they met at the motel.'],
  'jury.looms.any': ['{a} is lying by the pool with the others, but can only think about the finale.', 'Everyone else is talking about the food. {a} is not.'],
  'jury.solo.processing': ['{a} is alone on a lounger, away from everyone.', "{a} hasn't said much all day."],
  'jury.solo.rooting': ['{a} is in the lounge with the feeds on, watching the game.', '{a} has pulled a chair right up to the TV in the lounge.'],
  'jury.solo.watching': ['{a} is in the lounge with the feeds on, watching.', '{a} sits at the bar with a drink, saying nothing, watching the room.'],
  'jury.solo.restless': ['{a} has been pacing since breakfast.', "{a} can't sit still. Nobody has seen {a} on a lounger all day."],
  'jury.solo.settle': ['{a} finds the motel quiet for once.', 'For the first time all week, nobody needs {a} for anything.'],
  'jury.pair.common': ['{a} and {b} have barely spoken all season. Today they end up side by side.', 'It is a slow afternoon, and {a} and {b} are the only two by the pool.'],
  'jury.pair.gametalk': ['{a} and {b} are on the loungers, and the talk turns to the finalists.', 'The feeds are on in the lounge, and {a} and {b} are watching the game together.'],
  'jury.group.aerobics': ['Mid-morning at the pool. {a} has an announcement for {b} and {c}.', 'A quiet morning at the motel, until {a} shows up at the pool with a whistle.'],
  'jury.group.bingo': ['Bingo night in the lounge. {a} has the cage, {b} has a bad attitude, and {c} has never played bingo.', 'After dinner, {a} sets up bingo. {b} and {c} sit down to play.'],
  'jury.group.music': ['Evening in the lounge. {a} picks up a guitar somebody left behind, and {b} and {c} look over.', 'Someone left a guitar in the lounge. {a} picks it up while {b} and {c} watch.'],
  'jury.night.toast': ['The last night at the motel. {a}, {b} and {c} are out by the pool with everyone else.', 'The last night. Everybody is outside by the pool, and {a} has found the mini-fridge.'],
  'jury.night.cards': ['The last night. {a} has a deck of cards, and {b} and {c} have nowhere to be.', 'Nobody wants the last night to end, so {a} gets out a deck of cards for {b} and {c}.'],
};
function setUp(beat, key, who) {
  const opts = SETUP[key];
  if (!opts || !beat.lines?.length || beat.lines[0].kind === 'beat') return;
  let h = 0; for (const ch of `${key}|${who.a}|${who.b || ''}`) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const text = fill(opts[(h >>> 0) % opts.length], who, {});
  beat.lines.unshift({ kind: 'beat', by: null, text: text.charAt(0).toUpperCase() + text.slice(1) });
  beat.text = transcript(beat.lines);
}

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
  'MOTEL LIFE': b => ['jury.group', b.ending || (/aerobics/i.test(b.text) ? 'aerobics' : /bingo/i.test(b.text) ? 'bingo' : 'music'), 'abc'],
  // the threads of the group blocks (td/script/jury-week.js)
  'ACTIVITY GRUDGE': () => ['jury.a', 'grudge', 'ab'], 'ACTIVITY LOBBY': () => ['jury.a', 'lobby', 'ab'],
  'ACTIVITY BANTER': () => ['jury.a', 'banter', 'ab'], 'ACTIVITY OUTSIDER': () => ['jury.a', 'outsider', 'a'],
  'GAME GRUDGE': () => ['jury.c', 'grudge', 'ab'], 'GAME OUTSIDER': () => ['jury.c', 'outsider', 'ab'], 'GAME FRIENDS': () => ['jury.c', 'friends', 'ab'],
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
  if (ending === 'rooting' || ending === 'lobby') data.fin = beat.fin;
  try {
    scriptEvent(beat, makeScene(kind, who, data, [...(ctx.residents || [])], null), { ep: ctx.ep, phase: 'post' });
    beat.jkey = `${kind}.${ending}`;
    setUp(beat, beat.jkey, who);
  } catch (err) { console.warn('jury scene fell back to the engine sentence:', beat.badge, err?.message); }
  return beat;
}
