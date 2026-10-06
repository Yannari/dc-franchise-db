// ══════════════════════════════════════════════════════════════════════
// vp-tr/seer.js — the Seer: won, used once, and lied about
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-06: "i never seen this twist where is it from did we
// implement this?". The engine had run the Seer in every endgame since Plan 7
// (js/tr/powers.js `openSeer`) and no screen had ever shown it: the only trace
// on the page was a player at the fire saying "I took Stephanie to the Seer".
// This is the screen, in the order the real show plays it
// (thetraitors.fandom.com/wiki/Seer): the power is won (a draw, or an auction
// paid out of the prize fund), the Seer names one person, the two of them sit
// alone and that person must say what they are, the card burns, and then each
// of them tells the room whatever they like.
//
// Everything said here is the record's: who won it and how, whom they chose,
// what the answer was, and what each of them claimed afterwards (`claims`, with
// `kind` and `truthful`). The spoken lines are chosen by WHAT WAS CLAIMED and
// by how the speaker talks, never by whether it is true — a lie and the truth
// sound the same to the room, which is the point. Whether it was true is said
// once, to the audience, in the engine's own words (`claim.line`).
//
// Like every other file in this directory it imports no engine state beyond
// the cast list and the stat reader.
import { seasonConfig, players } from '../core.js';
import { pronouns } from '../players.js';
import { HOSTS_BY_FORMAT } from '../shows.js';
import { _portrait } from './conclave.js';
import { reunionTone } from './reunion.js';

