// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/daily-race.js — the race dailies and the Derby, beat by beat
// ══════════════════════════════════════════════════════════════════════
//
// The races (js/ch/daily/race.js) hand the viewer every slip, wrong turn, freeze, overtake and finish. A race
// of twenty-four makes far more mistakes than anybody wants to click through, so the viewer shows what the
// story needs: the leaders' trouble and the back's, every fear, every overtake, the puzzle at the end, the
// winners crossing, the last one in; the rest of the field comes home in one line. The board along the top is
// the race as it stood at that beat. Close-ups (art jobs E01-E06) for the moments they were painted for.
import { speak, DAILY_VOICE } from './voices.js';
import { pickBy, hashOf, nameList } from './games.js';
import { spotAt, marksOf } from './ground.js';
import { gauntletPart } from '../ch/daily/race.js';

// ── where the course is on its plate (the user, 2026-10-15: "balance beam doesn't have good animation, I don't
// understand what they're supposed to do") ──
// Each race's course as a path over its plate, from the old staging's own coordinates (play.js): p is how far
// along a unit is (0..1, the engine's progress), and the path says where they are and what they are doing.
// The followed units (the leaders and the back) move along it at every beat; the rest wait at the start.
const lerp = (a, b, t) => a + (b - a) * t;
const along = (pts, t) => { const n = pts.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; };
export const COURSE_VIEW = {
  // three crossings with a full bucket, back with an empty one; the tank on the far platform
  'balance-beam': { scale: .9, start: [.2, .335], at: p => { const ph = (p * 3) % 1; return [.22 + .62 * (ph < .5 ? ph * 2 : 2 - ph * 2), .335]; }, pose: () => null, bucket: true, tanks: true },
  // up the ladder, the jump, the swim back
  'cliff-relay': { scale: .7, start: [.42, .74], at: p => { const ph = (p * 4) % 1; return ph < .6 ? [.628, .62 - .46 * (ph / .6)] : ph < .7 ? [.66, .16] : [lerp(.62, .42, (ph - .7) / .3), .74]; },
    pose: p => { const ph = (p * 4) % 1; return ph < .6 ? 'climb' : ph < .7 ? null : 'swim'; } },
  // out to the buoys and back with a token
  'reef-dash': { scale: .8, start: [.12, .76], at: (p, lane) => { const ph = (p * 4) % 1; return [.12 + .58 * (ph < .5 ? ph * 2 : 2 - ph * 2), .66 + lane * .012]; }, pose: () => 'swim' },
  'double-cross': { scale: .8, start: [.12, .76], at: (p, lane) => { const ph = (p * 4) % 1; return [.12 + .58 * (ph < .5 ? ph * 2 : 2 - ph * 2), .66 + lane * .012]; }, pose: () => 'swim' },
  // the loop round the point, then up the beach to the board
  'night-swim': { scale: .8, start: [.12, .76], at: (p, lane) => (p < .9 ? [.1 + .8 * (p / .9), .64 + Math.sin(p * 6.3) * .03 + lane * .01] : [.8, .76]), pose: p => (p < .9 ? 'swim' : null) },
  // dragging the truck down the track
  'truck-tug': { scale: .7, start: [.3, .47], at: (p, lane) => [.3 + .5 * p, .47 + lane * .03], pose: p => (p < .9 ? 'pull' : null) },
  // tyres, the mud crawl, the wall, the sandbags, the bell
  'gauntlet-run': { scale: .9, start: [.2, .78], at: p => along([[.2, .78], [.3, .76], [.45, .72], [.55, .69], [.62, .7], [.68, .67]], Math.min(1, p)), pose: p => (p < 1 ? 'run' : null) },
  // inside the maze nobody can be seen; they come out at the exit
  'jungle-maze': { scale: 1, start: [.49, .69], hidden: true, exit: [.55, .76] },
  // the G sets: from the dock, car to car under the cranes (G08)
  'car-jump': { scale: .9, start: [.1875, .522], at: p => along([[.1875, .522], [.394, .472], [.569, .472], [.756, .472], [.95, .472]], Math.min(1, p)), pose: () => null,
    props: () => [.394, .569, .756, .95].map(u => ({ k: 'car', u, v: .538, w: 16 })) },
  // a lane of cage each, from the beach to the bell (G05)
  'locked-in': { scale: 1, lanes: 4, start: [.15, .62], at: (p, lane) => [(240 + 1000 * p) / 1600, [560, 630, 700, 770][lane % 4] / 900], pose: p => (p < .95 ? 'swim' : null),
    props: () => [0, 1, 2, 3].flatMap(l => [{ k: 'cage', u: 740 / 1600, v: ([560, 630, 700, 770][l] + 12) / 900, w: [30, 33, 36, 39][l] }, { k: 'bell', u: 1290 / 1600, v: ([560, 630, 700, 770][l] + 6) / 900, w: 2.6 + l * .2 }]) },
  // a crate each, and the easel for the puzzle (G04)
  'the-box': { scale: 2.4, start: [.075, .6], at: (p, lane) => [([190, 430, 670, 910, 1150, 1390][lane % 6] - 80) / 1600, .6], pose: () => null,
    props: () => [190, 430, 670, 910, 1150, 1390].flatMap(x => [{ k: 'easel', u: (x + 50) / 1600, v: .555, w: 4.2 }, { k: 'crate', u: x / 1600, v: .63, w: 7.5 }]) },
};

