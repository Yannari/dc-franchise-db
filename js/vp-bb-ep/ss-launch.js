// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-launch.js — Secret Story's launch night, as an episode
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-28: "launch night and prime could be a little bit bigger,
// they are important like an episode". Built on the real S14 launch
// (docs/research/secret-story-transcripts.md §1): the Voice's cold open, the
// cast in their own words, the host and the Voice talking to each other, every
// arrival as a small episode (the walk on, the audience's signs showing the
// secret to the public, the portrait in their own words, the airlock, a first
// mission), the house live between arrivals, and the list of secrets told as
// clues, never saying whose.
//
// What happens on the night is decided by js/ss/launch.js; this only airs it.
// A portrait speaks from who the character is in the game (archetype, stats,
// how they play) and the roster's age, town and job: it never invents a life.
//
// The steps' helpers come from steps.js (`H`), so the screens look like the rest.

import { launchToSpaceSteps } from './ss-groups.js';
import { portraitSteps } from './ss-portraits.js';
import { duoRel } from '../ss/duos.js';
import { roleOf } from '../ss/production.js';

const pickRot = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

const PEOPLE_THINK = {
  mastermind: ["People think I'm cold. I'm not cold, I'm just always thinking.", "People say they never know what I'm feeling. That's kind of the point."],
  schemer: ["People think I'm sweet, and I am... until I'm not.", "People trust me straight away, and honestly, that's going to be really useful in there."],
  villain: ["People think I'm trouble, and to be fair, they're usually right.", "People are a bit scared of me before I've even opened my mouth."],
  hothead: ["People think I get angry fast. I do, but it's over in two minutes, I swear.", "People say I'm a lot. I just say out loud what everybody else is thinking."],
  'challenge-beast': ["People see the muscles and think that's all there is to me.", "People think I only care about sport. I just really, really like winning."],
  'social-butterfly': ["People think I'm everybody's friend, and yeah, I kind of am. I just love people.", "People say I could make friends with anyone, and honestly, they're right."],
  'loyal-soldier': ["People think I'm quiet. I'm not quiet, I'm loyal. That's different.", "People think I'm too serious. I'm just serious about my friends."],
  wildcard: ["People never know what I'm going to do next. To be honest, neither do I.", "People can't work me out, and I kind of love that."],
  'chaos-agent': ["People say I'm a lot. And yeah, I'm a lot.", "People say nothing's ever boring when I'm around. I'll take that."],
  floater: ["People don't really notice me at first, and that's exactly how I like it.", "People forget I'm even in the room, and then suddenly I'm still there at the end."],
  underdog: ["People have always underestimated me, ever since school.", "Nobody ever bets on me, and that's never once stopped me."],
  hero: ["People think I'm way too nice for a game like this.", "People think being nice means being weak. It doesn't."],
  goat: ["People think I'm a bit lost. I'm not lost, I'm just really relaxed.", "People don't take me seriously, and that's their mistake, not mine."],
  'perceptive-player': ["People think I'm shy. I'm not shy, I'm watching.", "People think I'm not paying attention. Trust me, I'm always paying attention."],
  showmancer: ["People think I'm only here to flirt. And okay, that's partly true.", 'People say I fall in love way too easily. Maybe I do.'],
};
const HOW_I_PLAY = {
  read: "I'm going to watch everyone. How they talk about home, what they never talk about... secrets always come out in the little things.",
  provoke: "I'm going to push people until something slips out. If that makes me a few enemies, fine.",
  manipulate: "If I have to lie, I'll lie. If I have to play people, I'll do that too. It's a hundred thousand dollars, come on.",
  alliance: 'In the first few days I want a little group around me, four or five people I can actually count on.',
  social: "I'm going to get on with everybody, because people tell their secrets to the people they like.",
  loyal: "If you're my friend in there, you're my friend till the end. I don't switch sides, ever.",
  comp: "Every game the Voice gives us, I want to win it. In there, money is power.",
  float: "I'm going to stay calm, stay out of the fights, and let everyone else wear themselves out.",
  coattail: "I'll find the strongest person in the house and stay right by their side.",
  lowkey: "For the first few weeks I'm keeping my head down. The quiet ones always last the longest.",
  rise: "For the first few weeks I'm keeping my head down, and then I'm coming out of nowhere.",
};
const LIFE = ['My family is going to scream when they see me on TV.', "I've watched every single season of this show. Every one.",
  "I've never lived with this many people in my whole life.", "My friends bet I wouldn't last a week, so I've told them to get their money ready.",
  "My mum's the only one who knows I'm doing this.", "I've never kept a secret this big, for this long.",
  "I can't sleep when a room's too quiet, so I think I'll be fine in there.", "Everyone at home thinks I'll cry on the first night. I won't."];
const PROMISE = ["Voice, I promise I'll keep my secret right to the very end.", "Voice, I'm going to give you the best season you've ever had.",
  "That hundred thousand dollars? It's mine. Sorry, everybody.", "Voice, I won't let you down. I promise.",
  "I'm going to find secrets, keep mine, and win. In that order.", "I'm here to win. I didn't come for a holiday."];
const ASSET = { mental: ['my head. I notice everything', "my memory. I never forget anything anyone says"], social: ['people. I get on with everyone', 'talking. I can talk to anyone'],
  boldness: ['nerve. I say what I think', "my nerve. I'm not scared of anyone in there"], intuition: ["my instinct. It's never wrong", "my gut. I can always tell when someone's lying"],
  strategic: ['strategy. I always have a plan', 'my brain. I think three moves ahead'], physical: ['energy. I never stop', "I'm strong, and I win games"],
  endurance: ['I never give up', 'patience. I can wait as long as it takes'], loyalty: ['loyalty. My friends can count on me', 'my heart. I really care about people'],
  temperament: ['I stay calm, whatever happens', 'my calm. Nothing gets to me'] };
const SEASON_IDEA = {
  loft: 'This summer, the house is the same house. The secrets are not.',
  chalet: "This summer, the House of Secrets is twenty metres above the city. There's nowhere to run.",
  campus: 'This summer, the House of Secrets is a school. Everyone here has something to learn, and something to hide.',
  arena: 'This summer, a wall splits the House of Secrets in two, and nobody knows who is on the other side.',
  crystal: 'This summer, everything is made of glass. More than ever, beware of appearances.',
  labyrinth: 'This summer, there are rooms in this house that nobody will be told about.',
};
// every arrival answers in words of their own, no two on the night alike; every one an answer to "how are you feeling?"
const ARRIVE = ['Nervous. Excited. Mostly nervous.', "Excited. I've been waiting for this for months.", 'Ready. I think.', 'My heart is going so fast right now.',
  'Honestly? Like I could win this.', "Excited, and scared I'll say something I shouldn't.", "I feel like I might throw up, but in a good way.",
  "I've watched every season. I know what I'm doing. I hope.", 'Terrified. Is that allowed?', 'Like the luckiest person alive.',
  'Calm on the outside. Not on the inside.', "Happy. I can't wait to meet everybody.", "Hungry. I want to find every single secret in there.", 'Shaking. Look at my hands.',
  "It's like my birthday and my first day of school at the same time.", "Emotional. I promised my family I'd make them proud."];

