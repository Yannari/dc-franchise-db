// ══════════════════════════════════════════════════════════════════════
// dr/saves.js — the four season-long saves
// ══════════════════════════════════════════════════════════════════════
//
// One question, answered four ways: WHO GETS SAVED TONIGHT, AND WHO DECIDED.
//
//   luck    chocolate   US S14. Every queen holds a bar; one is golden. A
//                       queen sent home by the lip sync opens hers. Found
//                       once (Bosco, ep 12) and the twist is over.
//           tank        US S17. The queen who lost the lip sync picks a lever
//                       on the Badonka Dunk Tank. One lever dunks the judge
//                       and saves her. Saved twice (Hormona Lisa, Arrietty),
//                       retired by a mini challenge in ep 10.
//   holder  beaver      Canada S4-S6, CvtW S2. The maxi winner saves one of
//                       the bottom three BEFORE the lip sync. Two sing.
//           baguette    France S4. The maxi winner hands the baguette to a
//                       queen — herself included — and SHE saves one of the
//                       bottom three. Twice the holder was in the bottom and
//                       saved herself (Holly White ep 3, Lana Cotta ep 6).
//
// Checked against the fandom wikitext, not remembered. The chart marks every
// one of these the same way — the queen's own call plus a yellow (#ffed00)
// border — so a save is a MARKER on a result, never a seventh result.
//
// ── THERE IS STILL NO VOTE ────────────────────────────────────────────
// Canada's All Stars 1 ran the beaver as a room vote ("Golden Beaver Voting
// History"). That version is not built and must not be: one queen decides,
// alone, or chance does. The panel still ranks and the host still makes the
// call; a save acts on the call after it is made.
//
// PLAIN DATA ONLY on `state.saves` — it is serialised with the season and
// snapshotted per episode, so a re-run rebuilds the same tank.
import { ballotSelfishness } from './rate.js';
import { noise } from './perform.js';

export const SAVE_KINDS = {
  chocolate: {
    mode: 'luck', name: 'The Golden Chocolate Bar', short: 'Chocolate Bar',
    color: '#c8962e', chartNote: 'Saved by the Golden Bar',
    desc: 'Every queen is handed a sealed chocolate bar on her first night, and exactly one of them hides a golden ticket. Nobody may open hers until she is sent home: a queen who loses the lip sync unwraps her bar on the stage, and if it is golden she stays and nobody goes home that night. The golden bar can save one queen once, and it can just as easily sit unopened in a finalist\'s bag all season. Nobody knows who has it — not even the queen holding it.',
  },
  tank: {
    mode: 'luck', name: 'The Badonka Dunk Tank', short: 'Dunk Tank',
    color: '#38bdf8', chartNote: 'Saved by the Dunk Tank',
    desc: 'A dunk tank sits on the main stage with a row of levers in front of it, and exactly one lever drops the judge in the seat into the water. A queen who loses the lip sync picks one lever and pulls. Miss, and she sashays away and that lever is gone for good, so every pull makes the next one likelier. Hit, and the judge goes under, she stays, nobody goes home, and the tank is refilled with every lever back in play. The tank is drained and retired once the room gets small enough.',
  },
  beaver: {
    mode: 'holder', name: 'The Golden Beaver', short: 'Golden Beaver',
    color: '#e0b43c', chartNote: 'Saved by the Golden Beaver',
    desc: 'Every week the panel names a bottom THREE instead of two, and the queen who won the maxi challenge holds the Golden Beaver. Before the lip sync she chooses one of the three and saves her; the other two lip sync for their lives. She decides alone — a kind queen saves the one who deserved it least to be there or a friend, a strategic one keeps a threat on the stage. The two she did not choose remember it. From the second episode on, while five or more queens remain.',
  },
  baguette: {
    mode: 'holder', name: 'The Golden Baguette', short: 'Golden Baguette',
    color: '#d9a441', chartNote: 'Saved by the Golden Baguette',
    desc: 'Every week the panel names a bottom THREE, and the maxi winner is handed the Golden Baguette — but she does not have to use it. She gives it to any queen in the room, herself included, and whoever holds it saves one of the three before the lip sync; the other two sing for their lives. A winner can pass it to a friend in the bottom, who will save herself, or keep it and play kingmaker. The gift and the save both cost bonds. From the second episode on, while five or more queens remain.',
  },
};

