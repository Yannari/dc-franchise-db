// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/daily-betray.js — the betrayal dailies, beat by beat
// ══════════════════════════════════════════════════════════════════════
//
// King of the Raft, Cut the Rope, Double Cross, Trust Fall and Who Said It (js/ch/daily/betrayal.js). The
// moment each one is built for is the choice: who gets pushed by their own ally, who cuts the rope, who
// steals, who lets go of the rope, who says your name. Those are shown whole, with the person it was done to
// answering; the rest of the game around them moves along.
import { speak } from './voices.js';
import { pickBy, hashOf, nameList } from './games.js';
import { raceSteps } from './daily-race.js';

const V = (say, v = {}) => ({ say, v });
const fill = (t, slots) => t.replace(/\{(\w+)\}/g, (m, k) => (slots[k] != null ? slots[k] : m));
function line(ctx, pool, slots, key) {
  const list = pool.filter(x => !ctx.V.used.has(x));
  const t = list.length ? list[hashOf(`${ctx.seed}|${key}`) % list.length] : pool[hashOf(`${ctx.seed}|${key}`) % pool.length];
  ctx.V.used.add(t);
  return fill(t, slots);
}
const voice = (ctx, pool, by, slots, key) => speak(pool, by, { ...slots, pron: ctx.V.pron }, `${ctx.seed}|${key}|${by}`, ctx.V.used);
const say = (by, text, to, extra = {}) => ({ say: [by, text], focus: to ? [by, to] : [by], ...extra });
const conf = (by, text) => ({ conf: [by, text] });
const tj = (text, extra = {}) => ({ tj: text, focus: ['TJ'], ...extra });

const HURT = [V("I trusted {a}. That's on me now, and it won't happen again.", { loud: ['I TRUSTED {a}!'], sharp: ['Noted, {a}. Noted forever.'] }),
  V("{a} looked me in the eye and did that. I'm not going to forget it."), V("Everybody saw what {a} did. Good. I want them to remember it.")];
const DID = [V("It's a game. I came here to win it, not to make friends.", { sharp: ['Somebody was going to do it. I just did it first.'] }),
  V("Do I feel bad? A little. Do I feel safe? Yes."), V("I'll deal with the fallout later. Right now I'm still in it.")];

