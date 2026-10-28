// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-prime-themes.js — the themed prime's own segments, on screen
// ══════════════════════════════════════════════════════════════════════
//
// What js/ss/prime-themes.js decided: the Bridge of Sacrifices, crossing by crossing (the viewer calls each
// one first), and the Night of the Rings. The Red Phone prime, the Night of Dilemmas and Truths Revealed are
// made of the segments the prime already draws. Words only.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const money = n => `$${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const BRIDGE = (who) => ({ set: 'truths', plate: 'ss-bridge', room: 'The Bridge of Sacrifices', cam: 22, kicker: 'Live · The Bridge of Sacrifices', cast: who.map((n, i, a) => [n, a.length === 1 ? 50 : 34 + i * 32]) });

/** The Bridge of Sacrifices (S5, S13). */
export function ssBridgeScreen(seg, ctx, host, H) {
  const { ssv } = H;
  const k = `${ctx.week}|ssbr`;
  /** @type {any[]} */ const steps = [
    { k: 'host', by: host, t: "Tonight, the Bridge of Sacrifices is open. One by one, some of you will cross it. And on the bridge, the Voice will ask each of you for a sacrifice.", toast: ['THE BRIDGE OF SACRIFICES', '#ff3ea5'], scene: BRIDGE([]) },
    { k: 'host', by: host, t: 'Say yes, and someone you love crosses with a reward. Say no, and they cross with nothing, and they will know why.' },
  ];
  (seg.crossings || []).forEach((c, i) => {
    const PRICE = { money: `${money(c.price)} from your own kitty`, clue: 'a clue about your own secret, on the living-room table tonight', nomination: 'your place in next week\'s nominations: you would be nominated directly' }[c.kind];
    const REWARD = c.reward === 'money' ? `${money(5000)} for ${c.friend}'s kitty` : `immunity next week for ${c.friend}`;
    steps.push({ k: 'beat', scene: BRIDGE([c.who]), t: pickBy([`${c.who} steps onto the bridge. The lights go down to a single beam.`, `${c.who} walks out onto the bridge, slowly.`, `The bridge lights up under ${c.who}'s feet.`], `${k}|${i}|0`) },
      ssv(`${c.who}, on the other side, ${c.friend} is waiting. The Voice offers ${REWARD}. The price: ${PRICE}.`, { ask: { id: `${k}|${i}`, q: `Will ${c.who} sacrifice for ${c.friend}?`, opts: ['Yes', 'No'] } }),
      { k: 'dr', by: c.who, t: c.yes ? pickBy([`${c.friend} would do it for me. I know it. So I'm doing it.`, "It's only money. Friends aren't."], `${k}|${i}|1`) : pickBy(["I love them. But I came here to win.", `${c.friend} will hate me. I'll live with that.`], `${k}|${i}|1`) },
      { k: 'say', by: c.who, push: true, t: c.yes ? pickBy(['Yes. For them.', 'I accept.'], `${k}|${i}|2`) : pickBy(['No. I can\'t.', 'I refuse.'], `${k}|${i}|2`), settle: { id: `${k}|${i}`, answer: c.yes ? 'Yes' : 'No', n: 2 } });
    if (c.yes) {
      steps.push({ k: 'beat', scene: BRIDGE([c.who, c.friend]), t: `${c.friend} crosses to a roar from the crowd, and runs straight into ${c.who}'s arms.` });
      if (c.kind === 'clue' && c.clue) steps.push(ssv(`The clue goes on the table: ${c.clue}.`, { toast: ['A CLUE', '#e0b84a'] }));
      if (c.kind === 'nomination') steps.push(ssv(`${c.who}, you will be nominated next week.`, { nom: [c.who] }));
    } else steps.push({ k: 'beat', scene: BRIDGE([c.friend]), t: `${c.friend} crosses alone, to silence, and doesn't look back at ${c.who}.`, tense: [c.who, c.friend] });
  });
  steps.push({ k: 'host', by: host, scene: { set: 'studio-wide', plate: 'ss-studio', room: 'The Prime Studio', cam: 1, kicker: 'Live · The Prime Studio', cast: [] }, t: pickBy(['The Bridge of Sacrifices is closed. Some friendships just got stronger. Some just ended.', "That's the bridge. You saw who gave, and who didn't."], `${k}|end`) });
  return { id: `bb-ss-prime-bridge-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: 'LIVE', ...BRIDGE([]), sceneful: true,
    title: 'The Bridge of Sacrifices', label: 'The Bridge', sub: `${(seg.crossings || []).filter(c => c.yes).length} of ${(seg.crossings || []).length} gave`, steps };
}

/** The Night of the Rings (S13): four powers, four housemates. */
export function ssRingsScreen(seg, ctx, host, H) {
  const { ssv } = H;
  const k = `${ctx.week}|ssring`;
  const LIV = who => ({ set: 'ceremony', plate: 'living-sofas', room: 'Living Room', cam: 4, kicker: 'Live · Living room', cast: who.map((n, i, a) => [n, a.length === 1 ? 50 : Math.round(20 + 60 * i / (a.length - 1))]) });
  const R = Object.fromEntries((seg.rings || []).map(r => [r.ring, r]));
  /** @type {any[]} */ const steps = [
    { k: 'host', by: host, t: 'Tonight, four rings are hidden in the House of Secrets. Each one holds a power. Let\'s go to the house.', toast: ['THE RINGS', '#f5c542'] },
    ssv('Housemates, four rings are hidden in the house. Whoever finds one keeps its power. You have two minutes.', { scene: LIV((seg.rings || []).map(r => r.to)) }),
    { k: 'beat', t: 'Cushions fly. Drawers open. Somebody climbs on the kitchen counter.' },
  ];
  if (R.immunity) steps.push({ k: 'beat', scene: LIV([R.immunity.to]), t: `${R.immunity.to} finds a gold ring in the fruit bowl.` }, ssv(`${R.immunity.to}, the ring of secret immunity. Once, when your name is read at the nominations, you may cancel it. Nobody needs to know you have it.`));
  if (R.nominate) steps.push({ k: 'beat', scene: LIV([R.nominate.to]), t: `${R.nominate.to} pulls a red ring out from under a sofa cushion.` }, ssv(`${R.nominate.to}, the ring of nomination. Next week, you will nominate one housemate directly.`));
  if (R.bank) steps.push({ k: 'beat', scene: LIV([R.bank.to, ...(R.bank.with ? [R.bank.with] : [])]), t: `${R.bank.to} finds a silver ring taped behind the mirror.` },
    ssv(R.bank.with ? `${R.bank.to}, the ring of the bank. It works now: your kitty and ${R.bank.with}'s change places. ${money(R.bank.gain)} more for you.` : `${R.bank.to}, the ring of the bank. Nobody is richer than you tonight: it does nothing.`),
    ...(R.bank.with ? [{ k: 'say', by: R.bank.with, t: pickBy(['My money! That was MY money!', `${R.bank.to}. I will never forget this.`], `${k}|bank`), tense: [R.bank.with, R.bank.to] }] : []));
  if (R.switch) steps.push({ k: 'beat', scene: LIV([R.switch.to]), t: `${R.switch.to} finds the last ring in a shoe.` }, ssv(`${R.switch.to}, the Switch ring. If you${R.switch.protects ? `, or ${R.switch.protects},` : ''} are nominated in the coming weeks, it takes you off, and you name somebody else.`));
  steps.push({ k: 'host', by: host, t: "Four rings, four powers. Keep an eye on those hands, at home: the house doesn't know who has what." });
  return { id: `bb-ss-prime-rings-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: 'LIVE', ...LIV([]), sceneful: true,
    title: 'The Rings', label: 'The Rings', sub: `${(seg.rings || []).length} rings`, steps };
}
