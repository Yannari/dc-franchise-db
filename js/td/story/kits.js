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
  const i = k.findIndex((line, j) => !u.includes(`${part}:${j}`) && (!fits || fits(line, j)));
  if (i < 0) return null;
  return { line: k[i], index: i, mark: () => u.push(`${part}:${i}`) };
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
  try { return writeStory(key, 'any', who, ctx.data || {}, facts, { ...ctx, unique: ctx.firstImpressions ? true : false }); }
  finally { delete STORY_POOLS[`${key}.any`]; }
}

// a bit's second round: b comes back at a, a gets the last word (pairs, so the answer always fits the
// question; neutral, so they follow any bit). Handed out in turn across the season (pickOf).
const BIT_AFTER = [
  ["Do you practise these, or do they just come out of you?", "Bit of both. Mostly they just come out."],
  ["Okay, I'll admit that was a little bit funny.", "A little? I'll take a little. It's early."],
  ["You know everybody can hear you, right?", "Good. I'd hate for anybody to miss it."],
  ["I can't tell if you're joking or not.", "That's the best part. Neither can I, most days."],
  ["Is it always going to be like this with you?", "Every single day. You'll miss it when I'm gone."],
  ["Fine, you win this one. Don't get used to it.", "Too late. I'm already used to it."],
  ["Please never change. Actually, change a little.", "No promises either way."],
  ["That's the most you've said all morning.", "I was saving it up for you, honestly."],
  ["I'm going to be thinking about that all day now.", "You're welcome. It's a gift."],
  ["Who even talks like that?", "Me. Apparently only me. It's a lonely life."],
  ["You're kind of a lot, you know that?", "I've been told. Usually by people who end up liking me."],
  ["I'm not laughing. This is my serious face.", "Your serious face is laughing, though."],
  ["Can you say that again, slower, so I can understand it?", "Absolutely not. It only works once."],
  ["Okay, I see why people like you now.", "Took you long enough."],
];
/** a brings their thing up, b teases them about it, a answers, b comes back at it, a has the last word,
 *  and one of them reflects. */
