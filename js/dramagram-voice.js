// The words on Dramagram.
//
// Design: docs/superpowers/specs/2026-08-18-dramagram-design.md
//
// This file is DATA and a small composer. Templates by default; the AI writer is
// a polish pass invoked only when explicitly asked for, so nothing costs money
// by surprise. That was settled for the life layer and holds here.
//
// ── A CAPTION IS NOT THE WIKI LINE ──
//
// js/life-events.js writes the encyclopedia sentence: "Lindsay and Alejandro
// moved in together." That is third person, past tense, and correct for an
// article. A caption is the same fact in FIRST PERSON, written by the person it
// happened to, and the difference is the whole reason this file exists. One
// event, two registers, neither pretending to be the other.
//
// ── TONE COMES FROM THE ARCHETYPE ──
//
// A villain does not caption a wedding the way a hero does. The roster already
// says which somebody is, so four registers cover fifteen archetypes without
// anybody writing fifteen banks.
//
// Slots: {name} {whom} {season}. A template naming {whom} is never chosen for an
// event that has no second person, so no caption renders a hole.

/** The four registers. Every archetype maps to exactly one. */
export const TONES = ['warm', 'sharp', 'plain', 'loud'];

const ARCHETYPE_TONE = {
  hero: 'warm', 'loyal-soldier': 'warm', 'social-butterfly': 'warm', showmancer: 'warm',
  villain: 'sharp', mastermind: 'sharp', schemer: 'sharp', 'perceptive-player': 'sharp',
  goat: 'plain', floater: 'plain', underdog: 'plain', 'challenge-beast': 'plain',
  hothead: 'loud', 'chaos-agent': 'loud', wildcard: 'loud',
};

export const toneFor = archetype => ARCHETYPE_TONE[archetype] || 'plain';

// ─── the captions ──────────────────────────────────────────────────────────
//
// CAPTIONS[kind][tone] -> string[]
//
// Written fresh. What is studied is shape — how long a caption runs before it
// undercuts itself, where the lower case sits, when somebody posts a whole
// paragraph and when they post three words.

