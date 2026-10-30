// ══════════════════════════════════════════════════════════════════════
// ss/dilemmas.js — the Voice's dilemmas: an offer, a price, a choice
// ══════════════════════════════════════════════════════════════════════
//
// Part 2 design §11. Almost every prime put somebody in front of the house
// with an offer and a clock: give up your place in the final for $15,000;
// triple your friend's kitty and divide your rival's by three; see your mother,
// but your best friend loses an immunity; simulate a break-up; let every nasty
// thing you said be shown. The choice is the housemate's, from who they are:
// greed (strategic against loyalty), loyalty to the people the price lands on,
// how badly they need to protect their secret, and pride.
//
// Every dilemma here is from a real prime (`from`). Each resolves to EFFECTS
// the engine applies (money, a clue, an immunity next week, a nomination next
// week, a bond, a visit) and a scene.
//
// Pure: state + the hunt's context `{ stat, bond, rng, week, archetype, pop }`.

import { mint, burn, transfer, balance } from './kitty.js';
import { secretOf, showClue, theoryOf } from './hunt.js';

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const st = (ctx, n, k) => { const v = Number(ctx?.stat?.(n, k)); return Number.isFinite(v) ? v : 5; };
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
/** The options the country reads as the heart over the deal. */
export const HEART_LABELS = new Set(['the visit', 'save the friend', 'refuse', 'keep it', 'give up the immunity', 'keep the secret safe',
  'protect the friend', 'take their place', 'let it go', 'take the nomination myself']);

/** Somebody the chooser is close to, and somebody they are not. */
const bestFriend = (ctx, n, house) => house.filter(x => x !== n).sort((a, b) => (ctx.bond?.(n, b) ?? 0) - (ctx.bond?.(n, a) ?? 0))[0] || null;
const rival = (ctx, n, house) => house.filter(x => x !== n).sort((a, b) => (ctx.bond?.(n, a) ?? 0) - (ctx.bond?.(n, b) ?? 0))[0] || null;
/** How exposed the chooser's secret is: the surest theory anybody holds about it. */
const exposure = (state, n, house) => Math.max(0, ...house.filter(x => x !== n).map(x => theoryOf(state, x, n)?.conf || 0));

const greed = (ctx, n) => (st(ctx, n, 'strategic') - st(ctx, n, 'loyalty') + 10) / 20;   // 0..1

/*
 * Each entry builds `{ text, yes, no }` for a chooser, or null when it cannot
 * apply. `yes` / `no` are the two options, each `{ label, value, apply }`,
 * where `value` is how much THIS person wants that option (higher wins, plus a
 * little noise) and `apply` writes the effects and returns their description.
 */
