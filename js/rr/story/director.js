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
import { SCENES, CLASH_KINDS, relFamOf } from '../scenes.js';
import { getPlace } from '../places.js';
import { writeScene, TASK_LINES } from '../script/write.js';
import { pickedOf } from '../script/facts.js';

export const MUST = new Set(['don-opener', 'don-demo', 'don-place', 'don-crown', 'don-elim', 'don-arrives', 'don-fakeout', 'don-rule', 'don-ruling',
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
export const SOUR_X = CLASH_KINDS;
export const WARM_X = new Set(['small-talk', 'alliance-pitch', 'alliance-check', 'share-info', 'help-offer', 'mentor', 'tag-along', 'watching-together']);
const teamsKey = s => (s.data?.team && s.data?.other ? [s.data.team, s.data.other].sort().join('|') : null);

// A big cast airs like the show, and at least BIG_CAST teams always get their full scenes (the user, 2026-10-18).
// Beyond those, a team with no story that leg (not in the top three or the bottom three, no penalty, nothing with
// another team, no storyline step, nothing that must air) is checked in by Don in a line beside the others like
// it, and its clean runs at a task are shown together. Who is quiet rotates: the teams hurried least so far get
// the spare full places first. Ten teams or fewer racing: every team's full scenes.
export const BIG_CAST = 10;
// what every team gets, story or not
const BACKGROUND = new Set(['don-place', 'don-opener', 'same-flight', 'int-bleachers']);

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
      // a picking task's result is only known after the pick: the beat carries it (the row's snap is from the arrival)
      snap: row.snap ? { ...row.snap, fails: row.fails, side: row.side ?? row.snap.side, botcher: row.who ?? row.snap.botcher,
        picked: row.right ?? row.snap.picked } : null } };
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
  // two teams' first clash this leg (aired or not: they clashed either way); nothing friendly between them after it
  const clash = new Map();
  for (const s of scenes) {
    const k = teamsKey(s);
    if (!k || !SOUR_X.has(s.kind)) continue;
    const c = clash.get(k);
    if (!c || (s.data?.t ?? 0) < (c.data?.t ?? 0) || ((s.data?.t ?? 0) === (c.data?.t ?? 0) && s.id < c.id)) clash.set(k, s);
  }
  const afterClash = s => {
    const c = WARM_X.has(s.kind) && clash.get(teamsKey(s));
    return !!c && ((c.data?.t ?? 0) < (s.data?.t ?? 0) || ((c.data?.t ?? 0) === (s.data?.t ?? 0) && c.id < s.id));
  };
  const ok = s => {
    if (afterClash(s)) return false;
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
  const pickStarts = {};
  rows.forEach((r, i) => { firstOf[r.team] ??= i; lastOf[r.team] = i; });
  rows.forEach((r, i) => {
    const here = scenes.filter(s => s.data?.team === r.team && s.data?.stretch === r.stretch && !s.kind.startsWith('int-'));
    if (here.some(s => picked.has(s.id))) return;
    // the same kind twice at the same place and minute is enough (three hugs in a row read as a loop)
    const sameSpot = s => [...picked.keys()].filter(id => { const p = byId.get(id); return p && p.kind === s.kind
      && p.data?.stretch === s.data?.stretch && (p.data?.t ?? 0) === (s.data?.t ?? 0); }).length;
    const best = here.filter(ok).filter(s => sameSpot(s) < 2).sort((x, y) => weight(y) - weight(x) || x.id - y.id)[0];
    // a challenge with its own lines is seen being done: a team's plain moment there (a hug, a pep talk) gives way
    // to the challenge itself; a story (another team, a storyline step, a cause) keeps its place
    const plain = s => !s.data?.other && !s.data?.threadIds?.length && s.data?.cause == null;
    if (best && !(TASK_LINES.has(r.stretch) && plain(best))) { take(best, 1); return; }
    // a clean run says nothing about itself: the first one airs as getting there, the last as getting out
    const clean = !r.fails && !r.switched && !r.quit;
    // a picking task's moment is the picking and how it went (the spices: all five, most, a guess)
    const kind = r.right != null ? 'task-try' : clean && firstOf[r.team] === i ? 'task-start' : clean && lastOf[r.team] === i ? 'task-done' : 'task-try';
    // ...and the first three teams there are seen arriving at it first: the challenge is set up once, then results
    if (r.right != null && (pickStarts[r.stretch] = (pickStarts[r.stretch] || 0) + 1) <= 3) {
      const arrive = taskBeat(state, r, i, 'task-start');
      arrive.id += ':arrive';
      beats.push(arrive);
    }
    beats.push(taskBeat(state, r, i, kind));
  });
  // a ride that is the leg's signature (the camel): the first three teams on it are seen riding, unless it went
  // wrong for them (their mishap already shows them on it)
  for (const s of (getPlace(leg.place)?.stretches || []).filter(s => s.ride)) {
    const hit = new Set(scenes.filter(x => x.kind === 'travel-mishap' && x.data?.stretch === s.id).map(x => x.data.team));
    const on = (leg.log || []).filter(l => l.stretch === s.id && !hit.has(l.id)).sort((x, y) => x.from - y.from || (x.id < y.id ? -1 : 1)).slice(0, 3);
    for (const l of on) {
      const tm = state.teams[l.id];
      if (!tm) continue;
      beats.push({ id: `ride:${n}:${l.id}:${s.id}`, leg: n, kind: 'ride', who: [tm.a, tm.b], seenBy: [tm.a, tm.b],
        data: { ending: 'any', team: l.id, stretch: s.id, t: l.from,
          snap: { leg: n, place: leg.place, rel: tm.rel, relFam: relFamOf(tm.rel), identity: tm.identity ?? null, mode: s.mode } } });
    }
  }
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

  // a big cast: the teams with no story this leg check in together, and their clean runs at a task air together
  const teamsIn = s => [...new Set([s.data?.team, s.data?.other, ...s.who.map(x => teamOf(state, x))].filter(Boolean))];
  const montages = [];
  const N = leg.order.length;
  if (N > BIG_CAST) {
    const featured = new Set([...leg.order.slice(0, 3), ...leg.order.slice(-3), ...(leg.eliminated || [])]);
    if (leg.nonElim?.id) featured.add(leg.nonElim.id);
    for (const [id, p] of Object.entries(leg.penalties || {})) if (p) featured.add(id);
    // a story: something that must air, something with another team, a storyline's step (a hug after a task isn't one)
    for (const [id, tier] of picked) {
      const s = byId.get(id);
      if (BACKGROUND.has(s.kind)) continue;
      if (tier === 0 || s.data?.other || s.data?.threadIds?.length) for (const x of teamsIn(s)) featured.add(x);
    }
    // at least BIG_CAST teams in full; the spare places go to the teams hurried least so far
    state.quickCount ||= {};
    for (const id of [...leg.order].sort((x, y) => (state.quickCount[x] || 0) - (state.quickCount[y] || 0) || leg.order.indexOf(x) - leg.order.indexOf(y))) {
      if (featured.size >= BIG_CAST) break;
      featured.add(id);
    }
    for (const id of leg.order) if (!featured.has(id)) state.quickCount[id] = (state.quickCount[id] || 0) + 1;
    const quiet = id => id && !featured.has(id);
    // Don runs down the quiet ones, a line each, in the order they came in
    const checkins = [...picked.keys()].map(id => byId.get(id))
      .filter(s => s.kind === 'don-place' && !s.data?.midmat && quiet(s.data?.team) && ['plain', 'bored'].includes(s.data?.ending))
      .sort((x, y) => (x.data.place ?? 0) - (y.data.place ?? 0));
    let run = [];
    const flush = () => {
      if (!run.length) return;
      montages.push({ scene: run[0].id, scenes: run.map(s => s.id), kind: 'mat-montage', ending: 'any', stretch: 'mat',
        t: run[0].data?.t ?? 0, teams: run.map(s => s.data.team), who: run.flatMap(s => s.who), side: null, tier: 0,
        srcs: run.map(s => ({ ...s, kind: 'mat-montage', data: { ...s.data, ending: 'any' } })) });
      run = [];
    };
    for (const s of checkins) {
      picked.delete(s.id);
      if (run.length && s.data.place !== run.at(-1).data.place + 1) flush();
      run.push(s);
    }
    flush();
    // clean runs at the same task, two or more quiet teams: one shared beat
    const CLEAN = b => b.kind === 'task-start' || b.kind === 'task-done' || (b.kind === 'task-try' && b.data.ending === 'first-try');
    const byStretch = {};
    for (const b of beats) if (CLEAN(b) && quiet(b.data.team)) (byStretch[b.data.stretch] ||= []).push(b);
    for (const [stretch, group] of Object.entries(byStretch)) {
      if (group.length < 2) continue;
      for (const b of group) beats.splice(beats.indexOf(b), 1);
      const first = [...group].sort((x, y) => x.data.t - y.data.t)[0];
      const ids = group.map(b => b.data.team);
      montages.push({ scene: null, beat: `taskm:${n}:${stretch}`, kind: 'task-montage', ending: 'any', stretch, t: first.data.t,
        teams: ids, who: group.flatMap(b => b.who), side: null, tier: 1,
        src: { ...first, id: `taskm:${n}:${stretch}`, kind: 'task-montage', data: { ...first.data, ending: 'any', teamsList: ids } } });
    }
  }

  // the episode, in clock order
  const segs = [...montages];
  for (const [id, tier] of picked) {
    const s = byId.get(id);
    const teams = teamsIn(s);
    segs.push({ scene: s.id, kind: s.kind, ending: s.data?.ending ?? null, stretch: s.data?.stretch ?? null, t: s.data?.t ?? 0, teams,
      who: [...s.who], side: s.data?.snap?.side ?? null, tier, src: s });
  }
  for (const b of beats) segs.push({ scene: null, beat: b.id, kind: b.kind, ending: b.data.ending, stretch: b.data.stretch, t: b.data.t,
    teams: [b.data.team], who: [...b.who], side: b.data.side ?? null, picked: pickedOf(b.data.snap?.picked), tier: 1, src: b });
  segs.sort((x, y) => x.t - y.t || (typeof x.scene === 'number' ? x.scene : 1e9) - (typeof y.scene === 'number' ? y.scene : 1e9));

  // write what aired (only now are its words spent), and remember the storylines that moved
  state.storyAired ||= {};
  const unwritten = [];
  for (const seg of segs) {
    // a check-in run is one line from Don per team
    const ws = (seg.srcs || [seg.src]).map(src => writeScene(state, src));
    const lines = ws.flatMap(w => w?.lines || []);
    seg.lines = lines.length ? lines : null;
    seg.lineId = ws.map(w => w?.lineId).filter(Boolean).join(',') || null;
    if (ws.some(w => !w)) unwritten.push(seg.kind + (seg.ending ? '.' + seg.ending : ''));
    for (const src of seg.srcs || [seg.src]) for (const id of src.data?.threadIds || []) state.storyAired[id] = (state.storyAired[id] || 0) + 1;
    delete seg.src;
    delete seg.srcs;
  }
  return { n, segments: segs, unwritten };
}
