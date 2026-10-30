// ══════════════════════════════════════════════════════════════════════
// ss/prime-nights.js — sixteen more themed primes
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-30: "lets do more prime theme we have 5 we need at least 15 more". Each is a night the real
// show ran (docs/research/secret-story-france.md): the Lie Detector (S1), the Thermal Camera (S6), the Library of
// Secrets (S6), the Black Phone (S4, S6), the Families (S4-S11), the Masks Drop (S8), Playing With Fire (S8), Back in
// Time (S8), the Returns (S3 on), the Temptations (S10), the Gender War (S10), the Shields (S8), the Safe (S10), the
// Crystal Ball (S5), the Jungle of Decisions (S13), the Night of Hearts (S5).
//
// A night is two to four segments `{ kind: 'night', theme, part, of, ...what happened, effects, pub }`, so it runs
// through the prime (js/vp-bb-ep/steps.js puts them between the live moments). Every one changes something: a bond,
// the public, a kitty (minted or burned, never invented), next week's nominations or immunities, the evidence.
//
// Pure: the Secret Story state and the context in, the segments out; the adapter applies the bonds and the public.

import { mint, burn, balance } from './kitty.js';
import { addEvidence, secretOf, showClue, theoryOf } from './hunt.js';
import { nominateNext, immuneNext } from './dilemmas.js';

export const NIGHT_THEMES = {
  'lie-detector': 'The Night of the Lie Detector', thermal: 'The Thermal Camera', library: 'The Library of Secrets',
  'black-phone': 'The Black Phone', families: 'The Night of the Families', masks: 'The Masks Drop',
  fire: 'Playing With Fire', 'back-in-time': 'Back in Time', returns: 'The Night of the Returns',
  temptations: 'The Night of Temptations', 'gender-war': 'The Gender War', shields: 'The Night of the Shields',
  safe: 'The Safe', 'crystal-ball': 'The Crystal Ball', jungle: 'The Jungle of Decisions', hearts: 'The Night of Hearts',
};

const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));

/** Can this night be played this week? (what it needs: the eliminated, past ballots, both genders, a couple) */
export function nightPossible(theme, { house = [], gone = [], ballots = [], gender = () => null, bond = () => 0 } = {}) {
  if (house.length < 5) return false;
  if (theme === 'returns') return gone.length >= 1;
  if (theme === 'back-in-time') return ballots.some(b => (b.picks || []).some(p => house.includes(p) && house.includes(b.voter) && bond(b.voter, p) > 1.5));
  if (theme === 'gender-war') return house.filter(n => gender(n) === 'm').length >= 2 && house.filter(n => gender(n) === 'f').length >= 2;
  if (theme === 'hearts') return house.some((a, i) => house.slice(i + 1).some(b => bond(a, b) >= 4));
  return true;
}

/**
 * The night's segments for `theme`.
 * @param {any} state
 * @param {any} ctx  { rng, week, stat, bond, archetype, pop }
 * @param {string} theme
 * @param {{ house?: string[], nominees?: string[], gone?: string[], ballots?: any[], gender?: (n: string) => string|null, couples?: string[][] }} o
 * @returns {any[]}
 */
