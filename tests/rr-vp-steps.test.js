// The Ridonculous Race viewer (js/vp-rr-ep): the steps are pure, every aired line is one
// click, the order never shows before the mat, nobody talks from off screen, nobody stands
// in water, and every plate is a file that exists. Spec §9.7; ADDING-A-SHOW §18.4.
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { castFromRoster, rosterPlayers } from '../js/vp-rr-ep/cast.js';
import { episodeScreens, flatSteps, intelAt } from '../js/vp-rr-ep/steps.js';
import { PLACE_PLATES, RACE, placeFiles, propFiles, plateUrl, raceUrl, propUrl, slugFile } from '../js/vp-rr-ep/plates.js';
import { PLACES } from '../js/rr/places.js';

const SEASONS = [[12, 8], [8, 3], [6, 5]];
const played = [];

beforeAll(() => {
  for (const [n, seed] of SEASONS) {
    const { cast, teams } = raceCast(n, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const eps = airSeason(res);
    played.push({ n, seed, res, eps, built: eps.map((_, i) => episodeScreens(res, eps, i)) });
  }
});

const each = fn => { for (const p of played) p.built.forEach((ep, i) => fn(ep, p, i)); };

describe('rr viewer steps', () => {
  it('builds the same cast in the browser as the test helper', () => {
    const roster = rosterPlayers(JSON.parse(readFileSync('franchise_roster.json', 'utf8')));
    for (const [n, seed] of SEASONS) expect(castFromRoster(roster, n, seed)).toEqual(raceCast(n, seed));
  });

  it('is pure: the same episode twice is the same screens', () => {
    const p = played[0];
    for (const i of [0, 3, p.eps.length - 1]) expect(JSON.stringify(episodeScreens(p.res, p.eps, i))).toBe(JSON.stringify(p.built[i]));
  });

  it('gives every aired line exactly one step, in order', () => {
    each((ep, p, i) => {
      const e = p.eps[i];
      const aired = [...(e.previously?.lines || []), ...e.segments.filter(s => s.lines?.length).flatMap(s => s.lines)].map(l => l.text);
      const shown = ep.screens.flatMap(s => s.steps).filter(s => ['say', 'beat', 'conf'].includes(s.part)).map(s => s.text);
      expect(shown).toEqual(aired);
    });
  });

  it('never shows a placement before that team reaches the mat', () => {
    each(ep => {
      const flat = flatSteps(ep.screens);
      const rankAt = {};
      flat.forEach((f, k) => { const r = ep.screens[f.si].steps[f.idx].rank; if (r && rankAt[r.team] == null) rankAt[r.team] = k; });
      flat.forEach((f, k) => {
        const it = intelAt(ep, f.si, f.idx);
        for (const team of Object.keys(it.placed)) expect(rankAt[team], `${team} placed at step ${k}`).toBeLessThanOrEqual(k);
      });
      // the side panel's order is where the leg started, not where it ends
      expect(ep.startOrder.slice().sort()).toEqual(ep.racing.slice().sort());
    });
  });

  it('puts every speaker on screen while they talk', () => {
    each((ep, p) => {
      const st = p.res.state;
      const teamOf = {};
      for (const id of st.order) { teamOf[st.teams[id].a] = id; teamOf[st.teams[id].b] = id; }
      for (const s of ep.screens) {
        s.steps.forEach((step, k) => {
          if (!step.by || step.part === 'pause') return;
          const where = `${s.id} ${s.seg} "${step.text.slice(0, 40)}"`;
          if (s.kind === 'iv') { expect(s.people, where).toContain(step.by); return; }
          if (s.kind === 'map') { expect(step.by, where).toBe('Don'); return; }
          if (step.by === 'Don') { expect(s.don || s.narrator || s.kind === 'flight', where).toBe(true); return; }
          const team = teamOf[step.by];
          if (!team) { expect(s.localAt?.[step.by], where).toBeTruthy(); return; }
          expect(s.teams, where).toContain(team);
          expect(s.marks[team] || s.pos?.[k]?.[team], where).toBeTruthy();
          if (s.hiddenUntil?.[team] != null) expect(s.hiddenUntil[team], where).toBeLessThanOrEqual(k);
          // in the water a Botch's watcher is in the inset; the one doing it is in the shot
          if (s.swimmers?.[team] && !s.swimmers[team].includes(step.by)) expect(s.inset?.people, where).toContain(step.by);
        });
      }
    });
  });

  it('stands nobody in water, and keeps everybody in the frame', () => {
    const onGround = (plate, [x, y]) => {
      if (plate.spots?.some(sp => Math.abs(sp[0] - x) < 8 && Math.abs(sp[1] - y) < 2)) return true;
      if (plate.mat && Math.abs(plate.mat[0] - x) < 1 && Math.abs(plate.mat[1] - y) < 1) return true;
      const g = Array.isArray(plate.g) ? plate.g : [plate.g, plate.g];
      return y >= Math.min(...g) - 0.5 && y <= Math.max(...g) + 0.5 && x >= plate.x[0] - 0.5 && x <= plate.x[1] + 0.5;
    };
    each(ep => {
      for (const s of ep.screens) {
        if (!s.marks) continue;
        for (const [team, m] of Object.entries(s.marks)) {
          const as = s.as[team];
          if (as === 'stand') {
            expect(s.plate.water, `${s.id} ${team} stands on a water plate`).toBeFalsy();
            expect(onGround(s.plate, m), `${s.id} ${s.seg} ${team} at ${m} off the ground of ${s.plate.f}`).toBe(true);
          }
        }
        for (const d of [s.donStand, ...Object.values(s.localAt || {})].filter(Boolean)) {
          expect(s.plate.water, `${s.id} Don or a local in water`).toBeFalsy();
          expect(onGround(s.plate, d), `${s.id} Don/local at ${d}`).toBe(true);
        }
        for (const pos of s.pos || []) for (const [x, y] of Object.values(pos)) {
          expect(x, s.id).toBeGreaterThanOrEqual(0); expect(x, s.id).toBeLessThanOrEqual(100);
          expect(y, s.id).toBeGreaterThanOrEqual(5); expect(y, s.id).toBeLessThanOrEqual(100);
        }
      }
    });
  });

  it('shows every team at every task it ran', () => {
    each((ep, p, i) => {
      const leg = p.res.legs[i];
      const rows = (p.res.state.taskLog || []).filter(r => r.leg === leg.n && PLACES[leg.place]?.stretches.some(s => s.id === r.stretch));
      const seen = new Set(ep.screens.filter(s => s.stretch).flatMap(s => (s.teams || []).map(t => `${t}|${s.stretch}`)));
      const missing = rows.filter(r => !seen.has(`${r.team}|${r.stretch}`)).map(r => `${r.team}@${r.stretch}`);
      expect(missing, `leg ${leg.n}`).toEqual([]);
    });
  });

  it('resolves every plate and cut-out to a file that exists', () => {
    for (const id of Object.keys(PLACES)) {
      expect(PLACE_PLATES[id], id).toBeTruthy();
      for (const f of placeFiles(id)) expect(existsSync(plateUrl(id, f)), `${id}/${slugFile(f)}`).toBe(true);
      for (const { key } of propFiles(id)) expect(existsSync(propUrl(id, key)), `${id} prop ${key}`).toBe(true);
      for (const s of PLACES[id].stretches) expect(PLACE_PLATES[id].st[s.id], `${id}/${s.id} has no plates`).toBeTruthy();
    }
    for (const k of ['gate', 'cabin', 'galley', 'sky', 'runway']) expect(existsSync(raceUrl(RACE[k].f)), k).toBe(true);
    for (const f of [RACE.map, RACE.confess, RACE.logo, ...RACE.props]) expect(existsSync(raceUrl(f)), f).toBe(true);
    // borrowed props (taxi@red-sand-desert) exist where they are borrowed from
    for (const pl of Object.values(PLACE_PLATES)) for (const s of Object.values(pl.st)) for (const a of [s.act, ...Object.values(s.sides || {}).map(x => x.act)]) {
      if (a?.prop) expect(existsSync(propUrl(Object.keys(PLACE_PLATES).find(k => PLACE_PLATES[k] === pl), a.prop)), a.prop).toBe(true);
    }
  });

  it('names no real country or city on screen', () => {
    const REAL = /\b(japan|france|paris|china|beijing|egypt|brazil|mexico|canada|toronto|new york|london|australia|iceland|russia|hawaii|italy|spain|africa|america|europe|asia|finland|peru|kenya|thailand)\b/i;
    each(ep => {
      for (const s of ep.screens) {
        const t = [s.hud?.task, s.title?.big, s.title?.sub, s.title?.pre, s.timecard, ...s.steps.map(x => x.tip ? `${x.tip.label} ${x.tip.desc}` : '')].join(' ');
        expect(REAL.test(t), `${s.id}: ${t.match(REAL)?.[0]}`).toBe(false);
      }
    });
  });
});
