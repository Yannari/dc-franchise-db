// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-deceptions.js — who is really talking, and the house's own votes, on screen
// ══════════════════════════════════════════════════════════════════════
//
// Twist family 5 (js/ss/deceptions.js, js/ss/public-votes.js): the false Voice's week and its reveal at the prime,
// Monsieur Robot's week and his unmasking, the ticket voted live. Words only.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const listOf = xs => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const spread = a => a.map((n, i) => [n, a.length === 1 ? 50 : Math.round(12 + (76 * i) / (a.length - 1))]);
const SC = (set, plate, room, who, cam = 4) => ({ set, plate, room, cam, kicker: `Cam ${String(cam).padStart(2, '0')} · ${room}`, cast: spread(who.filter(Boolean).slice(0, 8)) });
const LIV = who => SC('ceremony', 'living-sofas', 'Living Room', who, 4);
const KIT = who => SC('kitchen', 'kitchen-wide', 'Kitchen', who, 3);
const DR = n => SC('dr', 'confessional-close', 'Confessional', [n], 1);
// the false Voice: a voice of its own on screen (vp-bb-ep/ss-hud.js reads `by`)
const NEW_VOICE = 'The New Voice';

/**
 * The deception's week (an 'ss-deception' act).
 * @param {any} act @param {any} ctx @param {{ ssv: Function }} H
 */
