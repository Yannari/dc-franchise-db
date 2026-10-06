// ══════════════════════════════════════════════════════════════════════
// vp-tr/reunion.js — the reunion: everybody back, nothing left to hide
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-03: "we need a last episode reunion after we're done all
// that and a actual deep reunion". The last screen of a season. Everybody who
// played — the winners, the banished, the murdered — back in the Round Table
// room months later, and the host going straight at the moments that made the
// season, in plain words: the Traitors explaining themselves, the murdered
// asking their murderers why, the Faithfuls the room sent home naming who led
// it, the recruits, the Traitors who turned on their own, the friendships and
// the feuds, and the last question to everybody.
//
// Built from `ep.tr.reunion` (js/tr/headless.js `_reunionRecord`): only what
// the season actually did. Everybody at a reunion knows everything, so there
// is one layer. Every line is spoken in the speaker's own tone (stats and
// archetype, proportionally — the same six the endgame uses), and one set
// holds everything said on the screen, so nobody repeats anybody.
//
// Like every other file in this directory it imports no engine state beyond
// the cast list and the stat reader.
import { seasonConfig, players } from '../core.js';
import { pronouns, pStats } from '../players.js';
import { HOSTS_BY_FORMAT } from '../shows.js';
import { _portrait, conclaveStageData } from './conclave.js';
import { roundTableStageData } from './round-table.js';
import { beatLines } from './stage-lines.js';

const TR = 'traitors';
function _hash(s) {
  let h = 2166136261; const str = String(s);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13;
  return h >>> 0;
}
const _esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const _fill = (t, subs) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => (subs && subs[k] != null ? subs[k] : m));
function _slugOf(name) {
  const p = (players || []).find(x => x && x.name === name);
  return (p && p.slug) || String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
const _av = (n, size) => _portrait(_slugOf(n), n, size || 40);
function _host() {
  const list = HOSTS_BY_FORMAT[TR] || [];
  const want = seasonConfig && seasonConfig.host;
  const hit = list.find(h => h.value === want) || list[0] || { value: 'host', label: 'Your host' };
  return { name: hit.label, slug: String(hit.value).toLowerCase().replace(/[^a-z0-9]+/g, '-') };
}
const _money = n => '£' + Math.round(Number(n) || 0).toLocaleString('en-GB');

// ── WHO THEY ARE WHEN THEY TALK ─────────────────────────────────────────
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);
const DRIFT = new Set(['floater', 'wildcard', 'chaos-agent']);
function _tone(name) {
  const st = (typeof pStats === 'function' && pStats(name)) || {};
  const g = k => (Number.isFinite(st[k]) ? st[k] : 5);
  const arch = ((players || []).find(p => p && p.name === name) || {}).archetype || '';
  const w = {
    dramatic: g('boldness') * .6 + (10 - g('temperament')) * .6,
    calm: g('temperament') * .7 + g('strategic') * .4,
    mean: ((10 - g('temperament')) * .5 + (10 - g('loyalty')) * .5) * (NICE.has(arch) ? .25 : VILLAIN.has(arch) ? 1.5 : 1),
    sad: g('social') * .35 + g('loyalty') * .45 + (NICE.has(arch) ? 1 : 0),
    idgaf: g('boldness') * .3 + (10 - g('social')) * .4 + (DRIFT.has(arch) ? 2 : 0),
    idk: (10 - g('intuition')) * .5 + (10 - g('strategic')) * .5,
  };
  const keys = Object.keys(w), sq = keys.map(k => Math.max(.1, w[k]) ** 2);
  let r = ((_hash('reunion|tone|' + name) % 10007) / 10007) * sq.reduce((a, b) => a + b, 0);
  for (let i = 0; i < keys.length; i++) { r -= sq[i]; if (r <= 0) return keys[i]; }
  return keys[keys.length - 1];
}

