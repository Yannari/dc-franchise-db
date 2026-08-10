// ══════════════════════════════════════════════════════════════════════
// bb/twin-twist.js — one name, two people, and a house that has to notice
// ══════════════════════════════════════════════════════════════════════
//
// From the wiki, BB5: "Adria Klein and Natalie Carroll were identical twins and
// would swap places every few days, playing as Adria. If the two made it to
// week 5 without being discovered or evicted, they would both enter the game as
// individuals." BB17 ran it again with Liz and Julia Nolan.
//
// This is that shape with the calendar taken out of it. Beating a date is a
// twist you watch happen TO somebody; the second twin arriving because the pair
// of them earned it is a twist somebody plays. So entry is a QUOTA — a run of
// weekly jobs that only two people sharing a name could bring off — and the
// season has four endings instead of one:
//
//   QUOTA MET     both of them walk in, and the house finds out at the same
//                 moment it finds out it has been wrong about one person for
//                 six weeks.
//   DISCOVERED    somebody says it out loud in front of everybody. The jobs
//                 stop, the second twin never enters, and the reveal happens
//                 anyway — as a confrontation rather than a surprise.
//   EVICTED       the shared identity goes home. Both of them go, and the one
//                 who was in the storeroom walks out to meet them at the door.
//   UNFINISHED    they were never caught and never got there. The house is told
//                 at the end that it was fooled all season and never knew.
//
// The house is never told any of this is happening. That is the difference
// between this and the Saboteur: no announcement, no wall, no rule read out in
// the living room. Only the audience knows there is anything to find, which is
// why the contract carries `secrecy: 'secret'` and no announcement block.
//
// ── how the house catches it ────────────────────────────────────────────
//
// Nothing like the Saboteur, and this is the part worth reading. The Saboteur
// does things TO the house — a competition goes wrong, the food is gone — and
// the room asks who. Nobody is doing anything to anybody here. The tell is that
// the person is INCONSISTENT WITH THEMSELVES, and there are exactly three ways
// that happens:
//
//   MEMORY   the twin who was not there cannot know what was said. Worst in the
//            days right after a swap, and governed by the HANDOFF — the note the
//            outgoing twin leaves behind. BB5's pair swapped in the bathroom and
//            wrote each other briefings, so a good note is a quiet week and a
//            blind handoff is four days of not knowing anybody's business.
//   FORM     the two stat lines are not the same. Somebody who hung off a wall
//            for six hours last Thursday cannot do it this Thursday, and the
//            gap between the pair is how loud that is — which makes CASTING a
//            real decision. Twins with the same stat line are hard to catch and
//            can never weaponise the difference.
//   THE JOB  a mission is an action and actions get seen. Bigger pay, more noise.
//
// And who notices is the whole tension: it is weighted by BOND. Your closest
// ally is the one who knows what you told them yesterday. A stranger does not
// remember your birthday well enough to notice you got it wrong. So playing the
// social game — the thing that wins this show — is the thing that gets you
// caught, and there is no way to do one without the other.
import { gs, players, seasonConfig, kinshipPairs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { rememberStrategy } from '../strategy-memory.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round2 = v => Math.round(v * 100) / 100;
const stat = (name, key) => Number(pStats(name)?.[key]) || 0;
const P = name => { try { return pronouns(name); } catch { return { sub: 'they', obj: 'them', posAdj: 'their', pos: 'theirs', Sub: 'They' }; } };
const has = (name, verb) => `${P(name).sub} ${P(name).sub === 'they' ? verb : `${verb}s`}`;

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

/** The twin record, or null when the season is not running one. */
export function twinState() {
  return gs.bb?.twins || null;
}

/** Is this name the shared identity two people are playing? */
export const isTwinIdentity = name => !!name && twinState()?.front === name;

/** Has the twist stopped, however it stopped? */
const over = st => !!st && (st.entered || st.caught);

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
  for (const k of keys.slice(0, 2)) out[k] = clamp(Math.round((Number(base[k]) || 5) + 2 + rng() * 2), 1, 10);
  for (const k of keys.slice(2, 4)) out[k] = clamp(Math.round((Number(base[k]) || 5) - 2 - rng() * 2), 1, 10);
  return out;
}

/** The name the second one plays under once they are both in the house. */
function secondName(front) {
  const taken = new Set((players || []).map(p => p.name));
  // Their own name, which the house has never heard. Falls back to something
  // unambiguous rather than colliding with somebody already cast.
  return [`${front}'s twin`, `${front} II`, `The other ${front}`]
    .find(n => !taken.has(n)) || `${front} (2)`;
}

/**
 * Install the twist. Called once, at the top of the season.
 *
 * @returns the state, or null when the house is too small to hide it in.
 */
