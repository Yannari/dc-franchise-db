// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/daily-more.js — the dailies on the user's G sets, beat by beat
// ══════════════════════════════════════════════════════════════════════
//
// Deep Freeze, Rolling in the Deep, Road Kill, Mud Brawl, Buried and Food Wars (js/ch/daily/more.js); Car
// Jump, Locked In and The Box are races (daily-race.js). Each set is the user's empty scene with one object
// per player laid on it from the plate's marks (the tubs, the log, the coffins and buzzers, the domes), and
// every player on their own spot.
import { speak } from './voices.js';
import { pickBy, hashOf, nameList } from './games.js';
import { raftSteps } from './daily-betray.js';

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
// The one named reacts on the spot (ch/daily/named.js decides how: a friend's answer is a betrayal, a short fuse
// snaps back, an enemy's answer is no surprise, the final question is a compliment). {b}: who named them.
const NAMED = {
  betrayed: [V("{b}? You said me? Seriously?", { soft: ['{b}. That actually hurt.'], sharp: ['Wow. Thanks, {b}. Really.'] }),
    V("I'm sorry, {b} said what?", { loud: ['Excuse me? {b}?'] }), V("Okay. Noted, {b}. Noted.", { dry: ['Good to know, {b}.'] })],
  fires: [V("Keep talking, {b}. I'm listening.", { loud: ["Say it louder, {b}! I didn't hear you!"] }),
    V("Real brave, {b}.", { sharp: ['Cute, {b}. Very cute.'] }), V("We'll see who's laughing at the vote, {b}.")],
  expected: [V("Of course {b} said me. Shocking.", { dry: ['{b}. What a surprise.'] }), V("Yeah, I figured {b} would.")],
  proud: [V("I'll take that as a compliment, {b}.", { dry: ['Thank you, {b}. I know.'] }), V("Good. Be scared, {b}.", { soft: ['Me? Really? Okay. Thanks, {b}.'] })],
  flattered: [V("Aw, {b}! Right back at you.", { soft: ['{b}! Stop, you\'ll make me cry.'] }), V("Okay, {b}. I love you too.")],
};
const NAMED_ACT = { proud: 'cheer', betrayed: 'slump', fires: 'shout', expected: 'look', flattered: 'laugh' };
const namedReact = (ctx, react, who, by, key) => {
  const pool = NAMED[react];
  const t = pool && voice(ctx, pool, who, { b: by }, key);
  return t ? say(who, t, by, { act: { [who]: NAMED_ACT[react] } }) : null;
};
const conf = (by, text) => ({ conf: [by, text] });
const tj = (text, extra = {}) => ({ tj: text, focus: ['TJ'], ...extra });
const final = label => !/heat \d/i.test(label || '');

const TALK = {
  needle: [[V("You're shaking already."), V("And you're about to be shaking on the sand.")], [V("Just get out. Save yourself the pain."), V("After you.")],
    [V("I can see your lips turning blue from here."), V("Then stop looking at my lips.")]],
  couple: [[V("Stay with me. Look at me."), V("I'm here. I'm not going anywhere.")], [V("If you get out, I'm getting out."), V("Then neither of us is getting out.")]],
  friends: [[V("How are you holding up?"), V("I can't feel anything below my neck. You?")], [V("We do this together."), V("Together. Until one of us can't.")]],
  smalltalk: [[V("Is it getting worse, or is it just me?"), V("It's getting worse.")], [V("What's the first thing you'll eat after this?"), V("Something hot. Anything hot.")],
    [V("Don't talk. Talking makes it colder."), V("Okay.")]],
};
function talk(ctx, b, key) {
  const [x, y] = b.who; const tone = b.data.tone;
  // an exchange nobody has had yet today
  const pool = TALK[tone] || TALK.smalltalk;
  const fresh = pool.filter(p => !ctx.V.used.has(p[0].say));
  const pair = pickBy(fresh.length ? fresh : pool, `${ctx.seed}|${key}`);
  ctx.V.used.add(pair[0].say);
  const t1 = voice(ctx, [pair[0]], x, {}, key + 'a') || pair[0].say, t2 = voice(ctx, [pair[1]], y, {}, key + 'b') || pair[1].say;
  return [say(x, t1, y, { act: { [x]: tone === 'needle' ? 'lean' : 'talkpop' } }), say(y, t2, x)];
}
const FALLCONF = [V("My body just said no. I had nothing left."), V("I'm so mad at myself.", { loud: ["I'm SO mad right now!"] }), V("I thought I'd last longer than that. I really did.")];

