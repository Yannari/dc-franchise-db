// ══════════════════════════════════════════════════════════════════════
// dr/saves.js — the four season-long saves
// ══════════════════════════════════════════════════════════════════════
//
// One question, answered four ways: WHO GETS SAVED TONIGHT, AND WHO DECIDED.
//
// THE CHRONOLOGY, off the fandom wikitext (2026-09-16):
//   luck    chocolate   US S14. The split premiere's two losers came back,
//                       and the bars arrived with the FULL cast: June
//                       Jambalaya (ep 3) was the first to open one ("It's
//                       chocolate"). A queen sent home by the lip sync opens
//                       hers. Found once (Bosco, ep 12) and it is over.
//           tank        US S17. Introduced ep 1 (Ru asks for a volunteer).
//                       Dunks saved Hormona Lisa (ep 2) and Arrietty (ep 5);
//                       episodes 6-9 were four misses in a row, so a tank
//                       that removes pulled levers needs five or more. A
//                       mini challenge retired it in ep 10, with 8 left.
//   holder  beaver      Canada S4-S6, CvtW S2. The maxi winner saves one of
//                       a bottom three BEFORE the lip sync; two sing. Every
//                       elimination week (CvtW S2 used it on ep 1; the S4-S6
//                       premieres sent nobody home) and never the
//                       semi-final. A double win is two saves out of a
//                       bottom four (S6 ep 3: Mya and Van).
//           baguette    France S4. LAST WEEK'S ELIMINATED QUEEN walks back
//                       in and hands the baguette to a queen of her choice,
//                       who saves one of the bottom three (eps 2-6: Creatine
//                       -> Margarette -> La Harpie, Malawitte -> Holly White
//                       -> herself ...). No elimination last week (ep 1, and
//                       ep 7 after ep 6 sent nobody home) means no baguette.
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
    desc: 'A dunk tank sits on the main stage with a row of levers in front of it, and exactly one lever drops the judge in the seat into the water. A queen who loses the lip sync picks one lever and pulls. Miss, and she sashays away and that lever is gone for good, so every pull makes the next one likelier. Hit, and the judge goes under, she stays, nobody goes home, and the tank is refilled with every lever back in play. It is there from the first episode, and once the room is down to its last eight a mini challenge drains it for good.',
  },
  beaver: {
    mode: 'holder', name: 'The Golden Beaver', short: 'Golden Beaver',
    color: '#e0b43c', chartNote: 'Saved by the Golden Beaver',
    desc: 'Every week the panel names a bottom THREE instead of two, and the queen who won the maxi challenge holds the Golden Beaver. Before the lip sync she chooses one of the three and saves her; the other two lip sync for their lives. She decides alone — a kind queen saves the one who deserved it least to be there or a friend, a strategic one keeps a threat on the stage. The two she did not choose remember it. It runs every elimination week until the semi-final, and on a double win the bottom grows to four and each winner saves one.',
  },
  baguette: {
    mode: 'holder', name: 'The Golden Baguette', short: 'Golden Baguette',
    color: '#d9a441', chartNote: 'Saved by the Golden Baguette',
    desc: 'The queen eliminated last week walks back onto the main stage holding the Golden Baguette and gives it to any queen still in the race. That week the panel names a bottom THREE, and whoever holds the baguette saves one of them before the lip sync; the other two sing for their lives. A queen handed the baguette while standing in the bottom saves herself. The one who went home decides who gets the power, so a friendship can outlive an elimination. No elimination last week means no baguette, and it stops before the semi-final.',
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
export function initSaves({ kind, cast = [], rng, levers = 6, retireAt = 8 }) {
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
    const n = clampInt(levers, 2, 10, 6);
    return {
      kind, levers: n, left: Array.from({ length: n }, (_, i) => i + 1),
      dunk: 1 + Math.floor(rng() * n), dunks: 0, pulls: [],
      retireAt: clampInt(retireAt, 4, 20, 8), retired: false, introduced: false,
    };
  }
  return { kind, introduced: false, uses: [] };
}

