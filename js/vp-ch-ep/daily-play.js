// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/daily-play.js — a played daily, moment by moment
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-15: "I want to see everything, actual avatars well placed on their platform; if
// someone falls show the animation. Right now it's three events then 'seventeen people fall'. I want the
// complete challenge, every part, with the host and players talking." A played daily (js/ch/daily/) hands
// the viewer its beats, in order; each one becomes a step or two here: the player on their own pole or
// platform, the fall with its splash, the swim to the side, TJ's voice, the people talking up there, the
// clock. Nothing here decides anything: every fall, every pick and every word's cause is in the beat.
//
// Lines are plain and spoken (the writing rules: no aphorisms, a reply follows the line before). A pool is
// deep enough that a daily never says the same line twice (V.used is the episode's).
import { speak } from './voices.js';
import { pickBy, hashOf, nameList } from './games.js';

const V = (say, v = {}) => ({ say, v });
const fill = (t, slots) => t.replace(/\{(\w+)\}/g, (m, k) => (slots[k] != null ? slots[k] : m));
const hrs = t => `${String(Math.floor(t)).padStart(2, '0')}:${String(Math.round((t % 1) * 60) % 60).padStart(2, '0')}`;

// ── shared pools ──────────────────────────────────────────────────────
const TALK = {
  needle: [
    [V("How are the legs, {b}? Because they look like they're shaking.", { loud: ["Your legs are SHAKING, {b}!"], sharp: ['Shaking already, {b}? That was fast.'] }), V("Worry about your own legs.", { sharp: ['Mine are fine. Yours are about to go.'] })],
    [V("You know you're not winning this, right, {b}?"), V("Says the person who can barely stand up straight.")],
    [V("I can hear you breathing from here, {b}. Sounds like you're done."), V("I'm breathing. That's allowed. You should try being quiet.")],
    [V("Just get down, {b}. Save us all some time."), V("You'd love that. Not happening.")],
    [V("Everybody's waiting for you to fall, {b}. Just so you know."), V("Then everybody's going to wait a long time.")],
  ],
  couple: [
    [V("Hey. Look at me, not the water. You're okay.", { soft: ["Look at me. Just me. You're doing so good."] }), V("I'm okay as long as you keep talking.")],
    [V("If we're both still up at the end, I'm not going easy on you."), V("I'd be offended if you did.")],
    [V("You look really good up there, you know."), V("I look like I'm about to fall. But thank you.")],
    [V("Stay with me. We'll get through this together."), V("Together. Even if one of us has to lose.")],
  ],
  friends: [
    [V("How you holding up?"), V("My feet hurt so much. You?")],
    [V("Don't you dare quit on me."), V("I'm not quitting. Not before you, anyway.")],
    [V("We get through this, and we're both safe this week."), V("Then let's not think about anything else.")],
    [V("Tell me something. Anything. I need a distraction."), V("Okay. When this is done, I'm eating everything in that kitchen.")],
  ],
  smalltalk: [
    [V("Is it just me, or is this getting harder?"), V("It's not just you.")],
    [V("I keep thinking about food. Is that weird?"), V("Everybody up here is thinking about food.")],
    [V("Do you ever think about what we're doing with our lives?"), V("Right now I'm thinking about my feet. That's it.")],
    [V("How long do you think we've been up here?"), V("Too long. That's how long.")],
    [V("You're doing better than I thought you would."), V("Thanks. I think.")],
  ],
};
const CONF = {
  needleHit: [V("{a} got in my head. I hate that it worked."), V("I was fine until {a} opened {pos} mouth.")],
  needleFire: [V("{a} wants me to fall. Now I'm staying up out of spite."), V("Every time {a} said something, I stood up a little straighter.")],
  froze: [V("I'm scared of heights. Like, really scared. I looked down once and everything just stopped working.", { soft: ['I couldn\'t move. I physically could not move.'] }),
    V("My whole body locked up. I knew what I had to do, and I just couldn't do it.")],
  beaten: [V("I'm terrified of heights. I did it anyway. I'm actually proud of myself right now.", { loud: ['I BEAT IT! I\'m scared of heights and I BEAT IT!'] }),
    V("Everybody knows I hate heights. I wanted them to see me do it.")],
  helped: [V("{b} talked me through the whole thing. I wouldn't have lasted a minute without {b}."), V("I owe {b} for that. I'm not going to forget it.")],
  helper: [V("You don't leave somebody up there panicking. Not if you can help it.")],
  tempt: [V("I'm not proud of it. But that food smelled incredible."), V("I lasted as long as I could. Then I smelled the bacon."),
    V("Am I safe this week? No. Am I full? Yes. I'll take it.")],
  fall: [V("I don't even know what happened. One second I was up, the next I was in the water."), V("I gave it everything I had. My body just quit before I did."),
    V("I'm so mad at myself right now.", { loud: ['I am SO mad right now!'] }), V("I'll be honest, I thought I'd last longer than that.")],
  truthSub: [V("I didn't think anybody would ever hear that. Now everybody has."), V("TJ just said that out loud in front of everybody. I wanted to disappear."),
    V("So now that's out there. Great. Good. Love that for me.")],
  truthAbout: [V("So that's what {a} really thinks. Good to know.", { sharp: ['Noted, {a}. Very noted.'] }), V("I'm glad I heard it. I'd rather know who's coming for me.")],
  winner: [V("My feet are destroyed, and I don't care at all. I'm safe this week.", { loud: ['I WON! I can\'t feel my feet, but I WON!'] }),
    V("Everybody thought I'd be one of the first ones down. I wasn't.")],
  shaken: [V("When {b} went in, I lost it a little. It's hard to keep going when your person is gone.")],
  holds: [V("{b} fell, so now I have to hold on for both of us.")],
};

