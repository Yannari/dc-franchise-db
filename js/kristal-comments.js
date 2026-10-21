// The room under a Kristal-talKs episode.
//
// The user, 2026-10-21: "kristal talk comment are all boring generic and
// repetitive". They were seventeen stock lines ("This was genuinely a good
// conversation.", "Interesting how much context is still missing.") handed out
// by how close the commenter was to the guest — nobody in the room had heard
// a word of the episode.
//
// Now the room is made of the people the hour was ABOUT. Every exchange knows
// who it named (`who`); each of them turns up and answers the part about them
// — the one who was betrayed, the one who did the betraying, the rival, the
// partner, the winner, the castmate whose record was read out — in their own
// voice, often quoting the line. Friends and rivals who were not named react
// to the hottest moment, naming its person. The guest replies to the people
// they talked about.
//
// Voices: four tones from the commenter's own profile (their Kristal style):
// warm (charmer, earnest) · sharp (bomb, analyst) · loud (hothead, chaos) ·
// plain (deadpan, rambler). Slots: {guest} {x} (the commenter's subject — the
// guest, usually) {quote} (a short line the guest said about them) {season}.

import { styleOf } from './kristal-voice.js';

const TONE = { charmer: 'warm', earnest: 'warm', bomb: 'sharp', analyst: 'sharp',
  hothead: 'loud', chaos: 'loud', deadpan: 'plain', rambler: 'plain' };
export const toneOf = profile => TONE[styleOf(profile || {})] || 'plain';

