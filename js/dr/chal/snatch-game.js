// ══════════════════════════════════════════════════════════════════════
// dr/chal/snatch-game.js — the taping
// ══════════════════════════════════════════════════════════════════════
//
// The one challenge where the assignment matters more than the performance.
// A queen who gets the character she prepared is playing a different game from
// the one who walked in last and took what was left, and the panel is six
// questions long, so there is nowhere to hide a bad choice.
//
// It is scored ROUND BY ROUND rather than once, because dying on the panel is
// not a low average — it is the specific, watchable thing of three answers in
// a row landing on silence. An average would smooth exactly the event the
// episode is about.
import { SNATCH_CHARACTERS, characterById } from '../data/snatch-characters.js';
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise } from '../perform.js';
import { evt } from '../rules.js';

const ROUNDS = 6;
/** Three answers landing on silence. Not an average — a run. */
const FLOP = 3;
const KILL = 8.5;

// ── THE HOST, WHO WAS NOT IN THIS AT ALL ──────────────────────────────
//
// Snatch Game was six rounds scored in isolation: every queen answered into a
// vacuum and nobody on the other side of the desk existed. That is not the
// segment. The host reads the question, and then he DECIDES what to do with
// what she gives him — feed a queen who is working, or let one who is dying
// hang there while he moves on.
//
// So each round he engages one queen, and which one is not random: he goes
// where the television is. A queen who is landing gets more of him, which
// compounds; a queen who is dying gets him too, because a struggling queen is
// also television, and that is the crueller half of the format.
const ENGAGE_PER_ROUND = 1;
/** What a setup is worth to somebody who can take it. */
const ROPE = 1.6;
/** And what being left to hang costs. */
const HANG = 1.2;

/**
 * Her shortlist, best first.
 *
 * A queen reaches for a character that suits her style and that she can carry.
 * The difficulty subtraction is why the funniest queen in the room can still
 * be found holding the Silent Film Star: everybody wants the good ones, and
 * only one of them gets it.
 */
/**
 * ── WHY SHE REACHES, OR DOES NOT ──
 *
 * The shortlist used to be one sum for everybody: style match, the stat the
 * character needs, minus its difficulty. Difficulty was a straight penalty,
 * so every queen in every season shortlisted the safest thing she could
 * carry and the hard characters came off the board only when the easy ones
 * had gone. Nobody ever CHOSE a tightrope.
 *
 * A queen picking a character is answering a question about her week, not
 * solving an optimisation. Three things decide how far she reaches:
 *
 *   NERVE       boldness. Some queens want the hard one because it is hard.
 *   STANDING    what her record looks like. A queen who has been safe four
 *               weeks running needs a moment more than she needs a floor;
 *               a queen who has been winning does not have to gamble.
 *   THE ROOM    how late she picks. Reaching is cheap when the board is full
 *               and expensive when it is nearly empty.
 *
 * `appetite` is the result, and it flips the sign on difficulty: at zero the
 * old behaviour, hard characters penalised; high, and difficulty becomes the
 * reason to take one. The variance in the taping does the rest — see the
 * swing in the round loop, where a hard character is both the best and the
 * worst thing that can happen to her.
 */
function appetiteFor(player, record = [], slot = 0, field = 1) {
  const st = player?.stats || {};
  const bold = Number.isFinite(Number(st.boldness)) ? Number(st.boldness) : 5;

  /* WHAT SHE HAS TO SHOW FOR HERSELF. Wins and highs are a floor she can
     stand on; a stack of safes is the thing that makes a queen reach. Reading
     the record rather than a stat because it is the season talking, not the
     roster: the same queen wants different things in week two and week six. */
  const wins = record.filter(r => r === 'WIN').length;
  const highs = record.filter(r => r === 'HIGH').length;
  const trouble = record.filter(r => r === 'BTM' || r === 'BTM2' || r === 'LOW').length;
  const invisible = record.filter(r => r === 'SAFE').length;

  let a = (bold - 5) / 5;                    // nerve, -1 to 1
  a += Math.min(0.7, invisible * 0.18);      // safe for weeks: she needs a moment
  a += Math.min(0.5, trouble * 0.22);        // in trouble: nothing left to protect
  a -= Math.min(0.8, (wins * 0.5 + highs * 0.2)); // already proved it: no need
  // Late in the order the board is thin and a reach is a luxury.
  a -= (slot / Math.max(1, field)) * 0.35;
  return Math.max(-1, Math.min(1.4, a));
}

