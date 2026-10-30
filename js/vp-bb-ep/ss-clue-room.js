// THE CLUE ROOM, on screen (js/ss/clue-room.js; the user, 2026-10-30): the brainstorming sessions in front of the
// board, and the Voice's events in the room. The board itself is drawn by ss-hud.js (`st.board`). The room plays
// in the library until its plate exists (ss-groups.js SPACE_FALLBACK; the plate jobs are in
// Downloads/SecretStory-plates/to-edit-family5).

/** @typedef {{ ssv: Function, pickBy: Function, listOf: Function, callOpts: Function, handed: Function, pronouns: Function }} RoomHelpers */

const cap = s => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
const ROOM = (who, plate = 'ss-clue-room') => ({ set: 'ceremony', plate, room: 'The Clue Room', cam: 12, kicker: 'Cam 12 · The Clue Room',
  cast: [...new Set(who.filter(Boolean))].slice(0, 8).map((n, i, w) => [n, w.length === 1 ? 50 : Math.round(16 + 68 * i / (w.length - 1))]) });
const LIVING = who => ({ set: 'ceremony', plate: 'living-sofas', room: 'Living Room', cam: 4, kicker: 'Cam 04 · Living room',
  cast: who.filter(Boolean).map((n, i, w) => [n, w.length === 1 ? 50 : Math.round(16 + 68 * i / (w.length - 1))]) });

// what is said over a card, without naming anybody (the board is for guessing)
const OVER_CARD = [c => `${cap(c)}. We keep coming back to that one.`, c => `${cap(c)}. That's not random. Somebody in here chose that.`,
  c => `What about ${c}? Who would that even be?`, c => `${cap(c)}. I've been thinking about that one all day.`];
const GUESS = ["Somebody who's lived a whole other life before this.", "I think it's about family. Somebody's hiding a family thing.",
  "It's something that happened to them. Something big.", "It's a job. Or it was a job.", "Honestly? I think it's somebody we like. That's the worst part."];

/**
 * The room's screens for one week: a screen per brainstorming session, and one for the Voice's event.
 * @param {any} act the week's 'ss-clue-room' act
 * @param {any} ctx
 * @param {RoomHelpers} H
 */