// ══════════════════════════════════════════════════════════════════════
// THE WORDS
// ══════════════════════════════════════════════════════════════════════
const HOST_OPEN = [
  'Good evening, and welcome to the reunion. For the first time since the castle, everybody is back in one room: the winners, the people sent home at the table, and the people who never made it to breakfast. Tonight, nobody has to lie.',
  'Welcome back. Every single one of them is here tonight, and for once, there are no secrets left. Let us talk about what really happened.',
  'Good evening. The game is over, the money has been won, and every secret is out. Tonight, they finally get to say what they really think.',
];
const NARR_OPEN = [
  'They come back into the room where it all happened. Some of them hug like old friends. Some of them very carefully sit on opposite sides.',
  'The Round Table room, months later. The candles are lit again, and this time every chair is filled.',
  'Everybody is back: the people taken in the night, the people sent home at this table, and the people who walked away with the money.',
];
// the winners
const HOST_WIN = [
  '{W}, you walked away with {pot}. Now that it has sunk in, how does it feel?',
  '{W}, take us back to that last fire. What was going through your head?',
  '{W}, you won. When did you first believe you could?',
];
// MORE THAN ONE OF THEM CAN WIN (the user, 2026-10-06: "the reunion doesnt
// seem to register that multiple people can win the game"). Everybody who
// stopped at the last fire with no Traitor among them splits the pot.
const HOST_WIN_MANY = [
  '{Ws}, you walked out of that castle together and split {pot}. That is {each} each. How does it feel?',
  '{Ws}. You trusted each other at the last fire, and it paid off. How does it feel now?',
  '{Ws}, months later, you have had time to let it sink in. What is it like?',
];
const HOST_WIN_NEXT = [
  '{W}, what about you?',
  'And {W}?',
  '{W}, how did it feel for you?',
];
// what a winner says that only makes sense when they shared it
const SHARE_SAY = {
  dramatic: ['When that fire burned green, I grabbed {O} and I didn’t let go.', 'We did it together, and I would not change that for anything.'],
  calm: ['I knew I could trust {O}. That was the whole game at the end.', 'We earned it together. Splitting it felt right.'],
  mean: ['Honestly? I’d have liked it all. But fine, {O} earned a bit.', 'I carried us, but I’m happy to share.'],
  sad: ['I cried on {O}’s shoulder for about ten minutes.', 'Sharing it with {O} made it mean so much more.'],
  idgaf: ['Money’s money. Half is still a lot.', 'We won. That’s the main thing.'],
  idk: ['I still can’t believe we actually trusted each other.', 'I kept waiting for {O} to throw a red.'],
};
const WIN_SAY = {
  dramatic: ['I still dream about that fire. When it burned green, I screamed so loud I lost my voice.', 'Honestly? It still doesn’t feel real. I won The Traitors!'],
  calm: ['It feels good. I played the game I wanted to play, and it worked.', 'I always believed I could get there if I kept my head down and stayed calm.'],
  mean: ['It feels like I deserved it, if I’m honest.', 'I knew I’d win the moment I walked into that castle.'],
  sad: ['I cried for about a week. I still can’t talk about it without crying.', 'I just wish everyone who helped me get there could have shared it.'],
  idgaf: ['Pretty good, to be fair. Bought a nice car.', 'Honestly, I didn’t think about it much. It just happened.'],
  idk: ['I still don’t really understand how I won.', 'Every morning I wake up and check it actually happened.'],
};
const LOSER_SAY = {
  dramatic: ['I stood at that fire and trusted every one of them. I will never trust anybody again.', 'I was so close. So close!'],
  calm: ['They played it better than I did. Fair play to them.', 'It stings, but that’s the game.'],
  mean: ['Let’s just say I haven’t sent anyone a Christmas card.', 'Some of you got very lucky.'],
  sad: ['It hurt. It really hurt. I thought we’d done it together.', 'I went home and didn’t talk to anybody for days.'],
  idgaf: ['I got a holiday out of it. I’m fine.', 'Whatever. It was a laugh.'],
  idk: ['I still can’t work out where it went wrong for me.', 'I genuinely thought I was winning.'],
};
// the Traitors explain themselves
const HOST_TRAITORS = [
  'Traitors, it is time to explain yourselves. The people you lied to are sitting right in front of you.',
  'Let us talk about the turret. Traitors, the floor is yours.',
  'Now for the people everybody wants to hear from. Traitors, how did you do it?',
];
const HOST_ASK_T = [
  '{T}, when did you first think you might actually get away with it?',
  '{T}, what was the hardest part of being a Traitor?',
  '{T}, who in this room came closest to catching you?',
  '{T}, did you ever feel guilty?',
];
const T_SAY = {
  dramatic: ['Every single breakfast, I thought it was over. Every single one. I lived on adrenaline for weeks.', 'The hardest part was smiling at people I had just chosen in the turret.', 'I nearly confessed at the second Round Table. I was shaking.', 'Every time someone said my name, my heart stopped.'],
  calm: ['From the first day. As long as I stayed calm, nobody had a reason to look at me.', 'It was a game, and I played my role. I’m proud of how I did it.', 'I treated it like a job. Breakfast, mission, table, turret. Repeat.', 'I picked my moments. That was the whole secret.'],
  mean: ['Honestly? It was easy. Most of you were too busy suspecting each other.', 'Guilty? No. You’d have done exactly the same.', 'You were all so busy fighting each other that you forgot to look at me.', 'I’d do it all exactly the same way again.'],
  sad: ['Yes, I felt guilty. Every night. Some of you were real friends.', 'The lying was the hardest part. I hated it.', 'I cried in the bathroom more than once. Nobody knew.', 'Some nights I couldn’t sleep at all.'],
  idgaf: ['I just got on with it. Murder someone, go to bed.', 'Wasn’t that hard, to be honest.', 'It was a game. I played it.', 'Honestly, I enjoyed it more than I should have.'],
  idk: ['I genuinely thought I’d be caught on day two.', 'I still don’t know how nobody worked it out.', 'Half the time I didn’t know what I was doing either.', 'I kept waiting for someone to just point at me.'],
};
const T_SAY_CATCHER = {
  dramatic: ['{C}. {C} looked at me at the table like they could see straight through me.', 'It was {C}. I nearly broke every time {C} asked me a question.'],
  calm: ['{C} came closest. I had to work hard to keep {C} on side.', 'Probably {C}. {C} was sharper than people gave credit for.'],
  mean: ['{C} thought they were close. They weren’t.', '{C}, maybe. Not that it mattered in the end.'],
  sad: ['{C}. And I hated lying to {C} more than anyone.', 'It was {C}, and I was terrified of {C} the whole time.'],
  idgaf: ['{C}, I suppose. Didn’t lose sleep over it.', 'Probably {C}. Good effort, {C}.'],
  idk: ['Was it {C}? I think it was {C}.', '{C}, maybe? I honestly couldn’t tell.'],
};
const CATCHER_SAY = {
  dramatic: ['I told everyone! I said your name at the table and nobody listened!', 'I knew it. I knew it the whole time!', 'I said it at the table! I said it out loud!', 'I knew something was wrong from the very first week!'],
  calm: ['I had a feeling. I just couldn’t prove it.', 'I wasn’t sure enough to say it out loud. I should have been.', 'I noticed things. I just never put them together in time.', 'I should have trusted my instincts.'],
  mean: ['I knew from the start. The rest of you just wouldn’t listen.', 'Next time, maybe people will listen to me.', 'If anyone had listened to me, this would have been over weeks ago.', 'I’m not surprised. Not even slightly.'],
  sad: ['I wanted so badly to be wrong about you.', 'I suspected you, and I still defended you. I feel so stupid.', 'Part of me knew. I just didn’t want it to be true.', 'I’m hurt, honestly. I really liked you.'],
  idgaf: ['Yeah, I had you. Didn’t matter in the end.', 'Called it. Nobody cared.', 'Good game, anyway.', 'Yeah. Saw that coming.'],
  idk: ['Wait, I was the closest? I didn’t know that.', 'I had no idea I was even close.', 'Really? I thought I was miles off.', 'I suspected about four people. You were one of them, I think.'],
};
// the murdered ask why
const HOST_MURDER = [
  '{V}, the Traitors came for you on night {n}. {K} made that decision. {K}, tell {V} why.',
  '{K}, you chose {V} that night. {V} is sitting right there. Why {V}?',
  '{V}, you never found out who chose you. It was {K}. {K}, explain yourself.',
];
const KILLER_WHY = {
  'onto-me': ['You were getting too close, {V}. You were asking all the right questions about me.', 'You had started to suspect me, {V}. I couldn’t risk one more day.'],
  'listened-to': ['When you spoke, people listened, {V}. That made you the most dangerous person in the castle.', 'You kept getting it right, {V}. Sooner or later you would have got me right too.'],
  beloved: ['Everybody loved you, {V}. We could never have voted you out, so it had to be at night.', 'You were the heart of the castle, {V}. Without you, they started turning on each other.'],
  'wasted-decoy': ['People already suspected you, {V}. Killing you made them doubt everything they thought.', 'You were the name they were about to write, {V}. Taking you first confused all of them.'],
  convenient: ['Honestly, {V}? You were the safe choice. Nobody was going to fight for you.', 'It wasn’t personal, {V}. You were just the easiest name that night.'],
  sacrifice: ['You were my friend, {V}. That is exactly why it had to be you. Nobody suspects the grieving friend.', 'I needed people to stop looking at me, {V}, and losing you was the only way.'],
  forced: ['We had to choose one of our own that night, {V}. It was the worst decision I made.', 'There was no good choice, {V}. I’m sorry.'],
  _: ['It was strategy, {V}. Nothing more.', 'It had to be someone, {V}, and that night it was you.'],
};
const VICTIM_SAY = {
  dramatic: ['You looked me in the eye at breakfast the day before! The day before!', 'I can’t believe it was you. I cried for you when I thought you might go!', 'I trusted you with everything!', 'I cried on your shoulder the night before!'],
  calm: ['That’s fair. I would have done the same.', 'Honestly, I respect it. It was a good move.', 'I suppose that makes sense. Well played.', 'No hard feelings. It was a good choice.'],
  mean: ['Funny. You didn’t seem that clever at the time.', 'Well, it didn’t save you in the end, did it?', 'I hope it was worth it.', 'You could have just said it to my face.'],
  sad: ['I thought we were friends. I really did.', 'I just wish you’d have told me afterwards.', 'That really hurts to hear.', 'I went home thinking you were my friend.'],
  idgaf: ['Fair enough. I slept better at home anyway.', 'Ha. Nice one.', 'Fair play. Got a lie-in out of it.', 'Can’t argue with that.'],
  idk: ['Wait, it was you? I always thought it was someone else.', 'Really? Me? I thought nobody even noticed me.', 'I had absolutely no idea.', 'Wait, so all those conversations…?'],
};
// the Faithfuls the room got wrong
const HOST_MISTAKE = [
  '{F}, you were a Faithful, and this room sent you home on day {n}. Who do you blame?',
  '{F}, the room sent you home as a Faithful. Who led the charge against you?',
  '{F}, you were telling the truth, and the room did not believe you. How did that feel?',
];
const F_SAY = {
  dramatic: ['{L}. {L} led the charge, and I will never forget it.', 'It was {L}. {L} turned the whole table against me.', '{L} looked me in the eye and said my name. I’ll never forget that.'],
  calm: ['It was the game. But {L} did push very hard.', 'I understand why it happened. {L} made a strong case. It was just wrong.', '{L} believed it. I just wish {L} had asked me first.'],
  mean: ['{L}, obviously. And {L} knows it.', 'Ask {L}. {L} was so sure of themselves.', '{L} needed someone to blame, and it was me.'],
  sad: ['It hurt so much. And it was {L}, who I thought was my friend.', 'I went home and cried. {L}, why didn’t you believe me?', '{L} hurt me more than anyone in that castle.'],
  idgaf: ['{L} got it wrong. That’s all.', 'Whatever. {L} had a bad day.', '{L}, I guess. Doesn’t matter now.'],
  idk: ['I still don’t know why. {L}, why was it me?', 'Honestly, I think it was {L}? I was so confused.', 'I think {L} started it? It all happened so fast.'],
};
const LEAD_SAY = {
  dramatic: ['I am so sorry, {F}. I really, truly thought it was you.', 'I’ve thought about that night every day since, {F}.', 'I owe you the biggest apology of my life, {F}.'],
  calm: ['I made the wrong call, {F}. I’m sorry.', 'In my defence, the evidence looked bad. But I was wrong, {F}.', 'I was wrong, {F}, and I’ve told you that since.'],
  mean: ['You did act very suspiciously, {F}.', 'I stand by my reasons. I just got the answer wrong.', 'It looked like you, {F}. That’s all I can say.'],
  sad: ['I feel terrible, {F}. I really do.', 'I’m so sorry, {F}. I think about it all the time.', 'I still feel sick about it, {F}.'],
  idgaf: ['It was a guess, {F}. Sorry.', 'Yeah. My bad.', 'It happens, {F}.'],
  idk: ['I genuinely don’t know what I was thinking, {F}.', 'I panicked, {F}. I’m sorry.', 'Honestly, {F}, I’m still not sure why I did it.'],
};
// a Traitor who wrote a fellow Traitor's name
const HOST_TURNED = [
  '{A}, you wrote the name of your fellow Traitor, {B}. Explain that to {B}.',
  '{B}, your own fellow Traitor voted to send you home. {A}, why?',
];
const TURNED_SAY = {
  dramatic: ['It was you or me, {B}. And I wasn’t going home.', 'I had no choice, {B}. They were coming for one of us.'],
  calm: ['It was strategy, {B}. You were going anyway, and it bought me trust.', 'You were already finished, {B}. I made sure it helped me.'],
  mean: ['You were a liability, {B}.', 'Nothing personal, {B}. Well, a little personal.'],
  sad: ['I hated doing it, {B}. I really did.', 'I’m sorry, {B}. I didn’t know what else to do.'],
  idgaf: ['It was the smart move, {B}.', 'Had to be done, {B}.'],
  idk: ['I panicked, {B}. I just wrote a name.', 'I didn’t think it through, {B}. Sorry.'],
};
const TURNED_BACK = {
  dramatic: ['You threw me under the bus in front of everyone!', 'I would never have done that to you!'],
  calm: ['I get it. I’d probably have done the same.', 'It was smart. It still hurt.'],
  mean: ['Don’t worry, I’d have done it to you first.', 'Remind me never to trust you again.'],
  sad: ['I thought we were in it together.', 'That hurt more than being caught.'],
  idgaf: ['Fair play. It’s a game.', 'Yeah, I would have too.'],
  idk: ['Wait, that was you?', 'I didn’t even notice at the time.'],
};
// the recruits
const HOST_RECRUIT = [
  '{R}, {T} asked you to become a Traitor. Why did you say yes?',
  '{R}, you were recruited by {T}. Talk us through that night.',
];
const HOST_REFUSED = [
  '{R}, {T} asked you to become a Traitor, and you said no. Why?',
];
const RECRUIT_SAY = {
  dramatic: ['I opened that note and my heart stopped. I knew my whole game had just changed.', 'I said yes before I could think about it.'],
  calm: ['It was the best way to win. Simple as that.', 'I thought it through, and the numbers were on their side.'],
  mean: ['Why wouldn’t I? The Faithfuls were losing anyway.', 'It was the only way to win, and I wanted to win.'],
  sad: ['It was the hardest thing I did in there. I nearly said no.', 'I said yes, and then I lay awake all night.'],
  idgaf: ['Seemed like fun.', 'Why not? Better than being picked off in the night.'],
  idk: ['Honestly, I don’t know. It just happened.', 'I panicked and said yes.'],
};
const REFUSE_SAY = {
  dramatic: ['I came here to catch Traitors, not become one!', 'Never. Not for any amount of money.'],
  calm: ['I wanted to win as myself.', 'I didn’t trust the offer.'],
  mean: ['I wasn’t going to do your dirty work for you.', 'You picked the wrong person.'],
  sad: ['I couldn’t lie to my friends like that.', 'I just couldn’t do it.'],
  idgaf: ['Didn’t fancy it.', 'Nah. Too much effort.'],
  idk: ['I honestly thought it was a trap.', 'I didn’t understand what was happening.'],
};
// friendships and feuds
const HOST_FRIENDS = [
  '{A} and {B}, you two were inseparable in that castle. Is that still true?',
  '{A}, {B}. The friendship of the season. Are you still close?',
];
const FRIEND_SAY = {
  dramatic: ['{O} is family now. Honestly, I’d do anything for {O}.', 'I love {O}. That’s the best thing I got out of the whole thing.'],
  calm: ['We talk every week. {O} is a real friend.', 'Yes. {O} was the one person I trusted completely.'],
  mean: ['{O} is the only one of you I actually liked.', 'Yes, but don’t tell anyone.'],
  sad: ['I don’t know how I’d have got through it without {O}.', '{O} kept me going on the worst days.'],
  idgaf: ['Yeah, {O}’s alright.', 'We’re mates. Simple.'],
  idk: ['I think so? We text, anyway.', 'Are we, {O}? I hope so.'],
};
const HOST_RIVALS = [
  '{A}, {B}. You two did not get on in the castle. Have you made up?',
  '{A} and {B}, you clashed more than anybody. Where do things stand now?',
];
const RIVAL_SAY = {
  dramatic: ['Absolutely not. {O} knows exactly what {O} did.', 'I will never forgive {O} for what was said at that table.'],
  calm: ['It got heated in there. I’d like to think we’re past it.', 'I don’t hold grudges. Mostly.'],
  mean: ['I have nothing to say to {O}.', 'Let’s just say {O} is not on my Christmas list.'],
  sad: ['I wish it had been different. It got out of hand.', 'I’d like to fix it, if {O} would.'],
  idgaf: ['Don’t care, honestly.', 'Never think about {O}.'],
  idk: ['I’m not even sure what we fell out about.', 'Are we still fighting? I genuinely don’t know.'],
};
// ── THE WINNERS WALK IN (the user, 2026-10-06: "we dont have special
// arrival of the winner(s) and congratulations and tape of their game") ──
const ARRIVE_ONE = [
  'The doors open one last time. {Ws} walks in, and the whole room is on its feet.',
  'The lights drop. The doors open, and {Ws} walks in to the loudest cheer of the night.',
];
const ARRIVE_MANY = [
  'The doors open one last time. {Ws} walk in together, and the whole room is on its feet.',
  'The lights drop. The doors open, and {Ws} walk in side by side to the loudest cheer of the night.',
];
const HOST_CONGRATS_F = [
  'Ladies and gentlemen, the winners of The Traitors: {Ws}! Congratulations.',
  'There they are. {Ws}, congratulations. You found the Traitors, and you kept your nerve at the fire.',
];
const HOST_CONGRATS_F_ONE = [
  'Ladies and gentlemen, the winner of The Traitors: {Ws}! Congratulations.',
  'There {sub} is. {Ws}, congratulations. You kept your nerve right to the very end.',
];
const HOST_CONGRATS_T = [
  'Ladies and gentlemen, the {winner} of The Traitors: {Ws}! You fooled every single person in this room.',
  'There {they}. {Ws}, congratulations. You lied to all of them, and you got away with it.',
];
// the room's congratulations, in the voice of whoever says them
const CONGRATS = {
  dramatic: ['You deserve every penny! I am so proud of you!', 'I screamed at the television when I saw it. Congratulations!'],
  calm: ['Well played. You earned it.', 'Congratulations. Nobody played it better.'],
  mean: ['Congratulations. I suppose.', 'Enjoy it. You got lucky at that fire.'],
  sad: ['I cried when I watched it. You deserve it so much.', 'I’m so happy for you. Honestly.'],
  idgaf: ['Nice one. Spend it on something good.', 'Fair play. Drinks are on you.'],
  idk: ['Wait, how much was it again? Congratulations!', 'I genuinely didn’t see that coming. Well done!'],
};
// a Traitor congratulating the Faithfuls who beat them
const CONGRATS_BEATEN = {
  dramatic: ['You beat me, and I hate it. Congratulations.', 'I am furious, and I am so proud of you. Both.'],
  calm: ['Fair play. You beat me properly.', 'You caught us. Congratulations, genuinely.'],
  mean: ['Don’t get used to it.', 'Fine. Well done. Happy now?'],
  sad: ['I’m glad it was you, if it had to be anyone.', 'I’m so happy for you, even if it was at my expense.'],
  idgaf: ['Good game. Well played.', 'Yeah, fair. Congratulations.'],
  idk: ['Wait, you were the one who caught me? Well done.', 'I still don’t know how you did it. Congratulations.'],
};
const TAPE_HOST = [
  'Before we talk to {Ws}, let us look back at how {they} won it.',
  'Let us remind ourselves how {Ws} got here.',
];
const THROWBACK_HOST = {
  traitors: ['Let us go back to the beginning, and the moment the Traitors were chosen.'],
  murders: ['Let us go back to those breakfasts.'],
};

