// The HOH's week tells one story (the user, 2026-10-14: "make sure the episode always stays logical
// and not feel like random things thrown around", and "make sure target switching is possible and
// dont get cut"). The read of that day: Beth planned a backdoor on Nichelle, told a friend "It's
// Axel", agreed with Owen's pitch that Axel was the one, and then hoped the veto would not be used,
// which would have killed her own backdoor; Axel was never nominated.
//
// The plan (bb/week.js week.plan) is the one truth: the HOH's own moments read it, a pitch that lands
// or the HOH's own read of a group changes it (week.targetSwitches), and a change airs as a scene of
// its own (hohweek.switch) instead of as a contradiction.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { switchPlanTarget } from '../js/bb/strategy.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Beth', 'Owen'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'perceptive-player', 'challenge-beast'];

function season(seed, weeks) {
  seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] })), { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
  const out = [];
  for (let w = 0; w < weeks; w++) {
    const ep = withSeededRandom(seed * 100 + w, () => simulateBBEpisode());
    if (!ep) break;
    out.push(JSON.parse(JSON.stringify(gs.bb.weeks.at(-1))));
  }
  return out;
}
const WEEKS = [58, 31, 4242].flatMap(s => season(s, 8));
const beats = w => (w.acts || []).flatMap(a => a?.socialBeats || []);
const scenes = w => (w.acts || []).flatMap(a => a?.scenes || []);
const realOf = p => p?.backdoorTarget || p?.target || null;

describe('the HOH week is one story', () => {
  it('switches a target: a backdoor keeps its empty chair, a chair keeps its partner', () => {
    const bd = { target: 'A', backdoorTarget: 'A', nominees: ['B', 'C'], pawn: 'C', structure: 'target-pawn' };
    expect(switchPlanTarget(bd, 'D')).toMatchObject({ backdoorTarget: 'D', target: 'D', nominees: ['B', 'C'] });
    expect(switchPlanTarget(bd, 'B')).toMatchObject({ backdoorTarget: null, target: 'B', pawn: 'C', nominees: ['B', 'C'] });
    const tp = { target: 'A', nominees: ['A', 'C'], pawn: 'C', structure: 'target-pawn' };
    expect(switchPlanTarget(tp, 'D')).toMatchObject({ target: 'D', nominees: ['D', 'C'], pawn: 'C' });
    expect(switchPlanTarget(tp, 'C')).toMatchObject({ target: 'C', pawn: null, nominees: ['A', 'C'] });
    expect(switchPlanTarget(tp, 'A')).toBe(null);
  });

  it('the HOH says out loud only the name the week is built on (or the one it was, before a switch)', () => {
    let checked = 0;
    for (const w of WEEKS) {
      if (!w.plan) continue;
      const allowed = new Set([realOf(w.plan), ...(w.targetSwitches || []).map(c => c.from)]);
      for (const b of beats(w).filter(x => x.eventId === 'power-hoh-deciding' && x.players?.[0] === w.hoh)) {
        checked++;
        expect(allowed.has(b.players[2]), `week ${w.num}: ${w.hoh} named ${b.players[2]}, plan ${[...allowed]}`).toBe(true);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('a backdoor HOH never asks for the veto to stay unused', () => {
    for (const w of WEEKS) {
      const bd = w.plan?.backdoorTarget;
      if (!bd || (w.initialNominees || []).includes(bd)) continue;
      for (const b of beats(w).filter(x => x.eventId === 'phase-hoh-pressures-veto' && x.players?.[0] === w.hoh && x.players?.[1] !== bd)) {
        expect(String(b.lineId || ''), `week ${w.num}`).toMatch(/^pk2\.b/);
      }
    }
  });

  it('a change of mind is on the record, the ceremony follows it, and it airs as a switch', () => {
    const changes = WEEKS.flatMap(w => (w.targetSwitches || []).map(c => ({ w, c })));
    expect(changes.length, 'no HOH ever changed target').toBeGreaterThan(0);
    let aired = 0;
    for (const { w, c } of changes) {
      // the final plan is the last change's name
      if (c === w.targetSwitches.at(-1)) expect(realOf(w.plan), `week ${w.num}`).toBe(c.to);
      if (c.at !== 'post') continue;
      const sw = scenes(w).filter(sc => String(sc.step || '').startsWith('hohweek.switch'));
      for (const sc of sw) {
        aired++;
        const text = sc.lines.map(l => l.text).join(' ');
        expect(text, `week ${w.num}`).toContain(c.to);
        expect(text, `week ${w.num}`).toContain(c.from);
        // the plan scene before it is the plan as first made
        const plan = scenes(w).find(x => String(x.step || '').startsWith('hohweek.plan'));
        if (plan) expect(plan.lines.map(l => l.text).join(' '), `week ${w.num}`).toContain(c.from);
      }
    }
    expect(aired, 'no switch ever aired').toBeGreaterThan(0);
  });

  it('a pitch that aired inside a switch does not air again on its own', () => {
    for (const w of WEEKS) {
      const sw = (w.targetSwitches || []).find(c => c.at === 'post' && c.why === 'pitch');
      if (!sw || !scenes(w).some(sc => String(sc.step || '').startsWith('hohweek.switch'))) continue;
      const solo = scenes(w).filter(sc => sc.step === 'power-hoh-pitch' && sc.cast?.[0] === sw.by);
      expect(solo, `week ${w.num}`).toEqual([]);
    }
  });
});
