// ══════════════════════════════════════════════════════════════════════
// bb-finale.js — the last night in the house
// ══════════════════════════════════════════════════════════════════════
//
// From the final three: a three-part Head of Household, the winner of it cutting
// one person loose, and then the jury — the people this house has spent a season
// evicting — deciding which of the last two played it better.
//
// The jury vote itself is Total Drama's. Its model already reads exactly what a
// jury should read: what a juror personally values in a game, their resentment,
// their respect, whether they believe a finalist is the reason they are sitting
// there. All of that is canonical shared state that Big Brother has been filling
// in all season, so the work here is seating the jury and handing it over rather
// than writing a second opinion about how juries think.

import { gs, seasonConfig } from './core.js';
import { pStats, pronouns } from './players.js';
import { getBond } from './bonds.js';
import { dealBetween, sincerityOf, honoursDeal, breakDeal, exposeDeal, tierOf } from './bb/deals.js';
import { reconcileBBJury } from './bb/knowledge.js';
import { seedJurorReads, sentimentAdjustment } from './bb/jury-sentiment.js';
import { seatedJurors } from './bb/jury.js';
import { rememberStrategy } from './strategy-memory.js';
import { simulateJuryVote, projectJuryVotes } from './finale.js';
import { runBBCompetition } from './bb/comps.js';
import { BB_COMPETITIONS } from './bb-comps/index.js';

/** Everyone still playing, in roster order. */
const houseNow = () => [...(gs.activePlayers || [])];

/**
 * Seat the jury from the people this season evicted.
 *
 * Total Drama's jury vote reads gs.jury and gs.jurorHistory — who was evicted,
 * and who voted them out. A house records exactly that in its ballots every
 * week, so the history is translated rather than invented, the same way the
 * ballots already translate for the vote screen.
 */
export function seatBBJury(extra = []) {
  const weeks = gs.bb?.weeks || [];
  // An eviction that a Battle Back undid is not a jury seat. The week keeps
  // its record — the vote happened and the transcript still says so — but it
  // stops counting as a departure, or the returnee ends up on the jury they
  // are still playing against. A second eviction later has its own week entry
  // and seats them properly.
  //
  // Which evictions are seats is bb/jury.js's rule now, so a mid-season reader
  // and this vote cannot disagree about who is on the panel. The trailing slice
  // stays as a belt-and-braces clamp: `extra` carries the final-three cut, and
  // a season that returned somebody through a Battle Back can otherwise arrive
  // here with one more name than there are chairs.
  const evicted = seatedJurors();
  const size = Math.max(0, Number(seasonConfig.jurySize) || 9);
  const all = [...evicted, ...extra].filter(Boolean);
  const jury = size ? all.slice(-size) : all;

  gs.jurorHistory ||= {};
  for (const w of weeks) {
    if (!w.evicted || w.evictionReversed || !jury.includes(w.evicted)) continue;
    gs.jurorHistory[w.evicted] = {
      ep: w.num,
      voters: (w.ballots || []).filter(b => b.evict === w.evicted).map(b => b.voter),
      finalBonds: Object.fromEntries((w.houseAtStart || [])
        .filter(n => n !== w.evicted)
        .map(n => [n, getBond(w.evicted, n)])),
    };
  }
  // Anyone cut at the final three was not voted out by a house, so record the
  // person who actually made the decision.
  for (const name of extra) {
    if (!jury.includes(name)) continue;
    gs.jurorHistory[name] ||= { ep: (gs.bb?.weeks?.length || 0) + 1, voters: [], finalBonds: {} };
  }

  gs.jury = jury;
  return jury;
}

/**
 * What the jury will credit a finalist with having actually done.
 *
 * The shared vote applies a passenger penalty when a finalist has no big moves
 * to their name, and a house measures those differently from an island: winning
 * when you had to, landing a backdoor, and moving a vote that was not going your
 * way.
 */
