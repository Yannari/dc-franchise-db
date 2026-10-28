// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-production.js — a production secret's week, on screen
// ══════════════════════════════════════════════════════════════════════
//
// What js/ss/production.js decided for one role this week: the Voice's brief in the confessional, the moment in
// the house, and how it ended (paid, failed, noticed). A scene of house life: ss-episode.js folds it into the
// days (FOLD, 'prod'). Words only.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const money = n => `$${Math.round(Math.abs(Number(n)) || 0).toLocaleString('en-US')}`;
const both = xs => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const spread = a => a.map((n, i) => [n, a.length === 1 ? 50 : Math.round(12 + (76 * i) / (a.length - 1))]);
const SC = (set, plate, room, who, cam = 4) => ({ set, plate, room, cam, kicker: `Cam ${String(cam).padStart(2, '0')} · ${room}`, cast: spread(who.filter(Boolean)) });
const DR = who => SC('dr', 'confessional-close', 'Confessional', [].concat(who), 1);
const KITCHEN = who => SC('kitchen', 'kitchen-wide', 'Kitchen', who, 3);
const LIVING = who => SC('ceremony', 'living-sofas', 'Living Room', who, 4);
const GARDEN = who => SC('yard', 'patio', 'The Garden', who, 6);
const BEDROOM = who => SC('bedroom', 'bedroom-beds', 'Bedroom', who, 8);
const TUNNEL = who => SC('attic', 'ss-tunnel', 'The Tunnels', who, 23);

export const ROLE_TITLE = {
  accomplice: "The Voice's Accomplice", 'fake-couple': 'The Fake Couple', 'public-couple': "The Public's Couple", 'fake-siblings': 'The Fake Siblings',
  'public-family': "The Public's Family", enemies: 'The Worst of Enemies', chosen: 'The Chosen Ones', tunnels: 'The Masters of the Tunnels',
  'house-key': 'The Key', 'access-code': 'The Access Code', protector: "The Couple's Protector", saboteur: 'The Saboteur', spy: "The Internet's Spy",
  oracle: 'The Oracle', guardians: 'The Guardians of Transparency',
};
// what the house must believe, for the acted roles
const BELIEVE = { 'fake-couple': 'a couple', 'public-couple': 'a couple', 'fake-siblings': 'brother and sister', 'public-family': 'one family', enemies: 'enemies' };

/**
 * @param {any} act an 'ss-production' act
 * @param {any} ctx the week's context
 * @param {{ ssv: Function }} H
 */
