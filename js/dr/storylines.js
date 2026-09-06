// ══════════════════════════════════════════════════════════════════════
// dr/storylines.js — the season's arcs
// ══════════════════════════════════════════════════════════════════════
//
// An arc WANTS things, and what it wants reaches the week through exactly one
// door: `storylineNeed` feeds `hostBend`, which is bounded. Nothing in this
// file can send anybody home or hand anybody a win. It can lean, and the
// screen shows the lean beside the panel's own ranking — which is the entire
// reason "robbed" can exist as a thing the audience sees rather than a thing
// the engine asserts.
//
// The catalogue of fifteen families lives in js/dr/arcs.js; this file acts on
// it. Agendas are cast at the start, at most one per queen. Labels layer freely
// on top, because a real edit calls the same person a front-runner AND a
// fashion queen.
//
// Three families are EARNED and can never be cast: Performance is somebody who
// has actually survived two lip syncs, Robbed is somebody the host has actually
// bent down twice, and Shock is an elimination nobody saw coming. A season that
// hands those out at episode one decided its story before anybody performed.
import { craftMean, dragOf } from './queen.js';
import { ARC_FAMILIES, FAMILIES, isAgenda, pickVariant } from './arcs.js';

// The engine's arc ids ARE the family ids: js/dr/arcs.js is the catalogue and
// this file is what acts on it. Kept as an export because screens and tests
// read it, and because a flat list is the thing a guard wants to check against.
export const ARCS = FAMILIES;

/** At most one agenda per queen: two would double-count her in the bend. */
export function agendaHolders(storylines) {
  const held = new Set();
  for (const s of storylines) if (s.alive && isAgenda(s.arc)) for (const n of s.players) held.add(n);
  return held;
}

const VILLAINOUS = new Set(['villain', 'mastermind', 'schemer']);
/**
 * What being robbed actually is.
 *
 * NOT a count of rank places, which is what this used to be and which was
 * unreachable: the bend is deliberately gentle — `maxMove * BEND_STRENGTH` is
 * 1.0 and the bend itself is capped at 1.0 — so the host displaces a queen by
 * at most ONE place, ever. Measured over 3,249 placements: 90.9% did not move,
 * 4.6% moved up one, 4.6% moved down one, and nobody moved two. A threshold of
 * two places could never fire, and `robbed` was a dead arc for that reason.
 *
 * It was also the wrong measure. Being robbed is not "the host moved me two
 * slots" — it is "the panel loved me and he did not give it to me", which is a
 * fact about the CALL rather than about the ranking. So: topped the panel and
 * did not win, or the panel had her in its top three and she got no call at
 * all. Both are things an audience would shout at the screen about, and both
 * are visible on the track record chart the community actually reads.
 */
const SNUB_TOP = 3;
/** Surviving this many lip syncs makes you the one they send in to fight. */
const FIGHTS = 2;

/** The facts a variant test can read about a queen, as things stand now. */
function factsFor(name, cast, state, extra = {}) {
  const player = (cast || []).find(p => p && p.name === name) || null;
  const rec = state.record?.[name] || [];
  return {
    player,
    star: state.star?.[name] ?? 5,
    wins: rec.filter(r => r === 'WIN').length,
    highs: rec.filter(r => r === 'HIGH').length,
    safes: rec.filter(r => r === 'SAFE').length,
    fights: (state.lipsyncRecord?.[name] || []).filter(r => r === 'W').length,
    pop: state.popularity?.[name] ?? 0,
    finalist: (state.living || []).includes(name),
    ...extra,
  };
}

/**
 * Whether a label family applies to this queen at all.
 *
 * Labels are descriptions, so each has a threshold. Not everybody is a fashion
 * queen, and calling everybody one would make the word useless — the point of
 * a label is that it distinguishes her from the room.
 */
