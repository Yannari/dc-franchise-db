// ══════════════════════════════════════════════════════════════════════
// dr/prep.js — the werk room, before it is a performance
// ══════════════════════════════════════════════════════════════════════
//
// Where the social layer reaches the scoreboard. Everything here changes a
// number the panel will later see, which is the point: bonds that never touch
// a result are decoration, and a season where being liked does nothing is a
// season about spreadsheets.
//
// The three things that happen in a workroom, in the order they matter:
// somebody helps, somebody sabotages, and somebody is left alone. The third is
// an EVENT rather than an absence — a queen nobody will help is a story, and
// filing it as "nothing happened" is how it becomes invisible.
import { dragOf } from './queen.js';
import { blendScore, noise } from './perform.js';
import { canScheme, evt, heaviestStat } from './rules.js';

export function prepareRoom({ living, players, maxi, rng, bond }) {
  const key = heaviestStat(maxi);
  const prep = {};
  const events = [];
  const scenes = [];

  for (const n of living) {
    const p = players[n];
    const s = p.stats || {};
    const num = k => (Number.isFinite(Number(s[k])) ? Number(s[k]) : 5);
    prep[n] = (blendScore(dragOf(p), maxi.blend) - 5) * 0.1
      + (num('mental') - 5) * 0.03
      + (num('strategic') - 5) * 0.02;
  }

  const helped = new Set();
  const hurt = new Set();
  const acted = new Set();
  const meanBond = n => (living.length > 1
    ? living.filter(o => o !== n).reduce((t, o) => t + bond(n, o), 0) / (living.length - 1)
    : 0);

  // SABOTAGE FIRST, so a schemer's target is not "already fine because a
  // friend got there". One rival per queen per week: a villain who ruins
  // everybody's day is a cartoon.
  for (const n of living) {
    if (acted.has(n) || !canScheme(players[n])) continue;
    if (dragOf(players[n])[key] < 6) continue;   // she has to know the craft to sabotage it
    const target = living
      .filter(o => o !== n && !hurt.has(o) && bond(n, o) <= -3)
      .sort((a, b) => bond(n, a) - bond(n, b))[0];
    if (!target) continue;
    prep[target] -= 0.7;
    hurt.add(target);
    acted.add(n);
    events.push(evt('sabotage', {
      players: [n, target], bond: [[n, target, -1.5]], pop: { [n]: -3 }, data: { craft: key },
    }));
  }

  for (const n of living) {
    if (acted.has(n) || dragOf(players[n])[key] < 7) continue;
    const friend = living
      .filter(o => o !== n && !helped.has(o) && !hurt.has(o)
        && dragOf(players[o])[key] <= 4 && bond(n, o) >= 3)
      .sort((a, b) => bond(n, b) - bond(n, a))[0];
    if (!friend) continue;
    prep[friend] += 0.6;
    helped.add(friend);
    acted.add(n);
    events.push(evt('help', {
      players: [n, friend], bond: [[n, friend, 1.0]], pop: { [n]: 2 }, data: { craft: key },
    }));
  }

  // The queen nobody will help. An event, not an absence.
  for (const n of living) {
    if (helped.has(n) || meanBond(n) > -3) continue;
    prep[n] -= 0.3;
    events.push(evt('shunned', { players: [n], pop: { [n]: -1 }, data: { craft: key } }));
  }

  scenes.push({
    step: 'prep', kind: 'prep-room',
    data: { craft: key, helped: [...helped], hurt: [...hurt] },
  });
  void rng;
  return { prep, scenes, events };
}

/**
 * The host walks the room.
 *
 * She is right most of the time, and being right is not the same as being
 * HEARD: `intuition` decides whether a queen reads the note correctly and
 * `boldness` whether she is willing to change course this late. So good advice
 * ignored and bad advice taken are both possible, and both cost — which is the
 * whole reason the scene is worth simulating rather than narrating.
 */
/** How many of the host's stops get a card. The rest still happen. */
const FEATURED_VISITS = 3;