const V = (say, v = {}) => ({ say, v });
const fill = (t, slots) => t.replace(/\{(\w+)\}/g, (m, k) => (slots[k] != null ? slots[k] : m));
function line(ctx, pool, slots, key) {
  const list = pool.filter(x => !ctx.V.used.has(x));
  const t = list.length ? list[hashOf(`${ctx.seed}|${key}`) % list.length] : pool[hashOf(`${ctx.seed}|${key}`) % pool.length];
  ctx.V.used.add(t);
  return fill(t, slots);
}
const voice = (ctx, pool, by, slots, key) => speak(pool, by, { ...slots, pron: ctx.V.pron }, `${ctx.seed}|${key}|${by}`, ctx.V.used);
const posOf = (ctx, n) => ctx.V.pron?.[n]?.posAdj || 'their';
const un = u => nameList(u);
const are = u => (u.length > 1 ? 'are' : 'is');
const s_ = u => (u.length > 1 ? '' : 's');

// what goes wrong, in each course's own words ({u} the unit, {s} the verb ending, {pos} their)
const HAZARD = {
  'drop-flag': ['{u} fumble{s} a flag on the jump. It sinks before anybody can grab it.', '{u} lose{s} the flag halfway down. That climb was for nothing.',
    '{u} hit{s} the water wrong and the flag is gone.', '{u} drop{s} {pos} flag into the lagoon.'],
  'wrong-buoy': ['{u} bring{s} back a token from the wrong buoy. It counts for nothing.', '{u} swim{s} all the way to a buoy somebody already emptied.',
    '{u} get{s} turned around in the current and come{s} up at the wrong buoy.', '{u} grab{s} a token, check{s} it, and throw{s} it back. Wrong number.'],
  stall: ['The truck sinks into the soft sand. {u} have to dig the wheels out.', '{u} stop to breathe, and the truck rolls back a metre.',
    "{u} pull out of time with each other and the truck doesn't budge.", 'A harness slips. {u} lose the rhythm and have to start again.'],
  'dead-end': ['{u} run{s} straight into a dead end.', '{u} take{s} a wrong turn and end{s} up back at the entrance.',
    '{u} go{es} round the same corner twice.', '{u} hit{s} a wall of bamboo where {pos} path should be.'],
  'missed-buoy': ['{u} swim{s} past a buoy without reading the lantern.', "{u} lose{s} count in the dark and can't remember the last number.",
    '{u} drift{s} wide of the loop and miss{es} a buoy completely.', 'A wave covers the lantern just as {u} swim{s} past it.'],
  slip: ['{u} slip{s} on the grease and go{es} into the pool, bucket and all.', "{u}'s feet go out from under {obj}. Splash. Back to the start.",
    '{u} wobble{s}, overcorrect{s}, and fall{s} in.', '{u} make{s} it almost all the way across, then slide{s} off the end.',
    '{u} spill{s} half the bucket trying not to fall.', '{u} lose{s} {pos} balance on the first step.'],
  'missed-jump': ['{u} jump{s} for the next car and miss{es} the door. Into the water.', "{u}'s hands slip off the door frame. Splash. Back to the dock.",
    '{u} jump{s} short and hit{s} the water flat.', '{u} hesitate{s} on the roof, jump{s} late, and fall{s}.'],
  stuck: ['{u} get{s} stuck where the cage narrows. Back up, try again.', '{u} come{s} up for air and bang{s} {pos} head on the bars.', '{u} panic{s} for a second in the deep part and lose{s} the line.'],
  bite: ['{u} yank{s} {pos} hand out of the crate and drop{s} the piece. Something bit.', '{u} scream{s} and pull{s} out empty-handed.', "{u} feel{s} something crawl up {pos} arm and freeze{s}.", '{u} grab{s} a handful of something wet, and it is not a puzzle piece.'],
  obstacle: { tyres: ['{u} catch{es} a foot in a tyre and go{es} down. That is a minute on the clock.', '{u} miss{es} a tyre. A minute added.'],
    mud: ['{u} get{s} stuck in the mud crawl, half under the rope.', "{u}'s shirt catches on the rope over the mud."],
    wall: ['{u} slide{s} back down the wall. And again.', '{u} need{s} three runs at the wall.'],
    bags: ['{u} drop{s} a sandbag. Back to the pile.', '{u} split{s} a sandbag halfway. Back for another one.'] },
};
const STAGE = ['{u} {are} first to {name}.', '{u} reach{es} {name} ahead of everybody.', 'First to {name}: {u}.', '{u} {are} out in front at {name}.'];
const OVERTAKE = ['{a} {aare} past {b}.', '{a} catch{aes} {b} and go{aes} by.', '{a} take{as} the lead from {b}.', "{a} {aare} in front now. {b} can't hold {a} off."];
const NEEDLE = [V('See you at the finish, {b}.', { sharp: ['Move, {b}.'], loud: ['BYE, {b}!'] }), V('Too slow, {b}.'), V('Keep up, {b}.'), V('Enjoy the view, {b}.')];
const PUZZLE = {
  puzzle: ['{u} get{s} the puzzle wrong. Pieces everywhere, start again.', '{u} stare{s} at the puzzle. Nothing fits.', "{u} {are} sure it's right. It isn't."],
  'wrong-word': ['{u} shout{s} a word at the exit. Wrong. Back into the maze.', "{u} {are} missing a letter. Back in.", '{u} guess{es}. TJ shakes his head.'],
  'wrong-total': ['{u} write{s} a total on the board. Wrong. Back out to check.', "{u}'s numbers don't add up. Back into the water.", '{u} add{s} it up twice and get{s} two different numbers.'],
};
const FEAR = {
  froze: ['{who} freezes. {who} cannot make {pos} body move.', '{who} stops dead and just stares.', '{who} is shaking and has not moved in a minute.'],
  refused: ['{who} gets to the edge, looks down, and climbs back down the ladder.', "{who} won't jump. Down the ladder {who} goes, the long way."],
  helped: [V("Hey. Look at me. You can do this. Just go.", { soft: ['Breathe. I\'m right here. Go when you\'re ready.'] }), V("Don't look down. Look at me. One more, and we're done.")],
  beaten: [V("I'm scared of {fear}. Everybody knows it. And I did it anyway."), V("That was the scariest thing I've ever done, and I'd do it again to stay in this game.")],
  frozeConf: [V("I couldn't do it. My head said go and my body said no."), V("I've been scared of {fear} my whole life. Today it won.")],
};
const FEAR_NAME = { heights: 'heights', 'deep water': 'deep water', 'tight spaces': 'tight spaces', 'the dark': 'the dark' };
const FINISH = {
  first: ["{u} {are} first home! {u} win{s}!", "And {u} take{s} it! That's the win!", '{u} cross{es} the line first! Ladies and gentlemen, your winner!'],
  next: ['{u} come{s} in {nth}.', '{u} finish{es} {nth}.'],
  last: ['{u} finally make{s} it in, last of everybody.', '{u} {are} the last one home.', 'Last across the line: {u}.'],
  rest: 'The rest come in one after another: {list}.',
  board: ['{u} {are} first back with the most tokens! {u} go{es} to the board.', '{u} have the highest total. To the board!'],
};
// the moment before a fear is beaten, so the confessional has something to answer
const FEAR_GO = { heights: ['{who} looks over the edge, takes a breath, and goes anyway.', '{who} stops at the top, shaking, then goes.'],
  'deep water': ['{who} takes a long breath and swims out over the deep part.', '{who} hesitates where the bottom drops away, then keeps going.'],
  'the dark': ['{who} stares into the black water for a long moment, then swims out into it.'],
  'tight spaces': ['{who} squeezes into the narrowest part anyway, eyes shut.'] };
