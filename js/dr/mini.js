// ══════════════════════════════════════════════════════════════════════
// dr/mini.js — the mini challenge, and who it is aimed at
// ══════════════════════════════════════════════════════════════════════
//
// A mini used to be three lines inside week.js: score everybody on a blend,
// add noise, highest wins. That is fine for a photoshoot and wrong for the
// two that carry the segment, because Reading Is Fundamental and Puppet
// Parody are not solo events — they are one queen doing a bit ABOUT another
// queen, to her face, in front of the room. Resolving those as a private stat
// roll threw away the only thing that made them worth filming.
//
// So a mini declares an INTERACTION and this decides what that means:
//
//   solo     everybody performs for the room. A stat roll, which is correct.
//   targets  she picks somebody and does a bit about them. Lands or does not,
//            and either way the two of them feel it.
//   pairs    the room is split in two and each queen's result depends partly
//            on what her partner did for her.
//
// Nobody goes home for losing a mini and it never touches the week's
// placement — what it buys is POWER over the maxi. What this file adds is that
// it can now also cost you a friend.
import { dragOf } from './queen.js';
import { blendScore, noise } from './perform.js';
import { evt } from './rules.js';

/** A read that lands. Below this it did not. */
const LANDED = 6.5;
/** A read so sharp the room remembers it. */
const BRUTAL = 9;

const stat = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? n : 5;
};

/**
 * Who she aims at.
 *
 * Boldness decides how high she reaches. A fearless queen goes after the
 * biggest personality in the room; a cautious one picks somebody safe, which
 * usually means somebody she likes — and a read of a friend lands softer,
 * which is the trade she is making without knowing it.
 */
function targetFor(n, living, players, bond, star, rng) {
  const others = living.filter(o => o !== n);
  if (!others.length) return null;
  const bold = stat(players[n], 'boldness') / 10;
  const weights = others.map(o => {
    const presence = (star?.[o] ?? 5) / 10;
    const closeness = Math.max(0, bond(n, o)) / 10;
    // Bold: go for the big target. Cautious: go for the comfortable one.
    const w = bold * (0.4 + presence) + (1 - bold) * (0.4 + closeness) + rng() * 0.3;
    return { o, w };
  });
  const total = weights.reduce((t, x) => t + x.w, 0);
  let roll = rng() * total;
  return (weights.find(x => (roll -= x.w) <= 0) || weights[0]).o;
}

/**
 * One mini, end to end.
 *
 * Returns the winner and the scores as before, plus the beats and the events
 * the interaction produced. A caller that ignores `events` gets exactly the
 * old behaviour, which is what makes this safe to drop in.
 */
/** Under this and she has nothing to say, which is its own result. */
const PASSES = 2.2;

