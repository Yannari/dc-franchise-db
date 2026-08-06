// ══════════════════════════════════════════════════════════════════════
// bb/whacktivity.js — three doors, and you only get to walk through one
// ══════════════════════════════════════════════════════════════════════
//
// The fifth distributor, and the first one you can play for.
//
// The other four hand power out. Pandora's Box is an HOH gamble, the App Store
// and the Den of Temptation are audience gifts, and the veto competition just
// awards whoever wins. Nobody in this house has ever been able to go and EARN
// a Coup d'État — which left `dedicated-competition` declared and unused.
//
// The obvious build is "a competition whose prize is a power", and BB21 is
// more interesting than that. Three separate competitions ran, each attached
// to a DIFFERENT named power, and the houseguests chose which one to enter.
// Five played each. The competition is not the mechanic; the choice is:
//
//   - you pick which power you want, from what your week actually looks like
//   - you do not know who else picked the same door until you are standing
//     in it, so the popular one is the crowded one
//   - the winner is told in private, so nobody can be sure it landed at all
//
// The other half is BB22's Safety Suite, which supplies the price: the Head of
// Household cannot enter, a lone entrant still has to beat the competition
// rather than being handed it, and everybody who plays is SEEN playing. The
// door you walk through is a public statement that you wanted something, and
// the person holding the keys is watching you make it.

import { gs, players } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getPerceivedBond } from '../bonds.js';
import { aptitude, makePicker, clamp } from '../bb-comps/_shared.js';
import { BB_POWER_DEFINITIONS, grantPower } from './powers.js';

/** How many may play any one of them. BB21's number. */
export const WHACK_CAP = 5;

/** What each competition asks of you. Different doors, different people. */
const WHACK_MIX = Object.freeze({
  'diamond-veto': { endurance: 0.2, mental: 0.34, strategic: 0.26, temperament: 0.2 },
  'coup-d-etat': { mental: 0.3, strategic: 0.34, boldness: 0.2, endurance: 0.16 },
  'the-cloud': { physical: 0.3, endurance: 0.3, temperament: 0.24, mental: 0.16 },
  'bonus-life': { endurance: 0.34, physical: 0.28, temperament: 0.22, mental: 0.16 },
});
const DEFAULT_MIX = Object.freeze({ mental: 0.3, endurance: 0.26, physical: 0.24, strategic: 0.2 });

const beat = (text, players, badgeText, badgeClass = 'twist') =>
  ({ type: 'whacktivity', text, players: [...players].filter(Boolean), badgeText, badgeClass });

const noise = (rng, amt = 2.5) => (rng() - 0.5) * amt * 2;
const round2 = v => Math.round(v * 100) / 100;

const PICKED = [
  (n, p, power) => `${n} walks into the one offering ${power} without breaking stride. ${p.Sub} has known which door ${p.sub} wanted since the rules were read out.`,
  (n, p, power) => `${n} stands in the corridor for a while and then picks ${power}. Whatever ${p.sub} decided, ${p.sub} decided it about ${p.posAdj} own week.`,
  (n, p, power) => `${n} goes for ${power}, and does not look at who is following ${n} in.`,
  (n, p, power) => `${n} takes ${power}. ${p.Sub} counted the room first, which is the only sensible way to pick a door nobody can see through.`,
];

const SAT_OUT = [
  (n, p) => `${n} does not play at all. Walking into any of those rooms tells the house you think you need something, and ${p.sub} would rather nobody thought that.`,
  (n) => `${n} stays on the sofa. There is a version of this game where wanting power visibly is the thing that gets you nominated.`,
  (n, p) => `${n} sits it out. ${p.Sub} is comfortable this week and comfortable is worth more than a lottery ticket.`,
];

const CROWDED = [
  (power, k) => `${k} of them chose the same door. Whatever else happens, ${k - 1} people are about to find out they were not the only one who wanted ${power}.`,
  (power, k) => `The room offering ${power} fills up — ${k} houseguests, one prize, and every one of them now knows exactly who else is hunting.`,
];

// Every variant in these arrays is called as fn(name, pronouns, powerName).
// A variant that declares (n, power) binds the PRONOUNS OBJECT to `power` and
// narrates "wins [object Object]" — keep the full signature even where a
// variant does not use every argument.
const ALONE = [
  (n, p, power) => `${n} is the only one who wanted ${power}, and finds out that being alone in there is not the same as winning it. The clock runs whether anybody is racing ${p.obj} or not.`,
  (n, p, power) => `Nobody else picked ${power}. ${n} still has to beat it.`,
];

