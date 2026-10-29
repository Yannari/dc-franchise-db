// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-portraits.js — a housemate's portrait, on launch night
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-28: "why is the presentation in the confessional? ... it's too short: you can talk about their
// profession, their marital status, their lives, what they like to do, what they are here for, where they're from ...
// we need actual decor". The real launch plays a recorded portrait of every housemate while they walk to the airlock:
// filmed out in their life, in their own words. Here: where they are from, in a street; their work, at work; their
// life, the love life, what they do for fun, why they came. In their words when the roster has them (the casting
// interview: js/character-file.js), else from their job, their town and who they are.
//
// The backdrops are borrowed from The Ridonculous Race's places (generic streets, offices, fields; no landmark: the
// simulator names no real place) until the House of Secrets' own portrait plates exist (PORTRAIT_PLATES below; the
// plate job is in the user's to-edit folder).

import { plateBuilt, plateBase } from './plates.js';

const RR = 'assets/sets/rr';
/** The decors a portrait can be filmed in: the street they grew up on, and the places they work. */
export const PORTRAIT_DECOR = {
  town: `${RR}/prairie-ranch/arrive-9443918.webp`,
  seaside: `${RR}/coast-palace/present-9437028.webp`,
  city: `${RR}/home-city/task-9434810.webp`,
  office: `${RR}/home-city/task-9434868.webp`,
  lobby: `${RR}/home-city/task-lift-lobby.webp`,
  night: `${RR}/game-show-city/don-neon-crossing.webp`,
  sport: `${RR}/glass-tower-gulf/task-tennis-court.webp`,
  country: `${RR}/outback-farm/chill-9443111.webp`,
  lounge: `${RR}/glass-tower-gulf/don-rooftop-pool.webp`,
};
// the House of Secrets' own portrait plates, once the user has made them (tools/bb-resort, only: 'secret-story'):
// each takes over from its borrowed decor
const OWN_PLATE = { town: 'ss-portrait-street', seaside: 'ss-portrait-seaside', city: 'ss-portrait-home', office: 'ss-portrait-office', lobby: 'ss-portrait-office',
  night: 'ss-portrait-bar', sport: 'ss-portrait-gym', country: 'ss-portrait-country', lounge: 'ss-portrait-salon', campus: 'ss-portrait-campus' };
const decorUrl = d => {
  const id = OWN_PLATE[d];
  try { if (id && plateBuilt(id)) return `${plateBase(id, 'secret-story', false)}.webp`; } catch { /* no plates loaded: the borrowed decor */ }
  return PORTRAIT_DECOR[d] || PORTRAIT_DECOR.city;
};

