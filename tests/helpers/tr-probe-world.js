// ══════════════════════════════════════════════════════════════════════
// tests/helpers/tr-probe-world.js — the synthetic castle world the
// ground-truth probes and the belief gate both measure in
// ══════════════════════════════════════════════════════════════════════
//
// Extracted from tr-castle.test.js in fix round 2 because a SECOND file now
// needs it: tr-castle-belief-gate.test.js executes every registered event's
// fire() directly, and it must do so in the same rich world the probes use,
// or the two guards disagree about what "eligible" means.
//
// SYNTHETIC, IDENTICAL PLAYERS. Six roster names with different stat lines
// would make the probes lie in both directions: `cover-cold-sweat-tell` reads
// `pStats(whoever is the Traitor).temperament`, so swapping which of two REAL
// people is the Traitor moves its weight for a reason that has nothing to do
// with reading a hidden alignment. With every stat line identical, any
// difference between the arms can only be the alignment, which is the whole
// question.
import { gs, setGs, setPlayers } from '../../js/core.js';
import { initTraitorsState } from '../../js/tr/state.js';
import { setBond } from '../../js/bonds.js';
import { recordAlignment } from '../../js/tr/roles.js';
import { openThread } from '../../js/tr/threads.js';
import { setFranchiseLedger } from '../../js/franchise-meta.js';
import { resetKnowledge } from '../../js/knowledge.js';
import { seedTraitorKnowledge } from '../../js/tr/deduction.js';

const PROBE_STATS = { physical: 5, endurance: 5, mental: 7, social: 7, strategic: 7,
  loyalty: 7, boldness: 7, intuition: 7, temperament: 3 };

export const PROBE_PLAYERS = ['Pa', 'Pb', 'Pc', 'Pd', 'Pe', 'Pf'].map(n => ({
  name: n, slug: n.toLowerCase(), gender: 'nb', archetype: 'floater',
  stats: { ...PROBE_STATS },
}));
export const PROBE_CAST = PROBE_PLAYERS.map(p => p.name);
export const PROBE_EP = 5;

/**
 * A world identical in every respect except the two alignments (and whether
 * the turret was ever shown). Rich enough that most of the pool clears its
 * non-alignment preconditions — a murder last round, threads of every kind
 * this pool opens, warm bonds, and a prior season on the ledger — because a
 * probe where nothing is eligible passes trivially.
 */
