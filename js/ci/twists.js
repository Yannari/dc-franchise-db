// ══════════════════════════════════════════════════════════════════════
// ci/twists.js — who sits behind a profile (spec §14; Plan 3b Task 9b)
// ══════════════════════════════════════════════════════════════════════
//
// Events booked on a day (or drawn now and then) that change who is really
// typing, or who the room believes is real:
//   swap         two players play each other's profiles until the next
//                blocking (US 7). The people behind the profiles swap, so
//                stats, typing voice and slips follow the person, while the
//                relationships stay with the profile, as on the show.
//   clone        a blocked player comes back wearing an active profile's
//                name and photos; the room votes which is real; whoever is
//                voted fake leaves (US 3, UK 3 — US 3 voted out the real one)
//   ride-or-die  secret compatibility pairs (US 6): a blocked member's
//                partner may go in their place; the top player's partner is
//                a secret second Influencer. (The real rule blocks both
//                unless one sacrifices; here someone always goes, so the
//                season still loses exactly the players it must.)
import { rel, bump, S, addScene, noteIdentity, moveIn } from './state.js';
import { initMind, feel } from './mind.js';
import { belief } from './beliefs.js';
import { voiceOf, personaShown } from './profiles.js';
import { tellsOf } from './persona-data.js';
import { rolesFor } from './shared.js';

const single = (state, h) => state.profiles[h]?.players.length === 1;

function swapPeople(state, A, B) {
  noteIdentity(state, [A, B]);
  const pa = state.profiles[A].players, pb = state.profiles[B].players;
  state.profiles[A].players = pb; state.profiles[B].players = pa;
  for (const n of pb) state.handleOf[n] = A;
  for (const n of pa) state.handleOf[n] = B;
}

export const EVENTS = {
  swap: {
    canNow: state => state.active.filter(h => single(state, h)).length >= 2,
    run(state, rng, { until }) {
      const pool = state.active.filter(h => single(state, h));
      const A = pool[Math.floor(rng() * pool.length)];
      const rest = pool.filter(h => h !== A);
      const B = rest[Math.floor(rng() * rest.length)];
      const people = [[...state.profiles[A].players], [...state.profiles[B].players]];
      swapPeople(state, A, B);
      // Playing someone else is a cover to keep up: slips can come.
      for (const h of [A, B]) state.profiles[h].gap = (state.profiles[h].gap || 0) + 1;
      state.swap = { handles: [A, B], people, until };
      for (const h of [A, B]) feel(state, h, 'stress', 1.5);
      return addScene(state, 'swap', [A, B], { handles: [A, B], people, until }, [A, B]);
    },
  },
  clone: {
    canNow: state => state.blocked.some(b => single(state, b.handle)) && state.active.some(h => single(state, h)),
    run(state, rng) {
      const from = [...state.blocked].reverse().find(b => single(state, b.handle));
      const person = state.profiles[from.handle].players[0];
      const original = state.active.filter(h => single(state, h))
        .sort((a, b) => (state.likesCount[b] || 0) - (state.likesCount[a] || 0) || (a < b ? -1 : 1))[0];
      const o = state.profiles[original];
      let clone = `${original}-copy`, k = 2;
      while (state.profiles[clone]) clone = `${original}-copy${k++}`;
      state.profiles[clone] = { handle: clone, players: [person], mode: 'catfish', personaId: null, reason: 'strategic',
        shown: { ...o.shown }, edits: [], tells: [], gap: 2, voice: voiceOf(o.shown.age ?? 28, state.people[person].stats), clone: original };
      state.handleOf[person] = clone;
      state.active.push(clone); moveIn(state, clone); state.joinedDay[clone] = state.day; initMind(state, clone);
      // Everyone else votes which one is FAKE. They know the original's words;
      // the clone has a day's notes and the nerve to sell it.
      const votes = {};
      for (const v of state.active.filter(h => h !== original && h !== clone)) {
        const trustO = rel(v, original, 'affection') * 0.3 + rel(v, original, 'trust') * 0.3 + belief(state, v, original).real * 3;
        const sellC = S(state, clone, 'social') * 0.25 + S(state, clone, 'boldness') * 0.15 + rng() * 3;
        votes[v] = trustO + rng() * 2 >= sellC ? clone : original;
      }
      const tally = { [original]: 0, [clone]: 0 };
      for (const t of Object.values(votes)) tally[t]++;
      const fake = tally[original] > tally[clone] ? original : clone;
      return { scene: addScene(state, 'clone', [original, clone], { original, clone, votes, fake, cloner: person }, [...state.active]), fake };
    },
  },
  // US 2, US 5: two blocked players come back as ONE shared profile, under a
  // persona the Catfish Pool still has, or as themselves (spec 14.7, 14.8).
  // They come back knowing who blocked them.
  'second-chance': {
    canNow: state => new Set(state.blocked.map(b => b.handle)).size >= 2,
    run(state, rng) {
      // Two different blocked profiles, one person from each (the latest two).
      const handles = [...new Set(state.blocked.slice().reverse().map(b => b.handle))].slice(0, 2);
      const people = handles.map(h => state.profiles[h].players[0]);
      const from = state.blocked.filter(b => state.profiles[b.handle].players.some(n => people.includes(n)));
      const personaId = state.unused.shift();
      const persona = personaId && state.pool.find(p => p.id === personaId);
      const roles = rolesFor(state, people);
      const face = state.people[roles.face];
      const shown = persona
        ? personaShown(persona)
        : { name: face.name, age: face.age, gender: face.gender, job: face.job, status: face.status, face: `portrait:${face.name}` };
      let handle = `@${String(shown.name).toLowerCase().replace(/[^a-z0-9]/g, '')}`, k = 2;
      while (state.profiles[handle]) handle = `@${String(shown.name).toLowerCase().replace(/[^a-z0-9]/g, '')}${k++}`;
      state.profiles[handle] = { handle, players: people, mode: persona ? 'catfish' : 'shared', shared: true, roles,
        personaId: persona?.id ?? null, reason: persona ? 'strategic' : null, shown, edits: [], tells: persona ? tellsOf(persona) : [],
        gap: persona ? 2 : 0.5, voice: voiceOf(shown.age ?? 30, face.stats), personaVoice: persona?.chatVoice || null, secondChance: true };
      for (const n of people) state.handleOf[n] = handle;
      state.active.push(handle); moveIn(state, handle); state.joinedDay[handle] = state.day; initMind(state, handle);
      for (const b of from) for (const i of b.by) if (state.active.includes(i)) bump(handle, i, 'resentment', 2);
      for (const o of state.active) if (o !== handle) feel(state, o, 'paranoia', 0.5);
      // Back under their own faces, the room knows them from the goodbye videos.
      return addScene(state, 'second-chance', [handle], { handle, people, persona: persona?.id ?? null, known: !persona }, [...state.active]);
    },
  },
  'ride-or-die': {
    canNow: state => state.active.length >= 6,
    run(state, rng, { until }) {
      // "It's Personal" answers make the pairs: mutual warmth, paired greedily.
      const left = [...state.active];
      const pairs = [];
      while (left.length >= 2) {
        let best = null;
        for (const a of left) for (const b of left) {
          if (a >= b) continue;
          const w = rel(a, b, 'affection') + rel(b, a, 'affection') + rng() * 2;
          if (!best || w > best[2]) best = [a, b, w];
        }
        pairs.push([best[0], best[1]]);
        left.splice(left.indexOf(best[0]), 1); left.splice(left.indexOf(best[1]), 1);
      }
      state.rideOrDie = { pairs, until };
      for (const [a, b] of pairs) { bump(a, b, 'obligation', 1); bump(b, a, 'obligation', 1); }
      return addScene(state, 'ride-or-die', [...state.active], { pairs, until }, [...state.active]);
    },
  },
};