export function ssProductionScreen(act, ctx, H) {
  const { ssv } = H;
  const hs = (act.holders || []).filter(Boolean);
  const [a, b] = hs;
  if (!a) return null;
  const k = `${ctx.week}|prod|${act.role}|${a}`;
  const you = hs.length > 1 ? both(hs) : a;
  const w = act.watcher;
  /** @type {any[]} */ let steps = [];
  const brief = t => ssv(`${you}, ${t}`, { scene: DR(hs), toast: [(!act.custom && ROLE_TITLE[act.role]?.toUpperCase()) || 'PRODUCTION SECRET', '#7c5cff'] });
  const paid = (who, amt) => ssv(`Well done. ${money(amt)} goes into ${who.length > 1 ? 'each of your kitties' : 'your kitty'}.`, { scene: DR(who) });
  const noticed = (line, dr) => [{ k: 'beat', scene: LIVING([w, a]), t: line }, { k: 'dr', by: w, scene: DR(w), t: dr }];
  switch (act.role) {
    case 'accomplice': {
      const t = act.target;
      const order = { 'false-lead': `make the house believe a false lead about ${t}'s secret`, 'wrong-buzz': `talk somebody into pressing the buzzer on ${t}, with the wrong secret`,
        steer: `get the house talking about ${t} before the nominations` }[act.order] || 'carry out an order from the Voice';
      steps.push(brief(`the Voice has an order for you. This week, ${order}.`),
        { k: 'dr', by: a, scene: DR(a), t: pickBy([`Okay. ${t}. I can do that without anybody noticing.`, `The Voice wants ${t}, so the Voice gets ${t}.`], `${k}|0`) },
        { k: 'beat', scene: KITCHEN([a, t]), t: act.order === 'steer' ? pickBy([`At lunch, ${a} brings up ${t}'s name twice, then lets the others take over.`, `${a} asks the kitchen, quite casually, what everybody thinks of ${t}.`], `${k}|1`)
          : act.order === 'wrong-buzz' ? pickBy([`${a} sits down next to ${act.mark} and starts talking about ${t}'s secret, and the buzzer.`, `${a} tells ${act.mark}, in confidence, a theory about ${t} that ${a} knows is wrong.`], `${k}|1`)
          : pickBy([`${a} "accidentally" mentions to ${act.mark} something ${t} said last night, and lets it grow.`, `By dinner, ${act.mark} is repeating a theory about ${t}'s secret that ${a} invented.`], `${k}|1`) });
      if (act.ok) steps.push(paid([a], act.money));
      else steps.push(...noticed(`${w} watches ${a} steer the conversation back to ${t} for the third time.`, pickBy([`Why is ${a} so interested in ${t} all of a sudden? Somebody is asking ${a} to do this.`, `${a} is working for somebody. I just don't know who yet.`], `${k}|w`)));
      break;
    }
    case 'fake-couple': case 'public-couple': case 'fake-siblings': case 'public-family': case 'enemies': {
      const scene = act.role === 'enemies' ? LIVING(hs) : act.role.includes('couple') ? GARDEN(hs) : KITCHEN(hs);
      steps.push(brief(`the house must keep believing you are ${BELIEVE[act.role]}. This week, the Voice wants to see ${act.act}.`),
        { k: 'beat', scene, t: act.ok ? pickBy([`${act.act[0].toUpperCase()}${act.act.slice(1)}. The whole house sees it.`, `They do it in front of everybody: ${act.act}.`], `${k}|1`)
          : pickBy([`They try: ${act.act}. It comes out stiff, and somebody is watching.`, `${act.act[0].toUpperCase()}${act.act.slice(1)}, but it does not look natural.`], `${k}|1`) });
      if (act.role === 'enemies') steps.push({ k: 'beat', scene: BEDROOM(hs), t: pickBy([`Later, alone in the bedroom, ${a} and ${b} compare notes and laugh about it.`, `At night, ${a} whispers to ${b}: "Good fight today."`], `${k}|2`) });
      if (act.ok) steps.push(paid(hs, act.money), { k: 'dr', by: b || a, scene: DR(b || a), t: pickBy(['They believe it. Every single one of them.', 'It works. It is tiring, but it works.'], `${k}|3`) });
      else if (w) steps.push(...noticed(act.role === 'enemies' ? `${w} catches ${a} and ${b} sharing a smile across the room.` : `${w} sees ${a} and ${b} drop the act the second they think nobody is looking.`,
        pickBy([`Something is off with ${a} and ${b}. I'm going to keep watching.`, `I don't believe ${a} and ${b}. Not for one minute.`], `${k}|w`)));
      break;
    }
    case 'chosen': {
      steps.push(brief(`the Voice has information for you. The house is about to talk about ${act.tip}. Use it carefully.`),
        { k: 'dr', by: a, scene: DR(a), t: pickBy([`So the Voice told us about ${act.tip}. Now I just have to act like I don't know.`, `${act.tip}. Good to know. Very good to know.`], `${k}|0`) });
      if (act.immune) steps.push(ssv(`And this week, the Voice protects you, ${act.immune}. You cannot be nominated.`, { scene: DR(act.immune), toast: ['PROTECTED', '#22c55e'] }),
        { k: 'dr', by: act.immune, scene: DR(act.immune), t: pickBy(['Safe this week, and nobody in that house knows why.', 'I am protected. I have to keep a straight face at the nominations.'], `${k}|1`) });
      break;
    }
    case 'tunnels': {
      steps.push(brief('the tunnels are yours. Listen well.'),
        { k: 'beat', scene: TUNNEL(hs), t: pickBy([`Behind the bedroom wall, ${you} sit in the dark and listen to the house talk about secrets.`, `In the tunnels, ${you} hear every word said in the bedroom.`], `${k}|1`) });
      if ((act.heard || []).length) steps.push({ k: 'dr', by: b || a, scene: DR(b || a), t: pickBy([`We heard ${both(act.heard)} talk about their secrets. We are getting close.`, `Tonight, through the wall, we learned more about ${both(act.heard)} than in two weeks of watching.`], `${k}|h`) });
      if (act.noise && w) steps.push({ k: 'beat', scene: BEDROOM([w]), t: `A noise inside the wall. ${w} stops talking and listens.` }, { k: 'say', by: w, t: pickBy(['Did you hear that? In the wall?', 'There is something behind that wall. I am telling you.'], `${k}|n`) });
      if (act.life) steps.push(ssv(`Masters of the tunnels, tonight you have a power. Choose one housemate, and they will be nominated for life.`, { scene: DR(hs) }),
        { k: 'say', by: a, scene: DR(hs), t: `${act.life}.` },
        ssv(`${act.life} is nominated for life.`, { scene: LIVING([act.life]), shake: true, nom: [act.life] }));
      break;
    }
    case 'house-key': case 'access-code': {
      steps.push(brief(`you carry part of the secret of the house. ${act.clue ? `This week, the house will find this: ${act.clue}.` : 'Keep it safe.'}`),
        { k: 'dr', by: a, scene: DR(a), t: pickBy(['Every time they talk about the secret of the house, I have to look bored.', 'I know more than all of them about the secret of the house. I just cannot say it.'], `${k}|0`) });
      if (act.sell) steps.push(ssv(`${a}, the Voice makes you an offer. ${money(act.money)} to keep your piece hidden one more week.`, { scene: DR(a) }), { k: 'say', by: a, t: 'Deal.' });
      break;
    }
    case 'protector': {
      const [c1, c2] = act.couple || [];
      steps.push(brief(`your mission this week: keep ${c1} and ${c2}'s secret safe.`),
        { k: 'beat', scene: KITCHEN([a, c1, c2]), t: act.ok ? pickBy([`When the talk turns to ${c1} and ${c2}, ${a} changes the subject, twice.`, `${a} points the hunters at another lead, far away from ${c1} and ${c2}.`], `${k}|1`)
          : `${a} defends ${c1} and ${c2} a bit too quickly.` });
      if (act.ok) steps.push(paid([a], act.money));
      else if (w) steps.push(...noticed(`${w} notices how fast ${a} jumps in for ${c1} and ${c2}.`, `Why does ${a} care so much about ${c1} and ${c2}'s secret?`));
      break;
    }
    case 'saboteur': {
      steps.push(brief('your mission: send the hunters the wrong way.'),
        { k: 'beat', scene: KITCHEN([a]), t: act.victim ? pickBy([`${a} leaves a hint about ${act.victim}'s secret on the kitchen table. It points the wrong way.`, `${a} tells two housemates, as a secret, a theory about ${act.victim} that ${a} knows is false.`], `${k}|1`) : `${a} looks for a chance, and does not find one.` });
      if (act.ok) steps.push(paid([a], act.money));
      break;
    }
    case 'spy': {
      const s = act.subject;
      steps.push(brief("your mission: film a moment the house thinks is private, and send it to the public."),
        { k: 'beat', scene: BEDROOM([s, a]), t: pickBy([`${s} talks quietly in the bedroom, sure nobody is listening. ${a}'s camera is running.`, `${a} films ${s} on the bed, in the middle of a private conversation.`], `${k}|1`) });
      if (act.caught) steps.push({ k: 'say', by: s, scene: BEDROOM([s, a]), t: pickBy([`${a}. Were you filming me?`, `What is that in your hand, ${a}?`], `${k}|c`) }, { k: 'dr', by: s, scene: DR(s), t: `${a} was filming me. I do not trust ${a} any more.` });
      else steps.push(ssv(`${a}, the public has seen it.`, { scene: DR(a) }));
      break;
    }
    case 'oracle': {
      steps.push(brief('the hidden phone is ready. Listen.'),
        { k: 'beat', scene: DR(a), t: act.heard ? `On the hidden line, ${a} hears ${act.heard} talking about their secret in the bedroom.` : `The hidden line is quiet this week.` });
      if (act.lock) steps.push({ k: 'beat', scene: LIVING([a]), t: `At night, ${a} tries the oracle's key in every lock in the house, and one of them opens.` }, ssv(`${a}, you have found the lock. ${money(act.money)} for you.`, { scene: DR(a), toast: ['THE LOCK', '#e0b84a'] }));
      break;
    }
    case 'guardians': {
      steps.push(brief('who in this house is lying the most this week?'),
        { k: 'say', by: a, scene: DR(hs), t: `${act.liar}.` },
        act.ok ? ssv(`The Voice confirms it. ${act.liar} pays ${money(act.money)} from their kitty to yours.`, { scene: DR(hs), toast: ['RIGHT', '#22c55e'] })
          : ssv(`Wrong. That mistake costs you ${money(act.money)}.`, { scene: DR(hs), toast: ['WRONG', '#ff3355'] }),
        { k: 'dr', by: b || a, scene: DR(b || a), t: act.ok ? `I knew ${act.liar} was lying. Now I have proof.` : `We were wrong about ${act.liar}. That hurts.` });
      break;
    }
    default: return null;
  }
  const first = steps[0]?.scene || DR(hs);
  return { id: `bb-ss-prod-${act.role}-${a}-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '15:00', set: first.set, plate: first.plate, room: first.room, cam: first.cam,
    kicker: first.kicker, title: (!act.custom && ROLE_TITLE[act.role]) || 'A Production Secret', label: (!act.custom && ROLE_TITLE[act.role]) || 'A Production Secret',
    sub: act.custom ? act.text : 'A production secret', cast: first.cast, steps };
}