// ── CONFRONTATIONS: the second and third lines of an exchange ────────────
// The murderer, after the murdered has answered. A friendship still warm at
// the end of the season gets the softer line.
const KILLER_AFTER_FRIEND = {
  dramatic: ['I cried in the turret afterwards, {V}. You have to believe me.', 'It was the worst night of the whole game for me, {V}. I mean that.'],
  calm: ['For what it’s worth, {V}, I meant every conversation we had.', 'The friendship was real, {V}. The game just needed you gone.'],
  mean: ['If it helps, {V}, you were the best decision I made all game.', 'You should take it as a compliment, {V}. I only killed the people I rated.'],
  sad: ['I’m so sorry, {V}. I still think about that night.', 'I wanted to tell you so many times, {V}.'],
  idgaf: ['We’re still good though, {V}, yeah?', 'Drinks after this, {V}? My treat.'],
  idk: ['Can we still be friends, {V}? Please?', 'I honestly don’t know how I did it, {V}.'],
};
const KILLER_AFTER = {
  dramatic: ['And I would do it again, {V}!', 'Somebody had to go that night, {V}, and I am not sorry it was you.'],
  calm: ['It was the right call, {V}, and I stand by it.', 'I’d make the same choice again, {V}. That’s the honest answer.'],
  mean: ['Honestly, {V}, you made it very easy.', 'You were never going to win anyway, {V}.'],
  sad: ['I am sorry, though, {V}. I mean that.', 'It doesn’t make it feel any better, {V}. I know.'],
  idgaf: ['Anyway. No hard feelings, {V}.', 'It was a game, {V}. We move on.'],
  idk: ['I don’t really know what else to say, {V}.', 'Sorry? Is that what I’m supposed to say?'],
};
// whoever the room wrongly sent home, after the apology (or the lack of one)
const HOST_FORGIVE = [
  '{F}, can you forgive {L}?',
  '{F}, is that enough for you?',
  '{F}, what do you want to say to {L} now?',
];
const FORGIVE_YES = {
  dramatic: ['Come here. Of course I forgive you, {L}.', 'I’ve waited months to hear that, {L}. Yes.'],
  calm: ['Yes. We were all guessing in there, {L}.', 'I forgave you a long time ago, {L}.'],
  mean: ['Fine. But you’re buying the drinks tonight, {L}.', 'Yes. Just don’t ever do it again.'],
  sad: ['I already have, {L}. I just needed to hear you say it.', 'Yes. I missed you, {L}.'],
  idgaf: ['Yeah, it’s fine, {L}. Water under the bridge.', 'Course. It’s done.'],
  idk: ['I think so? Yes. Yes, I do.', 'Yes. I think. Yes.'],
};
const FORGIVE_NO = {
  dramatic: ['No. Not tonight, {L}. Maybe not ever.', 'Sorry doesn’t give me my game back, {L}.'],
  calm: ['I accept the apology, {L}. I’m just not there yet.', 'I hear you, {L}. It will take time.'],
  mean: ['No. You don’t get off that easily, {L}.', 'Nice speech, {L}. Still no.'],
  sad: ['I want to, {L}. I just can’t yet.', 'It still hurts too much, {L}.'],
  idgaf: ['Don’t really care either way, {L}.', 'Doesn’t matter to me now.'],
  idk: ['I don’t know, {L}. Ask me next year.', 'I really don’t know yet.'],
};
const DIR_FORGIVE = [
  '{L} gets up and hugs {F}. The room applauds.',
  '{F} and {L} hug it out, and half the room is in tears.',
];
const DIR_NO_FORGIVE = [
  'Nobody moves. {L} looks down at the floor.',
  '{L} nods and sits back. The silence says the rest.',
];
// a feud, after both have had their say
const RIVAL_BACK = {
  dramatic: ['You are unbelievable, {O}. Truly.', 'Oh, here we go again.'],
  calm: ['I think we both said things we didn’t mean, {O}.', 'I’m not going to argue about it on television, {O}.'],
  mean: ['Same old {O}.', 'Still bitter, {O}? Wow.'],
  sad: ['That’s not fair, {O}, and you know it.', 'I really wanted tonight to be different, {O}.'],
  idgaf: ['Okay.', 'Right. Cool.'],
  idk: ['What did I even do to you, {O}?', 'I genuinely don’t know what this is about.'],
};
const HOST_SHAKE = [
  'Will you two shake hands tonight?',
  'Can we end it here? Shake hands?',
];
const SHAKE_YES = {
  dramatic: ['Fine. Come here, {O}.', 'Go on, then. Come here, {O}.'],
  calm: ['Of course. Life is too short.', 'Yes. It was a game.'],
  sad: ['I’d like that.', 'Yes. I’ve wanted to for months.'],
  idgaf: ['Sure, whatever.', 'Yeah, go on then.'],
  idk: ['I suppose so? Yes.', 'Okay. Yes. Why not.'],
};
const SHAKE_NO = {
  dramatic: ['Absolutely not.', 'Not a chance, {O}.'],
  calm: ['Not tonight.', 'I don’t think that would be honest.'],
  mean: ['I’d rather not touch {O}, thanks.', 'No.'],
  sad: ['I can’t. Not yet.', 'I’m sorry. I just can’t.'],
  idgaf: ['Nah.', 'I’m good, thanks.'],
  idk: ['Do I have to?', 'Maybe later?'],
};
const DIR_SHAKE = [
  '{A} and {B} stand up and shake hands. The room cheers.',
  'They shake hands. It is stiff, but it happens.',
];
const DIR_NO_SHAKE = [
  'Neither of them moves. {H} moves on.',
  '{A} folds {posA} arms. {B} does not move either.',
];
const DIR_HALF_SHAKE = [
  '{Y} holds out a hand. {N} leaves it hanging.',
  '{Y} stands up. {N} stays sitting. {Y} sits back down.',
];
const KILLER_ACCEPTED = {
  dramatic: ['Thank you, {V}. Honestly, that means everything.', 'Oh, thank God. I was dreading this, {V}.'],
  calm: ['I knew you’d understand, {V}. Thank you.', 'That’s generous of you, {V}. Thank you.'],
  mean: ['See? {V} gets it.', 'Finally, somebody in this room who understands the game.'],
  sad: ['That’s kind of you, {V}. I still feel awful.', 'Thank you, {V}. I didn’t deserve that.'],
  idgaf: ['Good. Glad we’re sorted, {V}.', 'Nice one, {V}.'],
  idk: ['Oh. Okay. Thank you, {V}?', 'Really? That’s it? Thank you, {V}.'],
};
const DIR_MURDER_EASY = [
  '{V} shrugs and holds out a hand. {K} shakes it.',
  '{V} nods. It is clearly old news.',
];
const DIR_MURDER_WARM = [
  '{V} reaches across and squeezes {K}’s hand.',
  '{V} laughs and shakes {posV} head. {K} looks relieved.',
];
const DIR_MURDER_COLD = [
  '{V} turns away from {K} and does not look back.',
  '{V} stares at {K} for a long moment. {K} looks at the floor.',
];

