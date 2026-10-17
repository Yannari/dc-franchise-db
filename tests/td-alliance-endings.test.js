// @vitest-environment jsdom
// An alliance ending is on screen (the user, 2026-10-16: "i dont get much event when an alliance breaks so i never know
// when its happening"). Measured on four seasons: 40 endings and departures, 13 aired. Every way alliances.js ends a
// named alliance now leaves a record (the vote that takes its second-to-last member included), every reason gets its
// scene (camp-events.js), and the director airs every ending, expulsion and walk-out (director.js, after the day's cuts).
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { seededRun, core } from './helpers/season-harness.js';
import * as savestateMod from '../js/savestate.js';
import * as episodeMod from '../js/episode.js';
import * as finaleMod from '../js/finale.js';

const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const NAMES = ['Gwen', 'Leshawna', 'Heather', 'Duncan', 'Courtney', 'Owen', 'Lindsay', 'Trent', 'Julia', 'Millie', 'Aubrey', 'Lake', 'Gabby', 'Bowie', 'Yul', 'Bruno'];
const isEnd = ev => /^alliance(Dissolved|Expelled)$/.test(ev?.type || '') || (ev?.type === 'allianceCrack' && /^alliance\.(quit|dropped)/.test(ev.scene?.kind || ''));

function play() {
  core.setPlayers(NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Audit', teams: 2, mergeAt: 10, finaleSize: 3, finaleFormat: 'traditional', jurySize: 7,
    romance: 'enabled', aftermath: 'disabled', popularityEnabled: false, setting: 'hosted-camp', twistSchedule: [] });
  savestateMod.initGameState();
  const ended = [];
  let before = new Set();
  for (let guard = 0; core.gs.phase !== 'complete' && core.gs.activePlayers.length > 1 && guard < 80; guard++) {
    window.gs = core.gs; window.players = core.players; window.seasonConfig = core.seasonConfig;
    const ep = core.gs.phase === 'finale' ? finaleMod.simulateFinale() : episodeMod.simulateEpisode();
    if (!ep) break;
    const now = new Set((core.gs.namedAlliances || []).filter(a => a.active).map(a => a.name));
    for (const n of before) if (!now.has(n)) ended.push({ name: n, ep: core.gs.episodeHistory.at(-1)?.num });
    before = now;
  }
  return ended;
}

describe('alliance endings on screen', () => {
  it('tells the camp when an alliance ends, and airs every ending and departure it writes', () => {
    const ended = seededRun(() => play(), 1729);
    expect(ended.length).toBeGreaterThan(3);
    const told = new Set(), off = [];
    for (const ep of core.gs.episodeHistory) {
      for (const camp of Object.keys(ep.campEvents || {})) for (const ph of ['pre', 'post']) {
        const plan = ep.campStory?.[camp]?.[ph] || [];
        (ep.campEvents[camp][ph] || []).forEach((ev, i) => {
          if (!isEnd(ev)) return;
          if (ev.scene?.data?.group) told.add(ev.scene.data.group);
          // aired as itself, as its long version, or folded into a scene that aired ('covered')
          if (!plan.some(x => x.ref === i) && ev.aired !== true && ev.aired !== 'covered') off.push(`ep${ep.num} ${ev.type} ${ev.scene?.kind}`);
        });
      }
    }
    expect(off).toEqual([]);
    // an alliance that ended with a member still in the game is told (an ending at the finale has no morning after)
    const last = core.gs.episodeHistory.at(-1)?.num;
    const untold = ended.filter(e => e.ep < last - 1 && !told.has(e.name)
      && (core.gs.namedAlliances.find(a => a.name === e.name)?.members || []).some(m => core.gs.episodeHistory.find(h => h.num === e.ep + 1)?.tribalPlayers?.includes(m)));
    expect(untold).toEqual([]);
  }, 300000);

  it('never casts the betrayer as one of the two telling it', () => {
    seededRun(() => play(), 4711);
    for (const ep of core.gs.episodeHistory) for (const camp of Object.keys(ep.campEvents || {})) for (const ph of ['pre', 'post'])
      for (const ev of ep.campEvents[camp][ph] || []) {
        if (ev.type !== 'allianceDissolved' || !ev.scene?.data?.betrayer) continue;
        const names = ev.scene.data.betrayer.split(' and ');
        expect(Object.values(ev.scene.who || {}).filter(n => names.includes(n)), `ep${ep.num} ${ev.scene.data.group}`).toEqual([]);
      }
  }, 300000);
});