// ── Deep Freeze ───────────────────────────────────────────────────────
const TUB_X = [[150, 572], [360, 572], [570, 572], [780, 572], [990, 572], [1200, 572], [250, 690], [460, 690], [670, 690], [880, 690], [1090, 690], [1300, 690]];
const DF = {
  start: ['{who} step into their tubs and lower themselves into the ice, gasping.', '{who} sit down in the ice water. Somebody screams. Somebody laughs.'],
  tj: ["Everybody in! Sit down, up to your necks. You get out, you're done. Simple! And very, very cold!"],
  numb: ['A few minutes in, the shivering starts.', "Their lips are turning blue. Nobody's talking much now."],
  cocoa: ["Who wants hot cocoa? Marshmallows, whipped cream. All you have to do is stand up!", "Chef made cocoa! It's so warm, people. So, so warm."],
  'more-ice': ['The crew tips another bucket of ice into every tub.', 'More ice. A couple of people yell at TJ.'],
  blanket: ["Blankets! Fluffy, warm blankets, fresh from the dryer. Anybody? Anybody at all?"],
  shaking: ['Everybody left is shaking hard now. Teeth chattering, eyes shut.'],
  fall: ['{who} stands up and climbs out of the tub, shaking.', "{who} can't take any more and gets out.", '{who} grabs the side and hauls out onto the sand.', '{who} is out. A towel, quick.',
    '{who} stands up with a shout and steps out of the ice.', "{who}'s whole body is shaking. Out {who} goes."],
  gives: ['{who} climbs out and goes straight for the cocoa.', '{who} takes the blanket. That is the end of it.'],
  win: ['{who} is the last one in the ice! {who} wins!'],
  heatWin: ['{who} outlasted everybody in that heat!'],
};
export function deepFreezeSteps(d, ctx) {
  const out = [], safe = [];
  let tubs = [], sand = 0;
  const where = {};
  for (const [i, b] of (d.beats || []).entries()) {
    const key = `df${i}`;
    if (b.kind === 'tubs') {
      tubs = b.who; sand = 0;
      for (const [j, n] of tubs.entries()) where[n] = ['stand', j % 12, 'tub'];
      out.push({ scene: ctx.scene('icetubs', false, Object.fromEntries(tubs.map(n => [n, where[n]]))), props: tubs.map((_, j) => ({ k: 'ice-tub', u: TUB_X[j % 12][0] / 1600, v: (TUB_X[j % 12][1] + 22) / 900, w: j < 6 ? 11 : 12.5 })),
        pose: Object.fromEntries(tubs.map(n => [n, 'ice'])), seg: [b.data.label, 'Deep Freeze'], stand: 'start', still: tubs, focus: [] });
      out.push(tj(DF.tj[0]));
      out.push({ dir: line(ctx, DF.start, { who: nameList(tubs.slice(0, 4)) + (tubs.length > 4 ? ' and the rest' : '') }, key), focus: tubs.slice(0, 4) });
      continue;
    }
    if (DF[b.kind] && ['numb', 'cocoa', 'more-ice', 'blanket', 'shaking'].includes(b.kind)) {
      out.push(b.kind === 'cocoa' || b.kind === 'blanket' ? tj(line(ctx, DF[b.kind], {}, key)) : { dir: line(ctx, DF[b.kind], {}, key), focus: [], shake: b.kind === 'more-ice' ? 1 : 0, act: b.kind === 'shaking' ? Object.fromEntries(b.who.slice(0, 6).map(n => [n, 'strain'])) : {} });
      continue;
    }
    if (b.kind === 'talk') { for (const s of talk(ctx, b, key)) out.push(s); continue; }
    if (b.kind === 'fall' || b.kind === 'gives-up') {
      const n = b.who[0];
      out.push({ dir: line(ctx, b.kind === 'fall' ? DF.fall : DF.gives, { who: n }, key), focus: [n], pose: { [n]: null }, exit: [n], act: { [n]: 'flinch' } });
      if (hashOf(key) % 3 === 0) { const c = voice(ctx, FALLCONF, n, {}, key + 'c'); if (c) out.push(conf(n, c)); }
      continue;
    }
    if (b.kind === 'last-in') {
      const n = b.who[0], f = final(b.data.label);
      if (f) safe.push(n);
      out.push(tj(line(ctx, f ? DF.win : DF.heatWin, { who: n }, key), { focus: ['TJ', n], act: { [n]: 'cheer' }, ...(f ? { power: [...safe] } : {}) }));
    }
  }
  return out;
}

