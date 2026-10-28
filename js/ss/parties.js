// ══════════════════════════════════════════════════════════════════════
// ss/parties.js — the Voice's party nights, and the supérette
// ══════════════════════════════════════════════════════════════════════
//
// Part 2 design §15. The Voice throws a party most weekends (real themes: pink
// and white, samba, costumes, garden party, karaoke, Halloween, a birthday). A
// party is a house-life night with its own rules: everybody dresses to the
// theme; there is a little to drink, so guards come down and confessions,
// flirts, kisses and fights are likelier; a SLIP is likelier (a holder says too
// much about their secret); the Voice often hides a small mission inside the
// party; the night ends with an aftermath (who slept where, who cried).
//
// The supérette: the Voice opens the shop for ninety seconds; two housemates
// run in and grab the week's food. A good haul feeds the house, a bad one
// starts grumbling, a punishment can close it, and sometimes there is an
// envelope on a shelf.
//
// Every event has a consequence (bonds, the hunt, money, the public), returned
// as `effects` for the adapter to apply. Pure: state + ctx
// `{ stat, bond, rng, week, archetype, compat }`.

import { addEvidence, secretOf, showClue } from './hunt.js';
import { mint, burn, balance } from './kitty.js';

const st = (ctx, n, k) => { const v = Number(ctx?.stat?.(n, k)); return Number.isFinite(v) ? v : 5; };
const bondOf = (ctx, a, b) => Number(ctx?.bond?.(a, b)) || 0;
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

/** The real parties (§15), each with its look and what people wear. */
export const PARTY_THEMES = [
  { id: 'pink-white', name: 'The Pink and White Party', look: 'pink and white balloons everywhere, a white dance floor', wear: ['all in white with a pink feather boa', 'a pink suit', 'a white dress and pink sunglasses', 'pink trousers and a white shirt open at the neck'] },
  { id: 'samba', name: 'Samba Night', look: 'feathers, drums and a glitter ball over the pool', wear: ['a feathered headdress', 'sequins from head to toe', 'a carnival mask and a flower shirt', 'gold glitter and very little else'] },
  { id: 'costumes', name: 'The Fantasy Night', look: 'a costume rail delivered by the Voice', wear: ['a pirate outfit', 'a fairy costume with wings', 'a superhero cape', 'a vampire cape and plastic fangs'] },
  { id: 'garden', name: 'The Garden Party', look: 'lanterns in the garden, a long table under the pergola', wear: ['a flowery summer dress', 'a straw hat and linen shirt', 'a pastel suit', 'a flower crown'] },
  { id: 'karaoke', name: 'Karaoke Night', look: 'a little stage and a microphone in the living room', wear: ['a sparkly jacket', 'a rock star wig', 'a glittery dress', 'leather trousers'] },
  { id: 'halloween', name: 'Halloween Night', look: 'cobwebs, pumpkins and candles in every room', wear: ['a witch hat', 'zombie make-up', 'a skeleton onesie', 'a ghost sheet with eye holes'] },
  { id: 'masked-ball', name: 'The Masked Ball', look: 'candles, velvet and a mask on every chair', wear: ['a black velvet mask and a long gown', 'a gold mask and a tuxedo', 'a feathered mask', 'a silver mask and a cape'] },
  { id: 'eighties', name: 'The Eighties Night', look: 'neon lights and a mirror ball', wear: ['a neon tracksuit', 'big hair and leg warmers', 'a shoulder-padded jacket', 'a headband and a sweatband'] },
];

/** How far a housemate's guard comes down at a party: temper, boldness, and the night. */
const loosen = (ctx, n, rng) => clamp((10 - st(ctx, n, 'temperament')) / 10 * 0.45 + st(ctx, n, 'boldness') / 10 * 0.3 + rng() * 0.35);

/** Hidden in the party by the Voice (§15): small, said to one person, judged by the end of the night. */
// `text` is what the Voice says to the holder; `done` is the narration, about them
const PARTY_MISSIONS = [
  { id: 'dance', text: t => `Get ${t} to dance with you before midnight.`, done: (h, t) => `getting ${t} to dance with ${h} before midnight`, skill: ['social', 'boldness'] },
  { id: 'toast', text: () => 'Get the whole house to raise a toast to you.', done: h => `getting the whole house to raise a toast to ${h}`, skill: ['social', 'boldness'] },
  { id: 'sing', text: t => `Get ${t} to sing a song in front of everybody.`, done: (h, t) => `getting ${t} to sing in front of everybody`, skill: ['social', 'strategic'] },
  { id: 'compliment', text: t => `Get ${t} to pay you three compliments.`, done: (h, t) => `getting three compliments out of ${t}`, skill: ['social', 'intuition'] },
  { id: 'nickname', text: t => `Get ${t} to call you by a nickname all night.`, done: (h, t) => `getting ${t} to call ${h} by a nickname all night`, skill: ['social', 'boldness'] },
  { id: 'chair', text: () => 'Get somebody to give you their seat three times tonight.', done: h => `getting three people to give up their seat for ${h}`, skill: ['social', 'strategic'] },
];

