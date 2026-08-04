// ══════════════════════════════════════════════════════════════════════
// bb/battle-back.js — the door opens backwards
// ══════════════════════════════════════════════════════════════════════
//
// The return slice. Everything before this was a season that only ever got
// smaller; this is the first mechanic that puts somebody BACK, and the whole
// house has to live with a person who knows exactly who sent them out.
//
// Two shapes, both real, both on the wiki:
//
//   gauntlet   Big Brother 18. The first two evictees fight, the winner faces
//              the third, that winner faces the fourth, and so on down the
//              order. The earliest evictee has to win the most fights, which
//              is why the first-out coming back is the best version of this
//              twist that has ever aired.
//
//   showdown   Big Brother 19's Battle Back Showdown. Everybody runs one heat,
//              the top two advance to a head-to-head, and then the survivor
//              faces a CHAMPION the house elects to defend the door. If the
//              champion wins, nobody comes back at all — which makes it the
//              only version where the house gets a say.
//
// The returnee gets NO immunity. That is not a simplification: Cody won the
// Showdown and was on the block the following week. A twist that handed out
// safety would be a different twist.

import { gs, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond } from '../bonds.js';
import { aptitude, makePicker, clamp } from '../bb-comps/_shared.js';

export const BATTLE_BACK_STYLES = Object.freeze(['gauntlet', 'showdown']);

/** The stat mix a duel is scored on when the pinned comp declares none. */
const DEFAULT_MIX = Object.freeze({ endurance: 0.3, physical: 0.28, mental: 0.24, temperament: 0.18 });

const round2 = v => Math.round(v * 100) / 100;
const noise = (rng, amt = 2.5) => (rng() - 0.5) * amt * 2;

const beat = (text, players, badgeText, badgeClass = 'challenge') =>
  ({ type: 'battle-back', text, players: [...players], badgeText, badgeClass });

const DUEL_WIN = [
  (w, l, p) => `${w} takes it off ${l} by a margin nobody in the yard could call, and ${p.sub} does not celebrate so much as exhale.`,
  (w, l) => `${w} is simply better at this than ${l} is, and it is over early enough that the crew stops pretending otherwise.`,
  (w, l, p) => `${l} leads it for most of the way. ${w} takes it at the end, and ${p.sub} knows exactly how close that was.`,
  (w, l) => `${w} beats ${l} on the last exchange. One of them goes back to a bed inside and the other one goes to the airport.`,
];

const DUEL_OUT = [
  (n, p) => `${n} sits down on the mat and does not get up for a while. ${p.Sub} was eleven days from a second chance and is now finished.`,
  (n) => `${n} shakes the winner's hand, which costs ${n} something, and walks off without looking at the house.`,
  (n, p) => `${n} says ${p.sub} would rather have gone out in the house than out here, and means it.`,
  (n) => `That is the end of it for ${n} — evicted once, and now beaten for the right to argue about it.`,
];

/**
 * Who is eligible to fight their way back.
 *
 * Eviction order, oldest first, because the gauntlet is built on that order and
 * the showdown's heat needs a stable field. People who left for reasons other
 * than a vote are excluded: a quit and a medical removal are not evictions and
 * the show has never let them battle back.
 */
export function battleBackField({ cap = 0 } = {}) {
  const departures = new Set((gs.bb?.weeks || [])
    .map(w => w.departure?.name).filter(Boolean));
  const alreadyBack = new Set((gs.bb?.returns || []).map(r => r.name));
  const field = (gs.eliminated || [])
    .filter(Boolean)
    .filter(n => !departures.has(n))
    .filter(n => !alreadyBack.has(n))
    .filter(n => !(gs.activePlayers || []).includes(n));
  return cap > 0 ? field.slice(0, cap) : field;
}

/** One head-to-head. Independent roll — nothing carries between fights. */
function duel(a, b, mix, rng, weeksOutOf) {
  const score = name => {
    // Time on the outside is motivation, not rust. The earliest evictee has
    // the most fights to win, so the twist would never produce its best story
    // without something pushing the other way.
    const hunger = clamp((weeksOutOf[name] || 0) * 0.35, 0, 1.6);
    return aptitude(name, mix) + hunger + noise(rng, 2.6);
  };
  const sa = score(a), sb = score(b);
  return { winner: sa >= sb ? a : b, loser: sa >= sb ? b : a, scores: { [a]: round2(sa), [b]: round2(sb) } };
}

/**
 * The house elects somebody to defend the door.
 *
 * Not a popularity vote and not purely the best competitor: a house picks the
 * player it believes can win, weighted by who it actually likes enough to hand
 * a moment to. Both halves matter, which is why the house sometimes sends the
 * wrong person out there and has to watch the door open.
 */
