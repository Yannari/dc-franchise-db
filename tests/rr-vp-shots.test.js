// How a challenge is shot (the user, 2026-10-20, after testing Ice River and Pampas Ranch: "the shots u are using are too
// close sometimes and sometimes the sledge cutout dont appear and the polar dont even move", "they dont even enter that
// dance academy and the cutout use is still the fullbody", "we need presentation of the actual place with a
// description and image by don"):
//   * people are avatars: a local is never drawn as a full-body cut-out once they have an avatar
//   * a challenge done in one room is shot in that room: its moments are there, not on the pavement outside
//   * a team at a ride challenge stands beside its vehicle (the sled is there before and after the race)
//   * a challenge opens wide (Don's demonstration, the first team in), and a crowd of teams is shot wide
//   * a place is presented: after the title, Don says what the place is over its wide shots, then opens the leg there
//   * scenery that is alive moves (the bear walks, the narwhal surfaces, the plane crosses the sky)
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { PERSON_PROPS } from '../js/vp-rr-ep/locals.js';
import { PLACE_PLATES, stretchPlates, plateUrl } from '../js/vp-rr-ep/plates.js';
import { ABOUT, aboutOf } from '../js/vp-rr-ep/about.js';
import { existsSync } from 'node:fs';

const eps = [];
beforeAll(() => {
  for (const [seed, pins] of [[41, { 2: 'ice-river', 3: 'pampas-ranch' }], [42, { 2: 'coast-palace', 3: 'outback-farm', 4: 'fishing-cove' }]]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed, options: { pins } });
    const aired = airSeason(res);
    aired.forEach((_, i) => eps.push({ res, ep: episodeScreens(res, aired, i), leg: res.legs[i] }));
  }
}, 400000);
const screens = function* () { for (const e of eps) for (const s of e.ep.screens) yield { ...e, s }; };

