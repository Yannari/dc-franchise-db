// ══════════════════════════════════════════════════════════════════════
// bb/rivals.js — three people who already knew somebody in there
// ══════════════════════════════════════════════════════════════════════
//
// From the wiki, BB8: "After entering the house, the original eleven
// houseguests were informed that they would be joined by three people, all of
// whom had a tense connection with another player in the game. During the end
// of the first HOH competition, the Rivals were asked to determine the winner;
// they could choose between Kail Harbick and Eric Stein. They chose Kail to
// become the first Head of Household. The Rivals could not compete nor could
// they be nominated during the first week."
//
//   Dick Donato    — Daniele Briones     (estranged father and daughter)
//   Dustin Erikstrup — Joe Barber        (ex-boyfriends)
//   Jessica Hughbanks — Carol Journey    (ex-best friends)
//
// Two details are the whole twist and neither is obvious:
//
//   THE RIVALS DO NOT WIN THE FIRST COMPETITION. THEY DECIDE IT. The comp runs
//   without them, comes down to two people, and the three latecomers — who have
//   been in that house for about an hour and owe nobody anything — hand the
//   power to one of them. It is the only time in this show that power is given
//   rather than won, and the person who receives it spends the rest of the
//   season knowing exactly who to thank.
//
//   THE PAIRS ARE NOT SYMMETRICAL. One of them was already living there and one
//   of them walked through the door afterwards, which are two completely
//   different weeks. The partner has a week of alliances behind them and a
//   catastrophe in front; the rival has nothing but a grudge and three days of
//   everybody being fascinated by it.
//
// This is a CAST twist rather than a season twist in the shape of the Saboteur:
// there is no weekly job and no clock. What it does is seat a season with three
// live grudges already in it, hand the first crown to the people least
// qualified to give it away, and then let the house play out a question the
// wiki answers for its own season — all three Rivals outlasted their partner,
// and all three reached the jury.
import { gs, seasonConfig, tensePairs, kinshipBetween, REL_KINSHIP } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { rememberStrategy } from '../strategy-memory.js';
import { BB_TWIST_CONTRACTS } from './twist-contract.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round2 = v => Math.round(v * 100) / 100;
const stat = (name, key) => Number(pStats(name)?.[key]) || 0;
const P = name => { try { return pronouns(name); } catch { return { sub: 'they', obj: 'them', posAdj: 'their', pos: 'theirs', Sub: 'They' }; } };
const has = (name, verb) => `${P(name).sub} ${P(name).sub === 'they' ? verb : `${verb}s`}`;

/** The rivals record, or null when the season is not running one. */
export function rivalsState() {
  return gs.bb?.rivals || null;
}

/** Is this houseguest one of the three who walked in late? */
export const isRival = name => !!name && (rivalsState()?.pairs || []).some(p => p.rival === name);

/** The person on the other end of somebody's grudge, whichever side they are. */
export function rivalPartner(name) {
  const pair = (rivalsState()?.pairs || []).find(p => p.rival === name || p.partner === name);
  if (!pair) return null;
  return pair.rival === name ? pair.partner : pair.rival;
}

/** The pair record for somebody, either side. */
const pairOf = name => (rivalsState()?.pairs || [])
  .find(p => p.rival === name || p.partner === name) || null;

const label = kin => REL_KINSHIP?.[kin]?.label || 'History';

/**
 * How this pair fell out, in the words the house would use.
 *
 * Straight off the kinship axis, which is why that axis exists: `tensePairs()`
 * already knows the difference between an estranged father and an ex-boyfriend,
 * and the two of them do not have the same argument.
 */
const GRUDGE = {
  estranged: (a, b) => `${a} and ${b} are family and have not spoken properly in years`,
  exes: (a, b) => `${a} and ${b} used to be together, and it did not end well`,
  'ex-friends': (a, b) => `${a} and ${b} were inseparable once, and then something happened`,
};
const grudgeText = (kin, a, b) => (GRUDGE[kin] || ((x, y) => `${x} and ${y} have history`))(a, b);

/**
 * Seat the twist.
 *
 * Declared pairs first, because that is the whole reason the Relationships tab
 * carries a kinship axis — `tensePairs()` returns exactly what BB8 cast from.
 * Falling back to the most hostile bonds in the room keeps a season playable
 * when nothing was declared, and the panel says so before anybody presses play.
 */