// ── Rolling in the Deep ───────────────────────────────────────────────
const LR = {
  start: ['{who} climb up and grab the log, legs dangling over the water.', '{who} hang from the log, side by side, waiting for it to move.'],
  tj: ["Hang on to the log. When it spins, you spin with it. Let go, you're in the water. Ready? Spin it!"],
  spin: ['The log starts to turn. Slowly at first.', 'The motor kicks in and the log begins to roll.'],
  faster: ['Faster now. Their legs swing out with every turn.', 'The log spins faster, and somebody yells.', 'Faster again. It is hard to tell who is still holding on.'],
  reverse: ['The log stops dead and spins the other way. Everybody lurches.'],
  fall: ['{who} lets go and flies into the water.', "{who}'s grip slips on the turn. Splash.", '{who} goes round once, twice, and drops.', '{who} hits the water flat.', '{who} holds on with one hand, then none.'],
  froze: ['{who} looks down at the water and locks up.'],
  win: ['{who} is the last one on the log! {who} wins!'], heatWin: ['{who} is the last one hanging and goes through to the final!'],
};
export function logRollSteps(d, ctx) {
  const out = [], safe = [];
  for (const [i, b] of (d.beats || []).entries()) {
    const key = `lr${i}`;
    if (b.kind === 'log-start') {
      const on = b.who;
      out.push({ scene: ctx.scene('log', false, Object.fromEntries(on.map((n, j) => [n, ['stand', j % 5, 'hang']]))), props: [{ k: 'log', u: 820 / 1600, v: 312 / 900, w: 45 }],
        seg: [b.data.label, 'Rolling in the Deep'], stand: 'start', still: on, focus: [] });
      if (i === 0) out.push(tj(LR.tj[0]));
      out.push({ dir: line(ctx, LR.start, { who: nameList(on) }, key), focus: on });
      continue;
    }
    if (['spin', 'faster', 'reverse'].includes(b.kind)) { out.push({ dir: line(ctx, LR[b.kind], {}, key), focus: [], shake: b.kind === 'reverse' ? 1 : 0, act: Object.fromEntries(b.who.map(n => [n, 'strain'])) }); continue; }
    if (b.kind === 'talk') { for (const s of talk(ctx, b, key)) out.push(s); continue; }
    if (b.kind.startsWith('fear-')) { if (b.kind !== 'fear-beaten') out.push({ dir: line(ctx, LR.froze, { who: b.who[0] }, key), focus: [b.who[0]], act: { [b.who[0]]: 'flinch' } }); continue; }
    if (b.kind === 'fall') {
      const n = b.who[0];
      out.push({ dir: line(ctx, LR.fall, { who: n }, key), drop: [n], splash: 1, focus: [n] });
      if (hashOf(key) % 3 === 0) { const c = voice(ctx, FALLCONF, n, {}, key + 'c'); if (c) out.push(conf(n, c)); }
      continue;
    }
    if (b.kind === 'last-on') {
      const n = b.who[0], f = final(b.data.label);
      if (f) safe.push(n);
      out.push(tj(line(ctx, f ? LR.win : LR.heatWin, { who: n }, key), { focus: ['TJ', n], act: { [n]: 'cheer' }, ...(f ? { power: [...safe] } : {}) }));
    }
  }
  return out;
}

// ── Road Kill: King of the Raft's beats, on the flatbed ───────────────
export const roadKillSteps = (d, ctx) => raftSteps(d, ctx, {
  plate: 'truck-bed', group: 'bed', slots: 12, fallen: 'net', close: null, seg: 'Road Kill',
  lines: {
    start: ['{who} climb onto the back of the truck. The engine starts.', 'The truck pulls away with {who} on the flatbed, wobbling.'],
    tj: ["The truck's moving, people! Push everybody else off the back, into the nets. Last one standing on the truck wins!"],
    pushed: ['{a} lowers a shoulder and sends {b} over the side into the net.', '{a} drags {b} to the edge and lets go. Into the net.', '{b} loses {pos} footing on a bump, and {a} finishes the job.',
      '{a} shoves {b} as the truck turns. {b} flies into the net.', '{a} and {b} grapple at the edge until {b} goes over.'],
    gang: ['{a} and {m} pin {b} against the side and tip {b} into the net.', '{a} and {m} go after {b} together. {b} goes over the side.', '{m} grabs {b} round the waist while {a} pushes. Into the net.',
      '{b} gets caught between {a} and {m}, and over {b} goes.', '{a} and {m} team up on {b}. It is two against one, and it shows.'],
    shove: ['{a} goes for {b}, but the truck lurches and both of them nearly fall.', '{a} and {b} lock arms in the middle of the flatbed.', '{b} braces against the cab and {a} bounces off.'],
    betray: ['Only allies left on the truck now. {a} looks at {b}, and shoves.', '{a} and {b} were together all game. {a} pushes {b} into the net anyway.', "{a} doesn't wait for {b} to turn first. Over the side {b} goes."],
    win: ['{w} is the last one on the truck!', '{w} wins Road Kill!'], heat: ['{w} is the last one standing and goes through!'],
  },
});