describe('rr viewer: how a challenge is shot', () => {
  it('draws no local as a full-body cut-out: their avatar stands there instead', () => {
    const cut = [];
    let stood = 0;
    for (const { s } of screens()) {
      const people = PERSON_PROPS[s.place] || {};
      const pl = s.plate || {};
      for (const k of [pl.prop, pl.judge?.[0], ...(pl.deco || []).map(d => d[0])]) if (k && people[k]) cut.push(`${s.id} ${s.place} ${k}`);
      if (Object.values(s.localFaces || {}).some(f => Object.values(people).includes(f.id))) stood++;
    }
    expect(cut).toEqual([]);
    expect(stood).toBeGreaterThan(5);
  });

  it('shoots a challenge done in one room in that room (the dance academy, not the pavement outside)', () => {
    let inside = 0, outside = 0;
    for (const { s } of screens()) {
      if (s.place !== 'pampas-ranch' || s.stretch !== 'tango' || s.kind !== 'world' || s.seg === 'don-demo') continue;
      if (/academy/.test(s.plate?.f || '')) inside++; else outside++;
    }
    expect(inside).toBeGreaterThan(3);
    expect(outside).toBeLessThanOrEqual(1);
  });

  it('stands a team beside its vehicle at a ride challenge, before and after the race', () => {
    let parked = 0, without = 0;
    for (const { s } of screens()) {
      if (s.place !== 'ice-river' || s.stretch !== 'sled' || s.kind !== 'world' || s.mode !== 'talk') continue;
      if (s.parked === 'sled') parked++; else without++;
    }
    expect(parked).toBeGreaterThan(2);
    expect(without).toBe(0);
  });

  it('opens a challenge wide, and shoots a crowd of teams wide', () => {
    const wideOf = s => new Set((stretchPlates(s.place, s.stretch, s.side)?.wide || []).map(p => p.f));
    let demos = 0, crowds = 0;
    for (const { s } of screens()) {
      if (s.kind !== 'world' || !s.stretch) continue;
      const w = wideOf(s);
      if (!w.size) continue;
      if (s.seg === 'don-demo') { demos++; expect(w.has(s.plate.f), `${s.id} demo on ${s.plate.f}`).toBe(true); }
      if (s.mode === 'talk' && s.teams.length >= 3) { crowds++; expect(w.has(s.plate.f), `${s.id} crowd on ${s.plate.f}`).toBe(true); }
    }
    expect(demos).toBeGreaterThan(0);
    expect(crowds).toBeGreaterThan(0);
  });

  it('races the sled across the wide plain, not only the close shot', () => {
    const plates = new Set();
    for (const { s } of screens()) if (s.place === 'ice-river' && s.stretch === 'sled' && s.mode === 'act') plates.add(s.plate.f);
    expect(plates.size).toBeGreaterThan(1);
    expect([...plates].some(f => /present-22411651|present-22411652|task-22411924/.test(f))).toBe(true);
  });

  // (the user, 2026-10-20, on the close shot of the bear on the ice: "its a race and ur using a close map for a sled
  // race its too close maybe make it a part of the race and not almost the full race")
  // (and a team's own moment while it is at the bear is at the bear: tests/rr-vp-stage-talk.test.js)
  it('keeps the close bear shot for the bear stage; the rest of the sled race is out on the plain', () => {
    let close = 0, all = 0;
    for (const { s, res, leg } of screens()) {
      if (s.place !== 'ice-river' || s.stretch !== 'sled') continue;
      all++;
      if (!/task-22411840/.test(s.plate?.f || '')) continue;
      close++;
      const row = (res.state.taskLog || []).filter(r => r.leg === leg.n && r.team === s.teams?.[0] && r.stretch === 'sled').find(r => r.from <= s.t + 0.5 && s.t <= r.to + 0.5);
      const at = row?.stages?.find(x => x.t >= s.t - 0.5)?.id;
      expect(s.stage ?? at, `${s.id} close shot outside the bear`).toBe('bear');
    }
    expect(all).toBeGreaterThan(20);
    expect(close / all).toBeLessThan(0.25);
  });

  it('presents each place after its title: Don says what it is over its own wide shots, then opens the leg there', () => {
    for (const { ep, leg } of eps) {
      const t = ep.screens.findIndex(s => s.kind === 'title');
      const present = ep.screens.filter(s => s.seg === 'place-present');
      expect(present.length, `leg ${leg.n}`).toBeGreaterThanOrEqual(2);
      for (const s of present) {
        expect(ep.screens.indexOf(s)).toBeGreaterThan(t);
        expect(s.plate.place || s.place).toBe(leg.place);
        expect(s.steps.every(x => x.by === 'Don' && x.text.length > 20)).toBe(true);
      }
      const opener = ep.screens.find(s => s.seg === 'don-opener');
      if (opener) expect(opener.plate.place || opener.place, `leg ${leg.n} opener`).toBe(leg.place);
    }
  });

  it('presents every place, on its own plates', () => {
    for (const id of Object.keys(PLACE_PLATES)) {
      expect(ABOUT[id]?.length, id).toBeGreaterThanOrEqual(2);
      for (const { plate } of aboutOf(id)) expect(existsSync(plateUrl(id, plate.f)), `${id} ${plate.f}`).toBe(true);
    }
  });

  it('moves the scenery that is alive', () => {
    const still = [];
    const ALIVE = /bear|croc|komodo|panda|narwhal|plane|goat|lion|condor|zebra|bunny|albino|rhino|emu/;
    for (const [id, pl] of Object.entries(PLACE_PLATES)) for (const s of Object.values(pl.st)) {
      for (const p of [...(s.talk || []), s.act, s.act2, ...(s.alt || [])].filter(Boolean)) for (const d of p.deco || []) {
        if (ALIVE.test(d[0]) && !d[4]?.move) still.push(`${id} ${d[0]}`);
      }
    }
    expect(still).toEqual([]);
  });
});
