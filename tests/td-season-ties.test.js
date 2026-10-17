// @vitest-environment jsdom
// Who came in attached is said on screen (the user, 2026-10-16: "do they actually acknowledge when they're in a
// relationship outside the game ... cheating on their partner in the game ... if their partner/husband/wife/bf gf are in
// the game ... also enemies"). Played with the real life log: Duncan and Gwen, Leshawna and Owen, Lindsay and Trent arrive
// as couples; Millie (Caleb) and Zoey (Scott) have somebody at home; Leshawna and Noah, Mike and Zoey are exes.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { seededRun, core } from './helpers/season-harness.js';
import * as savestateMod from '../js/savestate.js';
import * as episodeMod from '../js/episode.js';
import * as finaleMod from '../js/finale.js';
import '../js/ties-kin.js';   // the app loads it (main.js): kinship answers from the characters' ties
import { pairTie, homeOf } from '../js/season-ties.js';
import { historyOf } from '../js/td/story/director.js';

const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const NAMES = ['Duncan', 'Gwen', 'Leshawna', 'Owen', 'Noah', 'Lindsay', 'Trent', 'Millie', 'Mike', 'Zoey', 'Heather', 'Courtney', 'Julia', 'Aubrey', 'Bowie', 'Bruno'];
function play(eps = 99) {
  window.__lifeLog = JSON.parse(fs.readFileSync('life_events.json', 'utf8')).events.filter(e => e.status === 'approved');
  core.setPlayers(NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Audit', teams: 2, mergeAt: 10, finaleSize: 3, finaleFormat: 'traditional', jurySize: 7,
    romance: 'enabled', aftermath: 'disabled', popularityEnabled: false, setting: 'hosted-camp', twistSchedule: [] });
  savestateMod.initGameState();
  for (let g = 0; core.gs.phase !== 'complete' && core.gs.activePlayers.length > 1 && g < eps; g++) {
    window.gs = core.gs; window.players = core.players; window.seasonConfig = core.seasonConfig;
    const ep = core.gs.phase === 'finale' ? finaleMod.simulateFinale() : episodeMod.simulateEpisode();
    if (!ep) break;
  }
}
const eventsOfType = re => core.gs.episodeHistory.flatMap(ep => Object.keys(ep.campEvents || {}).flatMap(camp => ['pre', 'post']
  .flatMap(ph => (ep.campEvents[camp][ph] || []).filter(ev => re.test(ev?.type || '')).map(ev => ({ ep: ep.num, camp, ev })))));
const told = ev => ev.aired === true || ev.aired === 'covered';

describe('who came in attached', () => {
  it('says it on day one, then through the season, and every line is filled in', () => {
    const seen = { callouts: 0, guilt: 0, moments: 0 };
    for (const seed of [21, 22, 23]) {
      seededRun(() => play(), seed);
      // day one: every couple and every partner at home reaches the screen (they were narration nothing aired)
      const day1 = eventsOfType(/^life-(arrival|partner-at-home)$/);
      expect(day1.length).toBe(5);
      expect(day1.filter(x => !told(x.ev)).map(x => `${x.ev.type} ${x.ev.players.join(',')}`)).toEqual([]);
      // the partner at home said out loud at camp always airs; the confessional answering it, and a couple, family or
      // exes coming back to it later, air when the day has room
      const callouts = eventsOfType(/^tieHomeCallout$/), guilt = eventsOfType(/^tieHomeGuilt$/), moments = eventsOfType(/^tieMoment$/);
      expect(callouts.filter(x => !told(x.ev)).map(x => `seed ${seed} ep${x.ep} ${x.ev.players.join(',')}`)).toEqual([]);
      seen.callouts += callouts.length; seen.guilt += guilt.length; seen.moments += moments.length;
      for (const { ep, ev } of [...day1, ...callouts, ...guilt, ...moments]) {
        for (const l of ev.lines || []) expect(/[{}]/.test(l.text), `seed ${seed} ep${ep} ${ev.type}: ${l.text}`).toBe(false);
      }
    }
    expect(seen.callouts).toBeGreaterThan(0);
    expect(seen.guilt).toBeGreaterThan(0);
    expect(seen.moments).toBeGreaterThan(2);
  }, 600000);

  // (after the seasons: a one-episode run leaves state the harness does not reset, and the next season plays differently)
  it('knows the couples, the exes and who is waiting at home, and the story layer does too', () => {
    seededRun(() => play(1), 21);
    expect(pairTie('Duncan', 'Gwen')?.kind).toBe('couple');
    expect(pairTie('Leshawna', 'Noah')?.kind).toBe('exes');
    expect(homeOf('Millie')?.name).toBe('Caleb');
    // it was 'none': two people who walked in as a couple read as strangers
    expect(historyOf('Duncan', 'Gwen').facts.hist).toBe('couple');
    expect(historyOf('Duncan', 'Gwen').data.kinWord).toBe('girlfriend');
  }, 300000);
});