function recordBigMoves(finalists) {
  gs.playerStates ||= {};
  const weeks = gs.bb?.weeks || [];
  for (const name of finalists) {
    const st = gs.bb?.stats?.[name] || {};
    const backdoors = weeks.filter(w => w.hoh === name && w.plan?.backdoorTarget
      && w.evicted === w.plan.backdoorTarget).length;
    const flips = weeks.reduce((n, w) =>
      n + (w.ballots || []).filter(b => b.changed && b.changedBy === name).length, 0);
    // Organizing the vote that sent somebody home is the modern resume's
    // spine — juries in the big-move era credit the person who RAN the week,
    // not only the person who won the comp. Without this line a strategist
    // who orchestrated five evictions sat in the final chairs reading as a
    // passenger.
    const delivered = weeks.filter(w => (w.voteOperation?.plans || []).some(p =>
      p.organizer === name && p.target === w.evicted && p.expected >= p.majority)).length;
    gs.playerStates[name] ||= {};
    gs.playerStates[name].bigMoves = (st.hohWins || 0) + (st.vetoWins || 0) * 0.5
      + backdoors * 2 + flips + delivered * 1.5;
  }
}

/**
 * One part of the three-part final competition.
 *
 * Parts one and two DRAW, from the whole roster: every endurance competition
 * the library has can be a part one, every physical or precision one can be a
 * part two, and the set pieces written specifically for finale night sit in
 * that pool alongside them rather than replacing it. A finale that always
 * played the same wall would be the twelfth week of the season with a bigger
 * light rig, and the library exists precisely so it does not have to be.
 *
 * Part three does not draw. It is the jury quiz, every season, because the
 * question part three asks — how well do you know the people you evicted — is
 * the only one worth deciding a season on.
 */
export const FINAL_ROLES = {
  endurance: { categories: ['endurance'] },
  skill: { categories: ['physical', 'precision', 'puzzle'] },
};

/**
 * Everything that can serve one part of the final Head of Household.
 *
 * Exported because the Season Timeline's pickers must offer exactly what the
 * finale can actually run. A dropdown built from a second, hand-kept list is a
 * dropdown that eventually offers a competition the night refuses to stage.
 */
export function finalCompPool(role) {
  const spec = FINAL_ROLES[role] || { categories: [] };
  return BB_COMPETITIONS.filter(c =>
    // Written for finale night...
    (c.finalRole === role && c.types.includes('final'))
    // ...or an ordinary competition of the right shape, which is most of them.
    || (spec.categories.includes(c.category) && c.types.includes('hoh')));
}

/** What the designer pinned to this part, if anything. */
const pinnedFor = role => {
  const pins = seasonConfig?.bbFinalComps || {};
  const id = role === 'endurance' ? pins.one : role === 'skill' ? pins.two : null;
  // A pin for a competition that has since left the library is ignored rather
  // than thrown: a saved season should not stop playing because a comp was
  // renamed.
  return id && BB_COMPETITIONS.some(c => c.id === id) ? id : null;
};

function finalPart(participants, label, rng, week, { compId = null, role = null } = {}) {
  let forced = compId || (role ? pinnedFor(role) : null) || undefined;
  if (!forced && role) {
    const pool = finalCompPool(role);
    forced = pool.length ? pool[Math.floor(rng() * pool.length)].id : undefined;
  }
  // The slot has to match the competition that was drawn: the set pieces live
  // in `final` and the rest of the library in `hoh`.
  const chosen = forced ? BB_COMPETITIONS.find(c => c.id === forced) : null;
  const type = chosen?.types.includes('final') ? 'final' : 'hoh';
  const result = runBBCompetition({
    type, participants: [...participants], house: [...participants],
    week, rng, library: BB_COMPETITIONS, forcedId: forced, allowThrowing: false,
    // The jury quiz needs to know who is on the bench it is quoting.
    jury: [...(week?.jury || seatedJurors())],
  });
  return { part: label, competition: result, winner: result.winner, participants: [...participants] };
}