// ── King of the Raft ──────────────────────────────────────────────────
const RK = {
  start: ['{who} wade out and climb onto the yellow raft. It tips every time somebody moves.', '{who} pile onto the raft, shoulder to shoulder.'],
  tj: ["Everybody on the raft! When I blow the horn, get everybody else off it. Last one standing is king. Or queen!",
    "Push, pull, shove. Last one on the raft wins. Try not to drown anybody, my insurance won't cover it."],
  pushed: ['{a} gets low and shoves {b} straight off the edge.', '{a} grabs {b} by the arm and pulls. {b} goes over.', '{b} loses {pos} footing as {a} barges in.',
    "{a} catches {b} off balance. Into the water {b} goes.", '{a} and {b} wrestle at the edge until {b} goes in.', '{b} gets shoved off by {a} and comes up spitting water.'],
  gang: ['{a} and {m} go after {b} together. {b} has no chance.', '{a} and {m} team up on {b} and push {b} off.', '{m} holds {b} while {a} shoves. Splash.',
    '{b} gets caught between {a} and {m}, and in {b} goes.', 'Two against one: {a} and {m} send {b} into the water.'],
  shove: ['{a} tries to push {b} and nearly falls in instead.', '{a} and {b} lock arms. Neither of them moves.', '{b} holds firm against {a}.'],
  betray: ['Only allies left on the raft now. {a} looks at {b}, and then pushes.', '{a} and {b} were on the same side all game. Not any more. {a} shoves.', "{a} doesn't wait for {b} to make the first move. {a} shoves."],
  win: ['{w} is the last one on the raft!', '{w} wins King of the Raft!'],
  heat: ['{w} is the last one on the raft and goes through!'],
};
// cfg: the set it is played on (King of the Raft by default; Road Kill passes the flatbed and its nets)
export function raftSteps(d, ctx, cfg = {}) {
  const C = { plate: 'poles', group: 'raft', slots: 12, fallen: null, close: 'raft-close', seg: 'King of the Raft', lines: RK, ...cfg };
  const L = C.lines;
  const out = [];
  let on = [], sand = 0, pending = {}, shoves = 0, close = false, label = '';
  const where = {};
  const wide = () => ctx.scene(C.plate, false, Object.fromEntries(on.map(n => [n, where[n]])));
  const flush = s => { if (Object.keys(pending).length) { s.move = { ...(s.move || {}), ...pending }; pending = {}; } return s; };
  // the shove up close, on the raft (art job H09); the next step goes back to the wide shot
  const closeUp = (who, s) => { if (!C.close) { push(s); return; } out.push({ ...s, scene: { ...ctx.scene(C.close, false, { TJ: null, ...Object.fromEntries(who.map((n, j) => [n, ['stand', j * 2 % 6, 'raft']])) }), close: 1 } }); close = true; };
  const push = s => { if (close && !s.scene && !s.conf) { s.scene = wide(); close = false; } out.push(flush(s)); };
  const safe = [];
  for (const [i, b] of (d.beats || []).entries()) {
    const key = `rk${i}`;
    if (b.kind === 'raft-start') {
      on = b.who; sand = 0; shoves = 0; close = false;
      for (const [j, n] of on.entries()) where[n] = ['stand', j % C.slots, C.group];
      push({ scene: wide(), seg: [b.data.label, C.seg], stand: 'start', still: on, focus: [] });
      push(tj(line(ctx, L.tj, {}, key)));
      push({ dir: line(ctx, L.start, { who: nameList(on) }, key + 's'), focus: on.slice(0, 4) });
      continue;
    }
    if (b.kind === 'pushed') {
      const n = b.who[0], by = b.data.by;
      const pos = ctx.V.pron?.[n]?.posAdj || 'their';
      const text = b.data.betray ? line(ctx, L.betray, { a: by, b: n }, key) : b.data.mate ? line(ctx, L.gang, { a: by, m: b.data.mate, b: n }, key) : line(ctx, L.pushed, { a: by, b: n, pos }, key);
      closeUp([by, n, ...(b.data.mate ? [b.data.mate] : [])], { dir: text, drop: [n], splash: 1, focus: [by, n], act: { [by]: 'shout' }, shake: b.data.betray ? 1 : 0 });
      where[n] = C.fallen ? ['stand', sand++ % 4, C.fallen] : ['stand', sand++ % 8];
      if (!C.close) pending[n] = where[n];
      if (b.data.betray) { const h = voice(ctx, HURT, n, { a: by }, key + 'h'); if (h) push(conf(n, h)); const dd = voice(ctx, DID, by, {}, key + 'd'); if (dd) push(conf(by, dd)); }
      continue;
    }
    if (b.kind === 'shove') {
      if (++shoves > 3 && !b.data.betray) continue;
      closeUp(b.who, { dir: line(ctx, L.shove, { a: b.who[0], b: b.who[1] }, key), focus: b.who, act: { [b.who[0]]: 'lean', [b.who[1]]: 'strain' } });
      continue;
    }
    if (b.kind === 'raft-win') {
      const w = b.who[0];
      const final = !/heat \d/i.test(b.data.label);
      if (final) safe.push(w);
      push(tj(line(ctx, final ? L.win : L.heat, { w }, key), { focus: ['TJ', w], act: { [w]: 'cheer' }, ...(final ? { power: [...safe] } : {}) }));
    }
  }
  return out;
}

