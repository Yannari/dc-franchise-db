// ══════════════════════════════════════════════════════════════════════
// td/story/kits.js — each character's own material, and the scenes made of it
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10, five Disventure Camp episodes pasted beside ours: "we need more events with
// better writing, less repetitive, less awkward, more like a real Disventure Camp episode". What those
// episodes have and ours didn't: every scene is about who those two people are. Bruno can't stop saying
// he's a personal assistant and the camp mocks him for it; Dunia's witchcraft is a running thread; Gabby
// misses Ellie. The roster has it (voice, occupation, descriptor, backstory, personality, casting
// interview, 58 characters) and the scenes used none of it.
//
// A kit (kits/*.js), keyed by name, written from that profile:
//   thing   what they're known for, as others would put it ("his job as a personal assistant")
//   bit     a brings it up, unprompted, in the middle of camp life
//   tease   what somebody else says to a about it ({a} is a)
//   reply   a's comeback
//   home    a, asked about home: who and what is waiting
//   want    a, asked what they want out of this
//   conf    a alone with the camera, in their own voice
//   askHome / askWant   a asking somebody else those two questions
// Each line plays once a season: a bit comes back two or three times, like a running joke does, and
// then rests. The scenes are written through writeStory (places, set-up line, voice handling), from an
// entry built here for these two people.
import { gs } from '../../core.js';
import { STORY_POOLS } from './lines/index.js';
import { writeStory } from './write.js';
import KITS from './kits/index.js';

export const kitOf = name => KITS[name] || null;
export const hasKit = name => !!KITS[name];