export function probeWorld({ aTraitor, bTraitor, turret }) {
  const [A, B] = PROBE_CAST;
  setPlayers(PROBE_PLAYERS);
  setGs({ bonds: {}, activePlayers: [...PROBE_CAST] });
  gs.tr = initTraitorsState();
  resetKnowledge();
  recordAlignment(A, aTraitor, 1, 'selection');
  recordAlignment(B, bTraitor, 1, 'selection');
  PROBE_CAST.slice(2).forEach(n => recordAlignment(n, false, 1, 'selection'));
  if (turret) seedTraitorKnowledge(1);
  setBond(A, B, 4);
  setBond(PROBE_CAST[2], PROBE_CAST[3], -3);
  gs.tr.rounds.push({ ep: PROBE_EP - 1, murdered: PROBE_CAST[5], murderTarget: PROBE_CAST[5] });
  // AND THE VICTIM LEAVES THE CASTLE. This world used to record a murder and
  // keep the victim in `activePlayers`, which no real season can do — and
  // anything deriving a count from cast-minus-living (js/tr/state.js's
  // `peopleLost`/`murderCount`, written for F1 because `rounds` misses night
  // one's murder) read this world as having lost nobody. A fixture that
  // contradicts the state it is modelling makes the events measured in it
  // unreachable for reasons the engine does not have.
  gs.activePlayers = gs.activePlayers.filter(n => n !== PROBE_CAST[5]);
  // Threads of every kind this pool opens, on the PAIR and on each actor
  // ALONE. Both shapes are needed and neither is optional:
  //   - `findOpenThread(kind, [actor])` keys on the exact party set, so a
  //     cover event looking for one Traitor's own open cover story does not
  //     match a thread opened on the pair (`cover-rehearsed-story-advance`).
  //   - `openThreadsFor` filters on `heatAt(t, ep) > 0`, and heat decays 0.5 a
  //     round from 1 on open, so a thread seeded two rounds back is already
  //     stone cold by PROBE_EP and invisible (`trust-late-checkin`,
  //     `trust-vow-of-silence`). Seeding the same thread again one round later
  //     advances it instead of duplicating it, which leaves it warm.
  // A RECRUITMENT THAT WAS DECLINED, seeded for A in BOTH arms.
  //
  // `cover-decline-recruit-offer-story` is the one event in the pool gated on
  // `gs.tr.loyaltyDebt`, and without a debt in the world its `fire()` used to
  // run anyway — `ctx.actors.find(...)` returned undefined and the old direct
  // `openThread` call happily opened a story whose only party was `undefined`.
  // The belief gate counted that as coverage, so the arm that claims to look
  // inside every event was, for this one, looking inside a firing that could
  // not happen in a season. The scene API refuses an unknown name outright,
  // which is what surfaced it. Seeded for A in both arms, so it adds a
  // precondition and never an alignment signal: the weight is 1.5 whether or
  // not A is a Traitor.
  gs.tr.loyaltyDebt.push({ recruiter: A, recruit: PROBE_CAST[2], ep: PROBE_EP - 1 });
  // ── AN AFTERNOON ON THE RECORD (Task 7 stage 3) ───────────────────────
  //
  // WHY THIS IS HERE. The `journey-back` window is the whole of the
  // mission-fallout phase, and every event in js/tr/castle/mission-fallout.js
  // opens with `lastMission(gs, ep)` — deliberately, because that is the one
  // fact a road-home scene can be causally built on. Without a record in this
  // world all fourteen of them weight 0 and, worse, `fire()` throws when the
  // sweeps that execute the whole pool call it anyway: the three guards that
  // claim to look inside every event would have been looking inside nothing
  // for a seventh of the library. Same fix, and the same reasoning, as the
  // declined recruitment seeded above for `cover-decline-recruit-offer-story`:
  // the world gains a precondition, never an alignment signal.
  //
  // NEUTRAL BY CONSTRUCTION. Nothing on this record reads or reveals anybody's
  // role, so it is byte-identical in both arms of the ground-truth probes and
  // of the belief gate, and cannot move what those measure.
  //
  // THE SPLIT IS DELIBERATE AND IS WHAT MAKES THE POOL REACHABLE. A and B are
  // on the SAME half (the same-team events: `mission-same-side`,
  // `mission-what-you-saw-out-there`) and D is on the OTHER half, so the
  // sweeps that convene [D, B] reach the different-team events
  // (`mission-the-other-half`, `mission-who-was-where`). One pair cannot
  // satisfy both, and an event nothing convenes is an event nothing checks.
  // C is named for a solo task and MISSED it (`mission-what-cost-us`); D is
  // named for one and made it (`mission-took-the-extra`) and is also the
  // searcher on the relic block (`mission-the-hour-they-went-missing`),
  // neither of which is A or B, which is what those two events require.
  gs.tr.missions.push({
    id: 'coffin-dig', ep: PROBE_EP, name: 'The Sunken Coffins',
    teams: [
      { name: 'Ravens', members: [A, B, PROBE_CAST[2]], perf: 0.62 },
      { name: 'Hounds', members: [PROBE_CAST[3], PROBE_CAST[4]], perf: 0.48 },
    ],
    quality: 0.5, tier: 'solid', bestTeam: 'Ravens',
    gross: 4200, earned: 4200, potAfter: 4200,
    sideObjectives: [
      { id: 'deepest-box', player: PROBE_CAST[2], stat: 'physical', achieved: false,
        bonus: 0, line: `${PROBE_CAST[2]} tried to bring up the deepest coffin alone and did not get there.` },
      { id: 'read-the-tide', player: PROBE_CAST[3], stat: 'intuition', achieved: true,
        bonus: 200, line: `${PROBE_CAST[3]} broke off to call the tide before it turned, and pulled it off.` },
    ],
    summary: 'They worked the tide instead of racing it, and came up the cliff path with time to spare.',
    shield: {
      searcher: PROBE_CAST[3], found: true, cost: 900,
      holder: PROBE_CAST[3], witnesses: [A, PROBE_CAST[3]], visibility: 'seen',
      lines: ['Somebody went down the stair and came back up with something that was not a reliquary.'],
    },
  });
  const THREAD_KINDS = ['trust', 'suspicion', 'cover', 'callback', 'testing', 'grief',
    'romance', 'romance-spark', 'romance-showmance'];
  for (const parties of [[A, B], [A], [B]]) {
    for (const kind of THREAD_KINDS) {
      openThread(kind, parties, PROBE_EP - 2, 'seed');
      openThread(kind, parties, PROBE_EP - 1, 'seed');
    }
  }
  setFranchiseLedger({
    v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {
      '1': { seasonName: 'S1', format: 'total-drama', players: {
        [A]: { allies: [B], rivals: [B], betrayed: [], betrayedBy: [B], showmances: [{ partner: B, ended: 'breakup' }], finalist: true },
        [B]: { allies: [A], rivals: [A], betrayed: [A], betrayedBy: [], showmances: [{ partner: A, ended: 'breakup' }], finalist: true },
      } },
    } } },
  });
}

/** Returns exactly the scripted sequence, cycling — for forcing a specific branch. */
export function scriptedRng(values) {
  let i = 0;
  return () => { const v = values[i % values.length]; i++; return v; };
}

/**
 * A deterministic rng whose FIRST value is `roll` and whose subsequent values
 * walk a fixed LCG. The first draw is what every fork in this pool uses to
 * pick its branch, so `roll` selects the branch; the rest exist because a
 * constant-valued rng hangs any fire() that re-draws until it gets a
 * different result (several romance/callback events pick a third party that
 * way), and a hang is not a test failure — it is a suite that never finishes.
 */
export function forkRng(roll) {
  let first = true;
  let s = 0x9e3779b9;
  return () => {
    if (first) { first = false; return roll; }
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