export function kitBitScene(a, b, facts, ctx) {
  const bit = take(a, 'bit'), tease = take(a, 'tease'), reply = take(a, 'reply'), conf = take(a, 'conf');
  if (!bit || !tease || !reply) return null;
  const entry = { id: `kit:${a}:bit:${(used()[a] || []).length}`, place: 'aside', turns: [
    { by: 'a', say: bit.line }, { by: 'b', say: tease.line }, { by: 'a', say: reply.line },
    ...(([q, r]) => [{ by: 'b', say: q }, { by: 'a', say: r }])(pickOf(BIT_AFTER, a, b)),
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
// a hits back after defending their thing, and b has the last word (pairs: the reply answers the jab)
const HIT_BACK = [
  ["And you've been an absolute joy since day one, haven't you?", "At least I'm honest about it."],
  ["You don't have to like it. You just have to leave me alone.", "Happily. Believe me, happily."],
  ["Funny, nobody asked what you think about it, either.", "And yet here I am, telling you anyway."],
  ["Say it again. I dare you to say it again.", "...I'm not doing this with you today."],
  ["Maybe find a hobby of your own, instead of mocking mine.", "Mocking yours is my hobby now."],
  ["You know what? I feel sorry for you.", "Don't. Seriously, save it."],
  ["I've met kinder people at the bottom of a lake.", "Then go back and talk to them."],
  ["Every single day, you find something new to hate about me.", "You make it really easy."],
];
const CLASH_CONF = ["{a} takes everything so personally. Fine. Now I know exactly where to push.", "I didn't mean to start a fight. I did mean what I said, though.", "I said one thing and {a} acted like I'd burned the whole camp down.", "I don't get {a}, and I've stopped trying to.", "{a} needs to learn that not everybody finds it charming. I'm happy to be the teacher.", "I know I was harsh. Somebody had to say it, and I'm the only one here who'll say it to {a.posAdj} face.", "Every day, the same thing. I'm not proud I snapped. I'm just surprised it took this long.", "{a} looked hurt, and I almost felt bad about it. Almost."];
/** b, who doesn't like a, sneers at a's thing; a defends it (Nura and Dunia). */
export function kitClashScene(a, b, facts, ctx) {
  const k = KITS[a];
  const def = k && take(a, 'defend');
  if (!def) return null;
  const entry = { id: `kit:${a}:${b}:clash`, place: 'aside', turns: [
    { beat: `{a} is going on about ${k.thing} again, and {b} has had enough.` },
    { by: 'b', say: pickOf(SNEER, a, b) }, { by: 'a', say: def.line }, { by: 'b', say: pickOf(PUSH, b, a) },
    ...(([x, y]) => [{ by: 'a', say: x }, { by: 'b', say: y }])(pickOf(HIT_BACK, a, b)),
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
// the callback's follow-up between the two of them, then the one they're talking about walks up
const CALL_MORE = [
  ["Should we tell {about} it's become a thing?", "Absolutely not. It's the best part of my day."],
  ["I'm starting a tally. On a tree.", "Put me down for a guess of six by sunset."],
  ["Honestly, I'd miss it if {about} stopped.", "Me too. Don't tell {about} I said that."],
  ["Do you think {about} knows we notice?", "There's no way. Or there's every way, and that's worse."],
  ["We could try to get {about} to say it on purpose.", "Ten minutes. I bet you I can do it in ten."],
  ["It's kind of a comfort at this point, isn't it?", "Like a really strange alarm clock."],
];
const CALL_ARRIVE = [
  ["What are you two laughing at?", "Nothing. Absolutely nothing."],
  ["Why did you both just go quiet?", "No reason. Lovely weather, isn't it?"],
  ["Are you talking about me?", "We would never. Okay, a little."],
  ["I can feel you looking at me.", "We're looking at the view, which you happen to be in."],
];
/** c and d joke about `about`'s thing, once it has aired as a bit at least once; then `about` turns up. */
export function kitCallbackScene(c, d, about, facts, ctx) {
  const k = KITS[about];
  if (!k) return null;
  const u = (used()[about] ||= []);
  const n = u.filter(x => x.startsWith('call:')).length;
  if (n >= CALL.length || !u.some(x => x.startsWith('bit:'))) return null;
  const [m1, m2] = pickOf(CALL_MORE, c, d, about);
  const [q, r] = pickOf(CALL_ARRIVE, about, c);
  const entry = { id: `kit:${about}:call:${n}`, place: 'aside', turns: [
    { by: 'a', say: CALL[n].split('{thing}').join(k.thing) }, { by: 'b', say: pickOf(ANSWER, c, d, about) },
    { by: 'a', say: m1 }, { by: 'b', say: m2 },
    { beat: '{c} wanders over.' }, { by: 'c', say: q }, { by: 'a', say: r },
  ] };
  const STORE = { about };
  const w = (() => { const key = `kit.${entry.id.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`; STORY_POOLS[`${key}.any`] = [entry];
    try { return writeStory(key, 'any', { a: c, b: d, c: about }, STORE, { ...facts, third: true }, { ...ctx, unique: false }); } finally { delete STORY_POOLS[`${key}.any`]; } })();
  if (w) u.push(`call:${n}`);
  return w;
}


// ── day one, opened from a kit (spec 2026-10-10-td-first-impressions-design.md §6.2) ──
// The user's review of the first build: "the kit scenes are one template with the opening swapped ... only the
// first line is about that person". So the whole scene is made of the two people: where a's solo scene finds
// a (Gwen with a burnt stick for eyeliner), a's bit, b's tease and a's comeback (one aligned exchange), then b
// asks the question a's kit answers (home or want), and b answers it too, from b's own kit or archetype. The
// clash keeps the tease and goes to a's `defend`. Only the joins between those are written here, per voice.
// Day one spends at most one kit opening per team (budgeted by first-impressions.js).
const fam = (by, neutral, sharp, dry, loud, soft, odd) => ({ by, say: neutral, v: { sharp, dry, loud, soft, odd } });
const famConf = (by, ...l) => { const t = fam(by, ...l); return { by, conf: t.say, v: t.v }; };
const own = (by, line) => ({ by, say: line, v: { sharp: line, dry: line, loud: line, soft: line, odd: line } });
const DAY_ONE_OK = line => !/^And\?/i.test(line) && !/snores|awake since|at every meal|fine with the dark|morning fog|out here it.s eight|\b(yesterday|last night|again|always|lately|anymore|used to|every time|every day|every morning|all week)\b|\b(cooked|breakfast|lunch|dinner|shelter|nest)\b/i.test(line);
// b laughing at the comeback, then b asking what a's kit can answer
const FIRST_LAUGHED = ["{b} laughs before {b.sub} can stop {b.ref}.", "{b} snorts, then pretends it was a cough.", "{b} grins and sits down properly.", "{b} shakes {b.posAdj} head, but can't stop smiling."];
const FIRST_ASK = {
  want: [
    fam('b', "Okay, real question. What are you actually here for?", "So what's the plan? Nobody comes here just to make friends.", "Real question, then. Why are you here?", "Okay, but seriously, what do you want out of this?", "Can I ask what you're hoping for, out here?", "Okay, serious question, and you have to answer it seriously. What are you here for?"),
    fam('b', "So what made you sign up for this?", "Why'd you sign up? And don't say for fun.", "What made you sign up for this, of all things?", "So why are you here? What's the big reason?", "What made you want to come? You don't have to tell me.", "What's your reason for being here? You have to answer properly."),
  ],
  home: [
    fam('b', "So who's waiting for you back home?", "Who's at home cheering for you, then?", "Who's back home watching this?", "So who's going to be screaming at the TV back home?", "Is there somebody back home you're doing this for?", "Who's back home right now, wondering what you're up to?"),
    fam('b', "Do you have people back home? What are they like?", "Tell me about home. Who's going to be watching?", "What's waiting for you at home?", "Who've you got at home? Tell me everything!", "Do you miss anyone yet? It's okay if you do.", "What's home like? Paint me a picture."),
  ],
};
// b taking in a's answer, before a asks the same question back
const FIRST_TOOK = [
  fam('b', "Okay, that's a really good answer.", "Hm. That's a better answer than I expected.", "That's a good answer.", "Okay, that's a GREAT answer!", "Oh, that's a really lovely answer.", "Okay, that's a better answer than mine, and I haven't even said mine yet."),
  fam('b', "Huh. I didn't expect that.", "Huh. Didn't see that coming.", "Huh.", "Whoa, I did NOT expect that!", "Oh. I didn't expect that, but I like it.", "Huh. You're full of surprises, aren't you?"),
  fam('b', "Okay, I respect that.", "Fine. I respect that.", "I respect that.", "Okay, I RESPECT that!", "That's really honest. I respect that.", "Okay, I respect that, and I'm a little bit jealous of it."),
];
const ME_TOO = ["Me? ", "For me? ", "Honestly? ", "Me? Honestly? "];
const CLICK_CLOSE = [
  fam('a', "Okay, you're stuck with me now. I want to hear more about that later.", "Fine, you can sit with me. You passed.", "You can stay. You're more interesting than you look.", "Okay, that's it, we're friends now. No take-backs!", "I'm really glad you came over. Can we keep talking later?", "Okay, I've decided you're my first friend here. You don't get a say."),
  fam('a', "I think we're going to get along, you know that?", "You're all right. Don't let it go to your head.", "This is the best conversation I've had all day, which isn't saying much, but still.", "See, this is why you talk to people! You're great!", "I was nervous about meeting everybody, but this was nice.", "You're officially my favourite person here, and I've met almost everyone."),
];
const CLICK_CONF_A = [
  famConf('a', "I thought {b} would roll {b.posAdj} eyes at me. {b} didn't. I like {b}.", "{b} gave me a hard time and then actually listened. That's my kind of person.", "{b} laughed at the right part. That's rare.", "{b} is great! I talked way too much and {b} stayed anyway!", "I was worried I'd be too much for everybody, but {b} didn't seem to mind.", "I talked about myself for twenty minutes and {b} asked questions. I'm keeping {b}."),
  famConf('a', "I didn't expect to make a friend this fast. I think I did, though.", "{b} doesn't just smile and nod, which means when {b} likes something, it counts.", "I don't usually like people straight away. {b} might be an exception.", "I already know {b} is going to be one of my people here!", "{b} made me feel like I didn't have to pretend. That's a really good start.", "{b} teased me and I liked it, so either we're friends or I need to think about some things."),
];
const CLICK_CONF_B = [
  famConf('b', "I came over to make fun of {a} a little, and now I actually like {a}. That wasn't the plan.", "I wanted to see if {a} could take a joke. {a} can, and {a} hit back. Good.", "{a} is a lot. But {a}'s the interesting kind of a lot.", "{a} is so much fun! I'm sitting next to {a} every chance I get!", "{a} told me something real on the first day. I want to deserve that.", "I've known {a} for an hour and I already know way too much about {a}. I love it."),
  famConf('b', "There's more to {a} than I thought. I'm glad I asked.", "I'll admit {a} surprised me. Not many people do.", "I thought {a} would be exhausting. {a} is, but in a good way.", "{a} is my first friend here, and I'm calling it right now!", "I didn't expect to like {a} this much, this fast. I'm really glad I came over.", "I asked {a} one question and got the whole story. I'm going to need a nap, but I'm happy."),
];
// the clash: after the tease and the comeback, b keeps at it, a defends the thing (kit `defend`), and it stays bad
const CLASH_PUSH = [
  fam('b', "Okay, that's cute, but is every conversation with you going to be about that?", "Clever. Do you introduce yourself like this to everyone, or am I special?", "Very good. I asked your name, though, and I didn't ask for all of this.", "Okay, cute, but do you ever stop talking about it?", "That's funny, but I'm sorry, it's a lot to hear before I've even unpacked.", "That was a good line, but I've known you five minutes and I've already heard enough about it for a week."),
  fam('b', "Funny. You know it's not a personality, though, right?", "Sure. But that's a hobby, not a personality, you know.", "Nice. Most people lead with their name, though.", "Okay, ha, but seriously, that's the first thing you tell people?", "That's funny, but I don't really get why it matters so much to you.", "Ha. Is there a version of you that isn't about that? I want to meet that one."),
];
const CLASH_JAB = [
  fam('b', "Okay. Sensitive.", "Wow. Touchy.", "Noted.", "Whoa, okay! Calm down!", "I didn't mean to upset you.", "Okay, I'm backing away slowly."),
  fam('b', "Whatever you say.", "Sure. Keep telling yourself that.", "If you say so.", "Fine! Talk to someone who cares!", "I wasn't trying to start a fight.", "I'm going to go talk to a tree for a while."),
];
const CLASH_BACK = [
  [fam('a', "And you've been a joy to meet, haven't you?", "You've known me five minutes, and you've already decided. Impressive.", "Good talk. Really. Let's never do it again.", "You know what, you're not exactly a ray of sunshine either!", "I was trying to be friendly. I don't know why that was so hard.", "I'm giving you a fresh start tomorrow. Today you're on probation."),
   fam('b', "At least I'm honest about it.", "I'm not here to be liked by you.", "Fine by me.", "Good! I didn't want to anyway!", "I'm sorry. I don't think we got off on the right foot.", "Fine by me. I've survived worse first impressions.")],
  [fam('a', "You don't have to like it. You just have to leave it alone.", "Mock it all you want. I'll still be here when you're gone.", "You can find somebody else to judge. I'm busy.", "Then go talk to somebody else! Nobody's making you stay!", "I'd rather you just said you weren't interested.", "Okay, new rule. You don't get to hear the good part now."),
   fam('b', "Happily.", "With pleasure.", "Already going.", "I'm going! Relax!", "Okay. I'm sorry it came out like that.", "I'll survive, probably.")],
];
const CLASH_CONF_A = [
  famConf('a', "{b} decided what I was before I'd finished a sentence. Fine. I've met people like {b} before.", "{b} thinks laughing at people makes {b} interesting. It doesn't. It makes {b} easy to read.", "So {b} is the person here who's going to roll {b.posAdj} eyes at everything. Good to know early.", "{b} made fun of me on the first day! I'm not forgetting that!", "I really wanted to get along with everybody. I don't think {b} wants to get along with me.", "First impression of {b}: rude. Second impression: still rude. I'll let you know about the third."),
];
const CLASH_CONF_B = [
  famConf('b', "Maybe I was harsh. But nobody needs to hear all of that in the first five minutes.", "{a} is going to talk about that until the merge. Somebody has to say it.", "I said one thing and {a} acted like I'd kicked {a.obj}. This is going to be a long season.", "{a} can't take a joke! Good luck out here!", "I didn't mean to hurt {a}. I just said it really badly, and now it's weird.", "{a} and I are not going to be friends, and honestly, I think we both know it."),
];

export function kitFirstPairScene(a, b, kind, facts, ctx) {
  if (!hasKit(a)) return null;
  const k = kitOf(a);
  const bit = take(a, 'bit', (line, i) => DAY_ONE_OK(line) && [k.tease?.[i], k.reply?.[i]].every(x => x && DAY_ONE_OK(x)));
  if (!bit) return null;
  const tease = take(a, 'tease', (_, i) => i === bit.index), reply = take(a, 'reply', (_, i) => i === bit.index);
  if (!tease || !reply) return null;
  const pick = (list, ...key) => list[[...key.join('|')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % list.length];
  const archOf = n => (typeof window !== 'undefined' && window.players || []).find(p => p.name === n)?.archetype || 'floater';
  const opening = k.alone && DAY_ONE_OK(k.alone)
    ? { beat: `{a} ${k.alone}, when {b} ${kind === 'clicked' ? "comes over to see what's going on" : 'sits down nearby'}.` }
    : { beat: kind === 'clicked' ? '{b} sits down next to {a} {here}.' : '{a} is talking about {a.thing} {here}, and {b} has to sit through it.' };
  let turns, spent = [bit, tease, reply];
  if (kind === 'clicked') {
    // the question a's own kit answers, and b's own answer to it
    const part = take(a, 'want', DAY_ONE_OK) ? 'want' : 'home';
    const ans = take(a, part, DAY_ONE_OK);
    const mine = hasKit(b) ? take(b, part, DAY_ONE_OK) : plain(part, b, archOf(b));
    if (!ans || !mine) return null;
    spent.push(ans, mine);
    const lead = pick(ME_TOO, a, b);
    turns = [
      opening, own('a', bit.line), own('b', tease.line), own('a', reply.line),
      { beat: pick(FIRST_LAUGHED, b, a) },
      pick(FIRST_ASK[part], a, b), own('a', ans.line),
      pick(FIRST_TOOK, b, a),
      fam('a', "What about you?", "Your turn. Same question.", "Now you.", "Okay, your turn! Same question!", "What about you? I want to know.", "Your turn, and you have to be just as honest as me."),
      own('b', lead + mine.line),
      pick(CLICK_CLOSE, a, b),
      pick(CLICK_CONF_A, a, b), pick(CLICK_CONF_B, b, a),
    ];
  } else {
    const defend = take(a, 'defend', DAY_ONE_OK);
    if (!defend) return null;
    spent.push(defend);
    const [hit, back] = pick(CLASH_BACK, a, b);
    // the kit's tease and comeback stay one exchange (spec §6.2); the next line is b's reaction to the
    // comeback, which is where it stops being banter (read 2026-10-10: a friendly comeback straight into
    // "I asked your name, I didn't ask for all of this" had no turn in it)
    turns = [
      opening, own('a', bit.line), own('b', tease.line), own('a', reply.line),
      pick(CLASH_PUSH, b, a), own('a', defend.line), pick(CLASH_JAB, a, b),
      hit, back,
      { beat: '{b} gets up and finds somewhere else to sit.' },
      pick(CLASH_CONF_A, a, b), pick(CLASH_CONF_B, b, a),
    ];
  }
  const who = { a, b };
  const entry = { id: `kit:first:${kind}:${a}:${bit.index}`, place: 'aside', turns };
  let w = writeKitScene(entry, who, facts, { ...ctx, firstImpressions: true, data: { ...(ctx.data || {}), 'a.thing': k.thing } });
  // the solo opening names a place the venue may not have: open plainly instead
  if (!w && opening.beat.includes(k.alone || '\u0000')) {
    turns[0] = { beat: kind === 'clicked' ? '{b} sits down next to {a} {here}.' : '{a} is talking about {a.thing} {here}, and {b} has to sit through it.' };
    w = writeKitScene({ ...entry, turns }, who, facts, { ...ctx, firstImpressions: true, data: { ...(ctx.data || {}), 'a.thing': k.thing } });
  }
  if (w) { for (const s of spent) s.mark(); w.kit = true; w.who = who; }
  return w;
}
