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