export function installTwinTwist(house = [], {
  weeks = 5, quota = 4, rng = Math.random, pick = null,
} = {}) {
  const cast = house.filter(Boolean);
  if (cast.length < 6) return null;

  // Whoever it is has to survive on somebody else's social capital half the
  // time, so the job goes to somebody the house likes and does not watch too
  // closely — a challenge beast swapping out is noticed in a week.
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
  // Two ways a season can declare it, and BOTH have to work — the second one is
  // what anybody actually does. Casting only one of the pair is the tidy
  // version; casting both and marking them twins is the obvious version, and it
  // used to fail the `inside.length === 1` check, silently invent a stranger,
  // and leave the two declared twins sitting in the house as ordinary
  // houseguests who happened to be related.
  const declared = kinshipPairs('twins')
    .map(pair => {
      const inside = [pair.a, pair.b].filter(n => cast.includes(n));
      const outside = [pair.a, pair.b].find(n => !cast.includes(n));
      // One in, one waiting: the tidy version.
      if (inside.length === 1 && outside) return { front: inside[0], other: outside, held: false };
      // Both cast: only one of them walked through the door on night one, which
      // is the real shape of it. Adria and Natalie were both cast.
      if (inside.length === 2) {
        const seatFirst = pick && inside.includes(pick) ? pick : inside[0];
        return { front: seatFirst, other: inside.find(n => n !== seatFirst), held: true };
      }
      return null;
    })
    .filter(Boolean);
  // A hand-picked front wins, and a declaration naming that person wins with
  // it. Picking somebody who is not half of a declared pair still gets a
  // generated twin — that is the user overriding the cast on purpose.
  const useDeclared = declared.find(d => d.front === front) || (!pick && declared[0]) || null;
  const seat = useDeclared ? useDeclared.front : front;
  const seatEntry = (players || []).find(p => p.name === seat) || entry;

  // ── GIVE THE IDENTITY BACK BEFORE BORROWING IT AGAIN ────────────────────
  //
  // `applyActive` writes whichever twin is in the building onto the front's
  // roster entry — that is the whole mechanic, and it fires on night one, not
  // just after a swap. Nothing ever put the front's own line back, so the
  // moment a season seated twin B the roster entry stopped being the person it
  // is named after. Harmless inside that season, because `statsA` was captured
  // before it happened; fatal to the next one, which built `statsA` out of the
  // leftovers and got the OTHER twin's numbers. Both panels then showed one
  // person twice — reported off a played week 1, with Harriett's photograph
  // over Jane's stat line, twice.
  //
  // So the untouched line is stashed on the entry the first time it is borrowed
  // and handed back at the top of every install. It lives on the player rather
  // than on `gs` on purpose: `gs` is the season, and the thing that needs
  // repairing outlives the season.
  if (seatEntry._twinRealStats) seatEntry.stats = { ...seatEntry._twinRealStats };
  else seatEntry._twinRealStats = { ...seatEntry.stats };

  const statsA = { ...seatEntry.stats };
  // Their real stats when the roster has them, and a lopsided variant when it
  // does not.
  const twinEntry = useDeclared ? (players || []).find(p => p.name === useDeclared.other) : null;
  const statsB = twinEntry?.stats ? { ...twinEntry.stats } : twinStats(statsA, rng);

  // Cast in, but not through the door. When the season declared both of them
  // the second one is taken out of the active house here — they have been in
  // the storeroom since night one, and every roster-scoped system in the
  // simulator reads `gs.activePlayers`, so this is the only place it has to be
  // said. Their record stays on `players`, which is what lets them walk in
  // later under their own name.
  if (useDeclared?.held) {
    gs.activePlayers = (gs.activePlayers || []).filter(n => n !== useDeclared.other);
  }

  gs.bb ||= {};
  gs.bb.twins = {
    front: seat,
    other: useDeclared ? useDeclared.other : secondName(seat),
    declared: !!useDeclared,
    // Whether the second one was cast and pulled back out, or never cast at all.
    held: !!useDeclared?.held,
    statsA, statsB,
    // 'a' is the one the house met on night one.
    active: 'a',
    // ── what they have to do to both get in ──
    //
    // SURVIVE. This is the rule the show actually plays, and the wiki states it
    // plainly for Big Brother 5: Adria and Natalie "would swap places every few
    // days, playing as Adria. If the two made it to week 5 without being
    // discovered or evicted, they would both enter the game as individuals."
    // Big Brother 17 ran it the same way.
    //
    // It used to be a QUOTA OF JOBS, on the theory that a pair should be able to
    // be good at this. In play that theory lost: the missions are optional, the
    // pair turned them down, and a real season finished "2 jobs out of 4" and
    // went home as one houseguest having never both entered. A gate nobody
    // reaches is not a challenge, it is a twist that does not happen.
    //
    // The jobs stay. They pay money and they risk exposure — which is what they
    // were always good at — and they no longer decide whether the twist pays off.
    weeks: Math.max(1, Number(weeks) || 5),
    quota: Math.max(1, Number(quota) || 4),
    completed: 0,
    attempted: 0,
    missions: [],
    said: {},
    // The money, and what the audience made of the job. Same two currencies as
    // the Saboteur — one paid at the end, one felt inside the game every week.
    banked: 0,
    prize: 25000,
    applause: 0,
    // How well the incoming twin was briefed, 0..1. Set by the handoff at each
    // swap and read by the memory slips.
    knows: 1,
    handoff: null,
    // Who has noticed that something does not add up, and how sure they are.
    suspicion: {},
    swaps: [],
    exposed: false,
    entered: false,
    caught: false,
    ending: null,
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

/** The stat line of whoever is in the building right now. */
const liveStats = st => (st.active === 'a' ? st.statsA : st.statsB);

// ── the handoff ─────────────────────────────────────────────────────────
//
// BB5's twins swapped in the bathroom and left each other written briefings,
// which is the detail that makes the whole thing survivable: the incoming twin
// knows what they know because the outgoing one wrote it down. So the note is a
// mechanic and not flavour — its quality is the dial that governs memory slips,
// and a mission that forbids it is the most dangerous week in the twist.

const NOTE_GOOD = [
  (out, into) => `Four minutes in the storeroom and a page of handwriting: who said what, who is angry `
    + `with whom, and one line at the bottom about a conversation ${into} is going to be expected to remember.`,
  (out, into) => `The note is almost too thorough. Names, rooms, times, and a warning about somebody `
    + `who has started asking questions that sound casual and are not.`,
  (out, into) => `Everything that happened this week, in order, in tiny writing on the back of a shopping list. `
    + `${into} reads it twice and eats the evidence, which is not a joke.`,
];
const NOTE_THIN = [
  (out, into) => `The handover is thirty seconds and half a sentence. ${into} walks out into a house `
    + `that has had four days of conversations without ${P(into).obj}.`,
  (out, into) => `The note says three names and nothing about why any of them matter. `
    + `It is going to have to be enough.`,
  (out, into) => `There is no time to write anything down. ${out} says one thing, quickly, `
    + `and the one thing is not the important thing.`,
];
const NOTE_BLIND = [
  into => `No note. That was the job. ${into} walks into a house ${P(into).sub} last saw a week ago `
    + `and has to behave like somebody who never left it.`,
  into => `The paper stays in the pocket. Whatever happened in this house for four days, `
    + `${into} is going to have to work it out from people's faces.`,
];

/**
 * NIGHT ONE — the only screen that explains the rules, and the only people it
 * is explained to are watching at home.
 *
 * Every other twist in this house gets read out in the living room. This one
 * cannot be: the whole format is that nobody inside knows there is anything to
 * find, so the announcement machinery in week.js has no gathering to hang it
 * on. Without a screen of its own, a viewer's first sight of the twist was a
 * changeover in week one for a twist they had never been told about.
 *
 * It is also where the two of them make the one decision that is genuinely
 * theirs: which of them walks through the front door. The other one has to
 * spend a week in a room with no windows, so it goes to whoever is better at
 * the first week of this game — being liked by strangers, quickly.
 */
export function openTwinTwist(week, { rng = Math.random } = {}) {
  const st = twinState();
  if (!st || over(st) || st.opened) return null;
  const house = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean);
  if (!house.includes(st.front)) return null;
  st.opened = true;
  const weekNum = Number(week?.num) || 1;

  // Whoever reads a room fastest goes in first. A first week is nothing but
  // strangers deciding whether they like you, and the other one gets to walk
  // into a house that has already made up its mind — which is easier.
  const firstWeek = s => (Number(s.social) || 5) * 0.5 + (Number(s.temperament) || 5) * 0.3
    + (Number(s.intuition) || 5) * 0.2;
  const aFirst = firstWeek(st.statsA) >= firstWeek(st.statsB);
  st.active = aFirst ? 'a' : 'b';
  applyActive();
  st.swaps.push({ week: weekNum, active: st.active, opening: true });

  const goes = aFirst ? st.front : st.other;
  const waits = aFirst ? st.other : st.front;
  const gap = STAT_KEYS.reduce((sum, k) =>
    sum + Math.abs((Number(st.statsA[k]) || 0) - (Number(st.statsB[k]) || 0)), 0) / STAT_KEYS.length;

  return {
    type: 'twin-open', secret: true, week: weekNum,
    front: st.front, other: st.other, declared: !!st.declared,
    quota: st.quota, prize: st.prize, goesFirst: goes, waits,
    gap: round2(gap), aFirst,
    twins: { other: st.other, active: st.active, statsA: { ...st.statsA }, statsB: { ...st.statsB } },
    rules: [
      `Two people are playing as ${st.front}. They look the same and they do not play the same, `
        + `and one of them at a time is in that house.`,
      `Nobody inside is told. There is no wall, no announcement and no rule anybody can break — `
        + `the room has to work out on its own that the person it has been talking to is two people.`,
      `Last ${st.weeks} weeks without being found out and without ${st.front} being evicted, `
        + `and both of them join the game as separate houseguests.`,
      `Every week they are also offered a job only two people sharing a name could finish. `
        + `The jobs pay, and every one they take is another chance to be seen. `
        + `They are worth money and they are not the way in.`,
      `Get found out, or get ${st.front} evicted, and it stops there. `
        + `The second one never plays and nothing is paid.`,
    ],
    beats: [{
      text: `They decide it between themselves, in a room nobody has seen yet. `
        + `${goes} goes first, because a first week is nothing but strangers deciding whether `
        + `they like you and ${goes} is better at being liked by strangers. `
        + `${waits} takes the room with no windows.`,
      players: [st.front], badgeText: 'WHO GOES IN FIRST', badgeClass: 'gold',
    }, {
      text: gap >= 1.5
        ? `It is not a small difference between them. There are ${STAT_KEYS.filter(k =>
          Math.abs((Number(st.statsA[k]) || 0) - (Number(st.statsB[k]) || 0)) >= 2).length} things `
          + `one of them is clearly better at than the other, and every one of those is a week `
          + `where somebody in that house watches ${st.front} do something ${st.front} could not do `
          + `a fortnight ago.`
        : `They are close enough to be hard to tell apart, which is the good news and also the bad news: `
          + `nobody is going to catch them on form, and they cannot use the difference for anything either.`,
      players: [st.front], badgeText: 'HOW ALIKE THEY ARE', badgeClass: 'blue',
    }],
  };
}

const SWAP_LINES = [
  (n, room) => `The one the house has been talking to all week walks into ${room} and does not come out. `
    + `The one who comes out has the same face and has not heard a word of it.`,
  (n, room) => `Somewhere behind ${room} a door opens twice. ${n} goes in tired and comes out rested, `
    + `which is the kind of thing nobody comments on until much later.`,
  (n, room) => `They change places in the ninety seconds the house spends looking at something else. `
    + `The one who has been in there for four days gets to lie down.`,
  (n, room) => `Two minutes in ${room} with the door shut, and the person who comes out of it is `
    + `not the person who went in. Nobody in this house has ever had a reason to count.`,
];

/**
 * The swap, and the note that comes with it.
 *
 * Called between weeks. The stat line changes on the shared identity, and every
 * system downstream simply plays against a different person under the same
 * name — which is the entire mechanic and needs no other system to cooperate.
 */
export function swapTwins(week, { rng = Math.random } = {}) {
  const st = twinState();
  if (!st || over(st)) return null;
  const house = week?.houseAtStart || gs.activePlayers || [];
  if (!house.includes(st.front)) return null;

  // Written by whoever has been living in the house, before they leave it.
  const outgoing = liveStats(st);
  st.active = st.active === 'a' ? 'b' : 'a';
  applyActive();
  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  st.swaps.push({ week: weekNum, active: st.active });

  // How much of the week actually makes it across. Somebody observant and
  // articulate hands over a house; somebody who spent four days keeping their
  // own head above water hands over three names.
  const craft = ((Number(outgoing.mental) || 5) * 0.5 + (Number(outgoing.social) || 5) * 0.3
    + (Number(outgoing.intuition) || 5) * 0.2) / 10;
  const quality = clamp(craft * 0.85 + rng() * 0.3 - 0.1, 0.05, 1);
  st.knows = round2(quality);

  const inName = st.front;
  const note = quality >= 0.55
    ? NOTE_GOOD[Math.floor(rng() * NOTE_GOOD.length)](inName, inName)
    : NOTE_THIN[Math.floor(rng() * NOTE_THIN.length)](inName, inName);
  st.handoff = { week: weekNum, quality: st.knows, blind: false, text: note };

  const room = ['the storeroom', 'the diary room', 'the have-not room', 'the pantry'][Math.floor(rng() * 4)];
  return {
    week: weekNum, active: st.active, room,
    text: SWAP_LINES[Math.floor(rng() * SWAP_LINES.length)](st.front, room),
    handoff: st.handoff,
  };
}

// ── the jobs ────────────────────────────────────────────────────────────
//
// Every one of them is something only two people sharing a name could do, or
// something that is only dangerous because there are two of you. A mission that
// any houseguest could complete is not a twin mission, it is homework.
//
// `noise` is the risk: how much of the house sees it happen. `spice` is what
// the audience made of it, which is a different axis — the safest jobs are
// frequently the dullest, and the pay should not be the same for both.
// `can()` may only read WEEK-TOP facts. The briefing runs before the Head of
// Household exists, and the Saboteur's version of this bug quietly disqualified
// six of its nine missions for a month.

const MISSIONS = [
  {
    id: 'both-sides',
    name: 'Both sides of the room',
    brief: 'Two houseguests who cannot stand each other. Be the person each of them trusts most by Thursday.',
    pay: 5000, noise: 0.24, spice: 0.75, difficulty: 0.3,
    can: ctx => ctx.others.length >= 5,
    run(ctx, rng) {
      // The two people furthest apart in the house. Doable at all only because
      // the person doing the reassuring on Monday is not the person doing it on
      // Friday, and neither of them has to keep a story straight for a week.
      let worst = null;
      for (const a of ctx.others) {
        for (const b of ctx.others) {
          if (a >= b) continue;
          const d = getBond(a, b);
          if (!worst || d < worst.d) worst = { a, b, d };
        }
      }
      if (!worst || worst.d > 0) return null;
      try { addBond(ctx.front, worst.a, 2.4); addBond(ctx.front, worst.b, 2.4); } catch { /* nothing to build on */ }
      return {
        touched: [worst.a, worst.b],
        text: `${worst.a} and ${worst.b} have not spoken properly in a fortnight, and both of them spend `
          + `this week telling ${ctx.front} things they would not say in front of the other. `
          + `Neither notices that the person agreeing with them on Tuesday is not the one who agreed on Saturday.`,
        houseSees: `${ctx.front} comes out of the week as the only person in the house who is welcome `
          + `in both of those conversations.`,
        seesBadge: 'TRUSTED ON BOTH SIDES',
        botched: `${worst.a} repeats something back to ${ctx.front} that ${ctx.front} apparently said on Monday, `
          + `and gets a beat of nothing before the answer arrives.`,
      };
    },
  },
  {
    id: 'blind',
    name: 'The blind handoff',
    brief: 'No note this week. Walk into a house you have not seen for seven days and be somebody who never left it.',
    pay: 9000, noise: 0.2, spice: 1, difficulty: 0.55,
    // The single most dangerous job in the twist, because it turns off the one
    // thing keeping the memory slips down. Never offered while the house is
    // already close, which would just be handing them the twist.
    can: ctx => ctx.others.length >= 4 && ctx.exposure < 0.45,
    run(ctx) {
      // Nothing to check. Taking this job blanked the handoff the moment it was
      // accepted, so the price has already been paid in the tells — this week's
      // memory slips are running with no note behind them. All that is left is
      // whether they got through seven days on it.
      return {
        touched: [ctx.front],
        text: `${ctx.front} comes out of that storeroom with nothing — no names, no warnings, `
          + `no idea which of these people is currently angry. `
          + `${P(ctx.front).Sub} ${has(ctx.front, 'spend')} four days agreeing with everybody about everything `
          + `and asking one question at a time.`,
        houseSees: `${ctx.front} is quieter than usual and nobody thinks anything of it.`,
        seesBadge: 'A QUIET WEEK',
        botched: `Somebody asks ${ctx.front} a direct question about a conversation that happened on Sunday, `
          + `and there is no note in the world that would have covered it.`,
      };
    },
  },
  {
    id: 'alibi',
    name: 'Build an alibi',
    brief: 'Get somebody to defend you out loud, to the house, before anybody has accused you of anything.',
    pay: 6000, noise: 0.3, spice: 0.7, difficulty: 0.34,
    can: ctx => ctx.others.length >= 4,
    run(ctx, rng) {
      // The most useful thing in the twist: a character witness who does not
      // know what they are a witness against. Whoever already trusts them most.
      const champion = [...ctx.others].sort((a, b) => getBond(ctx.front, b) - getBond(ctx.front, a))[0];
      if (!champion) return null;
      const doubter = [...ctx.others].filter(n => n !== champion)
        .sort((a, b) => (ctx.suspicion[b] || 0) - (ctx.suspicion[a] || 0))[0];
      try { addBond(ctx.front, champion, 1.6); } catch { /* fine */ }
      // The real prize: the room stops listening to whoever had started noticing.
      if (doubter && ctx.suspicion[doubter]) {
        ctx.softenSuspicion(doubter, 0.45);
        try { addBond(doubter, champion, -0.8); } catch { /* fine */ }
      }
      return {
        touched: [champion, doubter].filter(Boolean),
        text: `${ctx.front} spends the week making sure ${champion} has a reason to be certain about ${P(ctx.front).obj}, `
          + `and never once asks for it.`,
        houseSees: doubter
          ? `${doubter} starts to say something about ${ctx.front} and ${champion} talks over the top of it — `
            + `not unkindly, and completely.`
          : `${champion} vouches for ${ctx.front} in a conversation ${ctx.front} was not even in.`,
        seesBadge: 'SOMEBODY VOUCHES',
        botched: `${champion} agrees to say it and then does not, and the not-saying is louder `
          + `than the saying would have been.`,
      };
    },
  },
  {
    id: 'daylight',
    name: 'Swap in daylight',
    brief: 'Do the changeover with the house awake and in the next room. Do not get seen.',
    pay: 10000, noise: 0.72, spice: 1, difficulty: 0.5,
    can: ctx => ctx.others.length >= 4 && ctx.exposure < 0.5,
    run(ctx, rng) {
      const near = ctx.others[Math.floor(rng() * ctx.others.length)];
      const where = ['the kitchen', 'the lounge', 'the garden door', 'the corridor'][Math.floor(rng() * 4)];
      return {
        touched: [near],
        text: `They do it at two in the afternoon with nine people in ${where}. `
          + `${near} walks past the storeroom twice during the ninety seconds it takes, `
          + `and both times there is somebody standing very still on the other side of the door.`,
        houseSees: `${near} says later that the storeroom door was shut for a while in the afternoon, `
          + `which is the kind of thing that means nothing until it means everything.`,
        seesBadge: 'THE DOOR WAS SHUT',
        botched: `${near} pushes the storeroom door at exactly the wrong moment and gets it half open `
          + `before somebody's foot stops it.`,
      };
    },
  },
  {
    id: 'borrow',
    name: 'Hang it on somebody else',
    brief: 'You have already slipped up in front of somebody. Make them think it was the other person who was strange.',
    pay: 7000, noise: 0.38, spice: 0.9, difficulty: 0.4,
    // Only worth offering once the house has actually started noticing —
    // there is nothing to redirect otherwise.
    can: ctx => ctx.watchers.length > 0 && ctx.others.length >= 4,
    run(ctx, rng) {
      const watcher = ctx.watchers[0];
      const patsy = ctx.others.filter(n => n !== watcher)
        .sort((a, b) => getBond(watcher, a) - getBond(watcher, b))[0];
      if (!patsy) return null;
      // The whole point: the suspicion does not go away, it goes SOMEWHERE.
      ctx.softenSuspicion(watcher, 0.6);
      try { addBond(watcher, patsy, -2.2); } catch { /* nothing to poison */ }
      try {
        rememberStrategy(watcher, patsy, 'something-off-about-them', ctx.week, 2,
          { format: 'big-brother', twist: 'bb-twin-twist', planted: true });
      } catch { /* the grudge stands */ }
      return {
        victim: watcher, accused: patsy, touched: [watcher, patsy],
        text: `${watcher} has been carrying something about ${ctx.front} for a week. `
          + `${ctx.front} spends four days quietly rebuilding it into a story about ${patsy} instead, `
          + `and never says a single sentence ${watcher} could repeat back.`,
        houseSees: `${watcher} stops watching ${ctx.front} and starts watching ${patsy}, `
          + `and could not tell you when that happened.`,
        seesBadge: 'THE WRONG DOOR',
        botched: `${watcher} listens to all of it and then says, mildly, "why are you telling me about ${patsy}?"`,
      };
    },
  },
  {
    id: 'block',
    name: 'Sit in the chair',
    brief: 'Get yourself nominated. Then survive it. The house has to vote to keep somebody it has never met.',
    pay: 12000, noise: 0.34, spice: 1, difficulty: 0.45,
    can: ctx => ctx.others.length >= 5 && ctx.exposure < 0.6,
    run(ctx) {
      // Resolved entirely against what the week did: they had to actually end
      // up on the block and actually survive it. No way to fake this one.
      if (!ctx.wasNominated) return null;
      if (!ctx.survivedBlock) return null;
      return {
        touched: [ctx.front],
        text: `${ctx.front} sits in that chair all week and campaigns to a house that thinks it has `
          + `known ${P(ctx.front).obj} since night one. Half the conversations that save ${P(ctx.front).obj} `
          + `are had by somebody who was not in the building for the other half.`,
        houseSees: `${ctx.front} comes off the block with votes to spare, which surprises almost everybody `
          + `who cast one.`,
        seesBadge: 'SURVIVED THE BLOCK',
        botched: `The campaign contradicts itself somewhere around Wednesday and two people notice `
          + `at the same time.`,
      };
    },
  },
  {
    id: 'against-type',
    name: 'Be somebody else',
    brief: 'Spend the week being the opposite of who this house thinks you are. Let them explain it to each other.',
    pay: 6000, noise: 0.46, spice: 0.85, difficulty: 0.32,
    can: ctx => ctx.others.length >= 4,
    run(ctx, rng) {
      const arch = (players || []).find(p => p.name === ctx.front)?.archetype || 'floater';
      const flip = {
        villain: 'kind to everybody and useful in the kitchen', mastermind: 'vague, warm and completely uninterested in the vote',
        schemer: 'straightforward to the point of being boring', hothead: 'unbothered by anything at all',
        'challenge-beast': 'quietly hopeless at everything physical', 'social-butterfly': 'somewhere else, all week',
        'loyal-soldier': 'noncommittal with everybody who asks', wildcard: 'reliable and slightly dull',
        'chaos-agent': 'the most sensible person in the room', floater: 'unmistakably running something',
        underdog: 'confident enough to be irritating', hero: 'sharp about people behind their backs',
        goat: 'strategically frightening', 'perceptive-player': 'oblivious', showmancer: 'entirely uninterested in anybody',
      }[arch] || 'a completely different person';
      // The house rationalises it rather than questioning it, which is exactly
      // what a real house does — and it costs the closest ally most, because
      // they are the one who has to reconcile it.
      const closest = [...ctx.others].sort((a, b) => getBond(ctx.front, b) - getBond(ctx.front, a))[0];
      for (const n of ctx.others) { try { addBond(n, ctx.front, rng() < 0.5 ? 0.4 : -0.4); } catch { /* fine */ } }
      return {
        touched: [closest].filter(Boolean),
        text: `For seven days ${ctx.front} is ${flip}. It is not an act — it is the other one, `
          + `who has never had to be the version of this person the house met.`,
        houseSees: closest
          ? `${closest} spends the week explaining to people that ${ctx.front} has just been in a strange mood, `
            + `and does a better job of believing it than anybody else does.`
          : `The house decides ${ctx.front} has had a strange week and moves on.`,
        seesBadge: 'A STRANGE MOOD',
        botched: `Somebody says "that is not you" as a joke, and hears how it sounded about a second `
          + `after saying it.`,
      };
    },
  },
  {
    id: 'two-rooms',
    name: 'Two rooms at once',
    brief: 'Be in two conversations that are about each other, and be believed in both.',
    pay: 8000, noise: 0.42, spice: 0.95, difficulty: 0.42,
    can: ctx => ctx.others.length >= 6,
    run(ctx, rng) {
      // Two groups the house has actually formed, or the two halves of it. The
      // gag is that the alibi is real: they genuinely were in both rooms.
      const pool = [...ctx.others].sort((a, b) => getBond(ctx.front, b) - getBond(ctx.front, a));
      const one = pool.slice(0, 2);
      const two = pool.slice(-2);
      if (one.length < 2 || two.length < 2 || one.some(n => two.includes(n))) return null;
      for (const n of [...one, ...two]) { try { addBond(ctx.front, n, 1.1); } catch { /* fine */ } }
      try { addBond(one[0], two[0], -1.4); } catch { /* fine */ }
      return {
        touched: [...one, ...two],
        text: `${one.join(' and ')} spend Tuesday deciding what to do about ${two.join(' and ')}. `
          + `${two.join(' and ')} spend Tuesday deciding what to do about ${one.join(' and ')}. `
          + `${ctx.front} is in both conversations, and for part of the week that is not even a lie.`,
        houseSees: `Both halves of that house come out of the week certain that ${ctx.front} is theirs.`,
        seesBadge: 'IN BOTH ROOMS',
        botched: `${one[0]} mentions the meeting to ${two[0]} to see what happens, `
          + `and what happens is that both of them look at ${ctx.front}.`,
      };
    },
  },
  {
    id: 'night-shift',
    name: 'The night shift',
    brief: 'One of you takes the days and one takes the nights. Somebody in this house is about to get a friend who never sleeps.',
    pay: 6000, noise: 0.28, spice: 0.8, difficulty: 0.3,
    can: ctx => ctx.others.length >= 4,
    run(ctx, rng) {
      // Only possible because there are two of them. The loneliest person in
      // that house gets somebody at three in the morning AND somebody at
      // breakfast, and never notices those are different people.
      const lonely = [...ctx.others]
        .sort((a, b) => ctx.others.reduce((s, n) => s + getBond(a, n), 0)
          - ctx.others.reduce((s, n) => s + getBond(b, n), 0))[0];
      if (!lonely) return null;
      try { addBond(ctx.front, lonely, 3.2); } catch { /* nothing to build */ }
      try {
        rememberStrategy(lonely, ctx.front, 'was-there-at-three-in-the-morning', ctx.week, 2,
          { format: 'big-brother', twist: 'bb-twin-twist' });
      } catch { /* the friendship stands */ }
      return {
        touched: [lonely],
        text: `${lonely} spends this week being the only person in the house who is never alone. `
          + `There is somebody in the kitchen at three in the morning and somebody at the table at eight, `
          + `and ${P(lonely).sub} ${has(lonely, 'go')} the whole seven days without working out `
          + `that nobody could actually do both.`,
        houseSees: `${lonely} would put ${P(lonely).posAdj} hand in a fire for ${ctx.front} by Friday, `
          + `and could not tell you exactly when that happened.`,
        seesBadge: 'SOMEBODY NEVER SLEEPS',
        botched: `${lonely} says, half asleep and meaning nothing by it, "do you ever go to bed?" `
          + `and then lies there thinking about the answer.`,
      };
    },
  },
  {
    id: 'stitch',
    name: 'Into a room you were not asked to',
    brief: 'There is a group in this house you are not in. Be in it by Thursday.',
    pay: 8000, noise: 0.4, spice: 0.9, difficulty: 0.44,
    can: ctx => ctx.others.length >= 5,
    run(ctx, rng) {
      // The two of them work the same group from opposite ends — one flatters,
      // one listens — and nobody compares notes because there is nothing to
      // compare. The result is a bloc that thinks it recruited somebody.
      const bloc = [...ctx.others]
        .sort((a, b) => getBond(ctx.front, a) - getBond(ctx.front, b)).slice(0, 3);
      if (bloc.length < 3) return null;
      for (const n of bloc) { try { addBond(ctx.front, n, 2.0); } catch { /* fine */ } }
      return {
        touched: bloc,
        text: `${bloc.slice(0, -1).join(', ')} and ${bloc.at(-1)} have been running something ${ctx.front} `
          + `was never asked to join. One of the two works ${bloc[0]} and the other works ${bloc[1]}, `
          + `and because neither approach sounds anything like the other, nobody thinks it is a campaign.`,
        houseSees: `By Thursday that group is talking in front of ${ctx.front} instead of around ${P(ctx.front).obj}, `
          + `and one of them says out loud that ${P(ctx.front).sub} should have been in it from the start.`,
        seesBadge: 'IN THE ROOM NOW',
        botched: `${bloc[0]} mentions the approach to ${bloc[1]} and the two versions do not sound like `
          + `the same person asking.`,
      };
    },
  },
  {
    id: 'confession',
    name: 'Be the one they tell',
    brief: 'Somebody in this house is holding something they have told nobody. Be the person they say it to.',
    pay: 7000, noise: 0.26, spice: 0.85, difficulty: 0.4,
    can: ctx => ctx.others.length >= 4,
    run(ctx, rng) {
      // Two people's worth of patience aimed at one person. The mark tells the
      // day twin something the night twin then knows, which is the closest this
      // house comes to being able to read minds.
      const mark = [...ctx.others]
        .sort((a, b) => stat(a, 'temperament') - stat(b, 'temperament'))[0];
      if (!mark) return null;
      const about = ctx.others.filter(n => n !== mark)
        .sort((a, b) => getBond(mark, a) - getBond(mark, b))[0];
      try { addBond(mark, ctx.front, 2.2); } catch { /* fine */ }
      if (about) {
        try {
          rememberStrategy(ctx.front, about, 'knows-what-they-said-about-them', ctx.week, 1,
            { format: 'big-brother', twist: 'bb-twin-twist' });
        } catch { /* fine */ }
      }
      return {
        touched: [mark, about].filter(Boolean),
        text: `${mark} has been carrying something for a fortnight and has not said it to anybody. `
          + `${ctx.front} asks the same gentle question on Monday and again on Thursday — `
          + `except it is not the same person asking, and the second one already knows `
          + `exactly which word to stop on.`,
        houseSees: about
          ? `${mark} tells ${ctx.front} what ${P(mark).sub} really ${has(mark, 'think')} about ${about}, `
            + `and then spends an hour explaining that it does not need to leave the room.`
          : `${mark} tells ${ctx.front} something ${P(mark).sub} ${has(mark, 'have')} not told anybody, `
            + `and looks relieved for about four minutes.`,
        seesBadge: 'SOMEBODY TALKS',
        botched: `${mark} gets as far as the first sentence, stops, and says "actually, forget it" — `
          + `and now ${P(mark).sub} ${has(mark, 'know')} ${P(mark).sub} nearly said it.`,
      };
    },
  },
  {
    id: 'throw-it',
    name: 'Lose it on purpose',
    brief: 'One of you is good at this. Make sure the house watches the other one fail at it.',
    pay: 7000, noise: 0.56, spice: 0.8, difficulty: 0.28,
    // Weaponising the gap deliberately — the twist's own liability turned into
    // a job. Loud by construction, which is the price.
    can: ctx => ctx.gap >= 1.2 && ctx.others.length >= 4,
    run(ctx, rng) {
      // The stat they are currently worst at relative to the other one.
      const weakest = STAT_KEYS
        .map(k => ({ k, d: (Number(ctx.live[k]) || 0) - (Number(ctx.away[k]) || 0) }))
        .sort((a, b) => a.d - b.d)[0];
      const witness = [...ctx.others].sort((a, b) => getBond(ctx.front, b) - getBond(ctx.front, a))[0];
      if (!weakest || weakest.d >= 0 || !witness) return null;
      // A real cost: the house downgrades them as a competitor, which is worth
      // having and is also precisely the tell.
      for (const n of ctx.others) { try { addBond(n, ctx.front, 0.3); } catch { /* fine */ } }
      return {
        touched: [witness],
        text: `The one in the house this week is ${Math.abs(weakest.d)} points down on ${weakest.k}, `
          + `and instead of hiding it ${has(ctx.front, 'make')} a performance of it — visibly, `
          + `cheerfully hopeless, in front of everybody.`,
        houseSees: `${ctx.front} is written off as a threat by most of that room inside a week. `
          + `${witness} is the one who says out loud that ${P(ctx.front).sub} used to be better at this.`,
        seesBadge: 'NOT A THREAT ANY MORE',
        botched: `${witness} does not laugh. ${P(witness).Sub} ${has(witness, 'watch')} it happen and `
          + `${has(witness, 'go')} quiet, which is worse.`,
      };
    },
  },
];

// ── the tells ───────────────────────────────────────────────────────────

const MEMORY_SLIPS = [
  (n, o) => `${o} picks up a conversation from two days ago and ${n} does not know what it is about. `
    + `${n} covers it, badly, by agreeing with all of it.`,
  (n, o) => `"You told me that already." ${n} says it to ${o} about something ${o} has never said, `
    + `and watches ${o} decide whether to argue.`,
  (n, o) => `${o} asks ${n} to finish a sentence they started together on Sunday. ${n} cannot, `
    + `and laughs it off in a way that ${o} will remember.`,
  (n, o) => `${n} calls ${o} by the wrong shortening of ${P(o).posAdj} name — the one nobody in this house uses `
    + `and one person did, once, on the first night.`,
  (n, o) => `${o} says "like we talked about" and waits. ${n} waits too, for slightly too long, `
    + `and then agrees with something ${P(o).sub} cannot possibly have known.`,
  (n, o) => `There is a joke this house has been running for four days. ${n} does not have it, `
    + `and the half-second of working out where to laugh is not something ${o} misses.`,
];

const FORM_SLIPS = [
  (n, o) => `${o} watches ${n} lose a competition ${n} won a fortnight ago, at the same thing, `
    + `and cannot make the two of them line up.`,
  (n, o) => `${o} notices that ${n} is left-handed this week and puts it down to being tired.`,
  (n, o) => `${n} is suddenly, unaccountably better at something. ${o} says so out loud as a compliment `
    + `and then spends the evening thinking about it.`,
  (n, o) => `${o} has been sitting across from ${n} at that table for three weeks. `
    + `Tonight ${P(o).sub} ${has(o, 'look')} up mid-sentence, for no reason ${P(o).sub} could name, `
    + `and ${has(o, 'lose')} the thread of ${P(o).posAdj} own story.`,
];

/**
 * Whether anybody caught it this week, and what they made of it.
 *
 * The three sources, in one pass. Memory is governed by the handoff — a good
 * note is a quiet week. Form is governed by the gap between the two stat lines,
 * which is set at casting and cannot be changed. The job's own noise is added
 * by the caller.
 */
export function twinTells(week, { rng = Math.random, extraNoise = 0 } = {}) {
  const st = twinState();
  if (!st || over(st)) return null;
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
  // What the note bought them. A thorough handoff cuts memory slips to a
  // quarter; a blind one leaves them fully exposed to the one thing they cannot
  // bluff, which is a week of other people's conversations.
  const briefed = clamp(Number(st.knows), 0, 1);

  const beats = [];
  const notices = [];
  // TWO a week at most, measured. At three, a house that gets a tell from
  // everybody it is close to reached three people independently certain by week
  // three, and seventy seasons out of a hundred ended with somebody saying it
  // out loud — which is not a house slowly working something out, it is a
  // detection minigame the twins cannot win.
  const MAX_TELLS = 2;
  let memorySlips = 0;
  // Whoever is ALREADY watching gets checked first, and this is the difference
  // between a house that works something out and a house that mutters. Left in
  // roster order, two tells a week landed on two fresh people every time —
  // suspicion sprayed itself over eleven names, nobody ever got past a hunch,
  // and the room said it out loud in nought seasons out of forty. A house does
  // not work like that. The person who noticed on Tuesday is the person looking
  // for it on Friday.
  const watching = [...others].sort((a, b) => (st.suspicion[b] || 0) - (st.suspicion[a] || 0));
  for (const observer of watching) {
    if (notices.length >= MAX_TELLS) break;
    // Closeness is what catches this. You do not notice that somebody has been
    // replaced unless you were talking to them in the first place — which makes
    // the social game and the twist the same risk.
    const closeness = clamp((getBond(st.front, observer) + 4) / 12, 0, 1);
    const chance = clamp(0.035 + closeness * 0.185 + stat(observer, 'intuition') * 0.016
      + gap * 0.022 + extraNoise * 0.22
      + ((st.suspicion[observer] || 0) > 0 ? 0.15 : 0), 0.02, 0.55);
    if (rng() >= chance) continue;

    // Which KIND of slip. A well-briefed twin still cannot fake a stat line,
    // so form slips are unaffected by the note and memory slips are governed
    // by it entirely.
    const memory = rng() < 0.55 * (1 - briefed * 0.75) + 0.12;
    if (memory) memorySlips++;
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
    // sure enough to say it.
    const primed = (st.suspicion[observer] || 0) > 0;
    st.suspicion[observer] = round2((st.suspicion[observer] || 0)
      + (memory ? 0.9 : 0.75) * (primed ? 1.55 : 1));
    notices.push({ observer, kind: memory ? 'memory' : 'form' });
    // It costs the friendship a little. Being lied to about something you
    // cannot name is still being lied to.
    try { addBond(observer, st.front, -0.35); } catch { /* nothing to lose */ }
  }
  if (!beats.length) return null;

  return { week: weekNum, gap: round2(gap), briefed, memorySlips, notices, beats };
}

/** How close the house is to saying it out loud, 0..1. */
export function twinExposure() {
  const st = twinState();
  if (!st) return 0;
  return clamp(Object.values(st.suspicion).reduce((a, b) => a + b, 0) / 9, 0, 1);
}

/**
 * Certainty fades. Called once a week, before anything else happens.
 *
 * Nobody in that house is keeping a spreadsheet, and a week where nothing feels
 * strange is a week where last week's theory gets quietly dropped. Without this
 * suspicion only ever accumulates, and a twist that runs all season cannot
 * survive its own arithmetic.
 */
function decaySuspicion(st) {
  for (const observer of Object.keys(st.suspicion)) {
    st.suspicion[observer] = round2(st.suspicion[observer] * 0.84);
    if (st.suspicion[observer] < 0.2) delete st.suspicion[observer];
  }
}

// ── the week ────────────────────────────────────────────────────────────

const ACCEPTS = [
  (n, p) => `${n} reads it once in the storeroom and puts it back where it came from. It is agreed.`,
  (n, p) => `The card is four words long. ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} not have to think about it.`,
  (n, p) => `${n} takes the job. Whatever the two of them came in here to do, this is the week they do it.`,
  (n, p) => `Neither of them says anything about the money. Both of them take the job.`,
];
const REFUSALS = [
  (n, p) => `${n} reads the card twice and leaves it face down. Somebody in that house has started `
    + `watching ${p.obj} eat, and this is not the week to be interesting.`,
  (n, p) => `${p.Sub} ${p.sub === 'they' ? 'pass' : 'passes'}. Not out of nerves — out of arithmetic. `
    + `Being ordinary for seven days is worth more than anything on that card.`,
  (n, p) => `The job needs ${p.obj} to be seen doing something, and being seen is the one thing `
    + `${n} cannot currently afford.`,
];

/**
 * Everything a job needs, from whatever the week has so far.
 *
 * Built twice, exactly like the Saboteur's: once at the briefing, when the week
 * is empty and `can()` may only read what is knowable on Monday, and again at
 * the debrief, when the week has a Head of Household, two nominees and a
 * competition that has actually been played.
 */
function missionContext(st, week, house, others, weekNum) {
  const front = st.front;
  const watchers = Object.entries(st.suspicion)
    .filter(([n, v]) => house.includes(n) && v >= 0.8)
    .sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const noms = (week?.finalNominees || week?.nominees || []).filter(Boolean);
  return {
    front, week: weekNum, house, others,
    live: liveStats(st), away: st.active === 'a' ? st.statsB : st.statsA,
    gap: STAT_KEYS.reduce((sum, k) =>
      sum + Math.abs((Number(st.statsA[k]) || 0) - (Number(st.statsB[k]) || 0)), 0) / STAT_KEYS.length,
    exposure: twinExposure(),
    suspicion: { ...st.suspicion },
    watchers,
    knows: st.knows,
    memorySlips: week?._twinSlips || 0,
    hoh: week?.hoh || null,
    nominees: noms,
    wasNominated: noms.includes(front) || (week?.nominees || []).includes(front),
    // Known because the debrief runs AFTER the vote — see the resolution block
    // in js/bb/week.js. No twin job changes a ballot, so nothing is lost by
    // resolving late, and it is the only way `block` can mean what it says.
    survivedBlock: !!(noms.includes(front) && week?.evicted && week.evicted !== front),
    // Missions that redirect attention need to actually move the number.
    softenSuspicion(name, by) {
      if (!st.suspicion[name]) return;
      st.suspicion[name] = round2(Math.max(0, st.suspicion[name] - by));
      if (st.suspicion[name] < 0.2) delete st.suspicion[name];
    },
  };
}

/**
 * THE BRIEFING — the job for the week.
 *
 * Runs at the top of the week, before the swap has happened and before anybody
 * has won anything, because the whole pleasure of a mission is the stretch
 * between being given it and finding out whether it came off.
 */
export function offerTwinMission(week, { rng = Math.random } = {}) {
  const st = twinState();
  if (!st || over(st)) return null;
  const house = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean);
  if (!house.includes(st.front)) return null;

  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  const others = house.filter(n => n !== st.front);
  const p = P(st.front);

  decaySuspicion(st);
  const ctx = missionContext(st, week, house, others, weekNum);

  const eligible = MISSIONS.filter(m => { try { return m.can(ctx); } catch { return false; } });
  if (!eligible.length) return null;
  // Nothing repeats until everything has been used. The Saboteur shipped with
  // only consecutive repeats blocked and produced the same job twice in five
  // weeks in four seasons out of five.
  const used = new Set(st.missions.map(m => m.mission));
  const unused = eligible.filter(m => !used.has(m.id));
  const last = st.missions.at(-1)?.mission;
  const from = unused.length ? unused
    : (eligible.filter(m => m.id !== last).length ? eligible.filter(m => m.id !== last) : eligible);
  const mission = from[Math.floor(rng() * from.length)];

  // Lines do not repeat across a season.
  const fresh = (list, key) => {
    st.said ||= {};
    const seen = st.said[key] || [];
    const open = list.map((_, i) => i).filter(i => !seen.includes(i));
    const at = (open.length ? open : list.map((_, i) => i))[
      Math.floor(rng() * (open.length || list.length))];
    st.said[key] = [...(open.length ? seen : []), at];
    return list[at];
  };

  // ── do they take it? ──
  //
  // The pair's own nerve against how close the room already is. Somebody the
  // house has started watching turns down work that an invisible houseguest
  // would take without thinking — and turning it down costs them a week they
  // will not get back, because the quota does not care why.
  const exposure = twinExposure();
  const nerve = ((Number(ctx.live.boldness) || 5) * 0.55 + (Number(ctx.live.strategic) || 5) * 0.45) / 10;
  const appetite = clamp(0.90 + nerve * 0.15 - exposure * exposure * 1.5 - mission.noise * 0.06, 0.04, 0.97);
  // The first job is always taken. A twist whose opening week is the pair
  // declining to do anything is a twist that has not started.
  const accepted = !st.missions.length || rng() < appetite;

  const beats = [{
    text: `The card is in the storeroom, taped under the shelf where only one of them ever looks. `
      + `${fresh(accepted ? ACCEPTS : REFUSALS, accepted ? 'accept' : 'refuse')(st.front, p)}`,
    players: [st.front], badgeText: accepted ? 'TAKES THE JOB' : 'PASSES',
    badgeClass: accepted ? 'gold' : 'grey',
  }];

  if (!accepted) {
    // A week spent being careful is a week that does not count, and the
    // audience is watching somebody do nothing.
    st.applause = round2(st.applause - 0.4);
    if (seasonConfig?.popularityEnabled !== false) {
      gs.popularity ||= {};
      gs.popularity[st.front] = round2((gs.popularity[st.front] || 0) - 0.9);
    }
    st.missions.push({ week: weekNum, mission: mission.id, accepted: false, worked: false, paid: 0 });
    week._twinDeclined = { mission, exposure: round2(exposure) };
  } else {
    week._twinJob = { mission, ctx };
    // The blind handoff is paid for immediately. The note was written in the
    // storeroom ninety seconds ago; taking this job means destroying it, which
    // is why the price lands in THIS week's memory slips rather than next
    // week's — `twinTells` reads `st.knows` and it is now zero.
    if (mission.id === 'blind') {
      st.knows = 0;
      st.handoff = { week: weekNum, quality: 0, blind: true,
        text: NOTE_BLIND[Math.floor(rng() * NOTE_BLIND.length)](st.front) };
    }
  }

  return {
    type: 'twin-brief', secret: true, week: weekNum, front: st.front,
    mission: { id: mission.id, name: mission.name, brief: mission.brief, pay: mission.pay,
      noise: mission.noise, difficulty: mission.difficulty },
    accepted, exposure: round2(exposure),
    quota: st.quota, completed: st.completed, banked: st.banked,
    twins: { other: st.other, active: st.active, statsA: { ...st.statsA }, statsB: { ...st.statsB } },
    beats,
  };
}