/** The top stat a housemate would name as their biggest asset. */
const topStat = (p, i) => {
  const s = p?.stats || {};
  const keys = Object.keys(ASSET).filter(k => Number.isFinite(Number(s[k])));
  if (!keys.length) return Object.keys(ASSET)[i % Object.keys(ASSET).length];
  return keys.sort((a, b) => Number(s[b]) - Number(s[a]))[0];
};

/**
 * The arrivals in groups, as the real launch brings them on: the first alone (the privilege), then two by two, a
 * three when the numbers need it. The housemates who share a secret ALWAYS come on together (the user, 2026-10-28:
 * "why is he not with the person sharing his secret"): one reveal for the two of them, then the Voice sends them in
 * one at a time. Everybody else walks on with somebody who shares nothing with them.
 * @param {string[]} order @param {any[]} secrets @param {string} key
 */
export function arrivalGroups(order, secrets, key) {
  void key;
  const at = n => order.indexOf(n);
  // the units: a shared secret's holders together (in the Voice's order), everybody else alone
  const seen = new Set();
  /** @type {string[][]} */ const units = [];
  for (const n of order) {
    if (seen.has(n)) continue;
    const s = secrets.find(x => (x.holders || []).length > 1 && (x.holders || []).includes(n));
    const unit = s ? s.holders.filter(h => at(h) >= 0 && !seen.has(h)).sort((a, b) => at(a) - at(b)) : [n];
    for (const h of unit) seen.add(h);
    units.push(unit.length ? unit : [n]);
  }
  // the first through the door is alone: the first single
  /** @type {string[][]} */ const groups = [];
  const lead = units.findIndex(u => u.length === 1);
  if (lead >= 0) groups.push(units.splice(lead, 1)[0]);
  /** @type {string[]} */ let singles = [];
  const flush = () => { while (singles.length >= 2) groups.push(singles.splice(0, 2)); };
  for (const u of units) {
    if (u.length > 1) { flush(); groups.push(u); continue; }
    singles.push(u[0]);
    flush();
  }
  // one left over: a three with the last pair of strangers, or alone
  if (singles.length) {
    const last = groups.length > 1 && groups.at(-1).length === 2 && !secrets.some(x => (x.holders || []).length > 1 && groups.at(-1).every(h => x.holders.includes(h))) ? groups.at(-1) : null;
    if (last) last.push(singles[0]); else groups.push([singles[0]]);
  }
  return groups;
}