const step = (o) => o;
const say = (by, text, to, extra = {}) => step({ say: [by, text], focus: to ? [by, to] : [by], ...extra });
const conf = (by, text) => step({ conf: [by, text] });
const tj = (text, extra = {}) => step({ tj: text, focus: ['TJ'], ...extra });

function voice(ctx, pool, by, slots, key) {
  return speak(pool, by, { ...slots, pron: ctx.V.pron }, `${ctx.seed}|${key}|${by}`, ctx.V.used);
}
function line(ctx, pool, slots, key) {
  const list = pool.filter(x => !ctx.V.used.has(x));
  const t = list.length ? list[hashOf(`${ctx.seed}|${key}`) % list.length] : pool[hashOf(`${ctx.seed}|${key}`) % pool.length];
  ctx.V.used.add(t);
  return fill(t, slots);
}
const posOf = (ctx, n) => ctx.V.pron?.[n]?.posAdj || 'their';

function talkSteps(ctx, b, key) {
  const [x, y] = b.who;
  const tone = b.data.tone;
  const pair = pickBy(TALK[tone] || TALK.smalltalk, `${ctx.seed}|${key}`);
  const t1 = voice(ctx, [pair[0]], x, { a: x, b: y }, `${key}a`) || fill(pair[0].say, { b: y });
  const t2 = voice(ctx, [pair[1]], y, { a: y, b: x }, `${key}b`) || fill(pair[1].say, { b: x });
  const out = [say(x, t1, y, { act: { [x]: tone === 'needle' ? 'lean' : 'talkpop' } }), say(y, t2, x, { act: { [y]: tone === 'needle' ? 'shout' : 'laugh' } })];
  if (tone === 'needle') {
    const c = voice(ctx, b.data.shift < 0 ? CONF.needleHit : CONF.needleFire, y, { a: x, pos: posOf(ctx, x) }, `${key}c`);
    if (c) out.push(conf(y, c));
  }
  return out;
}

