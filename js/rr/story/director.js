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
import { teamRef, teamTag } from './previously.js';

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
// the moments a team checks in or is sent home, and what may still air of a team after Don has sent it home
const EXIT_KINDS = new Set(['don-elim', 'don-arrives', 'don-fakeout']);
const AFTER_EXIT = new Set(['int-exit', 'console', 'goodbye', 'goodbye-kiss', 'mat-montage', 'don-narrate']);
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

// Don's narration, placed where the real show puts it (episode 3, the user's goal transcript)
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen'];
const gapWords = m => (m < 40 ? 'half an hour' : m < 75 ? 'an hour' : m < 105 ? 'an hour and a half' : m < 150 ? 'two hours'
  : `${NUM[Math.round(m / 60)] || Math.round(m / 60)} hours`);
const TASK_STRETCH = ['allin', 'botch', 'either', 'superteam', 'route'];
function narrate(state, leg, scenes) {
  const n = leg.n, out = [];
  const add = (ending, t, slots) => out.push({ scene: null, beat: `narr:${n}:${ending}:${out.length}`, kind: 'don-narrate', ending, stretch: null,
    t, teams: [], who: [], side: null, tier: 0,
    src: { id: `narr:${n}:${ending}:${out.length}`, leg: n, kind: 'don-narrate', who: [], seenBy: [], data: { ending, t, slots, snap: { place: leg.place } } } });
  // the premiere: Don's welcome, before the first team turns up (the introductions follow it, then his rules)
  if (n === 1) add('welcome', -3, {});
  // the departure: last leg's winners first out of the Chill Zone (before Don's opener)
  const prev = (state.legs || []).find(l => l.n === n - 1);
  if (prev?.order?.[0]) add('depart', -1, { winners: teamTag(state, prev.order[0]) });
  // the flights: who's waiting for the next one, and each landing
  const flights = scenes.filter(s => s.kind === 'same-flight').sort((x, y) => x.data.flight - y.data.flight);
  if (flights.length >= 2) {
    // the wait is worth a line when a crowd is left at the gate ("one teams" was the bug)
    if (flights[1].data.teams.length >= 2) add('flight-wait', flights[0].data.t, { count: NUM[flights[1].data.teams.length] || String(flights[1].data.teams.length),
      gap: gapWords(flights[1].data.t - flights[0].data.t) });
    flights.forEach((f, k) => {
      if (f.data.lands == null) return;
      add(k ? 'flight-landed' : 'first-landed', f.data.lands, { flight: NUM[k + 1] });
    });
  }
  // the bridge: the leaders reach a later task while somebody is still at an earlier one
  const place = getPlace(leg.place);
  const tasks = (place?.stretches || []).filter(s => TASK_STRETCH.includes(s.kind) && s.called);
  const rows = (state.taskLog || []).filter(r => r.leg === n);
  tasks.forEach((s, i) => {
    if (!i) return;
    const here = rows.filter(r => r.stretch === s.id).sort((x, y) => x.from - y.from)[0];
    if (!here) return;
    const behind = tasks.slice(0, i).reverse().find(p => rows.some(r => r.stretch === p.id && r.to > here.from));
    if (behind) add('bridge', here.from, { team: teamRef(state, here.team), task: s.called, prevTask: behind.called });
  });
  // Don presents the Chill Zone just before the first team reaches it (not at the finale: its end is the stage)
  if (leg.kind !== 'final' && leg.times && leg.order[0] && leg.times[leg.order[0]] != null) add('chill', leg.times[leg.order[0]] - 2, {});
  // the bottom of an elimination leg: the last four still out there
  const N = leg.order.length;
  if (leg.kind === 'elim' && N >= 5 && leg.times) {
    const t = leg.times[leg.order[N - 5]];
    if (t != null) add('last-stretch', t + 1, { count: 'four' });
  }
  return out;
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
  const ending = kind === 'task-try' ? taskEnding(row) : 'any';
  // a try that took more than one go is a moment in the middle of it, not at the start (teams who arrived together
  // struggle on their own clocks)
  // ...and getting out of it is the end of it
  const t = (kind === 'task-done' || (kind === 'task-try' && row.right != null)) && row.to > row.from ? Math.round(row.to)
    : kind === 'task-try' && ending !== 'first-try' && row.to > row.from ? Math.round((row.from + row.to) / 2) : row.from;
  return { id: `task:${row.leg}:${row.team}:${row.stretch}:${i}`, leg: row.leg, kind, who: [a, b], seenBy: [a, b],
    data: { ending, team: row.team, stretch: row.stretch, t, from: row.from, to: row.to,
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
    // ...and at a challenge with its own lines, a team with a story there is still seen doing the challenge
    if (best && !(TASK_LINES.has(r.stretch) && plain(best))) { take(best, 1); if (!TASK_LINES.has(r.stretch)) return; }
    // a clean run says nothing about itself: the first one airs as getting there, the last as getting out
    const clean = !r.fails && !r.switched && !r.quit;
    // a picking task's moment is the picking and how it went (the spices: all five, most, a guess)
    const kind = r.right != null ? 'task-try' : clean && firstOf[r.team] === i ? 'task-start' : clean && lastOf[r.team] === i ? 'task-done' : 'task-try';
    // ...and the first three teams there are seen arriving at it first: the challenge is set up once, then results
    // (two at most in the same minute: teams who queued for the opening all arrive at once)
    const sameMinute = beats.filter(b => b.id.endsWith(':arrive') && b.data.stretch === r.stretch && b.data.t === r.from).length;
    if (r.right != null && sameMinute < 2 && (pickStarts[r.stretch] = (pickStarts[r.stretch] || 0) + 1) <= 3) {
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
  // the premiere meets its teams the way the show does: every one introduced as it turns up, after Don's welcome
  // and before his rules (the user, 2026-10-19). They arrive in an order the seed draws.
  if (n === 1) {
    const seed = Number(state.seed) || 1;
    const arrival = [...leg.order].sort((x, y) => ((Number(x.slice(1)) * 7919 + seed * 104729) % 1009) - ((Number(y.slice(1)) * 7919 + seed * 104729) % 1009) || (x < y ? -1 : 1));
    arrival.forEach((id, k) => {
      const tm = state.teams[id];
      if (!tm) return;
      // each its own moment, between the welcome (-3) and the rules (0)
      beats.push({ id: `intro:${id}`, leg: n, kind: 'team-intro', who: [tm.a, tm.b], seenBy: [tm.a, tm.b],
        data: { ending: 'any', team: id, stretch: null, t: -3 + (k + 1) / (arrival.length + 1),
          snap: { leg: n, place: leg.place, rel: tm.rel, relFam: relFamOf(tm.rel), identity: tm.identity ?? null } } });
      // ...and a team introduced by its identity says, in an interview, what the two of them are to each other (a
      // team with none was introduced that way already)
      if (tm.identity) beats.push({ id: `dyn:${id}`, leg: n, kind: 'team-dynamic', who: [tm.a, tm.b], seenBy: [tm.a, tm.b],
        data: { ending: 'any', team: id, stretch: null, t: -3 + (k + 1.5) / (arrival.length + 1),
          snap: { leg: n, place: leg.place, rel: tm.rel, relFam: relFamOf(tm.rel), identity: tm.identity ?? null } } });
    });
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
  // a chained moment brings its cause, and the pair costs two (both inside the budget, or neither); a cause whose
  // kind already aired twice stays off, and the moment's own lines say what it was
  const causeOf = s => {
    const c = s?.data?.cause != null && !s.kind.startsWith('int-') ? byId.get(s.data.cause) : null;
    return c && !picked.has(c.id) && (optional[c.kind] || 0) < PER_KIND ? c : null;
  };
  const takeCause = c => { take(c, 2); optional[c.kind] = (optional[c.kind] || 0) + 1; };
  for (const tier of [2, 3]) {
    const cands = scenes.filter(s => !picked.has(s.id) && tierOf(s) === tier && !s.kind.startsWith('int-'))
      .sort((x, y) => weight(y) - weight(x) || x.id - y.id);
    for (const s of cands) {
      if (budget <= 0) break;
      if (picked.has(s.id) || !ok(s) || (optional[s.kind] || 0) >= PER_KIND) continue;
      const c = causeOf(s);
      if (c && budget < 2) continue;
      take(s, tier);
      optional[s.kind] = (optional[s.kind] || 0) + 1;
      budget--;
      if (c) { takeCause(c); budget--; }
    }
  }
  // ...and a moment that had to air brings its cause too, while the budget lasts
  for (const [id] of [...picked]) {
    if (budget <= 0) break;
    const c = causeOf(byId.get(id));
    if (c) { takeCause(c); budget--; }
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

  // three or more teams through the same challenge the same way in the same minute (they queued for it to open):
  // the first airs on its own, the rest share one beat
  // (a picking task's result is each team's own: how many it got right is its story, so it never merges)
  const CLEAN_BEAT = b => b.data.snap?.picked == null
    && (b.kind === 'task-start' || b.kind === 'task-done' || (b.kind === 'task-try' && b.data.ending === 'first-try'));
  // (picks finishing in the same minute: the third on is shown at the start of its picking, which is when it chose)
  const picks = {};
  for (const b of beats) if (b.kind === 'task-try' && b.data.snap?.picked != null) (picks[`${b.data.stretch}|${b.data.t}`] ||= []).push(b);
  for (const group of Object.values(picks)) for (const b of group.slice(2)) b.data.t = Math.round(b.data.from ?? b.data.t);
  const spot = {};
  for (const b of beats) if (CLEAN_BEAT(b)) (spot[`${b.data.stretch}|${b.data.t}|${b.kind}`] ||= []).push(b);
  for (const [key, group] of Object.entries(spot)) {
    if (group.length < 3) continue;
    // a small cast keeps every team in full: the third one there that minute is seen at the other end of its run
    if (N <= BIG_CAST) {
      for (const b of group.slice(2)) {
        if (b.kind === 'task-start' || b.kind === 'task-try') { b.kind = 'task-done'; b.data.ending = 'any'; b.data.t = Math.round(b.data.to ?? b.data.t); }
        else { b.kind = 'task-start'; b.data.t = b.data.from ?? b.data.t; }
      }
      continue;
    }
    const rest = group.slice(1);
    for (const b of rest) beats.splice(beats.indexOf(b), 1);
    const first = rest[0];
    const ids = rest.map(b => b.data.team);
    montages.push({ scene: null, beat: `taskm:${n}:${key}`, kind: 'task-montage', ending: 'any', stretch: first.data.stretch, t: first.data.t,
      teams: ids, who: rest.flatMap(b => b.who), side: null, tier: 1,
      src: { ...first, id: `taskm:${n}:${key}`, kind: 'task-montage', data: { ...first.data, ending: 'any', teamsList: ids } } });
  }

  // ...and any other beat that still lands third in the same minute, at the same place, as the same kind (two teams'
  // struggles that happen to peak together) is shown at the end of its own run instead
  const still = {};
  for (const b of beats) (still[`${b.data.stretch}|${b.data.t}|${b.kind}`] ||= []).push(b);
  for (const group of Object.values(still)) for (const b of group.slice(2)) {
    const to = Math.round(b.data.to ?? b.data.t);
    if (to !== b.data.t) b.data.t = to;
  }

  // Don narrating it (the real show: the departure order, the flights, a bridge, the bottom of the leg)
  const narration = narrate(state, leg, scenes);

  // the episode, in clock order
  const segs = [...montages, ...narration];
  for (const [id, tier] of picked) {
    const s = byId.get(id);
    const teams = teamsIn(s);
    segs.push({ scene: s.id, kind: s.kind, ending: s.data?.ending ?? null, stretch: s.data?.stretch ?? null, t: s.data?.t ?? 0, teams,
      who: [...s.who], side: s.data?.snap?.side ?? null, tier, src: s });
  }
  for (const b of beats) segs.push({ scene: null, beat: b.id, kind: b.kind, ending: b.data.ending, stretch: b.data.stretch, t: b.data.t,
    teams: [b.data.team], who: [...b.who], side: b.data.side ?? null, picked: pickedOf(b.data.snap?.picked), tier: 1, src: b });
  // in the same minute a team finishes its challenge before it checks in
  const phase = k => (k.startsWith('task-') ? 0 : 1);
  segs.sort((x, y) => x.t - y.t || phase(x.kind) - phase(y.kind)
    || (typeof x.scene === 'number' ? x.scene : 1e9) - (typeof y.scene === 'number' ? y.scene : 1e9));
  // once Don has sent a team home, the episode doesn't go back to them racing: what happened before the exit airs
  // before it, anything after it (an on-location exit leaves a team out on the road) doesn't air at all
  // (not the finale: its cut and its bleachers are their own sequence)
  for (const out of leg.kind === 'final' ? [] : leg.eliminated || []) {
    const k = segs.findIndex(x => EXIT_KINDS.has(x.kind) && x.teams.includes(out));
    if (k < 0) continue;
    const exit = segs[k];
    const after = segs.slice(k + 1).filter(x => x.teams.includes(out) && !AFTER_EXIT.has(x.kind) && !x.kind.startsWith('int-'));
    for (const x of after) segs.splice(segs.indexOf(x), 1);
    // sent home on the road, mid-challenge: we see them still at it when Don arrives, never finishing it
    const roadside = leg.how?.[out] === 'on-location';
    const keep = after.filter(x => !roadside || x.t <= exit.t || x.kind.startsWith('task-'));
    for (const x of keep) {
      x.t = Math.min(x.t, exit.t);
      if (roadside && x.kind === 'task-done' && x.src) {
        x.kind = 'task-try'; x.ending = 'struggling';
        x.src = { ...x.src, kind: 'task-try', data: { ...x.src.data, ending: 'struggling', t: x.t } };
      }
    }
    segs.splice(segs.indexOf(exit), 0, ...keep);
  }

  // write what aired (only now are its words spent), and remember the storylines that moved
  state.storyAired ||= {};
  const unwritten = [];
  for (const seg of segs) {
    // a check-in run is one line from Don per team
    const ws = (seg.srcs || [seg.src]).map(src => writeScene(state, src));
    const lines = ws.flatMap(w => w?.lines || []);
    seg.lines = lines.length ? lines : null;
    seg.lineId = ws.map(w => w?.lineId).filter(Boolean).join(',') || null;
    if (ws.some(w => !w) && !seg.kind.startsWith('int-')) unwritten.push(seg.kind + (seg.ending ? '.' + seg.ending : ''));
    for (const src of seg.srcs || [seg.src]) for (const id of src.data?.threadIds || []) state.storyAired[id] = (state.storyAired[id] || 0) + 1;
    delete seg.src;
    delete seg.srcs;
  }
  // an interview nobody has written for its moment doesn't air (a generic one reads as a random scene)
  // ...and nothing airs without words (`unwritten` keeps the list for the read)
  return { n, segments: segs.filter(s => s.lines), unwritten };
}