// once a season per line: gs.tdStory.kitUsed[name] = ['bit:0', ...]
const used = () => ((gs.tdStory ||= {}).kitUsed ||= {});
function take(name, part, fits = null) {
  const k = KITS[name]?.[part];
  if (!Array.isArray(k) || !k.length) return null;
  const u = (used()[name] ||= []);
  const i = k.findIndex((line, j) => !u.includes(`${part}:${j}`) && (!fits || fits(line)));
  if (i < 0) return null;
  return { line: k[i], mark: () => u.push(`${part}:${i}`) };
}
// Somebody without a kit, asked about home or what they want, answers from their archetype (the user's
// complaint about generic lines: everybody had said "I want to prove I can do something hard"), each answer
// once a season. A character WITH a kit never falls back to these: once their own lines are spent, they rest.
const ASK = {
  askHome: ["So who's waiting for you back home?", "What do you miss most from home so far?", "Do you have somebody back home? You don't have to say."],
  askWant: ["Can I ask what you're really here for?", "So what do you actually want out of this?", "What are you hoping for, out here?"],
};
const ARCH = {
  home: {
    villain: ["Nobody I'd describe as waiting. People who'll be very surprised when I win.", "A lot of people who said I'd never make it this far."],
    mastermind: ["My family, who think this is a phase. It's a strategy, actually.", "People who know exactly how competitive I am. They warned me not to be."],
    schemer: ["Friends who think I'm the sweetest person they know. Let's keep it that way.", "My family. They'd be horrified by half of what I'm planning."],
    hothead: ["My family, who are definitely yelling at the TV right now. I get it from them.", "My friends, who bet on how many days before I lose my temper."],
    'challenge-beast': ["My team back home. We train together every morning. They're going to tear this apart frame by frame.", "My coach, who told me not to get distracted. I'm a little distracted."],
    'social-butterfly': ["Honestly, everybody. My friends, my family, my neighbours, my barista.", "My best friend. We talk every single day. This is killing me."],
    'loyal-soldier': ["My family. My dad told me to keep my word out here, no matter what.", "My partner. I promised I'd come home the same person I left."],
    wildcard: ["My roommates and a very confused houseplant.", "Nobody you'd believe if I told you."],
    'chaos-agent': ["Three roommates, two of whom I've never met.", "My mom, who said 'please don't embarrass the family'. Too late."],
    floater: ["My family and my friends. Pretty normal, honestly.", "My job, which I'm hoping I still have."],
    underdog: ["My family, who are already proud I got cast. I want to give them more than that.", "My little sister. She's the one who sent in my audition."],
    hero: ["My parents. They raised me to do the right thing, and I'm going to try out here.", "My community back home. They're all watching."],
    goat: ["My mom, my dog, and a fridge full of snacks I think about constantly.", "Everybody from work, who think I'm going to be first out. Rude, but fair."],
    'perceptive-player': ["A few people who know me well. I don't let many people do that.", "My family. They'll read me better on TV than anybody here will in person."],
    showmancer: ["Nobody, which is a little sad, and maybe also an opportunity.", "An ex who's definitely going to watch this. Hi."],
  },
  want: {
    villain: ["To win, and to watch everybody realise they should have seen it coming.", "Power. The money's just how you keep score."],
    mastermind: ["To run this game from start to finish and win at the end.", "The win. And a reputation as the best to ever play."],
    schemer: ["To win without anyone figuring out how I did it.", "To be the last person anyone suspected."],
    hothead: ["To win, and to stop people telling me to calm down.", "To prove I'm more than my temper."],
    'challenge-beast': ["Every challenge. Then the money.", "To find out how far I can push myself. Then win."],
    'social-butterfly': ["To make friends I'll keep after this. And to win, if they let me.", "To get to the end with the people I love here. Then win."],
    'loyal-soldier': ["To get to the end with my alliance and never break my word.", "To win the right way."],
    wildcard: ["Honestly? I'll know it when I see it.", "To do something nobody expects. Including me."],
    'chaos-agent': ["Chaos. And the money. Mostly the chaos.", "To make this the most interesting season ever."],
    floater: ["To get to the end without anyone deciding I'm the problem.", "To last. Lasting is underrated."],
    underdog: ["To prove everybody wrong who said I'd go home first.", "To make it further than anybody thought I would."],
    hero: ["To win in a way I'd be proud to show my family.", "To stand up for the people who can't stand up for themselves out here."],
    goat: ["Honestly, I'd just like to make the merge. Then we'll see.", "A really good sandwich. And maybe the money."],
    'perceptive-player': ["To understand everyone here better than they understand me.", "To see the vote coming every single time."],
    showmancer: ["Love, maybe. The money, definitely.", "To find somebody worth losing a vote for. Kidding. Mostly."],
  },
};
const plainUsed = () => ((gs.tdStory ||= {}).kitPlain ||= []);
function plain(part, name, arch) {
  const pool = ASK[part] || ARCH[part]?.[arch] || ARCH[part]?.floater || [];
  const u = plainUsed();
  const pick = pool.find(x => !u.includes(`${name}|${x}`)) || null;
  return pick ? { line: pick, mark: () => u.push(`${name}|${pick}`) } : null;
}
// b takes in what a just said, before a asks back
// (neutral: it follows any answer, a nana with purple hair or a brother who wants you to lose)
const REACT = ["Huh. I didn't expect that.", "That's more than I thought you'd tell me.", "Wow. Okay.", "That actually makes a lot of sense.", "Huh. Okay.", "I can see that, honestly.", "I didn't see that coming, honestly.", "That's a lot more than I knew about you.", "Oh. That's really sweet, actually.", "Okay, now I get you a bit better."];