// ── Pole Truth ────────────────────────────────────────────────────────
const PT = {
  start: ["Six poles, six of you. Climb up and stay up. Last one standing goes through. No breakfast, no water. You're welcome!",
    "Everybody up! Feet on the pole, eyes on me. The last one still standing wins this heat.",
    "Here's the deal. You stand on that pole. You stay on that pole. That's it. That's the whole challenge. Simple, right?",
    "Next six! Up you go. I hope you all had a big dinner last night, because you're not getting breakfast."],
  final: ["Heat winners! Back up you go, one more time. Last one standing wins the whole thing.",
    "You made it through your heats. Now you do it again, against each other. Good luck, legs!"],
  climb: ['{who} wade out and climb up. The tops of the posts are barely wide enough for two feet.',
    '{who} climb onto the posts. A couple of them wobble straight away.',
    '{who} get up on the poles and find their balance, arms out like a tightrope.'],
  tempt: {
    breakfast: ["One hour in, and Chef's here with breakfast! Bacon, eggs, pancakes, coffee. All you have to do is step down.",
      "Who's hungry? Chef made breakfast! Hot pancakes, crispy bacon. One step, and it's yours."],
    burgers: ["Four hours! Lunch time! Burgers, fries, a milkshake. Anybody? Step down and it's all yours.",
      "Chef's been at the grill. Burgers with cheese, fries with salt. I'm just saying, the water's right there."],
    pizza: ["Eleven hours. You must be starving. Good thing Chef made pizza! Bacon, pepperoni, extra cheese.",
      "Late night snack, people! A whole pizza, still hot. Who wants a slice?"],
  },
  nobody: ['Nobody moves. Chef shrugs and throws the whole tray into the water.', 'Not one of them steps down. Chef tosses it all to the fish.',
    'They all stay up, staring at the food. Chef dumps it in the lagoon.', 'A couple of them look at the tray for a long time. Nobody climbs down.',
    "Somebody's stomach growls loud enough for everybody to hear. Still, nobody moves.", 'Chef waves the plate under their noses. Not one of them takes it.',
    'Every one of them shakes their head. Chef eats a bite himself and throws the rest away.', 'They stare straight ahead and try not to smell it. The food goes in the water.',
    "Nobody bites. Chef looks almost disappointed."],
  took: ['{who} steps down off the pole and swims straight for the food.', '{who} climbs down and is eating before even getting out of the water.',
    '{who} can\'t take it anymore. Down from the pole, straight to the plate.'],
  sun: ["Two and a half hours! It's officially the hottest part of the day. Drink plenty of water. Oh, wait.",
    'The sun is right overhead now, and there is no shade anywhere.'],
  night: ['The sun goes down. It gets cold, and the mosquitoes come out.', 'Night falls. Only the torches on the beach are lit now.'],
  truth: {
    voted: ["Time for a little truth! A little bird told me {a} voted for {b} at the last vote. Just thought everybody should know!",
      "Truth time! {a}, at the last vote, you said {b}'s name. Did you think that was a secret?"],
    target: ["Here's a truth for you. {a} told the confessional that {b} is the one {a} wants to see in the Arena.",
      "Truth time, people! {a} has been telling the cameras that {b} needs to go into the Arena. {b}, you're welcome."],
    deal: ["Ooh, a juicy one. {a} and {b} have a deal. A secret deal. Well, not anymore!",
      "Here's a truth. {a} made a deal with {b}. Everybody, act surprised."],
  },
  fall: {
    balance: ['{who} wobbles, waves both arms, and goes straight into the water.', '{who} shifts {pos} weight one time too many and slips off.',
      "{who} loses {pos} balance and drops into the lagoon.", '{who} tips over sideways with a yell.'],
    legs: ["{who}'s legs start shaking. A minute later, {who} falls off.", "{who}'s knees give out. Splash.", '{who} crouches to rest and topples forward into the water.',
      '{who} has been swaying for a while. Now {who} is in the water.', "{who} can't feel {pos} feet anymore, and that's the end of it."],
    sleep: ["{who}'s eyes keep closing. One lean too far, and {who} falls in.", '{who} nods off for one second and wakes up underwater.',
      '{who} has been awake all day, and it finally wins.'],
  },
  lunge: ['{who} smells the pizza and loses it. {who} jumps for it, right off the pole.', '{who} lunges for the pizza tray and goes flying.'],
  knocked: ['{who} gets hit on the way down and goes in too.', '{who} is knocked clean off {pos} pole.'],
  heatWin: ["{who} is the last one standing! {who} goes through to the final!", "And that's it! {who} takes the heat!", "{who} outlasted everybody! {who}, you can come down now. Carefully."],
  finalWin: ["{who} is the last one standing! {who} wins Pole Truth!", "That's the whole thing! {who} wins it!"],
};