export const CAPTIONS = {
  // ── relationship ──
  dating: {
    warm: ['so this happened 🤍', 'him. that\'s the post.', 'apparently i have a person now',
      'been smiling at my phone like an idiot for a month, so'],
    sharp: ['fine. yes. it\'s a thing.', 'do not make this weird', 'against my better judgement',
      'no i will not be elaborating'],
    plain: ['us, i guess', 'this one', 'yeah', 'so anyway'],
    loud: ['GUESS WHAT', 'IT\'S HAPPENING PEOPLE', 'ok so ANYWAY', 'yes i\'m aware. yes it\'s real.'],
  },
  'went-public': {
    warm: ['no more hiding 🤍', 'ok everyone knows now', 'making it official on here, which is apparently the law',
      'we were never subtle and you all knew'],
    sharp: ['for the people in my messages: yes.', 'consider this the announcement you were begging for',
      'you can stop now'],
    plain: ['making it official', 'yes it\'s real', 'there you go'],
    loud: ['FINE. FINE! YES!', 'you people would not let it go so HERE', 'HAPPY NOW'],
  },
  'moved-in': {
    warm: ['we got a place 🏡', 'unpacking is a nightmare and i\'ve never been happier',
      'home. an actual one.', 'there are two toothbrushes and i think about it constantly'],
    sharp: ['sharing a lease with someone who leaves cupboards open. pray for me.',
      'we live together now. i have notes.', 'the negotiation took longer than the season'],
    plain: ['new place', 'we moved in', 'got a flat'],
    loud: ['WE GOT A PLACE', 'i own a SOFA now what is my life', 'BOXES EVERYWHERE SEND HELP'],
  },
  engaged: {
    warm: ['she said yes 💍', 'i asked. i cried. she cried. everyone cried.',
      'the easiest yes of my life', 'forever, apparently'],
    sharp: ['a legally binding arrangement has been entered into 💍',
      'i planned this better than any vote i ever ran', 'yes there was a ring. yes it was expensive.'],
    plain: ['we\'re engaged', 'this happened', 'ring 💍'],
    loud: ['ENGAGED!!!!!', 'I ASKED AND THEY SAID YES', 'RING. ON THE HAND. GOODBYE.'],
  },
  wedding: {
    warm: ['married 🤍', 'best day of my life, no competition', 'my person. officially.',
      'i have been crying since 2pm and i am not going to stop'],
    sharp: ['it is done. paperwork and everything.', 'married. the jury of one voted yes.',
      'a merger. a very good one.'],
    plain: ['we got married', 'married', 'that\'s that'],
    loud: ['MARRIEDDDD', 'WE DID IT', 'MY WIFE. MY ACTUAL WIFE.'],
  },
  'broke-up': {
    warm: ['we\'ve gone our separate ways. please be kind to them.',
      'this one hurts. that\'s all i\'ll say.', 'no bad guy here. just an ending.'],
    sharp: ['that\'s over. no, there is no story.', 'ended. moving on. do not ask.',
      'i\'m fine. genuinely. stop.'],
    plain: ['we\'re not together anymore', 'that\'s done', 'no longer a thing'],
    loud: ['DONE. NEXT.', 'i am not doing a whole post about this', 'ask me nothing'],
  },
  separated: {
    warm: ['we\'re taking time apart. please give us room.', 'this is hard and it is private'],
    sharp: ['living separately. that is the whole statement.', 'no comment beyond this one'],
    plain: ['we\'ve separated', 'taking time'],
    loud: ['not doing this here', 'PRIVACY. PLEASE.'],
  },
  divorced: {
    warm: ['it ended kindly, and that matters to me', 'we tried. genuinely. be nice.'],
    sharp: ['divorced. filed, signed, finished.', 'the second-best decision i ever made'],
    plain: ['divorced', 'it\'s finalised'],
    loud: ['FREE', 'signed the papers and got a haircut'],
  },
  'quietly-ended': {
    warm: ['some things just fade. no hard feelings 🤍'],
    sharp: ['it stopped. nobody noticed. that says enough.'],
    plain: ['not together anymore'],
    loud: ['anyway'],
  },

  // ── family ──
  expecting: {
    warm: ['there\'s a tiny person coming 🤍', 'we\'re going to be parents and i am terrified and thrilled'],
    sharp: ['a small recruit joins the alliance in spring',
      'i have been outplanned by someone the size of a lime'],
    plain: ['baby on the way', 'expecting'],
    loud: ['WE\'RE HAVING A BABY', 'A BABY. AN ACTUAL BABY.'],
  },
  birth: {
    warm: ['she\'s here 🤍 everything else can wait', 'my whole heart, eight pounds of it',
      'i did not know it was possible to feel like this'],
    sharp: ['the newest member of the household. already better at this than me.',
      'born. healthy. loud. mine.'],
    plain: ['she\'s here', 'baby\'s arrived', 'new arrival'],
    loud: ['HE IS HERE AND HE IS PERFECT', 'I HAVE A SON', 'NOBODY TOLD ME IT WOULD BE LIKE THIS'],
  },
  estranged: {
    warm: ['some doors close and you have to let them 🤍'],
    sharp: ['i have stopped explaining myself to people who were never listening'],
    plain: ['taking space from family'],
    loud: ['done explaining myself to certain people'],
  },
  reconciled: {
    warm: ['seven years is a long time to be angry. we talked. 🤍'],
    sharp: ['a truce. cautiously.'],
    plain: ['we\'re talking again'],
    loud: ['WE TALKED. IT\'S FINE NOW. I\'M NOT CRYING.'],
  },

  // ── career and education ──
  'new-job': {
    warm: ['new chapter! nervous in the best way', 'first day 🤍 wish me luck'],
    sharp: ['new job. same me, better paid.', 'they made an offer i chose not to refuse'],
    plain: ['started a new job', 'new job', 'day one'],
    loud: ['NEW JOB BABY', 'I GOT IT I GOT IT I GOT IT'],
  },
  promoted: {
    warm: ['promoted 🤍 still can\'t quite believe it'],
    sharp: ['promoted. it took them long enough.'],
    plain: ['got promoted'],
    loud: ['PROMOTED. WHO SAID I PEAKED ON TV'],
  },
  'quit-job': {
    warm: ['leaving somewhere good, for something that fits better'],
    sharp: ['resigned. the reasons are mine.'],
    plain: ['left my job'],
    loud: ['I QUIT. ASK ME HOW IT FEELS.'],
  },
  'laid-off': {
    warm: ['made redundant today. being honest because pretending is exhausting.'],
    sharp: ['restructured out of a job. noted.'],
    plain: ['laid off'],
    loud: ['well. that happened.'],
  },
  'started-business': {
    warm: ['it\'s open! terrifying and wonderful 🤍'],
    sharp: ['my own thing now. no notes from anybody.'],
    plain: ['started my own thing'],
    loud: ['I HAVE A BUSINESS. AN ACTUAL BUSINESS.'],
  },
  enrolled: {
    warm: ['back at school and weirdly excited about it'],
    sharp: ['studying again. the plan has a second act.'],
    plain: ['back to school'],
    loud: ['I\'M A STUDENT AGAIN GOD HELP ME'],
  },
  graduated: {
    warm: ['four years of night classes and i never have to open that textbook again 🤍',
      'graduated 🎓 my family is unbearable today and i love it'],
    sharp: ['done. framed. next.', 'a piece of paper that took four years and cost more than a car'],
    plain: ['graduated', 'finished my degree', 'done 🎓'],
    loud: ['I GRADUATED', 'IT\'S OVER. I\'M FREE. 🎓'],
  },

  // ── home and small ──
  'moved-city': {
    warm: ['new city, new everything. slightly terrified 🤍'],
    sharp: ['relocated. the reasons are boring and financial.'],
    plain: ['moved cities'],
    loud: ['NEW CITY LET\'S GO'],
  },
  'bought-home': {
    warm: ['keys 🔑 i own a door', 'a place that is actually mine'],
    sharp: ['a mortgage. the longest commitment i have ever made.'],
    plain: ['bought a place'],
    loud: ['I BOUGHT A HOUSE. A HOUSE!'],
  },
  pet: {
    warm: ['everyone meet the love of my life 🐶', 'he\'s ridiculous and he\'s mine'],
    sharp: ['acquired an asset with no strategic value whatsoever'],
    plain: ['got a dog'],
    loud: ['DOG. I HAVE A DOG.'],
  },
  tattoo: {
    warm: ['new ink 🤍 it means something, ask me sometime'],
    sharp: ['permanent decision. made sober. mostly.'],
    plain: ['new tattoo'],
    loud: ['GOT IT DONE. NO REGRETS. (some regrets)'],
  },
  travelling: {
    warm: ['went somewhere with no wifi and came back a person 🤍'],
    sharp: ['left the country. did not miss any of you.'],
    plain: ['been travelling'],
    loud: ['I WENT SO FAR AWAY AND IT RULED'],
  },
  haircut: {
    warm: ['cut it all off and i feel new 🤍'],
    sharp: ['it\'s hair. it grows. calm down.'],
    plain: ['new hair'],
    loud: ['CHOPPED IT. FIGHT ME.'],
  },
  flatmates: {
    warm: ['moved in with my favourite person to argue with 🤍'],
    sharp: ['a housemate. strictly logistical.'],
    plain: ['new flatmate'],
    loud: ['WE LIVE TOGETHER NOW GOD HELP THE NEIGHBOURS'],
  },

  // ── public life ──
  'red-carpet': {
    warm: ['dressed up for once 🤍 what a night'],
    sharp: ['stood on a carpet while people shouted. as one does.'],
    plain: ['event last night'],
    loud: ['LOOK AT ME. LOOK AT THIS.'],
  },
  podcast: {
    warm: ['we made a thing! episode one is up 🤍'],
    sharp: ['a podcast. yes. i have become that.'],
    plain: ['started a podcast'],
    loud: ['I HAVE A PODCAST NOW. SUBSCRIBE OR DON\'T.'],
  },
  'brand-deal': {
    warm: ['genuinely use this stuff, so this one\'s easy #ad'],
    sharp: ['they paid. i posted. we are all adults. #ad'],
    plain: ['#ad'],
    loud: ['THEY SENT ME A BOX AND I SCREAMED #ad'],
  },
  interview: {
    warm: ['talked about the season honestly for the first time'],
    sharp: ['asked the same four questions again. answered two.'],
    plain: ['did an interview'],
    loud: ['I SAID SOME THINGS'],
  },
  feud: {
    warm: ['i\'d rather not do this publicly, but here we are.'],
    sharp: ['say it to me and not to a camera next time.'],
    plain: ['not going to pretend we\'re fine'],
    loud: ['ENOUGH.', 'SAY IT AGAIN. I DARE YOU.'],
  },
  'made-up': {
    warm: ['we talked it out. life\'s too short 🤍'],
    sharp: ['a truce. do not read into it.'],
    plain: ['we\'re alright now'],
    loud: ['WE\'RE GOOD. EVERYONE RELAX.'],
  },
  'hosted-comp': {
    warm: ['back where it started, on the other side of it 🤍'],
    sharp: ['ran the competition this time. much easier from here.'],
    plain: ['hosted a comp'],
    loud: ['THEY LET ME HOST. THEY REGRET IT.'],
  },
  reunion: {
    warm: ['everyone in one room again 🤍 chaos, obviously'],
    sharp: ['same room, same people, same grudges.'],
    plain: ['reunion night'],
    loud: ['THE BAND IS BACK TOGETHER'],
  },

  // ── health, money, the hard ones ──
  // Short and plain by design. The spec's craft note: the shortest true
  // sentence, not the most dramatic one available.
  sober: {
    warm: ['one year today. quietly proud. 🤍'],
    sharp: ['sober. that is the whole post.'],
    plain: ['a year sober today'],
    loud: ['ONE YEAR. STILL HERE.'],
  },
  therapy: {
    warm: ['started therapy. recommend it. that\'s all 🤍'],
    sharp: ['seeing someone about it. professionally.'],
    plain: ['started therapy'],
    loud: ['THERAPY. IT\'S GOOD ACTUALLY.'],
  },
  bereavement: {
    warm: ['we lost someone. thank you for the messages. 🤍'],
    sharp: ['a loss in the family. no more than that here.'],
    plain: ['lost someone this week'],
    loud: ['not posting for a while.'],
  },
  'came-into-money': {
    warm: ['some good news for once 🤍'],
    sharp: ['solvent. finally.'],
    plain: ['good news, financially'],
    loud: ['I\'M RICH (i am not rich but i am okay)'],
  },
  bankruptcy: {
    warm: ['being honest about a hard year. it happens to people.'],
    sharp: ['bankrupt. the numbers are the numbers.'],
    plain: ['filed for bankruptcy'],
    loud: ['bad year. saying it out loud.'],
  },
  cancelled: {
    warm: ['i\'ve read it all. i\'m listening. 🤍'],
    sharp: ['i have said what i am going to say.'],
    plain: ['statement in my story'],
    loud: ['NOT DOING THIS HERE'],
  },
};