/** The launch night's screens. */
export function ssLaunchScreens(act, ctx, host, H) {
  const { ssv, pickBy, listOf, euros, ROSTER, ROOM_NAME, CAM, pronouns } = H;
  const k = `${ctx.week}|ssl`;
  const order = (act.arrivals || []).length ? act.arrivals : [...new Set((act.secrets || []).flatMap(s => s.holders || []))];
  const secretOf = n => (act.secrets || []).find(s => (s.holders || []).includes(n));
  // A cast entry carries only the game fields; the hometown, the job, the birthdate, the casting interview stay on the
  // franchise roster (the user, 2026-10-29: "why do they all say you'll have to guess where I'm from, I filled every
  // descriptor"), found by slug, then name, as js/ci-run.js rosterFactsOf does
  const P = n => {
    const c = (ROSTER || []).find(x => x.name === n) || {};
    const roster = /** @type {any[]} */ (Array.isArray(globalThis.FRANCHISE_ROSTER) ? globalThis.FRANCHISE_ROSTER : []);
    const r = (c.slug && roster.find(x => x.slug === c.slug)) || roster.find(x => x.name === n) || {};
    const mine = Object.fromEntries(Object.entries(c).filter(([, v]) => v != null && v !== ''));
    const out = { ...r, ...mine };
    if (!out.age && out.birthdate) { const b = new Date(out.birthdate); if (!Number.isNaN(+b)) out.age = Math.max(16, new Date().getFullYear() - b.getFullYear()); }
    return out;
  };
  // the very first season: nobody has watched it before (the user: "I've watched every season" in season one)
  const firstSeason = !act.lastSummer && Number(globalThis.seasonConfig?.seasonNumber || 1) <= 1;
  const L = act.launch || {};
  const style = n => (act.styles || {})[n] || 'social';
  const out = [];
  const base = (id, extra) => ({ id, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: 'LIVE', ...extra });
  const STUDIO = { set: 'studio-wide', room: 'The Prime Studio', cam: 1, kicker: 'Live · The Prime Studio' };

  // ── the cold open, the teaser, the host and the Voice ──
  const summer = act.lastSummer;
  /** @type {any[]} */ const open = [
    { k: 'beat', t: 'Night over the House of Secrets. Every light is off but one: the eye above the door.' },
    summer?.winner
      ? ssv(`This is the Voice. Last summer, after ${summer.season ? `season ${summer.season}` : 'a whole season'} of secrets, lies and buzzers, the public chose ${summer.winner}. ${summer.winner} won Secret Story.`, { toast: ['SECRET STORY', '#e0b84a'] })
      : ssv('This is the Voice. Tonight, for the very first time, the House of Secrets opens its doors.', { toast: ['SECRET STORY', '#e0b84a'] }),
    ssv(SEASON_IDEA[act.houseTheme] || SEASON_IDEA.loft),
    ssv('They all have a secret. Their mission: to keep it, whatever it costs. But will they manage without being unmasked?'),
  ];
  // (no teaser of the housemates before the doors open: "why do we have this at launch night, we don't even know them
  // yet", the user, 2026-10-28; they are met one by one, with their portraits)
  open.push(ssv('And above all, never forget: beware of appearances.'),
    { k: 'beat', t: 'The studio lights come up on a crowd already on its feet.', shake: true },
    { k: 'host', by: host, t: `Good evening, and welcome to the launch of Secret Story! Tonight, ${order.length} people move into the House of Secrets, and every one of them is hiding something.` },
    { k: 'host', by: host, t: "Before we meet them, let's make sure the Voice is ready. Voice, are you there?" },
    ssv(`This is the Voice. Good evening, ${host}.`),
    { k: 'host', by: host, t: 'Good evening, Voice! Are you ready for a new season?' },
    ssv('The Voice has an eye, ears, and a great many plans for this season.'),
    { k: 'host', by: host, t: "Well, you heard it. That's all we're getting for now." },
    ssv('That is all for now.'),
    { k: 'host', by: host, t: "Tonight, you at home are going to find out every secret, and they won't. Let's meet the first one." });
  out.push(base('bb-ss-launch-open', { ...STUDIO, title: 'Launch Night', label: 'Launch Night', sub: `${order.length} secrets`, cast: [], steps: open }));

  const inside = [];
  const recog = act.recognitions || [];
  const mission = kind => (L.missions || []).find(m => m.kind === kind);
  const lifeUsed = new Set();
  const code = mission('code');
  const hide = mission('hide-sign');
  // the Public's Signs (a launch-night twist, js/ss/launch.js): the audience shows each secret as they walk on; without it,
  // each housemate tells their own at the end of their portrait. (A season played before the twist was a twist: signs.)
  const signs = L.signs !== false;

  // ── the arrivals, two by two (the real S14 launch: the first alone, for the privilege; then in twos, now and
  // then a three; a pair who share a secret sometimes walk on together, wait in the airlock side by side, and are
  // sent in one at a time so the house sees nothing) ──
  const groups = arrivalGroups(order, act.secrets || [], k);
  const listed = [];          // the list of secrets read so far, in order
  const spaceSent = [];       // who has gone to the hidden space so far (js/ss/hidden-groups.js)
  const doneCk = new Set(), doneLs = new Set();
  // (a face goes on the list only once its housemate has owned it, live, to the host: the user, 2026-10-28: "why are
  // some personal secrets revealed without the scene where they revealed it to Josh from the confessional")
  const owned = new Set();
  // The two who will own theirs live, chosen now: two personal secrets kept alone, from housemates in the house before
  // the last list is read (the user: "at most two reveals of personal secrets"). Their portraits keep the secret back,
  // so the confessional is where everybody at home finds it out.
  const lastList = Math.max(0, ...(L.lists || []).map(l => l.after));
  // (in the house when the last list is read: the arrivals up to the group whose count first reaches it)
  const inByLast = new Set();
  { let c = 0; for (const g of groups) { if (c >= lastList) break; c += g.length; g.forEach(n => inByLast.add(n)); } }
  const liveOwners = new Set(order.filter(n => lastList > 0 && inByLast.has(n) && secretOf(n) && (secretOf(n).holders || []).length === 1 && !isProd(secretOf(n)))
    .sort((x, y) => hash(`${k}|own|${x}`) - hash(`${k}|own|${y}`)).slice(0, 2));
  let count = 0;
  const xs = n => (n <= 1 ? [50] : n === 2 ? [36, 64] : [28, 50, 72]);
  groups.forEach((g, gi) => {
    const kk = `${k}|g${gi}`;
    const shared = g.length >= 2 && !!secretOf(g[0]) && g.every(n => secretOf(n) === secretOf(g[0])) && (secretOf(g[0]).holders || []).length > 1;
    const youAll = g.length > 2 ? 'you three' : 'you two';
    // (a fake couple or fake family walks in together: being seen together IS their secret's cover)
    const together = shared && TOGETHER.has(String(roleOf(secretOf(g[0])) || ''));
    const they = g.length > 1 ? 'they' : (pronouns(g[0]).sub || 'they');
    const them = g.length > 1 ? 'them' : (pronouns(g[0]).obj || 'them');
    const STU = { set: 'studio-wide', plate: 'ss-studio', room: 'The Prime Studio', cam: 1, kicker: 'Live · The Prime Studio', cast: g.map((n, i) => [n, xs(g.length)[i]]) };
    const SAS = { set: 'door', plate: 'foyer', room: 'The Airlock', cam: 13, kicker: 'Live · The Airlock', cast: g.map((n, i) => [n, xs(g.length)[i]]) };
    /** @type {any[]} */ const steps = [];
    // the walk on, in the studio
    const first = gi === 0 && g.length === 1;
    steps.push({ k: 'host', by: host, scene: STU, toast: ['ARRIVING', '#e0b84a'],
      t: first ? `Please give a huge welcome to our very first housemate: ${g[0]}!` : g.length === 1 ? pickBy([`Please welcome ${g[0]}!`, `Here comes ${g[0]}!`, `Ladies and gentlemen, ${g[0]}!`], `${kk}|on`)
        : pickBy([`Our next housemates are coming down together. Please welcome ${listOf(g)}!`, `Two at a time now! Ladies and gentlemen, ${listOf(g)}!`, `Here they come: ${listOf(g)}!`], `${kk}|on`) });
    steps.push({ k: 'beat', t: g.length === 1
      ? pickBy([`${g[0]} walks down the stairs onto the set, waving at the crowd.`, `${g[0]} comes out to the music, and nearly misses the last step.`, `${g[0]} walks on, both hands over ${pronouns(g[0]).posAdj || 'their'} mouth.`], `${kk}|walk`)
      : pickBy([`${listOf(g)} come down the stairs side by side, waving at the crowd.`, `${g[0]} takes the stairs two at a time. ${g.slice(1).join(' and ')} follow${g.length > 2 ? '' : 's'}, laughing.`, `${listOf(g)} walk on to a wall of noise.`], `${kk}|walk`) });
    steps.push({ k: 'host', by: host, t: g.length === 1 ? pickBy([`${g[0]}, welcome! How are you feeling?`, `${g[0]}! Welcome to Secret Story. Nervous?`, `${g[0]}, come here. Your heart must be racing. How are you feeling?`], `${kk}|hi`)
      : pickBy([`Welcome, ${g.length > 2 ? 'all three of you' : 'both of you'}! How are you feeling?`, 'Welcome to Secret Story! Nervous?', `Look at you ${g.length > 2 ? 'three' : 'two'}. How are the nerves?`], `${kk}|hi`) });
    g.forEach((n, j) => { const t = ARRIVE[(count + j + (ctx.week || 1) * 7) % ARRIVE.length]; steps.push({ k: 'say', by: n, t: firstSeason && /every season/.test(t) ? "Excited. Nobody's ever done this before, and I'm one of the very first." : t }); });
    if (shared) steps.push({ k: 'host', by: host, t: pickBy([`Now, ${youAll} didn't arrive together by accident, did you?`, `${youAll.replace(/^./, c => c.toUpperCase())} seem very comfortable together. Interesting...`], `${kk}|pair`) },
      { k: 'say', by: g[1], t: pickBy(["We can't say anything. Not one word.", "Next question!", "No comment. Absolutely no comment."], `${kk}|pair2`) });
    // the secrets, to the public only: the audience holds up the signs
    if (signs) g.forEach((n, j) => {
      const s = secretOf(n);
      if (!s || (shared && j > 0)) return;
      const i = count + j;
      steps.push(i === 0
        ? ssv(`${n}, you're the first to enter the House of Secrets, and that's a privilege. But every privilege comes with a price. Tonight, it's the public who will reveal your secret. Right now.`)
        : { k: 'host', by: host, t: shared ? `${listOf(g)}, turn around. Everyone at home is about to find out what you're hiding.` : `${n}, turn around. Everyone at home is about to find out your secret.` },
      { k: 'beat', t: `The audience lifts its signs, all at once: "${s.text}."`, toast: ['ONLY THE PUBLIC KNOWS', '#7c5cff'], shake: i === 0 },
      { k: 'say', by: n, t: pickRot(["Yeah... that's my secret.", "Oh no. Yep, that's it.", "That's me. Nobody in there can ever know.", "Seeing it written down like that is so weird.",
        "That's mine. Please don't show that to anybody else.", "Wow. Okay. That's real now.", "Yep. That's the one thing I can't let slip."], i) });
      if (shared) steps.push({ k: 'host', by: host, t: `One secret, ${g.length > 2 ? 'three' : 'two'} of you. And nobody in that house can ever know you've met before tonight.` });
      else if ((s.holders || []).length > 1) steps.push({ k: 'host', by: host, t: `And ${n} isn't the only one keeping it. Somebody else in that house shares this secret.` });
    });
    steps.push({ k: 'host', by: host, t: `${listOf(g)}, the airlock is waiting for you. While ${they} head${g.length > 1 ? '' : 's'} over there, let's get to know ${them} a little better.` });
    // the portraits: filmed out in their lives, in their own words (where they are from, their work, their love life,
    // what they do for fun, why they came: vp-bb-ep/ss-portraits.js), never in the confessional they have not seen yet
    g.forEach((n, j) => {
      const p = P(n), i = count + j;
      const s = secretOf(n);
      const arch = p.archetype || 'social-butterfly';
      let li = (i * 3) % LIFE.length;
      while (lifeUsed.has(li) && lifeUsed.size < LIFE.length) li = (li + 1) % LIFE.length;
      lifeUsed.add(li);
      steps.push(...portraitSteps({ ...p, name: n }, i, { firstSeason, life: firstSeason && /every single season/.test(LIFE[li]) ? "I've never been on TV in my life. Not even in the background." : LIFE[li],
        hiding: !!s && s.kind === 'real-pair' && duoRel(s) === 'romance',
        people: pickRot(PEOPLE_THINK[arch] || PEOPLE_THINK['social-butterfly'], i),
        how: HOW_I_PLAY[style(n)] || HOW_I_PLAY.social, promise: pickRot(PROMISE, i),
        // (never their own secret: the list of secrets shows every one on the night without saying whose, and only the
        // ones who own theirs live put a face to one: the user, 2026-10-29. A shared or production one the Voice explains in the airlock)
        reveal: null }));
    });
    // the airlock: the host on the earpiece, the Voice's word, the door
    steps.push({ k: 'beat', scene: SAS, t: g.length === 1 ? `In the airlock, ${g[0]} puts in an earpiece and checks ${pronouns(g[0]).posAdj || 'their'} hair in the mirror.` : `In the airlock, ${listOf(g)} put in their earpieces, side by side, and check their hair in the mirror.` },
      // (a different question at each door: five arrivals asked the same one read as a form)
      { k: 'host', by: host, t: g.length === 1
        ? pickRot([`${g[0]}, can you hear me? What's going to be your biggest strength in there?`, `${g[0]}, it's me in your ear. What are you bringing into that house?`,
          `${g[0]}, can you hear me? Tell me one thing that's going to keep you in there.`, `${g[0]}, last question before the door: why will you win this?`], gi)
        : pickRot([`Can you hear me, ${g.length > 2 ? 'all of you' : 'both of you'}? Quickly: what's your biggest strength in there?`, `${g.length > 2 ? 'All of you' : 'Both of you'}, it's me in your ears. What are you bringing into that house?`,
          `Can you hear me? One answer each: why will you last in there?`, `Last question before the door. What's your secret weapon? Not your secret. Your weapon.`], gi) });
    g.forEach((n, j) => steps.push({ k: 'say', by: n, t: `${j ? '' : 'Honestly? '}${pickRot(ASSET[topStat(P(n), count + j)] || ASSET.social, count + j).replace(/^./, c => c.toUpperCase())}.` }));
    steps.push({ k: 'host', by: host, t: pickRot(["Well, we'll see if that's enough. I think the Voice has something to tell you.", "I like it. Now listen carefully, because the Voice wants a word.",
      "We'll find out soon enough. Hold on, the Voice is about to speak to you.", "Good answers. Stay right there. The Voice has something for you.", "I hope you're right. Now, quiet. The Voice is speaking."], gi) });
    // what the Voice tells the ones whose secret is a role or a tie: once per secret, to everyone in the airlock who keeps it
    const told = new Set();
    for (const n of g) {
      const s = secretOf(n);
      if (!s || told.has(s)) continue;
      const hs = (s.holders || []).filter(h => g.includes(h));
      const role = isProd(s) ? String(roleOf(s) || 'accomplice') : '';
      const tie = !role && s.kind === 'real-pair' && hs.length > 1 ? duoRel(s) : null;
      if (!role && !tie) continue;
      told.add(s);
      const you = hs.length > 1 ? listOf(hs) : n;
      if (role) steps.push(ssv(`${you}, the Voice has given you a role this summer. Your secret: "${s.text}."`, { toast: ['A PRODUCTION SECRET', '#ff3ea5'] }),
        ssv(JOB_TELL[role] || 'Play it every day, and nobody may ever know the Voice is behind it.'),
        ssv(`Nobody in that house may ever know the Voice is behind ${hs.length > 1 ? 'the two of you' : 'you'}.`));
      else steps.push(ssv(`${you}, the Voice knows your secret: "${s.text}."`, { toast: ['A SHARED SECRET', '#7c5cff'] }), ssv(TIE_TELL[tie] || TIE_TELL.friends));
      steps.push({ k: 'say', by: hs[0], t: pickBy(hs.length > 1 ? ["Understood, Voice.", "We won't let you down.", "Got it. Not a word."] : ["Understood, Voice.", "I won't let you down.", "Got it. Not a word."], `${kk}|tell|${n}`) });
      if (hs.length > 1) steps.push({ k: 'beat', t: pickBy([`${hs[1]} looks at ${hs[0]}, and nods.`, `${hs[0]} and ${hs[1]} share one look, and that's the last one for a while.`], `${kk}|look|${n}`) });
    }
    // the first missions (js/ss/launch.js)
    for (const n of g) {
      if (hide && hide.who === n) steps.push(ssv(`${n}, the Voice has played a little trick on you. The signs are gone, all except one. Somewhere in the house, there's still a sign with your secret written on it.`),
        ssv("Find it, take it down and hide it before the next housemate walks in. You've got a few minutes.", { toast: ['FIRST MISSION', '#e0b84a'] }));
      if (code && code.who === n) steps.push(ssv(`${n}, here is your first mission. A key is waiting for you in locker number four in the laundry. The code is four numbers: ${code.from[0]}'s shoe size, then the number of eggs in the pantry.`),
        ssv(`Only ${listOf(code.from)} can help you, and they mustn't find out why.`, { toast: ['FIRST MISSION', '#e0b84a'] }));
    }
    if (shared && !together) steps.push(ssv(`${listOf(g)}, to keep anybody from suspecting a thing, you will not walk in together. ${g[0]}, you go in first. ${listOf(g.slice(1))}, you wait here.`),
      { k: 'beat', t: `${g[1]} squeezes ${g[0]}'s hand once, and lets go.`, tense: [g[0], g[1]] });
    else if (together) steps.push(ssv(`${listOf(g)}, you will walk in together. From the very first second, the house has to believe it.`));
    const goers = shared && !together ? [g[0]] : g;
    // a hidden group (js/ss/hidden-groups.js): its members go to their space, not into the house
    const away = new Set(act.group?.members || []);
    const inHouse = goers.filter(n => !away.has(n));
    const toSpace = goers.filter(n => away.has(n));
    if (inHouse.length) steps.push(ssv(`${listOf(inHouse)}, you may now enter the House of Secrets. That is all for now.`));
    // in: the house, live
    const enter = (who, alone) => {
      const here = [...inside];
      const HOUSE = { set: 'ceremony', plate: 'living-sofas', room: 'Living Room', cam: 4, kicker: 'Live · The House', cast: [...here.slice(-4), ...who].map((n, i, a) => [n, a.length === 1 ? 50 : Math.round(14 + 72 * i / (a.length - 1))]) };
      steps.push({ k: 'beat', scene: HOUSE, t: who.length === 1 ? pickBy([`The door opens. ${who[0]} steps into the House of Secrets.`, `${who[0]} walks through the airlock and into the house.`, `${who[0]} takes a breath, and goes in.`], `${kk}|in|${who[0]}`)
        : pickBy([`The door opens. ${listOf(who)} step into the House of Secrets together.`, `${listOf(who)} walk through the airlock and into the house, screaming.`], `${kk}|in`) });
      if (!here.length) { steps.push({ k: 'say', by: who[0], t: pickBy(["It's beautiful. It's so pink. I don't trust it at all.", "There's nobody here. It's just me and a house full of secrets."], `${kk}|alone`) }); return; }
      for (const n of who) {
        const met = recog.filter(r => r.whom === n && here.includes(r.who));
        if (met.length) for (const r of met) steps.push({ k: 'say', by: r.who, t: `Wait. Aren't you from ${r.from}?`, tense: [r.who, n] },
          { k: 'dr', by: n, t: pickBy(['Two minutes in, and somebody already knows who I am.', 'I hoped nobody in here would recognise me.', 'If they know where I am from, they are one step closer to my secret.'], `${kk}|rec|${n}`) });
        const partner = secretOf(n) && (secretOf(n).holders || []).find(x => x !== n && here.includes(x));
        if (partner) steps.push({ k: 'beat', t: `${partner} shakes ${n}'s hand like they have never met.`, tense: [n, partner] },
          { k: 'dr', by: partner, t: pickBy([`I have to act like I don't know ${n}. That is going to be the hardest part.`, `${n} walked in and I didn't even blink. I'm proud of that.`], `${kk}|pair|${n}`) });
      }
      if (!alone) steps.push({ k: 'beat', t: pickBy([`${here[here.length - 1]} is first to the door with a hug.`, 'The ones already inside cheer.', `${listOf(who)} shake${who.length > 1 ? '' : 's'} hands with everybody, one at a time.`, `${listOf(here.slice(-2))} ${here.length > 1 ? 'pretend' : 'pretends'} to have been there for years.`], `${kk}|greet|${who[0]}`) });
    };
    if (inHouse.length) { enter(inHouse, false); inside.push(...inHouse); }
    if (toSpace.length) { steps.push(...launchToSpaceSteps(act.group, toSpace, H, kk, spaceSent)); spaceSent.push(...toSpace); }
    if (hide && inHouse.includes(hide.who)) steps.push({ k: 'beat', t: `${hide.who} runs off and starts opening every door.` },
      { k: 'beat', t: hide.ok ? `${hide.who} finds it in the pantry, tears it into pieces, and pushes the pieces under a mattress just in time.` : `${hide.who} finds it, rips it in half, and stuffs it behind a cushion. Half the words are still showing.` });
    if (shared && !together) for (const n of g.slice(1)) {
      steps.push({ k: 'beat', scene: SAS && { ...SAS, cast: [[n, 50]] }, t: `Back in the airlock, ${n} waits alone, counting to a hundred.` },
        ssv(`${n}, you may now enter the House of Secrets. That is all for now.`));
      enter([n], false);
      inside.push(n);
    }
    if (code && g.includes(code.who) && inside.includes(code.who) && inside.includes(code.from[0])) steps.push({ k: 'say', by: code.who, t: `${code.from[0]}, random question. What shoe size are you?` },
      { k: 'say', by: code.from[0], t: pickBy(['Why do you want to know that?', "That's the weirdest first question anyone's ever asked me."], `${kk}|shoe`) },
      { k: 'beat', t: code.ok ? `${code.who} laughs it off, gets the number, and counts the eggs while making tea. The locker opens. ${euros(code.reward)} for the kitty.` : `${code.who} gets the shoe size, miscounts the eggs, and the locker stays shut.` });
    count += g.length;
    out.push(base(`bb-ss-launch-arr-${gi + 1}`, { ...STU, sceneful: true, kicker: `Live · Arrival ${gi + 1} of ${groups.length}`,
      title: listOf(g), label: `Arrival ${gi + 1}`, sub: g.length > 1 ? `${g.length} housemates` : 'Arriving', steps }));

    // the house, live, between arrivals
    for (const c of (L.checkins || []).filter(x => x.after <= count && !doneCk.has(x))) {
      doneCk.add(c);
      if (c.who.some(n => !inside.includes(n))) continue;
      out.push(base(`bb-ss-launch-house-${count}-${c.kind}`, { set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony, kicker: 'Live · In the house', ...checkin(c, H, host, firstSeason) }));
    }
    // the list of secrets: the HOST reads it (the user, 2026-10-28), on the show's own board, never saying whose. Each
    // secret is shown on its own card first, then joins the board (2026-10-29: "they have to reveal each secret 1 by 1
    // during launch night with a presentation"); a face goes up only when its housemate owns it, live, from the confessional
    // (two lists due after the same arrival are one list, not two screens in a row)
    const due = (L.lists || []).filter(x => x.after <= count && !doneLs.has(x));
    due.forEach(x => doneLs.add(x));
    for (const l of due.length ? [{ after: Math.max(...due.map(x => x.after)), secrets: due.flatMap(x => x.secrets || []) }] : []) {
      // the board, five rows: the secret being owned right now, the ones read tonight (newest first), the faces already
      // owned, then the rest of the list. A face only beside a secret its housemate has owned on air.
      const whoOf = sx => (sx.holders || []).find(h => owned.has(h)) || null;
      const full = sx => secretOf((sx.holders || [])[0]) || (act.secrets || []).find(x => x.text === sx.text) || sx;
      const rowsNow = (fresh, now = null) => {
        const pool = [...(now ? [now] : []), ...fresh.slice().reverse(), ...listed.map(full).filter(sx => whoOf(sx)), ...listed.slice().reverse()].map(full);
        const seen = new Set();
        return pool.filter(sx => sx && !seen.has(sx.text) && seen.add(sx.text)).slice(0, 5)
          .map(sx => ({ text: sx.text, who: whoOf(sx), new: (now && sx.text === now.text) || fresh.some(f => f.text === sx.text) }));
      };
      const lk = `${kk}|ls${l.after}`;
      /** @type {any[]} */ const ls = [{ k: 'host', by: host, t: pickBy(["It's time for the list of secrets! Let's find out what they're hiding in there.", "And now, the moment you've all been waiting for: the list of secrets!", "Let's take a look at the famous list of secrets."], `${lk}|ls`), toast: ['THE LIST OF SECRETS', '#7c5cff'],
        secretlist: { rows: rowsNow([]) } }];
      if (!listed.length) ls.push({ k: 'host', by: host, t: "Here's how it works. Every secret in that house goes up on this list tonight, one at a time. What we won't tell you is whose it is. That part is your job." });
      const fresh = [];
      l.secrets.forEach((sx, j) => {
        const no = listed.length + j + 1;
        // the card: the secret on its own, read out by the host
        ls.push({ k: 'host', by: host, secretlist: { rows: rowsNow(fresh), show: { no, text: sx.text, pair: !!sx.pair } },
          t: sx.pair ? pickRot([`Secret number ${no}, and this one is shared. Two of our housemates are hiding it together: "${sx.text}."`, `Secret number ${no}. Two people in that house are keeping this one between them: "${sx.text}."`], no)
            : pickRot([`Secret number ${no}. One of our housemates, man or woman, is hiding this: "${sx.text}."`, `Here's secret number ${no}: "${sx.text}."`, `Secret number ${no}. Somebody in that house is keeping this: "${sx.text}."`, `Number ${no}: "${sx.text}."`], no + gi) });
        fresh.push(sx);
        // ...and onto the board, with a clue for the viewers when the Voice has hidden one
        ls.push({ k: 'host', by: host, secretlist: { rows: rowsNow(fresh) },
          t: (sx.clues || [])[0] ? `A little clue for you at home: hidden somewhere in the house, ${sx.clues[0]}.`
            : pickRot(['Somebody in there is sitting on that one right now.', 'Have a think about who that could be.', 'Remember that one. It matters later.', "That one's going to be hard to keep."], no) });
      });
      listed.push(...fresh);
      // one or two of the ones already inside own theirs, live from the confessional (a personal secret kept alone, already
      // on the list): the first of the night's two who is in the house with theirs read by now; the last list takes the rest.
      // Set up by the host first (the user, 2026-10-29: "secret revealed need a setup by the host not just dive direct in
      // it... josh is an host make him act like it")
      const isLast = l.after >= lastList;
      const allIn = count >= order.length;
      const onList = new Set(listed.map(x => x.text));
      const owners = inside.filter(n => liveOwners.has(n) && !owned.has(n) && (signs || onList.has(secretOf(n)?.text))).slice(0, isLast ? 2 : 1);
      owners.forEach((n, oi) => {
        const sx = secretOf(n);
        const kind = sx.secretKind || sx.kind;
        const story = KIND_STORY[kind] || KIND_STORY.past;
        const live = t => ({ k: 'dr', by: n, live: true, t });
        const ok = `${kk}|own|${n}`;
        const setup = oi > 0 || owned.size
          ? pickBy([[`And we're not finished. Another housemate has asked to talk to us from the confessional.`, `One more secret on this list is about to get a face. Nobody in the house knows ${pronouns(n).sub || 'they'}${pronouns(n).sub === 'they' ? "'re" : "'s"} gone.`],
            ['Stay with me, because it happens again.', `A second housemate is going to own a secret tonight, live. And this one, I did not see coming.`]], `${ok}|set`)
          : pickBy([[allIn ? 'Now, before we leave them for the night, something special.' : 'Now, before anybody else walks in, something special.', 'One of the housemates already in that house has agreed to do something very brave tonight: tell you, live, which of these secrets is theirs.', "And don't worry: nobody in the house can hear a word of this."],
            ['Stay with me, because this next part is big.', 'Somebody in that house is about to own one of these secrets, live, in front of the whole country.', 'The others think they just went to fix their microphone.']], `${ok}|set`);
        ls.push({ k: 'host', by: host, t: setup[0], toast: ['LIVE · THE CONFESSIONAL', '#ff3ea5'], secretlist: { rows: rowsNow([]) } });
        for (const line of setup.slice(1)) ls.push({ k: 'host', by: host, t: line });
        ls.push({ k: 'beat', t: pickBy([`The giant screen behind ${host} cuts to the confessional. ${n} is on the sofa, earpiece in, hands clasped tight.`, `The lights in the studio drop. On the screen: the confessional, and ${n}, sitting very straight.`], `${ok}|cut`), shake: true },
          { k: 'host', by: host, t: pickBy([`${n}, it's ${host}. You're live. Can you hear me?`, `${n}! It's ${host}, and we're live. Can you hear me?`], `${ok}|ask`) },
          live(pickBy(["I can hear you! Hi! Hi, everybody!", "Loud and clear. My heart's going a hundred miles an hour."], `${ok}|hi`)),
          { k: 'host', by: host, t: 'One of the secrets on this list is yours. Take your time. Tell everybody at home: which one?', secretlist: { rows: rowsNow([], sx) } },
          { ...live(pickBy([`That one. "${sx.text}."`, `It's that one. "${sx.text}." Wow. Seeing it up there.`], `${ok}|own`)), owns: true });
        owned.add(n);
        // the list, updated: the secret has a face now
        ls.push({ k: 'beat', t: `${n}'s face goes up on the list, next to it. The studio erupts.`, secretlist: { rows: rowsNow([], sx) }, toast: ['SECRET OWNED', '#ff3ea5'] },
          { k: 'host', by: host, t: pickBy(['Okay, you have to tell us. How does that happen to somebody?', 'Wow. Tell us the story. How did that happen?'], `${ok}|how`) },
          live(pickBy(story, `${ok}|story`)),
          { k: 'host', by: host, t: 'And who knows about it, back home?' },
          live(pickBy(KNOWS, `${ok}|knows`)),
          { k: 'host', by: host, t: 'And in there? Why keep it at any price?' },
          live(pickBy(WHY_KEEP, `${ok}|why`)),
          { k: 'host', by: host, t: pickBy([`Thank you, ${n}. Good luck keeping that one all summer.`, `There it is, everybody: ${n}'s secret, on the list. Good luck, ${n}.`], `${ok}|got`), secretlist: { rows: rowsNow([], sx) } });
      });
      ls.push({ k: 'host', by: host, t: listed.length >= (act.secrets || []).length ? `That's every secret in the house, all ${listed.length} of them. Who's hiding what? You've got all summer to work it out.`
        : `That's ${l.secrets.length} more on the list. Who's hiding what? You've got all summer to work it out.`, secretlist: { rows: rowsNow([]) } });
      out.push(base(`bb-ss-launch-list-${count}`, { ...STUDIO, title: 'The List of Secrets', label: 'List of Secrets', sub: `${l.secrets.length} secrets`, cast: [], steps: ls }));
    }
  });
  return out;
}

