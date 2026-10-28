// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-evening.js — the Voice's evening games and the black buzzer, on screen
// ══════════════════════════════════════════════════════════════════════
//
// Renders what js/ss/evening.js decided (the "Oops" night, mini-secrets, the
// black buzzer): every line is spoken, and every reaction answers the line
// before it. Prose never decides anything here: who raised a sign, who buzzed
// first and whether they were right all come from the act.

const WORD = { 100: 'a hundred dollars', 200: 'two hundred dollars' };

/** One screen for an `ss-evening` act. */
export function ssEveningScreen(act, ctx, H) {
  const { ssv } = H;
  const base = (id, extra) => ({ id, kind: 'twist', anchor: 'house', day: ctx.day, time: 'NIGHT', ...extra });
  /** @type {any[]} */ const steps = [];
  const cast = new Set();

  if (act.game === 'oops') {
    steps.push(ssv('Housemates, please come to the living room. Tonight the Voice has a little game for you.', { toast: ['OOPS NIGHT', '#e0b84a'] }),
      { k: 'beat', t: 'Everybody gets a sign. One side is blank. The other says OOPS in big red letters.' },
      ssv("I'm going to read out some sentences. If a sentence is about you, raise your sign. Be honest. The Voice always knows."));
    for (const s of act.statements || []) {
      steps.push(ssv(s.text));
      const r = s.raised || [];
      steps.push({ k: 'beat', t: !r.length ? 'Nobody moves. Somebody laughs nervously.'
        : r.length === 1 ? `${r[0].who} raises the sign.` : `${r.slice(0, -1).map(x => x.who).join(', ')} and ${r.at(-1).who} raise their signs at the same time. The room erupts.` });
      for (const x of s.scene || []) {
        cast.add(x.who); if (x.about) cast.add(x.about);
        if (x.kind === 'accuse') {
          steps.push(ssv(`${x.who}, who do you find fake?`),
            { k: 'say', by: x.who, t: `Honestly? ${x.about}. You're one person with me and somebody else with everyone else.` },
            x.answer === 'snaps' ? { k: 'say', by: x.about, t: "Wow. You could've said that to me in private, you know. Not in front of everybody." }
              : { k: 'say', by: x.about, t: "That's fine. I know who I am. I don't need you to like me." },
            { k: 'dr', by: x.about, t: x.answer === 'snaps' ? `I didn't expect that from ${x.who}. Not like that, not in front of the whole house.` : `${x.who} wanted a reaction. ${x.who} didn't get one.` });
        } else if (x.kind === 'crush') {
          steps.push(ssv(`${x.who}. Who is it?`),
            { k: 'say', by: x.who, t: "Do I have to say it? ...Okay. Okay. It's " + `${x.about}.` },
            { k: 'beat', t: 'The house screams. Somebody throws a cushion.' },
            x.back ? { k: 'say', by: x.about, t: "Well... maybe it's not only you." } : { k: 'say', by: x.about, t: "Oh. That's... really sweet. Thank you." },
            { k: 'dr', by: x.who, t: x.back ? `I said it in front of everybody, and ${x.about} said it back. I can't stop smiling.` : `I said it out loud, in front of the whole house. At least ${x.about} knows now.` });
        } else if (x.kind === 'accomplice') {
          steps.push(ssv(`${x.who}, who do you think has an accomplice?`),
            { k: 'say', by: x.who, t: `${x.about}. I don't think ${x.about} is playing this alone.` },
            { k: 'say', by: x.about, t: 'Me? With who? Go on, tell everybody with who.' },
            { k: 'say', by: x.who, t: "I'm not saying that part. Not yet." },
            { k: 'dr', by: x.about, t: `My heart stopped. ${x.who} is right, and now the whole house is looking at me.` });
        } else if (x.kind === 'wrong-buzz') {
          steps.push({ k: 'say', by: x.who, t: `Yes, okay, it was me. I buzzed ${x.about} and I was completely wrong.` },
            { k: 'say', by: x.about, t: 'And thank you very much for the money.' },
            { k: 'beat', t: `Even ${x.who} laughs.` });
        } else if (x.kind === 'know') {
          steps.push(ssv(`${x.who}, will you tell us whose?`),
            { k: 'say', by: x.who, t: "No. But they know who they are." },
            { k: 'beat', t: `Across the room, ${x.about} suddenly finds the floor very interesting.` },
            { k: 'dr', by: x.about, t: `If ${x.who} means me, I'm in real trouble.` });
        } else if (x.kind === 'mislead') {
          steps.push({ k: 'say', by: x.who, t: 'Fine. I\'ll admit it. Everybody keeps wondering, so here you go.' },
            { k: 'say', by: x.who, t: x.decoy ? `My secret is close to "${x.decoy}". That's all you're getting.` : "My secret isn't what any of you think. That's all you're getting." },
            { k: 'beat', t: 'The whole house leans in.' },
            { k: 'dr', by: x.who, t: "None of that is true. I've been saving it for a night like this. Let them chase it." });
        } else if (x.kind === 'caught') {
          cast.add(x.by);
          steps.push({ k: 'say', by: x.by, t: `${x.who}! Put your sign up. We all know it's you.` },
            { k: 'say', by: x.who, t: "I don't know what you're talking about." },
            { k: 'beat', t: `${x.who}'s sign stays firmly down. The house is not convinced.` });
        }
      }
    }
    steps.push(ssv('That is all for tonight. Sleep well... if you can.'));
    return base(`bb-ss-evening-${act.week}`, { set: 'ceremony', room: 'Living Room', cam: 4, kicker: 'Night · Living room', title: 'Oops Night', label: 'Oops Night',
      sub: `${(act.statements || []).reduce((n, s) => n + (s.raised || []).length, 0)} signs raised`, cast: [...cast].slice(0, 4).map((n, i) => [n, 20 + i * 20]), steps });
  }

  // mini-secrets
  steps.push(ssv("Housemates, it's time for mini-secrets.", { toast: ['MINI-SECRETS', '#e0b84a'] }),
    ssv("I'm going to tell you something small, and true, about one of you. The first to buzz the right name wins two hundred dollars. A wrong name costs a hundred."),
    { k: 'beat', t: 'A buzzer is set on the coffee table. Everybody shuffles a little closer to it.' });
  (act.rounds || []).forEach((r, i) => {
    cast.add(r.first); cast.add(r.subject);
    steps.push(ssv(`One of you ${r.fact}.`),
      { k: 'beat', t: [`${r.first} slams the buzzer first.`, `${r.first} gets there a hair before everybody else.`, `${r.first} practically dives over the coffee table.`][i % 3] },
      { k: 'say', by: r.first, t: r.right ? [`It's ${r.guess}. It has to be ${r.guess}.`, `${r.guess}. I'd put money on it.`, `That's ${r.guess}!`][i % 3] : [`${r.guess}! It's ${r.guess}, right?`, `Is it ${r.guess}?`, `${r.guess}. Final answer.`][i % 3] });
    if (r.right) {
      steps.push(ssv(`That is correct. ${r.first}, that's ${WORD[r.money] || `$${r.money}`} for you.`),
        r.close ? { k: 'say', by: r.subject, t: `${r.first}! You promised you'd never tell anybody that.` } : { k: 'say', by: r.subject, t: 'How did you know that? I never told anybody in here!' },
        r.close ? { k: 'say', by: r.first, t: "I didn't tell anybody. I just buzzed." } : { k: 'say', by: r.first, t: 'I had a feeling. You just look like somebody who would.' });
    } else {
      steps.push(ssv(r.money ? `That is wrong. It costs you ${WORD[r.money] || `$${r.money}`}.` : 'That is wrong. Luckily for you, your kitty is already empty.'),
        { k: 'say', by: r.guess, t: "Me? I've never done that in my life!" },
        ssv(`It was ${r.subject}.`),
        { k: 'say', by: r.subject, t: "Yes, it's me. Please don't laugh." },
        { k: 'beat', t: 'Everybody laughs.' });
      cast.add(r.guess);
    }
  });
  steps.push(ssv('Thank you, housemates. Goodnight.'));
  return base(`bb-ss-evening-${act.week}`, { set: 'ceremony', room: 'Living Room', cam: 4, kicker: 'Night · Living room', title: 'Mini-Secrets', label: 'Mini-Secrets',
    sub: `${(act.rounds || []).filter(r => r.right).length} of ${(act.rounds || []).length} guessed`, cast: [...cast].slice(0, 4).map((n, i) => [n, 20 + i * 20]), steps });
}