function electChampion(house, mix, rng) {
  if (!house.length) return null;
  const tally = {};
  for (const voter of house) {
    let best = null, bestScore = -Infinity;
    for (const cand of house) {
      if (cand === voter) continue;
      const trust = aptitude(cand, mix) * 0.7;
      const liking = (typeof gs.popularity?.[cand] === 'number' ? gs.popularity[cand] : 0) * 0.2;
      const s = trust + liking + noise(rng, 1.8);
      if (s > bestScore) { bestScore = s; best = cand; }
    }
    if (best) tally[best] = (tally[best] || 0) + 1;
  }
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  return ranked.length ? { name: ranked[0][0], votes: ranked[0][1], tally } : null;
}

/**
 * Run the competition and put somebody back in the house, or nobody.
 *
 * Called at the END of a scheduled week, after the eviction, so the person who
 * walked out tonight is in the field — which is how both aired versions did
 * it. The winner re-enters with no safety and a very long memory.
 */
export function runBattleBack({ week, rng = Math.random, style = 'gauntlet', competition = null, cap = 0 } = {}) {
  const field = battleBackField({ cap });
  // Two people minimum, or there is no competition to run — and a house that
  // has not evicted anybody yet cannot hold one at all.
  if (field.length < 2) return null;

  const mix = competition?.stats && Object.keys(competition.stats).length ? competition.stats : DEFAULT_MIX;
  const say = makePicker(rng);
  const out = makePicker(rng);
  const beats = [];
  const rounds = [];
  const house = [...(gs.activePlayers || [])];
  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;

  // How long each contender has been on the outside, in weeks.
  const weeksOutOf = {};
  field.forEach(name => {
    const w = (gs.bb?.weeks || []).find(x => x.evicted === name);
    weeksOutOf[name] = Math.max(0, weekNum - (Number(w?.num) || weekNum));
  });

  const compName = competition?.name || 'the battle back';
  beats.push(beat(
    `The yard is not the yard tonight. ${field.length} evicted houseguests come back through a door they were told they would never see again, and only one of them is going through it the other way.`,
    field.slice(0, 4), 'BATTLE BACK', 'challenge'));

  let returned = null;
  let champion = null;
  const eliminatedForGood = [];

  if (style === 'showdown') {
    // ── BB19: heat, final, then the house's champion defends ──
    const heat = field.map(name => ({
      name,
      score: round2(aptitude(name, mix) + clamp((weeksOutOf[name] || 0) * 0.35, 0, 1.6) + noise(rng, 2.8)),
    })).sort((a, b) => b.score - a.score);
    rounds.push({ label: 'HEAT', kind: 'heat', results: heat.map(h => ({ ...h })) });

    const advancing = heat.slice(0, 2).map(h => h.name);
    const knocked = heat.slice(2).map(h => h.name);
    beats.push(beat(
      `${compName} runs as one heat with everybody in it. ${advancing.join(' and ')} finish one-two and stay alive.${
        knocked.length ? ` ${knocked.join(', ')} ${knocked.length === 1 ? 'is' : 'are'} done for good.` : ''}`,
      advancing, 'TOP TWO', 'challenge'));
    knocked.forEach(n => {
      eliminatedForGood.push(n);
      beats.push(beat(out(DUEL_OUT)(n, pronouns(n)), [n], 'ELIMINATED', 'grey'));
    });

    let survivor = advancing[0];
    if (advancing.length === 2) {
      const d = duel(advancing[0], advancing[1], mix, rng, weeksOutOf);
      survivor = d.winner;
      rounds.push({ label: 'FINAL', kind: 'duel', a: advancing[0], b: advancing[1], winner: d.winner, scores: d.scores });
      beats.push(beat(say(DUEL_WIN)(d.winner, d.loser, pronouns(d.winner)), [d.winner, d.loser], 'HEAD TO HEAD', 'challenge'));
      eliminatedForGood.push(d.loser);
      beats.push(beat(out(DUEL_OUT)(d.loser, pronouns(d.loser)), [d.loser], 'ELIMINATED', 'grey'));
    }

    // The house sends somebody to hold the door shut.
    const elected = electChampion(house, mix, rng);
    if (elected) {
      champion = elected;
      beats.push(beat(
        `The house votes for who defends the door and lands on ${elected.name}, ${elected.votes} of ${house.length}. ${
          pronouns(elected.name).Sub} walks out to face ${survivor} carrying everybody else's week.`,
        [elected.name, survivor], 'THE CHAMPION', 'gold'));
      const d = duel(survivor, elected.name, mix, rng, weeksOutOf);
      rounds.push({ label: 'THE DOOR', kind: 'duel', a: survivor, b: elected.name, winner: d.winner, scores: d.scores });
      if (d.winner === survivor) {
        returned = survivor;
      } else {
        eliminatedForGood.push(survivor);
        beats.push(beat(
          `${elected.name} holds the door. ${survivor} came the whole way back and is beaten one round from a bed, and nobody re-enters this house tonight.`,
          [elected.name, survivor], 'DOOR HELD', 'red'));
        // Defending the house is a real credential and the house treats it as
        // one — this is a comp win in front of everybody.
        gs.popularity ||= {};
        gs.popularity[elected.name] = (gs.popularity[elected.name] || 0) + 2;
        house.filter(n => n !== elected.name).forEach(n => addBond(elected.name, n, 0.4));
      }
    } else {
      returned = survivor;
    }
  } else {
    // ── BB18: the ladder, in eviction order ──
    let holder = field[0];
    for (let i = 1; i < field.length; i++) {
      const challenger = field[i];
      const d = duel(holder, challenger, mix, rng, weeksOutOf);
      rounds.push({ label: `ROUND ${i}`, kind: 'duel', a: holder, b: challenger, winner: d.winner, scores: d.scores });
      beats.push(beat(say(DUEL_WIN)(d.winner, d.loser, pronouns(d.winner)), [d.winner, d.loser],
        i === field.length - 1 ? 'FINAL ROUND' : `ROUND ${i}`, i === field.length - 1 ? 'gold' : 'challenge'));
      eliminatedForGood.push(d.loser);
      beats.push(beat(out(DUEL_OUT)(d.loser, pronouns(d.loser)), [d.loser], 'ELIMINATED', 'grey'));
      holder = d.winner;
    }
    returned = holder;
  }

  const act = {
    type: 'battle-back', style, week: weekNum,
    competition: competition ? { id: competition.id, name: competition.name, category: competition.category } : null,
    contenders: [...field], rounds, champion, returned,
    eliminatedForGood: [...eliminatedForGood],
    weeksOut: { ...weeksOutOf }, beats,
  };

  if (returned) applyReturn(returned, act, weekNum);
  return act;
}