// What somebody NAMED in the episode says about it, by why they were named.
// The role is the topic of the exchange that named them, from their side.
export const NAMED = {
  // the guest betrayed them
  'the-betrayal': {
    warm: ['Still waiting on that apology, {guest}. Coffee’s on you.', 'I’ve made my peace with it. Mostly. Hi, {guest}.',
      '“{quote}” I’m going to need you to say that to my face, with dessert.'],
    sharp: ['“{quote}” Cute. Still not an apology.', 'I was listening. Every word, {guest}.', 'Funny, the version I remember has fewer excuses in it.'],
    loud: ['{guest}. WE NEED TO TALK.', 'FORGIVEN?? WHO SAID FORGIVEN??', '“{quote}” I AM SCREAMING'],
    plain: ['heard it. not over it.', 'we should talk, {guest}.', 'that’s one way to tell it.'],
  },
  // they betrayed the guest
  'the-backstab': {
    warm: ['I’m sorry it went the way it did, {guest}. I’d still play it the same. Both true.', 'For what it’s worth, it was never personal. I cried in the car after.'],
    sharp: ['“{quote}” I’d have done it sooner, honestly.', 'Took you a whole season to say my name like that.', 'It was the right move then and it’s the right move now.'],
    loud: ['IT WAS A GAME MOVE. WE’VE BEEN OVER THIS.', 'one vote and I live in your head forever 😭', '“{quote}” OKAY BUT WHO SAVED YOU IN WEEK TWO'],
    plain: ['it was a game.', 'no hard feelings. some hard feelings.', 'still would.'],
  },
  'the-rivalry': {
    warm: ['Honestly? Some of that was fair. Not all of it. Love you, {guest}. From a distance.', 'I got a whole segment. I’m touched. Annoyed, but touched.'],
    sharp: ['“{quote}” Sure, {guest}.', 'An hour about me. I’d say I’m flattered, but you know me.', 'Notice how I was never in the room to answer any of this.',
      '“{quote}” Write that down, it’s the closest you’ll get to a compliment from me.', 'You still say my name like it costs you money.'],
    loud: ['“{quote}” EXCUSE ME??', 'I’m booking my own episode. Kristal, check your inbox.', 'THE AUDACITY. THE ACTUAL AUDACITY.'],
    plain: ['didn’t happen like that.', 'lol ok', 'my side’s coming.'],
  },
  'the-rival-of': {
    warm: ['“{quote}” Okay, that one actually stung a bit.', 'You really never thought about me? Not once? Rude.'],
    sharp: ['“{quote}” Says the person who brought me up first.', 'Living in your head was never the plan. Rent’s due though.'],
    loud: ['NEVER ONCE?? I WAS RIGHT THERE', '“{quote}” I’M RIGHT HERE, {guest}'],
    plain: ['we’ll see.', 'noted.'],
  },
  'the-romance': {
    warm: ['crying at my desk 🤍', 'okay I’m blushing. come home.', '“{quote}” and that’s why I married you. Metaphorically. For now.'],
    sharp: ['“{quote}” We’ll be discussing this at home.', 'For the record, I texted first. Kristal, correct the transcript.'],
    loud: ['THAT’S MY PERSON', 'I DID NOT TEXT FIRST. I HAVE RECEIPTS.', '“{quote}” 😭😭😭'],
    plain: ['🤍', 'come home.', 'love you, idiot.'],
  },
  'the-romance-over': {
    warm: ['I wish you well, genuinely. That was a lot of truth for one podcast.', '“{quote}” I miss it too sometimes. Just so you know.'],
    sharp: ['Interesting version of events.', '“{quote}” That is not how it ended, but sure.'],
    loud: ['BY TEXT?? IT WAS A VOICE NOTE.', '“{quote}” we are NOT doing this in public'],
    plain: ['ok.', 'take care.'],
  },
  'the-winner': {
    warm: ['Thank you, {guest} 🤍 that means a lot coming from you.', 'I’ll take every kind word. I earned them slowly.',
      'You were part of that win whether you like it or not, {guest}.'],
    sharp: ['“{quote}” I’ll take it.', 'Reluctant applause is still applause.', 'The crown fits. Thanks for asking.',
      'Funny how everybody’s an expert on my win except the people who voted for it.', 'I read “deserved” and stopped there.'],
    loud: ['THE CROWN STAYS WITH ME', '“{quote}” I’M FRAMING THIS', 'I’M SCREENSHOTTING THIS FOR MY MANTELPIECE'],
    plain: ['appreciate it.', 'thanks.', 'means a lot, {guest}.'],
  },
  'the-win': {
    warm: ['You deserved it, {guest}. I said it then and I’ll say it here.', '“{quote}” I knew it. I knew you were scared of me.'],
    sharp: ['“{quote}” So I WAS the threat. Lovely to have it confirmed.', 'Closer than anyone thinks, indeed.'],
    loud: ['ONE MORE FRIEND. ONE.', '“{quote}” I KNEW IT'],
    plain: ['good game.', 'next time.'],
  },
  'the-boot': {
    warm: ['For what it’s worth, it wasn’t personal. The hug was real.', 'I still think about that day, {guest}.'],
    sharp: ['I’d do it again, for the record.', '“{quote}” It was a good move. You said so yourself.'],
    loud: ['THE HUG WAS REAL', 'I was SHAKING writing your name, for the record'],
    plain: ['good episode.', 'it had to be you. sorry.'],
  },
  'the-loss': {
    warm: ['You were so close, {guest}. I mean it.', 'Proud to have sat next to you at the end.'],
    sharp: ['“{quote}” For what it’s worth, I’d have voted for you too.'],
    loud: ['SO CLOSE. I’M STILL MAD FOR YOU.'],
    plain: ['close one.'],
  },
  'the-record': {
    warm: ['I wrote it as kindly as I could, I promise.', 'That was my side. I’m glad you got to tell yours.',
      '“{quote}” We remember it differently and that’s okay.', 'Thank you for reading it out kindly, Kristal.'],
    sharp: ['My record is accurate, thanks.', '“{quote}” It’s in the record for a reason.', 'Correct anything? I’ll wait.', 'I wrote that down the night it happened.',
      '“{quote}” Bold, from the person in the footnote.'],
    loud: ['IT’S IN THE RECORD FOR A REASON', '“{quote}” I WAS THERE', 'READ IT AGAIN, {guest}. SLOWLY.'],
    plain: ['it says what happened.', 'still true.', 'my record, my words.'],
  },
  'the-response': {
    warm: ['I meant what I said, {guest}. I’d still love a proper talk.', '“{quote}” Fair. Lunch?', 'We’re both a bit right. Dinner, and we split it.'],
    sharp: ['“{quote}” Noted. I stand by mine.', 'So we agree I was half right.', 'I said it in that chair and I’d say it again.',
      '“{quote}” That’s a lot of words for “you were right”.'],
    loud: ['ROUND TWO. NAME THE DATE.', '“{quote}” OH WE’RE DOING THIS'],
    plain: ['we’ll talk.', 'fair.', 'heard you.'],
  },
  'the-ally': {
    warm: ['my person 🤍 calling you tonight', '“{quote}” I’m not crying, you’re crying.'],
    sharp: ['“{quote}” I’ll be invoicing you for the emotional labour.', 'Real friend. Obviously. I have the voice notes.'],
    loud: ['BEST FRIEND SEGMENT. I’M FRAMING IT', '“{quote}” DAMN RIGHT'],
    plain: ['love you, idiot.', 'real.'],
  },
  'behind-the-scenes': {
    warm: ['three in the morning, any morning 🤍', '“{quote}” I’d pick up. Always.'],
    sharp: ['I would pick up. I would also complain about it.', '“{quote}” Correct answer.'],
    loud: ['ANSWERING ON THE FIRST RING', 'I KNEW IT WOULD BE ME'],
    plain: ['always.', 'call me.'],
  },
  'the-moment': {
    warm: ['I remember that day differently, but I love that you remember it at all.', '“{quote}” Oh, that one.',
      'That day lives in my head too, {guest}.', 'I still laugh about that one.'],
    sharp: ['“{quote}” That is not what I said, but it’s close.', 'Funny how that moment keeps coming up.', 'My version has better lighting.'],
    loud: ['I REMEMBER THAT', '“{quote}” THE WAY I GASPED', 'NOT THIS STORY AGAIN 😭'],
    plain: ['i was there.', 'yeah, that happened.', 'good times. mostly.'],
  },
};