function labelFor(family, p, state) {
  const d = dragOf(p);
  const stat = k => {
    const n = Number(p?.stats?.[k]);
    return Number.isFinite(n) ? n : 5;
  };
  const facts = factsFor(p.name, [p], state);
  switch (family) {
    case 'fashion':
      // Either she is genuinely a look queen, or the aesthetic IS her act —
      // and in that case she still has to be able to walk.
      if (d.runway >= 8 || (['fashion', 'club-kid', 'art'].includes(d.style) && d.runway >= 6)) {
        return pickVariant('fashion', facts);
      }
      return null;
    case 'narrator':
      // The one the confessionals go to. Measured at three ORs this fired for
      // two thirds of a thirteen-queen cast, which makes the word useless: a
      // label has to distinguish her from the room. Now it wants a genuinely
      // outsized personality — a real comic, or somebody unusually loud AND
      // unguarded.
      if (d.comedy >= 9 || (stat('social') >= 8 && stat('temperament') <= 4)) {
        return pickVariant('narrator', facts);
      }
      return null;
    case 'pageant':
      if (d.style === 'pageant' || (d.runway >= 7 && d.design >= 7)) {
        return pickVariant('pageant', facts);
      }
      return null;
    case 'representation':
      // A story off the stage, which is loyalty to where she came from rather
      // than any craft stat — and somebody willing to talk about it.
      if (stat('loyalty') >= 8 && stat('social') >= 5) {
        return pickVariant('representation', facts);
      }
      return null;
    default:
      return null;
  }
}

/** Name the flavour of an arc from what is known right now. */
function resolveVariant(s, cast, state, extra = {}) {
  const v = pickVariant(s.arc, factsFor(s.players[0], cast, state, {
    beats: s.beats, pairBond: s.pairBond ?? 0, ...extra,
  }));
  if (v) {
    s.variantId = v.id;
    s.variantName = v.name;
  }
  return s;
}

export function assignStorylines({ cast, state, bond, rng }) {
  const names = cast.map(p => p.name);
  const star = n => state.star?.[n] ?? 5;
  const out = [];
  let seq = 0;
  // ONE SOLO AGENDA PER QUEEN. Two of them on the same person would count her
  // twice in the bend, which is the difference between a lean and a shove.
  // Cast order is priority order, so the front-runner is decided before the
  // villain and a queen can only be one of them.
  //
  // PAIR ARCS ARE EXEMPT, and that is not a loophole. A relationship arc is
  // about the pair rather than the person, and the villain is usually half the
  // season's rivalry — the user's own taxonomy files them under one family. So
  // blocking a rivalry because one of them is already the villain would throw
  // away the most natural story in the room. The pair arc asks for the least of
  // any agenda (0.15 against the front-runner's 0.5) and every want is clamped,
  // so the villain-in-a-rivalry is slightly better protected and nothing more.
  const spoken = new Set();
  const add = (arc, players, extra = {}) => {
    const solo = isAgenda(arc) && players.length === 1;
    if (solo && players.some(n => spoken.has(n))) return null;
    if (solo) for (const n of players) spoken.add(n);
    const s2 = {
      id: `${arc}-${++seq}`, arc, players, since: 1, beats: [], alive: true,
      variantId: null, variantName: null, ...extra,
    };
    out.push(s2);
    return s2;
  };

  // Presence, not craft: the queen the edit would follow is the one who is
  // both good and watchable, which is what star power is for.
  const byPresence = [...cast].sort((a, b) =>
    (craftMean(b) * star(b.name)) - (craftMean(a) * star(a.name)));
  add('frontrunner', [byPresence[0].name]);

  // Low star, middling craft: somebody the room is not watching yet.
  const under = [...cast].filter(p => p.name !== byPresence[0].name)
    .sort((a, b) => (star(a.name) - craftMean(a) * 0.3) - (star(b.name) - craftMean(b) * 0.3))[0];
  if (under) add('underdog', [under.name]);

  const villain = [...cast].filter(p => VILLAINOUS.has(p.archetype))
    .sort((a, b) => (Number(b.stats?.boldness) || 5) - (Number(a.stats?.boldness) || 5))[0];
  if (villain) add('villain', [villain.name]);

  // The worst pair and the best pair in the room. The rivalry tie-breaks on
  // star power, because two queens nobody is watching is not a rivalry.
  let worst = null;
  let best = null;
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i];
      const b = names[j];
      const v = bond(a, b);
      const heat = star(a) + star(b);
      if (v <= -5 && (!worst || v < worst.v || (v === worst.v && heat > worst.heat))) {
        worst = { a, b, v, heat };
      }
      if (v >= 5 && (!best || v > best.v)) best = { a, b, v };
    }
  }
  // Both pairs are the RELATIONSHIP family; the variant is what kind. A
  // rivalry and a friendship want opposite things from the same machinery, so
  // the variant carries the difference rather than two near-identical arcs.
  if (worst) add('relationship', [worst.a, worst.b].sort(), { pairBond: worst.v });
  if (best) add('relationship', [best.a, best.b].sort(), { pairBond: best.v });

  // Labels layer on top, because a real edit calls the same queen a
  // front-runner AND a fashion queen. Only agendas are exclusive.
  for (const p of cast) {
    for (const family of ['fashion', 'narrator', 'pageant', 'representation']) {
      const fam = labelFor(family, p, state);
      if (fam) add(family, [p.name], { variantId: fam.id, variantName: fam.name });
    }
  }

  // Every arc gets its flavour named now; recordBeat re-reads it as the season
  // gives it more to go on.
  for (const s of out) resolveVariant(s, cast, state);

  void rng;
  return out;
}

