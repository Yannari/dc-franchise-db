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
//                       THE ROW IS SET ONCE (the user's rule, 2026-09-16):
//                       how many levers and which of them are live is fixed
//                       when the season starts and never rewired. A pulled
//                       lever is gone whether it hit or missed, the lever a
//                       queen picks is a blind, uniform choice among those
//                       left, and once every live lever has been found the
//                       tank is done. The bars are the same: which queens hold
//                       gold is drawn at the start and never moves.
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
import { noise } from './perform.js';
import { powerMind, timesSpared, deliveredSince } from './power.js';

export const SAVE_KINDS = {
  chocolate: {
    mode: 'luck', name: 'The Golden Chocolate Bar', short: 'Chocolate Bar',
    color: '#c8962e', chartNote: 'Saved by the Golden Bar',
    desc: 'Every queen is handed a sealed chocolate bar once the whole cast is in the room, and one of them hides a golden ticket (a season can hide more). Nobody may open hers until she is sent home: a queen who loses the lip sync unwraps her bar on the stage, and if it is golden she stays and nobody goes home that night. Each golden bar saves once, and one can just as easily sit unopened in a finalist\'s bag all season. Nobody knows who has it, not even the queen holding it.',
  },
  tank: {
    mode: 'luck', name: 'The Badonka Dunk Tank', short: 'Dunk Tank',
    color: '#38bdf8', chartNote: 'Saved by the Dunk Tank',
    desc: 'A dunk tank sits on the main stage with a row of levers in front of it, and one lever (a season can wire more) drops the judge in the seat into the water. A queen who loses the lip sync gets one pull. Miss, and she sashays away and that lever is gone for good, so every pull makes the next one likelier. Hit, and the judge goes under, she stays, nobody goes home, and that lever is spent too. Which levers are live is decided before the season starts and never changes, and once every live lever has been found the tank is drained for good. It is there from the first episode, and if any live lever is still hidden when the room is down to its last eight, a mini challenge drains it anyway.',
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
      // Wired once, here, for the whole season.
      live: drawDistinct(all, liveN, rng), dunks: 0, pulls: [], drained: false,
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
  if (saves.kind === 'tank') return !saves.retired && !saves.drained && (saves.left || []).length > 0;
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

/* ── THE LEDGER AND THE MIND LIVE IN js/dr/power.js NOW ───────────────
   One account, shared with the legacy choice (All Stars): one queen sparing
   another and one queen ending another are the same fact about the same
   relationship, and two ledgers that never met could not carry it.

   Re-exported under the names four modules and two suites already call, so
   this move changes NO behaviour -- tests/dr-saves.test.js is the guard for
   that, and it was green before the move and after it. */
export { deliveredSince, recordUse, initLedger } from './power.js';
export const holderMind = powerMind;
export const timesSaved = timesSpared;

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
export function campaignTargets({ saves, winners = [], giver = null, pool, living, bond, likelyTop = [] }) {
  /* ── AND ON A LEGACY NIGHT, NOBODY HOLDS IT YET ──
     The power belongs to whoever wins a song that has not happened. So the
     bottom works the queens the critiques favoured, which is what the real
     seasons show: the lobbying is in Untucked, before the top two sing, and a
     queen who spent it on the wrong person spent it for nothing. */
  if (likelyTop.length) return likelyTop.filter(q => !pool.includes(q));
  if (saves?.kind === 'beaver') return winners.filter(Boolean);
  if (!giver) return [];
  const likely = living.filter(q => !pool.includes(q))
    .sort((a, b) => (Number(bond(giver, b)) || 0) - (Number(bond(giver, a)) || 0))[0];
  return likely ? [likely] : [];
}

/**
 * The campaign, in three rounds, while the room waits in Untucked.
 *
 *   1. THE PITCH. Each bottom queen makes her case to the queen with the
 *      power, with a REASON drawn from where she actually stands: she is a
 *      friend, she is no threat, she did better than the other two tonight,
 *      she has the track record, she would never survive that song, she will
 *      win the lip sync so save somebody else, a deal, a debt. How much a
 *      reason moves the holder depends on who the holder is: "I'm no threat"
 *      works on a strategist, "I deserved it more" on a fair-minded queen.
 *   2. THE PUSHBACK. The other bottom queens do not let a pitch stand: they
 *      rebut it, expose a deal, trash a rival, or have it out with each
 *      other. Every exchange costs bonds.
 *   3. THE ANSWER. The holder is not a wall: she stalls, gives somebody hope
 *      (which is remembered if she does not follow through), snaps at a queen
 *      pushing too hard, or asks the question that matters.
 * The room adds a friend vouching, a safe queen stirring the pot, and the
 * holder torn between friends.
 *
 * Returns `{ events, pleas }`. Each event is `{ id, round, a, b, c?, n?,
 * bond:[[x,y,d]], pop:{}, plea:[[h,q,d]] }` and the caller applies it;
 * `pleas[holder][queen]` is what the holder's decision reads. Nothing here
 * decides the save.
 */
export function runCampaign({
  saves, targets, pool, living, players, bond, rng, ep, state = {}, exclude = [],
  /* ── THE ALL STARS DIALS ──────────────────────────────────────────
     A Beaver night has ONE queen holding the save and a bottom of three, so
     three pitches and a couple of rebuttals fill the lounge. A legacy night
     has a bottom of TWO and the power belongs to whichever of two queens wins
     a song — and measured against a played season it produced four beats in
     a twenty-five-scene Untucked, which is not the era's Untucked at all.
     `eachTarget` makes every queen in danger work BOTH of them (which is
     what she would do, and it is where the mind games come from: two
     different cases, told an hour apart). `lobby` lets the queens who are
     SAFE push a name, which on All Stars is half the drama in the room.
     Defaults keep the save's own nights byte-identical. */
  eachTarget = false, pushCap = 3, lobby = [],
}) {
  /* Moves whose PREMISE is the song. On an All Stars legacy night nobody in
     the bottom sings — the top two do — so "those two can lip sync, I cannot"
     and "don't save me, I'll win it" describe a mechanic that did not run.
     Excluded by the caller rather than rewritten here, because the save's own
     nights still want them. */
  const skip = new Set(exclude);
  const events = [];
  const pleas = {};
  if (!targets.length) return { events, pleas };
  let cur = null;
  const plea = (h, q, d) => {
    (pleas[h] ||= {})[q] = (pleas[h][q] || 0) + d;
    if (cur) (cur.plea ||= []).push([h, q, d]);
  };
  const B = (x, y) => Number(bond(x, y)) || 0;
  const appOf = n => holderMind(players[n]).strategy;
  const mind = n => holderMind(players[n]);
  const again = q => timesSaved(saves, q);
  const lip = n => num(players[n]?.drag?.lipsync);
  const wins = n => (state.record?.[n] || []).filter(r => r === 'WIN').length;
  const threat = n => threatOf(n, state, players);
  const push = ev => { events.push(ev); return ev; };
  const holderFor = p => [...targets].filter(t => t !== p).sort((x, y) => B(p, y) - B(p, x))[0];

  // ── ROUND 1: THE PITCH ────────────────────────────────────────────
  const pitched = [];
  const pitchPairs = [];
  for (const p of pool) {
    const hs = eachTarget ? targets.filter(t => t !== p) : [holderFor(p)].filter(Boolean);
    for (const h of hs) pitchPairs.push([p, h]);
  }
  for (const [p, h] of pitchPairs) {
    const P = players[p];
    if (!h) continue;
    const others = pool.filter(q => q !== p);
    const b = B(p, h);
    const app = appOf(h);
    const owed = (saves.debts || []).some(d => !d.paid && d.debtor === h && d.creditor === p);
    const leastThreat = others.every(q => threat(p) <= threat(q));
    const bestTonight = pool.indexOf(p) === 0;
    const worstLip = others.every(q => lip(p) <= lip(q));
    const bestLip = others.every(q => lip(p) >= lip(q));
    /* "SHE HAS HAD HER TURN." A queen never saved, standing next to one who
       has been, has a reason nobody else has — and it grows with every save
       the other queen has had. */
    const repeat = others.filter(q => again(q) > 0).sort((x, y) => again(y) - again(x))[0];
    const opts = [
      { id: 'pitch-my-turn', w: repeat && !again(p) ? 0.6 + again(repeat) * 0.8 : 0 },
      { id: 'debt-called', w: owed ? 8 : 0 },
      { id: 'promise', w: canScheme(P) ? 1.6 + appOf(p) * 2 : 0 },
      { id: 'pitch-friend', w: b >= 2 ? 1 + b * 0.4 : 0 },
      { id: 'pitch-no-threat', w: leastThreat ? 1.4 : 0 },
      { id: 'pitch-deserve', w: bestTonight ? 1.6 : 0 },
      { id: 'pitch-record', w: wins(p) >= 1 ? 1.2 + wins(p) * 0.3 : 0 },
      { id: 'pitch-lipsync-mercy', w: worstLip ? 1.3 : 0 },
      { id: 'pitch-noble', w: bestLip && stat(P, 'boldness') >= 6 && !canScheme(P) ? 1.1 : 0 },
      { id: 'cold-shoulder', w: b <= -2 && stat(P, 'boldness') >= 6 ? 2 : 0 },
      { id: 'breakdown', w: stat(P, 'temperament') <= 3 ? 1 : 0.1 },
      { id: 'honest-plea', w: 0.6 },
    ];
    const o = weighted(rng, opts.filter(x => !skip.has(x.id))) || weighted(rng, opts);
    const ev = { id: o.id, round: 1, a: p, b: h, bond: [], pop: {} };
    cur = ev;
    switch (o.id) {
      case 'debt-called': plea(h, p, 0.4); ev.bond.push([p, h, 0.2]); break;
      case 'pitch-my-turn': {
        // Lands on a queen who spreads it around; a merit queen barely hears it.
        const m = mind(h);
        ev.c = repeat; ev.t = again(repeat);
        plea(h, p, 0.15 + m.fair * 1.1 * Math.min(2, ev.t) - m.merit * 0.2);
        ev.bond.push([p, repeat, -0.8]);
        break;
      }
      case 'promise':
        plea(h, p, 0.6 + app * 0.8); ev.bond.push([p, h, 0.5]);
        (saves.promises ||= []).push({ from: p, to: h, ep, open: true });
        break;
      case 'pitch-friend': plea(h, p, 0.4 + b * 0.12); ev.bond.push([p, h, 0.4]); break;
      case 'pitch-no-threat': plea(h, p, 0.3 + app * 1.4); ev.pop[p] = -0.1; break;
      case 'pitch-deserve': ev.c = pool[pool.length - 1]; plea(h, p, 0.4 + (1 - app) * 1.0); ev.bond.push([p, ev.c, -0.6]); break;
      case 'pitch-record':
        ev.n = wins(p);
        // A record is a reason to save her and a reason not to.
        plea(h, p, 0.3 + (1 - app) * 0.7 - app * 0.8); ev.pop[p] = 0.2;
        break;
      case 'pitch-lipsync-mercy': plea(h, p, 0.3 + (1 - app) * 0.7); ev.pop[p] = 0.2; break;
      case 'pitch-noble':
        // She asks for the song. Good television, and it costs her the save.
        plea(h, p, -0.5); ev.pop[p] = 0.8; ev.bond.push([p, h, 0.4]);
        for (const q of others) ev.bond.push([p, q, 0.3]);
        break;
      case 'cold-shoulder': plea(h, p, -0.4); ev.bond.push([p, h, -0.5]); ev.pop[p] = 0.5; break;
      case 'breakdown': plea(h, p, app < 0.15 ? 0.5 : -0.2); ev.pop[p] = 0.3; break;
      default: plea(h, p, 0.5 + Math.max(0, b) * 0.08); ev.bond.push([p, h, 0.3]);
    }
    pitched.push(push(ev));
  }

  // ── ROUND 2: THE PUSHBACK ─────────────────────────────────────────
  // Nobody lets a pitch stand. Each exchange hangs off the pitch it answers,
  // and the queen answered can fire straight back.
  const replies = [];
  for (const ev of pitched) {
    const p = ev.a; const h = ev.b;
    for (const r of pool.filter(q => q !== p)) {
      const R = players[r];
      const cool = B(r, p) <= 2 || canScheme(R);
      if (!cool) continue;
      const opts = [];
      if (ev.id === 'pitch-no-threat' && wins(p) >= 1) opts.push('rebut-threat');
      if (ev.id === 'pitch-deserve') opts.push('rebut-deserve');
      if (ev.id === 'promise' && stat(R, 'intuition') >= 5) opts.push('expose-deal');
      if (ev.id === 'pitch-record') opts.push('rebut-record');
      if (again(p) > 0 && !again(r) && ev.id !== 'pitch-my-turn') opts.push('rebut-turn-over');
      if (ev.id === 'pitch-friend' && (canScheme(R) || B(r, p) <= 0)) opts.push('rebut-friend');
      if (!['cold-shoulder', 'breakdown', 'pitch-noble'].includes(ev.id)) opts.push('counter');
      for (const id of opts) {
        const w = (id === 'counter' ? 0.8 : id === 'rebut-turn-over' ? 1 + again(p) * 0.7 : 1.6)
          + Math.max(0, -B(r, p)) * 0.3;
        replies.push({ id, r, p, h, w, after: ev });
      }
    }
  }
  // Two queens who cannot stand each other, in the same bottom.
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      if (B(pool[i], pool[j]) <= -3) {
        const after = pitched.find(e => e.a === pool[j]) || pitched[0];
        replies.push({ id: 'shouting-match', r: pool[i], p: pool[j], h: holderFor(pool[i]) || targets[0], w: 2.5, after });
      }
    }
  }
  const schemers = pool.filter(q => canScheme(players[q]));
  if (schemers.length) {
    const r = pick(rng, schemers);
    const victims = pool.filter(q => q !== r && B(r, q) <= 1);
    if (victims.length) {
      const v = pick(rng, victims);
      replies.push({ id: 'throw-under', r, p: v, h: holderFor(r) || targets[0], w: 1.5,
        after: pitched.find(e => e.a === r) || pitched[0] });
    }
  }
  const threads = new Map(pitched.map(e => [e, []]));
  const wantPush = Math.min(replies.length, (pushCap - 1) + (rng() < 0.5 ? 1 : 0));
  const usedPair = new Set();
  for (let k = 0; k < wantPush; k++) {
    const o = weighted(rng, replies.filter(x => !usedPair.has(`${x.r}|${x.p}`)));
    if (!o) break;
    usedPair.add(`${o.r}|${o.p}`);
    replies.splice(replies.indexOf(o), 1);
    const hNice = appOf(o.h) < 0.15;
    const ev = { id: o.id, round: 2, a: o.r, b: o.h, c: o.p, bond: [], pop: {} };
    cur = ev;
    switch (o.id) {
      case 'rebut-threat': plea(o.h, o.p, -0.2 - appOf(o.h) * 0.8); ev.bond.push([o.r, o.p, -1.5]); break;
      case 'rebut-deserve': plea(o.h, o.p, -0.3); plea(o.h, o.r, 0.2); ev.bond.push([o.r, o.p, -1.2]); break;
      case 'expose-deal':
        plea(o.h, o.p, hNice ? -0.8 : -0.2); ev.bond.push([o.r, o.p, -2]); ev.pop[o.p] = -0.3;
        break;
      case 'rebut-record': plea(o.h, o.p, -0.4 * appOf(o.h) - 0.1); ev.bond.push([o.r, o.p, -1]); break;
      case 'rebut-turn-over': {
        const m = mind(o.h);
        ev.t = again(o.p);
        plea(o.h, o.p, -(0.1 + m.fair * 0.9 * Math.min(2, ev.t)) + m.merit * 0.1);
        ev.bond.push([o.r, o.p, -1.2]);
        break;
      }
      case 'rebut-friend': plea(o.h, o.p, -0.3); ev.bond.push([o.r, o.p, -1.2]); ev.bond.push([o.r, o.h, -0.3]); break;
      case 'counter': plea(o.h, o.r, 0.25); plea(o.h, o.p, -0.2); ev.bond.push([o.r, o.p, -0.8]); break;
      case 'shouting-match':
        plea(o.h, o.p, -0.2); plea(o.h, o.r, -0.2);
        ev.bond.push([o.r, o.p, -2]); ev.pop[o.r] = 0.2; ev.pop[o.p] = 0.2;
        break;
      default:   // throw-under
        plea(o.h, o.p, -0.7); ev.bond.push([o.r, o.p, -2]);
        if (hNice) { plea(o.h, o.r, -0.5); ev.pop[o.r] = -0.5; ev.backfired = true; } else ev.pop[o.r] = -0.3;
    }
    threads.get(o.after)?.push(ev);
    // And she fires back, if she is the kind who does.
    const P = players[o.p];
    /* "YOU SAVED ME AND I DELIVERED." Told her turn is over, a saved queen
       who has won or placed since has the answer, and it is a merit answer. */
    const since = o.id === 'rebut-turn-over' ? deliveredSince(saves, o.p, state) : null;
    if (since && since.wins + since.highs > 0 && rng() < 0.4 + stat(P, 'boldness') * 0.05) {
      const m = mind(o.h);
      const back = { id: 'saved-delivered', round: 2, a: o.p, b: o.h, c: o.r, t: again(o.p),
        y: since.wins ? (since.wins === 1 ? 'a win' : `${since.wins} wins`) : (since.highs === 1 ? 'a high' : `${since.highs} highs`),
        bond: [[o.p, o.r, -0.6]], pop: { [o.p]: 0.3 } };
      cur = back;
      plea(o.h, o.p, 0.1 + m.merit * (0.5 + since.wins * 0.3 + since.highs * 0.15));
      threads.get(o.after)?.push(back);
    } else if (o.id !== 'shouting-match' && (stat(P, 'boldness') >= 6 || stat(P, 'temperament') <= 4) && rng() < 0.7) {
      const good = stat(P, 'social') >= 6;
      const back = { id: 'clap-back', round: 2, a: o.p, b: o.h, c: o.r, bond: [[o.p, o.r, -1]], pop: { [o.p]: 0.2, [o.r]: 0.1 } };
      cur = back;
      plea(o.h, o.p, good ? 0.2 : -0.15);
      threads.get(o.after)?.push(back);
    }
  }
  // The conversation, in order: each pitch followed by what it started.
  events.length = 0;
  for (const ev of pitched) events.push(ev, ...(threads.get(ev) || []));

  // ── ROUND 3: THE ANSWER ───────────────────────────────────────────
  for (const h of targets) {
    const H = players[h];
    const standing = pool.map(q => ({ q, v: (pleas[h] || {})[q] || 0 })).sort((x, y) => y.v - x.v);
    const pushy = events.find(e => e.b === h && ['promise', 'throw-under', 'expose-deal'].includes(e.id));
    const friend = pool.filter(q => B(h, q) >= 3).sort((x, y) => B(h, y) - B(h, x))[0];
    const turnTalk = events.some(e => e.b === h && ['rebut-turn-over', 'pitch-my-turn'].includes(e.id));
    const repeatQ = pool.filter(q => again(q) > 0).sort((x, y) => again(y) - again(x))[0];
    const m = mind(h);
    const opts = [
      // "I'm not keeping score" / "Everybody deserves a turn": her mind, out loud.
      { id: 'holder-no-score', w: turnTalk ? m.merit * 3 : 0 },
      { id: 'holder-fair', w: turnTalk ? m.fair * 3 : 0 },
      { id: 'holder-stall', w: 1.2 },
      { id: 'holder-hope', w: friend ? 1.4 : 0 },
      { id: 'holder-snap', w: pushy && stat(H, 'temperament') <= 5 ? 1.6 : 0 },
      { id: 'holder-question', w: standing.length >= 2 ? 1.2 : 0 },
    ];
    const o = weighted(rng, opts);
    const ev = { id: o.id, round: 3, a: h, bond: [], pop: {} };
    cur = ev;
    if (o.id === 'holder-no-score') {
      ev.b = repeatQ; ev.t = again(repeatQ);
      plea(h, repeatQ, 0.25);
      const talker = events.find(e => e.b === h && ['rebut-turn-over', 'pitch-my-turn'].includes(e.id));
      if (talker) { ev.c = talker.a; ev.bond.push([h, talker.a, -0.4]); }
    } else if (o.id === 'holder-fair') {
      ev.b = repeatQ; ev.t = again(repeatQ);
      plea(h, repeatQ, -0.3);
      ev.bond.push([h, repeatQ, -0.3]);
    } else if (o.id === 'holder-stall') {
      ev.b = standing[0]?.q;
      for (const q of pool) ev.bond.push([h, q, -0.15]);
    } else if (o.id === 'holder-hope') {
      ev.b = friend;
      plea(h, friend, 0.4);
      ev.bond.push([h, friend, 0.5]);
      (saves.hopes ||= []).push({ from: h, to: friend, ep });
    } else if (o.id === 'holder-snap') {
      ev.b = pushy.id === 'promise' ? pushy.a : pushy.a;
      plea(h, ev.b, -0.4);
      ev.bond.push([h, ev.b, -1]);
      ev.pop[h] = 0.2;
    } else {
      // "Why should it be you?" — the two leading, and the better talker wins it.
      const [x, y] = standing;
      ev.b = x.q; ev.c = y.q;
      const talker = num(players[x.q]?.stats?.social) >= num(players[y.q]?.stats?.social) ? x.q : y.q;
      ev.winner = talker;
      ev.w = talker;
      plea(h, talker, 0.35);
      ev.pop[talker] = 0.2;
    }
    push(ev);
  }

  // ── THE ROOM ─────────────────────────────────────────────────────
  const safe = living.filter(v => !pool.includes(v) && !targets.includes(v));
  const vouchers = [];
  for (const v of safe) for (const q of pool) if (B(v, q) >= 4) vouchers.push({ v, q });
  if (vouchers.length) {
    const { v, q } = pick(rng, vouchers);
    const h = targets.find(t => t !== q) || targets[0];
    cur = push({ id: 'vouch', round: 2, a: v, b: h, c: q, bond: [[v, h, 0.2], [v, q, 0.5]], pop: { [v]: 0.2 } });
    plea(h, q, 0.5);
  }
  const stirrers = safe.filter(v => VILLAINS.has(players[v]?.archetype));
  if (stirrers.length && rng() < 0.6) {
    const v = pick(rng, stirrers);
    const q = pick(rng, pool);
    const h = holderFor(q) || targets[0];
    const caught = stat(players[h], 'intuition') >= 7;
    cur = push({ id: caught ? 'stir-caught' : 'stir', round: 2, a: v, b: h, c: q,
      bond: caught ? [[h, v, -1.5]] : [[q, h, -1]], pop: { [v]: caught ? -0.5 : 0.2 } });
    if (!caught) plea(h, q, -0.4);
  }
  for (const h of targets) {
    const friends = pool.filter(q => B(h, q) >= 4);
    if (friends.length >= 2) {
      cur = null;
      push({ id: 'torn', round: 3, a: h, b: friends[0], c: friends[1],
        bond: friends.map(f => [h, f, 0.2]), pop: { [h]: 0.3 } });
      break;
    }
  }
  cur = null;
  // In the order the room lived it: the threads, the room, then her answer.
  const rank = e => (e.round === 3 ? 2 : ['vouch', 'stir', 'stir-caught'].includes(e.id) ? 1 : 0);
  const ordered = events.map((e, i) => ({ e, i })).sort((x, y) => rank(x.e) - rank(y.e) || x.i - y.i).map(x => x.e);
  return { events: ordered, pleas };
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
     repeat  she was saved already                         (more, if she spreads it around)
   The weights come from `holderMind`: every queen has all three pulls, so a
   hero still plays a little and a villain still sees merit. */
function threatOf(name, state, players) {
  const rec = state.record?.[name] || [];
  const wins = rec.filter(r => r === 'WIN').length;
  const highs = rec.filter(r => r === 'HIGH').length;
  const lip = Number(players[name]?.drag?.lipsync);
  return wins * 1.2 + highs * 0.5 + (Number.isFinite(lip) ? lip / 10 : 0.5);
}

function chooseSaved({ chooser, pool, state, players, bond, rng, saves, pleas = {} }) {
  const me = players[chooser];
  const mind = holderMind(me);
  const app = mind.strategy;
  const loyal = stat(me, 'loyalty');
  const hot = 10 - stat(me, 'temperament');
  // `pool` is best-first, so a lower index is the queen the panel liked more.
  const scored = pool.map((q, i) => {
    if (q === chooser) return { q, s: Infinity, base: Infinity, n: 0, why: 'self' };
    const merit = (pool.length - 1 - i) / Math.max(1, pool.length - 1);
    const b = Number(bond(chooser, q)) || 0;
    const debt = (saves?.debts || []).some(d => !d.paid && d.debtor === chooser && d.creditor === q);
    const grudge = (saves?.grudges || []).some(g => g.from === chooser && g.to === q);
    const p = (pleas[chooser] || {})[q] || 0;
    /* ALREADY SAVED. Weighed by how much she spreads it around, softened
       when the queen made good on the last one (a merit read), and a close
       friend feels it less. Never a rule: a probability. */
    const n = timesSaved(saves, q);
    const since = n ? deliveredSince(saves, q, state) : { wins: 0, highs: 0 };
    const repeat = n
      ? Math.min(2.5, n) * (mind.fair * 0.6 - mind.merit * (since.wins * 0.4 + since.highs * 0.2))
        * (1 - Math.max(0, b) * 0.06)
      : 0;
    const base = b * 0.35
      + merit * (1 - app) * (0.6 + mind.merit) * 1.6
      - threatOf(q, state, players) * app * 0.9
      + p * (1 - app * 0.4)
      + (debt ? 1.8 * (0.5 + loyal / 20) : 0)
      - (grudge ? 1.0 * (0.5 + hot / 20) : 0)
      + noise(rng, 0.6);
    const s = base - repeat;
    const mine = (saves?.uses || []).some(u => (u.picks || []).some(x => x.holder === chooser && x.saved === q));
    let why = debt ? 'debt'
      : app >= 0.4 ? 'strategy'
        : p >= 0.8 ? 'plea'
          : b >= 3 ? 'friend' : 'merit';
    // Saved again: on merit it is "she earned it", as a friend it is favouritism.
    if (n && why === 'merit') why = 'merit-again';
    else if (n && why === 'friend' && mine) why = 'favorite';
    return { q, s, base, n, why, grudge };
  }).sort((x, y) => y.s - x.s);
  // A grudge that cost somebody her save is worth saying out loud.
  const snubbed = scored.slice(1).filter(x => x.grudge).map(x => x.q);
  /* SPREAD AROUND: the queen she would have saved had she not been saved
     already lost it to that history, and the one who got it never had it. */
  const top = scored[0];
  const unpenalised = [...scored].sort((x, y) => y.base - x.base)[0];
  const passed = unpenalised.q !== top.q && unpenalised.n > 0 && !top.n && top.q !== chooser ? unpenalised.q : null;
  return {
    saved: top.q, why: passed && !['debt', 'strategy'].includes(top.why) ? 'spread' : top.why,
    appetite: app, snubbed, passed, times: top.n,
  };
}

/**
 * The baguette's first decision, made by the queen who went home last week:
 * who gets it. She gives it to a friend, and a friend standing in the bottom
 * is the one who needs it most. The appetite for the game only sharpens how
 * much the friendship counts over the rescue.
 */
function chooseRecipient({ giver, living, pool, players, bond, rng }) {
  const app = holderMind(players[giver]).strategy;
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
    picks.push({ holder: c, saved: pk.saved, why: pk.why, selfSave: pk.saved === c, snubbed: pk.snubbed,
      passed: pk.passed || null, times: pk.times || 0 });
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
  const out = { repaid: [], promises: [], hopes: [] };
  saves.debts ||= []; saves.grudges ||= []; saves.promises ||= []; saves.fallout ||= [];
  // "Don't worry about it," she said in Untucked — and then did not save her.
  for (const hp of saves.hopes || []) {
    if (hp.ep !== ep || hp.settled) continue;
    hp.settled = true;
    if (res.singers.includes(hp.to) && res.picks.some(x => x.holder === hp.from)) {
      out.hopes.push({ from: hp.from, to: hp.to });
    }
  }
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
    // Her favourite, again: the two left to sing say it, and the room hears it.
    if (pk.why === 'favorite') {
      for (const q of res.singers) out.bond.push([q, h, -0.8]);
      add(out.pop, h, -0.4);
      add(out.tv, h, 0.5);
    }
    // Passed over for having been saved before: she takes it personally.
    if (pk.passed) out.bond.push([pk.passed, h, -0.6]);
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
  // Hope given and taken away is its own wound.
  for (const hp of memory.hopes || []) { out.bond.push([hp.from, hp.to, -1.5]); add(out.pop, hp.from, -0.3); }
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
      if (saves.retired || saves.drained || !saves.left.length) continue;
      const before = [...saves.left];
      const liveNow = liveLevers(saves).filter(x => before.includes(x));
      if (!liveNow.length) { saves.drained = true; continue; }
      // A blind pick: every lever still in the row is as likely as any other.
      const lever = before[Math.floor(rng() * before.length)];
      const hit = liveNow.includes(lever);
      saves.pulls.push({ queen: q, lever, hit });
      // Spent either way. Nothing is rewired.
      saves.left = before.filter(x => x !== lever);
      if (hit) saves.dunks += 1;
      const liveLeft = liveNow.length - (hit ? 1 : 0);
      if (!liveLeft) saves.drained = true;
      tries.push({ queen: q, saved: hit, kind: 'tank', lever, levers: before, liveCount: liveNow.length, liveLeft });
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
