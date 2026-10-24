// ══════════════════════════════════════════════════════════════════════
// bb/machine-premiere.js — premiere night of the Machine Summer
// ══════════════════════════════════════════════════════════════════════
//
// BB26, as the wiki tells it (user, 2026-10-24: the themes "have to be
// perfect 1:1 of the real show"):
//
//   "The houseguests were told that they have the power to vote in a 17th
//    houseguest during the two-night premiere. However, it was revealed that
//    this was simply a morality test organized by AINSLEY. The houseguests who
//    voted yes to letting her enter would be given the chance to compete for an
//    Upgrade Power, while those who voted no would have to compete to try and
//    avoid a Downgrade Punishment. Each group of eight would compete in four
//    separate competitions."
//
//   The competitions table: Upgrade (America's Veto) "Color Calibration",
//   Downgrade "Fear Facer", Upgrade (Deepfake HOH) "AI Chip Install",
//   Downgrade "Facial Recognition". One upgraded and one downgraded per group.
//
//   "The losers of the Downgrade Competition were demoted from houseguests to
//    mascots, meaning that they were ineligible to compete in the HOH or POV
//    competitions for the week, nor were they eligible to cast an eviction
//    vote. However, they were still eligible to be nominated and evicted."
//
// The "seventeenth houseguest" got 6 votes to come in and 10 to stay out. A
// group with nobody on one side of the vote simply has no competition on that
// side: nobody is upgraded, or nobody is downgraded, and the screen says so.
import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { addBond } from '../bonds.js';
import { stableRng } from './knowledge.js';

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const st = (n, k) => { try { return Number(pStats(n)?.[k]) || 5; } catch { return 5; } };
const archOf = n => (players || []).find(p => p.name === n)?.archetype || null;
const pop = (n, d) => { gs.popularity ||= {}; gs.popularity[n] = Math.round(((gs.popularity[n] || 0) + d) * 100) / 100; };

/** The four night-one competitions, in the order the two groups played them. */
export const MACHINE_PREMIERE_COMPS = Object.freeze([
  { id: 'color-calibration', side: 'upgrade', power: 'americas-veto', name: 'Color Calibration',
    stats: { mental: 0.5, intuition: 0.3, temperament: 0.2 },
    desc: 'Each player stands at a pad of coloured panels while AINSLEY flashes a sequence of colours on the screen. They have to press the sequence back exactly, and every round AINSLEY adds one more colour to the end of it. One wrong panel and that player is out. The last one still matching the sequence wins the Upgrade.' },
  { id: 'fear-facer', side: 'downgrade', name: 'Fear Facer',
    stats: { social: 0.45, intuition: 0.35, mental: 0.2 },
    desc: 'Before the competition every houseguest was asked what scares them most. AINSLEY reads the fears back one at a time, and each player has to name the houseguest who said it. A right answer scores a point and a wrong one scores nothing. Whoever has the fewest points when the fears run out is downgraded.' },
  { id: 'ai-chip-install', side: 'upgrade', power: 'deepfake-hoh', name: 'AI Chip Install',
    stats: { physical: 0.4, endurance: 0.25, mental: 0.35 },
    desc: 'Each player has a giant circuit board and a pile of oversized AI chips at the far end of the yard. They carry the chips across one at a time and slot each into the socket it fits, and a chip forced into the wrong socket has to be pulled out and carried back. The first player to fill their whole board wins the Upgrade.' },
  { id: 'facial-recognition', side: 'downgrade', name: 'Facial Recognition',
    stats: { mental: 0.4, intuition: 0.4, social: 0.2 },
    desc: 'AINSLEY shows a face on the screen that is two houseguests morphed into one. Each player has to name both of the people inside it, and only a pair that is fully right scores. The faces get harder to read as they go. Whoever has the lowest score at the end is downgraded.' },
]);

const scoreFor = (n, mix, r) => Object.entries(mix).reduce((s, [k, w]) => s + st(n, k) * w, 0) + r() * 3.5;