// ── Mud Brawl ─────────────────────────────────────────────────────────
const MB = {
  draw: ["The bracket's drawn out of the hat. Two at a time, into the mud. First to two flags wins the bout."],
  bye: ['{a} gets a free pass to the next round.'],
  bout: ['{a} and {b} climb into the pit.', '{a} against {b}. They face off in the mud.', 'Next up: {a} and {b}.'],
  flag: ['{a} wrestles a flag away from {b}.', '{a} gets an arm free, grabs the flag, and drags it back.', '{a} slides through the mud under {b} and comes up with the flag.', '{a} pins {b} and plants the flag.'],
  quick: ['{a} beats {b}, two flags to {n}.', '{a} takes care of {b} in the mud, two to {n}.'],
  upset: ['Nobody saw that coming. {a} just beat {b}.'],
  win: ['{a} wins the Mud Brawl!', '{a} is the last one standing in the bracket!'],
};
export function mudBrawlSteps(d, ctx) {
  const out = [], safe = [];
  const beats = d.beats || [];
  // the later rounds are shown flag by flag; the early bouts in a line each
  let field = [], late = false;
  const crowdOf = (a, b) => Object.fromEntries(field.filter(n => n !== a && n !== b).slice(0, 8).map((n, j) => [n, ['stand', j]]));
  for (const [i, b] of beats.entries()) {
    const key = `mb${i}`;
    if (b.kind === 'bracket') { field = b.who; out.push({ scene: ctx.scene('mudpit', false, crowdOf()), seg: [b.data.label, 'Mud Brawl'], focus: [] }); out.push(tj(MB.draw[0])); continue; }
    if (b.kind === 'bye') { out.push({ dir: line(ctx, MB.bye, { a: b.who[0] }, key), focus: [b.who[0]] }); continue; }
    if (b.kind === 'bout') {
      const [a, c] = b.who;
      const left = beats.slice(i).filter(x => x.kind === 'bout' && x.data.round === b.data.round).length;
      late = b.data.last || beats.slice(i).filter(x => x.kind === 'bout').length <= 3;
      out.push({ scene: ctx.scene('mudpit', false, { [a]: ['stand', 0, 'duel'], [c]: ['stand', 1, 'duel'], ...crowdOf(a, c) }), pose: { [a]: 'mud', [c]: 'mud' }, dir: line(ctx, MB.bout, { a, b: c }, key), focus: [a, c] });
      continue;
    }
    if (b.kind === 'talk') { out.push(say(b.who[0], b.data.tone === 'needle' ? `You're going down, ${b.who[1]}.` : `Good luck, ${b.who[1]}.`, b.who[1], { act: { [b.who[0]]: 'lean' } })); continue; }
    if (b.kind === 'flag') { if (late) out.push({ dir: line(ctx, MB.flag, { a: b.who[0], b: b.who[1] }, key), focus: b.who, act: { [b.who[0]]: 'strain', [b.who[1]]: 'flinch' }, chip: [b.who[0], `${b.data.score[b.who[0]]} FLAG${b.data.score[b.who[0]] > 1 ? 'S' : ''}`] }); continue; }
    if (b.kind === 'bout-win') {
      const [w, l] = b.who;
      const flags = beats.slice(0, i).reverse().find(x => x.kind === 'flag')?.data.score || {};
      if (!late) out.push({ dir: line(ctx, MB.quick, { a: w, b: l, n: ['nothing', 'one'][flags[l] || 0] || 'one' }, key), focus: [w, l], act: { [w]: 'cheer', [l]: 'slump' } });
      else out.push({ dir: `${w} takes the bout.`, focus: [w, l], act: { [w]: 'cheer', [l]: 'slump' }, chip: [w, ''] });
      if (b.data.upset) out.push({ dir: line(ctx, MB.upset, { a: w, b: l }, key + 'u'), focus: [w] });
      continue;
    }
    if (b.kind === 'brawl-win') { safe.push(b.who[0]); out.push(tj(line(ctx, MB.win, { a: b.who[0] }, key), { focus: ['TJ', b.who[0]], act: { [b.who[0]]: 'cheer' }, power: [...safe] })); }
  }
  return out;
}

