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
const DRIFT = ['The current shifts and drags everybody left. They have to swim twice as hard to get back.', 'A swell comes through and pushes the whole field off course.'];

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
  let hazards = 0, rest = [], back = false, restSaid = false;
  const push = s => { if (back && !s.scene) s.scene = { ...ctx.wide }; back = false; out.push(s); };
  const cut = (spec, who, s) => {
    const [plate, group] = spec;
    shownCut.add(spec[2]);
    const sc = ctx.scene(plate, false, Object.fromEntries(who.slice(0, group ? 3 : 4).map((n, j) => [n, group ? ['stand', j, group] : ['stand', j]])));
    push({ ...s, scene: { ...sc, close: 1 } });
    back = true;
  };
  for (const [i, b] of beats.entries()) {
    if (stop && b.kind === stop) break;
    const key = `rc${i}`;
    const u = b.who.length ? unitOf(b.who) : [];
    const slots = { u: un(u), s: s_(u), es: u.length > 1 ? '' : 'es', are: are(u), pos: posOf(ctx, u[0]), obj: ctx.V.pron?.[u[0]]?.obj || 'them' };
    const race = board(b.data?.snap);
    if (b.kind === 'race-start') {
      const set = ctx.legacy?.()?.steps?.[0] || {};
      const { dir, tally, tjCall, cut: _c, ...stage } = set;
      push({ ...stage, race, dir: set.dir || 'And they are off.', focus: [] });
      const spec = cutFor(id, b, shownCut);
      if (spec) cut(spec, units[0] || [], { dir: 'Up close, the first ones strap in and dig in their heels.' });
      continue;
    }
    if (b.kind === 'stage') {
      push({ race, dir: line(ctx, STAGE, { ...slots, name: b.data.name }, key), focus: u.slice(0, 2), act: { [u[0]]: 'cheer' } });
      const by = (ctx.V.ties?.[u[0]]?.friends || []).find(f => ctx.people.includes(f) && !u.includes(f));
      if (by && i % 2 === 0) { const t = voice(ctx, DAILY_VOICE.go, by, { a: u[0] }, key + 'g'); if (t) push({ say: [by, t], focus: [by, u[0]], act: { [by]: 'shout' } }); }
      const spec = cutFor(id, b, shownCut);
      if (spec) cut(spec, u, { dir: `${un(u)} ${are(u)} in there now.` });
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
      const s = { race, dir: line(ctx, pool, slots, key), focus: u.slice(0, 2), act: { [u[0]]: 'flinch' }, ...(ctx.water ? { splash: b.data.kind === 'slip' ? 1 : 0 } : {}) };
      const spec = cutFor(id, b, shownCut);
      if (spec) cut(spec, u, s); else push(s);
      continue;
    }
    if (b.kind === 'puzzle-miss') {
      const s = { race, dir: line(ctx, PUZZLE[b.data.kind] || PUZZLE.puzzle, slots, key), focus: u.slice(0, 2), act: { [u[0]]: 'slump' } };
      const spec = cutFor(id, b, shownCut);
      if (spec) cut(spec, u, s); else push(s);
      continue;
    }
    if (b.kind === 'drift') { push({ race, dir: line(ctx, DRIFT, {}, key), shift: { du: -0.04 }, focus: [] }); continue; }
    if (b.kind.startsWith('fear-')) {
      const n = b.who[0], fear = FEAR_NAME[b.data.fear] || b.data.fear;
      const spec = cutFor(id, b, shownCut);
      if (b.kind === 'fear-beaten') {
        push({ race, dir: line(ctx, FEAR_GO[b.data.fear] || FEAR_GO.heights, { who: n }, key + 'g'), focus: [n] });
        const t = voice(ctx, FEAR.beaten, n, { fear }, key); if (t) push({ conf: [n, t] });
        continue;
      }
      const s = { race, dir: line(ctx, b.kind === 'fear-refused' ? FEAR.refused : FEAR.froze, { who: n, pos: posOf(ctx, n) }, key), focus: [n], act: { [n]: 'flinch' }, know: ['A fear', `${n} is scared of ${fear}.`] };
      if (spec) cut(spec, [n], s); else push(s);
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
        const s = { race, tj: line(ctx, FINISH.first, slots, key), focus: ['TJ', ...u.slice(0, 2)], act: { [u[0]]: 'cheer' }, power: [...safe] };
        const spec = cutFor(id, b, shownCut);
        if (spec) cut(spec, u, s); else push(s);
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
  let smashes = 0;
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
      out.push({ tally: tally(b.data.snap), dir: line(ctx, b.kind === 'smash' ? DB.smash : DB.miss, sl, key), focus: [by[0], on[0]], act: { [by[0]]: 'shout' }, shake: b.kind === 'smash' ? 1 : 0 });
      continue;
    }
    if (b.kind === 'betray') {
      out.push({ tally: tally(b.data.snap), dir: line(ctx, DB.betray, { a: b.who[0], as: 's', b: whose(on), bn: un(on) }, key), focus: [b.who[0], on[0]], shake: 1, act: { [on[0]]: 'flinch' } });
      continue;
    }
    if (b.kind === 'tower-down') {
      const u = b.who;
      out.push({ tally: tally(b.data.snap), dir: line(ctx, DB.down, { b: un(u), bare: u.length > 1 ? 'are' : 'is' }, key), focus: u.slice(0, 2), act: { [u[0]]: 'slump' } });
      continue;
    }
    if (b.kind === 'last-tower') {
      const u = b.who;
      out.push({ tally: tally(b.data.snap), tj: line(ctx, DB.win, { u: un(u), are: are(u), s: s_(u) }, key), focus: ['TJ', ...u.slice(0, 2)], power: [...u], act: { [u[0]]: 'cheer' } });
    }
  }
  return out;
}
