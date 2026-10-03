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
import { _portrait } from './conclave.js';

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
  'Welcome back. Every single one of them is here tonight, and for once, everybody knows the truth. Let us talk about what really happened.',
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
  calm: ['We’ve talked. We’re fine now. It was the game.', 'I don’t hold grudges. Mostly.'],
  mean: ['I have nothing to say to {O}.', 'Let’s just say {O} is not on my Christmas list.'],
  sad: ['I wish it had been different. It got out of hand.', 'I’d like to fix it, if {O} would.'],
  idgaf: ['Don’t care, honestly.', 'Never think about {O}.'],
  idk: ['I’m not even sure what we fell out about.', 'Are we still fighting? I genuinely don’t know.'],
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

  // 1. EVERYBODY BACK
  card('The Reunion', 'open', '<p>' + _esc(pickFrom(NARR_OPEN, key + '|no')) + '</p>'
    + '<div class="ru-faces">' + R.cast.map(n => _av(n, 30)).join('') + '</div>'
    + host(pickFrom(HOST_OPEN, key + '|ho')));

  // 2. THE WINNERS
  if (R.takers.length) {
    const W = R.takers[_hash(key + '|w') % R.takers.length];
    let inner = host(_fill(pickFrom(HOST_WIN, key + '|hw'), { W, pot: _money(R.pot) }))
      + voice(W, WIN_SAY, key + '|ws|' + W);
    const L = R.losers.length ? R.losers[_hash(key + '|l') % R.losers.length] : null;
    if (L) inner += voice(L, LOSER_SAY, key + '|ls|' + L);
    card(R.takers.length === 1 ? 'The Winner' : 'The Winners', 'winners', inner, { focus: W });
  }

  // 3. THE TRAITORS EXPLAIN THEMSELVES
  if (R.traitors.length) {
    card('The Traitors', 'traitors-open', '<p>The cloaks are off. For the first time, the Traitors get to tell it their way.</p>'
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
  R.murders.slice(0, 4).forEach(m => {
    const pool = KILLER_WHY[m.reason] || KILLER_WHY._;
    const inner = host(_fill(pickFrom(HOST_MURDER, key + '|hm|' + m.victim), { V: m.victim, K: m.by, n: String(m.ep) }))
      + voice(m.by, { [_tone(m.by)]: pool }, key + '|kw|' + m.victim, { V: m.victim })
      + voice(m.victim, VICTIM_SAY, key + '|vs|' + m.victim, {});
    card('Taken In The Night: ' + m.victim, 'murder', inner, { focus: m.victim });
  });

  // 5. THE FAITHFULS THE ROOM GOT WRONG
  R.tables.filter(t => t.role === 'faithful' && t.lead && t.lead !== t.chosen)
    .sort((a, b) => b.votes - a.votes).slice(0, 3).forEach(t => {
      const inner = host(_fill(pickFrom(HOST_MISTAKE, key + '|hmi|' + t.chosen), { F: t.chosen, n: String(t.ep) }))
        + voice(t.chosen, F_SAY, key + '|fs|' + t.chosen, { L: t.lead })
        + voice(t.lead, LEAD_SAY, key + '|lds|' + t.chosen, { F: t.chosen });
      card('Sent Home, Faithful: ' + t.chosen, 'mistake', inner, { focus: t.chosen });
    });

  // 6. TRAITOR AGAINST TRAITOR
  R.turned.slice(0, 2).forEach(x => {
    const inner = host(_fill(pickFrom(HOST_TURNED, key + '|htu|' + x.target), { A: x.by, B: x.target }))
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
  if (rv) card('The Feud', 'rivals', host(_fill(pickFrom(HOST_RIVALS, key + '|hrv'), { A: rv.a, B: rv.b }))
    + voice(rv.a, RIVAL_SAY, key + '|ra', { O: rv.b }) + voice(rv.b, RIVAL_SAY, key + '|rb', { O: rv.a }), { focus: rv.a });

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
.ru-faces{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.ru-host{display:flex;gap:12px;align-items:flex-start;margin:12px 0;padding:10px 12px;background:rgba(201,162,74,.08);border-left:3px solid #c9a24a}
.ru-host-nm{font-family:var(--v-display);font-weight:700;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#c9a24a}
.ru-host-line{font-style:italic;font-size:16px;line-height:1.45}
.ru-said{display:flex;gap:12px;align-items:flex-start;margin:10px 0 2px}
.ru-said-txt{font-family:var(--v-hand,Georgia),serif;font-style:italic;font-size:17px;line-height:1.45;color:#f3ead8}
.ru-said cite{display:block;margin-top:4px;font-style:normal;font-size:10px;letter-spacing:.2em;text-transform:uppercase;opacity:.65}
`;
