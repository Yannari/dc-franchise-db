// ══════════════════════════════════════════════════════════════════════
// rr/story/director.js — what a leg airs, in what order
// ══════════════════════════════════════════════════════════════════════
//
// Manual §19.2 step 4, rebuilt for one clock (spec §8). Runs after the leg is played and
// touches no game state except the season's line ledger (only aired scenes spend their words)
// and its story memory (which storylines the viewer is following). A dropped candidate costs
// nothing.
//
// TIERS, against a leg budget:
//   0 must   Don's opener and every mat moment, the twists, a sabotage, a betrayal, a break-up,
//            a confession, a medevac, a team's exit: what the leg IS
//   1 due    every team at every task it ran (the user's rule: no team skipped for being late),
//            and the next step of the 3–4 storylines the season follows
//   2 story  the other storyline steps and chains, and interviews about what aired
//   3 colour the rest, while the budget lasts
// GUARDS, per leg: one blow-up a team; one romance beat a person; nothing warm between two people
// after they rowed; an interview only about a moment that aired; a chained moment brings its cause.
// The episode runs in clock order: teams at the same minute cut between each other, and the end of
// a close leg plays as a race.
import { SCENES } from '../scenes.js';
import { writeScene } from '../script/write.js';

export const MUST = new Set(['don-opener', 'don-place', 'don-elim', 'don-arrives', 'don-fakeout', 'don-rule', 'don-ruling',
  'boomerang-found', 'boomerang-decide', 'boomerang-hit', 'boomerang-vote', 'yield', 'zip-it', 'save-used', 'medevac-choice',
  'speed-bump', 'surrender', 'reward', 'call-home', 'int-exit', 'console', 'goodbye-kiss', 'int-bleachers',
  'confession', 'breakup', 'back-together', 'alliance-betrayal', 'deal-broken', 'leader-shift', 'quit-task', 'snap',
  'push', 'ram', 'steal', 'kidnap-pet', 'course-sabotage', 'fake-shortcut', 'mind-game', 'admin-sabotage', 'revenge',
  'comeuppance', 'save-your-enemy', 'rescue']);
// two people who rowed this leg don't get a warm scene after it (making up is not warm, it's the repair)
export const WARM = new Set(['bond-moment', 'celebrate', 'small-talk']);
// kinds that are always a blow-up
export const ROW = new Set(['snap']);
const ROW_ENDINGS = { blame: ['blow-up'], 'old-wound': ['explodes'], 'silent-treatment': ['breaks'], shove: ['shove'] };
const isRow = s => ROW.has(s.kind) || (ROW_ENDINGS[s.kind] || []).includes(s.data?.ending);
// between two teams: after a clash this leg, nothing friendly between them (manual §19.4 "one pair, two moods")
export const SOUR_X = new Set(['trash-talk', 'gloat', 'shove', 'accusation', 'confront', 'mock-the-struggle', 'alliance-betrayal', 'deal-broken']);
export const WARM_X = new Set(['small-talk', 'alliance-pitch', 'alliance-check', 'share-info', 'help-offer', 'mentor', 'tag-along']);
const teamsKey = s => (s.data?.team && s.data?.other ? [s.data.team, s.data.other].sort().join('|') : null);

// beyond what must air and every team at every task (about 40 for twelve teams): the real show runs about 60 moments
export const legBudget = teams => Math.round(8 + 1.5 * teams);
// storylines the season follows at once
const FOLLOWED = 4;

const people = (st, id) => (id && st.teams[id] ? [st.teams[id].a, st.teams[id].b] : []);
const teamOf = (st, n) => Object.keys(st.teams).find(id => st.teams[id].a === n || st.teams[id].b === n);

// how much a moment changed (what makes one task moment worth more than another)
function weight(sc) {
  let w = 0;
  for (const e of sc.data?.effects || []) {
    if (e[0] === 'bond' || e[0] === 'teams') w += Math.abs(e[3]);
    else if (e[0] === 'rivalry') w += e[3];
    else if (e[0] === 'time' || e[0] === 'pending') w += Math.abs(e[2]) / 20;
    else if (e[0] === 'mind') w += Math.abs(e[3]) / 10;
    else w += 0.5;
  }
  return w;
}

function taskEnding(row) {
  if (row.quit) return 'quit';
  if (row.switched) return 'switched';
  if (!row.fails) return 'first-try';
  return row.fails >= 4 ? 'struggling' : 'after-fails';
}