export function installRivals(house = [], { count = 3, rng = Math.random, allowGuess = true } = {}) {
  const cast = house.filter(Boolean);
  if (cast.length < 8) return null;
  const want = clamp(Number(count) || 3, 1, 3);

  const taken = new Set();
  const pairs = [];

  // Whichever of the two walked in late. The one with the nerve to do it in
  // front of an audience — a rival arrives to a room that already knows
  // everybody, and that is not a thing a quiet person volunteers for.
  const seat = (a, b, kin, declared) => {
    const rival = stat(a, 'boldness') >= stat(b, 'boldness') ? a : b;
    const partner = rival === a ? b : a;
    taken.add(a); taken.add(b);
    pairs.push({ rival, partner, kin, declared, label: label(kin),
      grudge: grudgeText(kin, rival, partner), outcome: null });
  };

  for (const pair of tensePairs()) {
    if (pairs.length >= want) break;
    if (!cast.includes(pair.a) || !cast.includes(pair.b)) continue;
    if (taken.has(pair.a) || taken.has(pair.b)) continue;
    seat(pair.a, pair.b, pair.kin, true);
  }

  // Nothing declared, or not enough of it. Rather than run a twist with one
  // pair in it, the worst existing relationships in the room are drafted —
  // which is a guess, and is flagged as one everywhere it shows.
  if (allowGuess && pairs.length < want) {
    const worst = [];
    for (const a of cast) {
      for (const b of cast) {
        if (a >= b || taken.has(a) || taken.has(b)) continue;
        worst.push({ a, b, bond: getBond(a, b) });
      }
    }
    worst.sort((x, y) => x.bond - y.bond);
    for (const w of worst) {
      if (pairs.length >= want) break;
      if (taken.has(w.a) || taken.has(w.b)) continue;
      seat(w.a, w.b, kinshipBetween(w.a, w.b) || 'ex-friends', false);
    }
  }
  if (!pairs.length) return null;

  // ── they are not in the house yet ──
  //
  // The whole premise is that the room is already a room when they walk in, so
  // they are taken out of the active roster here and put back by `openRivals`
  // after the rule has been read out. Without it the season opened with all of
  // them on the memory wall, reacting to an announcement about their own
  // arrival, and the transcript counted a house that had not happened yet.
  gs.activePlayers = (gs.activePlayers || []).filter(n => !pairs.some(p => p.rival === n));

  gs.bb ||= {};
  gs.bb.rivals = {
    pairs,
    waiting: pairs.map(p => p.rival),
    startWeek: (gs.bb.weeks?.length || 0) + 1,
    announced: false,
    chose: null,
    outcomes: [],
    said: {},
  };

  // The grudge is real from the first hour. Whatever the cast builder set these
  // two to, walking into a locked house with them is worse.
  for (const p of pairs) {
    try { addBond(p.rival, p.partner, -3); } catch { /* nothing to spend */ }
    // BOTH directions. Recording it only on the partner made the grudge
    // one-sided in every targeting decision downstream — the person already
    // living there hunted the newcomer all season and the newcomer had no
    // matching reason to hunt back, which is why the rival outlasted their
    // partner in barely a quarter of measured seasons against a real season
    // where all three did.
    for (const [a, b] of [[p.partner, p.rival], [p.rival, p.partner]]) {
      try {
        rememberStrategy(a, b, 'they-are-here', gs.bb.rivals.startWeek, 2,
          { format: 'big-brother', twist: 'bb-rivals' });
      } catch { /* the grudge stands */ }
    }
  }
  return gs.bb.rivals;
}

/**
 * Night one: the house is told what has just walked in.
 *
 * Unlike the Twin Twist, this one is public — the wiki is explicit that the
 * eleven were INFORMED. The drama is not that it is secret; it is that
 * everybody in that room now spends three days working out which of them it is
 * about, while three people already know.
 */
export function announceRivals(week) {
  const st = rivalsState();
  if (!st || st.announced) return false;
  const contract = BB_TWIST_CONTRACTS['bb-rivals'];
  if (!contract?.announcement || !week?.twistState) return false;
  week.twistState.announcements = [
    { twist: 'bb-rivals', ...contract.announcement, ...rivalsRuleText(week) },
    ...(week.twistState.announcements || []),
  ];
  st.announced = true;
  return true;
}