function poleTruth(d, ctx) {
  const out = [];
  const beats = d.beats || [];
  let poles = [], raft = 0, watchers = [], pending = {}, night = false, heatIdx = 0;
  const safe = [];   // the day's winners as TJ calls them: SAFE shows on the step that names them
  const where = {};   // where each of this heat's people is now: their pole, or a spot on the raft
  const sub = n => ctx.V.pron?.[n]?.sub || 'they';
  const flush = s => { if (Object.keys(pending).length) { s.move = { ...(s.move || {}), ...pending }; pending = {}; } return s; };
  const push = s => out.push(flush(s));
  const down = n => { where[n] = ['stand', raft % 6, 'raft']; pending[n] = where[n]; raft++; };
  const castNow = (extra = {}) => ({ ...Object.fromEntries(poles.map(n => [n, where[n]])), ...extra });
  const sceneFor = (plate, cast) => ctx.scene(plate, night, cast);
  // after a cut to the timer, the next step is back on the wide shot
  let back = false;
  const push0 = push;
  const pushB = s2 => { if (back && !s2.scene) { s2.scene = sceneFor('poles', castNow()); } back = false; push0(s2); };
  // the first heat of each division and every final are shown whole; the heats in between show what happens
  // (the user wants the whole challenge, but five heats of the same breakfast is the same scene five times)
  const heats = beats.filter(x => x.kind === 'heat-start');
  const whole = new Set(heats.filter((h, j) => !/heat \d/i.test(h.data.label) || / 1$/.test(h.data.label)).map(h => h.data.label));
  let full = true;
  for (const [i, b] of beats.entries()) {
    const key = `pt${i}`;
    if (b.kind === 'heat-start') {
      full = whole.has(b.data.label);
      poles = b.data.poles; raft = 0; pending = {}; night = false;
      for (const [j, n] of poles.entries()) where[n] = ['stand', j, 'pole'];
      // the next heat waits on the sand
      const rest = beats.slice(i + 1).find(x => x.kind === 'heat-start');
      watchers = (rest?.data.poles || []).slice(0, 8);
      const sand = Object.fromEntries(watchers.map((n, j) => [n, ['stand', j]]));
      pushB({ scene: sceneFor('poles', castNow(sand)), seg: [b.data.label, 'Pole Truth'], stand: 'start', still: poles, focus: [] });
      pushB(tj(line(ctx, /final/i.test(b.data.label) ? PT.final : PT.start, {}, key)));
      pushB({ scene: sceneFor('poles-close', castNow({ TJ: null })), dir: line(ctx, PT.climb, { who: nameList(poles) }, key + 'c'), focus: poles });
      back = true;
      heatIdx++;
      continue;
    }
    // a cut to the big timer: the hours, and who is still up there
    const clock = (say0) => {
      pushB({ scene: sceneFor('poles-timer', Object.fromEntries(poles.filter(n => where[n][2] === 'pole').map(n => [n, where[n]]))), clock: hrs(b.t), ...say0 });
      back = true;
    };
    if (b.kind === 'tempt') {
      const takes = b.data.takers.length || beats.slice(i + 1, i + 3).some(x => x.kind === 'lunge');
      if (!full && !takes) continue;
      clock(tj(line(ctx, PT.tempt[b.data.food] || PT.tempt.burgers, {}, key)));
      if (!takes) pushB({ dir: line(ctx, PT.nobody, {}, key + 'n'), focus: [] });
      continue;
    }
    if (b.kind === 'step-down') {
      const n = b.who[0];
      pushB({ dir: line(ctx, PT.took, { who: n, sub: sub(n) }, key), drop: [n], splash: 1, focus: [n] }); down(n);
      const c = voice(ctx, CONF.tempt, n, {}, key + 'c'); if (c) pushB(conf(n, c));
      continue;
    }
    if (b.kind === 'sun') { if (full) clock(tj(line(ctx, PT.sun, {}, key))); continue; }
    if (b.kind === 'night') { night = true; if (full) pushB({ scene: sceneFor('poles', castNow()), dir: line(ctx, PT.night, {}, key), focus: [] }); else back = true; continue; }
    if (b.kind === 'talk') { for (const s2 of talkSteps(ctx, b, key)) pushB(s2); continue; }
    if (b.kind === 'truth') {
      const [a, about] = b.who;
      pushB(tj(line(ctx, PT.truth[b.data.fact] || PT.truth.voted, { a, b: about }, key), { focus: ['TJ', a] }));
      pushB({ dir: `${a} wobbles on the pole.`, focus: [a], act: { [a]: 'flinch' } });
      const r = voice(ctx, CONF.truthAbout, about, { a }, key + 'r');
      if (r) pushB(b.data.onPole ? say(about, r, a, { act: { [about]: 'shout' } }) : conf(about, r));
      const c = voice(ctx, CONF.truthSub, a, {}, key + 's'); if (c) pushB(conf(a, c));
      continue;
    }
    if (b.kind === 'lunge') {
      const n = b.who[0];
      pushB({ dir: line(ctx, PT.lunge, { who: n }, key), drop: [n], splash: 1, focus: [n, ...b.data.knocked], shake: 1 }); down(n);
      continue;
    }
    if (b.kind === 'knocked') {
      const n = b.who[0];
      pushB({ dir: line(ctx, PT.knocked, { who: n, pos: posOf(ctx, n) }, key), drop: [n], splash: 1, focus: [n, b.data.by], act: { [n]: 'flinch' } }); down(n);
      continue;
    }
    if (b.kind === 'fall') {
      const n = b.who[0];
      pushB({ dir: line(ctx, PT.fall[b.data.how] || PT.fall.legs, { who: n, pos: posOf(ctx, n), sub: sub(n) }, key), drop: [n], splash: 1, focus: [n], act: { [n]: 'flinch' } }); down(n);
      if (hashOf(key) % 3 === 0) { const c = voice(ctx, CONF.fall, n, {}, key + 'c'); if (c) pushB(conf(n, c)); }
      continue;
    }
    if (b.kind === 'heat-win') {
      const n = b.who[0];
      clock({ dir: `${hrs(b.t).replace(/^0/, '')} on the clock. One left on the poles.`, focus: [n] });
      // the heat that decides it: a final, or a division small enough for one heat ("The men")
      const final = !/heat \d/i.test(b.data.label);
      if (final) safe.push(n);
      pushB(tj(line(ctx, final ? PT.finalWin : PT.heatWin, { who: n }, key), { focus: ['TJ', n], act: { [n]: 'cheer' }, ...(final ? { power: [...safe] } : {}) }));
      if (final) { const c = voice(ctx, CONF.winner, n, {}, key + 'w'); if (c) pushB(conf(n, c)); }
      continue;
    }
  }
  return out;
}

