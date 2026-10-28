// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-split.js — the split, on screen
// ══════════════════════════════════════════════════════════════════════
//
// What js/ss/split.js decided (twist family 4): the Voice splitting the house and reading the sides, the parted
// pairs' faces, the move to the other house; every week the duel in the games arena, the window between the houses,
// the traitor's offer; and the reunion when the wall comes down. Words only.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const listOf = xs => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const spread = a => a.map((n, i) => [n, a.length === 1 ? 50 : Math.round(12 + (76 * i) / (a.length - 1))]);
const SC = (set, plate, room, who, cam = 4) => ({ set, plate, room, cam, kicker: `Cam ${String(cam).padStart(2, '0')} · ${room}`, cast: spread(who.filter(Boolean).slice(0, 8)) });
const LIV = who => SC('ceremony', 'living-sofas', 'Living Room', who, 4);
// the other house: the user's plate when it is made (Downloads/SecretStory-plates/to-edit-family4), the glass house until then
const OTHER = (who, name) => SC('attic', 'ss-other-house', name, who, 24);
const ARENA = who => SC('arena', 'ss-arena', 'The Games Arena', who, 7);
const KIT = who => SC('kitchen', 'kitchen-wide', 'Kitchen', who, 3);
// a side's name, shouted ("Come on, Eagles!", not "Come on, The Eagles!")
const bare = name => String(name).replace(/^The /, '');

/**
 * The split's screens for one week: the start (when it opens), the week (duel, window, offer), the reunion.
 * @param {any} act an 'ss-split' act
 * @param {any} ctx the week's context
 * @param {{ ssv: Function }} H
 * @returns {any[]}
 */