/**
 * Her shortlist, best first.
 *
 * A queen reaches for a character that suits her style and that she can carry
 * — and how far past "can carry" she is willing to go is `appetite`.
 */
function wantsFor(player, appetite = 0, rng = Math.random) {
  const d = dragOf(player);
  return [...SNATCH_CHARACTERS]
    .map(c => {
      /* BIG ENOUGH TO OUTRANK TASTE, deliberately. The two tests pulling on
         this term want opposite things — a spooky queen must reach for a
         spooky character, and a room of numerically identical queens must not
         all reach for the SAME one — and a single mid-sized term cannot do
         both. So the scales are separated: style is the coarse sort and taste
         is the fine one, wide enough to shuffle a whole style block and still
         narrow enough to lose to a match. */
      const styleFit = c.style === d.style ? 5 : 0;
      /* HALF A PENALTY, because difficulty is no longer a quality gap — it
         is a choice about how wide the night is. Subtracting it in full made
         the five easiest characters lead every shortlist by more than taste
         could overcome, so a room of identical queens still converged on the
         same handful and one of them took six others' first choice. */
      const canCarry = d[c.needs] - c.difficulty * 0.5;
      /* THE REACH. Positive appetite pays for difficulty instead of charging
         for it, so a bold queen with nothing to lose shortlists the Silent
         Film Star on purpose rather than inheriting it. */
      /* AND IN SCALE WITH THE OTHER TERMS, which is what it was not. At 0.9
         this ran to +/-6.3 against a style match worth 3 and a craft range of
         about 2.5, so appetite was not one consideration among three — it was
         the shortlist, and every queen with the same nerve reached for the
         same hardest character. Measured on an identical cast: six of twelve
         queens lost their first choice to one queen. */
      const reach = appetite * c.difficulty * 0.6;
      /* ── AND WHO SHE HAPPENS TO DO ──
         Craft says which characters she COULD carry; it does not say which one
         she has been doing in her kitchen since she was fourteen, and that is
         most of why a queen picks somebody. Without it two queens with the
         same numbers want the same person in the same order, and a roster
         player who arrives with no drag stats gets every stat defaulted to 5
         — so a whole cast of them produced ONE shortlist, thirteen times.
         That is the bug this fixes and it is worth stating plainly: every
         queen wanted Richard Simmons, the queen picking first took him,
         twelve of thirteen were recorded as having lost their pick to her,
         and the shared top eight ran out so four queens got nothing at all. */
      /* SMALL ENOUGH TO LOSE TO CRAFT. At ±3.5 it beat the +3 a style match
         is worth, so a spooky queen stopped reaching for spooky characters —
         taste has to break ties, not overrule the two things the shortlist is
         actually about. */
      const personal = (rng() - 0.5) * 6;
      return { c, score: styleFit + canCarry + reach + personal + (d.comedy - 5) * 0.2 };
    })
    .sort((a, b) => b.score - a.score)
    /* LONG ENOUGH THAT THE BOARD CANNOT EMPTY. Eight was shorter than the
       cast, so a room that agreed with itself ran out of characters. */
    .slice(0, 20)
    .map(x => x.c.id);
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, bond, state } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });
  /* HER APPETITE IS HERS, and it depends on where she is picking and what her
     season looks like so far — so it is computed per queen, in order, rather
     than once for the room. */
  const appetite = {};
  const choices = {};
  order.forEach((n, i) => {
    appetite[n] = appetiteFor(players[n], state?.record?.[n] || [], i, order.length);
    choices[n] = wantsFor(players[n], appetite[n], rng);
  });
  const { picks, events } = contestFor({ order, choices, players, rng, bond });
  const roles = Object.fromEntries(order.map(n => [n, 'standard']));
  /* WHAT SHE WAS DOING WHEN SHE PICKED, on the pick itself — so the screen
     can say she reached rather than leaving the viewer to infer it from a
     difficulty number nobody is shown. */
  for (const n of order) {
    const c = characterById(picks[n]?.choice);
    if (!c) continue;
    picks[n].difficulty = c.difficulty;
    picks[n].reached = appetite[n] > 0.25 && c.difficulty >= 4;
    picks[n].played = appetite[n] < -0.1 && c.difficulty <= 2;
  }
  return {
    roles, teams: [], order, picks, events, appetite,
    scenes: [{ step: 'choice', kind: 'snatch-picks', data: { order, picks, appetite } }],
  };
}