// ── Hang On ───────────────────────────────────────────────────────────
const HO = {
  start: ['Everybody climbs down the ladder and grabs the net under the pier. Their feet swing over the water.',
    'One by one they lower themselves off the pier and hang from the net, hands only.'],
  tj: ["Here's how it works. You hang on. Every few minutes, my crew lets the net down a notch. Let go, and you're out. Last guy and last girl hanging win!",
    "Hang on as long as you can. When the net drops, you drop with it. Touch the water, you're done."],
  sag: ['The crew loosens the net. It drops a notch, and everybody swings.', 'Another notch. The net sags lower, and a few people yell.',
    'The net jerks down again. Their arms are starting to shake.', 'Down it goes, another notch. They are a lot closer to the water now.',
    'The crew lets out more rope. The net is almost touching the waves.', 'One more notch. There is barely any room left between them and the water.'],
  tide: ["And the tide is coming in! Your feet are going to get wet, people!", "Oh, look at that. The tide's coming up to meet you. Nature is on my side today!"],
  fall: ['{who} lets go and drops into the water.', "{who}'s hands slip off the net. Splash.", '{who} tries to change grip and misses.',
    '{who} hangs on by two fingers, then none.', "{who} lets out a yell and falls.", '{who} has nothing left in {pos} arms.',
    "{who}'s grip finally goes.", '{who} drops, and comes up spluttering.', '{who} swings once, twice, and lets go on the third.',
    "{who} can't hold on any longer.", '{who} slides down the net and into the water.', '{who} goes in feet first.',
    "{who}'s fingers open on their own. {who} is out.", '{who} falls, and the people still up cheer for {obj} anyway.',
    '{who} drops without a sound.', '{who} holds on for one more second, then lets go.'],
  froze: ['{who} looks down at the water and stops moving. {who} is frozen to the net.', "{who}'s whole body locks up. {who} can't even look down."],
  helpedBy: [V("Look at me. Not the water. Just look at me and breathe.", { soft: ['Hey. Breathe with me. In, and out. You\'ve got this.'] }),
    V("You're okay. The water's not going anywhere and neither are you.")],
  last: ["{who} is the last one hanging! {who} wins!", "And that's it! {who} outlasted everybody!"],
  holdsBy: ['{a} watches {b} go in and grabs the net tighter.'],
  shakenBy: ['{a} watches {b} fall and starts to lose {pos} grip too.'],
};