// A task beat: the director's own moment for a team at a task, from the task log. The one doing a Botch
// speaks as a; the side they ran is named; a team's first task of the leg can air as its arrival at the task
// and its last as the finish (`kind`), when nothing about the run itself needs telling.
function taskBeat(state, row, i, kind = 'task-try') {
  const [x, y] = people(state, row.team);
  const [a, b] = row.kind === 'botch' && row.who && [x, y].includes(row.who) ? [row.who, row.who === x ? y : x] : [x, y];
  return { id: `task:${row.leg}:${row.team}:${row.stretch}:${i}`, leg: row.leg, kind, who: [a, b], seenBy: [a, b],
    data: { ending: kind === 'task-try' ? taskEnding(row) : 'any', team: row.team, stretch: row.stretch, t: row.from,
      switched: row.switched, quit: row.quit, side: row.side,
      snap: row.snap ? { ...row.snap, fails: row.fails, side: row.side ?? row.snap.side, botcher: row.who ?? row.snap.botcher } : null } };
}

// The storylines the season follows: the open threads with the most aired steps, then the oldest.
function followed(state) {
  const aired = state.storyAired || {};
  return new Set((state.threads || []).filter(t => !t.closed)
    .sort((x, y) => (aired[y.id] || 0) - (aired[x.id] || 0) || x.since - y.since).slice(0, FOLLOWED).map(t => t.id));
}