/**
 * Is the save live on this night, before the call is made.
 *
 * A holder save needs a bottom three plus a winner plus somebody safe (five),
 * and is never the semi-final: the week that leaves the finale's number. The
 * baguette also needs somebody to hand it over, a queen who went home last
 * week.
 */
export function saveLiveTonight(saves, {
  living = 0, blocked = false, finaleSize = 4, giver = null,
} = {}) {
  if (!saves || blocked) return false;
  if (saves.kind === 'chocolate') return !saves.found;
  if (saves.kind === 'tank') return !saves.retired;
  if (living < 5 || living <= finaleSize + 1) return false;
  return saves.kind === 'baguette' ? !!giver : true;
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

/**
 * The baguette's first decision, made by the queen who went home last week:
 * who gets it. She gives it to a friend, and a friend standing in the bottom
 * is the one who needs it most. The appetite for the game only sharpens how
 * much the friendship counts over the rescue.
 */
function chooseRecipient({ giver, living, pool, players, bond, rng }) {
  const app = ballotSelfishness(players[giver]);
  const scored = living.filter(q => q !== giver).map(q => {
    const b = Number(bond(giver, q)) || 0;
    const s = b * (0.45 + app * 0.3)
      + (pool.includes(q) ? 0.25 * (1 - app) : 0)
      + noise(rng, 0.7);
    return { q, s };
  }).sort((x, y) => y.s - x.s);
  return scored[0]?.q || null;
}

/**
 * A holder night. Called with the call as the host made it: `pool` is the
 * named bottom, best-first (`[...atRisk, ...bottom]`), three queens, or four
 * on a double win. Each chooser saves one, in turn, out of what is left.
 *
 *   beaver    the choosers are the week's winners (two on a double win)
 *   baguette  `giver` (last week's exit) names the one chooser
 */
export function holderSave({ saves, winners = [], giver = null, pool, living, state, players, bond, rng }) {
  const choosers = saves.kind === 'baguette'
    ? [chooseRecipient({ giver, living, pool, players, bond, rng })].filter(Boolean)
    : winners.slice(0, Math.max(1, pool.length - 2));
  if (!choosers.length || pool.length - choosers.length < 2) return null;
  let left = [...pool];
  const picks = [];
  for (const c of choosers) {
    const pick = chooseSaved({ chooser: c, pool: left, state, players, bond, rng });
    picks.push({ holder: c, saved: pick.saved, why: pick.why, selfSave: pick.saved === c });
    left = left.filter(q => q !== pick.saved);
  }
  return {
    kind: saves.kind, mode: 'holder',
    winner: winners[0] || null, winners: [...winners], giver,
    holder: picks[0].holder, saved: picks[0].saved, why: picks[0].why, selfSave: picks[0].selfSave,
    picks, savedAll: picks.map(x => x.saved),
    pool: [...pool], singers: left,
  };
}

/** What a holder night does to the room. Returns {bond, pop, tv} like an event. */
export function holderEffects(res, bond) {
  const out = { bond: [], pop: {}, tv: {} };
  const add = (m, k, v) => { m[k] = (m[k] || 0) + v; };
  for (const pk of res.picks) {
    const h = pk.holder;
    if (!pk.selfSave) out.bond.push([h, pk.saved, 2]);
    add(out.pop, h, pk.why === 'strategy' ? -0.5 : pk.selfSave ? 0 : 0.5);
    add(out.pop, pk.saved, 0.4);
    add(out.tv, h, 1);
    add(out.tv, pk.saved, 0.5);
  }
  for (const q of res.singers) {
    for (const pk of res.picks) {
      // "You chose her over me" cuts deeper from a friend.
      const was = Math.max(0, Number(bond(pk.holder, q)) || 0);
      out.bond.push([pk.holder, q, -(1 + was * 0.15)]);
    }
  }
  // The queen who went home chose who got the power, and that is remembered.
  if (res.giver && res.holder) {
    out.bond.push([res.giver, res.holder, 1.5]);
    add(out.tv, res.giver, 0.5);
  }
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
      // No bar yet (a split half, before the rejoin), or hers is already open.
      if (saves.found || saves.opened.includes(q) || !(saves.handed || []).includes(q)) continue;
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