// The guest answering the people they talked about, by the guest's tone and the role.
export const GUEST_BACK = {
  hurt: { // betrayal, rivalry, rival-of, record, response, romance-over
    warm: ['Lunch is on me. I mean it.', 'I hear you. I’d like to do this properly, not in the comments.'],
    sharp: ['You know where to find me.', 'Book your episode. I’ll listen to every minute.'],
    loud: ['CALL ME THEN', 'OKAY ROUND TWO, NAME THE DATE'],
    plain: ['call me.', 'fair.'],
  },
  fond: { // ally, romance, winner, behind-the-scenes, loss, win
    warm: ['🤍🤍🤍', 'You know I meant every word.'],
    sharp: ['Don’t let it go to your head.', 'Obviously.'],
    loud: ['MY PERSON', 'NEVER CHANGE'],
    plain: ['🤍', 'always.'],
  },
  nod: { // the winner, the runner-up, the person who voted them out, somebody in a moment
    warm: ['Congratulations again. I mean it.', 'Thank you for listening 🤍'],
    sharp: ['Enjoy it.', 'We both know how it went.'],
    loud: ['STILL MAD. CONGRATS THOUGH.', 'HA. FAIR.'],
    plain: ['fair.', 'good game.'],
  },
};
const FOND = new Set(['the-ally', 'the-romance', 'behind-the-scenes', 'the-loss']);
const NOD = new Set(['the-winner', 'the-win', 'the-moment', 'the-boot']);
const LIFE_ROLE = { engaged: 'the-romance', love: 'the-romance', heartbreak: 'the-romance-over' };