/** When a kind has nothing written, by how much it matters. */
export const FALLBACK = {
  major: {
    warm: ['big news 🤍', 'something has changed and it\'s good'],
    sharp: ['a development.', 'noted, and posted.'],
    plain: ['news', 'this happened'],
    loud: ['BIG NEWS', 'SOMETHING HAPPENED'],
  },
  notable: {
    warm: ['a good week 🤍', 'small thing, felt big'],
    sharp: ['worth mentioning. barely.', 'happened.'],
    plain: ['update', 'new thing'],
    loud: ['OKAY SO', 'ANYWAY:'],
  },
  minor: {
    warm: ['🤍', 'little things', 'nice day'],
    sharp: ['.', 'as you were.'],
    plain: ['—', 'today'],
    loud: ['!!', 'OK'],
  },
};

// ─── the comments ──────────────────────────────────────────────────────────
//
// COMMENTS[relation][significance] -> string[]
//
// Who says these is not decided here: the social graph picks the people, and a
// stranger congratulating somebody on their wedding is exactly what would make
// the app read as generated.

export const COMMENTS = {
  close: {
    major: ['I AM SOBBING', 'been waiting years for this one 🤍', 'so happy for you both i could scream',
      'i knew before any of you did', 'crying in a car park about this', 'YES. finally. YES.'],
    notable: ['proud of you 🤍', 'this is lovely', 'about time!', 'love this for you',
      'yes!! good!!', 'been rooting for this'],
    minor: ['🤍', 'love it', 'cute', 'yes', 'ha! good', 'this is very you'],
  },
  friend: {
    major: ['congratulations! genuinely lovely news', 'oh this is wonderful', 'so pleased for you',
      'what a thing 🤍', 'delighted for you both'],
    notable: ['nice one!', 'good for you', 'lovely stuff', 'happy for you', 'ace'],
    minor: ['nice', '👏', 'good one', 'love this', 'ha'],
  },
  rival: {
    major: ['hm.', 'congratulations, sincerely.', 'well. good luck to them.',
      'never thought i\'d see it', 'genuinely, all the best.', 'noted.'],
    notable: ['sure.', 'good for you i suppose', 'huh', 'okay then'],
    minor: ['.', 'ok', 'sure'],
  },
};

