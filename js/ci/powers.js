// ══════════════════════════════════════════════════════════════════════
// ci/powers.js — powers handed over at a visit (spec §11.1, §14; Plan 3b)
// ══════════════════════════════════════════════════════════════════════
//
// On a night that carries a power, the Circle gives it to the blocked player
// to pass on, and they visit someone they trust to hand it over (US 2:
// Savannah gave Courtney the Inner Circle; US 3: Calvin gave Nick a burner).
// Who gets it is the last move of their game. Each power has its lifecycle:
//   immunity  safe at the next blocking; the room is told (UK 2)
//   hacker    one chat spoken as somebody else; the room learns there was a
//             Hacker; comparing notes can undo it (US 5)
//   joker     meets the next arrivals first, masked, and names one of the
//             next Influencers (US 2)
//   burner    a second profile with its own ballot until it is exposed (US 3)
import { rel, bump, S, addScene } from './state.js';
import { feel } from './mind.js';
import { nudgeBelief } from './beliefs.js';

export const POWERS = {
  immunity: { give(state, rng, from, to) { state.immuneNext[to] = true; } },
  hacker: { give() {} },
  joker: { give() {} },
  burner: { give(state, rng, from, to, p) { p.ballots = 2; } },
};

const live = (state, kind) => state.powers.filter(p => p.kind === kind && !p.done && state.active.includes(p.holder));

/** At the visit: hand tonight's power over. */
export function handOver(state, rng, from, to, kind, visit) {
  const p = { kind, from, holder: to, day: state.day, done: false };
  POWERS[kind].give(state, rng, from, to, p);
  state.powers.push(p);
  visit.data.power = kind;
  bump(to, from, 'obligation', 2);
  feel(state, to, 'elation', 1.5);
  return p;
}

/** The morning after: what the room is told, and the Hacker's move. */
export function powersMorning(state, rng) {
  for (const p of state.powers.filter(x => !x.done && !x.told && x.day === state.day - 1)) {
    p.told = true;
    // A given immunity is public; a Hacker announces itself only after the hack.
    if (p.kind === 'immunity' && state.active.includes(p.holder)) {
      addScene(state, 'power-reveal', [p.holder], { kind: 'immunity', holder: p.holder, from: p.from }, [...state.active]);
    }
    if (p.kind === 'joker' && state.active.includes(p.holder)) {
      addScene(state, 'power-reveal', [p.holder], { kind: 'joker' }, [...state.active]);
      for (const o of state.active) if (o !== p.holder) feel(state, o, 'paranoia', 0.5);
    }
  }
  for (const p of live(state, 'hacker')) hack(state, rng, p);
}

// The Hacker picks the player they most want hurt, and speaks as them to
// that player's closest friend. The friend believes it.
export const HACK = { trust: 2, undo: 0.7 };
function hack(state, rng, p) {
  const h = p.holder;
  const others = state.active.filter(o => o !== h);
  const as = others.map(o => [o, rel(h, o, 'resentment') + rel(h, o, 'strategicRespect') * 0.3 + rng()]).sort((a, b) => b[1] - a[1])[0]?.[0];
  const to = as && others.filter(o => o !== as).map(o => [o, rel(o, as, 'affection') + rng() * 0.5]).sort((a, b) => b[1] - a[1])[0]?.[0];
  p.done = true;
  if (!as || !to) return;
  const sc = addScene(state, 'hack', [h, to], { hacker: h, as, to }, [h, to]);
  bump(to, as, 'trust', -HACK.trust); bump(to, as, 'resentment', 1.5);
  nudgeBelief(state, to, as, 'likesMe', -3, sc);
  const alert = addScene(state, 'power-reveal', [h], { kind: 'hacker' }, [...state.active]);
  for (const o of state.active) feel(state, o, 'paranoia', 1);
  // Comparing notes can undo it: the two who were played talk.
  if (rng() < (S(state, to, 'intuition') + S(state, as, 'intuition')) / 20 * HACK.undo) {
    const u = addScene(state, 'hack-undone', [to, as], { hacker: h, as, to }, [to, as]);
    bump(to, as, 'trust', HACK.trust); bump(to, as, 'resentment', -1.5);
    nudgeBelief(state, to, as, 'likesMe', 3, u);
    // Who was it? A good read finds the Hacker; a bad one blames somebody else.
    const right = rng() < S(state, to, 'intuition') / 10 * 0.5;
    const blamed = right ? h : others.filter(o => o !== as && o !== to && o !== h)[0] || h;
    bump(to, blamed, 'resentment', right ? 2 : 1);
    u.data.blamed = blamed;
  }
  void alert;
}

/** After the day's arrivals: the Joker gets to them first. */
export function jokerMeets(state, rng, arrivals) {
  for (const p of live(state, 'joker')) {
    for (const n of arrivals) {
      const sc = addScene(state, 'joker-chat', [p.holder, n], { holder: p.holder, newcomer: n }, [p.holder, n]);
      bump(n, p.holder, 'affection', 1); bump(p.holder, n, 'affection', 1);
      // A sharp newcomer works out who is behind the mask (US 2: Khat did).
      if (rng() < S(state, n, 'intuition') / 10 * 0.4) sc.data.guessed = true;
    }
  }
}

/** At the next ordinary ratings night: the Joker names the second Influencer. */
export function jokerPick(state, influencers) {
  const p = live(state, 'joker')[0];
  if (!p || influencers.length !== 2) return influencers;
  const pick = state.active.filter(o => o !== p.holder && o !== influencers[0])
    .sort((a, b) => rel(p.holder, b, 'affection') - rel(p.holder, a, 'affection'))[0];
  p.done = true;
  if (!pick) return influencers;
  addScene(state, 'joker-pick', [p.holder, pick], { holder: p.holder, pick }, [...state.active]);
  bump(pick, p.holder, 'obligation', 2);
  return [influencers[0], pick];
}

/** Burner ballots for tonight, and the chance someone exposes one. */
export const BURNER = { spot: 0.08 };
export function burnerVoters(state, rng) {
  const out = [];
  for (const p of live(state, 'burner')) {
    const spotted = state.active.find(o => o !== p.holder && rng() < S(state, o, 'intuition') / 10 * BURNER.spot);
    if (spotted) {
      p.done = true;
      addScene(state, 'burner-exposed', [spotted, p.holder], { holder: p.holder, by: spotted }, [...state.active]);
      for (const o of state.active) if (o !== p.holder) bump(o, p.holder, 'trust', -1);
      continue;
    }
    out.push(p.holder);
    if (--p.ballots <= 0) p.done = true;
  }
  return out;
}