// ── NEVER SEEN BEFORE: the footage the room never saw ──────────────────
const HOST_FOOTAGE = [
  'Now, there are a few things some of you have never seen. Let us go back to the turret.',
  'Before we go any further, there is some footage some of you need to see.',
  'The Traitors did not only talk about the people they took in the night. Let us look at the ones they nearly took.',
];
// what the Traitor said in the turret, on the night, about somebody who survived it
const CLIP_SAID = {
  beloved: ['Everybody loves {V}. We will never get {V} out at the table, so it has to be at night.', '{V} is the heart of this castle. Take {V} and they fall apart.'],
  'onto-me': ['{V} keeps asking me questions. I don’t like it. I want {V} gone tonight.', '{V} is getting close to me. Too close.'],
  'listened-to': ['When {V} talks, the whole table listens. That makes {V} dangerous.', '{V} keeps getting it right. We need {V} gone before {V} gets us.'],
  'wasted-decoy': ['Half the castle already suspects {V}. If we kill {V}, nobody will know what to think.', 'They are about to vote for {V} anyway. Kill {V} and they will be lost.'],
  convenient: ['What about {V}? Nobody would fight for {V}.', '{V}. It would be an easy night.'],
  sacrifice: ['I know {V} is my friend. That is exactly why nobody would suspect me.', 'If I lose {V}, they will feel sorry for me. Trust me.'],
  forced: ['We have to pick someone. I say {V}.', 'I hate it, but I say {V}.'],
  _: ['I want {V} tonight.', 'My vote is {V}. Let’s just do it.'],
};
const HOST_FOOTAGE_ASK = [
  '{V}, that was {B}, on night {n}. What do you say to that?',
  '{V}, you had no idea, did you?',
  '{V}, you are watching {B} put your name forward. How does that feel?',
];
const HOST_FOOTAGE_WON = [
  '{V}, you nearly did not make it past night {n}, and you walked away with the money. What do you say to {B}?',
];
const FOOTAGE_FRIEND = {
  dramatic: ['You wanted me dead? You hugged me every single morning, {B}!', 'I would have taken a bullet for you, {B}!'],
  calm: ['Wow. I genuinely thought you were in my corner, {B}.', 'Well. That explains a few looks I got at breakfast, {B}.'],
  mean: ['Two-faced. I always knew it, {B}.', 'Remind me to never trust a word you say, {B}.'],
  sad: ['That really hurts, {B}. I trusted you more than anyone.', 'I feel sick watching that, {B}.'],
  idgaf: ['Ha. Classic {B}.', 'Fair play, {B}. Nice try.'],
  idk: ['Wait, that was you, {B}? Seriously?', 'I don’t even know what to say to that, {B}.'],
};
const FOOTAGE_PLAIN = {
  dramatic: ['Oh my God. I had no idea it was that close!', 'I could have died that night and I never knew!'],
  calm: ['Interesting. I had no idea I was even on the list.', 'I suspected something like that. Good to know.'],
  mean: ['And yet here I am, {B}.', 'Should have tried harder, {B}.'],
  sad: ['I didn’t think anybody saw me as a threat.', 'That’s a horrible feeling, honestly.'],
  idgaf: ['Glad they didn’t. I liked the food.', 'Ha. Missed me.'],
  idk: ['Me? Why me?', 'I honestly thought nobody noticed me in there.'],
};
const FOOTAGE_BY = {
  dramatic: ['I’m sorry! The turret makes you say things, {V}!', 'You were a threat, {V}! It was a compliment!'],
  calm: ['It was nothing personal, {V}. You were a threat, and that was the job.', 'I had to put names forward, {V}. Yours made sense.'],
  mean: ['And I was right about you, {V}.', 'Honestly, {V}? I’d say it again.'],
  sad: ['I hated saying it, {V}. I really did.', 'I’m sorry you had to see that, {V}.'],
  idgaf: ['Yeah, that was me. Moving on.', 'It was a long night, {V}.'],
  idk: ['Did I say that? I don’t even remember saying that.', 'I think I just panicked, {V}.'],
};
const HOST_SAVED_BY = [
  '{V}, it sounds like you owe {D} a thank you. {D} chose {X} that night instead.',
];
const SAVED_BY_SAY = {
  dramatic: ['Don’t thank me, {V}. I just wanted {X} gone more.', 'You’re welcome, {V}! I saved your life!'],
  calm: ['It wasn’t about you, {V}. {X} was the bigger threat.', '{X} made more sense that night. That’s all it was.'],
  mean: ['Don’t get excited, {V}. You were just not worth it yet.', 'I was saving you for later, {V}.'],
  sad: ['I couldn’t do it to you, {V}. I really couldn’t.', 'I liked you too much, {V}. That’s the truth.'],
  idgaf: ['Yeah, no worries, {V}.', 'Lucky you, {V}.'],
  idk: ['I did? I don’t remember that at all.', 'Wait, did I? Okay. You’re welcome.'],
};