// Far enough to cover a house as well as a handful of arrivals — "You are not
// 11" is a number on a card, and this is somebody reading a rule out loud.
const COUNT_WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const numberWord = n => COUNT_WORD[n] || String(n);
const capitalise = s => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The rule, counted rather than asserted.
 *
 * The contract carries the original three-pair wording, which is what the
 * registry and the compatibility guards read. What the HOUSE is told has to
 * match the season it is standing in: a season configured with one pair was
 * being told that three more people were coming through the door, that the
 * three of them would decide the competition, and that three of the room were
 * about to find out this was never a fresh start. One person walked in.
 */
export function rivalsRuleText(week) {
  const st = rivalsState();
  if (!st) return {};
  const n = st.pairs.length;
  // The room this is being read to. They have not walked in yet — `install`
  // takes them out of the roster and `openRivals` puts them back — so this is
  // already the number the house currently believes is the whole cast.
  const inside = Math.max(1, (week?.houseAtStart || gs.activePlayers || [])
    .filter(Boolean).filter(x => !(st.waiting || []).includes(x)).length);
  const word = numberWord(n);
  const them = n === 1 ? 'that one person decides' : `the ${word} of them decide`;
  return {
    rule: `You are not ${numberWord(inside)}. ${capitalise(word)} more of you `
      + `${n === 1 ? 'is' : 'are'} coming through that door tonight, and `
      + `${n === 1 ? 'they already know somebody in this room — and do not like them'
        : 'every one of them already knows somebody in this room — and does not like them'}. `
      + `They cannot play for Head of Household this week and none of you can nominate them. `
      + `At the end of tonight's competition, when it comes down to two of you, ${them} `
      + `which one gets the house.`,
    sting: `${capitalise(word)} of you ${n === 1 ? 'is' : 'are'} about to find out this was `
      + `never a fresh start.`,
  };
}

/** Is this the week the twist owns? */
const openingWeek = week => {
  const st = rivalsState();
  return !!st && (Number(week?.num) || 0) === st.startWeek;
};

/**
 * Who cannot play for the first crown.
 *
 * "The Rivals could not compete nor could they be nominated during the first
 * week." Both halves of that are safety, and both are only true in week one.
 */
export function rivalsSittingOut(week) {
  if (!openingWeek(week)) return [];
  return (rivalsState()?.pairs || []).map(p => p.rival);
}

/** Who cannot be put on the block in the opening week. */
export function rivalsImmune(week) {
  return rivalsSittingOut(week);
}

/**
 * A line that will not repeat across a season.
 *
 * The same two people having the same row about the same pan in weeks two,
 * three and five is not a grudge, it is a screensaver — and the weekly beats
 * are the one place a reader is actually watching for whether anything has
 * changed. Cycles through a pool before reusing any of it.
 */
function freshLine(st, rng) {
  return (list, key, ...args) => {
    st.said ||= {};
    const seen = st.said[key] || [];
    const open = list.map((_, i) => i).filter(i => !seen.includes(i));
    const at = (open.length ? open : list.map((_, i) => i))[
      Math.floor(rng() * (open.length || list.length))];
    st.said[key] = [...(open.length ? seen : []), at];
    return list[at](...args);
  };
}

const ARRIVALS = [
  (r, p, g) => `The front door goes at nine in the evening, which is not a thing that happens, `
    + `and ${r} walks in with a case. Ten people work out in about four seconds that this is the twist. `
    + `One person works out something considerably worse, which is that ${g}.`,
  (r, p, g) => `${r} comes through that door and does not look at anybody except one person. `
    + `${P(p).Sub} ${has(p, 'go')} completely still. ${g[0].toUpperCase()}${g.slice(1)}, `
    + `and the entire house is about to find out.`,
  (r, p, g) => `Everybody hugs the new arrival except ${p}, who is doing a very good impression `
    + `of somebody who has never met ${r}. It lasts about a minute and a half.`,
  (r, p, g) => `"You have GOT to be kidding me." ${p} says it into the room rather than to anybody in it. `
    + `${r} puts the case down and says hello to everyone else first, which is a choice.`,
];