export const saveKind = id => (id && SAVE_KINDS[id]) || null;

const clampInt = (v, lo, hi, dflt) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt;
};

/**
 * The season's save, before anybody performs. `null` when the season plays
 * none, which is how every reader tells a save season apart.
 */
export function initSaves({ kind, cast = [], rng, levers = 4, retireAt = 8 }) {
  const k = saveKind(kind);
  if (!k) return null;
  if (kind === 'chocolate') {
    return {
      kind, handed: [], opened: [], found: false,
      // Drawn uniformly and never shown. A bar is not earned.
      golden: cast.length ? cast[Math.floor(rng() * cast.length)] : null,
    };
  }
  if (kind === 'tank') {
    const n = clampInt(levers, 2, 8, 4);
    return {
      kind, levers: n, left: Array.from({ length: n }, (_, i) => i + 1),
      dunk: 1 + Math.floor(rng() * n), dunks: 0, pulls: [],
      retireAt: clampInt(retireAt, 4, 20, 8), retired: false, introduced: false,
    };
  }
  return { kind, introduced: false, uses: [] };
}

/** Is the save live on this night, before the call is made. */
export function saveLiveTonight(saves, { living = 0, epNum = 1, blocked = false } = {}) {
  if (!saves || blocked) return false;
  if (saves.kind === 'chocolate') return !saves.found;
  if (saves.kind === 'tank') return !saves.retired;
  // A holder needs a winner, a bottom three and somebody left to be safe.
  return epNum >= 2 && living >= 5;
}

/* ── WHAT A QUEEN MEANS TO THE ONE CHOOSING ────────────────────────────
   Three terms, all proportional, and the chooser's own appetite decides how
   much the last two weigh against each other:
     bond    she saves her friends                        (everybody)
     merit   she saves the queen who least deserved to be there
     threat  she keeps the dangerous one on the stage     (a schemer)
   `ballotSelfishness` is the same read the legacy choice and the Rate-a-Queen
   ballots use, so a hero behaves like a hero here too: it is zero for every
   nice archetype. */
function threatOf(name, state, players) {
  const rec = state.record?.[name] || [];
  const wins = rec.filter(r => r === 'WIN').length;
  const highs = rec.filter(r => r === 'HIGH').length;
  const lip = Number(players[name]?.drag?.lipsync);
  return wins * 1.2 + highs * 0.5 + (Number.isFinite(lip) ? lip / 10 : 0.5);
}

function chooseSaved({ chooser, pool, state, players, bond, rng }) {
  const app = ballotSelfishness(players[chooser]);
  // `pool` is best-first, so a lower index is the queen the panel liked more.
  const scored = pool.map((q, i) => {
    if (q === chooser) return { q, s: Infinity, why: 'self' };
    const merit = (pool.length - 1 - i) / Math.max(1, pool.length - 1);
    const b = Number(bond(chooser, q)) || 0;
    const s = b * 0.35
      + merit * (1 - app) * 1.6
      - threatOf(q, state, players) * app * 0.9
      + noise(rng, 0.6);
    const why = app >= 0.35 ? 'strategy' : b >= 3 ? 'friend' : 'merit';
    return { q, s, why };
  }).sort((x, y) => y.s - x.s);
  return { saved: scored[0].q, why: scored[0].why, appetite: app };
}

/** The baguette's first decision: who she hands it to. */
function chooseRecipient({ winner, living, pool, players, bond, rng }) {
  const app = ballotSelfishness(players[winner]);
  const scored = living.map(q => {
    const inPool = pool.includes(q);
    const s = q === winner
      ? 0.8 + app * 3 + noise(rng, 0.6)
      : (Number(bond(winner, q)) || 0) * 0.45
        + (inPool ? 0.8 * (1 - app) : 0)
        + noise(rng, 0.6);
    return { q, s };
  }).sort((x, y) => y.s - x.s);
  return scored[0].q;
}