// ── Buried ────────────────────────────────────────────────────────────
const COFFIN_X = [150, 380, 610, 840, 1070, 1300];
const BQ = { snake: 'who is the biggest snake in this house', threat: 'who is the biggest threat', fake: 'who is the fakest person here', 'next-in': 'who should go into the Arena next', final: 'who would you take to the final' };
const BU = {
  start: ['The buried partners lie down in their coffins. The lids close. Sand goes on top.', 'One by one the lids shut over the buried partners, and the crew shovels sand over them.'],
  tj: ["Your partners answered some questions about the house this morning. Now you guess what they said. Get it right, you score. Everybody hears everything. Have fun!"],
  ask: ['Okay! Question: {q}?', 'Next one. {q}?', 'Here we go. {q}?'],
  right: ['{a} says {g}. Right! That is what {b} said.', '{g}! {a} got it. {b} said {g}.'],
  wrong: ['{a} says {g}. Wrong. {b} said {p}.', '{a} guesses {g}, but {b} said {p}.'],
  panic: ['From inside a coffin, {a} starts pounding on the lid.'],
  calm: [V("Hey. It's me. I'm right here. Just breathe with me."), V("You're okay. Count with me. One. Two.")],
  tap: ['{a} knocks three times on the lid. The crew digs {a} out. That pair is done.'],
  win: ['{w} matched the most! {w} win Buried!'],
};
export function buriedSteps(d, ctx) {
  const out = [];
  let roles = [], q = null, reacted = false;
  const roleOf = n => roles.find(r => r.includes(n));
  for (const [i, b] of (d.beats || []).entries()) {
    const key = `bu${i}`;
    if (b.kind === 'coffins') {
      roles = b.data.roles;
      const cast = Object.fromEntries(roles.map(([bur, ans], j) => [ans, ['stand', j, 'coffin']]));
      out.push({ scene: ctx.scene('buried', false, cast), props: roles.flatMap((_, j) => [{ k: 'coffin', u: COFFIN_X[j] / 1600, v: 712 / 900, w: 12, front: 1 }, { k: 'buzzer', u: (COFFIN_X[j] + 62) / 1600, v: 612 / 900, w: 2.2 }]),
        seg: [b.data.label, 'Buried'], focus: [] });
      out.push(tj(BU.tj[0]));
      out.push({ dir: line(ctx, BU.start, {}, key), focus: roles.map(r => r[1]) });
      continue;
    }
    if (b.kind === 'panic-calmed' || b.kind === 'tap-out') {
      const [bur, ans] = b.who;
      out.push({ dir: line(ctx, BU.panic, { a: bur }, key), focus: [ans], shake: 1 });
      if (b.kind === 'panic-calmed') { const t = voice(ctx, BU.calm, ans, {}, key + 'c'); if (t) out.push(say(ans, t)); }
      else out.push({ dir: line(ctx, BU.tap, { a: bur }, key + 't'), focus: [ans], act: { [ans]: 'slump' } });
      continue;
    }
    if (b.kind === 'ask') { reacted = false; q = BQ[b.data.q] || BQ.snake; out.push(tj(line(ctx, BU.ask, { q: q[0].toUpperCase() + q.slice(1) }, key))); continue; }
    if (b.kind === 'answer') {
      const [ans, bur, pick] = b.who;
      out.push(say(ans, `${b.data.guess}.`, null, { act: { [ans]: 'talkpop' } }));
      out.push({ dir: line(ctx, b.data.right ? BU.right : BU.wrong, { a: ans, b: bur, g: b.data.guess, p: pick }, key), focus: [ans], act: { [ans]: b.data.right ? 'cheer' : 'slump' }, chip: [ans, `${b.data.pts} RIGHT`] });
      // the one named heard it: a betrayal or a snap always, anything else once a question
      const strong = ['betrayed', 'fires'].includes(b.data.react);
      if (b.data.react && (strong || !reacted)) { const r = namedReact(ctx, b.data.react, pick, bur, key + 'n'); if (r) { out.push(r); reacted = true; } }
      continue;
    }
    if (b.kind === 'buried-win') out.push(tj(line(ctx, BU.win, { w: nameList(b.who) }, key), { focus: ['TJ', ...b.who], power: [...b.who] }));
  }
  return out;
}

