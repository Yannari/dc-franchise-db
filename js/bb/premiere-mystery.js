// ══════════════════════════════════════════════════════════════════════
// PREMIERE NIGHT — the Mastermind takes the host and the relic
// ══════════════════════════════════════════════════════════════════════
//
// BB27's opening, and the reason A Summer of Mystery has an author rather than
// a decor scheme. From the wiki: the Mastermind "kicked off the season by
// kidnapping Julie and stealing the HoH Relic. This forced the houseguests to
// split into two groups of eight to try to recover each of them. Each group
// would compete in a competition where the winner would receive a
// game-changing prize."
//
// Two hunts, two winners, two prizes, and they are deliberately not equal:
//
//   THE RELIC   is loud. Whoever finds it names the four houseguests allowed
//               to play for the first crown, out loud, on night one.
//   THE HOST    is quiet, and disguised as the loud one. The finder wins ten
//               thousand dollars in front of everybody and is told in private
//               that it buys them off the block once.
//
// So the house spends its first fortnight watching the wrong prize. That is the
// whole joke of the night and it costs nothing to simulate: the powers are on
// the shelf, and this only decides who gets them.
import { gs, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond } from '../bonds.js';
import { grantPower } from './powers.js';
import { stableRng } from './knowledge.js';

const stat = (name, key) => {
  try { return Number(pStats(name)?.[key]) || 5; } catch { return 5; }
};

/**
 * Split the house and run both hunts.
 *
 * Returns the act, or null when the house is too small to split in two — below
 * eight this is four people looking for two things, which is not a mystery.
 */
export function runPremiereMystery(week, house, { rng = Math.random } = {}) {
  const cast = (house || []).filter(Boolean);
  if (cast.length < 8) return null;

  const r = stableRng('premiere-mystery', gs?.bb?.seasonSalt || 0, week.num);

  // Two groups, split down the middle by the draw rather than by anybody's
  // choice — night one, nobody has an alliance to be split away from yet.
  const shuffled = [...cast];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const half = Math.ceil(shuffled.length / 2);
  const relicTeam = shuffled.slice(0, half);
  const hostTeam = shuffled.slice(half);

  // Different hunts, different people. The relic is behind a wall and takes
  // somebody who will pull it apart; the host is hidden somewhere in a building
  // nobody has been in for an hour, and takes somebody who notices things.
  const score = (name, a, b) => stat(name, a) * 0.6 + stat(name, b) * 0.4 + (r() - 0.5) * 5.5;
  const relicWinner = [...relicTeam].sort((x, y) =>
    score(y, 'physical', 'boldness') - score(x, 'physical', 'boldness'))[0];
  const hostWinner = [...hostTeam].sort((x, y) =>
    score(y, 'intuition', 'mental') - score(x, 'intuition', 'mental'))[0];

  // ── the prizes ──
  //
  // Granted through the ordinary power shelf, so everything downstream — the
  // ledger, the expiry sweep, the week engine's own hooks — treats them as the
  // powers they are rather than as premiere-night furniture.
  //
  // Visibility is the point of the pair. The relic is public because the house
  // watches the four names being read out; the buy-off is secret because the
  // house only ever saw a cheque.
  let relicGranted = null;
  let buyOffGranted = null;
  try {
    relicGranted = grantPower('hoh-gatekeeper', relicWinner,
      { week: week.num, visibility: 'public', source: 'premiere-relic' });
  } catch { relicGranted = null; }
  try {
    buyOffGranted = grantPower('buy-off', hostWinner,
      { week: week.num, visibility: 'secret', source: 'premiere-buy-off' });
  } catch { buyOffGranted = null; }

  // The money is public even though the power is not, so the house forms an
  // opinion about the wrong thing — which is exactly what it did on the show.
  if (seasonConfig?.popularityEnabled !== false) {
    gs.popularity ||= {};
    gs.popularity[hostWinner] = Math.round(((gs.popularity[hostWinner] || 0) + 3) * 100) / 100;
    gs.popularity[relicWinner] = Math.round(((gs.popularity[relicWinner] || 0) + 2) * 100) / 100;
  }
  // Winning ten thousand dollars in front of fifteen people you have known for
  // four hours does not make you popular with all of them.
  for (const n of cast) {
    if (n === hostWinner) continue;
    try { addBond(n, hostWinner, -0.4); } catch { /* night one, barely anybody */ }
  }

  const p = pronouns ? (() => { try { return pronouns(relicWinner); } catch { return null; } })() : null;

  return {
    relicWinner, hostWinner, relicTeam, hostTeam,
    act: {
      type: 'premiere-mystery',
      relicWinner, hostWinner,
      relicTeam: [...relicTeam], hostTeam: [...hostTeam],
      money: 10000,
      relicGranted: !!relicGranted,
      buyOffGranted: !!buyOffGranted,
      beats: [{
        text: `Nobody has unpacked. The host is gone, the Head of Household relic is gone with `
          + `${p ? p.obj : 'them'}, and the house is told it has been split in two and sent looking. `
          + `<strong>${relicWinner}</strong> comes back with the relic and the right to say who `
          + `plays for the first crown. <strong>${hostWinner}</strong> comes back with the host and `
          + `ten thousand dollars, and everybody watches ${hostWinner} be handed it.`,
        players: [relicWinner, hostWinner],
        badgeText: 'PREMIERE NIGHT', badgeClass: 'gold',
        eventId: 'premiere-mystery', category: 'twist', location: 'living-room',
      }, {
        text: `What the room does not hear is the second half of what ${hostWinner} is told: the `
          + `money is not a prize, it is a key. Spent once, before the jury, it takes `
          + `${hostWinner} off the block and leaves whoever is Head of Household naming somebody `
          + `else on the spot with no say in it.`,
        players: [hostWinner],
        badgeText: 'AND THE OTHER HALF', badgeClass: 'purple',
        eventId: 'premiere-buy-off-secret', category: 'twist', location: 'diary-room',
      }],
    },
  };
}