const NTH = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
// getting through it: each obstacle, each bucket, as the runners reach them
const THROUGH = {
  tyres: ['{u} high-step{s} through the tyres, knees up.', '{u} hop{s} tyre to tyre and come{s} out clean.', '{u} stumble{s} on the last tyre and keep{s} going.'],
  mud: ['{u} drag{s} {obj}self through the mud under the rope, face down.', '{u} crawl{s} out of the mud, covered head to toe.', '{u} slither{s} under the rope, spitting out mud.'],
  wall: ['{u} jump{s}, get{s} a hand on top of the wall, and haul{s} over.', '{u} take{s} a run at the wall and scramble{s} over the top.', '{u} hang{s} off the top of the wall, legs kicking, then pull{s} over.'],
  bags: ['{u} shoulder{s} a sandbag and stagger{s} toward the line.', '{u} hug{s} the sandbag to {pos} chest and run{s}.', "{u} drop{s} the sandbag on the line, gasping."],
  bell: ['{u} reach{es} the bell and ring{s} it.'],
  bucket: ['{u} make{s} it across and pour{s} the bucket into the tank.', '{u} tip{s} another bucket in. The water line goes up.', '{u} edge{s} along the beam and get{s} the bucket to the tank, barely.'],
};
const DRIFT = ['The current shifts and drags everybody left. They have to swim twice as hard to get back.', 'A swell comes through and pushes the whole field off course.'];