// ── Food Wars ─────────────────────────────────────────────────────────
const SEAT_X = [130, 255, 380, 505, 630, 755, 880, 1005, 1130];
const FW = {
  start: ['{who} sit down at the long table. Every plate is under a silver dome.'],
  tj: ["Fingers on buzzers! I ask, you buzz. Get it right and you pick who eats the next dish. Don't eat it, you're gone. Bon appetit!"],
  buzz: ['{a} buzzes first and gets it right.', '{a} slams the buzzer. Correct!', 'Buzz! {a} has it.'],
  pick: [V("{b}. Enjoy.", { sharp: ['{b}. Bon appetit.'] }), V("I pick {b}."), V("{b}. Sorry. Not sorry.")],
  dome: ['TJ lifts the dome in front of {b}: {dish}.', 'Under the dome: {dish}. {b} goes pale.'],
  eats: ['{b} holds {pos} nose and gets it down.', '{b} eats every bite, then gags.', '{b} chews, swallows, and slams the table.', '{b} eats it, looking straight at {a}.'],
  quick: ['{a} picks {b} for the {dish}. {b} pushes it away and leaves the table.', '{a} gives {b} the {dish}, and {b} walks off.', '{b} gets the {dish} from {a} and refuses it. Out.'],
  refuses: ["{b} pushes the plate away. {b} can't do it.", '{b} gags and stands up from the table. Out.', '{b} takes one look and walks off.'],
  win: ['{w} is the last one at the table!', '{w} survived every plate and wins Food Wars!'], heat: ['{w} survives the heat and goes through!'],
};
// an early heat: the first two rounds whole, then only who leaves the table (the final is shown whole)
const SHORT_AFTER = 2;
export function foodWarsSteps(d, ctx) {
  const out = [], safe = [];
  let seated = [], sand = 0, rounds = 0, whole = true;
  const where = {};
  for (const [i, b] of (d.beats || []).entries()) {
    const key = `fw${i}`;
    if (b.kind === 'table') {
      seated = b.who; sand = 0; rounds = 0; whole = final(b.data.label);
      for (const [j, n] of seated.entries()) where[n] = ['stand', j % 9, 'seat'];
      out.push({ scene: ctx.scene('banquet', false, Object.fromEntries(seated.map(n => [n, where[n]]))), props: seated.map((_, j) => ({ k: 'dome', u: SEAT_X[j % 9] / 1600, v: 500 / 900, w: 5.6, front: 1 })),
        seg: [b.data.label, 'Food Wars'], stand: 'start', still: seated, focus: [] });
      out.push(tj(FW.tj[0]));
      out.push({ dir: line(ctx, FW.start, { who: nameList(seated.slice(0, 4)) + (seated.length > 4 ? ' and the rest' : '') }, key), focus: seated.slice(0, 4) });
      continue;
    }
    if (b.kind === 'buzz') {
      const [a, t] = b.who;
      if (!whole && ++rounds > SHORT_AFTER) continue;
      out.push({ dir: line(ctx, FW.buzz, { a }, key), focus: [a], act: { [a]: 'cheer' } });
      const p = voice(ctx, FW.pick, a, { b: t }, key + 'p'); out.push(say(a, p || `${t}.`, t, { act: { [t]: 'flinch' } }));
      if (['betrayed', 'fires'].includes(b.data.react)) { const r = namedReact(ctx, b.data.react, t, a, key + 'n'); if (r) out.push(r); }
      out.push({ dir: line(ctx, FW.dome, { b: t, dish: b.data.dish }, key + 'd'), focus: [t], act: { [t]: 'strain' } });
      continue;
    }
    if (b.kind === 'eats' && !whole && rounds > SHORT_AFTER) continue;
    if (b.kind === 'eats') { const n = b.who[0]; const by = d.beats[i - 1]?.who?.[0]; out.push({ dir: line(ctx, FW.eats, { b: n, a: by || 'everybody', pos: ctx.V.pron?.[n]?.posAdj || 'their' }, key), focus: [n], act: { [n]: 'strain' } }); continue; }
    if (b.kind === 'refuses') {
      const n = b.who[0];
      const by = d.beats[i - 1]?.who?.[0];
      const short = !whole && rounds > SHORT_AFTER;
      out.push({ dir: short ? line(ctx, FW.quick, { a: by || 'Somebody', b: n, dish: b.data.dish }, key) : line(ctx, FW.refuses, { b: n }, key), focus: [n], act: { [n]: 'slump' }, move: { [n]: ['stand', sand++ % 4] } });
      if (hashOf(key) % 2 === 0) { const c = voice(ctx, [V("I'm not eating that. I don't care. Nothing is worth that."), V("I tried. My body said no.")], n, {}, key + 'c'); if (c) out.push(conf(n, c)); }
      continue;
    }
    if (b.kind === 'last-seated') {
      const n = b.who[0], f = final(b.data.label);
      if (f) safe.push(n);
      out.push(tj(line(ctx, f ? FW.win : FW.heat, { w: n }, key), { focus: ['TJ', n], act: { [n]: 'cheer' }, ...(f ? { power: [...safe] } : {}) }));
    }
  }
  return out;
}

