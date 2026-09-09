// ══════════════════════════════════════════════════════════════════════
// dr/chal/rumix.js — she writes the bar, the booth keeps it or kills it
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The Rumix used to BE the girl group challenge. `js/dr/maxi.js` mapped
// `rumix`, `music-video` and `girl-group` to one module, so all three ran the
// same assign, the same prep, the same perform and the same prose; the
// catalogue gave them different `blend` weights and nothing else. Reported as
// "the rumix and music video challenge are basically the same challenges" —
// which was not a resemblance, it was the same code.
//
// The wiki calls it the VERSE CHALLENGE, and that is the whole design: the
// queens WRITE and RECORD a verse to a track. It is not a group number with
// the word "remix" over it. Two things follow, and this file is both of them:
//
//   1. THE WRITE AND THE BOOTH ARE DIFFERENT SKILLS, scored separately. A
//      queen can write a bar nobody else in the room could have written and
//      then fail to get it on tape; another can write filler and sell it with
//      a voice. The panel hears the RECORDING, so the booth is what survives —
//      but a verse with nothing in it cannot be rescued by a good take, which
//      is why both are scored and neither is decorative.
//   2. THE ORDER IS THE DECISION. Closing the track is the hard slot and
//      opening it is the other one; the middle is where nothing much happens
//      to you either way. Contested exactly the way the roast's running order
//      is, because it is the same instinct — see js/dr/chal/roast.js.
//
// AND IT IS A MAIN STAGE CHALLENGE. It was `stage: 'pre'`, which files it with
// the taped challenges and put the maxi screen before the runway. She performs
// this live, to her own recorded vocal, with choreography — the recording is
// the prep, the stage is the challenge.
//
// NO TEAMS, ANYWHERE IN HERE. `format: 'cast'` means one room and one track,
// and the girl group module gave every queen `teamWon: ti === bestTeam` with
// `bestTeam` of a single team — so every queen on the screen wore a WINNING
// TEAM tag on a challenge that has no teams to win.
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise, riskFor } from '../perform.js';
import { canScheme, evt } from '../rules.js';

/* A multiplier on the SPREAD, never a ceiling — the same shape the roast's
   slots use. The closer can win the night or lose it; the middle mostly does
   neither. Opening is hard for a different reason than closing: nobody knows
   what the track is yet, so an opener has to establish it. */
export const SLOT_DIFFICULTY = { first: 1.3, last: 1.4, middle: 1.0 };

/** How many bars each queen gets. Short enough that a dud one is visible. */
const BARS = 4;

/** A bar this low is filler — the count is what the panel refers to. */
const FILLER = 4;

const slotKind = (i, n) => (i === 0 ? 'first' : i === n - 1 ? 'last' : 'middle');
const slotNo = name => Number(String(name || 'verse-99').split('-')[1]) || 99;

const num = (p, k) => {
  const v = Number(p?.stats?.[k]);
  return Number.isFinite(v) ? v : 5;
};

/**
 * Which verse she wants, best first.
 *
 * A bold queen wants to close, then to open — the two that swing. A nervous
 * one wants the middle of the track, where she is neither the first thing the
 * panel hears nor the last. Same instinct as the roast slot and the Rusical
 * lead, deliberately: it is one queen's relationship with the spotlight, and
 * three different models of it would be three different queens.
 */
function versePreference(slots, boldness) {
  const last = slots.length - 1;
  const mid = last / 2;
  const bold = boldness >= 6;
  return [...slots].sort((a, b) => {
    const rank = name => {
      const i = slotNo(name) - 1;
      if (bold) return i === last ? 0 : i === 0 ? 1 : 2 + Math.abs(i - mid);
      return Math.abs(i - mid);
    };
    return rank(a) - rank(b);
  });
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, bond } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });
  const slots = order.map((_, i) => `verse-${i + 1}`);
  const choices = Object.fromEntries(order.map(n =>
    [n, versePreference(slots, num(players[n], 'boldness'))]));
  /* NO PREPARATION PENALTY, for the roast's reason: it is the same verse
     whichever slot it lands in, and the slot difficulty already prices the
     position. Charging her twice would make losing the contest the whole
     challenge. */
  const { picks, events } = contestFor({
    order, choices, players, rng, bond, penaltyScale: 0,
  });

  return {
    roles: Object.fromEntries(order.map(n => [n, 'standard'])),
    teams: [], order, picks, events,
    scenes: [{ step: 'choice', kind: 'verse-order', data: { picks } }],
  };
}