/** The black buzzer, found and used. */
export function ssBlackBuzzerScreen(act, ctx, H) {
  const { ssv } = H;
  const f = act.finder, n = act.named;
  const pick = act.why === 'grudge' ? `${n}. I think everybody knows why.`
    : act.why === 'threat' ? `I'm sorry, ${n}. It's nothing personal. You're just too strong.`
      : `${n}. It's a game. I had to pick somebody.`;
  return { id: `bb-ss-black-buzzer-${act.week}`, kind: 'twist', anchor: 'house', day: ctx.day, time: 'DAY', set: 'ceremony', room: 'Living Room', cam: 4,
    kicker: 'Day · Living room', title: 'The Black Buzzer', label: 'The Black Buzzer', sub: `${f} names ${n}`, cast: [[f, 35], [n, 65]],
    steps: [
      { k: 'beat', t: `Behind a cushion on the sofa, ${f}'s hand closes on something hard and cold.` },
      { k: 'say', by: f, t: 'Oh my God. Oh my God, it\'s the black buzzer.' },
      ssv(`${f}, you have found the black buzzer. You are immune this week. And you must nominate one of your housemates. Right now.`, { toast: ['BLACK BUZZER', '#c0392b'] }),
      { k: 'beat', t: `${f} looks around the room. Nobody breathes.` },
      { k: 'say', by: f, t: pick },
      { k: 'beat', t: `${n} stares at ${f} for a long moment.` },
      { k: 'say', by: n, t: act.why === 'grudge' ? "Of course it's me. You've been waiting for this." : "Wow. Okay. I'll remember that." },
      { k: 'dr', by: f, t: "I had immunity in my hand, and I had to choose. Whatever happens now, I'll live with it." },
    ] };
}