export function runMini({ living, mini, players, rng, bond = () => 0, star = {} }) {
  const scores = {};
  const events = [];
  const detail = {};

  const interaction = mini.interaction || 'solo';
  const pairs = [];

  /* ── A TARGETING MINI IS TAKEN IN TURNS, AND THE TURN IS THE FORMAT ──
     The library is not thirteen simultaneous reads; it is one queen at a
     time, announced by the host, standing up in front of everybody. Who goes
     first and who goes last is the shape of the whole segment — the last read
     of the night is the one the room has been waiting for — and none of that
     existed: `living` order was used as if it were nothing.
     Shuffled once here so the order is a real draw and so the same seed
     replays the same library. */
  const turnOrder = interaction === 'targets'
    ? [...living].sort(() => rng() - 0.5) : [...living];

  if (interaction === 'pairs') {
    // Split the room. An odd queen out works alone, which is its own result.
    const order = [...living].sort(() => rng() - 0.5);
    for (let i = 0; i + 1 < order.length; i += 2) pairs.push([order[i], order[i + 1]]);
    if (order.length % 2) pairs.push([order[order.length - 1], null]);
  }

  for (const n of living) {
    const d = dragOf(players[n]);
    let s = blendScore(d, mini.blend) + noise(rng, 3);

    if (interaction === 'targets') {
      const target = targetFor(n, living, players, bond, star, rng);
      const at = turnOrder.indexOf(n);
      detail[n] = {
        target,
        // Where in the running order she stands, and what the host calls it:
        // the first queen up, one of the middle, or the last one — which the
        // host announces as such and the room hears as such.
        turn: at,
        position: at === 0 ? 'first'
          : at === turnOrder.length - 1 ? 'last' : 'next',
      };
      if (target) {
        // A read of somebody you like lands softer — you pull it, and the room
        // can tell. A read of somebody you cannot stand has teeth.
        const b = bond(n, target);
        s += b >= 4 ? -0.6 : b <= -4 ? 0.8 : 0;
        detail[n].pulled = b >= 4;
      }
    } else if (interaction === 'pairs') {
      const pair = pairs.find(p => p.includes(n));
      const partner = pair ? pair.find(o => o && o !== n) : null;
      detail[n] = { partner };
      if (partner) {
        // She wears what her partner made her. Their skill is half her result.
        s = s * 0.6 + (blendScore(dragOf(players[partner]), mini.blend) + noise(rng, 2)) * 0.4;
      }
    }

    scores[n] = Math.round(s * 100) / 100;

    /* SHE HAS NOTHING. The worst thing that happens in a library is not a
       bad read, it is a queen who stands up, opens her mouth and passes —
       and that was unreachable, because the floor of the pool was "a read
       that did not land". Proportional to how far under she is rather than a
       flat cut, so it is rare and it is earned. */
    if (interaction === 'targets' && detail[n]) {
      detail[n].passed = scores[n] < PASSES;
    }
  }

  // ── what the interaction did to the room ──
  if (interaction === 'targets') {
    for (const n of living) {
      const target = detail[n]?.target;
      if (!target) continue;
      const s = scores[n];
      if (s >= BRUTAL) {
        // It landed hard. The room loves her; the target less so.
        events.push(evt('read-landed', {
          players: [n, target],
          bond: [[n, target, -0.5]],
          pop: { [n]: 2 },
          data: { mini: mini.id, score: s },
        }));
      } else if (s < LANDED) {
        // She went for somebody and missed, which is worse than not going.
        events.push(evt('read-missed', {
          players: [n, target],
          bond: [[n, target, -1]],
          pop: { [n]: -1 },
          data: { mini: mini.id, score: s },
        }));
      } else if (detail[n].pulled) {
        // She had it and would not use it on a friend. The friend notices.
        events.push(evt('pulled-the-punch', {
          players: [n, target],
          bond: [[n, target, 1]],
          pop: { [n]: 1 },
          data: { mini: mini.id },
        }));
      }
    }
  } else if (interaction === 'pairs') {
    for (const [a, b] of pairs) {
      if (!b) continue;
      const both = (scores[a] + scores[b]) / 2;
      if (both >= LANDED + 1) {
        events.push(evt('did-her-proud', {
          players: [a, b], bond: [[a, b, 1.5]], pop: { [a]: 1, [b]: 1 },
          data: { mini: mini.id },
        }));
      } else if (both < LANDED - 1) {
        events.push(evt('did-her-dirty', {
          players: [a, b], bond: [[a, b, -1.5]], pop: { [a]: -1, [b]: -1 },
          data: { mini: mini.id },
        }));
      }
    }
  }

  const order = Object.entries(scores).sort((x, y) => y[1] - x[1]);
  return {
    winner: order.length ? order[0][0] : null,
    scores,
    detail,
    turnOrder,
    pairs,
    events,
    interaction,
  };
}

/** Write what the mini did. Refuses a cosmetic event, like everything else. */
export function applyMiniEvents(events, ctx) {
  let applied = 0;
  for (const e of events || []) {
    const changes = (e.bond?.length || 0) + Object.keys(e.pop || {}).length
      + Object.keys(e.state || {}).length;
    if (!changes) {
      throw new Error(`drag-race: mini event "${e.type}" has no consequence`);
    }
    for (const [a, b, d] of e.bond || []) ctx.addBond(a, b, d);
    for (const [n, d] of Object.entries(e.pop || {})) ctx.popDelta(n, d);
    applied += changes;
  }
  return applied;
}
