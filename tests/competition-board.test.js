// The competition screen, which fires twice a week.
//
// It used to be a title, whatever single line the competition happened to
// narrate, and the winner — everything that makes a competition worth watching
// was already in the act and simply never drawn. It is a scoreboard now, so
// what these guard is the part that can silently go wrong: the board must
// never show a placement before the reveal has reached it. An off-by-one here
// spoils the result on the first click and nothing would throw.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { rpBuildBBComp, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const CAST = ['A','B','C','D','E','F','G','H','I','J','K','L']
  .map((name, i) => ({
    name, gender: 'm', sexuality: 'straight',
    archetype: ['mastermind','hero','floater','villain'][i % 4],
  }));

function playWeeks(n) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond });
  Object.assign(seasonConfig, {
    format: 'big-brother', finaleSize: 3, jurySize: 7, twistSchedule: [],
    bbSafetyMode: 'off', bbHaveNots: 'twist', bbDepartures: 'off',
  });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  let ep = null;
  for (let i = 0; i < n; i++) ep = simulateBBEpisode();
  return ep;
}

const litRows = html => (html.match(/class="bbc-row (?!is-hidden)/g) || []).length;

describe.each([['hoh'], ['veto']])('the %s board', (type) => {
  it('hides every placement until the reveal reaches it', () => {
    const ep = playWeeks(2);
    const act = ep.acts.find(a => a.type === type);
    const field = act.results.length;
    const key = `bb_comp_${ep.num}_${type}`;

    // Nothing at all before the first click: the winner is not in the DOM lit.
    _tvState[key] = { idx: -1 };
    expect(litRows(rpBuildBBComp(ep, type))).toBe(0);

    // Walk the whole reveal. The count only ever grows, never shrinks, and the
    // winner's row is the last thing to light up.
    let prev = 0, winnerLitAt = null;
    for (let idx = 0; idx <= 16; idx++) {
      _tvState[key] = { idx };
      const html = rpBuildBBComp(ep, type);
      const lit = litRows(html);
      expect(lit, `row count went backwards at idx ${idx}`).toBeGreaterThanOrEqual(prev);
      prev = lit;
      if (/bbc-row [^"]*is-win/.test(html) && winnerLitAt === null) winnerLitAt = idx;
    }
    expect(prev, 'the board never filled').toBe(field);
    expect(winnerLitAt, 'the winner never appeared').not.toBeNull();

    // The winner is revealed strictly after the rest of the field.
    _tvState[key] = { idx: winnerLitAt - 1 };
    const before = rpBuildBBComp(ep, type);
    expect(/bbc-row [^"]*is-win/.test(before)).toBe(false);
    expect(litRows(before)).toBe(field - 1);
  });

  it('draws the whole field, with scores as bars', () => {
    const ep = playWeeks(2);
    const act = ep.acts.find(a => a.type === type);
    _tvState[`bb_comp_${ep.num}_${type}`] = { idx: 99 };
    const html = rpBuildBBComp(ep, type);
    for (const r of act.results) expect(html).toContain(r.name);
    expect((html.match(/class="bbc-bar"/g) || []).length).toBe(act.results.length);
    // The header is the explainer now: what the competition is, and what it
    // tested. 'bbc-plate' was a title and a category label.
    expect(html).toContain('bbc-what');
    expect(html).toContain('bbc-stat');
    expect(html).toContain(act.competition.name);
  });
});

describe('the competition board', () => {
  it('names who sat out, and why, when somebody did', () => {
    // By week two there is an outgoing Head of Household who cannot defend.
    const ep = playWeeks(2);
    const act = ep.acts.find(a => a.type === 'hoh');
    _tvState[`bb_comp_${ep.num}_hoh`] = { idx: 99 };
    const html = rpBuildBBComp(ep, 'hoh');
    const excluded = act.competition.excluded || [];
    if (excluded.length) {
      expect(html).toContain('Sat out');
      for (const n of excluded) expect(html).toContain(n);
      expect(html).toContain('cannot defend the room');
    }
  });
});