/** Comments that only make sense for one kind. Checked before the generic bank. */
export const KIND_COMMENTS = {
  wedding: { close: ['the speech RUINED me', 'best wedding i have ever been to and i am counting my own'],
    friend: ['what a day! congratulations to you both'], rival: ['it was a nice day. it was.'] },
  birth: { close: ['auntie duties begin immediately', 'she is PERFECT'],
    friend: ['congratulations! what lovely news'], rival: ['congratulations. genuinely.'] },
  feud: { close: ['whatever you need. always.'], friend: ['hope you two sort it out'],
    rival: ['say it properly then.', 'this is embarrassing for you'] },
  bereavement: { close: ['i\'m so sorry. calling you tonight.'], friend: ['thinking of you 🤍'],
    rival: ['very sorry to hear this.'] },
  cancelled: { close: ['i know who you are. that hasn\'t changed.'], friend: ['hope you\'re okay'],
    rival: [''] },
  graduated: { close: ['FOUR YEARS. you did it.'], friend: ['congratulations doctor 🎓'],
    rival: ['well done, sincerely'] },
  'red-carpet': { close: ['STOP IT you look unreal'], friend: ['you look great!'], rival: ['nice suit.'] },
  'brand-deal': { close: ['get that money 😭'], friend: ['ha! good for you'], rival: ['#ad indeed'] },
};

