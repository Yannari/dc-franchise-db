// ci-faces.test.js — the Circle's cast categories, and catfish faces who are
// real characters (ci/categories.js, ci-run.js facePersonas). User,
// 2026-10-01: "make the catfish real characters ... so they can be used for
// future seasons or other shows"; "the categories are pre-established, I just
// fill them" like Total Drama's tribes; the link between a player and their
// face (girlfriend, mother, friend...) sticks like a shared apartment's.
import { describe, expect, it } from 'vitest';
import { gs, setGs, players, setPlayers, seasonConfig, setRelationships, kinshipBetween } from '../js/core.js';
import { simulateCircleEpisode, circleRoles, facePersonas, circleCastProblem, circleSeasonShape } from '../js/ci-run.js';
import { setFranchiseLedger } from '../js/franchise-meta.js';
import { makePlayers } from './helpers/ci-cast.js';

function season({ faces = 1, setup = {}, rels = [] } = {}) {
  Object.assign(seasonConfig, { format: 'the-circle', seasonNumber: 1, ciSetup: setup, ciPool: undefined, twistSchedule: [],
    ciDays: null, ciFinalists: 5, ciNewcomerRule: 'rate-not-rated', ciPickBy: 'stats', ciAI: false });
  const cast = makePlayers(13 + faces, 5);
  for (let i = 0; i < faces; i++) cast[13 + i].tribe = 'Catfish faces';
  setPlayers(cast);
  setRelationships(rels);
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ci: { seed: 505 } });
  setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
  return cast;
}

describe('the categories, filled like tribes', () => {
  it('Day 1 and Newcomers decide who starts; a role set in the Profile Plan still wins', () => {
    const cast = season({ faces: 0 });
    cast[0].tribe = 'Newcomers'; cast[1].tribe = 'Day 1'; cast[2].tribe = 'Newcomers';
    seasonConfig.ciSetup = { [cast[2].name]: { role: 'starter' } };
    const roles = circleRoles(cast.map(p => p.name), seasonConfig.ciSetup);
    expect(roles[0]).toBe('newcomer');
    expect(roles[1]).toBe('starter');
    expect(roles[2]).toBe('starter');
  });
  it('a Catfish face does not play: not in the cast, not counted, not on the calendar', () => {
    const cast = season({ faces: 2 });
    const playing = cast.slice(0, 13).map(p => p.name);
    expect(circleCastProblem()).toBe(null);
    const withoutFaces = (() => { setPlayers(cast.slice(0, 13)); return circleSeasonShape().length; })();
    setPlayers(cast);
    expect(circleSeasonShape().length).toBe(withoutFaces);
    simulateCircleEpisode();
    expect(gs.ci.castOrder.sort()).toEqual([...playing].sort());
    for (const f of cast.slice(13)) expect(gs.ci.dealt[f.name]).toBeUndefined();
  });
});

describe('a real person as a catfish face', () => {
  it('is a persona built from their profile, their portrait the photo', () => {
    const cast = season();
    const [face] = facePersonas(cast.slice(0, 13).map(p => p.name), {});
    const f = cast[13];
    expect(face).toMatchObject({ id: `face:${f.name}`, handle: f.name, face: `portrait:${f.name}`, fromRoster: f.name });
    expect(face.reasons).toContain('experimental');
  });
  it('the player pinned to them plays as them, for family when they are family, and the season records it', () => {
    const cast = season();
    const [p, f] = [cast[0].name, cast[13].name];
    season({ setup: { [p]: { catfish: 'always', persona: `face:${f}` } },
      rels: [{ id: 'r1', a: p, b: f, type: 'neutral', bond: 0, kin: 'dating', leanA: 0, leanB: 0, note: '' }] });
    expect(kinshipBetween(p, f)).toBe('dating');
    simulateCircleEpisode();
    const d = gs.ci.dealt[p];
    expect(d.mode).toBe('catfish');
    expect(d.personaId).toBe(`face:${f}`);
    expect(d.shown.name).toBe(f);
    expect(d.reason).toBe('family');
    // ...and nobody else is dealt the same person
    expect(Object.values(gs.ci.dealt).filter(x => x.personaId === `face:${f}`)).toHaveLength(1);
  });
  it('a player who never schemes can still play a stranger', () => {
    const cast = season();
    cast[0].archetype = 'hero';
    const [p, f] = [cast[0].name, cast[13].name];
    seasonConfig.ciSetup = { [p]: { catfish: 'always', persona: `face:${f}` } };
    simulateCircleEpisode();
    expect(gs.ci.dealt[p].personaId).toBe(`face:${f}`);
    expect(gs.ci.dealt[p].reason).toBe('experimental');
  });
  it('the season record says who played as whom', () => {
    const cast = season();
    const [p, f] = [cast[0].name, cast[13].name];
    seasonConfig.ciSetup = { [p]: { catfish: 'always', persona: `face:${f}` } };
    for (let i = 0; i < 30; i++) if (!simulateCircleEpisode()) break;
    expect(gs.ci.record?.players?.[p]?.playedAs).toBe(f);
    expect(gs.ci.record?.players?.[f]).toBeUndefined();
  });
});
