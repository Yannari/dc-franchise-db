// What a challenge has them wear is on them, and what a climb has them carry leaves their arms when they drop it
// (2026-10-21): the grass skirts at the fire walk were drawn as a cut-out on the ground under the team, like a raft
// they rode; and on BACK UP THE CLIFF's "DROPPED IT" the chest stayed in the climber's arms all the way back down.
import { describe, it, expect, beforeAll } from 'vitest';
import { PLACES } from '../js/rr/places.js';
import { stretchPlates } from '../js/vp-rr-ep/plates.js';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens, DROPS } from '../js/vp-rr-ep/steps.js';

describe('rr viewer: the grass skirts are worn', () => {
  it('on the fire walk and the stages after the skirts go on, never stood under', () => {
    const sp = stretchPlates('lei-island', 'fire-walk', null);
    expect(sp.act.wear).toBe('hula');
    expect(sp.act.wearOn).toBe('waist');
    expect(sp.act.prop).not.toBe('hula');
    for (const id of ['the-lift', 'the-coals', 'fire-dancer']) {
      const sg = sp.stages[id];
      for (const pl of [sg.plate, sg.fail].filter(Boolean)) {
        expect(pl.wear, id).toBe('hula');
        expect(pl.wearOn, id).toBe('waist');
      }
    }
  });
});

describe('rr viewer: what is dropped leaves their arms', () => {
  it('every climb that fails with what it carries lets go of it, where it lands', () => {
    const missing = [];
    for (const pl of Object.values(PLACES)) for (const st of pl.stretches) {
      const sp = stretchPlates(pl.id, st.id, null);
      for (const [sid, sg] of Object.entries(sp?.stages || {})) {
        if (!/DROP/.test(sg.stamp || '') || !sg.fail) continue;
        const carried = sg.fail.carry || sg.plate?.carry;
        if (carried && sg.fail.mode === 'climb' && !(Array.isArray(sg.fail.drop) && sg.fail.carry)) missing.push(`${pl.id} ${st.id} ${sid}`);
      }
    }
    expect(missing).toEqual([]);
  });

  const drops = [];
  beforeAll(() => {
    // (the two climbs that drop what they carry: the cliff path at Cliff Pool Isle, the volcano at Fire Mountain Isle;
    // seasons until two drops are found)
    // (...and one whose lines say it goes: 2026-10-22, the two found first had lines that never said so)
    const says = s => s.steps.some(x => x.part === 'beat' && DROPS.test(x.text || ''));
    for (const seed of [8, 3, 21, 44, 5, 9, 13, 17, 29, 31, 37, 41, 47, 53]) {
      const { cast, teams } = raceCast(10, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed, options: { pins: { 2: 'cliff-pool-isle', 3: 'fire-mountain-isle' } } });
      const aired = airSeason(res);
      for (const i of [1, 2]) for (const s of episodeScreens(res, aired, i).screens) if (s.plate?.drop) drops.push(s);
      if (drops.length >= 2 && drops.some(says)) break;
    }
  }, 600000);
  it('marks the step it goes: the one the climb fails on', () => {
    expect(drops.length).toBeGreaterThan(0);
    for (const s of drops) {
      expect(s.dropAt, s.id).toBeTruthy();
      expect(s.dropAt.k, s.id).toBe(s.plan.fail);
      expect(s.dropAt.to, s.id).toEqual(s.plate.drop);
      expect(s.dropAt.what, s.id).toBe(s.plate.carry);
    }
  });

  it('drops it on the line that says it goes, not a click later', () => {
    let said = 0;
    for (const s of drops) {
      const j = s.steps.findIndex(x => x.part === 'beat' && DROPS.test(x.text || ''));
      if (j < 0) continue;
      said++;
      expect(s.dropAt.k, `${s.id}: ${s.steps[j].text}`).toBe(j);
    }
    expect(said).toBeGreaterThan(0);
  });
});
