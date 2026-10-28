// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-final.js — Secret Story's final, as the real ones run
// ══════════════════════════════════════════════════════════════════════
//
// From the real finals (docs/research/secret-story-transcripts.md §4): every
// eliminated housemate back in the studio; each finalist's season and the same
// questions to each ("what would you do with the money?", regrets); the
// season's joke awards; and the Voice's farewell to each finalist, personal,
// built from what they really did (their secret, who found it or that nobody
// did, how often they were nominated, their closest friend).
//
// Reads the final's `ss-journeys` act (js/bb/secret-story.js
// secretStoryFinalWeek); the steps' helpers come from steps.js (`H`).

const MONEY = ["Look after my family. That's the first thing.", 'Save it. Every single dollar of it.', 'Share it with the people who got me here.',
  "I haven't let myself think about it. I'm scared I'll jinx it.", "Honestly? I don't know yet. I just want to hear my name.", 'Make my mum proud with it, somehow.'];
const WEEK = n => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || String(n);
const times = n => (n === 1 ? 'once' : n === 2 ? 'twice' : `${WEEK(n)} times`);

/** The final's screens before the vote. */
export function ssFinalScreens(act, ctx, H) {
  const { ssv, listOf, euros, pickBy, pronouns } = H;
  const host = ctx.host;
  const fin = act.finalists || [];
  const facts = act.facts || {};
  const studio = act.studio || [];
  const out = [];
  const base = (id, extra) => ({ id, kind: 'twist', anchor: 'finale', day: ctx.day, time: 'LIVE', finale: true, ...extra });

  // ── the opening: the studio full of everybody who lived in the house ──
  /** @type {any[]} */ const open = [
    ssv(`Finalists, this is the Voice. This is your last night in the House of Secrets.`, { toast: ['THE FINAL', '#e0b84a'] }),
    { k: 'beat', t: 'The studio lights come up, and the crowd is already on its feet.', shake: true },
    { k: 'host', by: host, t: `Good evening, and welcome to the final of Secret Story! ${listOf(fin)}, one of you is about to win.` },
  ];
  if (studio.length) {
    open.push({ k: 'host', by: host, t: `And they're all here tonight. Everybody who lived in the House of Secrets this season: ${listOf(studio)}!` },
      { k: 'beat', t: 'One by one they come down the stairs and fill the benches beside the stage.' });
    const cheers = studio.filter(e => (act.support || {})[e]).slice(0, 3);
    const CHEER = [f => `Come on, ${f}!`, f => `${f}, this is yours!`, f => `We love you, ${f}!`];
    cheers.forEach((e, i) => open.push({ k: 'say', by: e, t: CHEER[(i + (ctx.week || 0)) % CHEER.length](act.support[e]) }));
  }
  out.push(base('bb-ss-final-open', { set: 'studio-finale', room: 'The Studio', cam: 1, kicker: 'Live · The final', title: 'The Final', label: 'The Final', sub: listOf(fin),
    cast: fin.map((n, i) => [n, 25 + i * 25]), steps: open }));

  // ── each finalist: the season, then the same questions ──
  fin.forEach((n, i) => {
    const f = facts[n] || {};
    const j = (act.journeys || {})[n] || [];
    /** @type {any[]} */ const steps = [{ k: 'host', by: host, t: `${n}. Let's look back at your season.` }];
    for (const m of j) steps.push({ k: 'beat', t: `Week ${WEEK(m.week || 1)}: ${n} ${m.why}.` });
    steps.push({ k: 'beat', t: `${n} watches it with ${pronouns(n).posAdj || 'their'} hands over ${pronouns(n).posAdj || 'their'} face.` },
      { k: 'host', by: host, t: `${n}, if you win tonight, what are you going to do with the hundred thousand dollars?` },
      { k: 'say', by: n, t: MONEY[(i + (ctx.week || 1)) % MONEY.length] },
      { k: 'host', by: host, t: 'And looking back, any regrets?' },
      { k: 'say', by: n, t: f.foundBy ? `Maybe one. I let ${f.foundBy} get too close, and ${f.foundBy} found my secret.`
        : f.kept ? "Not one. I kept my secret all the way, and I'm really proud of that."
          : f.nominated >= 3 ? "I wish I hadn't been up so often. But the public saved me every time, and I'll never forget that."
            : "No. I'd do every single thing again." },
      { k: 'host', by: host, t: (act.kitties || {})[n] ? `And your kitty tonight stands at ${euros((act.kitties || {})[n])}.` : 'And your kitty tonight is empty. Every dollar of it is gone.' });
    const fan = studio.find(e => (act.support || {})[e] === n);
    if (fan) steps.push({ k: 'say', by: fan, t: [`You deserve it, ${n}!`, `${n}, I'm so proud of you!`, `That's my friend up there!`][i % 3] });
    out.push(base(`bb-ss-final-journey-${i + 1}`, { set: 'studio-finale', room: 'The Studio', cam: 1, kicker: 'Live · The final', title: n, label: `${n}'s Season`, sub: f.read || '',
      cast: [[n, 50]], steps }));
  });

  // ── the season's awards, from its real record ──
  const AW = (act.awards || []).map(a => a.id === 'buzzer' ? `The Busiest Finger of the season goes to ${a.who}, who ran to the buzzer ${times(a.n)}.`
    : a.id === 'theory' ? `The prize for the wildest theory goes to ${a.who}, who was completely sure ${a.about}'s secret was "${a.guess}".`
      : a.id === 'fastest' ? `The fastest hunter of the season: ${a.who}, who found ${a.of}'s secret in week ${WEEK(a.week || 1)}.`
        : a.id === 'untouchable' ? (a.n === 0 ? `And the Untouchable: ${a.who}, never nominated. Not once, all season.` : `And the Escape Artist: ${a.who}, nominated only ${times(a.n)} all season.`) : null).filter(Boolean);
  // the room's answer, from the awards themselves: the wildest theory's author caught out in front of its subject
  const wild = (act.awards || []).find(a => a.id === 'theory');
  const laugh = wild && studio.includes(wild.who) ? `On the benches, ${wild.who} hides behind ${pronouns(wild.who).posAdj || 'their'} hands${studio.includes(wild.about) ? `, and ${wild.about} laughs the loudest` : ''}.`
    : 'The studio laughs and applauds, and the finalists finally breathe.';
  if (AW.length) out.push(base('bb-ss-final-awards', { set: 'studio-finale', room: 'The Studio', cam: 1, kicker: 'Live · The final', title: 'The Awards', label: 'The Awards', sub: `${AW.length} awards`, cast: [],
    steps: [{ k: 'host', by: host, t: "Before the result, it's time for the awards of the season.", toast: ['THE AWARDS', '#e0b84a'] },
      ...AW.map(t => ({ k: 'host', by: host, t })),
      { k: 'beat', t: laugh }] }));

  // ── the Voice's farewell to each finalist ──
  /** @type {any[]} */ const bye = [ssv('Finalists, before the public decides, the Voice has a few words for each of you.', { toast: ['THE VOICE', '#e0b84a'] })];
  fin.forEach((n, i) => {
    const f = facts[n] || {};
    const v = i % 3;
    const parts = [[`${n}.`, `${n}, it is your turn.`, `And ${n}.`][v]];
    if (f.secret) {
      parts.push([`You came into this house with a secret: "${f.secret}".`, `Your secret was "${f.secret}".`, `You walked in here carrying "${f.secret}".`][v]);
      if (f.foundBy) parts.push([`${f.foundBy} found it in week ${WEEK(f.foundWeek || 1)}, and you kept on playing anyway.`, `${f.foundBy} took it from you in week ${WEEK(f.foundWeek || 1)}. You did not let that stop you.`, `It lasted until week ${WEEK(f.foundWeek || 1)}, when ${f.foundBy} found it. You got back up.`][v]);
      else if (f.unveiled) parts.push('Nobody ever found it. You kept it all the way to the semi-final.');
      else if (f.kept) parts.push('Nobody ever found it. You kept it to the very end.');
    }
    parts.push(!f.nominated ? 'Not once all season did the house manage to nominate you.'
      : [`You were nominated ${times(f.nominated)}, and every time, the public kept you.`, `The house put you up ${times(f.nominated)}. The public kept you every time.`, `${times(f.nominated)[0].toUpperCase() + times(f.nominated).slice(1)} you faced the public, and ${times(f.nominated) === 'once' ? 'it' : 'every time it'} chose you.`][v]);
    if (f.friend) parts.push([`In here, your closest friend was ${f.friend}.`, `And you found a real friend in ${f.friend}.`, `${f.friend} was always beside you.`][v]);
    parts.push(['The Voice will miss you.', 'The Voice is proud of you.', 'Thank you, ' + n + '.'][v]);
    bye.push(ssv(parts.join(' ')), { k: 'say', by: n, push: true, t: pickBy(['Thank you, Voice. Thank you for everything.', "I'm going to miss you too. Really.", "Stop it, I'm going to cry. Thank you."], `fin|bye|${n}|${i}`) });
  });
  bye.push(ssv('That is all for now. For the very last time.'));
  out.push(base('bb-ss-final-voice', { set: 'ceremony', room: 'Living Room', cam: 4, kicker: 'Live · Living room', title: 'The Voice', label: "The Voice's Farewell", sub: listOf(fin),
    cast: fin.map((n, i) => [n, 25 + i * 25]), steps: bye }));
  return out;
}
