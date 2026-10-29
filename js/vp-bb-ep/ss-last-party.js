// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-last-party.js — the final week's last party
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-29: "at the finale week each eliminated houseguest come back one last time to party, settling
// the scores, revealed their secrets if not already revealed/found before their elimination, support their friend
// for the finales, fight with their enemies, reckon with their showmance". Reads the final's `ss-returns` act
// (js/bb/secret-story.js secretStoryFinalWeek, moments from js/ss/final.js finalParty): every moment it holds
// already changed a bond or the public, so every one is played here.
//
// Order of the night: they arrive; the secret nobody heard; the couples; then, once the drinks are working, the one
// who buzzed you and the grudges; the story behind a secret told on the set; who is behind which finalist; the door.
// Taped, not live: its confessionals stay confessionals (ss-episode.js RECORDED).

/** The last party, as one screen in the garden. `H`: steps.js helpers. */
export function ssLastPartyScreen(act, ctx, H) {
  const { ssv, listOf, hash, CAM } = H;
  const guests = act.guests || [];
  const fin = act.finalists || [];
  const ms = act.moments || [];
  const k = `${ctx.week}|sslp|${guests.join(',')}`;
  const of = kind => ms.filter(m => m.kind === kind);
  // each pool starts somewhere different every season, and walks on from there, so no line is said twice tonight
  /** @type {<T>(list: T[], kind: string, i: number) => T} */
  const at = (list, kind, i) => list[(hash(`${k}|${kind}`) + i) % list.length];
  /** @type {any[]} */ const steps = [
    ssv('Finalists, the Voice has one last surprise for you. Please go out to the garden.', { toast: ['THE LAST PARTY', '#e0b84a'] }),
    { k: 'beat', t: at(['The garden is lit up with lanterns, the music is already playing, and there is a table full of drinks.',
      'Somebody has hung lights over the pool, the speakers are on, and the table is covered in drinks.'], 'set', 0) },
    { k: 'beat', t: guests.length > 1
      ? `Then the airlock opens, and they come in one after another: ${listOf(guests)}. Everybody who left this season is back for one last night.`
      : `Then the airlock opens, and ${guests[0]} walks in for one last night.`, shake: true },
  ];
  if (fin.length) steps.push({ k: 'beat', t: at([`${listOf(fin)} scream and run across the grass.`, `${listOf(fin)} can't believe it. Nobody stays dry-eyed for long.`], 'in', 0) });

  // a secret nobody ever heard, told at last
  for (const [i, m] of of('secret').entries()) {
    const g = m.who, w = m.with;
    steps.push({ k: 'beat', t: at([`${g} taps a glass, and the garden goes quiet.`, `${g} climbs onto a garden chair and asks for silence.`], 'sec0', i) },
      { k: 'say', by: g, push: true, t: `Nobody ever found my secret, so you're going to hear it from me. My secret was: "${m.text}."`, toast: ['NEVER FOUND', '#7c5cff'] },
      { k: 'beat', t: at(['Half the garden shouts at once.', 'Nobody had come anywhere near it, and you can see it on every face.'], 'sec1', i) });
    if (w) steps.push({ k: 'say', by: w, t: at([`All this time? I never would have guessed that, ${g}.`, 'I sat next to you every day and I never once thought of that.', "That's why you always changed the subject."], 'sec2', i) });
    steps.push({ k: 'dr', by: g, t: at(['It feels good to finally say it out loud.', "I kept it the whole way. I'm proud of that."], 'sec3', i) });
  }
  // the couples: still together, or over
  for (const [i, m] of of('lovers').entries()) {
    const g = m.who, o = m.with;
    steps.push({ k: 'beat', t: `${g} and ${o} were still together when ${g} left the house. ${g} spots ${o} across the garden, and neither of them waits.`, toast: ['TOGETHER AGAIN', '#ff8fb1'] },
      { k: 'beat', t: at([`They kiss in the middle of the party, and the whole garden cheers.`, `They hold on to each other for a long time, and somebody starts clapping.`], 'lv0', i) },
      { k: 'say', by: g, t: at([`I missed you every single day, ${o}.`, `I watched you on the TV every night, ${o}. Every night.`], 'lv1', i) },
      { k: 'say', by: o, t: at(['You have no idea how empty it was in here without you.', "I wasn't sure you'd still feel the same."], 'lv2', i) },
      { k: 'dr', by: o, t: at([`Seeing ${g} again, I forgot about the final for a minute.`, `I needed that. I needed ${g} tonight.`], 'lv3', i) });
  }
  for (const [i, m] of of('closure').entries()) {
    const g = m.who, o = m.with;
    steps.push({ k: 'beat', t: at([`${g} and ${o} were a couple in the house until it ended. Tonight they end up alone by the pool, talking properly for the first time since.`,
      `${g} and ${o} haven't spoken since they broke up in the house. Early in the evening, ${g} sits down next to ${o}.`], 'cl0', i) },
      // (each exchange is said together: a reply belongs to its question)
      ...at([[`I didn't like how we left things, ${o}.`, "Me neither. I'm sorry for my part in it."],
        ['Can we talk about us? Properly, this time.', "I'd like that. I got some things wrong."],
        [`I was angry with you for weeks, ${o}. I'm not anymore.`, "Thank you. I've wanted to say sorry since the day it ended."]], 'cl1', i).map((t, j) => ({ k: 'say', by: j ? o : g, t })),
      { k: 'beat', t: at(['They hug, and this time it feels like a real goodbye.', 'They talk for an hour. When they come back to the party, they are both smiling.'], 'cl3', i) });
  }
  for (const [i, m] of of('cold').entries()) {
    const g = m.who, o = m.with;
    const [q, r] = at([[`So that's how it is, ${g}?`, 'I said everything I had to say in here.'], [`You can't even say hello, ${g}?`, `Hello, ${o}. Enjoy the final.`]], 'co1', i);
    steps.push({ k: 'beat', t: `${g} and ${o} broke up in the house, and it ended badly. ${g} walks straight past ${o} without a word.`, tense: [g, o] },
      { k: 'say', by: o, t: q }, { k: 'say', by: g, t: r },
      { k: 'dr', by: o, t: at([`I thought tonight might fix things with ${g}. It didn't.`, `I hoped ${g} had moved on. Clearly not.`], 'co2', i) });
  }
  // the scores
  if (ms.some(m => ['buzzed', 'makeup', 'fight'].includes(m.kind))) steps.push({ k: 'beat', t: at(['By midnight the drinks are working, and the old scores start coming out.', 'Later in the night the music gets louder, and so do the conversations.'], 'mid', 0) });
  for (const [i, m] of of('buzzed').entries()) {
    const g = m.who, f = m.with;
    steps.push({ k: 'beat', t: at([`${g} finds ${f} by the drinks table.`, `${g} sits down right next to ${f}.`, `${g} waits until ${f} is alone.`], 'bz0', i), tense: [g, f] },
      { k: 'say', by: g, push: true, t: at([`You buzzed me, ${f}. You took my secret and my kitty.`, `I've had weeks to think about that buzz, ${f}.`, `Hello, ${f}. Remember me? You found my secret.`], 'bz1', i) });
    if (m.peace) {
      const [r, s, b] = at([["I'm sorry it was you. It was never personal.", 'Then win it. Make it worth it.', 'They clink glasses.'],
        ['It was the game. But I know what it cost you.', "I know. I'd have done the same.", `${g} laughs, and they hug.`],
        ["I would do it again, but I'm sorry it hurt you.", "Okay. Let's leave it in the house.", 'They shake hands, then hug anyway.']], 'bz2', i);
      steps.push({ k: 'say', by: f, t: r }, { k: 'say', by: g, t: s }, { k: 'beat', t: b });
    } else {
      const [r, s, d] = at([["I'm not apologising for playing the game.", "Maybe. But I wouldn't have lied to your face first.", `I came here to have fun tonight, not to make friends with ${f}.`],
        ["You'd have done exactly the same to me.", "Then we've got nothing else to say.", `I gave ${f} the chance to say sorry. Nothing.`],
        ['It was a buzz. Get over it.', `Enjoy the final, ${f}.`, "Some things don't get fixed at a party."]], 'bz5', i);
      steps.push({ k: 'say', by: f, t: r }, { k: 'say', by: g, t: s }, { k: 'dr', by: g, t: d });
    }
  }
  for (const [i, m] of of('makeup').entries()) {
    const g = m.who, e = m.with;
    steps.push({ k: 'beat', t: at([`${g} walks up to ${e}. The people around them stop talking.`, `${g} and ${e} could not stand each other in the house. ${g} goes over anyway.`], 'mu0', i), tense: [g, e] },
      ...at([[`We were awful to each other in here, ${e}. I don't want to leave it like that.`, "Neither do I. Let's leave it in the house."],
        [`I've watched it all back, ${e}. I got some things wrong about you.`, 'Thank you for saying that. I got things wrong about you too.'],
        [`Can we start again, ${e}? Outside, I mean.`, "I'd like that. I really would."]], 'mu1', i).map((t, j) => ({ k: 'say', by: j ? e : g, t })),
      { k: 'beat', t: at(['They hug, and somebody whistles.', 'They shake hands, and the people around them clap.', 'They hug for a long time.'], 'mu3', i) });
  }
  for (const [i, m] of of('fight').entries()) {
    const g = m.who, e = m.with;
    steps.push({ k: 'beat', t: at([`${g} walks up to ${e}. The people around them stop talking.`, `${g} and ${e} could not stand each other in the house, and a few drinks have not helped.`], 'fi0', i), tense: [g, e] },
      ...at([[`I've watched it all back, ${e}. I heard every word you said about me.`, "It's a party. Can we not do this now?"],
        [`You made my life hell in here, ${e}, and you're still smiling.`, "You're still not over it? It's finished."],
        [`You never once said it to my face, ${e}. Say it now.`, 'Fine. I meant every word.']], 'fi1', i).map((t, j) => ({ k: 'say', by: j ? e : g, t, ...(j ? {} : { push: true }) })),
      { k: 'beat', t: at(['Two of the others have to step in between them.', `${g} walks off, and somebody turns the music up.`, `It takes three people to calm ${g} down.`], 'fi3', i), shake: true, toast: ['IT BLOWS UP', '#ff3355'] });
  }
  // the story behind a secret told on the set the night they left
  for (const [i, m] of of('story').entries()) {
    const g = m.who, a = m.with;
    const [q, r, b] = at([[`${g}, we all heard your secret the night you left. I want the real story.`, "Get me a drink and I'll tell you all of it.", `${g} tells the whole story, and the table goes quiet listening.`],
      [`Your secret came out the night you left, ${g}. We never got to talk about it.`, "I'll tell you everything. I couldn't say a word about it in here.", 'They talk about it for an hour, away from the music.']], 'st0', i);
    steps.push({ k: 'say', by: a, t: q }, { k: 'say', by: g, t: r }, { k: 'beat', t: b });
  }
  // who is behind whom
  const sup = of('support');
  const LOVE = [f => `You made it, ${f}. You actually made it.`, f => `I watched every second, ${f}. Go and win it.`, f => `I voted for you every week, ${f}. Every week.`, f => `Everybody outside loves you, ${f}. I'm serious.`];
  for (const [i, m] of sup.slice(0, 3).entries()) steps.push({ k: 'say', by: m.who, t: at(LOVE, 'sup', i)(m.with) });
  const rest = sup.slice(3);
  for (const f of fin) {
    const fans = rest.filter(m => m.with === f).map(m => m.who);
    if (fans.length) steps.push({ k: 'beat', t: fans.length === 1 ? `${fans[0]} spends most of the night at ${f}'s side.` : `${listOf(fans)} spend most of the night at ${f}'s side.` });
  }
  // the door
  steps.push(ssv('Guests, the party is over. It is time to say goodbye.'),
    { k: 'beat', t: 'One by one they leave through the airlock, and the finalists are on their own again.' });
  if (fin.length) steps.push({ k: 'dr', by: fin[hash(k) % fin.length], t: at(['Seeing all of them tonight, I remembered every single week of this.', "That was the best night I've had in this house.", "Now it's real. Now it's just the final."], 'end', 0) });
  return { id: 'bb-ss-returns-v', kind: 'twist', anchor: 'finale', day: ctx.day, set: 'yard', room: 'The Garden', cam: CAM.yard, time: '22:00', finale: true,
    kicker: 'Cam 05 · The Garden', title: 'The Last Party', label: 'The Last Party', sub: `${guests.length} come back`, cast: [], steps };
}
