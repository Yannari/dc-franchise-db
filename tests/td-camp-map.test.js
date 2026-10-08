// @vitest-environment jsdom
// The camp map (vp-td-ep/map.js + screens.js), on played seasons.
//
// Guards: a conversation that lands in no zone or no time window; a conversation the map shows but
// cannot play; a shared camp that shows one team and loses the other's talk; a venue without a
// painted map losing its camp screens; the clock letting the viewer jump past a key conversation;
// Next skipping a conversation or playing one twice.
import { campFeed } from '../js/td/story/feed.js';
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdCampMap, mapZones, openWindow, nextConv, hasMap, WINDOW_ORDER } from '../js/vp-td-ep/map.js';
import { tdStepScreens } from '../js/vp-td-ep/screens.js';
import { tdCampScreen, campSlot } from '../js/vp-td-ep/steps.js';

const NAMES = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];
const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
let eps = [];
beforeAll(() => {
  seededRun(() => runOneSeason({ romance: 'enabled', setting: 'hosted-camp' }, 16, NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }))), 777);
  eps = core.gs.episodeHistory.map(e => JSON.parse(JSON.stringify(e)));
}, 600000);

const campsOf = (ep, phase) => Object.keys(ep.campEvents || {}).filter(c => {
  const b = ep.campEvents[c]; return (phase === 'pre' ? (Array.isArray(b) ? b : b?.pre || []) : (b?.post || [])).length;
});