const WON = [
  (n, p, power) => `${n} takes it, and is told in a room with the door shut. ${p.Sub} walks back out with ${power} and a face that is trying very hard to be a normal face.`,
  (n, p, power) => `${n} wins ${power}. The house is told nothing at all, which is the only reason it is worth having.`,
  (n, p) => `${n} wins, and spends the rest of the night practising looking disappointed.`,
];

const LOST_SOLO = [
  (n, p) => `${n} misses it. ${p.Sub} walked in alone, walked out with nothing, and everybody watched ${p.obj} do both.`,
];

const NOBODY = [
  power => `Nobody wanted ${power} badly enough to gamble on it. The room stays dark and the power goes back in the box.`,
];

/**
 * How much this houseguest wants THIS power, given the week they are having.
 *
 * The point of the twist is that the choice is legible: somebody who is about
 * to be nominated reaches for the thing that stops nominations, and somebody
 * running the house reaches for the thing that rewrites it. Never gated —
 * every appeal is proportional, so the wrong person wanting the wrong door is
 * always possible and is usually the interesting outcome.
 */
function appeal(name, powerId, { nominees = [], hoh = null, rng = Math.random } = {}) {
  const st = pStats(name);
  const arch = players.find(p => p.name === name)?.archetype || '';
  const onBlock = nominees.includes(name);
  // How exposed they feel: nobody is safe, but some are less safe than others.
  const friendless = -clamp((gs.activePlayers || [])
    .filter(n => n !== name)
    .reduce((sum, n) => sum + getPerceivedBond(name, n), 0) / 10, -3, 3);

  let want = 0.5 + st.boldness * 0.02 + st.strategic * 0.02;

  if (powerId === 'the-cloud') {
    // Stops a nomination. Wanted by people who expect one.
    want += (onBlock ? 0.7 : 0) + friendless * 0.12;
  } else if (powerId === 'coup-d-etat') {
    // Rewrites somebody else's week. A player's power, not a survivor's.
    want += st.strategic * 0.05 + (['mastermind', 'schemer', 'villain'].includes(arch) ? 0.35 : 0)
      - (onBlock ? 0.2 : 0);
  } else if (powerId === 'diamond-veto') {
    want += st.strategic * 0.035 + (onBlock ? 0.25 : 0);
  } else if (powerId === 'bonus-life') {
    // A second chance appeals to somebody who can feel the first one ending.
    want += (onBlock ? 0.5 : 0) + friendless * 0.18 - st.social * 0.02;
  }

  if (name === hoh) want = -1; // the keys already; and barred anyway
  return want + noise(rng, 0.5);
}

/**
 * Run the three doors.
 *
 * `offered` is the list of power ids on the table — up to three, from the
 * Format Designer, so any power added to the registry can be competed for
 * with no new code.
 */