// The camera follows the action into the close-ups (art jobs E01-E06) for most of a race: the wide shot is the
// start, the field, the water; every obstacle, slip, freeze and finish that has a close-up is shown there, with
// the people at it. { plate, group, pose } or null for the wide shot.
const GAUNTLET_POSE = { tyres: 'run', mud: 'mud', wall: 'climb', bags: 'pull', bell: null };
function closeOf(id, b, p) {
  const k = b.kind;
  if (id === 'gauntlet-run') {
    const part = k === 'finish' || p >= .97 ? 'bell' : b.data?.part || (k === 'stage' ? ['tyres', 'mud', 'wall', 'bags', 'bell'][b.data.i] : p != null ? gauntletPart(p) : null);
    if (!part || k === 'race-start') return null;
    return { plate: `gauntlet-${part}`, group: 'run', pose: GAUNTLET_POSE[part], part };
  }
  if (id === 'balance-beam' && ['hazard', 'stage', 'overtake', 'fear-froze', 'fear-helped', 'fear-beaten', 'through'].includes(k)) return { plate: 'beam-close', group: 'beam', pose: null };
  // the cliff: the climb on the ladder (H05), the edge at the top (E03)
  if (id === 'cliff-relay' && (k.startsWith('fear-') || (k === 'stage' && b.data.i >= 2))) return { plate: 'cliff-top', group: null, pose: null };
  if (id === 'cliff-relay' && ['stage', 'hazard', 'overtake'].includes(k)) return { plate: 'cliff-ladder', group: 'ladder', pose: 'climb' };
  // the truck: the harnesses (E04), the finish arch and its puzzle (H06)
  if (id === 'truck-tug' && (k === 'puzzle-miss' || (k === 'stage' && b.data.i >= 2) || (k === 'finish' && (b.data.first || b.data.place <= 3)))) return { plate: 'truck-finish', group: 'table', pose: null };
  if (id === 'truck-tug' && ['hazard', 'stage', 'race-start', 'overtake'].includes(k)) return { plate: 'truck-pull', group: 'pull', pose: 'pull' };
  // the maze: a station with its letter (H01), a dead end (H02), the narrow path (E02)
  if (id === 'jungle-maze' && k === 'stage' && b.data.i < 3) return { plate: 'maze-station', group: 'run', pose: null };
  if (id === 'jungle-maze' && (k === 'hazard' || k === 'overtake')) return { plate: 'maze-deadend', group: 'run', pose: 'run' };
  if (id === 'jungle-maze' && k.startsWith('fear-')) return { plate: 'maze-in', group: null, pose: null };
  // the water: at the buoys (H03), under them for the token (H04), the totals board at the end (E01)
  if (['night-swim', 'reef-dash', 'double-cross'].includes(id) && (k === 'puzzle-miss' || (k === 'finish' && (b.data.first || b.data.place <= 3)))) return { plate: 'board', group: null, pose: null };
  if (['reef-dash', 'double-cross'].includes(id) && k === 'hazard') return { plate: 'reef-under', group: 'swim', pose: null };
  if (['night-swim', 'reef-dash', 'double-cross'].includes(id) && ['stage', 'overtake', 'hazard', 'drift', 'fear-froze', 'fear-helped', 'fear-beaten'].includes(k)) return { plate: 'reef-buoys', group: 'swim', pose: 'swim' };
  return null;
}

// which close-up (art jobs E01-E06) a beat cuts to
function cutFor(id, b, shown) {
  if (id === 'beam' || id === 'balance-beam') return b.kind === 'hazard' && !shown.has('beam') ? ['beam-close', 'beam', 'beam'] : null;
  if (id === 'gauntlet-run' && b.kind === 'hazard' && b.data.part && !shown.has(b.data.part)) return [`gauntlet-${b.data.part}`, 'run', b.data.part];
  if (id === 'gauntlet-run' && b.kind === 'finish' && b.data.first && !shown.has('bell')) return ['gauntlet-bell', 'run', 'bell'];
  if (id === 'cliff-relay' && (b.kind === 'fear-refused' || b.kind === 'fear-beaten') && !shown.has('top')) return ['cliff-top', null, 'top'];
  if (id === 'jungle-maze' && b.kind === 'stage' && b.data.i === 0 && !shown.has('maze')) return ['maze-in', null, 'maze'];
  if ((id === 'night-swim' || id === 'reef-dash' || id === 'double-cross') && b.kind === 'puzzle-miss' && !shown.has('board')) return ['board', null, 'board'];
  if (id === 'truck-tug' && b.kind === 'race-start' && !shown.has('truck')) return ['truck-pull', 'pull', 'truck'];
  return null;
}