// ── Cut the Rope ──────────────────────────────────────────────────────
const CR = {
  start: ['Every pair climbs down under the pier and grabs one rope between the two of them.', 'Two to a rope, the pairs lower themselves off the pier.'],
  tj: ["Two of you, one rope. Hang on. Oh, and there's a knife taped to every rope. Use it if you want. I'm not judging. I'm totally judging.",
    "Last pair hanging wins. Or the last person. You'll see what I mean."],
  sag: ['The crew lets the ropes down a notch.', 'Another notch. The pairs swing closer to the water.', 'The ropes drop again.'],
  fall: ['{who} lose their grip together and drop into the water.', '{who} go in at the same time.', "{who}'s rope swings, and they both let go."],
  fall1: ['{who} lets go and drops into the water.', '{who} finally falls.'],
  cut: ['{a} reaches for the knife, looks at {b}, and cuts. {b} drops into the water.', '{b} is slipping, and {a} decides. One cut, and {b} is gone.'],
  win: ['{w} {are} the last ones hanging! {w} win!', '{w} outlasted everybody! That is the win!'],
  winAlone: ['{w} cut {pos} own partner loose and hung on alone. {w} wins. Wow.', "{w} wins it, alone. I'm not sure how I feel about that. Actually I love it."],
};
export function cutRopeSteps(d, ctx) {
  const out = [];
  const units = d.order || [];
  const seen = new Set();
  for (const [i, b] of (d.beats || []).entries()) {
    const key = `cr${i}`;
    if (b.kind === 'rope-start') { out.push({ hang: 'start', still: units.flat(), dir: line(ctx, CR.start, {}, key), focus: [] }); out.push(tj(line(ctx, CR.tj, {}, key + 't'))); continue; }
    // back from a close-up: the whole rope line, whoever is still hanging
    if (out[out.length - 1]?.scene?.close === undefined && out.some(x => x.scene?.close) && b.kind !== 'cut' && !out[out.length - 1].back) {
      const lastClose = [...out].reverse().find(x => x.scene);
      if (lastClose?.scene?.close) out.push({ scene: { ...ctx.wide }, hang: 'start', still: units.flat().filter(x => !seen.has(x)), back: 1, focus: [] });
    }
    if (b.kind === 'sag') { if (b.data.notch <= 3) out.push({ sag: b.data.notch, dir: line(ctx, CR.sag, {}, key), focus: [] }); continue; }
    if (b.kind === 'fall') {
      const n = b.who[0];
      if (seen.has(n)) continue;
      const pair = (b.data.pair || [n]).filter(x => !seen.has(x));
      const same = (d.beats[i + 1]?.kind === 'fall' && pair.includes(d.beats[i + 1].who[0])) ? pair : [n];
      for (const x of same) seen.add(x);
      out.push({ drop: same, splash: 1, dir: line(ctx, same.length > 1 ? CR.fall : CR.fall1, { who: nameList(same) }, key), focus: same });
      continue;
    }
    if (b.kind === 'cut') {
      const n = b.who[0], by = b.data.by; seen.add(n);
      // the cut, up close under the pier (art job H07), then back to the whole rope line
      out.push({ scene: { ...ctx.scene('under-pier', false, { TJ: null, [by]: ['stand', 1, 'rope'], [n]: ['stand', 2, 'rope'] }), close: 1 }, dir: `${by} and ${n} are hanging on the same rope, and ${n} is slipping.`, focus: [by, n], act: { [n]: 'strain' } });
      out.push({ drop: [n], splash: 1, shake: 1, dir: line(ctx, CR.cut, { a: by, b: n }, key), focus: [by, n], act: { [n]: 'flinch' }, know: ['A cut rope', `${by} cut ${n} loose.`] });
      const h = voice(ctx, HURT, n, { a: by }, key + 'h'); if (h) out.push(conf(n, h));
      const dd = voice(ctx, DID, by, {}, key + 'd'); if (dd) out.push(conf(by, dd));
      continue;
    }
    if (b.kind === 'rope-win') {
      const w = b.who;
      out.push(tj(line(ctx, b.data.alone ? CR.winAlone : CR.win, { w: nameList(w), are: w.length > 1 ? 'are' : 'is', pos: ctx.V.pron?.[w[0]]?.posAdj || 'their' }, key), { focus: ['TJ', ...w], power: [...w], act: { [w[0]]: 'cheer' } }));
    }
  }
  return out;
}