function hangOn(d, ctx) {
  const out = [];
  const safe = [];
  for (const [i, b] of (d.beats || []).entries()) {
    const key = `ho${i}`;
    if (b.kind === 'hang-start') { out.push({ hang: 'start', still: b.data.order, dir: line(ctx, HO.start, {}, key), focus: [] }); out.push(tj(line(ctx, HO.tj, {}, key + 't'))); continue; }
    if (b.kind === 'fear-froze') { const n = b.who[0]; out.push({ dir: line(ctx, HO.froze, { who: n }, key), focus: [n], act: { [n]: 'flinch' }, know: ['Afraid of heights', `${n} is scared of heights, and it shows.`] }); const c = voice(ctx, CONF.froze, n, {}, key); if (c) out.push(conf(n, c)); continue; }
    if (b.kind === 'fear-helped') {
      const [n, h] = b.who;
      out.push({ dir: line(ctx, HO.froze, { who: n }, key), focus: [n], act: { [n]: 'flinch' } });
      const t = voice(ctx, HO.helpedBy, h, { a: n }, key + 'h'); if (t) out.push(say(h, t, n));
      const c = voice(ctx, CONF.helped, n, { b: h }, key + 'c'); if (c) out.push(conf(n, c));
      continue;
    }
    if (b.kind === 'fear-beaten') { const n = b.who[0]; const c = voice(ctx, CONF.beaten, n, {}, key); if (c) out.push(conf(n, c)); continue; }
    if (b.kind === 'sag') {
      out.push({ sag: b.data.notch, dir: line(ctx, HO.sag, {}, key), focus: [] });
      if (b.data.tide) out.push(tj(line(ctx, HO.tide, {}, key + 't')));
      continue;
    }
    if (b.kind === 'talk') { for (const s of talkSteps(ctx, b, key)) out.push(s); continue; }
    if (b.kind === 'fall') {
      const n = b.who[0];
      out.push({ drop: [n], splash: 1, dir: line(ctx, HO.fall, { who: n, pos: posOf(ctx, n), sub: ctx.V.pron?.[n]?.sub || 'they', obj: ctx.V.pron?.[n]?.obj || 'them' }, key), focus: [n] });
      if (hashOf(key) % 4 === 0) { const c = voice(ctx, CONF.fall, n, {}, key + 'c'); if (c) out.push(conf(n, c)); }
      continue;
    }
    if (b.kind === 'holds-for-both' || b.kind === 'shaken') {
      const [a, x] = b.who;
      out.push({ dir: line(ctx, b.kind === 'shaken' ? HO.shakenBy : HO.holdsBy, { a, b: x, pos: posOf(ctx, a) }, key), focus: [a] });
      const c = voice(ctx, b.kind === 'shaken' ? CONF.shaken : CONF.holds, a, { b: x }, key + 'c'); if (c) out.push(conf(a, c));
      continue;
    }
    if (b.kind === 'last-hanging') { safe.push(...b.who); out.push(tj(line(ctx, HO.last, { who: nameList(b.who) }, key), { focus: ['TJ', ...b.who], power: [...safe] })); continue; }
  }
  return out;
}