/** The race steps for a played race daily: { steps }. ctx.legacy() is the old staging's set-up (props, places). */
export function raceSteps(d, ctx, { id = d.id, stop = null, toBoard = false } = {}) {
  const out = [];
  const beats = d.beats || [];
  const unitOf = who => (d.order || []).find(u => u.includes(who[0])) || who;
  const units = d.order || [];
  const board = snap => (snap ? Object.entries(snap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, p]) => ({ who: k.split('+'), p })) : null);
  // the units the story follows: the eventual winners and the back
  const finishes = beats.filter(b => b.kind === 'finish');
  const follow = new Set([...finishes.slice(0, 4), ...finishes.slice(-2)].map(b => b.who[0]));
  const shownHazard = new Set(), shownCut = new Set(), safe = [];
  let hazards = 0, rest = [], back = false, restSaid = false, puzzles = 0;
  // the course on the plate: the units the story follows move along it
  const CV = COURSE_VIEW[id];
  const plateK = ctx.wide?.plate;
  const runners = units.filter(u => u.some(n => follow.has(n))).slice(0, COURSE_VIEW[id]?.lanes || 6);
  const laneOf = u => Math.max(0, runners.indexOf(u));
  const spot = (u, i, xy) => spotAt(plateK, xy[0] + i * .022, xy[1] + (i ? .01 : 0), CV.scale);
  let snapNow = null, pendingMove = {};
  const courseMove = snap => {
    if (!CV || CV.hidden || !snap || !plateK) return {};
    const mv = {}, ps = {};
    for (const u of runners) {
      const p = snap[u.join('+')]; if (p == null) continue;
      const xy = CV.at(Math.min(1, p), laneOf(u));
      u.slice(0, 3).forEach((n, i) => { mv[n] = spot(u, i, xy); ps[n] = CV.pose(Math.min(1, p)); });
    }
    return { move: mv, pose: ps };
  };
  // the tanks on the far platform (the beam): the three fullest, and a bucket with each runner
  const beamProps = snap => {
    if (!CV?.tanks || !snap) return null;
    const top = Object.entries(snap).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const tanks = top.map(([k, p], i) => ({ k: 'tank', u: .885 - i * .028, v: .18, fill: p }));
    const buckets = runners.map(u => { const p = snap[u.join('+')] || 0; const [x, y] = CV.at(Math.min(1, p), 0); return { k: 'bucket', u: x + .012, v: y - .025 }; });
    return [...tanks, ...buckets];
  };
  let about = null, shot = 'wide', shotSig = '';
  const closeCast = (cl, u, snap) => {
    const k = ctx.plateKey(cl.plate, false);
    const ms = marksOf(k);
    const g = cl.group ? ms.filter(m => m.kind === 'stand' && m.group === cl.group).length : 0;
    const open = ms.filter(m => m.kind === 'stand' && !m.group).length;
    // the ones it is about, on the action's marks; others at the same obstacle beside them
    const here = [...u.slice(0, 3)];
    if (cl.part && snap) for (const x of runners) if (!x.includes(u[0]) && here.length < g + open && gauntletPart(Math.min(.96, snap[x.join('+')] || 0)) === cl.part) here.push(x[0]);
    else if (!cl.part && snap) for (const x of runners) if (!x.includes(u[0]) && here.length < Math.min(3, g + open) && cl.group) here.push(x[0]);
    // TJ is on the wide shots, not in the close-ups
    const cast = { TJ: null };
    here.forEach((n, j) => { cast[n] = j < g ? ['stand', j, cl.group] : ['stand', Math.min(open - 1, j - g)]; });
    return cast;
  };
  const push = (s0) => {
    const s = s0;
    if (back && !s.scene) s.scene = { ...ctx.wide };
    back = false;
    // the shot: the close-up the moment has, or the wide course
    const cl = about && !s.conf && !s.scene ? closeOf(id, about.b, about.p) : null;
    if (cl && ctx.plateKey) {
      const cast = closeCast(cl, about.u, about.b.data?.snap || snapNow);
      const sig = cl.plate + JSON.stringify(cast);
      if (sig !== shotSig) { s.scene = { ...ctx.scene(cl.plate, false, cast), close: 1, wipe: shot === 'wide' ? 1 : 0 }; shotSig = sig; }
      const who = Object.keys(cast);
      s.pose = { ...Object.fromEntries(who.map(n => [n, cl.pose])), ...(s.pose || {}) };
      // struggling at an obstacle, through it, or done
      if (about.b.kind === 'hazard' || about.b.kind === 'puzzle-miss' || about.b.kind === 'fear-froze') s.act = { ...(s.act || {}), [about.u[0]]: 'strain' };
      shot = 'close';
      out.push(s);
      return;
    }
    if (shot === 'close' && !s.conf && !s.scene) { s.scene = { ...ctx.wide }; shotSig = ''; }
    if (!s.conf) shot = 'wide';
    // on the wide plate, the race moves on the course with this beat
    if (!s.scene?.close && s.race !== undefined) {
      const snap = beats.find((x, j) => x.data?.snap && j >= 0 && x.data.snap && JSON.stringify(board(x.data.snap)) === JSON.stringify(s.race))?.data?.snap || snapNow;
      if (snap) { snapNow = snap; const cm = courseMove(snap); s.move = { ...(cm.move || {}), ...pendingMove, ...(s.move || {}) }; s.pose = { ...(cm.pose || {}), ...(s.pose || {}) }; pendingMove = {}; const bp = CV?.props ? CV.props(snap) : beamProps(snap); if (bp) s.props = bp; }
    }
    out.push(s);
  };
  const cut = (spec, who, s) => {
    const [plate, group] = spec;
    shownCut.add(spec[2]);
    const sc = ctx.scene(plate, false, Object.fromEntries(who.slice(0, group ? 3 : 4).map((n, j) => [n, group ? ['stand', j, group] : ['stand', j]])));
    push({ ...s, scene: { ...sc, close: 1 } });
    back = true;
  };
  const lastPart = {};
  let throughs = 0;
  const progressSteps = (b, i) => {
    if (!b.data?.snap || throughs > 16 || !['gauntlet-run', 'balance-beam'].includes(id)) return;
    for (const x of runners) {
      const k = x.join('+'), p = b.data.snap[k];
      if (p == null) continue;
      const part = id === 'gauntlet-run' ? (p >= .97 ? null : gauntletPart(p)) : Math.floor(p * 3);
      if (lastPart[k] === undefined) { lastPart[k] = part; continue; }
      if (part === lastPart[k] || part === null) continue;
      const was = lastPart[k];
      lastPart[k] = part;
      if (id === 'gauntlet-run' && was === null) continue;
      throughs++;
      const sl = { u: un(x), s: s_(x), es: x.length > 1 ? '' : 'es', pos: posOf(ctx, x[0]), obj: x.length > 1 ? 'them' : ctx.V.pron?.[x[0]]?.obj || 'them' };
      const pool = id === 'gauntlet-run' ? THROUGH[was] : THROUGH.bucket;
      about = { b: { kind: 'through', data: { part: id === 'gauntlet-run' ? was : null, snap: b.data.snap } }, u: x, p };
      const st = { race: board(b.data.snap), dir: line(ctx, pool, sl, `th${i}${k}`), focus: x.slice(0, 2), act: { [x[0]]: hashOf(`${k}${i}`) % 3 ? 'strain' : 'cheer' } };
      if (id === 'balance-beam') st.props = beamProps(b.data.snap);
      push(st);
    }
  };
  for (const [i, b] of beats.entries()) {
    if (stop && b.kind === stop) break;
    if (i > 0) progressSteps(beats[i - 1], i - 1);
    const key = `rc${i}`;
    const u = b.who.length ? unitOf(b.who) : [];
    about = u.length ? { b, u, p: b.data?.snap?.[u.join('+')] ?? null } : null;
    const slots = { u: un(u), s: s_(u), es: u.length > 1 ? '' : 'es', are: are(u), pos: posOf(ctx, u[0]), obj: ctx.V.pron?.[u[0]]?.obj || 'them' };
    const race = board(b.data?.snap);
    if (b.kind === 'race-start') {
      const set = ctx.legacy?.()?.steps?.[0] || {};
      const { dir, tally, tjCall, cut: _c, ...stage } = set;
      const st0 = { ...stage, race, dir: set.dir || 'And they are off.', focus: [] };
      if (CV?.props) st0.props = CV.props(null);
      if (CV?.hidden) { st0.hide = units.flat(); }
      else if (CV && plateK) { st0.move = { ...(st0.move || {}), ...Object.fromEntries(runners.flatMap(u => u.slice(0, 3).map((n, i) => [n, spot(u, i, CV.start)]))) }; }
      push(st0);
      continue;
    }
    if (b.kind === 'stage') {
      push({ race, dir: line(ctx, STAGE, { ...slots, name: b.data.name }, key), focus: u.slice(0, 2), act: { [u[0]]: 'cheer' } });
      const by = (ctx.V.ties?.[u[0]]?.friends || []).find(f => ctx.people.includes(f) && !u.includes(f));
      if (by && i % 2 === 0) { const t = voice(ctx, DAILY_VOICE.go, by, { a: u[0] }, key + 'g'); if (t) push({ say: [by, t], focus: [by, u[0]], act: { [by]: 'shout' } }); }
      continue;
    }
    if (b.kind === 'overtake') {
      const lead = unitOf(b.who), was = units.find(x => x.includes(b.who[lead.length])) || [];
      if (!was.length) continue;
      push({ race, dir: line(ctx, OVERTAKE, { a: un(lead), b: un(was), aare: are(lead), aes: lead.length > 1 ? '' : 'es', as: lead.length > 1 ? '' : 's' }, key), focus: [lead[0], was[0]] });
      if (b.data.needle) { const t = voice(ctx, NEEDLE, b.data.by, { b: b.data.to }, key + 'n'); if (t) push({ say: [b.data.by, t], focus: [b.data.by, b.data.to], act: { [b.data.by]: 'shout', [b.data.to]: 'flinch' } }); }
      continue;
    }
    if (b.kind === 'hazard') {
      // the story's people, a few times each; and never the same unit twice in a row
      if (!u.some(n => follow.has(n)) || shownHazard.has(u[0]) || hazards >= 9) continue;
      shownHazard.add(u[0]); hazards++;
      const pool = b.data.kind === 'obstacle' ? HAZARD.obstacle[b.data.part] || HAZARD.obstacle.tyres : HAZARD[b.data.kind] || HAZARD.stall;
      const s = { race, dir: line(ctx, pool, slots, `${key}h${i}`), focus: u.slice(0, 2), act: { [u[0]]: 'flinch' } };
      // a slip off the beam: into the pool with a splash, and back to the start
      if (b.data.kind === 'slip') { s.drop = u.slice(0, 1); s.splash = 1; if (CV && plateK) pendingMove[u[0]] = spot(u, 0, CV.start); }
      push(s);
      continue;
    }
    if (b.kind === 'puzzle-miss') {
      // the leaders' and the back's mistakes at the end, three at most (six wrong words in a row is one joke six times)
      if (!u.some(n => follow.has(n)) || (puzzles = (puzzles || 0) + 1) > 3) continue;
      const s = { race, dir: line(ctx, PUZZLE[b.data.kind] || PUZZLE.puzzle, slots, `${key}p${i}`), focus: u.slice(0, 2), act: { [u[0]]: 'slump' } };
      if (CV?.hidden && plateK) { s.show = u.slice(0, 1); s.move = { [u[0]]: spotAt(plateK, CV.exit[0], CV.exit[1], CV.scale) }; }
      push(s);
      continue;
    }
    if (b.kind === 'drift') { push({ race, dir: line(ctx, DRIFT, {}, key), shift: { du: -0.04 }, focus: [] }); continue; }
    if (b.kind.startsWith('fear-')) {
      const n = b.who[0], fear = FEAR_NAME[b.data.fear] || b.data.fear;
      if (b.kind === 'fear-beaten') {
        push({ race, dir: line(ctx, FEAR_GO[b.data.fear] || FEAR_GO.heights, { who: n }, key + 'g'), focus: [n] });
        const t = voice(ctx, FEAR.beaten, n, { fear }, key); if (t) push({ conf: [n, t] });
        continue;
      }
      const s = { race, dir: line(ctx, b.kind === 'fear-refused' ? FEAR.refused : FEAR.froze, { who: n, pos: posOf(ctx, n) }, key), focus: [n], act: { [n]: 'flinch' }, know: ['A fear', `${n} is scared of ${fear}.`] };
      push(s);
      if (b.kind === 'fear-helped') { const h = b.who[1]; const t = voice(ctx, FEAR.helped, h, {}, key + 'h'); if (t) push({ say: [h, t], focus: [h, n] }); }
      else { const t = voice(ctx, FEAR.frozeConf, n, { fear }, key + 'c'); if (t) push({ conf: [n, t] }); }
      continue;
    }
    if (b.kind === 'finish') {
      const p = b.data.place;
      if (b.data.first && toBoard) {
        // Double Cross: first home goes to the board, and nobody is safe yet
        push({ race, tj: line(ctx, FINISH.board, slots, key), focus: ['TJ', ...u.slice(0, 2)], act: { [u[0]]: 'cheer' } });
      } else if (b.data.first) {
        safe.push(...u);
        const s = { race, tj: line(ctx, FINISH.first, slots, `${key}f${i}`), focus: ['TJ', ...u.slice(0, 2)], act: { [u[0]]: 'cheer' }, power: [...safe] };
        if (CV?.hidden && plateK) { s.show = u.slice(0, 2); s.move = Object.fromEntries(u.slice(0, 2).map((n, j) => [n, spotAt(plateK, CV.exit[0] + j * .03, CV.exit[1], CV.scale)])); }
        push(s);
      } else if (b.data.last) {
        if (rest.length && !restSaid) { push({ dir: fill(FINISH.rest, { list: nameList(rest.map(un)) }), focus: [] }); restSaid = true; }
        push({ race, dir: line(ctx, FINISH.last, slots, key), focus: u.slice(0, 2), act: { [u[0]]: 'slump' } });
      } else if (p <= 3) push({ race, dir: line(ctx, FINISH.next, { ...slots, nth: NTH[p] }, key), focus: u.slice(0, 2) });
      else rest.push(u);
      continue;
    }
  }
  return out;
}