const REACTIONS = [
  (p, r, pp) => `${p} spends the rest of the night explaining the history to four different people `
    + `and getting a slightly kinder version of it out each time.`,
  (p, r, pp) => `${p} does not explain anything to anybody, which the house finds far more interesting `
    + `than an explanation would have been.`,
  (p, r, pp) => `"Are you going to be all right?" Somebody asks ${p} it kindly. `
    + `${pp.Sub} ${pp.sub === 'they' ? 'say' : 'says'} yes about four times too quickly.`,
  (p, r, pp) => `By midnight ${p} has told two people that it is fine and one person that it is absolutely not.`,
];

/**
 * The arrival — three people walking into a house that is already a house.
 */
export function openRivals(week, { rng = Math.random } = {}) {
  const st = rivalsState();
  if (!st || st.opened || !openingWeek(week)) return null;
  st.opened = true;
  const fresh = freshLine(st, rng);

  // Who was living here before the door went — the room the announcement was
  // read to, which is not the room that exists ninety seconds later.
  const before = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean)
    .filter(n => !st.waiting.includes(n));

  const beats = [];
  for (const p of st.pairs) {
    beats.push({
      text: fresh(ARRIVALS, 'arrive', p.rival, p.partner, p.grudge),
      players: [p.rival, p.partner],
      badgeText: p.label.toUpperCase(), badgeClass: 'red',
    });
    beats.push({
      text: fresh(REACTIONS, 'react', p.partner, p.rival, P(p.partner)),
      players: [p.partner], badgeText: 'AND THE ONE WHO WAS ALREADY HERE', badgeClass: 'grey',
    });
    // Both of them get something out of that first night, for opposite
    // reasons: the room closes round the person having the worst evening of
    // their life, and it is also fascinated by the stranger who caused it.
    // Only crediting the partner was a thumb on the scale that ran all season.
    for (const n of before) {
      if (n === p.rival || n === p.partner) continue;
      try { addBond(n, p.partner, 0.35); } catch { /* fine */ }
      try { addBond(n, p.rival, 0.3); } catch { /* fine */ }
    }
  }

  return {
    type: 'rivals-open', week: Number(week?.num) || 1,
    pairs: st.pairs.map(p => ({ ...p })),
    guessed: st.pairs.some(p => !p.declared),
    // The room the rule was read to, and the room that exists afterwards.
    before, arrived: st.pairs.map(p => p.rival),
    beats,
  };
}

// Written for any number of arrivals, because a season can be configured with
// one pair and the room was being told that "the three of them" had gone into
// the storeroom to decide it.
/**
 * Put them in the room — and not a moment earlier.
 *
 * Separate from `openRivals` because of WHEN it has to happen. The arrival act
 * is built at the top of the week but held back until after the announcement
 * has been read out, and seating them at build time meant the announcement's
 * own reactions were drawn from a house that already contained them: the
 * latecomers stood in the living room ruling each other out as suspects for a
 * twist that was about themselves, and the room counted thirteen other people
 * when there were ten.
 *
 * `house` is the same array as `week.houseAtStart`, so pushing here puts them
 * into every competition, vote and camp event from this point on.
 */
export function seatRivals(week, house) {
  const st = rivalsState();
  if (!st || !(st.waiting || []).length) return [];
  const seated = [...st.waiting];
  for (const name of seated) {
    if (Array.isArray(house) && !house.includes(name)) house.push(name);
    if (Array.isArray(week?.houseAtStart) && !week.houseAtStart.includes(name)) {
      week.houseAtStart.push(name);
    }
    if (!(gs.activePlayers || []).includes(name)) {
      gs.activePlayers = [...(gs.activePlayers || []), name];
    }
    // A houseguest who was not in the room when the week's books were opened
    // still has to have books. Without this the first veto one of them wins
    // reads off an undefined record and takes the season down with it.
    gs.bb ||= {};
    gs.bb.stats ||= {};
    gs.bb.stats[name] ||= { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
      timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 };
  }
  st.waiting = [];
  return seated;
}

const HANDOVERS = [
  (winner, loser, n) => `${n === 1 ? 'They go' : `The ${numberWord(n)} of them go`} into the storeroom `
    + `and come out ninety seconds later. "${winner}." No explanation is offered and none is asked `
    + `for, out loud.`,
  (winner, loser, n) => `"We have been in this house for two hours," ${n === 1 ? 'the new arrival says'
    : 'one of them says'}, "so we are going to do this on gut." The gut says ${winner}.`,
  (winner, loser, n) => `${loser} works out from the length of the pause that it is not going to be `
    + `${loser}, and has the face arranged by the time ${n === 1 ? 'the name comes' : 'they say '
      + winner}.`,
];