// ─── the composer ──────────────────────────────────────────────────────────

/** Deterministic index from a key — the same post always reads the same way. */
function pickFrom(list, key) {
  if (!list || !list.length) return null;
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return list[(h >>> 0) % list.length];
}

const fill = (t, { name, whom, season }) => String(t)
  .replace(/\{name\}/g, name || '')
  .replace(/\{whom\}/g, whom || '')
  .replace(/\{season\}/g, season || '');

/**
 * The caption for a post: first person, in their register.
 *
 * Falls back by significance rather than to nothing, so every one of the 68
 * kinds has something to say even before anybody writes it a bank.
 */
export function captionFor(event, { archetype = '', names = {}, season = '' } = {}) {
  const tone = toneFor(archetype);
  const sig = event?._sig || 'notable';
  const bank = CAPTIONS[event?.kind]?.[tone]
    || CAPTIONS[event?.kind]?.plain
    || FALLBACK[sig]?.[tone]
    || FALLBACK.notable.plain;
  const line = pickFrom(bank, `${event?.player}|${event?.kind}|${event?.afterSeason}|${event?.seq}`);
  return fill(line || '', {
    name: names[event?.player] || '', whom: names[event?.whom] || '', season,
  });
}

/**
 * Who comments, and what they say.
 *
 * The people come from the caller's social graph, so the room under a post is
 * made of people who actually know them. `ties` is [{slug, weight}] — positive
 * is a friend, strongly positive is close, negative is a rival.
 */
export function commentsFor(event, { ties = [], names = {}, max = 4 } = {}) {
  const sig = event?._sig || 'notable';
  const seedBase = `${event?.player}|${event?.kind}|${event?.afterSeason}|${event?.seq}`;
  const ranked = ties.slice().sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  const out = [];
  for (const t of ranked) {
    if (out.length >= max) break;
    if (t.slug === event?.whom) continue;         // they are in the post, not under it
    const relation = t.weight >= 3 ? 'close' : t.weight > 0 ? 'friend' : 'rival';
    // A rival mostly says nothing. Silence is the most common reaction to
    // somebody you dislike doing well, and a comment section where everybody
    // turns up reads as a crowd rather than a life.
    if (relation === 'rival' && pickFrom([0, 1, 1], `${seedBase}|${t.slug}|skip`)) continue;
    // BOTH POOLS, NOT ONE OR THE OTHER.
    //
    // Preferring the kind-specific bank when it exists meant a kind with one
    // written line gave every close friend the same words: four people under
    // Lindsay's graduation all said "FOUR YEARS. you did it." Merging keeps the
    // specific flavour and borrows the generic bank's variety, so a thin kind
    // reads as a room rather than a chorus.
    const bank = [
      ...(KIND_COMMENTS[event?.kind]?.[relation] || []),
      ...(COMMENTS[relation]?.[sig] || []),
    ].filter(Boolean);
    const text = pickFrom(bank, `${seedBase}|${t.slug}`);
    if (!text) continue;
    out.push({ slug: t.slug, name: names[t.slug] || t.slug, relation, text });
  }
  return out;
}