// ── the Derby ─────────────────────────────────────────────────────────
const DB = {
  start: ['Every side runs to its tower and grabs a ram. TJ blows the horn.', 'The horn goes. Rams up, towers behind them, everybody charges.'],
  pact: [[V("Psst. You leave our tower alone, we leave yours alone. Deal?"), V("Deal. Until there's nobody else left.")],
    [V("We're not hitting you. Don't hit us."), V("Fine by me. Go after the big ones.")]],
  smash: ['{a} slam{as} into {b} tower. A crate goes flying.', "{a} hit{as} {b} tower dead centre.", '{a} charge{as} {b} tower and knock{as} the top crate off.',
    "{a} get{as} a good hit on {b} tower. It wobbles."],
  miss: ['{a} swing{as} at {b} tower and miss{aes}.', '{a} charge{as} at {b} tower and bounce{as} off.'],
  down: ["{b} tower comes down! {b} {bare} out.", "Crash. {b} tower is in pieces. {b} {bare} done.", "{b} tower topples into the sand. That's it for {b}."],
  betray: ['{a} turn{as} around and hit{as} {b} tower. They had a deal.', "Nobody expected that. {a} just went after {bn}, the side {a} promised to leave alone."],
  win: ["{u} {are} the last tower standing! {u} win{s} the Derby!", "And that's the Derby! {u} take{s} it!"],
};
const whose = u => (u.length > 1 ? `${un(u)}'s` : `${u[0]}'s`);
export function derbySteps(d, ctx) {
  const out = [];
  const units = d.order || [];
  const unitOf = n => units.find(u => u.includes(n)) || [n];
  const tally = snap => ({ title: 'TOWERS', rows: Object.entries(snap || {}).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k, hp]) => ({ who: k.split('+'), txt: hp > 0 ? '▮'.repeat(hp) : 'DOWN', v: hp / 3, mark: hp <= 0 ? 'x' : null })) });
  let smashes = 0, close = false;
  const closeUp = (a, b2, s) => { out.push({ ...s, scene: { ...ctx.scene('derby-close', false, { TJ: null, [a]: ['stand', 0, 'atk'], [b2]: ['stand', 1, 'atk'] }), close: 1 } }); close = true; };
  const backWide = s => { if (close && !s.scene && !s.conf) { s.scene = { ...ctx.wide }; close = false; } return s; };
  for (const [i, b] of (d.beats || []).entries()) {
    const key = `db${i}`;
    if (b.kind === 'derby-start') {
      const set = ctx.legacy?.()?.steps?.[0] || {};
      const { dir, tjCall, cut: _c, ...stage } = set;
      out.push({ ...stage, dir: line(ctx, DB.start, {}, key), focus: [] });
      continue;
    }
    if (b.kind === 'pact') {
      const [x, y] = b.who; const pair = pickBy(DB.pact, key);
      const t1 = voice(ctx, [pair[0]], x, {}, key + 'a'), t2 = voice(ctx, [pair[1]], y, {}, key + 'b');
      if (t1) out.push({ say: [x, t1], focus: [x, y], know: ['A pact', `${un(b.data.a)} and ${un(b.data.b)} have agreed not to hit each other.`] });
      if (t2) out.push({ say: [y, t2], focus: [y, x] });
      continue;
    }
    const by = b.data?.by || [], on = b.data?.on || [];
    const sl = { a: un(by), as: by.length > 1 ? '' : 's', aes: by.length > 1 ? '' : 'es', b: whose(on), bare: on.length > 1 ? 'are' : 'is' };
    if (b.kind === 'smash' || b.kind === 'miss') {
      if (++smashes > 12 && b.data.hp !== 1) continue;
      const st = { tally: tally(b.data.snap), dir: line(ctx, b.kind === 'smash' ? DB.smash : DB.miss, sl, key), focus: [by[0], on[0]], act: { [by[0]]: 'shout', [on[0]]: b.kind === 'smash' ? 'flinch' : 'cheer' }, shake: b.kind === 'smash' ? 1 : 0 };
      if (b.kind === 'smash' && smashes % 2 === 1) closeUp(by[0], on[0], st); else out.push(backWide(st));
      continue;
    }
    if (b.kind === 'betray') {
      closeUp(b.who[0], on[0], { tally: tally(b.data.snap), dir: line(ctx, DB.betray, { a: b.who[0], as: 's', b: whose(on), bn: un(on) }, key), focus: [b.who[0], on[0]], shake: 1, act: { [on[0]]: 'flinch' } });
      continue;
    }
    if (b.kind === 'tower-down') {
      const u = b.who;
      out.push(backWide({ tally: tally(b.data.snap), dir: line(ctx, DB.down, { b: un(u), bare: u.length > 1 ? 'are' : 'is' }, key), focus: u.slice(0, 2), act: { [u[0]]: 'slump' } }));
      continue;
    }
    if (b.kind === 'last-tower') {
      const u = b.who;
      out.push(backWide({ tally: tally(b.data.snap), tj: line(ctx, DB.win, { u: un(u), are: are(u), s: s_(u) }, key), focus: ['TJ', ...u.slice(0, 2)], power: [...u], act: { [u[0]]: 'cheer' } }));
    }
  }
  return out;
}