describe('the camp map', () => {
  it('Wawanakwa has a painted map with every place on it', () => {
    expect(hasMap('hosted-camp')).toBe(true);
    const z = mapZones('hosted-camp');
    for (const id of ['cabins', 'mess-hall', 'washroom', 'communal-grounds', 'confessional', 'campfire', 'dock', 'beach', 'forest-trail', 'cliff']) {
      expect(z[id], id).toBeTruthy();
      expect(z[id].u).toBeGreaterThan(0); expect(z[id].u).toBeLessThan(1);
    }
  });

  it('puts every conversation in a zone and a time window, and every one plays', () => {
    let n = 0;
    for (const ep of eps) for (const phase of ['pre', 'post']) {
      const camps = campsOf(ep, phase); if (!camps.length) continue;
      const m = tdCampMap(ep, phase, camps, { setting: 'hosted-camp' }); if (!m) continue;
      const zones = mapZones('hosted-camp');
      for (const c of m.convs) {
        n++;
        expect(zones[c.zone], `ep${ep.num} ${phase} zone ${c.zone}`).toBeTruthy();
        expect(WINDOW_ORDER[phase]).toContain(c.window);
        expect(c.screen.steps.length).toBeGreaterThan(1);
        expect(c.screen.steps[0].k).toBe('scene');
      }
    }
    expect(n).toBeGreaterThan(100);
  });

  it('holds every team of a shared camp on one map, and loses no conversation', () => {
    const ep = eps.find(e => campsOf(e, 'pre').length >= 2);
    const camps = campsOf(ep, 'pre');
    const m = tdCampMap(ep, 'pre', camps, { setting: 'hosted-camp' });
    // every scene that airs (td/story/feed.js campFeed: the director's choice, or every event on an old save)
    const total = camps.reduce((a, c) => a + campFeed(ep, c, 'pre').filter(e => e && (e.lines?.length || String(e.text || '').trim())).length, 0);
    expect(m.convs.length).toBe(total);
    expect(new Set(m.convs.map(c => c.camp)).size).toBe(camps.length);
    const out = tdStepScreens(ep, camps.map(c => ({ id: `camp-pre-${c}`, label: 'Camp' })), { setting: 'hosted-camp' });
    expect(out.length).toBe(1);
    expect(out[0].campMap).toBe(true);
    expect(out[0].id).toBe(`camp-pre-${camps[0]}`);
  });

  it('keeps the linear camp screens when the map is switched off', () => {
    const ep = eps[0];
    const camps = campsOf(ep, 'pre');
    const out = tdStepScreens(ep, camps.map(c => ({ id: `camp-pre-${c}`, label: 'Camp' })), { setting: 'hosted-camp', campMap: false });
    expect(out.some(s => s.campMap)).toBe(false);
    expect(out.length).toBe(camps.length);
  });

  it('opens a later window only once the earlier windows\' key conversations are watched, and Next walks the story once', () => {
    const ep = eps.find(e => { const c = campsOf(e, 'post'); const m = c.length && tdCampMap(e, 'post', c, { setting: 'hosted-camp' }); return m && m.windows.length > 1 && m.convs.some(x => x.key && x.window === m.windows[0].id); });
    const m = tdCampMap(ep, 'post', campsOf(ep, 'post'), { setting: 'hosted-camp' });
    const seen = new Set();
    expect(openWindow(m, seen)).toBe(0);
    for (const c of m.convs.filter(x => x.window === m.windows[0].id && x.key)) seen.add(c.i);
    expect(openWindow(m, seen)).toBeGreaterThan(0);
    const walked = new Set(), all = new Set();
    for (let c = nextConv(m, all); c; c = nextConv(m, all)) { expect(walked.has(c.i)).toBe(false); walked.add(c.i); all.add(c.i); }
    expect(walked.size).toBe(m.convs.length);
    const order = m.convs.map(c => WINDOW_ORDER.post.indexOf(c.window));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

// each venue's own map: every conversation of a season played there lands on one of that map's zones
describe.each([['film-lot', ['trailers', 'craft-services', 'studio-backlot', 'soundstage-corridor', 'prop-storage', 'confessional']], ['world-tour', ['economy', 'aisle', 'galley', 'cargo-hold', 'first-class', 'destination-staging', 'confessional']],
  ['survival-island', ['shelter', 'campfire', 'beach', 'shoreline', 'water-source', 'jungle-trail', 'fishing-area', 'confessional']],
  ['carnival', ['campsite', 'shelter', 'forest-edge', 'rocky-beach', 'lake-shore', 'carnival-entrance', 'midway', 'haunted-mansion', 'corn-maze', 'theater-tent', 'confessional']]])('the %s map', (venue, places) => {
  let veps = [];
  beforeAll(() => {
    seededRun(() => runOneSeason({ romance: 'enabled', setting: venue }, 12, NAMES.slice(0, 12).map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }))), 778);
    veps = core.gs.episodeHistory.map(e => JSON.parse(JSON.stringify(e)));
  }, 600000);
  it('has every place on the painted map, and every conversation lands on one', () => {
    expect(hasMap(venue)).toBe(true);
    const zones = mapZones(venue);
    for (const id of places) expect(zones[id], id).toBeTruthy();
    let n = 0;
    for (const ep of veps) for (const phase of ['pre', 'post']) {
      const camps = campsOf(ep, phase); if (!camps.length) continue;
      const m = tdCampMap(ep, phase, camps, { setting: venue }); if (!m) continue;
      for (const c of m.convs) { n++; expect(zones[c.zone], `ep${ep.num} ${phase} ${c.place} -> ${c.zone}`).toBeTruthy(); expect(c.screen.steps.length).toBeGreaterThan(1); }
    }
    expect(n).toBeGreaterThan(40);
  });
});

// teams that live apart (Soluna): one map per team, its own campsite home, every other team's camp locked
describe('a venue where teams live apart', () => {
  let veps = [];
  beforeAll(() => {
    seededRun(() => runOneSeason({ romance: 'enabled', setting: 'survival-island', teams: 3 }, 12, NAMES.slice(0, 12).map((n, i) => ({ ...roster.find(r => r.name === n), tribe: ['Bass', 'Gophers', 'Rats'][i % 3] }))), 779);
    veps = core.gs.episodeHistory.map(e => JSON.parse(JSON.stringify(e)));
  }, 600000);
  it('gives each team its own map, with its own campsite and the other teams camps locked', () => {
    const ep = veps.find(e => campsOf(e, 'pre').length === 3);
    expect(ep).toBeTruthy();
    const camps = campsOf(ep, 'pre');
    const out = tdStepScreens(ep, camps.map(c => ({ id: `camp-pre-${c}`, label: 'Camp' })), { setting: 'survival-island' });
    expect(out.filter(s => s.campMap).length).toBe(3);
    const homes = new Set();
    for (const c of camps) {
      const m = tdCampMap(ep, 'pre', [c], { setting: 'survival-island' });
      expect(m.zones.shelter && m.zones.campfire).toBeTruthy();
      homes.add(`${m.zones.shelter.u},${m.zones.shelter.v}`);
      const rivals = Object.values(m.zones).filter(z => z.rival);
      expect(rivals.map(z => z.label).sort()).toEqual(camps.filter(x => x !== c).map(x => `${x} camp`).sort());
      expect(m.convs.every(x => !m.zones[x.zone]?.rival)).toBe(true);
    }
    expect(homes.size).toBe(3);
    expect(veps.some(e => Object.keys(e.campAccess?.phases || {}).some(k => k.includes('*commons'))), 'teams apart never share a place').toBe(false);
    expect(veps.some(e => Object.values(e.campEvents || {}).some(b => (b.pre || []).some(x => x.type === 'crossTeam')))).toBe(false);
  });
  it('shows each team its own campsite: a scene at the shelter or the fire uses that team\'s plate', () => {
    let n = 0;
    for (const ep of veps) for (const phase of ['pre', 'post']) for (const c of campsOf(ep, phase)) {
      const scr = tdCampScreen(ep, c, phase, [], { setting: 'survival-island' });
      const slot = campSlot(ep, c, 'survival-island');
      for (const st of scr?.steps || []) {
        if (st.k !== 'scene' || !['shelter', 'campfire'].includes(st.spot)) continue;
        n++;
        expect(st.plate, `${c} ${st.spot}`).toContain(slot === 'merge' ? `${st.spot}-` : `${st.spot}-t${slot}-`);
      }
    }
    expect(n).toBeGreaterThan(10);
  });
});

// who can meet whom (camp-access.js CAMP_LAYOUT): at a shared camp the teams mix in the public places
// before the merge, never in a private one; at a camp where they live apart they never mix
describe('teams at a shared camp and at separate camps', () => {
  it('mixes the teams only in public places at a shared camp, and keeps them apart elsewhere', () => {
    const pre = eps.filter(e => (e.tribesAtStart || []).length >= 2 && e.campAccess?.phases?.['pre:*commons']);
    expect(pre.length).toBeGreaterThan(0);
    let mixed = 0;
    for (const ep of pre) for (const w of ep.campAccess.phases['pre:*commons']) for (const a of w.assignments) {
      expect(a.locationId, 'a private place').toMatch(/^(communal-grounds|mess-hall|campfire|beach)$/);
      const teams = new Set(a.players.map(n => ep.tribesAtStart.find(t => t.members.includes(n))?.name));
      if (teams.size > 1) mixed++;
    }
    expect(mixed).toBeGreaterThan(0);
    const cross = eps.flatMap(e => Object.values(e.campEvents || {}).flatMap(b => b.pre || [])).filter(x => x.type === 'crossTeam');
    expect(cross.length).toBeGreaterThan(3);
    expect(new Set(cross.map(x => x.scene.kind)).size).toBeGreaterThan(1);
  });
});