// ── Trapeze Duel ──────────────────────────────────────────────────────
const TZ = {
  draw: ["Two at a time, up the ladders! When I blow the horn, you swing out, grab each other with your legs, and pull. Whoever ends up in the pond loses the point. First to two!"],
  bye: ['{a} draws the free pass and skips this round.'],
  bout: ['{a} and {b} climb the ladders to the platforms.', '{a} against {b}. Up the ladders they go.', 'Next on the trapezes: {a} and {b}.'],
  again: ['{a} and {b} climb back up for the next point.', 'Back up the ladders, both of them.', 'They swim out of the pond and climb up again.'],
  swing: ['The horn goes. {a} and {b} swing out and crash together in the middle.', 'They swing out. Legs everywhere.', '{a} and {b} meet over the water and lock legs.'],
  point: ['{a} wraps both legs round {b} and pulls. {b} drops into the pond.', '{b} loses the grip on the bar and splashes down.', '{a} kicks free, and {b} falls off the trapeze.', '{a} hangs on with one hand and yanks {b} off with the other leg.'],
  both: ['They pull each other off. Both of them hit the water. No point.', 'Nobody lets go of anybody, and both of them fall. Again.'],
  froze: ["{a} grabs the bar, looks down at the pond, and steps back onto the platform. {a} can't do it.", "{a} won't leave the platform. TJ counts to ten. Nothing."],
  beaten: ['{a} looks down, breathes, and swings anyway.', '{a} is scared of heights, and swings out anyway.'],
  quick: ['{a} beats {b}, two to {n}.', '{a} pulls {b} into the pond twice and moves on, two to {n}.'],
  forfeit: ['{b} forfeits, and {a} goes through without a swing.'],
  upset: ['Nobody saw that coming. {a} just beat {b}.'],
  win: ['{a} wins the Trapeze Duel!', '{a} is the last one swinging!'],
};
export function trapezeSteps(d, ctx) {
  const out = [], safe = [];
  const beats = d.beats || [];
  let field = [], late = false, pair = null, first = true;
  const crowd = (a, b) => Object.fromEntries(field.filter(n => n !== a && n !== b).slice(0, 8).map((n, j) => [n, ['stand', j]]));
  const atPlats = (a, b, wipe) => ({ ...ctx.scene('trapeze', false, { [a]: ['stand', 0, 'plat'], [b]: ['stand', 1, 'plat'], ...crowd(a, b) }), ...(wipe ? {} : { wipe: 0 }) });
  for (const [i, b] of beats.entries()) {
    const key = `tz${i}`;
    if (b.kind === 'bracket') { field = b.who; out.push({ scene: ctx.scene('trapeze', false, crowd()), seg: [b.data.label, 'Trapeze Duel'], focus: [] }); out.push(tj(TZ.draw[0])); continue; }
    if (b.kind === 'bye') { out.push({ dir: line(ctx, TZ.bye, { a: b.who[0] }, key), focus: [b.who[0]] }); continue; }
    if (b.kind === 'bout') {
      const [a, c] = b.who; pair = [a, c]; first = true;
      late = b.data.last || beats.slice(i).filter(x => x.kind === 'bout').length <= 3;
      out.push({ scene: atPlats(a, c, true), dir: line(ctx, TZ.bout, { a, b: c }, key), focus: [a, c] });
      continue;
    }
    if (b.kind === 'talk') { out.push(say(b.who[0], b.data.tone === 'needle' ? `Enjoy the water, ${b.who[1]}.` : `Good luck up there, ${b.who[1]}.`, b.who[1], { act: { [b.who[0]]: 'lean' } })); continue; }
    if (b.kind === 'fear-froze' || b.kind === 'fear-beaten') {
      const n = b.who[0];
      out.push({ dir: line(ctx, b.kind === 'fear-froze' ? TZ.froze : TZ.beaten, { a: n }, key), focus: [n], act: { [n]: b.kind === 'fear-froze' ? 'flinch' : 'strain' } });
      continue;
    }
    if (b.kind === 'swing' || b.kind === 'both-fall') {
      if (!late) continue;
      const [a, c] = pair;
      if (!first) out.push({ scene: atPlats(a, c, false), dir: line(ctx, TZ.again, { a, b: c }, key + 'g'), focus: [a, c] });
      first = false;
      out.push({ dir: line(ctx, TZ.swing, { a, b: c }, key + 's'), focus: [a, c], move: { [a]: ['stand', 0, 'bar'], [c]: ['stand', 1, 'bar'] }, act: { [a]: 'strain', [c]: 'strain' } });
      if (b.kind === 'both-fall') { out.push({ dir: line(ctx, TZ.both, {}, key), drop: [a, c], splash: 1, focus: [a, c] }); continue; }
      const [w, l] = b.who;
      out.push({ dir: line(ctx, TZ.point, { a: w, b: l }, key), drop: [l], splash: 1, focus: [w, l], act: { [w]: 'cheer' }, chip: [w, `${b.data.score[w]} - ${b.data.score[l]}`] });
      continue;
    }
    if (b.kind === 'bout-win') {
      const [w, l] = b.who;
      if (b.data.forfeit) out.push({ dir: line(ctx, TZ.forfeit, { a: w, b: l }, key), focus: [w, l], act: { [l]: 'slump' } });
      else if (!late) {
        const lastSc = beats.slice(0, i).reverse().find(x => x.kind === 'swing')?.data.score || {};
        out.push({ dir: line(ctx, TZ.quick, { a: w, b: l, n: lastSc[l] ? 'one' : 'nothing' }, key), focus: [w, l], act: { [w]: 'cheer', [l]: 'slump' } });
      } else out.push({ dir: `${w} takes the bout.`, focus: [w, l], act: { [w]: 'cheer', [l]: 'slump' } });
      if (b.data.upset) out.push({ dir: line(ctx, TZ.upset, { a: w, b: l }, key + 'u'), focus: [w] });
      continue;
    }
    if (b.kind === 'trapeze-win') { safe.push(b.who[0]); out.push(tj(line(ctx, TZ.win, { a: b.who[0] }, key), { focus: ['TJ', b.who[0]], act: { [b.who[0]]: 'cheer' }, power: [...safe] })); }
  }
  return out;
}

