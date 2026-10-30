// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-groups.js — the hidden group, on screen
// ══════════════════════════════════════════════════════════════════════
//
// What js/ss/hidden-groups.js decided: launch night's walk into the space instead of the house, every week
// in the space, and the live entrance on the prime. Words only. The spaces' plates are the user's to make
// (Downloads/SecretStory-plates/to-edit-family1); until one exists steps.js plays the closest room built.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const listOf = xs => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const spread = a => a.map((n, i) => [n, a.length === 1 ? 50 : Math.round(20 + (60 * i) / (a.length - 1))]);
import { secretAs } from './ss-words.js';
const at = (plate, room, who, set = 'attic') => ({ set, plate, room, cam: 21, kicker: `Cam 21 · ${room}`, cast: spread(who) });

/** Each space, in words: where it is, what it is like, and the Voice's words on launch night. */
export const SPACE = {
  'secret-box': { room: 'The Secret Box', intro: 'In the corner of the living room there is a black glass cube. You will live inside it. You will see everything. Nobody will see you.',
    goal: 'To get out, find the secret of one housemate, and they may be nominated. Whoever is last out of the box comes in nominated.', look: 'Through the tinted glass, the living room carries on, a metre away.' },
  intruders: { room: "The Intruders' House", intro: 'Next door, through a tunnel, there is a second house. That is where you will live, for now.',
    goal: 'Spy on the house, steal what you can, and come in one by one as new housemates. If the house finds the tunnel, you all come in, and one of you is nominated.', look: 'The little house is cramped and messy. Through a crack in the tunnel, voices from the main house.' },
  'crystal-house': { room: 'The Crystal House', intro: 'In the garden, a house made of glass. You will live there, in full view.',
    goal: 'Every prime, the main house will vote to let one of you in. The last one to come in will be nominated.', look: 'Through the glass walls, the main house watches them as much as they watch the main house.' },
  hotel: { room: 'The Hotel of Secrets', intro: 'Next door, there is a hotel. Your room is ready.',
    goal: 'The house will hunt for your faces among two hundred portraits. The first one they find walks in nominated.', look: 'A quiet lobby, a corridor of doors, and screens with the house on them.' },
  yacht: { room: 'The Yacht of Secrets', intro: 'At the pier, there is a yacht. That is where you will live.',
    goal: 'From the deck, investigate the house. Every secret you get right puts its holder up. In two weeks, you come aboard the house.', look: 'The deck sways a little. On the shore, the House of Secrets, lit up.' },
};

/** Launch night: the Voice sends them to the space instead of the house (ss-launch.js asks for these steps). */
export function launchToSpaceSteps(group, names, H, key, already = []) {
  const { ssv } = H;
  const S = SPACE[group.id] || SPACE['secret-box'];
  // (the second and third to go are told in a line: the Voice explained it once)
  if (already.length) return [
    ssv(`${listOf(names)}, you will not enter the House of Secrets tonight either. ${listOf(already)} ${already.length > 1 ? 'are' : 'is'} waiting for you in ${S.room}.`, { toast: [S.room.toUpperCase(), '#7c5cff'] }),
    { k: 'beat', scene: at(group.space, S.room, [...already, ...names]), t: pickBy([`${already[0]} is the first to grab ${names[0]}: "Welcome to the club."`, `${listOf(already)} ${already.length > 1 ? 'wave' : 'waves'} ${names[0]} in, finger on lips.`], `${key}|j`) },
    { k: 'dr', by: names[0], t: pickBy(["So that's where they were. Okay. I'm in.", "A secret inside a secret. I love this show."], `${key}|k`) },
  ];
  return [
    ssv(`${listOf(names)}, you will not enter the House of Secrets tonight.`, { toast: [S.room.toUpperCase(), '#7c5cff'], shake: true }),
    { k: 'say', by: names[0], t: pickBy(['What? Why not?', 'Wait, what?', "I'm sorry, what did you just say?"], `${key}|0`) },
    ssv(S.intro),
    ssv(S.goal),
    { k: 'beat', scene: at(group.space, S.room, names), t: S.look },
    { k: 'dr', by: names[names.length - 1], t: pickBy(["Okay. Nobody saw that coming. Especially not me.", "Everybody else gets a house. We get this. I love it, actually.", "They don't even know we exist. That's a weapon."], `${key}|1`) },
  ];
}