// ── Interrogation ─────────────────────────────────────────────────────
const IQ = {
  start: ["Everybody on a platform, both hands on the bar. I ask, you answer. Get it right, and you tilt somebody else's bar. Get it wrong, and I tilt yours.",
    "Welcome to Interrogation! I'm going to ask you questions about the people in this house. Hope you've been paying attention."],
  final: ["Heat winners, back on the platforms. Same rules. Last one holding on wins the whole thing."],
  climb: ['{who} step onto the orange platforms and reach up for the bars.', '{who} take a platform each and grab the bar above them.'],
  ask: ['{a}, true or false: {q}', '{a}! True or false. {q}', 'Okay, {a}. True or false: {q}'],
  right: ["Correct! Pick somebody. Whose bar am I tilting?", "That's right! Now, who's getting tilted?", "Correct! Choose wisely."],
  wrong: ["Wrong! Sorry, {a}. Your bar tilts.", "Nope! That's a tilt for you, {a}.", "Incorrect! Hold on tight, {a}."],
  pick: [V("{b}.", { sharp: ['{b}. Nothing personal.'] }), V("I'm picking {b}."), V("{b}. Sorry."), V("Tilt {b}.")],
  betray: ['Everybody stares. {a} just picked {b}, and they are in the same alliance.', 'A couple of people gasp. {a} and {b} are supposed to be on the same side.'],
  tilt: ["{who}'s bar tilts forward. {who} has to grip harder.", "The bar tips toward the water. {who}'s fingers slide."],
  fall: ['{who} slips off the bar and drops into the gorge.', "{who} can't hold the angle any longer.", '{who} hangs on for a second, then falls.',
    '{who} loses the bar and goes into the water.', "{who}'s hands give out. Splash.", '{who} drops off the platform with a yell.'],
  last: ['{who} is the last one holding on! {who} goes through to the final!', "{who} outlasted everybody on the platforms!"],
  lastFinal: ['{who} is the last one holding on! {who} wins Interrogation!'],
};
const ANSWER = { true: V('True.'), false: V('False.') };
// the statement TJ reads: "you" when it is about the person he is asking
function statement(q, to) {
  const s = q.s === to ? 'you' : q.s, o = q.o === to ? 'you' : q.o;
  const you = q.s === to;
  switch (q.kind) {
    case 'voted': return `${s} voted for ${o}.`;
    case 'beat': return `${s} beat ${o} in the Arena.`;
    case 'calledout': return `${s} called out ${o}.`;
    case 'daily': return `${s} ${you ? 'have' : 'has'} come first in a daily this season.`;
    case 'rookie': return q.flip ? `${s} ${you ? 'have' : 'has'} been on The Challenge before.` : `${s} ${you ? 'are' : 'is'} a rookie.`;
    default: return `${s} ${you ? 'are' : 'is'} still in this game.`;
  }
}