/**
 * A holder night. Called with the call as the host made it; returns the
 * decision and the call as it stands after the save. Pure apart from `rng`.
 *
 * `pool` is the named bottom three, best-first (`[...atRisk, ...bottom]`).
 */
export function holderSave({ saves, winner, pool, living, state, players, bond, rng }) {
  if (!winner || pool.length < 3) return null;
  const recipient = saves.kind === 'baguette'
    ? chooseRecipient({ winner, living, pool, players, bond, rng })
    : winner;
  const pick = chooseSaved({ chooser: recipient, pool, state, players, bond, rng });
  const singers = pool.filter(q => q !== pick.saved);
  return {
    kind: saves.kind, mode: 'holder', winner, holder: recipient,
    kept: recipient === winner, pool: [...pool], saved: pick.saved,
    selfSave: pick.saved === recipient, why: pick.why, singers,
  };
}

/** What a holder night does to the room. Returns {bond, pop, tv} like an event. */
export function holderEffects(res, bond) {
  const out = { bond: [], pop: {}, tv: {} };
  const h = res.holder;
  if (res.saved !== h) out.bond.push([h, res.saved, 2]);
  for (const q of res.singers) {
    // "You chose her over me" cuts deeper from a friend.
    const was = Math.max(0, Number(bond(h, q)) || 0);
    out.bond.push([h, q, -(1 + was * 0.15)]);
  }
  if (res.kind === 'baguette' && !res.kept) out.bond.push([res.winner, h, 1.5]);
  out.pop[h] = res.why === 'strategy' ? -0.5 : res.selfSave ? 0 : 0.5;
  if (res.kind === 'baguette' && res.kept) out.pop[res.winner] = (out.pop[res.winner] || 0) - 0.3;
  out.pop[res.saved] = (out.pop[res.saved] || 0) + 0.4;
  out.tv[h] = 1;
  out.tv[res.saved] = (out.tv[res.saved] || 0) + 0.5;
  return out;
}

/**
 * A luck night: every queen the lip sync is sending home tries her luck, in
 * the order she was sent. Mutates `saves` (bars opened, levers pulled) and
 * returns one entry per attempt.
 */
export function luckSave({ saves, losers, rng }) {
  const tries = [];
  for (const q of losers) {
    if (saves.kind === 'chocolate') {
      if (saves.found || saves.opened.includes(q)) continue;
      saves.opened.push(q);
      const golden = q === saves.golden;
      if (golden) saves.found = true;
      tries.push({ queen: q, saved: golden, kind: 'chocolate' });
    } else if (saves.kind === 'tank') {
      if (saves.retired || !saves.left.length) continue;
      const before = [...saves.left];
      const lever = before[Math.floor(rng() * before.length)];
      const hit = lever === saves.dunk;
      saves.pulls.push({ queen: q, lever, hit });
      if (hit) {
        // The tank is refilled: every lever back, a new one wired.
        saves.dunks += 1;
        saves.left = Array.from({ length: saves.levers }, (_, i) => i + 1);
        saves.dunk = 1 + Math.floor(rng() * saves.levers);
      } else {
        saves.left = before.filter(x => x !== lever);
      }
      tries.push({ queen: q, saved: hit, kind: 'tank', lever, levers: before });
    }
  }
  return tries;
}

/** What a luck night does. The winner of the song is not thrilled. */
export function luckEffects(tries, songWinner) {
  const out = { bond: [], pop: {}, tv: {} };
  for (const t of tries) {
    out.tv[t.queen] = (out.tv[t.queen] || 0) + (t.saved ? 2 : 0.5);
    out.pop[t.queen] = (out.pop[t.queen] || 0) + (t.saved ? 2 : 0.3);
    if (t.saved && songWinner && songWinner !== t.queen) {
      out.bond.push([songWinner, t.queen, -0.5]);
    }
  }
  return out;
}