// Only true when there are enough of them to disagree.
const HANDOVERS_MANY = [
  (winner, loser, n) => `They do not agree immediately. ${n === 2 ? 'One of them wants'
    : `${capitalise(numberWord(n - 1))} of them want`} ${loser} and the last one will not have it, `
    + `and the last one is the one who talks. ${winner} takes the room.`,
  (winner, loser, n) => `It takes them four minutes and one of them is still not happy about it. `
    + `${winner} takes the room anyway.`,
];

/**
 * THE HANDOVER — the only time power in this house is given rather than won.
 *
 * The competition runs without them, comes down to two, and three people who
 * have been in the building for an hour hand the crown to one of them. What
 * they are actually choosing on is the only information they have: who was
 * kind to them in the first hour, and whether either finalist is the person
 * they came here already hating.
 */
export function rivalsChooseHoh(week, competition, { rng = Math.random } = {}) {
  const st = rivalsState();
  if (!st || st.chose || !openingWeek(week)) return null;
  const rivals = st.pairs.map(p => p.rival).filter(n =>
    (week?.houseAtStart || gs.activePlayers || []).includes(n));
  if (!rivals.length) return null;
  const finalists = (competition?.placements || []).filter(n => !rivals.includes(n)).slice(0, 2);
  if (finalists.length < 2) return null;

  // One vote each. A rival will not hand the house to their own partner, and
  // beyond that they are going on an hour of first impressions — which is
  // social read against nothing else, because there is nothing else yet.
  const ballots = rivals.map(r => {
    const partner = rivalPartner(r);
    const score = n => (n === partner ? -10 : 0)
      + getBond(r, n) * 0.6
      + stat(n, 'social') * 0.15
      - stat(n, 'strategic') * 0.1
      + (rng() - 0.5) * 1.6;
    const choice = [...finalists].sort((a, b) => score(b) - score(a))[0];
    return { rival: r, choice, protecting: partner && finalists.includes(partner) ? partner : null };
  });
  const tally = {};
  for (const b of ballots) tally[b.choice] = (tally[b.choice] || 0) + 1;
  const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
  const loser = finalists.find(n => n !== winner) || finalists[1];

  const n = rivals.length;
  st.chose = { winner, loser, finalists: [...finalists], tally, ballots };

  // Being handed the house by three strangers is a debt, and everybody watched
  // it happen. The person who was NOT chosen watched it too.
  for (const r of rivals) {
    try { addBond(winner, r, 2.2); } catch { /* fine */ }
    try { addBond(loser, r, -1.6); } catch { /* fine */ }
    try {
      rememberStrategy(winner, r, 'handed-me-the-house', Number(week?.num) || 1, 2,
        { format: 'big-brother', twist: 'bb-rivals' });
    } catch { /* the debt stands */ }
  }

  return {
    type: 'rivals-hoh', week: Number(week?.num) || 1,
    winner, loser, finalists: [...finalists], rivals, ballots,
    tally: Object.entries(tally).map(([name, votes]) => ({ name, votes })),
    beats: [{
      text: `The competition comes down to ${finalists.join(' and ')}, and then it stops. `
        + `Neither of them has won anything. The ${n === 1 ? 'person' : `${numberWord(n)} people`} `
        + `who walked in tonight ${n === 1 ? 'is' : 'are'} asked to decide which of them is `
        + `Head of Household.`,
      players: [...finalists], badgeText: 'NOT WON — GIVEN', badgeClass: 'gold',
    }, {
      text: (() => {
        const pool = n > 1 ? [...HANDOVERS, ...HANDOVERS_MANY] : HANDOVERS;
        return pool[Math.floor(rng() * pool.length)](winner, loser, n);
      })(),
      players: rivals, badgeText: n === 1 ? 'THE RIVAL DECIDES' : 'THE RIVALS DECIDE', badgeClass: 'red',
    }, {
      text: `${winner} has the room, the key, and a debt to ${n === 1 ? 'somebody'
        : `${numberWord(n)} people`} who ${n === 1 ? 'has' : 'have'} been in this house for two hours. `
        + `${loser} has nothing, and watched exactly who took it away.`,
      players: [winner, loser], badgeText: 'A DEBT, NOT A WIN', badgeClass: 'grey',
    }],
  };
}

