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
  mastermind: ["People think I'm cold. I'm not cold, I'm thinking.", "People think I don't feel anything. I just don't show it."],
  schemer: ["People think I'm sweet. I am sweet, until I'm not.", "People trust me straight away. That's going to be useful."],
  villain: ["People think I'm trouble, and to be fair, they're usually right.", "People are scared of me before I've said a word."],
  hothead: ["People think I get angry fast. I do, but it's over in two minutes.", "People say I'm a lot. I just say what everybody else is thinking."],
  'challenge-beast': ['People see the muscles and think that is all there is.', 'People think I only care about sport. I care about winning, in general.'],
  'social-butterfly': ["People think I'm everybody's friend. I am. I just like people.", 'People say I could talk to a wall. I have, actually.'],
  'loyal-soldier': ["People think I'm quiet. I'm not quiet, I'm loyal. That's different.", "People think I'm serious. I'm serious about my friends."],
  wildcard: ['People never know what I am going to do next. Neither do I, sometimes.', "People can't work me out. I like that."],
  'chaos-agent': ["People think I'm a lot. I am a lot.", 'People say things are never boring when I am around.'],
  floater: ["People don't notice me at first. That's how I like it.", 'People forget I am in the room. Then I win.'],
  underdog: ['People have always underestimated me. Since school.', 'Nobody ever bets on me. That has never stopped me.'],
  hero: ["People think I'm too nice for a game like this.", "People think nice means weak. It doesn't."],
  goat: ["People think I'm a bit lost. I'm not lost, I'm relaxed.", "People don't take me seriously. That's their mistake."],
  'perceptive-player': ["People think I'm shy. I'm not shy, I'm watching.", 'People think I am not paying attention. I am always paying attention.'],
  showmancer: ["People think I'm only here to flirt. Partly true.", 'People say I fall in love too easily. Maybe I do.'],
};
const HOW_I_PLAY = {
  read: "I'm going to watch everybody. How they talk about home, what they never talk about. Secrets come out in the small things.",
  provoke: "I'm going to push people until something slips out. If that makes me enemies, fine.",
  manipulate: "If I have to lie, I'll lie. If I have to manipulate, I will. It's a game for a hundred thousand dollars.",
  alliance: 'I want a group around me in the first days. Four or five people I can count on.',
  social: "I'm going to get on with everybody. People tell their secrets to the people they like.",
  loyal: "If you're my friend in there, you're my friend to the end. I don't switch sides.",
  comp: "Every game the Voice gives us, I'm going to win. In there, money is power.",
  float: "I'll stay calm, stay out of the fights, and let the others wear themselves out.",
  coattail: "I'll find the strongest person in the house and stay right next to them.",
  lowkey: 'The first weeks, I keep my head down. The quiet ones last the longest.',
  rise: 'The first weeks, I keep my head down. Then I come out of nowhere.',
};
const LIFE = ["My family is going to scream when they see me on television.", "I've watched every season of this show. Every single one.",
  "I've never lived with this many people in my life.", "My friends bet I wouldn't last a week. I've told them to get their money ready.",
  "My mum is the only one who knows I'm doing this.", 'I have never kept a secret this big for this long.',
  "I can't sleep if the room is too quiet. That won't be a problem in there.", "Everybody at home thinks I'll cry on the first night. I won't."];
const PROMISE = ["Voice, I promise you I'll keep my secret to the very end.", "Voice, I'm going to give you the best season you've ever had.",
  'The hundred thousand dollars? They are for me. Sorry, everybody.', "Voice, I won't let you down. That's a promise.",
  "I'm going to find secrets, keep mine, and win. In that order.", "I'm here to win. I didn't come for the holiday."];