// (said by the narrator at the top of every week in the space: the user, 2026-10-29, "how did they even got in that
// secret box theres no twist announcement so i dont understand whats going on")
const RECAP = {
  'secret-box': w => `Since launch night, ${listOf(w)} ${w.length > 1 ? 'have' : 'has'} been living inside the black glass cube in the corner of the living room. ${w.length > 1 ? 'They see' : 'Sees'} everything the house does, and the house has no idea anybody is in there. The only way out: find somebody's secret.`,
  intruders: w => `Since launch night, ${listOf(w)} ${w.length > 1 ? 'have' : 'has'} been hiding in a second house next door, at the end of a tunnel. The main house does not know they exist.`,
  'crystal-house': w => `${listOf(w)} ${w.length > 1 ? 'live' : 'lives'} in the glass house in the garden, in full view, waiting for the main house to let them in.`,
  hotel: w => `${listOf(w)} ${w.length > 1 ? 'are' : 'is'} hiding in the hotel next door, while the house hunts for their faces among two hundred portraits.`,
  yacht: w => `${listOf(w)} ${w.length > 1 ? 'live' : 'lives'} on the yacht at the pier, watching the House of Secrets from the deck.`,
};
/** A week in the space. */
export function ssGroupWeekScreen(act, ctx, H) {
  const { ssv } = H;
  const S = SPACE[act.id] || SPACE['secret-box'];
  const k = `${ctx.week}|ssgrp|${act.id}`;
  const hid = act.hidden || [];
  // (the yacht: the deck one week, a cabin the next; the box seen from inside)
  const space = act.id === 'yacht' ? ['ss-yacht-deck', 'ss-yacht-cabin', 'ss-yacht-cabin-2'][(ctx.week || 0) % 3] : act.space;
  /** @type {any[]} */ const steps = [{ k: 'beat', scene: at(space, S.room, hid), t: (RECAP[act.id] || RECAP['secret-box'])(hid), toast: [S.room.toUpperCase(), '#7c5cff'] },
    { k: 'beat', t: S.look }];
  // what they are watching, said to each other (or to the camera, alone): a theory said about its person, never a quote
  (act.watched || []).slice(0, 2).forEach((w, i) => {
    const mate = hid.find(n => n !== w.who);
    const guess = secretAs(w.about, w.theory, H.pronouns?.(w.about));
    steps.push({ k: 'beat', t: pickBy([`On the other side of the glass, ${w.about} is laughing in the kitchen, with no idea anybody is watching.`, `${w.about} walks right past the glass. Close enough to touch.`, `${w.about} sits down alone on the sofa, a metre away, and goes very quiet.`], `${k}|b|${i}`) });
    if (mate) steps.push({ k: 'say', by: w.who, t: pickBy([`Look at ${w.about}. I think ${guess}.`, `Watch ${w.about} when nobody is talking. I think ${guess}.`], `${k}|s|${i}`) },
      { k: 'say', by: mate, t: pickBy(["You said that yesterday. We need more than a feeling.", "Maybe. Write it down.", "If you're right, that's our way out of here.", "Then we tell the Voice. But if we're wrong, we're stuck in here."], `${k}|r|${i}`) });
    else steps.push({ k: 'dr', by: w.who, t: pickBy([`Nobody in there knows I can see them. And I think ${guess}.`, `Days of watching ${w.about}. I think ${guess}.`], `${k}|s|${i}`) });
  });
  for (const e of act.events || []) {
    if (e.kind === 'found') steps.push(ssv(`${e.who}, you believe you know ${e.on}'s secret. Tell the Voice.`), { k: 'say', by: e.who, t: `"${e.text || '...'}"` },
      ssv(act.goal === 'secret' ? `${e.who}, that is right. At the prime, you will leave ${S.room}.${e.nominated ? ` And ${e.on} is nominated.` : ''}` : `${e.who}, that is right.${e.nominated ? ` ${e.on} is nominated.` : ` ${e.on}'s secret is no longer safe.`}`, e.nominated ? { nom: [e.on] } : {}));
    else if (e.kind === 'tunnel') steps.push({ k: 'beat', scene: at('ss-tunnel', 'The Tunnel', [e.who], 'hallway'), t: `${e.who} moves a cupboard in the laundry, and finds a hatch. And a ladder. And a tunnel.`, shake: true },
      { k: 'say', by: e.who, t: "Everybody! EVERYBODY! Come and look at this!" }, ssv(`The house has found the tunnel. At the prime, the intruders will come in, and one of them will be nominated.`));
    else if (e.kind === 'steal') steps.push({ k: 'beat', t: `At four in the morning, ${e.who} creeps up the tunnel and takes the clue off the living-room table, reads it, and puts it back.` });
    else if (e.kind === 'identified') steps.push({ k: 'beat', scene: at('ss-hotel-gallery', 'The Portrait Gallery', [e.by], 'ceremony'), t: `${e.by} stops in front of one portrait out of two hundred, and taps it.` },
      { k: 'say', by: e.by, t: `This one. I'm sure. This one is real.` }, ssv(`${e.by}, you have found ${e.who}.`));
    else if (e.kind === 'rescue') steps.push({ k: 'beat', t: `In the main house, the debate goes on all night: who do they let out of the glass house first?` });
  }
  if ((act.entering || []).length) steps.push({ k: 'dr', by: act.entering[0].name, t: pickBy(["Tonight I walk into that house. I've been waiting for this.", "Tonight's the night. Let's see their faces."], `${k}|in`) });
  return { id: `bb-ss-group-${act.id}-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '22:00', ...at(act.space, S.room, hid), sceneful: true,
    title: S.room, label: S.room, sub: listOf(hid), steps };
}

/** The prime: they walk in, live. */
export function ssGroupEntryScreen(seg, ctx, host, H) {
  const { ssv } = H;
  const S = SPACE[seg.group] || SPACE['secret-box'];
  const k = `${ctx.week}|ssgin`;
  const names = (seg.came || []).map(e => e.name);
  const LIV = { set: 'ceremony', plate: 'living-sofas', room: 'Living Room', cam: 4, kicker: 'Live · Living room', cast: spread(names) };
  /** @type {any[]} */ const steps = [{ k: 'host', by: host, t: pickBy(['House of Secrets, tonight, the house gets a little bigger.', "Something's about to happen in that living room. Look at the door."], `${k}|0`), toast: [S.room.toUpperCase(), '#7c5cff'] }];
  for (const e of seg.came || []) {
    const how = e.how === 'found' ? `${e.name} found ${e.on}'s secret, and comes out of ${S.room}.` : e.how === 'swap' ? `A new housemate walks in. The house has no idea where ${e.name} has really been.`
      : e.how === 'caught' ? `The tunnel has been found: ${e.name} comes in with the intruders${e.nominated ? ', and is nominated' : ''}.` : e.how === 'rescued' ? `The house has voted: ${e.name} comes out of the glass house.`
        : e.how === 'last' ? `${e.name} is the last one out of ${S.room}${e.nominated ? ', and comes in nominated' : ''}.` : `${e.name}'s time in ${S.room} is over.`;
    // an intruder comes up through a hatch in one of the bedrooms (the user's plates: ss-hatch-girls, ss-hatch-boys)
    if (seg.group === 'intruders' && (e.how === 'swap' || e.how === 'caught')) steps.push({ k: 'beat', scene: at(hash(e.name) % 2 ? 'ss-hatch-boys' : 'ss-hatch-girls', 'The Bedroom', [e.name], 'bedroom'), t: pickBy([`A square of the bedroom floor lifts. ${e.name} climbs out of the hatch and dusts off.`, `The hatch under the beds creaks open, and ${e.name}'s head pops up.`], `${k}|h|${e.name}`) });
    steps.push({ k: 'beat', scene: LIV, t: how, shake: e.how === 'caught' || e.how === 'found' },
      { k: 'say', by: e.name, t: pickBy(['Hello, everybody! Did you miss me? You didn\'t know me. Fair.', "Surprise!", "Hi. I've been watching you. Sorry. Hi."], `${k}|${e.name}`) });
  }
  steps.push({ k: 'beat', t: pickBy(['The living room explodes. Questions everywhere, from everybody at once.', 'Half the house hugs them. The other half is doing the maths.'], `${k}|r`) });
  if ((seg.left || []).length) steps.push(ssv(`${listOf(seg.left)}, your time in ${S.room} is not over.`));
  return { id: `bb-ss-prime-entry-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: 'LIVE', ...LIV, sceneful: true, title: S.room, label: 'The Arrival', sub: listOf(names), steps };
}

// Until the user's plates exist, the spaces play in the closest room the house has
export const SPACE_FALLBACK = { 'ss-box': 'living-sofas', 'ss-box-inside': 'ss-attic-monitors', 'ss-tower': 'ss-attic-desk', 'ss-intruders': 'bedroom2-wide',
  'ss-tunnel': 'hallway', 'ss-hotel-lobby': 'foyer', 'ss-hotel-gallery': 'library-wide', 'ss-crystal': 'lawn-pool', 'ss-yacht-deck': 'pool-wide',
  'ss-yacht-cabin': 'bedroom-wide', 'ss-antechamber': 'foyer',
  // (twist families 2 to 4, until the user's plate jobs are done: Downloads/SecretStory-plates/to-edit-family4)
  // (the clue room, until the plate jobs in Downloads/SecretStory-plates/to-edit-family5 are done)
  'ss-clue-room': 'library-wide', 'ss-clue-board': 'library-desk',
  // (the new themed primes, until to-edit-family6 is done)
  'ss-lie-detector': 'ss-truths', 'ss-shields': 'purple-hall', 'ss-crystal-ball': 'front', 'ss-jungle': 'lawn-pool',
  'ss-other-house': 'ss-crystal', 'ss-other-house-bed': 'bedroom2-wide', 'ss-glass-wall': 'ss-crystal', 'ss-red-room': 'ss-truths', 'ss-bridge': 'ss-dilemma' };
