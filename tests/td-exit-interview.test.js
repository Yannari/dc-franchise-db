// @vitest-environment jsdom
// Kristal-talKs exit interviews on real Total Drama seasons.
// Spec: docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { seededRun, core } from './helpers/season-harness.js';
import * as savestateMod from '../js/savestate.js';
import * as episodeMod from '../js/episode.js';
import * as finaleMod from '../js/finale.js';
import { publishedTDExitInterviews } from '../js/td/exit-interview.js';
import { extractSeasonTemplate } from '../js/stats-export.js';

const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const NAMES = ['Duncan', 'Gwen', 'Leshawna', 'Owen', 'Noah', 'Lindsay', 'Trent', 'Millie', 'Mike', 'Zoey', 'Heather', 'Courtney', 'Julia', 'Aubrey', 'Bowie', 'Bruno'];

/** Plays a season; after every episode, checks nobody still able to return has recorded. */
function play(extra = {}) {
  core.setPlayers(NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Audit', teams: 2, mergeAt: 10, finaleSize: 3, finaleFormat: 'traditional', jurySize: 7,
    romance: 'enabled', aftermath: 'disabled', popularityEnabled: true, setting: 'hosted-camp', twistSchedule: [], ri: false, ...extra });
  savestateMod.initGameState();
  const early = [];
  for (let g = 0; core.gs.phase !== 'complete' && core.gs.activePlayers.length > 1 && g < 60; g++) {
    window.gs = core.gs; window.players = core.players; window.seasonConfig = core.seasonConfig;
    const had = (core.gs.exitInterviews || []).length;
    const ep = core.gs.phase === 'finale' ? finaleMod.simulateFinale() : episodeMod.simulateEpisode();
    if (!ep) break;
    const fresh = (core.gs.exitInterviews || []).slice(had);
    for (const r of fresh.filter(x => x.kind !== 'finalist')) {
      if ((core.gs.riPlayers || []).includes(r.guest) || core.gs.activePlayers.includes(r.guest)) early.push(`${r.guest} ep${r.week}`);
    }
  }
  return early;
}

describe('a whole Total Drama season of exit interviews', () => {
  it('every boot records once they are out for good, each finalist on finale night, no juror hears early', () => {
    for (const seed of [31, 32]) {
      const early = seededRun(() => play(), seed);
      const gs = core.gs;
      expect(gs.phase).toBe('complete');
      expect(early).toEqual([]);
      const recs = gs.exitInterviews || [];
      const finalists = gs.finaleResult?.finalists || [];
      for (const name of (gs.eliminated || []).filter(n => !finalists.includes(n))) {
        expect(recs.some(r => r.guest === name), `${name} seed ${seed}`).toBe(true);
      }
      const night = recs.filter(r => r.kind === 'finalist');
      expect(night.map(r => r.guest).sort()).toEqual([...finalists].sort());
      expect(night.find(r => r.placement === 1).guest).toBe(gs.finaleResult.winner);
      const finaleRound = Math.max(...recs.map(r => r.week));
      for (const r of recs) {
        expect(r.show).toBe('total-drama');
        for (const j of gs.jury || []) if (r.heardBy[j] != null) expect(r.heardBy[j], `${j} heard ${r.id}`).toBe(finaleRound);
        if (r.prediction) expect(r.stillIn).toContain(r.prediction);
      }
      // A vote and a challenge are different exits.
      expect(recs.some(r => r.votes && r.votes.total > 0)).toBe(true);
      const pub = publishedTDExitInterviews();
      expect(pub.length).toBe(recs.length);
      expect(pub[0].heardBy).toBeUndefined();
      // The season template is what the export publishes from.
      core.seasonConfig.seasonNumber = 1;
      expect(extractSeasonTemplate().exitInterviews.length).toBe(recs.length);
    }
  }, 600000);

  it('somebody on Redemption Island records nothing until that door closes', () => {
    const early = seededRun(() => play({ ri: true, riFormat: 'redemption', riReentryAt: 8 }), 33);
    expect(early).toEqual([]);
    expect((core.gs.exitInterviews || []).length).toBeGreaterThan(3);
  }, 600000);
});