// the last question
const HOST_LAST = [
  'One last question, for every one of you: would you do it all again?',
  'Before we go, I want to hear from all of you. Knowing everything you know now, would you play again?',
];
const LAST_SAY = {
  dramatic: ['In a heartbeat. Put me back in that castle tomorrow.', 'Yes. And this time, I’d trust nobody.', 'Absolutely. It changed my life.', 'Yes! Bring back the castle!'],
  calm: ['Yes. I’d change a few things, but yes.', 'I would. It was the experience of a lifetime.', 'Yes, but only with the people I trust.', 'I think so. It taught me a lot about myself.'],
  mean: ['Only if I get to be a Traitor.', 'Yes, and I’d win this time.', 'Yes, and I’d go after a few of you a lot sooner.', 'Of course. Most of you wouldn’t last a week.'],
  sad: ['I don’t think my heart could take it again. But maybe.', 'For the friends I made, yes.', 'Maybe. If my friends were there.', 'I miss it every day, so yes.'],
  idgaf: ['Sure, why not.', 'If they pay me, yeah.', 'Why not. Free holiday.', 'Eh. Probably.'],
  idk: ['I honestly don’t know. Maybe?', 'Ask me again in a year.', 'I have no idea. Maybe? Probably?', 'Depends who’s in it.'],
};
const HOST_CLOSE = [
  'That is all we have time for. Thank you all for coming back, and thank you for watching. Goodnight.',
  'Thank you, every one of you. The castle doors are closed for another year. Goodnight.',
  'That is the end of our reunion, and the end of this season of The Traitors. Goodnight.',
];

// ══════════════════════════════════════════════════════════════════════
// THE REPLAY: what was actually said, off the episode's own screen
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-06: "i need visual for the throwback with actual dialogue
// that happened". A throwback replays the scene it is about: the episode's
// Round Table or turret is rebuilt from its record, exactly as that night's
// screen drew it, and the lines the people in question said are lifted out of
// it word for word. Nothing here writes dialogue; if the night has no line by
// them (a season played on older code, a reader with no document), the
// throwback keeps its plain account and nothing is invented.
// keyed on the episode record itself, so two seasons never share a night
const _replayCache = new WeakMap();
function _sceneSteps(row, which) {
  const box = _replayCache.get(row) || {};
  if (!_replayCache.has(row)) _replayCache.set(row, box);
  if (box[which]) return box[which];
  let steps = [];
  try {
    const d = which === 'table' ? roundTableStageData(row, 'audience') : conclaveStageData(row, 'audience');
    if (d && typeof document !== 'undefined') steps = beatLines(d.beats, () => null);
  } catch { steps = []; }
  box[which] = steps;
  return steps;
}
/**
 * Up to `max` lines said by `people` on that night, in the order they were
 * said. `must` are lines to keep first if they exist (a kind, and optionally a
 * speaker), `about` prefers lines that name somebody.
 */
function _replay(row, which, people, { max = 3, kinds = null, must = [], about = null } = {}) {
  if (!row) return [];
  const all = _sceneSteps(row, which).map((s, i) => ({ ...s, i }))
    .filter(s => s.t === 'say' && s.who && people.includes(s.who) && s.text && (!kinds || kinds.includes(s.kind)));
  const picked = new Map();
  for (const m of must) {
    const hit = all.find(s => s.kind === m.kind && (!m.who || s.who === m.who));
    if (hit) picked.set(hit.i, hit);
  }
  // one line from each of them first (naming the other, if they did), then the rest in order
  for (const p of people) {
    if ([...picked.values()].some(s => s.who === p)) continue;
    const mine = all.filter(s => s.who === p);
    const hit = (about && mine.find(s => about.some(a => a !== p && s.text.includes(a)))) || mine[0];
    if (hit) picked.set(hit.i, hit);
  }
  for (const s of all) { if (picked.size >= max) break; if (!picked.has(s.i)) picked.set(s.i, s); }
  return [...picked.values()].sort((a, b) => a.i - b.i).slice(0, max).map(s => ({ who: s.who, text: s.text }));
}

// ══════════════════════════════════════════════════════════════════════
// THE SHOW
// ══════════════════════════════════════════════════════════════════════
export function reunionStageData(ep) {
  const R = ep && ep.tr && ep.tr.reunion;
  if (!R || !(R.cast || []).length) return null;
  const h = _host();
  return { R, beats: _buildBeats(R, ep), host: { name: h.name, slug: h.slug } };
}

