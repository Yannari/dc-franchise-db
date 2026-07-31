// ══════════════════════════════════════════════════════════════════════
// departures.js — leaving without being voted out
// ══════════════════════════════════════════════════════════════════════
//
// People walk. Others get removed for putting hands on somebody. Both shows
// have this and neither had it working: `seasonConfig.qem` — "Quits,
// Expulsions & Medical Evacuations" — was read by nothing at all, and the
// medevacs that did happen came from the survival system rather than from that
// switch. The house had nothing either until this was written for it.
//
// Neither outcome is a dice roll dressed as drama. A walkout is built from the
// pressure actually on that player — temperament, nerve, going hungry, facing
// elimination, and how long they have been in there. An expulsion needs a real
// rivalry and a temper to point at it, so a hothead surrounded by friends is
// never removed.
//
// Proportional throughout, per the house rules of this codebase: no
// thresholds, only weights. Returns null on the overwhelming majority of
// rounds, which is the entire point of it.

import { players } from './core.js';
import { pStats } from './players.js';
import { getBond } from './bonds.js';

/** How often this can happen at all. */
const RATE = { rare: 0.015, occasional: 0.04, often: 0.075 };

/**
 * Roll for a departure.
 *
 * @param {string[]} pool     everybody still playing
 * @param {object}   opts
 *   mode      'off' | 'rare' | 'occasional' | 'often'
 *   round     how far into the season (weeks or episodes — same pressure)
 *   atRisk    people facing elimination tonight: nominees, or the losing tribe
 *   deprived  people going without: have-nots, or a tribe with no food
 *   rng       injectable for tests
 * @returns {{name, kind, other?}|null}
 */
export function rollDeparture(pool = [], opts = {}) {
  const mode = opts.mode || 'off';
  const rng = opts.rng || Math.random;
  const house = (pool || []).filter(Boolean);
  // Below five there is no season left to disrupt — an extra body out here
  // breaks the endgame rather than complicating it.
  if (!RATE[mode] || house.length <= 4) return null;

  const base = RATE[mode];
  const atRisk = opts.atRisk || [];
  const deprived = opts.deprived || [];
  const round = Number(opts.round) || 1;

  const read = house.map(name => {
    const s = pStats(name);
    const arch = (players.find(p => p.name === name) || {}).archetype || '';
    // Worn down rather than beaten.
    const walk = ((10 - s.temperament) / 10) * 0.55
      + ((10 - s.boldness) / 10) * 0.25
      + ((10 - s.loyalty) / 10) * 0.10
      + (deprived.includes(name) ? 0.30 : 0)
      + (atRisk.includes(name) ? 0.35 : 0)
      + Math.min(0.35, round * 0.03);
    // A temper with somebody to point it at.
    const worst = house.filter(n => n !== name)
      .reduce((lo, n) => Math.min(lo, getBond(name, n)), 0);
    const volatile = ['hothead', 'villain', 'chaos-agent'].includes(arch) ? 1.6 : 1;
    const expel = Math.max(0, -worst / 10) * ((10 - s.temperament) / 10) * volatile * 0.9;
    return {
      name, walk, expel,
      worstWith: house.filter(n => n !== name)
        .sort((a, b) => getBond(name, a) - getBond(name, b))[0] || null,
    };
  });

  const walker = [...read].sort((a, b) => b.walk - a.walk)[0];
  const brawler = [...read].sort((a, b) => b.expel - a.expel)[0];
  const walkChance = base * (0.4 + walker.walk);
  // No floor term here on purpose. An earlier version read
  //   base * 0.7 * (0.2 + expel)
  // which left a standing chance of expelling somebody with no enemy at all —
  // the exact opposite of the rule this is supposed to encode. Strictly
  // proportional: no rivalry, no removal.
  const expelChance = base * 1.4 * brawler.expel;

  const roll = rng();
  if (roll < walkChance) return { name: walker.name, kind: 'walkout' };
  if (roll < walkChance + expelChance && brawler.worstWith) {
    return { name: brawler.name, kind: 'expulsion', other: brawler.worstWith };
  }
  return null;
}

/** The line the show puts on screen when somebody goes this way. */
export function departureText(dep) {
  if (!dep) return '';
  return dep.kind === 'expulsion'
    ? `${dep.name} puts hands on ${dep.other} and is removed from the game. There is no vote tonight.`
    : `${dep.name} has had enough and walks. There is no vote tonight.`;
}
