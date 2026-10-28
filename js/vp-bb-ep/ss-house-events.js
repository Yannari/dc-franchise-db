// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-house-events.js — the week's big house event, on screen
// ══════════════════════════════════════════════════════════════════════
//
// What js/ss/house-events.js decided (the house mission, the housework in uniform, Miss and Mister Secret, the
// clan war, a secret room found), each a screen of the days that moves room to room. Words only.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const money = n => `$${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const listOf = xs => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const spread = a => a.map((n, i) => [n, a.length === 1 ? 50 : Math.round(12 + (76 * i) / (a.length - 1))]);
const SC = (set, plate, room, who, cam = 4) => ({ set, plate, room, cam, kicker: `Cam ${String(cam).padStart(2, '0')} · ${room}`, cast: spread(who.filter(Boolean)) });
const DR = n => SC('dr', 'confessional-close', 'Confessional', [n], 1);

/**
 * @param {any} act an 'ss-house-event' act
 * @param {any} ctx the week's context (ctx.house: who is in)
 * @param {{ ssv: Function }} H
 */
export function ssHouseEventScreen(act, ctx, H) {
  const { ssv } = H;
  const house = (ctx.house || []).filter(Boolean);
  const k = `${ctx.week}|he|${act.kind}`;
  /** @type {any[]} */ let steps = [];
  let title = 'The House', sub = '', start = SC('ceremony', 'living-sofas', 'Living Room', house);
  if (act.kind === 'mission') {
    title = 'The House Mission'; sub = act.ok ? 'Done' : 'Failed';
    steps = [
      ssv('Housemates, please come to the living room. All of you.', { scene: start, toast: ['THE HOUSE MISSION', '#e0b84a'] }),
      ssv(`The Voice has a mission for the whole house. This week, you must ${act.text}.`),
      ssv(`If you succeed, every one of you wins ${money(act.reward)}. If one of you fails, the whole house pays.`),
      { k: 'beat', t: pickBy(['Everybody looks at everybody. Somebody is already doing the maths.', 'A cheer goes up. Then the nerves set in.'], `${k}|0`) },
      { k: 'dr', by: act.weak, scene: DR(act.weak), t: pickBy(["If anybody messes this up, it's going to be me. I know it.", "No pressure. Just everybody's money on my shoulders."], `${k}|w`) },
      { k: 'beat', scene: start, t: act.ok ? pickBy(['Days of practice, a few fights, and one last try. And it works.', `Against all odds, the house pulls it off, ${act.weak} included.`], `${k}|ok`)
        : pickBy([`It all goes well until ${act.weak} cracks.`, `So close. Then ${act.weak} slips, and the whole thing falls apart.`], `${k}|ko`) },
      act.ok ? ssv(`Housemates, mission accomplished. ${money(act.reward)} for every one of you.`, { toast: ['MISSION ACCOMPLISHED', '#22c55e'] })
        : ssv('Housemates, the mission has failed. Tonight, there will be no hot water in the House of Secrets.', { toast: ['MISSION FAILED', '#ff3355'] }),
      act.ok ? { k: 'say', by: act.weak, t: pickBy(['We did it! We actually did it!', "I didn't ruin it! Everybody, I didn't ruin it!"], `${k}|end`) }
        : { k: 'say', by: house.find(n => n !== act.weak) || act.weak, t: pickBy([`Cold showers. Thanks, ${act.weak}.`, `It's fine. It's fine. It's not fine.`], `${k}|end`) },
    ];
  } else if (act.kind === 'housework') {
    const [a, b] = [act.who, act.other];
    title = 'The Housework'; sub = `${a} and ${b}`;
    start = SC('dr', 'confessional-close', 'Confessional', [a, b], 1);
    steps = [
      ssv(`${a}, ${b}, the Voice has noticed the house is a mess. For five hundred dollars each, you will clean all of it tonight.`, { scene: start, toast: ['THE HOUSEWORK', '#ff8fb1'] }),
      ssv('In the store room you will find your uniforms. Music will be provided. The house will be watching.'),
      { k: 'say', by: b, t: pickBy(['Uniforms? What kind of uniforms?', "Oh no. I know exactly what kind of uniforms."], `${k}|0`) },
      { k: 'beat', scene: SC('ceremony', 'living-sofas', 'Living Room', [a, b, ...house.filter(n => n !== a && n !== b).slice(0, 4)]), t: `The music kicks in. ${a} and ${b} come out of the store room in tiny aprons, feather dusters in hand, and the sofas go wild.` },
      { k: 'beat', t: pickBy([`${a} dusts the Eye on the screen, very slowly. ${b} mops the floor in time with the beat.`, `${b} does the windows with a spin. ${a} vacuums the sofa with everybody still sitting on it.`], `${k}|1`) },
      ...(act.fan ? [{ k: 'dr', by: act.fan, scene: DR(act.fan), t: pickBy([`I'm not saying I enjoyed watching ${a} clean. I'm just saying I'll never look at a mop the same way again.`, `Okay. ${a}. With a feather duster. I need a minute.`], `${k}|f`) }] : []),
      act.ok ? ssv(`${a}, ${b}, the house is spotless. Five hundred dollars each.`, { toast: ['DONE', '#22c55e'] }) : ssv(`${a}, ${b}, the Voice can still see dust on the shelves. No money this time.`),
      { k: 'dr', by: a, scene: DR(a), t: pickBy(["My mum is watching this. Hi, Mum. I'm fine.", "Honestly? Best night in the house so far."], `${k}|a`) },
    ];
  } else if (act.kind === 'pageant') {
    title = 'Miss and Mister Secret'; sub = listOf([act.miss, act.mister].filter(Boolean));
    const field = (act.field || []).filter(Boolean);
    start = SC('ceremony', 'living-screens', 'Living Room', house);
    steps = [
      ssv('Housemates, tonight the living room becomes a catwalk. Welcome to the election of Miss and Mister Secret!', { scene: start, toast: ['MISS & MISTER SECRET', '#ff3ea5'] }),
      ssv('Three rounds: the catwalk, a talent, and a question from the Voice. Then you vote. The winners will each receive a clue, on the secret of their choice.'),
      { k: 'beat', t: 'The sofas are pushed back. Somebody finds fairy lights. Somebody else finds a hairbrush to use as a microphone.' },
    ];
    field.slice(0, 4).forEach((n, i) => steps.push({ k: 'beat', scene: SC('ceremony', 'living-screens', 'Living Room', [n]), t: pickBy([`${n} walks the catwalk like it's a final, and stops dead for a pose.`, `${n} does the walk, trips on the rug, and turns it into a twirl.`, `${n} blows a kiss to the Eye on the way down.`, `${n} walks slowly, very slowly, and the room loses it.`], `${k}|w${i}`) }));
    if (field[0]) steps.push(ssv(`${field[0]}, the Voice's question: what is the one thing nobody in this house knows about you?`), { k: 'say', by: field[0], t: pickBy(["Nice try, Voice. Nice try.", "That I'm actually really shy. Don't laugh!", "That's a secret. Obviously."], `${k}|q`) });
    steps.push(ssv('The votes are in.', { scene: start }));
    if (act.miss) steps.push(ssv(`Your Miss Secret is... ${act.miss}!`, { toast: ['MISS SECRET', '#ff3ea5'] }), { k: 'beat', t: `${act.miss} is handed a paper crown and a bunch of flowers from the garden.` });
    if (act.mister) steps.push(ssv(`And your Mister Secret is... ${act.mister}!`, { toast: ['MISTER SECRET', '#3bb3ff'] }), { k: 'say', by: act.mister, t: pickBy(['I would like to thank my mum, my nan, and the hairbrush.', "I'd like to say this is a surprise. It isn't."], `${k}|m`) });
    for (const c of act.clues || []) steps.push(ssv(`${c.who}, on whose secret do you want your clue?`, { scene: DR(c.who) }), { k: 'dr', by: c.who, t: `${c.on}. Definitely ${c.on}.` },
      ssv(`Look at the screen.${c.clue ? ` ${c.clue}.` : ''}`, { toast: ['A CLUE', '#e0b84a'] }), { k: 'dr', by: c.who, t: pickBy([`Oh. Oh, that changes everything.`, `I knew it. I think. I'm nearly sure.`], `${k}|c|${c.who}`) });
    for (const r of (act.runnerUp || []).slice(0, 1)) steps.push({ k: 'dr', by: r, scene: DR(r), t: pickBy(["Second. I came second at a beauty contest in a house with a talking ceiling. Fine.", "Robbed. I was robbed. I'm going to need a recount."], `${k}|r`) });
  } else if (act.kind === 'clans') {
    const [A, B] = act.clans || [[], []];
    const [na, nb] = act.names || ['The Pinks', 'The Blues'];
    const win = act.winners === 0 ? [na, A] : [nb, B];
    const lose = act.winners === 0 ? [nb, B] : [na, A];
    title = 'The Clan War'; sub = `${win[0]} win`;
    steps = [
      ssv('Housemates, to the living room. This week, the house is at war.', { scene: start, toast: ['THE CLAN WAR', '#ff3355'] }),
      ssv(`Two clans. ${act.captains[0]}, you lead ${na}. ${act.captains[1]}, you lead ${nb}. Pick your clans.`),
      { k: 'beat', t: `${act.captains[0]} and ${act.captains[1]} take turns picking. Nobody wants to be picked last.` },
      { k: 'beat', scene: SC('ceremony', 'living-sofas', 'Living Room', A), t: `${na}: ${listOf(A)}.` },
      { k: 'beat', scene: SC('ceremony', 'living-sofas', 'Living Room', B), t: `${nb}: ${listOf(B)}.` },
      ssv(`The game: ${act.game}. The winning clan eats well tonight. The losing clan sleeps in the store room.`, { scene: SC('arena', 'ss-arena', 'The Games Arena', [...A.slice(0, 3), ...B.slice(0, 3)], 7) }),
      { k: 'beat', t: pickBy(['It gets competitive fast. Very fast.', 'Nobody is pretending to be friends any more.'], `${k}|g`) },
      ssv(`${win[0]} win the clan war!`, { scene: SC('ceremony', 'dining-meal', 'Kitchen', win[1]), toast: [`${win[0].toUpperCase()} WIN`, '#22c55e'] }),
      { k: 'beat', t: `${win[0]} sit down to a feast. Through the window, ${lose[0]} drag their duvets to the store room.` },
      { k: 'dr', by: lose[1][0], scene: DR(lose[1][0]), t: pickBy([`Sleeping on bags of rice. Next to ${lose[1][1] || 'the fridge'}. This is my life now.`, "It's not about the store room. It's about the principle."], `${k}|l`) },
    ];
  } else if (act.kind === 'room') {
    const w = act.who;
    title = 'A Secret Room'; sub = w;
    start = SC('ceremony', act.plate || 'library-wide', 'The House', [w]);
    steps = [
      { k: 'beat', scene: start, t: `${w} leans on the wall ${act.where}, and something clicks.`, toast: ['A SECRET ROOM', '#7c5cff'] },
      { k: 'say', by: w, t: pickBy(['Wait. Wait, wait, wait.', 'No way. No way!'], `${k}|0`) },
      { k: 'beat', scene: SC('attic', 'ss-attic-desk', 'A Secret Room', [w]), t: `A little door swings open onto a room nobody knew was there. On the table, a box with the Eye painted on it.`, prop: 'chest', press: true },
      act.money ? ssv(`${w}, congratulations. You have found one of the House of Secrets' hidden rooms. Inside the box: ${money(act.money)}, for your kitty.`)
        : ssv(`${w}, congratulations. You have found one of the House of Secrets' hidden rooms. Inside the box, a clue about ${act.on}'s secret.${act.clue ? ` ${act.clue}.` : ''}`),
      ssv('Close the door behind you. Nobody else needs to know this room exists. That is all for now.'),
      act.told ? { k: 'dr', by: w, scene: DR(w), t: `I'm telling ${act.told}. Only ${act.told}. Nobody else.` }
        : { k: 'dr', by: w, scene: DR(w), t: pickBy(["I'm not telling anybody. Not one person.", 'That room is mine now. My little office.'], `${k}|k`) },
    ];
  } else return null;
  return { id: `bb-ss-event-${act.kind}-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '19:00', set: start.set, plate: start.plate, room: start.room, cam: start.cam,
    kicker: start.kicker, title, label: title, sub, cast: start.cast, sceneful: true, steps: steps.filter(Boolean) };
}