/**
 * THE DEBRIEF — whether it came off, and what it cost.
 *
 * Runs after the veto has settled and before the vote, so a job that turns on
 * surviving the block resolves while the block still means something.
 */
export function resolveTwinMission(week, { rng = Math.random } = {}) {
  const st = twinState();
  const declined = week?._twinDeclined;
  if (declined) {
    delete week._twinDeclined;
    if (!st || over(st)) return null;
    const watching = Object.entries(st.suspicion).sort((a, b) => b[1] - a[1]).map(([n]) => n);
    return {
      type: 'twin-debrief', secret: true, week: Number(week?.num) || 0, front: st.front,
      mission: { id: declined.mission.id, name: declined.mission.name, brief: declined.mission.brief,
        pay: declined.mission.pay },
      declined: true, worked: false, paid: 0,
      quota: st.quota, completed: st.completed, banked: st.banked,
      exposure: declined.exposure, watching: watching.slice(0, 3),
      beats: [{
        text: watching.length
          ? `Nothing happens this week, on purpose. ${watching[0]} has started watching ${st.front} `
            + `a little too carefully, and a week of being boring is the only cure for that.`
          : `Nothing happens this week. One of them is in the house being pleasant and the other one `
            + `is asleep in a room with no windows, and neither of them is any closer to getting in.`,
        players: [st.front], badgeText: 'NO JOB THIS WEEK', badgeClass: 'grey',
      }],
    };
  }

  const job = week?._twinJob;
  if (!st || !job || over(st)) return null;
  delete week._twinJob;
  const { mission } = job;
  const house = job.ctx.house;
  const weekNum = job.ctx.week;
  // Rebuilt, because the week now HAS a shape.
  const ctx = missionContext(st, week, house, job.ctx.others, weekNum);

  // Does it come off? What the twin IN THE HOUSE is made of, against how hard
  // the job is and how closely the room is already watching.
  const craft = ((Number(ctx.live.strategic) || 5) * 0.4 + (Number(ctx.live.social) || 5) * 0.3
    + (Number(ctx.live.boldness) || 5) * 0.3) / 10;
  // Measured at 44% on the first tuning, which made the quota unreachable —
  // three finished jobs took seven accepted weeks and no pair ever had seven.
  // A twin is cast for being able to do this; missing should be a real risk and
  // not the coin flip it was.
  const chance = clamp(0.56 + craft * 0.58 - mission.difficulty * 0.42 - ctx.exposure * 0.2, 0.15, 0.94);
  const worked = rng() < chance;

  let result = null;
  try { result = mission.run(ctx, rng); } catch { result = null; }
  st.attempted = (st.attempted || 0) + 1;

  // The week turned out not to contain the thing the job needed — they were
  // never nominated, there was nobody watching to redirect. It still has to
  // report, and it still has to count as used, or the same impossible job comes
  // back next week and the season repeats itself.
  if (!result) {
    st.missions.push({ week: weekNum, mission: mission.id, accepted: true, worked: false,
      paid: 0, impossible: true });
    return {
      type: 'twin-debrief', secret: true, week: weekNum, front: st.front,
      mission: { id: mission.id, name: mission.name, brief: mission.brief, pay: mission.pay },
      worked: false, impossible: true, paid: 0,
      quota: st.quota, completed: st.completed, banked: st.banked,
      exposure: round2(twinExposure()), notices: [],
      beats: [{
        text: `The week never gives them the opening the job needed. There is no version of it `
          + `that does not involve one of them doing something visibly strange in front of everybody, `
          + `so neither of them does anything at all.`,
        players: [st.front], badgeText: 'NO WAY IN', badgeClass: 'grey',
      }],
    };
  }

  const beats = [];
  if (worked) {
    beats.push({ text: result.text, players: result.touched || [st.front],
      badgeText: mission.name.toUpperCase(), badgeClass: 'gold' });
    if (result.houseSees) {
      beats.push({ text: result.houseSees, players: result.touched || [],
        badgeText: 'AND THE HOUSE', badgeClass: 'grey' });
    }
  } else {
    beats.push({ text: result.botched || `${st.front} gets most of the way there and stops.`,
      players: result.touched || [st.front], badgeText: 'IT GOES WRONG', badgeClass: 'grey' });
  }

  // ── the pay ──
  //
  // Money for the finale and popularity for right now, which is the same two
  // currencies the Saboteur runs on. A botched job pays nothing but is often
  // the best thing in the episode, so it still earns a little applause — and it
  // does NOT count towards the quota, because the quota is jobs FINISHED.
  const paid = worked ? mission.pay : 0;
  st.banked += paid;
  const applause = worked ? mission.spice : round2(mission.spice * 0.2);
  st.applause = round2(st.applause + applause);
  if (worked) st.completed = (st.completed || 0) + 1;
  if (seasonConfig?.popularityEnabled !== false && applause > 0) {
    gs.popularity ||= {};
    gs.popularity[st.front] = round2((gs.popularity[st.front] || 0) + applause * 1.5);
  }

  st.missions.push({ week: weekNum, mission: mission.id, accepted: true, worked, paid });

  // A botched job is LOUDER than a clean one — being nearly caught is how
  // people get caught. Handed to the tells as extra noise rather than resolved
  // here, so all three sources of suspicion arrive through one door.
  week._twinJobNoise = worked ? mission.noise : Math.min(0.95, mission.noise * 1.5);
  // And a job that WORKED still costs the person standing nearest it. Without
  // this, racing to the quota was free — the twins finished four jobs by week
  // five and were through the door before the house had felt anything, and the
  // twist ended by discovery in one season out of twenty. Whoever was closest
  // to the thing that happened is left holding a piece of it.
  const nearest = (result.touched || []).filter(n => n !== st.front)
    .sort((a, b) => getBond(st.front, b) - getBond(st.front, a))[0];
  if (nearest) {
    st.suspicion[nearest] = round2((st.suspicion[nearest] || 0) + mission.noise * 0.9);
  }
  // What the room saw, for the house feed. Never the job — only its wake.
  week._twinFeed = {
    text: (worked ? result.houseSees : null)
      || `Something about this week does not sit right with one person in that house, `
        + `and ${P(st.front).sub} could not tell you what.`,
    players: (result.touched || []).filter(n => n !== st.front).slice(0, 3),
    badgeText: worked ? (result.seesBadge || 'NOBODY SAYS ANYTHING') : 'SOMETHING IS OFF',
    badgeClass: 'blue',
    eventId: `twin-${mission.id}`, category: 'house-life', location: 'living-room',
  };

  return {
    type: 'twin-debrief', secret: true, week: weekNum, front: st.front,
    mission: { id: mission.id, name: mission.name, brief: mission.brief, pay: mission.pay },
    worked, chance: round2(chance), paid, applause,
    feedLine: week._twinFeed.text,
    quota: st.quota, completed: st.completed, banked: st.banked, prize: st.prize,
    exposure: round2(twinExposure()), beats,
  };
}