export function ssClueRoomScreens(act, ctx, H) {
  const { ssv, pickBy, listOf } = H;
  const out = [];
  const board = (act.board || []).map(b => ({ clue: b.clue }));
  (act.sessions || []).forEach((s, si) => {
    const k = `${ctx.week}|ssroom|${si}|${s.leader}`;
    const R = (pool, n) => pickBy(pool, `${k}|${n}`);
    const g = s.group;
    const cards = [...board];
    const pins = s.read.filter(r => r.face).map(r => ({ clue: r.clue, face: r.face }));
    /** @type {any[]} */ const steps = [
      { k: 'beat', scene: ROOM(g), clueBoard: { cards, pins }, t: R([`The clue room. ${listOf(g)} close the door behind them.`, `${listOf(g)} slip into the clue room, one at a time, so nobody notices.`, `In the clue room, the board is covered in cards. ${listOf(g)} stand in front of it.`], 0) },
      { k: 'say', by: s.leader, t: R(['Okay. What do we actually know?', 'Right. Everything on that wall. Again, from the start.', "Let's do this properly this time."], 1) },
    ];
    s.read.slice(0, 2).forEach((r, i) => {
      const who = g[(i + 1) % g.length];
      steps.push({ k: 'say', by: who, scene: ROOM(g, 'ss-clue-board'), clueBoard: { cards, pins, focus: r.clue }, t: R(OVER_CARD, `r${i}`)(r.clue) },
        { k: 'say', by: g[(i + 2) % g.length] === who ? s.leader : g[(i + 2) % g.length], t: R(GUESS, `g${i}`) });
      if (r.face) steps.push({ k: 'beat', clueBoard: { cards, pins, focus: r.clue, add: r.face }, t: `A face goes up next to it, on a pin, with a piece of red string: ${r.face}.` });
    });
    for (const p of s.pooled) {
      const other = p.to[0];
      cards.push({ clue: p.clue });
      steps.push({ k: 'say', by: p.by, t: R(["I haven't told anyone this. The Voice gave me a clue too.", "Okay. I've been sitting on something. You need to see it."], `p0|${p.by}`) },
        { k: 'beat', scene: ROOM([p.by, ...p.to], 'ss-clue-board'), clueBoard: { cards: [...cards], pins, focus: p.clue, fresh: p.clue }, t: `${p.by} pins a new card to the board: ${p.clue}.` },
        { k: 'say', by: other, t: R(['You kept that from the whole house?', "And you're only showing us now?", 'Okay. That changes things.'], `p1|${p.by}`) },
        { k: 'say', by: p.by, t: R(["I'm not keeping it from you. That's the point.", "From the house, yes. Not from you."], `p2|${p.by}`) });
    }
    for (const d of s.deals) {
      steps.push({ k: 'beat', scene: ROOM([d.by, d.to]), t: `${d.by} pulls ${d.to} into the corner of the room, away from the others.` },
        { k: 'say', by: d.by, t: R(["I've got a clue nobody else has seen. It's yours. But you don't put my name down this week.", "I'll show you something. In exchange, I'm not on your list this week. Deal?"], `d0|${d.by}`) },
        { k: 'say', by: d.to, t: R(['Deal. Not this week.', 'Fine. Show me.', "...Okay. You're not on my list."], `d1|${d.by}`), carry: { by: d.by, to: d.to, mode: 'pass' } },
        { k: 'dr', by: d.by, t: R(['A clue for a week of safety. That is a good price.', "Now I find out if a promise in this house is worth anything."], `d2|${d.by}`) });
    }
    for (const kp of s.kept) steps.push({ k: 'dr', by: kp.by, t: s.pooled.length ? R(["They showed me everything. I didn't show them mine. That's the game.", "I've got a clue none of them have seen. It stays in my pocket."], `k|${kp.by}`)
      : R(["I've got a clue none of them have seen. It stays in my pocket.", "I didn't say a word about mine. Not even to them."], `k|${kp.by}`) });
    if (s.pact && g.length >= 2) steps.push({ k: 'say', by: s.leader, scene: ROOM(g), t: R(['Nobody buzzes without the others. Agreed?', 'Whatever we work out in here, we buzz together. Or not at all.'], 'pa0') },
      ...g.slice(1).map((n, i) => ({ k: 'say', by: n, t: R(['Agreed.', 'Together.', 'Deal.'], `pa${i + 1}`) })));
    if (s.watcher) steps.push({ k: 'beat', scene: LIVING([s.watcher]), t: R([`From the sofa, ${s.watcher} watches the clue room door close behind them.`, `${s.watcher} notices the clue room door has been shut for an hour.`], 'w0') },
      { k: 'dr', by: s.watcher, t: R([`${listOf(g)}, in the clue room with the door shut. That's an alliance.`, `Every time I walk past the clue room, it's the same faces in there. ${s.leader} first.`], 'w1') });
    out.push({ id: `bb-ss-clueroom-s${si}-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '15:00', ...ROOM(g), sceneful: true,
      title: 'The Clue Room', label: 'The Clue Room', sub: listOf(g), steps });
  });
  const e = act.event;
  if (e) out.push(eventScreen(act, e, ctx, H, board));
  return out;
}

function eventScreen(act, e, ctx, H, board) {
  const { ssv, pickBy, listOf, callOpts, handed } = H;
  const k = `${ctx.week}|ssroomev|${e.kind}`;
  const R = (pool, n) => pickBy(pool, `${k}|${n}`);
  const house = (ctx.house || []).filter(Boolean);
  const id = `${k}|who`;
  /** @type {any[]} */ let steps = [];
  const clueAct = (ctx.row?.acts || []).find(a => a?.type === 'ss-clue' && a.inRoom && a.clue === e.clue);
  const share = () => (clueAct?.got ? handed(clueAct, { inRoom: true }) : []);
  if (e.kind === 'object') {
    const [f] = e.searchers;
    steps = [
      ssv('Housemates, something new has been placed in the clue room. Whoever finds it keeps what it says.', { toast: ['THE CLUE ROOM', '#e0b84a'], scene: LIVING(house.slice(0, 6)),
        ask: { id, q: 'Who finds it first?', people: true, opts: callOpts(f, house, `${k}|call`) } }),
      { k: 'beat', scene: ROOM(e.searchers), clueBoard: { cards: board }, t: `${listOf(e.searchers)} are through the door before the Voice has finished the sentence.` },
      { k: 'beat', t: R(['Drawers open. Cards come off the board and go back on. Somebody lifts the rug.', 'Behind the books, under the box, inside the lamp. Nothing.'], 1) },
      { k: 'say', by: e.searchers[1] || f, t: R(["It's not here. It's not anywhere.", 'Has anybody checked behind the board?'], 2) },
      { k: 'beat', settle: { id, answer: f, n: 2 }, carry: { by: f, mode: 'hold' }, t: `${f} pulls a small envelope out from behind the board, and holds it up.` },
      ssv(`${f}. The clue: ${e.clue}.`, { card: { text: e.clue, state: 'clue', who: 'The clue' } }),
      ...share()];
  } else if (e.kind === 'box') {
    const [rid, ans] = e.riddle || ['What has to be broken before you can use it?', 'An egg'];
    const [s0, s1, s2] = e.searchers;
    steps = [
      ssv('Housemates, there is a locked box in the clue room. On its lid, a riddle. The first to give me the answer opens it.', { toast: ['THE LOCKED BOX', '#e0b84a'], scene: ROOM([s1, s0, s2]),
        ask: { id, q: 'Who solves the riddle?', people: true, opts: callOpts(s0, house, `${k}|call`) } }),
      { k: 'beat', card: { text: rid, state: 'clue', who: 'The riddle' }, t: `On the lid, in gold letters: "${rid}"` },
      ...(s1 ? [{ k: 'say', by: s1, t: R(['A shadow?', 'Time? Is it time?', 'Is it... a secret?'], 1) }, ssv('No.')] : []),
      ...(s2 ? [{ k: 'say', by: s2, t: R(['Money!', 'A promise?', 'Silence?'], 2) }, ssv('No.')] : []),
      { k: 'say', by: s0, t: `${ans}.` },
      ssv('Correct.', { settle: { id, answer: s0, n: 2 } }),
      { k: 'beat', carry: { by: s0, mode: 'hold' }, t: `The padlock clicks open. Inside the box, a single card. ${s0} takes it before anybody else can see.` },
      ssv(`${s0}, the clue: ${e.clue}.`, { card: { text: e.clue, state: 'clue', who: 'The clue' } }),
      ...share()];
  } else if (e.kind === 'auction') {
    const bids = e.bids || [];
    const money = n => `$${Math.round(n).toLocaleString('en-US')}`;
    steps = [
      ssv('Housemates, tonight one clue is for sale in the clue room. You bid with your own kitty, and nobody gets their money back.', { toast: ['THE AUCTION', '#e0b84a'], scene: ROOM(bids.map(b => b.n)),
        ask: { id, q: 'Who buys the clue?', people: true, opts: callOpts(e.finder, house, `${k}|call`) } }),
      ...bids.slice().reverse().map((b, i) => ({ k: 'say', by: b.n, t: i === bids.length - 1 ? `${money(b.bid)}.` : R([`${money(b.bid)}.`, `${money(b.bid)}. That's my limit.`, `${money(b.bid)}, and not a cent more.`], `b${i}`) })),
      ssv(`${e.finder}, for ${money(e.paid || bids[0]?.bid || 0)}. The money leaves your kitty now.`, { settle: { id, answer: e.finder, n: 2 } }),
      ...(bids[1] ? [{ k: 'say', by: bids[1].n, t: R(['That much? For a card?', "You're mad. I hope it's worth it."], 'b9') }] : []),
      { k: 'beat', carry: { by: e.finder, mode: 'hold' }, t: `${e.finder} takes the envelope without opening it in front of anybody.` },
      ssv(`${e.finder}, the clue: ${e.clue}.`, { card: { text: e.clue, state: 'clue', who: 'The clue' } }),
      ...share()];
  } else if (e.kind === 'tamper') {
    const [a, b] = house.filter(n => n !== e.about).slice(0, 2);
    steps = [
      { k: 'beat', scene: ROOM([]), clueBoard: { cards: board.filter(c => c.clue !== e.clue) }, t: 'The clue room, in the middle of the night. Nobody is there.' },
      { k: 'beat', clueBoard: { cards: board, fresh: e.clue, focus: e.clue }, t: `In the morning, there is a new card on the board: ${e.clue}. Nobody remembers pinning it.` },
      ...(a ? [{ k: 'say', by: a, scene: ROOM([a, b]), t: R(['Who put that there?', "That wasn't there last night. I'd swear on it."], 1) }] : []),
      ...(b ? [{ k: 'say', by: b, t: R(['Does it matter? It is a clue.', "Maybe the Voice. Maybe one of us. Either way, I'm writing it down."], 2) }] : []),
      { k: 'beat', t: 'None of them put it there. It is production\'s, and it points the wrong way.', toast: ['A FAKE CLUE', '#ff3355'] }];
  } else if (e.kind === 'rivals') {
    const [a, b] = e.pair;
    steps = [
      ssv(`${a}, ${b}. To the clue room, both of you.`, { toast: ['SHARE OR LOSE', '#e0b84a'], scene: ROOM([a, b]),
        ask: { id, q: `Will ${a} and ${b} show each other their clues?`, opts: ['Both say yes', 'One refuses'] } }),
      { k: 'beat', t: R([`${a} and ${b} have not said a kind word to each other in days. Now they share a sofa.`, `${a} sits as far from ${b} as the room allows.`], 1) },
      // (the deal in plain words: the user, 2026-10-30, "i dont understand this whats happening whats the pool?")
      ssv(`You are hunting the same secrets, and each of you holds clues the other has never seen. Here is my offer. Show each other every clue you have, right now, and you both walk out of this room knowing more.`),
      ssv('If either of you says no, I take back every clue I have given you both, and the notes you have made on them go in the bin. You will both start again from nothing.'),
      { k: 'say', by: a, t: e.yes[0] ? R(['Fine. Yes.', "I don't like it. Yes."], 2) : R(['No. Not with them.', 'Never.'], 2) },
      { k: 'say', by: b, t: e.yes[1] ? R(['Yes.', "If they're in, I'm in."], 3) : R(["No. They'd use it against me.", 'No chance.'], 3), settle: { id, answer: e.pooled ? 'Both say yes' : 'One refuses', n: 2 } },
      e.pooled ? ssv('Then show each other. Everything.') : ssv('Then I take them back. All of them.'),
      { k: 'beat', t: e.pooled ? `For an hour, ${a} and ${b} lay their clue cards out on the table, side by side. It is the longest conversation they have had.` : `A hand comes through the hatch in the wall. ${a} and ${b} put their clue cards in it, one by one, and their notebooks after them.`, tense: e.pooled ? undefined : [a, b] },
      ...(e.pooled ? [{ k: 'dr', by: a, t: R(["I never thought I'd say it. That was useful.", "We're not friends. But we're not stupid either."], 4) }]
        : [{ k: 'dr', by: e.yes[0] ? b : a, t: R(["I'd rather lose it than give it to them.", "Pool my clues with them? I'd rather start again from nothing."], 4) },
          ...(e.yes[0] || e.yes[1] ? [{ k: 'dr', by: e.yes[0] ? a : b, t: R(["All that work. Gone, because they couldn't say one word.", 'I said yes. They said no. And we both pay for it.'], 5) }] : [])])];
  }
  const TITLE = { object: 'Something in the Clue Room', box: 'The Locked Box', auction: 'The Clue Auction', tamper: 'A New Card on the Board', rivals: 'Share or Lose' };
  return { id: `bb-ss-clueroom-ev-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '17:00', ...ROOM(e.searchers || e.pair || []), sceneful: true,
    title: TITLE[e.kind] || 'The Clue Room', label: 'The Clue Room', sub: TITLE[e.kind] || '', steps };
}

/** After the nominations: the promises a clue bought, kept or broken. */
export function ssDealScreens(deals, ctx, H) {
  const { pickBy } = H;
  return (deals || []).map((d, i) => {
    const k = `${ctx.week}|ssdeal|${d.spare}|${d.promised}`;
    const R = (pool, n) => pickBy(pool, `${k}|${n}`);
    /** @type {any[]} */ const steps = d.broken ? [
      { k: 'beat', scene: ROOM([d.spare, d.promised]), t: `${d.spare} finds ${d.promised} alone in the clue room.` },
      { k: 'say', by: d.spare, t: R(['I gave you my clue. And my name is on that list anyway.', "We had a deal. I showed you the clue. Did you put my name down?"], 0) },
      { k: 'say', by: d.promised, t: R(["It wasn't me. I swear.", "I had to. It wasn't personal.", "...I'm not going to lie to you. Yes."], 1), tense: [d.spare, d.promised] },
      { k: 'say', by: d.spare, t: R(["Then you owe me a clue. And you're never getting another one.", "Remember this, because I will."], 2) },
      { k: 'dr', by: d.spare, t: R([`I paid ${d.promised} with ${d.clue}, and got nothing. Lesson learned.`, 'A promise in this house is worth exactly nothing.'], 3) },
    ] : [
      { k: 'dr', by: d.spare, scene: { set: 'dr', plate: 'confessional-close', room: 'Confessional', cam: 1, kicker: 'Confessional', cast: [[d.spare, 50]] }, t: R([`${d.promised} kept the promise. My clue bought me a week. Best trade I've made in here.`, `I'm not on the list. ${d.promised} kept their word.`], 0) },
      { k: 'dr', by: d.promised, scene: { set: 'dr', plate: 'confessional-close', room: 'Confessional', cam: 1, kicker: 'Confessional', cast: [[d.promised, 50]] }, t: R(["A deal's a deal. And now I know something they don't think I know.", "I kept my word. Next week, I'm free."], 1) },
    ];
    return { id: `bb-ss-deal-${i}-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '20:00', ...ROOM([d.spare, d.promised]), sceneful: true,
      title: d.broken ? 'A Broken Promise' : 'A Promise Kept', label: 'The Promise', sub: `${d.spare} and ${d.promised}`, steps };
  });
}

