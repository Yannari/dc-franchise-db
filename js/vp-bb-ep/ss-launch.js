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

const pickRot = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

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
const TEASER = { read: "I'm going to watch every single one of them.", provoke: "I'm going to shake that house up.", manipulate: "Lying, betraying, manipulating... that's the game I love.",
  alliance: 'I want my little family in there, and fast.', social: "Everybody's going to love me. That's the plan.", loyal: 'My friends, I protect. Everyone else? Good luck.',
  comp: "Every game, I'm winning it.", float: "They won't even see me coming.", coattail: "I'll find the strongest one and stick to them.", lowkey: "They won't even see me coming.", rise: "They won't even see me coming." };
const SEASON_IDEA = {
  loft: 'This summer, the house is the same house. The secrets are not.',
  chalet: "This summer, the House of Secrets is twenty metres above the city. There's nowhere to run.",
  campus: 'This summer, the House of Secrets is a school. Everyone here has something to learn, and something to hide.',
  arena: 'This summer, a wall splits the House of Secrets in two, and nobody knows who is on the other side.',
  crystal: 'This summer, everything is made of glass. More than ever, beware of appearances.',
  labyrinth: 'This summer, there are rooms in this house that nobody will be told about.',
};
// every arrival answers in words of their own: no two on the night alike
const ARRIVE = ['Nervous. Excited. Mostly nervous.', "I've been waiting for this for months.", 'Ready. I think.', 'My heart is going so fast right now.',
  'Honestly? I just want to win.', 'I just want to have fun and keep my mouth shut.', "I feel like I might throw up, but in a good way.",
  "I've watched every season. I know what I'm doing. I hope.", 'Terrified. Is that allowed?', 'Like the luckiest person alive.',
  'Calm on the outside. Not on the inside.', "I can't wait to meet everybody.", "I'm going to find every single secret in there.", 'Shaking. Look at my hands.',
  "It's like my birthday and my first day of school at the same time.", 'I promised my family I would make them proud.'];
const NTH = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth'];

/** The top stat a housemate would name as their biggest asset. */
const topStat = (p, i) => {
  const s = p?.stats || {};
  const keys = Object.keys(ASSET).filter(k => Number.isFinite(Number(s[k])));
  if (!keys.length) return Object.keys(ASSET)[i % Object.keys(ASSET).length];
  return keys.sort((a, b) => Number(s[b]) - Number(s[a]))[0];
};

/**
 * The arrivals in groups, as the real launch brings them on: the first alone (the privilege), then two by two, a
 * three when the numbers need it. A pair who share a secret come on together about half the time.
 * @param {string[]} order @param {any[]} secrets @param {string} key
 */
export function arrivalGroups(order, secrets, key) {
  const h = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const partnerOf = n => { const s = secrets.find(x => (x.holders || []).includes(n) && (x.holders || []).length === 2); return s ? s.holders.find(x => x !== n) : null; };
  const rest = order.slice(1);
  /** @type {string[][]} */ const groups = order.length ? [[order[0]]] : [];
  while (rest.length) {
    const x = rest.shift();
    const p = partnerOf(x);
    if (p && rest.includes(p) && h(`${key}|${x}|${p}`) % 2 === 0) { rest.splice(rest.indexOf(p), 1); groups.push([x, p]); continue; }
    // (never split a partner off from a pair that is about to come on together)
    const y = rest.find(z => !(partnerOf(z) && rest.includes(/** @type {string} */ (partnerOf(z))) && partnerOf(z) !== x && h(`${key}|${z}|${partnerOf(z)}`) % 2 === 0));
    if (y && rest.length !== 2) { rest.splice(rest.indexOf(y), 1); groups.push([x, y]); }
    else if (rest.length === 2) { groups.push([x, ...rest.splice(0)]); }
    else groups.push([x]);
  }
  return groups;
}