const ASSET = { mental: ['my head. I notice everything', 'my memory. I forget nothing anybody says'], social: ['people. I get on with everybody', 'my mouth. I can talk to anybody'],
  boldness: ['nerve. I say what I think', 'my nerve. I am not scared of anybody in there'], intuition: ['my instinct. It is never wrong', 'my gut. I can tell when somebody is lying'],
  strategic: ['strategy. I always have a plan', 'my brain. I think three moves ahead'], physical: ['energy. I never stop', 'I am strong, and I win games'],
  endurance: ['I never give up', 'patience. I can wait for anything'], loyalty: ['loyalty. My friends can count on me', 'my heart. I care about people'],
  temperament: ['I stay calm, whatever happens', 'my calm. Nothing gets to me'] };
const TEASER = { read: "I'm going to watch every single one of them.", provoke: "I'm going to shake that house up.", manipulate: 'Lying, betraying, manipulating: that is the game I love most.',
  alliance: 'I want my little family in there, fast.', social: "Everybody is going to love me. That's the plan.", loyal: 'My friends, I protect. Everybody else, good luck.',
  comp: 'Every game, I win. Every single one.', float: "They won't even see me coming.", coattail: "I'll find the strongest one and stick to them.", lowkey: "They won't even see me coming.", rise: "They won't even see me coming." };
const SEASON_IDEA = {
  loft: 'This summer, the house is the same house. The secrets are not.',
  chalet: 'This summer, the House of Secrets is twenty metres above the city. There is nowhere to run.',
  campus: 'This summer, the House of Secrets is a school. Everybody here has something to learn, and something to hide.',
  arena: 'This summer, a wall splits the House of Secrets in two, and nobody knows who is on the other side.',
  crystal: 'This summer, everything is made of glass. More than ever: beware of appearances.',
  labyrinth: 'This summer, there are rooms in this house that nobody will be told about.',
};
// every arrival answers in words of their own: no two on the night alike
const ARRIVE = ['Nervous. Excited. Mostly nervous.', 'I have been waiting for this for months.', 'Ready. I think.', 'My heart is going so fast right now.',
  'Honestly? I want to win.', 'I just want to have fun and keep my mouth shut.', 'I feel like I might throw up, but in a good way.',
  "I've watched every season. I know what I'm doing. I hope.", 'Terrified. Is that allowed?', 'Like the luckiest person alive.',
  'Calm on the outside. Not on the inside.', "I can't wait to meet everybody.", 'I am going to find every single secret in there.', 'Shaking. Look at my hands.',
  'Like it is my birthday and my first day of school at once.', 'I promised my family I would make them proud.'];
const NTH = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth'];

