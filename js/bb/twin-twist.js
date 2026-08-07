// ══════════════════════════════════════════════════════════════════════
// bb/twin-twist.js — one name, two people, and a house that has to notice
// ══════════════════════════════════════════════════════════════════════
//
// From the wiki, BB5: "Adria Klein and Natalie Carroll were identical twins and
// would swap places every few days, playing as Adria. If the two made it to
// week 5 without being discovered or evicted, they would both enter the game as
// individuals." BB17 ran it again with Liz and Julia Nolan — and the house DID
// work it out, and they both entered anyway, because the rule they had to beat
// was the calendar and not the gossip.
//
// The house is never told. That is the difference between this and the
// Saboteur: there is no announcement, no wall, no rule read out in the living
// room. Only the audience knows there is anything to find, which is why the
// contract carries `secrecy: 'secret'` and no announcement block.
//
// What makes it worth building rather than being a costume: it is the only
// thing in this house that changes what a HOUSEGUEST IS. Every other twist
// changes what a week does. Here one name in the roster is two people with two
// different stat lines, and the swap is implemented by writing the active
// twin's stats onto the shared identity — so competitions, threat reads,
// nomination plans and jury opinion all feel it without a single one of them
// having to know the twist exists. The tell is real: somebody who was the best
// endurance player in the house last Thursday cannot hold a wall this Thursday,
// and nobody can say why.
import { gs, players, seasonConfig, kinshipPairs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { rememberStrategy } from '../strategy-memory.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round2 = v => Math.round(v * 100) / 100;
const stat = (name, key) => Number(pStats(name)?.[key]) || 0;
const P = name => { try { return pronouns(name); } catch { return { sub: 'they', obj: 'them', posAdj: 'their', Sub: 'They' }; } };

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

/** The twin record, or null when the season is not running one. */
export function twinState() {
  return gs.bb?.twins || null;
}

/** Is this name the shared identity two people are playing? */
export const isTwinIdentity = name => !!name && twinState()?.front === name;

/**
 * The other one.
 *
 * Identical to look at and measurably not the same person to play against,
 * which is the whole tell. The deltas are deliberately lopsided rather than
 * noise: a twin who is a bit better at everything is just a good week, and a
 * twin who is four points better at endurance and three worse at puzzles is a
 * houseguest the room can eventually notice.
 */
function twinStats(base, rng) {
  const out = { ...base };
  // Two stats up, two down, by a margin somebody could actually see.
  const keys = [...STAT_KEYS].sort(() => rng() - 0.5);
  const up = keys.slice(0, 2);
  const down = keys.slice(2, 4);
  for (const k of up) out[k] = clamp(Math.round((Number(base[k]) || 5) + 2 + rng() * 2), 1, 10);
  for (const k of down) out[k] = clamp(Math.round((Number(base[k]) || 5) - 2 - rng() * 2), 1, 10);
  return out;
}

/** The name the second one plays under once they are both in the house. */
function secondName(front) {
  const taken = new Set((players || []).map(p => p.name));
  // Their own name, which the house has never heard. Falls back to something
  // unambiguous rather than colliding with somebody already cast.
  const candidates = [`${front}'s twin`, `${front} II`, `The other ${front}`];
  return candidates.find(n => !taken.has(n)) || `${front} (2)`;
}

/**
 * Install the twist. Called once, at the top of the season.
 *
 * @returns the state, or null when the house is too small to hide it in.
 */
export function installTwinTwist(house = [], { enterWeek = 5, rng = Math.random, pick = null } = {}) {
  const cast = house.filter(Boolean);
  if (cast.length < 6) return null;

  // Whoever it is has to survive five weeks on somebody else's social capital
  // half the time, so the job goes to somebody the house likes and does not
  // watch too closely — a challenge beast swapping out is noticed in a week.
  const score = name => stat(name, 'social') * 0.4 + stat(name, 'temperament') * 0.25
    + (10 - stat(name, 'physical')) * 0.2 + stat(name, 'boldness') * 0.15;
  const front = pick && cast.includes(pick)
    ? pick
    : [...cast].sort((a, b) => score(b) - score(a))[Math.floor(rng() * 3)] || cast[0];

  const entry = (players || []).find(p => p.name === front);
  if (!entry) return null;

  // ── a twin the cast actually declared ──
  //
  // The Relationships tab can now say that two people are twins, and when it
  // does this stops guessing: the one in the house plays the identity, the one
  // outside it is the person who has been swapping in — under their own name,
  // with their own stat line, rather than a generated approximation of one.
  // That is also the real shape of it. Adria and Natalie were both cast; only
  // one of them walked through the door on night one.
  const declared = kinshipPairs('twins')
    .map(pair => {
      const inside = [pair.a, pair.b].filter(n => cast.includes(n));
      const outside = [pair.a, pair.b].find(n => !cast.includes(n));
      return inside.length === 1 && outside ? { front: inside[0], other: outside } : null;
    })
    .filter(Boolean);
  const useDeclared = declared.find(d => d.front === front) || (!pick && declared[0]) || null;
  const seat = useDeclared ? useDeclared.front : front;
  const seatEntry = (players || []).find(p => p.name === seat) || entry;

  const statsA = { ...seatEntry.stats };
  // Their real stats when the roster has them, and a lopsided variant when it
  // does not.
  const twinEntry = useDeclared
    ? (players || []).find(p => p.name === useDeclared.other) : null;
  const statsB = twinEntry?.stats ? { ...twinEntry.stats } : twinStats(statsA, rng);

  gs.bb ||= {};
  gs.bb.twins = {
    front: seat,
    other: useDeclared ? useDeclared.other : secondName(seat),
    declared: !!useDeclared,
    statsA, statsB,
    // 'a' is the one the house met on night one.
    active: 'a',
    enterWeek: Math.max(2, Number(enterWeek) || 5),
    swaps: [],
    // Who has noticed that something does not add up. Same shape as the
    // saboteur's: per suspect, per observer — except here there is only ever
    // one suspect, and the question is how sure the room is.
    suspicion: {},
    exposed: false,
    entered: false,
    caught: false,
    installedWeek: (gs.bb.weeks?.length || 0) + 1,
  };
  return gs.bb.twins;
}

/** Write whichever twin is currently in the house onto the shared identity. */
function applyActive() {
  const st = twinState();
  if (!st) return;
  const entry = (players || []).find(p => p.name === st.front);
  if (!entry) return;
  entry.stats = { ...(st.active === 'a' ? st.statsA : st.statsB) };
}

const SWAP_LINES = [
  (n, room) => `The one the house has been talking to all week walks into ${room} and does not come out. `
    + `The one who comes out has the same face and has not heard a word of it.`,
  (n, room) => `Somewhere behind ${room} a door opens twice. ${n} goes in tired and comes out rested, `
    + `which is the kind of thing nobody comments on until much later.`,
  (n, room) => `They change places in the ninety seconds the house spends looking at something else. `
    + `The one who has been in there for four days gets to lie down.`,
];

/**
 * The swap.
 *
 * Called between weeks. The stat line changes on the shared identity, and every
 * system downstream simply plays against a different person under the same
 * name — which is the entire mechanic and needs no other system to cooperate.
 */
export function swapTwins(week, { rng = Math.random } = {}) {
  const st = twinState();
  if (!st || st.entered || st.caught) return null;
  const house = week?.houseAtStart || gs.activePlayers || [];
  if (!house.includes(st.front)) return null;

  st.active = st.active === 'a' ? 'b' : 'a';
  applyActive();
  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  st.swaps.push({ week: weekNum, active: st.active });

  const room = ['the storeroom', 'the diary room', 'the have-not room', 'the pantry'][Math.floor(rng() * 4)];
  return {
    week: weekNum, active: st.active, room,
    text: SWAP_LINES[Math.floor(rng() * SWAP_LINES.length)](st.front, room),
  };
}

// ── the tells ───────────────────────────────────────────────────────────
//
// Two kinds, and they are different mechanisms. A MEMORY slip is the one that
// is really theirs — the person in the room genuinely did not have the
// conversation being referred to. A FORM slip is the house noticing that the
// body in front of them is not the one that hung off a wall for six hours last
// week, which is what the stat swap produces on its own.

const MEMORY_SLIPS = [
  (n, o) => `${o} picks up a conversation from two days ago and ${n} does not know what it is about. `
    + `${n} covers it, badly, by agreeing with all of it.`,
  (n, o) => `"You told me that already." ${n} says it to ${o} about something ${o} has never said, `
    + `and watches ${o} decide whether to argue.`,
  (n, o) => `${o} asks ${n} to finish a sentence they started together on Sunday. ${n} cannot, `
    + `and laughs it off in a way that ${o} will remember.`,
  (n, o) => `${n} calls ${o} by the wrong shortening of ${P(o).posAdj} name — the one nobody in this house uses `
    + `and one person did, once, on the first night.`,
];

const FORM_SLIPS = [
  (n, o) => `${o} watches ${n} lose a competition ${n} won a fortnight ago, at the same thing, `
    + `and cannot make the two of them line up.`,
  (n, o) => `${o} notices that ${n} is left-handed this week and puts it down to being tired.`,
  (n, o) => `${n} is suddenly, unaccountably better at something. ${o} says so out loud as a compliment `
    + `and then spends the evening thinking about it.`,
];

/**
 * Whether anybody caught it this week, and what they made of it.
 *
 * Suspicion here is about IDENTITY rather than intent, so it needs a different
 * bar from the saboteur's: nobody's first thought is "there are two of you."
 * The room notices that something is off long before anybody says the actual
 * word, which is why `exposed` needs a much higher total than a slip or two.
 */
export function twinTells(week, { rng = Math.random } = {}) {
  const st = twinState();
  if (!st || st.entered || st.caught) return null;
  const house = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean);
  if (!house.includes(st.front)) return null;
  const weekNum = Number(week?.num) || 1;
  const others = house.filter(n => n !== st.front);
  if (!others.length) return null;

  // How far apart the two of them actually are. A pair with nearly the same
  // stat line is genuinely hard to catch; a pair that differ by four points in
  // two places gets caught by anybody paying attention.
  const gap = STAT_KEYS.reduce((sum, k) =>
    sum + Math.abs((Number(st.statsA[k]) || 0) - (Number(st.statsB[k]) || 0)), 0) / STAT_KEYS.length;

  const beats = [];
  const notices = [];
  // Three a week at most. Eight people all noticing something in the same seven
  // days is not a house slowly working something out, it is a wall of cards
  // saying the same thing — and it put the twist on the board in week one.
  const MAX_TELLS = 3;
  for (const observer of others) {
    if (notices.length >= MAX_TELLS) break;
    // Closeness is what catches this. You do not notice that somebody has been
    // replaced unless you were talking to them in the first place.
    const closeness = clamp((getBond(st.front, observer) + 4) / 12, 0, 1);
    const chance = clamp(0.05 + closeness * 0.22 + stat(observer, 'intuition') * 0.02
      + gap * 0.03 + ((st.suspicion[observer] || 0) > 0 ? 0.18 : 0), 0.02, 0.6);
    if (rng() >= chance) continue;

    const memory = rng() < 0.55;
    const pool = memory ? MEMORY_SLIPS : FORM_SLIPS;
    beats.push({
      text: pool[Math.floor(rng() * pool.length)](st.front, observer),
      players: [st.front, observer],
      badgeText: memory ? 'SOMETHING THEY DID NOT SAY' : 'SOMETHING THEY CANNOT DO',
      badgeClass: 'blue',
    });
    // Somebody who has already caught one is WATCHING for the next, so the
    // second thing they see is worth more than the first. Without this,
    // suspicion sprayed itself evenly over eleven people and nobody ever got
    // sure enough to say it — nought exposures in twenty-four measured seasons,
    // which made the tells decoration.
    const primed = (st.suspicion[observer] || 0) > 0;
    (st.suspicion[observer] ||= 0);
    st.suspicion[observer] = round2(st.suspicion[observer]
      + (memory ? 1 : 0.8) * (primed ? 1.7 : 1));
    notices.push({ observer, kind: memory ? 'memory' : 'form' });
    // It costs the friendship a little. Being lied to about something you
    // cannot name is still being lied to.
    try { addBond(observer, st.front, -0.35); } catch { /* nothing to lose */ }
  }
  if (!beats.length) return null;

  return { week: weekNum, gap: round2(gap), notices, beats };
}