// ── Poison Cup ────────────────────────────────────────────────────────
const PC = {
  tj: ["One cup on this tray is spiked. Only the server knows which. Hand it to anybody you like. Drink the whole thing and you serve next. Spit it out and you're gone!"],
  first: ['{a}, you are serving first. Here is the tray.', 'First server: {a}. Come get your tray.'],
  why: {
    grudge: [V("You've been coming for me all week. Drink up.", { sharp: ['This is for everything you said about me. Cheers.'] }), V("You know exactly why you're getting this one."), V("Payback. Enjoy it.")],
    threat: [V("You're the biggest threat at this table. Nothing personal."), V("If you're gone, I like my chances."), V("Sorry. You win too much.")],
    none: [V("Sorry. Somebody has to drink it."), V("I don't have a reason. You were just there."), V("Don't take it personally, okay?")],
  },
  hand: ['{a} picks up the spiked cup and sets it down in front of {b}.', '{a} slides the cup across the table to {b}.', '{a} walks round the table and hands {b} the cup.'],
  drinks: ['{b} drinks it in one go and slams the cup down. {b} serves next.', '{b} gags once, then swallows the lot. {b} has the tray now.', "{b} gets all of the {cup} down without blinking. Now it's {b}'s turn to serve."],
  quick: ['{a} hands {b} the {cup}. {b} spits it out, and that is that.', '{b} gets the {cup} from {a} and cannot keep it down. Out.', '{a} gives {b} the spiked cup. {b} gags, and {b} is gone.'],
  spits: ['{b} takes one sip of the {cup} and spits it onto the sand. Out.', '{b} gets halfway and it all comes back up. {b} is out.', "{b} can't keep the {cup} down. That's the end of it for {b}."],
  stung: [V("{a} gave me that cup on purpose. I won't forget it."), V("Fine, {a}. Remember this when it's your name at the vote.")],
  win: ['{w} is the last one at the table!', '{w} never spat out a single cup and wins Poison Cup!'], heat: ['{w} is the last one at the table and goes through!'],
};
export function poisonCupSteps(d, ctx) {
  const out = [], safe = [];
  let seated = [], rounds = 0, whole = true;
  for (const [i, b] of (d.beats || []).entries()) {
    const key = `pc${i}`;
    if (b.kind === 'table') {
      seated = b.who; rounds = 0; whole = final(b.data.label);
      out.push({ scene: ctx.scene('banquet', false, Object.fromEntries(seated.map((n, j) => [n, ['stand', j % 9, 'seat']]))), props: seated.map((_, j) => ({ k: 'cup', u: SEAT_X[j % 9] / 1600, v: 500 / 900, w: 2.2, front: 1 })),
        seg: [b.data.label, 'Poison Cup'], stand: 'start', still: seated, focus: [] });
      out.push(tj(PC.tj[0]));
      continue;
    }
    if (b.kind === 'server') { out.push(tj(line(ctx, PC.first, { a: b.who[0] }, key), { focus: ['TJ', b.who[0]] })); continue; }
    if (b.kind === 'hand') {
      const [a, t] = b.who;
      if (!whole && ++rounds > SHORT_AFTER) continue;
      out.push({ dir: line(ctx, PC.hand, { a, b: t }, key), focus: [a, t], act: { [a]: 'lean' } });
      const w = voice(ctx, PC.why[b.data.why] || PC.why.none, a, { b: t }, key + 'w');
      if (w) out.push(say(a, w, t, { act: { [t]: 'flinch' } }));
      if (['betrayed', 'fires'].includes(b.data.react)) { const r = namedReact(ctx, b.data.react, t, a, key + 'n'); if (r) out.push(r); }
      continue;
    }
    if (b.kind === 'drinks' && !whole && rounds > SHORT_AFTER) continue;
    if (b.kind === 'drinks') { const n = b.who[0]; out.push({ dir: line(ctx, PC.drinks, { b: n, cup: b.data.cup }, key), focus: [n], act: { [n]: 'strain' } }); continue; }
    if (b.kind === 'spits') {
      const n = b.who[0];
      const short = !whole && rounds > SHORT_AFTER;
      out.push({ dir: line(ctx, short ? PC.quick : PC.spits, { a: b.data.by || 'Somebody', b: n, cup: b.data.cup }, key), focus: [n], act: { [n]: 'slump' }, exit: [n] });
      if (hashOf(key) % 2 === 0 && b.data.by) { const c = voice(ctx, PC.stung, n, { a: b.data.by }, key + 'c'); if (c) out.push(conf(n, c)); }
      continue;
    }
    if (b.kind === 'last-seated') {
      const n = b.who[0], f = final(b.data.label);
      if (f) safe.push(n);
      out.push(tj(line(ctx, f ? PC.win : PC.heat, { w: n }, key), { focus: ['TJ', n], act: { [n]: 'cheer' }, ...(f ? { power: [...safe] } : {}) }));
    }
  }
  return out;
}