function _buildBeats(R, ep) {
  const beats = [];
  const key = 'ru|' + (R.lastEp || ep.num || 0);
  const said = new Set();
  const pickFrom = (pool, k) => {
    const n = pool.length; let i = _hash(k) % n;
    for (let d = 0; d < n; d++) { const x = pool[(i + d) % n]; if (!said.has(x)) { said.add(x); return x; } }
    return pool[i];
  };
  const host = (line) => '<div class="ru-host"><div class="ru-host-av">' + _hostAv() + '</div><div><div class="ru-host-nm">' + _esc(_host().name)
    + '</div><div class="ru-host-line">&ldquo;' + _esc(line) + '&rdquo;</div></div></div>';
  const say = (who, line) => '<div class="ru-said">' + _av(who, 40) + '<div><div class="ru-said-txt">&ldquo;' + _esc(line)
    + '&rdquo;</div><cite>' + _esc(who) + '</cite></div></div>';
  // a tone that has run dry on this screen borrows a line nobody has said yet
  const voice = (who, byTone, k, subs) => {
    let pool = byTone[_tone(who)] || byTone.calm || Object.values(byTone)[0];
    if (pool.every(x => said.has(x))) pool = Object.values(byTone).flat();
    return say(who, _fill(pickFrom(pool, k), subs));
  };
  const card = (title, kind, inner, meta) => beats.push({ html: '<div class="ru-card" data-kind="' + kind + '">'
    + '<h3 class="ru-card-title">' + _esc(title) + '</h3>' + inner + '</div>', meta: { kind, ...(meta || {}) } });
  const pr = n => pronouns(n) || {};
  const names = l => (l.length <= 1 ? l.join('') : l.length === 2 ? l.join(' and ') : l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1]);
  // A THROWBACK: the footage played before a segment, a heading and one line
  // per moment, every line read off the season record
  // `scene`: { set, said: [{who, text}] } — the set the stage cuts to, and the
  // lines replayed off that night's own screen
  const tape = (head, lines, scene) => {
    const said = (scene && scene.said) || [];
    if (!lines.length && !said.length) return '';
    const people = [...new Set(said.map(x => x.who).concat((scene && scene.people) || []))];
    return '<div class="ru-tape"' + (scene && scene.set ? ' data-set="' + _esc(scene.set) + '"' : '')
      + (people.length ? ' data-people="' + _esc(people.join('|')) + '"' : '') + '><b>' + _esc(head) + '</b>'
      + lines.map(l => '<span>' + _esc(l) + '</span>').join('')
      + said.map(x => '<q class="ru-q" data-who="' + _esc(x.who) + '">' + _av(x.who, 26)
        + '<span class="ru-q-txt">&ldquo;' + _esc(x.text) + '&rdquo;</span><cite>' + _esc(x.who) + '</cite></q>').join('')
      + '</div>';
  };
  const rows = (ep && ep.tr && ep.tr.rows) || [];
  const rowAt = n => rows.find(r => Number(r.num) === Number(n)) || null;
  const roleAt = n => ((R.exits || []).find(x => x.name === n) || {}).role;
  const recruitedIn = new Set((R.recruits || []).filter(x => x.accepted).map(x => x.target));
  // a stage direction: what the room sees happen, between the lines
  const dir = (pool, k, subs) => '<p class="ru-dir">' + _esc(_fill(pickFrom(pool, k), subs)) + '</p>';
  // someone who is nasty in the moment rarely makes peace on camera
  const warmTone = n => _tone(n) !== 'mean';

  // 1. EVERYBODY BACK
  card('The Reunion', 'open', '<p>' + _esc(pickFrom(NARR_OPEN, key + '|no')) + '</p>'
    + '<div class="ru-faces">' + R.cast.map(n => _av(n, 30)).join('') + '</div>'
    + host(pickFrom(HOST_OPEN, key + '|ho')));

  // 1b. THE WINNERS WALK IN, THE ROOM CONGRATULATES THEM, AND THE TAPE OF HOW
  // THEY WON IT (the user, 2026-10-06)
  if (R.takers.length) {
    const many = R.takers.length > 1, Ws = names(R.takers);
    const traitorWon = R.takers.some(n => R.traitors.includes(n));
    const p1 = pr(R.takers[0]);
    let inner = '<p>' + _esc(_fill(pickFrom(many ? ARRIVE_MANY : ARRIVE_ONE, key + '|arr'), { Ws })) + '</p>'
      + '<div class="ru-faces">' + R.takers.map(n => _av(n, 44)).join('') + '</div>'
      + host(_fill(pickFrom(traitorWon ? HOST_CONGRATS_T : many ? HOST_CONGRATS_F : HOST_CONGRATS_F_ONE, key + '|hcg'),
        { Ws, winner: many ? 'winners' : 'winner', they: many ? 'they are' : (p1.sub || 'they') + (p1.sub === 'they' ? ' are' : ' is'), sub: p1.sub || 'they' }));
    // three of the room say it: a Traitor the winners beat, if there is one,
    // then the warmest of the rest
    const room = R.cast.filter(n => !R.takers.includes(n));
    const beaten = traitorWon ? [] : room.filter(n => R.traitors.includes(n));
    const warmFirst = room.filter(n => !beaten.includes(n))
      .sort((a, b) => (_hash(key + '|cg|' + a) % 97) - (_hash(key + '|cg|' + b) % 97));
    [...beaten.slice(0, 1), ...warmFirst].slice(0, 3).forEach(n => {
      inner += voice(n, beaten.includes(n) ? CONGRATS_BEATEN : CONGRATS, key + '|cgs|' + n, {});
    });
    card(many ? 'The Winners Arrive' : 'The Winner Arrives', 'arrival', inner, { flourish: many ? 'The Winners' : 'The Winner' });

    // THEIR GAME, on tape: the nights they survived the table, the Traitors
    // they wrote down, the night the turret nearly took them, how it ended
    // every moment carries its place in the season, so the tape runs in order
    // (a night sits after the day of the same number)
    const lines = [];
    for (const W of R.takers.slice(0, 3)) {
      const mine = [];
      const at = (ep, night, text) => mine.push({ k: (Number(ep) || 0) * 2 + (night ? 1 : 0), text });
      if (R.traitors.includes(W)) {
        const rec = (R.recruits || []).find(x => x.accepted && x.target === W);
        if (rec) at(rec.ep, true, `Night ${rec.ep}: ${W} says yes to ${rec.by}, and joins the Traitors.`);
        else at(0, false, `Day 1: ${W} is chosen as a Traitor.`);
      }
      const close = R.tables.filter(t => t.chosen !== W && (t.tally || {})[W] >= 2).sort((a, b) => b.tally[W] - a.tally[W])[0];
      if (close) at(close.ep, false, `Day ${close.ep}: ${close.tally[W]} names against ${W} at the Round Table. ${W} survives it.`);
      const caught = R.tables.find(t => t.role === 'traitor' && (t.against || []).includes(W) && t.chosen !== W);
      if (caught && !R.traitors.includes(W)) at(caught.ep, false, `Day ${caught.ep}: ${W} writes ${caught.chosen}’s name. ${caught.chosen} was a Traitor.`);
      const near = (R.footage || []).find(x => x.target === W);
      if (near) at(near.ep, true, `Night ${near.ep}: in the turret, ${near.by} puts ${W}’s name forward. ${W} wakes up the next morning.`);
      if (!R.tables.some(t => (t.tally || {})[W])) at(999, false, `${W} never had a single name written against ${pr(W).obj || 'them'}.`);
      lines.push(...mine.slice(0, 3));
    }
    lines.sort((a, b) => a.k - b.k);
    for (let i = 0; i < lines.length; i++) lines[i] = lines[i].text;
    lines.push(many ? `The last fire: it burns green, and ${Ws} split ${_money(R.pot)}.` : `The last fire: ${Ws} takes ${_money(R.pot)}.`);
    // and the night one of them came closest, replayed: what they said to save themselves
    const closest = R.takers.map(W => ({ W, t: R.tables.filter(t => t.chosen !== W && (t.tally || {})[W] >= 2)
      .sort((a, b) => b.tally[W] - a.tally[W])[0] })).filter(x => x.t).sort((a, b) => b.t.tally[b.W] - a.t.tally[a.W])[0];
    const survived = closest ? _replay(rowAt(closest.t.ep), 'table', [closest.W], { max: 2, kinds: ['debate', 'clash'] }) : [];
    card('How They Won It', 'tape', host(_fill(pickFrom(TAPE_HOST, key + '|tph'), { Ws, they: many ? 'they' : (p1.sub || 'they') }))
      + tape(many ? 'Their Game' : R.takers[0] + '’s Game', lines)
      + (survived.length ? tape('Throwback · Day ' + closest.t.ep + ', the Round Table',
        [`${closest.t.tally[closest.W]} names against ${closest.W}.`], { set: 'roundtable', said: survived }) : ''), {});
  }

  // 2. THE WINNERS
  if (R.takers.length) {
    const W = R.takers[_hash(key + '|w') % R.takers.length];
    let inner;
    if (R.takers.length === 1) {
      inner = host(_fill(pickFrom(HOST_WIN, key + '|hw'), { W, pot: _money(R.pot) }))
        + voice(W, WIN_SAY, key + '|ws|' + W);
    } else {
      // every winner is on the card and every one of them answers (four at
      // most, in the order they sat at the fire), each about the others
      const Ws = R.takers.length === 2 ? R.takers.join(' and ')
        : R.takers.slice(0, -1).join(', ') + ' and ' + R.takers[R.takers.length - 1];
      const each = _money((Number(R.pot) || 0) / R.takers.length);
      inner = '<div class="ru-faces">' + R.takers.map(n => _av(n, 38)).join('') + '</div>'
        + host(_fill(pickFrom(HOST_WIN_MANY, key + '|hwm'), { Ws, pot: _money(R.pot), each }));
      R.takers.slice(0, 4).forEach((n, i) => {
        const O = R.takers[(i + 1) % R.takers.length];
        if (i) inner += host(_fill(pickFrom(HOST_WIN_NEXT, key + '|hwn|' + n), { W: n }));
        inner += voice(n, i % 2 ? SHARE_SAY : WIN_SAY, key + '|ws|' + n, { O });
      });
    }
    const L = R.losers.length ? R.losers[_hash(key + '|l') % R.losers.length] : null;
    if (L) inner += voice(L, LOSER_SAY, key + '|ls|' + L);
    card(R.takers.length === 1 ? 'The Winner' : 'The Winners', 'winners', inner, { focus: R.takers.length === 1 ? W : null });
  }

  // 3. THE TRAITORS EXPLAIN THEMSELVES
  if (R.traitors.length) {
    // the throwback: who was chosen, who was brought in, and how each cloak ended
    const chosen = R.traitors.filter(n => !recruitedIn.has(n));
    const tl = [];
    const tat = (k, text) => tl.push({ k, text });
    if (chosen.length) tat(0, `Day 1: the Traitors are chosen. ${names(chosen)}.`);
    for (const x of (R.recruits || []).filter(x => x.accepted)) tat(x.ep * 2 + 1, `Night ${x.ep}: ${x.by} brings ${x.target} into the turret.`);
    for (const T of R.traitors) {
      const ex = (R.exits || []).find(x => x.name === T);
      // a vote at the fire is not on the castle's exit list, but it is a table
      const atFire = !(ex && ex.ep != null) && R.tables.find(t => t.chosen === T);
      if (ex && ex.ep != null) tat(ex.ep * 2 + (ex.channel === 'murder' ? 1 : 0), ex.channel === 'murder'
        ? `Night ${ex.ep}: ${T} is taken in the night.` : `Day ${ex.ep}: ${T} is sent home from the Round Table.`);
      else if (atFire) tat(atFire.ep * 2, `Day ${atFire.ep}: ${T} is sent home at the fire.`);
      else tat(9999, R.takers.includes(T) ? `${T} makes it all the way to the end, and wins.` : `${T} makes it all the way to the last fire.`);
    }
    tl.sort((a, b) => a.k - b.k);
    for (let i = 0; i < tl.length; i++) tl[i] = tl[i].text;
    card('The Traitors', 'traitors-open', host(pickFrom(THROWBACK_HOST.traitors, key + '|tbt'))
      + tape('Throwback · The Turret', tl.slice(0, 7))
      + '<p>The cloaks are off. For the first time, the Traitors get to tell it their way.</p>'
      + '<div class="ru-faces">' + R.traitors.map(n => _av(n, 34)).join('') + '</div>'
      + host(pickFrom(HOST_TRAITORS, key + '|ht')));
    const answered = new Set();
    R.traitors.slice(0, 4).forEach(T => {
      // who came closest: whoever wrote this Traitor's name most often, and
      // nobody answers for more than one Traitor
      const tallies = {};
      for (const t of R.tables) for (const v of (t.chosen === T ? t.against : [])) tallies[v] = (tallies[v] || 0) + 1;
      const C = Object.keys(tallies).filter(n => !answered.has(n) && n !== T)
        .sort((a, b) => tallies[b] - tallies[a] || a.localeCompare(b))[0] || null;
      // (kept for whichever Traitor is asked the question it answers)
      const q = _fill(pickFrom(C ? HOST_ASK_T : HOST_ASK_T.filter(l => !/closest/.test(l)), key + '|hat|' + T), { T });
      if (C && /closest/.test(q)) answered.add(C);
      let inner = host(q);
      inner += C && /closest/.test(q) ? voice(T, T_SAY_CATCHER, key + '|tc|' + T, { C }) : voice(T, T_SAY, key + '|ts|' + T);
      // the person named answers only when they were the one named
      if (C && C !== T && /closest/.test(q)) inner += voice(C, CATCHER_SAY, key + '|cs|' + T, {});
      card(T + ' · Traitor', 'traitor', inner, { focus: T });
    });
  }

  // 4. THE MURDERED ASK WHY
  if (R.murders.length) {
    card('The Breakfasts', 'murders-open', host(pickFrom(THROWBACK_HOST.murders, key + '|tbm'))
      + tape('Throwback · Breakfast', R.murders.slice(0, 4).map(m => `Night ${m.ep}: the Traitors choose ${m.victim}. The next morning, ${m.victim} does not come down to breakfast.`)));
  }
  R.murders.slice(0, 4).forEach(m => {
    const pool = KILLER_WHY[m.reason] || KILLER_WHY._;
    const warm = (m.bond || 0) > 2;
    const turretSaid = _replay(rowAt(m.ep), 'turret', [m.by], { max: 2, kinds: ['argue', 'overrule'], about: [m.victim] })
      .filter(x => x.text.includes(m.victim));
    // calm or unbothered, the murdered has made their peace with it, and the
    // murderer answers that rather than an anger nobody showed
    const easy = ['calm', 'idgaf'].includes(_tone(m.victim));
    const inner = (turretSaid.length ? tape('Throwback · Night ' + m.ep + ', the turret', [], { set: 'conclave-back', said: turretSaid, people: [m.victim] }) : '')
      + host(_fill(pickFrom(HOST_MURDER, key + '|hm|' + m.victim), { V: m.victim, K: m.by, n: String(m.ep) }))
      + voice(m.by, { [_tone(m.by)]: pool }, key + '|kw|' + m.victim, { V: m.victim })
      + voice(m.victim, VICTIM_SAY, key + '|vs|' + m.victim, {})
      // THE EXCHANGE GOES ON (the user, 2026-10-06: "do what u gotta do about
      // the reunion"): the murderer answers back, and the room sees how the
      // murdered take it, warm or cold, from the bond the season left them
      + voice(m.by, easy ? KILLER_ACCEPTED : warm ? KILLER_AFTER_FRIEND : KILLER_AFTER, key + '|ka|' + m.victim, { V: m.victim })
      + dir(easy ? DIR_MURDER_EASY : warm && warmTone(m.victim) ? DIR_MURDER_WARM : DIR_MURDER_COLD, key + '|dm|' + m.victim,
        { V: m.victim, K: m.by, posV: pr(m.victim).posAdj || 'their' });
    card('Taken In The Night: ' + m.victim, 'murder', inner, { focus: m.victim });
  });

  // 4b. NEVER SEEN BEFORE: the turret footage the room never saw
  const RC = (R.footage || []).slice(0, 3);
  if (RC.length) {
    card('Never Seen Before', 'footage-open', '<p>The screen behind them lights up: the turret, by candlelight, and the conversations nobody downstairs ever heard.</p>'
      + host(pickFrom(HOST_FOOTAGE, key + '|hrc')));
    RC.forEach(x => {
      const V = x.target, B = x.by;
      // the line from the turret that night, if the screen had one naming them
      const real = _replay(rowAt(x.ep), 'turret', [B], { max: 6, kinds: ['argue', 'overrule'] }).find(l => l.text.includes(V));
      const clip = real ? real.text : _fill(pickFrom(CLIP_SAID[x.reason] || CLIP_SAID._, key + '|clip|' + V), { V });
      let inner = '<p>Night ' + _esc(String(x.ep)) + ', in the turret. ' + _esc(B) + ' puts a name forward.</p>'
        + '<div class="ru-clip" data-who="' + _esc(B) + '" data-tag="Never seen · night ' + _esc(String(x.ep)) + '">'
        + _av(B, 34) + '<div><b>' + _esc(B) + ', in the turret</b><span>&ldquo;' + _esc(clip) + '&rdquo;</span></div></div>';
      inner += host(_fill(pickFrom(x.won ? HOST_FOOTAGE_WON : HOST_FOOTAGE_ASK, key + '|hra|' + V), { V, B, n: String(x.ep) }));
      inner += voice(V, x.bond > 2 ? FOOTAGE_FRIEND : FOOTAGE_PLAIN, key + '|rv|' + V, { B });
      inner += voice(B, FOOTAGE_BY, key + '|rb|' + V, { V });
      // and the Traitor who chose somebody else that night, if it was not this one
      const D = x.decidedBy, X = x.victim;
      if (D && X && D !== B && D !== V && R.cast.includes(D)) {
        inner += host(_fill(pickFrom(HOST_SAVED_BY, key + '|hsb|' + V), { V, D, X }));
        inner += voice(D, SAVED_BY_SAY, key + '|sb|' + V, { V, X });
      }
      card('Never Seen Before: ' + V, 'footage', inner, { focus: V });
    });
  }

  // 5. THE FAITHFULS THE ROOM GOT WRONG
  R.tables.filter(t => t.role === 'faithful' && t.lead && t.lead !== t.chosen)
    .sort((a, b) => b.votes - a.votes).slice(0, 3).forEach(t => {
      const F = t.chosen, L = t.lead;
      // forgiveness is earned by the bond the season left them, and it is
      // harder to give to somebody whose answer was not an apology
      const apologised = _tone(L) !== 'mean';
      const forgives = warmTone(F) && ((t.leadBond || 0) > 0 || (apologised && (t.leadBond || 0) > -2 && ['calm', 'idgaf', 'sad'].includes(_tone(F))));
      const said = _replay(rowAt(t.ep), 'table', [L, F], { max: 4, kinds: ['debate', 'clash', 'reveal'],
        must: [{ kind: 'reveal', who: F }], about: [L, F] });
      const inner = tape('Throwback · Day ' + t.ep + ', the Round Table', [
          `${t.votes} name${t.votes === 1 ? '' : 's'} against ${F} at the Round Table. ${L} spoke first.`,
          ...(said.some(x => x.who === F && /Faithful/.test(x.text)) ? [] : [`${F} turns to the room: “I am a Faithful.”`]),
        ], { set: 'roundtable', said })
        + host(_fill(pickFrom(HOST_MISTAKE, key + '|hmi|' + F), { F, n: String(t.ep) }))
        + voice(F, F_SAY, key + '|fs|' + F, { L })
        + voice(L, LEAD_SAY, key + '|lds|' + F, { F })
        + host(_fill(pickFrom(HOST_FORGIVE, key + '|hfg|' + F), { F, L }))
        + voice(F, forgives ? FORGIVE_YES : FORGIVE_NO, key + '|fg|' + F, { L })
        + dir(forgives ? DIR_FORGIVE : DIR_NO_FORGIVE, key + '|dfg|' + F, { F, L });
      card('Sent Home, Faithful: ' + t.chosen, 'mistake', inner, { focus: t.chosen });
    });

  // 6. TRAITOR AGAINST TRAITOR
  R.turned.slice(0, 2).forEach(x => {
    const said = _replay(rowAt(x.ep), 'table', [x.by, x.target], { max: 3, kinds: ['debate', 'clash', 'reveal'],
      must: [{ kind: 'reveal', who: x.target }], about: [x.by, x.target] });
    const inner = tape('Throwback · Day ' + x.ep + ', the Round Table', [`${x.by} writes ${x.target}’s name. Both of them were Traitors.`],
      { set: 'roundtable', said })
      + host(_fill(pickFrom(HOST_TURNED, key + '|htu|' + x.target), { A: x.by, B: x.target }))
      + voice(x.by, TURNED_SAY, key + '|tus|' + x.target, { B: x.target })
      + voice(x.target, TURNED_BACK, key + '|tub|' + x.target, {});
    card('Traitor Against Traitor', 'turned', inner, { focus: x.by });
  });

  // 7. THE RECRUITS
  R.recruits.slice(0, 2).forEach(x => {
    const inner = host(_fill(pickFrom(x.accepted ? HOST_RECRUIT : HOST_REFUSED, key + '|hr|' + x.target), { R: x.target, T: x.by }))
      + voice(x.target, x.accepted ? RECRUIT_SAY : REFUSE_SAY, key + '|rs|' + x.target, {});
    card(x.accepted ? 'Recruited' : 'The Offer Refused', 'recruit', inner, { focus: x.target });
  });

  // 8. FRIENDSHIPS AND FEUDS
  const fr = R.friends[0];
  if (fr) card('The Friendship', 'friends', host(_fill(pickFrom(HOST_FRIENDS, key + '|hf'), { A: fr.a, B: fr.b }))
    + voice(fr.a, FRIEND_SAY, key + '|fa', { O: fr.b }) + voice(fr.b, FRIEND_SAY, key + '|fb', { O: fr.a }), { focus: fr.a });
  const rv = R.rivals[0];
  if (rv) {
    // the handshake, decided by each of them: the nasty never offer, the
    // calm and the soft will for anything short of a real hatred, the
    // dramatic only for a grudge that is not deep
    // (the feud on this card is the coldest pair of the season, so the bar is
    // set against that: only a near-total hatred stops the calm offering)
    const BAR = { calm: -8, sad: -8, idk: -8, idgaf: -6, dramatic: -4 };
    const willing = n => _tone(n) !== 'mean' && rv.bond > (BAR[_tone(n)] ?? -4);
    const ya = willing(rv.a), yb = willing(rv.b), shakes = ya && yb;
    const wrote = (x, y) => R.tables.flatMap(t => (t.ballots || []).filter(b => b.voter === x && b.target === y).map(() => t.ep));
    const ab = wrote(rv.a, rv.b), ba = wrote(rv.b, rv.a);
    const fl = [];
    if (ab.length) fl.push(`${rv.a} writes ${rv.b}’s name ${ab.length === 1 ? 'on day ' + ab[0] : ab.length + ' times'}.`);
    if (ba.length) fl.push(`${rv.b} writes ${rv.a}’s name ${ba.length === 1 ? 'on day ' + ba[0] : ba.length + ' times'}.`);
    // the night they went at each other hardest: the table where both spoke
    // and the most lines named the other
    let feudNight = null, feudSaid = [];
    for (const r of rows) {
      if (!(r.tr && r.tr.table)) continue;
      const got = _replay(r, 'table', [rv.a, rv.b], { max: 4, kinds: ['debate', 'clash'], about: [rv.a, rv.b] });
      const hits = got.filter(x => x.text.includes(x.who === rv.a ? rv.b : rv.a)).length;
      if (new Set(got.map(x => x.who)).size === 2 && hits > (feudNight ? feudNight.hits : 0)) { feudNight = { ep: r.num, hits }; feudSaid = got; }
    }
    card('The Feud', 'rivals', tape(feudNight ? 'Throwback · Day ' + feudNight.ep + ', the Round Table' : 'Throwback · The Round Table', fl,
      feudNight ? { set: 'roundtable', said: feudSaid } : null)
      + host(_fill(pickFrom(HOST_RIVALS, key + '|hrv'), { A: rv.a, B: rv.b }))
      + voice(rv.a, RIVAL_SAY, key + '|ra', { O: rv.b }) + voice(rv.b, RIVAL_SAY, key + '|rb', { O: rv.a })
      + voice(rv.a, RIVAL_BACK, key + '|rba', { O: rv.b })
      + host(pickFrom(HOST_SHAKE, key + '|hsh'))
      + voice(rv.b, yb ? SHAKE_YES : SHAKE_NO, key + '|shb', { O: rv.a })
      + voice(rv.a, ya ? SHAKE_YES : SHAKE_NO, key + '|sha', { O: rv.b })
      + dir(shakes ? DIR_SHAKE : ya !== yb ? DIR_HALF_SHAKE : DIR_NO_SHAKE, key + '|dsh',
        { A: rv.a, B: rv.b, Y: ya ? rv.a : rv.b, N: ya ? rv.b : rv.a, H: _host().name, posA: pr(rv.a).posAdj || 'their' }), { focus: rv.a });
  }

  // 9. THE LAST QUESTION
  const asked = R.cast.filter(n => !R.takers.includes(n)).slice(0, 6).concat(R.takers.slice(0, 2));
  card('The Last Question', 'last', host(pickFrom(HOST_LAST, key + '|hl'))
    + asked.map(n => voice(n, LAST_SAY, key + '|last|' + n, {})).join('')
    + host(pickFrom(HOST_CLOSE, key + '|hc')));
  return beats;
}
function _hostAv() {
  const h = _host();
  return _portrait(h.slug, h.name, 46);
}

