// @vitest-environment jsdom
// Every coach who becomes a player at the merge is announced (the user, 2026-10-17: "the host only announce Bowie in the
// stepped viewer as a coach turn player ... even though Julia and Thom were too"). The merge set holds ten people and a
// promoted coach is pushed onto the end of the player list, so with fourteen at the merge most coaches never made the set.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { seededRun, core } from './helpers/season-harness.js';
import * as savestateMod from '../js/savestate.js';
import * as episodeMod from '../js/episode.js';
import * as finaleMod from '../js/finale.js';
import { tdMergeScreen } from '../js/vp-td-ep/twist-screens.js';
import { mergeData } from '../js/vp-screens.js';

const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const NAMES = ['Gwen', 'Leshawna', 'Heather', 'Duncan', 'Courtney', 'Owen', 'Lindsay', 'Trent', 'Julia', 'Millie', 'Aubrey', 'Lake', 'Gabby', 'Bowie', 'Yul', 'Bruno', 'Thom', 'Sami'];
const COACHES = ['Bowie', 'Julia', 'Thom'];
function play() {
  core.setPlayers(NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: ['A', 'B', 'C'][i % 3], isCoach: COACHES.includes(n) })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Coach', teams: 3, mergeAt: 11, finaleSize: 3, finaleFormat: 'traditional', jurySize: 7,
    romance: 'enabled', aftermath: 'disabled', popularityEnabled: false, setting: 'hosted-camp', twistSchedule: [], coaches: 'manual' });
  savestateMod.initGameState();
  for (let g = 0; core.gs.phase !== 'complete' && core.gs.activePlayers.length > 1 && g < 80; g++) {
    window.gs = core.gs; window.players = core.players; window.seasonConfig = core.seasonConfig;
    const ep = core.gs.phase === 'finale' ? finaleMod.simulateFinale() : episodeMod.simulateEpisode();
    if (!ep) break;
  }
}

describe('the merge with coaches', () => {
  it('announces every coach who becomes a player', () => {
    seededRun(() => play(), 6);
    const ep = core.gs.episodeHistory.find(e => e.isMerge);
    const promoted = (ep.coachPromotions || []).map(p => p.name);
    expect(promoted.length).toBeGreaterThan(1);
    const scr = tdMergeScreen(ep, mergeData(ep), { host: 'Chris' });
    const walk = scr.steps.find(s => s.k === 'beat' && /walks? into the middle of camp/.test(s.text || ''));
    expect(walk, 'no coach announcement').toBeTruthy();
    for (const n of promoted) expect(walk.text, `${n} not announced`).toContain(n);
  }, 600000);
});
