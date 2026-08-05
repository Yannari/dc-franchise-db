// ══════════════════════════════════════════════════════════════════════
// bb/safety-suite.js — one entry, all season, and you choose when
// ══════════════════════════════════════════════════════════════════════
//
// BB22's shape, and the twist is not the competition. It is the ECONOMY.
//
// A houseguest may enter the Safety Suite exactly once in the whole season.
// After that they are ineligible forever. So every week the offer goes out,
// every eligible houseguest has to decide whether THIS is the week worth
// spending it on, and spending it early is a public admission that they do not
// believe they can survive an ordinary week. Holding it is a bet that a worse
// week is coming and that they will still have the entry when it does.
//
// The house watches all of it. Who swiped, who did not, and — the number that
// matters most by week three — who has nothing left.
//
// The second half is the Plus One, which is the best rule the show has written
// in years: the winner must make a SECOND houseguest safe, and that houseguest
// takes a punishment in exchange. You cannot give somebody protection here
// without also hurting them for it, in public, with your name on both halves.
//
// The last rule, and the one that keeps a single entrant honest: if only one
// houseguest enters, safety is not a formality. They still have to beat the
// clock, and losing it in an empty room is the worst outcome the twist has.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond } from '../bonds.js';
import { aptitude, makePicker, clamp } from '../bb-comps/_shared.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

/** A suite run is a scramble against a clock, not a test of one stat. */
const SUITE_MIX = { physical: 0.30, mental: 0.28, endurance: 0.24, temperament: 0.18 };
/** What the clock asks for. A lone entrant is measured against exactly this. */
const CLOCK = 5.0;

/**
 * The price of being made safe by somebody else.
 *
 * Each is a real cost the rest of the week has to carry, because a Plus One
 * that only cost a thank-you would make the choice free — and the choice being
 * expensive for the person receiving it is the entire rule.
 */
export const PLUS_ONE_PUNISHMENTS = [
  { id: 'slop', label: 'a week on slop',
    line: (n, g) => `${n} is safe and on slop until Thursday, which is ${g}'s doing and will be mentioned.` },
  { id: 'costume', label: 'the costume',
    line: (n, g) => `${n} is safe and wearing the costume for it, so nobody in this house will get through a day without being reminded who handed it over.` },
  { id: 'solitary', label: 'a night in solitary',
    line: (n, g) => `${n} is safe and spending a night away from every conversation in the building — a week of information lost for a week of protection.` },
  { id: 'chore', label: 'the house chores, alone',
    line: (n, g) => `${n} is safe and doing every dish in the house alone, in front of everybody, courtesy of ${g}.` },
];

const used = () => { gs.bb ||= {}; gs.bb.safetySuiteUsed ||= []; return gs.bb.safetySuiteUsed; };

const ENTER = [
  (n, p) => `${n} swipes the pass. It is the only one ${p.sub} will ever get and ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} spending it now, which tells the house exactly how safe ${p.sub} ${p.sub === 'they' ? 'feel' : 'feels'}.`,
  (n, p) => `${n} goes in, and does it fast enough that nobody has to ask whether ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} worried.`,
  (n, p) => `${n} takes the offer. One entry, one season, spent on this week.`,
  (n, p) => `${n} enters last, after watching who else did — which is information ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} now paid ${p.posAdj} only entry for.`,
];
const HELD = [
  (n, p) => `${n} lets the hour run out with the pass still in ${p.posAdj} pocket. It is a bet that a worse week is coming and that ${p.sub} will still have this when it does.`,
  (n, p) => `${n} does not enter, and makes sure the room sees ${p.obj} not entering.`,
];

/**
 * Run the suite.
 *
 * @returns {object|null} the act, or null when nobody is left who can enter
 */