// THE AIRLOCK: what the Voice tells the ones whose secret is not their own life (the user, 2026-10-29: "you should add
// an explanation of each of their production or shared secret in the airlock, and if necessary they don't enter at the
// same time, not to raise suspicion"). What the role asks of them, every week, in plain words.
const JOB_TELL = {
  accomplice: 'All summer, the Voice will give you orders. You carry them out in secret, and every order you complete pays your kitty.',
  'fake-couple': 'From the moment you walk in, you are a couple. Sit together, sleep side by side, argue and make up. The whole house has to believe it.',
  'public-couple': 'The public chose the two of you. In there, you are a couple, and the whole house has to believe it.',
  'fake-siblings': 'From the moment you walk in, you are family. Learn each other\'s lives by heart: the house will test you.',
  'public-family': 'The public chose the two of you. In there, you are family, and the whole house has to believe it.',
  enemies: 'In there, you cannot stand each other. Fight in front of everybody. In private, you are allies, and nobody may ever see it.',
  chosen: 'The Voice will whisper you tips all summer, and once, when you need it most, you will be safe from the nominations.',
  tunnels: 'The walls of this house are hollow. You will find the way in, and you will listen.',
  'house-key': 'You carry part of the secret of the house itself. Keep it, and nobody may ever know you have it.',
  'access-code': 'You carry part of the secret of the house itself. Keep it, and nobody may ever know you have it.',
  protector: 'There is a real couple in that house. Keep their secret safe as if it were yours, without them ever knowing.',
  saboteur: 'All summer, you will send the hunters the wrong way. A false clue here, a wrong guess there.',
  spy: 'You will film the private moments of this house for the public. Never get caught with the camera.',
  oracle: 'A hidden phone is waiting for you somewhere in the house, and a lock to find. Nobody may see you use it.',
  guardians: 'All summer, you will tell the Voice, week after week, who the biggest liar in the house is.',
};
const TIE_TELL = {
  romance: 'In there, you have never met. No looks, no touching, no sitting together at dinner. One slip, and the whole house will be hunting the two of you.',
  family: 'In there, you are strangers. Different towns, different lives. And never, ever defend each other too fast.',
  friends: 'In there, you have never met. No old jokes, no nicknames, no stories from before.',
};
// a production secret, on the launch record (an old save's copy has no source: its kind says it)
const isProd = s => !!s && (s.source === 'production' || /^voice-/.test(String(s.kind || '')));
// a pair whose cover IS being seen together walks in together; every other pair walks in apart
const TOGETHER = new Set(['fake-couple', 'public-couple', 'fake-siblings', 'public-family']);
// THE CONFESSIONAL, LIVE (the user, 2026-10-29: "a secret revealed at the confessional is more than one line: a back and
// forth between the host and the candidate, then a good explanation of their personal secret, and at most two
// reveals of personal secrets"): the story of a secret, by its kind, in their own words
const KIND_STORY = {
  survived: ["It happened so fast. One minute it was a normal day, and the next I didn't know if I'd see the end of it. I did. A lot of people didn't believe it.",
    "I still don't really know how I came out of it. People call it a miracle. I just call it the day everything changed."],
  talent: ["I've been doing it since I was a kid. Hours a day. Most people who know me have no idea, and that's how I like it.",
    "It started as a party trick, and then it got serious. Really serious. It's taken me all over the place."],
  record: ["I trained for years for it. Years. And when it finally happened, I told almost nobody. It felt like mine.",
    "It sounds ridiculous when I say it out loud. But I worked harder for that than for anything else in my life."],
  job: ["People hear what I do, and they look at me differently straight away. So I stopped telling people.",
    "It's not the kind of job you put on a dating profile. But I'm good at it, and I'm proud of it."],
  body: ["You'd never know it, looking at me. That's the point. It's part of me, but it's not all of me.",
    "It's taken me a long time to be okay with it. I am now. I just don't want it to be the first thing people know."],
  family: ["It's my family's story as much as mine. Growing up, it was just normal to us. It's only when you tell people that you realise it isn't.",
    "I only really understood it when I was older. It explains a lot about me, honestly."],
  past: ["That was another life. I'm not the same person now, but it made me who I am.",
    "I don't hide it because I'm ashamed. I hide it because people stop seeing anything else."],
  belief: ["People laugh at first. Everybody does. Then they hear the whole story, and they stop laughing.",
    "I know how it sounds. I've heard every joke. It's still true."],
  love: ["It's the most romantic thing that ever happened to me, and the most ridiculous. Both at once.",
    "When I tell people, they think I'm making it up. I'm not. That's my love life."],
  money: ["Money changes the way people look at you. Overnight. I learned that the hard way.",
    "It sounds like a dream, and in a way it is. But it comes with a lot of strings."],
};
const KNOWS = ['My family knows. My two best friends. And now, everybody at home.', 'Nobody. Not even my best friend. Until right now.',
  'My mum, and that\'s it. She\'s going to scream at the TV.', 'A few people back home. They\'ve all been sworn to secrecy.'];