export function ssDeceptionWeekScreen(act, ctx, H) {
  const { ssv } = H;
  const house = (ctx.house || []).filter(Boolean);
  const k = `${ctx.week}|dcp|${act.kind}`;
  /** @type {any[]} */ const steps = [];
  const nv = (t, x = {}) => ssv(t, { by: NEW_VOICE, falseVoice: true, ...x });
  if (act.kind === 'false-voice') {
    steps.push(ssv('Housemates, please gather in the living room.', { scene: LIV(house), toast: ['THE VOICE', '#e0b84a'] }),
      ssv('Housemates, this is the Voice. After all these seasons, tonight the Voice says goodbye. From now on, somebody new will speak to you.'),
      { k: 'beat', t: pickBy(['Nobody says anything. Somebody starts to cry, then laughs at themselves for crying.', 'A long silence. Then everybody talks at once.'], `${k}|0`) },
      nv('Good evening, housemates. I am the new Voice. I am going to get to know each of you, one at a time.', { toast: ['THE NEW VOICE', '#ff7ac8'] }));
    const shown = (act.asked || []).filter(a => a.complied && a.clue).slice(0, 3);
    const refused = (act.asked || []).filter(a => !a.complied).slice(0, 2);
    // (each answer its own words: the trusting and the wary take turns through their lines)
    const YES = ['Okay. One thing. Only because you asked nicely.', "Fine. You're the Voice now, I suppose.", 'Nobody knows this, but... all right.'];
    const NO = ['Who are you? The Voice would never ask me that.', "No. I don't know you yet, and I'm not telling you anything."];
    let yi = hash(k) % YES.length, ni = hash(k) % NO.length;
    const QS = ['tell me one thing about your life before this house that nobody in here knows.', 'what is the one thing you have never told anybody in here?', 'tell me about your life outside. Something true.'];
    [...shown, ...refused].sort((x, y) => house.indexOf(x.who) - house.indexOf(y.who)).forEach((a, i) => {
      steps.push(nv(`${a.who}, ${QS[i % QS.length]}`, { scene: DR(a.who) }));
      if (a.complied) steps.push({ k: 'dr', by: a.who, t: YES[yi++ % YES.length] },
        { k: 'beat', scene: LIV(house), t: `The next morning there is a new clue on the wall of clues: ${a.clue}. ${a.who} goes very quiet.` });
      else steps.push({ k: 'dr', by: a.who, t: NO[ni++ % NO.length] });
    });
    if (refused[0]) steps.push({ k: 'say', by: refused[0].who, scene: KIT([refused[0].who, ...house.filter(n => n !== refused[0].who).slice(0, 3)]),
      t: pickBy(["That's not the Voice. I'd know the Voice anywhere.", "Has anybody else noticed the new Voice asks a lot of questions?"], `${k}|end`) });
    return { id: `bb-ss-false-voice-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '21:00', sceneful: true, ...LIV(house), title: 'The New Voice', label: 'The New Voice', sub: 'The Voice says goodbye', steps };
  }
  if (act.kind === 'robot') {
    const right = Object.entries(act.guesses || {}).filter(([, g]) => g === act.robot).map(([n]) => n);
    const wrong = Object.entries(act.guesses || {}).filter(([, g]) => g && g !== act.robot);
    steps.push({ k: 'beat', scene: LIV(house), t: 'A robot rolls into the living room: lights for eyes, a little screen for a face, and a very slow walk.', toast: ['MONSIEUR ROBOT', '#7c5cff'] },
      ssv('Housemates, meet Monsieur Robot. He lives with you this week. Somebody you know is inside. Find out who.'),
      { k: 'beat', t: 'Monsieur Robot bows, very slowly, and knocks a glass off the table.' });
    if (wrong[0]) steps.push({ k: 'say', by: wrong[0][0], t: `It's ${wrong[0][1]}. It has to be. Look at the way it walks.` });
    if (right[0]) steps.push({ k: 'say', by: right[0], t: pickBy(['I know that walk. I know exactly who that is.', "I'm not saying it out loud. But I know."], `${k}|r`) });
    if (act.heard) steps.push({ k: 'beat', scene: KIT([act.heard.a, ...house.filter(n => n !== act.heard.a && n !== act.heard.b).slice(0, 2)]),
      t: `In the kitchen, ${act.heard.a} tells two housemates, in detail, everything that is wrong with ${act.heard.b}. In the corner, Monsieur Robot's lights blink.` });
    return { id: `bb-ss-robot-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '15:00', sceneful: true, ...LIV(house), title: 'Monsieur Robot', label: 'Monsieur Robot', sub: 'Who is inside?', steps };
  }
  return null;
}

/** The prime: the real Voice never left. */
export function ssFalseVoiceRevealScreen(seg, ctx, host, H) {
  const { ssv } = H;
  const k = `${ctx.week}|fvr`;
  /** @type {any[]} */ const steps = [
    { k: 'host', by: host, t: 'Housemates, this week a new Voice spoke to you. Tonight, I can tell you the truth.', toast: ['THE TRUTH', '#ff7ac8'] },
    { k: 'host', by: host, t: 'The new Voice was a test. The real Voice never left.' },
    ssv('Good evening, housemates. Did you miss me?', { shake: true }),
    { k: 'beat', t: pickBy(['The living room explodes. Somebody throws a cushion at the speaker.', 'Screams, laughter, and at least one person with both hands over their face.'], k) }];
  if (seg.doubters?.length) steps.push({ k: 'host', by: host, t: `${listOf(seg.doubters)}, you never trusted the new Voice. That's worth $1,000 each.` },
    { k: 'say', by: seg.doubters[0], t: pickBy(['I told you! I told all of you!', 'I knew it from the first word.'], `${k}|d`) });
  if (seg.fooled?.length) steps.push({ k: 'say', by: seg.fooled[0], t: pickBy(['I told it everything! Everything!', "So that clue on the wall... that was me talking. Great."], `${k}|f`) });
  return { id: `bb-ss-prime-falsevoice-w${ctx.week}`, title: 'The Real Voice', label: 'The Real Voice', sub: `${(seg.doubters || []).length} saw through it`, cast: (seg.doubters || []).map((n, i, a) => [n, a.length === 1 ? 50 : 30 + i * 40 / Math.max(1, a.length - 1)]), steps };
}

/** The prime: Monsieur Robot unmasked. */
export function ssRobotUnmaskScreen(seg, ctx, host) {
  const r = seg.robot;
  const k = `${ctx.week}|rbt`;
  /** @type {any[]} */ const steps = [
    { k: 'host', by: host, t: "Monsieur Robot, it's time. Take off your head.", toast: ['MONSIEUR ROBOT', '#7c5cff'] },
    { k: 'beat', t: `The head comes off. It's ${r}!`, shake: true },
    { k: 'say', by: r, t: pickBy(['Hello again, everybody. Did you miss me?', 'Surprise! It was so hot in there.'], k) }];
  if (seg.right?.length) steps.push({ k: 'host', by: host, t: `${listOf(seg.right)}, you guessed right. That's $1,000 each.` });
  else steps.push({ k: 'host', by: host, t: 'And not one of you guessed it. Not one.' });
  if (seg.heard) steps.push({ k: 'host', by: host, t: `${r}, you heard a few things this week, didn't you?` },
    { k: 'say', by: r, t: `${seg.heard.a} told the kitchen everything that is wrong with ${seg.heard.b}. I heard every word.` },
    { k: 'say', by: seg.heard.b, t: pickBy([`${seg.heard.a}? Really?`, `Thanks for telling me, ${r}. Really.`], `${k}|h`), tense: [seg.heard.a, seg.heard.b] });
  return { id: `bb-ss-prime-robot-w${ctx.week}`, title: 'Monsieur Robot', label: 'The Robot', sub: r, cast: [[r, 50]], steps };
}

/** The prime: the ticket, voted live in the living room. */
export function ssTicketScreen(seg, ctx, host) {
  const k = `${ctx.week}|tkt`;
  /** @type {any[]} */ const steps = [
    { k: 'host', by: host, t: "Housemates, tonight one of you gets a ticket straight through next week's prime. And you choose who. One by one, say a name.", toast: ['THE TICKET', '#e0b84a'] }];
  for (const [v, t] of Object.entries(seg.votes || {})) steps.push({ k: 'say', by: v, t: `${t}.` });
  steps.push({ k: 'host', by: host, t: `${seg.winner}, with ${seg.tally?.[seg.winner] || 0} votes, you have the ticket. Nobody can nominate you next week.`, shake: true },
    { k: 'say', by: seg.winner, t: pickBy(['Thank you. Really. Thank you, all of you.', "I didn't expect that. I'll pay it back."], k) });
  return { id: `bb-ss-prime-ticket-w${ctx.week}`, title: 'The Ticket', label: 'The Ticket', sub: seg.winner, cast: Object.keys(seg.votes || {}).map((n, i, a) => [n, Math.round(10 + 80 * i / Math.max(1, a.length - 1))]), steps };
}