/**
 * SOMEBODY SAYS IT — and this time it stops everything.
 *
 * BB17's house worked it out and both twins entered anyway, because the rule
 * they had to beat was the calendar. There is no calendar here, so being
 * discovered is a real ending: the jobs stop, the second twin never gets
 * through the door, and what is left is one houseguest playing a game in which
 * everybody knows they lied for six weeks.
 *
 * The bar is deliberately higher than the Saboteur's. "Somebody is working
 * against us" is a sentence houseguests say every week of every season. "There
 * are two of you" is one nobody says until they cannot explain it any other way.
 */
export function twinDiscovery(week, { rng = Math.random } = {}) {
  const st = twinState();
  if (!st || over(st)) return null;
  const house = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean);
  if (!house.includes(st.front)) return null;
  // Two weeks of slips is never enough, however loud they were. "There are two
  // of you" is not a sentence anybody says off the back of one strange evening.
  const weeksIn = Math.max(1, (Number(week?.num) || 1) - (st.installedWeek || 1) + 1);
  if (weeksIn < 3) return null;
  // Three people, each sure enough on their own to stake something on it, and
  // the room as a whole past seventy per cent. Measured: at three voices on 1.9
  // and 62% the house said it in seven seasons out of ten, and a twist that is
  // discovered by default is not a twist anybody is playing.
  const sure = Object.entries(st.suspicion).filter(([n, v]) => house.includes(n) && v >= 1.7);
  if (sure.length < 3 || twinExposure() < 0.55) return null;

  const teller = sure.sort((a, b) => b[1] - a[1])[0][0];
  st.exposed = true;
  st.caught = true;
  st.ending = 'discovered';
  st.exposedWeek = Number(week?.num) || 0;
  const p = P(teller);
  for (const n of house.filter(x => x !== st.front)) {
    try { addBond(n, st.front, -1.8); } catch { /* fine */ }
    try {
      rememberStrategy(n, st.front, 'playing-with-two-bodies', st.exposedWeek, 3,
        { format: 'big-brother', twist: 'bb-twin-twist', caught: true });
    } catch { /* the grudge stands */ }
  }
  // The audience loved the season and hated the ending. The money goes with it.
  const lost = st.banked;
  st.banked = 0;
  if (seasonConfig?.popularityEnabled !== false) {
    gs.popularity ||= {};
    gs.popularity[teller] = round2((gs.popularity[teller] || 0) + 3.5);
    gs.popularity[st.front] = round2((gs.popularity[st.front] || 0) + 2);
  }
  return {
    type: 'twin-caught', week: st.exposedWeek, front: st.front, other: st.other, teller,
    lost, completed: st.completed, quota: st.quota,
    swaps: st.swaps.length,
    twins: { other: st.other, active: st.active, statsA: { ...st.statsA }, statsB: { ...st.statsB } },
    beats: [{
      text: `${teller} stops the room. ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} not soften it and `
        + `${p.sub} ${p.sub === 'they' ? 'do' : 'does'} not ask a question: "There are two of ${st.front}." `
        + `Nobody laughs. Somebody else says the thing everybody has been not saying for a fortnight — `
        + `that it depends which day you ask.`,
      players: [teller, st.front], badgeText: 'THERE ARE TWO OF THEM', badgeClass: 'red',
    }, {
      text: `The storeroom door opens and ${st.other} is standing behind it, because there is no longer `
        + `any point in ${P(st.other).sub} not being. ${st.front} and ${st.other}, side by side, `
        + `in front of a house that has spent six weeks talking to one person.`,
      players: [st.front, st.other], badgeText: 'BOTH OF THEM, AT LAST', badgeClass: 'red',
    }, {
      text: st.completed
        ? `${st.completed} job${st.completed === 1 ? '' : 's'} finished and ${st.quota - st.completed} to go, `
          + `and it ends here. ${st.other} does not get to play. `
          + `$${lost.toLocaleString()} goes back in the box on the way out of the room.`
        : `Not one job finished, and it ends here anyway. ${st.other} came all this way `
          + `to stand in a living room for ninety seconds and be looked at.`,
      players: [st.front, st.other], badgeText: 'THE JOBS STOP', badgeClass: 'grey',
    }],
  };
}

