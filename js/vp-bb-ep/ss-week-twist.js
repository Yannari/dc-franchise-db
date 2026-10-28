// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-week-twist.js — the Voice changes the nominations, on screen
// ══════════════════════════════════════════════════════════════════════
//
// What js/ss/nomination-twists.js decided, announced to the house before the nominations: linked destinies,
// a nomination for life (and its end, or a friend taking it), the inverted week, Immunity House against
// Nomination House (and the duel), the red room, the one who names them all. Words only.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const listOf = xs => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const spread = a => a.map((n, i) => [n, a.length === 1 ? 50 : Math.round(12 + (76 * i) / (a.length - 1))]);
const LIV = (who, plate = 'living-sofas') => ({ set: 'ceremony', plate, room: 'Living Room', cam: 4, kicker: 'Cam 04 · Living room', cast: spread(who) });

/**
 * @param {any} act an 'ss-week-twist' act
 * @param {any} ctx the week's context (ctx.house)
 * @param {{ ssv: Function }} H
 */
export function ssWeekTwistScreen(act, ctx, H) {
  const { ssv } = H;
  const t = act.twist;
  const life = act.life;
  const house = (ctx.house || []).filter(Boolean);
  const k = `${ctx.week}|sswt|${t?.kind || life?.kind}`;
  /** @type {any[]} */ const steps = [];
  let title = 'The Nominations';
  // a nomination for life, running: its end, or a friend taking it
  if (life?.kind === 'lifted') steps.push(ssv(`${life.who}, your nomination for life is over. From this week, you are nominated like everybody else: or not at all.`, { toast: ['FOR LIFE: OVER', '#22c55e'], scene: LIV([life.who]) }),
    { k: 'say', by: life.who, t: pickBy(['Finally. FINALLY.', "I can breathe. I can actually breathe."], `${k}|l`) });
  else if (life?.kind === 'taken') steps.push(ssv(`${life.by} has asked the Voice for something nobody has asked before: to take ${life.who}'s nomination for life.`, { toast: ['FOR LIFE', '#ff3355'], scene: LIV([life.by, life.who]) }),
    ssv(`The Voice accepts. ${life.who}, you are free. ${life.by}, from this week, you are nominated for life.`),
    { k: 'say', by: life.who, t: pickBy([`${life.by}, why would you do that for me?`, `You're crazy. I love you. You're crazy.`], `${k}|t`) },
    { k: 'dr', by: life.by, t: pickBy([`${life.who} was drowning. I'm a better swimmer. That's all.`, "Somebody had to. Better me than watching it happen."], `${k}|t2`) });
  if (t?.kind) {
    const gather = ssv('Housemates, please gather in the living room. The Voice has an announcement about this week\'s nominations.', { scene: LIV(house), toast: ['THE NOMINATIONS', '#ff3355'] });
    if (t.kind === 'linked') {
      title = 'Linked Destinies';
      steps.push(gather, ssv('This week, your destinies are linked. You will be in pairs. If one of you is nominated, the other is nominated too.'));
      for (const [a, b] of (t.pairs || []).slice(0, 5)) steps.push(ssv(`${a}, you are linked to ${b}.`, { scene: LIV([a, b]) }));
      steps.push({ k: 'beat', t: pickBy(['Some pairs hug. Some pairs very much do not.', 'The room does the maths: who would you never want to be stuck to?'], `${k}|r`) });
      const worst = (t.pairs || [])[0];
      if (worst) steps.push({ k: 'dr', by: worst[0], t: pickBy([`${worst[1]}. Of all people. My fate is tied to ${worst[1]}.`, `Me and ${worst[1]}. Okay. We protect each other or we go down together.`], `${k}|w`) });
    } else if (t.kind === 'for-life') {
      title = 'Nominated for Life';
      steps.push(gather, ssv(`${t.by ? `${t.by} has used a power the Voice handed out in secret. ` : ''}${t.who}, from today you are nominated for life: every week, until the Voice decides otherwise.`, { scene: LIV([t.who, ...(t.by ? [t.by] : [])]), shake: true, nom: [t.who] }),
        { k: 'say', by: t.who, t: pickBy(['For LIFE? What does that even mean?', "Every week? Are you joking?", "Okay. Okay. Then the public decides every week. Bring it."], `${k}|0`) });
      if (t.by) steps.push({ k: 'dr', by: t.by, t: pickBy([`${t.who} is the biggest threat in this house. Every week in front of the public, let's see how long that lasts.`, `Nothing personal, ${t.who}. Well, a bit personal.`], `${k}|by`) });
    } else if (t.kind === 'inverted') {
      title = 'The Inverted Nominations';
      steps.push(gather, ssv('This week, the nominations are inverted. In the confessional, you will not name who you want to see leave. You will name the two housemates you want to SAVE.'),
        ssv('The housemates the fewest of you save will face the public.'),
        { k: 'beat', t: pickBy(['A long silence. Then everybody looks at who they will save, and who they will not.', 'It sounds kinder. It is not. Everybody in the room knows it.'], `${k}|r`) });
    } else if (t.kind === 'houses') {
      title = 'Immunity House against Nomination House';
      const [ca, cb] = t.champions || [];
      const A = t.immuneHouse || [], B = t.nominationHouse || [];
      steps.push(gather, ssv('This week, the house is split in two. Two houses, two champions, one duel. The winning house will be immune. The other will nominate among itself.'),
        { k: 'beat', scene: { set: 'arena', plate: 'ss-arena', room: 'The Games Arena', cam: 7, kicker: 'Cam 07 · The Games Arena', cast: spread([ca, cb].filter(Boolean)) }, t: `${ca} against ${cb}. Everybody else shouts from the sidelines.` },
        ssv(`${t.winner} wins the duel. ${listOf(A)}: you are the Immunity House. Nobody can nominate you this week.`, { toast: ['THE IMMUNITY HOUSE', '#22c55e'], scene: LIV(A) }),
        ssv(`${listOf(B)}: you are the Nomination House. This week's nominees will come from among you.`, { toast: ['THE NOMINATION HOUSE', '#ff3355'], scene: LIV(B) }),
        { k: 'dr', by: B[0] || ca, t: pickBy(['Half the house is safe and I am in the other half. Lovely.', 'Now it is us against us. That is the worst kind of week.'], `${k}|h`) });
    } else if (t.kind === 'red-room') {
      title = 'The Red Room';
      steps.push(gather, ssv('A new door has appeared in the house. A red door. The Voice will not say what is behind it.'),
        { k: 'beat', scene: { set: 'truths', plate: 'ss-truths', room: 'The Red Room', cam: 22, kicker: 'Cam 22 · The Red Room', cast: [[t.who, 50]] }, t: pickBy([`Everybody walks past it all afternoon. At six, ${t.who} can't stand it any more, and goes in.`, `${t.who} lasts an hour, then opens the red door.`], `${k}|in`) },
        ssv(`${t.who}, welcome to the red room. Whoever enters it is nominated. And you must choose one housemate to join you.`, { nom: [t.who], shake: true }),
        { k: 'say', by: t.who, t: `${t.dragged}. Sorry. Not sorry.` },
        ssv(`${t.dragged} is nominated too.`, { nom: [t.who, t.dragged] }),
        { k: 'dr', by: t.dragged, t: pickBy([`I didn't even go near that door! And I'm nominated because ${t.who} was curious?`, `${t.who} had one choice and chose me. Message received.`], `${k}|d`) });
    } else if (t.kind === 'everybody') {
      title = 'Everybody Is Nominated';
      steps.push(gather, ssv('This week, there will be no nominations.'), { k: 'beat', t: 'Relief, for about a second.' },
        ssv('Because this week, every one of you is nominated. The whole house faces the public, and one of you will leave.', { shake: true, nom: house.slice() }),
        { k: 'beat', t: pickBy(['The room goes very, very quiet.', 'Somebody laughs. Nobody else does.'], `${k}|e`) },
        { k: 'dr', by: house[0], t: pickBy(["Everybody? Then it's all about who the public likes. Which is terrifying.", "No hiding this week. Not for anybody."], `${k}|e2`) });
    } else if (t.kind === 'exclusive') {
      title = 'One Name for Everybody';
      steps.push(gather, ssv(`This week, there will be no vote. ${t.who}, you alone will name the nominees, in the confessional, and you will tell the house why.`, { scene: LIV(house) }),
        { k: 'say', by: t.who, t: pickBy(['Me? All of them?', "Oh no. Oh, everybody's going to hate me."], `${k}|0`) },
        { k: 'beat', t: 'Every head in the room turns to the same place.' });
    }
  }
  if (!steps.length) return null;
  return { id: `bb-ss-ntwist-${t?.kind || life?.kind}-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '12:00', ...LIV(house), sceneful: true,
    title, label: title, sub: t?.kind ? 'This week' : 'For life', steps };
}
