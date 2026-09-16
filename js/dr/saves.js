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
//                       One pull per queen, always.
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
// ── THE CAMPAIGN, AND WHAT IT LEAVES BEHIND ──────────────────────────
// The room works the queen with the power. Canada S4: "I'm gonna need to make
// a lot of new best friends" (Denim, on hearing the rule); "It's time to kiss
// some ass" (Nearah Nuff). Kiki Coe saved Melinda Verga (ep 4) and Melinda
// saved her back (ep 5). Kitten Kaboodle spared Girlfriend (ep 2) and sent
// her home the next week. So:
//   - a campaign before the save: pleas, promises, a friend vouching, a
//     queen throwing another under the bus. Each one moves a PLEA WEIGHT the
//     holder reads when she decides, and moves bonds;
//   - DEBTS: a saved queen owes her holder, and repays it when she can;
//   - GRUDGES: a queen passed over holds it against the holder;
//   - PROMISES: "save me and I'll save you". Kept or broken the next time the
//     power changes hands, and a broken one is a fight the week after.
//
// ── THERE IS STILL NO VOTE ────────────────────────────────────────────
// Canada's All Stars 1 ran the beaver as a room vote, with the bottom three
// pleading to everybody. That version is not built and must not be: the
// room can plead, and one queen still decides alone.
//
// PLAIN DATA ONLY on `state.saves` — it is serialised with the season and
// snapshotted per episode, so a re-run rebuilds the same tank.
import { ballotSelfishness } from './rate.js';
import { noise } from './perform.js';

export const SAVE_KINDS = {
  chocolate: {
    mode: 'luck', name: 'The Golden Chocolate Bar', short: 'Chocolate Bar',
    color: '#c8962e', chartNote: 'Saved by the Golden Bar',
    desc: 'Every queen is handed a sealed chocolate bar once the whole cast is in the room, and one of them hides a golden ticket (a season can hide more). Nobody may open hers until she is sent home: a queen who loses the lip sync unwraps her bar on the stage, and if it is golden she stays and nobody goes home that night. Each golden bar saves once, and one can just as easily sit unopened in a finalist\'s bag all season. Nobody knows who has it, not even the queen holding it.',
  },
  tank: {
    mode: 'luck', name: 'The Badonka Dunk Tank', short: 'Dunk Tank',
    color: '#38bdf8', chartNote: 'Saved by the Dunk Tank',
    desc: 'A dunk tank sits on the main stage with a row of levers in front of it, and one lever (a season can wire more) drops the judge in the seat into the water. A queen who loses the lip sync gets one pull. Miss, and she sashays away and that lever is gone for good, so every pull makes the next one likelier. Hit, and the judge goes under, she stays, nobody goes home, and the tank is refilled with every lever back in play. It is there from the first episode, and once the room is down to its last eight a mini challenge drains it for good.',
  },
  beaver: {
    mode: 'holder', name: 'The Golden Beaver', short: 'Golden Beaver',
    color: '#e0b43c', chartNote: 'Saved by the Golden Beaver',
    desc: 'Every elimination week the panel names a bottom THREE instead of two, and the queen who won the maxi challenge holds the Golden Beaver. Before she decides, the bottom three work on her: pleading, promising, and throwing each other under the bus. Then she saves one of them and the other two lip sync for their lives. A queen she saves owes her, and a queen she passes over remembers. It runs until the semi-final, and on a double win the bottom grows to four and each winner saves one.',
  },
  baguette: {
    mode: 'holder', name: 'The Golden Baguette', short: 'Golden Baguette',
    color: '#d9a441', chartNote: 'Saved by the Golden Baguette',
    desc: 'The queen eliminated last week walks back onto the main stage holding the Golden Baguette and gives it to any queen still in the race. That week the panel names a bottom THREE, and whoever holds the baguette saves one of them before the lip sync; the other two sing for their lives. The bottom three spend the wait courting whoever they think the baguette is going to. A queen handed it while standing in the bottom saves herself. No elimination last week means no baguette, and it stops before the semi-final.',
  },
};

export const saveKind = id => (id && SAVE_KINDS[id]) || null;