export function runSafetySuite({ week, house, hoh, rng = Math.random } = {}) {
  const room = (house || []).filter(Boolean);
  if (room.length < 5) return null;
  const spent = used();
  // The Head of Household cannot enter, and neither can anybody who has
  // already spent theirs — the pool shrinks every week this runs, which is
  // what makes the last week of the twist a different decision from the first.
  const eligible = room.filter(n => n !== hoh && !spent.includes(n));
  if (!eligible.length) return null;
  const say = makePicker(rng);
  const beats = [];
  const bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };

  const entrants = [];
  const held = [];
  for (const name of eligible) {
    const st = pStats(name);
    // Feeling unsafe is mostly about the person holding the key. Boldness
    // spends, temperament holds, and everybody is likelier to spend it late
    // than early because an unspent entry is worth less every week.
    const exposure = clamp(0.5 - bond(hoh, name) * 0.06, 0, 1);
    const pull = 0.12 + exposure * 0.55 + (st.boldness || 5) * 0.025
      - (st.temperament || 5) * 0.015;
    if (rng() < clamp(pull, 0.05, 0.85)) entrants.push(name);
    else held.push(name);
  }
  if (!entrants.length) {
    const who = held[0];
    return {
      type: 'safety-suite', week: week?.num || 0, secret: false,
      entrants: [], held: [...held], winner: null, plusOne: null, punishment: null,
      beatTheClock: false, hoh: hoh || null, safe: [],
      exhausted: room.filter(n => spent.includes(n)),
      beats: [beat(
        `Nobody swipes. The suite sits empty for an hour and ${room.length - 1} people decide, separately, `
          + `that whatever is coming this week is survivable${who ? ` — ${who} loudest of all` : ''}.`,
        [who].filter(Boolean), 'NOBODY SWIPED', 'grey')],
    };
  }

  for (const name of entrants) {
    beats.push(beat(say(ENTER)(name, pronouns(name)), [name], 'ONE ENTRY, SPENT', 'gold'));
    spent.push(name);
  }
  if (held.length) {
    const who = held[0];
    beats.push(beat(say(HELD)(who, pronouns(who)), [who], 'HELD THE PASS', 'blue'));
  }

  // The run. Scored against each other AND against the clock, because a lone
  // entrant has nobody to beat and still has to beat something.
  const runs = entrants.map(name => ({
    name, score: aptitude(name, SUITE_MIX) + (rng() - 0.5) * 4.4,
  })).sort((a, b) => b.score - a.score);
  const best = runs[0];
  const beatTheClock = best.score >= CLOCK;
  const solo = entrants.length === 1;

  for (const r of runs.slice(1)) {
    const p = pronouns(r.name);
    beats.push(beat(
      `${r.name} runs it and comes up short, and has now spent the only entry ${p.sub} will ever have on a week `
        + `${p.sub} ${p.sub === 'they' ? 'are' : 'is'} still not safe in.`,
      [r.name], 'SPENT IT FOR NOTHING', 'red'));
  }

  const act = {
    type: 'safety-suite', week: week?.num || 0, secret: false,
    entrants: [...entrants], held: [...held], solo,
    winner: null, plusOne: null, punishment: null, beatTheClock,
    hoh: hoh || null, safe: [],
    exhausted: room.filter(n => spent.includes(n)),
    beats,
  };

  if (!beatTheClock) {
    const p = pronouns(best.name);
    beats.push(beat(
      solo
        ? `${best.name} is alone in there with nobody to beat, and still does not beat the clock. `
          + `${p.Sub} ${p.sub === 'they' ? 'walk' : 'walks'} out with no safety and no entry left.`
        : `${best.name} is the best of them and the clock beats all of them. Nobody comes out of the suite safe.`,
      [best.name], 'THE CLOCK WINS', 'red'));
    return act;
  }

  act.winner = best.name;
  act.safe = [best.name];
  beats.push(beat(
    `${best.name} beats the clock and is safe for the week — and now has to make somebody else safe too.`,
    [best.name], 'SAFE', 'gold'));

  // ── the Plus One ──
  //
  // Chosen from the room rather than from the entrants, because the point is
  // that it is a gift with a bill attached: the winner names an ally, protects
  // them, and hands them a punishment in the same sentence.
  const pool = room.filter(n => n !== best.name && n !== hoh);
  if (pool.length) {
    const plusOne = [...pool].sort((a, b) =>
      (bond(best.name, b) + rng() * 1.8) - (bond(best.name, a) + rng() * 1.8))[0];
    const punishment = PLUS_ONE_PUNISHMENTS[Math.floor(rng() * PLUS_ONE_PUNISHMENTS.length)]
      || PLUS_ONE_PUNISHMENTS[0];
    act.plusOne = plusOne;
    act.punishment = punishment.id;
    act.punishmentLabel = punishment.label;
    act.safe = [best.name, plusOne];
    beats.push(beat(punishment.line(plusOne, best.name), [plusOne, best.name],
      'PLUS ONE, AND THE BILL', 'gold'));
    // Everybody the winner did not choose, which is everybody else.
    const passed = pool.filter(n => n !== plusOne)
      .sort((a, b) => bond(best.name, b) - bond(best.name, a))[0];
    if (passed) {
      beats.push(beat(
        `${best.name} had exactly one of those to give and gave it to ${plusOne}. ${passed} was the next name on that list `
          + 'and is now on the block-shaped side of it.',
        [passed, best.name], 'NOT CHOSEN', 'grey'));
    }
  }
  return act;
}

/** Who the suite protects this week. Both halves, or neither. */
export const safetySuiteSafe = act => (act?.safe || []).filter(Boolean);
