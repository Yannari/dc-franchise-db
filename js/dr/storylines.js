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
// Five arcs are cast at the start. Two are EARNED and cannot be assigned: the
// fighter is somebody who has actually survived two lip syncs, and the robbed
// queen is somebody the host has actually bent down twice. A season that hands
// those out at episode one is a season that decided its story before anybody
// performed.
import { craftMean } from './queen.js';

export const ARCS = ['frontrunner', 'underdog', 'villain', 'fighter', 'rivalry', 'sisters', 'robbed'];

const VILLAINOUS = new Set(['villain', 'mastermind', 'schemer']);
/** A bend of this many places or more is one the audience would notice. */
const ROBBERY = 2;
/** Surviving this many lip syncs makes you the one they send in to fight. */
const FIGHTS = 2;

export function assignStorylines({ cast, state, bond, rng }) {
  const names = cast.map(p => p.name);
  const star = n => state.star?.[n] ?? 5;
  const out = [];
  const add = (arc, players, extra = {}) => out.push({
    id: `${arc}-1`, arc, players, since: 1, beats: [], alive: true, ...extra,
  });

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
  if (worst) add('rivalry', [worst.a, worst.b].sort());
  if (best) add('sisters', [best.a, best.b].sort());

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
      case 'fighter':
        bump(a, 0.4);
        break;
      case 'rivalry':
        // Both in the same conversation: leaning both slightly up makes a
        // shared call likelier than one of them high and the other gone.
        bump(a, 0.15);
        bump(b, 0.15);
        break;
      case 'sisters':
        // Kept out of a lip sync against each other — until late, when the
        // show stops protecting anybody from that.
        if (phase < 0.75) { bump(a, 0.1); bump(b, 0.1); }
        break;
      default:
        // 'robbed' is a label the audience applies, never an agenda. An arc
        // that lobbied for its own robbery would stop being one.
        break;
    }
  }
  return need;
}

export function recordBeat(storylines, { episode, row, state }) {
  const call = row.dr?.call || { win: [], high: [], low: [], bottom: [] };
  const bend = row.dr?.bend || [];
  const events = row.dr?.events || [];
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
  if (!find('fighter')) {
    const fighter = Object.entries(state.lipsyncRecord || {})
      .find(([, r]) => (r || []).filter(x => x === 'W').length >= FIGHTS);
    if (fighter) {
      out.push({
        id: 'fighter-1', arc: 'fighter', players: [fighter[0]], since: episode,
        beats: [{ episode, kind: 'earned' }], alive: true,
      });
    }
  }

  // Earned: bent down two places or more, twice. The count lives on `state`
  // rather than here because it has to survive a save.
  const downs = (state._drBendDowns ||= {});
  for (const x of bend) {
    if (x.finalRank - x.panelRank >= ROBBERY) downs[x.name] = (downs[x.name] || 0) + 1;
  }
  if (!find('robbed')) {
    const robbed = Object.entries(downs).find(([, c]) => c >= 2);
    if (robbed) {
      out.push({
        id: 'robbed-1', arc: 'robbed', players: [robbed[0]], since: episode,
        beats: [{ episode, kind: 'earned' }], alive: true,
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