/** The launch night's screens. */
export function ssLaunchScreens(act, ctx, host, H) {
  const { ssv, pickBy, listOf, euros, ROSTER, ROOM_NAME, CAM, pronouns } = H;
  const k = `${ctx.week}|ssl`;
  const order = (act.arrivals || []).length ? act.arrivals : [...new Set((act.secrets || []).flatMap(s => s.holders || []))];
  const secretOf = n => (act.secrets || []).find(s => (s.holders || []).includes(n));
  const P = n => (ROSTER || []).find(x => x.name === n) || {};
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
  const teased = order.slice(0, 4);
  open.push({ k: 'beat', t: `${teased.length} of tonight's housemates, a few seconds each:` });
  teased.forEach((n, i) => open.push({ k: 'dr', by: n, t: TEASER[style(n)] || pickRot(Object.values(TEASER), i) }));
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

  // ── the arrivals, two by two (the real S14 launch: the first alone, for the privilege; then in twos, now and
  // then a three; a pair who share a secret sometimes walk on together, wait in the airlock side by side, and are
  // sent in one at a time so the house sees nothing) ──
  const groups = arrivalGroups(order, act.secrets || [], k);
  const listed = [];          // the list of secrets read so far, in order
  const doneCk = new Set(), doneLs = new Set();
  let count = 0;
  const xs = n => (n <= 1 ? [50] : n === 2 ? [36, 64] : [28, 50, 72]);
  groups.forEach((g, gi) => {
    const kk = `${k}|g${gi}`;
    const shared = g.length === 2 && secretOf(g[0]) && secretOf(g[0]) === secretOf(g[1]) && (secretOf(g[0]).holders || []).length > 1;
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
    steps.push({ k: 'host', by: host, t: g.length === 1 ? pickBy([`${g[0]}, welcome! How are you feeling?`, `${g[0]}! Welcome to Secret Story. Nervous?`, `${g[0]}, come here. Your heart must be racing.`], `${kk}|hi`)
      : pickBy(['Welcome, both of you! How are you feeling?', 'Welcome to Secret Story! Nervous?', 'Look at you two. How are the nerves?'], `${kk}|hi`) });
    g.forEach((n, j) => steps.push({ k: 'say', by: n, t: ARRIVE[(count + j + (ctx.week || 1) * 7) % ARRIVE.length] }));
    if (shared) steps.push({ k: 'host', by: host, t: pickBy([`Now, you two didn't arrive together by accident, did you?`, `You two seem very comfortable together. Interesting...`], `${kk}|pair`) },
      { k: 'say', by: g[1], t: pickBy(["We can't say anything. Not one word.", "Next question!", "No comment. Absolutely no comment."], `${kk}|pair2`) });
    // the secrets, to the public only: the audience holds up the signs
    g.forEach((n, j) => {
      const s = secretOf(n);
      if (!s || (shared && j === 1)) return;
      const i = count + j;
      steps.push(i === 0
        ? ssv(`${n}, you're the first to enter the House of Secrets, and that's a privilege. But every privilege comes with a price. Tonight, it's the public who will reveal your secret. Right now.`)
        : { k: 'host', by: host, t: shared ? `${listOf(g)}, turn around. Everyone at home is about to find out what you're hiding.` : `${n}, turn around. Everyone at home is about to find out your secret.` },
      { k: 'beat', t: `The audience lifts its signs, all at once: "${s.text}."`, toast: ['ONLY THE PUBLIC KNOWS', '#7c5cff'], shake: i === 0 },
      { k: 'say', by: n, t: pickRot(["Yeah... that's my secret.", "Oh no. Yep, that's it.", "That's me. Nobody in there can ever know.", "Seeing it written down like that is so weird.",
        "That's mine. Please don't show that to anybody else.", "Wow. Okay. That's real now.", "Yep. That's the one thing I can't let slip."], i) });
      if (shared) steps.push({ k: 'host', by: host, t: `One secret, two of you. And nobody in that house can ever know you've met before tonight.` });
      else if ((s.holders || []).length > 1) steps.push({ k: 'host', by: host, t: `And ${n} isn't the only one keeping it. Somebody else in that house shares this secret.` });
    });
    steps.push({ k: 'host', by: host, t: `${listOf(g)}, the airlock is waiting for you. While ${they} head${g.length > 1 ? '' : 's'} over there, let's get to know ${them} a little better.` });
    // the portraits, in their own words
    g.forEach((n, j) => {
      const p = P(n), i = count + j;
      const bits = [p.age ? `${p.age}` : null, p.hometown ? `from ${p.hometown}` : null].filter(Boolean).join(', ');
      const job = p.occupation ? ` ${String(p.occupation).replace(/^./, c => c.toUpperCase())}.` : '';
      steps.push({ k: 'beat', t: bits || job ? `${n}${bits ? `, ${bits}` : ''}.${job}` : `${n}, the ${NTH[i] || 'next'} housemate of the season.`, toast: ['PORTRAIT', '#e0b84a'] });
      const arch = (ROSTER || []).find(x => x.name === n)?.archetype || 'social-butterfly';
      steps.push({ k: 'dr', by: n, t: pickRot(PEOPLE_THINK[arch] || PEOPLE_THINK['social-butterfly'], i) });
      let li = (i * 3) % LIFE.length;
      while (lifeUsed.has(li) && lifeUsed.size < LIFE.length) li = (li + 1) % LIFE.length;
      lifeUsed.add(li);
      if (g.length === 1) steps.push({ k: 'dr', by: n, t: LIFE[li] });
      steps.push({ k: 'dr', by: n, t: HOW_I_PLAY[style(n)] || HOW_I_PLAY.social }, { k: 'dr', by: n, t: pickRot(PROMISE, i) });
    });
    // the airlock: the host on the earpiece, the Voice's word, the door
    steps.push({ k: 'beat', scene: SAS, t: g.length === 1 ? `In the airlock, ${g[0]} puts in an earpiece and checks ${pronouns(g[0]).posAdj || 'their'} hair in the mirror.` : `In the airlock, ${listOf(g)} put in their earpieces, side by side, and check their hair in the mirror.` },
      { k: 'host', by: host, t: g.length === 1 ? `${g[0]}, can you hear me? What's going to be your biggest strength in there?` : `Can you hear me, ${g.length > 2 ? 'all of you' : 'both of you'}? Quickly: what's your biggest strength in there?` });
    g.forEach((n, j) => steps.push({ k: 'say', by: n, t: `${j ? '' : 'Honestly? '}${pickRot(ASSET[topStat(P(n), count + j)] || ASSET.social, count + j).replace(/^./, c => c.toUpperCase())}.` }));
    steps.push({ k: 'host', by: host, t: pickRot(["Well, we'll see if that's enough. I think the Voice has something to tell you.", "I like it. Now listen carefully, because the Voice wants a word.",
      "We'll find out soon enough. Hold on, the Voice is about to speak to you.", "Good answers. Stay right there. The Voice has something for you.", "I hope you're right. Now, quiet. The Voice is speaking."], gi) });
    // the first missions (js/ss/launch.js)
    for (const n of g) {
      if (hide && hide.who === n) steps.push(ssv(`${n}, the Voice has played a little trick on you. The signs are gone, all except one. Somewhere in the house, there's still a sign with your secret written on it.`),
        ssv("Find it, take it down and hide it before the next housemate walks in. You've got a few minutes.", { toast: ['FIRST MISSION', '#e0b84a'] }));
      if (code && code.who === n) steps.push(ssv(`${n}, here is your first mission. A key is waiting for you in locker number four in the laundry. The code is four numbers: ${code.from[0]}'s shoe size, then the number of eggs in the pantry.`),
        ssv(`Only ${listOf(code.from)} can help you, and they mustn't find out why.`, { toast: ['FIRST MISSION', '#e0b84a'] }));
    }
    if (shared) steps.push(ssv(`${listOf(g)}, the Voice welcomes you to Secret Story. To keep anybody from suspecting a thing, you will not walk in together. ${g[0]}, you go in first. ${g[1]}, you wait here.`),
      { k: 'beat', t: `${g[1]} squeezes ${g[0]}'s hand once, and lets go.`, tense: [g[0], g[1]] });
    const goers = shared ? [g[0]] : g;
    steps.push(ssv(`${listOf(goers)}, you may now enter the House of Secrets. That is all for now.`));
    // in: the house, live
    const enter = (who, alone) => {
      const here = [...inside];
      const HOUSE = { set: 'ceremony', plate: 'living-sofas', room: 'Living Room', cam: 4, kicker: 'Live · The House', cast: [...here.slice(-4), ...who].map((n, i, a) => [n, a.length === 1 ? 50 : Math.round(14 + 72 * i / (a.length - 1))]) };
      steps.push({ k: 'beat', scene: HOUSE, t: who.length === 1 ? pickBy([`The door opens. ${who[0]} steps into the House of Secrets.`, `${who[0]} walks through the airlock and into the house.`, `${who[0]} takes a breath, and goes in.`], `${kk}|in|${who[0]}`)
        : pickBy([`The door opens. ${listOf(who)} step into the House of Secrets together.`, `${listOf(who)} walk through the airlock and into the house, screaming.`], `${kk}|in`) });
      if (!here.length) { steps.push({ k: 'dr', by: who[0], t: pickBy(["It's beautiful. It's so pink. I don't trust it at all.", "There's nobody here. It's just me and a house full of secrets."], `${kk}|alone`) }); return; }
      for (const n of who) {
        const met = recog.filter(r => r.whom === n && here.includes(r.who));
        if (met.length) for (const r of met) steps.push({ k: 'say', by: r.who, t: `Wait. Aren't you from ${r.from}?`, tense: [r.who, n] },
          { k: 'dr', by: n, t: pickBy(['Two minutes in, and somebody already knows who I am.', 'I hoped nobody in here would recognise me.', 'If they know where I am from, they are one step closer to my secret.'], `${kk}|rec|${n}`) });
        const partner = secretOf(n) && (secretOf(n).holders || []).find(x => x !== n && here.includes(x));
        if (partner) steps.push({ k: 'beat', t: `${partner} shakes ${n}'s hand like they have never met.`, tense: [n, partner] },
          { k: 'dr', by: partner, t: pickBy([`I have to act like I don't know ${n}. That is going to be the hardest part.`, `${n} walked in and I didn't even blink. I'm proud of that.`], `${kk}|pair|${n}`) });
      }
      if (!alone) steps.push({ k: 'beat', t: pickBy([`${here[here.length - 1]} is first to the door with a hug.`, 'The ones already inside cheer.', `${listOf(who)} shake${who.length > 1 ? '' : 's'} hands with everybody, one at a time.`, `${listOf(here.slice(-2))} pretend to have been there for years.`], `${kk}|greet|${who[0]}`) });
    };
    enter(goers, false);
    inside.push(...goers);
    if (hide && goers.includes(hide.who)) steps.push({ k: 'beat', t: `${hide.who} runs off and starts opening every door.` },
      { k: 'beat', t: hide.ok ? `${hide.who} finds it in the pantry, tears it into pieces, and pushes the pieces under a mattress just in time.` : `${hide.who} finds it, rips it in half, and stuffs it behind a cushion. Half the words are still showing.` });
    if (shared) {
      steps.push({ k: 'beat', scene: SAS && { ...SAS, cast: [[g[1], 50]] }, t: `Back in the airlock, ${g[1]} waits alone, counting to a hundred.` },
        ssv(`${g[1]}, you may now enter the House of Secrets. That is all for now.`));
      enter([g[1]], false);
      inside.push(g[1]);
    }
    if (code && g.includes(code.who)) steps.push({ k: 'say', by: code.who, t: `${code.from[0]}, random question. What shoe size are you?` },
      { k: 'say', by: code.from[0], t: pickBy(['Why do you want to know that?', "That's the weirdest first question anyone's ever asked me."], `${kk}|shoe`) },
      { k: 'beat', t: code.ok ? `${code.who} laughs it off, gets the number, and counts the eggs while making tea. The locker opens. ${euros(code.reward)} for the kitty.` : `${code.who} gets the shoe size, miscounts the eggs, and the locker stays shut.` });
    count += g.length;
    out.push(base(`bb-ss-launch-arr-${gi + 1}`, { ...STU, sceneful: true, kicker: `Live · Arrival ${gi + 1} of ${groups.length}`,
      title: listOf(g), label: `Arrival ${gi + 1}`, sub: g.length > 1 ? `${g.length} housemates` : 'Arriving', steps }));

    // the house, live, between arrivals
    for (const c of (L.checkins || []).filter(x => x.after <= count && !doneCk.has(x))) {
      doneCk.add(c);
      if (c.who.some(n => !inside.includes(n))) continue;
      out.push(base(`bb-ss-launch-house-${count}-${c.kind}`, { ...checkin(c, H), set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony, kicker: 'Live · In the house' }));
    }
    // the list of secrets: the HOST reads it (the user, 2026-10-28), on the show's own board, never saying whose
    for (const l of (L.lists || []).filter(x => x.after <= count && !doneLs.has(x))) {
      doneLs.add(l);
      const known = n => inside.includes(n);
      // (the public already knows the secrets of everybody inside: their faces go on the board beside them, as on the
      // real one; the ones read tonight have no face yet)
      const rowsNow = fresh => {
        const seen = new Set([...listed, ...fresh].map(sx => sx.text));
        const knownRows = inside.map(n => secretOf(n)).filter(sx => sx && !seen.has(sx.text)).filter((sx, i, a) => a.indexOf(sx) === i)
          .map(sx => ({ text: sx.text, who: (sx.holders || []).find(known) || null }));
        const read = [...listed, ...fresh].map(sx => ({ text: sx.text, who: (sx.holders || []).length === 1 && known(sx.holders[0]) ? sx.holders[0] : null, new: fresh.includes(sx) }));
        return [...knownRows.slice(-Math.max(1, 5 - read.length)), ...read].slice(-5);
      };
      /** @type {any[]} */ const ls = [{ k: 'host', by: host, t: pickBy(["It's time for the list of secrets! Let's find out what some of them are hiding.", "And now, the moment you've all been waiting for: the list of secrets!", "Let's take a look at the famous list of secrets."], `${kk}|ls`), toast: ['THE LIST OF SECRETS', '#7c5cff'],
        secretlist: { rows: rowsNow([]) } }];
      const fresh = [];
      for (const sx of l.secrets) {
        const j = l.secrets.indexOf(sx);
        fresh.push(sx);
        ls.push({ k: 'host', by: host, t: sx.pair ? `Two of our housemates are hiding this one together: "${sx.text}."` : pickRot([`One of our housemates, man or woman, is hiding this: "${sx.text}."`, `Next on the list: "${sx.text}."`, `And this one: "${sx.text}."`], j + gi), secretlist: { rows: rowsNow(fresh) } });
        // (a clue is a noun phrase, singular or not: "somewhere in the house: five rings on a string")
        if ((sx.clues || [])[0]) ls.push({ k: 'host', by: host, t: `A little clue for you at home: hidden somewhere in the house, ${sx.clues[0]}.`, secretlist: { rows: rowsNow(fresh) } });
      }
      listed.push(...fresh);
      ls.push({ k: 'host', by: host, t: `That's ${l.secrets.length} more on the list. Who's hiding what? You've got all summer to work it out.`, secretlist: { rows: rowsNow([]) } });
      out.push(base(`bb-ss-launch-list-${count}`, { ...STUDIO, title: 'The List of Secrets', label: 'List of Secrets', sub: `${l.secrets.length} secrets`, cast: [], steps: ls }));
    }
  });
  return out;
}

/** One live check-in on the house (js/ss/launch.js `checkins`). */
function checkin(c, H) {
  const { pickBy } = H;
  const [a, b, x] = c.who;
  const kk = `ssl|ck|${c.after}|${a}|${b}`;
  /** @type {any[]} */ let steps;
  if (c.kind === 'tour') steps = [
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
      { k: 'dr', by: other, t: `I've never watched the show, and ${fan} has seen every season, so I'm sticking very close to ${fan}.` }];
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