const WHY_KEEP = ["Because if they find it, they take my kitty. And because it's mine. They have to earn it.",
  "Because the second they know it, that's all they'll ever see when they look at me.",
  "Because it's worth money in there, and I'm not handing anybody money on day one.",
  "Because I want them to meet me first. Then they can find the rest, if they're good enough."];

// the production pair's story, agreed in the bathroom with the taps running (the user: "that's our plan, that's how
// we're going to play this, do you know where I'm from if they ask? remember this")
const PLAN = {
  couple: [["Okay. We met at a friend's party, two years ago. Say it back.", "A friend's party, two years ago. And who said 'I love you' first?", 'You did.', 'Obviously I did.'],
    ["We've been together a year. We met at work. Got it?", "A year, at work. Do I like your mum?", "You love my mum.", "Great. I love your mum."]],
  family: [["Our mum's name is Sandra, and we grew up by the sea. Say it back.", "Sandra, the sea. Who's the oldest?", 'Me. Always me.', "Fine. But I'm the favourite."],
    ["We had a dog called Biscuit. We shared a bedroom until we were twelve.", "Biscuit. Twelve. Who got the top bunk?", 'Me.', "That's a lie, and I'll be saying it all summer."]],
  enemies: [['First fight is tomorrow, at lunch. Make it loud.', 'And tonight?', "Tonight we don't even look at each other.", "Easy. I didn't like your shoes anyway."]],
  other: [["We don't know each other. We've never spoken. Got it?", 'Then when do we talk?', 'When the Voice says so. Not before.', 'Fine by me.'],
    ["In there, we're strangers. Not friends, not enemies. Strangers.", "Strangers. Do I at least get to say hello?", 'Once. Politely.', 'Politely. I can do politely.']],
};
// a real tie hides that it is one: a couple, a family, two friends (js/ss/duos.js)
PLAN.hide = [["In there, we've never met. Not one look, not one touch.", 'Not even a hug goodnight?', 'Not even that. Not until this is over.', "That's going to be the hardest part of the whole game."],
  ["If anybody asks, I don't know you. I've never seen you before tonight.", 'And if I miss you?', 'Then you miss me from the other side of the room.', 'From the other side of the room. Okay.']];
