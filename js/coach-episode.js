// The per-episode coaching block: run the sessions, move the bonds, record
// what happened. This is the only file in the twist that writes to `gs`; the
// maths lives in coach-agenda.js and the store in coaches.js.
import { gs, players } from './core.js';
import { pStats } from './players.js';
import { addBond, getBond } from './bonds.js';
import { bankTraining, coachesOf, sessionsFor } from './coaches.js';
import { pickSessionTargets, sessionGain, teachableStat, aweOf } from './coach-agenda.js';

/** How close this coach is to being voted out, 0..1. Lifts their survive agenda. */
function vulnerabilityOf(coachName, tribe) {
  const bonds = tribe.members.map(m => getBond(coachName, m));
  if (!bonds.length) return 0.5;
  const avg = bonds.reduce((a, b) => a + b, 0) / bonds.length;
  return Math.max(0, Math.min(1, (5 - avg) / 15));
}

/**
 * Career fame gap between a coach and a contestant, in stars.
 *
 * `js/fame.js` derives stars from `computeFame({ players, rankings, seasons,
 * franchise })` — a full walk of seasons_database.json / players_database.json
 * / the franchise records file. None of those databases are loaded into the
 * live simulator's `gs` (fame.js's own header says as much: "the site uses it
 * now and the simulator uses it later"), so there is no real score to feed
 * `starsFromScore` from inside an episode. Rather than invent a number, this
 * always returns a gap of 0 — awe is architecturally wired but inert until a
 * future task plumbs the franchise databases into `gs`.
 *
 * Kept as a seam (not hardcoded inline) so that wiring is a one-line change
 * here, and so a test can inject a stand-in to prove the awe→bond multiplier
 * itself is correct without needing that data to exist yet.
 */
export function defaultFameGapOf(_coachName, _contestantName) {
  return 0;
}

export function runCoachingBlock(ep, tribe, roll = Math.random, fameGapOf = defaultFameGapOf) {
  const coaches = coachesOf(tribe.tribeName);
  const sessions = [], passedOver = [];

  for (const coach of coaches) {
    const coachStats = pStats(coach.name);
    const archetype = players.find(p => p.name === coach.name)?.archetype;
    const budget = coach.sessionsPerEp || sessionsFor(tribe.members.length);
    const discipline = teachableStat(coachStats);

    const candidates = tribe.members.map(name => ({
      name, stats: pStats(name), bond: getBond(coach.name, name), atRisk: 0,
    }));

    const picked = pickSessionTargets({
      coach: { stats: coachStats, archetype, vulnerability: vulnerabilityOf(coach.name, tribe) },
      candidates, sessions: budget, roll,
    });

    for (const contestant of picked) {
      const gain = sessionGain(coachStats[discipline], getBond(coach.name, contestant), roll);
      const banked = bankTraining(coach.name, contestant, discipline, gain);

      // Awe accelerates attachment, never learning: it multiplies the BOND a
      // session builds, and never touches sessionGain (the training itself)
      // above. A negative awe (the strategic archetypes reading a famous
      // coach as a threat, not a hero) must not invert into a bond penalty
      // here — being coached is still attention, so the floor is 0, not the
      // raw negative awe.
      const contestantArchetype = players.find(p => p.name === contestant)?.archetype;
      const gap = fameGapOf(coach.name, contestant);
      const awe = aweOf({ gap, stats: pStats(contestant), archetype: contestantArchetype });
      const bondMult = 1 + Math.max(0, awe);

      // Attention builds attachment whether or not the teaching was any good.
      addBond(coach.name, contestant, 1 * bondMult);
      sessions.push({ coach: coach.name, contestant, stat: discipline, gain: banked });
    }

    for (const name of tribe.members) {
      if (picked.includes(name)) continue;
      // Resentment IS a bond, not a new stat.
      addBond(coach.name, name, -0.5);
      passedOver.push({ coach: coach.name, contestant: name });
    }
  }

  if (!ep.coachData) ep.coachData = {};
  ep.coachData[tribe.tribeName] = { sessions, passedOver };
  return { sessions, passedOver };
}