export function prepare(ctx) {
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  return {
    prep: w.prep,
    events: [...r.events, ...w.events],
    scenes: [...r.scenes, { step: 'prep', kind: 'walkthrough', data: { notes: w.notes } }],
  };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, bond } = ctx;
  const performances = {};
  const events = [];
  const rounds = [];
  const hostBeats = [];
  const charOf = n => characterById(assignment.picks[n]?.choice);

  const perRound = {};
  for (const n of living) perRound[n] = [];

  // Whom the host has already worked with, so one queen does not get the
  // whole taping.
  const engaged = {};

  /* ── DIFFICULTY BUYS VARIANCE, AND IT HAS TO BE DRAWN ONCE ──
     Difficulty only ever SUBTRACTED, so a hard character was strictly worse
     than an easy one and there was never a reason on the board to reach for
     one. That is not what a hard impression is: a tightrope pays MORE when
     she lands it and costs more when she does not.

     THE SWING IS PER NIGHT, NOT PER ROUND, and that is the whole trick. The
     first attempt scaled the round noise by difficulty and changed nothing
     measurable — across the rounds it simply averaged out, and the standard
     deviation of the final score was flat at about 2.2 whatever she picked.
     Whether the character WORKS is one fact about the night, not six
     independent ones, so it is drawn once and carried into every round: an
     easy character lands near her craft almost every time, a hard one is
     either the best thing on that desk or the thing that ends her week.

     And the flat penalty comes down to pay for it. A hard character should be
     a gamble, not a tax with a gamble attached. */
  const nightOf = {};
  for (const n of living) {
    const c = charOf(n);
    const diff = c ? c.difficulty : 3;
    const swing = noise(rng, 0.08 + diff * 0.2);
    /* ── AND THE UPSIDE IS WORTH MORE THAN THE DOWNSIDE IS CHEAP ──
       A symmetric swing was not enough, and measuring said so: pooled over a
       hundred and twenty tapings, hard characters bombed 40% of the time and
       shone 7%, against 17% and 28% for easy ones. Two reasons, and only one
       of them is a bug. The bug was that the swing did not pay: a hard
       character has to be BETTER when it works, not merely more variable.
       The other is a selection effect and it is correct — the queens who
       reach are the ones with nothing to protect, and they are weaker on
       average. A gamble taken by somebody who needs one should still be a
       gamble; it should not also be a worse bet than not gambling.

       AND IT HAS TO STAY SMALLER THAN CRAFT. The first sizing of this swung
       hard enough to drown the thing the challenge is actually about: a queen
       with two more points of comedy went from winning 55% of her head-to-
       heads to 43%, which is worse than a coin. A gamble on the character is
       a term in the night, not the night. */
    nightOf[n] = swing > 0 ? swing * (1 + diff * 0.5) : swing;
  }

  for (let r = 0; r < ROUNDS; r++) {
    const beat = [];
    for (const n of living) {
      const d = dragOf(players[n]);
      const c = charOf(n);
      // Out of her depth is measured against the stat the character NEEDS, so
      // a comic can carry a hard comic bit and drown in a hard acting one.
      const fit = c
        ? (c.style === d.style ? 1.2 : 0) - Math.max(0, c.difficulty - d[c.needs] / 2) * 0.22
        : -1;
      /* ── `needs` NOW CARRIES THE IMPRESSION IT SAID IT CARRIED ──
         The field is documented as "which stat carries the impression" and it
         did not: the score was comedy 0.55 / acting 0.35 for every character
         on the desk, so a part she has to INHABIT paid her comedy exactly as
         much as a loud quotable one did. `needs` only ever showed up in the
         shortlist and in the out-of-depth penalty.
         The weights tilt now. The sum is the same either way, so nobody gets
         more total credit for the kind of bit she picked — the question is
         which of her two stats has to hold it up. */
      const wComedy = c?.needs === 'acting' ? 0.34 : 0.62;
      const wActing = 0.9 - wComedy;
      const score = d.comedy * wComedy + d.acting * wActing + fit + (prep[n] || 0)
        - (assignment.picks[n]?.penalty || 0) + (nightOf[n] || 0) + noise(rng, 1.5);
      const rounded = Math.round(score * 100) / 100;
      perRound[n].push(rounded);
      beat.push({ name: n, score: rounded });
    }

    // ── AND THEN THE HOST DOES SOMETHING ABOUT IT ──
    //
    // He picks the most interesting thing on the desk this round — the best
    // answer or the worst, never the middle, because the middle is not
    // television. Whether the exchange helps her is not his decision: a queen
    // with a character can take a setup and run, and a queen without one is
    // simply given more rope.
    const sorted = [...beat].sort((x, y) => y.score - x.score);
    const candidates = [sorted[0], sorted[sorted.length - 1]]
      .filter(x => x && (engaged[x.name] || 0) < 2);
    for (let i = 0; i < ENGAGE_PER_ROUND && candidates.length; i++) {
      const pickIdx = rng() < 0.5 ? 0 : candidates.length - 1;
      const chosen = candidates.splice(pickIdx, 1)[0];
      if (!chosen) break;
      const n = chosen.name;
      engaged[n] = (engaged[n] || 0) + 1;
      const d = dragOf(players[n]);
      // Can she take it? Comedy and nerve, because a setup only works on
      // somebody willing to grab it.
      const takes = (d.comedy + (Number(players[n]?.stats?.boldness) || 5)) / 2;
      const worked = rng() < 0.25 + takes / 20;
      const delta = worked ? ROPE : -HANG;
      perRound[n][perRound[n].length - 1] =
        Math.round((perRound[n][perRound[n].length - 1] + delta) * 100) / 100;
      hostBeats.push({ round: r + 1, name: n, worked, delta });
      events.push(worked
        ? evt('host-played-along', {
          players: [n], pop: { [n]: 2 },
          data: { round: r + 1, character: charOf(n)?.name || null },
        })
        : evt('left-to-hang', {
          players: [n], pop: { [n]: -1 },
          data: { round: r + 1, character: charOf(n)?.name || null },
        }));
    }

    rounds.push({ round: r + 1, answers: beat });
  }

  // Two queens sitting next to each other who like each other build a bit
  // together, and the whole taping lifts for both. Snatch Game is the one
  // challenge where being liked is worth points rather than votes.
  for (let i = 1; i < assignment.order.length; i++) {
    const a = assignment.order[i - 1];
    const b = assignment.order[i];
    if (!perRound[a] || !perRound[b]) continue;
    if (bond(a, b) >= 2 && rng() < 0.4) {
      perRound[a] = perRound[a].map(s => Math.round((s + 0.8) * 100) / 100);
      perRound[b] = perRound[b].map(s => Math.round((s + 0.8) * 100) / 100);
      events.push(evt('double-act', {
        players: [a, b],
        bond: [[a, b, 1]],
        pop: { [a]: 2, [b]: 2 },
        data: { characters: [charOf(a)?.name || null, charOf(b)?.name || null] },
      }));
    }
  }

  for (const n of living) {
    const scores = perRound[n];
    const perf = scores.reduce((s, x) => s + x, 0) / scores.length;
    const flops = scores.filter(s => s < FLOP).length;
    const kills = scores.filter(s => s > KILL).length;
    if (flops >= 3) {
      events.push(evt('dying', {
        players: [n],
        pop: { [n]: -3 },
        state: { snatchDied: n },
        data: { character: charOf(n)?.name || null, flops },
      }));
    }
    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: kills >= 2,
      risk: (Number(players[n]?.stats?.boldness) || 5) / 10,
      role: 'standard',
      team: null,
      parts: { base: perf, prep: prep[n] || 0 },
      detail: {
        character: charOf(n)?.name || null,
        characterId: assignment.picks[n]?.choice || null,
        rounds: scores, flops, kills,
        hostBeats: hostBeats.filter(h => h.name === n),
      },
    };
  }

  return {
    performances,
    runwayOverride: null,
    events,
    scenes: [{ step: 'maxi-pre', kind: 'snatch-taping', data: { rounds, hostBeats } }],
  };
}