/**
 * The party night. Returns the act (`ss-party`) with every moment and its
 * effects: `bond` [[a, b, d]], `pub` [[n, axis, d, why]], money via the ledger,
 * and theories via the hunt.
 */
export function throwParty(state, ctx, { house = [], theme = null } = {}) {
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  if (house.length < 3) return null;
  const used = new Set(state.partiesThrown || []);
  const pool = PARTY_THEMES.filter(t => !used.has(t.id));
  const th = theme || pick(pool.length ? pool : PARTY_THEMES, rng);
  (state.partiesThrown ||= []).push(th.id);
  const fx = { bond: [], pub: [] };
  const moments = [];
  const loose = Object.fromEntries(house.map(n => [n, loosen(ctx, n, rng)]));
  // dressed to the theme: a line each; the boldest outfit is the night's talking point
  // nobody in the same outfit as anybody shown, and a dress or a gown only for a woman
  // (ctx.gender; a housemate with none on the roster gets the neutral ones)
  const fem = /dress|gown/;
  const left = th.wear.slice().sort(() => rng() - 0.5);
  const outfits = [];
  for (const n of house.slice().sort(() => rng() - 0.5)) {
    const g = ctx.gender?.(n);
    const i = left.findIndex(w => (g === 'f' || !fem.test(w)));
    if (i < 0) continue;
    outfits.push({ n, wear: left.splice(i, 1)[0] });
  }
  const star = house.slice().sort((a, b) => (st(ctx, b, 'boldness') + st(ctx, b, 'social')) - (st(ctx, a, 'boldness') + st(ctx, a, 'social')) + (rng() - 0.5) * 4)[0];
  moments.push({ kind: 'star', who: [star], text: `${star} owns the dance floor.` });
  fx.pub.push([star, 'fun', 0.2, `was the star of ${th.name}`]);
  // the wallflower: on the sofa all night, and the country barely sees them
  const wall = house.slice().sort((a, b) => st(ctx, a, 'boldness') + st(ctx, a, 'social') - st(ctx, b, 'boldness') - st(ctx, b, 'social'))[0];
  if (wall !== star && st(ctx, wall, 'boldness') + st(ctx, wall, 'social') < 9) {
    moments.push({ kind: 'wallflower', who: [wall], text: `${wall} spends the night on the sofa with a glass of water.` });
    fx.pub.push([wall, 'seen', -0.3, '']);
  }
  // a flirt, or a kiss: two who like each other, guards down (romanticCompat first, always)
  const pairs = [];
  for (let i = 0; i < house.length; i++) for (let j = i + 1; j < house.length; j++) {
    const a = house[i], b = house[j];
    if (!ctx.compat?.(a, b)) continue;
    const want = bondOf(ctx, a, b) / 10 + (loose[a] + loose[b]) / 2 * 0.5;
    if (want > 0.55) pairs.push({ a, b, want });
  }
  pairs.sort((x, y) => y.want - x.want);
  const couple = pairs[0];
  if (couple && rng() < 0.75) {
    const kiss = couple.want + rng() * 0.3 > 0.95;
    moments.push({ kind: kiss ? 'kiss' : 'flirt', who: [couple.a, couple.b],
      text: kiss ? `${couple.a} and ${couple.b} kiss on the dance floor, and the whole house sees it.` : `${couple.a} and ${couple.b} dance close all night, and do not go to bed when everybody else does.` });
    fx.bond.push([couple.a, couple.b, kiss ? 2 : 1.2]);
    for (const n of [couple.a, couple.b]) fx.pub.push([n, 'arc', kiss ? 0.4 : 0.2, kiss ? 'a kiss at the party' : 'a slow dance at the party']);
    // somebody who wanted one of them watches it happen
    const jealous = house.find(x => x !== couple.a && x !== couple.b && ctx.compat?.(x, couple.a) && bondOf(ctx, x, couple.a) >= 5);
    if (jealous && kiss) {
      moments.push({ kind: 'jealous', who: [jealous, couple.a], text: `${jealous} sees the kiss, puts down a glass, and goes to bed early.` });
      fx.bond.push([jealous, couple.b, -1.5]); fx.pub.push([jealous, 'pity', 0.25, `watched ${couple.a} kiss somebody else`]);
    }
  }
  // a fight: two who cannot stand each other, guards down
  const enemies = [];
  for (let i = 0; i < house.length; i++) for (let j = i + 1; j < house.length; j++) {
    const a = house[i], b = house[j];
    const heat = -bondOf(ctx, a, b) / 10 + (loose[a] + loose[b]) / 2 * 0.6;
    if (bondOf(ctx, a, b) <= -2) enemies.push({ a, b, heat });
  }
  enemies.sort((x, y) => y.heat - x.heat);
  const feud = enemies[0];
  if (feud && rng() < clamp(feud.heat)) {
    const starter = loose[feud.a] >= loose[feud.b] ? feud.a : feud.b, other = starter === feud.a ? feud.b : feud.a;
    moments.push({ kind: 'fight', who: [starter, other], text: `Late in the night ${starter} and ${other} have it out ${pick(['by the pool', 'in the kitchen', 'on the terrace', 'at the bottom of the stairs'], rng)}, loud enough for everybody.` });
    fx.bond.push([starter, other, -2]);
    fx.pub.push([starter, 'fun', 0.3, `blew up at ${other} at the party`], [starter, 'heat', 0.3, `blew up at ${other} at the party`], [other, 'pity', 0.15, `was shouted at by ${starter}`]);
    // who stepped in
    const peace = house.filter(x => x !== starter && x !== other).sort((x, y) => st(ctx, y, 'social') - st(ctx, x, 'social'))[0];
    if (peace && NICE.includes(ctx.archetype?.(peace) || '')) {
      moments.push({ kind: 'peacemaker', who: [peace, starter], text: `${peace} gets between them and walks ${starter} inside.` });
      fx.bond.push([peace, other, 0.8]); fx.pub.push([peace, 'warmth', 0.2, 'broke up a fight at the party']);
    }
  }
  // a SLIP: a holder with their guard down says too much (a tell to the room; the full
  // reveal is the Voice's commandment 8, which the party makes likelier: voice.js)
  const loosest = house.filter(n => secretOf(state, n) && !secretOf(state, n).found).sort((a, b) => loose[b] - loose[a])[0];
  if (loosest && rng() < loose[loosest] * 0.55) {
    const s = secretOf(state, loosest);
    const heard = house.filter(x => x !== loosest && !(s.holders || []).includes(x)).sort(() => rng() - 0.5).slice(0, 2);
    for (const h of heard) addEvidence(state, ctx, h, loosest, { strength: 0.22, how: 'party-slip' });
    const said = pick(['starts a story about life before the house, and stops halfway through',
      'says something about home, then changes the subject far too fast',
      'lets a detail about the past slip out, then laughs it off a bit too loudly',
      'nearly says something, catches it, and goes quiet'], rng);
    moments.push({ kind: 'slip', who: [loosest, ...heard.slice(0, 1)], heard, text: `${loosest}, a drink in hand, ${said}. ${heard.join(' and ')} ${heard.length > 1 ? 'look' : 'looks'} at each other.` });
    fx.pub.push([loosest, 'fun', 0.1, 'said too much at the party']);
  }
  // the Voice's party mission, to one housemate
  const holder = house.slice().sort(() => rng() - 0.5)[0];
  const target = house.filter(x => x !== holder)[Math.floor(rng() * (house.length - 1))];
  const m = pick(PARTY_MISSIONS, rng);
  const skill = m.skill.reduce((s, k) => s + st(ctx, holder, k), 0) / (m.skill.length * 10);
  const won = rng() < clamp(0.25 + skill * 0.6 + bondOf(ctx, holder, target) * 0.03);
  const mission = { holder, target, id: m.id, text: m.text(target), won, reward: 2000 };
  if (won) { mint(state, holder, 2000, 'a party mission', week); fx.pub.push([holder, 'game', 0.15, 'pulled off a party mission'], [holder, 'fun', 0.1, 'pulled off a party mission']); fx.bond.push([holder, target, 0.5]); }
  const done = m.done(holder, target);
  moments.push({ kind: 'mission', who: [holder, target], text: won ? `${holder} pulls off the Voice's party mission, ${done}.` : `${holder} tries all night at the Voice's party mission, ${done}, and fails.` });
  // the aftermath: who slept where, who cried
  const after = [];
  if (couple && moments.some(x => x.kind === 'kiss' || x.kind === 'flirt')) after.push({ kind: 'slept', who: [couple.a, couple.b], text: `${couple.a} and ${couple.b} fall asleep on the same sofa.` });
  const fightM = moments.find(x => x.kind === 'fight');
  if (fightM) {
    const hurt = fightM.who[1];
    after.push({ kind: 'cried', who: [hurt], text: `${hurt} cries in the bathroom at three in the morning.` });
    const friend = house.filter(x => !fightM.who.includes(x)).sort((x, y) => bondOf(ctx, hurt, y) - bondOf(ctx, hurt, x))[0];
    if (friend) { after.push({ kind: 'comfort', who: [friend, hurt], text: `${friend} sits on the floor outside the door until ${hurt} comes out.` }); fx.bond.push([friend, hurt, 1]); fx.pub.push([friend, 'warmth', 0.15, 'looked after somebody after the party']); }
  }
  return { type: 'ss-party', week, theme: th.id, name: th.name, look: th.look, outfits, moments, mission, aftermath: after, effects: fx,
    beats: moments.slice(0, 4).map(x => ({ text: x.text, players: x.who.slice(0, 3), badgeText: 'PARTY', badgeClass: 'purple', part: 'party' })) };
}