// ── Double Cross ──────────────────────────────────────────────────────
const DC = {
  board: ["{a} and {b}, you've got the most tokens. Now the fun part. Each of you gets two cards: share, or steal. Pick one, face down.",
    "Congratulations, {a} and {b}! Best total on the board. Now let's find out if you trust each other."],
  rules: ["If you both share, you're both safe. If one of you steals, only the thief is safe. If you both steal, nobody is."],
  think: [V("We share. Right? We share.", { soft: ["Please share. I'm sharing. I promise I'm sharing."] }), V("I'm sharing. You should too.")],
  thinkB: [V("Yeah. Share. Of course."), V("Obviously. We're a team.")],
  flip: ['TJ turns the cards over.', 'The cards go face up.'],
  both: ['Nobody stole. They are all safe.', 'Every card says share! They hug.'],
  steal: ['{a} picked steal. {b} picked share.', '{b} shared. {a} did not.'],
  bothSteal: ['More than one of them stole. Nobody is safe, and the next pair gets the choice.', 'Two steals. TJ laughs for a long time.'],
};
export function doubleCrossSteps(d, ctx) {
  const out = [...raceSteps(d, ctx, { id: 'double-cross', stop: 'choice', toBoard: true })];
  const safe = [];
  for (const [i, b] of (d.beats || []).entries()) {
    if (b.kind !== 'choice') continue;
    const key = `dc${i}`;
    const unit = b.who, [a, bb] = unit;
    const choice = b.data.choice || { [a]: b.data.a, [bb]: b.data.b };
    out.push({ scene: ctx.scene('vault', false, Object.fromEntries(unit.map((n, j) => [n, j < 2 ? ['stand', j, 'pod'] : ['stand', j - 2]]))), ...tj(line(ctx, DC.board, { a: nameList(unit.slice(0, -1)), b: unit[unit.length - 1] }, key)), focus: ['TJ', ...unit] });
    if (b.data.k === 0) out.push(tj(DC.rules[0]));
    const t1 = voice(ctx, DC.think, a, {}, key + 'a'); if (t1) out.push(say(a, t1, bb));
    const t2 = voice(ctx, DC.thinkB, bb, {}, key + 'b'); if (t2) out.push(say(bb, t2, a));
    out.push({ dir: line(ctx, DC.flip, {}, key + 'f'), focus: unit });
    const thieves = unit.filter(n => choice[n] === 'steal');
    if (!thieves.length) { safe.push(...unit); out.push({ dir: line(ctx, DC.both, {}, key + 'r'), focus: unit, act: Object.fromEntries(unit.map(n => [n, 'cheer'])), power: [...safe] }); }
    else if (thieves.length > 1) out.push({ dir: line(ctx, DC.bothSteal, {}, key + 'r'), focus: unit, act: Object.fromEntries(unit.map(n => [n, 'slump'])) });
    else {
      const thief = thieves[0], marks = unit.filter(n => n !== thief), mark = marks[0];
      safe.push(thief);
      out.push({ dir: line(ctx, DC.steal, { a: thief, b: nameList(marks) }, key + 'r'), focus: [thief, mark], shake: 1, act: { [mark]: 'flinch' }, power: [...safe] });
      const h = voice(ctx, HURT, mark, { a: thief }, key + 'h'); if (h) out.push(say(mark, h, thief, { act: { [mark]: 'shout' } }));
      const dd = voice(ctx, DID, thief, {}, key + 'd'); if (dd) out.push(conf(thief, dd));
    }
  }
  return out;
}