// ── living with them ─────────────────────────────────────────────────────

// Every line names both of them. Two pairs drawing the same nameless variant
// in the same week printed the identical sentence twice, which reads as a bug
// in the generator rather than as two arguments.
const FLASHPOINTS = [
  (a, b, g) => `${a} and ${b} go off over nothing — a pan, a chair, who was standing where. `
    + `Everybody in that kitchen understands that it is not about the pan.`,
  (a, b, g) => `${a} says one sentence to ${b} in front of six people, quietly, and ${b} leaves the room. `
    + `Nobody asks either of them what it was.`,
  (a, b, g) => `${a} and ${b} are civil for four days and then they are not, and the four days `
    + `turn out to have been the loud part.`,
  (a, b, g) => `${b} brings it up. ${a} was never going to bring it up — that is the whole shape of `
    + `${P(a).posAdj} game — and ${b} could not stand another day of it not being brought up.`,
];

const TRUCES = [
  (a, b) => `${a} and ${b} end up in the storeroom at the same time by accident and neither of them `
    + `leaves. Whatever gets said in there, they both come out looking like they have been `
    + `holding their breath.`,
  (a, b) => `"We do not have to be friends. We have to be in the same house for a while." `
    + `${b} says it to ${a} and it is the most reasonable sentence either of them has managed. `
    + `It holds for about a week.`,
  (a, b) => `Somebody puts ${a} and ${b} on the same team for a competition and they are, `
    + `infuriatingly, good at it.`,
  (a, b) => `${a} covers for ${b} in a conversation ${b} was not in, and does not mention it afterwards. `
    + `${b} finds out anyway, because in this house everybody finds out.`,
];

const USED = [
  (a, b, third) => `${third} works out that the fastest way to move a vote is to say ${a}'s name to ${b}, `
    + `and starts doing it roughly twice a day.`,
  (a, b, third) => `${third} tells ${b} that ${a} has been talking. ${a} has not been talking. `
    + `It does not matter — that particular story does not need to be true to work.`,
  (a, b, third) => `Everybody in this house has now worked out that ${a} and ${b} will never protect each other, `
    + `which makes both of them the safest person in the room to sit beside.`,
  (a, b, third) => `${third} puts ${a} and ${b} on the same side of a plan on purpose, just to watch `
    + `what it does to both of them, and it does exactly what ${third} expected.`,
];

/**
 * The grudge, week by week.
 *
 * The twist has no clock and no job — what it has is two people who cannot be
 * in a room together and eleven who can watch. So this fires between pairs who
 * are both still in the house, and every outcome moves a real bond: a flashpoint
 * costs them, a truce is worth something, and the third kind is somebody else
 * noticing that a permanent grudge is a permanent tool.
 */
export function rivalWeekEvents(week, { rng = Math.random } = {}) {
  const st = rivalsState();
  if (!st) return null;
  const house = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean);
  const live = st.pairs.filter(p => house.includes(p.rival) && house.includes(p.partner));
  if (!live.length) return null;

  const beats = [];
  // Keyed per pair, so two pairs can have different rows in the same week and
  // neither of them repeats itself across the season.
  const fresh = freshLine(st, rng);
  for (const p of live) {
    // Not every pair, every week — a house where the same two people have the
    // same row seven weeks running is a house with one story in it.
    if (rng() > 0.62) continue;
    const key = `${p.rival}|${p.partner}`;
    const bond = getBond(p.rival, p.partner);
    const temper = (stat(p.rival, 'temperament') + stat(p.partner, 'temperament')) / 20;
    const roll = rng();
    // Warm enough and level-headed enough, and it can actually thaw.
    if (roll < clamp(0.16 + temper * 0.35 + (bond + 6) * 0.03, 0.05, 0.55)) {
      try { addBond(p.rival, p.partner, 1.4); } catch { /* fine */ }
      beats.push({ text: fresh(TRUCES, `truce-${key}`, p.rival, p.partner),
        players: [p.rival, p.partner], badgeText: 'SOMETHING LIKE A TRUCE', badgeClass: 'green' });
      continue;
    }
    // Somebody else spotting a permanent tool.
    const third = house.filter(n => n !== p.rival && n !== p.partner)
      .sort((a, b) => stat(b, 'strategic') - stat(a, 'strategic'))[0];
    if (third && roll > 0.78) {
      try { addBond(p.rival, p.partner, -0.8); } catch { /* fine */ }
      try { addBond(third, p.partner, 0.5); } catch { /* fine */ }
      beats.push({ text: fresh(USED, `used-${key}`, p.rival, p.partner, third),
        players: [third, p.rival, p.partner], badgeText: 'SOMEBODY IS USING IT', badgeClass: 'blue' });
      continue;
    }
    try { addBond(p.rival, p.partner, -1.5); } catch { /* fine */ }
    beats.push({ text: fresh(FLASHPOINTS, `flash-${key}`, p.rival, p.partner, p.grudge),
      players: [p.rival, p.partner], badgeText: 'IT GOES OFF', badgeClass: 'red' });
  }
  if (!beats.length) return null;

  return {
    type: 'rivals-week', week: Number(week?.num) || 0,
    pairs: live.map(p => ({ ...p, bond: round2(getBond(p.rival, p.partner)) })),
    beats,
  };
}