/** What each arc wants this week, as a bend input in [-1, 1]. */
export function storylineNeed(storylines, { living, episode, totalEpisodes, state }) {
  const need = Object.fromEntries(living.map(n => [n, 0]));
  const phase = totalEpisodes > 1 ? (episode - 1) / (totalEpisodes - 1) : 0;
  const bump = (n, v) => {
    if (n in need) need[n] = Math.max(-1, Math.min(1, need[n] + v));
  };

  for (const s of storylines) {
    if (!s.alive) continue;
    const [a, b] = s.players;
    switch (s.arc) {
      case 'frontrunner':
        // Up early, then one stumble in the middle third — and only one, so a
        // frontrunner who has already wobbled is not shoved again.
        if (phase < 0.35) bump(a, 0.5);
        else if (phase < 0.65 && !s.beats.some(x => x.kind === 'stumble')) bump(a, -0.35);
        break;
      case 'underdog': {
        // A win around 60% of the way in. The pressure falls away once she has
        // one, because the arc was never "keep winning" — it was "arrive".
        const won = (state.record?.[a] || []).includes('WIN');
        if (!won) bump(a, Math.max(0, 1 - Math.abs(phase - 0.6) * 3) * 0.7);
        break;
      }
      case 'villain':
        // Kept in the room while she is useful, and not protected after that.
        if (phase < 0.7) bump(a, 0.25);
        else bump(a, -0.2);
        break;
      case 'performance':
        // The one they send in to fight. The bend gives her the benefit of a
        // toss-up, because the audience expects her to survive one.
        bump(a, 0.4);
        break;
      case 'relationship':
        if (s.variantId === 'rivalry') {
          // Both in the same conversation: leaning both slightly up makes a
          // shared call likelier than one high and the other gone.
          bump(a, 0.15);
          bump(b, 0.15);
        } else if (phase < 0.75) {
          // Friends kept out of a lip sync against each other, until late —
          // when the show stops protecting anybody from that.
          bump(a, 0.1);
          bump(b, 0.1);
        }
        break;
      case 'redemption':
        bump(a, 0.3);
        break;
      default:
        // EVERY LABEL LANDS HERE AND ASKS FOR NOTHING. Robbed, fashion,
        // narrator, pageant, filler, weakness, representation, hero, shock:
        // descriptions of what she is, never requests. Fifteen families all
        // lobbying the bend would be fifteen thumbs on the scale, and the
        // season would stop being a contest.
        break;
    }
  }
  return need;
}