export const DILEMMAS = [
  { id: 'visit-or-money', from: 'S4–S11 (a loved one in the airlock, or the money)',
    build(state, ctx, n, house) {
      const amount = 5000 + Math.round((ctx.rng || Math.random)() * 2) * 5000;
      return { text: `Somebody you love is waiting in the airlock. Go and see them, or keep the Voice's $${amount.toLocaleString('en-US')} instead.`,
        yes: { label: 'the visit', value: 0.55 + (1 - greed(ctx, n)) * 0.4, apply: () => ({ visit: n, text: `${n} chooses the visit.` }) },
        no: { label: 'the money', value: greed(ctx, n) * 0.9, apply: () => { mint(state, n, amount, 'dilemma: kept the money', ctx.week ?? 0); return { text: `${n} takes the $${amount.toLocaleString('en-US')} and never sees who was waiting.` }; } } };
    } },
  { id: 'clue-or-friend', from: 'S11 (Benoît and Charlène), S13 (the bridge of sacrifices)',
    build(state, ctx, n, house) {
      const f = bestFriend(ctx, n, house);
      if (!f || !secretOf(state, n) || secretOf(state, n).found) return null;
      const exp = exposure(state, n, house);
      return { text: `Protect the clue on your secret, and ${f} is nominated d'office next week. Or let the clue go out, and ${f} is safe.`,
        yes: { label: 'protect the clue', value: 0.3 + exp * 0.8 + greed(ctx, n) * 0.3 - (NICE.includes(ctx.archetype?.(n)) ? 0.3 : 0),
          apply: () => { nominateNext(state, ctx, f); return { bond: [[f, n, -2]], text: `${n} protects the clue. ${f} will be nominated d'office.` }; } },
        no: { label: "save the friend", value: 0.4 + (ctx.bond?.(n, f) ?? 0) / 10,
          apply: () => { const c = showClue(state, ctx, { holder: n, how: 'sacrifice', house }); return { clue: c, bond: [[f, n, 1.5]], text: `${n} lets the clue go out. ${f} is safe.` }; } } };
    } },
  { id: 'triple-and-divide', from: 'S6 (Audrey tripled Nadège\'s kitty and divided Yoann\'s)',
    build(state, ctx, n, house) {
      const f = bestFriend(ctx, n, house), r = rival(ctx, n, house);
      if (!f || !r || f === r) return null;
      return { text: `Triple ${f}'s kitty, and divide ${r}'s by three. Or do nothing.`,
        yes: { label: 'do it', value: 0.35 + clamp(-(ctx.bond?.(n, r) ?? 0) / 8) * 0.5 + greed(ctx, n) * 0.2,
          apply: () => {
            const take = Math.round(balance(state, r) * 2 / 3);
            burn(state, r, take, 'dilemma: kitty divided by three', ctx.week ?? 0);
            mint(state, f, balance(state, f) * 2, 'dilemma: kitty tripled', ctx.week ?? 0);
            return { bond: [[r, n, -2.5], [f, n, 1.5]], text: `${n} does it: ${f}'s kitty is tripled, ${r}'s is divided by three.` };
          } },
        no: { label: 'refuse', value: 0.45, apply: () => ({ text: `${n} refuses. Nobody's kitty moves.` }) } };
    } },
  { id: 'fake-breakup', from: 'S4 (Senna), S5 (Aurélie and Geof)',
    build(state, ctx, n, house) {
      const partner = house.filter(x => x !== n).find(x => (ctx.bond?.(n, x) ?? 0) >= 6);
      if (!partner) return null;
      return { text: `Break up with ${partner}, in front of everybody, for $15,000. Tell nobody it is for the Voice.`,
        yes: { label: 'break up', value: greed(ctx, n) * 0.8,
          apply: () => { mint(state, n, 15000, 'dilemma: a fake break-up', ctx.week ?? 0); return { bond: [[partner, n, -3]], pop: [[n, -0.4]], text: `${n} takes the money and breaks ${partner}'s heart for a week.` }; } },
        no: { label: 'refuse', value: 0.5 + (ctx.bond?.(n, partner) ?? 0) / 20, apply: () => ({ bond: [[partner, n, 0.8]], pop: [[n, 0.3]], text: `${n} refuses. The house never knows how close it came.` }) } };
    } },
  { id: 'tapes-for-money', from: 'S4 (Benoît: every nasty thing he said, for $15,000)',
    build(state, ctx, n, house) {
      const victims = house.filter(x => x !== n && (ctx.bond?.(n, x) ?? 0) < -1).slice(0, 3);
      if (!victims.length) return null;
      return { text: `Win $15,000, and the house watches every nasty thing you have said about them.`,
        yes: { label: 'play the tapes', value: greed(ctx, n) * 0.7 + (10 - st(ctx, n, 'temperament')) * 0.02,
          apply: () => { mint(state, n, 15000, 'dilemma: the tapes', ctx.week ?? 0); return { bond: victims.map(v => [v, n, -2]), pop: [[n, -0.3]], text: `${n} takes the money. ${victims.join(', ')} watch the tapes.` }; } },
        no: { label: 'refuse', value: 0.55, apply: () => ({ text: `${n} keeps the tapes in the drawer.` }) } };
    } },
  { id: 'immunity-for-clue', from: 'S9 (Coralie), S10',
    build(state, ctx, n, house) {
      if (!secretOf(state, n) || secretOf(state, n).found) return null;
      const exp = exposure(state, n, house);
      return { text: `Be immune next week, but a clue about your secret goes on the table now.`,
        yes: { label: 'take the immunity', value: ((ctx.pop?.(n) ?? 0) < 0 ? 0.6 : 0.4) - exp * 0.6,
          apply: () => { immuneNext(state, ctx, n); const c = showClue(state, ctx, { holder: n, how: 'sacrifice', house }); return { clue: c, text: `${n} takes the immunity. The clue goes out.` }; } },
        no: { label: 'keep the secret safe', value: 0.4 + exp * 0.7, apply: () => ({ text: `${n} keeps the clue hidden, and the risk.` }) } };
    } },
  { id: 'give-the-nomination', from: 'S5 (Jonathan), S6 (Fanny), S7 (Eddy): the red phone\'s nomination, passed on',
    build(state, ctx, n, house) {
      const r = rival(ctx, n, house);
      if (!r) return null;
      return { text: `You are nominated d'office next week, unless you give the nomination to somebody else.`,
        yes: { label: `give it to ${r}`, value: 0.4 + clamp(-(ctx.bond?.(n, r) ?? 0) / 8) * 0.5 - (NICE.includes(ctx.archetype?.(n)) ? 0.25 : 0),
          apply: () => { nominateNext(state, ctx, r); return { bond: [[r, n, -2.5]], text: `${n} gives the nomination to ${r}.` }; } },
        no: { label: 'keep it', value: 0.35 + (st(ctx, n, 'loyalty') - 5) * 0.04, apply: () => { nominateNext(state, ctx, n); return { pop: [[n, 0.4]], text: `${n} keeps the nomination. The public likes that.` }; } } };
    } },
  { id: 'free-buzz-for-money', from: 'S5 (buzzes sold to restart the hunt)',
    build(state, ctx, n) {
      if (balance(state, n) < 4000) return null;
      return { text: `A free buzz, for $3,000 of your kitty.`,
        yes: { label: 'buy it', value: 0.3 + st(ctx, n, 'boldness') * 0.05,
          apply: () => { burn(state, n, 3000, 'dilemma: bought a free buzz', ctx.week ?? 0); state.freeBuzz ||= {}; state.freeBuzz[n] = (state.freeBuzz[n] || 0) + 1; return { text: `${n} buys a free buzz.` }; } },
        no: { label: 'refuse', value: 0.5, apply: () => ({ text: `${n} keeps the money.` }) } };
    } },
  { id: 'swap-kitties', from: 'S5 (Morgane and Marie), S10 (the switch card), S13 (the ring)',
    build(state, ctx, n, house) {
      const richest = house.filter(x => x !== n).sort((a, b) => balance(state, b) - balance(state, a))[0];
      if (!richest || balance(state, richest) <= balance(state, n)) return null;
      return { text: `Swap your kitty with ${richest}'s. ${richest} cannot say no.`,
        yes: { label: 'swap', value: greed(ctx, n) * 0.9 + 0.2 - (ctx.bond?.(n, richest) ?? 0) / 15,
          apply: () => {
            const a = balance(state, n), b = balance(state, richest);
            transfer(state, richest, n, b, 'dilemma: kitties swapped', ctx.week ?? 0);
            transfer(state, n, richest, a, 'dilemma: kitties swapped', ctx.week ?? 0);
            return { bond: [[richest, n, -3]], text: `${n} swaps kitties with ${richest}.` };
          } },
        no: { label: 'refuse', value: 0.45 + (ctx.bond?.(n, richest) ?? 0) / 15, apply: () => ({ text: `${n} leaves ${richest}'s money alone.` }) } };
    } },
  // ── DILEMMAS ABOUT PEOPLE (the user, 2026-10-30: "we need real dilemma that break relationship or form one not just
  // about money"). Each one costs or wins a relationship; `w` makes them come up more often than the money ones.
  { id: 'betray-friend', w: 2, from: 'S8 and S12 (immunity, for putting a friend up)',
    build(state, ctx, n, house) {
      const f = bestFriend(ctx, n, house);
      if (!f || (ctx.bond?.(n, f) ?? 0) < 1) return null;
      return { text: `You are immune next week, if ${f} is nominated directly in your place. Or refuse, and nothing changes.`,
        yes: { label: `put ${f} up`, value: 0.15 + greed(ctx, n) * 0.9 - (NICE.includes(ctx.archetype?.(n)) ? 0.4 : 0) - (ctx.bond?.(n, f) ?? 0) / 25,
          apply: () => { immuneNext(state, ctx, n); nominateNext(state, ctx, f); return { bond: [[f, n, -4]], pop: [[n, -0.4]], betrayed: f, text: `${n} takes the immunity. ${f} will be nominated next week, and knows exactly why.` }; } },
        no: { label: 'protect the friend', value: 0.35 + (ctx.bond?.(n, f) ?? 0) / 20 + st(ctx, n, 'loyalty') * 0.03,
          apply: () => ({ bond: [[f, n, 1.5]], pop: [[n, 0.2]], text: `${n} refuses. ${f} hears about it later, and does not forget it.` }) } };
    } },
  { id: 'take-their-place', w: 2, from: 'S7, S10 (a sacrifice for a housemate the chooser does not even like)',
    build(state, ctx, n, house) {
      const r = rival(ctx, n, house);
      if (!r || (ctx.bond?.(n, r) ?? 0) > 0) return null;
      return { text: `${r} will be nominated directly next week. Unless you take ${r}'s place.`,
        yes: { label: 'take their place', value: 0.2 + st(ctx, n, 'loyalty') * 0.03 + (NICE.includes(ctx.archetype?.(n)) ? 0.25 : 0) + (ctx.pop?.(n) ?? 0) * 0.05,
          apply: () => { nominateNext(state, ctx, n); return { bond: [[r, n, 3.5]], pop: [[n, 0.5]], peace: r, text: `${n} takes ${r}'s place on next week's list. ${r} cannot believe it.` }; } },
        no: { label: `leave ${r} on it`, value: 0.5 + greed(ctx, n) * 0.3 - (ctx.bond?.(n, r) ?? 0) / 20,
          apply: () => { nominateNext(state, ctx, r); return { bond: [[r, n, -0.8]], text: `${n} leaves ${r} on the list.` }; } } };
    } },
  { id: 'the-recording', w: 2, from: 'S4, S9 (confessionals played to the person they were about)',
    build(state, ctx, n, house) {
      const f = bestFriend(ctx, n, house);
      if (!f) return null;
      // what the friend really thinks, behind the smile: the bond from the friend's side, and how much they gossip
      const honest = (ctx.bond?.(f, n) ?? 0) - (10 - st(ctx, f, 'loyalty')) * 0.25;
      const bad = honest < 2;
      return { text: `The Voice has a recording of what ${f} said about you in the confessional this week. Watch it, or let it go, and never know.`,
        yes: { label: 'watch it', value: 0.35 + st(ctx, n, 'boldness') * 0.03 + (10 - st(ctx, n, 'temperament')) * 0.02,
          apply: () => (bad ? { bond: [[n, f, -3]], heard: 'bad', text: `${n} watches it. ${f} was not kind. ${n} walks back into the house without a word.` }
            : { bond: [[n, f, 2]], heard: 'good', text: `${n} watches it. ${f} said ${n} is the one person in here worth trusting.` }) },
        no: { label: 'let it go', value: 0.4 + (ctx.bond?.(n, f) ?? 0) / 15,
          apply: () => ({ bond: [[n, f, 0.6]], text: `${n} lets it go. Whatever ${f} said stays in the confessional.` }) } };
    } },
  { id: 'choose-a-friend', w: 2, from: 'S11 (one friend protected, the other exposed)',
    build(state, ctx, n, house) {
      const fr = house.filter(x => x !== n && (ctx.bond?.(n, x) ?? 0) >= 1).sort((a, b) => (ctx.bond?.(n, b) ?? 0) - (ctx.bond?.(n, a) ?? 0)).slice(0, 2);
      if (fr.length < 2) return null;
      const [a, b] = fr;
      return { text: `${a} and ${b}: one of them is immune next week, and the other is nominated directly. You choose which. Or take the nomination yourself, and both are safe.`,
        yes: { label: `save ${a}`, value: 0.35 + greed(ctx, n) * 0.4,
          apply: () => { immuneNext(state, ctx, a); nominateNext(state, ctx, b); return { bond: [[a, n, 2], [b, n, -3]], chosen: a, dropped: b, text: `${n} saves ${a}. ${b} is nominated next week, and looks at ${n} for a long time.` }; } },
        no: { label: 'take the nomination myself', value: 0.25 + st(ctx, n, 'loyalty') * 0.04 + (NICE.includes(ctx.archetype?.(n)) ? 0.2 : 0),
          apply: () => { nominateNext(state, ctx, n); return { bond: [[a, n, 1.5], [b, n, 1.5]], pop: [[n, 0.45]], text: `${n} takes the nomination. ${a} and ${b} are both safe.` }; } } };
    } },
  { id: 'message-or-friend', from: 'S6 (Fanny deprived Julien of his girlfriend\'s message)',
    build(state, ctx, n, house) {
      const f = bestFriend(ctx, n, house);
      if (!f) return null;
      return { text: `Escape next week's nominations, but ${f} never sees the message their family recorded.`,
        yes: { label: 'take the immunity', value: 0.3 + greed(ctx, n) * 0.5 - (NICE.includes(ctx.archetype?.(n)) ? 0.3 : 0),
          apply: () => { immuneNext(state, ctx, n); return { bond: [[f, n, -2]], text: `${n} takes the immunity. ${f}'s message is never played.` }; } },
        no: { label: "give up the immunity", value: 0.45 + (ctx.bond?.(n, f) ?? 0) / 12,
          apply: () => ({ bond: [[f, n, 1.5]], visit: f, text: `${n} gives it up. ${f} watches the message from home.` }) } };
    } },
];