export function airLeg(state, leg) {
  const n = leg.n;
  const scenes = state.scenes.filter(s => s.leg === n);
  const byId = new Map(scenes.map(s => [s.id, s]));
  const follow = followed(state);
  const tierOf = s => {
    if (MUST.has(s.kind)) return 0;
    if ((s.data?.threadIds || []).some(id => follow.has(id))) return 1;
    if (s.data?.threadIds?.length || (s.data?.cause != null && !s.kind.startsWith('int-'))) return 2;
    return 3;
  };

  const picked = new Map();            // id -> tier
  const rowed = new Set(), blew = new Set(), romance = new Set();
  const pairOf = s => s.who.slice(0, 2).sort().join('|');
  const ok = s => {
    if (WARM.has(s.kind) && rowed.has(pairOf(s))) return false;
    if (isRow(s) && s.data?.team && blew.has(s.data.team)) return false;
    if (SCENES[s.kind]?.family === 4 && (s.data?.facts?.lovers || []).some(x => romance.has(x))) return false;
    return true;
  };
  const take = (s, tier) => {
    picked.set(s.id, tier);
    if (isRow(s)) { rowed.add(pairOf(s)); if (s.data?.team) blew.add(s.data.team); }
    if (SCENES[s.kind]?.family === 4) for (const x of s.data?.facts?.lovers || []) romance.add(x);
  };
  // (guards read in clock order: a row only blocks the warm scenes after it)
  const inOrder = list => [...list].sort((x, y) => (x.data?.t ?? 0) - (y.data?.t ?? 0) || x.id - y.id);

  // 0: must
  for (const s of inOrder(scenes.filter(s => tierOf(s) === 0))) take(s, 0);

  // 1: every team at every task it ran; a moment there of its own if it has one, else a task beat
  const beats = [];
  const rows = (state.taskLog || []).filter(r => r.leg === n);
  const firstOf = {}, lastOf = {};
  rows.forEach((r, i) => { firstOf[r.team] ??= i; lastOf[r.team] = i; });
  rows.forEach((r, i) => {
    const here = scenes.filter(s => s.data?.team === r.team && s.data?.stretch === r.stretch && !s.kind.startsWith('int-'));
    if (here.some(s => picked.has(s.id))) return;
    // the same kind twice at the same place and minute is enough (three hugs in a row read as a loop)
    const sameSpot = s => [...picked.keys()].filter(id => { const p = byId.get(id); return p && p.kind === s.kind
      && p.data?.stretch === s.data?.stretch && (p.data?.t ?? 0) === (s.data?.t ?? 0); }).length;
    const best = here.filter(ok).filter(s => sameSpot(s) < 2).sort((x, y) => weight(y) - weight(x) || x.id - y.id)[0];
    if (best) { take(best, 1); return; }
    // a clean run says nothing about itself: the first one airs as getting there, the last as getting out
    const clean = !r.fails && !r.switched && !r.quit;
    const kind = clean && firstOf[r.team] === i ? 'task-start' : clean && lastOf[r.team] === i ? 'task-done' : 'task-try';
    beats.push(taskBeat(state, r, i, kind));
  });
  // ...and the followed storylines' steps
  for (const s of inOrder(scenes.filter(s => tierOf(s) === 1 && !picked.has(s.id)))) if (ok(s)) take(s, 1);

  // 2 and 3: against the budget
  // interviews have their own slots, taken after the moments they're about are chosen
  const INTERVIEWS = 6;
  let budget = legBudget(leg.order.length) - INTERVIEWS;
  // an episode airs at most two of the same optional kind (the third small talk is the one a viewer notices)
  const PER_KIND = 2;
  const optional = {};
  for (const tier of [2, 3]) {
    const cands = scenes.filter(s => !picked.has(s.id) && tierOf(s) === tier && !s.kind.startsWith('int-'))
      .sort((x, y) => weight(y) - weight(x) || x.id - y.id);
    for (const s of cands) {
      if (budget <= 0) break;
      if (!ok(s) || (optional[s.kind] || 0) >= PER_KIND) continue;
      take(s, tier);
      optional[s.kind] = (optional[s.kind] || 0) + 1;
      budget--;
    }
  }
  // a chained moment brings its cause
  for (const [id] of [...picked]) {
    const s = byId.get(id);
    const c = s?.data?.cause != null && !s.kind.startsWith('int-') ? byId.get(s.data.cause) : null;
    // the cause comes with its chain; if its kind is already aired twice, the chain carries a recap beat instead (writer)
    if (c && !picked.has(c.id) && (optional[c.kind] || 0) < PER_KIND) { take(c, 2); optional[c.kind] = (optional[c.kind] || 0) + 1; }
  }
  // interviews about what aired, in their own slots
  let ivSlots = INTERVIEWS;
  for (const s of scenes.filter(s => s.kind.startsWith('int-') && !picked.has(s.id))) {
    if (ivSlots <= 0) break;
    if (s.data?.about != null && picked.has(s.data.about) && s.kind !== 'int-exit' && s.kind !== 'int-bleachers'
      && (optional[s.kind] || 0) < PER_KIND) { take(s, 2); optional[s.kind] = (optional[s.kind] || 0) + 1; ivSlots--; }
  }
  // an interview whose moment didn't air doesn't either (int-exit is about the exit, which always airs)
  for (const [id] of [...picked]) {
    const s = byId.get(id);
    if (s?.kind.startsWith('int-') && s.data?.about != null && !picked.has(s.data.about)) picked.delete(id);
  }

  // two teams who clashed get nothing friendly after it, this leg (a must-air moment always stays)
  const soured = new Map();
  for (const id of [...picked.keys()].sort((x, y) => (byId.get(x).data?.t ?? 0) - (byId.get(y).data?.t ?? 0) || x - y)) {
    const s = byId.get(id), k = teamsKey(s);
    if (!k) continue;
    if (WARM_X.has(s.kind) && soured.has(k) && picked.get(id) > 0) { picked.delete(id); continue; }
    if (SOUR_X.has(s.kind)) soured.set(k, true);
  }
  // an interview about a moment that just left the cut leaves with it
  for (const [id] of [...picked]) {
    const s = byId.get(id);
    if (s?.kind.startsWith('int-') && s.data?.about != null && !picked.has(s.data.about)) picked.delete(id);
  }

  // the episode, in clock order
  const segs = [];
  for (const [id, tier] of picked) {
    const s = byId.get(id);
    const teams = [...new Set([s.data?.team, s.data?.other, ...s.who.map(x => teamOf(state, x))].filter(Boolean))];
    segs.push({ scene: s.id, kind: s.kind, ending: s.data?.ending ?? null, stretch: s.data?.stretch ?? null, t: s.data?.t ?? 0, teams,
      who: [...s.who], side: s.data?.snap?.side ?? null, tier, src: s });
  }
  for (const b of beats) segs.push({ scene: null, beat: b.id, kind: b.kind, ending: b.data.ending, stretch: b.data.stretch, t: b.data.t,
    teams: [b.data.team], who: [...b.who], side: b.data.side ?? null, tier: 1, src: b });
  segs.sort((x, y) => x.t - y.t || (typeof x.scene === 'number' ? x.scene : 1e9) - (typeof y.scene === 'number' ? y.scene : 1e9));

  // write what aired (only now are its words spent), and remember the storylines that moved
  state.storyAired ||= {};
  const unwritten = [];
  for (const seg of segs) {
    const w = writeScene(state, seg.src);
    seg.lines = w?.lines || null;
    seg.lineId = w?.lineId || null;
    if (!w) unwritten.push(seg.kind + (seg.ending ? '.' + seg.ending : ''));
    for (const id of seg.src.data?.threadIds || []) state.storyAired[id] = (state.storyAired[id] || 0) + 1;
    delete seg.src;
  }
  return { n, segments: segs, unwritten };
}