// People who heard it and were not in it: the hottest moment, by name, in its register.
export const ROOM = {
  clash: {
    close: ['the {x} part. I had to pause it.', 'Proud of you for finally saying it about {x}.', 'I knew the {x} story and it still got me.',
      'You were so calm about {x}. I would not have been.', 'Called you the second it finished. You know why.'],
    friend: ['Kristal asking about {x} like that 😭', 'Not {guest} going after {x} on a podcast', 'I need {x}’s side of this now.',
      'The {x} segment alone was worth the hour.', '“{quote}” I had to rewind that.'],
    rival: ['Funny how {x} is always the villain in your stories, {guest}.', 'A whole hour and still no apology to {x}.',
      '“{quote}” Sure.', 'Interesting what you left out about {x}.', '{x} deserves a right of reply. Just saying.'],
  },
  warm: {
    close: ['The {x} part made me cry on the bus.', 'You two. Honestly. 🤍', 'I’ve watched you and {x} for years and this still got me.',
      'Calling you tonight about the {x} bit.'],
    friend: ['Okay the {x} segment was adorable.', '“{quote}” stop, I’m blushing for you', 'Kristal getting the {x} story out of {guest} 😭',
      'We need a whole episode about {guest} and {x}.'],
    rival: ['Sweet. A bit rehearsed, but sweet.', 'We get it, {guest}. You like {x}.', 'Nice to hear something kind for once.'],
  },
  hard: {
    close: ['Proud of you for talking about it. Here whenever.', 'That took guts. Calling you tonight.', 'You were so brave in this one.'],
    friend: ['Sending love, {guest}. That was a lot to share.', 'Really glad you’re okay.', 'Kristal handled that so gently.'],
    rival: ['Glad you’re through it, genuinely.', 'Whatever else, that was honest.'],
  },
};
// The person a viral episode was about, when no answer happened to name them.
export const SUBJECT = {
  warm: ['I was not in the room for any of this, {guest}. I’d like to be next time.', 'Heard it all. We should talk properly.'],
  sharp: ['Interesting that my name carried the whole hour.', 'Half of that is not how it happened, and the half that is sounds worse out of context.'],
  loud: ['I WAS NOT IN THE ROOM TO ANSWER ANY OF THIS', 'BOOKING MY OWN EPISODE. KRISTAL, CHECK YOUR INBOX.'],
  plain: ['my side’s coming.', 'noted.'],
};
// An hour with nobody in it but the guest: the room reacts to the guest.
ROOM.any = {
  close: ['Proud of you, {guest}. That was the most honest you’ve sounded in years.', 'Called you the second it finished.'],
  friend: ['Kristal really got {guest} talking.', 'Didn’t expect to listen to the whole thing. Did.'],
  rival: ['A whole hour and not one straight answer, {guest}.', 'Interesting what you left out.'],
};
const CLASH = new Set(['the-rivalry', 'the-rival-of', 'the-betrayal', 'the-backstab', 'the-record', 'the-response', 'the-boot']);
const registerOf = x => x.topic === 'the-life'
  ? (['engaged', 'love', 'baby', 'fame', 'windfall', 'cleared'].includes(x.mood) ? 'warm' : 'hard')
  : CLASH.has(x.topic) ? 'clash' : 'warm';

