// ══════════════════════════════════════════════════════════════════════
// dr/coldopen.js — the room, minutes after the elimination
// ══════════════════════════════════════════════════════════════════════
//
// The cold open used to be ONE event drawn from a pool, chosen off a single
// fact: somebody left. So a night with a challenge, a winner, a bottom, a
// song and an argument in it produced a card about an empty chair, and the
// episode that had just happened was never discussed by the people it
// happened to.
//
// THE CLOCK: this is minutes after, still in drag — not the next day. See
// tests/dr-cold-open-clock.test.js, which now reads these pools too.
//
// This builds the scene the format actually runs: the room comes back in,
// the lipstick message is read off the mirror OUT LOUD, the winner is
// congratulated, the queens who were in the bottom say how they are — and
// they are not all the same about it — a queen who was merely safe says what
// that costs, and whatever did not finish last night finishes here.
//
// ── IT IS WRITTEN FROM LAST NIGHT, NOT FROM A ROLL ────────────────────
//
// `state.lastWeek` is left by the week that just ran (js/dr/week.js): the
// challenge, the winner, the bottom, who sang, who went home. Every beat
// below is selected by those facts, so the morning cannot discuss a night
// that did not happen — the failure this show has hit before, where the
// cold open's own pool said "morning" and "coffee" over a room that had not
// been to bed.
//
// ── AND IT HAS CONSEQUENCES, LIKE EVERY OTHER SCENE ──────────────────
//
// Congratulating the winner moves bonds. Airing out last night's argument
// moves bonds. Being told, in lipstick, on a mirror, in front of everybody,
// that the queen who left had something to say about you moves bonds. A cold
// open that only produced prose would be the cosmetic-event bug this repo
// refuses everywhere else.
import { MIRROR, COLD_BEATS } from './data/cold-open-beats.js';

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 5);