export function prepare(ctx) {
  const { living, players, rng, assignment } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];

  const bars = {};
  const hooks = {};
  const booth = {};

  for (const n of living) {
    const d = dragOf(players[n]);
    const p = players[n];

    /* ── THE WRITE ──
       Four bars, each scored on its own, so "she wrote one great line and
       three nothings" is a shape the panel can actually see. Comedy carries
       it, because a Rumix verse is written to be quotable rather than to be
       beautiful, and singing carries the rest — she has to write something
       she can actually deliver. `mental` is the discipline of making it scan. */
    /* THE CRAFT WEIGHTS SUM TO ONE, and that is load-bearing rather than
       tidy. Written as 0.5 comedy plus 0.3 singing, an average queen scores 4
       on a scale the rest of the engine centres on 5 — so the whole challenge
       sat below par and, worse, `booth` below was measured AGAINST this. Any
       blend compared with another blend has to be on the same scale. */
    bars[n] = Array.from({ length: BARS }, () => Math.round(
      (d.comedy * 0.55 + d.singing * 0.45 + (num(p, 'mental') - 5) * 0.15
        + (w.prep[n] || 0) + noise(rng, 2.4)) * 100) / 100);

    /* A HOOK IS NOT THE MEAN. It is one line better than the rest of the
       verse by enough that the room repeats it — a real property of a verse
       and not a rounding of its average, which is why it is measured as the
       GAP between her best bar and her own others rather than as a threshold
       on the total. A queen with four decent bars has no hook, correctly. */
    const best = Math.max(...bars[n]);
    const rest = bars[n].filter(b => b !== best);
    const restMean = rest.length ? rest.reduce((a, b) => a + b, 0) / rest.length : best;
    hooks[n] = best >= 7 && best - restMean >= 2.2;
  }

  /* ── THE BOOTH ──
     The panel hears the RECORDING, so this is the score that survives. It is
     mostly voice, and it is partly whether she can take a note from the coach
     under a red light — `intuition` to read what he is asking for and
     `temperament` to not fall apart when it takes eleven takes.
     Bounded relative to the write rather than replacing it: a good session
     lifts a weak verse and cannot invent one, and a bad session can lose a
     verse she genuinely wrote. */
  for (const n of living) {
    const d = dragOf(players[n]);
    const p = players[n];
    const written = bars[n].reduce((a, b) => a + b, 0) / BARS;
    /* ON THE SAME SCALE AS THE WRITE, because `lift` is the difference
       between them. At 0.55 singing this ran about two points under `written`
       for every queen in the room, so the booth almost always LOST the verse
       and "she got it on tape" could not happen — a mechanic that only ever
       fires one way is not a mechanic. Measured before the fix: the booth beat
       the write on 3 of 12 queens, and every one of those three was a queen
       whose verse was already bad. */
    const session = d.singing + (num(p, 'intuition') - 5) * 0.2
      + (num(p, 'temperament') - 5) * 0.15 + noise(rng, 2.0);
    const lift = Math.max(-2.2, Math.min(2.2, (session - written) * 0.45));
    booth[n] = Math.round((written + lift) * 100) / 100;

    if (lift >= 1.4) {
      events.push(evt('booth-rescue', {
        players: [n], pop: { [n]: 1 },
        data: { written: Math.round(written * 100) / 100, booth: booth[n] },
      }));
    } else if (lift <= -1.4) {
      events.push(evt('booth-lost-it', {
        players: [n], pop: { [n]: -2 },
        data: { written: Math.round(written * 100) / 100, booth: booth[n] },
      }));
    }
  }

  /* ── SOMEBODY TAKES A BAR THAT IS NOT HERS ──
     Drag's version of the roast's stolen bit, and the same rule: once a
     night, and only a queen the archetype rules allow to scheme. The mark is
     whoever is writing at the next station — the specificity is what makes it
     a scene rather than a modifier. It moves the WRITE, not the booth: she
     lifted a line, she did not lift a vocal. */
  const order = assignment?.order || living;
  for (let i = 1; i < order.length; i++) {
    const thief = order[i];
    const mark = order[i - 1];
    if (!canScheme(players[thief])) continue;
    const mine = bars[thief].reduce((a, b) => a + b, 0);
    const theirs = bars[mark].reduce((a, b) => a + b, 0);
    if (theirs - mine < 4) continue;
    if (rng() > 0.5) continue;
    bars[thief] = bars[thief].map(b => Math.round((b + 0.7) * 100) / 100);
    bars[mark] = bars[mark].map(b => Math.round((b - 0.5) * 100) / 100);
    booth[thief] = Math.round((booth[thief] + 0.7) * 100) / 100;
    booth[mark] = Math.round((booth[mark] - 0.5) * 100) / 100;
    events.push(evt('lifted-a-bar', {
      players: [thief, mark],
      bond: [[thief, mark, -2]],
      pop: { [thief]: -1 },
      data: { thief, mark },
    }));
    break;
  }

  return {
    prep: w.prep, events, bars, hooks, booth,
    scenes: [...r.scenes,
      { step: 'prep', kind: 'writing-booth', data: { bars, hooks, booth } }],
  };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, bars, hooks, booth } = ctx;
  const performances = {};
  const events = [];
  const order = [...living].sort((a, b) =>
    slotNo(assignment.picks[a]?.choice) - slotNo(assignment.picks[b]?.choice));

  order.forEach((n, i) => {
    const kind = slotKind(i, order.length);
    const range = SLOT_DIFFICULTY[kind];
    const d = dragOf(players[n]);
    const myBars = bars?.[n] || [5, 5, 5, 5];
    const recorded = booth?.[n] ?? 5;

    /* ── THE STAGE, WHICH IS NOT THE RECORDING ──
       She performs live to her own vocal. The verse is already on tape and
       cannot be improved here — what is decided tonight is whether she can
       stand inside it: the choreography, and the nerve to sell a line she
       wrote alone in a room three days ago to four judges and a live crowd.
       So `recorded` is the material and `live` is the delivery, and a queen
       can lose a verse she nailed in the booth. */
    // Weights to one, for the reason in `prepare`: this is averaged with
    // `recorded`, so the two have to mean the same thing.
    const live = d.dance * 0.55 + d.lipsync * 0.45
      + (num(players[n], 'boldness') - 5) * 0.25 + noise(rng, 2.0);
    const perf = ((recorded * 0.62 + live * 0.38) - 5) * range + 5
      - (assignment.picks[n]?.penalty || 0) + noise(rng, 1.1 * range);

    if (myBars.every(b => b < FILLER)) {
      events.push(evt('no-verse', {
        players: [n], pop: { [n]: -3 },
        state: { [`noVerse:${n}`]: true }, data: { slot: i + 1 },
      }));
    }
    /* THE BAR THE SEASON QUOTES BACK. A hook that also GOT THERE — written
       well and delivered well — is the clip, and it is worth more to her
       reputation than the placement is. Both halves are required: a hook
       fluffed on stage is not a moment, it is a shame. */
    if (hooks?.[n] && perf > 8) {
      events.push(evt('quotable-bar', {
        players: [n], pop: { [n]: 4 },
        state: { rumixBar: n }, data: { slot: i + 1 },
      }));
    }

    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: perf > 10,
      risk: riskFor(players[n], rng),
      role: 'standard', team: null,
      parts: {
        prep: prep[n] || 0,
        booth: Math.round(recorded * 100) / 100,
        live: Math.round(live * 100) / 100,
      },
      detail: {
        slot: i + 1, slotKind: kind, bars: myBars,
        hook: !!hooks?.[n],
        booth: Math.round(recorded * 100) / 100,
        live: Math.round(live * 100) / 100,
        filler: myBars.filter(b => b < FILLER).length,
      },
    };
  });

  return {
    performances, runwayOverride: null, events,
    // Main stage: she does this live, after the runway, not on tape before it.
    scenes: [{ step: 'maxi-main', kind: 'verse-order-run', data: { order } }],
  };
}