/** A pact's secret buzzed alone: the others find out (appended to the buzz's last screen). */
export function ssPactSteps(act, ctx, H) {
  const { pickBy, listOf } = H;
  const used = (act.pactBroken || []).filter(Boolean);
  if (!used.length) return [];
  const k = `${ctx.week}|sspact|${act.by}`;
  const R = (pool, n) => pickBy(pool, `${k}|${n}`);
  return [
    { k: 'beat', scene: ROOM([act.by, ...used]), t: `Later, in the clue room, ${listOf(used)} ${used.length > 1 ? 'are' : 'is'} waiting for ${act.by}.` },
    { k: 'say', by: used[0], t: R(['That was OUR secret. We worked it out together, in here.', "We said nobody buzzes without the others. You said it too."], 0), tense: [used[0], act.by] },
    { k: 'say', by: act.by, t: R(["It's a game. Somebody was going to press it.", "I couldn't wait. I'm sorry. I'm not sorry about the money."], 1) },
    ...(used[1] ? [{ k: 'say', by: used[1], t: R(["Don't ever come back in this room.", 'You used us.'], 2) }] : []),
    { k: 'dr', by: used[0], t: R([`${act.by} took our clue, our board and our work, and kept the money.`, `I'll never show ${act.by} anything again.`], 3) },
  ];
}