/** The top stat a housemate would name as their biggest asset. */
const topStat = (p, i) => {
  const s = p?.stats || {};
  const keys = Object.keys(ASSET).filter(k => Number.isFinite(Number(s[k])));
  if (!keys.length) return Object.keys(ASSET)[i % Object.keys(ASSET).length];
  return keys.sort((a, b) => Number(s[b]) - Number(s[a]))[0];
};

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
    { k: 'host', by: host, t: "Before we meet them, let's check the Voice is ready. Voice, are you there?" },
    ssv(`This is the Voice. Good evening, ${host}.`),
    { k: 'host', by: host, t: 'Good evening, Voice! Are you ready for a new season?' },
    ssv('The Voice has an eye, ears, and a great many plans for this season.'),
    { k: 'host', by: host, t: 'Well. You heard it. That is all we are getting for now.' },
    ssv('That is all for now.'),
    { k: 'host', by: host, t: "You at home will know every secret tonight. They won't. Let's meet the first one." });
  out.push(base('bb-ss-launch-open', { ...STUDIO, title: 'Launch Night', label: 'Launch Night', sub: `${order.length} secrets`, cast: [], steps: open }));

  const inside = [];
  const recog = act.recognitions || [];
  const mission = kind => (L.missions || []).find(m => m.kind === kind);
  const lifeUsed = new Set();

  order.forEach((n, i) => {
    const p = P(n);
    const s = secretOf(n);
    const kk = `${k}|${n}`;
    const steps = [];
    // the walk on
    steps.push({ k: 'host', by: host, t: i === 0 ? `Please give a huge welcome to our very first housemate: ${n}!` : pickBy([`Please welcome ${n}!`, `Here comes ${n}!`, `Ladies and gentlemen, ${n}!`], `${kk}|on`) },
      { k: 'beat', t: pickBy([`${n} walks down the stairs onto the set, waving at the crowd.`, `${n} comes out to the music, and nearly misses the last step.`, `${n} walks on, both hands over ${pronouns(n).posAdj || 'their'} mouth.`], `${kk}|walk`), toast: ['ARRIVING', '#e0b84a'] },
      { k: 'host', by: host, t: pickBy([`${n}, welcome. How are you feeling?`, `${n}! Welcome to Secret Story. Nervous?`, `${n}, come here. Your heart must be going.`], `${kk}|hi`) },
      { k: 'say', by: n, t: ARRIVE[(i + (ctx.week || 1) * 7) % ARRIVE.length] });
    // the secret, to the public only: the audience holds up the signs
    if (s) {
      steps.push(i === 0
        ? ssv(`${n}, you are the first to enter the House of Secrets, and that is a privilege. But every privilege comes with a price. It is the public who will reveal your secret, right now.`)
        : { k: 'host', by: host, t: `${n}, look behind you. The public is about to learn your secret.` },
      { k: 'beat', t: `The audience lifts its signs, all at once: "${s.text}."`, toast: ['ONLY THE PUBLIC KNOWS', '#7c5cff'], shake: i === 0 },
      { k: 'say', by: n, t: pickBy(['Yes. That is my secret.', 'Oh no. Yes. That is it.', 'That is me. Nobody in there can know.'], `${kk}|yes`) });
      if ((s.holders || []).length > 1) steps.push({ k: 'host', by: host, t: `And ${n} is not the only one who knows it. Somebody else in that house shares this secret.` });
    }
    // the portrait, in their own words
    const bits = [p.age ? `${p.age}` : null, p.hometown ? `from ${p.hometown}` : null].filter(Boolean).join(', ');
    const job = p.occupation ? ` ${String(p.occupation).replace(/^./, c => c.toUpperCase())}.` : '';
    steps.push({ k: 'host', by: host, t: `While ${n} heads for the airlock, here is ${n}, in ${pronouns(n).posAdj || 'their'} own words.` },
      { k: 'beat', t: bits || job ? `${n}${bits ? `, ${bits}` : ''}.${job}` : `${n}, the ${NTH[i] || 'next'} housemate of the season.`, toast: ['PORTRAIT', '#e0b84a'] });
    const arch = (ROSTER || []).find(x => x.name === n)?.archetype || 'social-butterfly';
    steps.push({ k: 'dr', by: n, t: pickRot(PEOPLE_THINK[arch] || PEOPLE_THINK['social-butterfly'], i) });
    let li = (i * 3) % LIFE.length;
    while (lifeUsed.has(li) && lifeUsed.size < LIFE.length) li = (li + 1) % LIFE.length;
    lifeUsed.add(li);
    steps.push({ k: 'dr', by: n, t: LIFE[li] },
      { k: 'dr', by: n, t: HOW_I_PLAY[style(n)] || HOW_I_PLAY.social },
      { k: 'dr', by: n, t: pickRot(PROMISE, i) });
    // the airlock
    const stat = topStat(p, i);
    steps.push({ k: 'beat', t: `In the airlock, ${n} puts in an earpiece.`, cut: { plate: 'foyer', who: n } },
      { k: 'host', by: host, t: `${n}, can you hear me? What is your biggest asset in there?` },
      { k: 'say', by: n, t: `Honestly? ${pickRot(ASSET[stat] || ASSET.social, i).replace(/^./, c => c.toUpperCase())}.` },
      { k: 'host', by: host, t: "We'll see if it's enough. I think the Voice has something to say to you." });
    // the first missions (js/ss/launch.js)
    const hide = mission('hide-sign');
    const code = mission('code');
    if (hide && hide.who === n) {
      steps.push(ssv(`${n}, the Voice has played a trick on you. The signs are gone, except one. Somewhere in the house there is still a sign with your secret on it.`),
        ssv('Find it, take it down and hide it before the next housemate walks in. You have a few minutes. That is all for now.', { toast: ['FIRST MISSION', '#e0b84a'] }),
        { k: 'beat', t: `${n} runs into the house and starts opening every door.` },
        { k: 'beat', t: hide.ok ? `${n} finds it in the pantry, tears it into pieces, and pushes the pieces under a mattress just as the doorbell goes.` : `${n} finds it, rips it in half, and stuffs it behind a cushion. Half the words are still showing.` });
    } else if (code && code.who === n) {
      steps.push(ssv(`${n}, a first mission. A key is waiting for you in locker number four of the laundry. The code has four numbers: ${code.from[0]}'s shoe size, and the number of eggs in the pantry.`),
        ssv(`Only ${listOf(code.from)} can help you, and they must not know why. That is all for now.`, { toast: ['FIRST MISSION', '#e0b84a'] }));
    } else {
      steps.push(ssv(`${n}, you may now enter the House of Secrets. That is all for now.`));
    }
    // in
    steps.push({ k: 'beat', t: pickBy([`The door opens. ${n} steps into the House of Secrets.`, `${n} walks through the airlock and into the house.`, `${n} takes a breath, and goes in.`], `${kk}|in`) });
    if (!inside.length) steps.push({ k: 'dr', by: n, t: pickBy(["It's beautiful. It's so pink. I don't trust it at all.", "There's nobody here. It's just me and a house full of secrets."], `${kk}|alone`) });
    else {
      const met = recog.filter(r => r.whom === n && inside.includes(r.who));
      if (met.length) for (const r of met) steps.push({ k: 'say', by: r.who, t: `Wait. Aren't you from ${r.from}?`, tense: [r.who, n] },
        { k: 'dr', by: n, t: pickBy(['Two minutes in, and somebody already knows who I am.', 'I hoped nobody in here would recognise me.', 'If they know where I am from, they are one step closer to my secret.'], `${kk}|rec`) });
      else steps.push({ k: 'beat', t: pickBy([`${inside[inside.length - 1]} is first to the door with a hug.`, 'The ones already inside cheer.', `${n} shakes hands with everybody, one at a time.`, `${listOf(inside.slice(-2))} pretend to have been there for years.`], `${kk}|greet`) });
      const partner = s && (s.holders || []).find(x => x !== n && inside.includes(x));
      if (partner) steps.push({ k: 'beat', t: `${partner} shakes ${n}'s hand like they have never met.`, tense: [n, partner] },
        { k: 'dr', by: partner, t: pickBy([`I have to act like I don't know ${n}. That is going to be the hardest part.`, `${n} walked in and I didn't even blink. I'm proud of that.`], `${kk}|pair`) });
    }
    if (code && code.who === n) steps.push({ k: 'say', by: n, t: `${code.from[0]}, random question. What shoe size are you?` },
      { k: 'say', by: code.from[0], t: pickBy(['Why do you want to know that?', 'That is the strangest first question anybody has ever asked me.'], `${kk}|shoe`) },
      { k: 'beat', t: code.ok ? `${n} laughs it off, gets the number, and counts the eggs while making tea. The locker opens. ${euros(code.reward)} for the kitty.` : `${n} gets the shoe size, miscounts the eggs, and the locker stays shut.` });
    inside.push(n);
    out.push(base(`bb-ss-launch-arr-${i + 1}`, { set: 'door', room: 'The Studio and the Airlock', cam: 7, kicker: `Live · Arrival ${i + 1} of ${order.length}`,
      title: n, label: `Arrival ${i + 1}`, sub: s ? 'A secret, to the public only' : 'Arriving', cast: [[n, 50]], steps }));

    // the house, live, between arrivals
    for (const c of (L.checkins || []).filter(x => x.after === i + 1)) out.push(base(`bb-ss-launch-house-${c.after}`, { ...checkin(c, H), set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony, kicker: 'Live · In the house' }));
    // the list of secrets, told as clues, never whose
    for (const l of (L.lists || []).filter(x => x.after === i + 1)) {
      /** @type {any[]} */ const ls = [{ k: 'host', by: host, t: "Time for the list of secrets. Let's lift the veil on what our housemates are hiding." }];
      for (const sx of l.secrets) {
        ls.push(ssv("Let us lift the veil on a housemate's secret.", { toast: ['THE LIST OF SECRETS', '#7c5cff'] }));
        // (a clue is a noun phrase, singular or not: "somewhere in the house: five rings on a string")
        if ((sx.clues || [])[0]) ls.push({ k: 'beat', t: `Hidden somewhere in the house: ${sx.clues[0]}.${sx.clues[1] ? ` And ${sx.clues[1]}.` : ''}` });
        ls.push(ssv(sx.pair ? `Two of our housemates share this secret: "${sx.text}."` : `Our housemate, a man or a woman, has for secret: "${sx.text}."`));
      }
      ls.push({ k: 'host', by: host, t: `So that is ${l.secrets.length} more on the list. Who is hiding which? You have all summer to work it out.` });
      out.push(base(`bb-ss-launch-list-${l.after}`, { ...STUDIO, title: 'The List of Secrets', label: 'List of Secrets', sub: `${l.secrets.length} secrets`, cast: [], steps: ls }));
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
    { k: 'say', by: b, t: 'That is the confessional. The red button in there is the buzzer.' },
    { k: 'say', by: a, t: "Already? I've been here two minutes." },
    { k: 'say', by: b, t: "Don't press it on day one. It costs five thousand dollars." },
    { k: 'dr', by: a, t: pickBy(["The house is beautiful. I don't trust it at all.", 'Everything in here is pink, and everything in here is watching you.'], kk) }];
  else if (c.kind === 'beds') steps = c.clash ? [
    { k: 'say', by: a, t: "I'm taking the bed in the middle." },
    { k: 'say', by: b, t: "No, you're not. My bag is already on it." },
    { k: 'say', by: a, t: 'Your bag is not you.' },
    { k: 'beat', t: 'The first argument of the season, and nobody has unpacked.', tense: [a, b] },
    { k: 'dr', by: b, t: `${a} wants the middle bed. So do I. That tells you everything about ${a}.` }] : [
    { k: 'say', by: a, t: 'Which bed is free?' },
    { k: 'say', by: b, t: 'Not the middle one. That one is mine.' },
    { k: 'say', by: a, t: 'Why the middle?' },
    { k: 'say', by: b, t: 'From the middle you can hear both sides of the room.' },
    { k: 'dr', by: a, t: `${b} picked a bed for strategy on the first night. Noted.` }];
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
      { k: 'say', by: fan, t: 'Okay, so. That wall is the wall of clues. Every week the Voice puts clues on it about our secrets.' },
      { k: 'say', by: other, t: 'About our secrets? Mine too?' },
      { k: 'say', by: fan, t: "Everybody's. Look at it every single morning." },
      { k: 'dr', by: other, t: `I've never watched the show. ${fan} has watched every season. I'm staying very close to ${fan}.` }];
  } else if (c.kind === 'wall') steps = [
    { k: 'beat', t: `${[a, b, x].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1')} stand in front of the empty wall of clues.` },
    { k: 'say', by: a, t: 'Is one of these going to be about me?' },
    { k: 'say', by: b, t: "Don't stare at it like that. People will notice." },
    ...(x ? [{ k: 'say', by: x, t: 'Everybody is staring at it like that.' }] : [])];
  else steps = [
    { k: 'say', by: a, t: 'Somebody is coming. Quick, hide!' },
    { k: 'beat', t: `${[a, b, x].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1')} squeeze behind the sofa.` },
    { k: 'say', by: b, t: 'This is ridiculous.' },
    { k: 'say', by: a, t: "Shh. It's tradition." }];
  return { title: 'Live in the House', label: 'In the House', sub: c.who.join(', '), cast: c.who.map((n, i) => [n, 30 + i * 22]), steps };
}