/**
 * Run the whole last night, from the final three to a winner.
 *
 * Returns an `ep`-shaped record so the run surface and the visual player treat
 * it like any other week, or null if the house is not at its final three.
 */
export function simulateBBFinale(rng = Math.random) {
  const house = houseNow();
  if (house.length < 2) return null;

  const week = { num: (gs.bb?.weeks?.length || 0) + 1, format: 'big-brother', finale: true };
  const acts = [];
  let finalTwo = [...house];
  let finalHoh = null;
  let cut = null;

  // ── the three-part Head of Household ──
  if (house.length >= 3) {
    // Everybody plays part one, the outgoing Head of Household included, and
    // whoever wins it does not play part two at all.
    const one = finalPart(house, 'Part One — Endurance', rng, week, { role: 'endurance' });
    acts.push({ type: 'final-hoh-part', ...one, partNum: 1 });

    // Whoever won part one sits it out; the other two play for the last seat.
    const twoField = house.filter(n => n !== one.winner);
    const two = finalPart(twoField, 'Part Two — Skill', rng, week, { role: 'skill' });
    acts.push({ type: 'final-hoh-part', ...two, partNum: 2 });

    // The two winners meet in part three, which is always the jury quiz.
    const three = finalPart([one.winner, two.winner], 'Part Three — Jury Statements', rng, week,
      { compId: 'bb-final-part-three' });
    acts.push({ type: 'final-hoh-part', ...three, partNum: 3 });
    finalHoh = three.winner;

    // The one decision the whole season has been pointing at.
    //
    // This used to be resolved on projected jury margin alone, which meant the
    // single moment in Big Brother where a final two deal is publicly honoured
    // or broken was decided by a spreadsheet. Nobody ever kept their word
    // because nobody was ever asked to.
    //
    // Now there are two readings and they can disagree. The head says take the
    // one you beat. The promise says take the one you told you would. Which one
    // wins depends on how much they meant it and how much it costs.
    const options = house.filter(n => n !== finalHoh);
    const margins = new Map(options.map(n => [n, 0]));
    let keep = options[0];
    let projected = null;
    try {
      const projections = options.map(other => {
        const proj = projectJuryVotes([finalHoh, other]);
        const mine = proj?.votes?.[finalHoh] ?? 0;
        const theirs = proj?.votes?.[other] ?? 0;
        return { other, margin: mine - theirs };
      }).sort((a, b) => b.margin - a.margin);
      projections.forEach(p => margins.set(p.other, p.margin));
      projected = projections[0].other;
      keep = projected;
    } catch {
      // No projection available: take the person the house liked least.
      keep = options.sort((a, b) =>
        house.reduce((s, n) => s + getBond(n, a), 0) - house.reduce((s, n) => s + getBond(n, b), 0))[0];
      projected = keep;
    }

    // Is there a promise here at all?
    const promises = options
      .map(other => ({ other, deal: dealBetween(finalHoh, other) }))
      .filter(entry => entry.deal);
    // Somebody holding a deal with BOTH of them has already guaranteed they
    // break one, which is the most Big Brother position there is.
    const bound = promises.sort((a, b) =>
      sincerityOf(b.deal, finalHoh) - sincerityOf(a.deal, finalHoh))[0] || null;

    let honoured = null;
    let betrayal = null;
    if (bound) {
      const partner = bound.other;
      // What keeping the promise costs: the jury margin given up by sitting
      // beside the harder opponent, scaled into 0..1.
      const cost = Math.max(0, (margins.get(projected) || 0) - (margins.get(partner) || 0));
      const pressure = Math.min(1, cost / 5);
      if (honoursDeal(finalHoh, bound.deal, pressure)) {
        keep = partner;
        // On the record, so the person they kept it with can weigh it at the
        // vote — and so can anybody who watched them do it.
        bound.deal.honoured = true;
        bound.deal.honouredBy = finalHoh;
        bound.deal.honouredEp = week.num;
        honoured = {
          partner, tier: tierOf(bound.deal), madeEp: bound.deal.madeEp,
          cost: Number(cost.toFixed(2)),
          // Keeping your word against your own interest is a different act from
          // keeping it when it was free, and the jury should hear which it was.
          costly: cost > 0.5,
        };
      } else {
        keep = projected;
        if (partner !== keep) {
          betrayal = breakDeal(bound.deal, finalHoh, { week, reason: 'cut them at the final three' });
          // Everybody on that jury is about to hear about it — this one happens
          // in front of them, at the last possible moment, on the way out.
          exposeDeal(bound.deal, [...(gs.jury || []), ...house]);
          try {
            rememberStrategy(partner, finalHoh, 'broken-final-two', week.num, 3,
              { format: 'big-brother', at: 'final-three' });
            for (const juror of gs.jury || []) {
              if (juror !== partner) rememberStrategy(juror, finalHoh, 'broke-a-final-two', week.num, 2,
                { format: 'big-brother', victim: partner });
            }
          } catch { /* the cut still happened */ }
        }
      }
    }

    cut = options.find(n => n !== keep) || null;
    finalTwo = [finalHoh, keep];
    acts.push({
      type: 'final-cut', finalHoh, kept: keep, cut,
      // How they got here, because a result with no reasoning is not a story.
      projected, honoured, betrayal: betrayal ? { partner: betrayal.victims[0], tier: tierOf(bound.deal) } : null,
      hadPromise: !!bound,
      margins: Object.fromEntries(margins),
    });

    if (cut) {
      gs.activePlayers = house.filter(n => n !== cut);
      gs.eliminated ||= [];
      if (!gs.eliminated.includes(cut)) gs.eliminated.push(cut);
    }
  }

  // ── the jury ──
  const jury = seatBBJury(cut ? [cut] : []);
  recordBigMoves(finalTwo);
  // Ponderosa. Seven people with nothing to do but compare notes about the one
  // thing none of them could see from inside: who actually wrote their name
  // down. Whatever they work out here is the last input to the only decision
  // they have left.
  let juryLearned = [];
  try { juryLearned = reconcileBBJury(jury, { week: week?.num || 0 }); } catch { juryLearned = []; }
  // The person cut at three never sat in the lodge, so they arrive with the
  // read their game earned them and nothing else — seeded here rather than
  // walking into the vote with no opinion at all.
  const adjustments = {};
  for (const juror of jury) {
    try {
      seedJurorReads(juror, week?.num || 0);
      adjustments[juror] = sentimentAdjustment(juror, finalTwo);
    } catch { /* this juror votes on résumé alone */ }
  }
  const verdict = simulateJuryVote(finalTwo, adjustments);
  const votes = verdict.votes || {};
  const winner = finalTwo.slice().sort((a, b) => (votes[b] || 0) - (votes[a] || 0))[0];
  const runnerUp = finalTwo.find(n => n !== winner) || null;
  acts.push({ type: 'jury-vote', jury, votes, reasoning: verdict.reasoning || [], winner, runnerUp,
    // What the jury house taught them, so the screen can say so.
    learned: juryLearned });

  gs.phase = 'complete';
  gs.winner = winner;
  gs.bb ||= {};
  gs.bb.finale = { finalHoh, finalTwo, cut, jury, votes, winner, runnerUp };

  return {
    num: week.num,
    format: 'big-brother',
    isBigBrother: true,
    isFinale: true,
    finale: true,
    houseAtStart: house,
    finalHoh, finalTwo, cut,
    jury, juryVotes: votes,
    winner, runnerUp,
    eliminated: cut || null,
    acts,
    // Total Drama's finale record shape, so anything reading a season winner
    // finds it where it expects to.
    challengeType: null, isMerge: false, riChoice: null,
    alliances: [], twists: [], tribesAtStart: [], campEvents: null,
    summaryText: '',
  };
}