export function runWhacktivity({ week, house, hoh, nominees = [], rng = Math.random, offered = [] } = {}) {
  const room = (house || []).filter(Boolean);
  // Deduped, because the doors are authored one at a time now and the same
  // power standing behind two of them would collapse two rooms into one set
  // of entrants. Empty strings are doors the author closed and drop out here.
  const shelf = [...new Set((offered || []).filter(id => BB_POWER_DEFINITIONS[id]))].slice(0, 3);
  // Three doors and nobody to walk through them is not a twist.
  if (!shelf.length || room.length < 5) return null;

  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  const say = makePicker(rng);
  const beats = [];
  const eligible = room.filter(n => n !== hoh);

  // ── the choice ──
  const picks = {};
  shelf.forEach(id => { picks[id] = []; });
  const satOut = [];
  for (const name of eligible) {
    const scored = shelf.map(id => ({ id, want: appeal(name, id, { nominees, hoh, rng }) }))
      .sort((a, b) => b.want - a.want);
    const best = scored[0];
    // Wanting nothing is a real answer. Being seen to want something is the
    // cost of playing, so a comfortable houseguest often declines to pay it.
    const st = pStats(name);
    const shy = 0.30 - st.boldness * 0.028 - (nominees.includes(name) ? 0.3 : 0);
    if (best.want < 0.6 || rng() < clamp(shy, 0, 0.55)) { satOut.push(name); continue; }
    picks[best.id].push({ name, want: round2(best.want) });
  }

  // Five to a room, and the five who wanted it most get in.
  for (const id of shelf) {
    picks[id].sort((a, b) => b.want - a.want);
    const overflow = picks[id].splice(WHACK_CAP);
    overflow.forEach(o => satOut.push(o.name));
  }

  // ── which room opens tonight ──
  //
  // Only ONE. BB21 ran its three across three weeks — Ovi took Nightmare, then
  // Jack took Chaos, then Christie took Panic — and a house holding three
  // secret powers at once is a different, much sillier show. So you choose
  // your door and then find out whether it is the one opening, which is what
  // makes choosing the crowded room a real gamble rather than just a harder
  // competition: the quiet door might be the only one that plays.
  //
  // Preference goes to a room with somebody in it, so the twist does not
  // resolve to "nothing happened" while five people stand in the next corridor.
  const stocked = shelf.filter(id => picks[id].length);
  const openId = stocked.length
    ? stocked[Math.floor(rng() * stocked.length)]
    : shelf[Math.floor(rng() * shelf.length)];

  // ── the rooms ──
  const rooms = [];
  for (const id of shelf) {
    const def = BB_POWER_DEFINITIONS[id];
    const field = picks[id];
    const mix = WHACK_MIX[id] || DEFAULT_MIX;

    if (id !== openId) {
      // Chose a door that stayed shut. They are not out of the game, they are
      // out of THIS one, and everybody saw them pick it.
      if (field.length) {
        beats.push(beat(
          `The room offering ${def.name} does not open tonight. ${
            field.length === 1 ? `${field[0].name} picked it` : `${field.map(f => f.name).join(', ')} picked it`
          } and ${field.length === 1 ? 'goes' : 'go'} back to the sofas having told the house exactly what ${
            field.length === 1 ? 'they wanted' : 'they wanted'} and won nothing for it.`,
          field.map(f => f.name).slice(0, 4), 'DID NOT OPEN', 'grey'));
      }
      rooms.push({
        powerId: id, power: def.name, opened: false, empty: !field.length,
        entrants: field.map(f => f.name), winner: null,
      });
      continue;
    }

    if (!field.length) {
      beats.push(beat(say(NOBODY)(def.name), [], 'NOBODY PLAYED', 'grey'));
      rooms.push({ powerId: id, power: def.name, entrants: [], winner: null, empty: true, opened: true });
      continue;
    }

    for (const entrant of field) {
      const pr = pronouns(entrant.name);
      beats.push(beat(say(PICKED)(entrant.name, pr, def.name), [entrant.name], 'PICKED A DOOR', 'gold'));
    }
    if (field.length >= 3) {
      beats.push(beat(say(CROWDED)(def.name, field.length), field.map(f => f.name).slice(0, 4),
        'A CROWDED ROOM', 'red'));
    }

    const scores = field.map(f => ({
      name: f.name,
      score: round2(aptitude(f.name, mix) + noise(rng, 2.8)),
    })).sort((a, b) => b.score - a.score);

    let winner = scores[0]?.name || null;
    let soloFailed = false;
    if (field.length === 1) {
      // BB22's rule, and the better one: walking in alone is not winning.
      const solo = scores[0];
      const pr = pronouns(solo.name);
      beats.push(beat(say(ALONE)(solo.name, pr, def.name), [solo.name], 'ALONE IN THERE', 'grey'));
      if (solo.score < 5.6) { winner = null; soloFailed = true; }
    }

    if (winner) {
      grantPower(id, winner, { week: weekNum, visibility: 'secret', source: 'bb-whacktivity' });
      beats.push(beat(say(WON)(winner, pronouns(winner), def.name), [winner], 'WON IN PRIVATE', 'gold'));
    } else if (soloFailed) {
      beats.push(beat(say(LOST_SOLO)(scores[0].name, pronouns(scores[0].name)),
        [scores[0].name], 'MISSED IT', 'red'));
    }

    rooms.push({
      powerId: id, power: def.name, empty: false, opened: true,
      entrants: field.map(f => f.name),
      results: scores.map(s => ({ ...s })),
      winner, soloFailed,
    });
  }

  // ── the price of being seen wanting it ──
  //
  // Paid by EVERYBODY who picked a door, not only by the room that opened.
  // The cost is not losing the competition, it is having walked across the
  // house towards a power while the person holding the keys watched — and
  // somebody whose door stayed shut paid that in full for nothing at all.
  const winners = new Set(rooms.map(r => r.winner).filter(Boolean));
  for (const r of rooms) {
    for (const name of r.entrants) {
      if (hoh && name !== hoh) addBond(hoh, name, -0.4);
      if (!winners.has(name)) {
        gs.popularity ||= {};
        gs.popularity[name] = (gs.popularity[name] || 0) + 1;
      }
    }
  }

  return {
    type: 'whacktivity', week: weekNum, secret: true,
    offered: shelf, openId, rooms, satOut: [...satOut], hoh,
    beats,
  };
}