PLAN['hide-kin'] = [["We've never met. Different towns, different lives. Got it?", 'And if I call you by your nickname?', "You won't.", "I'll try not to."],
  ["In there, I'm a stranger to you. Don't stick up for me, whatever happens.", 'Even if they go after you?', 'Especially then.', 'That one is going to be hard.']];
const PLAN_OF = { 'fake-couple': 'couple', 'public-couple': 'couple', 'fake-siblings': 'family', 'public-family': 'family', enemies: 'enemies', hide: 'hide', 'hide-kin': 'hide-kin' };
const ROLE_CALL = {
  accomplice: "I do whatever the Voice asks. Nobody can ever see me do it.", spy: "Everything private in there is going to end up out here. Sorry, everybody.",
  saboteur: "I'm going to make them chase the wrong things all summer.", oracle: 'I know something about this house that nobody else knows. That is power.',
  'house-key': 'I know something about this house that nobody else knows. That is power.', 'access-code': 'I know something about this house that nobody else knows. That is power.',
  protector: "There's a couple in there I have to protect, and they don't even know I exist yet.", chosen: 'The Voice picked me. I am going to deserve it.',
  guardians: 'Every liar in that house, I am going to find.', tunnels: 'I am going to hear every single thing they say.',
};

/** One live check-in on the house (js/ss/launch.js `checkins`). */
function checkin(c, H, host = 'Josh', firstSeason = false) {
  const { pickBy } = H;
  const [a, b, x] = c.who;
  const kk = `ssl|ck|${c.after}|${a}|${b}`;
  /** @type {any[]} */ let steps;
  if (c.kind === 'plan') {
    const [l1, l2, l3, l4] = pickBy(PLAN[PLAN_OF[c.role] || 'other'], kk);
    const all = c.who.join(', ').replace(/, ([^,]*)$/, ' and $1');
    steps = [
      { k: 'beat', t: `In the bathroom, the taps running to cover their voices, ${all} finally have a minute alone.`, tense: [a, b] },
      { k: 'say', by: a, t: l1 }, { k: 'say', by: b, t: l2 }, { k: 'say', by: a, t: l3 }, { k: 'say', by: b, t: l4 },
      { k: 'say', by: b, t: 'Wait. Where am I from, if they ask?' },
      { k: 'say', by: a, t: pickBy(['Somewhere boring. Nobody asks twice about somewhere boring.', 'Near the coast. Then change the subject.'], `${kk}|from`) },
      { k: 'say', by: a, t: "Remember this. That's our plan, that's how we play this, whatever happens." },
      { k: 'beat', t: pickBy(['Somebody knocks on the door. "Are you two done in there?"', 'The door handle turns. They both jump, and turn the taps off.'], `${kk}|knock`) }];
    return { title: 'The Plan', label: 'The Plan', sub: all, set: 'bathroom', plate: 'bathroom', room: 'Bathroom', cam: 9, kicker: 'Live · The bathroom', cast: c.who.map((n, i, w) => [n, w.length === 1 ? 50 : Math.round(30 + 40 * i / (w.length - 1))]), steps };
  }
  if (c.kind === 'role-call') {
    steps = [
      { k: 'host', by: host, t: `Let's go to the confessional, live. ${a}, the public knows your secret: "${c.text}." How are you going to play it?` },
      { k: 'dr', by: a, live: true, t: ROLE_CALL[c.role] || 'Nobody in there can find out what I really am.' },
      { k: 'host', by: host, t: pickBy(['We will be watching. Good luck.', 'The whole country is in on it now. Good luck.'], `${kk}|rc`) }];
    return { title: 'Live in the Confessional', label: 'Live Call', sub: a, cast: [[a, 50]], steps };
  }
  if (c.kind === 'crush') steps = [
    { k: 'beat', t: pickBy([`${a} and ${b} end up on the same sofa, a little closer than they need to be.`, `${a} offers ${b} the last glass of champagne. ${b} takes it, and stays.`], kk), tense: [a, b] },
    { k: 'say', by: a, t: "So what do you do, when you're not locked in a house?" },
    // (an answer and its reply, kept together)
    ...pickBy([[["I'll tell you tomorrow. If you're still talking to me.", "I'll still be talking to you."]], [["Right now? Trying not to stare at you.", 'Okay. You can stare a bit.']]], `${kk}|2`)
      .map(([q, r]) => [{ k: 'say', by: b, t: q }, { k: 'say', by: a, t: r }]).flat(),
    { k: 'beat', t: 'Across the room, somebody notices, and grins into their glass.' }];
  else if (c.kind === 'clash') steps = [
    ...pickBy([['Are you going to talk this loud all summer?', 'Are you going to complain all summer?', "I'm just asking."],
      ['Did you just take my glass?', "It's a glass. There are forty of them.", "That's not the point and you know it."]], kk)
      .map((line, i) => ({ k: 'say', by: i % 2 ? b : a, t: line })),
    { k: 'beat', t: 'Three hours in, and the house has its first argument. Everybody pretends not to listen.', tense: [a, b] },
    { k: 'say', by: x || b, t: x ? pickBy(['Okay. Okay. Day one, guys.', 'Can we at least wait until everybody is in?'], `${kk}|x`) : "Fine. Let's leave it." }];
  else if (c.kind === 'slip') steps = [
    ...pickBy([["When I was working at the... never mind.", 'At the what?'], ["My family always says I'm the one who... no. Forget it.", 'The one who what?']], kk)
      .map((t, i) => ({ k: 'say', by: i ? b : a, t })),
    { k: 'say', by: a, t: "Nothing. Long day. Where's the wine?" },
    { k: 'beat', t: `${b} doesn't push it. ${b} doesn't forget it either.`, tense: [a, b] }];
  else if (c.kind === 'live') steps = [
    { k: 'beat', t: `${a} finds the nearest camera and waves at it with both hands.` },
    { k: 'say', by: a, t: "Hi Mum! We're live! I'm fine!" },
    { k: 'say', by: b, t: "They can't answer you, you know." },
    { k: 'say', by: a, t: "She can hear me. That's enough." },
    { k: 'beat', t: `For a second, ${x ? `${b} and ${x}` : b} wave${x ? '' : 's'} at the cameras too.` }];
  else if (c.kind === 'tour') steps = [
    { k: 'beat', t: `${b} shows ${a} round the house.` },
    { k: 'say', by: b, t: "That's the confessional. The red button in there is the buzzer." },
    { k: 'say', by: a, t: "Already? I've been here two minutes." },
    { k: 'say', by: b, t: "Don't press it on day one, it's five thousand dollars." },
    { k: 'dr', by: a, t: pickBy(["The house is beautiful. I don't trust it at all.", 'Everything in here is pink, and everything in here is watching you.'], kk) }];
  else if (c.kind === 'beds') steps = c.clash ? [
    { k: 'say', by: a, t: "I'm taking the bed in the middle." },
    { k: 'say', by: b, t: "No, you're not, my bag's already on it." },
    { k: 'say', by: a, t: "Your bag isn't you, though." },
    { k: 'beat', t: 'The first argument of the season, and nobody has unpacked.', tense: [a, b] },
    { k: 'dr', by: b, t: `${a} wants the middle bed. So do I. That tells you everything about ${a}.` }] : [
    { k: 'say', by: a, t: 'Which bed is free?' },
    { k: 'say', by: b, t: "Not the middle one, that one's mine." },
    { k: 'say', by: a, t: 'Why the middle?' },
    { k: 'say', by: b, t: 'From the middle you hear everything. Both sides of the room.' },
    { k: 'dr', by: a, t: `${b} picked a bed for strategy. On the first night. Okay, noted.` }];
  else if (c.kind === 'intro') steps = [
    { k: 'say', by: a, t: `Hi! I'm ${a}.` },
    { k: 'say', by: b, t: `${b}. Where are you from?` },
    { k: 'say', by: a, t: 'Not far. You?' },
    { k: 'say', by: b, t: "Far enough. Come in, sit down, we've got wine." },
    { k: 'dr', by: b, t: pickBy([`First impression of ${a}: warm. Maybe too warm.`, `I like ${a} already. That is either a good sign or a very bad one.`], kk) }];
  else if (c.kind === 'explain') {
    const fan = c.fan || b;
    const other = c.who.find(n => n !== fan) || a;
    steps = [
      { k: 'say', by: fan, t: "Okay, so, that's the wall of clues. Every week the Voice puts up clues about our secrets." },
      { k: 'say', by: other, t: 'About our secrets? Like, mine too?' },
      { k: 'say', by: fan, t: "Everyone's. Check it every single morning." },
      { k: 'dr', by: other, t: firstSeason ? `${fan} read every rule twice before we even got here, so I'm sticking very close to ${fan}.` : `I've never watched the show, and ${fan} has seen every season, so I'm sticking very close to ${fan}.` }];
  } else if (c.kind === 'wall') steps = [
    { k: 'beat', t: `${[a, b, x].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1')} stand in front of the empty wall of clues.` },
    { k: 'say', by: a, t: 'Is one of these going to be about me?' },
    { k: 'say', by: b, t: "Don't stare at it like that, people will notice." },
    ...(x ? [{ k: 'say', by: x, t: "Everyone's staring at it like that." }] : [])];
  else steps = [
    { k: 'say', by: a, t: 'Somebody is coming. Quick, hide!' },
    { k: 'beat', t: `${[a, b, x].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1')} squeeze behind the sofa.` },
    { k: 'say', by: b, t: 'This is ridiculous.' },
    { k: 'say', by: a, t: "Shh. It's tradition." }];
  return { title: 'Live in the House', label: 'In the House', sub: c.who.join(', '), cast: c.who.map((n, i) => [n, 30 + i * 22]), steps };
}