// what they do, read from the job's words (a category picks the decor and how they talk about it)
const JOBS = [
  ['student', /\b(student|school|college|universit\w*|graduate|intern)\b/i],
  ['media', /\b(influencer|content creator|streamer|youtuber|model|actor|actress|journalist|presenter|blogger|podcast\w*)\b/i],
  ['creative', /\b(artist|painter|writer|author|poet|photographer|illustrator|tattoo\w*|florist|baker|chef|cook|musician|singer|designer)\b/i],
  ['sport', /\b(trainer|coach|athlet\w*|fitness|gym|lifeguard|swim\w*|tennis|soccer|football|basketball|boxer|wrestler|player|instructor|yoga)\b/i],
  ['night', /\b(bartend\w*|dj|club\w*|promot\w*|server|waiter|waitress|dancer|performer|rapper|comedian)\b/i],
  ['country', /\b(farm\w*|ranch\w*|logg\w*|forest\w*|fisher\w*|construct\w*|mechanic|landscap\w*|cowboy|carpenter|welder|plumber|electrician|roofer)\b/i],
  ['lounge', /\b(stylist|hair\w*|make-?up|beauty|nail\w*|fashion|pageant\w*|entrepreneur|business owner|ceo|founder|realtor|real estate)\b/i],
  ['office', /\b(law\w*|attorney|account\w*|bank\w*|financ\w*|consult\w*|analyst|office|manager|admin\w*|executive|insurance|recruit\w*|marketing|sales\w*|engineer|developer|programmer)\b/i],
];
const jobKind = job => (JOBS.find(([, re]) => /** @type {RegExp} */ (re).test(String(job || ''))) || ['other'])[0];
const DECOR_OF = { sport: 'sport', night: 'night', country: 'country', lounge: 'lounge', office: 'office', student: 'campus', media: 'city', creative: 'city', other: 'lobby' };
const JOB_SAYS = {
  sport: ["My body is my job. I'm up before everybody, and I train before I eat.", "I push people until they hate me, and then they thank me."],
  night: ["I work nights. I've seen people at their very best and at their absolute worst.", "When everybody else is going home, I'm just getting started."],
  country: ["Early mornings, outside, hard work. Nobody in that house is going to out-work me.", "I work with my hands. You can't fake that, and you can't talk your way out of it."],
  lounge: ["People come to me to feel good about themselves. And while they're in the chair, they tell me everything.", "I built it myself, from nothing. Nobody handed me a thing."],
  office: ["Meetings, deadlines, people who think they're smarter than me. I'm good at it.", "Nine to six, a desk and a screen. In there, nobody is going to guess what I'm really like."],
  student: ["Lectures in the morning, a job at night, and somehow a social life in between.", "I'm still working out what I want to be. This was not on the list."],
  media: ["My whole life is online. In there, there's no phone, no followers, nothing. Just me.", "People think they know me from a screen. They're about to find out they don't."],
  creative: ["I make things for a living. It's the only thing I've ever wanted to do.", "It's not just a job. It's who I am. Most days, anyway."],
  other: ["I love what I do, and I'm good at it. That's more than most people can say.", "It's not glamorous, but I'm proud of it. Really proud."],
};
// (true of a big city and of a village alike: the user's read had "nobody's heard of it" said of Toronto)
const TOWN_SAYS = ["Born and raised. My whole family is still there, and they're all going to be watching.", "It's home. Whatever happens in here, that's where I go back to.",
  "I love it there. I could never live anywhere else. Well, except in there, for a while.", "Everybody I grew up with is going to be glued to the TV. No pressure."];
// a hometown the roster holds as a nationality ("Swiss") is said as one: "I'm Swiss", never "I'm from Swiss"
const NATION = /^(swiss|french|british|english|irish|scottish|welsh|dutch|german|italian|spanish|portuguese|brazilian|american|canadian|australian|mexican|japanese|chinese|korean|filipino|indian|nigerian|polish|greek|turkish|swedish|norwegian|danish|belgian|russian|\w+(?:ish|ese|ian))$/i;
const NO_TOWN = ["Where I'm from? You'll have to guess. That's part of the game.", "A little bit of everywhere. I moved around a lot growing up."];
const SINGLE = ["Single. Very single.", "Single, and honestly, not looking. Probably.", "Single. My last relationship was a disaster, and that's all I'm saying.",
  "Single. If somebody in that house catches my eye, we'll see."];
// what they say after their secret, at the end of the portrait (by the secret's kind)
const REVEAL_AFTER = {
  survived: ["It changed everything. I don't talk about it, and in there I won't have to.", "I don't tell that story very often. In there, I won't tell it at all."],
  talent: ["Nobody who meets me would ever guess. That's exactly why it'll be hard to find.", "In there, I'm going to keep it very, very quiet."],
  record: ["I'm proud of it. I just can't let anybody in there see that I'm proud of it.", "If they find it, they'll never let me forget it."],
  job: ["People hear it and they look at me differently. In there, nobody's going to get the chance.", "It's a normal job to me. In there, it's a secret."],
  body: ["You'd never see it unless I showed you. And I won't.", "It's part of me. It's not their business. Not yet."],
  family: ["It's my family's story more than mine. I'm keeping it for them.", "When people find out, they ask a hundred questions. In there, nobody gets to ask."],
  past: ["That was another life. It's staying behind me.", "I'm not that person any more. But they'd only see that person."],
  belief: ["Laugh if you want. Everybody does, at first.", "I know how it sounds. That's why it stays secret."],
  love: ["It's the most romantic thing that ever happened to me, and nobody in there will ever hear it.", "Yes. Really. Don't tell them."],
  money: ["It changes how people treat you. That's why it stays secret.", "If they find it, they'll all want to be my friend. No thanks."],
};
const WHY = ["I want to know if I can keep a secret from a whole house, for weeks. I've never kept one for more than a day.", "For the adventure. You get one chance at something like this.",
  "For my family. And for the money. Mostly the money.", "I want to find out what I'm made of when nobody's on my side.", "I've watched it since I was a kid. Now it's my turn."];