export function walkthrough({ living, players, maxi, prep, rng }) {
  const notes = [];
  const events = [];
  for (const n of living) {
    const s = players[n]?.stats || {};
    const num = k => (Number.isFinite(Number(s[k])) ? Number(s[k]) : 5);

    const right = rng() < 0.75;
    const reads = rng() < 0.25 + num('intuition') / 20;
    const acts = rng() < 0.30 + num('boldness') / 16;
    // She takes it when she reads it as worth taking AND is willing to move.
    const took = (right ? reads : !reads) && acts;
    const delta = right ? (took ? 0.7 : -0.4) : (took ? -0.7 : 0.2);

    prep[n] = (prep[n] || 0) + delta;
    notes.push({ name: n, right, took, delta: Math.round(delta * 100) / 100 });
  }

  /* EVERY QUEEN IS SEEN. The host walks the whole room and the screen shows
     the whole room — a queen who gets no card on a night she was in is a
     queen the episode forgot, and that is worse than a long screen.
     Screen time is still UNEQUAL, and that is the point: it is earned by
     what happened rather than rationed by a cap. The visits that moved the
     most carry `featured` on their data so a screen can give them the extra
     room. NOTHING READS IT YET — it is recorded here because the engine is
     where the fact lives, and a screen that wants it will not have to
     recompute the ranking. */
  /* THE TOP THREE BY RANK, NOT BY VALUE. This took the third-largest |delta|
     as a threshold and marked everybody at or above it — and `delta` only
     ever takes four values, so the third-largest is almost always the largest,
     and "featured" meant every queen the note landed hard on. On a thirteen
     queen room that was nine or ten of them, which is not a shortlist.
     Ranked and sliced, with ties broken by name so a replay of the same seed
     marks the same three. */
  const featured = new Set([...notes]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.name.localeCompare(b.name))
    .slice(0, FEATURED_VISITS)
    .filter(x => Math.abs(x.delta) > 0)
    .map(x => x.name));
  for (const note of notes) {
    events.push(evt('walkthrough', {
      players: [note.name], pop: { [note.name]: note.took ? 1 : -1 },
      data: {
        right: note.right, took: note.took, challenge: maxi.id,
        featured: featured.has(note.name),
      },
    }));
  }
  void noise;
  return { notes, prep, events };
}

/**
 * The choreographer takes the room.
 *
 * ── THE HALF OF THE NIGHT THAT WAS NOT SIMULATED ──
 *
 * A Rumix is performed live with choreography and a music video is danced,
 * and neither module had a rehearsal in it: the number simply existed on the
 * night, learned by nobody. So the thing a viewer watches for on those
 * afternoons — who picks it up in one pass, who is still counting under her
 * breath at the end of the day — happened nowhere, and the day could not help
 * or hurt her the way the booth can.
 *
 * It is deliberately NOT another craft roll. Dance is the floor, and what
 * separates two queens who dance equally well is whether they can take a
 * count off somebody in one pass (`intuition`) and whether they can keep
 * taking it at hour six (`temperament`). That is what a rehearsal room
 * actually sorts.
 *
 * Bounded, and small beside the challenge itself: a good afternoon should
 * move a close night and never decide one. Same shape as the booth's lift,
 * for the same reason — see js/dr/chal/rumix.js.
 */
export function rehearseNumber({ living, players, rng, cap = 1.1 }) {
  const notes = [];
  const events = [];
  const choreo = {};

  for (const n of living) {
    const d = dragOf(players[n]);
    const s = players[n]?.stats || {};
    const num = k => (Number.isFinite(Number(s[k])) ? Number(s[k]) : 5);
    const pickUp = (d.dance - 5) * 0.13
      + (num('intuition') - 5) * 0.10
      + (num('temperament') - 5) * 0.07
      + noise(rng, 0.5);
    const delta = Math.round(Math.max(-cap, Math.min(cap, pickUp)) * 100) / 100;
    choreo[n] = delta;
    notes.push({
      name: n, delta,
      tier: delta >= cap * 0.55 ? 'first-pass'
        : delta >= 0 ? 'got-there'
          : delta > -cap * 0.55 ? 'behind-the-count' : 'still-counting',
    });
  }

  /* THE TWO THE ROOM TALKS ABOUT. Ranked and sliced rather than thresholded,
     so there is exactly one of each however the afternoon fell — the same fix
     `featured` above needed, for the same reason. */
  const ranked = [...notes].sort((a, b) => b.delta - a.delta || a.name.localeCompare(b.name));
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  if (best && best.delta >= 0.5) {
    events.push(evt('picked-it-up', {
      players: [best.name], pop: { [best.name]: 2 },
      state: { rehearsalStandout: best.name }, data: { delta: best.delta },
    }));
  }
  if (worst && worst.delta <= -0.5 && worst.name !== best?.name) {
    events.push(evt('cannot-count', {
      players: [worst.name], pop: { [worst.name]: -2 }, data: { delta: worst.delta },
    }));
  }

  return { choreo, notes, events,
    scenes: [{ step: 'prep', kind: 'rehearsal', data: { notes } }] };
}