/**
 * THE QUOTA, MET — both of them walk in.
 *
 * The only moment in this house where the roster gets BIGGER for a reason that
 * is not a returnee. The second one arrives with the stat line the house has
 * been playing against half the time without ever knowing it.
 */
/** How many weeks the pair has lasted, counting the week they were installed. */
export function twinWeeksSurvived(week) {
  const st = twinState();
  if (!st) return 0;
  const now = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  return Math.max(0, now - (st.installedWeek || 1) + 1);
}

export function checkTwinEntry(week) {
  const st = twinState();
  if (!st || over(st)) return null;
  // Made it to week N without being discovered or evicted. Not a quota — see
  // the note on `weeks` in installTwinTwist.
  if (st.exposed) return null;
  if (twinWeeksSurvived(week) < st.weeks) return null;
  const house = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean);
  if (!house.includes(st.front)) return null;
  // There has to be a house left to walk into.
  if (house.length < 4) return null;

  st.entered = true;
  st.ending = 'entered';
  st.enteredWeek = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;

  // The one the house met stays under the name it knows. The other one becomes
  // a houseguest in their own right, with their own stats and their own name.
  // Twin A owns the name the house has been using — `active: 'a'` is defined as
  // the one they met on night one — so A gets it back and B walks in as
  // themselves, whichever of them happens to be standing in the room today.
  // Keyed off `active` this was a coin flip: end the twist on a B week and the
  // two of them swapped stat lines permanently, each finishing the season as
  // the other person.
  const entry = (players || []).find(p => p.name === st.front);
  const otherStats = st.statsB;
  if (entry) entry.stats = { ...st.statsA };
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
  // they have been talking to this person for six weeks and did not know it.
  for (const n of house.filter(x => x !== st.front)) {
    try { addBond(n, st.other, getBond(n, st.front) * 0.5 - 0.5); } catch { /* new to them */ }
    try { addBond(n, st.front, -0.8); } catch { /* fine */ }
  }
  if (seasonConfig?.popularityEnabled !== false) {
    gs.popularity ||= {};
    // The season's biggest single moment, and both of them own it.
    gs.popularity[st.front] = round2((gs.popularity[st.front] || 0) + Math.max(0, st.applause) * 1.5 + 5);
    gs.popularity[st.other] = round2((gs.popularity[st.other] || 0) + 4);
  }

  return {
    type: 'twin-entry', week: st.enteredWeek, front: st.front, other: st.other,
    exposed: !!st.exposed, banked: st.banked, completed: st.completed, quota: st.quota,
    swaps: st.swaps.length,
    twins: { other: st.other, active: st.active, statsA: { ...st.statsA }, statsB: { ...st.statsB } },
    beats: [{
      text: `${st.front} is called to the diary room in the middle of the afternoon and comes back `
        + `with somebody. They are the same person, and there are two of them, and there always were.`,
      players: [st.front, st.other], badgeText: 'BOTH OF THEM', badgeClass: 'gold',
    }, {
      text: `${st.quota} job${st.quota === 1 ? '' : 's'} across ${st.swaps.length} `
        + `swap${st.swaps.length === 1 ? '' : 's'}, and not one of them was ever meant to be possible `
        + `for one person. $${st.banked.toLocaleString()} and a second vote, in one afternoon.`,
      players: [st.front, st.other], badgeText: 'THE QUOTA, MET', badgeClass: 'gold',
    }, {
      text: `Nobody in that room has to be told what it means. Every conversation any of them has had `
        + `with ${st.front} since night one is now a conversation they are not sure they had with ${st.front}, `
        + `and there is no way to go back and check.`,
      players: [st.front, st.other], badgeText: 'THE HOUSE IS BIGGER', badgeClass: 'gold',
    }],
  };
}

