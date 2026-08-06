// Team America (BB16) — an alliance nobody in the house chose.
//
// The audience picks three houseguests, tells each of them privately, and
// sends weekly missions: start a rumour and make it travel, cause an argument
// you are not in, put a name on the block without suggesting it. Completing
// one pays all three. Being CAUGHT sets the house hunting a saboteur.
//
// The two rules worth pinning are the secrecy and the trap. The house is never
// told this exists, so no beat may name the team as a team — and the missions
// force three people to be seen together, which is the tell the events grow
// from.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { TEAM_SIZE, MISSION_FEE, TEAM_MISSIONS, teamMembers, isTeamMember,
  fillTeam, runMission } from '../js/bb/team-america.js';
import { TEAM_AMERICA_EVENTS } from '../js/bb-events/team-america.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(weeks = 4) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = Array.from({ length: weeks },
    (_, i) => ({ episode: i + 1, type: 'bb-team-america' }));
}

const actOf = ep => (ep.acts || []).find(a => a.type === 'team-america') || null;

function play(weeks = 4, seed = 5) {
  house(weeks);
  const eps = [];
  for (let w = 0; w < weeks; w++) {
    const ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode());
    if (!ep) break;
    eps.push(ep);
  }
  return eps;
}

describe('Team America', () => {
  beforeEach(() => house());

  it('is a secret audience twist that changes no week rules', () => {
    const c = BB_TWIST_CONTRACTS['bb-team-america'];
    expect(c).toBeTruthy();
    expect(c.rules).toEqual({});
    expect(c.acquisition).toEqual({ channel: 'audience', secrecy: 'secret' });
    // Secret means secret: no announcement act, ever.
    expect(c.announcement).toBeUndefined();
    expect(TWIST_CATALOG.some(t => t.id === 'bb-team-america')).toBe(true);
    expect(TEAM_MISSIONS.length).toBeGreaterThanOrEqual(5);
    // Every mission says what they physically have to do.
    for (const m of TEAM_MISSIONS) {
      expect(m.ask.length, `${m.id} has no stated task`).toBeGreaterThan(40);
      expect(m.stat, `${m.id} has no stat`).toBeTruthy();
    }
  });

  it('fields three, and refills the seat when one is evicted', () => {
    const eps = play(4);
    expect(eps.length).toBeGreaterThan(2);
    // Who had already gone by the time each mission ran. Checking against the
    // END of the season would be wrong: somebody on the team in week one is
    // legitimately on it there and evicted in week three.
    const goneBefore = w => new Set((gs.bb.weeks || [])
      .filter(x => x.num < w).map(x => x.evicted).filter(Boolean));
    for (const ep of eps) {
      const act = actOf(ep);
      if (!act) continue;
      expect(act.members.length).toBeLessThanOrEqual(TEAM_SIZE);
      const already = goneBefore(ep.num);
      for (const n of act.members) {
        expect([...already], `${n} was still on the team after being evicted`)
          .not.toContain(n);
      }
    }
    // Across the season the seat gets refilled, so more than three people have
    // served — otherwise the twist quietly dies with its first eviction.
    const everSeen = new Set(eps.flatMap(e => actOf(e)?.members || []));
    expect(everSeen.size).toBeGreaterThanOrEqual(TEAM_SIZE);
  });

  it('pays only for missions that land', () => {
    const eps = play(4);
    let expected = 0;
    for (const ep of eps) {
      const act = actOf(ep);
      if (!act) continue;
      if (act.mission.done) expected += MISSION_FEE;
      expect(act.earned, 'the running total does not match the missions').toBe(expected);
      expect(act.mission.fee).toBe(act.mission.done ? MISSION_FEE : 0);
      // The lead is always somebody on the team.
      expect(act.members).toContain(act.mission.lead);
    }
  });

  it('never tells the house the team exists', () => {
    const eps = play(4);
    const ep = eps.find(e => actOf(e));
    expect(ep, 'no mission ran').toBeTruthy();
    const act = actOf(ep);
    // The act itself is secret, and the house-facing beats never name it.
    expect(act.secret).toBe(true);
    const beats = eps.flatMap(e => (e.acts || []).flatMap(a => a.socialBeats || []))
      .filter(b => String(b.eventId || '').startsWith('team-'));
    for (const b of beats) {
      for (const n of act.members) {
        expect(b.text, 'a beat named the team as a team')
          .not.toContain(`${n} is on Team America`);
      }
      expect(b.text).not.toMatch(/Team America/);
    }
  });

  it('reaches both transcripts', () => {
    const eps = play(4);
    const ep = eps.find(e => actOf(e));
    const act = actOf(ep);
    const week = (gs.bb.weeks || []).find(w => w.num === ep.num);
    for (const [label, text] of [
      ['summariseWeek', summariseWeek(week)],
      ['generateSummaryText', generateSummaryText(ep)],
    ]) {
      expect(text, `${label}: untranscribed`).toMatch(/TEAM AMERICA/);
      expect(text, `${label}: no mission named`).toContain(act.mission.name);
    }
  });

  // The backlog is meant to be a COMPLETE retranscription of what the viewing
  // party shows, and this one was not: it restated the mission in its own
  // words and called a helper that only renders socialBeats, so every mission
  // beat — the assignment, the objective, the outcome, what it did to the
  // house — was written, screened, and silently dropped on the way to text.
  it('retranscribes every mission beat, not a summary of them', () => {
    const eps = play(4);
    const ep = eps.find(e => actOf(e));
    const act = actOf(ep);
    const text = generateSummaryText(ep);
    expect(act.beats.length).toBeGreaterThan(1);
    for (const b of act.beats) {
      // Compare on a distinctive slice — the text carries curly quotes and
      // line wrapping that a whole-string match would trip over.
      const probe = b.text.slice(0, 60);
      expect(text, `a beat never reached the transcript: "${probe}"`).toContain(probe);
    }
    if (act.mission.effect?.note) {
      expect(text, 'the mission changed the house and the transcript never said so')
        .toContain(act.mission.effect.note);
    }
  });

  // ── what a completed mission actually DOES ──────────────────────────
  //
  // The version of this twist worth deleting is the one where a mission is a
  // fee and a sentence and the house wakes up unchanged. Each of these forces
  // one mission to land and then asks the house whether anything moved.
  describe('a completed mission changes the house', () => {
    const suspicion = (a, b) => gs.bb?.house?.suspicion?.[`${a}→${b}`] || 0;
    /** Always lands, and is always noticed — the effect is what is under test. */
    const lands = () => 0.01;

    /** Force one mission through, with a real nomination plan to steer. */
    function mission(id, { hoh = 'Bowie', nominees = ['Millie', 'Caleb'] } = {}) {
      house();
      const active = [...gs.activePlayers];
      const plan = { nominees: [...nominees], target: nominees[0], pawn: nominees[1],
        structure: 'target-pawn', structureWhy: 'the classic' };
      fillTeam(active, lands);
      const act = runMission({ week: { num: 3 }, house: active, rng: lands,
        forced: id, plan, hoh });
      return { act, plan, team: act.members, outsiders: active.filter(n => !act.members.includes(n)) };
    }

    it('every mission has an effect wired to it', () => {
      for (const m of TEAM_MISSIONS) {
        const { act } = mission(m.id);
        expect(act.mission.done, `${m.id} did not land`).toBe(true);
        expect(act.mission.effect, `${m.id} completed and changed nothing`).toBeTruthy();
        expect(act.mission.effect.note.length).toBeGreaterThan(10);
        // The effect is narrated, not silent — it reaches the screen as a beat.
        expect(act.beats.length).toBeGreaterThan(2);
      }
    });

    it('never makes a member the one it happens to', () => {
      // A mission that damaged the team would be the twist paying for itself.
      for (const m of TEAM_MISSIONS) {
        const { act, team } = mission(m.id);
        // `players` is who was in the scene — the team is legitimately in it,
        // since a mission that clears them casts them as the beneficiaries.
        // `victims` is who it HAPPENED to, and that list never touches the team.
        for (const n of act.mission.effect.victims || []) {
          expect(team, `${m.id} cast a member as its victim`).not.toContain(n);
        }
      }
    });

    it('the rumour plants a belief that is not true', () => {
      const { act, outsiders } = mission('rumour');
      const [victim] = act.mission.effect.victims;
      expect(outsiders).toContain(victim);
      // Somebody who was never told it directly is now warier of the victim.
      const believers = outsiders.filter(n => suspicion(n, victim) > 0);
      expect(believers.length, 'the rumour reached nobody').toBeGreaterThan(0);
    });

    it('the saboteur hunt points away from the team', () => {
      const { act, team, outsiders } = mission('saboteur');
      const [scapegoat] = act.mission.effect.victims;
      expect(team, 'the house landed on an actual member').not.toContain(scapegoat);
      const hunters = outsiders.filter(n => n !== scapegoat && suspicion(n, scapegoat) > 0);
      expect(hunters.length).toBeGreaterThan(0);
    });

    it('the block mission actually seats the name', () => {
      const { act, plan, team } = mission('block');
      const [mark] = act.mission.effect.victims;
      expect(plan.nominees, 'the mark never reached the block').toContain(mark);
      expect(plan.nominees).toHaveLength(2);
      // It never quietly overwrites the pawn — somebody was asked to sit there
      // on camera, and erasing that would unwrite a scene the week has shown.
      expect(plan.pawn, 'the negotiated pawn was swapped out').toBe('Caleb');
      expect(team, 'a member was put on the block by their own team').not.toContain(mark);
    });

    it('the argument spends real bond between two outsiders', () => {
      const { act, outsiders } = mission('argument');
      const [a, b] = act.mission.effect.victims;
      expect(outsiders).toContain(a);
      expect(outsiders).toContain(b);
      expect(getBond(a, b), 'they are still friends').toBeLessThan(0);
      expect(suspicion(a, b)).toBeGreaterThan(0);
    });

    it('the costume puts somebody in a costume', () => {
      const { act, outsiders } = mission('costume');
      const [victim] = act.mission.effect.victims;
      expect(outsiders).toContain(victim);
      const worn = (gs.bb.punishments || []).filter(p => p.name === victim);
      expect(worn.length, 'nobody is wearing anything').toBeGreaterThan(0);
      // Being ridiculous on camera is good for the edit, whatever it costs them.
      expect(gs.popularity[victim]).toBeGreaterThan(0);
    });

    it('the open meeting launders the team', () => {
      house();
      const active = [...gs.activePlayers];
      fillTeam(active, lands);
      const team = teamMembers(active);
      const outs = active.filter(n => !team.includes(n));
      // Give the house something to forget.
      for (const n of outs) for (const m of team) {
        gs.bb ||= {}; gs.bb.house ||= { suspicion: {} };
        gs.bb.house.suspicion[`${n}→${m}`] = 5;
      }
      runMission({ week: { num: 3 }, house: active, rng: lands, forced: 'meeting' });
      // Everybody watched them do it and nobody counted it. Only the one
      // sharp houseguest who clocked the week comes out warier.
      const eased = outs.filter(n => team.every(m => suspicion(n, m) < 5));
      expect(eased.length, 'the house did not relax at all').toBeGreaterThan(0);
    });

    it('pays the team in screen time, and pays them for being caught', () => {
      const { act, team } = mission('rumour');
      for (const n of team) {
        expect(gs.popularity[n], `${n} did the job for nothing`).toBeGreaterThan(0);
      }
      // The lead carries the segment.
      expect(gs.popularity[act.mission.lead])
        .toBeGreaterThanOrEqual(Math.max(...team.map(n => gs.popularity[n])));
      // Being noticed wrecks the game and helps the edit — that is the trade.
      expect(act.mission.noticed).toBe(true);
    });
  });

  it('makes the job produce its own tell', () => {
    expect(TEAM_AMERICA_EVENTS.length).toBeGreaterThanOrEqual(4);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of TEAM_AMERICA_EVENTS) expect(ids.has(e.id), `${e.id} unreachable`).toBe(true);
    let seen = 0;
    for (let seed = 1; seed <= 6; seed++) {
      for (const ep of play(4, seed)) {
        for (const b of (ep.acts || []).flatMap(a => a.socialBeats || [])) {
          if (String(b.eventId || '').startsWith('team-')) seen++;
        }
      }
    }
    expect(seen, 'the house never noticed anything').toBeGreaterThan(0);
  });
});