/**
 * Night one. Returns { act, powers: [{ holder, powerId }], mascots } or null.
 * The caller grants the powers and seats the mascots (week.js), because the
 * power shelf and the HOH yard are its to touch.
 */
export function runMachinePremiere(week, house) {
  const everyone = (house || []).filter(Boolean);
  if (everyone.length < 8) return null;
  const r = stableRng('machine-premiere', gs?.bb?.seasonSalt || 0, week.num);

  // Two groups of eight, as they moved in over the two nights.
  const half = Math.ceil(everyone.length / 2);
  const groups = [everyone.slice(0, half), everyone.slice(half)];

  // ── the seventeenth houseguest ──
  // A stranger who wants in, and a vote nobody was told was a test. Saying yes
  // is generosity; saying no is caution — and a houseguest who has already
  // started counting votes does not want a seventeenth one.
  const yesChance = n => Math.min(0.85, Math.max(0.08,
    0.30 + st(n, 'social') * 0.025 + st(n, 'loyalty') * 0.015 - st(n, 'strategic') * 0.03
      + (NICE.has(archOf(n)) ? 0.12 : 0) - (['villain', 'mastermind', 'schemer'].includes(archOf(n)) ? 0.08 : 0)));
  const votes = Object.fromEntries(everyone.map(n => [n, r() < yesChance(n) ? 'yes' : 'no']));
  const yes = everyone.filter(n => votes[n] === 'yes');

  const upgrades = [];
  const downgrades = [];
  groups.forEach((g, gi) => {
    const up = MACHINE_PREMIERE_COMPS.filter(c => c.side === 'upgrade')[gi];
    const down = MACHINE_PREMIERE_COMPS.filter(c => c.side === 'downgrade')[gi];
    const yesSide = g.filter(n => votes[n] === 'yes');
    const noSide = g.filter(n => votes[n] === 'no');
    if (yesSide.length) {
      const scores = Object.fromEntries(yesSide.map(n => [n, Math.round(scoreFor(n, up.stats, r) * 10) / 10]));
      const order = yesSide.slice().sort((a, b) => scores[b] - scores[a]);
      upgrades.push({ group: gi + 1, comp: up.id, name: up.name, desc: up.desc, power: up.power, players: yesSide, scores, order, winner: order[0], unopposed: yesSide.length === 1 });
      pop(order[0], 0.6);
    } else {
      upgrades.push({ group: gi + 1, comp: up.id, name: up.name, desc: up.desc, power: up.power, players: [], winner: null });
    }
    if (noSide.length > 1) {
      const scores = Object.fromEntries(noSide.map(n => [n, Math.round(scoreFor(n, down.stats, r) * 10) / 10]));
      const order = noSide.slice().sort((a, b) => scores[b] - scores[a]);
      downgrades.push({ group: gi + 1, comp: down.id, name: down.name, desc: down.desc, players: noSide, scores, order, loser: order[order.length - 1] });
      pop(order[order.length - 1], 0.8);   // the country loves a mascot
    } else {
      // One houseguest cannot lose a competition against nobody.
      downgrades.push({ group: gi + 1, comp: down.id, name: down.name, desc: down.desc, players: noSide, loser: null });
    }
  });
  const mascots = downgrades.map(d => d.loser).filter(Boolean);
  // A mascot spends the week in costume cheering for the people who beat them,
  // and the house is fond of somebody who does that with good grace.
  for (const m of mascots) {
    for (const n of everyone) if (n !== m && r() < 0.35) { try { addBond(n, m, 0.4); } catch { /* */ } }
  }

  const act = {
    type: 'machine-premiere', week: week.num,
    groups, votes, yes: yes.length, no: everyone.length - yes.length,
    upgrades, downgrades, mascots,
    beats: [],
  };
  return {
    act,
    powers: upgrades.filter(u => u.winner).map(u => ({ holder: u.winner, powerId: u.power })),
    mascots,
  };
}