/** How close the house is to saying it out loud, 0..1. */
export function twinExposure() {
  const st = twinState();
  if (!st) return 0;
  const total = Object.values(st.suspicion).reduce((a, b) => a + b, 0);
  return clamp(total / 9, 0, 1);
}

/**
 * Somebody says the word.
 *
 * BB17's house worked it out and it did not end the twist — Liz and Julia still
 * both entered, because the rule they had to beat was the calendar. So being
 * exposed is not a fail state here either: it is a target painted on them for
 * whatever is left of the five weeks, which is a far worse problem than the
 * gossip.
 */
export function twinExposure_check(week, { rng = Math.random } = {}) {
  const st = twinState();
  if (!st || st.exposed || st.entered || st.caught) return null;
  const house = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean);
  if (!house.includes(st.front)) return null;
  // Two people have to have got there independently, and one of them has to be
  // sure enough to say a sentence that sounds insane out loud.
  //
  // A high bar, and deliberately higher than the saboteur's. "Somebody is
  // working against us" is a thing houseguests say every week of every season;
  // "there are two of you" is a thing nobody says until they cannot explain it
  // any other way. Three people, each sure on their own, and the room past two
  // thirds — measured, because at two voices it was being said out loud in two
  // seasons out of three.
  const sure = Object.entries(st.suspicion).filter(([n, v]) => house.includes(n) && v >= 1.9);
  if (sure.length < 3 || twinExposure() < 0.62) return null;

  const teller = sure.sort((a, b) => b[1] - a[1])[0][0];
  st.exposed = true;
  st.exposedWeek = Number(week?.num) || 0;
  const p = P(teller);
  for (const n of house.filter(x => x !== st.front)) {
    try { addBond(n, st.front, -1.5); } catch { /* fine */ }
    try {
      rememberStrategy(n, st.front, 'playing-with-two-bodies', st.exposedWeek, 2,
        { format: 'big-brother', twist: 'bb-twin-twist' });
    } catch { /* the grudge stands */ }
  }
  return {
    week: st.exposedWeek, teller, front: st.front,
    beats: [{
      text: `${teller} says it in the kitchen, to four people, and does not soften it: `
        + `"There are two of ${st.front}." Nobody laughs. Somebody says the thing everybody `
        + `has been not saying for a fortnight — that it depends which day you ask.`,
      players: [teller, st.front], badgeText: 'THERE ARE TWO OF THEM', badgeClass: 'red',
    }, {
      text: `It does not end anything. Whatever the house has worked out, it has no way to act on it `
        + `except the way it acts on everything, which is to write ${st.front}'s name down — `
        + `and ${P(st.front).posAdj} problem was never the gossip, it was the calendar.`,
      players: [st.front], badgeText: 'A TARGET, NOT A VERDICT', badgeClass: 'grey',
    }],
  };
}