/**
 * Put them back in the house, and make the house feel it.
 *
 * The bookkeeping matters as much as the beat: an eviction that has been
 * undone must stop counting as an eviction everywhere it is read from, or the
 * returnee ends up seated on the jury they are still playing against.
 *
 * Exported because a reversed eviction is a reversed eviction however it was
 * won. The Bonus Life sends one person to one competition instead of a field
 * to a gauntlet, but the door it opens is this door, and the grudge ledger it
 * writes is the reason the returnee is worth having back.
 */
export function applyReturn(name, act, weekNum) {
  gs.bb ||= {};
  gs.bb.returns ||= [];
  gs.bb.returns.push({ name, week: weekNum, style: act.style });

  gs.eliminated = (gs.eliminated || []).filter(n => n !== name);
  if (!(gs.activePlayers || []).includes(name)) gs.activePlayers = [...(gs.activePlayers || []), name];
  // A reversed eviction is not a jury seat. seatBBJury reads the weeks ledger,
  // so the week that evicted them is flagged rather than rewritten — the vote
  // still happened and the transcript still says so.
  for (const w of gs.bb.weeks || []) {
    if (w.evicted === name && Number(w.num) <= weekNum) w.evictionReversed = true;
  }

  gs.popularity ||= {};
  gs.popularity[name] = (gs.popularity[name] || 0) + 3;

  // They know who did it. The ballots are on the record, and a person who
  // fought their way back through a car park does not arrive gracious.
  const evictionWeek = (gs.bb.weeks || []).find(w => w.evicted === name);
  const votedAgainst = (evictionWeek?.ballots || []).filter(b => b.evict === name).map(b => b.voter);
  const grudges = [];
  for (const voter of votedAgainst) {
    if (!(gs.activePlayers || []).includes(voter)) continue;
    addBond(name, voter, -2);
    grudges.push(voter);
  }
  // And the people who kept them get the other half of it.
  const keptThem = (evictionWeek?.ballots || [])
    .filter(b => b.evict !== name).map(b => b.voter)
    .filter(v => (gs.activePlayers || []).includes(v));
  for (const ally of keptThem) addBond(name, ally, 1.2);

  act.grudges = grudges;
  act.allies = keptThem;
  // A Bonus Life return happens minutes after the vote rather than weeks
  // later, so the act it writes into carries no weeksOut ledger at all.
  const weeksOut = act.weeksOut?.[name] || 0;
  act.beats.push(beat(
    `${name} walks back into the house. ${grudges.length
      ? `${grudges.length === 1 ? 'One person' : `${grudges.length} people`} in that room voted ${
        pronouns(name).obj} out and ${pronouns(name).sub} has had ${
        weeksOut > 1 ? `${weeksOut} weeks` : weeksOut === 1 ? 'a week'
          : 'about eleven minutes'} to learn their names.`
      : 'Nobody in that room voted against them, which is its own kind of problem for whoever did.'} No immunity, no head start, and the block is open to ${pronouns(name).obj} on Thursday like anybody else.`,
    [name], 'BACK IN THE HOUSE', 'gold'));
}