export function playNight(state, ctx, theme, { house = [], nominees = [], gone = [], ballots = [], gender = () => null, couples = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const wk = ctx.week ?? 0;
  const S = (n, k) => Number(ctx.stat?.(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond?.(a, b)) || 0;
  const arch = n => ctx.archetype?.(n) || '';
  const nice = n => NICE.includes(arch(n));
  const greed = n => (S(n, 'strategic') - S(n, 'loyalty') + 10) / 20;
  const shuffle = a => a.map(x => [rng(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  const friendOf = n => house.filter(x => x !== n).sort((a, b) => B(n, b) - B(n, a))[0] || null;
  const rivalOf = n => house.filter(x => x !== n).sort((a, b) => B(n, a) - B(n, b))[0] || null;
  const free = house.filter(n => !nominees.includes(n));
  const segs = [];
  const seg = (part, of, data, fx = {}) => segs.push({ ...data, kind: 'night', theme, part, of, effects: { bond: fx.bond || [], pop: fx.pop || [] }, pub: fx.pub || [] });
  const money = n => Math.round(n / 100) * 100;

  if (theme === 'lie-detector') {
    // three housemates on the machine; three questions each; a calm housemate beats it more often
    const who = shuffle(free.length >= 3 ? free : house).slice(0, 3);
    who.forEach((s, i) => {
      const ally = friendOf(s), rival = rivalOf(s);
      const qs = [];
      const fx = { bond: [], pub: [] };
      const ask = (q, lie, about, said) => {
        const caught = lie ? rng() < clamp(0.85 - S(s, 'temperament') * 0.04) : rng() < 0.06;
        qs.push({ q, about, lie, caught, said });
        return caught;
      };
      if (ally) {
        const fake = B(s, ally) < 2.5;
        if (ask(`Is ${ally} your closest ally in this house?`, fake, ally, 'Yes')) { fx.bond.push([ally, s, -2]); fx.pub.push([s, 'real', -0.2, `was caught lying about ${ally} on the lie detector`]); }
        else fx.bond.push([ally, s, 0.6]);
        const lied = rng() < S(s, 'strategic') * 0.07;
        if (ask(`Have you ever lied to ${ally} in this house?`, lied, ally, 'No')) { fx.bond.push([ally, s, -1.5]); fx.pub.push([s, 'heat', 0.12, 'the lie detector caught a lie']); }
      }
      if (rival && rival !== ally) {
        const hides = B(s, rival) < -1 && rng() < 0.5;
        if (ask(`Would you nominate ${rival} tomorrow, if you could?`, hides, rival, hides || B(s, rival) >= -1 ? 'No' : 'Yes')) { fx.bond.push([rival, s, -1.2]); fx.pub.push([s, 'fun', 0.15, 'the lie detector caught a lie']); }
        else if (!hides && B(s, rival) < -1) fx.bond.push([rival, s, -0.8]);
      }
      fx.pub.push([s, 'seen', 0.2, 'sat on the lie detector']);
      seg(i, who.length, { who: s, ally, rival, qs }, fx);
    });
  } else if (theme === 'thermal') {
    // they watch clips of the house; the camera reads them: a crush, an anger, or nerves about their own secret
    const who = shuffle(free).slice(0, 3);
    who.forEach((s, i) => {
      const clips = [];
      const fx = { bond: [], pub: [] };
      const crush = house.filter(x => x !== s && B(s, x) >= 4).sort((a, b) => B(s, b) - B(s, a))[0];
      if (crush) { clips.push({ about: crush, reading: 'hot', meaning: 'crush' }); fx.bond.push([s, crush, 0.8]); fx.pub.push([s, 'arc', 0.15, `the thermal camera saw what ${crush} does to them`]); }
      const rival = rivalOf(s);
      if (rival && B(s, rival) < -1) { clips.push({ about: rival, reading: 'hot', meaning: 'anger' }); fx.bond.push([s, rival, -0.6]); }
      const sec = secretOf(state, s);
      if (sec && !sec.found && rng() < 0.6) {
        clips.push({ about: s, reading: 'hot', meaning: 'nerves' });
        for (const v of house.filter(x => x !== s && !(sec.holders || []).includes(x))) addEvidence(state, ctx, v, s, { strength: 0.1, how: 'thermal' });
      } else clips.push({ about: friendOf(s), reading: 'cool', meaning: 'nothing' });
      seg(i, who.length, { who: s, clips }, fx);
    });
  } else if (theme === 'library') {
    // four books, four finders: Wishes, Ruin, the Investigator, Immunity
    const finders = house.slice().sort((a, b) => (S(b, 'intuition') + rng() * 6) - (S(a, 'intuition') + rng() * 6)).slice(0, 4);
    const books = [];
    const fx = { bond: [], pub: [] };
    const [w, r, iv, im] = finders;
    if (w) { const amt = 3000; mint(state, w, amt, 'the Book of Wishes', wk); books.push({ book: 'wishes', to: w, amount: amt }); }
    if (r) {
      const t = rivalOf(r);
      const uses = t && !nice(r) && rng() < clamp(0.3 + greed(r) * 0.6 - B(r, t) / 20);
      if (uses) { const lost = burn(state, t, Math.min(5000, Math.round(balance(state, t) / 2)), 'the Book of Ruin', wk); fx.bond.push([t, r, -2.5]); fx.pub.push([r, 'heat', 0.25, `used the Book of Ruin on ${t}`]); books.push({ book: 'ruin', to: r, on: t, lost }); }
      else { fx.pub.push([r, 'warmth', 0.2, 'burned the Book of Ruin unused']); books.push({ book: 'ruin', to: r, on: null, burned: true }); }
    }
    if (iv) {
      const target = house.filter(x => x !== iv && secretOf(state, x) && !secretOf(state, x).found).sort((a, b) => (theoryOf(state, iv, b)?.conf || 0) - (theoryOf(state, iv, a)?.conf || 0))[0];
      if (target) addEvidence(state, ctx, iv, target, { strength: 0.35, how: 'clue:investigator' });
      books.push({ book: 'investigator', to: iv, on: target || null });
    }
    if (im) { immuneNext(state, ctx, im); books.push({ book: 'immunity', to: im }); }
    seg(0, 2, { books: books.slice(0, 2) }, { bond: [], pub: fx.pub.filter(p => books.slice(0, 2).some(b => b.to === p[0])) });
    seg(1, 2, { books: books.slice(2) }, { bond: fx.bond, pub: fx.pub.filter(p => !books.slice(0, 2).some(b => b.to === p[0])) });
  } else if (theme === 'black-phone') {
    // only bad news: whoever answers hands a punishment to somebody (the nice ones take it themselves)
    const rings = 2 + (rng() < 0.4 ? 1 : 0);
    const used = new Set();
    for (let i = 0; i < rings; i++) {
      const ans = free.filter(n => !used.has(n)).sort((a, b) => (S(b, 'boldness') + rng() * 5) - (S(a, 'boldness') + rng() * 5))[0];
      if (!ans) break;
      used.add(ans);
      const pun = ['nominated', 'kitty', 'chores'][Math.floor(rng() * 3)];
      const self = nice(ans) || rng() < S(ans, 'loyalty') * 0.03;
      const target = self ? ans : rivalOf(ans);
      const fx = { bond: [], pub: [] };
      let lost = 0;
      if (pun === 'nominated') nominateNext(state, ctx, target);
      else if (pun === 'kitty') lost = burn(state, target, 2000, 'the black phone', wk);
      if (self) fx.pub.push([ans, 'warmth', 0.3, 'took the black phone\'s punishment themselves']);
      else { fx.bond.push([target, ans, -2]); fx.pub.push([ans, 'heat', 0.15, `gave the black phone's punishment to ${target}`]); }
      // (`pun`, not `kind`: a segment's own kind is 'night')
      seg(i, rings, { ans, pun, target, self, lost }, fx);
    }
  } else if (theme === 'families') {
    // a family in the airlock: five minutes with them, or give the five minutes to a friend who has had nothing
    const who = shuffle(free).slice(0, 3);
    who.forEach((s, i) => {
      const f = friendOf(s);
      const give = f && rng() < clamp(0.25 + S(s, 'loyalty') * 0.04 + B(s, f) * 0.04 - (10 - S(s, 'temperament')) * 0.02);
      const fx = { bond: [], pub: [] };
      if (give) { fx.bond.push([f, s, 2.5]); fx.pub.push([s, 'warmth', 0.35, `gave their family's visit to ${f}`]); fx.pub.push([f, 'pity', 0.2, 'saw family in the airlock']); }
      else { fx.pub.push([s, 'pity', 0.25, 'saw family in the airlock']); fx.pub.push([s, 'arc', 0.15, 'saw family in the airlock']); }
      seg(i, who.length, { who: s, friend: f, gave: !!give }, fx);
    });
  } else if (theme === 'masks') {
    // two rounds: face to face, the one you trust least, and why
    const order = shuffle(house).slice(0, Math.min(6, house.length));
    const half = Math.ceil(order.length / 2);
    for (let r = 0; r < 2; r++) {
      const fx = { bond: [], pub: [] };
      const calls = order.slice(r * half, (r + 1) * half).map(a => {
        const b = rivalOf(a);
        if (!b) return null;
        const buzzed = (state.buzzes || []).some(x => x.by === b && x.target === a);
        const why = buzzed ? 'buzzed-me' : B(a, b) < -2 ? 'cannot-stand' : S(b, 'strategic') >= 7 ? 'playing-everybody' : 'two-faced';
        const back = rng() < (10 - S(b, 'temperament')) * 0.08;
        fx.bond.push([a, b, back ? -2 : -1.2]);
        if (back) fx.pub.push([b, 'fun', 0.15, 'answered back when the masks dropped']);
        fx.pub.push([a, 'real', 0.15, 'said it to their face']);
        return { a, b, why, back };
      }).filter(Boolean);
      if (calls.length) seg(r, 2, { calls }, fx);
    }
  } else if (theme === 'fire') {
    // double or nothing, with their own money
    const who = free.filter(n => balance(state, n) >= 2000).sort((a, b) => S(b, 'boldness') - S(a, 'boldness')).slice(0, 3);
    who.forEach((s, i) => {
      const stake = money(balance(state, s) / 2);
      const plays = rng() < clamp(0.2 + S(s, 'boldness') * 0.07);
      const won = plays && rng() < 0.5;
      const fx = { bond: [], pub: [] };
      if (plays && won) { mint(state, s, stake, 'played with fire, and won', wk); fx.pub.push([s, 'fun', 0.3, 'doubled the kitty playing with fire']); }
      else if (plays) { burn(state, s, stake, 'played with fire, and lost', wk); fx.pub.push([s, 'pity', 0.2, 'lost half the kitty playing with fire']); fx.pub.push([s, 'fun', 0.2, 'lost half the kitty playing with fire']); }
      else fx.pub.push([s, 'real', 0.05, 'would not play with fire']);
      seg(i, who.length, { who: s, stake, plays, won }, fx);
    });
  } else if (theme === 'back-in-time') {
    // the house sees old nominations: who named a housemate they call a friend today
    const found = ballots.flatMap(b => (b.picks || []).map(p => ({ week: b.week, voter: b.voter, target: p })))
      .filter(x => house.includes(x.voter) && house.includes(x.target) && B(x.voter, x.target) > 1.5)
      .sort((a, b) => B(b.voter, b.target) - B(a.voter, a.target));
    const picked = [];
    for (const x of found) if (!picked.some(p => p.voter === x.voter || p.target === x.target) && picked.length < 3) picked.push(x);
    picked.forEach((x, i) => seg(i, picked.length, x, { bond: [[x.target, x.voter, -2.5]], pub: [[x.voter, 'heat', 0.18, `was seen nominating ${x.target}, a friend`]] }));
  } else if (theme === 'returns') {
    // this season's eliminated, back for one night, each with one power over the house
    const back = gone.slice(-3);
    back.forEach((g, i) => {
      const friend = house.slice().sort((a, b) => B(g, b) - B(g, a))[0];
      const foe = house.slice().sort((a, b) => B(g, a) - B(g, b))[0];
      const punish = foe && B(g, foe) < -1 && !nice(g) && rng() < 0.6;
      const fx = { bond: [], pub: [] };
      if (punish) { nominateNext(state, ctx, foe); fx.bond.push([foe, g, -2]); fx.pub.push([g, 'fun', 0.2, `came back and nominated ${foe}`]); }
      else if (friend) { immuneNext(state, ctx, friend); fx.bond.push([friend, g, 1.5]); fx.pub.push([g, 'warmth', 0.2, `came back and protected ${friend}`]); }
      seg(i, back.length, { who: g, power: punish ? 'punish' : 'protect', target: punish ? foe : friend }, fx);
    });
  } else if (theme === 'temptations') {
    // money to hurt your own game, or a friend's
    const who = shuffle(free).slice(0, 3);
    const offers = shuffle(['nominated', 'clue', 'friend']);
    who.forEach((s, i) => {
      let offer = offers[i % offers.length];
      if (offer === 'clue' && !(secretOf(state, s) && !secretOf(state, s).found)) offer = 'nominated';
      const f = friendOf(s);
      if (offer === 'friend' && !f) offer = 'nominated';
      const amount = offer === 'nominated' ? 5000 : offer === 'clue' ? 4000 : 3000;
      const takes = !(nice(s) && offer === 'friend') && rng() < clamp(0.15 + greed(s) * 0.7 - (offer === 'friend' ? B(s, f) / 15 : 0));
      const fx = { bond: [], pub: [] };
      let clue = null;
      if (takes) {
        mint(state, s, amount, 'the night of temptations', wk);
        if (offer === 'nominated') nominateNext(state, ctx, s);
        if (offer === 'clue') clue = showClue(state, ctx, { holder: s, how: 'sacrifice', house })?.clue || null;
        if (offer === 'friend') { burn(state, f, 3000, `the night of temptations (${s} took the money)`, wk); fx.bond.push([f, s, -2.5]); }
        fx.pub.push([s, 'heat', 0.12, 'gave in to temptation']); fx.pub.push([s, 'fun', 0.15, 'gave in to temptation']);
      } else fx.pub.push([s, 'warmth', 0.15, 'resisted temptation']);
      seg(i, who.length, { who: s, offer, amount, friend: f, takes, clue }, fx);
    });
  } else if (theme === 'gender-war') {
    const men = house.filter(n => gender(n) === 'm'), women = house.filter(n => gender(n) === 'f');
    const score = l => l.reduce((t, n) => t + S(n, 'physical') + S(n, 'endurance') + S(n, 'mental'), 0) / Math.max(1, l.length) + rng() * 6;
    const sm = score(men), sw = score(women);
    const loser = sm < sw ? 'm' : 'f';
    const winners = loser === 'm' ? women : men;
    (state.genderWar ||= {})[wk + 1] = loser;
    for (const n of winners) mint(state, n, 1000, 'won the gender war', wk);
    const mvp = winners.slice().sort((a, b) => (S(b, 'physical') + S(b, 'mental')) - (S(a, 'physical') + S(a, 'mental')))[0];
    seg(0, 2, { men, women, stage: 'game', mvp }, {});
    seg(1, 2, { men, women, stage: 'result', loser, winners, mvp }, { bond: [...winners.slice(0, 4).map((n, i, a) => [n, a[(i + 1) % a.length], 0.4])].filter(x => x[0] !== x[1]), pub: [[mvp, 'game', 0.2, 'won the gender war for their side']] });
  } else if (theme === 'shields') {
    // five shields found in the house: two real, three fake; the house learns which at the end of the night
    const finders = house.slice().sort((a, b) => (S(b, 'intuition') + S(b, 'boldness') + rng() * 8) - (S(a, 'intuition') + S(a, 'boldness') + rng() * 8)).slice(0, 5);
    const real = new Set(shuffle(finders).slice(0, 2));
    for (const n of real) immuneNext(state, ctx, n);
    const shields = finders.map(n => ({ to: n, real: real.has(n) }));
    seg(0, 2, { shields, stage: 'found' }, {});
    seg(1, 2, { shields, stage: 'reveal' }, { pub: shields.filter(s => !s.real).map(s => [s.to, 'fun', 0.08, 'had a fake shield']) });
  } else if (theme === 'safe') {
    // every kitty pays into the safe; three find a digit of the code; one opens it, and shares it or not
    let pot = 0;
    for (const n of house) pot += burn(state, n, Math.min(1500, Math.floor(balance(state, n) * 0.1 / 100) * 100), 'paid into the safe', wk);
    const finders = house.slice().sort((a, b) => (S(b, 'intuition') + rng() * 6) - (S(a, 'intuition') + rng() * 6)).slice(0, 3);
    const opener = finders.slice().sort((a, b) => S(b, 'strategic') - S(a, 'strategic'))[0];
    const shares = rng() < clamp(0.25 + S(opener, 'loyalty') * 0.05 - greed(opener) * 0.3) || nice(opener);
    const fx = { bond: [], pub: [] };
    if (shares) { const each = Math.floor(pot / finders.length); finders.forEach((n, i) => mint(state, n, i === 0 ? pot - each * (finders.length - 1) : each, 'the safe, shared', wk)); for (const n of finders) if (n !== opener) fx.bond.push([n, opener, 1.5]); fx.pub.push([opener, 'warmth', 0.25, 'shared the safe']); }
    else { mint(state, opener, pot, 'opened the safe', wk); for (const n of finders) if (n !== opener) fx.bond.push([n, opener, -2]); fx.pub.push([opener, 'heat', 0.2, 'kept the whole safe']); fx.pub.push([opener, 'game', 0.25, 'opened the safe']); }
    seg(0, 2, { pot, finders, stage: 'digits' }, {});
    seg(1, 2, { pot, finders, opener, shares, stage: 'open' }, fx);
  } else if (theme === 'crystal-ball') {
    // the public sends its favourite up; they come down with a power and something they saw
    const up = house.slice().sort((a, b) => (Number(ctx.pop?.(b)) || 0) - (Number(ctx.pop?.(a)) || 0))[0];
    const friend = friendOf(up);
    const seen = house.filter(x => x !== up && secretOf(state, x) && !secretOf(state, x).found).sort((a, b) => (theoryOf(state, up, b)?.conf || 0) - (theoryOf(state, up, a)?.conf || 0))[0];
    if (friend) immuneNext(state, ctx, friend);
    if (seen) addEvidence(state, ctx, up, seen, { strength: 0.3, how: 'clue:crystal-ball' });
    seg(0, 2, { who: up, stage: 'up' }, { pub: [[up, 'arc', 0.2, 'was sent up to the crystal ball by the public']] });
    seg(1, 2, { who: up, friend, seen, stage: 'down' }, { bond: friend ? [[friend, up, 1.5]] : [] });
  } else if (theme === 'jungle') {
    // two forks each: left or right, and what waits at the end
    const OUT = ['money', 'immunity', 'nominated', 'clue', 'nothing'];
    const walkers = shuffle(free).slice(0, 4);
    walkers.forEach((s, i) => {
      const path = [];
      const fx = { bond: [], pub: [] };
      for (let f = 0; f < 2; f++) {
        let out = OUT[Math.floor(rng() * OUT.length)];
        if (out === 'clue' && !(secretOf(state, s) && !secretOf(state, s).found)) out = 'nothing';
        const way = rng() < 0.5 ? 'left' : 'right';
        let clue = null;
        if (out === 'money') mint(state, s, 2000, 'the jungle of decisions', wk);
        if (out === 'immunity') immuneNext(state, ctx, s);
        if (out === 'nominated') nominateNext(state, ctx, s);
        if (out === 'clue') clue = showClue(state, ctx, { holder: s, how: 'sacrifice', house })?.clue || null;
        path.push({ way, out, clue });
        if (out === 'immunity' || out === 'nominated') break;
      }
      fx.pub.push([s, 'fun', 0.12, 'walked the jungle of decisions']);
      seg(i, walkers.length, { who: s, path }, fx);
    });
  } else if (theme === 'hearts') {
    // the couples tested: a week apart for the money, or the Love Room; then the singles' blind date
    const pairs = (couples.length ? couples : house.flatMap((a, i) => house.slice(i + 1).map(b => [a, b])).filter(([a, b]) => B(a, b) >= 4)).filter(([a, b]) => house.includes(a) && house.includes(b)).slice(0, 2);
    pairs.forEach(([a, b], i) => {
      const takes = rng() < clamp(0.1 + greed(a) * 0.5 - B(a, b) / 25);
      const fx = { bond: [], pub: [] };
      if (takes) { mint(state, a, 5000, 'the night of hearts: a week apart', wk); fx.bond.push([b, a, -2.5]); fx.pub.push([a, 'heat', 0.2, `chose the money over ${b}`]); }
      else { fx.bond.push([a, b, 1.5]); fx.pub.push([a, 'warmth', 0.25, `chose ${b} over the money`]); fx.pub.push([b, 'arc', 0.1, 'won the Love Room on the night of hearts']); }
      seg(i, pairs.length + 1, { a, b, takes }, fx);
    });
    const singles = house.filter(n => !pairs.flat().includes(n));
    const best = singles.flatMap((x, i) => singles.slice(i + 1).map(y => [x, y])).sort((p, q) => B(q[0], q[1]) - B(p[0], p[1]))[0];
    if (best) {
      const sparks = B(best[0], best[1]) + rng() * 4 > 3;
      seg(pairs.length, pairs.length + 1, { a: best[0], b: best[1], date: true, sparks }, { bond: [[best[0], best[1], sparks ? 1.5 : -0.3]], pub: sparks ? [[best[0], 'arc', 0.1, 'a blind date that worked']] : [] });
    }
  }
  return segs;
}