// ── helpers ──
function hash(key) {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const SLOT = /\{(\w+)\}/g;
function pick(bank, key, facts, used) {
  const ok = (bank || []).filter(t => [...t.matchAll(SLOT)].every(m => facts[m[1]]) && !used.has(t));
  const pool = ok;
  if (!pool.length) return null;
  const t = pool[hash(key) % pool.length];
  used.add(t);
  return t.replace(SLOT, (_, k) => k === 'guest' && /^[^a-z]+$/.test(t.replace(/\{\w+\}/g, '')) ? String(facts[k]).toUpperCase() : facts[k]);
}
/** A sentence the guest said that names this person, short enough to quote back at them. */
function quoteOf(x, name) {
  const said = [x.crack, x.a].filter(Boolean).flatMap(t => String(t).split(/(?<=[.!?])\s+/));
  const line = said.find(t => name && t.includes(name) && t.length >= 24 && t.length <= 90);
  return line || null;
}

/**
 * Who comments, and what they say.
 *
 * `ties` [{slug, weight}] off the social graph (the room); `names` slug -> name;
 * `profiles` slug -> {archetype, stats} for each commenter's tone.
 */
export function episodeComments(ep, { ties = [], names = {}, profiles = {} } = {}) {
  const used = new Set();
  const slugByName = new Map(Object.entries(names).map(([slug, n]) => [n, slug]));
  const tone = slug => toneOf(profiles[slug]);
  const guestTone = tone(ep.guest);
  const limit = ep.tier === 'viral' ? 7 : ep.tier === 'solid' ? 5 : 3;
  const out = [];
  const seen = new Set([ep.guest]);

  // ── the people the hour was about ──
  // Loudest first: the pressed exchanges, then the rest in the order they aired.
  const named = (ep.exchanges || []).filter(x => x.who && slugByName.has(x.who))
    .sort((a, b) => (b.press ? 1 : 0) - (a.press ? 1 : 0));
  // The person a viral episode is about always turns up.
  if (ep.tier === 'viral' && ep.mentioned) {
    const i = named.findIndex(x => slugByName.get(x.who) === ep.mentioned);
    if (i > 0) named.unshift(named.splice(i, 1)[0]);
  }
  for (const x of named) {
    if (out.length >= limit) break;
    const slug = slugByName.get(x.who);
    if (seen.has(slug)) continue;
    const facts = { guest: ep.guestName, quote: quoteOf(x, x.who), season: ep.season?.title };
    const role = x.topic === 'the-life' ? LIFE_ROLE[x.mood] : x.topic;
    const text = pick(NAMED[role]?.[tone(slug)], `${ep.id}|n|${slug}`, facts, used);
    if (!text) continue;
    seen.add(slug);
    const c = { slug, name: x.who, relation: slug === ep.mentioned ? 'subject' : 'named', role, text };
    out.push(c);
  }
  // The person a viral episode was about always turns up, named in an answer or not.
  if (ep.tier === 'viral' && ep.mentioned && !seen.has(ep.mentioned)) {
    const text = pick(SUBJECT[tone(ep.mentioned)], `${ep.id}|s`, { guest: ep.guestName }, used);
    seen.add(ep.mentioned);
    out.unshift({ slug: ep.mentioned, name: ep.mentionedName || names[ep.mentioned] || ep.mentioned,
      relation: 'subject', role: 'subject', text });
  }
  // The guest answers the first two of them.
  for (const c of out.slice(0, ep.tier === 'quiet' ? 1 : 2)) {
    const kind = FOND.has(c.role) ? 'fond' : NOD.has(c.role) ? 'nod' : 'hurt';
    const back = pick(GUEST_BACK[kind][guestTone], `${ep.id}|b|${c.slug}`, {}, used);
    if (back) c.replies = [{ slug: ep.guest, name: ep.guestName, relation: 'guest', text: back }];
  }

  // ── the room: friends and rivals who heard it ──
  const hot = (ep.exchanges || []).find(x => x.press && x.who) || (ep.exchanges || []).find(x => x.who) || null;
  const ranked = ties.slice().sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  for (const t of ranked) {
    if (out.length >= limit) break;
    if (seen.has(t.slug)) continue;
    const relation = t.weight >= 3 ? 'close' : t.weight > 0 ? 'friend' : 'rival';
    if (relation === 'rival' && hash(`${ep.id}|${t.slug}|skip`) % 2) continue;
    const facts = { guest: ep.guestName, x: hot?.who, quote: hot ? quoteOf(hot, hot.who) : null };
    // A friend of the person the hot moment was about takes their side.
    const text = pick(ROOM[hot ? registerOf(hot) : 'any'][relation], `${ep.id}|r|${t.slug}`, facts, used);
    if (!text) continue;
    seen.add(t.slug);
    out.push({ slug: t.slug, name: names[t.slug] || t.slug, relation, text });
  }
  // Nobody named answered? The guest answers the loudest rival in the room instead.
  if (ep.tier !== 'quiet' && !out.some(c => c.replies)) {
    const c = out.find(x => x.relation === 'subject' || x.relation === 'rival');
    const back = c && pick(GUEST_BACK.hurt[guestTone], `${ep.id}|b|${c.slug}`, {}, used);
    if (back) c.replies = [{ slug: ep.guest, name: ep.guestName, relation: 'guest', text: back }];
  }
  return out;
}