/** Next week's nominations and immunities, read by js/bb/secret-story.js. */
export function nominateNext(state, ctx, n) {
  state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} };
  const wk = (ctx.week ?? 0) + 1;
  (state.rules.dOffice[wk] ||= []).includes(n) || state.rules.dOffice[wk].push(n);
}
export function immuneNext(state, ctx, n) {
  state.nextImmune ||= {};
  const wk = (ctx.week ?? 0) + 1;
  (state.nextImmune[wk] ||= []).includes(n) || state.nextImmune[wk].push(n);
}

/**
 * One dilemma for one housemate: built, decided, applied. Returns the act
 * (`effects` carries the bonds and the public's reaction for the engine).
 */
export function runDilemma(state, ctx, { to, house = [], exclude = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const used = new Set([...(state.dilemmasUsed || []), ...exclude]);
  const options = DILEMMAS.filter(d => !used.has(d.id));
  for (let tries = 0; tries < 6 && options.length; tries++) {
    // (the ones about people come up twice as often as the ones about money)
    const tot = options.reduce((t, d) => t + (/** @type {any} */ (d).w || 1), 0);
    let r = rng() * tot, at = 0;
    for (; at < options.length - 1; at++) { r -= /** @type {any} */ (options[at]).w || 1; if (r < 0) break; }
    const d = options.splice(at, 1)[0];
    const built = d.build(state, ctx, to, house);
    if (!built) continue;
    // a housemate who knows the country is watching leans toward how it will look (js/ss/public.js)
    const looks = Number(ctx.looks?.(to)) || 0;
    const tilt = o => (HEART_LABELS.has(o.label) ? 0.14 : -0.1) * looks;
    const yes = built.yes.value + tilt(built.yes) + (rng() - 0.5) * 0.25;
    const no = built.no.value + tilt(built.no) + (rng() - 0.5) * 0.25;
    const chose = yes >= no ? built.yes : built.no;
    const fx = chose.apply() || {};
    (state.dilemmasUsed ||= []).push(d.id);
    return { type: 'ss-dilemma', week: ctx.week ?? 0, to, dilemmaId: d.id, from: d.from, offer: built.text,
      options: [built.yes.label, built.no.label], chose: chose.label, heart: HEART_LABELS.has(chose.label), result: fx.text, clue: fx.clue?.clue || null,
      visit: fx.visit || null, effects: { bond: fx.bond || [], pop: fx.pop || [] },
      // (who else it touched, and how: the viewer shows them react)
      others: (fx.bond || []).map(([x, y, d]) => ({ n: x === to ? y : x, d })).filter(o => o.n && o.n !== to), heard: fx.heard || null,
      beats: [{ text: `${to}'s dilemma: ${built.text} ${fx.text}`, players: [to], badgeText: 'DILEMMA', badgeClass: 'gold', part: 'dilemma' }] };
  }
  return null;
}
