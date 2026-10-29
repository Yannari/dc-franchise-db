// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-room-dilemma.js — a dilemma in the secret room, on screen
// ══════════════════════════════════════════════════════════════════════
//
// What js/ss/secret-room.js decided: the Voice calls one housemate up the hidden stairs, offers a trade that
// somebody else pays for, and the viewer calls it before the answer. Words only: nothing here decides.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const money = n => `$${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
// a deal paid out of their own kitty for somebody else; a deal paid out of it for themselves (no is just thrift)
const GIVES = new Set(['their-family']);
const SELF_COST = new Set(['the-tapes', 'double-vote']);
const listOf = xs => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const STAIRS = n => ({ set: 'attic', plate: 'ss-attic-stairs', room: 'The Secret Room', cam: 21, kicker: 'Cam 21 · The hidden stairs', cast: [[n, 50]] });
const DESK = n => ({ set: 'attic', plate: 'ss-attic-desk', room: 'The Secret Room', cam: 21, kicker: 'Cam 21 · The Secret Room', cast: [[n, 50]] });

/** The offer, as the Voice says it. */
function offer(a) {
  if (a.kind === 'clue-for-vote') return [`${a.to}, the Voice can give you a clue, right now, about ${a.on}'s secret.`, `In exchange, ${a.named} will not be allowed to vote at this week's nominations. And ${a.named} will never know why.`];
  if (a.kind === 'money-for-nomination') return [`${a.to}, the Voice offers you ${money(a.money)} for your kitty.`, 'In exchange, you must nominate one housemate, now, directly. Nobody will vote on it, and nobody will know it was you.'];
  if (a.kind === 'the-tapes') return [`${a.to}, some of your housemates have been talking about you when you're not in the room.`, `For ${money(a.money)} from your kitty, the Voice will show you exactly what they said.`];
  if (a.kind === 'their-family') return [`${a.to}, ${a.named} has been having a hard week. The Voice can bring ${a.named}'s family to the house tonight.`, `The visit costs ${money(a.money)}, and it comes out of your kitty, not ${a.named}'s.`];
  if (a.kind === 'double-vote') return [`${a.to}, at this week's nominations every housemate has one vote.`, `For ${money(a.money)} from your kitty, yours will count twice.`];
  if (a.kind === 'immunity-for-friend') return [`${a.to}, the Voice can make you immune this week. Nobody can nominate you.`, `But someone takes your place: ${a.named} would be nominated directly. ${a.named} will find out at the nominations.`];
  return ['The Voice has a proposal for you.'];
}

/**
 * The screen of a secret-room dilemma.
 * @param {any} act an 'ss-room-dilemma' act
 * @param {any} ctx the week's context
 * @param {{ ssv: Function }} H
 */