// one whose secret is a hidden couple says it too, for the cameras: the public knows better
const HIDING = ["Single. Officially.", "Me? Single. Completely single. Why do you ask?"];
const FUN = {
  physical: "The gym, every single day. If I miss a day, I'm unbearable.",
  endurance: "Running. Long runs, alone, with nothing in my ears. That's where I think.",
  mental: "Reading, puzzles, documentaries. I'm a nerd, and I'm proud of it.",
  social: "Going out. Friends, long dinners, dancing until it gets light.",
  strategic: "Chess, poker, anything with a winner. I hate losing more than I love winning.",
  boldness: "Anything that scares me. Skydiving, karaoke, telling people what I think.",
  intuition: "Watching people. Cafes, train stations, anywhere. I make up their whole lives.",
  temperament: "Cooking for people. A full table on a Sunday is my idea of heaven.",
  loyalty: "My family, honestly. Sunday lunch at my mum's isn't optional.",
};
// a word from the Big Brother house a Secret Story portrait does not say
const NOT_HERE = /\b(HOH|head of household|veto|POV|jury|jurors?|houseguests?|backdoor\w*|big brother|eviction|evict\w*|nominations? ceremony)\b/i;

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
// the first sentences of an answer, short enough to say on camera
function said(answer, max = 230) {
  const t = String(answer || '').replace(/\s+/g, ' ').replace(/^[-•]\s*/, '').trim();
  if (!t || NOT_HERE.test(t)) return null;
  const parts = t.match(/[^.!?]+[.!?]+["”’)]*\s*/g) || [t];
  let out = '';
  for (const p of parts) { if ((out + p).length > max && out) break; out += p; }
  out = out.trim();
  return out.length >= 12 ? out : null;
}
/** The casting interview, by question key: { adjectives, picked, activities, showmance, motto, hopeToGet, ... }. */
export function interviewOf(p) {
  let ci = p?.castingInterview;
  if (typeof ci === 'string') { try { ci = JSON.parse(ci); } catch { ci = null; } }
  if (Array.isArray(ci)) return Object.fromEntries(ci.filter(x => x && x.key).map(x => [x.key, x.a]));
  return ci && typeof ci === 'object' ? ci : {};
}
// a job said in a sentence: "Law Student" is "law student"; an acronym (DJ, CEO) stays as it is
const jobWords = s => String(s || '').trim().split(/(\s+)/).map(w => (/^[A-Z][a-z]/.test(w) ? w.toLowerCase() : w)).join('');
const article = s => (/^[aeiou]/i.test(s) ? 'an' : 'a');
const topStat = (p, k) => {
  const s = p?.stats || {};
  const keys = Object.keys(FUN).sort((a, b) => (Number(s[b]) || 5) - (Number(s[a]) || 5) || hash(`${k}|${a}`) - hash(`${k}|${b}`));
  return keys[0];
};

/**
 * The steps of one housemate's portrait: three places, one life. `p` the roster record, `i` their place in the night,
 * `o.hiding` true when their secret is a couple they will be hiding, `o.people` / `o.how` / `o.promise` the night's own
 * lines (ss-launch.js: what people think of them, how they will play, what they promise the Voice).
 * @returns {any[]}
 */
export function portraitSteps(p, i, o = {}) {
  const n = p?.name;
  if (!n) return [];
  const iv = interviewOf(p);
  const k = `${n}|portrait`;
  const job = String(p.occupation || '').trim();
  const kind = jobKind(job);
  const rural = kind === 'country';
  // (plate: null, so a portrait never inherits the studio's plate, host or screen: it is not live, and not in the studio)
  const at = (decor, room) => ({ set: 'portrait', plate: null, bgUrl: decorUrl(decor), room, cam: 1, kicker: `Portrait · ${n}`, cast: [[n, 50]], portrait: true, hostOn: false, tvObj: false, time: 'PORTRAIT' });
  const town0 = String(p.hometown || '').trim();
  const nation = NATION.test(town0) ? town0.replace(/^./, c => c.toUpperCase()) : '';
  const town = nation ? '' : town0;
  const age = Number(p.age) || null;
  /** @type {any[]} */ const steps = [];
  // 1. where they are from
  steps.push({ k: 'beat', scene: at(rural ? 'country' : hash(`${k}|home`) % 3 ? 'town' : 'seaside', town || 'Home'), toast: ['PORTRAIT', '#e0b84a'],
    t: `${n}${age ? `, ${age}` : ''}${town ? `, from ${town}` : nation ? `, ${nation}` : ''}.${job ? ` ${jobWords(job).replace(/^./, c => c.toUpperCase())}.` : ''}` });
  steps.push({ k: 'say', by: n, t: town ? `I'm ${n}. I'm from ${town}. ${pickBy(TOWN_SAYS, `${k}|t`)}` : nation ? `I'm ${n}, and I'm ${nation}. ${pickBy(TOWN_SAYS, `${k}|t`)}` : `I'm ${n}. ${pickBy(NO_TOWN, `${k}|t`)}` });
  // 2. the love life
  // (an interview answer to "would you be in a showmance?" says it after the question, or it reads as a non-sequitur)
  const romance = said(iv.showmance, 200);
  const love = o.hiding ? pickBy(HIDING, `${k}|l`) : romance ? `A romance in there? ${romance}` : pickBy(SINGLE, `${k}|l`);
  steps.push({ k: 'say', by: n, t: love });
  // 3. at work
  if (job) {
    steps.push({ k: 'say', by: n, scene: at(DECOR_OF[kind], 'At work'), t: `I'm ${article(jobWords(job))} ${jobWords(job).replace(/\.$/, '')}. ${pickBy(JOB_SAYS[kind], `${k}|j`)}` });
  }
  // 4. a life outside it
  const fun = said(iv.activities) || FUN[topStat(p, k)];
  steps.push({ k: 'say', by: n, ...(job ? {} : { scene: at('city', 'Out and about') }), t: `When I'm not working? ${fun}` });
  const words = said(iv.adjectives, 80);
  if (words) steps.push({ k: 'say', by: n, t: `Three words for me? ${words}` });
  if (o.life) steps.push({ k: 'say', by: n, t: o.life });
  // 5. why they came, and how they will play it
  steps.push({ k: 'say', by: n, scene: at('city', 'Why I came'), t: said(iv.picked) || said(iv.hopeToGet) || pickBy(o.firstSeason ? WHY.filter(w => !/since I was a kid/.test(w)) : WHY, `${k}|w`) });
  if (o.people) steps.push({ k: 'say', by: n, t: o.people });
  const motto = said(iv.motto, 140);
  if (motto) steps.push({ k: 'say', by: n, t: motto });
  if (o.how) steps.push({ k: 'say', by: n, t: o.how });
  if (o.promise) steps.push({ k: 'say', by: n, t: o.promise });
  // ...and their secret, said to the viewers at the very end (the real portraits end on it: "my secret is..."), when no
  // twist has the audience show it (the Public's Signs)
  if (o.reveal?.text) {
    steps.push({ k: 'say', by: n, t: pickBy(['And my secret? I can tell you. Not them.', "One more thing. My secret. Only you get to know it.", "Now, my secret. Promise you won't tell them."], `${k}|sec`) },
      { k: 'say', by: n, t: `${o.reveal.text}.`, card: { text: o.reveal.text, who: n } },
      { k: 'say', by: n, t: pickBy(REVEAL_AFTER[o.reveal.kind] || REVEAL_AFTER.past, `${k}|after`) });
  }
  return steps;
}