const OUTLASTED = [
  (stays, goes, kin) => `${goes} goes, and ${stays} stays, and the two of them have to say goodbye `
    + `in front of everybody with a camera about four feet away.`,
  (stays, goes, kin) => `Whatever they were to each other before this house, ${stays} outlasted ${goes} in it. `
    + `That is going to be a sentence in somebody's family for a very long time.`,
  (stays, goes, kin) => `${goes} hugs ${stays} on the way out. It is not warm and it is not cold. `
    + `It is two people who have run out of things to do about it.`,
  (stays, goes, kin) => `They do not hug. ${goes} says "good luck" from the doorway and means about half of it.`,
];

/**
 * One of them goes.
 *
 * The question the twist exists to ask, and the wiki answers it for its own
 * season: all three Rivals outlasted their partner, and all three reached the
 * jury. Recorded here so a season can be compared to that.
 */
export function rivalEvicted(name, week) {
  const st = rivalsState();
  const pair = pairOf(name);
  if (!st || !pair || pair.outcome) return null;
  const house = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean);
  const other = pair.rival === name ? pair.partner : pair.rival;
  // Only interesting while the other one is still in it. Both gone in the same
  // night is a double eviction, not a story about a grudge.
  if (!house.includes(other)) return null;

  pair.outcome = {
    week: Number(week?.num) || 0,
    gone: name, stays: other,
    rivalOutlasted: other === pair.rival,
  };
  st.outcomes.push({ ...pair.outcome, kin: pair.kin, label: pair.label });

  const p = P(other);
  // The room they walk back into is not the room they left. Everybody has
  // watched this for weeks, and the person still standing has lost the one
  // thing that made them legible.
  for (const n of house.filter(x => x !== name && x !== other)) {
    try { addBond(n, other, 0.6); } catch { /* fine */ }
  }

  return {
    type: 'rivals-out', week: Number(week?.num) || 0,
    gone: name, stays: other, kin: pair.kin, label: pair.label,
    rivalOutlasted: other === pair.rival,
    remaining: st.pairs.filter(x => !x.outcome).length,
    beats: [{
      text: OUTLASTED[Math.floor(Math.random() * OUTLASTED.length)](other, name, pair.kin),
      players: [other, name], badgeText: 'ONE OF THEM OUTLASTED THE OTHER', badgeClass: 'red',
    }, {
      text: `${other} walks back into a house that has spent ${pair.outcome.week} week${
        pair.outcome.week === 1 ? '' : 's'} understanding ${p.obj} entirely through one other person, `
        + `and now has to work out what ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} without ${name} in the room.`,
      players: [other], badgeText: 'AND NOW THEY ARE JUST A HOUSEGUEST', badgeClass: 'grey',
    }],
  };
}

/** What the season did with its three grudges, for the finale to read. */
export function rivalsLedger() {
  const st = rivalsState();
  if (!st) return null;
  return {
    pairs: st.pairs.map(p => ({ ...p })),
    outcomes: [...st.outcomes],
    // The wiki's own trivia line, as a measurable: every rival outlasted the
    // person they came in hating.
    cleanSweep: st.outcomes.length === st.pairs.length
      && st.outcomes.every(o => o.rivalOutlasted),
  };
}