// write a scene from an entry built for these people (a pool of one, removed again)
function writeKitScene(entry, who, facts, ctx) {
  const key = `kit.${entry.id.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  STORY_POOLS[`${key}.any`] = [entry];
  try { return writeStory(key, 'any', who, {}, facts, { ...ctx, unique: false }); }
  finally { delete STORY_POOLS[`${key}.any`]; }
}

/** a brings their thing up, b teases them about it, a answers, and one of them reflects. */
export function kitBitScene(a, b, facts, ctx) {
  const bit = take(a, 'bit'), tease = take(a, 'tease'), reply = take(a, 'reply'), conf = take(a, 'conf');
  if (!bit || !tease || !reply) return null;
  const entry = { id: `kit:${a}:bit:${(used()[a] || []).length}`, place: 'aside', turns: [
    { by: 'a', say: bit.line }, { by: 'b', say: tease.line }, { by: 'a', say: reply.line },
    ...(conf ? [{ by: 'a', conf: conf.line }] : []),
  ] };
  const w = writeKitScene(entry, { a, b }, facts, ctx);
  if (w) { bit.mark(); tease.mark(); reply.mark(); conf?.mark(); }
  return w;
}

/** Two people get to know each other: b asks about home, a answers; a asks back about what b wants, b answers. */
export function kitLifeScene(a, b, facts, ctx) {
  const ka = KITS[a], kb = KITS[b];
  if (!ka && !kb) return null;
  const archOf = n => (typeof window !== 'undefined' && window.players || []).find(p => p.name === n)?.archetype || 'floater';
  // a kit answers from the kit, or not at all; somebody without one answers from their archetype
  const ask1 = kb ? take(b, 'askHome') : plain('askHome', b);
  const ans1 = ka ? take(a, 'home') : plain('home', a, archOf(a));
  const ans2 = kb ? take(b, 'want') : plain('want', b, archOf(b));
  // the question has to be the one the answer answers: "what would you do with the money?" only when b's answer
  // is about the money (read: Gabby asked it, and Sami answered what he wanted from the game)
  const MONEY = /money|buy|pay/i;
  const fitsAns = q => !/money|buy|spend/i.test(q) || MONEY.test(ans2?.line || '');
  const ask2 = ka ? (take(a, 'askWant', fitsAns) || null) : plain('askWant', a);
  if (!ask1 || !ans1 || !ask2 || !ans2) return null;
  const react = REACT[[...(a + b)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % REACT.length];
  const turns = [
    { by: 'b', say: ask1.line },
    { by: 'a', say: ans1.line },
    { by: 'b', say: react },
    { by: 'a', say: `What about you? ${ask2.line.replace(/^(And|So|Okay,) /, m => '').replace(/^./, c => c.toUpperCase())}` },
    { by: 'b', say: ans2.line },
  ];
  const c = (ka && take(a, 'conf')) || (kb && take(b, 'conf'));
  const byConf = c && ka && KITS[a].conf?.includes(c.line) ? 'a' : 'b';
  if (c) turns.push({ by: byConf, conf: c.line });
  const entry = { id: `kit:${a}:${b}:life:${(used()[a] || []).length}`, place: 'aside', turns };
  const w = writeKitScene(entry, { a, b }, facts, ctx);
  if (w) { ask1.mark(); ans1.mark(); ask2.mark(); ans2.mark(); c?.mark(); }
  return w;
}

// ── the pair's heat (kits-deep.js): a clash with somebody who doesn't like a, a deep talk with a friend ──
// the connecting lines are shared, so each pool hands them out in turn across the season, none twice until the
// pool is spent (read: three clashes in one season opened with the same 'Here we go again')
const pickOf = (list, ...k) => {
  const book = ((gs.tdStory ||= {}).kitGeneric ||= {});
  const id = list[0];
  const taken = (book[id] ||= []);
  if (taken.length >= list.length) taken.length = 0;
  const start = [...k.join('|')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 11) % list.length;
  for (let i = 0; i < list.length; i++) { const j = (start + i) % list.length; if (!taken.includes(j)) { taken.push(j); return list[j]; } }
  return list[start];
};
const SNEER = ["Do you ever talk about anything else?", "Nobody cares, {a}. Honestly. Nobody.", "Here we go again. Can we have one day off from it?", "You know it's not actually a personality, right?", "Wow. Every single day with this.", "Can you not? Just for one morning?", "I swear, if I hear about it one more time.", "Is there an off switch, {a}? Asking for everybody.", "We get it. We all get it. We got it on day one.", "I'm begging you. Talk about the weather. Talk about anything else.", "If I had a dollar for every time you brought that up, I'd never be hungry again.", "Does it ever get old for you? Because it got old for me ages ago.", "Some of us are trying to have a quiet morning, {a}.", "You know nobody asked, right? Nobody ever asks."];
const PUSH = ["Whatever you say.", "Sure. Keep telling yourself that.", "I'm just saying what everybody's thinking.", "Okay. I'm done.", "Wow. Okay. Sensitive.", "Fine. Talk to someone who cares.", "You really need to relax.", "Noted. Still annoying.", "Touchy, touchy.", "Okay, okay. Calm down. It was a joke, mostly.", "You don't have to bite my head off about it.", "Right. I'll just leave you to it, then.", "See, this is why nobody brings it up with you.", "Whatever helps you sleep at night."];
const CLASH_CONF = ["{a} takes everything so personally. Fine. Now I know exactly where to push.", "I didn't mean to start a fight. I did mean what I said, though.", "I said one thing and {a} acted like I'd burned the whole camp down.", "I don't get {a}, and I've stopped trying to.", "{a} needs to learn that not everybody finds it charming. I'm happy to be the teacher.", "I know I was harsh. Somebody had to say it, and I'm the only one here who'll say it to {a.posAdj} face.", "Every day, the same thing. I'm not proud I snapped. I'm just surprised it took this long.", "{a} looked hurt, and I almost felt bad about it. Almost."];
/** b, who doesn't like a, sneers at a's thing; a defends it (Nura and Dunia). */
export function kitClashScene(a, b, facts, ctx) {
  const k = KITS[a];
  const def = k && take(a, 'defend');
  if (!def) return null;
  const entry = { id: `kit:${a}:${b}:clash`, place: 'aside', turns: [
    { beat: `{a} is going on about ${k.thing} again, and {b} has had enough.` },
    { by: 'b', say: pickOf(SNEER, a, b) }, { by: 'a', say: def.line }, { by: 'b', say: pickOf(PUSH, b, a) },
    { by: 'b', conf: pickOf(CLASH_CONF, b, a, 'c') },
  ] };
  const w = writeKitScene(entry, { a, b }, facts, ctx);
  if (w) def.mark();
  return w;
}
const OPEN = ["You okay? You've been quiet all day.", "Can I ask you something real?", "You don't have to be on all the time, you know. Not with me.", "Hey. What's going on with you? For real.", "You looked far away just now. Where'd you go?", "Can we just talk? No game stuff.", "You've been off all day. Want to walk?", "Sit with me for a minute. Everybody else is asleep.", "I feel like I don't actually know you yet. Not the real you.", "Is this game getting to you? Because it's getting to me."];
const HEARD = ["Thank you for telling me. Really.", "I had no idea. I'm glad you told me.", "That stays between us. I promise.", "That's a lot to carry around. I'm sorry.", "I'm really glad it was me you told.", "Hey. You're not on your own with that out here.", "I'd never have guessed that. Not in a million years.", "That explains a lot about you, in a good way.", "I'm not going anywhere. You can say anything you want to me.", "Thank you for trusting me with that. I won't make you regret it."];
const CLOSE = ["Okay. Don't make it weird.", "Okay. That's enough feelings for one day.", "I don't usually say that stuff out loud.", "Anyway. Don't tell anybody I got soft.", "Thanks. I mean it. Now, back to the game.", "Okay, I'm done. That was a lot.", "Okay, I'm going to go splash some water on my face now.", "Can we go back to talking about nothing? I'm good at nothing.", "Anyway. That's the most I've talked in a week.", "If you tell anybody I cried, I'll deny it."];
const DEEP_CONF = ["{a} told me something real today. I'm not going to use it. I just want {a.obj} to know I heard it.", "Everybody here sees one side of {a}. Today I got to see the other one.", "I came here to play a game. I didn't expect to actually care about anybody. Then {a} said that.", "You spend so long out here working out who to trust. Then somebody tells you something like that, and you just know.", "I'll remember what {a} told me today long after I forget who won this season.", "I used to think {a} was all front. Now I know what's behind it, and I like {a} a lot more.", "{a} doesn't open up to anybody. Today {a} opened up to me. I'm not taking that lightly.", "It's easy to forget there are real people under all this. {a} reminded me today."];
/** a, with a friend, says the true thing under the bit. */
export function kitDeepScene(a, b, facts, ctx) {
  const deep = KITS[a] && take(a, 'deep');
  if (!deep) return null;
  const entry = { id: `kit:${a}:${b}:deep`, place: 'secret', turns: [
    { by: 'b', say: pickOf(OPEN, b, a) }, { by: 'a', say: deep.line }, { by: 'b', say: pickOf(HEARD, a, b) }, { by: 'a', say: pickOf(CLOSE, a) },
    { by: 'b', conf: pickOf(DEEP_CONF, b, a) },
  ] };
  const w = writeKitScene(entry, { a, b }, facts, ctx);
  if (w) deep.mark();
  return w;
}

// ── a alone with the camera, doing their own thing (kits-solo.js): a person, not a plot ──
/** a, on their own: what the camera finds them doing, and what they say to it then. */
export function kitSoloScene(a, facts, ctx) {
  const k = KITS[a];
  const line = k?.alone && take(a, 'solo');
  if (!line) return null;
  const entry = { id: `kit:${a}:solo:${(used()[a] || []).length}`, place: 'aside', turns: [
    { beat: `{a} ${k.alone}.` }, { by: 'a', conf: line.line },
  ] };
  const w = writeKitScene(entry, { a }, facts, ctx);
  if (w) line.mark();
  return w;
}

// ── a running bit, called back by other people (who aren't the one doing it) ──
const CALL = ["Has {about} brought up {thing} yet today?", "Ten minutes. I'm giving it ten minutes before {about} mentions {thing}.", "Did you hear {about} going on about {thing} again this morning?", "What's the over-under on {thing} coming up at dinner tonight?", "If {about} doesn't mention {thing} today, I'm going to check {about} for a fever.", "I've started counting how often {about} brings up {thing}. I need a bigger stick to keep tally on."];
const ANSWER = ["Twice. Before breakfast.", "Not yet. I'm almost worried.", "I could do the whole speech for you at this point.", "Honestly? I'm starting to like it.", "Only four times. It's a slow day.", "I tried to change the subject. It didn't work.", "Three times, and once was in a whisper.", "Are you kidding? It's practically the camp's theme song now.", "I'm keeping a tally. We're in double figures.", "It came up while I was asleep. I heard it in a dream."];
/** c and d joke about `about`'s thing, once it has aired as a bit at least once. */
export function kitCallbackScene(c, d, about, facts, ctx) {
  const k = KITS[about];
  if (!k) return null;
  const u = (used()[about] ||= []);
  const n = u.filter(x => x.startsWith('call:')).length;
  if (n >= CALL.length || !u.some(x => x.startsWith('bit:'))) return null;
  const entry = { id: `kit:${about}:call:${n}`, place: 'aside', turns: [
    { by: 'a', say: CALL[n].split('{thing}').join(k.thing) }, { by: 'b', say: pickOf(ANSWER, c, d, about) },
  ] };
  const STORE = { about };
  const w = (() => { const key = `kit.${entry.id.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`; STORY_POOLS[`${key}.any`] = [entry];
    try { return writeStory(key, 'any', { a: c, b: d }, STORE, facts, { ...ctx, unique: false }); } finally { delete STORY_POOLS[`${key}.any`]; } })();
  if (w) u.push(`call:${n}`);
  return w;
}
