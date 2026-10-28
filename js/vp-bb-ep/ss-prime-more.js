// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-prime-more.js — the prime's other segments, as the real one runs
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-28: "launch night and prime could be a little bit bigger,
// they are important like an episode". From the real S14 semi-final
// (docs/research/secret-story-transcripts.md §3): the Voice's address to the
// house, a narrated package of the week, last week's eliminated on the studio
// couch, the kitty board live, the Golden Buzz reel, the verdict's bailiff and
// speech, and the eliminated's farewell power.
//
// Everything here reads what the week's acts already decided; the steps'
// helpers come from steps.js (`H`).

/** The Voice to the house, before the studio opens (S14: "tonight is your last chance…"). */
export function ssVoiceAddressScreen(act, ctx, H) {
  const { ssv, listOf, pickBy, ROOM_NAME, CAM } = H;
  const noms = act.nominees || [];
  const k = `${ctx.week}|ssva`;
  return { id: `bb-ss-prime-voice-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '20:55', set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony,
    kicker: 'Live · Living room', title: 'Tonight', label: 'Tonight', sub: 'Before the prime', cast: noms.map((n, i) => [n, 30 + i * 22]),
    steps: [
      { k: 'beat', t: ["Five minutes to the prime. The house is dressed up and sitting very still.", "The countdown clock on the living-room screen says four minutes. Nobody is talking.", "Everybody is ready too early. They sit on the sofas and wait, fiddling with their microphones.", "Hair done, shoes on, nerves everywhere. The prime is minutes away.", "Somebody checks their reflection for the tenth time. The prime is about to start."][((ctx.week || 0) + 0) % 5] },
      ssv(`Housemates, this is the Voice. Tonight is the prime. ${listOf(noms)}, the public has been voting all week. Tonight, one of you leaves the House of Secrets.`, { toast: ['THE VOICE', '#e0b84a'] }),
      ssv("Everything you've done this week, the public has seen. That is all for now."),
      { k: 'dr', by: noms[0], t: pickBy(["My hands haven't stopped shaking since this morning.", "I've done everything I could. Now it's up to them.", "I keep telling myself it's only a game. It doesn't help."], `${k}|0`) },
      ...(noms[1] ? [{ k: 'dr', by: noms[1], t: pickBy(['Whatever happens tonight, I was myself in here.', "If I go, I go with my head up.", "I'm not ready to leave. Not yet."], `${k}|1`) }] : []),
    ] };
}

/** The week, narrated, with the housemates' own confessionals (S14: "previously…" built from the week). */
export function ssWeekPackageScreen(act, ctx, H) {
  const { listOf, euros } = H;
  const acts = ctx.row?.acts || [];
  const noms = act.nominees || [];
  /** @type {any[]} */ const steps = [{ k: 'beat', t: 'This week in the House of Secrets.', toast: ['THIS WEEK', '#e0b84a'] }];
  const said = [];
  const clues = acts.filter(a => a?.type === 'ss-clue').map(a => a.clue).filter(Boolean);
  if (clues.length) said.push(clues.length === 1 ? `A clue went on the living-room table: ${clues[0]}.` : `${clues.length === 2 ? 'Two' : clues.length === 3 ? 'Three' : 'Four'} clues went on the living-room table: ${listOf(clues.slice(0, 4))}.`);
  const breakers = [...new Set(acts.filter(a => a?.type === 'ss-rule' && a.who).map(a => a.who))];
  if (breakers.length) said.push(breakers.length === 1 ? `${breakers[0]} broke one of the Voice's commandments, and paid for it.` : `${listOf(breakers)} all broke the Voice's commandments, and paid for it.`);
  const game = acts.find(a => a?.type === 'ss-game' && a.winner);
  if (game) said.push(`${game.winner} won the Voice's game.`);
  for (const a of acts) {
    if (a?.type === 'ss-party') {
      const kiss = (a.moments || []).find(m => m.kind === 'kiss');
      const fight = (a.moments || []).find(m => m.kind === 'fight');
      said.push(`The Voice threw a party: ${String(a.name).replace(/^The /, 'the ')}.${kiss ? ` ${kiss.who[0]} and ${kiss.who[1]} kissed in front of everybody.` : ''}${fight ? ` ${fight.who[0]} and ${fight.who[1]} had it out late in the night.` : ''}`);
    } else if (a?.type === 'ss-buzz' && a.outcome !== 'withdrawn') said.push(`${a.by} pressed the buzzer on ${a.target}, ${a.outcome === 'right' ? `and found the secret: ${euros(a.took)} changed hands` : 'and was wrong'}.`);
    else if (a?.type === 'ss-role') said.push(a.role === 'masters' ? `The Masters of the Nominations struck again: ${a.target} was put up.` : 'The House Thieves struck again in the night.');
    else if (a?.type === 'ss-superette' && a.closed) said.push('The store stayed shut, and the house knew who to blame.');
    else if (a?.type === 'ss-house-secret') said.push(`${a.finder} found a clue to the secret of the house, and told nobody.`);
  }
  for (const s of said.slice(0, 7)) steps.push({ k: 'beat', t: s });
  // (no confessional quoted out of its scene: a line lifted alone names nothing, ADDING-A-SHOW §19.4)
  steps.push({ k: 'beat', t: noms.length ? `And in the confessional, the house put up ${listOf(noms)}. Tonight, the public decides.` : 'Tonight, the public decides.' });
  return { id: `bb-ss-prime-package-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: 'LIVE', set: 'studio-wide', room: 'The Prime Studio', cam: 1,
    kicker: 'Live · The Prime Studio', title: 'This Week', label: 'This Week', sub: `${said.length} moments`, cast: [], steps };
}

/** Last week's eliminated, on the couch beside the host (S14: on set all night). */
export function ssCouchSteps(act, ctx, host, H) {
  const { pickBy, bondNow } = H;
  const c = act.couch;
  if (!c) return [];
  const k = `${ctx.week}|sscouch|${c}`;
  const noms = act.nominees || [];
  const backing = noms.slice().sort((a, b) => bondNow(ctx, c, b) - bondNow(ctx, c, a))[0];
  return [
    { k: 'host', by: host, t: `And with me tonight, on the couch: last week's eliminated. Please welcome back ${c}!` },
    { k: 'beat', t: `${c} comes down the stairs to the couch. The crowd is on its feet.` },
    { k: 'host', by: host, t: `${c}, a week outside. How has it been?` },
    { k: 'say', by: c, t: pickBy(['Strange. I keep waiting for the Voice to tell me what to do.', 'Weird. I watched every daily. I saw things I had no idea about.', "Honestly, I'm still not over it. But I'm happy to be here."], `${k}|a`) },
    ...(backing ? [{ k: 'host', by: host, t: 'Who are you hoping stays tonight?' },
      { k: 'say', by: c, t: pickBy([`${backing}. No question.`, `${backing}. I need ${backing} to win this for me.`], `${k}|b`) }] : []),
  ];
}

/** The kitty board, shown to the public and then to the house (S14: "29,000!"). */
export function ssKittyBoardScreen(act, ctx, host, H) {
  const { euros, pickBy, ROOM_NAME, CAM } = H;
  const k = `${ctx.week}|sskb`;
  const rows = Object.entries(act.kitty || {}).filter(([n]) => (ctx.house || []).includes(n)).sort((a, b) => b[1] - a[1]);
  if (rows.length < 3) return null;
  const [rich] = rows[0], [poor] = rows[rows.length - 1];
  return { id: `bb-ss-prime-kitties-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: 'LIVE', set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony,
    kicker: 'Live · Living room', title: 'The Kitties', label: 'The Kitties', sub: `${rich} leads`, cast: [[rich, 40], [poor, 62]],
    steps: [
      { k: 'host', by: host, t: "Let's talk money. Here are the kitties, after the week you've all had.", toast: ['THE KITTIES', '#e0b84a'],
        kitties: rows.slice(0, 8).map(([n, v]) => ({ n, from: Number(act.kittyStart?.[n] ?? v) || 0, to: v })) },
      { k: 'host', by: host, t: `${rich} leads with ${euros(rows[0][1])}. ${poor} is at the bottom with ${euros(rows[rows.length - 1][1])}. Let's show the house.` },
      { k: 'beat', t: ["The board lights up on the living-room screen. Everybody leans in at once.", "The kitties appear on the screen, one by one. Somebody groans.", "Every eye in the house goes to the screen as the numbers come up.", "The board fills the giant screen. Somebody starts doing the maths out loud."][((ctx.week || 0) + 0) % 4] },
      { k: 'say', by: rows[1][0], t: pickBy([`${euros(rows[0][1])}? ${rich}, what have you been doing?`, `${rich} is rich. Look at that.`, `How does ${rich} have that much?`], `${k}|r`) },
      { k: 'say', by: rich, t: pickBy(["I've been working. That's all I'm saying.", "Don't look at me like that, I earned it.", 'I earned every single dollar of it.'], `${k}|rr`) },
      { k: 'dr', by: poor, t: pickBy([`${euros(rows[rows.length - 1][1])}. That's the number everybody in here just saw next to my name.`, "I'm the poorest person in the house. Great.", 'At the bottom of the board. I need a mission, and fast.'], `${k}|p`) },
      { k: 'host', by: host, t: "And as you all know, kitties don't stay still on a prime night." },
    ] };
}