/**
 * The calendar, beaten.
 *
 * Both of them enter as individuals, which is the only moment in this house
 * where the roster gets BIGGER for a reason that is not a returnee. The second
 * one arrives with the stat line the house has been playing against half the
 * time without knowing it.
 */
export function checkTwinEntry(week) {
  const st = twinState();
  if (!st || st.entered || st.caught) return null;
  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  if (weekNum < st.enterWeek) return null;
  const house = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean);
  if (!house.includes(st.front)) return null;

  st.entered = true;
  st.enteredWeek = weekNum;

  // The one the house met stays under the name it knows. The other one becomes
  // a houseguest in their own right, with their own stats and their own name.
  const entry = (players || []).find(p => p.name === st.front);
  const frontStats = st.active === 'a' ? st.statsA : st.statsB;
  const otherStats = st.active === 'a' ? st.statsB : st.statsA;
  if (entry) entry.stats = { ...frontStats };
  const already = (players || []).find(p => p.name === st.other);
  if (already) {
    // A declared twin the cast already holds — they keep their own record and
    // simply walk in.
    already.stats = { ...otherStats };
    already.twinOf = st.front;
  } else {
    players.push({
      name: st.other,
      slug: String(st.other).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      gender: entry?.gender || 'f',
      sexuality: entry?.sexuality || 'straight',
      archetype: entry?.archetype || 'floater',
      stats: { ...otherStats },
      twinOf: st.front,
    });
  }
  gs.activePlayers = [...(gs.activePlayers || []), st.other];
  gs.bb.stats ||= {};
  gs.bb.stats[st.other] ||= { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
    timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 };

  // The house's feelings about the front carry over to the other one, halved:
  // they have been talking to this person for five weeks and did not know it.
  for (const n of house.filter(x => x !== st.front)) {
    try { addBond(n, st.other, getBond(n, st.front) * 0.5 - 0.5); } catch { /* new to them */ }
  }

  return {
    week: weekNum, front: st.front, other: st.other, exposed: !!st.exposed,
    beats: [{
      text: `${st.front} is called to the diary room and comes back with somebody. `
        + `They are the same person, and there are two of them, and there always were.`,
      players: [st.front, st.other], badgeText: 'BOTH OF THEM', badgeClass: 'gold',
    }, {
      text: st.exposed
        ? `Half this house has been saying it for a fortnight and gets to be right out loud, `
          + `which is worth considerably less than the extra vote now standing in the kitchen.`
        : `Nobody had it. Five weeks of one of them at a time, and the house is now one body bigger `
          + `than it was this morning with no eviction to account for it.`,
      players: [st.front, st.other], badgeText: 'THE HOUSE IS BIGGER', badgeClass: 'gold',
    }],
  };
}

/** Evicted before the calendar ran out: both of them go, and the house finds out. */
export function twinEvicted(name, week) {
  const st = twinState();
  if (!st || st.front !== name || st.entered || st.caught) return null;
  st.caught = true;
  const weeks = st.swaps.length;
  return {
    week: Number(week?.num) || 0, front: name, swaps: weeks,
    beats: [{
      text: `${name} walks out of the door, and then ${name} walks out of the door again. `
        + `The house gets its answer about four seconds too late to do anything with it.`,
      players: [name], badgeText: 'THERE WERE TWO', badgeClass: 'red',
    }, {
      text: `${weeks} swap${weeks === 1 ? '' : 's'} in and out of that storeroom and neither of them `
        + `made it to the week that would have made them both real. They go home as one houseguest.`,
      players: [name], badgeText: 'ONE EVICTION, TWO PEOPLE', badgeClass: 'grey',
    }],
  };
}