/** The screen: the whole reunion as a page (the stage plays it beat by beat). */
export function rpBuildReunion(ep) {
  const d = reunionStageData(ep);
  if (!d) return '';
  return '<div class="ru-root"><style>' + CSS + '</style>'
    + '<div class="ru-hero"><div class="ru-eyebrow">The Traitors &middot; After The Castle</div>'
    + '<h1 class="ru-title">THE REUNION</h1>'
    + '<p class="ru-sub">Everybody is back. The Traitors, the Faithfuls, the people sent home and the people taken in the night, '
    + 'in one room, with nothing left to hide.</p></div>'
    + d.beats.map(b => b.html).join('') + '</div>';
}

const CSS = `
.ru-root{max-width:860px;margin:0 auto;padding:24px 18px 60px;color:#ece3d0;font-family:var(--v-body,Georgia),serif}
.ru-hero{text-align:center;padding:30px 10px 24px}
.ru-eyebrow{font-family:var(--v-display);font-weight:700;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#c9a24a}
.ru-title{margin:8px 0;font-family:var(--v-display);font-weight:900;font-size:clamp(36px,6vw,64px);letter-spacing:.14em;color:#f3e3c4}
.ru-sub{color:#cbbf9f;font-style:italic}
.ru-card{margin:18px 0;padding:18px 20px;background:linear-gradient(170deg,rgba(28,18,12,.92),rgba(14,9,6,.92));border:1px solid rgba(201,162,74,.28);box-shadow:0 14px 34px rgba(0,0,0,.5)}
.ru-card-title{margin:0 0 10px;font-family:var(--v-display);font-weight:800;font-size:16px;letter-spacing:.16em;text-transform:uppercase;color:#e8c270}
.ru-card p{margin:6px 0;line-height:1.55}
/* the shared portrait (conclave.js \`_portrait\`) leans on CONCLAVE_CSS for its
   size and clipping; this page does not load that sheet, and without these the
   raw <img> rendered at its natural size over the whole page */
.ru-root .cv-av{position:relative;display:inline-block;overflow:hidden;flex:none;vertical-align:middle;
  border-radius:50% 50% 12% 12% / 44% 44% 9% 9%;background:linear-gradient(162deg,#2b2418,#0b0906);
  box-shadow:0 0 0 1px rgba(232,194,112,.35),0 4px 12px rgba(0,0,0,.6)}
.ru-root .cv-av img{width:100%;height:100%;object-fit:cover;object-position:50% 18%;display:block;position:relative;z-index:2}
.ru-root .cv-av-ini{position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;
  font-family:var(--v-display);font-weight:900;color:rgba(232,194,112,.6)}
.ru-faces{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.ru-host{display:flex;gap:12px;align-items:flex-start;margin:12px 0;padding:10px 12px;background:rgba(201,162,74,.08);border-left:3px solid #c9a24a}
.ru-host-nm{font-family:var(--v-display);font-weight:700;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#c9a24a}
.ru-host-line{font-style:italic;font-size:16px;line-height:1.45}
.ru-said{display:flex;gap:12px;align-items:flex-start;margin:10px 0 2px}
.ru-said-txt{font-family:var(--v-hand,Georgia),serif;font-style:italic;font-size:17px;line-height:1.45;color:#f3ead8}
.ru-tape{position:relative;margin:12px 0;padding:14px 16px 12px;background:linear-gradient(180deg,rgba(60,48,30,.55),rgba(30,24,16,.55));
  border:1px solid rgba(232,194,112,.3);filter:sepia(.25)}
.ru-tape b{display:block;margin-bottom:6px;font-family:var(--v-display);font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:#e8c270}
.ru-tape > span{display:block;margin:4px 0;padding-left:14px;position:relative;line-height:1.45;color:#e9dcc0}
.ru-q{display:flex;gap:10px;align-items:flex-start;margin:8px 0 2px;quotes:none}
.ru-q-txt{font-style:italic;font-size:15px;line-height:1.4;color:#f3e6c8}
.ru-q cite{margin-left:auto;align-self:center;font-style:normal;font-size:9px;letter-spacing:.2em;text-transform:uppercase;opacity:.6;white-space:nowrap}
.ru-tape > span::before{content:"";position:absolute;left:0;top:.6em;width:6px;height:6px;border-radius:50%;background:#c9a24a}
.ru-dir{margin:10px 0 4px;padding-left:12px;border-left:2px solid rgba(232,194,112,.25);font-style:italic;color:#bfb293}
.ru-clip{display:flex;gap:12px;align-items:flex-start;margin:12px 0;padding:12px 14px;background:rgba(120,20,30,.18);
  border:1px solid rgba(201,40,60,.4);box-shadow:inset 0 0 30px rgba(0,0,0,.5)}
.ru-clip b{display:block;font-family:var(--v-display);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#e0808c}
.ru-clip span{display:block;margin-top:4px;font-style:italic;font-size:16px;line-height:1.45;color:#f3dcd6}
.ru-said cite{display:block;margin-top:4px;font-style:normal;font-size:10px;letter-spacing:.2em;text-transform:uppercase;opacity:.65}
`;