/** One line, names filled, without replacement while the pool lasts. */
export function coldLine(pool, vars = {}, rng = Math.random, used = null) {
  const list = Array.isArray(pool) ? pool : [];
  if (!list.length) return '';
  const fresh = Array.isArray(used) ? list.filter(l => !used.includes(l)) : list;
  const from = fresh.length ? fresh : list;
  if (from === list && Array.isArray(used)) {
    for (const l of list) {
      const at = used.indexOf(l);
      if (at >= 0) used.splice(at, 1);
    }
  }
  const line = from[Math.floor(rng() * from.length) % from.length];
  if (Array.isArray(used)) used.push(line);
  return String(line).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

/**
 * What she wrote on the mirror, and who she wrote it at.
 *
 * The KIND comes from how she left and who she left behind — a queen with a
 * friend in that room blesses her, a queen who was ended by somebody still
 * standing there has something else to say — and the aim is a real name, so
 * the room has somebody to look at when it is read.
 */
export function mirrorMessage({
  gone, living = [], bond = () => 0, players = {}, record = {}, rng = Math.random, endedBy = null,
} = {}) {
  if (!gone) return null;
  const her = players[gone] || {};
  const temperament = num(her.stats?.temperament);
  const boldness = num(her.stats?.boldness);
  const warmth = living.map(n => ({ n, b: Number(bond(gone, n)) || 0 }))
    .sort((x, y) => y.b - x.b);
  const friend = warmth[0] && warmth[0].b >= 3 ? warmth[0].n : null;
  const enemy = warmth[warmth.length - 1] && warmth[warmth.length - 1].b <= -3
    ? warmth[warmth.length - 1].n : null;
  /* THE FRONT-RUNNER, for a blessing with nothing personal in it: the queen
     with the most wins is who a departing queen backs when she has no
     particular friend to back. */
  const winsOf = n => (record[n] || []).filter(r => r === 'WIN').length;
  const frontRunner = [...living].sort((a, b) => winsOf(b) - winsOf(a))[0] || null;

  /* WHO SHE IS AIMING AT, and then what she is doing to them. A queen ended
     by a name she can see has the option of saying so; a queen with a friend
     in there mostly does not take it. */
  const options = [];
  if (friend) options.push({ kind: 'blessing', at: friend, w: 2.2 });
  if (friend) options.push({ kind: 'warm', at: friend, w: 2.4 });
  if (!friend) options.push({ kind: 'warm', at: frontRunner, w: 1.8 });
  if (frontRunner) options.push({ kind: 'blessing', at: frontRunner, w: 1.2 });
  if (enemy) options.push({ kind: 'shade', at: enemy, w: 1.4 + (10 - temperament) * 0.18 });
  if (endedBy && endedBy !== friend) {
    options.push({ kind: 'shade', at: endedBy, w: 1.1 + (10 - temperament) * 0.22 });
  }
  options.push({ kind: 'joke', at: friend || frontRunner, w: 0.9 + boldness * 0.13 });
  options.push({ kind: 'defiant', at: null, w: 0.8 + boldness * 0.11 });

  const total = options.reduce((t, o) => t + o.w, 0);
  let roll = rng() * total;
  let chosen = options[options.length - 1];
  for (const o of options) { roll -= o.w; if (roll <= 0) { chosen = o; break; } }

  /* THE RAW LINE FIRST, because whether it is AIMED at anybody is a fact
     about the line and not about the kind: half the warm ones name nobody,
     and reporting an aim the mirror does not carry would have the room react
     to a name that is not on the glass. */
  const raw = pick(rng, MIRROR[chosen.kind] || MIRROR.warm);
  const aimed = /\{b\}/.test(raw) ? chosen.at : null;
  const text = String(raw).replace(/\{(\w+)\}/g, (m, k) => (
    { a: gone, b: aimed || '' }[k] ?? m));
  return {
    text,
    kind: chosen.kind,
    at: aimed,
    // Whether the room will read it as pointed rather than fond.
    sharp: chosen.kind === 'shade',
  };
}

/**
 * The scene, as scenes.
 *
 * Returns `{ scenes, events }` — scenes for the screen, events for the bond
 * ledger, in the shape `applyEventLike` already takes.
 */
export function coldOpen({
  last = null, living = [], players = {}, bond = () => 0, record = {}, rng = Math.random,
  used = null, gone = [],
} = {}) {
  const scenes = [];
  const events = [];
  const said = Array.isArray(used) ? used : [];
  const room = living.filter(Boolean);
  if (!room.length) return { scenes, events, mirror: null };

  const say = (kind, who, pool, vars = {}, data = {}) => {
    const text = coldLine(pool, vars, rng, said);
    if (!text) return;
    scenes.push({
      step: 'cold-open', kind: `cold:${kind}`,
      data: { players: who.filter(Boolean), morning: true, ...data },
      text,
    });
  };
  const fx = (type, who, bonds = [], pop = {}) => events.push({
    type, players: who.filter(Boolean), bond: bonds, pop, state: {}, data: {},
  });

  const L = last || {};
  const leaver = (L.gone && L.gone[0]) || gone[0] || null;
  const winner = L.winner && room.includes(L.winner) ? L.winner : null;
  /* WHO READS IT. Her closest friend still in that room, because that is who
     ends up at the mirror — and it gives the reading a reason rather than a
     random name. */
  const reader = leaver
    ? [...room].sort((a, b) => (Number(bond(leaver, b)) || 0) - (Number(bond(leaver, a)) || 0))[0]
    : room[0];

  say('arrive', [reader], COLD_BEATS.arrive, { a: reader });

  let mirror = null;
  if (leaver) {
    mirror = mirrorMessage({
      gone: leaver, living: room, bond, players, record, rng, endedBy: L.chosenBy,
    });
    say('read', [reader], COLD_BEATS.read, { a: reader });
    scenes.push({
      step: 'cold-open', kind: 'cold:mirror',
      data: { players: [reader, mirror.at].filter(Boolean), morning: true, mirror: true,
        wrote: leaver, at: mirror.at || null, kind: mirror.kind },
      text: mirror.text,
    });
    /* THE QUEEN WITH HER NAME ON THE GLASS. A warm one is worth something to
       her; a sharp one is worth something to everybody who watched her read
       it, which is the entire room. */
    if (mirror.at && room.includes(mirror.at)) {
      const tier = mirror.sharp ? 'sharp' : 'warm';
      say(`aimed-${tier}`, [mirror.at], COLD_BEATS.aimed[tier], { b: mirror.at });
      if (mirror.sharp) fx('cold:named', [mirror.at], [], { [mirror.at]: -0.2 });
      else fx('cold:blessed', [mirror.at], [], { [mirror.at]: 0.3 });
    }
  }

  if (L.maxi) say('challenge', [], COLD_BEATS.challenge, { m: L.maxi });

  /* CONDRAGULATIONS, and it is worth something: a room that makes a fuss of
     her is a room she owes a little, and she is warmer to all of it. */
  if (winner) {
    say('congrats', [winner], COLD_BEATS.congrats, { a: winner });
    const w = players[winner] || {};
    const guilty = !!leaver && (Number(bond(winner, leaver)) || 0) >= 4;
    const tier = guilty ? 'guilty'
      : num(w.stats?.boldness) >= 7 && num(w.stats?.loyalty) <= 5 ? 'hungry' : 'gracious';
    say(`winner-${tier}`, [winner], COLD_BEATS.winnerLine[tier], { a: winner });
    fx('cold:congrats', [winner],
      room.filter(n => n !== winner).slice(0, 3).map(n => [n, winner, 0.3]),
      { [winner]: 0.4 });
  }

  /* THE BOTTOM, AND THEY ARE NOT ALL THE SAME ABOUT IT. Sad, angry, fine, or
     genuinely not bothered — read off her temperament and her boldness and
     whether she had to sing for it, so the morning after a lip sync is not
     the morning after a warning. */
  const inTrouble = [...new Set([...(L.bottom || []), ...(L.low || [])])]
    .filter(n => room.includes(n));
  for (const n of inTrouble.slice(0, 2)) {
    const st = (players[n] || {}).stats || {};
    const temper = num(st.temperament);
    const bold = num(st.boldness);
    const sang = (L.sang || []).includes(n);
    const mood = temper <= 3 && bold >= 5 ? 'angry'
      : temper <= 4 ? 'sad'
        : bold >= 8 && temper >= 7 ? 'dont-care'
          : sang && temper >= 6 ? 'fine'
            : temper >= 7 ? 'fine' : 'sad';
    say(`bottom-${mood}`, [n], COLD_BEATS.bottom[mood], { a: n }, { mood });
    /* Anger is loud and it costs her with the room; the rest is hers alone.
       Nobody in this show is punished for being upset. */
    if (mood === 'angry') {
      fx('cold:angry', [n], room.filter(x => x !== n).slice(0, 2).map(x => [x, n, -0.4]),
        { [n]: 0.3 });
    } else if (mood === 'sad') {
      fx('cold:low', [n], [], { [n]: -0.1 });
    }
  }

  /* AND THE QUEEN WHO WAS FINE, WHICH IS ITS OWN PROBLEM. The show's own
     complaint, said out loud by somebody who has been safe too long. */
  const safeRun = n => {
    const r = record[n] || [];
    let c = 0;
    for (let i = r.length - 1; i >= 0 && r[i] === 'SAFE'; i -= 1) c += 1;
    return c;
  };
  const stuck = room.filter(n => n !== winner && safeRun(n) >= 2)
    .sort((a, b) => safeRun(b) - safeRun(a))[0];
  if (stuck) {
    say('safe', [stuck], COLD_BEATS.safe, { a: stuck });
    fx('cold:stuck', [stuck], [], { [stuck]: 0.2 });
  }

  /* WHATEVER DID NOT FINISH LAST NIGHT. The coldest pair still standing, and
     only when it is genuinely cold — a room that gets on does not need to
     have it out every single morning. */
  const pairs = [];
  for (let i = 0; i < room.length; i += 1) {
    for (let j = i + 1; j < room.length; j += 1) {
      const v = Number(bond(room[i], room[j])) || 0;
      if (v <= -4) pairs.push({ a: room[i], b: room[j], v });
    }
  }
  if (pairs.length) {
    const worst = pairs.sort((x, y) => x.v - y.v)[0];
    say('airing', [worst.a, worst.b], COLD_BEATS.airing, { a: worst.a, b: worst.b });
    /* It goes one of two ways and the room decides which: two queens who can
       talk come out of it better, and two who cannot come out of it worse. */
    const talk = (num(players[worst.a]?.stats?.social) + num(players[worst.b]?.stats?.social)) / 2;
    const mended = talk >= 6 && rng() < 0.5;
    fx(mended ? 'cold:mended' : 'cold:aired', [worst.a, worst.b],
      [[worst.a, worst.b, mended ? 1.2 : -0.8]], {});
  }

  /* AND THE QUEEN WHO SPENT THE LIPSTICK, on a season that has one. She has
     to walk into this room in the morning, and it is not the same room. */
  if (L.legacy && L.chosenBy && room.includes(L.chosenBy)) {
    say('holder', [L.chosenBy], COLD_BEATS.holder, { a: L.chosenBy });
  }

  return { scenes, events, mirror };
}