/**
 * Evicted before they got there.
 *
 * The shared identity walks out, and the one who has been living in a room with
 * no windows walks out to meet them — which is the ending the house gets to
 * watch and cannot do anything with.
 */
export function twinEvicted(name, week) {
  const st = twinState();
  if (!st || st.front !== name || over(st)) return null;
  st.caught = true;
  st.ending = 'evicted';
  const swaps = st.swaps.length;
  const lost = st.banked;
  st.banked = 0;
  return {
    type: 'twin-out', week: Number(week?.num) || 0, front: name, other: st.other,
    swaps, lost, completed: st.completed, quota: st.quota,
    twins: { other: st.other, active: st.active, statsA: { ...st.statsA }, statsB: { ...st.statsB } },
    beats: [{
      text: `${name} walks out of the door. Forty seconds later the storeroom opens and ${st.other} `
        + `walks out of it, into a house that is still standing where it was when the first one left.`,
      players: [name, st.other], badgeText: 'THERE WERE TWO', badgeClass: 'red',
    }, {
      text: `${swaps} swap${swaps === 1 ? '' : 's'} in and out of that room, `
        + `${st.completed} job${st.completed === 1 ? '' : 's'} finished out of ${st.quota}, `
        + `and one vote too few. They go home as one houseguest, which is what they have been all along.`,
      players: [name, st.other], badgeText: 'ONE EVICTION, TWO PEOPLE', badgeClass: 'grey',
    }, {
      text: `$${lost.toLocaleString()} banked and gone in the same sentence. `
        + `Every argument this house has had about whether ${name} was being strange turns out `
        + `to have been the only accurate thing anybody said all season.`,
      players: [name], badgeText: 'NOTHING PAID', badgeClass: 'grey',
    }],
  };
}