export function runEvent(state, rng, id, ctx = {}) {
  const e = EVENTS[id];
  if (!e || !(e.canNow?.(state) ?? true)) return null;
  return e.run(state, rng, ctx);
}

/** The morning of the next blocking: a swap ends before anyone can be blocked
 *  with the wrong person behind the profile. */
export function endSwap(state) {
  const sw = state.swap;
  if (!sw || state.day < sw.until) return;
  const [A, B] = sw.handles;
  if (state.profiles[A] && state.profiles[B]) {
    swapPeople(state, A, B);
    for (const h of [A, B]) state.profiles[h].gap = Math.max(0, (state.profiles[h].gap || 0) - 1);
    addScene(state, 'swap-back', [A, B], { handles: [A, B] }, [A, B]);
  }
  state.swap = null;
}

const partnerOf = (state, h) => {
  const rd = state.rideOrDie;
  if (!rd || state.day > rd.until) return null;
  const p = rd.pairs.find(([a, b]) => a === h || b === h);
  const other = p && (p[0] === h ? p[1] : p[0]);
  return other && state.active.includes(other) ? other : null;
};

/** At a blocking: a Ride or Die partner may go instead. Loyalty and love decide. */
export const SACRIFICE = { scale: 0.08 };
export function rideOrDieTarget(state, rng, target) {
  const partner = partnerOf(state, target);
  if (!partner) return { target };
  const p = (S(state, partner, 'loyalty') + Math.max(0, rel(partner, target, 'affection'))) * SACRIFICE.scale;
  const goes = rng() < p ? partner : target;
  const stays = goes === target ? partner : target;
  addScene(state, 'sacrifice', [goes, stays], { goes, stays, chose: goes === partner }, [...state.active]);
  if (goes === partner) { bump(target, partner, 'obligation', 3); bump(target, partner, 'affection', 2); }
  return { target: goes, channel: goes === partner ? 'sacrifice' : null };
}

/** The top player's partner is a secret second Influencer (US 6). */
export function rideOrDieInfluencers(state, influencers) {
  const partner = influencers[0] && partnerOf(state, influencers[0]);
  return partner && influencers.length === 2 ? [influencers[0], partner] : influencers;
}