export function recordBeat(storylines, { episode, row, state, cast = null }) {
  const call = row.dr?.call || { win: [], high: [], low: [], bottom: [] };
  const bend = row.dr?.bend || [];
  const events = row.dr?.events || [];
  // Who gave something away this week. `hero`'s congeniality variant reads it,
  // and nothing else was counting it.
  const helps = (state._drHelps ||= {});
  for (const e of events) {
    if (e.type === 'help' && e.players?.[0]) helps[e.players[0]] = (helps[e.players[0]] || 0) + 1;
  }
  const out = storylines.map(s => ({ ...s, beats: [...s.beats], players: [...s.players] }));
  const find = arc => out.find(s => s.arc === arc);
  const beat = (s, kind, data = {}) => s.beats.push({ episode, kind, ...data });
  const inCall = n => [...(call.win || []), ...(call.high || []),
    ...(call.low || []), ...(call.bottom || [])].includes(n);

  for (const s of out) {
    const [a, b] = s.players;
    if (s.arc === 'frontrunner') {
      if ((call.win || []).includes(a)) beat(s, 'win');
      if ((call.bottom || []).includes(a)) beat(s, 'stumble');
    }
    if (s.arc === 'underdog' && (call.win || []).includes(a)) beat(s, 'breakthrough');
    if (s.arc === 'villain') {
      // Redemption has to cost her something and be seen: she helped somebody
      // AND the panel put her up. Either alone is just a good week.
      const helped = events.some(e => e.type === 'help' && e.players?.[0] === a);
      const up = (call.win || []).includes(a) || (call.high || []).includes(a);
      if (helped && up) {
        s.flipped = 'redeemed';
        beat(s, 'redemption');
      } else {
        const bad = events.find(e =>
          ['sabotage', 'stole-a-bit', 'spotlight-hog', 'dump'].includes(e.type)
          && e.players?.[0] === a);
        if (bad) beat(s, 'villainy', { event: bad.type });
      }
    }
    if (s.arc === 'rivalry' && a && b && inCall(a) && inCall(b)) beat(s, 'collision');
    if (s.arc === 'sisters' && (call.bottom || []).includes(a) && (call.bottom || []).includes(b)) {
      beat(s, 'sisters-in-the-bottom');
    }
    // An arc whose people are gone is over. The beats stay: a dead arc is
    // still what happened, and the screens read it.
    if (s.players.some(n => (state.out || []).includes(n))) s.alive = false;
  }

  // Earned, never assigned: two lip syncs survived.
  if (!find('performance')) {
    const fighter = Object.entries(state.lipsyncRecord || {})
      .find(([, r]) => (r || []).filter(x => x === 'W').length >= FIGHTS);
    if (fighter) {
      out.push({
        id: 'performance-1', arc: 'performance', players: [fighter[0]], since: episode,
        beats: [{ episode, kind: 'earned' }], alive: true,
        variantId: null, variantName: null,
      });
    }
  }

  // Earned: snubbed twice. The count lives on `state` rather than here because
  // it has to survive a save.
  const downs = (state._drBendDowns ||= {});
  const won = new Set(call.win || []);
  const called = new Set([...(call.win || []), ...(call.high || []),
    ...(call.low || []), ...(call.bottom || [])]);
  for (const x of bend) {
    const toppedAndLost = x.panelRank === 1 && !won.has(x.name);
    const lovedAndIgnored = x.panelRank <= SNUB_TOP && !called.has(x.name);
    if (toppedAndLost || lovedAndIgnored) downs[x.name] = (downs[x.name] || 0) + 1;
  }
  if (!find('robbed')) {
    const robbed = Object.entries(downs).find(([, c]) => c >= 2);
    if (robbed) {
      out.push({
        id: 'robbed-1', arc: 'robbed', players: [robbed[0]], since: episode,
        beats: [{ episode, kind: 'earned' }], alive: true,
        variantId: null, variantName: null,
      });
    }
  }

  // ── EARNED LABELS ─────────────────────────────────────────────────
  //
  // The split that matters: fashion, pageant, narrator and representation are
  // who she IS and are cast at the start. Hero, weakness and filler are what
  // HAPPENED and cannot be known then — a queen is not a filler queen until
  // the season has failed to give her anything to do.
  const seasonSoFar = Object.keys(state.record || {});
  const already = f => out.some(s2 => s2.arc === f && s2.players.includes(f._n));
  for (const n of seasonSoFar) {
    if ((state.out || []).includes(n) && !(state.living || []).includes(n)) {
      // She has gone; her labels are whatever she earned before leaving.
    }
    const rec = state.record[n] || [];
    if (rec.length < 3) continue;
    const has = f => out.some(s2 => s2.arc === f && s2.players.includes(n));
    const helpCount = helps[n] || 0;
    const pop = state.popularity?.[n] ?? 0;
    const safes = rec.filter(r => r === 'SAFE').length;
    const lows = rec.filter(r => r === 'LOW' || r === 'BTM').length;

    // The room's favourite: she gave more than she took.
    if (!has('hero') && (helpCount >= 2 || pop >= 8)) {
      out.push({
        id: `hero-${n}`, arc: 'hero', players: [n], since: episode,
        beats: [{ episode, kind: 'earned' }], alive: true, variantId: null, variantName: null,
      });
    }
    // A season of being in trouble without ever being sent home.
    if (!has('weakness') && lows >= 3) {
      out.push({
        id: `weakness-${n}`, arc: 'weakness', players: [n], since: episode,
        beats: [{ episode, kind: 'earned' }], alive: true, variantId: null, variantName: null,
      });
    }
    // Nothing has ever happened to her. This is the hardest edit to write and
    // the most common one on television.
    if (!has('filler') && safes >= 4 && rec.filter(r => r === 'WIN' || r === 'HIGH').length === 0) {
      out.push({
        id: `filler-${n}`, arc: 'filler', players: [n], since: episode,
        beats: [{ episode, kind: 'earned' }], alive: true, variantId: null, variantName: null,
      });
    }
  }
  void already;

  // Re-read every flavour. A front-runner who has now won three times is a
  // Challenge Beast and was not one in episode two: the variant is a reading of
  // the season so far, so it is taken again every week rather than stamped once.
  //
  // THE ROSTER HAS TO BE THE REAL PLAYERS. Rebuilding it from the record's keys
  // gives objects with a name and nothing else, so `dragOf` returns fives for
  // everybody and every style test silently fails — measured, that collapsed
  // `fashion` to look-queen 4.55 times out of 4.55 and made ten variants
  // unreachable. A caller that passes no cast keeps the old flavour rather than
  // overwriting it with one read off a blank queen.
  const roster = cast || state.cast || null;
  if (roster) {
    // Facts a variant test needs that only this moment knows. `phase` is how
    // far through the season we are — a Winner's Edit is not a thing you can
    // be in episode two, by definition. `hasRival` is whether she is actually
    // in the season's rivalry, which is what separates a Rivalry Arc villain
    // from a plain one.
    const phase = state._drPhase ?? 0;
    const inRivalry = new Set(out
      .filter(s2 => s2.arc === 'relationship' && s2.variantId === 'rivalry')
      .flatMap(s2 => s2.players));
    for (const s2 of out) {
      resolveVariant(s2, roster, state, {
        phase, hasRival: inRivalry.has(s2.players[0]),
      });
    }
  }

  return out;
}

export function arcSummary(storylines) {
  return storylines.map(s => ({
    arc: s.arc, players: [...s.players], beats: s.beats.length,
    alive: !!s.alive, flipped: s.flipped || null,
  }));
}