// ── Trust Fall ────────────────────────────────────────────────────────
const TF = {
  start: ['One by one, the pairs go out to the tower. One partner climbs to the plank and puts on a blindfold. The other goes to the lever on the dock.'],
  tj: ["Fallers, you let go when you're ready. Catchers, you catch them. Or you don't, and I give you a phone call home. Your choice!"],
  edge: ['{f} stands at the end of the plank with the blindfold on, and {c} takes the lever.', '{c} grips the lever. Up on the plank, {f} shuffles to the edge.', '{f} feels for the end of the plank with {pos} heel. {c} puts both hands on the lever.'],
  wait: ['{f} stands there a long time before letting go.', '{f} says "Okay. Okay. Okay." and still does not move.'],
  go: ['{f} drops backwards straight away.', '{f} lets go without a second thought.'],
  caught: ['{c} pulls the lever at the right moment, and the net catches {f}.', 'The safety line goes tight. {c} has {f}.', '{c} holds the lever down. {f} swings in safe.'],
  dropped: ["{c} lets go of the lever. {f} drops all the way into the water.", '{c} takes {cpos} hands off the lever. {f} falls.'],
  win: ['{w} had the fastest clean fall! {w} win!'],
};
export function trustFallSteps(d, ctx) {
  const out = [];
  let shown = 0;
  for (const [i, b] of (d.beats || []).entries()) {
    const key = `tf${i}`;
    if (b.kind === 'trust-start') { out.push({ scene: ctx.scene('tower', false, {}), dir: line(ctx, TF.start, {}, key), focus: [] }); out.push(tj(TF.tj[0])); continue; }
    if (b.kind === 'caught' || b.kind === 'dropped') {
      const [f, c] = b.who;
      const drop = b.kind === 'dropped';
      if (!drop && ++shown > 5) continue;
      const pos = ctx.V.pron?.[f]?.posAdj || 'their', cpos = ctx.V.pron?.[c]?.posAdj || 'their';
      out.push({ scene: ctx.scene('tower', false, { [f]: ['stand', 0, 'plank'], [c]: ['stand', 0, 'lever'] }), dir: line(ctx, TF.edge, { f, c, pos }, key), focus: [f, c] });
      out.push({ dir: line(ctx, b.data.hesitate > 0.5 ? TF.wait : TF.go, { f }, key + 'w'), focus: [f] });
      if (drop) {
        out.push({ dir: line(ctx, TF.dropped, { f, c, cpos }, key + 'r'), drop: [f], splash: 1, shake: 1, focus: [c, f], know: ['Let go', `${c} chose the call home over ${f}.`] });
        const h = voice(ctx, HURT, f, { a: c }, key + 'h'); if (h) out.push(conf(f, h));
        const dd = voice(ctx, DID, c, {}, key + 'd'); if (dd) out.push(conf(c, dd));
      } else out.push({ dir: line(ctx, TF.caught, { f, c }, key + 'r'), focus: [c, f], act: { [c]: 'cheer' } });
      continue;
    }
    if (b.kind === 'trust-win') out.push(tj(line(ctx, TF.win, { w: nameList(b.who) }, key), { focus: ['TJ', ...b.who], power: [...b.who] }));
  }
  return out;
}

// ── Who Said It ───────────────────────────────────────────────────────
const WQ = {
  snake: 'Who is the biggest snake in this house?', threat: 'Who is the biggest threat in this game?', coattails: "Who is riding everybody else's coattails?",
  'next-in': 'Who should be the next one going into the Arena?', 'never-trust': 'Who would you never trust with your game?', final: 'Who would you take to the final with you?',
};
const WS = {
  intro: ["Everybody on the deck! I ask a question about the house. You answer out loud, one at a time. Match the most popular answer, you get a point. Easy! Unless you have friends."],
  most: ['The most common answer: {top}, with {n}.', '{top} gets the most votes, {n} of them.'],
  react: [V("Wow. Okay. So that's what everybody thinks of me."), V("{n} of you said my name. I'm going to remember every single one."), V("Fine. If that's how it is, that's how it is.")],
  warm: [V("That actually means a lot. Thank you."), V("I didn't expect that. I'll take it.")],
  win: ["{w} matched the house the most! {w} {are} safe!"],
};
export function whoSaidItSteps(d, ctx) {
  const out = [];
  const all = (d.order || []).flat();
  for (const [i, b] of (d.beats || []).entries()) {
    const key = `ws${i}`;
    if (b.kind === 'quiz-start') {
      out.push({ scene: ctx.scene('club', true, Object.fromEntries(all.slice(0, 11).map((n, j) => [n, ['stand', j]]))), focus: [] });
      out.push(tj(WS.intro[0]));
      continue;
    }
    if (b.kind === 'question') {
      const q = WQ[b.data.q] || WQ.snake;
      out.push(tj(q));
      // a few answers out loud, the ones that sting first, then the tally
      const said = Object.entries(b.data.answers).sort((x, y) => (y[1] === b.data.top) - (x[1] === b.data.top)).slice(0, 5);
      for (const [v, n] of said) out.push(say(v, `${n}.`, n, { act: { [n]: b.data.q === 'final' ? 'laugh' : 'flinch' } }));
      out.push({ dir: line(ctx, WS.most, { top: b.data.top, n: b.data.tally[b.data.top] }, key), focus: [b.data.top] });
      const r = voice(ctx, b.data.q === 'final' ? WS.warm : WS.react, b.data.top, { n: b.data.tally[b.data.top] }, key + 'r');
      if (r) out.push(conf(b.data.top, r));
      continue;
    }
    if (b.kind === 'quiz-win') out.push(tj(line(ctx, WS.win, { w: nameList(b.who), are: b.who.length > 1 ? 'are' : 'is' }, key), { focus: ['TJ', ...b.who], power: [...b.who] }));
  }
  return out;
}