/** The Golden Buzz: the week's buzz attempts and wildest theories, as a reel (S14). */
export function ssGoldenBuzzScreen(act, ctx, host, H) {
  const { pickBy } = H;
  const acts = ctx.row?.acts || [];
  const buzzes = acts.filter(a => a?.type === 'ss-buzz');
  const wild = acts.filter(a => a?.type === 'ss-hunt').flatMap(a => a.moments || []).filter(m => m && m.right === false && m.theory);
  if (!buzzes.length && !wild.length) return null;
  const k = `${ctx.week}|ssgb`;
  /** @type {any[]} */ const steps = [{ k: 'host', by: host, t: "It's time for the Golden Buzz: the best of the week's buzzes and theories.", toast: ['THE GOLDEN BUZZ', '#e0b84a'] }];
  for (const b of buzzes.slice(0, 3)) steps.push({ k: 'beat', t: `There's ${b.by} in the confessional, completely sure of it: "${b.guess}." ${b.outcome === 'right' ? 'And right, as it turned out.' : b.outcome === 'wrong' ? "It wasn't." : `Then ${b.by} lost their nerve and walked out.`}` });
  const w = wild[0];
  if (w) steps.push({ k: 'host', by: host, t: `And the Golden Buzz for the wildest theory of the week goes to ${w.who}, who was convinced that ${w.about}'s secret is "${w.theory}".` },
    { k: 'beat', t: pickBy(['The studio laughs. On the couch, somebody covers their face.', 'The crowd applauds. Somewhere in the house, someone has no idea they just won an award.'], `${k}|w`) });
  steps.push({ k: 'host', by: host, t: "That's the Golden Buzz. Next week, there's plenty more where that came from." });
  return { id: `bb-ss-prime-goldenbuzz-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: 'LIVE', set: 'studio-wide', room: 'The Prime Studio', cam: 1,
    kicker: 'Live · The Prime Studio', title: 'The Golden Buzz', label: 'Golden Buzz', sub: `${buzzes.length} buzzes`, cast: [], steps };
}

/** The verdict's opening: the bailiff, the envelope, the host's speech (S14). */
export function ssVerdictOpening(act, ctx, host, H) {
  const { listOf } = H;
  const noms = act.nominees || [];
  return [
    { k: 'host', by: host, t: 'The lines are now closed. The bailiff has brought me the envelope.' },
    { k: 'beat', t: 'The bailiff walks onto the set and hands the host a sealed envelope.', toast: ['THE ENVELOPE', '#e0b84a'], prop: 'envelope', press: true },
    { k: 'host', by: host, t: `${listOf(noms)}, you walked into this house with a secret, and you've been through highs and lows. You've watched friends leave. The public has seen all of it, and the public has made its decision.` },
  ];
}

/** The eliminated's farewell power, from the studio (S14 semi-final; js/bb/secret-story.js afterPrime). */
export function ssFarewellSteps(act, ctx, host, H) {
  const { euros, pickBy } = H;
  const f = act.farewell;
  const ev = act.evicted;
  if (!f) return [];
  const k = `${ctx.week}|ssfw|${ev}`;
  return [
    { k: 'host', by: host, t: `${ev}, your adventure's over, but you've still got one last power over the house.`, toast: ['THE FAREWELL POWER', '#c86bff'] },
    { k: 'host', by: host, t: `You can give ${euros(f.gift)} to one housemate, and cut another one's kitty in half. Who's getting the gift?` },
    { k: 'say', by: ev, t: pickBy([`${f.friend}. ${f.friend} looked after me every single day.`, `${f.friend}, without thinking about it.`], `${k}|g`) },
    { k: 'host', by: host, t: 'And whose kitty are you cutting in half?' },
    // (they have not seen the dailies yet: they say only what they lived in the house)
    { k: 'say', by: ev, push: true, t: pickBy([`${f.foe}. ${f.foe} knows why.`, `${f.foe}. We never got on in there, and everybody knows it.`], `${k}|f`) },
    { k: 'host', by: host, t: `That's ${euros(f.lost)} gone from ${f.foe}'s kitty. The house will find out who did it soon enough.` },
  ];
}
