// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-voice-moments.js — the Voice's moments, on screen
// ══════════════════════════════════════════════════════════════════════
//
// The moments js/ss/voice-moments.js decided (a mission in the confessional, the
// red phone round the house, a present from the public, the red room, a birthday,
// a letter from home, a telling-off), each a short scene that goes into house
// life (vp-bb-ep/ss-episode.js folds it there). Words only: nothing here decides.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const money = n => `$${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const DR = (n, x = 50) => ({ set: 'dr', plate: 'confessional-close', room: 'Confessional', cam: 1, kicker: 'Cam 01 · Confessional', cast: [[n, x]] });
const ROOM = (set, plate, room, cast) => ({ set, plate, room, cam: 4, kicker: `Cam 04 · ${room}`, cast: cast.map((n, i, a) => [n, a.length === 1 ? 50 : Math.round(22 + 56 * i / (a.length - 1))]) });

/**
 * A Voice moment's screen (folded into house life by ss-episode.js).
 * @param {any} act an 'ss-voice-moment' act
 * @param {any} ctx the week's context
 * @param {{ ssv: Function }} H
 */
export function ssVoiceMomentScreen(act, ctx, H) {
  const { ssv } = H;
  const a = act.who, b = act.other;
  const k = `${ctx.week}|vm|${act.kind}|${a}`;
  /** @type {any[]} */ let steps = [];
  let first = DR(a);
  if (act.kind === 'mask') {
    steps = [
      ssv(`${a}, the Voice has a little mission for you. Somewhere in the house there's a mask. A very ugly mask.`),
      ssv(`If you can get ${b} to wear it before tonight, without saying why, the Voice will give you a clue about ${b}'s secret.`),
      { k: 'dr', by: a, t: pickBy([`A clue on ${b}? I'd wear the mask myself for that.`, `Okay. How do I get ${b} into a mask? Think, think.`], `${k}|a`) },
      { k: 'say', by: a, scene: ROOM('ceremony', 'living-sofas', 'Living Room', [a, b]), t: pickBy([`${b}, try this on. Just for a second. For a photo.`, `${b}, I bet you can't keep this on for a whole minute.`], `${k}|b`) },
      act.ok ? { k: 'say', by: b, t: pickBy(["Fine. Happy now? Why are you laughing?", "Okay, okay. How do I look?"], `${k}|c`) }
        : { k: 'say', by: b, t: pickBy(["Absolutely not. What is that thing?", "No. Why do you want me in a mask? That's weird."], `${k}|c`) },
      act.ok ? ssv(`${a}, well done. Here is your clue.${act.clue ? ` On the screen: ${act.clue}.` : ''}`, { scene: DR(a) })
        : { k: 'dr', by: a, scene: DR(a), t: pickBy([`${b} said no. Of course ${b} said no. Now ${b} thinks I'm up to something.`, 'Failed. And the mask is still in my bag.'], `${k}|d`) },
    ];
  } else if (act.kind === 'garlic') {
    steps = [
      ssv(`${a}, for five hundred dollars in your kitty, the Voice has a mission for you that's a little... strong.`),
      ssv('On the table in front of you: garlic, an onion and a shallot. Eat all three. Then spend the evening talking to everybody, very, very close.'),
      { k: 'dr', by: a, t: pickBy(["For five hundred dollars? I'd eat the table.", "Oh no. Oh, no no no. Fine."], `${k}|a`) },
      { k: 'say', by: a, scene: ROOM('kitchen', 'kitchen-room', 'Kitchen', [a, ...(act.victims || [])]), t: pickBy([`${(act.victims || [])[0] || 'Hey'}, come here, I need to tell you something. Closer.`, "Hi! Hello! How's everyone's day going?"], `${k}|b`) },
      ...(act.victims || []).slice(0, 1).map(v => ({ k: 'say', by: v, t: pickBy([`What is that smell? ${a}, what did you EAT?`, `Oh my god. ${a}, please, step back.`], `${k}|v`) })),
      act.ok ? ssv(`${a}, mission accomplished. Five hundred dollars for your kitty. And maybe a toothbrush.`, { scene: DR(a) })
        : { k: 'dr', by: a, scene: DR(a), t: "I couldn't do the onion. I tried. The onion won." },
    ];
  } else if (act.kind === 'tuck') {
    steps = [
      ssv(`${a}, please go and find ${b}, as discreetly as you can, and come back to the confessional with ${b}.`),
      { k: 'beat', scene: DR(a, 38), t: `${a} and ${b} squeeze onto the confessional sofa together.` },
      ssv(`${a}, ${b}, tonight the Voice would like you to tuck every housemate into bed, one by one. Nobody may know why.`),
      { k: 'say', by: b, t: pickBy(['Every single one? Even the grumpy ones?', "We're going to look completely insane."], `${k}|a`) },
      { k: 'beat', scene: ROOM('bedroom', 'bedroom-wide', "Girls' Bedroom", [a, b]), t: act.ok ? `At midnight, ${a} and ${b} go bed to bed, pulling the duvets up to everybody's chins. Somebody asks for a story.` : `${a} and ${b} start with the first bed and get laughed out of the room by the third.` },
      act.ok ? ssv(`${a}, ${b}, the Voice is very touched. Two hundred and fifty dollars each.`) : { k: 'dr', by: a, scene: DR(a), t: "They kicked us out. Fair enough. I'd kick us out too." },
    ];
  } else if (act.kind === 'poll') {
    const c = act.chain || [];
    first = ROOM('ceremony', 'living-sofas', 'Living Room', [...new Set(c.flatMap(x => [x.holder, x.named]))]);
    steps = [{ k: 'beat', t: 'The red phone rings in the living room. Everybody freezes.', prop: 'phone', press: true },
      { k: 'say', by: c[0].holder, t: 'Hello?' },
      ssv(`${c[0].holder}, this is the Voice. Put the phone on speaker, please. ${c[0].holder}, ${act.q}?`)];
    c.forEach((x, i) => {
      steps.push({ k: 'say', by: x.holder, t: i === 0 ? `${x.named}. Easy.` : pickBy([`Hmm... ${x.named}.`, `Honestly? ${x.named}.`, `Sorry, but ${x.named}.`], `${k}|${i}`) });
      steps.push(ssv(`Pass the phone to ${x.named}.`));
      if (i < c.length - 1) steps.push(ssv(`${x.named}, ${act.q}?`));
    });
    steps.push({ k: 'say', by: c.at(-1).named, t: pickBy(["What does that even mean? Hello? Voice?", "Wait, is that a good thing or a bad thing?", "I'll take it."], `${k}|end`) },
      ssv('Thank you. That is all for now.'));
  } else if (act.kind === 'present') {
    steps = [
      ssv(`${a}, please come to the confessional.`),
      { k: 'dr', by: a, t: pickBy(["Am I in trouble? I'm in trouble.", "What did I do?"], `${k}|a`) },
      ssv(`${a}, the Voice brings you good news. The public has decided to give you a present: ${money(act.money)} for your kitty.`),
      { k: 'dr', by: a, t: pickBy(["Thank you! Thank you, thank you, thank you. People out there like me!", "I didn't think anyone out there was even watching me. Thank you."], `${k}|b`) },
    ];
  } else if (act.kind === 'balls') {
    steps = [
      ssv(`${a}, welcome to the red room. In front of you, a ball machine. For two thousand dollars, catch at least ten balls before they touch the floor.`),
      { k: 'say', by: a, scene: ROOM('dr', 'confessional-close', 'The Red Room', [a]), t: pickBy(['Ten. I can do ten. Go!', 'Okay. Okay. Ready.'], `${k}|a`) },
      { k: 'beat', t: act.ok ? `Balls fly everywhere. ${a} dives, slides, catches one with a knee. Ten. Eleven.` : `The balls come too fast. ${a} gets ${act.caught}, and the rest bounce off the walls.` },
      act.ok ? ssv(`${act.caught} balls. ${a}, two thousand dollars for your kitty.`) : ssv(`${act.caught} balls, ${a}. Not enough this time.`),
    ];
  } else if (act.kind === 'coins') {
    steps = [
      ssv(`${a}, in front of you there's a piggy bank full of coins. Count them. If you're within five dollars, everything in it is yours.`),
      { k: 'beat', t: `${a} tips the piggy bank out on the floor and starts sorting coins into little towers.` },
      { k: 'say', by: a, t: `Okay. I think... ${money(act.said)}.` },
      act.ok ? ssv(`${a}, there was ${money(act.truth)} in the piggy bank. It's all yours.`) : ssv(`${a}, there was ${money(act.truth)} in the piggy bank. So close. But no.`),
    ];
  } else if (act.kind === 'scold') {
    first = ROOM('ceremony', 'living-sofas', 'Living Room', [a]);
    steps = [
      ssv(`${a}.`),
      { k: 'say', by: a, t: "Yes, Voice?" },
      ssv(`The Voice has noticed that ${act.text}.${act.money ? ` A hundred dollars from your kitty.` : ''} A little more sense of responsibility, please.`),
      { k: 'say', by: a, t: pickBy(["Sorry, Voice. Won't happen again.", "Okay, okay. Message received.", "In my defence... no, there's no defence. Sorry."], `${k}|a`) },
      { k: 'beat', t: pickBy(['The whole living room bursts out laughing.', 'Somebody claps. Somebody else starts a slow chant.', 'Everybody suddenly finds something to tidy.'], `${k}|b`) },
    ];
  } else if (act.kind === 'birthday') {
    first = ROOM('ceremony', 'living-sofas', 'Living Room', [a]);
    steps = [
      ssv(`Housemates. Today is a special day for one of you. ${a}, happy birthday.`),
      { k: 'beat', t: `The lights go down. A cake comes out of the store room, candles lit, and the whole house sings.` },
      { k: 'say', by: a, t: pickBy(["Stop it! You're going to make me cry. Okay, I'm crying.", "Nobody's ever sung to me that loud. Thank you, everybody."], `${k}|a`) },
      ssv(`${a}, there is a message for you on the screen.`),
      { k: 'dr', by: a, scene: DR(a), t: pickBy(["My family, on the screen, singing. I wasn't ready for that.", "Hearing my mum's voice in here... that's the best present I could have had."], `${k}|b`) },
    ];
  } else if (act.kind === 'letter') {
    steps = [
      ssv(`${a}, the Voice knows the last few days have been hard. Somebody has written to you.`),
      { k: 'beat', t: `There's an envelope on the confessional sofa. ${a} opens it slowly.`, prop: 'envelope', press: true },
      { k: 'dr', by: a, t: pickBy(['"We\'re so proud of you. Keep going." That\'s all it says. That\'s all I needed.', "It's from home. I'm not going to read it out. I'm just going to hold it for a minute."], `${k}|a`) },
      ssv('That is all for now.'),
    ];
  } else return null;
  steps = steps.filter(Boolean);
  if (!steps.length) return null;
  steps[0] = { ...steps[0], toast: steps[0].toast || ['THE VOICE', '#e0b84a'] };
  return { id: `bb-ss-vm-${act.kind}-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '16:00', set: first.set, plate: first.plate, room: first.room, cam: first.cam,
    kicker: first.kicker, title: 'The Voice', label: 'The Voice', sub: a, cast: first.cast, steps };
}
