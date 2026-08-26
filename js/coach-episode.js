// The per-episode coaching block: run the sessions, move the bonds, record
// what happened. This is the only file in the twist that writes to `gs`; the
// maths lives in coach-agenda.js and the store in coaches.js.
import { gs, players } from './core.js';
import { pStats } from './players.js';
import { addBond, getBond } from './bonds.js';
import { bankTraining, coachesOf, coachRecord, removeCoach, revokeCoachTraining, sessionsFor } from './coaches.js';
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
 * `js/fame.js` derives real stars from `computeFame({ players, rankings,
 * seasons, franchise })` — a full walk of seasons_database.json /
 * players_database.json / the franchise records file. None of those
 * databases are loaded into the live simulator's `gs` (fame.js's own header
 * says as much: "the site uses it now and the simulator uses it later"), so
 * there is no continuous 0-5 score to feed `starsFromScore` from inside an
 * episode.
 *
 * This is a two-tier PROXY, not real fame: the coach's own `stars` (set on
 * `addCoach`, defaulting to 4.5 — coaches are winners/finalists by
 * definition) against a flat guess at the contestant's own standing, read
 * off `isReturnee` because that field IS reachable in-engine today
 * (`js/players.js` already reads it): a newbie is `0`, a returning vet is
 * `2.0`. It is deliberately coarse and should be replaced the day a season
 * builder plumbs real fame.js output into `gs`.
 *
 * Kept as a seam (not hardcoded inline) so a caller can pass real fame later
 * without touching `runCoachingBlock`, and so tests can inject a stand-in.
 */
export function defaultFameGapOf(coachName, contestantName, tribeCoaches) {
  const coach = (tribeCoaches || []).find(c => c.name === coachName);
  const coachStars = coach?.stars ?? 4.5;
  const contestant = players.find(p => p.name === contestantName);
  const contestantStars = contestant?.isReturnee ? 2.0 : 0;
  return coachStars - contestantStars;
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
      const gap = fameGapOf(coach.name, contestant, coaches);
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

/**
 * A coach is voted out.
 *
 * The mechanical cost is revocation — everything they banked leaves with them,
 * immediately and visibly, which is what makes a coach who did his job
 * expensive to cut. The rest is the twist's largest emotional beat and must
 * not be silent.
 */
export function eliminateCoach(ep, coachName) {
  const record = coachRecord(coachName);
  const tribe = record?.tribe;
  const lost = revokeCoachTraining(coachName);

  const reactions = [];
  for (const name of (gs.activePlayers || [])) {
    const bond = getBond(coachName, name);
    // Thresholds are allowed here: this chooses narrative text, not gameplay.
    const kind = bond >= 5 ? 'grief' : bond <= -3 ? 'relief' : 'unsettled';
    reactions.push({ contestant: name, kind, bond });
  }

  removeCoach(coachName);
  if (!ep.coachElimination) ep.coachElimination = [];
  ep.coachElimination.push({ coach: coachName, tribe, lost, reactions });
  return { lost, reactions };
}