const _esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function _hash(s) {
  let h = 2166136261; const str = String(s);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13;
  return h >>> 0;
}
const _money = n => '£' + Math.round(Number(n) || 0).toLocaleString('en-GB');
function _slugOf(name) {
  const p = (players || []).find(x => x && x.name === name);
  return (p && p.slug) || String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
const _av = (n, size) => _portrait(_slugOf(n), n, size || 40);
function _host() {
  const list = HOSTS_BY_FORMAT.traitors || [];
  const want = seasonConfig && seasonConfig.host;
  const hit = list.find(h => h.value === want) || list[0] || { value: 'host', label: 'Your host' };
  return { name: hit.label, slug: String(hit.value).toLowerCase().replace(/[^a-z0-9]+/g, '-') };
}
// {S}/{H} names; {sub}/{obj}/{pos} the subject's pronouns, {is} agreeing with them
function _fill(t, subs) {
  return String(t || '').replace(/\{(\w+)\}/g, (m, k) => (subs && subs[k] != null ? subs[k] : m));
}

// ══════════════════════════════════════════════════════════════════════
// THE WORDS
// ══════════════════════════════════════════════════════════════════════
const HOST_OPEN = [
  'Before you go to the fire, there is one more thing. Tonight, one of you will become the Seer.',
  'There is a power in this castle that nobody has used yet. Tonight, one of you will have it.',
];
const HOST_RULE = [
  'The Seer chooses one person in this room. In private, that person must tell the Seer the truth: Faithful or Traitor. Only the Seer will hear the answer, and what either of you says afterwards is entirely up to you.',
];
const HOST_DRAW = [
  'On this tray there is one envelope for each of you. Only one has the eye inside. Take one, and do not open it until I say.',
  'One envelope each. One of them holds the eye. Choose carefully, and open them together.',
];
const NARR_DRAW_TAKE = [
  'They take an envelope each, one at a time. Nobody looks at anybody else.',
  'The tray goes round the room. Every hand that reaches for it is steady, or trying to be.',
];
const NARR_DRAW_OPEN = [
  '{H} opens {pos} envelope. Inside is the eye.',
  'Every envelope is empty but one. {H} holds it up.',
];
const HOST_AUCTION = [
  'The Seer is not free tonight. Write down how much of the prize fund you will give up for it. The highest bid wins it, and that money leaves the pot for good.',
  'Tonight the Seer goes to whoever wants it most. Write down what you will pay out of the prize fund. Whatever the winner bids is gone from the pot.',
];
const NARR_AUCTION_WIN = [
  '{H} bids the most: {amt}. The prize fund falls from {before} to {after}.',
  'The highest bid is {H}’s, at {amt}. That money is gone: {before} becomes {after}.',
];
const ROOM_REACT = {
  dramatic: ['Of course it’s {H}. Of course it is.', 'Oh, that is not good news for somebody.'],
  calm: ['Use it well, {H}.', 'Well. That changes things.'],
  mean: ['Great. Now we all have to trust {H}.', 'Why does it always go to the wrong person?'],
  sad: ['I just hope you pick the right person, {H}.', 'Please don’t waste it, {H}.'],
  idgaf: ['Fair enough.', 'Good luck with that, {H}.'],
  idk: ['Wait, what does that mean for the rest of us?', 'Is that good? I can’t tell if that’s good.'],
};
const HOLDER_WIN = {
  dramatic: ['I can’t believe it. My hands are shaking.', 'This is it. This is the moment.'],
  calm: ['Right. I know exactly what I’m going to do with it.', 'Good. I’ll use it carefully.'],
  mean: ['Finally, some answers.', 'Somebody in this room should be very worried.'],
  sad: ['I don’t know if I want this much responsibility.', 'I just want to get this right.'],
  idgaf: ['Nice. Let’s see what happens.', 'Didn’t expect that, to be honest.'],
  idk: ['Okay. I have no idea who to pick.', 'Wait, me? Okay. Okay.'],
};
const HOST_CHOOSE = [
  '{H}, who would you like to see?',
  '{H}, whose answer do you want?',
];
const HOLDER_CHOOSE = {
  dramatic: ['{S}. It has to be {S}.', '{S}. I need to know, once and for all.'],
  calm: ['{S}. I want to be sure before I go to the fire.', 'I’d like to see {S}, please.'],
  mean: ['{S}. Let’s find out what you really are.', '{S}. Don’t look so nervous.'],
  sad: ['I’m sorry, {S}. It has to be you.', '{S}. I hope I’m wrong.'],
  idgaf: ['{S}. Why not.', '{S}, I suppose.'],
  idk: ['Um. {S}? Yes. {S}.', 'I think {S}. Yes, {S}.'],
};
const HOST_MEETING = [
  '{S}, please sit down. You must answer {H} truthfully. Are you a Faithful, or are you a Traitor?',
  '{S}, you know why you are here. {H} is owed one honest answer. Faithful, or Traitor?',
];
const ANSWER = {
  traitor: {
    dramatic: ['I… I’m a Traitor.', 'Fine. I’m a Traitor. Are you happy now?'],
    calm: ['I’m a Traitor.', 'You were right. I’m a Traitor.'],
    mean: ['I’m a Traitor. And you can’t prove a thing out there.', 'Traitor. Good luck making anyone believe you.'],
    sad: ['I’m sorry. I’m a Traitor.', 'I’m a Traitor. I hated lying to you.'],
    idgaf: ['Traitor. Yeah.', 'I’m a Traitor. There you go.'],
    idk: ['I’m… a Traitor. Do I have to say it again?', 'Traitor. That’s the answer.'],
  },
  faithful: {
    dramatic: ['I am a Faithful! I have been from the first day!', 'Faithful. How could you think anything else?'],
    calm: ['I’m a Faithful.', 'Faithful. I always have been.'],
    mean: ['Faithful. You’ve wasted your one question.', 'I’m a Faithful, and you should have asked somebody else.'],
    sad: ['I’m a Faithful. I can’t believe you doubted me.', 'Faithful. It hurts that you had to ask.'],
    idgaf: ['Faithful. Obviously.', 'Faithful. Can I go now?'],
    idk: ['I’m a Faithful. I think you knew that?', 'Faithful. Was that the right answer?'],
  },
};
// what the Seer says to it, alone in that room — keyed on the answer and on
// whether the Seer is themselves a Traitor (a Traitor already knows who is not)
const HOLDER_REACT = {
  traitor: {
    dramatic: ['I knew it. I knew it!', 'Oh my God. I was right.'],
    calm: ['Thank you. That’s all I needed.', 'I thought so.'],
    mean: ['Got you.', 'You’re finished, and you know it.'],
    sad: ['I really hoped it wasn’t you.', 'That hurts more than I thought it would.'],
    idgaf: ['Called it.', 'Yep. Thought so.'],
    idk: ['Wait, really? You?', 'I honestly didn’t expect that.'],
  },
  faithful: {
    dramatic: ['So I was wrong. All this time, I was wrong.', 'Then who is it? Who is it?'],
    calm: ['Thank you. That rules you out.', 'Okay. That narrows it down.'],
    mean: ['Well, that was a waste.', 'Fine. You’re clean. Somebody else isn’t.'],
    sad: ['I’m so sorry I doubted you.', 'I’m glad. I really am.'],
    idgaf: ['Fair enough.', 'Okay. Next.'],
    idk: ['Oh. Then I have no idea.', 'So it isn’t you. Then who?'],
  },
  'traitor-seer': {
    dramatic: ['Good. That’s all I needed to hear.', 'Thank you. You can go.'],
    calm: ['Thank you. That’s useful.', 'Good to know.'],
    mean: ['Thanks. That’s all.', 'You can go.'],
    sad: ['Thank you for being honest with me.', 'Okay. Thank you.'],
    idgaf: ['Cool. Thanks.', 'Right. Done.'],
    idk: ['Okay. Thanks, I think.', 'Right. Okay.'],
  },
};
const NARR_BURN = [
  'The card goes into the candle. In a few seconds there is nothing left of it, and nobody else will ever see it.',
  '{H} holds the card over the flame until it is ash. The only proof of what was said is gone.',
];
const NARR_BACK = [
  'They walk back to the others. Every face in the room is on them.',
  'The door opens. {H} and {S} come back in, and the room goes quiet.',
];
// AFTERWARDS, keyed on the CLAIM, never on whether it is true
const SEER_NAMES = {
  dramatic: ['I took {S} to the Seer, and {S} is a Traitor. I heard it with my own ears.', 'It’s {S}. {S} sat across from me and said it.'],
  calm: ['I’ll keep this simple. {S} told me {sub} {is} a Traitor.', 'I asked {S}. {S} is a Traitor.'],
  mean: ['{S} is a Traitor. {S} said so, to my face.', 'Don’t bother defending {S}. {S} is a Traitor.'],
  sad: ['I’m sorry, {S}. I have to tell them. {S} is a Traitor.', 'I wish I wasn’t saying this. {S} is a Traitor.'],
  idgaf: ['{S}’s a Traitor. That’s it. That’s the news.', '{S}. Traitor. Moving on.'],
  idk: ['So, um. {S} said Traitor. In there. To me.', '{S} is a Traitor. I think everyone should know that.'],
};
const SUBJECT_DENY = {
  dramatic: ['That is a lie! I told {H} I’m a Faithful!', 'I sat in that room and said Faithful. {H} is lying to all of you!'],
  calm: ['That isn’t what happened. I told {H} I’m a Faithful.', 'I said Faithful in there. I’ll say it again out here.'],
  mean: ['Nice try, {H}. I said Faithful, and you know it.', '{H} is lying, and badly.'],
  sad: ['Why would you say that, {H}? I told you the truth.', 'That isn’t what I said. Please believe me.'],
  idgaf: ['Nope. Said Faithful.', 'Not what I said. Whatever.'],
  idk: ['Wait, what? I said Faithful. Didn’t I?', 'That’s not right. I said Faithful.'],
};
const SUBJECT_COUNTER = {
  dramatic: ['Why would a Faithful need me alone in a room, {H}? Think about that, all of you!', 'Look at who is accusing me. Ask yourselves why.'],
  calm: ['Ask yourselves why {H} wanted me alone. A Faithful has nothing to hide.', 'I’d look very closely at {H}, if I were you.'],
  mean: ['Funny how the person with the power gets to make things up, isn’t it, {H}?', '{H} is the Traitor here. Watch.'],
  sad: ['I can’t believe you’d do this to me, {H}. Everyone, look at {H}.', 'I trusted you, {H}. Now I know why I shouldn’t have.'],
  idgaf: ['Sure, {H}. Or you’re the Traitor. Just saying.', 'Maybe ask {H} some questions.'],
  idk: ['Hang on. Why is {H} so sure? That’s weird, right?', 'Doesn’t that make {H} look suspicious?'],
};
const SUBJECT_CLEARED = {
  dramatic: ['For the record, {H} saw me, and I came out clean!', 'I was the one {H} chose, and I am a Faithful. I said it to {H}’s face.'],
  calm: ['For what it’s worth, {H} checked me. I’m a Faithful.', 'I was the one in that room. I came out clean.'],
  mean: ['{H} checked me. So you can all stop looking at me now.', 'I’m cleared. Look somewhere else.'],
  sad: ['I just want everyone to know {H} checked me, and I told the truth.', 'I was the one {H} asked. I’m a Faithful.'],
  idgaf: ['Got checked. Clean. Done.', 'Yeah, it was me. Faithful.'],
  idk: ['It was me in there, by the way. Faithful.', 'I think it’s fair to say I’m cleared now?'],
};

// ══════════════════════════════════════════════════════════════════════
// THE SHOW
// ══════════════════════════════════════════════════════════════════════
/** The Seer record of a finale row, or null. */
export function seerRecordOf(ep) {
  return (ep && ep.tr && ep.tr.endgame && ep.tr.endgame.seer) || null;
}
/** Which fire round it happened before (the ask on the same episode), for the slot. */
export function seerSlot(ep) {
  const s = seerRecordOf(ep);
  if (!s) return -1;
  const asks = (ep.tr.endgame.asks || []);
  const i = asks.findIndex(a => a && Number(a.ep) === Number(s.ep));
  return i >= 0 ? i : 0;
}

export function seerStageData(ep, observer = 'audience') {
  const S = seerRecordOf(ep);
  if (!S) return null;
  const h = _host();
  return { S, beats: _buildBeats(S, observer, h), host: { name: h.name, slug: h.slug } };
}

function _buildBeats(S, observer, h) {
  const beats = [];
  const said = new Set();
  const key = 'seer|' + S.ep + '|' + S.seer + '|' + S.subject;
  const pick = (pool, k) => {
    const n = pool.length; const i = _hash(k) % n;
    for (let d = 0; d < n; d++) { const x = pool[(i + d) % n]; if (!said.has(x)) { said.add(x); return x; } }
    return pool[i];
  };
  const tone = n => reunionTone(n);
  const H = S.seer, SU = S.subject;
  const prS = pronouns(SU) || {}, prH = pronouns(H) || {};
  const plural = prS.sub === 'they';
  const subs = { H: _esc(H), S: _esc(SU), sub: plural ? _esc(SU) : prS.sub, is: 'is', pos: prH.posAdj || 'their' };
  const host = line => '<div class="se-host"><div class="se-host-nm">' + _esc(h.name) + '</div><div class="se-host-line">&ldquo;'
    + _esc(_fill(line, subs)) + '&rdquo;</div></div>';
  const say = (who, line) => '<div class="se-said">' + _av(who, 42) + '<div><div class="se-said-txt">&ldquo;'
    + _esc(_fill(line, subs)) + '&rdquo;</div><cite>' + _esc(who) + '</cite></div></div>';
  const voice = (who, byTone, k) => say(who, pick(byTone[tone(who)] || byTone.calm, k));
  const p = text => '<p>' + _esc(_fill(text, subs)) + '</p>';
  const aside = text => '<div class="se-irony"><b>What the room cannot see</b><span>' + _esc(text) + '</span></div>';
  const card = (title, kind, inner, meta) => beats.push({ phase: kind, meta: { kind, ...(meta || {}) },
    html: '<div class="se-card" data-kind="' + kind + '"><h3 class="se-card-title">' + _esc(title) + '</h3>' + inner + '</div>' });
  const audience = observer === 'audience' || observer === 'player:' + H || observer === 'player:' + SU;
  const award = S.award || { method: 'draw', room: S.room || [] };
  const room = (award.room || S.room || []).slice();

  // 1. THE POWER IS WON
  let inner = host(pick(HOST_OPEN, key + '|o')) + host(pick(HOST_RULE, key + '|r'));
  if (award.method === 'auction') {
    inner += host(pick(HOST_AUCTION, key + '|a'));
    // the sealed bids, opened lowest first so the winner is last
    const bids = (award.bids || []).slice().sort((a, b) => a.amount - b.amount || (a.name < b.name ? -1 : 1));
    inner += '<div class="se-bids">' + bids.map(b => '<div class="se-bid' + (b.name === H ? ' se-win' : '') + '" data-who="' + _esc(b.name)
      + '" data-amt="' + _esc(_money(b.amount)) + '">' + _av(b.name, 40) + '<small>' + _esc(b.name) + '</small><b>' + _esc(_money(b.amount)) + '</b></div>').join('') + '</div>';
    inner += p(_fill(pick(NARR_AUCTION_WIN, key + '|aw'), { amt: _money(award.paid), before: _money(award.potBefore), after: _money(award.potAfter) }));
  } else {
    inner += host(pick(HOST_DRAW, key + '|d')) + p(pick(NARR_DRAW_TAKE, key + '|dt'))
      + '<div class="se-envs">' + room.map(n => '<div class="se-env' + (n === H ? ' se-win' : '') + '" data-who="' + _esc(n) + '">'
        + _av(n, 40) + '<small>' + _esc(n) + '</small><i></i></div>').join('') + '</div>'
      + p(pick(NARR_DRAW_OPEN, key + '|do'));
  }
  inner += voice(H, HOLDER_WIN, key + '|hw');
  room.filter(n => n !== H && n !== SU).sort((a, b) => (_hash(key + '|rr|' + a) % 97) - (_hash(key + '|rr|' + b) % 97)).slice(0, 2)
    .forEach(n => { inner += voice(n, ROOM_REACT, key + '|rr|' + n); });
  card(award.method === 'auction' ? 'The Seer Is Auctioned' : 'The Seer Is Drawn', 'award', inner, { focus: H, method: award.method });

  // 2. THE CHOICE
  card('The Choice', 'choose', host(pick(HOST_CHOOSE, key + '|hc')) + voice(H, HOLDER_CHOOSE, key + '|ch'), { focus: SU });

  // 3. THE MEETING — private: the audience, and the two people in it
  if (audience) {
    const answer = S.truth === 'traitor' ? 'traitor' : 'faithful';
    const reactPool = S.seerTruth === 'traitor' ? HOLDER_REACT['traitor-seer'] : HOLDER_REACT[answer];
    card('The Meeting', 'meeting', '<p>' + _esc(S.meetingLine || '') + '</p>'
      + host(pick(HOST_MEETING, key + '|hm'))
      + say(SU, pick(ANSWER[answer][tone(SU)] || ANSWER[answer].calm, key + '|ans'))
      + '<div class="se-cardreveal" data-truth="' + answer + '"><span>' + (answer === 'traitor' ? 'Traitor' : 'Faithful') + '</span></div>'
      + '<p>' + _esc(S.readLine || '') + '</p>'
      + voice(H, reactPool, key + '|re')
      + p(pick(NARR_BURN, key + '|b')), { focus: SU, truth: answer });
  }

  // 4. BACK IN THE ROOM: what each of them claims, and the truth of it, once, to the audience
  let after = p(pick(NARR_BACK, key + '|bk'));
  for (const c of (S.claims || [])) {
    const who = c.by;
    if (c.kind === 'named') after += voice(who, SEER_NAMES, key + '|cn');
    else if (c.kind === 'deny') after += voice(who, SUBJECT_DENY, key + '|cd');
    else if (c.kind === 'counter') after += voice(who, SUBJECT_COUNTER, key + '|cc');
    else if (c.kind === 'cleared') after += voice(who, SUBJECT_CLEARED, key + '|cl');
    if (c.line) after += observer === 'audience' && c.kind !== 'silent' ? aside(c.line) : p(c.line);
  }
  card('What They Say', 'after', after, { focus: H });
  return beats;
}

/** The page: the whole Seer, top to bottom (the stage plays it beat by beat). */
export function rpBuildSeer(ep, observer = 'audience') {
  const d = seerStageData(ep, observer);
  if (!d) return '';
  return '<div class="se-root"><style>' + CSS + '</style>'
    + '<div class="se-hero"><div class="se-eyebrow">The Traitors &middot; The Endgame</div><h1 class="se-title">THE SEER</h1>'
    + '<p class="se-sub">One question, asked once, answered honestly. And then nobody has to tell the truth about it.</p></div>'
    + d.beats.map(b => b.html).join('') + '</div>';
}

const CSS = `
.se-root{max-width:860px;margin:0 auto;padding:24px 18px 60px;color:#e6e9f2;font-family:var(--v-body,Georgia),serif}
.se-hero{text-align:center;padding:30px 10px 22px}
.se-eyebrow{font-family:var(--v-display);font-weight:700;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#9ad1ff}
.se-title{margin:8px 0;font-family:var(--v-display);font-weight:900;font-size:clamp(36px,6vw,64px);letter-spacing:.2em;color:#eaf4ff;text-shadow:0 0 30px rgba(120,190,255,.45)}
.se-sub{color:#aab6c9;font-style:italic}
.se-card{margin:18px 0;padding:18px 20px;background:linear-gradient(170deg,rgba(14,18,30,.94),rgba(6,8,14,.94));border:1px solid rgba(154,209,255,.25);box-shadow:0 14px 34px rgba(0,0,0,.5)}
.se-card-title{margin:0 0 10px;font-family:var(--v-display);font-weight:800;font-size:16px;letter-spacing:.16em;text-transform:uppercase;color:#9ad1ff}
.se-card p{margin:8px 0;line-height:1.55}
.se-host{margin:10px 0;padding:10px 12px;background:rgba(154,209,255,.07);border-left:3px solid #9ad1ff}
.se-host-nm{font-family:var(--v-display);font-weight:700;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#9ad1ff}
.se-host-line{font-style:italic;font-size:16px;line-height:1.45}
.se-said{display:flex;gap:12px;align-items:flex-start;margin:10px 0 2px}
.se-said-txt{font-style:italic;font-size:17px;line-height:1.45;color:#f1f4fa}
.se-said cite{display:block;margin-top:4px;font-style:normal;font-size:10px;letter-spacing:.2em;text-transform:uppercase;opacity:.65}
.se-irony{margin:8px 0;padding:8px 12px;background:rgba(201,40,60,.12);border:1px dashed rgba(220,90,100,.5)}
.se-irony b{display:block;font-family:var(--v-display);font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:#e08a94}
.se-irony span{font-size:14px;color:#f0d6d9}
.se-envs,.se-bids{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:14px 0}
.se-env,.se-bid{display:flex;flex-direction:column;align-items:center;gap:4px;width:84px;opacity:.75}
.se-env small,.se-bid small{font-family:var(--v-display);font-size:9px;letter-spacing:.14em;text-transform:uppercase;text-align:center}
.se-env i{display:block;width:44px;height:30px;background:linear-gradient(160deg,#e9e1cf,#c9bfa8);border-radius:2px;position:relative}
.se-env i::after{content:"";position:absolute;left:0;right:0;top:0;height:16px;background:linear-gradient(180deg,#d8cfb9,#bfb49b);clip-path:polygon(0 0,100% 0,50% 100%)}
.se-env.se-win i{background:radial-gradient(circle at 50% 60%,#9ad1ff 0 4px,#1b2a44 5px 8px,#e9e1cf 9px)}
.se-bid b{font-size:13px;color:#cfe6ff}
.se-win{opacity:1}
.se-win .cv-av{box-shadow:0 0 0 2px #9ad1ff,0 0 22px rgba(154,209,255,.6)}
.se-cardreveal{display:flex;justify-content:center;margin:16px 0}
.se-cardreveal span{display:inline-block;padding:18px 34px;background:linear-gradient(170deg,#f3ecdc,#d9ceb4);color:#1a1410;border:3px double #6b5a3a;
  font-family:var(--v-display);font-weight:900;font-size:24px;letter-spacing:.3em;text-transform:uppercase;box-shadow:0 10px 30px rgba(0,0,0,.6)}
.se-cardreveal[data-truth="traitor"] span{color:#8f1020}
.se-root .cv-av{position:relative;display:inline-block;overflow:hidden;flex:none;vertical-align:middle;border-radius:50% 50% 12% 12% / 44% 44% 9% 9%;
  background:linear-gradient(162deg,#18202e,#07090d);box-shadow:0 0 0 1px rgba(154,209,255,.3),0 4px 12px rgba(0,0,0,.6)}
.se-root .cv-av img{width:100%;height:100%;object-fit:cover;object-position:50% 18%;display:block;position:relative;z-index:2}
.se-root .cv-av-ini{position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;font-family:var(--v-display);font-weight:900;color:rgba(154,209,255,.6)}
`;