export function ssRoomDilemmaScreen(act, ctx, H) {
  const { ssv } = H;
  const a = act.to;
  const k = `${ctx.week}|srd|${act.kind}|${a}`;
  const [o1, o2] = offer(act);
  const yes = act.accepted;
  /** @type {any[]} */ const steps = [
    ssv(`${a}, please go to the secret room. Quietly.`, { scene: STAIRS(a), toast: ['THE SECRET ROOM', '#7c5cff'] }),
    { k: 'beat', t: pickBy([`${a} slips out of the kitchen, behind the bookcase and up the hidden stairs. Nobody notices.`, `${a} waits until the living room is empty, then climbs the narrow stairs in the dark.`], `${k}|up`) },
    ssv(`Welcome to the secret room, ${a}. The Voice has a proposal for you.`, { scene: DESK(a) }),
    ssv(o1),
    ssv(o2, { ask: { id: `${k}|ask`, q: `Will ${a} take the deal?`, opts: ['Yes', 'No'] } }),
    { k: 'dr', by: a, t: pickBy(GIVES.has(act.kind)
      // (a deal that costs them and helps somebody else: yes is the kind answer, no the one they have to explain)
      ? (yes ? ["It's my money, but it's not my family. They need it more than I need two thousand dollars.", "If it was me, I'd want somebody to do it for me.", "I'll make the money back. A visit from home, you can't buy twice."]
        : ["That's a lot of my own money, for somebody else.", "I like them. I don't know if I like them that much.", "In this game, money is everything. I can't give it away."])
      : SELF_COST.has(act.kind) && !yes ? ["Pay to feel worse? No thanks.", "Some things you're better off not knowing.", "I need every dollar I've got in here."]
      : (yes ? ["It's a game. If I don't take it, somebody else will.", "Everybody in that house would say yes. They just wouldn't admit it.", "My head says yes. My heart... my head wins."]
        : ["I could. I really could. But then I'd have to look at myself in the mirror.", "No. That's not who I am, even in here.", "The money is nice. But I have to go back down those stairs and live with them."]), `${k}|think`) },
    { k: 'say', by: a, t: yes ? pickBy(["I'll take it.", 'Yes. Deal.', "Okay. Yes."], `${k}|y`) : pickBy(['No. I refuse.', "No, thank you, Voice.", "I'm going to say no."], `${k}|n`),
      settle: { id: `${k}|ask`, answer: yes ? 'Yes' : 'No', n: 2 } },
  ];
  if (yes) {
    if (act.kind === 'clue-for-vote') steps.push(ssv(`Look at the screen.${act.clue ? ` ${act.clue}.` : ''} And ${act.named} will not vote this week.`), { k: 'dr', by: a, t: pickBy([`${act.on}. I knew it. Well, I nearly knew it.`, `Sorry, ${act.named}. It's nothing personal. It's a little personal.`], `${k}|r`) });
    else if (act.kind === 'money-for-nomination') steps.push({ k: 'say', by: a, t: `${act.named}.` }, ssv(`Then ${act.named} is nominated. ${money(act.money)} for your kitty.`, { nom: [act.named] }), { k: 'dr', by: a, t: pickBy([`I just put ${act.named} up for money. If that ever comes out, I'm finished.`, `${act.named} would have done the same to me. I'm sure of it.`], `${k}|r`) });
    else if (act.kind === 'the-tapes') {
      steps.push(ssv('Look at the screen.'));
      // (two people on the tapes never say the same sentence: each gets a line of their own, in turn)
      const TAPES = [s => `On the screen: ${s}, on the sofa, laughing. "${a}? Honestly, ${a} is the fakest person in this house."`,
        s => `On the screen: ${s} in the kitchen. "If ${a} goes this week, I won't cry. I'll throw a party."`,
        s => `On the screen: ${s}, in the bedroom, whispering. "I smile at ${a} every morning, and I don't mean a word of it."`,
        s => `On the screen: ${s} by the pool. "${a} talks to everybody and trusts nobody. I don't buy any of it."`];
      const t0 = [...`${k}|tapes`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TAPES.length;
      (act.talkers || []).forEach((t, i) => steps.push({ k: 'beat', t: TAPES[(t0 + i) % TAPES.length](t) }));
      steps.push({ k: 'dr', by: a, t: pickBy([`${listOf(act.talkers || [])}. To my face, all smiles. Okay. Now I know.`, "I paid to have my heart broken. Brilliant investment."], `${k}|r`) });
    } else if (act.kind === 'their-family') steps.push({ k: 'beat', scene: { set: 'door', plate: 'foyer', room: 'The Airlock', cam: 13, kicker: 'Cam 13 · The Airlock', cast: [[act.named, 50]] }, t: `That night the airlock opens, and ${act.named}'s family is standing behind the glass. ${act.named} can't stop crying.` },
      { k: 'say', by: act.named, t: pickBy(['Who did this? Who paid for this?', "I don't know who did this, but thank you. Thank you."], `${k}|f`) },
      { k: 'dr', by: a, scene: { set: 'dr', plate: 'confessional-close', room: 'Confessional', cam: 1, kicker: 'Cam 01 · Confessional', cast: [[a, 50]] }, t: pickBy([`Seeing ${act.named}'s face was worth every dollar.`, `${act.named} doesn't know it was me. I'll tell ${act.named} one day. Maybe.`], `${k}|r`) });
    else if (act.kind === 'double-vote') steps.push(ssv(`At this week's nominations, your vote will count twice. ${money(act.money)} leaves your kitty.`), { k: 'dr', by: a, t: "Two votes. Somebody's week just got a lot worse." });
    else if (act.kind === 'immunity-for-friend') steps.push(ssv(`${a}, you are immune this week. ${act.named} is nominated.`, { nom: [act.named] }), { k: 'dr', by: a, t: pickBy([`I just sold ${act.named}. My friend. For one week of safety.`, `${act.named} will understand. ${act.named} has to understand.`], `${k}|r`) });
  } else {
    steps.push(ssv(pickBy(['Very well. The Voice respects your choice.', 'As you wish. The offer is gone.'], `${k}|no`)));
    if (act.kind === 'their-family') steps.push({ k: 'dr', by: a, t: pickBy([`I know. I know how that sounds. But two thousand dollars...`, `${act.named} will never know I said no. That's the worst part.`], `${k}|r`) });
  }
  steps.push(ssv('Go back down. Nobody needs to know you were here. That is all for now.'),
    { k: 'beat', scene: STAIRS(a), t: pickBy([`${a} comes back down the stairs and walks into the kitchen like nothing happened.`, `Back in the living room, somebody asks ${a} where they've been. "Bathroom."`], `${k}|down`) });
  return { id: `bb-ss-sroom-${act.kind}-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '15:00', ...DESK(a), sceneful: true,
    title: 'The Secret Room', label: 'The Secret Room', sub: `${a}: ${yes ? 'the deal' : 'no deal'}`, steps };
}