function interrogation(d, ctx) {
  const out = [];
  let plats = [], asked = 0, sand = 0, pending = {};
  const safe = [];
  const flush = s => { if (Object.keys(pending).length) { s.move = { ...(s.move || {}), ...pending }; pending = {}; } return s; };
  const push = s => out.push(flush(s));
  const beats = d.beats || [];
  for (const [i, b] of beats.entries()) {
    const key = `iq${i}`;
    if (b.kind === 'platforms') {
      plats = b.who; asked = 0; sand = 0;
      const cast = Object.fromEntries(plats.map((n, j) => [n, ['stand', j, 'plat']]));
      push({ scene: ctx.scene(ctx.plate, ctx.night, cast), seg: [b.data.label, 'Interrogation'], stand: 'start', still: plats, focus: [] });
      push(tj(line(ctx, b.data.final ? IQ.final : IQ.start, {}, key)));
      push({ dir: line(ctx, IQ.climb, { who: nameList(plats) }, key + 'c'), focus: plats });
      continue;
    }
    if (b.kind === 'question') {
      const c = b.who[0], q = b.data.q;
      asked++;
      const full = asked <= 6 || b.data.betray || beats[i + 1]?.kind === 'fall';
      if (full) {
        push(tj(line(ctx, IQ.ask, { a: c, q: statement(q, c) }, key), { focus: ['TJ', c] }));
        push(say(c, ANSWER[String(b.data.answer)].say, 'TJ'));
        if (b.data.right) {
          push(tj(line(ctx, IQ.right, { a: c }, key + 'r')));
          const p = voice(ctx, IQ.pick, c, { b: b.data.target }, key + 'p');
          push(say(c, p || `${b.data.target}.`, b.data.target, { act: { [b.data.target]: 'flinch' }, chip: [b.data.target, `TILT ${b.data.tilt}`] }));
          if (b.data.betray) push({ dir: line(ctx, IQ.betray, { a: c, b: b.data.target }, key + 'b'), focus: [c, b.data.target], shake: 1 });
        } else {
          push(tj(line(ctx, IQ.wrong, { a: c }, key + 'w'), { chip: [c, `TILT ${b.data.tilt}`] }));
          push({ dir: line(ctx, IQ.tilt, { who: c }, key + 't'), focus: [c], act: { [c]: 'flinch' } });
        }
      } else {
        // the quick ones: what happened, in one line
        push({ dir: b.data.right ? `${c} gets it right and tilts ${b.data.target}.` : `${c} gets it wrong. ${c}'s bar tilts.`, focus: b.data.right ? [c, b.data.target] : [c],
          chip: b.data.right ? [b.data.target, `TILT ${b.data.tilt}`] : [c, `TILT ${b.data.tilt}`] });
      }
      continue;
    }
    if (b.kind === 'fall') {
      const n = b.who[0];
      push({ dir: line(ctx, IQ.fall, { who: n, sub: ctx.V.pron?.[n]?.sub || 'they' }, key), drop: [n], splash: 1, focus: [n], chip: [n, ''] });
      pending[n] = ['stand', sand++ % 6];
      if (hashOf(key) % 3 === 0) { const c = voice(ctx, CONF.fall, n, {}, key + 'c'); if (c) push(conf(n, c)); }
      continue;
    }
    if (b.kind === 'last-standing') {
      const n = b.who[0];
      const final = !/heat \d/i.test(b.data.label);
      if (final) safe.push(n);
      push(tj(line(ctx, final ? IQ.lastFinal : IQ.last, { who: n }, key), { focus: ['TJ', n], act: { [n]: 'cheer' }, ...(final ? { power: [...safe] } : {}) }));
      continue;
    }
  }
  return out;
}

export const BEAT_PLAYS = { 'pole-truth': poleTruth, 'hang-on': hangOn, 'lagoon-quiz': interrogation };