/**
 * The supérette (§15): ninety seconds to grab the week's food. Closed when the
 * Voice has taken the shopping away. Returns the act (`ss-superette`).
 */
export function runSuperette(state, ctx, { house = [], closed = false, picker = null } = {}) {
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  if (house.length < 2) return null;
  const fx = { bond: [], pub: [] };
  if (closed) {
    // the whole house goes without: they blame whoever cost them it
    const blamed = closed === true ? null : closed;
    if (blamed) for (const n of house.filter(x => x !== blamed)) if (rng() < 0.5) fx.bond.push([n, blamed, -0.4]);
    return { type: 'ss-superette', week, closed: true, blamed, effects: fx,
      beats: [{ text: `The store stays shut this week.${blamed ? ` The house knows who to thank: ${blamed}.` : ''}`, players: blamed ? [blamed] : [], badgeText: 'NO SHOPPING', badgeClass: 'red', part: 'superette' }] };
  }
  // who runs in: the house sends its fastest, or the game's winner picks a friend
  const runners = picker && house.includes(picker)
    ? [picker, house.filter(x => x !== picker).sort((a, b) => bondOf(ctx, picker, b) - bondOf(ctx, picker, a))[0]]
    : house.slice().sort((a, b) => st(ctx, b, 'physical') - st(ctx, a, 'physical') + (rng() - 0.5) * 3).slice(0, 2);
  const haul = runners.reduce((s, n) => s + st(ctx, n, 'physical') * 0.5 + st(ctx, n, 'mental') * 0.3 + rng() * 3, 0) / runners.length;
  const grade = haul >= 6.5 ? 'great' : haul >= 4.5 ? 'fine' : 'poor';
  const moments = [];
  if (grade === 'great') {
    moments.push({ kind: 'haul', who: runners, text: `${runners.join(' and ')} come out with two trolleys full, and the house cheers.` });
    for (const r of runners) for (const n of house) if (n !== r && rng() < 0.4) fx.bond.push([n, r, 0.3]);
  } else if (grade === 'poor') {
    moments.push({ kind: 'haul', who: runners, text: `${runners.join(' and ')} come out with six yoghurts, a melon and no bread. The house is not happy.` });
    for (const r of runners) for (const n of house) if (n !== r && rng() < 0.25) fx.bond.push([n, r, -0.3]);
    fx.pub.push([runners[0], 'fun', 0.1, 'came back from the store with no bread']);
  } else moments.push({ kind: 'haul', who: runners, text: `${runners.join(' and ')} grab what they can in ninety seconds. Enough for the week, just.` });
  // the temptation on the top shelf: champagne, paid from your own kitty
  const tempted = runners.find(n => st(ctx, n, 'boldness') >= 6 && balance(state, n) > 2000 && rng() < 0.4);
  if (tempted) {
    burn(state, tempted, 1000, 'champagne at the store', week);
    moments.push({ kind: 'champagne', who: [tempted], text: `${tempted} grabs the champagne from the top shelf. It costs $1,000 of ${tempted}'s kitty, and the house drinks it that night.` });
    for (const n of house) if (n !== tempted && rng() < 0.4) fx.bond.push([n, tempted, 0.4]);
  }
  // sometimes there is an envelope on a shelf: a clue only the runners see
  let clue = null;
  if (rng() < 0.3) {
    const hidden = house.filter(n => !runners.includes(n) && secretOf(state, n) && !secretOf(state, n).found);
    if (hidden.length) {
      const holder = pick(hidden, rng);
      const c = showClue(state, ctx, { holder, how: 'store', to: runners, house });
      if (c) { clue = { holder, clue: c.clue }; moments.push({ kind: 'envelope', who: runners, text: `Behind the cereal, an envelope. Inside, a clue: ${c.clue}. ${runners.join(' and ')} keep it to themselves.` }); fx.pub.push([runners[0], 'game', 0.1, 'found a clue in the store']); }
    }
  }
  return { type: 'ss-superette', week, closed: false, runners, grade, moments, clue, effects: fx,
    beats: moments.slice(0, 2).map(m => ({ text: m.text, players: m.who.slice(0, 2), badgeText: 'THE STORE', badgeClass: 'green', part: 'superette' })) };
}