const clampInt = (v, lo, hi, dflt) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt;
};
const num = (v, d = 5) => (Number.isFinite(Number(v)) ? Number(v) : d);
const stat = (p, k) => num(p?.stats?.[k]);

// Distinct picks, without replacement.
function drawDistinct(list, k, rng) {
  const pool = [...list];
  const out = [];
  while (out.length < k && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

/**
 * The season's save, before anybody performs. `null` when the season plays
 * none, which is how every reader tells a save season apart.
 *
 * `goldens` — how many golden bars (1-3). `live` — how many live levers
 * (1-3, always at least one short of the total so a pull can miss).
 */
export function initSaves({ kind, cast = [], rng, levers = 6, retireAt = 8, goldens = 1, live = 1 }) {
  const k = saveKind(kind);
  if (!k) return null;
  const memory = { debts: [], grudges: [], promises: [], fallout: [] };
  if (kind === 'chocolate') {
    const golds = drawDistinct(cast, clampInt(goldens, 1, 3, 1), rng);
    return {
      kind, handed: [], opened: [], found: false, foundBy: [],
      // Drawn uniformly and never shown. A bar is not earned.
      goldens: golds, golden: golds[0] || null,
    };
  }
  if (kind === 'tank') {
    const n = clampInt(levers, 2, 10, 6);
    const liveN = clampInt(live, 1, Math.min(3, n - 1), 1);
    const all = Array.from({ length: n }, (_, i) => i + 1);
    return {
      kind, levers: n, liveCount: liveN, left: [...all],
      live: drawDistinct(all, liveN, rng), dunks: 0, pulls: [],
      retireAt: clampInt(retireAt, 4, 20, 8), retired: false, introduced: false,
    };
  }
  return { kind, introduced: false, uses: [], ...memory };
}

/** Old tanks carried one `dunk`; old bars one `golden`. */
function liveLevers(saves) {
  return Array.isArray(saves.live) ? saves.live : (saves.dunk ? [saves.dunk] : [1]);
}
function goldBars(saves) {
  return Array.isArray(saves.goldens) ? saves.goldens : (saves.golden ? [saves.golden] : []);
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

// ══════════════════════════════════════════════════════════════════════
// THE CAMPAIGN
// ══════════════════════════════════════════════════════════════════════

const VILLAINS = new Set(['villain', 'mastermind', 'schemer']);
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
/** The franchise rule: nice queens never scheme; neutrals only when built for it. */
function canScheme(p) {
  const a = p?.archetype || '';
  if (VILLAINS.has(a)) return true;
  if (NICE.has(a)) return false;
  return stat(p, 'strategic') >= 6 && stat(p, 'loyalty') <= 4;
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function weighted(rng, opts) {
  const total = opts.reduce((t, o) => t + Math.max(0, o.w), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const o of opts) { r -= Math.max(0, o.w); if (r <= 0) return o; }
  return opts[opts.length - 1];
}

/**
 * Who the bottom is working on. The beaver's winners, or — on a baguette
 * night — the queen the room expects the baguette to go to: the giver's
 * closest friend who is not herself in the bottom.
 */
export function campaignTargets({ saves, winners = [], giver = null, pool, living, bond }) {
  if (saves.kind === 'beaver') return winners.filter(Boolean);
  if (!giver) return [];
  const likely = living.filter(q => !pool.includes(q))
    .sort((a, b) => (Number(bond(giver, b)) || 0) - (Number(bond(giver, a)) || 0))[0];
  return likely ? [likely] : [];
}

/**
 * The campaign: one move per queen in the bottom, and up to two from the room.
 *
 * Returns `{ events, pleas }`. Each event is `{ id, a, b, c?, bond:[[x,y,d]],
 * pop:{}, note }` and the caller applies it; `pleas[holder][queen]` is the
 * weight the holder's decision reads. Nothing here decides the save.
 */
export function runCampaign({ saves, targets, pool, living, players, bond, rng, ep }) {
  const events = [];
  const pleas = {};
  if (!targets.length) return { events, pleas };
  let cur = null;   // the event being built, so its own plea moves ride on it
  const plea = (h, q, d) => {
    (pleas[h] ||= {})[q] = (pleas[h][q] || 0) + d;
    if (cur) (cur.plea ||= []).push([h, q, d]);
  };
  const B = (x, y) => Number(bond(x, y)) || 0;
  const appOf = n => ballotSelfishness(players[n]);

  for (const p of pool) {
    const P = players[p];
    // She works the holder she likes best, or the only one there is.
    const h = [...targets].filter(t => t !== p).sort((x, y) => B(p, y) - B(p, x))[0];
    if (!h) continue;
    const b = B(p, h);
    const owed = (saves.debts || []).some(d => !d.paid && d.debtor === h && d.creditor === p);
    const rivals = pool.filter(c => c !== p && B(p, c) <= 0);
    const opts = [
      { id: 'debt-called', w: owed ? 6 : 0 },
      { id: 'promise', w: canScheme(P) ? 2 + appOf(p) * 2 : 0 },
      { id: 'honest-plea', w: canScheme(P) ? 0.8 : 2.5 },
      { id: 'cold-shoulder', w: b <= -2 && stat(P, 'boldness') >= 6 ? 2.5 : 0 },
      { id: 'breakdown', w: stat(P, 'temperament') <= 3 ? 1.2 : 0.15 },
      { id: 'throw-under', w: canScheme(P) && rivals.length ? 1.6 : 0 },
    ];
    const o = weighted(rng, opts);
    if (!o) continue;
    const hNice = appOf(h) < 0.15;
    const ev = { id: o.id, a: p, b: h, bond: [], pop: {} };
    cur = ev;
    if (o.id === 'debt-called') {
      plea(h, p, 0.4);
      ev.bond.push([p, h, 0.2]);
    } else if (o.id === 'promise') {
      plea(h, p, 1.0);
      ev.bond.push([p, h, 0.5]);
      (saves.promises ||= []).push({ from: p, to: h, ep, open: true });
    } else if (o.id === 'honest-plea') {
      plea(h, p, 0.6 + Math.max(0, b) * 0.08);
      ev.bond.push([p, h, 0.3]);
    } else if (o.id === 'cold-shoulder') {
      plea(h, p, -0.4);
      ev.bond.push([p, h, -0.5]);
      ev.pop[p] = 0.5;
    } else if (o.id === 'breakdown') {
      plea(h, p, hNice ? 0.5 : -0.2);
      ev.pop[p] = 0.3;
    } else if (o.id === 'throw-under') {
      const c = pick(rng, rivals);
      ev.c = c;
      plea(h, c, -0.8);
      ev.bond.push([p, c, -2]);
      // A kind holder hears it for what it is.
      if (hNice) { plea(h, p, -0.5); ev.pop[p] = -0.5; ev.backfired = true; } else ev.pop[p] = -0.3;
    }
    events.push(ev);
  }

  // The room: a friend vouches, and a holder with two friends down there is torn.
  const safe = living.filter(v => !pool.includes(v) && !targets.includes(v));
  const vouchers = [];
  for (const v of safe) {
    for (const q of pool) if (B(v, q) >= 4) vouchers.push({ v, q });
  }
  if (vouchers.length) {
    const { v, q } = pick(rng, vouchers);
    const h = targets.find(t => t !== q) || targets[0];
    cur = { id: 'vouch', a: v, b: h, c: q, bond: [[v, h, 0.2], [v, q, 0.5]], pop: { [v]: 0.2 } };
    plea(h, q, 0.5);
    events.push(cur);
  }
  for (const h of targets) {
    const friends = pool.filter(q => B(h, q) >= 4);
    if (friends.length >= 2) {
      cur = null;
      events.push({
        id: 'torn', a: h, b: friends[0], c: friends[1],
        bond: friends.map(f => [h, f, 0.2]), pop: { [h]: 0.3 },
      });
      break;
    }
  }
  return { events, pleas };
}

// ══════════════════════════════════════════════════════════════════════
// THE DECISION
// ══════════════════════════════════════════════════════════════════════

/* ── WHAT A QUEEN MEANS TO THE ONE CHOOSING ────────────────────────────
   Proportional terms, and the chooser's own appetite decides how much the
   strategic ones weigh:
     bond    she saves her friends                        (everybody)
     merit   she saves the queen who least deserved to be there
     threat  she keeps the dangerous one on the stage     (a schemer)
     plea    what the campaign did                         (less, for a schemer)
     debt    she repays a queen who saved her              (more, if loyal)
     grudge  she does not save a queen who passed her over (more, if hot-headed)
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

function chooseSaved({ chooser, pool, state, players, bond, rng, saves, pleas = {} }) {
  const me = players[chooser];
  const app = ballotSelfishness(me);
  const loyal = stat(me, 'loyalty');
  const hot = 10 - stat(me, 'temperament');
  // `pool` is best-first, so a lower index is the queen the panel liked more.
  const scored = pool.map((q, i) => {
    if (q === chooser) return { q, s: Infinity, why: 'self' };
    const merit = (pool.length - 1 - i) / Math.max(1, pool.length - 1);
    const b = Number(bond(chooser, q)) || 0;
    const debt = (saves?.debts || []).some(d => !d.paid && d.debtor === chooser && d.creditor === q);
    const grudge = (saves?.grudges || []).some(g => g.from === chooser && g.to === q);
    const p = (pleas[chooser] || {})[q] || 0;
    const s = b * 0.35
      + merit * (1 - app) * 1.6
      - threatOf(q, state, players) * app * 0.9
      + p * (1 - app * 0.4)
      + (debt ? 1.8 * (0.5 + loyal / 20) : 0)
      - (grudge ? 1.0 * (0.5 + hot / 20) : 0)
      + noise(rng, 0.6);
    const why = debt ? 'debt'
      : app >= 0.35 ? 'strategy'
        : p >= 0.8 ? 'plea'
          : b >= 3 ? 'friend' : 'merit';
    return { q, s, why, grudge };
  }).sort((x, y) => y.s - x.s);
  // A grudge that cost somebody her save is worth saying out loud.
  const snubbed = scored.slice(1).filter(x => x.grudge).map(x => x.q);
  return { saved: scored[0].q, why: scored[0].why, appetite: app, snubbed };
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
export function holderSave({ saves, winners = [], giver = null, pool, living, state, players, bond, rng, pleas = {} }) {
  const choosers = saves.kind === 'baguette'
    ? [chooseRecipient({ giver, living, pool, players, bond, rng })].filter(Boolean)
    : winners.slice(0, Math.max(1, pool.length - 2));
  if (!choosers.length || pool.length - choosers.length < 2) return null;
  let left = [...pool];
  const picks = [];
  for (const c of choosers) {
    const pk = chooseSaved({ chooser: c, pool: left, state, players, bond, rng, saves, pleas });
    picks.push({ holder: c, saved: pk.saved, why: pk.why, selfSave: pk.saved === c, snubbed: pk.snubbed });
    left = left.filter(q => q !== pk.saved);
  }
  return {
    kind: saves.kind, mode: 'holder',
    winner: winners[0] || null, winners: [...winners], giver,
    holder: picks[0].holder, saved: picks[0].saved, why: picks[0].why, selfSave: picks[0].selfSave,
    picks, savedAll: picks.map(x => x.saved),
    pool: [...pool], singers: left,
  };
}

/**
 * What the save leaves behind, written into `saves` and returned so the
 * caller can narrate it: debts repaid and opened, grudges, and every open
 * promise this power changing hands has settled.
 */
export function settleMemory(saves, res, ep) {
  const out = { repaid: [], promises: [] };
  saves.debts ||= []; saves.grudges ||= []; saves.promises ||= []; saves.fallout ||= [];
  // Tonight's deals only stand if the deal was taken: "save me" and she did.
  for (const pr of saves.promises) {
    if (pr.open && pr.ep === ep && !res.picks.some(x => x.holder === pr.to && x.saved === pr.from)) {
      pr.open = false; pr.void = true;
    }
  }
  for (const pk of res.picks) {
    const repaid = saves.debts.find(d => !d.paid && d.debtor === pk.holder && d.creditor === pk.saved);
    if (repaid) { repaid.paid = ep; out.repaid.push({ holder: pk.holder, saved: pk.saved }); }
    if (!pk.selfSave) saves.debts.push({ debtor: pk.saved, creditor: pk.holder, ep, paid: false });
    for (const q of res.singers) {
      if (!saves.grudges.some(g => g.from === q && g.to === pk.holder)) {
        saves.grudges.push({ from: q, to: pk.holder, ep });
      }
    }
    // A promise from this holder to a queen in tonight's bottom is settled now.
    for (const pr of saves.promises) {
      if (!pr.open || pr.from !== pk.holder || pr.ep === ep || !res.pool.includes(pr.to)) continue;
      pr.open = false;
      const kept = res.savedAll.includes(pr.to) && res.picks.some(x => x.holder === pk.holder && x.saved === pr.to);
      pr.kept = kept;
      out.promises.push({ from: pr.from, to: pr.to, kept, madeEp: pr.ep });
      if (!kept) saves.fallout.push({ a: pr.to, b: pr.from, ep, kind: 'broken-promise' });
    }
  }
  return out;
}

/** What a holder night does to the room. Returns {bond, pop, tv} like an event. */
export function holderEffects(res, bond, memory = { repaid: [], promises: [] }) {
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
  // A debt paid back is a friendship made public.
  for (const r of memory.repaid) { out.bond.push([r.holder, r.saved, 1]); add(out.pop, r.holder, 0.4); }
  // A promise kept or broken is the loudest thing on the stage.
  for (const pr of memory.promises) {
    if (pr.kept) { out.bond.push([pr.from, pr.to, 1]); add(out.pop, pr.from, 0.3); }
    else { out.bond.push([pr.from, pr.to, -3]); add(out.pop, pr.from, -1); add(out.tv, pr.from, 1); }
  }
  return out;
}

/** A broken promise from last week, due in this week's cold open. */
export function takeFallout(saves, living) {
  if (!saves?.fallout?.length) return [];
  const due = saves.fallout.filter(f => living.includes(f.a) && living.includes(f.b));
  saves.fallout = [];
  return due;
}

// ══════════════════════════════════════════════════════════════════════
// LUCK
// ══════════════════════════════════════════════════════════════════════

/**
 * A luck night: every queen the lip sync is sending home tries her luck, in
 * the order she was sent. One bar, or one pull, each. Mutates `saves` (bars
 * opened, levers pulled) and returns one entry per attempt.
 */
export function luckSave({ saves, losers, rng }) {
  const tries = [];
  for (const q of losers) {
    if (saves.kind === 'chocolate') {
      // No bar yet (a split half, before the rejoin), or hers is already open.
      if (saves.found || saves.opened.includes(q) || !(saves.handed || []).includes(q)) continue;
      saves.opened.push(q);
      const golds = goldBars(saves);
      const golden = golds.includes(q);
      if (golden) {
        (saves.foundBy ||= []).push(q);
        if (saves.foundBy.length >= golds.length) saves.found = true;
      }
      tries.push({ queen: q, saved: golden, kind: 'chocolate', goldLeft: golds.length - (saves.foundBy || []).length });
    } else if (saves.kind === 'tank') {
      if (saves.retired || !saves.left.length) continue;
      const before = [...saves.left];
      const liveNow = liveLevers(saves).filter(x => before.includes(x));
      const lever = before[Math.floor(rng() * before.length)];
      const hit = liveNow.includes(lever);
      saves.pulls.push({ queen: q, lever, hit });
      if (hit) {
        // The tank is refilled: every lever back, fresh ones wired.
        saves.dunks += 1;
        const all = Array.from({ length: saves.levers }, (_, i) => i + 1);
        saves.left = all;
        saves.live = drawDistinct(all, saves.liveCount || liveNow.length || 1, rng);
      } else {
        saves.left = before.filter(x => x !== lever);
      }
      tries.push({ queen: q, saved: hit, kind: 'tank', lever, levers: before, liveCount: liveNow.length });
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