export function ssSplitScreens(act, ctx, H) {
  const { ssv } = H;
  const [A, B] = act.names || ['The House', 'The Other House'];
  const k = `${ctx.week}|split`;
  const base = (id, title, sub, first, steps) => ({ id: `${id}-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '12:00', sceneful: true,
    set: first.set, plate: first.plate, room: first.room, cam: first.cam, kicker: first.kicker, cast: first.cast, title, label: title, sub, steps });
  const out = [];
  const st = act.start;
  if (st) {
    const all = [...st.sides[0], ...st.sides[1]];
    const gather = LIV(all);
    /** @type {any[]} */ const steps = [ssv('Housemates, please gather in the living room. All of you.', { scene: gather, toast: ['THE SPLIT', '#e0b84a'] })];
    if (st.kind === 'clans') {
      const [ca, cb] = st.captains || [];
      steps.push(ssv(`From today, the house is split into two clans: ${A} and ${B}. You will live together, but every week, the two clans will face each other.`),
        ssv(`${ca}, ${cb}: you are the captains. Choose your clans, one name at a time.`));
      const order = [];
      for (let i = 1; i < Math.max(st.sides[0].length, st.sides[1].length); i++) for (const s of [0, 1]) if (st.sides[s][i]) order.push([s, st.sides[s][i]]);
      for (const [s, n] of order.slice(0, 6)) steps.push({ k: 'say', by: s ? cb : ca, t: `${n}.` });
      if (order.length > 6) steps.push({ k: 'beat', t: `The last names go quickly. ${order.at(-1)?.[1]} is picked last, and smiles through it.` });
    } else if (st.kind === 'bears') {
      steps.push(ssv(`${st.sides[1].length === 4 ? 'Four' : 'Three'} of you are leaving this house tonight. Not the adventure: the house.`),
        ssv(`${listOf(st.sides[1])}: from tonight, you are ${B}. You will live in the house next door, and you will play against this one.`, { scene: LIV(st.sides[1]), shake: true }),
        { k: 'say', by: st.sides[1][0], t: pickBy(['Wait. Next door? There is a next door?', "So we're the outsiders now. Fine."], `${k}|b`) });
    } else {
      steps.push(ssv('Housemates, from tonight, the House of Secrets becomes two houses.'),
        ssv('A second house has opened behind the garden. Half of you are moving into it tonight, and you will not cross from one to the other.'),
        ssv(`${A}: ${listOf(st.sides[0])}.`, { scene: LIV(st.sides[0]) }),
        ssv(`${B}: ${listOf(st.sides[1])}.`, { scene: LIV(st.sides[1]) }));
      // (each parted pair its own words: never the same line twice in a row)
      const PART = ["It's only two weeks. Two weeks.", 'Of course they split us. Of course they did.', "Don't forget me over there."];
      const p0 = hash(k) % PART.length;
      (st.parted || []).slice(0, 2).forEach(([a, b], i) => steps.push({ k: 'beat', scene: LIV([a, b]), t: i ? `And ${a} and ${b}, the same.` : `${a} looks at ${b}. They are not on the same side, and the Voice knew it.`, tense: [a, b] },
        { k: 'say', by: a, t: PART[(p0 + i) % PART.length] }));
    }
    if (st.apart) {
      const movers = st.sides[1];
      steps.push({ k: 'beat', scene: OTHER(movers, B), t: `${listOf(movers)} carry their bags across the garden to the other house.` },
        { k: 'say', by: movers[0], t: pickBy(["It's smaller. It's ours, though.", 'Okay. It has beds. That is all I need tonight.'], `${k}|m`) },
        { k: 'beat', scene: SC('attic', 'ss-other-house-bed', `${B}: the bedroom`, movers, 25), t: `First night in the other house. ${listOf(movers.slice(0, 3))} lie awake, listening to the music from the main house.` });
    }
    steps.push(ssv(`Every week, ${A} and ${B} will play a duel. The winners will be immune. The nominations will come from the losers.`, { scene: gather }),
      { k: 'dr', by: st.sides[0][0], t: pickBy(['Now it is them against us. I know which side I am on.', 'This changes everything. My friends are on the other side.'], `${k}|dr`) });
    out.push(base('bb-ss-split-start', st.kind === 'clans' ? 'The Clans' : st.kind === 'bears' ? B : 'The Second House', `${A} against ${B}`, gather, steps));
  }
  // THE WEEK: the duel, the window, the offer
  const d = act.duel;
  if (d) {
    const [wName, lName] = d.w === 0 ? [A, B] : [B, A];
    const arena = ARENA([...(act.sides[0] || []).slice(0, 4), ...(act.sides[1] || []).slice(0, 4)]);
    /** @type {any[]} */ const steps = [
      { k: 'beat', scene: arena, t: `The duel of the week: ${d.game}. ${A} against ${B}.`, toast: ['THE DUEL', '#e0b84a'] },
      // (a house is not shouted for: "Come on, House!" reads wrong)
      { k: 'say', by: (act.sides[0] || [])[0], t: /House$/.test(A) ? "Let's go. We're not losing this." : pickBy([`Come on, ${bare(A)}! Every single one of us!`, "Let's go. We're not losing this."], `${k}|c0`) },
      { k: 'say', by: (act.sides[1] || [])[0], t: /House$/.test(B) ? 'Focus. Just focus. We can do this.' : pickBy([`${bare(B)}, this one is ours.`, 'Focus. Just focus. We can do this.'], `${k}|c1`) },
      { k: 'beat', t: pickBy([`It is close all the way. Then ${wName} pull ahead at the very end.`, `${wName} take it, and the arena erupts.`], `${k}|r`) },
      ssv(`${wName} win the duel. ${listOf(d.winners)}: you are immune this week, and $500 goes into each of your kitties.`, { toast: [`${wName.toUpperCase()} WIN`, '#22c55e'] }),
      { k: 'say', by: d.losers[0], t: pickBy(['So it is one of us this week. Great.', "Fine. We'll see who's still standing after the prime."], `${k}|l`) }];
    if (act.window) {
      const { a, b } = act.window;
      steps.push({ k: 'beat', scene: SC('attic', 'ss-glass-wall', 'The Glass Wall', [a, b], 24), t: `Late at night, ${a} and ${b} meet at the glass between the two houses. They can see each other, and that is all.` },
        { k: 'say', by: a, t: pickBy(['I miss you, you know.', 'Is it better over there?'], `${k}|w`) },
        { k: 'say', by: b, t: pickBy(['A few more days. Then I am back.', "It's not the same without you. Don't tell anybody I said that."], `${k}|w2`) });
    }
    if (act.traitor) {
      const t = act.traitor;
      const [from, to] = [t.from === 0 ? A : B, t.to === 0 ? A : B];
      steps.push(ssv(`${t.who}, the Voice has an offer for you. Leave ${from} for ${to}, and $3,000 goes into your kitty. You have until tonight.`, { scene: SC('dr', 'confessional-close', 'Confessional', [t.who], 1) }));
      if (t.took) steps.push({ k: 'say', by: t.who, t: pickBy(["I'll take it.", 'Three thousand dollars. Yes.'], `${k}|t`) },
        { k: 'beat', scene: KIT([t.who, ...d.losers.filter(n => n !== t.who).slice(0, 3)]), t: `${t.who} packs a bag and crosses over to ${to}. Nobody in ${from} says goodbye.`, shake: true },
        { k: 'say', by: d.losers.find(n => n !== t.who) || t.who, t: pickBy(['Three thousand dollars. That is what we were worth.', `Good luck, ${t.who}. You'll need it.`], `${k}|t2`) });
      else steps.push({ k: 'say', by: t.who, t: pickBy(['No. I stay with my side.', 'Keep your money. I am not leaving them.'], `${k}|t`) },
        { k: 'beat', scene: KIT(d.losers.slice(0, 4)), t: `When ${t.who} tells ${from}, they cheer louder than at any duel.` });
    }
    out.push(base('bb-ss-split-duel', 'The Duel', `${wName} win`, arena, steps));
  }
  // THE REUNION
  const r = act.reunion;
  if (r) {
    const all = [...(act.sides[0] || []), ...(act.sides[1] || [])];
    const apart = act.apart !== false;
    /** @type {any[]} */ const steps = [ssv(apart ? 'Housemates, the split is over. Tonight, the wall comes down.' : `Housemates, the clans are over. From tonight, there are no ${bare(A)} and no ${bare(B)}. There is one house.`,
      { scene: LIV(all), toast: ['THE REUNION', '#22c55e'] })];
    const BACK = ['Never again. Never, ever again.', 'You have no idea how long two weeks is.', 'I kept your bed. Well, I tried to.'];
    (r.parted || []).slice(0, 2).forEach(([a, b], i) => steps.push({ k: 'beat', scene: LIV([a, b]), t: i ? `${a} and ${b} find each other too.` : `The doors open. ${a} runs straight to ${b}.` },
      { k: 'say', by: b, t: BACK[(hash(k) + i) % BACK.length] }));
    steps.push({ k: 'beat', scene: KIT(all), t: apart ? 'For the first time in two weeks, everybody eats at the same table.' : 'The clan colours come off. At dinner, for the first time in two weeks, nobody sits with their clan.' },
      { k: 'dr', by: all[0], t: pickBy(['We are one house again. But everybody remembers who was on which side.', apart ? 'The wall is gone. The sides are not, not really.' : 'The clans are gone. The grudges from the duels are not.'], `${k}|end`) });
    out.push(base('bb-ss-split-end', 'The Reunion', `${A} and ${B}`, LIV(all), steps));
  }
  return out;
}