/**
 * The quiet failure.
 *
 * Never caught, never got there. The house is told at the end that it was
 * fooled for the whole season and never once worked it out — which is the
 * ending with the least in it for the twins and the most in it for everybody
 * who has to sit there and hear it.
 */
export function twinUnfinished(week) {
  const st = twinState();
  if (!st || over(st)) return null;
  const house = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean);
  st.caught = true;
  st.ending = 'unfinished';
  const lost = st.banked;
  st.banked = 0;
  const closest = house.filter(n => n !== st.front)
    .sort((a, b) => getBond(st.front, b) - getBond(st.front, a))[0];
  for (const n of house.filter(x => x !== st.front)) {
    try { addBond(n, st.front, -1.4); } catch { /* fine */ }
  }
  return {
    type: 'twin-caught', week: Number(week?.num) || 0, front: st.front, other: st.other,
    unfinished: true, lost, completed: st.completed, quota: st.quota, swaps: st.swaps.length,
    twins: { other: st.other, active: st.active, statsA: { ...st.statsA }, statsB: { ...st.statsB } },
    beats: [{
      text: `It is over, and the house is told. ${st.other} walks in through the front door `
        + `wearing ${st.front}'s face, and ${st.front} is already standing in the room.`,
      players: [st.front, st.other], badgeText: 'THERE WERE ALWAYS TWO', badgeClass: 'red',
    }, {
      text: `${st.swaps.length} swap${st.swaps.length === 1 ? '' : 's'} and nobody ever said it out loud. `
        + `${st.completed} job${st.completed === 1 ? '' : 's'} out of ${st.quota}, which is not enough, `
        + `so ${st.other} never got to play and $${lost.toLocaleString()} never got paid.`,
      players: [st.front, st.other], badgeText: 'NOT ENOUGH', badgeClass: 'grey',
    }, {
      text: closest
        ? `${closest} takes it worst, and takes a while to work out why: `
          + `${P(closest).sub} ${has(closest, 'have')} been close to somebody all season `
          + `and cannot now say which half of them ${P(closest).sub} liked.`
        : `The house takes a while to work out why it minds so much about something that changed nothing.`,
      players: [closest, st.front].filter(Boolean), badgeText: 'NOBODY EVER SAID IT', badgeClass: 'blue',
    }],
  };
}
